'use client';

import { useThemeAdaptive } from '@/lib/theme-adaptive-context';
import { useState } from 'react';

export default function ConfigForm({ requiredInputs, automationId, onSubmit }) {
  const { isDarkMode } = useThemeAdaptive();
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Debug: Log what we receive
  console.log('📋 ConfigForm received requiredInputs:', requiredInputs);
  console.log('   Type:', typeof requiredInputs);
  console.log('   Is Array:', Array.isArray(requiredInputs));
  if (Array.isArray(requiredInputs) && requiredInputs.length > 0) {
    console.log('   First element:', requiredInputs[0]);
    console.log('   First element type:', typeof requiredInputs[0]);
  }

  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleFileChange = async (key, file) => {
    if (!file) return;
    
    // Convert file to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result;
      setFormData(prev => ({ ...prev, [key]: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields are filled
    const missingFields = requiredInputs.filter(input => {
      const inputName = typeof input === 'string' ? input : input.name;
      return !formData[inputName];
    });
    
    if (missingFields.length > 0) {
      const fieldNames = missingFields.map(f => typeof f === 'string' ? f : f.name);
      alert(`Please fill in: ${fieldNames.join(', ')}`);
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
        {requiredInputs.map((input) => {
          // Handle both string format and object format {name, type}
          const inputName = typeof input === 'string' ? input : input.name;
          const inputType = typeof input === 'string' ? 'text' : (input.type || 'text');
          
          return (
            <div key={inputName}>
              <label
                htmlFor={inputName}
                className={`block text-sm font-medium mb-1 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                {formatLabel(inputName)}
              </label>
              
              {inputType === 'file' ? (
                <input
                  id={inputName}
                  type="file"
                  onChange={(e) => handleFileChange(inputName, e.target.files[0])}
                  className={`
                    w-full px-3 py-2 rounded-lg border transition
                    ${isDarkMode
                      ? 'bg-slate-700 border-slate-600 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-600 file:text-white hover:file:bg-purple-700'
                      : 'bg-white border-gray-300 text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-600 file:text-white hover:file:bg-purple-700'
                    }
                    focus:outline-none focus:ring-2 focus:ring-purple-500/20
                  `}
                />
              ) : (
                <input
                  id={inputName}
                  type={inputType}
                  value={formData[inputName] || ''}
                  onChange={(e) => handleChange(inputName, e.target.value)}
                  placeholder={`Enter ${formatLabel(inputName).toLowerCase()}`}
                  className={`
                    w-full px-3 py-2 rounded-lg border transition
                    ${isDarkMode
                      ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-400 focus:border-purple-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-purple-500'
                    }
                    focus:outline-none focus:ring-2 focus:ring-purple-500/20
                  `}
                />
              )}
            </div>
          );
        })}
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
