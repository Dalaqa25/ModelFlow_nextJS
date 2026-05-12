"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/supabase-auth-context";
import EditProfile from "./editProfile";
import WithdrawalModal from "@/app/components/modals/WithdrawalModal";
import AdaptiveBackground from '@/app/components/shared/AdaptiveBackground';
import UnifiedCard from '@/app/components/shared/UnifiedCard';
import EarningsChart from '@/app/components/charts/EarningsChart';
import { useSidebar } from '@/lib/contexts/sidebar-context';
import { DollarSign, TrendingUp, ArrowDownToLine, Clock, Activity, BarChart3 } from 'lucide-react';

export default function Profile() {
    const router = useRouter();
    const { user, loading: authLoading, isAuthenticated } = useAuth();
    const { isMobile, isExpanded } = useSidebar();
    const sidebarOffset = !isMobile ? (isExpanded ? 256 : 52) : 0;

    const [userData, setUserData] = useState({});
    const [stats, setStats] = useState(null);
    const [earnings, setEarnings] = useState(null);
    const [showEdit, setShowEdit] = useState(false);
    const [showWithdrawal, setShowWithdrawal] = useState(false);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                if (!isAuthenticated) {
                    router.push("/auth/login");
                    return;
                }
                
                const response = await fetch('/api/user');
                if (response.ok) {
                    const data = await response.json();
                    setUserData(data);
                }

                // Fetch automation stats
                const statsResponse = await fetch('/api/automations/stats?days=30');
                if (statsResponse.ok) {
                    const statsData = await statsResponse.json();
                    setStats(statsData);
                }

                // Fetch earnings data
                const earningsResponse = await fetch('/api/user/earnings');
                if (earningsResponse.ok) {
                    const earningsData = await earningsResponse.json();
                    setEarnings(earningsData);
                }
            } catch (error) {
                // Error handled silently
            } finally {
                setLoading(false);
            }
        };
        
        if (!authLoading) {
            fetchUserData();
        }
    }, [router, isAuthenticated, authLoading]);
    
    const handleSignOut = async () => {
        try {
            await fetch('/api/auth/signout', { method: 'POST' });
            router.push('/');
        } catch (error) {
            // Error handled silently
        }
    };
    
    const userName = userData.name || user?.user_metadata?.name || user?.email || 'User';

    const handleSave = async (data) => {
        try {
            const response = await fetch('/api/user', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error('Failed to update profile');
            }

            const updatedData = await response.json();
            setUserData(updatedData);
            setShowEdit(false);
        } catch (error) {
            // Error handled silently
        }
    };

    if (authLoading || loading) {
        return (
            <AdaptiveBackground variant="content" className="pt-16">
                <div className="flex items-center justify-center min-h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-400"></div>
                </div>
            </AdaptiveBackground>
        );
    }

    return (
        <AdaptiveBackground variant="content" className="pt-0">
            <div className="min-h-screen" style={{ paddingLeft: sidebarOffset, transition: 'padding-left 300ms' }}>
                <div className="pt-24 pb-12 px-6">
                <div className="max-w-4xl mx-auto">
                    {/* Profile Header */}
                    <UnifiedCard variant="content" className="mb-8" padding="lg">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                            <img
                                src={userData.profile_image_url || "/default-image.png"}
                                alt="User Avatar"
                                className="w-32 h-32 rounded-full border-4 border-purple-400 shadow-md object-cover"
                            />
                            <div className="text-center sm:text-left flex-1">
                                <h2 className="text-3xl font-bold text-white mb-2">{userName}</h2>
                                <p className="text-lg text-gray-300 mb-4">@{userName.toLowerCase().replace(/\s+/g, '')}</p>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <button
                                        className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg transition-colors duration-200"
                                        onClick={() => setShowEdit(true)}
                                    >
                                        Edit Profile
                                    </button>
                                    <button
                                        onClick={handleSignOut}
                                        className="px-6 py-3 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors duration-200"
                                    >
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        </div>
                    </UnifiedCard>

                    {/* Token Economy Earnings Section */}
                    {earnings && (
                        <UnifiedCard variant="content" className="mb-8" padding="lg">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                                        <DollarSign className="w-5 h-5 text-green-400" />
                                    </div>
                                    <div>
                                        <h4 className="text-2xl font-semibold text-white">Your Earnings</h4>
                                        <p className="text-sm text-gray-400 mt-1">Money earned from your automation sales</p>
                                    </div>
                                </div>
                                <button 
                                    className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg transition-all text-sm font-semibold shadow-lg shadow-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    onClick={() => setShowWithdrawal(true)}
                                    disabled={earnings.earnings.available_usd < 100}
                                    title={earnings.earnings.available_usd < 100 ? 'Minimum withdrawal is $100' : 'Request withdrawal'}
                                >
                                    <ArrowDownToLine className="w-4 h-4" />
                                    Withdraw Money
                                </button>
                            </div>
                            
                            {/* Earnings Stats Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-4">
                                    <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Total Earned</p>
                                    <p className="text-2xl font-bold text-green-400">
                                        ${earnings.earnings.total_usd.toFixed(2)}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">Lifetime</p>
                                </div>
                                <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-4">
                                    <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Available</p>
                                    <p className="text-2xl font-bold text-purple-400">
                                        ${earnings.earnings.available_usd.toFixed(2)}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">Can withdraw</p>
                                </div>
                                <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-lg p-4">
                                    <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Withdrawn</p>
                                    <p className="text-2xl font-bold text-blue-400">
                                        ${earnings.earnings.withdrawn_usd.toFixed(2)}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">Received</p>
                                </div>
                                <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-lg p-4">
                                    <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Pending</p>
                                    <p className="text-2xl font-bold text-yellow-400">
                                        ${earnings.earnings.pending_usd.toFixed(2)}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">In review</p>
                                </div>
                            </div>

                            {/* Minimum Withdrawal Notice */}
                            {earnings.earnings.available_usd < 100 && (
                                <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                                        <Clock className="w-4 h-4 text-yellow-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-yellow-400 mb-1">
                                            Minimum withdrawal is $100.00
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            You need ${(100 - earnings.earnings.available_usd).toFixed(2)} more to request a withdrawal. Keep creating awesome automations!
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Recent Earnings */}
                            {earnings.recent_earnings.length > 0 && (
                                <div className="mb-6">
                                    <h5 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-green-400" />
                                        Recent Sales
                                    </h5>
                                    <div className="space-y-2 max-h-64 overflow-y-auto">
                                        {earnings.recent_earnings.slice(0, 5).map((earning, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors">
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-white">{earning.automation_name}</p>
                                                    <p className="text-xs text-gray-400">
                                                        {new Date(earning.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                                <p className="text-sm font-bold text-green-400">
                                                    +${earning.amount_usd.toFixed(2)}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Withdrawal History */}
                            {earnings.withdrawal_history.length > 0 && (
                                <div>
                                    <h5 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                                        <ArrowDownToLine className="w-5 h-5 text-blue-400" />
                                        Withdrawal History
                                    </h5>
                                    <div className="space-y-2">
                                        {earnings.withdrawal_history.map((withdrawal, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-white">
                                                        Withdrawal Request
                                                    </p>
                                                    <p className="text-xs text-gray-400">
                                                        {new Date(withdrawal.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • 
                                                        Platform fee: ${withdrawal.platform_fee_usd.toFixed(2)}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-bold text-blue-400">
                                                        ${withdrawal.payout_usd.toFixed(2)}
                                                    </p>
                                                    <div className="flex items-center justify-end gap-1">
                                                        {withdrawal.status === 'completed' ? (
                                                            <>
                                                                <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                                                                <p className="text-xs font-medium text-green-400">Paid</p>
                                                            </>
                                                        ) : withdrawal.status === 'pending' ? (
                                                            <>
                                                                <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse"></div>
                                                                <p className="text-xs font-medium text-yellow-400">Pending</p>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
                                                                <p className="text-xs font-medium text-red-400">Failed</p>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </UnifiedCard>
                    )}

                    {/* Automation Performance Stats */}
                    {stats && (
                        <UnifiedCard variant="content" className="mb-8" padding="lg">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                                        <BarChart3 className="w-5 h-5 text-purple-400" />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-semibold text-white">Automation Performance</h4>
                                        <p className="text-sm text-gray-400 mt-1">Your automation usage statistics</p>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Earnings Stats */}
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                                    <p className="text-2xl font-bold text-purple-400">{stats.totalRuns}</p>
                                    <p className="text-xs text-gray-400">Total Runs</p>
                                </div>
                                <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                                    <p className="text-2xl font-bold text-blue-400">{stats.successRate}%</p>
                                    <p className="text-xs text-gray-400">Success Rate</p>
                                </div>
                                <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                                    <p className="text-2xl font-bold text-green-400">${stats.totalEarnings.toFixed(2)}</p>
                                    <p className="text-xs text-gray-400">Stats Earnings</p>
                                </div>
                            </div>

                            {/* Earnings Chart */}
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Activity className="w-4 h-4 text-gray-400" />
                                    <p className="text-sm text-gray-400">Activity (Last 30 Days)</p>
                                </div>
                                <EarningsChart data={stats.dailyRuns} />
                            </div>
                        </UnifiedCard>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* About Me Section */}
                        <UnifiedCard variant="content" padding="lg">
                            <h4 className="text-xl font-semibold text-white mb-4">About Me</h4>
                            <div className="prose prose-invert max-w-none">
                                {userData.about_me ? (
                                    <p className="text-gray-300 text-base leading-relaxed">
                                        {userData.about_me}
                                    </p>
                                ) : (
                                    <p className="text-gray-500 text-base leading-relaxed italic">
                                        No description provided yet. Click "Edit Profile" to add information about yourself.
                                    </p>
                                )}
                            </div>
                        </UnifiedCard>

                        {/* Contact Section */}
                        <UnifiedCard variant="content" padding="lg">
                            <h4 className="text-xl font-semibold text-white mb-4">Contact Information</h4>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                                        <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400">Email</p>
                                        <a
                                            href={`mailto:${userData.contact_email || userData.email}`}
                                            className="text-purple-400 hover:text-purple-300 hover:underline transition-colors duration-200"
                                        >
                                            {userData.contact_email || userData.email}
                                        </a>
                                    </div>
                                </div>
                                
                                {userData.website_link && (
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                            <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.559-.499-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.559.499.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.497-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.147.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z" clipRule="evenodd"/>
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-400">Website</p>
                                            <a
                                                href={userData.website_link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-400 hover:text-blue-300 hover:underline transition-colors duration-200 break-all"
                                            >
                                                {userData.website_link}
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </UnifiedCard>
                    </div>
                </div>

                {/* Edit Profile Dialog */}
                {showEdit && (
                    <EditProfile
                        onClose={() => setShowEdit(false)}
                        onSave={handleSave}
                        initialData={userData}
                    />
                )}

                {/* Withdrawal Modal */}
                {showWithdrawal && earnings && (
                    <WithdrawalModal
                        isOpen={showWithdrawal}
                        onClose={() => setShowWithdrawal(false)}
                        availableAmount={earnings.earnings.available_usd}
                        onSuccess={(data) => {
                            // Refresh earnings data
                            fetch('/api/user/earnings')
                                .then(res => res.json())
                                .then(setEarnings);
                            
                            // Show success message
                            alert(`Withdrawal request submitted! You'll receive $${data.payout_amount.toFixed(2)} after approval.`);
                        }}
                    />
                )}
            </div>
            </div>
        </AdaptiveBackground>
    );
}
