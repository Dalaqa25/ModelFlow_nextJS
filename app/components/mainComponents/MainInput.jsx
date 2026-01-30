'use client';

import { useState, useEffect, useRef } from 'react';
import { FiSend, FiSquare } from 'react-icons/fi';
import { useThemeAdaptive } from '@/lib/contexts/theme-adaptive-context';
import { useSidebar } from '@/lib/contexts/sidebar-context';

const PLACEHOLDER_HINTS = [
    "I want to automate my YouTube uploads...",
    "Find me automations for email marketing...",
    "How can I automate my social media posts?",
    "Show me workflows for lead generation...",
    "I need to automate invoice processing...",
    "Help me schedule content across platforms...",
    "Automate my customer support responses...",
];

function useTypewriter(texts, isActive, typingSpeed = 50, deletingSpeed = 30, pauseDuration = 2000) {
    const [displayText, setDisplayText] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isTyping, setIsTyping] = useState(true);
    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        // Don't run if not active
        if (!isActive) return;
        
        const currentText = texts[currentIndex];
        
        if (isPaused) {
            const pauseTimer = setTimeout(() => {
                setIsPaused(false);
                setIsTyping(false);
            }, pauseDuration);
            return () => clearTimeout(pauseTimer);
        }

        if (isTyping) {
            if (displayText.length < currentText.length) {
                const timer = setTimeout(() => {
                    setDisplayText(currentText.slice(0, displayText.length + 1));
                }, typingSpeed);
                return () => clearTimeout(timer);
            } else {
                setIsPaused(true);
            }
        } else {
            if (displayText.length > 0) {
                const timer = setTimeout(() => {
                    setDisplayText(displayText.slice(0, -1));
                }, deletingSpeed);
                return () => clearTimeout(timer);
            } else {
                setCurrentIndex((prev) => (prev + 1) % texts.length);
                setIsTyping(true);
            }
        }
    }, [displayText, currentIndex, isTyping, isPaused, texts, typingSpeed, deletingSpeed, pauseDuration, isActive]);

    return displayText;
}

export default function MainInput({ onMessageSent, onScopeChange, isLoading = false, onStopGeneration }) {
    const [inputValue, setInputValue] = useState('');
    const [isAtBottom, setIsAtBottom] = useState(false);
    const [hasInteracted, setHasInteracted] = useState(false);
    const textareaRef = useRef(null);
    const { isDarkMode } = useThemeAdaptive();
    const { isMobile } = useSidebar();
    
    // Animation only runs if user hasn't interacted yet
    const isAnimationActive = !hasInteracted && !inputValue;
    const animatedPlaceholder = useTypewriter(PLACEHOLDER_HINTS, isAnimationActive);
    
    // Stop animation permanently on any interaction
    const handleInteraction = () => {
        if (!hasInteracted) {
            setHasInteracted(true);
        }
    };
    
    // Show animated placeholder only when animation is active
    const showAnimatedPlaceholder = isAnimationActive && animatedPlaceholder;

    // Auto-resize textarea
    const adjustTextareaHeight = () => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            const maxHeight = isMobile ? 120 : 150; // Max height in pixels
            textarea.style.height = Math.min(textarea.scrollHeight, maxHeight) + 'px';
        }
    };

    useEffect(() => {
        adjustTextareaHeight();
    }, [inputValue]);

    const handleInputChange = (e) => {
        setInputValue(e.target.value);
    };

    const handleKeyDown = (e) => {
        // Submit on Enter (without Shift)
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

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
            setIsAtBottom(true);
            if (onMessageSent) {
                onMessageSent(message);
            }
            setInputValue(''); // Clear input after sending
            // Handle your submission logic here
        }
    };

    // Different top position for mobile vs desktop
    // On mobile, position from top without vertical centering so it grows downward
    const topPosition = isAtBottom 
        ? 'calc(100vh - 7rem)' 
        : isMobile ? '52%' : '58%';

    return (
        <div 
            className="fixed left-1/2 w-full max-w-4xl px-6 pointer-events-none z-50"
            style={{
                top: topPosition,
                transform: isAtBottom 
                    ? 'translateX(-50%)' 
                    : isMobile 
                        ? 'translateX(-50%)' // Mobile: no vertical centering, grows downward
                        : 'translate(-50%, -50%)', // Desktop: centered
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
                <div className={`flex items-end gap-3 px-6 py-4 rounded-[2rem] border-2 backdrop-blur-md shadow-xl transition-all ${
                    isDarkMode 
                        ? 'border-purple-500/30 bg-slate-800/90 shadow-purple-900/20 hover:border-purple-500/50'
                        : 'border-purple-300/40 bg-white/90 shadow-purple-200/30 hover:border-purple-400/60'
                }`}
                    onMouseEnter={handleInteraction}
                >
                    <div className="flex-1 relative">
                        <textarea
                            ref={textareaRef}
                            value={inputValue}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            onFocus={handleInteraction}
                            placeholder={hasInteracted ? "I want to automate..." : ""}
                            rows={1}
                            className={`w-full bg-transparent border-none focus:outline-none focus:ring-0 text-base font-normal transition-opacity duration-300 resize-none overflow-y-auto ${
                                isDarkMode ? 'text-gray-100 placeholder:text-gray-500' : 'text-gray-900 placeholder:text-gray-400'
                            }`}
                            style={{ maxHeight: isMobile ? '120px' : '150px' }}
                        />
                        {showAnimatedPlaceholder && (
                            <div className={`absolute top-0 left-0 right-0 pointer-events-none flex items-center text-base font-normal ${
                                isDarkMode ? 'text-gray-500' : 'text-gray-400'
                            }`}>
                                {animatedPlaceholder}
                                <span className="animate-pulse ml-0.5">|</span>
                            </div>
                        )}
                    </div>
                    {isLoading ? (
                        <button
                            type="button"
                            onClick={onStopGeneration}
                            className="flex items-center justify-center p-2.5 rounded-2xl transition-all bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg shadow-red-500/30 hover:scale-105"
                        >
                            <FiSquare className="w-5 h-5" />
                        </button>
                    ) : (
                        <button
                            type="submit"
                            disabled={!inputValue.trim()}
                            className={`
                                flex items-center justify-center p-2.5 rounded-2xl transition-all
                                ${inputValue.trim()
                                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-500/30 hover:scale-105'
                                    : isDarkMode 
                                        ? 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                }
                            `}
                        >
                            <FiSend className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}

