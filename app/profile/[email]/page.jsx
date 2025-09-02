"use client";
import { useEffect, useState } from "react";
import DefaultModelImage from "@/app/components/model/defaultModelImage";
import NavigationLink from "@/app/components/NavigationLink";
import { use } from "react";
import { FaGlobe, FaEnvelope, FaCalendarAlt, FaEdit, FaCode, FaDollarSign } from "react-icons/fa";
import { useTheme } from "@/lib/theme-context";

export default function Profile(props) {
    const params = use(props.params);
    const { isDarkMode } = useTheme();
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userModels, setUserModels] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                setError(null);
                setLoading(true);

                // Decode the email parameter to handle URL encoding
                const decodedEmail = decodeURIComponent(params.email);

                // Fetch profile data
                const profileRes = await fetch(`/api/user/profile?email=${encodeURIComponent(decodedEmail)}`);
                if (!profileRes.ok) {
                    const errorData = await profileRes.json();
                    throw new Error(errorData.error || 'Failed to fetch profile data');
                }
                const profileData = await profileRes.json();
                setProfileData(profileData);

                // Fetch user models
                const modelsRes = await fetch(`/api/models/user-models?email=${encodeURIComponent(decodedEmail)}`);
                if (!modelsRes.ok) {
                    const errorData = await modelsRes.json();
                    throw new Error(errorData.error || 'Failed to fetch user models');
                }
                const modelsData = await modelsRes.json();
                console.log('🔍 [Profile] Raw models API response:', modelsData);
                console.log('🔍 [Profile] Decoded email:', decodedEmail);
                console.log('🔍 [Profile] Models data type:', typeof modelsData);
                console.log('🔍 [Profile] Is array?', Array.isArray(modelsData));
                console.log('🔍 [Profile] Has models property?', modelsData.models);
                
                // Handle both direct array and object with models property
                const models = Array.isArray(modelsData) ? modelsData : (modelsData.models || []);
                console.log('🔍 [Profile] Final models array:', models);
                console.log('🔍 [Profile] Models count:', models.length);
                setUserModels(models);
            } catch (error) {
                console.error("Error in fetchProfileData:", error);
                setError(error.message);
                // Don't clear existing data if we have it
                if (!profileData) {
                    setProfileData(null);
                }
                if (!userModels.length) {
                    setUserModels([]);
                }
            } finally {
                setLoading(false);
            }
        };

        if (params.email) {
            fetchProfileData();
        }
    }, [params.email]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className={`${isDarkMode ? 'text-red-400' : 'text-red-500'} text-center`}>
                    <h2 className="text-2xl font-semibold mb-2">Error</h2>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    if (!profileData) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <h2 className="text-2xl font-semibold mb-2">Profile Not Found</h2>
                    <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>The requested profile could not be found.</p>
                </div>
            </div>
        );
    }

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className={`min-h-screen ${isDarkMode ? 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900' : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100'}`}>
            <div className="pt-8 pb-16">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Profile Header */}
                    <div className={`${isDarkMode ? 'bg-slate-800/80' : 'bg-white/80'} backdrop-blur-sm rounded-3xl shadow-xl border ${isDarkMode ? 'border-slate-700/50' : 'border-white/20'} p-8 mb-8`}>
                        <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-start">
                            {/* Profile Image */}
                            <div className="relative">
                                <div className="w-40 h-40 rounded-full overflow-hidden bg-gradient-to-br from-purple-400 to-blue-500 p-1 shadow-2xl">
                                    <div className="w-full h-full rounded-full overflow-hidden bg-white">
                                        {profileData.profileImageUrl ? (
                                            <img
                                                src={profileData.profileImageUrl}
                                                alt={profileData.name}
                                                className='w-full h-full object-cover'
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                                <svg className="w-20 h-20 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                                                    <path fillRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Profile Info */}
                            <div className="flex-1 text-center lg:text-left">
                                <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-3">
                                    {profileData.name || decodeURIComponent(params.email)}
                                </h1>
                                <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} text-xl mb-6`}>{decodeURIComponent(params.email)}</p>
                                
                                {/* Stats Cards */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-4 text-white">
                                        <div className="flex items-center gap-3">
                                            <FaCode className="text-2xl" />
                                            <div>
                                                <p className="text-purple-100 text-sm">Models</p>
                                                <p className="text-2xl font-bold">{userModels.length}</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {(profileData.total_earnings !== undefined && profileData.total_earnings !== null) && (
                                        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-4 text-white">
                                            <div className="flex items-center gap-3">
                                                <FaDollarSign className="text-2xl" />
                                                <div>
                                                    <p className="text-green-100 text-sm">Earnings</p>
                                                    <p className="text-2xl font-bold">${(profileData.total_earnings || 0).toFixed(2)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    
                                    <div className="bg-gradient-to-r from-blue-500 to-cyan-600 rounded-2xl p-4 text-white">
                                        <div className="flex items-center gap-3">
                                            <FaCalendarAlt className="text-2xl" />
                                            <div>
                                                <p className="text-blue-100 text-sm">Joined</p>
                                                <p className="text-lg font-bold">{formatDate(profileData.created_at || profileData.createdAt).split(',')[0]}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Contact Links */}
                                <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                                    {(profileData.contact_email || profileData.contactEmail) && (
                                        <a
                                            href={`mailto:${profileData.contact_email || profileData.contactEmail}`}
                                            className={`flex items-center gap-2 ${isDarkMode ? 'bg-slate-700/50 hover:bg-slate-700 border-slate-600' : 'bg-white/50 hover:bg-white border-gray-200'} rounded-full px-4 py-2 ${isDarkMode ? 'text-gray-300 hover:text-purple-400' : 'text-gray-700 hover:text-purple-600'} transition-all duration-200 hover:shadow-md`}
                                        >
                                            <FaEnvelope className="text-sm" />
                                            <span className="text-sm font-medium">Contact</span>
                                        </a>
                                    )}
                                    {(profileData.website_link || profileData.websiteLink) && (
                                        <a
                                            href={profileData.website_link || profileData.websiteLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`flex items-center gap-2 ${isDarkMode ? 'bg-slate-700/50 hover:bg-slate-700 border-slate-600' : 'bg-white/50 hover:bg-white border-gray-200'} rounded-full px-4 py-2 ${isDarkMode ? 'text-gray-300 hover:text-purple-400' : 'text-gray-700 hover:text-purple-600'} transition-all duration-200 hover:shadow-md`}
                                        >
                                            <FaGlobe className="text-sm" />
                                            <span className="text-sm font-medium">Website</span>
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* About Section */}
                    {(profileData.about_me || profileData.aboutMe) && (
                        <div className={`${isDarkMode ? 'bg-slate-800/80' : 'bg-white/80'} backdrop-blur-sm rounded-3xl shadow-xl border ${isDarkMode ? 'border-slate-700/50' : 'border-white/20'} p-8 mb-8`}>
                            <h2 className={`text-3xl font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'} mb-6 flex items-center gap-3`}>
                                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                                    <FaEdit className="text-white text-sm" />
                                </div>
                                About
                            </h2>
                            <div className="prose prose-lg max-w-none">
                                <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} leading-relaxed whitespace-pre-wrap`}>
                                    {profileData.about_me || profileData.aboutMe}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Models Section */}
                    <div className={`${isDarkMode ? 'bg-slate-800/60' : 'bg-white/60'} backdrop-blur-sm rounded-3xl shadow-2xl border ${isDarkMode ? 'border-slate-700/30' : 'border-white/30'} p-8 relative overflow-hidden`}>
                        {/* Background decoration */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-full blur-3xl -translate-y-32 translate-x-32"></div>
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-pink-500/10 to-purple-500/10 rounded-full blur-3xl translate-y-24 -translate-x-24"></div>

                        <div className="relative z-10">
                            {/* Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-6">
                                <div>
                                    <h2 className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2 flex items-center gap-4`}>
                                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
                                            <FaCode className="text-white text-lg" />
                                        </div>
                                        Published Models
                                    </h2>
                                    <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} text-lg`}>
                                        Explore the innovative AI models created by this developer
                                    </p>
                                </div>
                                <div className={`${isDarkMode ? 'bg-gradient-to-r from-purple-900/60 to-blue-900/60 border-purple-500/30' : 'bg-gradient-to-r from-purple-100 to-blue-100 border-purple-200'} rounded-2xl px-6 py-4 border backdrop-blur-sm`}>
                                    <div className="text-center">
                                        <div className={`text-3xl font-bold ${isDarkMode ? 'text-purple-300' : 'text-purple-700'} mb-1`}>
                                            {userModels.length}
                                        </div>
                                        <div className={`text-sm font-medium ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                                            {userModels.length === 1 ? 'Model' : 'Models'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {userModels.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {userModels.map((model, index) => (
                                        <NavigationLink
                                            href={`/modelsList/${model.id}`}
                                            key={model.id}
                                            className="group block animate-fade-in-up"
                                            style={{ animationDelay: `${index * 150}ms` }}
                                        >
                                            <div className={`${isDarkMode ? 'bg-slate-800/90' : 'bg-white/90'} rounded-3xl border ${isDarkMode ? 'border-slate-600/50' : 'border-gray-200/50'} hover:border-purple-400/60 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 overflow-hidden group-hover:-translate-y-2 backdrop-blur-sm relative`}>
                                                {/* Card glow effect */}
                                                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>

                                                {/* Image section */}
                                                <div className="relative w-full h-40 overflow-hidden rounded-t-3xl">
                                                    {(model.img_url || model.imgUrl) ? (
                                                        <img
                                                            src={model.img_url || model.imgUrl}
                                                            alt={model.name}
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                        />
                                                    ) : (
                                                        <div className={`w-full h-full ${isDarkMode ? 'bg-gradient-to-br from-slate-700 to-slate-600' : 'bg-gradient-to-br from-purple-50 to-blue-50'} flex items-center justify-center relative`}>
                                                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-t-3xl"></div>
                                                            <div className="relative z-10">
                                                                <DefaultModelImage size="medium" />
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Overlay gradient */}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-3xl"></div>

                                                    {/* Hover indicator */}
                                                    <div className="absolute top-3 right-3 w-6 h-6 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0">
                                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6L8 8l4 4 6-6" />
                                                        </svg>
                                                    </div>
                                                </div>

                                                {/* Content section */}
                                                <div className="p-4 relative">
                                                    <div className="mb-3">
                                                        <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} group-hover:text-purple-600 transition-colors duration-300 mb-1.5 line-clamp-2 leading-tight`}>
                                                            {model.name}
                                                        </h3>
                                                        <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} text-sm line-clamp-2 leading-relaxed`}>
                                                            {model.description}
                                                        </p>
                                                    </div>

                                                    {/* Tags */}
                                                    <div className="flex flex-wrap gap-1.5 mb-3">
                                                        {(model.tags || []).slice(0, 2).map((tag, tagIndex) => (
                                                            <span
                                                                key={tagIndex}
                                                                className={`px-2.5 py-1 ${isDarkMode ? 'bg-gradient-to-r from-purple-900/60 to-blue-900/60 text-purple-300 border-purple-500/30' : 'bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 border-purple-200'} rounded-full text-xs font-semibold border backdrop-blur-sm transition-all duration-300 hover:scale-105`}
                                                            >
                                                                {tag}
                                                            </span>
                                                        ))}
                                                        {(model.tags || []).length > 2 && (
                                                            <span className={`px-2.5 py-1 ${isDarkMode ? 'bg-slate-700/60 text-gray-400' : 'bg-gray-100 text-gray-600'} rounded-full text-xs font-medium`}>
                                                                +{(model.tags || []).length - 2}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Action indicator */}
                                                    <div className="flex items-center justify-between">
                                                        <div className={`text-xs font-medium ${isDarkMode ? 'text-purple-400' : 'text-purple-600'} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}>
                                                            View Details →
                                                        </div>
                                                        <div className={`w-1.5 h-1.5 rounded-full ${isDarkMode ? 'bg-purple-400' : 'bg-purple-500'} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </NavigationLink>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20 relative">
                                    {/* Empty state background */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 rounded-2xl"></div>

                                    <div className="relative z-10">
                                        <div className={`w-32 h-32 ${isDarkMode ? 'bg-gradient-to-br from-slate-700 to-slate-600' : 'bg-gradient-to-br from-purple-50 to-blue-50'} rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl`}>
                                            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center">
                                                <FaCode className="text-white text-2xl" />
                                            </div>
                                        </div>

                                        <h3 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                                            No Models Yet
                                        </h3>

                                        <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} text-lg mb-8 max-w-md mx-auto leading-relaxed`}>
                                            This developer hasn't published any models yet. Check back soon to see their innovative AI creations!
                                        </p>

                                        <div className={`inline-flex items-center gap-2 ${isDarkMode ? 'bg-slate-700/60 text-gray-300' : 'bg-gray-100 text-gray-600'} px-6 py-3 rounded-full text-sm font-medium`}>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Coming Soon
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 