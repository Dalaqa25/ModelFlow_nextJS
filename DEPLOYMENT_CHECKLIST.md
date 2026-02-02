# Smart OAuth Deployment Checklist

## Pre-Deployment

### ✅ Code Review
- [ ] Review all modified files
- [ ] Check for any hardcoded values
- [ ] Verify environment variables are set
- [ ] Test locally with development database

### ✅ Database Preparation
- [ ] Backup production database
- [ ] Review migration SQL
- [ ] Test migration on staging database
- [ ] Verify no data loss

## Deployment Steps

### Step 1: Database Migration
- [ ] Open Supabase Dashboard
- [ ] Navigate to SQL Editor
- [ ] Copy contents of `migrations/001_add_smart_oauth.sql`
- [ ] Paste and run migration
- [ ] Verify tables created:
  ```sql
  SELECT column_name, data_type 
  FROM information_schema.columns 
  WHERE table_name = 'automations' AND column_name = 'required_scopes';
  
  SELECT table_name 
  FROM information_schema.tables 
  WHERE table_name = 'user_google_tokens';
  ```
- [ ] Check for errors in Supabase logs

### Step 2: Migrate Existing Automations
- [ ] Set environment variables:
  ```bash
  export NEXT_PUBLIC_SUPABASE_URL="your-url"
  export SUPABASE_SERVICE_ROLE_KEY="your-key"
  ```
- [ ] Run migration script:
  ```bash
  node scripts/migrate-automation-scopes.js
  ```
- [ ] Review output for errors
- [ ] Verify automations have scopes:
  ```sql
  SELECT name, required_scopes 
  FROM automations 
  WHERE required_scopes IS NOT NULL 
  LIMIT 10;
  ```
- [ ] Check Invoice Manager specifically:
  ```sql
  SELECT name, required_scopes 
  FROM automations 
  WHERE name ILIKE '%invoice%';
  ```

### Step 3: Deploy Code
- [ ] Commit all changes:
  ```bash
  git add .
  git commit -m "Implement Smart OAuth Flow - Dynamic scope detection"
  git push origin main
  ```
- [ ] Deploy to production (Vercel/Netlify/etc.)
- [ ] Wait for deployment to complete
- [ ] Check deployment logs for errors

### Step 4: Smoke Testing
- [ ] Create a new test user account
- [ ] Navigate to Invoice Manager automation
- [ ] Click "Run" or "Connect Google"
- [ ] Verify OAuth popup shows ONLY:
  - ✓ Google Drive
  - ✓ Google Sheets
  - ✓ Gmail
  - ❌ NOT: YouTube, Photos, Analytics, Ads, etc.
- [ ] Authorize and verify automation runs
- [ ] Check database for granted scopes:
  ```sql
  SELECT user_email, granted_scopes 
  FROM user_google_tokens 
  WHERE user_email = 'test@example.com';
  ```

### Step 5: Test Incremental Authorization
- [ ] With same test user, try a different automation (e.g., YouTube)
- [ ] Verify incremental auth prompt shows
- [ ] Verify only NEW scopes are requested
- [ ] Authorize and verify automation runs
- [ ] Check scopes were merged (not replaced)

### Step 6: Test Existing Users
- [ ] Login as existing user with Google already connected
- [ ] Try to run an automation
- [ ] Verify no re-authorization needed (if they have scopes)
- [ ] Verify automation runs successfully

## Post-Deployment

### ✅ Monitoring (First 24 Hours)
- [ ] Monitor error logs for OAuth failures
- [ ] Check authorization success rate
- [ ] Monitor support tickets for permission issues
- [ ] Track user feedback

### ✅ Metrics to Track
- [ ] Authorization success rate (target: +40%)
- [ ] Average scopes per authorization (target: 7 vs 24)
- [ ] User drop-off at OAuth screen (target: -50%)
- [ ] Support tickets about permissions (target: -60%)

### ✅ Documentation Updates
- [ ] Update user documentation
- [ ] Update developer documentation
- [ ] Add to changelog
- [ ] Notify team of changes

## Rollback Plan

If issues occur:

### Option 1: Quick Fix
- [ ] Revert code changes
- [ ] Redeploy previous version
- [ ] Database changes are backward compatible (no rollback needed)

### Option 2: Fallback Mode
- [ ] Modify OAuth route to request all scopes (old behavior)
- [ ] Keep database changes for future retry
- [ ] Investigate and fix issues
- [ ] Redeploy smart flow when ready

## Success Criteria

✅ **Must Have:**
- [ ] No errors in deployment
- [ ] Database migration successful
- [ ] All automations have required_scopes
- [ ] New users see only relevant scopes
- [ ] Existing users can still run automations

✅ **Nice to Have:**
- [ ] Authorization success rate increases
- [ ] User feedback is positive
- [ ] Support tickets decrease
- [ ] No performance degradation

## Common Issues & Solutions

### Issue: Migration script fails
**Solution:**
```bash
# Check environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY

# Check database connection
node -e "console.log(require('@supabase/supabase-js'))"

# Run with verbose logging
NODE_ENV=development node scripts/migrate-automation-scopes.js
```

### Issue: User sees all 24 scopes
**Solution:**
```sql
-- Check automation has scopes
SELECT name, required_scopes FROM automations WHERE id = 'automation-id';

-- If empty, manually set
UPDATE automations 
SET required_scopes = '["DRIVE", "SHEETS", "GMAIL"]'::jsonb 
WHERE id = 'automation-id';
```

### Issue: "Missing permissions" error
**Solution:**
```sql
-- Check user's granted scopes
SELECT user_email, granted_scopes 
FROM user_google_tokens 
WHERE user_email = 'user@example.com';

-- If missing, user needs to re-authorize
-- Send them to: /api/auth/google?automation_id=xxx
```

## Team Communication

### Before Deployment
- [ ] Notify team of deployment window
- [ ] Share this checklist
- [ ] Assign roles (who runs migration, who tests, etc.)

### During Deployment
- [ ] Keep team updated in Slack/Discord
- [ ] Share progress through checklist
- [ ] Report any issues immediately

### After Deployment
- [ ] Announce completion
- [ ] Share test results
- [ ] Document any issues encountered
- [ ] Celebrate success! 🎉

## Emergency Contacts

- **Database Issues:** [Your DB Admin]
- **OAuth Issues:** [Your Backend Lead]
- **User Issues:** [Your Support Lead]
- **Deployment Issues:** [Your DevOps Lead]

---

**Deployment Date:** _____________  
**Deployed By:** _____________  
**Status:** ⏳ Pending / ✅ Complete / ❌ Rolled Back  
**Notes:** _____________
