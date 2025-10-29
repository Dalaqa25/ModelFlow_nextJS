import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { motion } from 'framer-motion';
import { XMarkIcon, ExclamationTriangleIcon, CheckCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

export default function UploadMessageDialogBox({ 
    isOpen, 
    onClose, 
    messageType = 'error', // 'error', 'success', 'warning', 'info'
    title,
    message,
    details,
    currentStage,
    progressPercentage,
    fileName
}) {
    const getIcon = () => {
        switch (messageType) {
            case 'error':
                return <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />;
            case 'success':
                return <CheckCircleIcon className="w-8 h-8 text-green-500" />;
            case 'warning':
                return <ExclamationTriangleIcon className="w-8 h-8 text-yellow-500" />;
            case 'info':
                return <InformationCircleIcon className="w-8 h-8 text-blue-500" />;
            default:
                return <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />;
        }
    };

    const getColorClasses = () => {
        switch (messageType) {
            case 'error':
                return {
                    border: 'border-red-500/50',
                    bg: 'bg-red-500/10',
                    title: 'text-red-400',
                    message: 'text-red-300',
                    details: 'text-red-200'
                };
            case 'success':
                return {
                    border: 'border-green-500/50',
                    bg: 'bg-green-500/10',
                    title: 'text-green-400',
                    message: 'text-green-300',
                    details: 'text-green-200'
                };
            case 'warning':
                return {
                    border: 'border-yellow-500/50',
                    bg: 'bg-yellow-500/10',
                    title: 'text-yellow-400',
                    message: 'text-yellow-300',
                    details: 'text-yellow-200'
                };
            case 'info':
                return {
                    border: 'border-blue-500/50',
                    bg: 'bg-blue-500/10',
                    title: 'text-blue-400',
                    message: 'text-blue-300',
                    details: 'text-blue-200'
                };
            default:
                return {
                    border: 'border-red-500/50',
                    bg: 'bg-red-500/10',
                    title: 'text-red-400',
                    message: 'text-red-300',
                    details: 'text-red-200'
                };
        }
    };

    const colors = getColorClasses();

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
                            <Dialog.Panel className={`relative bg-slate-800/90 backdrop-blur-md border ${colors.border} rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-6 max-w-lg w-full`}>
                                {/* Close Button */}
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

                                {/* Icon */}
                                <motion.div
                                    className="relative"
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
                                >
                                    <div className={`w-20 h-20 rounded-full ${colors.bg} border-2 ${colors.border} flex items-center justify-center`}>
                                        {getIcon()}
                                    </div>
                                </motion.div>

                                {/* Content */}
                                <motion.div 
                                    className="text-center w-full"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: 0.2 }}
                                >
                                    {/* Title */}
                                    <Dialog.Title as="h3" className={`text-xl font-bold mb-3 ${colors.title}`}>
                                        {title || (messageType === 'error' ? 'Upload Failed' : 'Upload Status')}
                                    </Dialog.Title>

                                    {/* File Name */}
                                    {fileName && (
                                        <p className="text-sm text-slate-400 mb-3 truncate max-w-xs mx-auto">
                                            File: {fileName}
                                        </p>
                                    )}

                                    {/* Main Message */}
                                    <p className={`text-base mb-4 ${colors.message} break-words`}>
                                        {message}
                                    </p>

                                    {/* Details */}
                                    {details && (
                                        <div className={`text-sm ${colors.details} mb-4 p-3 rounded-lg bg-slate-700/30 border border-slate-600/30`}>
                                            <strong>Details:</strong> {details}
                                        </div>
                                    )}

                                    {/* Stage and Progress Info */}
                                    {(currentStage || progressPercentage !== undefined) && (
                                        <div className="text-sm text-slate-400 mb-4">
                                            {currentStage && (
                                                <p>Stage: <span className="font-medium">{currentStage}</span></p>
                                            )}
                                            {progressPercentage !== undefined && (
                                                <p>Progress: <span className="font-medium">{progressPercentage}%</span></p>
                                            )}
                                        </div>
                                    )}

                                    {/* Action Button */}
                                    <motion.button
                                        onClick={onClose}
                                        className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 ${
                                            messageType === 'error' 
                                                ? 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500' 
                                                : messageType === 'success'
                                                ? 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500'
                                                : messageType === 'warning'
                                                ? 'bg-yellow-600 hover:bg-yellow-700 text-white focus:ring-yellow-500'
                                                : 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500'
                                        }`}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        {messageType === 'error' ? 'Try Again' : 'OK'}
                                    </motion.button>
                                </motion.div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
}
