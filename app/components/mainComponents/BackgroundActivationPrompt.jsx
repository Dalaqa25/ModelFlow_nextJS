'use client';

import { useState } from 'react';

export default function BackgroundActivationPrompt({ 
  automationId, 
  automationName, 
  config,
  onActivate,
  isDarkMode 
}) {
  const [isActivating, setIsActivating] = useState(false);

  const handleActivate = async () => {
    setIsActivating(true);
    try {
      await onActivate(automationId, config);
    } catch (error) {
      console.error('Failed to activate background:', error);
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <div className={`mt-4 p-4 rounded-lg border-2 ${
      isDarkMode 
        ? 'bg-purple-900/20 border-purple-500/50' 
        : 'bg-purple-50 border-purple-300'
    }`}>
      <div className="flex items-start gap-3">
        <div className={`text-2xl ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
          🔄
        </div>
        <div className="flex-1">
          <h3 className={`font-bold text-lg mb-2 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Enable Background Execution?
          </h3>
          <p className={`text-sm mb-3 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            <strong>{automationName}</strong> works best when running in the background. 
            This allows it to continuously monitor and automatically execute when conditions are met.
          </p>
          <div className={`text-xs mb-4 p-2 rounded ${
            isDarkMode ? 'bg-gray-800/50 text-gray-400' : 'bg-gray-100 text-gray-600'
          }`}>
            <strong>What this means:</strong> The automation will run automatically without manual triggers, 
            tracking changes and executing actions as needed.
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleActivate}
              disabled={isActivating}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                isDarkMode
                  ? 'bg-purple-600 hover:bg-purple-700 text-white'
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              } ${isActivating ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isActivating ? 'Activating...' : 'Yes, Enable Background Mode'}
            </button>
            <button
              onClick={() => {
                // User declined - just acknowledge
                if (onActivate) {
                  onActivate(null, null); // Signal decline
                }
              }}
              disabled={isActivating}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                isDarkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              No, Manual Only
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
