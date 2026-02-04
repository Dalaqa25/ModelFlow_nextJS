/**
 * Detects required Google OAuth scopes from n8n workflow JSON
 * This helps inform users which permissions their automation needs
 * 
 * IMPORTANT: Only includes scopes that are approved in Google Cloud Console
 */

const GOOGLE_NODE_SCOPES = {
  // Google Drive nodes - ONLY per-file access is approved
  'n8n-nodes-base.googleDrive': ['drive.file'],
  'n8n-nodes-base.googleDriveTrigger': ['drive.file'],
  
  // Google Sheets nodes
  'n8n-nodes-base.googleSheets': ['spreadsheets'],
  
  // Gmail nodes - ONLY send and compose are approved
  'n8n-nodes-base.gmail': ['gmail.send'],
  'n8n-nodes-base.gmailTool': ['gmail.send'],
  
  // REMOVED: Calendar, Docs, Slides, Tasks, YouTube (not approved in Google Cloud Console)
};

const SCOPE_DETAILS = {
  'drive.file': {
    fullScope: 'https://www.googleapis.com/auth/drive.file',
    name: 'Google Drive (Per-File)',
    description: 'Access only to files created by this app',
    sensitivity: 'NON-SENSITIVE',
    requiresVerification: false,
  },
  'spreadsheets': {
    fullScope: 'https://www.googleapis.com/auth/spreadsheets',
    name: 'Google Sheets',
    description: 'Read and write Google Sheets',
    sensitivity: 'SENSITIVE',
    requiresVerification: true,
  },
  'gmail.send': {
    fullScope: 'https://www.googleapis.com/auth/gmail.send',
    name: 'Gmail (Send)',
    description: 'Send emails on your behalf',
    sensitivity: 'SENSITIVE',
    requiresVerification: true,
  },
  'gmail.addons.current.action.compose': {
    fullScope: 'https://www.googleapis.com/auth/gmail.addons.current.action.compose',
    name: 'Gmail (Compose in Add-on)',
    description: 'Compose emails in Gmail add-on',
    sensitivity: 'NON-SENSITIVE',
    requiresVerification: false,
  },
};

/**
 * Detects required Google OAuth scopes from workflow JSON
 * @param {Object} workflowJson - The n8n workflow JSON
 * @returns {Object} - { scopes: string[], scopeDetails: Object[], requiresVerification: boolean }
 */
export function detectGoogleScopes(workflowJson) {
  const detectedScopes = new Set();
  
  if (!workflowJson.nodes || !Array.isArray(workflowJson.nodes)) {
    return {
      scopes: [],
      scopeDetails: [],
      requiresVerification: false,
    };
  }
  
  // Scan all nodes for Google services
  workflowJson.nodes.forEach(node => {
    const nodeType = node.type;
    
    // Check if this is a Google node
    if (GOOGLE_NODE_SCOPES[nodeType]) {
      const requiredScopes = GOOGLE_NODE_SCOPES[nodeType];
      requiredScopes.forEach(scope => detectedScopes.add(scope));
    }
    
    // Check for Gmail operations that need specific scopes
    if (nodeType === 'n8n-nodes-base.gmail') {
      // Only gmail.send is approved
      detectedScopes.add('gmail.send');
    }
    
    // Check for Drive operations - only per-file access is approved
    if (nodeType === 'n8n-nodes-base.googleDrive') {
      detectedScopes.add('drive.file');
    }
  });
  
  // Convert to full scope URLs and get details
  const scopeArray = Array.from(detectedScopes);
  const scopeDetails = scopeArray.map(scope => SCOPE_DETAILS[scope]).filter(Boolean);
  const fullScopes = scopeDetails.map(detail => detail.fullScope);
  const requiresVerification = scopeDetails.some(detail => detail.requiresVerification);
  
  return {
    scopes: fullScopes,
    scopeDetails,
    requiresVerification,
  };
}

/**
 * Gets a human-readable summary of required scopes
 * @param {Object} workflowJson - The n8n workflow JSON
 * @returns {string} - Human-readable summary
 */
export function getScopeSummary(workflowJson) {
  const { scopeDetails, requiresVerification } = detectGoogleScopes(workflowJson);
  
  if (scopeDetails.length === 0) {
    return 'No Google services detected';
  }
  
  const scopeNames = scopeDetails.map(detail => detail.name).join(', ');
  const verificationNote = requiresVerification 
    ? ' (requires user authorization)' 
    : '';
  
  return `This automation uses: ${scopeNames}${verificationNote}`;
}

/**
 * Checks if workflow requires any sensitive or restricted scopes
 * @param {Object} workflowJson - The n8n workflow JSON
 * @returns {boolean}
 */
export function requiresSensitiveScopes(workflowJson) {
  const { scopeDetails } = detectGoogleScopes(workflowJson);
  return scopeDetails.some(detail => 
    detail.sensitivity === 'SENSITIVE' || detail.sensitivity === 'RESTRICTED'
  );
}
