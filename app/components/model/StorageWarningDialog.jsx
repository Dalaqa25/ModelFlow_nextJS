import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { FaArchive, FaTrash, FaTimes } from 'react-icons/fa';

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
                    <div className="fixed inset-0 bg-gray-500/50 backdrop-blur-xl bg-opacity-75 transition-opacity" />
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
                            <Dialog.Panel className="relative w-full max-w-sm transform overflow-hidden rounded-lg bg-white p-6 shadow-xl transition-all">
                                <div className="absolute right-4 top-4">
                                    <button
                                        type="button"
                                        className="text-gray-400 hover:text-gray-600 transition-colors"
                                        onClick={onClose}
                                    >
                                        <FaTimes className="h-5 w-5" />
                                    </button>
                                </div>
                                
                                <div className="text-center">
                                    <Dialog.Title as="h3" className="text-lg font-semibold text-gray-900 mb-2">
                                        {content.title}
                                    </Dialog.Title>
                                    
                                    <p className="text-sm text-gray-600 mb-6">
                                        {content.message}
                                    </p>
                                    
                                    {/* Simple storage bar */}
                                    <div className="mb-6">
                                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                                            <span>{currentUsageMB.toFixed(1)}MB</span>
                                            <span>{storageCapMB}MB</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div 
                                                className={`h-2 rounded-full transition-all ${
                                                    usagePercent > 90 ? 'bg-red-500' : 'bg-purple-500'
                                                }`} 
                                                style={{ width: `${Math.min(usagePercent, 100)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                    
                                    {/* Action buttons for exceeds limit */}
                                    {warningType === 'exceeds' && (
                                        <div className="space-y-3 mb-6">
                                            <p className="text-xs text-gray-500">
                                                Free up space to continue:
                                            </p>
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={onArchiveClick}
                                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
                                                >
                                                    <FaArchive size={14} />
                                                    Archive
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={onDeleteClick}
                                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                                                >
                                                    <FaTrash size={14} />
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Action buttons */}
                                    <div className="flex gap-3">
                                        {warningType === 'near_limit' && (
                                            <button
                                                type="button"
                                                className="flex-1 bg-purple-600 text-white px-4 py-2 text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                                                onClick={onClose}
                                            >
                                                {content.primaryAction}
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            className="flex-1 bg-gray-200 text-gray-900 px-4 py-2 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors"
                                            onClick={onClose}
                                        >
                                            {content.secondaryAction}
                                        </button>
                                    </div>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
} 