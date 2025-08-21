'use client';
import { useState, Fragment, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import UploadProgressDialog from '../UploadProgressDialog';
import StorageWarningDialog from '../StorageWarningDialog';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../lib/supabase-auth-context';
import PLANS from '../../../plans';
import Step1BasicInfo from './Step1BasicInfo';
import Step2Details from './Step2Details';
import Step3FileUpload from './Step3FileUpload';

const ErrorMessage = ({ error }) => {
    if (!error) return null;
    return (
        <p className="text-red-400 text-sm mt-1">
            {error}
        </p>
    );
};

export default function ModelUpload({ onUploadSuccess, isOpen, onClose }) {
    const router = useRouter();
    const { user } = useAuth();
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
        { value: 500, label: '$5.00', description: 'Basic ' },
        { value: 1000, label: '$10.00', description: 'Standard ' },
        { value: 1500, label: '$15.00', description: 'Premium ' },
        { value: 2000, label: '$20.00', description: 'Professional ' },
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
    const [uploadProgress, setUploadProgress] = useState(0);

    // Replace useCases in formData with use_cases array state
    const [use_cases, setUse_cases] = useState(['']);

    const predefinedTags = [
        "NLP",
        "Computer Vision",
        "Chatbot",
        "Image Generation",
        "Translation",
    ];

    // Drag-and-drop state for file upload
    const [dragActive, setDragActive] = useState(false);

    // Drag-and-drop handlers
    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(true);
    };
    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
    };
    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            if (file.name.endsWith('.zip') || file.name.endsWith('.rar')) {
                handleFileChange({ target: { files: [file] } });
            } else {
                setErrors(prev => ({ ...prev, modelFile: 'Only ZIP or RAR files are allowed' }));
            }
        }
    };
    const fileInputRef = useRef();
    const handleBrowseClick = () => fileInputRef.current && fileInputRef.current.click();

    // Fetch user storage data when component opens
    useEffect(() => {
        if (isOpen) {
            fetchUserStorageData();
        }
    }, [isOpen]);

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

    // Update handleInputChange to not handle useCases
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

    // Handlers for dynamic use cases
    const handleUseCaseChange = (index, value) => {
        const updated = [...use_cases];
        updated[index] = value;
        setUse_cases(updated);
        if (errors.use_cases) {
            setErrors(prev => ({ ...prev, use_cases: '' }));
        }
    };
    const addUseCase = () => setUse_cases([...use_cases, '']);
    const removeUseCase = (index) => {
        if (use_cases.length > 1) {
            setUse_cases(use_cases.filter((_, i) => i !== index));
        }
    };

    // Get max file size for current plan
    const getMaxFileSize = () => {
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

    const validateFile = (file) => {
        const { maxFileSizeBytes, maxFileSizeStr } = getMaxFileSize();
        
        if (!file) return 'File is required';
        if (file.size > maxFileSizeBytes) {
            return `File size must be less than ${maxFileSizeStr}`;
        }
        if (!file.type.includes('zip')) {
            return 'Only ZIP files are allowed';
        }
        return null;
    };

    // Update handleFileChange
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const fileError = validateFile(file);
        if (fileError) {
            setErrors(prev => ({ ...prev, modelFile: fileError }));
            e.target.value = '';
            return;
        }

        // Continue with existing storage validation...
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
    };

    // Remove Google Drive upload option, only allow ZIP
    // Remove uploadType state and all related logic

    // Remove handleDriveLinkChange and all references to driveLink

    // Update validateForm to check use_cases array
    const validateForm = () => {
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

        setErrors(newErrors);
        console.log('Validation errors:', newErrors); // DEBUG
        return Object.keys(newErrors).length === 0;
    };

    // Stepper state
    const [step, setStep] = useState(1);
    const totalSteps = 3;
    const [stepDirection, setStepDirection] = useState('forward');

    // Step validation helpers
    const validateStep = () => {
        const newErrors = {};
        const currentFields = [];

        if (step === 1) {
            currentFields.push('modelName', 'description', 'price');
            if (!formData.modelName.trim()) newErrors.modelName = 'Model name is required';
            if (!formData.description.trim()) newErrors.description = 'Description is required';
            if (!formData.price || formData.price <= 0) newErrors.price = 'Please select a valid price tier';
        }
        if (step === 2) {
            currentFields.push('tags', 'features', 'use_cases', 'setup');
            if (tags.length === 0) newErrors.tags = 'At least one tag is required';
            if (tags.length > 2) newErrors.tags = 'You can select a maximum of 2 tags';
            if (features.some(feature => !feature.trim())) newErrors.features = 'All features must be filled out';
            if (use_cases.some(uc => !uc.trim())) newErrors.use_cases = 'All use cases must be filled out';
            if (!formData.setup.trim()) newErrors.setup = 'Setup instructions are required';
        }

        setErrors(prev => {
            const preservedErrors = { ...prev };
            currentFields.forEach(field => delete preservedErrors[field]);
            return { ...preservedErrors, ...newErrors };
        });

        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        setStepDirection('forward');
        if (validateStep()) setStep(s => Math.min(s + 1, totalSteps));
    };
    const handleBack = () => {
        setStepDirection('backward');
        setStep(s => Math.max(s - 1, 1));
    };

    // Update handleSubmit to only submit on last step
    const handleSubmit = async (e) => {
        console.log('submit'); // DEBUG: Check if form submit is triggered
        e.preventDefault();
        if (step !== totalSteps) {
            console.log('Not on last step, moving to next');
            handleNext();
            return;
        }
        if (!validateForm()) {
            console.log('Validation failed');
            return;
        }
        console.log('Validation passed');
        // Final storage validation before upload
        if (formData.modelFile) {
            const { maxFileSizeBytes, maxFileSizeStr } = getMaxFileSize();
            if (formData.modelFile.size > maxFileSizeBytes) {
                console.log('File size too large');
                setErrors(prev => ({
                    ...prev,
                    modelFile: `File size must be less than ${maxFileSizeStr}`
                }));
                return;
            }
            const storageValidation = calculateStorageValidation(formData.modelFile.size);
            if (!storageValidation.canUpload) {
                console.log('Storage validation failed');
                toast.error('File would exceed storage limit');
                return;
            }
        }

        setIsSubmitting(true);
        setShowProgressDialog(true);
        setUploadStage('uploading');
        setUploadProgress(0);

        // Replace the progress interval in handleSubmit
        let progressInterval;
        const startProgressSimulation = () => {
            progressInterval = setInterval(() => {
                setUploadProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return 90;
                    }
                    return prev + Math.random() * 15;
                });
            }, 200);
        };

        try {
            // Only ZIP file upload allowed
            if (formData.modelFile) {
                // Simulate upload progress
                startProgressSimulation();

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

                clearInterval(progressInterval);
                setUploadProgress(95); // Upload complete
                if (error) {
                    console.log('Supabase upload failed', error);
                    toast.error('Supabase upload failed: ' + error.message);
                    setIsSubmitting(false);
                    setShowProgressDialog(false);
                    setUploadProgress(0);
                    return;
                } else {
                    // Update progress and stage
                    setUploadStage('processing');
                    setUploadProgress(98);

                    // Get public URL from Supabase
                    const { data: urlData } = supabase.storage.from('models').getPublicUrl(filePath);
                    const publicUrl = urlData?.publicUrl || filePath;

                    // Prepare form data for backend (matching the API structure)
                    const formDataToSend = new FormData();
                    formDataToSend.append('name', formData.modelName);
                    formDataToSend.append('description', formData.description);
                    formDataToSend.append('use_cases', use_cases.join('\n')); // Send as joined string
                    formDataToSend.append('setup', formData.setup);
                    formDataToSend.append('features', features.join('\n')); // Send as joined string
                    formDataToSend.append('tags', JSON.stringify(tags)); // Send as JSON string
                    formDataToSend.append('price', formData.price.toString());
                    formDataToSend.append('uploadType', 'zip');
                    
                    // Add file storage info as a JSON string
                    const fileStorageInfo = JSON.stringify({
                        type: 'zip',
                        fileName: file.name,
                        fileSize: file.size,
                        mimeType: file.type,
                        supabasePath: filePath,
                        uploadedAt: new Date().toISOString(),
                    });
                    formDataToSend.append('fileStorage', fileStorageInfo);

                    console.log('About to POST to /api/models');

                    // Send metadata to backend
                    const response = await fetch('/api/models', {
                        method: 'POST',
                        body: formDataToSend,
                    });
                    console.log('POST response', response);
                    if (!response.ok) {
                        const data = await response.json();
                        console.log('POST failed', data);
                        toast.error('Submission failed: ' + (data.error || 'Failed to create pending model'));
                        setIsSubmitting(false);
                        setShowProgressDialog(false);
                        setUploadProgress(0);
                        return;
                    }

                    // Complete the progress
                    setUploadProgress(100);

                    // Small delay to show 100% completion
                    setTimeout(() => {
                        toast.success('Model submitted successfully!');
                        setIsSubmitting(false);
                        setShowProgressDialog(false);
                        setUploadProgress(0);
                        setFormData(prev => ({ ...prev, modelFile: null }));
                        onClose && onClose();
                    }, 500);
                    return;
                }
            }
        } catch (err) {
            console.log('Catch block error', err);
            toast.error('Unexpected error: ' + err.message);
            setIsSubmitting(false);
            setShowProgressDialog(false);
            setUploadProgress(0);
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


    const handleDeleteClick = () => {
        setStorageWarningDialog(prev => ({ ...prev, isOpen: false }));
        // Close upload dialog and show delete instructions
        onClose();
        toast.success('Please delete models from your dashboard to free up space');
    };

    // Add after the initial state declarations
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
        setTags([]);
        setErrors({});
        setStep(1);
        setUploadProgress(0);
        setShowProgressDialog(false);
        setUploadStage(null);
        setStepDirection('forward');
    };

    // Update the Dialog onClose handler
    return (
        <>
            <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={() => {
                if (!isSubmitting) {
                    resetForm();
                    onClose();
                }
            }}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <Transition.Child
                            as={Fragment}
                            enter="transition-all duration-300 ease-in-out"
                            enterFrom="opacity-0 translate-x-8"
                            enterTo="opacity-100 translate-x-0"
                            leave="transition-all duration-200 ease-in-out"
                            leaveFrom="opacity-100 translate-x-0"
                            leaveTo="opacity-0 -translate-x-8"
                        >
                            <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-slate-800/90 backdrop-blur-md border border-slate-700/60 px-8 pb-8 pt-7 text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-10">
                                {/* Dialog content */}
                                <div className="absolute right-4 top-4">
                                    <button
                                        type="button"
                                        className="rounded-lg p-2 text-slate-400 hover:text-slate-300 hover:bg-slate-700/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-800"
                                        onClick={onClose}
                                    >
                                        <span className="sr-only">Close</span>
                                        <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                                    </button>
                                </div>
                                <div className="sm:flex sm:items-start">
                                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                                        <Dialog.Title as="h3" className="text-2xl font-bold leading-7 text-white mb-2">
                                            Upload Your Model
                                        </Dialog.Title>
                                        <p className="text-slate-400 mb-6 text-base">Step {step} of {totalSteps}</p>
                                        <form onSubmit={handleSubmit} className="mt-4 space-y-6 relative">
                                            <LoadingOverlay isVisible={isSubmitting} />
                                            <div className="relative min-h-[300px]">
                                                <Transition
                                                    key={step}
                                                    show={true}
                                                    appear
                                                    enter={`transition-all duration-300 ${stepDirection === 'forward' ? 'ease-out' : 'ease-in'}`}
                                                    enterFrom={stepDirection === 'forward' ? 'opacity-0 translate-x-8' : 'opacity-0 -translate-x-8'}
                                                    enterTo="opacity-100 translate-x-0"
                                                    leave="transition-all duration-200"
                                                    leaveFrom="opacity-100 translate-x-0"
                                                    leaveTo={stepDirection === 'forward' ? 'opacity-0 -translate-x-8' : 'opacity-0 translate-x-8'}
                                                >
                                                    <div>
                                                        {step === 1 && (
                                                            <Step1BasicInfo
                                                                formData={formData}
                                                                errors={errors}
                                                                handleInputChange={handleInputChange}
                                                                PRICE_TIERS={PRICE_TIERS}
                                                                handleNext={handleNext}
                                                            />
                                                        )}
                                                        {step === 2 && (
                                                            <Step2Details
                                                                tags={tags}
                                                                predefinedTags={predefinedTags}
                                                                features={features}
                                                                use_cases={use_cases}
                                                                errors={errors}
                                                                handleTagToggle={handleTagToggle}
                                                                handleChange={handleChange}
                                                                addFeature={addFeature}
                                                                removeFeature={removeFeature}
                                                                handleUseCaseChange={handleUseCaseChange}
                                                                addUseCase={addUseCase}
                                                                removeUseCase={removeUseCase}
                                                                formData={formData}
                                                                handleInputChange={handleInputChange}
                                                                handleNext={handleNext}
                                                                handleBack={handleBack}
                                                            />
                                                        )}
                                                        {step === 3 && (
                                                            <Step3FileUpload
                                                                dragActive={dragActive}
                                                                formData={formData}
                                                                errors={errors}
                                                                storageLoading={storageLoading}
                                                                getMaxFileSize={getMaxFileSize}
                                                                fileInputRef={fileInputRef}
                                                                handleDragOver={handleDragOver}
                                                                handleDragLeave={handleDragLeave}
                                                                handleDrop={handleDrop}
                                                                handleBrowseClick={handleBrowseClick}
                                                                handleFileChange={handleFileChange}
                                                                isSubmitting={isSubmitting}
                                                                handleBack={handleBack}
                                                            />
                                                        )}
                                                    </div>
                                                </Transition>
                                            </div>
                                            
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
                progress={uploadProgress}
                stage={uploadStage}
                fileName={formData.modelFile ? formData.modelFile.name : ''}
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
                onDeleteClick={handleDeleteClick}
            />
        </>
    );
}

const LoadingOverlay = ({ isVisible }) => {
    if (!isVisible) return null;
    return (
        <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center rounded-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
        </div>
    );
};