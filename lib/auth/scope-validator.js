/**
 * Scope Validator
 * Validates that uploaded automations only use approved scopes
 */

import { getAllScopes } from './scope-manager';
import { detectGoogleScopes } from '@/app/components/automationUpload/detectScopes';

/**
 * Validate that an automation only uses approved scopes
 * @param {Object} workflowJson - The n8n workflow JSON
 * @returns {Object} - Validation result
 */
export function validateAutomationScopes(workflowJson) {
  // Detect what scopes the automation needs
  const { scopes, scopeDetails, requiresVerification } = detectGoogleScopes(workflowJson);
  
  // Get all scopes we currently have approved
  const approvedScopes = getAllScopes();
  
  // Find any scopes the automation needs that we don't have
  const missingScopes = scopes.filter(scope => !approvedScopes.includes(scope));
  
  // Check if all required scopes are approved
  const isValid = missingScopes.length === 0;
  
  return {
    isValid,
    requiredScopes: scopes,
    scopeDetails,
    missingScopes,
    requiresVerification,
    message: isValid 
      ? 'All required scopes are approved'
      : `Missing ${missingScopes.length} required scope(s)`,
  };
}

/**
 * Get human-readable error message for missing scopes
 * @param {string[]} missingScopes - Array of missing scope URLs
 * @returns {string} - User-friendly error message
 */
export function getMissingScopesMessage(missingScopes) {
  if (missingScopes.length === 0) return '';
  
  const scopeNames = missingScopes.map(scope => {
    // Extract service name from scope URL
    const match = scope.match(/googleapis\.com\/auth\/([^.]+)/);
    return match ? match[1] : scope;
  });
  
  return `This automation requires Google ${scopeNames.join(', ')} permissions that are not yet approved. Please contact support to request these permissions.`;
}

/**
 * Check if automation can be uploaded
 * Returns detailed validation result
 */
export async function canUploadAutomation(workflowJson) {
  const validation = validateAutomationScopes(workflowJson);
  
  if (validation.isValid) {
    return {
      canUpload: true,
      message: 'Automation is ready to upload',
      requiredScopes: validation.scopeDetails,
    };
  }
  
  // Automation requires scopes we don't have
  return {
    canUpload: false,
    message: getMissingScopesMessage(validation.missingScopes),
    requiredScopes: validation.scopeDetails,
    missingScopes: validation.missingScopes,
    action: 'contact_support',
    supportMessage: `Please contact support to request approval for: ${validation.missingScopes.join(', ')}`,
  };
}

/**
 * Log missing scope requests for analytics
 * This helps you track which scopes developers need
 */
export async function logMissingScopeRequest(automationName, missingScopes, developerEmail) {
  // In production, send this to your analytics/logging service
  console.log('Missing Scope Request:', {
    automation: automationName,
    scopes: missingScopes,
    developer: developerEmail,
    timestamp: new Date().toISOString(),
  });
  
  // TODO: Send to analytics service
  // await analytics.track('missing_scope_request', { ... });
  
  // TODO: Send notification to admin
  // await notifyAdmin('New scope request', { ... });
}

/**
 * Get statistics about scope requests
 * Helps you decide which scopes to add next
 */
export function getScopeRequestStats(requests) {
  const scopeCounts = {};
  
  requests.forEach(request => {
    request.scopes.forEach(scope => {
      scopeCounts[scope] = (scopeCounts[scope] || 0) + 1;
    });
  });
  
  // Sort by most requested
  const sorted = Object.entries(scopeCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([scope, count]) => ({ scope, count }));
  
  return sorted;
}

/**
 * Generate report for quarterly scope review
 */
export function generateScopeReviewReport(usageData, requestData) {
  return {
    approvedScopes: getAllScopes(),
    unusedScopes: usageData.filter(s => s.usageCount === 0),
    mostUsedScopes: usageData.sort((a, b) => b.usageCount - a.usageCount).slice(0, 10),
    mostRequestedScopes: getScopeRequestStats(requestData).slice(0, 10),
    recommendation: generateScopeRecommendations(usageData, requestData),
  };
}

/**
 * Generate recommendations for scope management
 */
function generateScopeRecommendations(usageData, requestData) {
  const recommendations = [];
  
  // Find unused scopes (consider removing)
  const unused = usageData.filter(s => s.usageCount === 0 && s.monthsSinceApproval > 6);
  if (unused.length > 0) {
    recommendations.push({
      type: 'remove',
      scopes: unused.map(s => s.scope),
      reason: 'Not used in 6+ months',
    });
  }
  
  // Find highly requested scopes (consider adding)
  const highDemand = getScopeRequestStats(requestData)
    .filter(s => s.count >= 5)
    .map(s => s.scope);
  
  if (highDemand.length > 0) {
    recommendations.push({
      type: 'add',
      scopes: highDemand,
      reason: 'Requested by 5+ developers',
    });
  }
  
  return recommendations;
}
