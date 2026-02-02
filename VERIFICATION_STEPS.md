# Smart OAuth Verification Steps

## ✅ Step 1: Verify Database Schema

Run these queries in Supabase SQL Editor:

### Check automations table has required_scopes:
```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'automations' 
AND column_name = 'required_scopes';
```
**Expected:** Should return 1 row showing `required_scopes` column exists

### Check user_automations table has granted_scopes:
```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'user_automations' 
AND column_name = 'granted_scopes';
```
**Expected:** Should return 1 row showing `granted_scopes` column exists

### Check if automations have scopes detected:
```sql
SELECT name, required_scopes 
FROM automations 
WHERE required_scopes IS NOT NULL 
AND jsonb_array_length(required_scopes) > 0
LIMIT 10;
```
**Expected:** Should show automations with their required scopes like `["DRIVE", "SHEETS", "GMAIL"]`

### Check Invoice Manager specifically:
```sql
SELECT id, name, required_scopes 
FROM automations 
WHERE name ILIKE '%invoice%';
```
**Expected:** Should show `["DRIVE", "SHEETS", "GMAIL"]` or similar

---

## ✅ Step 2: Test OAuth Flow (Manual Test)

### Test 1: New User + Invoice Manager

1. **Create a new test user account** (or use incognito mode)
2. **Navigate to Invoice Manager automation**
3. **Click "Run" or "Connect Google"**
4. **Verify OAuth popup shows ONLY:**
   - ✅ Google Drive
   - ✅ Google Sheets
   - ✅ Gmail
   - ❌ NOT: YouTube, Photos, Analytics, Ads, Calendar, etc.

5. **Authorize and check database:**
```sql
SELECT user_id, automation_id, granted_scopes 
FROM user_automations 
WHERE user_id = 'your-test-user-id';
```
**Expected:** Should show granted_scopes with Drive, Sheets, Gmail URLs

---

## ✅ Step 3: Test Incremental Authorization

### Test 2: Same User + Different Automation

1. **With same test user, try a YouTube automation** (if you have one)
2. **Should show:** "This automation needs YouTube access"
3. **Click "Grant YouTube Access"**
4. **Verify OAuth shows ONLY YouTube permission** (incremental)
5. **Check database:**
```sql
SELECT automation_id, granted_scopes 
FROM user_automations 
WHERE user_id = 'your-test-user-id';
```
**Expected:** Should show 2 rows - one for Invoice Manager, one for YouTube automation

---

## ✅ Step 4: Test Existing User (No Re-Auth)

### Test 3: User Already Has Scopes

1. **With user who already authorized Invoice Manager**
2. **Try to run Invoice Manager again**
3. **Should NOT show OAuth prompt** - should run immediately
4. **Verify automation executes successfully**

---

## 🐛 Troubleshooting

### Issue: Still seeing all 24 scopes

**Check 1:** Automation has required_scopes?
```sql
SELECT name, required_scopes 
FROM automations 
WHERE id = 'your-automation-id';
```
If empty, run:
```bash
node scripts/migrate-automation-scopes.js
```

**Check 2:** OAuth route is using automation_id?
- URL should be: `/api/auth/google?automation_id=abc123`
- NOT: `/api/auth/google` (without automation_id)

---

### Issue: "Missing permissions" after authorization

**Check:** User has granted_scopes in database?
```sql
SELECT user_id, automation_id, granted_scopes 
FROM user_automations 
WHERE user_id = 'user-id' AND automation_id = 'automation-id';
```

If empty or NULL:
- User needs to re-authorize
- Check OAuth callback is storing scopes correctly
- Check browser console for errors

---

### Issue: OAuth callback error

**Check server logs for:**
- Token exchange errors
- Database insert errors
- Scope parsing errors

**Common fixes:**
- Verify GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set
- Verify GOOGLE_REDIRECT_URI matches Google Cloud Console
- Check Supabase permissions

---

## ✅ Step 5: Production Readiness

### Before deploying to production:

- [ ] All database migrations successful
- [ ] Test user can authorize Invoice Manager (only 3 scopes)
- [ ] Test user can run automation successfully
- [ ] Incremental authorization works (if applicable)
- [ ] Existing users can still run automations
- [ ] No errors in server logs
- [ ] OAuth popup closes correctly after authorization
- [ ] Granted scopes are stored in database

### Monitor after deployment:

- [ ] Authorization success rate (should increase)
- [ ] User feedback (should be positive)
- [ ] Support tickets (should decrease)
- [ ] Error logs (should be minimal)

---

## 📊 Success Metrics

Track these in your analytics:

```sql
-- Authorization success rate
SELECT 
  COUNT(*) as total_attempts,
  COUNT(CASE WHEN granted_scopes IS NOT NULL THEN 1 END) as successful,
  ROUND(COUNT(CASE WHEN granted_scopes IS NOT NULL THEN 1 END)::numeric / COUNT(*)::numeric * 100, 2) as success_rate
FROM user_automations
WHERE created_at > NOW() - INTERVAL '7 days';

-- Average scopes per authorization
SELECT 
  AVG(jsonb_array_length(granted_scopes)) as avg_scopes_per_auth
FROM user_automations
WHERE granted_scopes IS NOT NULL;

-- Most popular automations
SELECT 
  a.name,
  COUNT(ua.id) as user_count,
  a.required_scopes
FROM automations a
JOIN user_automations ua ON ua.automation_id = a.id
GROUP BY a.id, a.name, a.required_scopes
ORDER BY user_count DESC
LIMIT 10;
```

---

## 🎯 Expected Results

**Before Smart OAuth:**
- Users see: 24 permissions 😱
- Authorization rate: ~40%
- User feedback: "Why does it need my photos?"

**After Smart OAuth:**
- Users see: 3-5 permissions ✅
- Authorization rate: ~80% (+40%)
- User feedback: "That makes sense!"

---

## 🚀 Next Steps

Once verified:

1. **Deploy to production**
2. **Monitor metrics for 24-48 hours**
3. **Collect user feedback**
4. **Optimize based on data**
5. **Document learnings**

---

## 📞 Need Help?

If you encounter issues:

1. Check this verification guide
2. Review server logs
3. Check database data
4. Test with fresh user account
5. Review OAuth flow in browser DevTools

**Common issues are usually:**
- Environment variables not set
- Database permissions
- OAuth redirect URI mismatch
- Automation missing required_scopes
