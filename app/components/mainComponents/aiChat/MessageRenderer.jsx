'use client';

import Image from 'next/image';
import AutomationCard from '../AutomationCard';
import AutomationInstanceCard from './AutomationInstanceCard';
import ConnectButton from '../ConnectButton';
import ConfigForm from '../ConfigForm';
import BackgroundActivationPrompt from '../BackgroundActivationPrompt';
import NoResultsPopup from './NoResultsPopup';
import RuntimeStatusCard from './RuntimeStatusCard';
import VideoPreview from '../VideoPreview';
import { ArrowRight, CheckCircle2, Plug, WalletCards } from 'lucide-react';
import { getCreatorInitials } from '@/lib/automations/public-creator';

// Renders message content — parses [text](url) into clickable links, strips ** bold markers
function renderContent(content) {
  if (!content) return null;
  const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g;
  const parts = [];
  let last = 0;
  let match;
  // Strip ** markers first
  const cleaned = content.replace(/\*\*/g, '');
  while ((match = linkRegex.exec(cleaned)) !== null) {
    if (match.index > last) parts.push(cleaned.slice(last, match.index));
    parts.push(
      <a
        key={match.index}
        href={match[2]}
        target="_blank"
        rel="noopener noreferrer"
        className="text-purple-400 hover:text-purple-300 underline underline-offset-2 transition-colors"
      >
        {match[1]}
      </a>
    );
    last = match.index + match[0].length;
  }
  if (last < cleaned.length) parts.push(cleaned.slice(last));
  return parts;
}

function ThinkingIndicator({ isDarkMode, label }) {
  const mutedText = isDarkMode ? 'text-slate-400' : 'text-slate-500';
  const dotColor = isDarkMode ? 'bg-violet-300' : 'bg-violet-600';
  const text = label || 'ModelGrow is thinking';

  return (
    <span
      role="status"
      aria-live="polite"
      aria-label={text}
      className="inline-flex min-h-10 items-center gap-3 py-1"
    >
      <span className="relative flex h-9 w-9 shrink-0 items-center justify-center">
        <span className="absolute inset-1 rounded-xl bg-violet-500/25 blur-md animate-pulse" />
        <Image
          src="/logo.png"
          alt=""
          aria-hidden="true"
          width={30}
          height={30}
          priority
          className="relative drop-shadow-[0_0_8px_rgba(139,92,246,0.45)]"
          style={{ animation: 'float 1.6s ease-in-out infinite' }}
        />
        <span className="absolute -right-0.5 top-0 h-2 w-2 rounded-full bg-fuchsia-400 animate-ping" />
      </span>

      <span className={`text-sm font-medium ${mutedText}`}>{text}</span>
      <span className="inline-flex items-end gap-1" aria-hidden="true">
        {[0, 1, 2].map((dot) => (
          <span
            key={dot}
            className={`h-1.5 w-1.5 rounded-full ${dotColor} animate-bounce`}
            style={{ animationDelay: `${dot * 140}ms` }}
          />
        ))}
      </span>
    </span>
  );
}

