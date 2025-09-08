'use client';
import { useState, forwardRef, useImperativeHandle } from 'react';
import { useRouter } from "next/navigation";
import { FaDownload, FaEye, FaCalendarAlt, FaUser, FaTag } from 'react-icons/fa';
import DefaultModelImage from '@/app/components/model/defaultModelImage';
import { useQuery } from '@tanstack/react-query';

const PurchasedModels = forwardRef(function PurchasedModels({ isRowLayout }, ref) {
    const [currentPage, setCurrentPage] = useState(1);
    const router = useRouter();
    const modelsPerPage = 5;

    const { data: models = [], isLoading, error, refetch } = useQuery({
        queryKey: ['purchasedModels'],
        queryFn: async () => {
            const response = await fetch('/api/user/purchased-models');
            if (!response.ok) {
                throw new Error('Failed to fetch purchased models');
            }
            const data = await response.json();
            return data;
        },
        enabled: true,
        // Cache configuration to prevent unnecessary refetches
        staleTime: 5 * 60 * 1000, // Data considered fresh for 5 minutes
        gcTime: 10 * 60 * 1000, // Cache garbage collected after 10 minutes
        refetchOnWindowFocus: false, // Don't refetch when tab becomes active
        refetchOnReconnect: false, // Don't refetch when reconnecting to internet
        refetchOnMount: false, // Don't refetch when component remounts if data is still fresh
    });

    // Pagination logic
    const totalPages = Math.ceil((models?.length || 0) / modelsPerPage);
    const indexOfLastModel = currentPage * modelsPerPage;
    const indexOfFirstModel = indexOfLastModel - modelsPerPage;
    const currentModels = Array.isArray(models) ? models.slice(indexOfFirstModel, indexOfLastModel) : [];

    // Helper to scroll to top
    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // Expose refresh method to parent component
    useImperativeHandle(ref, () => ({
        handleRefresh: () => refetch()
    }));

    const handleViewModel = (modelId) => {
        router.push(`/modelsList/${modelId}`);
    };

    const handleDownload = async (modelId) => {
        try {
            const response = await fetch(`/api/models/${modelId}/download`);
            if (!response.ok) {
                throw new Error('Failed to download model');
            }
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `model-${modelId}.zip`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Error downloading model:', error);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col mt-15 mb-15">
                <div className="flex flex-col sm:flex-row justify-between w-full gap-2 sm:gap-0 mb-4 sm:mb-8">
                    <h2 className={`${isRowLayout ? 'text-lg sm:text-xl md:text-2xl' : 'text-xl sm:text-2xl md:text-4xl'} font-semibold text-white`}>Purchased Models</h2>
                </div>
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
        <div className="flex flex-col mt-15 mb-15">
            {models.length === 0 ? (
                <div className="text-center py-10 bg-gray-800/60 backdrop-blur-md border border-slate-700/50 rounded-2xl shadow-lg">
                    <div className="max-w-md mx-auto">
                        <div className="text-6xl mb-4">📦</div>
                        <p className="text-white text-lg font-medium">No Purchased Models Yet</p>
                        <p className="text-gray-300 mt-2">Explore our marketplace to find amazing models!</p>
                        <button
                            onClick={() => router.push('/modelsList')}
                            className="mt-4 px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors"
                        >
                            Browse Models
                        </button>
                    </div>
                </div>
            ) : (
                <div className={`grid ${isRowLayout ? 'grid-cols-1 gap-4' : 'grid-cols-1 md:grid-cols-2 gap-6'}`}>
                    {currentModels.map(model => (
                        <div
                            key={model.id}
                            className={`bg-slate-800/80 backdrop-blur-md border border-slate-700/50 rounded-2xl shadow-lg hover:shadow-purple-500/25 transition-all duration-200 overflow-hidden ${
                                isRowLayout ? 'flex flex-col sm:flex-row' : ''
                            }`}
                        >
                            <div className={`relative ${isRowLayout ? 'sm:w-48' : 'w-full h-48'}`}>
                                {model.imgUrl ? (
                                    <img
                                        src={model.imgUrl}
                                        alt={model.name}
                                        className={`w-full h-full object-cover ${isRowLayout ? 'sm:h-full' : ''}`}
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'flex';
                                        }}
                                    />
                                ) : (
                                    <div className={`w-full h-full flex items-center justify-center ${isRowLayout ? 'sm:h-full' : ''}`}>
                                        <DefaultModelImage size={isRowLayout ? "small" : "medium"} />
                                    </div>
                                )}
                                <div className="absolute top-2 right-2 bg-purple-500 text-white px-2 py-1 rounded-lg text-sm font-medium">
                                    ${(model.price / 100).toFixed(2)}
                                </div>
                            </div>
                            
                            <div className={`p-4 ${isRowLayout ? 'flex-1' : ''}`}>
                                <h3 className="text-xl font-semibold text-white mb-2">{model.name}</h3>
                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center text-gray-300">
                                        <FaUser className="mr-2" />
                                        <span>{model.authorEmail || "Unknown Author"}</span>
                                    </div>
                                    <div className="flex items-center text-gray-300">
                                        <FaCalendarAlt className="mr-2" />
                                        <span>Purchased {model.purchasedAt ? new Date(model.purchasedAt).toLocaleDateString() : "Unknown date"}</span>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <div className="flex items-center text-gray-300 mb-2">
                                        <FaTag className="mr-2" />
                                        <span className="font-medium">Tags:</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {(model.tags && model.tags.length > 0 ? model.tags : ["No tags"]).map((tag, idx) => (
                                            <span
                                                key={idx}
                                                className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-1 rounded-md text-sm"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className={`flex ${isRowLayout ? 'gap-2' : 'gap-3'} mt-auto`}>
                                      <button 
                                        onClick={() => handleViewModel(model.id)}
                                        className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors"
                                      >
                                        <FaEye />
                                        <span>View Details</span>
                                      </button>
                                      {model.fileStorage?.supabasePath ? (
                                        <button
                                          onClick={async () => {
                                            try {
                                              const res = await fetch(`/api/models/${model.id}/download`);
                                              const data = await res.json();
                                              if (data.downloadUrl) {
                                                window.open(data.downloadUrl, '_blank');
                                              } else {
                                                alert('Failed to get download link.');
                                              }
                                            } catch (err) {
                                              alert('Error downloading: ' + err.message);
                                            }
                                          }}
                                          className="flex-1 flex items-center justify-center gap-2 bg-slate-700/50 text-gray-300 border border-slate-600/50 px-4 py-2 rounded-lg hover:bg-slate-600/50 transition-colors"
                                        >
                                          <FaDownload />
                                          <span>Download</span>
                                        </button>
                                      ) : (
                                        <button
                                          className="flex-1 flex items-center justify-center gap-2 bg-slate-700/30 text-gray-500 border border-slate-600/30 px-4 py-2 rounded-lg cursor-not-allowed"
                                          disabled
                                          title="This model is not available for download."
                                        >
                                          <FaDownload />
                                          <span>Download</span>
                                        </button>
                                      )}
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
    );
});

export default PurchasedModels;
