/**
 * n8n API Client
 * Handles all interactions with n8n REST API
 */

const N8N_BASE_URL = process.env.N8N_BASE_URL;
const N8N_API_KEY = process.env['X-N8N-API-KEY'];

class N8nClient {
  constructor() {
    if (!N8N_BASE_URL || !N8N_API_KEY) {
      throw new Error('n8n configuration missing. Set N8N_BASE_URL and X-N8N-API-KEY');
    }
    this.baseUrl = N8N_BASE_URL;
    this.apiKey = N8N_API_KEY;
  }

  /**
   * Make a request to n8n API
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}/api/v1${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': this.apiKey,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `n8n API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get all workflows
   */
  async getWorkflows() {
    return this.request('/workflows');
  }

  /**
   * Get a specific workflow by ID
   */
  async getWorkflow(workflowId) {
    return this.request(`/workflows/${workflowId}`);
  }

  /**
   * Create a new workflow
   */
  async createWorkflow(workflowData) {
    return this.request('/workflows', {
      method: 'POST',
      body: JSON.stringify(workflowData),
    });
  }

  /**
   * Update an existing workflow
   */
  async updateWorkflow(workflowId, workflowData) {
    return this.request(`/workflows/${workflowId}`, {
      method: 'PUT',
      body: JSON.stringify(workflowData),
    });
  }

  /**
   * Delete a workflow
   */
  async deleteWorkflow(workflowId) {
    return this.request(`/workflows/${workflowId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Activate a workflow
   */
  async activateWorkflow(workflowId) {
    // n8n uses PATCH to update the active status
    return this.request(`/workflows/${workflowId}`, {
      method: 'PATCH',
      body: JSON.stringify({ active: true }),
    });
  }

  /**
   * Deactivate a workflow
   */
  async deactivateWorkflow(workflowId) {
    // n8n uses PATCH to update the active status
    return this.request(`/workflows/${workflowId}`, {
      method: 'PATCH',
      body: JSON.stringify({ active: false }),
    });
  }

  /**
   * Execute a workflow
   */
  async executeWorkflow(workflowId, data = {}) {
    return this.request(`/workflows/${workflowId}/execute`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Get workflow executions
   */
  async getExecutions(workflowId) {
    return this.request(`/executions?workflowId=${workflowId}`);
  }

  /**
   * Get credential types (for debugging)
   */
  async getCredentialTypes() {
    return this.request('/credential-types');
  }

  /**
   * Create a Google OAuth2 credential with tokens
   * Creates credentials for all Google service types
   */
  async createGoogleOAuthCredential(credentialName, tokens) {
    const { access_token, refresh_token, expires_in, scope } = tokens;

    const scopeValue = scope || 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/spreadsheets';

    const payload = {
      name: credentialName,
      type: 'googleOAuth2Api',
      data: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        // n8n schema requires these even if not used by Google
        serverUrl: '',
        sendAdditionalBodyProperties: false,
        additionalBodyProperties: '',
        scope: scopeValue, // Mandatory for googleOAuth2Api type
        oauthTokenData: {
          access_token,
          refresh_token,
          token_type: 'Bearer',
          expires_in: expires_in || 3599,
          scope: scopeValue,
        },
      },
    };

    console.log('=== CREATING N8N CREDENTIAL (FIXED) ===');
    console.log('Payload:', JSON.stringify(payload, null, 2));
    console.log('================================');

    return this.request('/credentials', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /**
   * Create multiple Google credentials for different services
   * Returns an object with credential IDs for each service type
   */
  async createAllGoogleCredentials(baseName, tokens) {
    const { access_token, refresh_token, expires_in, scope } = tokens;
    const scopeValue = scope || 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/gmail.send';

    const credentialTypes = [
      { 
        type: 'googleOAuth2Api', 
        key: 'googleOAuth2Api',
        includeScope: true // Only googleOAuth2Api accepts scope at top level
      },
      { 
        type: 'googleDriveOAuth2Api', 
        key: 'googleDriveOAuth2Api',
        includeScope: false
      },
      { 
        type: 'googleSheetsOAuth2Api', 
        key: 'googleSheetsOAuth2Api',
        includeScope: false
      },
      { 
        type: 'gmailOAuth2', 
        key: 'gmailOAuth2',
        includeScope: false
      },
    ];

    const credentials = {};

    for (const { type, key, includeScope } of credentialTypes) {
      try {
        const data = {
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          // ALL credential types need these fields
          serverUrl: '',
          sendAdditionalBodyProperties: false,
          additionalBodyProperties: '',
          oauthTokenData: {
            access_token,
            refresh_token,
            token_type: 'Bearer',
            expires_in: expires_in || 3599,
            scope: scopeValue,
          },
        };

        // Only googleOAuth2Api needs scope at top level
        if (includeScope) {
          data.scope = scopeValue;
        }

        const payload = {
          name: `${baseName} - ${type}`,
          type: type,
          data: data,
        };

        console.log(`Creating ${type} credential...`);
        const result = await this.request('/credentials', {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        const credId = result?.id || result?.data?.id;
        if (credId) {
          credentials[key] = credId.toString();
          console.log(`✓ Created ${type}: ${credId}`);
        }
      } catch (error) {
        console.error(`Failed to create ${type}:`, error.message);
        // Continue with other types even if one fails
      }
    }

    return credentials;
  }

  /**
   * Get all credentials
   */
  async getCredentials() {
    return this.request('/credentials');
  }

  /**
   * Get a specific credential by ID
   */
  async getCredential(credentialId) {
    return this.request(`/credentials/${credentialId}`);
  }

  /**
   * Delete a credential
   */
  async deleteCredential(credentialId) {
    return this.request(`/credentials/${credentialId}`, {
      method: 'DELETE',
    });
  }
}

// Export singleton instance
export const n8nClient = new N8nClient();

// Export class for testing
export default N8nClient;
