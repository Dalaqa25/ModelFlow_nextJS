'use client';

import { useState } from 'react';
import { useThemeAdaptive } from '@/lib/contexts/theme-adaptive-context';

export default function AutomationInstanceCard({ automation, onToggleEnabled, onViewDetails }) {
  const { isDarkMode } = useThemeAdaptive();
  const [isToggling, setIsToggling] = useState(false);

  const handleToggle = async () => {
    setIsToggling(true);
    await onToggleEnabled(automation.id, !automation.enabled);
    setIsToggling(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const priceDisplay = automation.price_per_run === 0 
    ? 'Free' 
    : `${(automation.price_per_run / 100).toFixed(2)}/run`;

  return (
    <div 
      className={`rounded-lg border p-4 mb-3 transition-all max-w-md ${
        isDarkMode 
          ? 'bg-gray-800 border-gray-700 hover:border-gray-600' 
          : 'bg-white border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-medium px-2 py-0.5 rounded ${
              automation.enabled
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
            }`}>
              {automation.enabled ? '● Active' : '○ Paused'}
            </span>
            <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {priceDisplay}
            </span>
          </div>
          <h3 className={`font-semibold text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {automation.name}
          </h3>
        </div>
      </div>

      <div className={`grid grid-cols-3 gap-3 py-3 border-t border-b ${
        isDarkMode ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div>
          <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Total Runs
          </div>
          <div className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {automation.total_runs}
          </div>
        </div>
        <div>
          <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Credits Used
          </div>
          <div className={`text-lg font-semibold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
            {automation.total_credits || 0}
          </div>
        </div>
        <div>
          <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Last Run
          </div>
          <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {formatDate(automation.last_run)}
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-3">
        <button
          onClick={handleToggle}
          disabled={isToggling}
          className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
            automation.enabled
              ? isDarkMode
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              : isDarkMode
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          } ${isToggling ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isToggling ? '...' : automation.enabled ? 'Pause' : 'Enable'}
        </button>
        <button
          onClick={() => onViewDetails(automation)}
          className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
            isDarkMode
              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Details
        </button>
      </div>
    </div>
  );
}
