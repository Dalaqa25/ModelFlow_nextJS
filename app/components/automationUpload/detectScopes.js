/**
 * Detects required Google OAuth scopes from n8n workflow JSON
 * This helps inform users which permissions their automation needs
 */

const GOOGLE_NODE_SCOPES = {
  // Google Drive nodes
  'n8n-nodes-base.googleDrive': ['drive'],
  'n8n-nodes-base.googleDriveTrigger': ['drive.readonly'],
  
  // Google Sheets nodes
  'n8n-nodes-base.googleSheets': ['spreadsheets'],
  
  // Gmail nodes
  'n8n-nodes-base.gmail': ['gmail.send', 'gmail.readonly'],
  'n8n-nodes-base.gmailTool': ['gmail.send'],
  
  // Google Calendar nodes
  'n8n-nodes-base.googleCalendar': ['calendar'],
  
  // Google Docs nodes
  'n8n-nodes-base.googleDocs': ['documents'],
  
  // Google Slides nodes
  'n8n-nodes-base.googleSlides': ['presentations'],
  
  // Google Tasks nodes
  'n8n-nodes-base.googleTasks': ['tasks'],
  
  // YouTube nodes
  'n8n-nodes-base.youtube': ['youtube'],
};

const SCOPE_DETAILS = {
  'drive': {
    fullScope: 'https://www.googleapis.com/auth/drive',
    name: 'Google Drive',
    description: 'Full access to Google Drive files',
    sensitivity: 'RESTRICTED',
    requiresVerification: true,
  },
  'drive.readonly': {
    fullScope: 'https://www.googleapis.com/auth/drive.readonly',
    name: 'Google Drive (Read Only)',
    description: 'Read-only access to Google Drive files',
    sensitivity: 'RESTRICTED',
    requiresVerification: true,
  },
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
  'gmail.readonly': {
    fullScope: 'https://www.googleapis.com/auth/gmail.readonly',
    name: 'Gmail (Read Only)',
    description: 'Read your emails',
    sensitivity: 'RESTRICTED',
    requiresVerification: true,
  },
  'gmail.compose': {
    fullScope: 'https://www.googleapis.com/auth/gmail.compose',
    name: 'Gmail (Compose)',
    description: 'Create and send emails',
    sensitivity: 'RESTRICTED',
    requiresVerification: true,
  },
  'calendar': {
    fullScope: 'https://www.googleapis.com/auth/calendar',
    name: 'Google Calendar',
    description: 'Manage your calendar events',
    sensitivity: 'SENSITIVE',
    requiresVerification: true,
  },
  'documents': {
    fullScope: 'https://www.googleapis.com/auth/documents',
    name: 'Google Docs',
    description: 'Read and write Google Docs',
    sensitivity: 'SENSITIVE',
    requiresVerification: true,
  },
  'presentations': {
    fullScope: 'https://www.googleapis.com/auth/presentations',
    name: 'Google Slides',
    description: 'Read and write Google Slides',
    sensitivity: 'SENSITIVE',
    requiresVerification: true,
  },
  'tasks': {
    fullScope: 'https://www.googleapis.com/auth/tasks',
    name: 'Google Tasks',
    description: 'Manage your tasks',
    sensitivity: 'SENSITIVE',
    requiresVerification: true,
  },
  'youtube': {
    fullScope: 'https://www.googleapis.com/auth/youtube',
    name: 'YouTube',
    description: 'Manage your YouTube account',
    sensitivity: 'SENSITIVE',
    requiresVerification: true,
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
      const operation = node.parameters?.operation;
      if (operation === 'send') {
        detectedScopes.add('gmail.send');
      } else if (operation === 'get' || operation === 'getAll') {
        detectedScopes.add('gmail.readonly');
      }
    }
    
    // Check for Drive operations
    if (nodeType === 'n8n-nodes-base.googleDrive') {
      const operation = node.parameters?.operation;
      if (operation === 'upload' || operation === 'update' || operation === 'delete') {
        detectedScopes.add('drive');
      } else if (operation === 'download' || operation === 'list') {
        detectedScopes.add('drive.readonly');
      }
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
