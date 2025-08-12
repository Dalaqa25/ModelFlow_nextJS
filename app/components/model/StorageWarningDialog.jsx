import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import { motion } from 'framer-motion';

export default function StorageWarningDialog({ 
    isOpen, 
    onClose, 
    warningType, // 'exceeds' or 'near_limit'
    currentUsageMB,
    fileSizeMB,
    totalAfterUploadMB,
    storageCapMB,
    storageCapStr,
    planName,
    onArchiveClick,
    onDeleteClick
}) {
    const usagePercent = (totalAfterUploadMB / storageCapMB) * 100;
    
    const getWarningContent = () => {
        if (warningType === 'exceeds') {
            return {
                title: 'Storage Limit Exceeded',
                message: `This upload would exceed your ${storageCapStr} limit.`,
                primaryAction: 'Free Up Space',
                secondaryAction: 'Cancel'
            };
        } else {
            return {
                title: 'Storage Warning',
                message: `This upload will use ${usagePercent.toFixed(1)}% of your ${storageCapStr} limit.`,
                primaryAction: 'Continue Upload',
                secondaryAction: 'Cancel'
            };
        }
    };

    const content = getWarningContent();

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

                <div className="fixed inset-0 z-10 overflow-y-auto">
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
                            <Dialog.Panel className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-slate-800/90 backdrop-blur-md border border-slate-700/60 p-8 shadow-2xl transition-all">
                                {/* Close button */}
                                <div className="absolute right-4 top-4">
                                    <button
                                        type="button"
                                        className="rounded-lg p-2 text-slate-400 hover:text-slate-300 hover:bg-slate-700/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-800"
                                        onClick={onClose}
                                    >
                                        <FaTimes className="h-5 w-5" />
                                    </button>
                                </div>
                                
                                <div className="text-center">
                                    {/* Warning Icon */}
                                    <motion.div
                                        className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20 mb-6"
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ duration: 0.3, type: "spring" }}
                                    >
                                        <FaExclamationTriangle className="h-8 w-8 text-red-400" />
                                    </motion.div>

                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: 0.1 }}
                                    >
                                        <Dialog.Title as="h3" className="text-xl font-semibold text-white mb-4">
                                            {content.title}
                                        </Dialog.Title>
                                    </motion.div>
                                    
                                    <motion.p 
                                        className="text-sm text-slate-300 mb-8 leading-relaxed"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: 0.2 }}
                                    >
                                        {content.message}
                                    </motion.p>
                                    
                                    {/* Storage Bar */}
                                    <motion.div 
                                        className="mb-8"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: 0.3 }}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs text-slate-400">Current Usage</span>
                                            <span className="text-xs text-slate-400">
                                                {currentUsageMB.toFixed(2)}MB / {storageCapMB}MB
                                            </span>
                                        </div>
                                        <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
                                            <motion.div 
                                                className="bg-gradient-to-r from-red-500 to-orange-500 h-2 rounded-full"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${(currentUsageMB / storageCapMB) * 100}%` }}
                                                transition={{ duration: 0.8, delay: 0.4 }}
                                            />
                                        </div>
                                    </motion.div>
                                    
                                    {/* Action buttons for exceeds limit */}
                                    {warningType === 'exceeds' && (
                                        <motion.div 
                                            className="space-y-3 mb-6"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.3, delay: 0.4 }}
                                        >
                                            <p className="text-xs text-slate-400">
                                                Free up space to continue:
                                            </p>
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={onArchiveClick}
                                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
                                                >
                                                    Archive
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={onDeleteClick}
                                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-red-600 to-orange-600 text-white text-sm rounded-xl hover:from-red-700 hover:to-orange-700 transition-all duration-200"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                    
                                    {/* Action Buttons */}
                                    <motion.div 
                                        className="flex gap-3"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: 0.5 }}
                                    >
                                        {warningType === 'near_limit' && (
                                            <button
                                                type="button"
                                                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-purple-500/25 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-800"
                                                onClick={onClose}
                                            >
                                                {content.primaryAction}
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            className="flex-1 px-4 py-3 bg-slate-700/50 backdrop-blur-sm text-slate-300 rounded-xl font-semibold hover:bg-slate-600/50 transition-all duration-200 border border-slate-600/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-800"
                                            onClick={onClose}
                                        >
                                            {content.secondaryAction}
                                        </button>
                                    </motion.div>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
} 