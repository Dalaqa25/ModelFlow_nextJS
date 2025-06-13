"use client"

import PurchasedModels from "./purchasedModels"
import UploadedModels from "./uploadedModels"
import { useState, useEffect } from 'react';
import { FaList, FaThLarge } from 'react-icons/fa';

export default function Dashboard() {
    const [isRowLayout, setIsRowLayout] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);

    // Load layout preference from localStorage on component mount
    useEffect(() => {
        const savedLayout = localStorage.getItem('dashboardLayout');
        if (savedLayout !== null) {
            setIsRowLayout(savedLayout === 'row');
        }
    }, []);

    // Save layout preference to localStorage when it changes
    const handleLayoutChange = () => {
        setIsTransitioning(true);
        const newLayout = !isRowLayout;
        setIsRowLayout(newLayout);
        localStorage.setItem('dashboardLayout', newLayout ? 'row' : 'column');
        
        // Reset transition state after animation completes
        setTimeout(() => {
            setIsTransitioning(false);
        }, 300); // Match this with the transition duration
    };

    return (
        <div className="w-[81%] max-w-[1500px] mx-auto mt-25">
            <div className="flex justify-between items-center">
                <h1 className="text-4xl lg:text-5xl font-semibold">Dashboard</h1>
                <button 
                    onClick={handleLayoutChange}
                    className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    title={isRowLayout ? "Switch to vertical layout" : "Switch to horizontal layout"}
                >
                    {isRowLayout ? <FaList size={24} /> : <FaThLarge size={24} />}
                </button>
            </div>
            <div 
                className={`flex transition-all duration-300 ease-in-out ${
                    isRowLayout ? 'flex-row gap-8' : 'flex-col gap-5'
                } mt-10 sm:mt-16 md:mt-10`}
            >
                {/* Purchased models */}
                <div className={`transition-all duration-300 ease-in-out ${
                    isRowLayout ? 'w-1/2' : 'w-full'
                } ${isTransitioning ? 'opacity-50' : 'opacity-100'}`}>
                    <PurchasedModels isRowLayout={isRowLayout} />
                </div>
                {/* Uploaded Models */}
                <div className={`transition-all duration-300 ease-in-out ${
                    isRowLayout ? 'w-1/2' : 'w-full'
                } ${isTransitioning ? 'opacity-50' : 'opacity-100'}`}>
                    <UploadedModels isRowLayout={isRowLayout} />
                </div>
            </div>
        </div>
    );
}