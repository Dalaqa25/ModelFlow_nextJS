import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import ArchivedModels from './archivedModels';
import PLANS from '../../plans';

export default function ArchiveBox({ isOpen, onClose, userEmail }) {
    const [models, setModels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalStorageUsedMB, setTotalStorageUsedMB] = useState(0);
    const [userPlan, setUserPlan] = useState('basic');
    const [planLoading, setPlanLoading] = useState(true);
    // Parse the archive storage cap from PLANS based on the user's plan
    const archiveStorageStr = PLANS[userPlan]?.features?.archiveStorage || '100 MB';
    let storageCapMB = 100;
    if (archiveStorageStr.toLowerCase().includes('gb')) {
        storageCapMB = parseInt(archiveStorageStr.replace(/\D/g, '')) * 1024;
    } else if (archiveStorageStr.toLowerCase().includes('mb')) {
        storageCapMB = parseInt(archiveStorageStr.replace(/\D/g, ''));
    }
    const storagePercent = Math.min((totalStorageUsedMB / storageCapMB) * 100, 100);

    useEffect(() => {
        if (!isOpen) return;
        setLoading(true);
        setPlanLoading(true);
        fetch(`/api/models/archived?email=${encodeURIComponent(userEmail || '')}`)
            .then(res => res.json())
            .then(data => {
                setModels(Array.isArray(data) ? data : (data.models || []));
                setTotalStorageUsedMB(data.totalStorageUsedMB ?? 0);
                setUserPlan(data.plan || 'basic');
                setLoading(false);
                setPlanLoading(false);
            })
            .catch(() => {
                setLoading(false);
                setPlanLoading(false);
            });
    }, [isOpen, userEmail]);

    // Log supabasePath for each model whenever models change
    useEffect(() => {
        if (models && models.length > 0) {
            models.forEach(model => {
                const supabasePath = model?.fileStorage?.supabasePath;
            });
        }
    }, [models]);

    // Add this function to re-fetch models after deletion
    const refetchModels = () => {
        setLoading(true);
        setPlanLoading(true);
        fetch(`/api/models/archived?email=${encodeURIComponent(userEmail || '')}`)
            .then(res => res.json())
            .then(data => {
                setModels(Array.isArray(data) ? data : (data.models || []));
                setTotalStorageUsedMB(data.totalStorageUsedMB ?? 0);
                setUserPlan(data.plan || 'basic');
                setLoading(false);
                setPlanLoading(false);
            })
            .catch(() => {
                setLoading(false);
                setPlanLoading(false);
            });
    };

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl transition-opacity" />
                </Transition.Child>
                <div className="fixed inset-0 z-50 overflow-y-auto">
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
                            <Dialog.Panel className="relative bg-slate-800/90 backdrop-blur-md border border-slate-700/60 rounded-2xl shadow-2xl w-full max-w-2xl p-8 text-left">
                                {/* Close button */}
                                <div className="absolute right-4 top-4">
                                    <button
                                        type="button"
                                        className="rounded-lg p-2 text-slate-400 hover:text-slate-300 hover:bg-slate-700/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-800"
                                        onClick={onClose}
                                    >
                                        <span className="sr-only">Close</span>
                                        <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                                    </button>
                                </div>

                                {/* Header */}
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <Dialog.Title as="h3" className="text-2xl font-bold mb-6 text-white">
                                        Archived Models
                                    </Dialog.Title>
                                </motion.div>

                                {/* Storage Usage Indicator */}
                                {!planLoading && (
                                    <motion.div 
                                        className="mb-8"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: 0.1 }}
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-sm font-medium text-slate-300">Storage used</span>
                                            <span className="text-sm font-medium text-slate-400">
                                                {totalStorageUsedMB < 0.01 ? `${(totalStorageUsedMB * 1024).toFixed(1)}KB` : `${totalStorageUsedMB.toFixed(2)}MB`} / {storageCapMB}MB
                                            </span>
                                        </div>
                                        <div className="w-full bg-slate-700/50 rounded-full h-3 overflow-hidden">
                                            <motion.div 
                                                className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full shadow-lg"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${storagePercent}%` }}
                                                transition={{ duration: 0.8, delay: 0.2 }}
                                            />
                                        </div>
                                    </motion.div>
                                )}

                                {/* Content */}
                                <motion.div 
                                    className="text-slate-300 min-h-[200px]"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: 0.2 }}
                                >
                                    {loading ? (
                                        <div className="flex items-center justify-center h-32">
                                            <div className="flex items-center space-x-3 text-slate-400">
                                                <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                                                <span>Loading archived models...</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <ArchivedModels models={models} onModelDeleted={refetchModels} />
                                    )}
                                </motion.div>

                                {/* Footer */}
                                <motion.div 
                                    className="mt-8 flex justify-end"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: 0.3 }}
                                >
                                    <button
                                        onClick={onClose}
                                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-purple-500/25 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-800"
                                    >
                                        Close
                                    </button>
                                </motion.div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
} 