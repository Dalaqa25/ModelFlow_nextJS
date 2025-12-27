'use client';

import { useState } from 'react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function AutomationStep3DeveloperKeys({
  detectedKeys,
  formData,
  errors,
  handleBack,
  handleSubmit,
  onKeysChange,
  isSubmitting
}) {
  const [keys, setKeys] = useState(
    detectedKeys.length > 0
      ? detectedKeys.map(key => ({ name: key, value: '' }))
      : [{ name: '', value: '' }]
  );

  const handleKeyChange = (index, field, value) => {
    const newKeys = [...keys];
    newKeys[index][field] = value;
    setKeys(newKeys);
    
    // Convert to object format for parent
    const keysObject = {};
    newKeys.forEach(k => {
      if (k.name && k.value) {
        keysObject[k.name] = k.value;
      }
    });
    onKeysChange(keysObject);
  };

  const addKey = () => {
    setKeys([...keys, { name: '', value: '' }]);
  };

  const removeKey = (index) => {
    const newKeys = keys.filter((_, i) => i !== index);
    setKeys(newKeys.length > 0 ? newKeys : [{ name: '', value: '' }]);
    
    // Update parent
    const keysObject = {};
    newKeys.forEach(k => {
      if (k.name && k.value) {
        keysObject[k.name] = k.value;
      }
    });
    onKeysChange(keysObject);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-4">
        <p className="text-sm text-blue-300">
          <strong>🔑 Developer Keys Detected</strong>
          <br />
          Your automation requires API keys or secrets. These will be securely stored and used when users run your automation.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-slate-200">
            API Keys & Secrets
          </label>
          <button
            type="button"
            onClick={addKey}
            className="flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300 transition"
          >
            <PlusIcon className="h-4 w-4" />
            Add Key
          </button>
        </div>

        {keys.map((key, index) => (
          <div key={index} className="flex gap-3">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Key name (e.g., OPENAI_API_KEY)"
                value={key.name}
                onChange={(e) => handleKeyChange(index, 'name', e.target.value)}
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-white placeholder-slate-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>
            <div className="flex-1">
              <input
                type="password"
                placeholder="Key value"
                value={key.value}
                onChange={(e) => handleKeyChange(index, 'value', e.target.value)}
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-white placeholder-slate-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>
            {keys.length > 1 && (
              <button
                type="button"
                onClick={() => removeKey(index)}
                className="p-2.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        ))}
      </div>

      {errors.developerKeys && (
        <p className="text-sm text-red-400">{errors.developerKeys}</p>
      )}

      <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-4">
        <p className="text-xs text-yellow-300">
          ⚠️ <strong>Note:</strong> Our AI auto-detects required keys from your workflow, but it may not be 100% accurate. Please review and edit the detected keys if needed.
        </p>
      </div>

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
