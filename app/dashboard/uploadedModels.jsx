'use client';
import { useState } from 'react';
import DefaultModelImage from '@/app/components/model/defaultModelImage';
import { FaEye, FaCalendarAlt, FaUser, FaTag, FaExclamationTriangle } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import PLANS from '../plans';

export default function UploadedModels({ isRowLayout }) {
    const [currentPage, setCurrentPage] = useState(1);
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



    const handleViewModel = (modelId) => {
        router.push(`/modelsList/${modelId}`);
    };


    if (isLoading) {
        return ( 
            <div className="flex flex-col mt-15 mb-15">
                <h2 className={`${isRowLayout ? 'text-lg sm:text-xl md:text-2xl' : 'text-xl sm:text-2xl md:text-4xl'} font-semibold text-white mb-8`}>Uploaded Models</h2>
                <div className="text-center py-10">
                    <div className="animate-pulse flex flex-col items-center">
                        <div className="h-8 w-32 bg-slate-700/50 rounded mb-4"></div>
                        <div className="h-4 w-48 bg-slate-700/50 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-10">
                <p className="text-red-300 text-lg">Error loading models: {error.message}</p>
                <button
                    onClick={() => refetch()}
                    className="mt-4 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors"
                >
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <>
            <div className="flex flex-col mt-6 mb-10">
                {/* Storage Usage Indicator */}
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-white">Storage used</span>
                        <span className="text-sm font-medium text-gray-300">
                            {totalStorageUsedMB < 0.01 ? `${(totalStorageUsedMB * 1024).toFixed(1)}KB` : `${totalStorageUsedMB.toFixed(2)}MB`} / {storageCapMB}MB
                        </span>
                    </div>
                    <div className="w-full bg-slate-700/50 rounded-full h-3">
                        <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full" style={{ width: `${storagePercent}%` }}></div>
                    </div>
                </div>


                {models.length === 0 ? (
                    <div className="text-center py-10 bg-slate-800/60 backdrop-blur-md border border-slate-700/50 rounded-2xl shadow-lg">
                        <div className="max-w-md mx-auto">
                            <div className="text-6xl mb-4">🚀</div>
                            <p className="text-white text-lg font-medium">No Models Uploaded Yet</p>
                            <p className="text-gray-300 mt-2">Click the "Upload Model" button to share your first creation!</p>
                        </div>
                    </div>
                ) : (
                    <div className={`grid ${isRowLayout ? 'grid-cols-1 gap-4' : 'grid-cols-1 md:grid-cols-2 gap-6'}`}>
                        {currentModels.map(model => (
                            <div 
                                key={model.id}
                                className={`bg-slate-800/80 backdrop-blur-md border border-slate-700/50 rounded-xl shadow-lg hover:shadow-purple-500/25 transition-all duration-200 overflow-hidden ${
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
                                    <h3 className={`font-semibold text-white ${isRowLayout ? 'text-xl mb-1' : 'text-2xl mb-2'}`}>{model.name}</h3>

                                    {/* Model Info */}
                                    <div className="flex flex-col gap-1 mb-3">
                                        <div className="flex items-center gap-2 text-sm text-gray-300">
                                            <FaUser className="text-purple-400" />
                                            <span>Uploaded by {model.author_email || 'You'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-300">
                                            <FaCalendarAlt className="text-purple-400" />
                                            <span>
                                                {model.created_at
                                                    ? new Date(model.created_at).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })
                                                    : 'Upload date unavailable'
                                                }
                                            </span>
                                        </div>
                                        {(() => {
                                            try {
                                                const fileStorage = model.img_url ? JSON.parse(model.img_url) : null;
                                                if (fileStorage?.fileSize) {
                                                    const fileSizeMB = (fileStorage.fileSize / (1024 * 1024)).toFixed(2);
                                                    return (
                                                        <div className="flex items-center gap-2 text-sm text-gray-300">
                                                            <span className="text-purple-400">📁</span>
                                                            <span>File size: {fileSizeMB} MB</span>
                                                        </div>
                                                    );
                                                }
                                            } catch (e) {
                                                // Ignore parsing errors
                                            }
                                            return null;
                                        })()}
                                    </div>

                                    {model.status === 'pending' && (
                                        <div className="mb-3 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                                            <p className="text-yellow-300 text-sm flex items-center gap-2">
                                                <FaExclamationTriangle className="text-yellow-400" />
                                                This model is currently under review. It will be visible to others once approved.
                                            </p>
                                        </div>
                                    )}



                                    <div className="mb-4">
                                        <div className="flex items-center text-gray-300 mb-1">
                                            <FaTag className="mr-2 text-gray-400" />
                                            <span className="font-medium">Tags:</span>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {model.tags.map((tag, idx) => (
                                                <span
                                                    key={idx}
                                                    className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2.5 py-1 rounded-full text-xs font-medium"
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
                                                ${model.status === 'pending' ? 'bg-slate-700/30 text-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'}`}
                                            disabled={model.status === 'pending'}
                                        >
                                            <FaEye />
                                            <span>View</span>
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
                            className="px-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600/50 text-gray-300 hover:bg-slate-600/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                                            : 'bg-slate-700/50 border border-slate-600/50 text-gray-300 hover:bg-slate-600/50'
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
                            className="px-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600/50 text-gray-300 hover:bg-slate-600/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}