'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../lib/supabase-auth-context';
import UnifiedBackground from '@/app/components/shared/UnifiedBackground';
import UnifiedCard from '@/app/components/shared/UnifiedCard';

export default function AdminPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [pendingModels, setPendingModels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [rejectionReason, setRejectionReason] = useState('');
    const [selectedModel, setSelectedModel] = useState(null);

    useEffect(() => {
        const checkAdminAndFetchModels = async () => {
            if (authLoading) return;
            
            try {
                // Check if user is admin (email-based check)
                if (!user || user.email !== 'g.dalaqishvili01@gmail.com') {
                    console.log('Access denied - not admin:', user?.email);
                    toast.error('Access denied - Admin privileges required');
                    router.push('/');
                    return;
                }

                const response = await fetch('/api/pending-models');
                if (!response.ok) {
                    if (response.status === 401 || response.status === 403) {
                        console.log('Auth/Admin failed');
                        toast.error('Access denied - Admin privileges required');
                        router.push('/');
                        return;
                    }
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setPendingModels(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error('Error:', error);
                toast.error('Failed to fetch data');
                router.push('/');
            } finally {
                setLoading(false);
            }
        };

        checkAdminAndFetchModels();
    }, [authLoading, router, user]);

    const handleApprove = async (modelId) => {
        try {
            const response = await fetch(`/api/pending-models/${modelId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ action: 'approve' }),
            });

            if (!response.ok) {
                throw new Error('Failed to approve model');
            }

            toast.success('Model approved successfully');
            // Remove the approved model from the list
            setPendingModels(prev => prev.filter(model => model.id !== modelId));
        } catch (error) {
            console.error('Error approving model:', error);
            toast.error('Failed to approve model');
        }
    };

    const handleReject = async (modelId) => {
        if (!rejectionReason.trim()) {
            toast.error('Please provide a rejection reason');
            return;
        }

        try {
            const response = await fetch(`/api/pending-models/${modelId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'reject',
                    rejectionReason: rejectionReason.trim(),
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to reject model');
            }

            toast.success('Model rejected successfully');
            // Remove the rejected model from the list
            setPendingModels(prev => prev.filter(model => model.id !== modelId));
            setRejectionReason('');
            setSelectedModel(null);
        } catch (error) {
            console.error('Error rejecting model:', error);
            toast.error('Failed to reject model');
        }
    };

    if (authLoading || loading) {
        return (
            <UnifiedBackground variant="content" className="pt-16">
                <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-400"></div>
                </div>
            </UnifiedBackground>
        );
    }

    // Show admin panel if we have successfully loaded (no redirect occurred)
    if (!authLoading && !loading) {
        return (
            <UnifiedBackground variant="content" className="pt-16">
                <div className="container mx-auto p-4 pt-20">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
                        <h1 className="text-2xl font-bold text-white">Admin Dashboard - Pending Models</h1>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <a
                                href="/admin/lemon-squeezy"
                                className="bg-blue-500/20 border border-blue-500/50 text-blue-300 px-4 py-2 rounded hover:bg-blue-500/30 transition-colors text-center"
                            >
                                Lemon Squeezy Settings
                            </a>
                            <a
                                href="/admin/withdrawals"
                                className="bg-purple-500/20 border border-purple-500/50 text-purple-300 px-4 py-2 rounded hover:bg-purple-500/30 transition-colors text-center"
                            >
                                Withdrawals Admin Page
                            </a>
                        </div>
                    </div>
                {!Array.isArray(pendingModels) || pendingModels.length === 0 ? (
                    <p className="text-gray-300">No pending models to review</p>
                ) : (
                    <div className="grid gap-4">
                        {pendingModels.map((model) => {
                            // Parse file storage from img_url field (temporary storage location)
                            let fileStorage = null;
                            try {
                                fileStorage = model.img_url ? JSON.parse(model.img_url) : null;
                            } catch (e) {
                                console.error('Error parsing file storage:', e);
                                fileStorage = { type: 'unknown', url: model.img_url || 'N/A' };
                            }

                            return (
                                <UnifiedCard key={model.id} variant="solid">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h2 className="text-xl font-semibold text-white">{model.name}</h2>
                                            <p className="text-gray-300 mt-1">Author: {model.author_email}</p>
                                            <p className="text-gray-300">Price: ${(model.price / 100).toFixed(2)}</p>
                                            <p className="text-gray-300">Upload Type: {fileStorage?.type || 'Unknown'}</p>
                                            <p className="font-bold text-gray-200 mt-3">Setup: <br/> {model.setup}</p>
                                            <p className="font-bold text-blue-400 mt-3">Model URL: <br/> {fileStorage?.url || fileStorage?.supabasePath || 'N/A'}</p>
                                        </div>
                                        <div className="text-sm text-gray-400">
                                            Submitted: {new Date(model.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div className="mt-3">
                                        <p className="text-white">Description:</p>
                                        <p className="text-gray-300">{model.description}</p>
                                    </div>
                                    <div className="mt-2 flex gap-2">
                                        {(model.tags || []).map((tag, index) => (
                                            <span key={index} className="bg-slate-700/50 text-gray-300 px-2 py-1 rounded-full text-sm">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>

                                    {/* AI Analysis Section */}
                                    {model.ai_analysis && (
                                        <div className="mt-4 p-4 bg-slate-700/30 rounded-lg">
                                            <h3 className="font-semibold text-lg mb-2 text-white">AI Analysis</h3>
                                            <div className="prose max-w-none">
                                                <div className="whitespace-pre-wrap text-gray-300">
                                                    {model.ai_analysis.split('\n').map((line, index) => {
                                                        if (line.includes('✅ PUBLISH')) {
                                                            return <div key={`analysis-${model.id}-${index}`} className="text-green-600 font-semibold">{line}</div>;
                                                        } else if (line.includes('❌ REJECT')) {
                                                            return <div key={`analysis-${model.id}-${index}`} className="text-red-600 font-semibold">{line}</div>;
                                                        } else if (line.startsWith('**')) {
                                                            return <div key={`analysis-${model.id}-${index}`} className="font-semibold">{line}</div>;
                                                        }
                                                        return <div key={`analysis-${model.id}-${index}`}>{line}</div>;
                                                    })}
                                                </div>
                                            </div>
                                            {model.ai_analysis.includes('✅ PUBLISH') && (
                                                <div className="mt-2 text-green-600 font-semibold">
                                                    AI Recommendation: PUBLISH
                                                </div>
                                            )}
                                            {model.ai_analysis.includes('❌ REJECT') && (
                                                <div className="mt-2 text-red-600 font-semibold">
                                                    AI Recommendation: REJECT
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Validation Status */}
                                    {model.validation_status && (
                                        <div className="mt-3">
                                            <h3 className="font-semibold text-white">Validation Status:</h3>
                                            <div className={`mt-1 p-2 rounded ${
                                                model.validation_status.isValid
                                                    ? 'bg-green-500/20 text-green-300 border border-green-500/50'
                                                    : 'bg-red-500/20 text-red-300 border border-red-500/50'
                                            }`}>
                                                {model.validation_status.message}
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-4 flex gap-4">
                                        <button
                                            onClick={() => handleApprove(model.id)}
                                            className="bg-green-500/20 border border-green-500/50 text-green-300 px-4 py-2 rounded hover:bg-green-500/30 transition-colors"
                                        >
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => setSelectedModel(model)}
                                            className="bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-2 rounded hover:bg-red-500/30 transition-colors"
                                        >
                                            Reject
                                        </button>
                                    </div>
                                </UnifiedCard>
                            );
                        })}
                    </div>
                )}

                {/* Rejection Modal */}
                {selectedModel && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <UnifiedCard variant="solid" className="max-w-md w-full">
                            <h3 className="text-lg font-semibold mb-4 text-white">Reject Model</h3>
                            <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="Enter reason for rejection..."
                                className="w-full p-2 bg-slate-700/50 border border-slate-600/50 rounded-lg mb-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                rows="4"
                            />
                            <div className="flex justify-end gap-4">
                                <button
                                    onClick={() => {
                                        setSelectedModel(null);
                                        setRejectionReason('');
                                    }}
                                    className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleReject(selectedModel.id)}
                                    className="bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-2 rounded hover:bg-red-500/30 transition-colors"
                                >
                                    Confirm Rejection
                                </button>
                            </div>
                        </UnifiedCard>
                    </div>
                )}
                </div>
            </UnifiedBackground>
        );
    }

    return null;
}