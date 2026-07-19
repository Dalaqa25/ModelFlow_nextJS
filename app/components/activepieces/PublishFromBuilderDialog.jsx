'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { ArrowPathIcon, CheckCircleIcon, ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

const INITIAL_FORM_STATE = {
    flowId: '',
    title: '',
    description: '',
    tokenCost: '0',
};

function formatStatus(flow) {
    if (flow.publishedToModelGrow) return flow.modelgrowIsActive ? 'Live in ModelGrow' : 'Already in ModelGrow';
    if (flow.publishedVersionId) return 'Published in builder';
    if (flow.status) return flow.status;
    return 'Draft';
}

export default function PublishFromBuilderDialog({ isOpen, onClose, onPublishSuccess }) {
    const [flows, setFlows] = useState([]);
    const [formData, setFormData] = useState(INITIAL_FORM_STATE);
    const [isLoading, setIsLoading] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [analysis, setAnalysis] = useState(null);
    const [testResult, setTestResult] = useState(null);
    const [publishTestToken, setPublishTestToken] = useState('');
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
            setIsAnalyzing(false);
            setIsTesting(false);
            setIsPublishing(false);
            setAnalysis(null);
            setTestResult(null);
            setPublishTestToken('');
            return;
        }

        fetchFlows();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    const fetchFlows = async () => {
        setIsLoading(true);
        setError('');
        setAnalysis(null);

        try {
            const response = await fetch('/api/activepieces/flows');
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to load builder flows');
            }

            const nextFlows = Array.isArray(data.flows) ? data.flows : [];
            setFlows(nextFlows);

            if (nextFlows.length > 0) {
                const firstFlow = nextFlows.find((flow) => flow.publishable) || nextFlows[0];
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
        setAnalysis(null);
        setTestResult(null);
        setPublishTestToken('');
        setError('');
    };

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (error) setError('');
    };

    const validateDetails = () => {
        if (!formData.flowId) return 'Choose a builder flow first.';
        if (selectedFlow && selectedFlow.publishable === false) {
            return selectedFlow.publishBlockMessage || 'Publish this workflow inside the ModelGrow Builder first.';
        }
        if (!formData.title.trim() || !formData.description.trim()) return 'Title and description are required.';
        return '';
    };

    const handleAnalyze = async () => {
        const validationError = validateDetails();
        if (validationError) {
            setError(validationError);
            return;
        }

        setIsAnalyzing(true);
        setError('');
        try {
            const response = await fetch('/api/activepieces/flows/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ flowId: formData.flowId }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to analyze builder flow');

            setAnalysis(data);
            setTestResult(null);
            setPublishTestToken('');
        } catch (analysisError) {
            setError(analysisError.message || 'Failed to analyze builder flow');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleRunTest = async () => {
        const validationError = validateDetails();
        if (validationError) {
            setError(validationError);
            return null;
        }

        setIsTesting(true);
        setError('');
        setTestResult(null);
        setPublishTestToken('');

        try {
            const response = await fetch('/api/activepieces/flows/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ flowId: formData.flowId }),
            });
            const data = await response.json();
            const result = data.result || null;
            setTestResult(result);
            setPublishTestToken(data.publishTestToken || '');

            if (!response.ok || result?.status !== 'passed') {
                throw new Error(data.error || 'Required publish test failed.');
            }

            toast.success('Required publish test passed.');
            return data.publishTestToken || '';
        } catch (testError) {
            setError(testError.message || 'Required publish test failed.');
            return null;
        } finally {
            setIsTesting(false);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const validationError = validateDetails();
        if (validationError) {
            setError(validationError);
            return;
        }

        if (!analysis) {
            await handleAnalyze();
            return;
        }

        if ((analysis.contract?.unresolved || []).length > 0) {
            setError('Resolve the workflow analysis warnings before publishing.');
            return;
        }

        let nextPublishTestToken = publishTestToken;
        if (testResult?.status !== 'passed' || !nextPublishTestToken) {
            nextPublishTestToken = await handleRunTest();
            if (!nextPublishTestToken) return;
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
                    publishTestToken: nextPublishTestToken,
                }),
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to publish builder flow');
            }

            toast.success('Builder flow added as a ModelGrow draft.');
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
                            <Dialog.Panel className="modelgrow-upload-modal relative w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/90 shadow-2xl">
                                <button
                                    type="button"
                                    className="absolute right-4 top-4 z-10 rounded-full p-2 text-slate-400 transition hover:bg-slate-800/70 hover:text-white"
                                    onClick={handleClose}
                                    disabled={isPublishing}
                                >
                                    <span className="sr-only">Close</span>
                                    <XMarkIcon className="h-5 w-5" />
                                </button>

                                <div className="px-8 pb-5 pt-8">
                                    <Dialog.Title className="text-2xl font-semibold text-white">
                                        Publish from Builder
                                    </Dialog.Title>
                                    <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-400">
                                        Choose a workflow from ModelGrow Builder and create or update its ModelGrow listing.
                                    </p>
                                </div>

                                <form onSubmit={handleSubmit} className="max-h-[78vh] overflow-y-auto px-8 pb-8">
                                    <div className="rounded-2xl border border-slate-700/60 bg-slate-950/30 p-5">
                                        <div className="mb-4 flex items-center justify-between gap-3">
                                            <div>
                                                <h3 className="text-xs font-black uppercase tracking-[0.18em] text-purple-200">
                                                    Builder Flows
                                                </h3>
                                                <p className="mt-1 text-sm text-slate-400">
                                                    These come from your ModelGrow Builder workspace.
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={fetchFlows}
                                                disabled={isLoading || isPublishing}
                                                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/70 px-3 py-2 text-xs font-bold text-slate-200 shadow-sm transition hover:border-purple-400 hover:text-white disabled:opacity-50"
                                            >
                                                <ArrowPathIcon className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                                                Refresh
                                            </button>
                                        </div>

                                        {isLoading ? (
                                            <div className="space-y-3">
                                                {[0, 1, 2].map((item) => (
                                                    <div key={item} className="h-20 animate-pulse rounded-2xl bg-slate-800/70" />
                                                ))}
                                            </div>
                                        ) : flows.length === 0 ? (
                                            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-800/40 p-6 text-sm leading-6 text-slate-400">
                                                <p className="font-bold text-white">No builder flows found.</p>
                                                <p className="mt-1">Open the builder, create a flow, then refresh this list.</p>
                                            </div>
                                        ) : (
                                            <div className="max-h-[240px] space-y-3 overflow-y-auto pr-1">
                                                {flows.map((flow) => {
                                                    const isSelected = flow.id === formData.flowId;
                                                    return (
                                                        <button
                                                            key={flow.id}
                                                            type="button"
                                                            onClick={() => handleFlowSelect(flow)}
                                                            className={`w-full rounded-2xl border p-4 text-left shadow-sm transition ${
                                                                isSelected
                                                                    ? 'border-purple-400 bg-purple-500/10 ring-4 ring-purple-500/10'
                                                                    : 'border-slate-700 bg-slate-800/50 hover:border-purple-400/70 hover:bg-purple-500/10'
                                                            }`}
                                                        >
                                                            <div className="flex items-start justify-between gap-3">
                                                                <div>
                                                                    <p className="font-bold text-white">{flow.displayName}</p>
                                                                    <p className="mt-1 text-xs font-semibold text-slate-400">{formatStatus(flow)}</p>
                                                                    {flow.publishedToModelGrow && (
                                                                        <p className="mt-2 inline-flex rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-black text-emerald-300">
                                                                            Already added to ModelGrow
                                                                        </p>
                                                                    )}
                                                                    {flow.publishable === false && (
                                                                        <p className="mt-2 text-xs font-bold text-amber-300">
                                                                            {flow.publishBlockMessage || 'Publish in ModelGrow Builder first'}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                                {isSelected && <CheckCircleIcon className="h-5 w-5 shrink-0 text-purple-300" />}
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-5">
                                        <div className="space-y-5">
                                            <div className="rounded-2xl border border-slate-700/60 bg-slate-950/30 p-4">
                                                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                                                    Selected Flow
                                                </p>
                                                <p className="mt-2 text-sm font-bold text-white">
                                                    {selectedFlow?.displayName || 'No flow selected'}
                                                </p>
                                                {selectedFlow?.publishable === false && (
                                                    <p className="mt-2 rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-200">
                                                        {selectedFlow.publishBlockMessage || 'Publish this workflow inside the ModelGrow Builder first.'}
                                                    </p>
                                                )}
                                                {selectedFlow?.publishedToModelGrow && (
                                                    <p className="mt-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-200">
                                                        This flow is already in ModelGrow. Publishing it again is blocked to prevent duplicate marketplace listings.
                                                    </p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="mb-2 block text-sm font-bold text-slate-200" htmlFor="title">
                                                    Marketplace title
                                                </label>
                                                <input
                                                    id="title"
                                                    name="title"
                                                    value={formData.title}
                                                    onChange={handleChange}
                                                    maxLength={100}
                                                    className="w-full rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-purple-400 focus:ring-4 focus:ring-purple-500/10"
                                                    placeholder="e.g. Gmail to Slack Lead Alert"
                                                    disabled={isPublishing}
                                                />
                                            </div>

                                            {analysis && (
                                                <SetupContractReview contract={analysis.contract} />
                                            )}

                                            {analysis && (
                                                <PublishTestReview
                                                    result={testResult}
                                                    isTesting={isTesting}
                                                    onRunTest={handleRunTest}
                                                    disabled={isPublishing || isAnalyzing || isLoading}
                                                />
                                            )}

                                            <div>
                                                <label className="mb-2 block text-sm font-bold text-slate-200" htmlFor="description">
                                                    Description
                                                </label>
                                                <textarea
                                                    id="description"
                                                    name="description"
                                                    value={formData.description}
                                                    onChange={handleChange}
                                                    maxLength={2000}
                                                    rows={7}
                                                    className="w-full resize-none rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-purple-400 focus:ring-4 focus:ring-purple-500/10"
                                                    placeholder="Explain what this automation does, who it is for, and what accounts it needs."
                                                    disabled={isPublishing}
                                                />
                                            </div>

                                            <div>
                                                <label className="mb-2 block text-sm font-bold text-slate-200" htmlFor="tokenCost">
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
                                                    className="w-full rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-purple-400 focus:ring-4 focus:ring-purple-500/10"
                                                    disabled={isPublishing}
                                                />
                                            </div>

                                            {error && (
                                                <div className="rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200">
                                                    {error}
                                                </div>
                                            )}

                                            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                                <button
                                                    type="button"
                                                    onClick={handleClose}
                                                    disabled={isPublishing}
                                                    className="rounded-2xl border border-slate-700 bg-slate-800/70 px-5 py-3 text-sm font-bold text-slate-200 transition hover:border-slate-500 hover:text-white disabled:opacity-50"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={isPublishing || isAnalyzing || isTesting || isLoading || !formData.flowId || selectedFlow?.publishable === false}
                                                    className="rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-purple-950/30 transition hover:from-purple-500 hover:to-fuchsia-500 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    {isPublishing
                                                        ? 'Publishing...'
                                                        : isAnalyzing
                                                            ? 'Analyzing workflow...'
                                                            : isTesting
                                                                ? 'Running required test...'
                                                                : analysis
                                                                    ? testResult?.status === 'passed'
                                                                        ? 'Create ModelGrow Draft'
                                                                        : 'Run Required Test'
                                                                    : 'Review Setup Requirements'}
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

function SetupContractReview({ contract }) {
    const connections = contract?.customerConnections || [];
    const inputs = contract?.customerInputs || [];
    const tunables = contract?.customerTunables || [];
    const fixedFields = contract?.developerConfiguration || [];
    const internal = contract?.internalDependencies || [];
    const unresolved = contract?.unresolved || [];
    const preservedCount = fixedFields.length;
    const tunableGroups = groupFieldsByStep(tunables);
    const auditGroups = groupFieldsByStep(fixedFields);

    return (
        <div className="space-y-4 rounded-2xl border border-purple-200 bg-purple-50/60 p-4">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-purple-700">Customer setup</p>
                    <p className="mt-1 text-sm text-slate-600">
                        ModelGrow detected what customers need. Everything else stays with the workflow.
                    </p>
                </div>
                {unresolved.length === 0 && (
                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-black text-emerald-700">
                        <CheckCircleIcon className="h-4 w-4" />
                        Ready
                    </span>
                )}
            </div>

            <div className="grid grid-cols-3 gap-2">
                <SetupStat value={connections.length} label="Accounts" />
                <SetupStat value={inputs.length} label="Required choices" />
                <SetupStat value={tunables.length} label="Optional tweaks" />
            </div>

            <RequirementGroup title="Customer connects" empty="No customer accounts required">
                {connections.map((connection) => (
                    <RequirementPill key={connection.pieceSlug} label={connection.displayName} detail={connection.authTypes?.join(' / ')} />
                ))}
            </RequirementGroup>

            <RequirementGroup title="Customer chooses" empty="No customer selections required">
                {inputs.map((input) => (
                    <RequirementPill
                        key={input.fieldKey}
                        label={input.label}
                        detail={input.stepDisplayName || input.pieceSlug}
                    />
                ))}
            </RequirementGroup>

            {tunables.length > 0 && (
                <details className="group rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                        <span>
                            <span className="block text-sm font-bold text-slate-800">Automatic customer customization</span>
                            <span className="block text-xs font-medium text-slate-500">
                                Safe settings keep the developer defaults and can be adjusted after installation.
                            </span>
                        </span>
                        <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-500">
                            {tunables.length}
                        </span>
                    </summary>
                    <div className="mt-3 space-y-3 border-t border-slate-100 pt-3">
                        {tunableGroups.map((group) => (
                            <div key={group.key}>
                                <p className="mb-2 text-xs font-bold text-slate-500">{group.label}</p>
                                <div className="flex flex-wrap gap-2">
                                    {group.fields.map((field) => (
                                        <span key={field.fieldKey} className="rounded-full border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700">
                                            {field.label}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </details>
            )}

            <details className="rounded-xl border border-slate-200/80 bg-white/70 px-3 py-2.5">
                <summary className="cursor-pointer list-none text-xs font-bold text-slate-500">
                    Advanced audit · {preservedCount} values preserved · {internal.length} internal pieces
                </summary>
                <div className="mt-3 space-y-3 border-t border-slate-100 pt-3">
                    {auditGroups.length > 0 && (
                        <div className="space-y-2">
                            {auditGroups.map((group) => (
                                <div key={group.key} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
                                    <span className="text-xs font-bold text-slate-700">{group.label}</span>
                                    <span className="text-xs font-semibold text-slate-400">{group.fields.length} preserved</span>
                                </div>
                            ))}
                        </div>
                    )}
                    {internal.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {internal.map((dependency) => (
                                <span key={dependency.pieceSlug} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">
                                    {dependency.displayName}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </details>

            {unresolved.length > 0 && (
                <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                    <div className="flex items-center gap-2 font-black">
                        <ExclamationTriangleIcon className="h-4 w-4" />
                        Publishing blocked
                    </div>
                    {unresolved.map((item, index) => (
                        <p key={`${item.stepName || item.pieceName}-${index}`} className="mt-1 text-xs font-semibold">{item.message}</p>
                    ))}
                </div>
            )}
        </div>
    );
}

function groupFieldsByStep(fields) {
    const groups = new Map();
    for (const field of fields) {
        const key = field.stepName || field.pieceSlug || 'workflow';
        const label = field.stepDisplayName || field.pieceSlug || 'Workflow';
        if (!groups.has(key)) groups.set(key, { key, label, fields: [] });
        groups.get(key).fields.push(field);
    }
    return Array.from(groups.values());
}

function PublishTestReview({ result, isTesting, onRunTest, disabled }) {
    const passed = result?.status === 'passed';
    const failed = result?.status === 'failed';
    const issues = result?.issues || [];
    const checks = result?.summary?.checks || [];

    return (
        <div className={`rounded-2xl border p-4 ${
            passed
                ? 'border-emerald-200 bg-emerald-50'
                : failed
                    ? 'border-red-200 bg-red-50'
                    : 'border-slate-200 bg-slate-50'
        }`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className={`text-xs font-black uppercase tracking-[0.18em] ${
                        passed ? 'text-emerald-700' : failed ? 'text-red-700' : 'text-slate-600'
                    }`}>
                        Required publish test
                    </p>
                    <p className="mt-1 text-sm text-slate-700">
                        {passed
                            ? 'The required publish test passed. This flow can be submitted as a ModelGrow draft.'
                            : failed
                                ? 'Fix the failed runtime check below before publishing.'
                                : 'Run the required publish test before publishing. Publishing is blocked until this step passes.'}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onRunTest}
                    disabled={disabled || isTesting}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-black text-slate-800 shadow-sm transition hover:border-purple-400 hover:text-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <ArrowPathIcon className={`h-4 w-4 ${isTesting ? 'animate-spin' : ''}`} />
                    {isTesting ? 'Running...' : passed ? 'Run Again' : 'Run Test'}
                </button>
            </div>

            {result?.latestRun && (
                <div className="mt-4 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600">
                    Latest completed run: <span className={passed ? 'text-emerald-700' : 'text-red-700'}>{result.latestRun.status}</span>
                    {result.latestRun.createdAt && <span> · {new Date(result.latestRun.createdAt).toLocaleString()}</span>}
                    {result.latestRun.id && <span> · {result.latestRun.id}</span>}
                </div>
            )}

            {checks.length > 0 && (
                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    {checks.map((check) => (
                        <div
                            key={check.key}
                            className={`rounded-xl border px-3 py-2 text-xs font-bold ${
                                check.passed
                                    ? 'border-emerald-200 bg-white text-emerald-700'
                                    : 'border-red-200 bg-white text-red-700'
                            }`}
                        >
                            {check.label}
                        </div>
                    ))}
                </div>
            )}

            {issues.length > 0 && (
                <div className="mt-4 space-y-2">
                    {issues.map((issue, index) => (
                        <div
                            key={`${issue.type}-${index}`}
                            className={`rounded-xl border bg-white p-3 ${
                                issue.severity === 'warning' ? 'border-amber-200' : 'border-red-200'
                            }`}
                        >
                            <div className="flex items-start gap-2">
                                <ExclamationTriangleIcon className={`mt-0.5 h-4 w-4 shrink-0 ${
                                    issue.severity === 'warning' ? 'text-amber-500' : 'text-red-500'
                                }`} />
                                <div className="min-w-0">
                                    <p className={`text-sm font-bold ${
                                        issue.severity === 'warning' ? 'text-amber-800' : 'text-red-800'
                                    }`}>
                                        {issue.severity === 'warning' ? 'Warning: ' : ''}{issue.message}
                                    </p>
                                    {(issue.stepDisplayName || issue.stepName || issue.fieldPath || issue.fieldKey) && (
                                        <p className="mt-1 text-xs font-semibold text-slate-500">
                                            {[issue.stepDisplayName || issue.stepName, issue.fieldPath || issue.fieldKey].filter(Boolean).join(' · ')}
                                        </p>
                                    )}
                                    {issue.fix && (
                                        <p className="mt-2 text-xs font-semibold text-slate-700">{issue.fix}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function SetupStat({ value, label }) {
    return (
        <div className="rounded-xl border border-white bg-white/80 px-3 py-2.5 text-center shadow-sm">
            <p className="text-lg font-black text-slate-900">{value}</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">{label}</p>
        </div>
    );
}

function RequirementGroup({ title, empty, children }) {
    const items = Array.isArray(children) ? children.filter(Boolean) : children ? [children] : [];
    return (
        <div>
            <p className="mb-2 text-xs font-black uppercase tracking-[0.12em] text-slate-500">{title}</p>
            {items.length > 0 ? <div className="space-y-2">{items}</div> : <p className="text-xs font-semibold text-slate-400">{empty}</p>}
        </div>
    );
}

function RequirementPill({ label, detail }) {
    return (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
            <span className="text-sm font-bold text-slate-900">{label}</span>
            {detail && <span className="text-right text-xs font-semibold text-slate-500">{detail}</span>}
        </div>
    );
}
