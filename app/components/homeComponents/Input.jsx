'use client';

import { useState, useRef, useEffect } from 'react';
import { useThemeAdaptive } from '@/lib/contexts/theme-adaptive-context';
import SignInDialog from '../auth/login/SignInDialog';
import SignUpDialog from '../auth/signup/SignUpDialog';

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

export default function Input() {
  const { isDarkMode } = useThemeAdaptive();
  const [inputValue, setInputValue] = useState('');
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const inputRef = useRef(null);
  const heroRef = useRef(null);

  // Animation only runs if user hasn't interacted yet
  const isAnimationActive = !hasInteracted && !inputValue;
  const animatedPlaceholder = useTypewriter(PLACEHOLDER_HINTS, isAnimationActive);
  const showAnimatedPlaceholder = isAnimationActive && animatedPlaceholder;

  const handleInteraction = () => {
    if (!hasInteracted) {
      setHasInteracted(true);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        const heroBottom = heroRef.current.getBoundingClientRect().bottom;
        setIsSticky(heroBottom < 200);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const switchToSignUp = () => {
    setIsSignInOpen(false);
    setIsSignUpOpen(true);
  };

  const switchToSignIn = () => {
    setIsSignUpOpen(false);
    setIsSignInOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setIsSignInOpen(true);
    }
  };

  return (
    <div className="w-full" ref={heroRef}>
      {/* Hero Text */}
      <header className="mb-10 space-y-4 text-center lg:text-left">
        <p className={`text-sm uppercase tracking-[0.25em] ${isDarkMode ? 'text-gray-400' : 'text-purple-700/70'}`}>
          Intelligent automation
        </p>
        <h1 className={`text-4xl sm:text-6xl xl:text-7xl 2xl:text-8xl font-semibold leading-tight ${isDarkMode ? 'text-gray-50' : 'text-gray-900'}`}>
          <span>Let's automate</span>
          <span className={`block text-transparent bg-clip-text bg-gradient-to-r ${isDarkMode ? 'from-purple-400 via-pink-400 to-indigo-400' : 'from-purple-600 via-indigo-500 to-purple-800'}`}>
            your workflow
          </span>
          <span className={`block text-transparent bg-clip-text bg-gradient-to-r ${isDarkMode ? 'from-purple-400 via-pink-400 to-indigo-400' : 'from-purple-600 via-indigo-500 to-purple-800'}`}>
            today
          </span>
        </h1>
      </header>
      
      {/* Input Field - becomes sticky on scroll */}
      <div className={`
        transition-all duration-300 ease-out
        ${isSticky 
          ? 'fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-xl' 
          : 'w-full max-w-xl lg:max-w-lg mx-auto lg:mx-0'
        }
      `}>
        <form onSubmit={handleSubmit}>
          <div 
            className={`
              flex items-center gap-2 px-4 py-3 rounded-3xl border-2 transition-all
              ${isDarkMode 
                ? 'bg-slate-800/90 border-purple-500/30 shadow-xl shadow-purple-900/20' 
                : 'bg-white/90 border-purple-200/60 shadow-xl shadow-purple-200/30'
              }
              ${isSticky ? 'backdrop-blur-xl' : 'backdrop-blur-md'}
            `}
            onMouseEnter={handleInteraction}
          >
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onFocus={handleInteraction}
                placeholder={hasInteracted ? "Describe your workflow..." : ""}
                className={`
                  w-full bg-transparent outline-none text-base font-normal
                  ${isDarkMode 
                    ? 'text-gray-100 placeholder:text-gray-500' 
                    : 'text-gray-900 placeholder:text-gray-400'
                  }
                `}
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
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className={`
                px-6 py-1.5 rounded-xl font-semibold text-sm transition-all whitespace-nowrap
                ${inputValue.trim()
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-500/30'
                  : 'bg-gradient-to-r from-purple-600/60 to-indigo-600/60 text-white/70 cursor-not-allowed'
                }
              `}
            >
              Start
            </button>
          </div>
        </form>
      </div>

      {/* Sign In Dialog */}
      <SignInDialog 
        isOpen={isSignInOpen} 
        onClose={() => setIsSignInOpen(false)} 
        onSwitchToSignUp={switchToSignUp}
      />

      {/* Sign Up Dialog */}
      <SignUpDialog 
        isOpen={isSignUpOpen} 
        onClose={() => setIsSignUpOpen(false)} 
        onSwitchToSignIn={switchToSignIn}
      />
    </div>
  );
}
