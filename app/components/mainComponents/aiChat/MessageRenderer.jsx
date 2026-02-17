'use client';

import Image from 'next/image';
import AutomationCard from '../AutomationCard';
import AutomationInstanceCard from './AutomationInstanceCard';
import ConnectButton from '../ConnectButton';
import ConfigForm from '../ConfigForm';
import BackgroundActivationPrompt from '../BackgroundActivationPrompt';
import NoResultsPopup from './NoResultsPopup';

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
  onNoResultsClose
}) {
  const isCurrentStreamingAssistant =
    message.role === 'assistant' &&
    isLoading &&
    message.id === currentAiMessageId;

  // Don't render empty assistant messages except streaming one
  if (
    message.role === 'assistant' &&
    !isCurrentStreamingAssistant &&
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
            {message.content}
            {message.role === 'assistant' && isCurrentStreamingAssistant && message.content === '' && (
              <span className="inline-flex items-center justify-center mt-1">
                <Image src="/logo.png" alt="AI thinking" width={28} height={28} className="animate-spin" />
              </span>
            )}
          </p>
        </div>
      </div>

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

      {/* Connect button */}
      {message.connectRequest && (
        <div className="mt-4">
          <ConnectButton
            provider={message.connectRequest.provider}
            automationId={message.connectRequest.automation_id}
            onConnect={onConnectionComplete}
          />
        </div>
      )}

      {/* Config form */}
      {message.configRequest && (
        <div className="mt-4">
          <ConfigForm
            requiredInputs={message.configRequest.required_inputs}
            automationId={message.configRequest.automation_id}
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
                  // Send automation data to localhost:3001 backend
                  const response = await fetch('http://localhost:3001/api/automations/run', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      automation_id: automation.automation_id,
                      user_id: automation.user_id,
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
          <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            Requires: {automation.requires.join(', ')}
          </p>
        </div>
      ))}
    </div>
  );
}
