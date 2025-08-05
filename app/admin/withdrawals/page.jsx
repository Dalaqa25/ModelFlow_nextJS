"use client"
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../../lib/supabase-auth-context';

export default function WithdrawalsAdminPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [withdrawals, setWithdrawals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [updatingId, setUpdatingId] = useState(null);

    useEffect(() => {
        const checkAdminAndFetch = async () => {
            if (authLoading) return;
            
            // Check if user is admin (email-based check)
            if (!user || user.email !== 'g.dalaqishvili01@gmail.com') {
                console.log('Access denied - not admin:', user?.email);
                toast.error('Access denied - Admin privileges required');
                router.push('/');
                return;
            }
            
            fetchWithdrawals();
        };
        
        checkAdminAndFetch();
    }, [authLoading, user, router]);

    const fetchWithdrawals = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/admin/withdrawals');
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch withdrawals');
            }
            
            setWithdrawals(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const updateWithdrawalStatus = async (requestId, status, rejectedReason = '') => {
        try {
            setUpdatingId(requestId);
            const endpoint = status === 'approved' 
                ? '/api/withdraw/approve'
                : '/api/withdraw/reject';

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    requestId,
                    ...(status === 'rejected' && { rejectedReason })
                }),
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to update withdrawal');
            }

            // Refresh the withdrawals list after successful update
            await fetchWithdrawals();

        } catch (err) {
            setError(err.message);
        } finally {
            setUpdatingId(null);
        }
    };

    const handleApprove = (requestId) => {
        updateWithdrawalStatus(requestId, 'approved');
    };

    const handleReject = (requestId) => {
        const reason = prompt('Please enter rejection reason (optional):');
        updateWithdrawalStatus(requestId, 'rejected', reason || '');
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatAmount = (amount) => {
        return `$${(amount / 100).toFixed(2)}`;
    };

    const getStatusBadge = (status) => {
        const baseClasses = "px-2 py-1 text-xs font-medium rounded-full";
        switch (status) {
            case 'pending':
                return `${baseClasses} bg-yellow-100 text-yellow-800`;
            case 'approved':
                return `${baseClasses} bg-green-100 text-green-800`;
            case 'rejected':
                return `${baseClasses} bg-red-100 text-red-800`;
            default:
                return `${baseClasses} bg-gray-100 text-gray-800`;
        }
    };

    if (authLoading || loading) {
        return (
            <div className="p-6">
                <h1 className="text-2xl font-bold mb-6">Withdrawal Requests</h1>
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <h1 className="text-2xl font-bold mb-6">Withdrawal Requests</h1>
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <p className="text-red-600">{error}</p>
                    <button 
                        onClick={fetchWithdrawals}
                        className="mt-2 text-sm text-red-800 underline hover:no-underline"
                    >
                        Try again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 mt-15 m-auto max-w-6xl">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Withdrawal Requests</h1>
                <button
                    onClick={fetchWithdrawals}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    Refresh
                </button>
            </div>

            {withdrawals.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">No withdrawal requests found</p>
                </div>
            ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <ul className="divide-y divide-gray-200">
                        {withdrawals.map((withdrawal) => (
                            <li key={withdrawal._id} className="px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-lg font-medium text-gray-900">
                                                    {withdrawal.userId?.name || 'Unknown User'}
                                                </h3>
                                                <p className="text-sm text-gray-500">
                                                    {withdrawal.userId?.email || 'No email'}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-semibold text-gray-900">
                                                    {formatAmount(withdrawal.amount)}
                                                </p>
                                                <span className={getStatusBadge(withdrawal.status)}>
                                                    {withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                                            <div>
                                                <span className="font-medium">PayPal Email:</span> {withdrawal.paypalEmail}
                                            </div>
                                            <div>
                                                <span className="font-medium">Submitted:</span> {formatDate(withdrawal.submittedAt)}
                                            </div>
                                            {withdrawal.approvedAt && (
                                                <div>
                                                    <span className="font-medium">Approved:</span> {formatDate(withdrawal.approvedAt)}
                                                </div>
                                            )}
                                            {withdrawal.rejectedReason && (
                                                <div className="md:col-span-2">
                                                    <span className="font-medium">Rejection Reason:</span> {withdrawal.rejectedReason}
                                                </div>
                                            )}
                                        </div>

                                        {withdrawal.status === 'pending' && (
                                            <div className="mt-4 flex space-x-3">
                                                <button
                                                    onClick={() => handleApprove(withdrawal._id)}
                                                    disabled={updatingId === withdrawal._id}
                                                    className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {updatingId === withdrawal._id ? 'Updating...' : 'Approve'}
                                                </button>
                                                <button
                                                    onClick={() => handleReject(withdrawal._id)}
                                                    disabled={updatingId === withdrawal._id}
                                                    className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {updatingId === withdrawal._id ? 'Updating...' : 'Reject'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}