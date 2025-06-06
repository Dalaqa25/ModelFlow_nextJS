'use client';
import { FiPlus } from 'react-icons/fi';
import { useState } from 'react';
import ModelUpload from '../components/model/modelUpload';
import modelData from '../modelsList/modeldata';

export default function UploadedModels() { 
    const [uploadedModels, setUploadedModels] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const modelsPerPage = 5;

    // Pagination logic
    const totalPages = Math.ceil(modelData.length / modelsPerPage);
    const indexOfLastModel = currentPage * modelsPerPage;
    const indexOfFirstModel = indexOfLastModel - modelsPerPage;
    const currentModels = modelData.slice(indexOfFirstModel, indexOfLastModel);

    // Helper to scroll to top
    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

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
                    <h2 className="text-xl sm:text-2xl md:text-4xl">Uploaded Models</h2>   
                    <FiPlus onClick={() => setUploadedModels(true)} size={45} className="text-gray-600 bg-gray-100 rounded-full cursor-pointer hover:text-gray-700 hover:bg-gray-200 transition-all p-1" />
                    {uploadedModels && <ModelUpload/>}
                </div>
                <div className="flex flex-col gap-5">
                    {currentModels.map(model => (
                        <div key={model.id} className="border-1 border-gray-200 rounded-2xl">
                            <div className="flex flex-col sm:flex-row justify-between w-full items-center py-4 px-4 sm:py-5 sm:px-10 gap-4">
                                <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 items-center">
                                    <img
                                        src={model.image?.src || "default-image.png"}
                                        alt={model.image?.alt || "model"}
                                        className="w-20 h-20 sm:w-[80px] sm:h-[80px] md:w-[100px] md:h-[100px] object-cover rounded-xl"
                                        sizes="(max-width: 640px) 80px, (max-width: 768px) 100px, 100px"
                                    />
                                    <div className="flex flex-col gap-0.5 text-center sm:text-left">
                                        <h1 className="text-lg sm:text-xl md:text-3xl">{model.name}</h1>
                                        <p className="font-light text-gray-400 text-sm sm:text-base md:text-lg">Author: {model.author}</p>
                                        <div className="flex gap-2 mt-1 flex-wrap">
                                            {model.tags.map((tag, idx) => (
                                                <span key={idx} className="bg-purple-100 text-purple-700 px-2 py-1 rounded-lg text-xs">{tag}</span>
                                            ))}
                                        </div>
                                        <p className="font-light text-gray-400 text-sm sm:text-base md:text-lg">Price: ${model.price}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-3 sm:gap-5 w-full sm:w-auto">
                                    <button className="text-white button btn-primary px-4 py-2 text-base rounded-xl sm:px-6 sm:py-3 sm:text-lg md:px-8 md:py-4 md:text-xl">
                                        Edit
                                    </button>
                                    <button className="text-black button shadow px-4 py-2 text-base rounded-xl sm:px-6 sm:py-3 sm:text-lg md:px-8 md:py-4 md:text-xl">
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                {/* Pagination Controls */}
                <div className="flex justify-center gap-2 mt-6">
                    <button
                        onClick={() => {
                            setCurrentPage(prev => {
                                const newPage = Math.max(prev - 1, 1);
                                setTimeout(scrollToTop, 0);
                                return newPage;
                            });
                        }}
                        disabled={currentPage === 1}
                        className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
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
                            className={`px-3 py-1 rounded ${currentPage === i + 1 ? 'bg-purple-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
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
                        className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            </div>
        </>
    )
}