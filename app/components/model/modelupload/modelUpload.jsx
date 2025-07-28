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

    // Replace useCases in formData with useCases array state
    const [useCases, setUseCases] = useState(['']);

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
        const updated = [...useCases];
        updated[index] = value;
        setUseCases(updated);
        if (errors.useCases) {
            setErrors(prev => ({ ...prev, useCases: '' }));
        }
    };
    const addUseCase = () => setUseCases([...useCases, '']);
    const removeUseCase = (index) => {
        if (useCases.length > 1) {
            setUseCases(useCases.filter((_, i) => i !== index));
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

    // Remove Google Drive upload option, only allow ZIP
    // Remove uploadType state and all related logic

    // Remove handleDriveLinkChange and all references to driveLink

    // Update validateForm to check useCases array
    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.modelName.trim()) {
            newErrors.modelName = 'Model name is required';
        }
        
        if (!formData.description.trim()) {
            newErrors.description = 'Description is required';
        }
        
        // Use cases validation
        if (useCases.some(uc => !uc.trim())) {
            newErrors.useCases = 'All use cases must be filled out';
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
        if (step === 1) {
            if (!formData.modelName.trim()) newErrors.modelName = 'Model name is required';
            if (!formData.description.trim()) newErrors.description = 'Description is required';
            if (!formData.price || formData.price <= 0) newErrors.price = 'Please select a valid price tier';
        }
        if (step === 2) {
            if (tags.length === 0) newErrors.tags = 'At least one tag is required';
            if (tags.length > 2) newErrors.tags = 'You can select a maximum of 2 tags';
            if (features.some(feature => !feature.trim())) newErrors.features = 'All features must be filled out';
            if (useCases.some(uc => !uc.trim())) newErrors.useCases = 'All use cases must be filled out';
        }
        if (step === 3) {
            if (!formData.modelFile) newErrors.modelFile = 'Model file is required';
        }
        setErrors(newErrors);
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

        try {
            // Only ZIP file upload allowed
            if (formData.modelFile) {
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
                    console.log('Supabase upload failed', error);
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
                        useCases: useCases.join('\n'), // Send as joined string
                        setup: formData.setup,
                        features: features.join(','),
                        tags, // send as array
                        price: formData.price,
                        uploadType: 'zip',
                        fileStorage: {
                            type: 'zip',
                            fileName: file.name,
                            fileSize: file.size,
                            mimeType: file.type,
                            supabasePath: filePath, // Only store the file path
                            uploadedAt: new Date().toISOString(),
                        }
                    };
                    console.log('About to POST to /api/pending-models', modelMeta);
                    // Send metadata to backend
                    const response = await fetch('/api/pending-models', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(modelMeta),
                    });
                    console.log('POST response', response);
                    if (!response.ok) {
                        const data = await response.json();
                        console.log('POST failed', data);
                        toast.error('Submission failed: ' + (data.error || 'Failed to create pending model'));
                        setIsSubmitting(false);
                        setShowProgressDialog(false);
                        return;
                    }
                    toast.success('Model submitted successfully!');
                    setIsSubmitting(false);
                    setShowProgressDialog(false);
                    setFormData(prev => ({ ...prev, modelFile: null }));
                    onClose && onClose();
                    return;
                }
            }
        } catch (err) {
            console.log('Catch block error', err);
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
    // Remove renderStorageInfo and its usage

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
                                enter="transition-all duration-300 ease-in-out"
                                enterFrom="opacity-0 translate-x-8"
                                enterTo="opacity-100 translate-x-0"
                                leave="transition-all duration-200 ease-in-out"
                                leaveFrom="opacity-100 translate-x-0"
                                leaveTo="opacity-0 -translate-x-8"
                            >
                                <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-white px-8 pb-8 pt-7 text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-10 border border-gray-200">
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
                                            <Dialog.Title as="h3" className="text-2xl font-bold leading-7 text-gray-900 mb-2">
                                                Upload Your Model
                                            </Dialog.Title>
                                            <p className="text-gray-500 mb-6 text-base">Step {step} of {totalSteps}</p>
                                            <form onSubmit={handleSubmit} className="mt-4 space-y-6">
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
                                                        />
                                                      )}
                                                      {step === 2 && (
                                                        <Step2Details
                                                          tags={tags}
                                                          predefinedTags={predefinedTags}
                                                          features={features}
                                                          useCases={useCases}
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
                                                        />
                                                      )}
                                                    </div>
                                                  </Transition>
                                                </div>
                                                {/* Stepper navigation */}
                                                <div className="flex justify-between mt-8">
                                                    {step > 1 ? (
                                                        <button
                                                            type="button"
                                                            onClick={handleBack}
                                                            className="px-6 py-2 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors"
                                                        >
                                                            Back
                                                        </button>
                                                    ) : <div />}
                                                    {step < totalSteps ? (
                                                        <button
                                                            type="button"
                                                            onClick={handleNext}
                                                            className="px-6 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-violet-500 text-white font-bold hover:from-purple-700 hover:to-violet-600 transition-colors"
                                                        >
                                                            Next
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="submit"
                                                            className="px-6 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-violet-500 text-white font-bold hover:from-purple-700 hover:to-violet-600 transition-colors"
                                                            disabled={isSubmitting}
                                                        >
                                                            {isSubmitting ? 'Uploading...' : 'Upload Model'}
                                                        </button>
                                                    )}
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