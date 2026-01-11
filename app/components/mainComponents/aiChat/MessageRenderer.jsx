'use client';

import Image from 'next/image';
import AutomationCard from '../AutomationCard';
import ConnectButton from '../ConnectButton';
import ConfigForm from '../ConfigForm';

export default function MessageRenderer({
  message,
  index,
  isLoading,
  currentAiMessageId,
  isDarkMode,
  onAutomationSelect,
  onConnectionComplete,
  onConfigSubmit
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
          className={`${message.role === 'user' ? 'max-w-[85%]' : 'max-w-full'} ${
            message.role === 'user'
              ? `rounded-4xl px-3 py-2 ${isDarkMode ? 'bg-slate-800/60 text-white' : 'bg-slate-700/60 text-white'}`
              : isDarkMode ? 'text-gray-100' : 'text-gray-900'
          }`}
        >
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
          <ConnectButton provider={message.connectRequest.provider} onConnect={onConnectionComplete} />
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
            <span className={`text-sm px-2 py-0.5 rounded-full ${
              automation.price === 'Free' ? 'bg-green-500/20 text-green-400' : 'bg-purple-500/20 text-purple-400'
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
