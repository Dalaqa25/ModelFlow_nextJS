'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Loader2,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  Trash2,
  Zap,
} from 'lucide-react';
import { useThemeAdaptive } from '@/lib/contexts/theme-adaptive-context';
import { useAuth } from '@/lib/auth/supabase-auth-context';
import { safeApiFetch } from '@/lib/http/safe-api-fetch';

function formatRelativeTime(value) {
  if (!value) return 'Never';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';

  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60_000);
  const hours = Math.floor(diffMs / 3_600_000);
  const days = Math.floor(diffMs / 86_400_000);

  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getRuntimeLabel(status) {
  if (!status) return { label: 'Checking', tone: 'neutral', icon: Clock3 };
  if (status.duplicateListenerRisk?.detected) {
    return { label: 'May be running twice', tone: 'warning', icon: AlertTriangle };
  }
  if (status.latestRun?.success) return { label: 'Working normally', tone: 'success', icon: CheckCircle2 };
  if (['error', 'unavailable'].includes(status.state)) {
    return { label: 'Temporarily unreachable', tone: 'danger', icon: AlertTriangle };
  }
  if (status.latestRun?.errorMessage) {
    return status.active
      ? { label: 'On, but last one failed', tone: 'warning', icon: AlertTriangle }
      : { label: 'Last one had a problem', tone: 'danger', icon: AlertTriangle };
  }
  if (status.state === 'running' || status.latestRun?.processing) {
    return { label: 'Working right now', tone: 'info', icon: Loader2, spin: true };
  }
  if (status.active) return { label: 'On and watching', tone: 'success', icon: Activity };
  return { label: 'Paused', tone: 'neutral', icon: Clock3 };
}

function getTriggerDelayHint(trigger) {
  const app = String(trigger?.app || '').toLowerCase();
  const pieceName = String(trigger?.pieceName || '').toLowerCase();
  const event = String(trigger?.event || '').toLowerCase();

  if (app.includes('gmail') || pieceName.includes('gmail')) {
    return 'Gmail can take a few minutes to trigger.';
  }

  if (event.includes('new_attachment')) {
    return 'Attachment triggers can take a few minutes.';
  }

  return '';
}

function toneClass(tone, isDarkMode) {
  if (tone === 'success') {
    return isDarkMode ? 'text-emerald-300 bg-emerald-500/10 border-emerald-400/20' : 'text-emerald-700 bg-emerald-50 border-emerald-200';
  }
  if (tone === 'danger') {
    return isDarkMode ? 'text-red-300 bg-red-500/10 border-red-400/20' : 'text-red-700 bg-red-50 border-red-200';
  }
  if (tone === 'warning') {
    return isDarkMode ? 'text-amber-300 bg-amber-500/10 border-amber-400/20' : 'text-amber-700 bg-amber-50 border-amber-200';
  }
  if (tone === 'info') {
    return isDarkMode ? 'text-blue-300 bg-blue-500/10 border-blue-400/20' : 'text-blue-700 bg-blue-50 border-blue-200';
  }
  return isDarkMode ? 'text-slate-400 bg-white/5 border-white/10' : 'text-slate-600 bg-slate-100 border-slate-200';
}

