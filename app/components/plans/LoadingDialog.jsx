"use client";

export default function LoadingDialog({ isOpen, planName, onCancel }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-400/20 backdrop-blur-lg flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl">
                <div className="flex flex-col items-center">
                    <div className="mb-6">
                        <svg className="animate-spin h-12 w-12 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-30" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                        Preparing Checkout
                    </h3>
                    <p className="text-gray-600 text-center mb-4">
                        Setting up your {planName} plan upgrade...
                    </p>
                    <div className="flex space-x-2 mb-6">
                        <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    {onCancel && (
                        <button
                            onClick={onCancel}
                            className="text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
} 