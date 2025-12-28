'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import AutomationUpload from '../components/automationUpload/AutomationUpload';
import { useAuth } from '@/lib/supabase-auth-context';
import AdaptiveBackground from '@/app/components/shared/AdaptiveBackground';
import UnifiedCard from '@/app/components/shared/UnifiedCard';

export default function Dashboard() {
    const { user, isAuthenticated } = useAuth();
    const [showAutomationDialog, setShowAutomationDialog] = useState(false);
    const [automations, setAutomations] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        if (user === null && !isAuthenticated) {
            return;
        }
        fetchAutomations();
    }, [user, isAuthenticated]);

    const fetchAutomations = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/automations?mine=true');
            if (response.ok) {
                const data = await response.json();
                setAutomations(data);
            }
        } catch (error) {
            // Error handled silently
        } finally {
            setLoading(false);
        }
    };

    const handleUploadSuccess = () => {
        setShowAutomationDialog(false);
        toast.success('Automation uploaded successfully!');
        fetchAutomations();
    };

    return (
        <AdaptiveBackground variant="content" className="pt-16">
            <div className="pt-10 pb-10 px-6">
                <div className="max-w-5xl mx-auto">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-10 gap-4">
                        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                        <button
                            onClick={() => setShowAutomationDialog(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg shadow-lg transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-400 font-semibold"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                            <span>Upload Automation</span>
                        </button>
                    </div>

                    <UnifiedCard variant="solid" className="flex-1">
                        <div className="flex items-center justify-between mb-4 border-b border-purple-500/30 pb-2">
                            <h2 className="text-xl font-semibold text-white">Your Automations</h2>
                        </div>
                        
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
                            </div>
                        ) : automations.length === 0 ? (
                            <div className="text-center py-8 text-gray-400">
                                <p>No automations yet. Upload your first automation to get started!</p>
                            </div>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {automations.map((automation) => (
                                    <div key={automation.id} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                                        <h3 className="font-semibold text-white mb-2">{automation.name}</h3>
                                        <p className="text-sm text-gray-400 line-clamp-2">{automation.description}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </UnifiedCard>

                    <AutomationUpload
                        isOpen={showAutomationDialog}
                        onClose={() => setShowAutomationDialog(false)}
                        onUploadSuccess={handleUploadSuccess}
                    />
                </div>
            </div>
        </AdaptiveBackground>
    );
}