function RuntimeInlineStatus({ automationId, isDarkMode, refreshKey = 0 }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadStatus = useCallback(async () => {
    if (!automationId) return;
    setLoading(true);
    setError('');

    try {
      const response = await safeApiFetch(`/api/automations/${automationId}/runtime-status`, {
        headers: { Accept: 'application/json' },
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'Could not load status');
      setStatus(payload);
    } catch (err) {
      setError(err.message || 'Could not load status');
    } finally {
      setLoading(false);
    }
  }, [automationId]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus, refreshKey]);

  const activationTime = status?.runtimeFlow?.activatedAt
    ? new Date(status.runtimeFlow.activatedAt).getTime()
    : 0;
  const recentRuns = (status?.recentRuns || []).filter((run) => {
    if (!activationTime) return true;
    const runTime = new Date(run.createdAt || run.updatedAt || 0).getTime();
    return runTime >= activationTime;
  });
  const currentStatus = status
    ? { ...status, latestRun: recentRuns[0] || null, recentRuns }
    : null;
  const successCount = recentRuns.filter((run) => run.success).length;
  const failedCount = recentRuns.filter((run) => ['FAILED', 'INTERNAL_ERROR', 'TIMEOUT'].includes(run.status)).length;
  const label = getRuntimeLabel(loading ? { state: 'running' } : currentStatus);
  const Icon = label.icon;
  const triggerDelayHint = getTriggerDelayHint(currentStatus?.trigger);

  return (
    <div className={`mt-3 rounded-xl border p-3 ${
      isDarkMode ? 'border-white/8 bg-black/15' : 'border-slate-200 bg-slate-50'
    }`}>
      <div className="flex items-center justify-between gap-2">
        <span className={`inline-flex min-w-0 items-center gap-1.5 rounded-full border px-2 py-1 text-xs font-bold ${toneClass(label.tone, isDarkMode)}`}>
          <Icon className={`h-3.5 w-3.5 ${label.spin || loading ? 'animate-spin' : ''}`} />
          <span className="truncate">{loading ? 'Checking' : label.label}</span>
        </span>
        <button
          type="button"
          onClick={loadStatus}
          disabled={loading}
          className={`rounded-lg p-1.5 transition disabled:opacity-50 ${
            isDarkMode ? 'hover:bg-white/8 text-slate-400' : 'hover:bg-white text-slate-500'
          }`}
          aria-label="Refresh automation status"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error ? (
        <p className={`mt-2 text-xs leading-5 ${isDarkMode ? 'text-red-300' : 'text-red-600'}`}>{error}</p>
      ) : currentStatus?.duplicateListenerRisk?.message ? (
        <p className={`mt-2 rounded-lg border px-2.5 py-2 text-xs leading-5 ${
          isDarkMode ? 'border-amber-400/20 bg-amber-500/10 text-amber-200' : 'border-amber-200 bg-amber-50 text-amber-700'
        }`}>
          {currentStatus.duplicateListenerRisk.message}
        </p>
      ) : (
        <div className={`mt-2 grid grid-cols-3 gap-2 text-center text-xs ${
          isDarkMode ? 'text-slate-300' : 'text-slate-600'
        }`}>
          <div>
            <p className="text-[10px] uppercase tracking-wider opacity-60">Times run</p>
            <p className="font-black">{recentRuns.length}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider opacity-60">Worked</p>
            <p className="font-black">{successCount}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider opacity-60">Problems</p>
            <p className="font-black">{failedCount}</p>
          </div>
        </div>
      )}

      <p className={`mt-2 truncate text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
        Last time: {currentStatus?.latestRun
          ? `${currentStatus.latestRun.success ? 'Worked' : currentStatus.latestRun.processing ? 'Still working' : 'Had a problem'} · ${formatRelativeTime(currentStatus.latestRun.createdAt)}`
          : 'Has not run yet'}
      </p>
      {triggerDelayHint && (
        <p className={`mt-1 text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>
          {triggerDelayHint}
        </p>
      )}
      {currentStatus?.latestRun?.failedStep?.displayName && (
        <p className={`mt-1 text-xs ${isDarkMode ? 'text-red-300' : 'text-red-600'}`}>
          Failed step: {currentStatus.latestRun.failedStep.displayName}
        </p>
      )}
    </div>
  );
}

