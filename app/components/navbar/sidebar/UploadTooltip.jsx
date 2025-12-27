'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';

const STORAGE_KEY = 'hasSeenUploadTip';

export default function UploadTooltip() {
    const [show, setShow] = useState(false);

    useEffect(() => {
        // Check if user has seen the tip before
        const hasSeen = localStorage.getItem(STORAGE_KEY);
        if (!hasSeen) {
            // Small delay so it appears after page loads
            const timer = setTimeout(() => setShow(true), 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    const dismiss = () => {
        setShow(false);
        localStorage.setItem(STORAGE_KEY, 'true');
    };

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="fixed left-14 top-[220px] z-50"
                >
                    {/* Arrow pointing left */}
                    <div className="absolute -left-2 top-4 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-8 border-r-slate-800" />
                    
                    {/* Tooltip card */}
                    <div className="bg-slate-800 border border-slate-700/60 rounded-xl p-4 shadow-xl max-w-xs">
                        <div className="flex items-start gap-3">
                            <div className="flex-1">
                                <p className="text-white font-medium text-sm">
                                    📤 Upload your automation here!
                                </p>
                                <p className="text-slate-400 text-xs mt-1">
                                    Share your n8n workflows with the community.
                                </p>
                            </div>
                            <button
                                onClick={dismiss}
                                className="text-slate-400 hover:text-white transition p-1"
                            >
                                <XMarkIcon className="w-4 h-4" />
                            </button>
                        </div>
                        <button
                            onClick={dismiss}
                            className="mt-3 w-full py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium rounded-lg transition"
                        >
                            Got it
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
