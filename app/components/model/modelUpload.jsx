'use client';
import { useState, Fragment, useEffect } from 'react';
import { FaCloudUploadAlt, FaPlus, FaTrash, FaGoogleDrive, FaExclamationTriangle } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import UploadProgressDialog from './UploadProgressDialog';
import StorageWarningDialog from './StorageWarningDialog';
import { supabase } from '../../../lib/supabase';
import { useKindeBrowserClient } from '@kinde-oss/kinde-auth-nextjs';
import PLANS from '../../plans';

export default function ModelUpload({ onUploadSuccess, isOpen, onClose }) {
    const router = useRouter();
    const { user } = useKindeBrowserClient();
    const [uploadType, setUploadType] = useState('zip'); // 'zip' or 'drive'
    const [features, setFeatures] = useState(['']);
    const [tags, setTags] = useState([]); // Initialize tags as empty array for multi-selection
    const [userStorageData, setUserStorageData] = useState(null);
    const [storageLoading, setStorageLoading] = useState(true);
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
    
    // Predefined price tiers that match Lemon Squeezy variants
    const PRICE_TIERS = [
        { value: 500, label: '$5.00', description: 'Basic tier' },
        { value: 1000, label: '$10.00', description: 'Standard tier' },
        { value: 1500, label: '$15.00', description: 'Premium tier' },
        { value: 2000, label: '$20.00', description: 'Professional tier' },
    ];

    const [formData, setFormData] = useState({
        modelName: '',
        description: '',
        useCases: '',
        setup: '', // Add setup field
        modelFile: null,
        driveLink: '',
        price: 500, // Default to $5.00
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadStage, setUploadStage] = useState(null);
    const [showProgressDialog, setShowProgressDialog] = useState(false);

    const predefinedTags = [
        "NLP",
        "Computer Vision",
        "Chatbot",
        "Image Generation",
        "Translation",
    ];

    // Fetch user storage data when component opens
    useEffect(() => {
        if (isOpen && user?.email) {
            fetchUserStorageData();
        }
    }, [isOpen, user?.email]);

    const fetchUserStorageData = async () => {
        try {
            setStorageLoading(true);
            const response = await fetch(`/api/models/user-models?email=${encodeURIComponent(user.email)}`);
            if (response.ok) {
                const data = await response.json();
                setUserStorageData(data);
            }
        } catch (error) {
            console.error('Error fetching user storage data:', error);
        } finally {
            setStorageLoading(false);
        }
    };

    // Calculate storage limits and check if upload would exceed limit
    const calculateStorageValidation = (fileSize) => {
        if (!userStorageData || !userStorageData.plan) return { canUpload: true, warning: null };

        const currentUsageMB = userStorageData.totalStorageUsedMB || 0;
        const userPlan = userStorageData.plan;
        const storageCapStr = PLANS[userPlan]?.features?.activeStorage || '250 MB';
        
        // Parse storage cap
        let storageCapMB = 250;
        if (storageCapStr.toLowerCase().includes('gb')) {
            storageCapMB = parseInt(storageCapStr) * 1024;
        } else if (storageCapStr.toLowerCase().includes('mb')) {
            storageCapMB = parseInt(storageCapStr);
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

    // Tag selection handler
    const handleTagToggle = (tagLabel) => {
        setTags(prevTags => {
            if (prevTags.includes(tagLabel)) {
                // Deselect tag
                return prevTags.filter(t => t !== tagLabel);
            } else {
                // Select tag, but only if less than 2 are already selected
                if (prevTags.length < 2) {
                    return [...prevTags, tagLabel];
                }
                return prevTags; // Do not add if 2 tags are already selected
            }
        });
    };

    const handleChange = (index, value) => {
        const updated = [...features];
        updated[index] = value;
        setFeatures(updated);
    };

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [id]: id === 'price' ? parseInt(value) : value // Parse price as integer (cents)
        }));
        // Clear error when user starts typing
        if (errors[id]) {
            setErrors(prev => ({
                ...prev,
                [id]: ''
            }));
        }
    };

    // Get max file size for current plan
    const getMaxFileSize = () => {
        const userPlan = userStorageData?.plan || 'basic';
        const maxFileSizeStr = PLANS[userPlan]?.features?.maxFileSize || '50 MB';
        let maxFileSizeBytes = 50 * 1024 * 1024; // default 50MB
        if (maxFileSizeStr.toLowerCase().includes('gb')) {
            maxFileSizeBytes = parseInt(maxFileSizeStr) * 1024 * 1024 * 1024;
        } else if (maxFileSizeStr.toLowerCase().includes('mb')) {
            maxFileSizeBytes = parseInt(maxFileSizeStr) * 1024 * 1024;
        }
        return { maxFileSizeBytes, maxFileSizeStr };
    };

    // Update handleFileChange function with storage validation
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        const { maxFileSizeBytes, maxFileSizeStr } = getMaxFileSize();

        if (file) {
            if (file.type === 'application/zip' || file.type === 'application/x-zip-compressed') {
                if (file.size > maxFileSizeBytes) {
                    setErrors(prev => ({
                        ...prev,
                        modelFile: `File size must be less than ${maxFileSizeStr}`
                    }));
                    e.target.value = '';
                    return;
                }

                // Check storage validation
                const storageValidation = calculateStorageValidation(file.size);
                if (!storageValidation.canUpload) {
                    setErrors(prev => ({
                        ...prev,
                        modelFile: 'File would exceed storage limit'
                    }));
                    e.target.value = '';
                    // Show storage warning dialog
                    setStorageWarningDialog({
                        isOpen: true,
                        warningType: storageValidation.warning,
                        currentUsageMB: storageValidation.currentUsageMB,
                        fileSizeMB: storageValidation.fileSizeMB,
                        totalAfterUploadMB: storageValidation.totalAfterUpload,
                        storageCapMB: storageValidation.storageCapMB,
                        storageCapStr: storageValidation.storageCapStr,
                        planName: storageValidation.planName
                    });
                    return;
                }

                setFormData(prev => ({
                    ...prev,
                    modelFile: file
                }));
                setErrors(prev => ({
                    ...prev,
                    modelFile: ''
                }));

                // Show warning dialog if near limit
                if (storageValidation.warning === 'near_limit') {
                    setStorageWarningDialog({
                        isOpen: true,
                        warningType: storageValidation.warning,
                        currentUsageMB: storageValidation.currentUsageMB,
                        fileSizeMB: storageValidation.fileSizeMB,
                        totalAfterUploadMB: storageValidation.totalAfterUpload,
                        storageCapMB: storageValidation.storageCapMB,
                        storageCapStr: storageValidation.storageCapStr,
                        planName: storageValidation.planName
                    });
                }
            } else {
                setErrors(prev => ({
                    ...prev,
                    modelFile: 'Only ZIP files are allowed'
                }));
                e.target.value = '';
            }
        }
    };

    const handleDriveLinkChange = (e) => {
        const link = e.target.value;
        setFormData(prev => ({
            ...prev,
            driveLink: link
        }));
        // Basic Google Drive link validation
        if (link && !link.includes('drive.google.com')) {
            setErrors(prev => ({
                ...prev,
                driveLink: 'Please enter a valid Google Drive link'
            }));
        } else {
            setErrors(prev => ({
                ...prev,
                driveLink: ''
            }));
        }
    };

    // Update validateForm to include storage validation
    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.modelName.trim()) {
            newErrors.modelName = 'Model name is required';
        }
        
        if (!formData.description.trim()) {
            newErrors.description = 'Description is required';
        }
        
        if (!formData.useCases.trim()) {
            newErrors.useCases = 'Use cases are required';
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

        if (uploadType === 'zip' && !formData.modelFile) {
            newErrors.modelFile = 'Model file is required';
        }
        
        if (uploadType === 'drive' && !formData.driveLink) {
            newErrors.driveLink = 'Google Drive link is required';
        }
        
        if (features.some(feature => !feature.trim())) {
            newErrors.features = 'All features must be filled out';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Update handleSubmit to handle both upload types
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        // Final storage validation before upload
        if (uploadType === 'zip' && formData.modelFile) {
            const { maxFileSizeBytes, maxFileSizeStr } = getMaxFileSize();
            if (formData.modelFile.size > maxFileSizeBytes) {
                setErrors(prev => ({
                    ...prev,
                    modelFile: `File size must be less than ${maxFileSizeStr}`
                }));
                return;
            }
            const storageValidation = calculateStorageValidation(formData.modelFile.size);
            if (!storageValidation.canUpload) {
                toast.error('File would exceed storage limit');
                return;
            }
        }

        setIsSubmitting(true);
        setShowProgressDialog(true);
        setUploadStage('uploading');

        try {
            if (uploadType === 'zip' && formData.modelFile) {
                // Upload ZIP file to Supabase Storage
                const file = formData.modelFile;
                const fileName = `${Date.now()}-${file.name}`;
                const filePath = `${fileName}`;
                const { data, error } = await supabase.storage
                    .from('models')
                    .upload(filePath, file, {
                        cacheControl: '3600',
                        upsert: false,
                        contentType: file.type,
                    });
                if (error) {
                    toast.error('Supabase upload failed: ' + error.message);
                    setIsSubmitting(false);
                    setShowProgressDialog(false);
                    return;
                } else {
                    // Get public URL from Supabase
                    const { data: urlData } = supabase.storage.from('models').getPublicUrl(filePath);
                    const publicUrl = urlData?.publicUrl || filePath;
                    // Prepare metadata for backend
                    const modelMeta = {
                        name: formData.modelName,
                        description: formData.description,
                        useCases: formData.useCases,
                        setup: formData.setup,
                        features: features.join(','),
                        tags: JSON.stringify(tags),
                        price: formData.price,
                        uploadType: 'zip',
                        fileStorage: JSON.stringify({
                            type: 'zip',
                            fileName: file.name,
                            fileSize: file.size,
                            mimeType: file.type,
                            supabasePath: filePath, // Only store the file path
                            uploadedAt: new Date().toISOString(),
                        })
                    };
                    // Send metadata to backend
                    const response = await fetch('/api/pending-models', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(modelMeta),
                    });
                    if (!response.ok) {
                        const data = await response.json();
                        toast.error('Backend error: ' + (data.error || 'Failed to create pending model'));
                        setIsSubmitting(false);
                        setShowProgressDialog(false);
                        return;
                    }
                    toast.success('Model metadata saved!');
                    setIsSubmitting(false);
                    setShowProgressDialog(false);
                    setFormData(prev => ({ ...prev, modelFile: null }));
                    onClose && onClose();
                    return;
                }
            } else if (uploadType === 'drive') {
                const fastApiFormData = new FormData();
                fastApiFormData.append('file', formData.modelFile);
                fastApiFormData.append('description', formData.description);
                fastApiFormData.append('setup', formData.setup);

                setUploadStage('extracting');
                const apiUrl = process.env.NEXT_PUBLIC_MODEL_VALIDATOR_API_URL || 'http://127.0.0.1:8000';
                const fastApiResponse = await fetch(`${apiUrl}/process-zip`, {
                    method: 'POST',
                    body: fastApiFormData,
                });

                if (!fastApiResponse.ok) {
                    const errorData = await fastApiResponse.json();
                    console.error('FastAPI error:', errorData);
                    throw new Error(errorData.detail || 'Failed to validate ZIP file');
                }

                setUploadStage('analyzing');
                const validationResult = await fastApiResponse.json();


                let processedAiAnalysis = validationResult.ai_analysis;
                if (processedAiAnalysis) {
                    if (!processedAiAnalysis.includes('✅ PUBLISH') && !processedAiAnalysis.includes('❌ REJECT')) {
                        processedAiAnalysis = `${validationResult.isValid ? '✅ PUBLISH' : '❌ REJECT'}\n\n${processedAiAnalysis}`;
                    }
                }

                const formDataToSend = new FormData();
                formDataToSend.append('name', formData.modelName);
                formDataToSend.append('description', formData.description);
                formDataToSend.append('useCases', formData.useCases);
                formDataToSend.append('setup', formData.setup);
                formDataToSend.append('features', features.join(','));
                formDataToSend.append('tags', JSON.stringify(tags));
                formDataToSend.append('price', formData.price);
                formDataToSend.append('uploadType', uploadType);
                formDataToSend.append('modelFile', formData.modelFile);
                formDataToSend.append('aiAnalysis', processedAiAnalysis);
                formDataToSend.append('validationStatus', JSON.stringify({
                    isValid: validationResult.isValid,
                    message: validationResult.message,
                    has_requirements: validationResult.has_requirements
                }));

                const response = await fetch('/api/pending-models', {
                    method: 'POST',
                    body: formDataToSend,
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Failed to upload model');
                }

                setUploadStage('success');
                setTimeout(() => {
                    setShowProgressDialog(false);
                    toast.success('Model uploaded successfully!');
                    onUploadSuccess();
                }, 1500);
            }
        } catch (err) {
            toast.error('Unexpected error: ' + err.message);
            setIsSubmitting(false);
            setShowProgressDialog(false);
        }
    };

    const addFeature = () => {
        setFeatures([...features, '']);
    };

    const removeFeature = (index) => {
        if (features.length > 1) {
            const updated = features.filter((_, i) => i !== index);
            setFeatures(updated);
        }
    };

    const handleArchiveClick = () => {
        setStorageWarningDialog(prev => ({ ...prev, isOpen: false }));
        // Close upload dialog and open archive dialog
        onClose();
        // You can add logic here to open the archive dialog
        // For now, we'll just show a toast
        toast.success('Please use the Archive button in your dashboard to free up space');
    };

    const handleDeleteClick = () => {
        setStorageWarningDialog(prev => ({ ...prev, isOpen: false }));
        // Close upload dialog and show delete instructions
        onClose();
        toast.success('Please delete models from your dashboard to free up space');
    };

    // Display storage info
    const renderStorageInfo = () => {
        if (storageLoading) {
            return <div className="text-gray-500 text-sm">Loading storage info...</div>;
        }

        if (!userStorageData) {
            return null;
        }

        const currentUsageMB = userStorageData.totalStorageUsedMB || 0;
        const userPlan = userStorageData.plan || 'basic';
        const storageCapStr = PLANS[userPlan]?.features?.activeStorage || '250 MB';
        
        let storageCapMB = 250;
        if (storageCapStr.toLowerCase().includes('gb')) {
            storageCapMB = parseInt(storageCapStr) * 1024;
        } else if (storageCapStr.toLowerCase().includes('mb')) {
            storageCapMB = parseInt(storageCapStr);
        }

        const usagePercent = (currentUsageMB / storageCapMB) * 100;

        return (
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Storage Usage</span>
                    <span className="text-sm font-medium text-gray-500">{currentUsageMB.toFixed(1)}MB / {storageCapMB}MB</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div 
                        className={`h-2 rounded-full ${usagePercent > 90 ? 'bg-red-500' : usagePercent > 75 ? 'bg-yellow-500' : 'bg-green-500'}`} 
                        style={{ width: `${Math.min(usagePercent, 100)}%` }}
                    ></div>
                </div>
                <p className="text-xs text-gray-500">Plan: {PLANS[userPlan]?.name || 'Basic'}</p>
            </div>
        );
    };

    return (
        <>
            <Transition.Root show={isOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => {}}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-gray-100/30 backdrop-blur-md bg-opacity-75 transition-opacity" />
                    </Transition.Child>

                    <div className="fixed inset-0 z-10 overflow-y-auto">
                        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                                enterTo="opacity-100 translate-y-0 sm:scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            >
                                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                                    <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                                        <button
                                            type="button"
                                            className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                                            onClick={onClose}
                                        >
                                            <span className="sr-only">Close</span>
                                            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                                        </button>
                                    </div>
                                    <div className="sm:flex sm:items-start">
                                        <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                                            <Dialog.Title as="h3" className="text-xl font-semibold leading-6 text-gray-900">
                                                Upload Your Model
                                            </Dialog.Title>
                                            
                                            {/* Storage Info */}
                                            {renderStorageInfo()}
                                            
                                            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                                                <div className="flex flex-col gap-2">
                                                    <label htmlFor="modelName" className="font-medium text-gray-700">
                                                        Model Name <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        id="modelName"
                                                        type="text"
                                                        value={formData.modelName}
                                                        onChange={handleInputChange}
                                                        placeholder="Enter model name"
                                                        className={`px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                                                            errors.modelName ? 'border-red-500' : 'border-gray-300'
                                                        }`}
                                                    />
                                                    {errors.modelName && (
                                                        <p className="text-red-500 text-sm">{errors.modelName}</p>
                                                    )}
                                                </div>

                                                <div className="flex flex-col gap-2">
                                                    <label htmlFor="description" className="font-medium text-gray-700">
                                                        Description <span className="text-red-500">*</span>
                                                    </label>
                                                    <textarea
                                                        id="description"
                                                        value={formData.description}
                                                        onChange={handleInputChange}
                                                        placeholder="Provide a detailed description of the model"
                                                        rows="4"
                                                        className={`px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                                                            errors.description ? 'border-red-500' : 'border-gray-300'
                                                        }`}
                                                    ></textarea>
                                                    {errors.description && (
                                                        <p className="text-red-500 text-sm">{errors.description}</p>
                                                    )}
                                                </div>

                                                <div className="flex flex-col gap-2">
                                                    <label htmlFor="useCases" className="font-medium text-gray-700">
                                                        Use Cases <span className="text-red-500">*</span>
                                                    </label>
                                                    <textarea
                                                        id="useCases"
                                                        value={formData.useCases}
                                                        onChange={handleInputChange}
                                                        placeholder="Describe potential applications and use cases"
                                                        rows="4"
                                                        className={`px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                                                            errors.useCases ? 'border-red-500' : 'border-gray-300'
                                                        }`}
                                                    ></textarea>
                                                    {errors.useCases && (
                                                        <p className="text-red-500 text-sm">{errors.useCases}</p>
                                                    )}
                                                </div>

                                                {/* Add Setup Instructions Section */}
                                                <div className="flex flex-col gap-2">
                                                    <label htmlFor="setup" className="font-medium text-gray-700">
                                                        How to Set Up <span className="text-red-500">*</span>
                                                    </label>
                                                    <textarea
                                                        id="setup"
                                                        value={formData.setup}
                                                        onChange={handleInputChange}
                                                        placeholder="Provide step-by-step instructions on how to set up and use the model"
                                                        rows="4"
                                                        className={`px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                                                            errors.setup ? 'border-red-500' : 'border-gray-300'
                                                        }`}
                                                    ></textarea>
                                                    {errors.setup && (
                                                        <p className="text-red-500 text-sm">{errors.setup}</p>
                                                    )}
                                                </div>

                                                {/* Features Section */}
                                                <div className="flex flex-col gap-2">
                                                    <label className="font-medium text-gray-700">Features <span className="text-red-500">*</span></label>
                                                    {features.map((feature, index) => (
                                                        <div key={index} className="flex items-center gap-2">
                                                            <input
                                                                type="text"
                                                                value={feature}
                                                                onChange={(e) => handleChange(index, e.target.value)}
                                                                placeholder="e.g., Real-time processing"
                                                                className={`flex-grow px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                                                                    errors.features && !feature.trim() ? 'border-red-500' : 'border-gray-300'
                                                                }`}
                                                            />
                                                            {features.length > 1 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeFeature(index)}
                                                                    className="text-red-500 hover:text-red-700 p-2 rounded-full transition-colors duration-200"
                                                                >
                                                                    <FaTrash size={20} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                    <button
                                                        type="button"
                                                        onClick={addFeature}
                                                        className="flex items-center gap-2 text-purple-600 hover:text-purple-800 font-medium self-start mt-2"
                                                    >
                                                        <FaPlus size={16} /> Add Another Feature
                                                    </button>
                                                    {errors.features && (
                                                        <p className="text-red-500 text-sm">{errors.features}</p>
                                                    )}
                                                </div>

                                                {/* Tags Selection */}
                                                <div className="flex flex-col gap-2">
                                                    <label className="font-medium text-gray-700">Tags <span className="text-red-500">*</span></label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {predefinedTags.map(tag => (
                                                            <button
                                                                key={tag}
                                                                type="button"
                                                                onClick={() => handleTagToggle(tag)}
                                                                className={`px-4 py-2 rounded-full border transition-all duration-200
                                                                    ${tags.includes(tag)
                                                                        ? 'bg-purple-600 text-white border-purple-600'
                                                                        : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                                                                    }`}
                                                            >
                                                                {tag}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    {errors.tags && (
                                                        <p className="text-red-500 text-sm">{errors.tags}</p>
                                                    )}
                                                </div>

                                                {/* Price Selection */}
                                                <div className="flex flex-col gap-2">
                                                    <label htmlFor="price" className="font-medium text-gray-700">
                                                        Price Tier <span className="text-red-500">*</span>
                                                    </label>
                                                    <select
                                                        id="price"
                                                        value={formData.price}
                                                        onChange={handleInputChange}
                                                        className={`px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                                                            errors.price ? 'border-red-500' : 'border-gray-300'
                                                        }`}
                                                    >
                                                        {PRICE_TIERS.map(tier => (
                                                            <option key={tier.value} value={tier.value}>
                                                                {tier.label} - {tier.description}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {errors.price && (
                                                        <p className="text-red-500 text-sm">{errors.price}</p>
                                                    )}
                                                    <p className="text-gray-500 text-xs">
                                                        These price tiers are configured to work with our payment system.
                                                    </p>
                                                </div>

                                                {/* File Upload / Drive Link Section */}
                                                <div className="flex flex-col gap-4">
                                                    <label className="font-medium text-gray-700">Model File <span className="text-red-500">*</span></label>
                                                    <div className="flex gap-4">
                                                        <button
                                                            type="button"
                                                            onClick={() => setUploadType('zip')}
                                                            className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border transition-all duration-200
                                                                ${uploadType === 'zip' ? 'bg-purple-600 text-white border-purple-600' : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'}
                                                            `}
                                                        >
                                                            <FaCloudUploadAlt size={20} /> Upload ZIP
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setUploadType('drive')}
                                                            className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border transition-all duration-200
                                                                ${uploadType === 'drive' ? 'bg-purple-600 text-white border-purple-600' : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'}
                                                            `}
                                                        >
                                                            <FaGoogleDrive size={20} /> Google Drive
                                                        </button>
                                                    </div>

                                                    {uploadType === 'zip' && (
                                                        <div className="flex flex-col gap-2">
                                                            <input
                                                                id="modelFile"
                                                                type="file"
                                                                onChange={handleFileChange}
                                                                accept=".zip,.rar"
                                                                className={`block w-full text-sm text-gray-500
                                                                    file:mr-4 file:py-2 file:px-4
                                                                    file:rounded-full file:border-0
                                                                    file:text-sm file:font-semibold
                                                                    file:bg-purple-50 file:text-purple-700
                                                                    hover:file:bg-purple-100
                                                                    ${errors.modelFile ? 'border-red-500' : ''}
                                                                `}
                                                            />
                                                            {errors.modelFile && (
                                                                <p className="text-red-500 text-sm">{errors.modelFile}</p>
                                                            )}
                                                            {storageLoading ? (
                                                                <p className="text-gray-400 text-xs mt-1 animate-pulse">Loading file size limit...</p>
                                                            ) : (
                                                                <p className="text-gray-500 text-xs mt-1">Max file size: <span className='font-semibold text-purple-600'>{getMaxFileSize().maxFileSizeStr} (ZIP only)</span></p>
                                                            )}
                                                        </div>
                                                    )}

                                                    {uploadType === 'drive' && (
                                                        <div className="flex flex-col gap-2">
                                                            <input
                                                                id="driveLink"
                                                                type="url"
                                                                value={formData.driveLink}
                                                                onChange={handleInputChange}
                                                                placeholder="Enter Google Drive shareable link"
                                                                className={`px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                                                                    errors.driveLink ? 'border-red-500' : 'border-gray-300'
                                                                }`}
                                                            />
                                                            {errors.driveLink && (
                                                                <p className="text-red-500 text-sm">{errors.driveLink}</p>
                                                            )}
                                                            <p className="text-gray-500 text-xs mt-1">Ensure the link is publicly accessible or shared with required permissions.</p>
                                                        </div>
                                                    )}
                                                </div>

                                                <button
                                                    type="submit"
                                                    className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors duration-300 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    disabled={isSubmitting}
                                                >
                                                    {isSubmitting ? 'Uploading...' : 'Upload Model'}
                                                </button>
                                            </form>
                                        </div>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition.Root>
            <UploadProgressDialog 
                isOpen={showProgressDialog} 
                stage={uploadStage} 
                onClose={() => setShowProgressDialog(false)} 
            />
            <StorageWarningDialog
                isOpen={storageWarningDialog.isOpen}
                onClose={() => setStorageWarningDialog(prev => ({ ...prev, isOpen: false }))}
                warningType={storageWarningDialog.warningType}
                currentUsageMB={storageWarningDialog.currentUsageMB}
                fileSizeMB={storageWarningDialog.fileSizeMB}
                totalAfterUploadMB={storageWarningDialog.totalAfterUploadMB}
                storageCapMB={storageWarningDialog.storageCapMB}
                storageCapStr={storageWarningDialog.storageCapStr}
                planName={storageWarningDialog.planName}
                onArchiveClick={handleArchiveClick}
                onDeleteClick={handleDeleteClick}
            />
        </>
    );
}