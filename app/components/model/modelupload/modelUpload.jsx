'use client';
import { Fragment, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import UploadProgressDialog from '../UploadProgressDialog';
import StorageWarningDialog from '../StorageWarningDialog';
import UploadMessageDialogBox from '../UploadMessageDialogBox';
import Step1BasicInfo from './upload-steps/Step1BasicInfo';
import Step2Details from './upload-steps/Step2Details';
import Step3FileUpload from './upload-steps/Step3FileUpload';
import { PRICE_TIERS, PREDEFINED_TAGS, TOTAL_STEPS } from './shared/constants';
import { calculateStorageValidation, getMaxFileSize, validateFile, validateForm, validateStep } from './shared/utils';
import { ErrorMessage, LoadingOverlay } from './shared/components';
import { useStorageData, useFormState, useStepper } from './shared/hooks';

export default function ModelUpload({ onUploadSuccess, isOpen, onClose }) {
    // Custom hooks for state management
    const { userStorageData, storageLoading } = useStorageData(isOpen);
    const {
        formData, setFormData, errors, setErrors, isSubmitting, setIsSubmitting,
        uploadStage, setUploadStage, showProgressDialog, setShowProgressDialog,
        uploadProgress, setUploadProgress, use_cases, setUse_cases,
        features, setFeatures, tags, setTags, storageWarningDialog,
        setStorageWarningDialog, resetForm
    } = useFormState();

    // Message dialog state
    const [messageDialog, setMessageDialog] = useState({
        isOpen: false,
        messageType: 'error',
        title: '',
        message: '',
        details: '',
        currentStage: '',
        progressPercentage: 0,
        fileName: ''
    });

    // WebSocket state
    const [wsConnection, setWsConnection] = useState(null);
    const [sessionId, setSessionId] = useState(null);
    const [realTimeMessage, setRealTimeMessage] = useState('');
    const [websocketData, setWebsocketData] = useState(null);
    const { step, stepDirection, handleNext, handleBack, resetStepper } = useStepper();

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

    // WebSocket connection functions
    const generateSessionId = () => {
        return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    };

    const connectWebSocket = (sessionId) => {
        const ws = new WebSocket(`ws://localhost:8000/ws/${sessionId}`);
        
        ws.onopen = () => {
            console.log('WebSocket connected for session:', sessionId);
            setWsConnection(ws);
        };

        ws.onmessage = (event) => {
            try {
                const update = JSON.parse(event.data);
                console.log('WebSocket update:', update);
                
                if (update.type === 'progress_update') {
                    // Update progress and stage from WebSocket
                    setUploadProgress(update.progress);
                    setUploadStage(update.stage);
                    setRealTimeMessage(update.message);
                    setWebsocketData(update); // Store full WebSocket data
                    
                    console.log(`Stage: ${update.stage} (${update.progress}%)`);
                    console.log(`Message: ${update.message}`);
                    if (update.data) {
                        console.log('Additional data:', update.data);
                    }
                }
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };

        ws.onclose = () => {
            console.log('WebSocket disconnected');
            setWsConnection(null);
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            setWsConnection(null);
        };

        return ws;
    };

    const disconnectWebSocket = () => {
        if (wsConnection) {
            wsConnection.close();
            setWsConnection(null);
        }
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

    // File handling functions
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const fileError = validateFile(file, userStorageData);
        if (fileError) {
            setErrors(prev => ({ ...prev, modelFile: fileError }));
            e.target.value = '';
            return;
        }

        // Continue with existing storage validation...
        const storageValidation = calculateStorageValidation(file.size, userStorageData);
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

    // Function to remove selected file
    const removeFile = () => {
        setFormData(prev => ({
            ...prev,
            modelFile: null
        }));
        setErrors(prev => ({
            ...prev,
            modelFile: ''
        }));
        // Reset the file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Step validation helpers
    const handleStepValidation = () => {
        const newErrors = validateStep(step, formData, tags, features, use_cases);
        setErrors(prev => {
            const preservedErrors = { ...prev };
            const currentFields = step === 1
                ? ['modelName', 'description', 'price']
                : ['tags', 'features', 'use_cases', 'setup'];
            currentFields.forEach(field => delete preservedErrors[field]);
            return { ...preservedErrors, ...newErrors };
        });
        return Object.keys(newErrors).length === 0;
    };

    const handleNextWithValidation = () => {
        if (handleStepValidation()) {
            handleNext();
        }
    };

    // Update handleSubmit to only submit on last step
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (step !== TOTAL_STEPS) {
            handleNextWithValidation();
            return;
        }
        const formErrors = validateForm(formData, use_cases, tags, features);
        if (Object.keys(formErrors).length > 0) {
            setErrors(formErrors);
            return;
        }
        // Final storage validation before upload
        if (formData.modelFile) {
            const { maxFileSizeBytes, maxFileSizeStr } = getMaxFileSize(userStorageData);
            if (formData.modelFile.size > maxFileSizeBytes) {
                setErrors(prev => ({
                    ...prev,
                    modelFile: `File size must be less than ${maxFileSizeStr}`
                }));
                return;
            }
            const storageValidation = calculateStorageValidation(formData.modelFile.size, userStorageData);
            if (!storageValidation.canUpload) {
                toast.error('File would exceed storage limit');
                return;
            }
        }

        setIsSubmitting(true);
        setShowProgressDialog(true);
        setUploadStage('validating');
        setUploadProgress(0);

        // Generate session ID and connect WebSocket
        const newSessionId = generateSessionId();
        setSessionId(newSessionId);
        connectWebSocket(newSessionId);

        try {
            // Only ZIP file upload allowed
            if (formData.modelFile) {
                // Validate model with modelValidator service
                const validationFormData = new FormData();
                validationFormData.append('file', formData.modelFile);
                validationFormData.append('model_name', formData.modelName);
                validationFormData.append('model_setUp', formData.setup);
                validationFormData.append('description', formData.description);
                validationFormData.append('session_id', newSessionId); // Include session ID for WebSocket

                const validationResponse = await fetch('http://127.0.0.1:8000/api/models/model-upload', {
                    method: 'POST',
                    body: validationFormData,
                });

                if (!validationResponse.ok) {
                    const errorData = await validationResponse.json();
                    const errorMessage = errorData.detail || errorData.message || 'Unknown error';
                    
                    // Disconnect WebSocket on error
                    disconnectWebSocket();
                    
                    setMessageDialog({
                        isOpen: true,
                        messageType: 'error',
                        title: 'Upload Failed',
                        message: `Model validation failed: ${errorMessage}`,
                        details: errorData.details || errorData.error || '',
                        currentStage: 'validation',
                        progressPercentage: 0,
                        fileName: formData.modelFile ? formData.modelFile.name : ''
                    });
                    
                    setIsSubmitting(false);
                    setShowProgressDialog(false);
                    setUploadProgress(0);
                    return;
                }

                const validationResult = await validationResponse.json();
                
                // Check for validation failure from FastAPI
                if (validationResult.validation_status === "INVALID") {
                    const errorMessage = validationResult.validation_reason || 'Model validation failed';
                    const currentStage = validationResult.current_stage || 'validation';
                    const progressPct = validationResult.progress_percentage || 0;
                    
                    // Disconnect WebSocket on validation failure
                    disconnectWebSocket();
                    
                    setMessageDialog({
                        isOpen: true,
                        messageType: 'error',
                        title: 'Validation Failed',
                        message: `Validation failed: ${errorMessage}`,
                        details: validationResult.error_details || validationResult.details || '',
                        currentStage: currentStage,
                        progressPercentage: progressPct,
                        fileName: formData.modelFile ? formData.modelFile.name : ''
                    });
                    
                    setIsSubmitting(false);
                    setShowProgressDialog(false);
                    setUploadProgress(progressPct);
                    return;
                }

                // Reflect server-reported progress if provided
                if (validationResult.current_stage) {
                    setUploadStage(validationResult.current_stage);
                }
                if (typeof validationResult.progress_percentage === 'number') {
                    // cap at 99 to leave room for finalization
                    const pct = Math.max(0, Math.min(99, validationResult.progress_percentage));
                    setUploadProgress(pct);
                } else {
                    setUploadProgress(40); // Processing validation result
                }

                // FastAPI handles storage + DB insert; we only care about two flags
                setUploadStage('uploading');
                setUploadProgress(60);

                // Validate FastAPI reported outcomes with detailed error messages
                const uploadOk = validationResult.upload_success === true;
                const metadataOk = validationResult.metadata_saved === true;
                
                if (!uploadOk || !metadataOk) {
                    let errorMessage = '';
                    let errorDetails = '';
                    let title = '';
                    
                    if (!uploadOk) {
                        title = 'Upload Failed';
                        errorMessage = 'Upload failed';
                        errorDetails = validationResult.upload_error || validationResult.error_message || 'External upload failed';
                    } else if (!metadataOk) {
                        title = 'Metadata Save Failed';
                        errorMessage = 'Metadata save failed';
                        errorDetails = validationResult.metadata_error || 'Failed to save model metadata';
                    }
                    
                    setMessageDialog({
                        isOpen: true,
                        messageType: 'error',
                        title: title,
                        message: `${errorMessage}: ${errorDetails}`,
                        details: validationResult.error_details || validationResult.details || '',
                        currentStage: validationResult.current_stage || 'upload',
                        progressPercentage: validationResult.progress_percentage || 0,
                        fileName: formData.modelFile ? formData.modelFile.name : ''
                    });
                    
                    setIsSubmitting(false);
                    setShowProgressDialog(false);
                    setUploadProgress(0);
                    return;
                }

                // Complete the progress locally
                setUploadProgress(100);
                setTimeout(() => {
                    // Disconnect WebSocket on completion
                    disconnectWebSocket();
                    
                    setMessageDialog({
                        isOpen: true,
                        messageType: 'success',
                        title: 'Upload Successful',
                        message: 'Your model has been uploaded and processed successfully!',
                        details: 'The model is now available in your dashboard and can be purchased by other users.',
                        currentStage: 'completed',
                        progressPercentage: 100,
                        fileName: formData.modelFile ? formData.modelFile.name : ''
                    });
                    
                    setIsSubmitting(false);
                    setShowProgressDialog(false);
                    setUploadProgress(0);
                    setFormData(prev => ({ ...prev, modelFile: null }));
                    resetForm();
                    resetStepper();
                    onUploadSuccess && onUploadSuccess();
                }, 500);
                return;
            }
        } catch (err) {
            // Disconnect WebSocket on error
            disconnectWebSocket();
            
            setMessageDialog({
                isOpen: true,
                messageType: 'error',
                title: 'Unexpected Error',
                message: `An unexpected error occurred: ${err.message}`,
                details: 'Please try again or contact support if the problem persists.',
                currentStage: 'error',
                progressPercentage: 0,
                fileName: formData.modelFile ? formData.modelFile.name : ''
            });
            
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

    // Cleanup WebSocket on component unmount or dialog close
    const cleanup = () => {
        disconnectWebSocket();
        setSessionId(null);
        setRealTimeMessage('');
        setWebsocketData(null);
    };

    // Cleanup when dialog closes
    const handleDialogClose = () => {
        cleanup();
        resetForm();
        resetStepper();
        // Also clear the file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        onClose();
    };

    // Update the Dialog onClose handler
    return (
        <>
            <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={() => {
                if (!isSubmitting) {
                    handleDialogClose();
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
                                        onClick={() => {
                                            if (!isSubmitting) {
                                                handleDialogClose();
                                            }
                                        }}
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
                                        <p className="text-slate-400 mb-6 text-base">Step {step} of {TOTAL_STEPS}</p>
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
                                                                handleNext={handleNextWithValidation}
                                                            />
                                                        )}
                                                        {step === 2 && (
                                                            <Step2Details
                                                                tags={tags}
                                                                predefinedTags={PREDEFINED_TAGS}
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
                                                                handleNext={handleNextWithValidation}
                                                                handleBack={handleBack}
                                                            />
                                                        )}
                                                        {step === 3 && (
                                                            <Step3FileUpload
                                                                dragActive={dragActive}
                                                                formData={formData}
                                                                errors={errors}
                                                                storageLoading={storageLoading}
                                                                getMaxFileSize={() => getMaxFileSize(userStorageData)}
                                                                fileInputRef={fileInputRef}
                                                                handleDragOver={handleDragOver}
                                                                handleDragLeave={handleDragLeave}
                                                                handleDrop={handleDrop}
                                                                handleBrowseClick={handleBrowseClick}
                                                                handleFileChange={handleFileChange}
                                                                removeFile={removeFile}
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
                errorMessage={errors.modelFile || (uploadStage && uploadStage.includes('Failed at:') ? uploadStage : null)}
                isError={uploadStage && uploadStage.includes('Failed at:')}
                realTimeMessage={realTimeMessage}
                websocketData={websocketData}
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
            <UploadMessageDialogBox
                isOpen={messageDialog.isOpen}
                onClose={() => setMessageDialog(prev => ({ ...prev, isOpen: false }))}
                messageType={messageDialog.messageType}
                title={messageDialog.title}
                message={messageDialog.message}
                details={messageDialog.details}
                currentStage={messageDialog.currentStage}
                progressPercentage={messageDialog.progressPercentage}
                fileName={messageDialog.fileName}
            />
        </>
    );
}