export default function AutomationMonitorDropdown() {
  const { isDarkMode } = useThemeAdaptive();
  const { isAuthenticated, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [automations, setAutomations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [removingId, setRemovingId] = useState(null);
  const [statusRefreshKey, setStatusRefreshKey] = useState(0);
  const [error, setError] = useState('');
  // Shown once, when an automation first starts running on its own.
  const [showHandoff, setShowHandoff] = useState(false);
  const wrapperRef = useRef(null);

  const loadAutomations = useCallback(async () => {
    if (!isAuthenticated || !user?.id) return;
    setLoading(true);
    setError('');

    try {
      const response = await safeApiFetch('/api/user/automations?limit=8', {
        headers: { Accept: 'application/json' },
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'Could not load automations');
      setAutomations(Array.isArray(payload.automations) ? payload.automations : []);
    } catch (err) {
      setError(err.message || 'Could not load automations');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user?.id]);

  // The handoff moment: an automation has just been set loose and the person
  // who set it up is still looking at the chat, not at this icon. A line of
  // chat scrolls away, so the icon speaks up once and says where the thing
  // now lives and how to stop it.
  //
  // Once per browser, deliberately. It answers "where did my automation go",
  // and a prompt that keeps reappearing after that stops being an answer and
  // becomes noise.
  useEffect(() => {
    const onBackgrounded = () => {
      loadAutomations();
      try {
        if (window.localStorage.getItem('modelgrow.automationHandoffSeen') === '1') return;
      } catch {
        // Private browsing can refuse storage; showing it again beats not at all.
      }
      setShowHandoff(true);
    };

    window.addEventListener('modelgrow:automation-backgrounded', onBackgrounded);
    return () => window.removeEventListener('modelgrow:automation-backgrounded', onBackgrounded);
  }, [loadAutomations]);

  const dismissHandoff = useCallback(() => {
    setShowHandoff(false);
    try {
      window.localStorage.setItem('modelgrow.automationHandoffSeen', '1');
    } catch {
      // Nothing to do; it simply shows again next time.
    }
  }, []);

  useEffect(() => {
    if (isOpen) loadAutomations();
  }, [isOpen, loadAutomations]);

  const toggleAutomation = useCallback(async (automation, enabled) => {
    if (!automation?.automation_id) return;
    setTogglingId(automation.automation_id);
    setError('');

    try {
      const response = await safeApiFetch(`/api/automations/${automation.automation_id}/toggle`, {
        method: 'PATCH',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'Could not update automation');

      setAutomations((previous) =>
        previous.map((item) =>
          item.automation_id === automation.automation_id
            ? {
                ...item,
                enabled,
                runtime_status: enabled ? 'active' : 'paused',
                updated_at: new Date().toISOString(),
              }
            : item
        )
      );
      setStatusRefreshKey((value) => value + 1);
    } catch (err) {
      setError(err.message || 'Could not update automation');
    } finally {
      setTogglingId(null);
    }
  }, []);

  const removeAutomation = useCallback(async (automation) => {
    if (!automation?.automation_id) return;
    const confirmed = window.confirm(`Remove "${automation.name}" from your automations? This will pause it and hide it from this list.`);
    if (!confirmed) return;

    setRemovingId(automation.automation_id);
    setError('');

    try {
      const response = await safeApiFetch(`/api/automations/${automation.automation_id}/toggle`, {
        method: 'DELETE',
        headers: { Accept: 'application/json' },
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'Could not remove automation');

      setAutomations((previous) =>
        previous.filter((item) => item.automation_id !== automation.automation_id)
      );
      setExpandedId((current) => current === automation.automation_id ? null : current);
    } catch (err) {
      setError(err.message || 'Could not remove automation');
    } finally {
      setRemovingId(null);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  if (!isAuthenticated) return null;

  const activeCount = automations.filter((automation) => automation.enabled).length;
  const hasAttention = automations.some((automation) => !automation.enabled);

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className={`workspace-icon-button relative p-2 rounded-lg transition-all ${isOpen ? 'workspace-icon-button-active' : ''}`}
        aria-label="Automation monitor"
        title="Automation monitor"
      >
        <span className="relative flex h-5 w-5 items-center justify-center">
          <span className={`absolute inset-[-5px] rounded-full bg-violet-500/10 blur-md transition-opacity ${
            activeCount > 0 ? 'opacity-100' : 'opacity-0'
          }`} />
          <span className={`absolute left-[-6px] right-[-6px] top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-violet-400/80 to-transparent ${
            activeCount > 0 ? 'opacity-70' : 'opacity-0'
          }`} />
          <span className={`absolute bottom-[-5px] left-1/2 h-[9px] w-px -translate-x-1/2 bg-gradient-to-b from-cyan-300/70 to-transparent ${
            activeCount > 0 ? 'opacity-60' : 'opacity-0'
          }`} />
          <Image
            src="/logo.png"
            alt=""
            width={24}
            height={24}
            className={`relative h-5 w-5 object-contain drop-shadow-[0_0_8px_rgba(139,92,246,0.45)] ${
              activeCount > 0 ? 'animate-[pulse_3s_ease-in-out_infinite]' : ''
            }`}
            aria-hidden="true"
          />
        </span>
        {activeCount > 0 && (
          <span className={`absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center border-2 ${
            isDarkMode ? 'border-slate-900 bg-emerald-500 text-white' : 'border-white bg-emerald-500 text-white'
          }`}>
            {activeCount > 9 ? '9+' : activeCount}
          </span>
        )}
        {activeCount === 0 && hasAttention && (
          <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-amber-400" />
        )}
      </button>

      {showHandoff && !isOpen && (
        <div
          className={`absolute right-0 mt-3 w-[290px] max-w-[calc(100vw-2rem)] rounded-2xl border p-4 shadow-2xl z-50 ${
            isDarkMode
              ? 'bg-slate-900 border-violet-400/40 shadow-black/50'
              : 'bg-white border-violet-300 shadow-violet-200/60'
          }`}
          role="status"
        >
          {/* Points at the icon it is describing; without it the panel could be
              about anything on the bar. */}
          <span
            className={`absolute -top-[7px] right-3 h-3 w-3 rotate-45 border-l border-t ${
              isDarkMode ? 'bg-slate-900 border-violet-400/40' : 'bg-white border-violet-300'
            }`}
            aria-hidden="true"
          />
          <p className={`text-sm font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            It runs on its own now
          </p>
          <p className={`mt-1.5 text-xs leading-5 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            You can close this page — it keeps working. Click this icon anytime to
            see what it has done, or to pause it.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => { setIsOpen(true); dismissHandoff(); }}
              className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-violet-500"
            >
              Show me
            </button>
            <button
              type="button"
              onClick={dismissHandoff}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                isDarkMode ? 'text-slate-400 hover:bg-white/5' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {isOpen && (
        <div
          className={`absolute right-0 mt-2 w-[380px] max-w-[calc(100vw-2rem)] rounded-2xl border shadow-2xl overflow-hidden ${
            isDarkMode
              ? 'bg-slate-900/98 border-slate-700/60 shadow-black/50 backdrop-blur-xl'
              : 'bg-white border-gray-200 shadow-lg shadow-gray-200/60'
          }`}
          role="dialog"
          aria-label="Automation monitor"
        >
          <div className={`flex items-center justify-between border-b px-4 py-3 ${
            isDarkMode ? 'border-slate-700/50 bg-slate-900' : 'border-gray-100 bg-gray-50'
          }`}>
            <div>
              <h2 className={`text-sm font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Running by themselves
              </h2>
              <p className={`mt-0.5 text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {activeCount} on · {automations.length} total
              </p>
            </div>
            <button
              type="button"
              onClick={loadAutomations}
              disabled={loading}
              className={`rounded-lg p-2 transition disabled:opacity-50 ${
                isDarkMode ? 'hover:bg-white/8 text-slate-400' : 'hover:bg-white text-slate-500'
              }`}
              aria-label="Refresh automation list"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="max-h-[520px] overflow-y-auto p-3">
            {loading && automations.length === 0 ? (
              <div className={`flex items-center gap-2 rounded-xl px-3 py-6 text-sm ${
                isDarkMode ? 'text-slate-400' : 'text-slate-500'
              }`}>
                <Loader2 className="h-4 w-4 animate-spin" />
                Checking automations…
              </div>
            ) : error ? (
              <div className={`rounded-xl border px-3 py-3 text-sm ${
                isDarkMode ? 'border-red-400/20 bg-red-500/10 text-red-200' : 'border-red-200 bg-red-50 text-red-700'
              }`}>
                {error}
              </div>
            ) : automations.length === 0 ? (
              <div className={`rounded-xl border px-3 py-6 text-center ${
                isDarkMode ? 'border-white/8 bg-white/[0.03] text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-500'
              }`}>
                <Zap className="mx-auto mb-2 h-5 w-5 text-purple-400" />
                <p className="text-sm font-bold">Nothing running on its own yet.</p>
                <p className="mt-1 text-xs">
                  Automations that keep working while you are away — like watching your
                  inbox — show up here. Ones you start yourself are not listed.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {automations.map((automation) => {
                  const isExpanded = expandedId === automation.automation_id;
                  const isToggling = togglingId === automation.automation_id;
                  const isRemoving = removingId === automation.automation_id;
                  const ToggleIcon = automation.enabled ? PauseCircle : PlayCircle;
                  return (
                    <div
                      key={automation.id}
                      className={`rounded-xl border p-3 ${
                        isDarkMode ? 'border-white/8 bg-white/[0.03]' : 'border-slate-200 bg-slate-50/80'
                      }`}
                    >
                      <div className="flex w-full items-start justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => setExpandedId(isExpanded ? null : automation.automation_id)}
                          className="min-w-0 flex-1 text-left"
                        >
                          <span className={`block truncate text-sm font-black ${
                            isDarkMode ? 'text-white' : 'text-slate-900'
                          }`}>
                            {automation.name}
                          </span>
                          <span className={`mt-1 block text-xs ${
                            automation.enabled
                              ? isDarkMode ? 'text-emerald-300' : 'text-emerald-700'
                              : isDarkMode ? 'text-slate-500' : 'text-slate-400'
                          }`}>
                            {automation.enabled ? 'On · waiting for app events' : 'Paused'} · Updated {formatRelativeTime(automation.updated_at || automation.created_at)}
                          </span>
                        </button>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${
                            automation.enabled
                              ? isDarkMode ? 'bg-emerald-500/10 text-emerald-300' : 'bg-emerald-50 text-emerald-700'
                              : isDarkMode ? 'bg-white/5 text-slate-400' : 'bg-white text-slate-500'
                          }`}>
                            {automation.enabled ? 'On' : 'Off'}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleAutomation(automation, !automation.enabled)}
                            disabled={isToggling}
                            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                              automation.enabled
                                ? isDarkMode ? 'border-amber-400/20 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20' : 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                                : isDarkMode ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20' : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            }`}
                            aria-label={automation.enabled ? `Pause ${automation.name}` : `Resume ${automation.name}`}
                          >
                            {isToggling ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <ToggleIcon className="h-3.5 w-3.5" />
                            )}
                            {automation.enabled ? 'Pause' : 'Resume'}
                          </button>
                          <button
                            type="button"
                            onClick={() => removeAutomation(automation)}
                            disabled={isRemoving || isToggling}
                            className={`inline-flex items-center justify-center rounded-lg border p-1.5 transition disabled:cursor-not-allowed disabled:opacity-60 ${
                              isDarkMode
                                ? 'border-red-400/20 bg-red-500/10 text-red-200 hover:bg-red-500/20'
                                : 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                            }`}
                            aria-label={`Remove ${automation.name}`}
                            title="Remove from my automations"
                          >
                            {isRemoving ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <RuntimeInlineStatus
                          automationId={automation.automation_id}
                          isDarkMode={isDarkMode}
                          refreshKey={statusRefreshKey}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
