"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/supabase-auth-context";
import EditProfile from "./editProfile";
import EarningHistory from "./EarningHistory";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import BasicTag from "@/app/components/plans/planTags/basicTag";
import ProTag from "@/app/components/plans/planTags/proTag";
import EnterpriseTag from "@/app/components/plans/planTags/enterpriseTag";
import WithdrawConfirm from "./withdrawConfrim";
import UnifiedBackground from '@/app/components/shared/UnifiedBackground';
import UnifiedCard from '@/app/components/shared/UnifiedCard';

export default function Profile() {
    const router = useRouter();
    const { user, loading: authLoading, isAuthenticated } = useAuth();
    const [userData, setUserData] = useState({});
    const [earningsHistory, setEarningsHistory] = useState([]);
    const [showEdit, setShowEdit] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
    const [availableBalance, setAvailableBalance] = useState(0);
    
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                if (!isAuthenticated) {
                    router.push("/auth/login");
                    return;
                }
                
                // Fetch user data
                const response = await fetch('/api/user');
                if (response.ok) {
                    const data = await response.json();
                    setUserData(data);
                }

                // Fetch earnings history
                const earningsResponse = await fetch('/api/user/earnings');
                if (earningsResponse.ok) {
                    const earnings = await earningsResponse.json();
                    setEarningsHistory(earnings);
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
            } finally {
                // Fetch available balance
                try {
                    const balanceResponse = await fetch('/api/withdraw/available-balance');
                    if (balanceResponse.ok) {
                        const balanceData = await balanceResponse.json();
                        setAvailableBalance(balanceData.availableBalance);
                    }
                } catch (error) {
                    console.error("Error fetching available balance:", error);
                }
                
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
            console.error("Error signing out:", error);
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
            console.error("Error updating profile:", error);
        }
    };

    // Prepare chart data from earningsHistory
    const earningsByDate = {};
    earningsHistory.forEach(entry => {
        const date = new Date(entry.earned_at).toLocaleDateString();
        earningsByDate[date] = (earningsByDate[date] || 0) + (entry.amount || 0);
    });
    const chartData = Object.entries(earningsByDate).map(([date, amount]) => ({
        date,
        amount: amount / 100 // convert cents to GEL/USD
    }));
    
    const handleWithdrawal = (email) => {
        console.log('Processing withdrawal to:', email);
        setShowWithdrawDialog(false);
    };

    if (authLoading || loading) {
        return (
            <UnifiedBackground variant="content" className="pt-16">
                <div className="flex items-center justify-center min-h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-400"></div>
                </div>
            </UnifiedBackground>
        );
    }

    return (
        <UnifiedBackground variant="content" className="pt-0">
            <div className="pt-24 pb-12 px-6">
                {/* Desktop Layout Container */}
                <div className="max-w-7xl mx-auto">
                    {/* Top Section - Profile Header with Plan Tag */}
                    <UnifiedCard variant="content" className="relative mb-8" padding="lg">
                        {/* Floating Plan Tag */}
                        <div className="absolute top-6 right-6 z-10">
                            {userData.subscription?.plan === 'professional' ? (
                                <ProTag />
                            ) : userData.subscription?.plan === 'enterprise' ? (
                                <EnterpriseTag />
                            ) : (
                                <BasicTag />
                            )}
                        </div>

                        {/* Profile Header - Desktop Optimized */}
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
                            {/* Left Side - Profile Info */}
                            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                                <img
                                    src={userData.profile_image_url || "/default-image.png"}
                                    alt="User Avatar"
                                    className="w-32 h-32 rounded-full border-4 border-purple-400 shadow-md object-cover"
                                />
                                <div className="text-center sm:text-left">
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


                        </div>
                    </UnifiedCard>

                    {/* Main Content Grid - Desktop Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column - Earnings Section */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Earnings Chart */}
                            <UnifiedCard variant="content" padding="lg">
                                <h4 className="text-xl font-semibold text-white mb-6">Earnings Over Time</h4>
                                <div style={{ width: '100%', height: 350 }}>
                                    <ResponsiveContainer width="100%" height={350}>
                                        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.9}/>
                                                    <stop offset="100%" stopColor="#a5b4fc" stopOpacity={0.3}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="date" />
                                            <YAxis />
                                            <Tooltip formatter={value => `GEL ${value.toFixed(2)}`} />
                                            <Area
                                              type="monotone"
                                              dataKey="amount"
                                              stroke="#7c3aed"
                                              fill="url(#colorEarnings)"
                                              fillOpacity={1}
                                              activeDot={{ r: 6, fill: "#7c3aed", stroke: "#fff", strokeWidth: 2 }}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </UnifiedCard>

                            {/* Comprehensive Earnings Dashboard */}
                            <UnifiedCard variant="content" padding="lg">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                                    <h4 className="text-xl font-semibold text-white mb-4 sm:mb-0">Financial Overview</h4>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-400">Available to withdraw</p>
                                        <p className="text-2xl font-bold text-green-400">${(availableBalance / 100).toFixed(2)}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
                                    <div className="text-center p-4 bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-lg">
                                        <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                                            <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                                            </svg>
                                        </div>
                                        <h3 className="text-xl font-bold text-green-400">
                                            ${((userData.total_earnings || 0) / 100).toFixed(2)}
                                        </h3>
                                        <p className="text-xs text-gray-400 mt-1">Total Earned</p>
                                    </div>

                                    <div className="text-center p-4 bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-lg">
                                        <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                                            <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd"/>
                                            </svg>
                                        </div>
                                        <h3 className="text-xl font-bold text-blue-400">
                                            ${(availableBalance / 100).toFixed(2)}
                                        </h3>
                                        <p className="text-xs text-gray-400 mt-1">Available Now</p>
                                    </div>

                                    <div className="text-center p-4 bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-lg">
                                        <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                                            <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd"/>
                                            </svg>
                                        </div>
                                        <h3 className="text-xl font-bold text-purple-400">
                                            ${((userData.withdrawn_amount || 0) / 100).toFixed(2)}
                                        </h3>
                                        <p className="text-xs text-gray-400 mt-1">Withdrawn</p>
                                    </div>

                                    <div className="text-center p-4 bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20 rounded-lg">
                                        <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                                            <svg className="w-4 h-4 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
                                            </svg>
                                        </div>
                                        <h3 className="text-xl font-bold text-orange-400">
                                            {earningsHistory.length}
                                        </h3>
                                        <p className="text-xs text-gray-400 mt-1">Transactions</p>
                                    </div>
                                </div>

                                {availableBalance > 0 && (
                                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-green-400 font-medium">Ready to withdraw</p>
                                                <p className="text-sm text-gray-400">You have ${(availableBalance / 100).toFixed(2)} available for withdrawal</p>
                                            </div>
                                            <button
                                                onClick={() => setShowWithdrawDialog(true)}
                                                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200 text-sm font-medium"
                                            >
                                                Withdraw Now
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </UnifiedCard>

                            {/* Earning History */}
                            <EarningHistory earnings={earningsHistory} />
                        </div>

                        {/* Right Column - About Me & Contact */}
                        <div className="space-y-8">
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
                                </div>
                            </UnifiedCard>

                            {/* Website/Portfolio Section */}
                            {userData.website_link && (
                                <UnifiedCard variant="content" padding="lg">
                                    <h4 className="text-xl font-semibold text-white mb-4">Portfolio & Links</h4>
                                    <div className="space-y-4">
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

                                        {/* Call-to-action for website */}
                                        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-blue-400 font-medium text-sm">Visit my portfolio</p>
                                                    <p className="text-xs text-gray-400">Check out my latest work and projects</p>
                                                </div>
                                                <a
                                                    href={userData.website_link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200 text-xs font-medium flex items-center gap-1"
                                                >
                                                    Visit
                                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"/>
                                                    </svg>
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </UnifiedCard>
                            )}
                        </div>
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

                {/* Withdraw Confirmation Dialog */}
                <WithdrawConfirm
                    isOpen={showWithdrawDialog}
                    onClose={() => setShowWithdrawDialog(false)}
                    onConfirm={handleWithdrawal}
                />
            </div>
        </UnifiedBackground>
    )
}