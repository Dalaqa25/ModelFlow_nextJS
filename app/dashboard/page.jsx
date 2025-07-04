"use client"

import PurchasedModels from "./purchasedModels"
import UploadedModels from "./uploadedModels"
import { useState, useEffect } from 'react';
import { FaList, FaThLarge } from 'react-icons/fa';
import ModelUpload from '../components/model/modelUpload';

export default function Dashboard() {
    const [isRowLayout, setIsRowLayout] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);

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
        <div className="mt-10 bg-white py-10">
            <div className="max-w-5xl mx-auto px-4">
                {/* Dashboard Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-10 gap-4">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 mb-1">Dashboard</h1>
                        <p className="text-base text-gray-500">Your models and activity at a glance.</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowUploadModal(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg shadow transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400 font-semibold"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                            <span>Upload Model</span>
                        </button>
                        <button
                            onClick={handleLayoutChange}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400"
                            title={isRowLayout ? 'Switch to vertical layout' : 'Switch to horizontal layout'}
                        >
                            {isRowLayout ? <FaList size={20} /> : <FaThLarge size={20} />}
                            <span className="text-sm font-medium hidden sm:inline">Layout</span>
                        </button>
                    </div>
                </div>
                {/* Main Content */}
                <div
                    className={`flex transition-all duration-300 ease-in-out ${
                        isRowLayout ? 'flex-row gap-8' : 'flex-col gap-8'
                    }`}
                >
                    {/* Purchased Models Card */}
                    <section className={`bg-white rounded-2xl shadow-md border border-gray-100 p-6 flex-1 transition-all duration-300 ${isTransitioning ? 'opacity-60' : 'opacity-100'}`}>
                        <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b border-gray-100 pb-2">Purchased Models</h2>
                        <PurchasedModels isRowLayout={isRowLayout} />
                    </section>
                    {/* Uploaded Models Card */}
                    <section className={`bg-white rounded-2xl shadow-md border border-gray-100 p-6 flex-1 transition-all duration-300 ${isTransitioning ? 'opacity-60' : 'opacity-100'}`}>
                        <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b border-gray-100 pb-2">Uploaded Models</h2>
                        <UploadedModels isRowLayout={isRowLayout} />
                    </section>
                </div>
                <ModelUpload
                    isOpen={showUploadModal}
                    onClose={() => setShowUploadModal(false)}
                    onUploadSuccess={() => setShowUploadModal(false)}
                />
            </div>
        </div>
    );
}