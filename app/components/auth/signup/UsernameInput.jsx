'use client';

import { useState, useEffect, useCallback } from 'react';

export default function UsernameInput({ 
  value, 
  onChange, 
  validationErrors, 
  usernameAvailable, 
  setUsernameAvailable 
}) {
  const [checkingUsername, setCheckingUsername] = useState(false);

  // Debounced username availability check
  const checkUsernameAvailability = useCallback(async (username) => {
    if (!username || username.length < 5) {
      setUsernameAvailable(null);
      return;
    }

    setCheckingUsername(true);
    try {
      const response = await fetch('/api/auth/check-username', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });

      const data = await response.json();
      setUsernameAvailable(data.available);
    } catch (error) {
      console.error('Error checking username:', error);
      setUsernameAvailable(null);
    } finally {
      setCheckingUsername(false);
    }
  }, [setUsernameAvailable]);

  // Debounce username checking
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (value) {
        checkUsernameAvailability(value);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [value, checkUsernameAvailability]);

  const getBorderColor = () => {
    if (validationErrors?.length > 0) return 'border-red-500';
    if (usernameAvailable === true) return 'border-green-500';
    if (usernameAvailable === false) return 'border-red-500';
    return 'border-slate-600/50';
  };

  const renderStatusIcon = () => {
    if (checkingUsername) {
      return (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-400"></div>
      );
    }

    if (usernameAvailable === true && !checkingUsername) {
      return (
        <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      );
    }

    if (usernameAvailable === false && !checkingUsername) {
      return (
        <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      );
    }

    return null;
  };

  return (
    <div>
      <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
        Username
      </label>
      <div className="relative">
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          required
          className={`w-full px-4 py-3 bg-slate-700/50 border rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm transition-all duration-300 ${getBorderColor()}`}
          placeholder="Choose a username (5-20 characters)"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        {renderStatusIcon() && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {renderStatusIcon()}
          </div>
        )}
      </div>
      
      {validationErrors?.length > 0 && (
        <div className="mt-1 text-sm text-red-400">
          {validationErrors.map((error, index) => (
            <div key={index}>{error}</div>
          ))}
        </div>
      )}
      
      {usernameAvailable === true && !validationErrors?.length && (
        <div className="mt-1 text-sm text-green-400">Username is available!</div>
      )}
      
      {usernameAvailable === false && (
        <div className="mt-1 text-sm text-red-400">Username is already taken</div>
      )}
    </div>
  );
}