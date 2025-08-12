import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { motion } from 'framer-motion';

export default function UploadProgressDialog({ isOpen, progress, stage, fileName }) {
    const getStageText = (stage) => {
        switch (stage) {
            case 'uploading':
                return 'Uploading your model...';
            case 'processing':
                return 'Processing your model...';
            case 'analyzing':
                return 'Analyzing model structure...';
            case 'validating':
                return 'Validating model files...';
            default:
                return 'Processing...';
        }
    };

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={() => {}}>
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
                            <Dialog.Panel className="relative bg-slate-800/90 backdrop-blur-md border border-slate-700/60 rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-6 max-w-md w-full">
                                {/* Animated Upload Icon */}
                                <motion.div
                                    className="relative"
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                >
                                    <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                                </motion.div>

                                {/* Stage Text */}
                                <motion.div 
                                    className="text-center"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <Dialog.Title as="h3" className="text-lg font-semibold text-white mb-2">
                                        {getStageText(stage)}
                                    </Dialog.Title>
                                    {fileName && (
                                        <p className="text-sm text-slate-400 truncate max-w-xs">
                                            {fileName}
                                        </p>
                                    )}
                                </motion.div>

                                {/* Progress Bar */}
                                <motion.div 
                                    className="w-full"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: 0.1 }}
                                >
                                    <div className="w-full bg-slate-700/50 rounded-full h-3 overflow-hidden">
                                        <motion.div 
                                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full shadow-lg"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress}%` }}
                                            transition={{ duration: 0.5 }}
                                        />
                                    </div>
                                    <div className="flex justify-between mt-2">
                                        <span className="text-xs text-slate-400">Progress</span>
                                        <span className="text-xs text-slate-400">{progress}%</span>
                                    </div>
                                </motion.div>

                                {/* Please wait message */}
                                <motion.p 
                                    className="text-sm text-slate-400 text-center"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.3, delay: 0.2 }}
                                >
                                    Please wait while we process your model. This may take a few moments.
                                </motion.p>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
} 