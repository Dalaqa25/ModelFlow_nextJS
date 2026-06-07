'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/lib/auth/supabase-auth-context';
import AdaptiveBackground from '@/app/components/shared/AdaptiveBackground';
import UnifiedCard from '@/app/components/shared/UnifiedCard';
import { useSidebar } from '@/lib/contexts/sidebar-context';
import { timedFetch } from '@/lib/utils/perf';

const AutomationUpload = dynamic(() => import('../components/automationUpload/AutomationUpload'), {
    ssr: false,
});

const PublishFromBuilderDialog = dynamic(() => import('../components/activepieces/PublishFromBuilderDialog'), {
    ssr: false,
});

const RunsChart = dynamic(() => import('@/app/components/charts/RunsChart'), {
    ssr: false,
    loading: () => <div className="h-28 rounded bg-slate-800/40 animate-pulse" />,
});

export default function Dashboard() {
    const { user, isAuthenticated } = useAuth();
    const { isMobile, isExpanded } = useSidebar();
    const sidebarOffset = !isMobile ? (isExpanded ? 256 : 52) : 0;
    
    const [showAutomationDialog, setShowAutomationDialog] = useState(false);
    const [showBuilderPublishDialog, setShowBuilderPublishDialog] = useState(false);
    const [automations, setAutomations] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const fetchedRef = useRef(false);
    const router = useRouter();

    useEffect(() => {
        if (user === null && !isAuthenticated) {
            return;
        }
        if (fetchedRef.current) return;
        fetchedRef.current = true;
        fetchDashboardData();
    }, [user, isAuthenticated]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [automationsResponse, statsResponse] = await Promise.all([
                timedFetch('/api/automations?mine=true', {}, '/api/automations?mine=true'),
                timedFetch('/api/automations/stats?days=7', {}, '/api/automations/stats?days=7'),
            ]);

            if (automationsResponse.ok) {
                const data = await automationsResponse.json();
                setAutomations(data);
            }

            if (statsResponse.ok) {
                const data = await statsResponse.json();
                setStats(data);
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
        fetchDashboardData();
    };

    const handleBuilderPublishSuccess = () => {
        setShowBuilderPublishDialog(false);
        fetchDashboardData();
    };

    return (
        <AdaptiveBackground variant="content" className="pt-16">
            <div className="min-h-screen" style={{ paddingLeft: sidebarOffset, transition: 'padding-left 300ms' }}>
                <div className="pt-10 pb-10 px-6">
                <div className="max-w-5xl mx-auto">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-10 gap-4">
                        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                        <div className="flex flex-col gap-3 sm:flex-row">
                            <button
                                onClick={() => setShowBuilderPublishDialog(true)}
                                className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-purple-400/50 bg-slate-900/60 hover:bg-purple-500/15 text-white rounded-lg shadow-lg transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-400 font-semibold"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 6.75h6.75m0 0V3.75m0 3h8.25M4.5 17.25h6.75m0 0v3m0-3h8.25M15.75 12H19.5m-3.75 0a3.75 3.75 0 1 1-7.5 0m7.5 0a3.75 3.75 0 1 0-7.5 0M4.5 12h3.75" />
                                </svg>
                                <span>Publish from Builder</span>
                            </button>
                            <button
                                onClick={() => setShowAutomationDialog(true)}
                                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg shadow-lg transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-400 font-semibold"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                </svg>
                                <span>Upload JSON</span>
                            </button>
                        </div>
                    </div>

                    {/* Analytics Chart */}
                    {!loading && automations.length > 0 && stats && (
                        <UnifiedCard variant="solid" className="mb-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-white">Runs (Last 7 Days)</h2>
                                <div className="flex items-center gap-4 text-sm">
                                    <div className="text-gray-400">
                                        Success Rate: <span className="text-green-400 font-medium">{stats.successRate}%</span>
                                    </div>
                                </div>
                            </div>
                            <RunsChart data={stats.dailyRuns} />
                        </UnifiedCard>
                    )}

                    <UnifiedCard variant="solid" className="flex-1">
                        <div className="flex items-center justify-between mb-4 border-b border-purple-500/30 pb-2">
                            <h2 className="text-xl font-semibold text-white">Your Automations</h2>
                        </div>

                        {/* Stats Summary */}
                        {!loading && automations.length > 0 && (
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                                    <p className="text-2xl font-bold text-white">{automations.length}</p>
                                    <p className="text-xs text-gray-400">Total Automations</p>
                                </div>
                                <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                                    <p className="text-2xl font-bold text-green-400">
                                        {automations.filter(a => a.is_active).length}
                                    </p>
                                    <p className="text-xs text-gray-400">Active</p>
                                </div>
                                <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                                    <p className="text-2xl font-bold text-purple-400">
                                        {automations.reduce((sum, a) => sum + (a.total_runs || 0), 0)}
                                    </p>
                                    <p className="text-xs text-gray-400">Total Runs</p>
                                </div>
                            </div>
                        )}
                        
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
                                    <div key={automation.id} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-purple-500/50 transition-colors">
                                        <div className="flex items-start justify-between mb-2">
                                            <h3 className="font-semibold text-white">{automation.name}</h3>
                                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                                automation.is_active 
                                                    ? 'bg-green-500/20 text-green-400' 
                                                    : 'bg-yellow-500/20 text-yellow-400'
                                            }`}>
                                                {automation.is_active ? 'Active' : 'Pending'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-400 line-clamp-2 mb-3">{automation.description}</p>
                                        <div className="flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-1 text-gray-500">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                                                </svg>
                                                <span>{automation.total_runs || 0} runs</span>
                                            </div>
                                            {(automation.total_runs || 0) === 0 ? (
                                                <span className="text-yellow-500">Never used</span>
                                            ) : (
                                                <span className="text-purple-400">Used</span>
                                            )}
                                        </div>
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
                    <PublishFromBuilderDialog
                        isOpen={showBuilderPublishDialog}
                        onClose={() => setShowBuilderPublishDialog(false)}
                        onPublishSuccess={handleBuilderPublishSuccess}
                    />
                </div>
            </div>
            </div>
        </AdaptiveBackground>
    );
}