function SetupWidget({ widget, isDarkMode, isLoading, onStart }) {
  const connectors = Array.isArray(widget?.connectors) ? widget.connectors : [];
  const inputs = Array.isArray(widget?.inputs) ? widget.inputs : [];
  const tokenCost = Number(widget?.tokenCost || 0);
  const panelClass = isDarkMode
    ? 'bg-white/5'
    : 'border border-slate-200 bg-white shadow-sm';
  const chipClass = isDarkMode
    ? 'bg-violet-500/12 text-violet-300 ring-1 ring-violet-400/20'
    : 'bg-violet-50 text-violet-700 ring-1 ring-violet-100';

  return (
    <div
      className={`mt-4 w-full max-w-2xl overflow-hidden rounded-2xl border shadow-2xl ${
        isDarkMode
          ? 'border-white/10 bg-slate-950/70 shadow-black/30'
          : 'border-slate-200 bg-slate-50 shadow-slate-200/70'
      }`}
    >
      <div className="relative overflow-hidden bg-[radial-gradient(circle_at_12%_20%,rgba(168,85,247,0.35),transparent_32%),linear-gradient(135deg,#111827_0%,#26134d_55%,#020617_100%)] p-5">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#ede9fe]">
          Setup preview
        </div>
        <h3 className="text-2xl font-black text-[#ffffff]">{widget?.name || 'Automation'}</h3>
        {widget?.description && (
          <p className="mt-2 line-clamp-3 text-sm font-medium leading-6 text-[#e2e8f0]">
            {widget.description}
          </p>
        )}
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-3">
        <div className={`rounded-xl p-4 ${panelClass}`}>
          <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-violet-400">
            <Plug className="h-4 w-4" />
            Apps
          </div>
          {connectors.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {connectors.slice(0, 4).map((connector) => (
                <span key={connector} className={`rounded-full px-2.5 py-1 text-xs font-bold ${chipClass}`}>
                  {connector}
                </span>
              ))}
            </div>
          ) : (
            <p className={`text-sm font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              No app connection listed.
            </p>
          )}
        </div>

        <div className={`rounded-xl p-4 ${panelClass}`}>
          <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            Inputs
          </div>
          <p className={`text-sm font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            {inputs.length > 0 ? `${inputs.length} thing${inputs.length === 1 ? '' : 's'} to collect` : 'No manual inputs listed'}
          </p>
        </div>

        <div className={`rounded-xl p-4 ${panelClass}`}>
          <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-cyan-400">
            <WalletCards className="h-4 w-4" />
            Cost
          </div>
          <p className={`text-sm font-black ${isDarkMode ? 'text-[#ffffff]' : 'text-slate-950'}`}>
            {tokenCost > 0 ? `${tokenCost} tokens/run` : 'Free'}
          </p>
        </div>
      </div>

      <div className={`flex flex-col gap-3 border-t p-4 sm:flex-row sm:items-center sm:justify-between ${isDarkMode ? 'border-white/10' : 'border-slate-200 bg-white'}`}>
        <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
          Next, ModelGrow prepares a private runtime copy and checks what accounts are missing.
        </p>
        <button
          type="button"
          onClick={() => onStart?.(widget)}
          disabled={isLoading}
          className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-slate-950 px-5 py-3 text-sm font-black text-[#ffffff] shadow-lg shadow-violet-500/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Prepare setup
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
}

export default function MessageRenderer({
  message,
  index,
  isLoading,
  currentAiMessageId,
  isDarkMode,
  onAutomationSelect,
  onConnectionComplete,
  onConfigSubmit,
  onBackgroundActivate,
  onSetupWidgetStart,
  onRequireAuth,
  onNoResultsClose
}) {
  const isCurrentStreamingAssistant =
    message.role === 'assistant' &&
    isLoading &&
    message.id === currentAiMessageId;
  const showThinking =
    message.role === 'assistant' &&
    !message.content &&
    (message.isThinking || isCurrentStreamingAssistant);

  // Work continues after the first words arrive: the reply is streamed, then a
  // tool runs for several seconds before its own output appears. The indicator
  // above is hidden once there is content, which left that stretch looking
  // like a finished answer rather than one still being worked on. This one
  // trails the content instead of replacing it, so the message reads as
  // in-progress without hiding what has already been said.
  const showWorking =
    message.role === 'assistant' &&
    Boolean(message.content) &&
    Boolean(message.isThinking);

  // Don't render empty assistant messages except streaming one
  if (
    message.role === 'assistant' &&
    !showThinking &&
    !message.automations?.length &&
    !message.automationList?.length &&
    !message.insufficientTokens &&
    !message.setupWidget &&
    !message.connectRequest &&
    !message.configRequest &&
    !message.backgroundActivationPrompt &&
    !message.runtimeStatus &&
    !message.videoPreview &&
    !message.noResultsPopup &&
    !message.automationInstances?.length &&
    !message.fileSearchResults?.length &&
    (!message.content || message.content.trim() === '')
  ) {
    return null;
  }

  return (
    <div
      key={`${message.timestamp}-${index}`}
      className="w-full"
      style={{
        animation: message.role === 'user'
          ? 'messageSlideInFromRight 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards'
          : 'messageSlideIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        opacity: 0
      }}
    >
      <div className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
        <div
          className={`${message.role === 'user' ? 'max-w-[85%]' : 'max-w-full'} ${message.role === 'user'
              ? `rounded-4xl px-3 py-2 ${isDarkMode ? 'bg-slate-800/60 text-white' : 'bg-slate-700/60 text-white'}`
              : isDarkMode ? 'text-gray-100' : 'text-gray-900'
            }`}
        >
          {/* Searching indicator */}
          {message.isSearching && (
            <div className="flex items-center gap-2 mb-2">
              <div className="flex gap-1">
                <div className={`w-2 h-2 rounded-full animate-bounce ${isDarkMode ? 'bg-purple-400' : 'bg-purple-600'}`} style={{ animationDelay: '0ms' }}></div>
                <div className={`w-2 h-2 rounded-full animate-bounce ${isDarkMode ? 'bg-purple-400' : 'bg-purple-600'}`} style={{ animationDelay: '150ms' }}></div>
                <div className={`w-2 h-2 rounded-full animate-bounce ${isDarkMode ? 'bg-purple-400' : 'bg-purple-600'}`} style={{ animationDelay: '300ms' }}></div>
              </div>
              <span className={`text-sm italic ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Searching...
              </span>
            </div>
          )}
          <p className="text-base leading-relaxed whitespace-pre-wrap break-words">
            {renderContent(message.content)}
            {showThinking && (
              <ThinkingIndicator isDarkMode={isDarkMode} label={message.thinkingLabel} />
            )}
          </p>
          {showWorking && (
            <div className="mt-2">
              <ThinkingIndicator isDarkMode={isDarkMode} label={message.thinkingLabel} />
            </div>
          )}
        </div>
      </div>

      {/* Deterministic setup preview widget */}
      {message.setupWidget && (
        <SetupWidget
          widget={message.setupWidget}
          isDarkMode={isDarkMode}
          isLoading={isLoading}
          onStart={onSetupWidgetStart}
        />
      )}

      {/* Automation cards (legacy) */}
      {message.automations?.length > 0 && (
        <div className="mt-4 space-y-3 max-w-[85%]">
          {message.automations.map((automation) => (
            <AutomationCard key={automation.id} automation={automation} onSelect={onAutomationSelect} />
          ))}
        </div>
      )}

      {/* Styled automation list */}
      {message.automationList?.length > 0 && (
        <AutomationList automations={message.automationList} isDarkMode={isDarkMode} />
      )}

      {/* Insufficient tokens — show Buy Tokens button */}
      {message.insufficientTokens && (
        <div className={`mt-3 p-3 rounded-xl border flex items-center justify-between gap-3 ${
          isDarkMode ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-yellow-50 border-yellow-200'
        }`}>
          <div>
            <p className={`text-sm font-semibold ${isDarkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
              {message.insufficientTokens.shortfall} more tokens needed
            </p>
            <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-yellow-400/70' : 'text-yellow-600'}`}>
              Have {message.insufficientTokens.available} · Need {message.insufficientTokens.required}
            </p>
          </div>
          <a
            href="/pricing"
            className="flex-shrink-0 px-4 py-2 rounded-lg text-sm font-semibold bg-purple-600 hover:bg-purple-500 text-white transition-colors"
          >
            Buy Tokens
          </a>
        </div>
      )}

      {/* Connect button or Sign In button */}
      {message.connectRequest && (
        <div className="mt-4">
          {!message.connectRequest.provider ? (
            <button
              onClick={() => onRequireAuth && onRequireAuth()}
              className={`
                inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium
                transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5
                bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500
                text-white
              `}
            >
              Sign in to continue
            </button>
          ) : (
            <ConnectButton
              provider={message.connectRequest.provider}
              automationId={message.connectRequest.automation_id}
              userId={message.connectRequest.user_id}
              engine={message.connectRequest.engine}
              activepiecesUrl={message.connectRequest.activepiecesUrl}
              activepiecesConnections={message.connectRequest.activepiecesConnections}
              onConnect={onConnectionComplete}
            />
          )}
        </div>
      )}

      {/* Config form */}
      {message.configRequest && (
        <div className="mt-4">
          <ConfigForm
            requiredInputs={message.configRequest.required_inputs}
            optionalInputs={message.configRequest.optional_inputs}
            automationId={message.configRequest.automation_id}
            automationName={message.configRequest.automation_name}
            missingFields={message.configRequest.missing_fields}
            collectedConfig={message.configRequest.collected_config}
            onSubmit={onConfigSubmit}
          />
        </div>
      )}

      {/* Background activation prompt */}
      {message.backgroundActivationPrompt && (
        <div className="mt-4">
          <BackgroundActivationPrompt
            automationId={message.backgroundActivationPrompt.automation_id}
            automationName={message.backgroundActivationPrompt.automation_name}
            config={message.backgroundActivationPrompt.config}
            onActivate={onBackgroundActivate}
            isDarkMode={isDarkMode}
          />
        </div>
      )}

      {/* Runtime status after setup / activation */}
      {message.runtimeStatus?.automation_id && (
        <div className="mt-4 max-w-2xl">
          <RuntimeStatusCard
            automationId={message.runtimeStatus.automation_id}
            isDarkMode={isDarkMode}
          />
        </div>
      )}

      {/* Video Preview */}
      {message.videoPreview && (
        <div className="mt-4">
          <VideoPreview
            fileName={message.videoPreview.file_name}
            previewUrl={message.videoPreview.preview_url}
            expiresIn={message.videoPreview.expires_in}
            isDarkMode={isDarkMode}
          />
        </div>
      )}

      {/* No Results Popup */}
      {message.noResultsPopup && (
        <NoResultsPopup
          query={message.noResultsPopup.query}
          onClose={onNoResultsClose}
        />
      )}

      {/* Automation instances (user stats) */}
      {message.automationInstances?.length > 0 && (
        <div className="mt-4 space-y-3 max-w-[85%]">
          {message.automationInstances.map((instance) => (
            <AutomationInstanceCard
              key={instance.id}
              automation={instance}
              onToggleEnabled={async (id, enabled) => {
                try {
                  const response = await fetch(`/api/automations/${id}/toggle`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ enabled })
                  });
                  if (!response.ok) throw new Error('Failed to toggle');
                  // Refresh the message to show updated state
                  window.location.reload();
                } catch (error) {
                  console.error('Toggle failed:', error);
                  alert('Failed to toggle automation. Please try again.');
                }
              }}
              onViewDetails={(instance) => {
                // Show details in alert for now (can be improved with modal)
                alert(`Automation Details:\n\nName: ${instance.name}\nStatus: ${instance.enabled ? 'Active' : 'Paused'}\nTotal Runs: ${instance.total_runs}\nSuccess Rate: ${instance.success_rate}%\nLast Run: ${instance.last_run || 'Never'}\n\nConfig:\n${JSON.stringify(instance.config, null, 2)}`);
              }}
              onRunNow={async (automation, config) => {
                try {
                  // Keep runner credentials server-side; the authenticated API
                  // resolves the current user and forwards the request safely.
                  const response = await fetch('/api/automations/execute', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      automation_id: automation.automation_id,
                      config: config // Use the config from the form
                    })
                  });

                  if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || 'Failed to run automation');
                  }

                  const result = await response.json();
                  alert(`Automation executed successfully!\n\nResult: ${JSON.stringify(result, null, 2)}`);

                  // Optionally refresh to show updated stats
                  window.location.reload();
                } catch (error) {
                  console.error('Run failed:', error);
                  alert(`Failed to run automation: ${error.message}`);
                }
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AutomationList({ automations, isDarkMode }) {
  return (
    <div className="mt-2 space-y-4">
      {automations.map((automation) => (
        <div key={automation.index} className="space-y-1">
          <div className="flex items-center gap-2">
            <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {automation.index}. {automation.name}
            </span>
            <span className={`text-sm px-2 py-0.5 rounded-full ${automation.price === 'Free' ? 'bg-green-500/20 text-green-400' : 'bg-purple-500/20 text-purple-400'
              }`}>
              {automation.price}
            </span>
          </div>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {automation.description}
          </p>
          {automation.creator?.display_name && (
            <div className="flex items-center gap-2 py-1">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cover bg-center text-[8px] font-black ${isDarkMode ? 'bg-slate-700 text-purple-300' : 'bg-purple-50 text-purple-700'}`}
                style={automation.creator.profile_image_url ? { backgroundImage: `url(${automation.creator.profile_image_url})` } : undefined}
                aria-hidden="true"
              >
                {!automation.creator.profile_image_url && getCreatorInitials(automation.creator.display_name)}
              </span>
              <span className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                By <span className={isDarkMode ? 'text-slate-200' : 'text-slate-700'}>{automation.creator.display_name}</span>
              </span>
            </div>
          )}
          <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            Requires: {automation.requires.join(', ')}
          </p>
        </div>
      ))}
    </div>
  );
}
