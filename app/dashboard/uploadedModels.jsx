'use client';
import { FiPlus } from 'react-icons/fi';
import { useState, useEffect } from 'react';
import ModelUpload from '../components/model/modelupload/modelUpload';
import DefaultModelImage from '@/app/components/model/defaultModelImage';
import { FaDownload, FaEye, FaCalendarAlt, FaUser, FaTag, FaTrash, FaExclamationTriangle, FaArchive } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import ArchiveConfirm from './archive/ArchiveConfirm';
import PLANS from '../plans';

export default function UploadedModels({ isRowLayout }) { 
    const [uploadedModels, setUploadedModels] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, modelId: null, modelName: '' });
    const [editDialog, setEditDialog] = useState({ isOpen: false, model: null });
    const [archiveDialog, setArchiveDialog] = useState({ isOpen: false, modelId: null, modelName: '' });
    const router = useRouter();
    const modelsPerPage = 5;

    // Updated useQuery to handle new API response shape
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['userModels'],
        queryFn: async () => {
            const response = await fetch(`/api/models/user-models`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch models');
            }
            const data = await response.json();
            // Expecting { models, totalStorageUsedMB }
            return data;
        },
        enabled: true,
    });

    // Extract models and storage used from API response
    const models = data?.models || [];
    const totalStorageUsedMB = data?.totalStorageUsedMB ?? 0;
    const userPlan = data?.plan || 'basic';
    // Parse the storage cap from PLANS based on the user's plan
    const storageCapStr = PLANS[userPlan]?.features?.activeStorage || '250 MB';
    // Extract the number (in MB or GB) and convert to MB
    let storageCapMB = 250;
    if (storageCapStr.toLowerCase().includes('gb')) {
        storageCapMB = parseInt(storageCapStr.replace(/\D/g, '')) * 1024;
    } else if (storageCapStr.toLowerCase().includes('mb')) {
        storageCapMB = parseInt(storageCapStr.replace(/\D/g, ''));
    }
    const storagePercent = Math.min((totalStorageUsedMB / storageCapMB) * 100, 100);

    // Pagination logic
    const totalPages = Math.ceil((models?.length || 0) / modelsPerPage);
    const indexOfLastModel = currentPage * modelsPerPage;
    const indexOfFirstModel = indexOfLastModel - modelsPerPage;
    const currentModels = Array.isArray(models) ? models.slice(indexOfFirstModel, indexOfLastModel) : [];

    // Helper to scroll to top
    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleDeleteClick = (modelId, modelName) => {
        setDeleteDialog({
            isOpen: true,
            modelId,
            modelName
        });
    };

    const handleEditClick = (model) => {
        setEditDialog({
            isOpen: true,
            model
        });
    };

    const handleViewModel = (modelId) => {
        router.push(`/modelsList/${modelId}`);
    };

    // Replace handleArchiveClick to open confirmation dialog
    const handleArchiveClick = (modelId, modelName) => {
        setArchiveDialog({ isOpen: true, modelId, modelName });
    };
    // Confirm archive action
    const confirmArchive = async () => {
        try {
            const response = await fetch(`/api/models/archive-model/${archiveDialog.modelId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to archive model');
            }
            await response.json();
            refetch();
            setArchiveDialog({ isOpen: false, modelId: null, modelName: '' });
            alert('Model archived successfully!');
        } catch (error) {
            alert(`Error archiving model: ${error.message}`);
        }
    };

    if (isLoading) {
        return ( 
            <div className="flex flex-col mt-15 mb-15">
                <h2 className={`${isRowLayout ? 'text-lg sm:text-xl md:text-2xl' : 'text-xl sm:text-2xl md:text-4xl'} font-semibold text-gray-800 mb-8`}>Uploaded Models</h2>   
                <div className="text-center py-10">
                    <div className="animate-pulse flex flex-col items-center">
                        <div className="h-8 w-32 bg-gray-200 rounded mb-4"></div>
                        <div className="h-4 w-48 bg-gray-200 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-10">
                <p className="text-red-500 text-lg">Error loading models: {error.message}</p>
                <button 
                    onClick={() => refetch()}
                    className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <>
            {/* Overlay with transition */}
            <div
                className={`fixed inset-0 bg-black z-50 transition-opacity duration-300 ${uploadedModels || editDialog.isOpen ? 'opacity-50 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                onClick={() => { setUploadedModels(false); setEditDialog({ isOpen: false, model: null }); }}
                style={{ transitionProperty: 'opacity' }}>
            </div>
            {/* Archive confirmation dialog */}
            <ArchiveConfirm
                isOpen={archiveDialog.isOpen}
                onConfirm={confirmArchive}
                onCancel={() => setArchiveDialog({ isOpen: false, modelId: null, modelName: '' })}
            />
            <div className="flex flex-col mt-6 mb-10">
                {/* Storage Usage Indicator */}
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">Storage used</span>
                        <span className="text-sm font-medium text-gray-500">
                            {totalStorageUsedMB < 0.01 ? `${(totalStorageUsedMB * 1024).toFixed(1)}KB` : `${totalStorageUsedMB.toFixed(2)}MB`} / {storageCapMB}MB
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                        <div className="bg-purple-600 h-3 rounded-full" style={{ width: `${storagePercent}%` }}></div>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row justify-between w-full gap-2 sm:gap-0 mb-4 sm:mb-8">
                    <h2 className={`${isRowLayout ? 'text-lg sm:text-xl md:text-2xl' : 'text-xl sm:text-2xl md:text-4xl'} font-semibold text-gray-800`}>Uploaded Models</h2>   
                    <button
                        onClick={() => setUploadedModels(true)}
                        className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                    >
                        <FiPlus size={20} />
                        <span>Upload Model</span>
                    </button>
                </div>
                <ModelUpload 
                    isOpen={uploadedModels}
                    onClose={() => setUploadedModels(false)}
                    onUploadSuccess={() => {
                        setUploadedModels(false);
                        refetch();
                    }}
                />
                {models.length === 0 ? (
                    <div className="text-center py-10 bg-white rounded-2xl shadow-sm border border-gray-100">
                        <div className="max-w-md mx-auto">
                            <div className="text-6xl mb-4">🚀</div>
                            <p className="text-gray-600 text-lg font-medium">No Models Uploaded Yet</p>
                            <p className="text-gray-400 mt-2">Click the "Upload Model" button to share your first creation!</p>
                        </div>
                    </div>
                ) : (
                    <div className={`grid ${isRowLayout ? 'grid-cols-1 gap-4' : 'grid-cols-1 md:grid-cols-2 gap-6'}`}>
                        {currentModels.map(model => (
                            <div 
                                key={model.id}
                                className={`bg-white rounded-xl shadow-md border border-gray-100 transition-shadow duration-200 overflow-hidden ${
                                    isRowLayout ? 'flex p-4 items-center gap-4' : 'p-4'
                                }`}
                            >
                                <div className={`relative flex-shrink-0 ${isRowLayout ? 'w-24 h-24 rounded-xl overflow-hidden' : 'w-full h-48 rounded-xl overflow-hidden'}`}>
                                    {model.imgUrl ? (
                                        <img
                                            src={model.imgUrl}
                                            alt={model.name}
                                            className="w-full h-full object-cover rounded-xl"
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.nextSibling.style.display = 'flex';
                                            }}
                                        />
                                    ) : (
                                        <DefaultModelImage size="medium" />
                                    )}
                                    <div className="absolute top-0 left-0 bg-purple-600 text-white text-sm font-semibold px-3 py-1.5 rounded-br-lg rounded-tl-xl">
                                        ${(model.price / 100).toFixed(2)}
                                    </div>
                                    {model.status === 'pending' && (
                                        <div className="absolute top-0 right-0 bg-yellow-500 text-white text-sm font-semibold px-3 py-1.5 rounded-bl-lg rounded-tr-xl flex items-center gap-1">
                                            <FaExclamationTriangle size={14} />
                                            <span>Pending</span>
                                        </div>
                                    )}
                                </div>
                                
                                <div className={`flex flex-col ${isRowLayout ? 'flex-1 justify-center' : 'mt-4'}`}>
                                    <h3 className={`font-semibold text-gray-800 ${isRowLayout ? 'text-xl mb-1' : 'text-2xl mb-2'}`}>{model.name}</h3>
                                    
                                    {model.status === 'pending' && (
                                        <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                            <p className="text-yellow-700 text-sm flex items-center gap-2">
                                                <FaExclamationTriangle className="text-yellow-500" />
                                                This model is currently under review. It will be visible to others once approved.
                                            </p>
                                        </div>
                                    )}

                                    <div className="space-y-1 text-sm text-gray-600 mb-2">
                                        <div className="flex items-center">
                                            <FaUser className="mr-2 text-gray-500" />
                                            <span>{model.authorEmail}</span>
                                        </div>
                                        <div className="flex items-center">
                                            <FaCalendarAlt className="mr-2 text-gray-500" />
                                            <span>Uploaded {new Date(model.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <div className="flex items-center text-gray-600 mb-1">
                                            <FaTag className="mr-2 text-gray-500" />
                                            <span className="font-medium">Tags:</span>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {model.tags.map((tag, idx) => (
                                                <span 
                                                    key={idx} 
                                                    className="bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full text-xs font-medium"
                                                >
                                                    {tag.toUpperCase()}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className={`flex ${isRowLayout ? 'flex-col gap-2' : 'flex-col gap-3'} sm:flex-row mt-auto`}>
                                        <button 
                                            onClick={() => !model.status || model.status !== 'pending' ? handleViewModel(model.id) : null}
                                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm sm:text-base transition-colors 
                                                ${model.status === 'pending' ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-purple-700 text-white hover:bg-purple-800'}`}
                                            disabled={model.status === 'pending'}
                                        >
                                            <FaEye />
                                            <span>View</span>
                                        </button>
                                        <button 
                                            onClick={() => model.status !== 'pending' ? handleArchiveClick(model.id, model.name) : null}
                                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm sm:text-base transition-colors border 
                                                ${model.status === 'pending' ? 'bg-gray-200 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200'}`}
                                            disabled={model.status === 'pending'}
                                        >
                                            <FaArchive />
                                            <span>Archive</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                {/* Pagination Controls */}
                {models.length > 0 && (
                    <div className="flex justify-center gap-2 mt-8">
                        <button
                            onClick={() => {
                                setCurrentPage(prev => {
                                    const newPage = Math.max(prev - 1, 1);
                                    setTimeout(scrollToTop, 0);
                                    return newPage;
                                });
                            }}
                            disabled={currentPage === 1}
                            className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Previous
                        </button>
                        <div className="flex gap-1">
                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => {
                                        setCurrentPage(i + 1);
                                        setTimeout(scrollToTop, 0);
                                    }}
                                    className={`w-10 h-10 rounded-lg ${
                                        currentPage === i + 1 
                                            ? 'bg-purple-600 text-white' 
                                            : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                                    } transition-colors`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => {
                                setCurrentPage(prev => {
                                    const newPage = Math.min(prev + 1, totalPages);
                                    setTimeout(scrollToTop, 0);
                                    return newPage;
                                });
                            }}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}