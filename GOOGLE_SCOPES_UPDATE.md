# Google OAuth Scopes Update

## Summary
Updated the codebase to **only request the 7 scopes** that are approved in your Google Cloud Console. This prevents OAuth errors and ensures compliance with Google's requirements.

## Approved Scopes (from Google Cloud Console)

### Non-Sensitive Scopes (5)
1. `openid` - Verify identity
2. `https://www.googleapis.com/auth/userinfo.email` - See email address
3. `https://www.googleapis.com/auth/userinfo.profile` - See profile info
4. `https://www.googleapis.com/auth/drive.file` - Access only files created by this app
5. `https://www.googleapis.com/auth/gmail.addons.current.action.compose` - Compose emails in add-on

### Sensitive Scopes (2) - Require Verification
6. `https://www.googleapis.com/auth/spreadsheets` - Read/write Google Sheets
7. `https://www.googleapis.com/auth/gmail.send` - Send emails

## Files Updated

### 1. `lib/auth/scope-manager.js`
**Before:** Had 21+ scopes including Calendar, Docs, YouTube, etc.
**After:** Only includes the 7 approved scopes

**Changes:**
- Removed unapproved scopes: `drive` (full access), `documents`, `calendar`, `youtube`, `presentations`, `forms`, `tasks`, `contacts`, `photos`, `analytics`, `ads`
- Removed unapproved Gmail scopes: `gmail.compose`, `gmail.readonly`
- Kept only: `drive.file`, `spreadsheets`, `gmail.send`, `gmail.addons.current.action.compose`

### 2. `validate-scopes.js`
**Before:** Expected 21 scopes
**After:** Expects 7 scopes matching Google Cloud Console

**Purpose:** Run `node validate-scopes.js` to verify scopes match Google Cloud Console

### 3. `app/components/automationUpload/detectScopes.js`
**Before:** Detected scopes for Calendar, Docs, YouTube, etc.
**After:** Only detects approved scopes

**Changes:**
- Removed node mappings for unapproved services
- Gmail nodes now only map to `gmail.send`
- Drive nodes now only map to `drive.file` (per-file access)

### 4. `app/api/auth/google/route.js`
**Before:** Comment said "safe defaults"
**After:** Comment says "approved defaults"

**No functional change** - already using `getScopesForServices(['DRIVE', 'SHEETS', 'GMAIL'])` which now returns only approved scopes

## What This Means

### ✅ Will Work
- Google Drive file operations (create, read, update files created by your app)
- Google Sheets operations (read, write, create spreadsheets)
- Gmail send operations (send emails on behalf of user)
- Gmail compose in add-on context

### ❌ Will NOT Work (until you add these scopes to Google Cloud Console)
- Full Google Drive access (reading all user files)
- Google Docs operations
- Google Calendar operations
- YouTube operations
- Gmail read operations (reading user's emails)
- Google Slides, Forms, Tasks, Contacts, Photos, Analytics

## Testing

Run the validation script:
```bash
node validate-scopes.js
```

Expected output:
```
✅ SUCCESS! All scopes match Google Cloud Console configuration.
📋 Approved scopes by service:
   • Basic (openid, email, profile): 3 scopes
   • Drive (per-file access): 1 scope
   • Sheets: 1 scope
   • Gmail: 2 scopes

✅ Total: 7 scopes
```

## Next Steps

### If you need additional scopes:

1. **Add to Google Cloud Console first:**
   - Go to Google Cloud Console → APIs & Services → OAuth consent screen
   - Click "Edit App"
   - Go to "Scopes" section
   - Click "Add or Remove Scopes"
   - Select the scopes you need
   - Save

2. **Then update the code:**
   - Add the scope to `PLATFORM_SCOPES` in `lib/auth/scope-manager.js`
   - Add scope details to `SCOPE_DETAILS` in `app/components/automationUpload/detectScopes.js`
   - Update `EXPECTED_SCOPES` in `validate-scopes.js`
   - Run `node validate-scopes.js` to verify

### Important Notes:

- **Sensitive scopes** (like `spreadsheets`, `gmail.send`) require Google verification if your app is public
- **Restricted scopes** (like full `drive` access) require additional security review
- Always add scopes to Google Cloud Console **before** adding them to your code
- Test OAuth flow after any scope changes

## Verification Checklist

- [x] Updated `lib/auth/scope-manager.js` to only include approved scopes
- [x] Updated `validate-scopes.js` to match Google Cloud Console
- [x] Updated `detectScopes.js` to only detect approved scopes
- [x] Ran validation script - all scopes match ✅
- [ ] Test OAuth flow in development
- [ ] Test automation upload with Google Sheets
- [ ] Test automation upload with Gmail
- [ ] Test automation upload with Drive files

## OAuth Flow Behavior

When users connect their Google account, they will now see:
- "See your email address"
- "See your personal info"
- "See, edit, create, and delete only the specific Google Drive files you use with this app"
- "See, edit, create, and delete all your Google Sheets spreadsheets"
- "Send email on your behalf"
- "Manage drafts and send emails when you interact with the add-on"

This is much cleaner and less scary than requesting full Drive access or Calendar access!
