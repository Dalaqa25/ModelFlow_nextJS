'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { ArrowRight, FileCode2, Workflow, X } from 'lucide-react';

export default function UploadChoiceModal({ isOpen, onClose, onChooseBuilder, onChooseJson }) {
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
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className="modelgrow-upload-modal relative w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/90 p-8 shadow-2xl">
                                <button
                                    type="button"
                                    className="absolute right-4 top-4 rounded-full p-2 text-slate-400 transition hover:bg-slate-800/70 hover:text-white"
                                    onClick={onClose}
                                >
                                    <span className="sr-only">Close</span>
                                    <X className="h-5 w-5" />
                                </button>

                                <div className="mb-6 pr-8">
                                    <Dialog.Title className="text-2xl font-semibold text-white">Publish Automation</Dialog.Title>
                                    <p className="mt-1 text-sm leading-6 text-slate-400">
                                        Choose where this automation is coming from.
                                    </p>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <button
                                        type="button"
                                        onClick={onChooseBuilder}
                                        className="group rounded-2xl border border-purple-400/30 bg-purple-500/10 p-5 text-left transition hover:-translate-y-0.5 hover:border-purple-300 hover:bg-purple-500/15"
                                    >
                                        <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-500/20 text-purple-200 ring-1 ring-purple-300/20">
                                            <Workflow className="h-5 w-5" />
                                        </span>
                                        <span className="block text-base font-black text-white">Publish from Builder</span>
                                        <span className="mt-2 block text-sm leading-6 text-slate-400">
                                            Pick a workflow from ModelGrow Builder and create or update its ModelGrow listing.
                                        </span>
                                        <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-purple-200">
                                            Continue
                                            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                                        </span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={onChooseJson}
                                        className="group rounded-2xl border border-slate-700/80 bg-slate-800/50 p-5 text-left transition hover:-translate-y-0.5 hover:border-slate-500 hover:bg-slate-800/70"
                                    >
                                        <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-700/70 text-slate-200 ring-1 ring-white/10">
                                            <FileCode2 className="h-5 w-5" />
                                        </span>
                                        <span className="block text-base font-black text-white">Upload JSON</span>
                                        <span className="mt-2 block text-sm leading-6 text-slate-400">
                                            Import an automation JSON file from another builder or external workflow platform.
                                        </span>
                                        <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-slate-200">
                                            Continue
                                            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                                        </span>
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
