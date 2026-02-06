# TikTok OAuth Scopes Update

## Summary
This document outlines the TikTok API scopes required for ModelGrow's automation platform. We request only the minimum necessary permissions to provide automation functionality to our users.

## TikTok API Scopes Overview

TikTok uses OAuth 2.0 for authentication and provides various scopes for different API functionalities. We request scopes based on the specific automations users want to run.

## Requested Scopes

### Core Scopes (Always Requested)
1. `user.info.basic` - Access basic user profile information
   - **Purpose:** User identification and authentication
   - **Data accessed:** Username, display name, avatar URL, profile URL
   - **Usage:** Display user information in the platform, verify account ownership

### Video Management Scopes
2. `video.upload` - Upload videos to TikTok
   - **Purpose:** Enable video publishing automations
   - **Usage:** Upload videos created or processed by user automations
   - **User control:** Only used when user runs video upload automations

3. `video.list` - Access user's video list
   - **Purpose:** Retrieve list of user's published videos
   - **Usage:** Video management automations, content tracking
   - **User control:** Only accessed when automation requires video list

4. `video.publish` - Publish videos to TikTok
   - **Purpose:** Complete the video publishing workflow
   - **Usage:** Publish videos after upload, schedule posts
   - **User control:** Only used when user runs publishing automations

### Analytics Scopes
5. `video.insights` - Access video analytics and performance metrics
   - **Purpose:** Enable analytics and reporting automations
   - **Data accessed:** Views, likes, comments, shares, engagement metrics
   - **Usage:** Generate reports, track performance, analyze trends
   - **User control:** Only accessed when user runs analytics automations

### Engagement Scopes
6. `comment.list` - Read comments on user's videos
   - **Purpose:** Enable comment management automations
   - **Usage:** Monitor comments, analyze engagement
   - **User control:** Only accessed when automation requires comment data

7. `comment.manage` - Manage comments (reply, delete)
   - **Purpose:** Enable automated comment responses
   - **Usage:** Auto-reply to comments, moderate content
   - **User control:** Only used when user runs comment management automations

## Scope Usage by Automation Type

### Video Upload Automation
**Required Scopes:**
- `user.info.basic` (authentication)
- `video.upload` (upload video)
- `video.publish` (publish video)

**Example Use Case:** User creates automation to upload videos from Google Drive to TikTok

### Analytics Dashboard Automation
**Required Scopes:**
- `user.info.basic` (authentication)
- `video.list` (get video list)
- `video.insights` (get analytics data)

**Example Use Case:** User creates automation to generate weekly performance reports in Google Sheets

### Comment Management Automation
**Required Scopes:**
- `user.info.basic` (authentication)
- `video.list` (get videos)
- `comment.list` (read comments)
- `comment.manage` (reply to comments)

**Example Use Case:** User creates automation to auto-reply to comments with specific keywords

## Implementation Guidelines

### Incremental Authorization
We implement incremental authorization to request only the scopes needed for specific automations:

1. **Initial Connection:** Request only `user.info.basic`
2. **Automation-Specific:** Request additional scopes when user activates automations that need them
3. **User Consent:** Always show clear explanation of why each scope is needed

### Scope Detection
When users upload automations, we automatically detect required TikTok scopes by analyzing:
- API calls in the automation code
- TikTok SDK methods used
- Automation configuration and features

### Scope Storage
```javascript
// Example scope configuration
const TIKTOK_SCOPES = {
  BASIC: ['user.info.basic'],
  VIDEO_UPLOAD: ['user.info.basic', 'video.upload', 'video.publish'],
  ANALYTICS: ['user.info.basic', 'video.list', 'video.insights'],
  COMMENTS: ['user.info.basic', 'video.list', 'comment.list', 'comment.manage'],
};
```

## Data Handling and Privacy

### Limited Use Commitment
- We only access TikTok data required for the specific automation
- Data is processed in real-time during automation execution
- We do not permanently store TikTok content (videos, comments, etc.)
- Users can revoke access at any time

### Data Storage
- **OAuth Tokens:** Encrypted and stored securely in database
- **User Profile:** Basic info cached for display purposes
- **Video Metadata:** Temporarily stored during automation execution
- **Analytics Data:** Not stored permanently, only processed for reports

### Security Measures
- All API calls use HTTPS/TLS encryption
- OAuth tokens encrypted at rest using AES-256
- Refresh tokens handled securely
- Rate limiting to prevent abuse
- Audit logging of all API access

## TikTok API Compliance

### Terms of Service Compliance
- We comply with TikTok's API Terms of Service
- We respect TikTok's rate limits and quotas
- We do not scrape or access data outside of official APIs
- We do not violate TikTok's Community Guidelines

### Data Usage Policy
- User data is used only for automation functionality
- No data selling or unauthorized sharing
- No use for advertising or marketing purposes
- Users maintain full control over their data

### Content Policy
- Users are responsible for content uploaded through automations
- We do not modify user content without permission
- We respect intellectual property rights
- We comply with content moderation requirements

## Testing and Validation

### Development Environment
- Use TikTok's sandbox environment for testing
- Test accounts provided for development
- Validate scope requests before production

### Scope Validation Script
```bash
# Validate TikTok scopes configuration
node validate-tiktok-scopes.js
```

Expected output:
```
✅ TikTok scope configuration valid
📋 Configured scopes:
   • Basic: user.info.basic
   • Video: video.upload, video.publish, video.list
   • Analytics: video.insights
   • Comments: comment.list, comment.manage

✅ Total: 7 scopes
```

## User Experience

### OAuth Consent Flow
When users connect their TikTok account, they will see:
1. Clear explanation of why we need TikTok access
2. List of specific permissions being requested
3. Link to Privacy Policy and Terms of Service
4. Option to cancel or approve

### Permission Management
Users can:
- View connected TikTok account in settings
- See which automations use TikTok
- Revoke access at any time
- Reconnect with different permissions

### Transparency
- Clear documentation of what each scope allows
- Automation descriptions specify required TikTok permissions
- Users notified before new scopes are requested

## Next Steps

### For Adding New Scopes:

1. **Evaluate Necessity:**
   - Determine if scope is truly needed for automation
   - Consider user privacy implications
   - Check if existing scopes can be used instead

2. **Update Configuration:**
   - Add scope to scope manager configuration
   - Update scope detection logic
   - Add scope to validation script

3. **Update Documentation:**
   - Document scope purpose and usage
   - Update Privacy Policy and Terms of Service
   - Create user-facing documentation

4. **Test Thoroughly:**
   - Test OAuth flow with new scope
   - Verify automation functionality
   - Test revocation and re-authorization

## Support and Documentation

### User Documentation
- Guide on connecting TikTok account
- Explanation of TikTok permissions
- FAQ on TikTok integration
- Troubleshooting common issues

### Developer Documentation
- TikTok API integration guide
- Scope detection implementation
- OAuth flow implementation
- Error handling best practices

## Contact Information

For questions about TikTok integration:
- **Email:** support@modelgrow.com
- **Documentation:** https://modelgrow.com/docs/tiktok
- **Privacy Policy:** https://modelgrow.com/privacy
- **Terms of Service:** https://modelgrow.com/terms

---

**Last Updated:** February 6, 2026
**Version:** 1.0.0
