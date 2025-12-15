/**
 * Converts n8n placeholder format to standard format
 * <__PLACEHOLDER_VALUE__Description__> → {{VARIABLE_NAME}}
 */
function convertN8nPlaceholder(placeholder) {
  // Extract description from n8n format
  const match = placeholder.match(/<__PLACEHOLDER_VALUE__(.+?)__>/);
  if (!match) return null;
  
  const description = match[1];
  
  // Convert description to variable name
  // "Job title for the position" → "JOB_TITLE"
  const variableName = description
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_]/g, '')
    .toUpperCase();
  
  return variableName;
}

/**
 * Detects file input requirements from file-processing nodes
 */
function detectFileInputs(workflowJson) {
  const fileProcessingNodes = [
    'n8n-nodes-base.extractFromFile',
    'n8n-nodes-base.readPdf',
    'n8n-nodes-base.readBinaryFile',
    'n8n-nodes-base.spreadsheetFile',
  ];
  
  const fileInputs = new Set();
  
  if (workflowJson.nodes && Array.isArray(workflowJson.nodes)) {
    workflowJson.nodes.forEach(node => {
      if (fileProcessingNodes.includes(node.type)) {
        console.log(`📄 Detected file-processing node: ${node.type} (${node.name})`);
        fileInputs.add('FILE_INPUT');
      }
    });
  }
  
  return Array.from(fileInputs);
}

/**
 * Detects webhook body access patterns
 * Looks for: $json.body.fieldName, $json["body"]["fieldName"], etc.
 * Filters out credential parameters (tokens, keys, secrets, etc.)
 */
function detectWebhookInputs(workflowJson) {
  const workflowString = JSON.stringify(workflowJson);
  const webhookInputs = new Set();
  
  // Credential patterns to exclude (these are connectors, not user inputs)
  const credentialPatterns = /token|key|secret|oauth|bearer|auth|credential|password/i;
  
  // Pattern 1: $json.body.fieldName
  const dotPattern = /\$json\.body\.([a-zA-Z_][a-zA-Z0-9_]*)/g;
  let match;
  while ((match = dotPattern.exec(workflowString)) !== null) {
    const fieldName = match[1];
    
    // Skip credential parameters
    if (credentialPatterns.test(fieldName)) {
      console.log(`🔐 Skipping credential parameter: $json.body.${fieldName} (detected as connector, not input)`);
      continue;
    }
    
    const variableName = fieldName
      .replace(/([A-Z])/g, '_$1')
      .toUpperCase()
      .replace(/^_/, '');
    console.log(`🔗 Detected webhook body access: $json.body.${fieldName} → ${variableName}`);
    webhookInputs.add(variableName);
  }
  
  // Pattern 2: $json["body"]["fieldName"] (handles both escaped and non-escaped quotes)
  // Matches: $json["body"]["fieldName"] OR $json[\"body\"][\"fieldName\"]
  const bracketPattern = /\$json\[\\*"body\\*"\]\[\\*"([a-zA-Z_][a-zA-Z0-9_]*)\\*"\]/g;
  while ((match = bracketPattern.exec(workflowString)) !== null) {
    const fieldName = match[1];
    
    // Skip credential parameters
    if (credentialPatterns.test(fieldName)) {
      console.log(`🔐 Skipping credential parameter: $json["body"]["${fieldName}"] (detected as connector, not input)`);
      continue;
    }
    
    const variableName = fieldName
      .replace(/([A-Z])/g, '_$1')
      .toUpperCase()
      .replace(/^_/, '');
    console.log(`🔗 Detected webhook body access: $json["body"]["${fieldName}"] → ${variableName}`);
    webhookInputs.add(variableName);
  }
  
  // Pattern 3: $('Webhook').item.json.body.fieldName or $('Webhook').first().json.body.fieldName
  // Also handles escaped quotes in 'Webhook'
  const webhookCallPattern = /\$\(\\*'Webhook\\*'\)\.(?:item|first)\(\)\.json\.body\.([a-zA-Z_][a-zA-Z0-9_]*)/g;
  while ((match = webhookCallPattern.exec(workflowString)) !== null) {
    const fieldName = match[1];
    
    // Skip credential parameters
    if (credentialPatterns.test(fieldName)) {
      console.log(`🔐 Skipping credential parameter: $('Webhook').*.json.body.${fieldName} (detected as connector, not input)`);
      continue;
    }
    
    const variableName = fieldName
      .replace(/([A-Z])/g, '_$1')
      .toUpperCase()
      .replace(/^_/, '');
    console.log(`🔗 Detected webhook body access: $('Webhook').*.json.body.${fieldName} → ${variableName}`);
    webhookInputs.add(variableName);
  }
  
  return Array.from(webhookInputs);
}

