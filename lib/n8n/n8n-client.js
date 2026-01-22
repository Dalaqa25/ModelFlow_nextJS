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
}

// Export singleton instance
export const n8nClient = new N8nClient();

// Export class for testing
export default N8nClient;
