'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaList, FaThLarge, FaArchive } from 'react-icons/fa';
import PurchasedModels from './purchasedModels';
import UploadedModels from './uploadedModels';
import ArchiveBox from './archive/ArchiveBox';
import ModelUpload from '../components/model/modelupload/modelUpload';
import { useAuth } from '@/lib/supabase-auth-context';
import UnifiedBackground from '@/app/components/shared/UnifiedBackground';
import UnifiedCard from '@/app/components/shared/UnifiedCard';

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
        <UnifiedBackground variant="content" className="pt-16">
            <div className="pt-24 pb-12 px-6">
                <div className="max-w-5xl mx-auto">
                    {/* Dashboard Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center px-4 py-2 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-sm font-medium mb-6">
                            <span className="w-2 h-2 bg-purple-400 rounded-full mr-2 animate-pulse"></span>
                            Your Dashboard
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-2">
                            Welcome Back
                        </h1>
                        <p className="text-lg text-gray-300 mb-8">Your models and activity at a glance</p>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-10 gap-4">
                        <div className="flex gap-3 justify-center sm:justify-start">
                            <button
                                onClick={() => setShowUploadModal(true)}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg shadow-lg transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-400 font-semibold"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                                <span>Upload Model</span>
                            </button>
                            <button
                                onClick={handleLayoutChange}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/50 border border-purple-500/50 text-purple-300 rounded-lg shadow hover:bg-purple-500/10 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                title={isRowLayout ? 'Switch to vertical layout' : 'Switch to horizontal layout'}
                            >
                                {isRowLayout ? <FaList size={20} /> : <FaThLarge size={20} />}
                                <span className="text-sm font-medium hidden sm:inline">Layout</span>
                            </button>
                            <button
                                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/50 border border-slate-600/50 text-gray-300 rounded-lg shadow hover:bg-slate-700/50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-slate-500 font-semibold"
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
                        <UnifiedCard variant="solid" className={`flex-1 transition-all duration-300 ${isTransitioning ? 'opacity-60' : 'opacity-100'}`}>
                            <h2 className="text-xl font-semibold text-white mb-4 border-b border-purple-500/30 pb-2">Purchased Models</h2>
                            <PurchasedModels isRowLayout={isRowLayout} />
                        </UnifiedCard>
                        {/* Uploaded Models Card */}
                        <UnifiedCard variant="solid" className={`flex-1 transition-all duration-300 ${isTransitioning ? 'opacity-60' : 'opacity-100'}`}>
                            <h2 className="text-xl font-semibold text-white mb-4 border-b border-purple-500/30 pb-2">Uploaded Models</h2>
                            <UploadedModels isRowLayout={isRowLayout} />
                        </UnifiedCard>
                    </div>
                    <ArchiveBox isOpen={showArchived} onClose={() => setShowArchived(false)} userEmail={user?.email} />
                    <ModelUpload
                        isOpen={showUploadModal}
                        onClose={() => setShowUploadModal(false)}
                        onUploadSuccess={() => setShowUploadModal(false)}
                    />
                </div>
            </div>
        </UnifiedBackground>
    );
}