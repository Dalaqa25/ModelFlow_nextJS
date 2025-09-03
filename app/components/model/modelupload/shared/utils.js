// Utility functions for Model Upload functionality

import PLANS from '../../../../plans';

// Calculate storage limits and check if upload would exceed limit
export const calculateStorageValidation = (fileSize, userStorageData) => {
    if (!userStorageData || !userStorageData.plan) return { canUpload: true, warning: null };

    const currentUsageMB = userStorageData.totalStorageUsedMB || 0;
    const userPlan = userStorageData.plan;
    const storageCapStr = PLANS[userPlan]?.features?.activeStorage || '250 MB';

    // Parse storage cap
    let storageCapMB = 250;
    if (storageCapStr.toLowerCase().includes('gb')) {
        storageCapMB = parseInt(storageCapStr.replace(/\D/g, '')) * 1024;
    } else if (storageCapStr.toLowerCase().includes('mb')) {
        storageCapMB = parseInt(storageCapStr.replace(/\D/g, ''));
    }

    const fileSizeMB = fileSize / (1024 * 1024);
    const totalAfterUpload = currentUsageMB + fileSizeMB;

    if (totalAfterUpload > storageCapMB) {
        return {
            canUpload: false,
            warning: 'exceeds',
            currentUsageMB,
            fileSizeMB,
            totalAfterUpload,
            storageCapMB,
            storageCapStr,
            planName: PLANS[userPlan]?.name || 'Basic'
        };
    } else if (totalAfterUpload > storageCapMB * 0.9) {
        return {
            canUpload: true,
            warning: 'near_limit',
            currentUsageMB,
            fileSizeMB,
            totalAfterUpload,
            storageCapMB,
            storageCapStr,
            planName: PLANS[userPlan]?.name || 'Basic'
        };
    }

    return { canUpload: true, warning: null };
};

// Get max file size for current plan
export const getMaxFileSize = (userStorageData) => {
    const userPlan = userStorageData?.plan || 'basic';
    const maxFileSizeStr = PLANS[userPlan]?.features?.maxFileSize || '50 MB';
    let maxFileSizeBytes = 50 * 1024 * 1024; // default 50MB
    if (maxFileSizeStr.toLowerCase().includes('gb')) {
        maxFileSizeBytes = parseInt(maxFileSizeStr.replace(/\D/g, '')) * 1024 * 1024 * 1024;
    } else if (maxFileSizeStr.toLowerCase().includes('mb')) {
        maxFileSizeBytes = parseInt(maxFileSizeStr.replace(/\D/g, '')) * 1024 * 1024;
    }
    return { maxFileSizeBytes, maxFileSizeStr };
};

export const validateFile = (file, userStorageData) => {
    const { maxFileSizeBytes, maxFileSizeStr } = getMaxFileSize(userStorageData);

    if (!file) return 'File is required';
    if (file.size > maxFileSizeBytes) {
        return `File size must be less than ${maxFileSizeStr}`;
    }
    if (!file.type.includes('zip')) {
        return 'Only ZIP files are allowed';
    }
    return null;
};

// Form validation functions
export const validateForm = (formData, use_cases, tags, features) => {
    const newErrors = {};

    if (!formData.modelName.trim()) {
        newErrors.modelName = 'Model name is required';
    }

    if (!formData.description.trim()) {
        newErrors.description = 'Description is required';
    }

    // Use cases validation
    if (use_cases.some(uc => !uc.trim())) {
        newErrors.use_cases = 'All use cases must be filled out';
    }

    if (!formData.setup.trim()) {
        newErrors.setup = 'Setup instructions are required';
    }

    // Validate tags
    if (tags.length === 0) {
        newErrors.tags = 'At least one tag is required';
    }
    if (tags.length > 2) {
        newErrors.tags = 'You can select a maximum of 2 tags';
    }

    // Validate price
    if (!formData.price || formData.price <= 0) {
        newErrors.price = 'Please select a valid price tier';
    }

    if (!formData.modelFile) {
        newErrors.modelFile = 'Model file is required';
    }

    if (features.some(feature => !feature.trim())) {
        newErrors.features = 'All features must be filled out';
    }

    return newErrors;
};

export const validateStep = (step, formData, tags, features, use_cases) => {
    const newErrors = {};

    if (step === 1) {
        if (!formData.modelName.trim()) newErrors.modelName = 'Model name is required';
        if (!formData.description.trim()) newErrors.description = 'Description is required';
        if (!formData.price || formData.price <= 0) newErrors.price = 'Please select a valid price tier';
    }
    if (step === 2) {
        if (tags.length === 0) newErrors.tags = 'At least one tag is required';
        if (tags.length > 2) newErrors.tags = 'You can select a maximum of 2 tags';
        if (features.some(feature => !feature.trim())) newErrors.features = 'All features must be filled out';
        if (use_cases.some(uc => !uc.trim())) newErrors.use_cases = 'All use cases must be filled out';
        if (!formData.setup.trim()) newErrors.setup = 'Setup instructions are required';
    }

    return newErrors;
};