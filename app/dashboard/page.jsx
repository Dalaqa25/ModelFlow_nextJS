'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FaList, FaThLarge, FaSync } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import PurchasedModels from './purchasedModels';
import UploadedModels from './uploadedModels';
import ModelUpload from '../components/model/modelupload/modelUpload';
import AutomationUpload from '../components/model/modelupload/automation/AutomationUpload';
import UploadTypeDialog from '../components/model/modelupload/UploadTypeDialog';
import { useAuth } from '@/lib/supabase-auth-context';
import AdaptiveBackground from '@/app/components/shared/AdaptiveBackground';
import UnifiedCard from '@/app/components/shared/UnifiedCard';

export default function Dashboard() {
    const { user, isAuthenticated } = useAuth();
    const [isRowLayout, setIsRowLayout] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showUploadTypeDialog, setShowUploadTypeDialog] = useState(false);
    const [showAutomationDialog, setShowAutomationDialog] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [isRefreshingUploaded, setIsRefreshingUploaded] = useState(false);
    const [isRefreshingPurchased, setIsRefreshingPurchased] = useState(false);
    const [shouldAnimateUploadedRefresh, setShouldAnimateUploadedRefresh] = useState(false);
    const [uploadedCooldownTime, setUploadedCooldownTime] = useState(0);
    const [purchasedCooldownTime, setPurchasedCooldownTime] = useState(0);
    const uploadedModelsRef = useRef();
    const purchasedModelsRef = useRef();
    const uploadedCooldownInterval = useRef();
    const purchasedCooldownInterval = useRef();
    const router = useRouter();
    
    const COOLDOWN_DURATION = 60; // 1 minute in seconds

    // Auth check - middleware will handle redirects, but we can show loading state
    useEffect(() => {
        if (user === null && !isAuthenticated) {
            // Middleware will redirect to home page, no need for manual redirect
            return;
        }
    }, [user, isAuthenticated, router]);

    // Layout preference from localStorage
    useEffect(() => {
        if (typeof window !== 'undefined' && window.localStorage) {
            const layout = window.localStorage.getItem('dashboardLayout');
            if (layout) {
                setIsRowLayout(layout === 'row');
            } else {
                // Default to column layout if no preference is saved
                setIsRowLayout(false);
            }
        }
    }, []);

    useEffect(() => {
        if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem('dashboardLayout', isRowLayout ? 'row' : 'column');
        }
    }, [isRowLayout]);

    // Cleanup intervals on component unmount
    useEffect(() => {
        return () => {
            if (uploadedCooldownInterval.current) {
                clearInterval(uploadedCooldownInterval.current);
            }
            if (purchasedCooldownInterval.current) {
                clearInterval(purchasedCooldownInterval.current);
            }
        };
    }, []);

    const handleLayoutChange = () => {
        setIsTransitioning(true);
        setIsRowLayout(prev => !prev);
        setTimeout(() => setIsTransitioning(false), 300);
    };

    // Helper function to start cooldown timer
    const startCooldown = (type) => {
        const setCooldownTime = type === 'uploaded' ? setUploadedCooldownTime : setPurchasedCooldownTime;
        const intervalRef = type === 'uploaded' ? uploadedCooldownInterval : purchasedCooldownInterval;
        
        setCooldownTime(COOLDOWN_DURATION);
        
        intervalRef.current = setInterval(() => {
            setCooldownTime(prev => {
                if (prev <= 1) {
                    clearInterval(intervalRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleRefreshUploaded = () => {
        // Check if still in cooldown
        if (uploadedCooldownTime > 0) {
            toast.error(`Please wait ${uploadedCooldownTime} seconds before refreshing again.`);
            return;
        }
        
        if (uploadedModelsRef.current?.handleRefresh) {
            setIsRefreshingUploaded(true);
            setShouldAnimateUploadedRefresh(false); // Stop animation when user clicks refresh
            startCooldown('uploaded'); // Start cooldown timer
            
            uploadedModelsRef.current.handleRefresh().finally(() => {
                setIsRefreshingUploaded(false);
            });
        }
    };

    const handleRefreshPurchased = () => {
        // Check if still in cooldown
        if (purchasedCooldownTime > 0) {
            toast.error(`Please wait ${purchasedCooldownTime} seconds before refreshing again.`);
            return;
        }
        
        if (purchasedModelsRef.current?.handleRefresh) {
            setIsRefreshingPurchased(true);
            startCooldown('purchased'); // Start cooldown timer
            
            purchasedModelsRef.current.handleRefresh().finally(() => {
                setIsRefreshingPurchased(false);
            });
        }
    };

    const handleUploadSuccess = () => {
        // Trigger animation on the refresh button to indicate new data is available
        setShouldAnimateUploadedRefresh(true);
        // Close the upload modal
        setShowUploadModal(false);
        
        // Auto-stop animation after 10 seconds if user doesn't click
        setTimeout(() => {
            setShouldAnimateUploadedRefresh(false);
        }, 10000);
    };

    const handleUploadButtonClick = () => {
        setShowUploadTypeDialog(true);
    };

    const handleUploadTypeSelect = (type) => {
        setShowUploadTypeDialog(false);

        if (type === 'pretrained') {
            setShowUploadModal(true);
            return;
        }

        if (type === 'automation') {
            setShowAutomationDialog(true);
        }
    };

    return (
        <AdaptiveBackground variant="content" className="pt-16">
            <div className="pt-10 pb-10 px-6">
                <div className="max-w-5xl mx-auto">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-10 gap-4">
                        <div className="flex gap-3 justify-center sm:justify-start">
                            <button
                                onClick={handleUploadButtonClick}
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
                            <div className="flex items-center justify-between mb-4 border-b border-purple-500/30 pb-2">
                                <h2 className="text-xl font-semibold text-white">Purchased Models</h2>
                                <button
                                    onClick={handleRefreshPurchased}
                                    disabled={isRefreshingPurchased || purchasedCooldownTime > 0}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 ${
                                        isRefreshingPurchased || purchasedCooldownTime > 0
                                            ? 'bg-slate-700/30 text-gray-500 cursor-not-allowed'
                                            : 'bg-slate-700/50 border border-slate-600/50 text-gray-300 hover:bg-slate-600/50 hover:text-white'
                                    }`}
                                    title={purchasedCooldownTime > 0 ? `Cooldown: ${purchasedCooldownTime}s remaining` : "Refresh purchased models"}
                                >
                                    <FaSync className={`text-sm ${isRefreshingPurchased ? 'animate-spin' : ''}`} />
                                    <span className="text-sm font-medium hidden sm:inline">
                                        {isRefreshingPurchased ? 'Refreshing...' : purchasedCooldownTime > 0 ? `${purchasedCooldownTime}s` : 'Refresh'}
                                    </span>
                                </button>
                            </div>
                            <PurchasedModels ref={purchasedModelsRef} isRowLayout={isRowLayout} />
                        </UnifiedCard>
                        {/* Uploaded Models Card */}
                        <UnifiedCard variant="solid" className={`flex-1 transition-all duration-300 ${isTransitioning ? 'opacity-60' : 'opacity-100'}`}>
                            <div className="flex items-center justify-between mb-4 border-b border-purple-500/30 pb-2">
                                <h2 className="text-xl font-semibold text-white">Uploaded Models</h2>
                                <button
                                    onClick={handleRefreshUploaded}
                                    disabled={isRefreshingUploaded || uploadedCooldownTime > 0}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 ${
                                        isRefreshingUploaded || uploadedCooldownTime > 0
                                            ? 'bg-slate-700/30 text-gray-500 cursor-not-allowed'
                                            : shouldAnimateUploadedRefresh
                                            ? 'bg-gradient-to-r from-purple-500/80 to-pink-500/80 border border-purple-400 text-white animate-pulse shadow-lg shadow-purple-500/50'
                                            : 'bg-slate-700/50 border border-slate-600/50 text-gray-300 hover:bg-slate-600/50 hover:text-white'
                                    }`}
                                    title={
                                        uploadedCooldownTime > 0 
                                            ? `Cooldown: ${uploadedCooldownTime}s remaining` 
                                            : shouldAnimateUploadedRefresh 
                                            ? "New model uploaded! Click to refresh and see your latest upload" 
                                            : "Refresh uploaded models"
                                    }
                                >
                                    <FaSync className={`text-sm ${isRefreshingUploaded ? 'animate-spin' : ''}`} />
                                    <span className="text-sm font-medium hidden sm:inline">
                                        {isRefreshingUploaded 
                                            ? 'Refreshing...' 
                                            : uploadedCooldownTime > 0 
                                            ? `${uploadedCooldownTime}s` 
                                            : shouldAnimateUploadedRefresh 
                                            ? 'New Upload!' 
                                            : 'Refresh'
                                        }
                                    </span>
                                </button>
                            </div>
                            <UploadedModels ref={uploadedModelsRef} isRowLayout={isRowLayout} />
                        </UnifiedCard>
                    </div>
                    <ModelUpload
                        isOpen={showUploadModal}
                        onClose={() => setShowUploadModal(false)}
                        onUploadSuccess={handleUploadSuccess}
                    />
                    <AutomationUpload
                        isOpen={showAutomationDialog}
                        onClose={() => setShowAutomationDialog(false)}
                        onUploadSuccess={() => {
                            setShowAutomationDialog(false);
                            toast.success('Automation saved');
                        }}
                    />
                    <UploadTypeDialog
                        isOpen={showUploadTypeDialog}
                        onClose={() => setShowUploadTypeDialog(false)}
                        onSelect={handleUploadTypeSelect}
                    />
                </div>
            </div>
        </AdaptiveBackground>
    );
}