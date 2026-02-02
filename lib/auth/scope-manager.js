/**
 * Google OAuth Scope Manager
 * Manages which scopes are requested based on platform needs
 */

// All scopes currently approved/requested for the platform
export const PLATFORM_SCOPES = {
  // Basic profile (always included)
  BASIC: [
    'openid',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ],
  
  // Google Drive scopes
  DRIVE: [
    'https://www.googleapis.com/auth/drive', // Full access (RESTRICTED)
    'https://www.googleapis.com/auth/drive.file', // Per-file access (NON-SENSITIVE)
  ],
  
  // Google Sheets scopes
  SHEETS: [
    'https://www.googleapis.com/auth/spreadsheets', // Read/write (SENSITIVE)
  ],
  
  // Google Docs scopes
  DOCS: [
    'https://www.googleapis.com/auth/documents', // Read/write (SENSITIVE)
  ],
  
  // Gmail scopes
  GMAIL: [
    'https://www.googleapis.com/auth/gmail.send', // Send only (SENSITIVE)
    'https://www.googleapis.com/auth/gmail.compose', // Compose (RESTRICTED)
    'https://www.googleapis.com/auth/gmail.readonly', // Read (RESTRICTED)
  ],
  
  // Google Calendar scopes
  CALENDAR: [
    'https://www.googleapis.com/auth/calendar', // Full access (SENSITIVE)
    'https://www.googleapis.com/auth/calendar.events', // Events only (SENSITIVE)
  ],
  
  // YouTube scopes
  YOUTUBE: [
    'https://www.googleapis.com/auth/youtube', // Full access (SENSITIVE)
    'https://www.googleapis.com/auth/youtube.upload', // Upload only (SENSITIVE)
  ],
  
  // Google Slides scopes
  SLIDES: [
    'https://www.googleapis.com/auth/presentations', // Read/write (SENSITIVE)
  ],
  
  // Google Forms scopes
  FORMS: [
    'https://www.googleapis.com/auth/forms.body', // Create/edit (SENSITIVE)
    'https://www.googleapis.com/auth/forms.responses.readonly', // Read responses (SENSITIVE)
  ],
  
  // Google Tasks scopes
  TASKS: [
    'https://www.googleapis.com/auth/tasks', // Full access (SENSITIVE)
  ],
  
  // Google Contacts scopes (ADDITIONAL - consider adding)
  CONTACTS: [
    'https://www.googleapis.com/auth/contacts', // Full access (SENSITIVE)
    'https://www.googleapis.com/auth/contacts.readonly', // Read only (SENSITIVE)
  ],
  
  // Google Photos scopes (ADDITIONAL - consider adding)
  PHOTOS: [
    'https://www.googleapis.com/auth/photoslibrary', // Full access (RESTRICTED)
    'https://www.googleapis.com/auth/photoslibrary.readonly', // Read only (RESTRICTED)
  ],
  
  // Google Analytics scopes (ADDITIONAL - consider adding)
  ANALYTICS: [
    'https://www.googleapis.com/auth/analytics.readonly', // Read only (SENSITIVE)
  ],
  
  // Google Ads scopes (ADDITIONAL - consider adding)
  ADS: [
    'https://www.googleapis.com/auth/adwords', // Full access (RESTRICTED)
  ],
};

/**
 * Get all platform scopes as a single array
 */
export function getAllScopes() {
  const allScopes = [];
  Object.values(PLATFORM_SCOPES).forEach(scopeGroup => {
    allScopes.push(...scopeGroup);
  });
  return allScopes;
}

/**
 * Get all platform scopes as a space-separated string (for OAuth requests)
 */
export function getAllScopesString() {
  return getAllScopes().join(' ');
}

/**
 * Get scopes for specific services
 * @param {string[]} services - Array of service names (e.g., ['DRIVE', 'SHEETS'])
 * @returns {string[]} - Array of scope URLs
 */
export function getScopesForServices(services) {
  const scopes = [...PLATFORM_SCOPES.BASIC]; // Always include basic
  
  services.forEach(service => {
    const serviceScopes = PLATFORM_SCOPES[service.toUpperCase()];
    if (serviceScopes) {
      scopes.push(...serviceScopes);
    } else {
      console.warn(`Unknown service: ${service}`);
    }
  });
  
  // Remove duplicates
  return [...new Set(scopes)];
}

/**
 * Get scopes for specific services as a space-separated string
 */
