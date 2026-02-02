# Smart OAuth Flow Implementation Plan

## Overview
Implement dynamic scope detection and incremental authorization so users only grant permissions their chosen automations actually need.

## Database Schema Changes

### 1. Add to `automations` table:
```sql
ALTER TABLE automations 
ADD COLUMN required_scopes JSONB DEFAULT '[]'::jsonb;

-- Example data:
-- required_scopes: ["DRIVE", "SHEETS", "GMAIL"]
```

### 2. Add to `user_google_tokens` table (or create if doesn't exist):
```sql
CREATE TABLE IF NOT EXISTS user_google_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expiry TIMESTAMPTZ,
  granted_scopes JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_email)
);

-- Example data:
-- granted_scopes: ["https://www.googleapis.com/auth/drive", "https://www.googleapis.com/auth/spreadsheets"]
```

## Implementation Steps

### Step 1: Detect and Store Scopes on Upload
When automation is uploaded, detect required services and store them.

**File: `app/api/automations/route.js`**
- Import `getRequiredServices` from automation-scope-detector
- After workflow is uploaded, detect services
- Store in `required_scopes` column

### Step 2: Update OAuth Route
**File: `app/api/auth/google/route.js`**
- Accept `automation_id` parameter
- Fetch automation's `required_scopes` from database
- Request only those scopes (+ BASIC)
- Pass automation_id through state

### Step 3: Update OAuth Callback
**File: `app/api/auth/google/callback/route.js`**
- Store granted scopes in user_google_tokens table
- Merge with existing scopes (don't overwrite)

### Step 4: Pre-Execution Scope Check
**File: `app/api/automations/execute/route.js`**
- Before executing, check if user has required scopes
- If missing, return error with authorization URL
- Frontend shows "Connect Google" button

### Step 5: UI Components
**New file: `app/components/mainComponents/GoogleAuthPrompt.jsx`**
- Shows which services automation needs
- "Connect Google Account" button
- Links to /api/auth/google?automation_id=XXX

### Step 6: Update Automation Card
**File: `app/components/mainComponents/AutomationCard.jsx`**
- Show required services badge
- Check if user has required scopes
- Show "Connect Google" if missing

## User Flow

### First Time User:
1. User clicks on "Invoice Manager" automation
2. Sees: "This automation needs: Google Drive, Sheets, Gmail"
3. Clicks "Connect Google Account"
4. Google shows ONLY Drive, Sheets, Gmail permissions
5. User authorizes
6. Automation runs

### User Tries Different Automation:
1. User already connected Drive, Sheets, Gmail
2. Tries "YouTube Uploader" automation (needs YouTube)
3. Sees: "This automation needs YouTube access"
4. Clicks "Grant YouTube Access"
5. Google shows ONLY YouTube permission (incremental)
6. User authorizes
7. Automation runs

### User with All Scopes:
1. User has already granted Drive, Sheets, Gmail, YouTube
2. Tries any automation using those services
3. No authorization prompt - runs immediately

## Benefits

1. **Better UX**: Users only see relevant permissions
2. **Builds Trust**: Transparent about what each automation needs
3. **Compliant**: Follows Google's "least privilege" principle
4. **Flexible**: Can add new services without re-verification
5. **Scalable**: Works for any number of automations

## Fallback Strategy

If scope detection fails or automation is complex:
- Fall back to requesting "safe default" package: DRIVE + SHEETS + GMAIL
- Log warning for manual review
- Still better than requesting ALL scopes

## Migration Plan

1. Add database columns
2. Run migration script to detect scopes for existing automations
3. Deploy new OAuth flow
4. Existing users keep their current scopes (no disruption)
5. New users get smart flow immediately

## Testing Checklist

- [ ] New user connects for first time with Invoice Manager
- [ ] User with Drive/Sheets tries YouTube automation (incremental)
- [ ] User with all scopes tries any automation (no prompt)
- [ ] Scope detection works for all Google node types
- [ ] Error handling when user denies permission
- [ ] Token refresh works correctly
- [ ] Multiple automations with overlapping scopes
