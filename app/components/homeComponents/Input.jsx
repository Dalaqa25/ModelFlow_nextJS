'use client';

import { useRef, useState, useEffect } from 'react';
import LightCard from '@/app/components/shared/LightCard';

export default function Input() {
  const inputRef = useRef(null);
  const [inputValue, setInputValue] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check system preference
    const checkSystemTheme = () => {
      if (typeof window !== 'undefined') {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setIsDarkMode(systemPrefersDark);
      }
    };

    checkSystemTheme();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      setIsDarkMode(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      // Handle submission - can redirect or trigger action
      console.log('Submitted:', inputValue);
    }
  };

  return (
    <div className="w-full">
      {/* Hero Text */}
      <h1 className={`text-2xl sm:text-3xl font-medium text-center mb-10 ${isDarkMode ? 'text-gray-100' : 'bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent'}`}>
        Let's automate your workflow today
      </h1>
      
      {/* Input Field */}
      <LightCard 
        variant="solid" 
        hover={false} 
        padding="none" 
        className={`w-full backdrop-blur-md rounded-3xl ${isDarkMode ? 'bg-slate-800/70 border-slate-700/40' : 'bg-white/90 border-purple-200/60'}`}
      >
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <div className="relative w-full flex items-center">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask anything..."
              rows={1}
              className={`w-full px-4 py-3 pr-12 bg-transparent resize-none focus:outline-none text-base sm:text-lg flex items-center ${isDarkMode ? 'text-gray-100 placeholder-gray-400' : 'text-gray-900 placeholder-gray-500'}`}
              style={{
                minHeight: '52px',
                maxHeight: '200px',
              }}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
            />
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className={`
                absolute right-2 p-2 rounded-lg transition-all duration-200
                ${inputValue.trim()
                  ? 'bg-gradient-to-r from-purple-500 to-purple-700 text-white hover:from-purple-600 hover:to-purple-800 cursor-pointer shadow-lg shadow-purple-500/30'
                  : 'bg-gray-300/50 text-gray-400 cursor-not-allowed'
                }
              `}
              style={{ top: '50%', transform: 'translateY(-50%)' }}
              aria-label="Send"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          </div>
        </form>
      </LightCard>
    </div>
  );
}

