'use client';

const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
const MAX_JSON_SIZE_BYTES = 3 * 1024 * 1024; // 3MB

const STEP_FIELD_MAP = {
    1: ['automationName', 'description', 'price'],
    2: ['jsonFile']
};

const isValidUrl = (value) => {
    if (!value) return true;
    try {
        new URL(value);
        return true;
    } catch (error) {
        return false;
    }
};

export const validateImageFile = (file) => {
    if (!file) return 'Image is required';
    if (!file.type.startsWith('image/')) {
        return 'Please upload a valid image file';
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
        return 'Image must be smaller than 2MB';
    }
    return null;
};

export const validateJsonFile = (file) => {
    if (!file) return 'Automation JSON file is required';
    const isJson = file.type === 'application/json' || file.name.toLowerCase().endsWith('.json');
    if (!isJson) {
        return 'Only .json exports from n8n are supported';
    }
    if (file.size > MAX_JSON_SIZE_BYTES) {
        return 'JSON file must be smaller than 3MB';
    }
    return null;
};

export const validateAutomationStep = (step, formData) => {
    const errors = {};

    if (step === 1) {
        if (!formData.automationName?.trim()) {
            errors.automationName = 'Name is required';
        }
        if (!formData.description?.trim()) {
            errors.description = 'Description is required';
        }
        if (!formData.price || Number(formData.price) <= 0) {
            errors.price = 'Please choose a price tier';
        }
    }

    if (step === 2) {
        const jsonError = validateJsonFile(formData.jsonFile);
        if (jsonError) errors.jsonFile = jsonError;
    }

    return errors;
};

export const validateAutomationForm = (formData) => {
    const combinedErrors = {};
    [1, 2].forEach((step) => {
        const stepErrors = validateAutomationStep(step, formData);
        Object.assign(combinedErrors, stepErrors);
    });
    return combinedErrors;
};

export const clearStepErrors = (errors, step) => {
    const updatedErrors = { ...errors };
    (STEP_FIELD_MAP[step] || []).forEach((field) => {
        delete updatedErrors[field];
    });
    return updatedErrors;
};

