/**
 * Automation Scope Detector
 * Detects which Google services an automation needs
 * Used for incremental authorization
 */

import { detectGoogleScopes } from '@/app/components/automationUpload/detectScopes';

/**
 * Get required services for an automation
 * Returns service names (e.g., ['DRIVE', 'SHEETS', 'GMAIL'])
 */
export function getRequiredServices(workflowJson) {
  const { scopeDetails } = detectGoogleScopes(workflowJson);
  
  const services = new Set();
  
  scopeDetails.forEach(scope => {
    const service = mapScopeToService(scope.fullScope);
    if (service) {
      services.add(service);
    }
  });
  
  return Array.from(services);
}

/**
 * Map a scope URL to a service name
 */
function mapScopeToService(scopeUrl) {
  if (scopeUrl.includes('/drive')) return 'DRIVE';
  if (scopeUrl.includes('/spreadsheets')) return 'SHEETS';
  if (scopeUrl.includes('/documents')) return 'DOCS';
  if (scopeUrl.includes('/gmail')) return 'GMAIL';
  if (scopeUrl.includes('/calendar')) return 'CALENDAR';
  if (scopeUrl.includes('/youtube')) return 'YOUTUBE';
  if (scopeUrl.includes('/presentations')) return 'SLIDES';
  if (scopeUrl.includes('/forms')) return 'FORMS';
  if (scopeUrl.includes('/tasks')) return 'TASKS';
  if (scopeUrl.includes('/contacts')) return 'CONTACTS';
  if (scopeUrl.includes('/photoslibrary')) return 'PHOTOS';
  if (scopeUrl.includes('/analytics')) return 'ANALYTICS';
  if (scopeUrl.includes('/adwords')) return 'ADS';
  
  return null;
}

/**
 * Get user-friendly service names
 */
export function getServiceDisplayNames(services) {
  const displayNames = {
    'DRIVE': 'Google Drive',
    'SHEETS': 'Google Sheets',
    'DOCS': 'Google Docs',
    'GMAIL': 'Gmail',
    'CALENDAR': 'Google Calendar',
    'YOUTUBE': 'YouTube',
    'SLIDES': 'Google Slides',
    'FORMS': 'Google Forms',
    'TASKS': 'Google Tasks',
    'CONTACTS': 'Google Contacts',
    'PHOTOS': 'Google Photos',
    'ANALYTICS': 'Google Analytics',
    'ADS': 'Google Ads',
  };
  
  return services.map(s => displayNames[s] || s);
}

/**
 * Generate OAuth URL with only required scopes
 */
export function generateIncrementalAuthUrl(automationId, userId, workflowJson) {
  const services = getRequiredServices(workflowJson);
  const servicesParam = services.join(',');
  
  const baseUrl = '/api/auth/google';
  const params = new URLSearchParams({
    automation_id: automationId,
    user_id: userId,
    services: servicesParam,
  });
  
  return `${baseUrl}?${params.toString()}`;
}

/**
 * Check if user has required scopes for an automation
 * @param {Object} userTokenData - User's current token data from database
 * @param {Object} workflowJson - Automation workflow JSON
 * @returns {Object} - { hasAllScopes: boolean, missingServices: string[] }
 */
export function checkUserHasRequiredScopes(userTokenData, workflowJson) {
  const requiredServices = getRequiredServices(workflowJson);
  const userScopes = userTokenData?.granted_scopes || [];
  
  const missingServices = requiredServices.filter(service => {
    // Check if user has any scope for this service
    const serviceScopes = getScopesForService(service);
    return !serviceScopes.some(scope => userScopes.includes(scope));
  });
  
  return {
    hasAllScopes: missingServices.length === 0,
    missingServices,
    requiredServices,
  };
}

/**
 * Helper to get scopes for a single service
 */
function getScopesForService(service) {
  const { PLATFORM_SCOPES } = require('./scope-manager');
  return PLATFORM_SCOPES[service] || [];
}
