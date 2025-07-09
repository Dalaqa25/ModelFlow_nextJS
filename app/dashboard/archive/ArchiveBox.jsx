import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import ArchivedModels from './archivedModels';

export default function ArchiveBox({ isOpen, onClose }) {
    const [models, setModels] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isOpen) return;
        setLoading(true);
        fetch('/api/models/archived')
            .then(res => res.json())
            .then(data => {
                setModels(Array.isArray(data) ? data : (data.models || []));
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [isOpen]);

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
                    <div className="fixed inset-0 bg-gray-200/50 backdrop-blur-lg bg-opacity-40 transition-opacity" />
                </Transition.Child>
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-8 text-left">
                                <Dialog.Title as="h3" className="text-2xl font-bold mb-4 text-gray-900">
                                    Archived Models
                                </Dialog.Title>
                                {/* Storage Usage Indicator */}
                                <div className="mb-6">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-medium text-gray-700">Storage used</span>
                                        <span className="text-sm font-medium text-gray-500">50MB / 100MB</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-3">
                                        <div className="bg-purple-600 h-3 rounded-full shadow-lg ring-2 ring-purple-400 animate-pulse" style={{ width: `${(50/100)*100}%` }}></div>
                                    </div>
                                </div>
                                <div className="text-gray-600 min-h-[100px]">
                                    {loading ? (
                                        <div className="text-center text-gray-400">Loading...</div>
                                    ) : (
                                        <ArchivedModels models={models} />
                                    )}
                                </div>
                                <div className="mt-6 flex justify-end">
                                    <button
                                        onClick={onClose}
                                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
} 