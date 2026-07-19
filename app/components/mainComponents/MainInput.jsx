'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { FiSend, FiSquare, FiUpload, FiMic, FiMicOff, FiZap, FiBriefcase } from 'react-icons/fi';
import { FaLinkedinIn, FaTiktok, FaCar } from 'react-icons/fa';
import { useSidebar } from '@/lib/contexts/sidebar-context';
import { useAuth } from '@/lib/auth/supabase-auth-context';

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

export default function MainInput({ onMessageSent, onScopeChange, isLoading = false, onStopGeneration, isUploadActive, onFileUpload, chatStarted = false, greetingSlot = null, isLanding = false, onScrollExplore, onAuthRequired }) {
    const [inputValue, setInputValue] = useState('');
    const [isAtBottomInternal, setIsAtBottomInternal] = useState(false);
    const [scrolledDown, setScrolledDown] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolledDown(window.scrollY > 100);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);
    const isAtBottom = chatStarted || isAtBottomInternal;
    const [hasInteracted, setHasInteracted] = useState(false);
    const textareaRef = useRef(null);
    const fileInputRef = useRef(null);
    const { isMobile, isExpanded } = useSidebar();
    const { isAuthenticated } = useAuth();

    const sidebarOffset = !isMobile ? (isExpanded ? 256 : 52) : 0;

    // --- Voice recording ---
    const [isRecording, setIsRecording] = useState(false);
    const recognitionRef = useRef(null);
    const isSpeechSupported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

    const startRecording = useCallback(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        let finalTranscript = '';

        recognition.onstart = () => setIsRecording(true);

        recognition.onresult = (event) => {
            let interim = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const t = event.results[i][0].transcript;
                if (event.results[i].isFinal) finalTranscript += t;
                else interim = t;
            }
            setInputValue(finalTranscript + interim);
            handleInteraction();
        };

        recognition.onend = () => {
            setIsRecording(false);
            recognitionRef.current = null;
        };

        recognition.onerror = () => {
            setIsRecording(false);
            recognitionRef.current = null;
        };

        recognitionRef.current = recognition;
        recognition.start();
    }, []);

    const stopRecording = useCallback(() => {
        recognitionRef.current?.stop();
    }, []);

    const toggleRecording = () => {
        if (isRecording) stopRecording();
        else startRecording();
    };
    // --- End voice recording ---

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
        
        // Check if user is authenticated before allowing message send
        if (!isAuthenticated && onAuthRequired) {
            onAuthRequired();
            return;
        }
        
        if (inputValue.trim()) {
            const message = inputValue.trim();
            const accepted = onMessageSent ? onMessageSent(message) : false;
            if (accepted) {
                setIsAtBottomInternal(true);
                setInputValue('');
            }
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file && onFileUpload) {
            onFileUpload(file);
            e.target.value = ''; // Reset
        }
    };

    // Different position for mobile vs desktop
    const positioning = isAtBottom
        ? { bottom: '1rem', top: 'auto' }
        : { top: '50%', bottom: 'auto' };

    const transform = isAtBottom
        ? 'translateX(-50%)'
        : isMobile
            ? 'translate(-50%, -50%)'
            : 'translate(-50%, -50%)';

    return (
        <div
            className="fixed pointer-events-none z-50"
            style={{
                ...(isAtBottom
                    ? { bottom: '1rem', left: sidebarOffset, right: 0 }
                    : { top: isAuthenticated ? 'calc(50% - 140px)' : 'calc(50% - 90px)', left: sidebarOffset, right: 0, transform: 'translateY(-50%)' }
                ),
                transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1), bottom 0.6s cubic-bezier(0.4, 0, 0.2, 1), top 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
        >
            <div className="w-full max-w-3xl mx-auto px-6">
            {/* Greeting sits directly above input as one unit */}
            {greetingSlot && (
                <div className="w-full flex justify-center mb-6">
                    {greetingSlot}
                </div>
            )}
            <form
                onSubmit={handleSubmit}
                className="pointer-events-auto"
                onMouseEnter={handleScopeOn}
                onMouseLeave={handleScopeOff}
                onFocus={handleScopeOn}
                onBlur={handleScopeOff}
            >
                <div className="landing-input-card flex items-end gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 rounded-[1.5rem] sm:rounded-[2rem] transition-all duration-300 hover:-translate-y-0.5 focus-within:-translate-y-0.5 focus-within:border-[var(--landing-accent)]"
                    onMouseEnter={handleInteraction}
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                    />

                    {isUploadActive && (
                        <button
                            type="button"
                            onClick={handleUploadClick}
                            className="p-2 -ml-2 rounded-xl text-[var(--landing-accent-3)] hover:bg-white/30 transition-colors animate-pulse"
                            title="Upload File"
                        >
                            <FiUpload className="w-6 h-6" />
                        </button>
                    )}

                    <div className="flex-1 relative">
                        <textarea
                            ref={textareaRef}
                            value={inputValue}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            onFocus={handleInteraction}
                            placeholder={hasInteracted ? "I want to automate..." : ""}
                            rows={1}
                            className="w-full bg-transparent !border-0 !outline-0 !ring-0 !shadow-none text-sm sm:text-base font-bold transition-opacity duration-300 resize-none overflow-y-auto text-[var(--landing-ink)] placeholder:text-[var(--landing-muted)]"
                            style={{ maxHeight: isMobile ? '120px' : '150px', outline: 'none !important', border: 'none !important', boxShadow: 'none !important' }}
                        />
                        {showAnimatedPlaceholder && (
                            <div className="absolute top-0 left-0 right-[40px] pointer-events-none flex items-center text-sm sm:text-base font-bold text-[var(--landing-muted)]">
                                <span className="whitespace-nowrap overflow-hidden text-ellipsis block max-w-full">
                                    {animatedPlaceholder}
                                </span>
                                <span className="animate-pulse ml-0.5 flex-shrink-0">|</span>
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
                        <>
                            {isSpeechSupported && (
                                <button
                                    type="button"
                                    onClick={toggleRecording}
                                    className={`flex items-center justify-center p-2 sm:p-2.5 rounded-xl sm:rounded-2xl transition-all ${
                                        isRecording
                                            ? 'bg-[var(--landing-accent-2)] text-white shadow-[0_8px_24px_rgba(41,185,154,0.28)] animate-pulse'
                                            : 'text-[var(--landing-muted)] hover:text-[var(--landing-ink)] hover:bg-white/30'
                                    }`}
                                    title={isRecording ? 'Stop recording' : 'Voice input'}
                                >
                                    {isRecording ? <FiMicOff className="w-5 h-5" /> : <FiMic className="w-5 h-5" />}
                                </button>
                            )}
                            <button
                                type="submit"
                                disabled={!inputValue.trim()}
                                className={`
                                    flex items-center justify-center p-2 sm:p-2.5 rounded-xl sm:rounded-2xl transition-all
                                    ${inputValue.trim()
                                        ? 'landing-button hover:-translate-y-0.5'
                                        : 'bg-white/40 text-[var(--landing-muted)] cursor-not-allowed border border-[var(--landing-border)]'
                                    }
                                `}
                            >
                                <FiSend className="w-5 h-5" />
                            </button>
                        </>
                    )}
                </div>
            </form>
            {!chatStarted && !isAtBottomInternal && !scrolledDown && (
                    <div className="flex gap-2 sm:gap-3 mt-4 overflow-x-auto pb-1 scrollbar-hide justify-center flex-wrap max-w-4xl mx-auto px-4">
                        {[
                            { icon: <FiBriefcase className="w-3.5 h-3.5 flex-shrink-0" />, label: 'Auto Job Matcher', prompt: 'I want to use the Auto Job Matcher automation' },
                            { icon: <FaLinkedinIn className="w-3.5 h-3.5 flex-shrink-0" />, label: 'LinkedIn Auto Blog Poster', prompt: 'I want to use the LinkedIn Auto Blog Poster automation' },
                            { icon: <FaCar className="w-3.5 h-3.5 flex-shrink-0" />, label: 'Auto Parts Search', prompt: 'I want to use the Auto Parts Search Engine automation' },
                            { icon: <FaTiktok className="w-3.5 h-3.5 flex-shrink-0" />, label: 'TikTok Scheduled Auto-Post', prompt: 'I want to use the TikTok Scheduled Auto-Post automation', mobileHide: true },
                            { icon: <FiZap className="w-3.5 h-3.5 flex-shrink-0 hidden sm:block" />, label: 'Viral Pattern Detector', prompt: 'I want to use the Viral Pattern Detector automation', mobileHide: true },
                    ].map(({ icon, label, prompt, mobileHide }) => (
                        <button
                            key={label}
                            type="button"
                            onClick={() => {
                                // Check if user is authenticated before allowing automation badge clicks
                                if (!isAuthenticated && onAuthRequired) {
                                    onAuthRequired();
                                    return;
                                }
                                setInputValue(prompt);
                                handleInteraction();
                                textareaRef.current?.focus();
                            }}
                            className={`landing-card-soft pointer-events-auto items-center gap-2 whitespace-nowrap text-xs sm:text-sm font-bold px-4 py-2 rounded-2xl text-[var(--landing-ink)] hover:-translate-y-0.5 transition-all duration-200 ${mobileHide && isAuthenticated ? 'hidden sm:flex' : 'flex'}`}
                        >
                            {icon}
                            {label}
                        </button>
                    ))}
                </div>
            )}
            </div>
        </div>
    );
}
