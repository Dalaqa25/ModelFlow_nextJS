'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaList, FaThLarge, FaArchive } from 'react-icons/fa';
import PurchasedModels from './purchasedModels';
import UploadedModels from './uploadedModels';
import ArchiveBox from './archive/ArchiveBox';
import ModelUpload from '../components/model/modelupload/modelUpload';
import { useAuth } from '@/lib/supabase-auth-context';

export default function Dashboard() {
    const { user, isAuthenticated } = useAuth();
    const [isRowLayout, setIsRowLayout] = useState(true);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showArchived, setShowArchived] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const router = useRouter();

    // Auth check - middleware will handle redirects, but we can show loading state
    useEffect(() => {
        if (user === null && !isAuthenticated) {
            // Middleware will redirect to home page, no need for manual redirect
            return;
        }
    }, [user, isAuthenticated, router]);

    // Layout preference from localStorage
    useEffect(() => {
        const layout = localStorage.getItem('dashboardLayout');
        if (layout) setIsRowLayout(layout === 'row');
    }, []);

    useEffect(() => {
        localStorage.setItem('dashboardLayout', isRowLayout ? 'row' : 'col');
    }, [isRowLayout]);

    const handleLayoutChange = () => {
        setIsTransitioning(true);
        setIsRowLayout(prev => !prev);
        setTimeout(() => setIsTransitioning(false), 300);
    };

    return (
        <div className="min-h-screen mt-10 bg-gradient-to-b from-white to-purple-50/25 py-12 px-6">
            <div className="max-w-5xl mx-auto rounded-3xl p-8">
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
                        <button
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg shadow transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 font-semibold"
                            onClick={() => setShowArchived(true)}
                        >
                            <FaArchive size={20} />
                            <span>Archived</span>
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
                <ArchiveBox isOpen={showArchived} onClose={() => setShowArchived(false)} userEmail={user?.email} />
                <ModelUpload
                    isOpen={showUploadModal}
                    onClose={() => setShowUploadModal(false)}
                    onUploadSuccess={() => setShowUploadModal(false)}
                />
            </div>
        </div>
    );
}