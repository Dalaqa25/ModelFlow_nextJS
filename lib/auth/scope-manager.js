/**
 * Google OAuth Scope Manager
 * Manages which scopes are requested based on platform needs
 * 
 * IMPORTANT: These scopes MUST match what's configured in Google Cloud Console
 * Last updated: Based on Google Cloud Console configuration
 */

// All scopes currently approved in Google Cloud Console
export const PLATFORM_SCOPES = {
  // Basic profile (always included) - NON-SENSITIVE
  BASIC: [
    'openid',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ],
  
  // Google Drive scopes - NON-SENSITIVE
  DRIVE: [
    'https://www.googleapis.com/auth/drive.file', // Per-file access only (approved)
  ],
  
  // Google Sheets scopes - SENSITIVE (requires verification)
  SHEETS: [
    'https://www.googleapis.com/auth/spreadsheets', // Read/write (approved)
  ],
  
  // Gmail scopes - SENSITIVE (requires verification)
  GMAIL: [
    'https://www.googleapis.com/auth/gmail.send', // Send only (approved)
    'https://www.googleapis.com/auth/gmail.addons.current.action.compose', // Compose in add-on (approved)
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
    'openid': 'OpenID',
    'https://www.googleapis.com/auth/userinfo.email': 'Email Address',
    'https://www.googleapis.com/auth/userinfo.profile': 'Profile Info',
    'https://www.googleapis.com/auth/drive.file': 'Google Drive (Per-File)',
    'https://www.googleapis.com/auth/spreadsheets': 'Google Sheets',
    'https://www.googleapis.com/auth/gmail.send': 'Gmail (Send)',
    'https://www.googleapis.com/auth/gmail.addons.current.action.compose': 'Gmail (Compose in Add-on)',
  };
  
  return scopeNames[scope] || scope;
}

/**
 * Get user-friendly description of what scopes allow
 */
export function getScopeDescription(scope) {
  const descriptions = {
    'openid': 'Verify your identity',
    'https://www.googleapis.com/auth/userinfo.email': 'See your email address',
    'https://www.googleapis.com/auth/userinfo.profile': 'See your personal info',
    'https://www.googleapis.com/auth/drive.file': 'Access only files created by this app',
    'https://www.googleapis.com/auth/spreadsheets': 'View and manage your Google Sheets',
    'https://www.googleapis.com/auth/gmail.send': 'Send emails on your behalf',
    'https://www.googleapis.com/auth/gmail.addons.current.action.compose': 'Compose emails in Gmail add-on',
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
