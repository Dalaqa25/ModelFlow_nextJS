# Simplified Smart OAuth - Using Existing Tables

## What Changed

You were right - we don't need a separate `user_google_tokens` table! We already have `user_automations` that stores tokens per automation.

## Database Changes (SIMPLIFIED)

### 1. Add to `automations` table:
```sql
ALTER TABLE automations 
ADD COLUMN required_scopes JSONB DEFAULT '[]'::jsonb;
```

### 2. Add to `user_automations` table (EXISTING TABLE):
```sql
ALTER TABLE user_automations
ADD COLUMN granted_scopes JSONB DEFAULT '[]'::jsonb;
```

That's it! No new tables needed.

## How It Works

### Current Structure (Already Exists):
```
user_automations:
- user_id
- automation_id
- access_token
- refresh_token
- token_expiry
- is_active
```

### What We Add:
```
user_automations:
- user_id
- automation_id
- access_token
- refresh_token
- token_expiry
- is_active
- granted_scopes  ← NEW (stores what scopes user granted for THIS automation)
```

### Why This Makes Sense:
- ✅ Tokens are already per-automation
- ✅ Scopes should also be per-automation
- ✅ No duplicate data
- ✅ Simpler architecture
- ✅ Uses existing table structure

## Example Data

### automations table:
```json
{
  "id": "abc123",
  "name": "Invoice Manager",
  "workflow": {...},
  "required_scopes": ["DRIVE", "SHEETS", "GMAIL"]
}
```

### user_automations table:
```json
{
  "user_id": "user-123",
  "automation_id": "abc123",
  "access_token": "ya29...",
  "refresh_token": "1//...",
  "token_expiry": "2026-02-04T10:00:00Z",
  "granted_scopes": [
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/gmail.send"
  ],
  "is_active": true
}
```

## Flow

```
1. User clicks "Invoice Manager"
   ↓
2. Check: Does user_automations have entry for (user_id, automation_id)?
   ↓
3. NO → Show "Connect Google" → Request only Drive, Sheets, Gmail
   ↓
4. YES → Check: Does granted_scopes include all required_scopes?
   ↓
5. NO → Show "Grant additional permissions" (incremental)
   ↓
6. YES → Run automation ✅
```

## Files Updated

### Modified:
- `migrations/001_add_smart_oauth.sql` - Simplified (no new table)
- `lib/db/automation-db.js` - Uses `user_automations` instead of `user_google_tokens`
- `lib/auth/scope-checker.js` - Uses `user_automations` table
- `app/api/auth/google/callback/route.js` - Stores scopes in `user_automations`

### No Changes Needed:
- `app/api/automations/route.js` - Still detects scopes on upload
- `app/api/auth/google/route.js` - Still requests specific scopes
- `app/components/mainComponents/GoogleAuthPrompt.jsx` - Still works the same

## Deployment

### Step 1: Run Simplified Migration
```sql
-- Add to automations table
ALTER TABLE automations 
ADD COLUMN IF NOT EXISTS required_scopes JSONB DEFAULT '[]'::jsonb;

-- Add to user_automations table (existing table)
ALTER TABLE user_automations
ADD COLUMN IF NOT EXISTS granted_scopes JSONB DEFAULT '[]'::jsonb;
```

### Step 2: Migrate Existing Automations
```bash
node scripts/migrate-automation-scopes.js
```

### Step 3: Deploy & Test
Done!

## Benefits of Simplified Approach

✅ **Simpler** - No new table to manage  
✅ **Cleaner** - Uses existing structure  
✅ **Logical** - Scopes stored with tokens  
✅ **Efficient** - No joins needed  
✅ **Maintainable** - Less code to maintain  

## What If User Has Multiple Automations?

Each automation gets its own entry in `user_automations`:

```
user_automations:
1. user_id=123, automation_id=invoice, granted_scopes=[DRIVE, SHEETS, GMAIL]
2. user_id=123, automation_id=youtube, granted_scopes=[DRIVE, YOUTUBE]
3. user_id=123, automation_id=calendar, granted_scopes=[CALENDAR, GMAIL]
```

This is actually BETTER because:
- User can revoke access per automation
- Clearer audit trail
- Easier to debug
- Matches existing architecture

## Summary

**Before your feedback:**
- ❌ Created new `user_google_tokens` table
- ❌ Centralized token storage
- ❌ More complex architecture

**After your feedback:**
- ✅ Use existing `user_automations` table
- ✅ Tokens + scopes stored together
- ✅ Simpler, cleaner architecture

You were absolutely right - we don't need a separate table! 🎯
