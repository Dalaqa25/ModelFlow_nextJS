'use client';

import { useState, useRef } from 'react';
import { FiSend } from 'react-icons/fi';
import { useThemeAdaptive } from '@/lib/theme-adaptive-context';

export default function Input() {
  const { isDarkMode } = useThemeAdaptive();
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      console.log('Submitted:', inputValue);
      // Handle your submission logic here
    }
  };

  return (
    <div className="w-full">
      {/* Hero Text */}
      <div className="mb-10 space-y-4 text-center lg:text-left">
        <p className={`text-sm uppercase tracking-[0.25em] ${isDarkMode ? 'text-gray-400' : 'text-purple-700/70'}`}>
          Intelligent automation
        </p>
        <h1
          className={`text-4xl sm:text-6xl font-semibold leading-tight ${isDarkMode ? 'text-gray-50' : 'text-gray-900'}`}
        >
          <span>Let's automate</span>
          <span className={`block text-transparent bg-clip-text bg-gradient-to-r ${isDarkMode ? 'from-purple-400 via-pink-400 to-indigo-400' : 'from-purple-600 via-indigo-500 to-purple-800'}`}>
            your workflow today
          </span>
        </h1>
      </div>
      
      {/* Custom Input Field */}
      <div className="w-full max-w-3xl mx-auto">
        <form onSubmit={handleSubmit}>
          <div 
            className={`
              flex items-center gap-2 px-4 py-3 rounded-3xl border-2 transition-all backdrop-blur-md
              ${isDarkMode 
                ? 'bg-slate-800/30 border-purple-500/30 shadow-xl shadow-purple-900/20' 
                : 'bg-white/70 border-purple-200/60 shadow-xl shadow-purple-200/30'
              }
            `}
          >
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Describe your workflow..."
              className={`
                flex-1 bg-transparent outline-none text-base font-normal
                ${isDarkMode 
                  ? 'text-gray-100 placeholder:text-gray-500' 
                  : 'text-gray-900 placeholder:text-gray-400'
                }
              `}
            />
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className={`
                px-6 py-1.5 rounded-xl font-semibold text-sm transition-all whitespace-nowrap
                ${inputValue.trim()
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-500/30'
                  : 'bg-gray-300/70 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              Start
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

