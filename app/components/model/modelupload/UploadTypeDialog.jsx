'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { RocketLaunchIcon, PuzzlePieceIcon, XMarkIcon } from '@heroicons/react/24/outline';

const uploadOptions = [
    {
        id: 'pretrained',
        label: 'Pre-trained Model',
        description: 'Upload a ready-to-use model package with documentation, pricing, and tags.',
        icon: RocketLaunchIcon,
        accent: 'from-purple-500 to-indigo-500'
    },
    {
        id: 'automation',
        label: 'Automation Workflow',
        description: 'Publish step-by-step automations, agents, or workflows that leverage multiple tools.',
        icon: PuzzlePieceIcon,
        accent: 'from-teal-400 to-emerald-500'
    }
];

export default function UploadTypeDialog({ isOpen, onClose, onSelect }) {
    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog
                as="div"
                className="relative z-50"
                onClose={() => {
                    if (onClose) onClose();
                }}
            >
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className="relative overflow-hidden rounded-2xl bg-slate-900/90 border border-slate-700/60 px-6 pb-6 pt-6 text-left shadow-2xl backdrop-blur-xl sm:w-full sm:max-w-2xl sm:p-8">
                                <button
                                    type="button"
                                    className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-700/70 hover:text-white transition"
                                    onClick={onClose}
                                >
                                    <span className="sr-only">Close</span>
                                    <XMarkIcon className="h-5 w-5" />
                                </button>

                                <Dialog.Title className="text-2xl font-semibold text-white">
                                    What would you like to publish?
                                </Dialog.Title>
                                <p className="mt-2 text-sm text-slate-300">
                                    Choose a publishing track. You can switch later if you need to.
                                </p>

                                <div className="mt-8 grid gap-4 md:grid-cols-2">
                                    {uploadOptions.map(option => {
                                        const Icon = option.icon;
                                        return (
                                            <button
                                                key={option.id}
                                                type="button"
                                                onClick={() => onSelect && onSelect(option.id)}
                                                className="group h-full rounded-2xl border border-slate-700/60 bg-slate-800/50 p-5 text-left transition hover:-translate-y-1 hover:border-slate-500 hover:bg-slate-800/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                                            >
                                                <div className={`mb-4 inline-flex rounded-xl bg-gradient-to-r ${option.accent} px-3 py-2 text-white shadow-lg`}>
                                                    <Icon className="h-6 w-6" />
                                                </div>
                                                <h3 className="text-lg font-semibold text-white">{option.label}</h3>
                                                <p className="mt-2 text-sm text-slate-300">
                                                    {option.description}
                                                </p>
                                                <span className="mt-4 inline-flex items-center text-sm font-medium text-purple-300">
                                                    Select
                                                    <svg
                                                        className="ml-1 h-4 w-4 transition group-hover:translate-x-1"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
}

