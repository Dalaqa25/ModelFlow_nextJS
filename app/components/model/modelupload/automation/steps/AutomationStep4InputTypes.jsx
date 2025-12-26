'use client';

import { useState, useEffect } from 'react';

const INPUT_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'file', label: 'File Upload' },
  { value: 'url', label: 'URL' },
  { value: 'number', label: 'Number' },
  { value: 'email', label: 'Email' },
  { value: 'date', label: 'Date' },
];

export default function AutomationStep4InputTypes({
  detectedInputs,
  formData,
  errors,
  handleBack,
  handleSubmit,
  onInputTypesChange,
  isSubmitting
}) {
  const [inputTypes, setInputTypes] = useState(
    detectedInputs.reduce((acc, input) => {
      // Auto-detect type based on input name
      if (input === 'FILE_INPUT' || input.includes('FILE') || input.includes('CV') || input.includes('DOCUMENT')) {
        acc[input] = 'file';
      } else if (input.includes('URL') || input.includes('LINK')) {
        acc[input] = 'url';
      } else if (input.includes('EMAIL')) {
        acc[input] = 'email';
      } else if (input.includes('DATE')) {
        acc[input] = 'date';
      } else if (input.includes('AGE') || input.includes('YEARS') || input.includes('COUNT') || input.includes('NUMBER')) {
        acc[input] = 'number';
      } else {
        acc[input] = 'text';
      }
      return acc;
    }, {})
  );

  // Notify parent of initial input types on mount
  useEffect(() => {
    onInputTypesChange(inputTypes);
  }, []); // Only run once on mount

  const handleTypeChange = (inputName, type) => {
    const newTypes = { ...inputTypes, [inputName]: type };
    setInputTypes(newTypes);
    onInputTypesChange(newTypes);
  };

  // Convert snake_case to Title Case for display
  const formatLabel = (key) => {
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-4">
        <p className="text-sm text-blue-300">
          <strong>📝 Configure Input Types</strong>
          <br />
          Specify what type of data each input field should accept. This determines what kind of form field users will see.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-slate-200">
            Detected Input Fields ({detectedInputs.length})
          </label>
        </div>

        {detectedInputs.length === 0 && (
          <div className="rounded-lg border border-slate-600 bg-slate-800/50 p-6 text-center">
            <p className="text-slate-400 text-sm">
              ✅ No user inputs detected. This automation doesn't require configuration from users.
            </p>
          </div>
        )}

        {detectedInputs.map((input) => (
          <div key={input} className="rounded-lg border border-slate-600 bg-slate-800 p-4">
            <label className="block text-sm font-medium text-white mb-2">
              {formatLabel(input)}
            </label>
            <select
              value={inputTypes[input]}
              onChange={(e) => handleTypeChange(input, e.target.value)}
              className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-2.5 text-white focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            >
              {INPUT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-400 mt-1">
              {inputTypes[input] === 'text' && 'Users will see a text input field'}
              {inputTypes[input] === 'file' && 'Users will see a file upload button'}
              {inputTypes[input] === 'url' && 'Users will see a URL input field'}
              {inputTypes[input] === 'number' && 'Users will see a number input field'}
              {inputTypes[input] === 'email' && 'Users will see an email input field'}
              {inputTypes[input] === 'date' && 'Users will see a date picker'}
            </p>
          </div>
        ))}
      </div>

      {errors.inputTypes && (
        <p className="text-sm text-red-400">{errors.inputTypes}</p>
      )}

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={handleBack}
          disabled={isSubmitting}
          className="flex-1 rounded-lg border border-slate-600 bg-slate-800 px-6 py-3 font-medium text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex-1 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 font-medium text-white hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {isSubmitting ? 'Publishing...' : 'Publish Automation'}
        </button>
      </div>
    </div>
  );
}
