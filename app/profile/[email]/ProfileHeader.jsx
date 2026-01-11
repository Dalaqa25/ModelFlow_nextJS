"use client";
import { FaGlobe, FaEnvelope, FaCalendarAlt, FaEdit, FaCode, FaDollarSign } from "react-icons/fa";
import { useTheme } from "@/lib/contexts/theme-context";

export default function ProfileHeader({ profileData, params }) {
    const { isDarkMode } = useTheme();

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className={`${isDarkMode ? 'bg-slate-800/80' : 'bg-white/80'} backdrop-blur-sm rounded-3xl shadow-xl border mt-15 ${isDarkMode ? 'border-slate-700/50' : 'border-white/20'} p-8 mb-8`}>
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
    );
}