/**
 * Replaces n8n placeholders with standard format
 * Returns modified workflow and detected user inputs
 */
export function replaceN8nPlaceholders(workflowJson) {
  const workflowString = JSON.stringify(workflowJson);
  const n8nPattern = /<__PLACEHOLDER_VALUE__(.+?)__>/g;
  const detectedInputs = new Set();
  
  let modifiedString = workflowString;
  let match;
  
  while ((match = n8nPattern.exec(workflowString)) !== null) {
    const fullPlaceholder = match[0];
    const variableName = convertN8nPlaceholder(fullPlaceholder);
    
    if (variableName) {
      console.log(`🔄 Converting n8n placeholder: ${fullPlaceholder} → {{${variableName}}}`);
      modifiedString = modifiedString.replaceAll(fullPlaceholder, `{{${variableName}}}`);
      detectedInputs.add(variableName);
    }
  }
  
  const modifiedWorkflow = JSON.parse(modifiedString);
  
  // Detect file inputs
  const fileInputs = detectFileInputs(modifiedWorkflow);
  fileInputs.forEach(input => detectedInputs.add(input));
  
  // Detect webhook body access patterns
  const webhookInputs = detectWebhookInputs(modifiedWorkflow);
  webhookInputs.forEach(input => detectedInputs.add(input));
  
  console.log('✅ Total user inputs detected:', Array.from(detectedInputs));
  
  return {
    workflow: modifiedWorkflow,
    userInputs: Array.from(detectedInputs)
  };
}

/**
 * Replaces n8n credential IDs with placeholders
 * Returns modified workflow
 */
export function replaceCredentialsWithPlaceholders(workflowJson, detectedKeys) {
  const modifiedWorkflow = JSON.parse(JSON.stringify(workflowJson)); // Deep clone
  
  if (!modifiedWorkflow.nodes || !Array.isArray(modifiedWorkflow.nodes)) {
    return modifiedWorkflow;
  }

  // Map credential types to key names
  const credentialMapping = {};
  detectedKeys.forEach(keyName => {
    // Convert "OPEN_ROUTER_API_KEY" back to "openRouterApi"
    const credType = keyName
      .replace(/_API_KEY$/, '')
      .toLowerCase()
      .replace(/_(.)/g, (_, char) => char.toUpperCase()) + 'Api';
    credentialMapping[credType] = keyName;
  });

  console.log('🔄 Credential mapping:', credentialMapping);

  // Replace credential IDs with placeholders
  modifiedWorkflow.nodes.forEach(node => {
    if (node.credentials) {
      Object.keys(node.credentials).forEach(credType => {
        const keyName = credentialMapping[credType];
        if (keyName) {
          console.log(`🔄 Replacing ${credType} credential ID with {{${keyName}}}`);
          node.credentials[credType].id = `{{${keyName}}}`;
        }
      });
    }
  });

  return modifiedWorkflow;
}

/**
 * Detects OAuth-based user connectors (services users need to authenticate with)
 * Returns array of connector names like ['Google', 'Slack', 'Twitter']
 */
