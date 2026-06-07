'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { ArrowPathIcon, CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

const INITIAL_FORM_STATE = {
    flowId: '',
    title: '',
    description: '',
    tokenCost: '0',
};

function formatStatus(flow) {
    if (flow.publishedVersionId) return 'Published in builder';
    if (flow.status) return flow.status;
    return 'Draft';
}

export default function PublishFromBuilderDialog({ isOpen, onClose, onPublishSuccess }) {
    const [flows, setFlows] = useState([]);
    const [formData, setFormData] = useState(INITIAL_FORM_STATE);
    const [isLoading, setIsLoading] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [error, setError] = useState('');

    const selectedFlow = useMemo(
        () => flows.find((flow) => flow.id === formData.flowId) || null,
        [flows, formData.flowId]
    );

    useEffect(() => {
        if (!isOpen) {
            setFlows([]);
            setFormData(INITIAL_FORM_STATE);
            setError('');
            setIsLoading(false);
            setIsPublishing(false);
            return;
        }

        fetchFlows();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    const fetchFlows = async () => {
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('/api/activepieces/flows');
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to load builder flows');
            }

            const nextFlows = Array.isArray(data.flows) ? data.flows : [];
            setFlows(nextFlows);

            if (nextFlows.length > 0) {
                const firstFlow = nextFlows[0];
                setFormData((prev) => ({
                    ...prev,
                    flowId: firstFlow.id,
                    title: prev.title || firstFlow.displayName || '',
                }));
            }
        } catch (fetchError) {
            setError(fetchError.message || 'Failed to load builder flows');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        if (isPublishing) return;
        onClose?.();
    };

    const handleFlowSelect = (flow) => {
        setFormData((prev) => ({
            ...prev,
            flowId: flow.id,
            title: prev.title || flow.displayName || '',
        }));
        setError('');
    };

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (error) setError('');
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!formData.flowId) {
            setError('Choose a builder flow first.');
            return;
        }

        if (!formData.title.trim() || !formData.description.trim()) {
            setError('Title and description are required.');
            return;
        }

        setIsPublishing(true);
        setError('');

        try {
            const response = await fetch('/api/activepieces/flows/publish', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    flowId: formData.flowId,
                    title: formData.title.trim(),
                    description: formData.description.trim(),
                    tokenCost: formData.tokenCost,
                }),
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to publish builder flow');
            }

            toast.success('Builder flow published as a ModelGrow draft!');
            onPublishSuccess?.(data);
            handleClose();
        } catch (publishError) {
            setError(publishError.message || 'Failed to publish builder flow');
        } finally {
            setIsPublishing(false);
        }
    };

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={handleClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xl" />
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
                            <Dialog.Panel className="relative w-full max-w-5xl overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-2xl">
                                <button
                                    type="button"
                                    className="absolute right-5 top-5 z-10 rounded-full p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
                                    onClick={handleClose}
                                    disabled={isPublishing}
                                >
                                    <span className="sr-only">Close</span>
                                    <XMarkIcon className="h-5 w-5" />
                                </button>

                                <div className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,#a855f7,transparent_34%),linear-gradient(135deg,#0f172a,#312e81_55%,#111827)] px-7 py-7 text-white">
                                    <div className="absolute right-12 top-8 h-24 w-24 rounded-full bg-fuchsia-400/20 blur-2xl" />
                                    <p className="mb-3 inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-purple-100">
                                        ModelGrow Builder
                                    </p>
                                    <Dialog.Title className="relative text-3xl font-black tracking-tight">
                                        Publish a builder flow
                                    </Dialog.Title>
                                    <p className="relative mt-2 max-w-2xl text-sm leading-6 text-slate-200">
                                        Choose one workflow from your visual builder and create a pending marketplace draft inside ModelGrow.
                                    </p>
                                </div>

                                <form onSubmit={handleSubmit} className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
                                    <div className="border-b border-slate-200 bg-slate-50 p-6 lg:border-b-0 lg:border-r">
                                        <div className="mb-4 flex items-center justify-between gap-3">
                                            <div>
                                                <h3 className="text-sm font-black uppercase tracking-[0.18em] text-purple-700">
                                                    Builder Flows
                                                </h3>
                                                <p className="mt-1 text-sm text-slate-500">
                                                    These come from your linked Activepieces workspace.
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={fetchFlows}
                                                disabled={isLoading || isPublishing}
                                                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:border-purple-400 hover:text-purple-700 disabled:opacity-50"
                                            >
                                                <ArrowPathIcon className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                                                Refresh
                                            </button>
                                        </div>

                                        {isLoading ? (
                                            <div className="space-y-3">
                                                {[0, 1, 2].map((item) => (
                                                    <div key={item} className="h-20 animate-pulse rounded-2xl bg-slate-200" />
                                                ))}
                                            </div>
                                        ) : flows.length === 0 ? (
                                            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm leading-6 text-slate-600">
                                                <p className="font-bold text-slate-900">No builder flows found.</p>
                                                <p className="mt-1">Open the builder, create a flow, then refresh this list.</p>
                                            </div>
                                        ) : (
                                            <div className="max-h-[460px] space-y-3 overflow-y-auto pr-1">
                                                {flows.map((flow) => {
                                                    const isSelected = flow.id === formData.flowId;
                                                    return (
                                                        <button
                                                            key={flow.id}
                                                            type="button"
                                                            onClick={() => handleFlowSelect(flow)}
                                                            className={`w-full rounded-2xl border p-4 text-left shadow-sm transition ${
                                                                isSelected
                                                                    ? 'border-purple-500 bg-purple-50 ring-4 ring-purple-100'
                                                                    : 'border-slate-200 bg-white hover:border-purple-300 hover:bg-purple-50/40'
                                                            }`}
                                                        >
                                                            <div className="flex items-start justify-between gap-3">
                                                                <div>
                                                                    <p className="font-bold text-slate-950">{flow.displayName}</p>
                                                                    <p className="mt-1 text-xs font-semibold text-slate-500">{formatStatus(flow)}</p>
                                                                </div>
                                                                {isSelected && <CheckCircleIcon className="h-5 w-5 shrink-0 text-purple-600" />}
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    <div className="bg-white p-6">
                                        <div className="space-y-5">
                                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                                                    Selected Flow
                                                </p>
                                                <p className="mt-2 text-sm font-bold text-slate-950">
                                                    {selectedFlow?.displayName || 'No flow selected'}
                                                </p>
                                            </div>

                                            <div>
                                                <label className="mb-2 block text-sm font-bold text-slate-800" htmlFor="title">
                                                    Marketplace title
                                                </label>
                                                <input
                                                    id="title"
                                                    name="title"
                                                    value={formData.title}
                                                    onChange={handleChange}
                                                    maxLength={100}
                                                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
                                                    placeholder="e.g. Gmail to Slack Lead Alert"
                                                    disabled={isPublishing}
                                                />
                                            </div>

                                            <div>
                                                <label className="mb-2 block text-sm font-bold text-slate-800" htmlFor="description">
                                                    Description
                                                </label>
                                                <textarea
                                                    id="description"
                                                    name="description"
                                                    value={formData.description}
                                                    onChange={handleChange}
                                                    maxLength={2000}
                                                    rows={7}
                                                    className="w-full resize-none rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
                                                    placeholder="Explain what this automation does, who it is for, and what accounts it needs."
                                                    disabled={isPublishing}
                                                />
                                            </div>

                                            <div>
                                                <label className="mb-2 block text-sm font-bold text-slate-800" htmlFor="tokenCost">
                                                    Tokens per run
                                                </label>
                                                <input
                                                    id="tokenCost"
                                                    name="tokenCost"
                                                    type="number"
                                                    min="0"
                                                    max="10000"
                                                    step="1"
                                                    value={formData.tokenCost}
                                                    onChange={handleChange}
                                                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
                                                    disabled={isPublishing}
                                                />
                                            </div>

                                            {error && (
                                                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                                                    {error}
                                                </div>
                                            )}

                                            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                                <button
                                                    type="button"
                                                    onClick={handleClose}
                                                    disabled={isPublishing}
                                                    className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-slate-500 hover:text-slate-950 disabled:opacity-50"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={isPublishing || isLoading || !formData.flowId}
                                                    className="rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-purple-200 transition hover:from-purple-500 hover:to-fuchsia-500 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    {isPublishing ? 'Publishing...' : 'Create ModelGrow Draft'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
}
