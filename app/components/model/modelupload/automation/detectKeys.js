/**
 * Detects API keys and secrets from workflow JSON
 * Returns array of detected key names
 */
export function detectDeveloperKeys(workflowJson) {
  try {
    const workflowString = JSON.stringify(workflowJson);
    
    // Patterns to detect API keys/secrets
    const keyPatterns = [
      /\{\{([A-Z_]*API[_]?KEY[A-Z_]*)\}\}/g,
      /\{\{([A-Z_]*SECRET[A-Z_]*)\}\}/g,
      /\{\{([A-Z_]*TOKEN[A-Z_]*)\}\}/g,
      /\{\{([A-Z_]*PASSWORD[A-Z_]*)\}\}/g,
      /\{\{([A-Z_]*AUTH[A-Z_]*)\}\}/g,
      /\{\{([A-Z_]*CREDENTIAL[A-Z_]*)\}\}/g,
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
    
    const detectedKeys = new Set();
    
    // Search for all patterns
    keyPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(workflowString)) !== null) {
        const keyName = match[1];
        
        // Check if it should be excluded
        const shouldExclude = excludePatterns.some(exclude => 
          keyName.includes(exclude)
        );
        
        if (!shouldExclude) {
          detectedKeys.add(keyName);
        }
      }
    });
    
    return Array.from(detectedKeys).sort();
  } catch (error) {
    console.error('Error detecting developer keys:', error);
    return [];
  }
}
