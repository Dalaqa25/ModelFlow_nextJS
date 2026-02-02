'use client';

import { useState } from 'react';
import { useThemeAdaptive } from '@/lib/contexts/theme-adaptive-context';

/**
 * Google Authorization Prompt Component
 * Shows when user needs to grant Google permissions for an automation
 */
export default function GoogleAuthPrompt({ 
  automationName,
  requiredServices = [],
  missingServices = [],
  authUrl,
  onAuthorized,
  onCancel 
}) {
  const { isDarkMode } = useThemeAdaptive();
  const [isConnecting, setIsConnecting] = useState(false);

  const serviceIcons = {
    'DRIVE': '📁',
    'SHEETS': '📊',
    'DOCS': '📄',
    'GMAIL': '📧',
    'CALENDAR': '📅',
    'YOUTUBE': '🎥',
    'SLIDES': '📊',
    'FORMS': '📝',
    'TASKS': '✅',
    'CONTACTS': '👥',
    'PHOTOS': '📷',
    'ANALYTICS': '📈',
    'ADS': '📢',
  };

  const serviceNames = {
    'DRIVE': 'Google Drive',
    'SHEETS': 'Google Sheets',
    'DOCS': 'Google Docs',
    'GMAIL': 'Gmail',
    'CALENDAR': 'Google Calendar',
    'YOUTUBE': 'YouTube',
    'SLIDES': 'Google Slides',
    'FORMS': 'Google Forms',
    'TASKS': 'Google Tasks',
    'CONTACTS': 'Google Contacts',
    'PHOTOS': 'Google Photos',
    'ANALYTICS': 'Google Analytics',
    'ADS': 'Google Ads',
  };

  const handleConnect = () => {
    setIsConnecting(true);
    
    // Open OAuth popup
    const width = 600;
    const height = 700;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    
    const popup = window.open(
      authUrl,
      'Google Authorization',
      `width=${width},height=${height},left=${left},top=${top}`
    );

    // Listen for OAuth completion
    const handleMessage = (event) => {
      if (event.data.type === 'google_connected') {
        setIsConnecting(false);
        window.removeEventListener('message', handleMessage);
        
        if (event.data.success) {
          onAuthorized?.();
        } else {
          alert('Failed to connect Google account. Please try again.');
        }
      }
    };

    window.addEventListener('message', handleMessage);

    // Check if popup was closed without completing
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        setIsConnecting(false);
        window.removeEventListener('message', handleMessage);
      }
    }, 500);
  };

  const isFirstConnection = missingServices.length === requiredServices.length;

  return (
    <div className={`rounded-xl p-6 border-2 ${
      isDarkMode 
        ? 'bg-slate-800/50 border-purple-500/30' 
        : 'bg-white border-purple-200'
    }`}>
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        <div className="text-4xl">🔐</div>
        <div className="flex-1">
          <h3 className={`text-xl font-semibold mb-2 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            {isFirstConnection 
              ? 'Connect Google Account' 
              : 'Additional Permissions Needed'}
          </h3>
          <p className={`text-sm ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            {isFirstConnection
              ? `"${automationName}" needs access to your Google services`
              : `"${automationName}" needs additional Google permissions`}
          </p>
        </div>
      </div>

      {/* Required Services */}
      <div className="mb-6">
        <p className={`text-sm font-medium mb-3 ${
          isDarkMode ? 'text-gray-300' : 'text-gray-700'
        }`}>
          {isFirstConnection ? 'This automation uses:' : 'Additional services needed:'}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {(isFirstConnection ? requiredServices : missingServices).map((service) => (
            <div
              key={service}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                isDarkMode 
                  ? 'bg-slate-700/50' 
                  : 'bg-gray-50'
              }`}
            >
              <span className="text-xl">{serviceIcons[service] || '🔧'}</span>
              <span className={`text-sm font-medium ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {serviceNames[service] || service}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Privacy Note */}
      <div className={`rounded-lg p-3 mb-6 ${
        isDarkMode 
          ? 'bg-blue-900/20 border border-blue-500/30' 
          : 'bg-blue-50 border border-blue-200'
      }`}>
        <p className={`text-xs ${
          isDarkMode ? 'text-blue-200' : 'text-blue-800'
        }`}>
          <strong>🔒 Your Privacy:</strong> We only access the services this automation needs. 
          You can revoke access anytime from your Google Account settings.
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleConnect}
          disabled={isConnecting}
          className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
            isConnecting
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-purple-600 hover:bg-purple-700 text-white'
          }`}
        >
          {isConnecting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Connecting...
            </span>
          ) : (
            `Connect Google Account`
          )}
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            disabled={isConnecting}
            className={`px-4 py-3 rounded-lg font-medium transition-all ${
              isDarkMode
                ? 'bg-slate-700 hover:bg-slate-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
            }`}
          >
            Cancel
          </button>
        )}
      </div>

      {/* Help Link */}
      <div className="mt-4 text-center">
        <a
          href="/google-permissions"
          target="_blank"
          rel="noopener noreferrer"
          className={`text-xs ${
            isDarkMode ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700'
          }`}
        >
          Learn more about Google permissions →
        </a>
      </div>
    </div>
  );
}
