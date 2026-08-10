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
  // Which account was actually connected. Worth stating even when it is the
  // expected one: "Gmail" alone never told anybody which mailbox they just
  // handed over, and there is no other point in the product where they find
  // out.
  const [accountNotice, setAccountNotice] = useState(null);
  const [manualRequest, setManualRequest] = useState(null);
  const [manualValues, setManualValues] = useState({});
  const [localActivepiecesConnections, setLocalActivepiecesConnections] = useState(activepiecesConnections);

  useEffect(() => {
    setLocalActivepiecesConnections((current) => {
      const currentSignature = JSON.stringify(current || []);
      const nextSignature = JSON.stringify(activepiecesConnections || []);
      return currentSignature === nextSignature ? current : activepiecesConnections;
    });
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

  const inferredActivepiecesEngine = engine === 'activepieces'
    || localActivepiecesConnections.length > 0
    || (automationId && /[-\s]|sheet|notion|slack|gmail|calendar|hubspot|drive|discord|stripe|salesforce|clickup|trello|airtable/i.test(String(provider || '')));

  const activepiecesTarget = getNextActivepiecesConnection(localActivepiecesConnections);
  const activepiecesLabel = activepiecesTarget?.displayName || provider || 'App';
  const providerKey = inferredActivepiecesEngine ? getProviderKey(activepiecesLabel) : provider;
  const config = providerConfig[providerKey] || providerConfig.activepieces;
  const connectedCount = useMemo(
    () => localActivepiecesConnections.filter((connection) => connection.connected).length,
    [localActivepiecesConnections]
  );
  const allActivepiecesConnected = useMemo(
    () => (
      inferredActivepiecesEngine &&
      localActivepiecesConnections.length > 0 &&
      localActivepiecesConnections.every((connection) => connection.connected)
    ),
    [inferredActivepiecesEngine, localActivepiecesConnections]
  );

  const refreshActivepiecesRequirements = async ({ setBusy = false } = {}) => {
    if (!inferredActivepiecesEngine || !automationId) return null;

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
    if (!inferredActivepiecesEngine || !automationId) return;
    refreshActivepiecesRequirements().catch((error) => {
      console.error('Failed to refresh app connection requirements:', error);
    });
  }, [inferredActivepiecesEngine, automationId]);

  const applyActivepiecesCompletion = (completedLabel, result) => {
    const nextRequirements = Array.isArray(result?.requirements) ? result.requirements : [];
    setAccountNotice(result?.accountNotice || null);

    if (nextRequirements.length > 0) {
      setLocalActivepiecesConnections(nextRequirements);
      const nextMissing = nextRequirements.find((connection) => !connection.connected);

      if (nextMissing) {
        setConnectionSuccess(`${completedLabel} connected. Next: ${getConnectionLabel(nextMissing)}.`);
        return;
      }
    }

    setConnectionSuccess(`${completedLabel} connected. All required apps are ready.`);
    onConnect?.(completedLabel);
  };

  const openOAuthPopup = (authorizationUrl, redirectUrl) => {
    const width = 600;
    const height = 800;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    const popup = window.open(
      authorizationUrl,
      'modelgrow-oauth',
      `width=${width},height=${height},left=${left},top=${top},resizable=no,toolbar=no,menubar=no,status=no`
    );

    return new Promise((resolve, reject) => {
      if (!popup) {
        reject(new Error('Popup was blocked. Please allow popups and try again.'));
        return;
      }

      const expectedOrigin = (() => {
        try {
          return redirectUrl ? new URL(redirectUrl).origin : null;
        } catch (_) {
          return null;
        }
      })();

      const handleMessage = (event) => {
        if (expectedOrigin && event.origin !== expectedOrigin) return;

        const isModelGrowCallback = event.data?.type === 'modelgrow_activepieces_oauth';
        if (!isModelGrowCallback && !event.data?.code) return;

        window.removeEventListener('message', handleMessage);
        clearInterval(checkPopup);
        popup.close();

        if (event.data?.error) {
          reject(new Error(event.data.errorDescription || event.data.error || 'Connection authorization failed.'));
          return;
        }

        if (!event.data?.code) {
          reject(new Error('Connection authorization did not return a code.'));
          return;
        }

        resolve(decodeURIComponent(event.data.code));
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
    setAccountNotice(null);
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
        onConnect?.(activepiecesLabel);
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
    setAccountNotice(null);

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
    if (inferredActivepiecesEngine) {
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

  const showConnectButton = !inferredActivepiecesEngine || !allActivepiecesConnected;

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
            {inferredActivepiecesEngine
              ? isConnecting ? `Connecting ${activepiecesLabel}...` : `Connect ${activepiecesLabel}`
              : isConnecting ? `Connecting to ${config.name}...` : `Connect ${config.name}`}
          </span>
        </button>
      )}

      {manualRequest && (
        <form onSubmit={handleManualSubmit} className="max-w-md rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="mb-3">
            <p className="text-sm font-semibold text-slate-900">Connect {manualRequest.displayName}</p>
            <p className="text-xs text-slate-500">Stored securely for this ModelGrow automation.</p>
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

      {/* Naming the account is the whole point: a consent screen hands over
          whichever Google account the browser happens to be signed into, and
          "Gmail connected" reads identically whether it was the right mailbox
          or someone else's. A mismatch is loud but not treated as an error —
          automating a work account from a personal login is normal, so this
          says what happened and leaves the judgement to the reader. */}
      {accountNotice?.account && (
        <div
          className={`max-w-md rounded-xl border px-4 py-3 text-sm ${
            accountNotice.matchesSignedInUser === false
              ? 'border-amber-300/50 bg-amber-500/10 text-amber-100'
              : 'border-slate-300/30 bg-slate-500/10 text-slate-200'
          }`}
        >
          {accountNotice.matchesSignedInUser === false ? (
            <>
              <p className="font-semibold">
                You connected {accountNotice.account}
              </p>
              <p className="mt-1 opacity-90">
                That is not the account you signed in with. This automation will
                work on {accountNotice.account} — if you meant a different one,
                disconnect and connect again from that account.
              </p>
            </>
          ) : (
            <p>
              Connected as <span className="font-semibold">{accountNotice.account}</span>
            </p>
          )}
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
