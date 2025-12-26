// Custom hooks for Model Upload functionality

import { useState, useEffect } from 'react';
import { useAuth } from '../../../../../lib/supabase-auth-context';

export const useStorageData = (isOpen) => {
    const { user } = useAuth();
    const [userStorageData, setUserStorageData] = useState(null);
    const [storageLoading, setStorageLoading] = useState(true);

    const fetchUserStorageData = async () => {
        try {
            setStorageLoading(true);
            const response = await fetch(`/api/models/user-models?email=${encodeURIComponent(user.email)}`);
            if (response.ok) {
                const data = await response.json();
                setUserStorageData(data);
            }
        } catch (error) {
            // Error handled silently
        } finally {
            setStorageLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchUserStorageData();
        }
    }, [isOpen]);

    return { userStorageData, storageLoading, fetchUserStorageData };
};

export const useFormState = () => {
    const [formData, setFormData] = useState({
        modelName: '',
        description: '',
        useCases: '',
        setup: '',
        modelFile: null,
        driveLink: '',
        price: 500,
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadStage, setUploadStage] = useState(null);
    const [showProgressDialog, setShowProgressDialog] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const [use_cases, setUse_cases] = useState(['']);
    const [features, setFeatures] = useState(['']);
    const [tags, setTags] = useState([]);

    const [storageWarningDialog, setStorageWarningDialog] = useState({
        isOpen: false,
        warningType: null,
        currentUsageMB: 0,
        fileSizeMB: 0,
        totalAfterUploadMB: 0,
        storageCapMB: 0,
        storageCapStr: '',
        planName: ''
    });

    const resetForm = () => {
        setFormData({
            modelName: '',
            description: '',
            useCases: '',
            setup: '',
            modelFile: null,
            driveLink: '',
            price: 500,
        });
        setFeatures(['']);
        setUse_cases(['']);
        setTags([]);
        setErrors({});
        setUploadProgress(0);
        setShowProgressDialog(false);
        setUploadStage(null);
        setIsSubmitting(false);
        setStorageWarningDialog({
            isOpen: false,
            warningType: null,
            currentUsageMB: 0,
            fileSizeMB: 0,
            totalAfterUploadMB: 0,
            storageCapMB: 0,
            storageCapStr: '',
            planName: ''
        });
    };

    return {
        formData,
        setFormData,
        errors,
        setErrors,
        isSubmitting,
        setIsSubmitting,
        uploadStage,
        setUploadStage,
        showProgressDialog,
        setShowProgressDialog,
        uploadProgress,
        setUploadProgress,
        use_cases,
        setUse_cases,
        features,
        setFeatures,
        tags,
        setTags,
        storageWarningDialog,
        setStorageWarningDialog,
        resetForm
    };
};

export const useStepper = (maxSteps = 4) => {
    const [step, setStep] = useState(1);
    const [stepDirection, setStepDirection] = useState('forward');

    const handleNext = () => {
        setStepDirection('forward');
        setStep(s => Math.min(s + 1, maxSteps));
    };

    const handleBack = () => {
        setStepDirection('backward');
        setStep(s => Math.max(s - 1, 1));
    };

    const resetStepper = () => {
        setStep(1);
        setStepDirection('forward');
    };

    return { step, stepDirection, handleNext, handleBack, resetStepper };
};
