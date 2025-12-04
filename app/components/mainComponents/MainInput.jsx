'use client';

import { useState } from 'react';
import { FiSend } from 'react-icons/fi';
import { useThemeAdaptive } from '@/lib/theme-adaptive-context';

export default function MainInput({ onMessageSent, onScopeChange }) {
    const [inputValue, setInputValue] = useState('');
    const [isAtBottom, setIsAtBottom] = useState(false);
    const { isDarkMode, textColors } = useThemeAdaptive();

    const handleScopeOn = () => {
        if (onScopeChange) onScopeChange(true);
    };

    const handleScopeOff = () => {
        if (onScopeChange) onScopeChange(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (inputValue.trim()) {
            const message = inputValue.trim();
            console.log('Submitted:', message);
            setIsAtBottom(true);
            if (onMessageSent) {
                onMessageSent(message);
            }
            setInputValue(''); // Clear input after sending
            // Handle your submission logic here
        }
    };

    return (
        <div 
            className="fixed left-1/2 w-full max-w-3xl px-6 pointer-events-none z-50"
            style={{
                top: isAtBottom ? 'calc(100vh - 7rem)' : '58%',
                transform: isAtBottom ? 'translateX(-50%)' : 'translate(-50%, -50%)',
                transition: 'top 0.6s cubic-bezier(0.4, 0, 0.2, 1), transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
        >
            <form
                onSubmit={handleSubmit}
                className="pointer-events-auto"
                onMouseEnter={handleScopeOn}
                onMouseLeave={handleScopeOff}
                onFocus={handleScopeOn}
                onBlur={handleScopeOff}
            >
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

