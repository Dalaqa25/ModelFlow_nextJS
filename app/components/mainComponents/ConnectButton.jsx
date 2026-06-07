'use client';

import { useEffect, useMemo, useState } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { FaTiktok, FaLinkedin, FaPlug } from 'react-icons/fa';

function getProviderKey(label = '') {
  const normalized = String(label).toLowerCase();
  if (normalized.includes('google') || normalized.includes('sheet') || normalized.includes('gmail') || normalized.includes('drive')) return 'google';
  if (normalized.includes('tiktok')) return 'tiktok';
  if (normalized.includes('linkedin')) return 'linkedin';
  return 'activepieces';
}

function getNextActivepiecesConnection(connections = []) {
  return connections.find((connection) => !connection.connected) || null;
}

function getConnectionLabel(connection) {
  return connection?.displayName || connection?.pieceName || 'required app';
}

export default function ConnectButton({ provider, automationId, userId, onConnect, engine, activepiecesConnections = [] }) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState('');
  const [connectionSuccess, setConnectionSuccess] = useState('');
  const [manualRequest, setManualRequest] = useState(null);
  const [manualValues, setManualValues] = useState({});
  const [localActivepiecesConnections, setLocalActivepiecesConnections] = useState(activepiecesConnections);
  const [runResult, setRunResult] = useState(null);

  useEffect(() => {
    setLocalActivepiecesConnections(activepiecesConnections);
  }, [activepiecesConnections]);

  const providerConfig = {
    google: {
      name: 'Google',
      icon: <FcGoogle size={20} />,
      color: 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:shadow-sm',
    },
    tiktok: {
      name: 'TikTok',
      icon: <FaTiktok size={20} />,
      color: 'bg-black text-white hover:bg-gray-800 border border-transparent shadow-sm',
    },
    linkedin: {
      name: 'LinkedIn',
      icon: <FaLinkedin size={20} />,
      color: 'bg-[#0077b5] text-white btn-white-text hover:bg-[#006396] border border-transparent shadow-sm',
    },
    activepieces: {
      name: provider || 'App',
      icon: <FaPlug size={18} />,
      color: 'bg-slate-950 text-white hover:bg-slate-800 border border-slate-700 shadow-sm',
    },
    // Add more providers as needed
  };

  const activepiecesTarget = getNextActivepiecesConnection(localActivepiecesConnections);
  const activepiecesLabel = activepiecesTarget?.displayName || provider || 'App';
  const providerKey = engine === 'activepieces' ? getProviderKey(activepiecesLabel) : provider;
  const config = providerConfig[providerKey] || providerConfig.activepieces;
  const connectedCount = useMemo(
    () => localActivepiecesConnections.filter((connection) => connection.connected).length,
    [localActivepiecesConnections]
  );
  const allActivepiecesConnected = useMemo(
    () => (
      engine === 'activepieces' &&
      localActivepiecesConnections.length > 0 &&
      localActivepiecesConnections.every((connection) => connection.connected)
    ),
    [engine, localActivepiecesConnections]
  );

  const refreshActivepiecesRequirements = async ({ setBusy = false } = {}) => {
    if (engine !== 'activepieces' || !automationId) return null;

    if (setBusy) setIsConnecting(true);
    try {
      const response = await fetch('/api/activepieces/connections/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ automationId }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Failed to refresh connection status');

      if (Array.isArray(data.requirements)) {
        setLocalActivepiecesConnections(data.requirements);
      }

      return Array.isArray(data.requirements) ? data.requirements : [];
    } finally {
      if (setBusy) setIsConnecting(false);
    }
  };

  useEffect(() => {
    if (engine !== 'activepieces' || !automationId) return;
    refreshActivepiecesRequirements().catch((error) => {
      console.error('Failed to refresh Activepieces requirements:', error);
    });
  }, [engine, automationId]);

  const applyActivepiecesCompletion = (completedLabel, result) => {
    const nextRequirements = Array.isArray(result?.requirements) ? result.requirements : [];

    if (nextRequirements.length > 0) {
      setLocalActivepiecesConnections(nextRequirements);
      const nextMissing = nextRequirements.find((connection) => !connection.connected);

      if (nextMissing) {
        setConnectionSuccess(`${completedLabel} connected. Next: ${getConnectionLabel(nextMissing)}.`);
        return;
      }
    }

    setConnectionSuccess(`${completedLabel} connected. All required apps are ready.`);
  };

  const openOAuthPopup = (authorizationUrl, redirectUrl) => {
    const width = 600;
    const height = 800;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    const popup = window.open(
      authorizationUrl,
      'activepieces-oauth',
      `width=${width},height=${height},left=${left},top=${top},resizable=no,toolbar=no,menubar=no,status=no`
    );

    return new Promise((resolve, reject) => {
      if (!popup) {
        reject(new Error('Popup was blocked. Please allow popups and try again.'));
        return;
      }

      const handleMessage = (event) => {
        if (redirectUrl && redirectUrl.startsWith(event.origin) && event.data?.code) {
          window.removeEventListener('message', handleMessage);
          clearInterval(checkPopup);
          popup.close();
          resolve(decodeURIComponent(event.data.code));
        }
      };

      const checkPopup = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkPopup);
          window.removeEventListener('message', handleMessage);
          reject(new Error('Connection popup was closed before finishing.'));
        }
      }, 500);

      window.addEventListener('message', handleMessage);
    });
  };

  const completeActivepiecesConnection = async (payload) => {
    const response = await fetch('/api/activepieces/connections/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Failed to save connection');
    return data;
  };

  const handleActivepiecesConnect = async () => {
    setIsConnecting(true);
    setConnectionError('');
    setConnectionSuccess('');
    setManualRequest(null);

    try {
      const response = await fetch('/api/activepieces/connections/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          automationId,
          externalId: activepiecesTarget?.externalId || undefined,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Failed to start connection');

      if (data.type === 'complete') {
        setConnectionSuccess('All required apps are already connected.');
        if (Array.isArray(data.requirements) && data.requirements.length > 0) {
          setLocalActivepiecesConnections(data.requirements);
        }
        return;
      }

      if (data.type === 'manual') {
        setManualRequest(data);
        setManualValues({});
        return;
      }

      if (data.type === 'no_auth') {
        const result = await completeActivepiecesConnection({
          automationId,
          externalId: data.externalId,
          pieceName: data.pieceName,
          pieceVersion: data.pieceVersion,
          values: {},
        });
        applyActivepiecesCompletion(data.displayName || activepiecesLabel, result);
        return;
      }

      if (data.type !== 'oauth' || !data.authorizationUrl) {
        throw new Error(`${data.displayName || activepiecesLabel} cannot be connected automatically yet.`);
      }

      const code = await openOAuthPopup(data.authorizationUrl, data.redirectUrl);
      const result = await completeActivepiecesConnection({
        automationId,
        externalId: data.externalId,
        pieceName: data.pieceName,
        pieceVersion: data.pieceVersion,
        clientId: data.clientId,
        code,
        codeVerifier: data.codeVerifier,
        scope: data.scope,
        authorizationMethod: data.authorizationMethod,
        props: data.props || {},
      });
      applyActivepiecesCompletion(data.displayName || activepiecesLabel, result);
    } catch (error) {
      setConnectionError(error.message || 'Connection failed');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleManualSubmit = async (event) => {
    event.preventDefault();
    if (!manualRequest) return;

    setIsConnecting(true);
    setConnectionError('');
    setConnectionSuccess('');

    try {
      const result = await completeActivepiecesConnection({
        automationId,
        externalId: manualRequest.externalId,
        pieceName: manualRequest.pieceName,
        pieceVersion: manualRequest.pieceVersion,
        values: manualValues,
      });
      const completedLabel = manualRequest.displayName || activepiecesLabel;
      setManualRequest(null);
      setManualValues({});
      applyActivepiecesCompletion(completedLabel, result);
    } catch (error) {
      setConnectionError(error.message || 'Connection failed');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleConnect = async () => {
    if (engine === 'activepieces') {
      await handleActivepiecesConnect();
      return;
    }

    setIsConnecting(true);
    try {
      // Trigger OAuth flow with automation_id if provided
      const width = 500;
      const height = 600;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      let url = `/api/auth/${provider}`;
      const params = new URLSearchParams();
      if (automationId) params.set('automation_id', automationId);
      if (userId) params.set('user_id', userId);
      if (params.toString()) url += `?${params.toString()}`;

      const popup = window.open(
        url,
        'oauth',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // Listen for OAuth completion message from popup
      const handleMessage = (event) => {
        if (event.data?.type === `${provider}_connected` || event.data?.type === 'google_connected' || event.data?.type === 'tiktok_connected') {
          window.removeEventListener('message', handleMessage);
          setIsConnecting(false);
          if (event.data.success) {
            onConnect?.(provider);
          }
        }
      };
      window.addEventListener('message', handleMessage);

      // Also check if popup was closed manually (fallback)
      const checkPopup = setInterval(() => {
        if (popup && popup.closed) {
          clearInterval(checkPopup);
          // Give a moment for message to arrive
          setTimeout(() => {
            window.removeEventListener('message', handleMessage);
            setIsConnecting(false);
          }, 500);
        }
      }, 500);
    } catch (error) {
      setIsConnecting(false);
    }
  };

  const handleRunActivepiecesAutomation = async () => {
    setIsConnecting(true);
    setConnectionError('');
    setRunResult(null);

    try {
      const latestRequirements = await refreshActivepiecesRequirements();
      const missing = latestRequirements?.find((connection) => !connection.connected);

      if (missing) {
        throw new Error(`Please reconnect ${getConnectionLabel(missing)} before running this automation.`);
      }

      const response = await fetch('/api/automations/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          automation_id: automationId,
          config: {},
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.success === false) {
        throw new Error(data.message || data.error || 'Failed to run automation');
      }

      setRunResult(data);
      setConnectionSuccess(data.message || 'Automation started successfully.');
    } catch (error) {
      setConnectionError(error.message || 'Failed to run automation');
    } finally {
      setIsConnecting(false);
    }
  };

  const showConnectButton = engine !== 'activepieces' || !allActivepiecesConnected;

  return (
    <div className="space-y-3">
      {showConnectButton && (
        <button
          onClick={handleConnect}
          disabled={isConnecting}
          className={`
            inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium
            transition-all duration-200 shadow-md
            ${config.color}
            ${isConnecting ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'}
          `}
        >
          <span className="text-xl">{config.icon}</span>
          <span>
            {engine === 'activepieces'
              ? isConnecting ? `Connecting ${activepiecesLabel}...` : `Connect ${activepiecesLabel}`
              : isConnecting ? `Connecting to ${config.name}...` : `Connect ${config.name}`}
          </span>
        </button>
      )}

      {allActivepiecesConnected && (
        <button
          onClick={handleRunActivepiecesAutomation}
          disabled={isConnecting}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-fuchsia-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-purple-950/25 transition hover:-translate-y-0.5 hover:shadow-purple-900/35 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <FaPlug size={16} />
          <span>{isConnecting ? 'Starting automation...' : 'Run automation'}</span>
        </button>
      )}

      {manualRequest && (
        <form onSubmit={handleManualSubmit} className="max-w-md rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="mb-3">
            <p className="text-sm font-semibold text-slate-900">Connect {manualRequest.displayName}</p>
            <p className="text-xs text-slate-500">Stored encrypted inside the user&apos;s Activepieces project.</p>
          </div>
          <div className="space-y-3">
            {(manualRequest.auth?.fields || []).map((field) => (
              <label key={field.name} className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-600">{field.label}</span>
                <input
                  type={field.type || 'text'}
                  value={manualValues[field.name] || ''}
                  onChange={(event) => setManualValues((current) => ({ ...current, [field.name]: event.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                  required={field.required !== false}
                />
              </label>
            ))}
          </div>
          <button
            type="submit"
            disabled={isConnecting}
            className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
          >
            Save connection
          </button>
        </form>
      )}

      {connectionError && (
        <div className="max-w-md rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {connectionError}
        </div>
      )}

      {connectionSuccess && (
        <div className="max-w-md rounded-xl border border-emerald-300/40 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-200">
          {connectionSuccess}
        </div>
      )}

      {runResult && (
        <div className="max-w-md rounded-xl border border-purple-300/30 bg-purple-500/10 px-4 py-3 text-sm font-medium text-purple-100">
          Activepieces run status: {runResult?.result?.activepieces?.runStatus || 'started'}
        </div>
      )}

      {engine === 'activepieces' && localActivepiecesConnections.length > 0 && (
        <p className="text-xs text-slate-300/80">
          {connectedCount}/{localActivepiecesConnections.length} required apps connected
        </p>
      )}
    </div>
  );
}
