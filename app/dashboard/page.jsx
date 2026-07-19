'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { toast } from 'react-hot-toast';
import { BarChart3, UploadCloud, Workflow } from 'lucide-react';
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
    loading: () => <div className="landing-card-soft h-28 animate-pulse rounded-2xl" />,
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
                <div className="px-5 pb-10 pt-10 sm:px-6">
                <div className="mx-auto max-w-6xl">
                    <div className="community-surface mb-8 rounded-[2rem] p-6 sm:p-7">
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                            <div className="max-w-2xl">
                                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--landing-border)] bg-white/35 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-[var(--landing-muted)] dark:bg-white/[0.06]">
                                    <BarChart3 className="h-3.5 w-3.5 text-[var(--landing-accent)]" />
                                    Workspace dashboard
                                </div>
                                <h1 className="text-3xl font-black leading-tight text-[var(--landing-ink)] sm:text-4xl">Track your published automations.</h1>
                                <p className="mt-3 text-sm font-semibold leading-6 text-[var(--landing-muted)] sm:text-base">
                                    Monitor runs, publish from Builder, and keep your marketplace inventory in one place.
                                </p>
                            </div>
                            <div className="flex flex-col gap-3 sm:flex-row">
                            <button
                                onClick={() => setShowBuilderPublishDialog(true)}
                                className="landing-card-soft inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black text-[var(--landing-ink)] hover:-translate-y-0.5"
                            >
                                <Workflow className="h-4 w-4 text-[var(--landing-accent-3)]" />
                                <span>Publish from Builder</span>
                            </button>
                            <button
                                onClick={() => setShowAutomationDialog(true)}
                                className="auth-primary-button inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black"
                            >
                                <UploadCloud className="h-4 w-4" />
                                <span>Upload JSON</span>
                            </button>
                            </div>
                        </div>
                    </div>

                    {!loading && automations.length > 0 && stats && (
                        <UnifiedCard variant="solid" className="mb-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-black text-[var(--landing-ink)]">Runs (Last 7 Days)</h2>
                                <div className="flex items-center gap-4 text-sm">
                                    <div className="font-semibold text-[var(--landing-muted)]">
                                        Success Rate: <span className="font-black text-[var(--landing-accent-2)]">{stats.successRate}%</span>
                                    </div>
                                </div>
                            </div>
                            <RunsChart data={stats.dailyRuns} />
                        </UnifiedCard>
                    )}

                    <UnifiedCard variant="solid" className="flex-1">
                        <div className="mb-5 flex items-center justify-between border-b border-[var(--landing-border)] pb-3">
                            <h2 className="text-xl font-black text-[var(--landing-ink)]">Your Automations</h2>
                        </div>

                        {!loading && automations.length > 0 && (
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="rounded-2xl border border-[var(--landing-border)] bg-white/30 p-4 text-center dark:bg-white/[0.05]">
                                    <p className="text-2xl font-black text-[var(--landing-ink)]">{automations.length}</p>
                                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--landing-muted)]">Total Automations</p>
                                </div>
                                <div className="rounded-2xl border border-[var(--landing-border)] bg-white/30 p-4 text-center dark:bg-white/[0.05]">
                                    <p className="text-2xl font-black text-[var(--landing-accent-2)]">
                                        {automations.filter(a => a.is_active).length}
                                    </p>
                                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--landing-muted)]">Active</p>
                                </div>
                                <div className="rounded-2xl border border-[var(--landing-border)] bg-white/30 p-4 text-center dark:bg-white/[0.05]">
                                    <p className="text-2xl font-black text-[var(--landing-accent)]">
                                        {automations.reduce((sum, a) => sum + (a.total_runs || 0), 0)}
                                    </p>
                                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--landing-muted)]">Total Runs</p>
                                </div>
                            </div>
                        )}
                        
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[var(--landing-accent)]"></div>
                            </div>
                        ) : automations.length === 0 ? (
                            <div className="py-8 text-center text-[var(--landing-muted)]">
                                <p>No automations yet. Upload your first automation to get started!</p>
                            </div>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {automations.map((automation) => (
                                    <div key={automation.id} className="landing-card-soft rounded-[1.5rem] p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--landing-accent-2)]/35">
                                        <div className="flex items-start justify-between mb-2">
                                            <h3 className="font-black text-[var(--landing-ink)]">{automation.name}</h3>
                                            <span className={`rounded-full px-2.5 py-1 text-xs font-black ${
                                                automation.is_active
                                                    ? 'bg-[var(--landing-accent-2)]/12 text-[var(--landing-accent-2)]'
                                                    : 'bg-[var(--landing-accent)]/12 text-[var(--landing-accent)]'
                                            }`}>
                                                {automation.is_active ? 'Active' : 'Pending'}
                                            </span>
                                        </div>
                                        <p className="mb-3 line-clamp-2 text-sm font-semibold text-[var(--landing-muted)]">{automation.description}</p>
                                        <div className="flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-1 font-bold text-[var(--landing-muted)]">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                                                </svg>
                                                <span>{automation.total_runs || 0} runs</span>
                                            </div>
                                            {(automation.total_runs || 0) === 0 ? (
                                                <span className="font-black text-[var(--landing-accent)]">Never used</span>
                                            ) : (
                                                <span className="font-black text-[var(--landing-accent-3)]">Used</span>
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
