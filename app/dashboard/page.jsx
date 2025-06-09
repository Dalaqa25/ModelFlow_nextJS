"use client"

import PurchasedModels from "./purchasedModels"
import UploadedModels from "./uploadedModels"
import { useState, useEffect } from 'react';
import { FaList, FaThLarge } from 'react-icons/fa';

export default function Dashboard() {
    const [isRowLayout, setIsRowLayout] = useState(false);

    // Load layout preference from localStorage on component mount
    useEffect(() => {
        const savedLayout = localStorage.getItem('dashboardLayout');
        if (savedLayout !== null) {
            setIsRowLayout(savedLayout === 'row');
        }
    }, []);

    // Save layout preference to localStorage when it changes
    const handleLayoutChange = () => {
        const newLayout = !isRowLayout;
        setIsRowLayout(newLayout);
        localStorage.setItem('dashboardLayout', newLayout ? 'row' : 'column');
    };

    return (
        <div className="w-[100%] lg:w-[81%] max-w-[1500px] mx-auto mt-25">
            <div className="flex justify-between items-center">
                <h1 className="text-4xl lg:text-5xl font-semibold">Dashboard</h1>
                <button 
                    onClick={handleLayoutChange}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    title={isRowLayout ? "Switch to vertical layout" : "Switch to horizontal layout"}
                >
                    {isRowLayout ? <FaList size={24} /> : <FaThLarge size={24} />}
                </button>
            </div>
            <div className={`flex ${isRowLayout ? 'flex-row gap-8' : 'flex-col gap-5'} mt-10 sm:mt-16 md:mt-10`}>
                {/* Purchased models */}
                <div className={isRowLayout ? 'w-1/2' : 'w-full'}>
                    <PurchasedModels isRowLayout={isRowLayout} />
                </div>
                {/* Uploaded Models */}
                <div className={isRowLayout ? 'w-1/2' : 'w-full'}>
                    <UploadedModels isRowLayout={isRowLayout} />
                </div>
            </div>
        </div>
    );
}