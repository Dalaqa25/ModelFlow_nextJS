# Smart OAuth Flow - Setup Guide

## Overview

The Smart OAuth Flow ensures users only grant Google permissions that their chosen automations actually need. Instead of requesting all 24 scopes upfront, we dynamically request only the required scopes per automation.

## Quick Start

### 1. Run Database Migration

```bash
# Option A: Run SQL directly in Supabase Dashboard
# Copy and paste the contents of migrations/001_add_smart_oauth.sql

# Option B: Use Supabase CLI (if installed)
supabase db push migrations/001_add_smart_oauth.sql
```

### 2. Migrate Existing Automations

```bash
# Detect and store required scopes for existing automations
node scripts/migrate-automation-scopes.js
```

### 3. Test the Flow

1. **Create a test automation** (or use existing Invoice Manager)
2. **Check required scopes** in database:
   ```sql
   SELECT name, required_scopes FROM automations WHERE name = 'Invoice Manager';
   -- Should show: ["DRIVE", "SHEETS", "GMAIL"]
   ```
3. **Try to run the automation** as a new user
4. **Verify OAuth prompt** shows only Drive, Sheets, Gmail (not all 24 scopes)

## How It Works

### 1. Automation Upload
When a developer uploads an automation:
```javascript
// app/api/automations/route.js
const requiredScopes = getRequiredServices(workflow);
// Detects: ["DRIVE", "SHEETS", "GMAIL"]

await supabase.from('automations').insert({
  name: "Invoice Manager",
  workflow: workflowJson,
  required_scopes: requiredScopes  // ← Stored in database
});
```

### 2. User Connects Google
When user clicks "Connect Google" for an automation:
```javascript
// OAuth URL: /api/auth/google?automation_id=abc123

// app/api/auth/google/route.js
const automation = await automationDB.getAutomationWithScopes(automationId);
const scopes = getScopesForServices(automation.required_scopes);
// Only requests: Drive, Sheets, Gmail scopes
```

### 3. Scopes Stored
After user authorizes:
```javascript
// app/api/auth/google/callback/route.js
await googleTokenDB.upsertTokens({
  user_email: user.email,
  granted_scopes: [
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/gmail.send"
  ]
});
```

### 4. Pre-Execution Check
Before running automation:
```javascript
// lib/auth/scope-checker.js
const check = await checkAutomationScopes(userEmail, automationId);

if (!check.hasAllScopes) {
  // Show GoogleAuthPrompt component
  // User grants missing scopes (incremental authorization)
}
```

## User Flows

### Flow 1: First-Time User

```
User clicks "Invoice Manager" automation
  ↓
System checks: User has no Google connection
  ↓
Shows: "This automation needs: Drive, Sheets, Gmail"
  ↓
User clicks "Connect Google Account"
  ↓
Google shows ONLY Drive, Sheets, Gmail permissions
  ↓
User authorizes
  ↓
Automation runs ✅
```

### Flow 2: Incremental Authorization

```
User already has Drive, Sheets, Gmail
  ↓
User tries "YouTube Uploader" automation
  ↓
System checks: User missing YouTube scope
  ↓
Shows: "This automation needs YouTube access"
  ↓
User clicks "Grant YouTube Access"
  ↓
Google shows ONLY YouTube permission (incremental)
  ↓
User authorizes
  ↓
Automation runs ✅
```

### Flow 3: User Has All Scopes

```
User already has Drive, Sheets, Gmail, YouTube
  ↓
User tries any automation using those services
  ↓
System checks: User has all required scopes
  ↓
Automation runs immediately ✅ (no prompt)
```

## Database Schema

### automations table
```sql
CREATE TABLE automations (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  workflow JSONB NOT NULL,
  required_scopes JSONB DEFAULT '[]'::jsonb,  -- NEW
  -- ... other columns
);

-- Example data:
-- required_scopes: ["DRIVE", "SHEETS", "GMAIL"]
```

### user_google_tokens table
```sql
CREATE TABLE user_google_tokens (
  id UUID PRIMARY KEY,
  user_email TEXT NOT NULL UNIQUE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expiry TIMESTAMPTZ,
  granted_scopes JSONB DEFAULT '[]'::jsonb,  -- NEW
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Example data:
-- granted_scopes: [
--   "https://www.googleapis.com/auth/drive",
--   "https://www.googleapis.com/auth/spreadsheets",
--   "https://www.googleapis.com/auth/gmail.send"
-- ]
```

## API Endpoints

