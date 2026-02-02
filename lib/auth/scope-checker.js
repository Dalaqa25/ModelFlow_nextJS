/**
 * Scope Checker Utility
 * Checks if user has required scopes before running automation
 * SIMPLIFIED: Uses existing user_automations table
 */

import { userAutomationDB, automationDB } from '@/lib/db/automation-db';
import { getScopesForServices } from './scope-manager';

/**
 * Check if user has all required scopes for an automation
 * @param {string} userId - User's ID
 * @param {string} automationId - Automation ID
 * @returns {Promise<Object>} - { hasAllScopes, missingServices, authUrl }
 */
export async function checkAutomationScopes(userId, automationId) {
  try {
    // Get automation's required scopes
    const automation = await automationDB.getAutomationWithScopes(automationId);
    
    if (!automation) {
      throw new Error('Automation not found');
    }

    const requiredServices = automation.required_scopes || [];
    
    // If no scopes required, allow execution
    if (requiredServices.length === 0) {
      return {
        hasAllScopes: true,
        missingServices: [],
        requiredServices: [],
        authUrl: null
      };
    }

    // Get user's automation connection (tokens + granted scopes)
    const userAutomation = await userAutomationDB.getUserAutomation(userId, automationId);
    
    if (!userAutomation || !userAutomation.granted_scopes || userAutomation.granted_scopes.length === 0) {
      // User has no Google connection for this automation
      return {
        hasAllScopes: false,
        missingServices: requiredServices,
        requiredServices,
        authUrl: `/api/auth/google?automation_id=${automationId}`,
        message: 'Please connect your Google account to run this automation'
      };
    }

    // Check which services are missing
    const grantedScopes = userAutomation.granted_scopes;
    const missingServices = [];

    for (const service of requiredServices) {
      const serviceScopes = getScopesForServices([service]);
      const hasService = serviceScopes.some(scope => 
        grantedScopes.includes(scope)
      );
      
      if (!hasService) {
        missingServices.push(service);
      }
    }

    if (missingServices.length > 0) {
      // User is missing some scopes - need incremental authorization
      return {
        hasAllScopes: false,
        missingServices,
        requiredServices,
        authUrl: `/api/auth/google?automation_id=${automationId}&services=${missingServices.join(',')}`,
        message: `This automation needs additional permissions: ${getServiceDisplayNames(missingServices).join(', ')}`
      };
    }

    // User has all required scopes
    return {
      hasAllScopes: true,
      missingServices: [],
      requiredServices,
      authUrl: null
    };

  } catch (error) {
    console.error('Error checking automation scopes:', error);
    throw error;
  }
}

/**
 * Get user-friendly service names
 */
function getServiceDisplayNames(services) {
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
 * Get service icons for UI display
 */
export function getServiceIcons(services) {
  const icons = {
    'DRIVE': '📁',
    'SHEETS': '📊',
    'DOCS': '📄',
    'GMAIL': '📧',
    'CALENDAR': '📅',
    'YOUTUBE': '🎥',
    'SLIDES': '📊',
    'FORMS': '📝',
    'TASKS': '✅',
    'CONTACTS': '👥',
    'PHOTOS': '📷',
    'ANALYTICS': '📈',
    'ADS': '📢',
  };
  
  return services.map(s => icons[s] || '🔧');
}

/**
 * Format scope check result for API response
 */
export function formatScopeCheckResponse(checkResult) {
  if (checkResult.hasAllScopes) {
    return {
      authorized: true,
      message: 'User has all required permissions'
    };
  }

  return {
    authorized: false,
    message: checkResult.message,
    missing_services: checkResult.missingServices,
    required_services: checkResult.requiredServices,
    auth_url: checkResult.authUrl,
    service_names: getServiceDisplayNames(checkResult.missingServices)
  };
}