export function getScopesForServicesString(services) {
  return getScopesForServices(services).join(' ');
}

/**
 * Check if a scope is sensitive or restricted
 */
export function isSensitiveScope(scope) {
  const sensitiveScopePatterns = [
    /\/drive$/,
    /\/drive\.readonly$/,
    /\/spreadsheets/,
    /\/documents/,
    /\/gmail\./,
    /\/calendar/,
    /\/youtube/,
    /\/presentations/,
    /\/forms\./,
    /\/tasks/,
  ];
  
  return sensitiveScopePatterns.some(pattern => pattern.test(scope));
}

/**
 * Get human-readable name for a scope
 */
export function getScopeName(scope) {
  const scopeNames = {
    'https://www.googleapis.com/auth/drive': 'Google Drive (Full Access)',
    'https://www.googleapis.com/auth/drive.file': 'Google Drive (Per-File)',
    'https://www.googleapis.com/auth/drive.readonly': 'Google Drive (Read Only)',
    'https://www.googleapis.com/auth/spreadsheets': 'Google Sheets',
    'https://www.googleapis.com/auth/documents': 'Google Docs',
    'https://www.googleapis.com/auth/gmail.send': 'Gmail (Send)',
    'https://www.googleapis.com/auth/gmail.compose': 'Gmail (Compose)',
    'https://www.googleapis.com/auth/gmail.readonly': 'Gmail (Read)',
    'https://www.googleapis.com/auth/calendar': 'Google Calendar',
    'https://www.googleapis.com/auth/calendar.events': 'Google Calendar Events',
    'https://www.googleapis.com/auth/youtube': 'YouTube',
    'https://www.googleapis.com/auth/youtube.upload': 'YouTube Upload',
    'https://www.googleapis.com/auth/presentations': 'Google Slides',
    'https://www.googleapis.com/auth/forms.body': 'Google Forms',
    'https://www.googleapis.com/auth/forms.responses.readonly': 'Google Forms Responses',
    'https://www.googleapis.com/auth/tasks': 'Google Tasks',
  };
  
  return scopeNames[scope] || scope;
}

/**
 * Get user-friendly description of what scopes allow
 */
export function getScopeDescription(scope) {
  const descriptions = {
    'https://www.googleapis.com/auth/drive': 'Access and manage all your Google Drive files',
    'https://www.googleapis.com/auth/drive.file': 'Access only files created by this app',
    'https://www.googleapis.com/auth/drive.readonly': 'View your Google Drive files',
    'https://www.googleapis.com/auth/spreadsheets': 'View and manage your Google Sheets',
    'https://www.googleapis.com/auth/documents': 'View and manage your Google Docs',
    'https://www.googleapis.com/auth/gmail.send': 'Send emails on your behalf',
    'https://www.googleapis.com/auth/gmail.compose': 'Create and send emails',
    'https://www.googleapis.com/auth/gmail.readonly': 'View your email messages',
    'https://www.googleapis.com/auth/calendar': 'View and manage your calendar',
    'https://www.googleapis.com/auth/calendar.events': 'View and manage calendar events',
    'https://www.googleapis.com/auth/youtube': 'Manage your YouTube account',
    'https://www.googleapis.com/auth/youtube.upload': 'Upload videos to YouTube',
    'https://www.googleapis.com/auth/presentations': 'View and manage your Google Slides',
    'https://www.googleapis.com/auth/forms.body': 'Create and manage Google Forms',
    'https://www.googleapis.com/auth/forms.responses.readonly': 'View form responses',
    'https://www.googleapis.com/auth/tasks': 'Manage your tasks',
  };
  
  return descriptions[scope] || 'Access Google services';
}

/**
 * Future: Get minimal scopes needed for an automation
 * This can be used for incremental authorization
 */
export function getMinimalScopesForAutomation(automationJson) {
  // This would analyze the automation JSON and return only required scopes
  // For now, return all scopes (current behavior)
  return getAllScopes();
}

/**
 * Validate that all requested scopes are approved in Google Cloud Console
 * This should match what's configured in the OAuth consent screen
 */
export function validateScopes(requestedScopes) {
  const approvedScopes = getAllScopes();
  const unapprovedScopes = requestedScopes.filter(
    scope => !approvedScopes.includes(scope)
  );
  
  return {
    valid: unapprovedScopes.length === 0,
    unapprovedScopes,
  };
}
