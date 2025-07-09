import React from 'react';
import { Dialog, Transition } from '@headlessui/react';

export default function ArchiveConfirm({ isOpen, onConfirm, onCancel }) {
    return (
        <Transition.Root show={isOpen} as={React.Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onCancel}>
                <Transition.Child
                    as={React.Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-gray-500/50 backdrop-blur-sm bg-opacity-40 transition-opacity" />
                </Transition.Child>
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <Transition.Child
                        as={React.Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0 scale-95"
                        enterTo="opacity-100 scale-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100 scale-100"
                        leaveTo="opacity-0 scale-95"
                    >
                        <Dialog.Panel className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
                            <Dialog.Title as="h3" className="text-xl font-bold text-gray-900 mb-4">
                                Archive Model?
                            </Dialog.Title>
                            <div className="text-gray-700 mb-3">
                                If you archive a model, <span className="font-semibold text-purple-600">there is no undo</span>.
                                <p className='text-gray-500 font-light text-sm mt-1'>you're model won't be visible inside models list</p>
                            </div>
                            <div className="flex justify-center gap-4">
                                <button
                                    onClick={onCancel}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={onConfirm}
                                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
                                >
                                    Archive
                                </button>
                            </div>
                        </Dialog.Panel>
                    </Transition.Child>
                </div>
            </Dialog>
        </Transition.Root>
    );
} 