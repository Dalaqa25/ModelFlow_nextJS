# TikTok API Verification - Scope Justifications

## Application Overview
**App Name:** ModelGrow
**App Type:** Automation Platform
**Purpose:** Allows users to create, run, and manage workflow automations that integrate with TikTok and other services

---

## TikTok API Scopes Justification

### 1. user.info.basic

**Why we need this scope:**
This is the foundational scope required for TikTok OAuth authentication. We need basic user information to identify users, display their profile in our platform, and verify account ownership.

**How we use it:**
- Authenticate users when they connect their TikTok account
- Display user's TikTok username and avatar in our platform
- Verify that the connected account belongs to the user
- Link TikTok account to user's ModelGrow account

**User benefit:**
Enables seamless integration between ModelGrow and TikTok, allowing users to see which TikTok account is connected and manage their automations.

**Data handling:**
- We store only basic profile information (username, display name, avatar URL)
- Data is cached for display purposes only
- Users can disconnect their account at any time
- We do not share this information with third parties

---

### 2. video.upload

**Why we need this scope:**
ModelGrow enables users to create automations that upload videos to TikTok. This is a core feature for content creators who want to automate their video publishing workflow.

**How we use it:**
- Users create automations that upload videos from various sources (Google Drive, local files, generated content)
- The automation uploads the video file to TikTok when triggered by the user
- Videos are uploaded only when the user explicitly runs the automation
- Users configure video details (caption, hashtags, privacy settings) in the automation

**User benefit:**
Automates the video upload process, saving time for content creators who publish regularly. Enables batch uploading, scheduled posting, and integration with content creation workflows.

**Data handling:**
- We do not store user's video files permanently
- Videos are processed in real-time during automation execution
- Video files are transmitted securely using HTTPS/TLS
- We do not modify video content without user permission
- Users maintain full ownership of their content

---

### 3. video.publish

**Why we need this scope:**
After uploading a video, this scope is required to complete the publishing process and make the video live on TikTok. This works in conjunction with video.upload to provide complete video publishing automation.

**How we use it:**
- Publish videos after they are uploaded
- Set video visibility (public, private, friends only)
- Schedule video publication for future dates/times
- Apply user-configured settings (comments enabled, duet/stitch settings)

**User benefit:**
Completes the video publishing workflow, allowing users to fully automate their TikTok content strategy including scheduling and visibility settings.

**Data handling:**
- Publishing actions are performed only when user's automation runs
- We respect user's privacy and visibility preferences
- No modification of video content or metadata without user configuration
- All actions are logged and visible to the user

---

### 4. video.list

**Why we need this scope:**
Users need to access their video list for content management automations, analytics tracking, and video organization workflows.

**How we use it:**
- Retrieve list of user's published videos for management automations
- Enable video selection for analytics or editing workflows
- Track video publication history for reporting
- Support content organization and archiving automations

**User benefit:**
Enables automations that manage existing content, track publication history, and organize video libraries. Useful for content audits and performance tracking.

**Data handling:**
- We retrieve only video metadata (title, ID, publication date, URL)
- Video content itself is not downloaded or stored
- Data is processed in real-time during automation execution
- Users can limit which videos are accessed by automation configuration

---

### 5. video.insights

**Why we need this scope:**
Analytics and performance tracking are essential for content creators. This scope enables automations that generate reports, track trends, and analyze video performance.

**How we use it:**
- Retrieve video performance metrics (views, likes, comments, shares)
- Generate automated performance reports in Google Sheets or other formats
- Track engagement trends over time
- Compare performance across multiple videos
- Create dashboards and visualizations

**User benefit:**
Automates analytics reporting, saving hours of manual data collection. Enables data-driven content strategy by providing insights into what content performs best.

**Data handling:**
- We retrieve only aggregated metrics, not individual viewer data
- Analytics data is processed for reports and not stored permanently
- Users control which videos are analyzed
- Data is used only for user's own reporting purposes
- We do not sell or share analytics data with third parties

---

### 6. comment.list

**Why we need this scope:**
Community engagement is crucial for TikTok creators. This scope enables automations that monitor comments, analyze engagement, and track audience feedback.

**How we use it:**
- Retrieve comments on user's videos for engagement tracking
- Monitor for specific keywords or questions
- Analyze sentiment and engagement patterns
- Generate engagement reports
- Support comment moderation workflows

**User benefit:**
Helps creators stay on top of community engagement, identify important comments, and understand audience feedback without manually checking every video.

**Data handling:**
- We retrieve only comments on user's own videos
- Comment data is processed in real-time for analysis
- We do not store comments permanently
- Personal information in comments is not extracted or stored
- Data is used only for user's own engagement management

