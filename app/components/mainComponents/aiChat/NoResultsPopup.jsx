'use client';

import { useThemeAdaptive } from '@/lib/contexts/theme-adaptive-context';

export default function NoResultsPopup({ query, onClose }) {
    const { isDarkMode } = useThemeAdaptive();

    const handleCommunityClick = () => {
        window.open('/community', '_blank');
        onClose?.();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div
                className={`
          relative max-w-md w-full mx-4 p-6 rounded-2xl shadow-2xl
          ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-gray-900'}
        `}
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    className={`
            absolute top-4 right-4 p-1 rounded-full transition-colors
            ${isDarkMode ? 'hover:bg-slate-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}
          `}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>

                {/* Icon */}
                <div className="flex justify-center mb-4">
                    <div className={`
            w-16 h-16 rounded-full flex items-center justify-center
            ${isDarkMode ? 'bg-purple-500/20' : 'bg-purple-100'}
          `}>
                        <span className="text-3xl">🔍</span>
                    </div>
                </div>

                {/* Title */}
                <h2 className="text-xl font-bold text-center mb-2">
                    Couldn't find what you're looking for?
                </h2>

                {/* Description */}
                <p className={`text-center mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    We don't have an automation for "<span className="font-medium">{query}</span>" yet.
                    Post a request in our community and we'll build it for you!
                </p>

                {/* CTA Button */}
                <button
                    onClick={handleCommunityClick}
                    className="
            w-full py-3 px-4 rounded-xl font-semibold text-white
            bg-gradient-to-r from-purple-600 to-indigo-600
            hover:from-purple-700 hover:to-indigo-700
            transition-all duration-200 shadow-lg hover:shadow-xl
          "
                >
                    Post in Community
                </button>

                {/* Secondary action */}
                <button
                    onClick={onClose}
                    className={`
            w-full mt-3 py-2 text-sm font-medium transition-colors
            ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}
          `}
                >
                    Try a different search
                </button>
            </div>
        </div>
    );
}
