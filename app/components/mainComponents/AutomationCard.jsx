'use client';

import { useThemeAdaptive } from '@/lib/contexts/theme-adaptive-context';

export default function AutomationCard({ automation, onSelect }) {
  const { isDarkMode } = useThemeAdaptive();

  const priceDisplay = automation.price_per_run 
    ? `$${automation.price_per_run.toFixed(2)}`
    : 'Free';

  const similarityPercent = automation.similarity 
    ? Math.round(automation.similarity * 100)
    : null;

  // Parse required_connectors - it might be a string or array
  let requiredConnectors = [];
  if (automation.required_connectors) {
    if (Array.isArray(automation.required_connectors)) {
      requiredConnectors = automation.required_connectors;
    } else if (typeof automation.required_connectors === 'string') {
      try {
        requiredConnectors = JSON.parse(automation.required_connectors);
      } catch (e) {
        // If it's just a plain string, split by comma
        requiredConnectors = automation.required_connectors.split(',').map(s => s.trim());
      }
    }
  }

  return (
    <div
      onClick={() => onSelect(automation)}
      className={`
        cursor-pointer rounded-xl p-4 border transition-all duration-200
        ${isDarkMode 
          ? 'bg-slate-800/50 border-slate-700 hover:border-purple-500 hover:bg-slate-800/80' 
          : 'bg-white border-gray-200 hover:border-purple-400 hover:shadow-md'
        }
      `}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className={`font-semibold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          {automation.name}
        </h3>
        <span className={`text-sm font-bold px-2 py-1 rounded ${
          isDarkMode ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-700'
        }`}>
          {priceDisplay}
        </span>
      </div>
      
      <p className={`text-sm mb-3 line-clamp-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
        {automation.description}
      </p>

      {/* Required Connectors */}
      {requiredConnectors.length > 0 && (
        <div className="mb-3">
          <p className={`text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Requires:
          </p>
          <div className="flex flex-wrap gap-1">
            {requiredConnectors.slice(0, 3).map((connector, idx) => (
              <span
                key={idx}
                className={`text-xs px-2 py-1 rounded ${
                  isDarkMode 
                    ? 'bg-slate-700 text-gray-300' 
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {connector}
              </span>
            ))}
            {requiredConnectors.length > 3 && (
              <span className={`text-xs px-2 py-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                +{requiredConnectors.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        {similarityPercent && (
          <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {similarityPercent}% match
          </span>
        )}
        <button
          className={`text-sm font-medium px-3 py-1 rounded-lg transition ${
            isDarkMode 
              ? 'text-purple-400 hover:bg-purple-500/20' 
              : 'text-purple-600 hover:bg-purple-50'
          }`}
        >
          Select →
        </button>
      </div>
    </div>
  );
}