---

### 7. comment.manage

**Why we need this scope:**
Automated comment management helps creators engage with their audience efficiently. This scope enables automations that reply to comments, moderate content, and maintain community standards.

**How we use it:**
- Auto-reply to comments based on user-defined rules
- Reply to frequently asked questions automatically
- Moderate comments based on user's moderation settings
- Pin important comments
- Delete spam or inappropriate comments (based on user's rules)

**User benefit:**
Saves time on community management, ensures timely responses to audience, and helps maintain a positive community environment through automated moderation.

**Data handling:**
- Comment actions are performed only based on user's automation rules
- We do not modify or delete comments without user configuration
- All comment management actions are logged
- Users maintain full control over moderation rules
- We do not use comment data for any purpose other than user's automation

---

## Video Demonstration

**YouTube Demo:** [To be added]

**What the video shows:**
- User creating a TikTok video upload automation
- Connecting TikTok account with OAuth consent
- Automation uploading a video to TikTok
- Analytics automation generating performance report
- Comment management automation replying to comments
- User managing and controlling their TikTok automations

---

## Application Architecture

### Platform Type
Web-based automation platform built with Next.js

### User Flow
1. User signs up and creates a ModelGrow account
2. User browses TikTok automations or creates custom workflows
3. User connects their TikTok account via OAuth 2.0
4. User configures automation parameters (video settings, analytics preferences, etc.)
5. User explicitly runs or schedules the automation
6. Automation executes only the user-approved actions
7. User can view results, logs, and disable automations at any time

### Technical Implementation

**OAuth Implementation:**
- Standard OAuth 2.0 authorization code flow
- Refresh tokens stored securely for long-term access
- Incremental authorization (request only needed scopes)
- Token expiration and refresh handled automatically
- Secure redirect URIs configured in TikTok Developer Portal

**API Usage:**
- TikTok Content Posting API for video upload and publishing
- TikTok Research API for analytics and insights
- TikTok Login Kit for authentication
- Rate limiting and quota management implemented
- Exponential backoff for retries

**Security Measures:**
- All API credentials encrypted at rest using AES-256
- OAuth tokens stored securely with encryption
- HTTPS/TLS for all data transmission
- Access tokens refreshed automatically and securely
- Users can revoke access at any time

---

## Security & Privacy Measures

### Data Protection
- All API credentials are encrypted at rest using AES-256 encryption
- OAuth tokens are stored securely in our database with encryption
- We use HTTPS/TLS for all data transmission
- Access tokens are refreshed automatically and securely
- Users can revoke access at any time through TikTok settings or ModelGrow

### User Control
- Users explicitly approve each automation before it runs
- Users can enable/disable automations at any time
- Users can disconnect their TikTok account at any time
- All automation actions are logged and visible to users
- Users control which videos and data each automation can access

### Data Retention
- We do not permanently store user's TikTok content (videos, comments)
- Data is processed in real-time during automation execution
- OAuth tokens are deleted when users disconnect their account
- Automation logs are retained for 90 days for debugging purposes
- Analytics data is not stored permanently

### Compliance
- We comply with GDPR and CCPA data protection regulations
- We have a clear Privacy Policy and Terms of Service
- We do not sell or share user data with third parties
- We do not use user data for advertising or marketing purposes
- We comply with TikTok's API Terms of Service and Community Guidelines

---

## Use Cases and Examples

### Use Case 1: Automated Video Publishing
**Scenario:** Content creator wants to upload videos from Google Drive to TikTok automatically

**Scopes Used:**
- `user.info.basic` (authentication)
- `video.upload` (upload video)
- `video.publish` (publish video)

**Workflow:**
1. User creates automation: "Upload videos from Google Drive folder to TikTok"
2. User configures video settings (caption template, hashtags, privacy)
3. Automation runs on schedule (e.g., daily at 6 PM)
4. Videos are uploaded and published automatically
5. User receives notification of successful upload

**User Benefit:** Saves 15-30 minutes per video, enables consistent posting schedule

---

### Use Case 2: Performance Analytics Dashboard
**Scenario:** Creator wants weekly performance reports in Google Sheets

**Scopes Used:**
- `user.info.basic` (authentication)
- `video.list` (get video list)
- `video.insights` (get analytics)

**Workflow:**
1. User creates automation: "Generate weekly TikTok analytics report"
2. Automation runs every Monday morning
3. Retrieves performance data for all videos from past week
4. Generates formatted report in Google Sheets
5. User receives email notification with link to report

**User Benefit:** Saves 1-2 hours per week on manual data collection and reporting

---

### Use Case 3: Comment Auto-Reply
**Scenario:** Creator wants to automatically reply to common questions

**Scopes Used:**
- `user.info.basic` (authentication)
- `video.list` (get videos)
- `comment.list` (read comments)
- `comment.manage` (reply to comments)

**Workflow:**
1. User creates automation: "Auto-reply to FAQ comments"
2. User configures reply templates for common questions
3. Automation runs every hour
4. Scans new comments for keywords
5. Replies with appropriate template response
6. User receives summary of auto-replies

**User Benefit:** Improves response time, maintains engagement, saves time on repetitive responses

---

## Scope Usage Summary

| Scope | Purpose | Data Accessed | User Control |
|-------|---------|---------------|--------------|
| user.info.basic | Authentication | Username, avatar, profile URL | Always required for TikTok connection |
| video.upload | Upload videos | Video file during upload | Only when upload automation runs |
| video.publish | Publish videos | Video metadata, settings | Only when publish automation runs |
| video.list | List videos | Video IDs, titles, dates | Only when automation needs video list |
| video.insights | Analytics | Views, likes, comments, shares | Only when analytics automation runs |
| comment.list | Read comments | Comment text, author, timestamp | Only when comment automation runs |
| comment.manage | Manage comments | Comment actions (reply, delete) | Only when management automation runs |

---

## Limited Use Commitment

We commit to:
1. Only use requested scopes for the purposes described above
2. Not access, store, or share user data beyond what is necessary for automation functionality
3. Give users full control over their data and ability to revoke access
4. Comply with TikTok's API Terms of Service and data usage policies
5. Implement appropriate security measures to protect user data
6. Not use user data for advertising or marketing purposes
7. Not sell or share user data with third parties

---

## Test Accounts

We can provide test accounts for TikTok's verification team to review:
- Test user accounts with sample automations
- Demo automations showing video upload, analytics, and comment management
- Access to our staging environment for security review
- Screen sharing sessions to demonstrate functionality

---

## Support & Documentation

### User Documentation
- Comprehensive guides on connecting TikTok account
- Tutorials on creating TikTok automations
- FAQ on permissions and data access
- Privacy and security best practices
- Troubleshooting guides

### Support Channels
- Email support: support@modelgrow.com
- Documentation: https://modelgrow.com/docs/tiktok
- Privacy Policy: https://modelgrow.com/privacy
- Terms of Service: https://modelgrow.com/terms

---

## Business Information

**Company:** ModelGrow (შპს ModelGrow)
**Type:** SaaS Automation Platform
**Target Users:** Content creators, social media managers, businesses
**Business Model:** Subscription-based (users pay for automation runs)
**Data Monetization:** We do not monetize user data - revenue comes solely from subscriptions

---

## Verification Checklist

✅ OAuth consent screen configured with accurate information
✅ Privacy Policy published and linked (includes TikTok section)
✅ Terms of Service published and linked (includes TikTok section)
✅ Scopes limited to minimum necessary for functionality
✅ Video demonstration prepared showing OAuth flow and scope usage
✅ Security measures implemented (encryption, secure storage)
✅ User controls implemented (enable/disable, revoke access)
✅ No data selling or unauthorized sharing
✅ Compliance with data protection regulations
✅ Support and documentation available
✅ Compliance with TikTok API Terms of Service
✅ Respect for TikTok Community Guidelines

---

## Contact Information for Verification

**Primary Contact:** ModelGrow Team
**Email:** g.dalaqishvili01@gmail.com
**Support Email:** support@modelgrow.com
**Company Website:** https://modelgrow.com

**Availability for Questions:**
We are available to answer any questions from the TikTok verification team and can provide:
- Additional technical documentation
- Test accounts for review
- Screen sharing sessions to demonstrate functionality
- Access to staging environment for security audit
- Any other information needed for verification

---

## Declaration

We declare that:
1. We only use the requested scopes for the purposes described in this document
2. We do not access, store, or share user data beyond what is necessary for the automation functionality
3. Users maintain full control over their data and can revoke access at any time
4. We comply with TikTok's API Terms of Service and Community Guidelines
5. We implement appropriate security measures to protect user data
6. We do not use user data for advertising or marketing purposes
7. We do not sell or share user data with third parties
8. We respect user privacy and content ownership
9. We comply with all applicable data protection regulations (GDPR, CCPA)
10. We are committed to maintaining the trust and safety of the TikTok community

**Company:** ModelGrow (შპს ModelGrow)
**Date:** February 6, 2026
**Authorized Representative:** [Your Name and Title]

---

**Last Updated:** February 6, 2026
**Version:** 1.0.0
