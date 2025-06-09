'use client';
import { FiPlus } from 'react-icons/fi';
import { useState, useEffect } from 'react';
import ModelUpload from '../components/model/modelUpload';
import { useKindeBrowserClient } from '@kinde-oss/kinde-auth-nextjs';
import DeletionDialog from './delation';

export default function UploadedModels({ isRowLayout }) { 
    const [uploadedModels, setUploadedModels] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [models, setModels] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, modelId: null, modelName: '' });
    const { user } = useKindeBrowserClient();
    const modelsPerPage = 5;

    const fetchModels = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/models/user-models');
            const data = await response.json();
            setModels(data);
        } catch (error) {
            console.error('Error fetching models:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchModels();
        }
    }, [user]);

    // Pagination logic
    const totalPages = Math.ceil(models.length / modelsPerPage);
    const indexOfLastModel = currentPage * modelsPerPage;
    const indexOfFirstModel = indexOfLastModel - modelsPerPage;
    const currentModels = models.slice(indexOfFirstModel, indexOfLastModel);

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

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[200px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    return (
        <>
            {/* Overlay with transition */}
            <div
                className={`fixed inset-0 bg-black z-50 transition-opacity duration-300 ${uploadedModels ? 'opacity-50 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setUploadedModels(false)}
                style={{ transitionProperty: 'opacity' }}>
            </div>
            <div className="flex flex-col mt-15 mb-15">
                <div className="flex flex-col sm:flex-row justify-between w-full gap-2 sm:gap-0 mb-4 sm:mb-8">
                    <h2 className={`${isRowLayout ? 'text-lg sm:text-xl md:text-2xl' : 'text-xl sm:text-2xl md:text-4xl'}`}>Uploaded Models</h2>   
                    <FiPlus 
                        onClick={() => setUploadedModels(true)} 
                        size={isRowLayout ? 35 : 45} 
                        className="text-gray-600 bg-gray-100 rounded-full cursor-pointer hover:text-gray-700 hover:bg-gray-200 transition-all p-1" 
                    />
                    {uploadedModels && <ModelUpload onUploadSuccess={() => {
                        setUploadedModels(false);
                        fetchModels();
                    }}/>}
                </div>
                {models.length === 0 ? (
                    <div className="text-center py-10">
                        <p className="text-gray-500 text-lg">You haven't uploaded any models yet.</p>
                        <p className="text-gray-400 mt-2">Click the + button above to upload your first model!</p>
                    </div>
                ) : (
                    <div className={`flex flex-col ${isRowLayout ? 'gap-3' : 'gap-5'}`}>
                        {currentModels.map(model => (
                            <div key={model._id} className={`border-1 border-gray-200 ${isRowLayout ? 'rounded-xl' : 'rounded-2xl'}`}>
                                <div className={`flex flex-col sm:flex-row justify-between w-full items-center ${isRowLayout ? 'py-3 px-3 sm:py-4 sm:px-6 gap-3' : 'py-4 px-4 sm:py-5 sm:px-10 gap-4'}`}>
                                    <div className={`flex flex-col sm:flex-row ${isRowLayout ? 'gap-3 sm:gap-4' : 'gap-4 sm:gap-5'} items-center`}>
                                        <img
                                            src={model.imageUrl || "/default-image.png"}
                                            alt={model.name}
                                            className={`object-cover ${isRowLayout 
                                                ? 'w-16 h-16 sm:w-[70px] sm:h-[70px] md:w-[80px] md:h-[80px] rounded-lg' 
                                                : 'w-20 h-20 sm:w-[80px] sm:h-[80px] md:w-[100px] md:h-[100px] rounded-xl'}`}
                                            sizes={isRowLayout 
                                                ? "(max-width: 640px) 64px, (max-width: 768px) 80px, 80px"
                                                : "(max-width: 640px) 80px, (max-width: 768px) 100px, 100px"}
                                        />
                                        
                                        <div>
                                            <h1 className={`${isRowLayout 
                                                ? 'text-base sm:text-lg md:text-xl' 
                                                : 'text-lg sm:text-xl md:text-3xl'}`}>{model.name}</h1>
                                            <p className={`font-light text-gray-400 ${isRowLayout 
                                                ? 'text-xs sm:text-sm md:text-base' 
                                                : 'text-sm sm:text-base md:text-lg'}`}>Author: {model.authorEmail}</p>
                                            <div className={`flex ${isRowLayout ? 'gap-1.5' : 'gap-2'} mt-1 flex-wrap justify-center sm:justify-start`}>
                                                {model.tags.map((tag, idx) => (
                                                    <span key={idx} className={`bg-purple-100 text-purple-700 ${isRowLayout 
                                                        ? 'px-1.5 py-0.5 rounded-md' 
                                                        : 'px-2 py-1 rounded-lg'} text-xs`}>{tag}</span>
                                                ))}
                                            </div>
                                            <p className={`font-light text-gray-400 ${isRowLayout 
                                                ? 'text-xs sm:text-sm md:text-base' 
                                                : 'text-sm sm:text-base md:text-lg'}`}>Price: ${model.price}</p>
                                        </div>
                                    </div>
                                    <div className={`flex flex-col sm:flex-row ${isRowLayout ? 'gap-2 sm:gap-3' : 'gap-3 sm:gap-5'} w-full sm:w-auto`}>
                                        <button className={`text-white button btn-primary ${isRowLayout 
                                            ? 'px-3 py-1.5 text-sm rounded-lg sm:px-4 sm:py-2 sm:text-base 2xl:text-2xl' 
                                            : 'px-4 py-2 text-base rounded-xl sm:px-6 sm:py-3 sm:text-lg md:px-8 md:py-4 md:text-xl 2xl:text-4xl'}`}>
                                            Edit
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteClick(model._id, model.name)}
                                            className={`text-black button shadow ${isRowLayout 
                                                ? 'px-3 py-1.5 text-sm rounded-lg sm:px-4 sm:py-2 sm:text-base 2xl:text-2xl' 
                                                : 'px-4 py-2 text-base rounded-xl sm:px-6 sm:py-3 sm:text-lg md:px-8 md:py-4 md:text-xl 2xl:text-4xl'}`}>
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                {/* Pagination Controls */}
                {models.length > 0 && (
                    <div className={`flex justify-center ${isRowLayout ? 'gap-1.5 mt-4' : 'gap-2 mt-6'}`}>
                        <button
                            onClick={() => {
                                setCurrentPage(prev => {
                                    const newPage = Math.max(prev - 1, 1);
                                    setTimeout(scrollToTop, 0);
                                    return newPage;
                                });
                            }}
                            disabled={currentPage === 1}
                            className={`${isRowLayout 
                                ? 'px-2 py-0.5 text-sm' 
                                : 'px-3 py-1'} rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50`}
                        >
                            Prev
                        </button>
                        {[...Array(totalPages)].map((_, i) => (
                            <button
                                key={i}
                                onClick={() => {
                                    setCurrentPage(i + 1);
                                    setTimeout(scrollToTop, 0);
                                }}
                                className={`${isRowLayout 
                                    ? 'px-2 py-0.5 text-sm' 
                                    : 'px-3 py-1'} rounded ${currentPage === i + 1 ? 'bg-purple-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                            >
                                {i + 1}
                            </button>
                        ))}
                        <button
                            onClick={() => {
                                setCurrentPage(prev => {
                                    const newPage = Math.min(prev + 1, totalPages);
                                    setTimeout(scrollToTop, 0);
                                    return newPage;
                                });
                            }}
                            disabled={currentPage === totalPages}
                            className={`${isRowLayout 
                                ? 'px-2 py-0.5 text-sm' 
                                : 'px-3 py-1'} rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50`}
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
            <DeletionDialog
                isOpen={deleteDialog.isOpen}
                onClose={() => setDeleteDialog({ isOpen: false, modelId: null, modelName: '' })}
                modelId={deleteDialog.modelId}
                modelName={deleteDialog.modelName}
                onDeleteSuccess={fetchModels}
            />
        </>
    );
}