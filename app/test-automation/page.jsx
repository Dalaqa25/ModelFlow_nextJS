'use client';

import { useState, useEffect } from 'react';

export default function TestAutomationPage() {
  const [userId, setUserId] = useState('');
  const [automationId, setAutomationId] = useState('');
  const [configJson, setConfigJson] = useState('');
  const [backendLoading, setBackendLoading] = useState(false);
  const [connectingGoogle, setConnectingGoogle] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [backendResult, setBackendResult] = useState('');
  const [tokensConnected, setTokensConnected] = useState(false);

  // Listen for OAuth popup messages
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data.type === 'google_connected') {
        if (event.data.success) {
          setSuccess('Google connected! Tokens saved to database.');
          setTokensConnected(true);
          setConnectingGoogle(false);
        } else {
          setError(event.data.error || 'Failed to connect Google');
          setConnectingGoogle(false);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleConnectGoogle = () => {
    if (!userId || !automationId) {
      setError('Please enter User ID and Automation ID first');
      return;
    }

    setConnectingGoogle(true);
    setError('');
    setSuccess('');

    // Open OAuth popup with both user_id and automation_id
    const width = 600;
    const height = 700;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    window.open(
      `/api/auth/google?automation_id=${automationId}&user_id=${userId}`,
      'Google OAuth',
      `width=${width},height=${height},left=${left},top=${top}`
    );
  };

  const handleSendToBackend = async () => {
    if (!userId || !automationId) {
      setError('Please enter User ID and Automation ID');
      return;
    }

    if (!tokensConnected) {
      setError('Please connect Google first to get tokens');
      return;
    }

    if (!configJson) {
      setError('Please enter config JSON');
      return;
    }

    setBackendLoading(true);
    setError('');
    setBackendResult('');
    setSuccess('');

    try {
      // Parse the config JSON
      let config;
      try {
        config = JSON.parse(configJson);
      } catch (e) {
        throw new Error('Invalid JSON in config field');
      }

      // Fetch tokens from database
      const tokenResponse = await fetch(`/api/user/tokens?user_id=${userId}&automation_id=${automationId}`);
      const tokenData = await tokenResponse.json();

      if (!tokenResponse.ok) {
        throw new Error(tokenData.error || 'Failed to fetch tokens');
      }

      // Add tokens to config
      config.access_token = tokenData.access_token;
      config.refresh_token = tokenData.refresh_token;

      // Send to localhost:3001
      const response = await fetch('http://localhost:3001/api/automations/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          automation_id: automationId,
          user_id: userId,
          config: config
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Backend request failed');
      }

      setBackendResult(JSON.stringify(result, null, 2));
      setSuccess('Successfully sent to backend!');
    } catch (err) {
      setError(err.message);
    } finally {
      setBackendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Test Automation Runner
        </h1>

        <div className="space-y-4">
          <div>
            <label htmlFor="userId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              User ID
            </label>
            <input
              id="userId"
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Enter user UUID"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label htmlFor="automationId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Automation ID
            </label>
            <input
              id="automationId"
              type="text"
              value={automationId}
              onChange={(e) => setAutomationId(e.target.value)}
              placeholder="Enter automation UUID"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label htmlFor="configJson" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Config (JSON)
            </label>
            <textarea
              id="configJson"
              value={configJson}
              onChange={(e) => setConfigJson(e.target.value)}
              placeholder='{"folder_id": "1ctvO0jtAqUFAFfyzimo5NjPD7KSKRpE_", "spreadsheet_id": "1k0pOYA5RLzNXrTfgPP9naaUHjdcYu3r6uYR1FwZp-fQ", "billing_email": "test@example.com"}'
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white font-mono text-sm"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
            </div>
          )}

          <button
            onClick={handleConnectGoogle}
            disabled={connectingGoogle || !userId || !automationId || tokensConnected}
            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {connectingGoogle ? (
              'Connecting...'
            ) : tokensConnected ? (
              <>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Google Connected
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Connect Google
              </>
            )}
          </button>

          <button
            onClick={handleSendToBackend}
            disabled={backendLoading || !tokensConnected}
            className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
          >
            {backendLoading ? 'Sending...' : 'Send to Backend (localhost:3001)'}
          </button>

          {backendResult && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Backend Response:
              </h4>
              <pre className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-xs text-gray-800 dark:text-gray-200 overflow-auto max-h-64">
                {backendResult}
              </pre>
            </div>
          )}
        </div>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-xs text-blue-600 dark:text-blue-400">
            <strong>Test Backend:</strong> This sends a POST request to http://localhost:3001/api/automations/run with automation_id, user_id, and config.
          </p>
        </div>
      </div>
    </div>
  );
}
