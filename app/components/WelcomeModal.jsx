'use client';

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { FaUpload, FaRocket } from 'react-icons/fa';
import AutomationUpload from './automationUpload/AutomationUpload';

const WELCOME_SEEN_KEY = 'welcome_modal_seen';

export default function WelcomeModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [showUploadDialog, setShowUploadDialog] = useState(false);

    useEffect(() => {
        // Check if user has seen the welcome modal
        const hasSeen = localStorage.getItem(WELCOME_SEEN_KEY);
        if (!hasSeen) {
            // Small delay so it appears after page loads
            const timer = setTimeout(() => setIsOpen(true), 800);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleClose = () => {
        setIsOpen(false);
        localStorage.setItem(WELCOME_SEEN_KEY, 'true');
    };

    const handleUploadClick = () => {
        setIsOpen(false);
        localStorage.setItem(WELCOME_SEEN_KEY, 'true');
        setShowUploadDialog(true);
    };

    const handleExploreClick = () => {
        handleClose();
    };

    return (
        <>
            <Transition appear show={isOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={handleClose}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-slate-900 border border-slate-700/60 p-8 text-center shadow-xl transition-all">
                                    <div className="mb-6">
                                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                                            <span className="text-3xl">🎉</span>
                                        </div>
                                        <Dialog.Title className="text-2xl font-bold text-white mb-2">
                                            Welcome to ModelGrow!
                                        </Dialog.Title>
                                        <p className="text-slate-400">
                                            Share your n8n automations with the community and let others benefit from your work.
                                        </p>
                                    </div>

                                    <div className="space-y-3">
                                        <button
                                            onClick={handleUploadClick}
                                            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl shadow-lg transition-all duration-300 hover:scale-[1.02]"
                                        >
                                            <FaUpload className="w-5 h-5" />
                                            Upload My First Automation
                                        </button>
                                        
                                        <button
                                            onClick={handleExploreClick}
                                            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl border border-slate-700 transition-all duration-300"
                                        >
                                            <FaRocket className="w-5 h-5" />
                                            Explore First
                                        </button>
                                    </div>

                                    <p className="mt-6 text-xs text-slate-500">
                                        You can always upload later from the sidebar
                                    </p>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>

            <AutomationUpload
                isOpen={showUploadDialog}
                onClose={() => setShowUploadDialog(false)}
                onUploadSuccess={() => setShowUploadDialog(false)}
            />
        </>
    );
}
