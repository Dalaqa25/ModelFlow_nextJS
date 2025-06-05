'use client';
import { FiPlus} from 'react-icons/fi';
import { useState } from 'react';
import ModelUpload from '../components/model/modelUpload';

export default function UploadedModels() { 
    const [uploadedModels, setUploadedModels] = useState(false)
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
                <div className="border-1 border-gray-200 rounded-2xl">
                    <div className="flex flex-col sm:flex-row justify-between w-full items-center py-4 px-4 sm:py-5 sm:px-10 gap-4">
                        <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 items-center">
                            <img
                                src="plansImg2.png"
                                alt="model"
                                className="w-20 h-20 sm:w-[80px] sm:h-[80px] md:w-[100px] md:h-[100px] object-cover rounded-xl"
                                sizes="(max-width: 640px) 80px, (max-width: 768px) 100px, 100px"
                            />
                            <div className="flex flex-col gap-0.5 text-center sm:text-left">
                                <h1 className="text-lg sm:text-xl md:text-3xl">ImageNet Model</h1>
                                <p className="font-light text-gray-400 text-sm sm:text-base md:text-lg">Uploaded: 05/12/2025</p>
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
            </div>
        </div>
        </>
    )
}