export function detectUserConnectors(workflowJson) {
  try {
    const workflowString = JSON.stringify(workflowJson);
    const connectors = new Set();
    
    console.log('🔍 Scanning workflow for user connectors (OAuth services)...');
    
    if (workflowJson.nodes && Array.isArray(workflowJson.nodes)) {
      workflowJson.nodes.forEach(node => {
        if (node.credentials) {
          Object.keys(node.credentials).forEach(credType => {
            const credLower = credType.toLowerCase();
            
            // Google services (Sheets, Gmail, Drive, Calendar, etc.)
            if (credLower.includes('google') || credLower.includes('gmail') || 
                credLower.includes('sheets') || credLower.includes('drive') ||
                credLower.includes('calendar')) {
              console.log(`🔗 Found Google connector: ${credType}`);
              connectors.add('Google');
            }
            // Slack
            else if (credLower.includes('slack')) {
              console.log(`🔗 Found Slack connector: ${credType}`);
              connectors.add('Slack');
            }
            // Twitter
            else if (credLower.includes('twitter')) {
              console.log(`🔗 Found Twitter connector: ${credType}`);
              connectors.add('Twitter');
            }
            // GitHub
            else if (credLower.includes('github')) {
              console.log(`🔗 Found GitHub connector: ${credType}`);
              connectors.add('GitHub');
            }
            // LinkedIn
            else if (credLower.includes('linkedin')) {
              console.log(`🔗 Found LinkedIn connector: ${credType}`);
              connectors.add('LinkedIn');
            }
            // Facebook
            else if (credLower.includes('facebook')) {
              console.log(`🔗 Found Facebook connector: ${credType}`);
              connectors.add('Facebook');
            }
            // Add more as needed
          });
        }
      });
    }
    
    console.log('✅ User connectors detected:', Array.from(connectors));
    return Array.from(connectors).sort();
  } catch (error) {
    console.error('Error detecting user connectors:', error);
    return [];
  }
}

/**
 * Detects API keys and secrets from workflow JSON (developer-provided keys)
 * Returns array of detected key names
 */
