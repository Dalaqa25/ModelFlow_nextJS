'use client';

import { useState } from 'react';
import { validateSignupForm, getPasswordStrength } from '@/lib/validation-utils';

/**
 * Demo component to showcase validation features
 * This can be used for testing or documentation purposes
 */
export default function ValidationDemo() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: ''
  });
  const [validation, setValidation] = useState(null);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: '', color: 'text-gray-400' });

  const handleInputChange = (field, value) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    
    // Update password strength in real-time
    if (field === 'password') {
      setPasswordStrength(getPasswordStrength(value));
    }
    
    // Validate form
    const validationResult = validateSignupForm(newFormData);
    setValidation(validationResult);
  };

  const testCases = [
    { email: 'test@example.com', password: 'Password123!', username: 'testuser' },
    { email: 'invalid-email', password: 'weak', username: 'ab' },
    { email: 'user@domain.com', password: 'StrongPass123!', username: 'validuser123' }
  ];

  const runTestCase = (testCase) => {
    setFormData(testCase);
    const validationResult = validateSignupForm(testCase);
    setValidation(validationResult);
    setPasswordStrength(getPasswordStrength(testCase.password));
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-slate-800 rounded-lg">
      <h2 className="text-2xl font-bold text-white mb-6">Validation Demo</h2>
      
      {/* Test Cases */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-300 mb-3">Quick Test Cases:</h3>
        <div className="flex flex-wrap gap-2">
          {testCases.map((testCase, index) => (
            <button
              key={index}
              onClick={() => runTestCase(testCase)}
              className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 transition-colors"
            >
              Test {index + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Email
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className={`w-full px-3 py-2 bg-slate-700 border rounded text-white ${
              validation?.errors?.email?.length > 0 ? 'border-red-500' : 'border-slate-600'
            }`}
            placeholder="Enter email"
          />
          {validation?.errors?.email?.length > 0 && (
            <div className="text-red-400 text-sm mt-1">
              {validation.errors.email.map((error, i) => (
                <div key={i}>{error}</div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Username
          </label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => handleInputChange('username', e.target.value)}
            className={`w-full px-3 py-2 bg-slate-700 border rounded text-white ${
              validation?.errors?.username?.length > 0 ? 'border-red-500' : 'border-slate-600'
            }`}
            placeholder="Enter username (5-20 chars)"
          />
          {validation?.errors?.username?.length > 0 && (
            <div className="text-red-400 text-sm mt-1">
              {validation.errors.username.map((error, i) => (
                <div key={i}>{error}</div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Password
          </label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            className={`w-full px-3 py-2 bg-slate-700 border rounded text-white ${
              validation?.errors?.password?.length > 0 ? 'border-red-500' : 'border-slate-600'
            }`}
            placeholder="Enter password"
          />
          
          {/* Password Strength */}
          {formData.password && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400">Strength:</span>
                <span className={`text-xs font-medium ${passwordStrength.color}`}>
                  {passwordStrength.strengthText}
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    passwordStrength.score <= 1 ? 'bg-red-500' :
                    passwordStrength.score <= 2 ? 'bg-orange-500' :
                    passwordStrength.score <= 3 ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                ></div>
              </div>
              <div className={`text-xs mt-1 ${passwordStrength.color}`}>
                {passwordStrength.feedback}
              </div>
            </div>
          )}
          
          {validation?.errors?.password?.length > 0 && (
            <div className="text-red-400 text-sm mt-1">
              {validation.errors.password.map((error, i) => (
                <div key={i}>{error}</div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Validation Summary */}
      {validation && (
        <div className="mt-6 p-4 bg-slate-700 rounded">
          <h3 className="text-lg font-semibold text-gray-300 mb-2">Validation Summary:</h3>
          <div className={`text-sm font-medium ${validation.isValid ? 'text-green-400' : 'text-red-400'}`}>
            {validation.isValid ? '✅ All validations passed!' : '❌ Validation failed'}
          </div>
          {!validation.isValid && (
            <div className="mt-2 text-sm text-gray-300">
              <div>Total errors: {Object.values(validation.errors).flat().length}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
