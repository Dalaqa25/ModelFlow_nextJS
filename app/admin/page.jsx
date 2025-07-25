'use client';

import { useKindeBrowserClient } from '@kinde-oss/kinde-auth-nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

export default function AdminPage() {
    const { user, isLoading } = useKindeBrowserClient();
    const router = useRouter();
    const [pendingModels, setPendingModels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [rejectionReason, setRejectionReason] = useState('');
    const [selectedModel, setSelectedModel] = useState(null);

    useEffect(() => {
        if (!isLoading && user?.email !== 'modelflow01@gmail.com') {
            router.push('/');
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        const fetchPendingModels = async () => {
            try {
                const response = await fetch('/api/pending-models');
                const data = await response.json();
                setPendingModels(data);
            } catch (error) {
                console.error('Error fetching pending models:', error);
                toast.error('Failed to fetch pending models');
            } finally {
                setLoading(false);
            }
        };

        if (user?.email === 'modelflow01@gmail.com') {
            fetchPendingModels();
        }
    }, [user]);

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
            setPendingModels(prev => prev.filter(model => model._id !== modelId));
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
            setPendingModels(prev => prev.filter(model => model._id !== modelId));
            setRejectionReason('');
            setSelectedModel(null);
        } catch (error) {
            console.error('Error rejecting model:', error);
            toast.error('Failed to reject model');
        }
    };

    if (isLoading || loading) {
        return <div>Loading...</div>;
    }

    if (user?.email === 'modelflow01@gmail.com') {
        return (
            <div className="container mx-auto p-4 mt-15">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">Admin Dashboard - Pending Models</h1>
                    <a 
                        href="/admin/lemon-squeezy" 
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                    >
                        Lemon Squeezy Settings
                    </a>
                </div>
                {pendingModels.length === 0 ? (
                    <p className="text-gray-500">No pending models to review</p>
                ) : (
                    <div className="grid gap-4">
                        {pendingModels.map((model) => {
                            return (
                                <div key={model._id} className="border rounded-lg p-4 shadow-sm">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h2 className="text-xl font-semibold">{model.name}</h2>
                                            <p className="text-gray-600 mt-1">Author: {model.authorEmail}</p>
                                            <p className="text-gray-600">Price: ${(model.price / 100).toFixed(2)}</p>
                                            <p className="text-gray-600">Upload Type: {model.fileStorage.type}</p>
                                            <p className="font-bold text-gray-700 mt-3">Setup: <br/> {model.setup}</p>
                                            <p className="font-bold text-blue-600 mt-3">Model URL: <br/> {model.fileStorage.url}</p>
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            Submitted: {new Date(model.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div className="mt-3">
                                        <p>Description:</p>
                                        <p className="text-gray-700">{model.description}</p>
                                    </div>
                                    <div className="mt-2 flex gap-2">
                                        {model.tags.map((tag, index) => (
                                            <span key={index} className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-sm">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>

                                    {/* AI Analysis Section */}
                                    {model.aiAnalysis && (
                                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                                            <h3 className="font-semibold text-lg mb-2">AI Analysis</h3>
                                            <div className="prose max-w-none">
                                                <div className="whitespace-pre-wrap text-gray-700">
                                                    {model.aiAnalysis.split('\n').map((line, index) => {
                                                        if (line.includes('✅ PUBLISH')) {
                                                            return <div key={index} className="text-green-600 font-semibold">{line}</div>;
                                                        } else if (line.includes('❌ REJECT')) {
                                                            return <div key={index} className="text-red-600 font-semibold">{line}</div>;
                                                        } else if (line.startsWith('**')) {
                                                            return <div key={index} className="font-semibold">{line}</div>;
                                                        }
                                                        return <div key={index}>{line}</div>;
                                                    })}
                                                </div>
                                            </div>
                                            {model.aiAnalysis.includes('✅ PUBLISH') && (
                                                <div className="mt-2 text-green-600 font-semibold">
                                                    AI Recommendation: PUBLISH
                                                </div>
                                            )}
                                            {model.aiAnalysis.includes('❌ REJECT') && (
                                                <div className="mt-2 text-red-600 font-semibold">
                                                    AI Recommendation: REJECT
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Validation Status */}
                                    {model.validationStatus && (
                                        <div className="mt-3">
                                            <h3 className="font-semibold">Validation Status:</h3>
                                            <div className={`mt-1 p-2 rounded ${
                                                model.validationStatus.isValid 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : 'bg-red-100 text-red-800'
                                            }`}>
                                                {model.validationStatus.message}
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-4 flex gap-4">
                                        <button
                                            onClick={() => handleApprove(model._id)}
                                            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
                                        >
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => setSelectedModel(model)}
                                            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
                                        >
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Rejection Modal */}
                {selectedModel && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg p-6 max-w-md w-full">
                            <h3 className="text-lg font-semibold mb-4">Reject Model</h3>
                            <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="Enter reason for rejection..."
                                className="w-full p-2 border rounded-lg mb-4"
                                rows="4"
                            />
                            <div className="flex justify-end gap-4">
                                <button
                                    onClick={() => {
                                        setSelectedModel(null);
                                        setRejectionReason('');
                                    }}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleReject(selectedModel._id)}
                                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
                                >
                                    Confirm Rejection
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return null;
}