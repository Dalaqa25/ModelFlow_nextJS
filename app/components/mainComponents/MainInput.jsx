'use client';

import { useState } from 'react';
import { FiSend } from 'react-icons/fi';
import { useThemeAdaptive } from '@/lib/theme-adaptive-context';

export default function MainInput() {
    const [inputValue, setInputValue] = useState('');
    const { isDarkMode, textColors } = useThemeAdaptive();

    const handleSubmit = (e) => {
        e.preventDefault();
        if (inputValue.trim()) {
            console.log('Submitted:', inputValue);
            // Handle your submission logic here
        }
    };

    return (
        <div className="w-full max-w-3xl">
            <form onSubmit={handleSubmit}>
                <div className={`flex items-center gap-3 px-6 py-5 rounded-2xl border-2 backdrop-blur-md shadow-xl transition-all ${
                    isDarkMode 
                        ? 'border-purple-500/30 bg-slate-800/90 shadow-purple-900/20 hover:border-purple-500/50 focus-within:border-purple-500/70'
                        : 'border-purple-300/40 bg-white/90 shadow-purple-200/30 hover:border-purple-400/60 focus-within:border-purple-500/80'
                }`}>
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Type your message..."
                        className={`flex-1 bg-transparent outline-none text-base font-normal ${
                            isDarkMode ? 'text-gray-100 placeholder:text-gray-500' : 'text-gray-900 placeholder:text-gray-400'
                        }`}
                    />
                    <button
                        type="submit"
                        disabled={!inputValue.trim()}
                        className={`
                            flex items-center justify-center p-2.5 rounded-xl transition-all
                            ${inputValue.trim()
                                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-500/30 hover:scale-105'
                                : isDarkMode 
                                    ? 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                                    : 'bg-gray-200/50 text-gray-400 cursor-not-allowed'
                            }
                        `}
                    >
                        <FiSend className="w-5 h-5" />
                    </button>
                </div>
            </form>
        </div>
    );
}

