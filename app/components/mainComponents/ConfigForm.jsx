'use client';

import { useThemeAdaptive } from '@/lib/theme-adaptive-context';
import { useState } from 'react';

export default function ConfigForm({ requiredInputs, automationId, onSubmit }) {
  const { isDarkMode } = useThemeAdaptive();
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields are filled
    const missingFields = requiredInputs.filter(input => !formData[input]?.trim());
    if (missingFields.length > 0) {
      alert(`Please fill in: ${missingFields.join(', ')}`);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit?.(formData, automationId);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Convert snake_case to Title Case for labels
  const formatLabel = (key) => {
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`
        rounded-xl p-5 border max-w-md
        ${isDarkMode 
          ? 'bg-slate-800/50 border-slate-700' 
          : 'bg-white border-gray-200 shadow-sm'
        }
      `}
    >
      <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
        Configuration Required
      </h3>

      <div className="space-y-4">
        {requiredInputs.map((input) => (
          <div key={input}>
            <label
              htmlFor={input}
              className={`block text-sm font-medium mb-1 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              {formatLabel(input)}
            </label>
            <input
              id={input}
              type="text"
              value={formData[input] || ''}
              onChange={(e) => handleChange(input, e.target.value)}
              placeholder={`Enter ${formatLabel(input).toLowerCase()}`}
              className={`
                w-full px-3 py-2 rounded-lg border transition
                ${isDarkMode
                  ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-400 focus:border-purple-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-purple-500'
                }
                focus:outline-none focus:ring-2 focus:ring-purple-500/20
              `}
            />
          </div>
        ))}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className={`
          w-full mt-5 px-4 py-2 rounded-lg font-medium transition
          ${isSubmitting
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-purple-600 hover:bg-purple-700'
          }
          text-white
        `}
      >
        {isSubmitting ? 'Submitting...' : 'Submit Configuration'}
      </button>
    </form>
  );
}
