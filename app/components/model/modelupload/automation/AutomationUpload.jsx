'use client';

import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

import { LoadingOverlay } from '../shared/components';
import { PRICE_TIERS, TOTAL_STEPS } from '../shared/constants';
import { useStepper } from '../shared/hooks';
import AutomationStep1BasicInfo from './steps/AutomationStep1BasicInfo';
import AutomationStep2MediaPricing from './steps/AutomationStep2MediaPricing';
import AutomationStep3JsonUpload from './steps/AutomationStep3JsonUpload';
import {
    clearStepErrors,
    validateAutomationForm,
    validateAutomationStep,
    validateImageFile,
    validateJsonFile
} from './utils';

const INITIAL_FORM_STATE = {
    automationName: '',
    description: '',
    price: PRICE_TIERS[0].value,
    jsonFile: null
};

export default function AutomationUpload({ isOpen, onClose, onUploadSuccess }) {
    const [formData, setFormData] = useState(INITIAL_FORM_STATE);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { step, stepDirection, handleNext, handleBack, resetStepper } = useStepper();
    const jsonInputRef = useRef(null);

    const stepTitles = useMemo(
        () => ({
            1: 'Automation Basics',
            2: 'n8n JSON Upload'
        }),
        []
    );

    useEffect(() => {
        if (!isOpen) {
            resetForm();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    const resetForm = () => {
        setFormData(INITIAL_FORM_STATE);
        setErrors({});
        setIsSubmitting(false);
        resetStepper();
        if (jsonInputRef.current) jsonInputRef.current.value = '';
    };

    const handleDialogClose = () => {
        if (isSubmitting) return;
        resetForm();
        onClose?.();
    };

    const handleInputChange = (event) => {
        const { id, value } = event.target;
        setFormData((prev) => ({ ...prev, [id]: value }));
        if (errors[id]) {
            setErrors((prev) => ({ ...prev, [id]: '' }));
        }
    };

    const handlePriceChange = (price) => {
        setFormData((prev) => ({ ...prev, price }));
        if (errors.price) setErrors((prev) => ({ ...prev, price: '' }));
    };

    const handleJsonSelect = (file) => {
        const validationMessage = validateJsonFile(file);
        if (validationMessage) {
            setErrors((prev) => ({ ...prev, jsonFile: validationMessage }));
            return;
        }
        setFormData((prev) => ({ ...prev, jsonFile: file }));
        setErrors((prev) => ({ ...prev, jsonFile: '' }));
    };

    const handleRemoveJson = () => {
        setFormData((prev) => ({ ...prev, jsonFile: null }));
        if (jsonInputRef.current) jsonInputRef.current.value = '';
    };

    const handleNextWithValidation = () => {
        const stepErrors = validateAutomationStep(step, formData);
        if (Object.keys(stepErrors).length > 0) {
            setErrors((prev) => ({ ...clearStepErrors(prev, step), ...stepErrors }));
            return;
        }
        setErrors((prev) => clearStepErrors(prev, step));
        handleNext();
    };

    const handleSubmit = async () => {
        const formErrors = validateAutomationForm(formData);
        if (Object.keys(formErrors).length > 0) {
            setErrors(formErrors);
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = new FormData();
            payload.append('name', formData.automationName.trim());
            payload.append('description', formData.description.trim());
            payload.append('price', formData.price);
            if (formData.jsonFile) payload.append('automationFile', formData.jsonFile);

            const response = await fetch('/api/automations', {
                method: 'POST',
                body: payload,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to upload automation');
            }

            const result = await response.json();
            toast.success('Automation uploaded successfully!');
            onUploadSuccess?.(result);
            handleDialogClose();
        } catch (error) {
            console.error('Automation upload failed:', error);
            toast.error(error.message || 'Failed to upload automation.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={handleDialogClose}>
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
                            <Dialog.Panel className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/90 p-8 shadow-2xl">
                                <LoadingOverlay isVisible={isSubmitting} />
                                <button
                                    type="button"
                                    className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:text-white hover:bg-slate-800/70 transition"
                                    onClick={handleDialogClose}
                                    disabled={isSubmitting}
                                >
                                    <span className="sr-only">Close</span>
                                    <XMarkIcon className="h-5 w-5" />
                                </button>

                                <div className="mb-6">
                                    <Dialog.Title className="text-2xl font-semibold text-white">Publish Automation</Dialog.Title>
                                    <p className="text-sm text-slate-400 mt-1">
                                        Step {step} of {TOTAL_STEPS}: {stepTitles[step]}
                                    </p>
                                </div>

                                <Transition
                                    key={step}
                                    appear
                                    show
                                    as={Fragment}
                                    enter={`transition-all duration-300 ${stepDirection === 'forward' ? 'ease-out' : 'ease-in'}`}
                                    enterFrom={stepDirection === 'forward' ? 'opacity-0 translate-x-6' : 'opacity-0 -translate-x-6'}
                                    enterTo="opacity-100 translate-x-0"
                                    leave="transition-all duration-200"
                                    leaveFrom="opacity-100 translate-x-0"
                                    leaveTo={stepDirection === 'forward' ? 'opacity-0 -translate-x-6' : 'opacity-0 translate-x-6'}
                                >
                                    <div className="space-y-6">
                                        {step === 1 && (
                                            <AutomationStep1BasicInfo
                                                formData={formData}
                                                errors={errors}
                                                handleInputChange={handleInputChange}
                                                handleNext={handleNextWithValidation}
                                                onPriceChange={handlePriceChange}
                                            />
                                        )}
                                        {step === 2 && (
                                            <AutomationStep3JsonUpload
                                                formData={formData}
                                                errors={errors}
                                                handleBack={handleBack}
                                                handleSubmit={handleSubmit}
                                                onJsonSelect={handleJsonSelect}
                                                onRemoveJson={handleRemoveJson}
                                                jsonInputRef={jsonInputRef}
                                                isSubmitting={isSubmitting}
                                            />
                                        )}
                                    </div>
                                </Transition>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
}

