"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/supabase-auth-context";
import EditProfile from "./editProfile";
import AdaptiveBackground from '@/app/components/shared/AdaptiveBackground';
import UnifiedCard from '@/app/components/shared/UnifiedCard';
import EarningsChart from '@/app/components/charts/EarningsChart';

export default function Profile() {
    const router = useRouter();
    const { user, loading: authLoading, isAuthenticated } = useAuth();
    const [userData, setUserData] = useState({});
    const [stats, setStats] = useState(null);
    const [showEdit, setShowEdit] = useState(false);
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

                    {/* Earnings Section */}
                    {stats && (
                        <UnifiedCard variant="content" className="mb-8" padding="lg">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-xl font-semibold text-white">Earnings</h4>
                                <button 
                                    className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors text-sm font-medium"
                                    onClick={() => {/* Withdrawal functionality - coming soon */}}
                                >
                                    Withdraw
                                </button>
                            </div>
                            
                            {/* Earnings Stats */}
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                                    <p className="text-2xl font-bold text-green-400">${stats.totalEarnings.toFixed(2)}</p>
                                    <p className="text-xs text-gray-400">Total Earnings</p>
                                </div>
                                <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                                    <p className="text-2xl font-bold text-purple-400">{stats.totalRuns}</p>
                                    <p className="text-xs text-gray-400">Total Runs</p>
                                </div>
                                <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                                    <p className="text-2xl font-bold text-blue-400">{stats.successRate}%</p>
                                    <p className="text-xs text-gray-400">Success Rate</p>
                                </div>
                            </div>

                            {/* Earnings Chart */}
                            <div>
                                <p className="text-sm text-gray-400 mb-2">Earnings (Last 30 Days)</p>
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
            </div>
        </AdaptiveBackground>
    );
}
