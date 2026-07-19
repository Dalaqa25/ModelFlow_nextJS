'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock3, Loader2, RefreshCw, XCircle, Zap } from 'lucide-react';

function formatRelativeTime(value) {
  if (!value) return 'Never';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';

  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function formatDurationMs(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  if (value < 1000) return `${Math.round(value)}ms`;
  return `${(value / 1000).toFixed(value < 10_000 ? 1 : 0)}s`;
}

function compactIssueMessage(message) {
  if (!message) return '';
  const text = String(message)
    .replace(/\s+at\s+\/usr\/src\/app[\s\S]*$/i, '')
    .replace(/\n\s+at\s+[\s\S]*$/i, '')
    .replace(/^Error:\s*/i, '')
    .trim();

  if (text.length <= 420) return text;
  return `${text.slice(0, 417)}…`;
}

function getStatePresentation(status) {
  const state = status?.state || 'loading';
  const latest = status?.latestRun;

  if (state === 'loading') {
    return {
      label: 'Checking runtime',
      icon: Loader2,
      className: 'border-slate-300/30 bg-slate-500/10 text-slate-200',
      spin: true,
    };
  }

  if (latest?.success) {
    return {
      label: 'Last run succeeded',
      icon: CheckCircle2,
      className: 'border-emerald-300/40 bg-emerald-500/10 text-emerald-200',
    };
  }

  if (state === 'error' || state === 'unavailable') {
    return {
      label: state === 'unavailable' ? 'Runtime unavailable' : 'Runtime check failed',
      icon: AlertTriangle,
      className: 'border-amber-300/40 bg-amber-500/10 text-amber-200',
    };
  }

  if (latest?.status === 'FAILED' || latest?.errorMessage) {
    return status?.active
      ? {
          label: 'Active · last run failed',
          icon: AlertTriangle,
          className: 'border-amber-300/40 bg-amber-500/10 text-amber-200',
        }
      : {
          label: 'Last run failed',
          icon: XCircle,
          className: 'border-red-300/40 bg-red-500/10 text-red-200',
        };
  }

  if (state === 'running' || latest?.processing) {
    return {
      label: 'Run in progress',
      icon: Loader2,
      className: 'border-blue-300/40 bg-blue-500/10 text-blue-200',
      spin: true,
    };
  }

  if (state === 'needs_setup') {
    return {
      label: 'Needs setup',
      icon: AlertTriangle,
      className: 'border-amber-300/40 bg-amber-500/10 text-amber-200',
    };
  }

  if (status?.active) {
    return {
      label: 'Active and waiting',
      icon: Clock3,
      className: 'border-emerald-300/40 bg-emerald-500/10 text-emerald-200',
    };
  }

  return {
    label: 'Paused or inactive',
    icon: Clock3,
    className: 'border-slate-300/30 bg-slate-500/10 text-slate-200',
  };
}

function compactStatus(status) {
  if (!status) return null;
  if (status.latestRun?.status) return status.latestRun.status;
  if (status.runtimeFlow?.flowStatus) return status.runtimeFlow.flowStatus;
  return status.state;
}

function getTriggerDelayHint(trigger) {
  const app = String(trigger?.app || '').toLowerCase();
  const pieceName = String(trigger?.pieceName || '').toLowerCase();
  const event = String(trigger?.event || '').toLowerCase();

  if (app.includes('gmail') || pieceName.includes('gmail')) {
    return 'Gmail checks are not instant. New matching attachments can take a few minutes to appear here.';
  }

  if (event.includes('new_attachment')) {
    return 'Attachment triggers can take a few minutes to appear here.';
  }

  return '';
}

export default function RuntimeStatusCard({ automationId, isDarkMode }) {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(Boolean(automationId));
  const [repairing, setRepairing] = useState(false);

  const loadStatus = async () => {
    if (!automationId) return;
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/automations/${automationId}/runtime-status`, {
        headers: { Accept: 'application/json' },
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to load runtime status');
      }
      setStatus(payload);
    } catch (err) {
      setError(err.message || 'Failed to load runtime status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, [automationId]);

  useEffect(() => {
    if (!automationId || !status?.active) return undefined;
    if (status?.latestRun?.success && status?.state !== 'running') return undefined;

    const interval = window.setInterval(() => {
      loadStatus();
    }, 30_000);

    return () => window.clearInterval(interval);
  }, [automationId, status?.active, status?.state, status?.latestRun?.id, status?.latestRun?.success]);

  const repairRuntime = async () => {
    if (!automationId) return;
    setRepairing(true);
    setError('');

    try {
      const response = await fetch(`/api/automations/${automationId}/runtime-status`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to repair runtime');
      }
      setStatus(payload);
    } catch (err) {
      setError(err.message || 'Failed to repair runtime');
    } finally {
      setRepairing(false);
    }
  };

  const triggerText = status?.trigger
    ? [status.trigger.app, status.trigger.event].filter(Boolean).join(' · ')
    : null;
  const activationTime = status?.runtimeFlow?.activatedAt
    ? new Date(status.runtimeFlow.activatedAt).getTime()
    : 0;
  const recentRuns = (status?.recentRuns || []).filter((run) => {
    if (!activationTime) return true;
    const runTime = new Date(run.createdAt || run.updatedAt || 0).getTime();
    return runTime >= activationTime;
  });
  const latestRun = recentRuns[0] || null;
  const currentStatus = status ? { ...status, latestRun, recentRuns } : status;
  const presentation = useMemo(
    () => getStatePresentation(loading ? { state: 'loading' } : currentStatus),
    [loading, currentStatus]
  );
  const Icon = presentation.icon;
  const successfulRecentRuns = recentRuns.filter((run) => run.success).length;
  const failedRecentRuns = recentRuns.filter((run) => ['FAILED', 'INTERNAL_ERROR', 'TIMEOUT'].includes(run.status)).length;
  const processingRecentRuns = recentRuns.filter((run) => run.processing).length;
  const issueMessage = compactIssueMessage(
    error ||
    latestRun?.errorMessage ||
    status?.duplicateListenerRisk?.message ||
    status?.duplicateBurst?.message ||
    status?.message
  );
  const issueIsError = Boolean(error || latestRun?.errorMessage || ['error', 'failed', 'unavailable'].includes(status?.state));
  const canRepair = ['needs_setup', 'unavailable', 'error'].includes(status?.state);
  const triggerCriteria = Array.isArray(status?.trigger?.criteria) ? status.trigger.criteria : [];
  const latestDuration = formatDurationMs(latestRun?.durationMs);
  const triggerDelayHint = getTriggerDelayHint(status?.trigger);
  const trackingSteps = [
    {
      label: 'Runtime enabled',
      detail: status?.runtimeFlow?.activatedAt
        ? `Prepared ${formatRelativeTime(status.runtimeFlow.activatedAt)}`
        : status?.active ? 'Runtime copy is enabled' : 'Runtime is not enabled yet',
      done: Boolean(status?.active),
      danger: false,
    },
    {
      label: latestRun ? 'Trigger received' : 'Waiting for trigger',
      detail: latestRun
        ? `${latestRun.status} run created ${formatRelativeTime(latestRun.createdAt)}`
        : triggerText
          ? `Waiting for ${triggerText}`
          : 'Waiting for the connected app event',
      done: Boolean(latestRun),
      danger: false,
    },
    {
      label: latestRun?.success ? 'Workflow completed' : latestRun?.processing ? 'Workflow running' : latestRun ? 'Workflow failed' : 'No run result yet',
      detail: latestRun?.failedStep?.displayName
        ? `Failed at ${latestRun.failedStep.displayName}`
        : latestRun?.success
          ? `Completed${latestDuration ? ` in ${latestDuration}` : ''}`
          : latestRun?.processing
            ? 'Activepieces is processing this run'
            : 'No completed run since setup',
      done: Boolean(latestRun?.success),
      danger: Boolean(latestRun?.errorMessage || latestRun?.status === 'FAILED'),
      loading: Boolean(latestRun?.processing),
    },
  ];

  if (!automationId) return null;

  return (
    <div className={`mt-3 rounded-2xl border p-4 text-sm ${
      isDarkMode ? 'border-slate-700 bg-slate-900/40' : 'border-slate-200 bg-slate-50'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className={`mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] ${
            isDarkMode ? 'text-slate-400' : 'text-slate-500'
          }`}>
            <Zap className="h-4 w-4 text-violet-400" />
            Automation tracking
          </div>
          <div className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-bold ${presentation.className}`}>
            <Icon className={`h-3.5 w-3.5 ${presentation.spin ? 'animate-spin' : ''}`} />
            {presentation.label}
          </div>
          <div className={`mt-2 space-y-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            <p>
              <span className="font-semibold">Trigger:</span> {triggerText || 'Unknown / not prepared yet'}
            </p>
            <p>
              <span className="font-semibold">Latest:</span> {latestRun
                ? `${latestRun.status} · ${formatRelativeTime(latestRun.createdAt)}`
                : 'No runs since setup'}
            </p>
            {triggerDelayHint && (
              <p className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>
                {triggerDelayHint}
              </p>
            )}
            {latestDuration && (
              <p>
                <span className="font-semibold">Duration:</span> {latestDuration}
              </p>
            )}
            {latestRun?.failedStep?.displayName && (
              <p>
                <span className="font-semibold">Failed step:</span> {latestRun.failedStep.displayName}
              </p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={loadStatus}
          disabled={loading}
          className={`rounded-lg p-2 transition ${
            isDarkMode
              ? 'text-slate-300 hover:bg-slate-800 disabled:opacity-50'
              : 'text-slate-600 hover:bg-white disabled:opacity-50'
          }`}
          title="Refresh runtime status"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {!loading && (
        <div className={`mt-4 rounded-xl border p-3 ${
          isDarkMode ? 'border-slate-700 bg-slate-950/30' : 'border-slate-200 bg-white'
        }`}>
          <div className="space-y-3">
            {trackingSteps.map((step, index) => {
              const StepIcon = step.loading ? Loader2 : step.danger ? XCircle : step.done ? CheckCircle2 : Clock3;
              return (
                <div key={step.label} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-full border ${
                      step.danger
                        ? isDarkMode ? 'border-red-400/40 bg-red-500/10 text-red-200' : 'border-red-200 bg-red-50 text-red-600'
                        : step.done
                          ? isDarkMode ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200' : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : isDarkMode ? 'border-slate-600 bg-slate-900 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-500'
                    }`}>
                      <StepIcon className={`h-4 w-4 ${step.loading ? 'animate-spin' : ''}`} />
                    </span>
                    {index < trackingSteps.length - 1 && (
                      <span className={`mt-1 h-6 w-px ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`} />
                    )}
                  </div>
                  <div className="min-w-0 pb-1">
                    <p className={`font-black ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                      {step.label}
                    </p>
                    <p className={`mt-0.5 text-xs leading-5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {step.detail}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {triggerCriteria.length > 0 && (
            <div className={`mt-3 flex flex-wrap gap-2 border-t pt-3 ${
              isDarkMode ? 'border-slate-700' : 'border-slate-200'
            }`}>
              {triggerCriteria.map((criterion) => (
                <span
                  key={criterion.key || criterion.label}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                    isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {criterion.label}: {criterion.value}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {!loading && !error && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[
            ['Runs checked', recentRuns.length],
            ['Succeeded', successfulRecentRuns],
            ['Failed', failedRecentRuns],
          ].map(([label, value]) => (
            <div
              key={label}
              className={`rounded-lg border px-2.5 py-2 ${
                isDarkMode ? 'border-slate-700 bg-slate-950/35' : 'border-slate-200 bg-white'
              }`}
            >
              <p className={`text-[10px] font-bold uppercase tracking-[0.12em] ${
                isDarkMode ? 'text-slate-500' : 'text-slate-400'
              }`}>
                {label}
              </p>
              <p className={`mt-1 text-lg font-black ${
                isDarkMode ? 'text-slate-100' : 'text-slate-900'
              }`}>
                {value}
              </p>
            </div>
          ))}
        </div>
      )}

      {processingRecentRuns > 0 && (
        <div className={`mt-3 rounded-lg border px-3 py-2 text-xs leading-5 ${
          isDarkMode
            ? 'border-blue-400/25 bg-blue-500/10 text-blue-100'
            : 'border-blue-200 bg-blue-50 text-blue-700'
        }`}>
          {processingRecentRuns} recent run{processingRecentRuns === 1 ? ' is' : 's are'} still processing.
        </div>
      )}

      {issueMessage && (
        <div className={`mt-3 rounded-lg border px-3 py-2 text-xs leading-5 ${
          issueIsError
            ? isDarkMode ? 'border-red-400/25 bg-red-500/10 text-red-100' : 'border-red-200 bg-red-50 text-red-700'
            : isDarkMode ? 'border-amber-400/25 bg-amber-500/10 text-amber-100' : 'border-amber-200 bg-amber-50 text-amber-700'
        }`}>
          {issueMessage}
        </div>
      )}

      {canRepair && (
        <button
          type="button"
          onClick={repairRuntime}
          disabled={repairing || loading}
          className={`mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
            isDarkMode
              ? 'bg-violet-500/20 text-violet-100 hover:bg-violet-500/30'
              : 'bg-violet-100 text-violet-700 hover:bg-violet-200'
          }`}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${repairing ? 'animate-spin' : ''}`} />
          {repairing ? 'Repairing runtime…' : 'Repair runtime copy'}
        </button>
      )}

      {recentRuns.length > 0 && (
        <div className="mt-3">
          <p className={`mb-2 text-xs font-bold uppercase tracking-[0.12em] ${
            isDarkMode ? 'text-slate-400' : 'text-slate-500'
          }`}>
            Recent runs shown
          </p>
          <div className="space-y-1.5">
            {recentRuns.slice(0, 5).map((run) => (
              <div
                key={run.id || `${run.status}-${run.createdAt}`}
                className={`flex items-center justify-between rounded-lg px-2.5 py-2 text-xs ${
                  isDarkMode ? 'bg-slate-950/45 text-slate-300' : 'bg-white text-slate-600'
                }`}
              >
                <span className="font-semibold">{run.status}</span>
                <span>{formatRelativeTime(run.createdAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className={`mt-3 text-[11px] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
        Engine: {status?.engine || 'activepieces'} · Status: {compactStatus(status) || 'checking'}
      </p>
    </div>
  );
}
