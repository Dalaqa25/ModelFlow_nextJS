import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { motion } from 'framer-motion';

export default function UploadProgressDialog({ isOpen, progress, stage, fileName, errorMessage, isError = false, realTimeMessage, websocketData }) {
    // Debug logging
    console.log('UploadProgressDialog props:', {
        isOpen,
        progress,
        stage,
        realTimeMessage,
        websocketData,
        isError
    });
    const getStageText = (stage) => {
        // Check if stage contains error information
        if (stage && stage.includes('Failed at:')) {
            return stage;
        }
        
        // Use real-time message if available
        if (realTimeMessage) {
            return realTimeMessage;
        }
        
        switch (stage) {
            case 'uploading':
                return 'Uploading your model...';
            case 'processing':
                return 'Processing your model...';
            case 'analyzing':
                return 'Analyzing model structure...';
            case 'validating':
                return 'Validating model files...';
            case 'ai_validation':
                return 'Performing AI validation...';
            case 'framework_detection':
                return 'Detecting framework...';
            case 'task_detection':
                return 'Detecting task type...';
            case 'model_optimization':
                return 'Optimizing model...';
            case 'metadata_extraction':
                return 'Extracting metadata...';
            default:
                return 'Processing...';
        }
    };

    const isErrorState = isError || (stage && stage.includes('Failed at:'));

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
                                {/* Animated Upload Icon or Error Icon */}
                                {isErrorState ? (
                                    <motion.div
                                        className="relative"
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <div className="w-16 h-16 border-4 border-red-500 rounded-full flex items-center justify-center">
                                            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        className="relative"
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                    >
                                        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                                    </motion.div>
                                )}

                                {/* Stage Text */}
                                <motion.div 
                                    className="text-center"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <Dialog.Title as="h3" className={`text-lg font-semibold mb-2 ${isErrorState ? 'text-red-400' : 'text-white'}`}>
                                        {getStageText(stage)}
                                    </Dialog.Title>
                                    {fileName && (
                                        <p className="text-sm text-slate-400 truncate max-w-xs">
                                            {fileName}
                                        </p>
                                    )}
                                    {/* Always show real-time message or stage info */}
                                    <div className="mt-3 p-3 bg-slate-700/30 rounded-lg border border-slate-600/30">
                                        {realTimeMessage ? (
                                            <p className="text-sm text-blue-300 font-medium">
                                                {realTimeMessage}
                                            </p>
                                        ) : (
                                            <p className="text-sm text-slate-300 font-medium">
                                                {getStageText(stage)}
                                            </p>
                                        )}
                                        {websocketData && websocketData.data && (
                                            <div className="mt-2 space-y-1">
                                                {websocketData.data.framework_used && (
                                                    <p className="text-xs text-slate-400">
                                                        Framework: <span className="text-slate-300 font-medium">{websocketData.data.framework_used}</span>
                                                    </p>
                                                )}
                                                {websocketData.data.task_detection && (
                                                    <p className="text-xs text-slate-400">
                                                        Task: <span className="text-slate-300 font-medium">{websocketData.data.task_detection}</span>
                                                    </p>
                                                )}
                                                {websocketData.data.model_size && (
                                                    <p className="text-xs text-slate-400">
                                                        Size: <span className="text-slate-300 font-medium">{websocketData.data.model_size}</span>
                                                    </p>
                                                )}
                                                {websocketData.data.optimization_level && (
                                                    <p className="text-xs text-slate-400">
                                                        Optimization: <span className="text-slate-300 font-medium">{websocketData.data.optimization_level}</span>
                                                    </p>
                                                )}
                                                {websocketData.data.validation_score && (
                                                    <p className="text-xs text-slate-400">
                                                        Validation Score: <span className="text-slate-300 font-medium">{websocketData.data.validation_score}</span>
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    {errorMessage && (
                                        <p className="text-sm text-red-300 mt-2 max-w-xs break-words">
                                            {errorMessage}
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
                                            className={`h-3 rounded-full shadow-lg ${isErrorState 
                                                ? 'bg-gradient-to-r from-red-500 to-red-600' 
                                                : 'bg-gradient-to-r from-purple-500 to-pink-500'
                                            }`}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress}%` }}
                                            transition={{ duration: 0.5 }}
                                        />
                                    </div>
                                    <div className="flex justify-between mt-2">
                                        <span className="text-xs text-slate-400">
                                            {isErrorState ? 'Failed at' : 'Progress'}
                                        </span>
                                        <span className="text-xs text-slate-400">{progress}%</span>
                                    </div>
                                </motion.div>

                                {/* Status message */}
                                <motion.p 
                                    className={`text-sm text-center ${isErrorState ? 'text-red-300' : 'text-slate-400'}`}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.3, delay: 0.2 }}
                                >
                                    {isErrorState 
                                        ? 'The upload failed. Please check the error details above and try again.' 
                                        : 'Please wait while we process your model. This may take a few moments.'
                                    }
                                </motion.p>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
} 