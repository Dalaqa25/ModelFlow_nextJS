'use client';

import { useState, useEffect } from 'react';

export default function TestN8nPage() {
  const [automationId, setAutomationId] = useState('');
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [connectingOAuth, setConnectingOAuth] = useState(false);
  const [credentialConnected, setCredentialConnected] = useState(false);
  
  // Parameters for Invoice Manager
  const [folderId, setFolderId] = useState('');
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [billingEmail, setBillingEmail] = useState('');

  useEffect(() => {
    // Listen for OAuth popup messages
    const handleMessage = (event) => {
      if (event.data.type === 'automation_connected') {
        if (event.data.success) {
          setCredentialConnected(true);
          setConnectingOAuth(false);
          setError(null);
        } else {
          setError(event.data.error || 'Failed to connect Google');
          setConnectingOAuth(false);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleConnectGoogle = async () => {
    if (!automationId) {
      setError('Please enter Automation ID first');
      return;
    }

    setConnectingOAuth(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/google/connect-automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ automationId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to initiate OAuth');
      }

      // Open OAuth popup
      const popup = window.open(
        data.authUrl,
        'Google OAuth',
        'width=600,height=700,left=200,top=100'
      );

      if (!popup) {
        throw new Error('Popup blocked. Please allow popups for this site.');
      }

    } catch (err) {
      setError(err.message);
      setConnectingOAuth(false);
    }
  };

  const handleActivate = async () => {
    if (!automationId || !folderId || !spreadsheetId || !billingEmail) {
      setError('All fields are required');
      return;
    }

    if (!credentialConnected) {
      setError('Please connect Google first');
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await fetch('/api/automations/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          automationId,
          parameters: {
            folder_id: folderId,
            spreadsheet_id: spreadsheetId,
            billing_email: billingEmail,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to activate automation');
      }

      setResponse(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Test Multi-Tenant Automation Flow</h1>

        <div className="bg-slate-800 rounded-lg p-6 space-y-6">
          {/* Step 1: Automation ID */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Step 1: Enter Automation ID</h2>
            <input
              type="text"
              value={automationId}
              onChange={(e) => setAutomationId(e.target.value)}
              placeholder="Enter automation ID from database"
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Step 2: Connect OAuth */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Step 2: Connect Google</h2>
            <button
              onClick={handleConnectGoogle}
              disabled={connectingOAuth || credentialConnected || !automationId}
              className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white font-medium rounded-lg transition"
            >
              {connectingOAuth ? 'Connecting...' : credentialConnected ? '✓ Google Connected' : 'Connect Google OAuth'}
            </button>
          </div>

          {/* Step 3: Parameters */}
          {credentialConnected && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white mb-4">Step 3: Fill Parameters</h2>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Google Drive Folder ID
                </label>
                <input
                  type="text"
                  value={folderId}
                  onChange={(e) => setFolderId(e.target.value)}
                  placeholder="e.g., 1a2b3c4d5e6f7g8h9i0j"
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Google Sheets Spreadsheet ID
                </label>
                <input
                  type="text"
                  value={spreadsheetId}
                  onChange={(e) => setSpreadsheetId(e.target.value)}
                  placeholder="e.g., 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Billing Team Email
                </label>
                <input
                  type="email"
                  value={billingEmail}
                  onChange={(e) => setBillingEmail(e.target.value)}
                  placeholder="billing@company.com"
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={handleActivate}
                disabled={loading}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-medium rounded-lg transition"
              >
                {loading ? 'Activating...' : 'Activate Automation'}
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-6 bg-red-900/50 border border-red-700 rounded-lg p-4">
            <h3 className="text-red-400 font-semibold mb-2">Error</h3>
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {response && (
          <div className="mt-6 bg-green-900/50 border border-green-700 rounded-lg p-4">
            <h3 className="text-green-400 font-semibold mb-2">Success!</h3>
            <div className="space-y-2 text-sm">
              <p className="text-slate-300">
                <span className="font-medium">Workflow ID:</span>{' '}
                <span className="text-white">{response.workflowId}</span>
              </p>
              <p className="text-slate-300">
                <span className="font-medium">Workflow Name:</span>{' '}
                <span className="text-white">{response.workflowName}</span>
              </p>
              <p className="text-slate-300">
                <span className="font-medium">Status:</span>{' '}
                <span className="text-white">{response.message}</span>
              </p>
            </div>
            
            <details className="mt-4">
              <summary className="cursor-pointer text-slate-400 hover:text-slate-300">
                View Full Response
              </summary>
              <pre className="mt-2 p-3 bg-slate-950 rounded text-xs text-slate-300 overflow-auto">
                {JSON.stringify(response, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}
