"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/supabase-auth-context";
import EditProfile from "./editProfile";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import BasicTag from "@/app/components/plans/planTags/basicTag";
import ProTag from "@/app/components/plans/planTags/proTag";
import EnterpriseTag from "@/app/components/plans/planTags/enterpriseTag";
import WithdrawConfirm from "./withdrawConfrim";

export default function Profile() {
    const router = useRouter();
    const { user, loading: authLoading, isAuthenticated } = useAuth();
    const [userData, setUserData] = useState({});
    const [userModels, setUserModels] = useState([]);
    const [showEdit, setShowEdit] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
    
    // Pagination state for models
    const [currentPage, setCurrentPage] = useState(1);
    const modelsPerPage = 3;
    
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
                
                // Fetch user models
                const modelsResponse = await fetch('/api/models/user-models');
                if (modelsResponse.ok) {
                    const models = await modelsResponse.json();
                    setUserModels(Array.isArray(models) ? models : []);
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
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
            console.error("Error signing out:", error);
        }
    };
    
    const totalPages = Math.ceil(userModels.length / modelsPerPage);
    const indexOfLastModel = currentPage * modelsPerPage;
    const indexOfFirstModel = indexOfLastModel - modelsPerPage;
    const currentModels = userModels.slice(indexOfFirstModel, indexOfLastModel);
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
    (userData.earningsHistory || []).forEach(entry => {
        const date = new Date(entry.earnedAt).toLocaleDateString();
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
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen mt-10 bg-gradient-to-b from-white to-blue-50 py-12 px-6">
            <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-3xl p-8 relative">
                {/* Floating Plan Tag (dynamic) */}
                <div className="absolute top-6 right-6 z-10">
                  {userData.subscription?.plan === 'professional' ? (
                    <ProTag />
                  ) : userData.subscription?.plan === 'enterprise' ? (
                    <EnterpriseTag />
                  ) : (
                    <BasicTag />
                  )}
                </div>
                {/* Profile Header */}
                <div className="flex flex-col items-center text-center space-y-4">
                    <img
                        src={userData.profileImageUrl || "/default-image.png"}
                        alt="User Avatar"
                        className="w-28 h-28 rounded-full border-4 border-indigo-300 shadow-md object-cover"
                    />
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">{userName}</h2>
                        <p className="text-sm text-gray-500">@{userName.toLowerCase().replace(/\s+/g, '')}</p>
                    </div>
                    <div className="flex justify-center gap-4">
                        <button
                            className="px-4 py-2 text-sm bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition"
                            onClick={() => setShowEdit(true)}
                        >
                            Edit Profile
                        </button>
                        <button 
                            onClick={handleSignOut}
                            className="px-4 py-2 text-sm bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>

                {/* Stats Section */}
                <div className="flex flex-col space-y-6 mt-10">
                    <div className="flex justify-around text-center">
                        <div>
                            <h3 className="text-xl font-semibold text-gray-700">{userModels.length}</h3>
                            <p className="text-sm text-gray-500">Models Uploaded</p>
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold text-gray-700">
                                {userModels.filter(model => model.sold).length}
                            </h3>
                            <p className="text-sm text-gray-500">Models Sold</p>
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold text-gray-700">
                                ${((userData.totalEarnings || 0) / 100).toFixed(2)}
                            </h3>
                            <p className="text-sm text-gray-500">Total Revenue</p>
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold text-gray-700">
                                ${((userData.availableBalance || 0) / 100).toFixed(2)}
                            </h3>
                            <p className="text-sm text-gray-500">Available Balance</p>
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold text-gray-700">
                                ${((userData.withdrawnAmount || 0) / 100).toFixed(2)}
                            </h3>
                            <p className="text-sm text-gray-500">Withdrawn</p>
                        </div>
                    </div>
                    <div className="flex justify-center">
                        <button
                            onClick={() => setShowWithdrawDialog(true)}
                            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                        >
                            Withdraw Funds
                        </button>
                    </div>
                </div>

                {/* Earnings Chart Section */}
                <div className="mt-12">
                    <h4 className="text-lg font-semibold text-gray-700 mb-4">Earnings Over Time</h4>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer width="100%" height={300}>
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
                </div>

                {/* About Me Section */}
                <div className="mt-12">
                    <h4 className="text-lg font-semibold text-gray-700 mb-2">About Me</h4>
                    <p className="text-gray-600 text-base">
                        {userData.aboutMe || "No description provided yet."}
                    </p>
                </div>

                {/* Contact Section */}
                <div className="mt-12">
                    <h4 className="text-lg font-semibold text-gray-700 mb-4">Contact</h4>
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-10">
                        {userData.websiteLink && (
                            <div>
                                <span className="font-medium text-gray-600">Website: </span>
                                <a
                                    href={userData.websiteLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-indigo-600 hover:underline"
                                >
                                    {userData.websiteLink}
                                </a>
                            </div>
                        )}
                        <div>
                            <span className="font-medium text-gray-600">Email: </span>
                            <a
                                href={`mailto:${userData.contactEmail || userData.email}`}
                                className="text-indigo-600 hover:underline"
                            >
                                {userData.contactEmail || userData.email}
                            </a>
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
        </div>
    )
}