export function detectDeveloperKeys(workflowJson) {
  try {
    const workflowString = JSON.stringify(workflowJson);
    console.log('🔍 Scanning workflow for developer keys...');
    console.log('📄 Workflow size:', workflowString.length, 'characters');
    
    const detectedKeys = new Set();
    
    // Method 1: Detect n8n credentials (excluding OAuth-based user connectors)
    if (workflowJson.nodes && Array.isArray(workflowJson.nodes)) {
      // OAuth/User connector patterns to exclude (these are user-connected services, not developer keys)
      const userConnectorPatterns = [
        /oauth/i,           // Any OAuth-based auth (Google, Slack, etc.)
        /sheets/i,          // Google Sheets
        /gmail/i,           // Gmail
        /drive/i,           // Google Drive
        /calendar/i,        // Google Calendar
        /slack/i,           // Slack
        /twitter/i,         // Twitter
        /facebook/i,        // Facebook
        /linkedin/i,        // LinkedIn
        /github/i,          // GitHub OAuth
        /smtp/i,            // SMTP (user's email)
        /imap/i,            // IMAP (user's email)
        /pop3/i,            // POP3 (user's email)
      ];
      
      workflowJson.nodes.forEach(node => {
        if (node.credentials) {
          Object.keys(node.credentials).forEach(credType => {
            // Check if this is a user connector (OAuth-based)
            const isUserConnector = userConnectorPatterns.some(pattern => 
              pattern.test(credType)
            );
            
            if (isUserConnector) {
              console.log(`🔗 Skipping user connector: ${credType} (handled by user authentication)`);
              return; // Skip this credential
            }
            
            // Convert credential type to key name
            // e.g., "openRouterApi" -> "OPENROUTER_API_KEY"
            const keyName = credType
              .replace(/Api$/, '')
              .replace(/([A-Z])/g, '_$1')
              .toUpperCase()
              .replace(/^_/, '') + '_API_KEY';
            
            console.log(`🔑 Found n8n credential: ${credType} → ${keyName}`);
            detectedKeys.add(keyName);
          });
        }
        
        // Method 1b: Detect hardcoded API keys in HTTP Request nodes
        if (node.type === 'n8n-nodes-base.httpRequest') {
          console.log(`🌐 Scanning HTTP Request node: ${node.name}`);
          
          // Check URL for API keys
          if (node.parameters?.url) {
            const url = node.parameters.url;
            
            // Google Search API key pattern: key=...
            if (url.includes('googleapis.com/customsearch') || url.includes('key=')) {
              const keyMatch = url.match(/[?&]key=([A-Za-z0-9_-]+)/);
              if (keyMatch) {
                console.log(`🔑 Found Google Search API key in URL`);
                detectedKeys.add('GOOGLE_SEARCH_API_KEY');
              }
              
              // Google Custom Search Engine ID: cx=...
              const cxMatch = url.match(/[?&]cx=([A-Za-z0-9_-]+)/);
              if (cxMatch) {
                console.log(`🔑 Found Google Search CSX in URL`);
                detectedKeys.add('GOOGLE_SEARCH_CSX');
              }
            }
            
            // Generic API key patterns in URL
            const genericKeyPatterns = [
              /[?&]apikey=([^&\s]+)/i,
              /[?&]api_key=([^&\s]+)/i,
              /[?&]token=([^&\s]+)/i,
            ];
            
            genericKeyPatterns.forEach(pattern => {
              if (pattern.test(url)) {
                console.log(`🔑 Found generic API key in URL`);
                detectedKeys.add('API_KEY');
              }
            });
          }
          
          // Check headers for API keys
          if (node.parameters?.headerParameters?.parameters) {
            node.parameters.headerParameters.parameters.forEach(header => {
              const headerName = header.name?.toLowerCase() || '';
              
              if (headerName.includes('rapidapi')) {
                console.log(`🔑 Found RapidAPI key in headers`);
                detectedKeys.add('RAPIDAPI_KEY');
              } else if (headerName.includes('api-key') || headerName === 'x-api-key') {
                console.log(`🔑 Found API key in headers`);
                detectedKeys.add('API_KEY');
              } else if (headerName === 'authorization' && header.value && !header.value.includes('{{')) {
                console.log(`🔑 Found Authorization header`);
                detectedKeys.add('AUTH_TOKEN');
              }
            });
          }
          
          // Check query parameters for API keys
          if (node.parameters?.queryParameters?.parameters) {
            node.parameters.queryParameters.parameters.forEach(param => {
              const paramName = param.name?.toLowerCase() || '';
              
              if (paramName === 'key' || paramName === 'apikey' || paramName === 'api_key') {
                console.log(`🔑 Found API key in query parameters: ${param.name}`);
                detectedKeys.add('API_KEY');
              }
            });
          }
        }
      });
    }
    
    // Method 2: Detect placeholder patterns
    const keyPatterns = [
      /\{\{([A-Z_]*API[_]?KEY[A-Z_]*)\}\}/gi,
      /\{\{([A-Z_]*SECRET[A-Z_]*)\}\}/gi,
      /\{\{([A-Z_]*TOKEN[A-Z_]*)\}\}/gi,
      /\{\{([A-Z_]*PASSWORD[A-Z_]*)\}\}/gi,
      /\{\{([A-Z_]*AUTH[A-Z_]*)\}\}/gi,
      /\{\{([A-Z_]*CREDENTIAL[A-Z_]*)\}\}/gi,
    ];
    
    // Patterns to exclude (user inputs, not developer keys)
    const excludePatterns = [
      'SHEET_ID',
      'SHEET_NAME',
      'EMAIL',
      'NAME',
      'PHONE',
      'ADDRESS',
      'MESSAGE',
      'SUBJECT',
      'BODY',
      'TITLE',
      'DESCRIPTION',
      'URL',
      'LINK',
      'DATE',
      'TIME',
      'AMOUNT',
      'QUANTITY',
      'USER_',
      'CUSTOMER_',
    ];
    
    const allMatches = [];
    
    // Search for placeholder patterns
    keyPatterns.forEach((pattern, index) => {
      let match;
      while ((match = pattern.exec(workflowString)) !== null) {
        const keyName = match[1].toUpperCase();
        allMatches.push(keyName);
        
        // Check if it should be excluded
        const shouldExclude = excludePatterns.some(exclude => 
          keyName.includes(exclude)
        );
        
        if (!shouldExclude) {
          detectedKeys.add(keyName);
        }
      }
    });
    
    console.log('📋 Placeholder patterns found:', allMatches);
    console.log('✅ Total developer keys detected:', Array.from(detectedKeys));
    
    return Array.from(detectedKeys).sort();
  } catch (error) {
    console.error('Error detecting developer keys:', error);
    return [];
  }
}