### GET /api/auth/google
**Purpose:** Initiate OAuth flow with specific scopes

**Parameters:**
- `automation_id` (optional): Automation ID to get required scopes
- `services` (optional): Comma-separated services (e.g., "DRIVE,SHEETS")

**Examples:**
```bash
# For specific automation
/api/auth/google?automation_id=abc123

# For specific services
/api/auth/google?services=DRIVE,SHEETS,GMAIL

# Fallback (safe defaults)
/api/auth/google
```

### GET /api/auth/google/callback
**Purpose:** Handle OAuth callback and store tokens

**What it does:**
1. Exchanges code for tokens
2. Extracts granted scopes from token response
3. Stores/merges scopes in user_google_tokens table
4. Closes popup and notifies parent window

## Components

### GoogleAuthPrompt
**Location:** `app/components/mainComponents/GoogleAuthPrompt.jsx`

**Usage:**
```jsx
import GoogleAuthPrompt from '@/app/components/mainComponents/GoogleAuthPrompt';

<GoogleAuthPrompt
  automationName="Invoice Manager"
  requiredServices={["DRIVE", "SHEETS", "GMAIL"]}
  missingServices={["GMAIL"]}  // If incremental
  authUrl="/api/auth/google?automation_id=abc123"
  onAuthorized={() => {
    // Refresh and run automation
  }}
  onCancel={() => {
    // Close prompt
  }}
/>
```

**Features:**
- Shows required services with icons
- Explains what each service is used for
- Opens OAuth in popup window
- Handles success/failure
- Links to /google-permissions for more info

## Utilities

### checkAutomationScopes()
**Location:** `lib/auth/scope-checker.js`

**Purpose:** Check if user has required scopes before execution

**Usage:**
```javascript
import { checkAutomationScopes } from '@/lib/auth/scope-checker';

const check = await checkAutomationScopes(userEmail, automationId);

if (!check.hasAllScopes) {
  return {
    error: 'Missing permissions',
    missing_services: check.missingServices,
    auth_url: check.authUrl
  };
}

// Proceed with execution
```

### getRequiredServices()
**Location:** `lib/auth/automation-scope-detector.js`

**Purpose:** Detect required Google services from n8n workflow JSON

**Usage:**
```javascript
import { getRequiredServices } from '@/lib/auth/automation-scope-detector';

const services = getRequiredServices(workflowJson);
// Returns: ["DRIVE", "SHEETS", "GMAIL"]
```

## Testing Checklist

- [ ] New user connects for Invoice Manager (sees only Drive, Sheets, Gmail)
- [ ] User with Drive/Sheets tries YouTube automation (incremental auth)
- [ ] User with all scopes tries any automation (no prompt)
- [ ] Scope detection works for all Google node types
- [ ] Error handling when user denies permission
- [ ] Token refresh works correctly
- [ ] Multiple automations with overlapping scopes
- [ ] Migration script runs successfully
- [ ] Existing automations get correct scopes

## Troubleshooting

### Issue: User sees all 24 scopes instead of specific ones
**Solution:** Check that automation has `required_scopes` in database:
```sql
SELECT name, required_scopes FROM automations WHERE id = 'your-automation-id';
```
If empty, run migration script or manually detect scopes.

### Issue: "Missing permissions" error even after authorization
**Solution:** Check user_google_tokens table:
```sql
SELECT user_email, granted_scopes FROM user_google_tokens WHERE user_email = 'user@example.com';
```
Verify granted_scopes includes required scope URLs.

### Issue: Scope detection returns empty array
**Solution:** Check workflow JSON has Google nodes:
```javascript
const { detectGoogleScopes } = require('./lib/auth/automation-scope-detector');
const result = detectGoogleScopes(workflowJson);
console.log(result);
```

## Benefits

✅ **Better UX** - Users only see relevant permissions  
✅ **Builds Trust** - Transparent about what each automation needs  
✅ **Compliant** - Follows Google's "least privilege" principle  
✅ **Flexible** - Can add new services without re-verification  
✅ **Scalable** - Works for any number of automations  

## Next Steps

1. Run database migration
2. Run scope detection script for existing automations
3. Test with Invoice Manager automation
4. Update UI to show required services on automation cards
5. Add scope checking to automation execution API
6. Monitor and optimize

## Support

If you encounter issues:
1. Check database schema is correct
2. Verify environment variables are set
3. Check browser console for errors
4. Review server logs for OAuth errors
5. Test with a fresh user account

---

**Last Updated:** February 3, 2026  
**Version:** 1.0.0
