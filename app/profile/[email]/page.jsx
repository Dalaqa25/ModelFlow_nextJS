"use client";
import { useEffect, useState } from "react";
import DefaultModelImage from "@/app/components/model/defaultModelImage";
import NavigationLink from "@/app/components/NavigationLink";
import { use } from "react";
import { FaGlobe, FaEnvelope, FaCalendarAlt, FaEdit, FaCode } from "react-icons/fa";

export default function Profile(props) {
    const params = use(props.params);
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
                <div className="text-red-500 text-center">
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
                    <p className="text-gray-500">The requested profile could not be found.</p>
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
        <div className="mt-15 mb-15">
            <section className='px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto'>
                {/* Profile Header Card */}
                <div className='bg-gray-50/50 rounded-2xl shadow-sm p-6 sm:p-8 mb-8 border border-gray-100'>
                    <div className='flex flex-col sm:flex-row gap-6 sm:gap-8 items-center sm:items-start'>
                        <div className="relative w-32 h-32 sm:w-52 sm:h-52 rounded-2xl overflow-hidden bg-gray-100 shadow-md">
                            {profileData.profileImageUrl ? (
                                <img 
                                    src={profileData.profileImageUrl} 
                                    alt={profileData.name} 
                                    className='w-full h-full object-cover'
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                    <div className="text-center">
                                        <svg className="w-16 h-16 text-gray-400 mx-auto" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path fillRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" clipRule="evenodd" />
                                        </svg>
                                        <p className="text-sm text-gray-500 mt-2">No Profile Image</p>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className='flex-1 flex flex-col gap-4 items-center sm:items-start'>
                            <div className="text-center sm:text-left">
                                <h1 className='text-3xl sm:text-4xl font-bold text-gray-900 mb-2'>
                                    {profileData.name || decodeURIComponent(params.email)}
                                </h1>
                                <p className='text-gray-500 text-lg'>{decodeURIComponent(params.email)}</p>
                            </div>
                            
                            {/* Contact Information */}
                            <div className='flex flex-col gap-3 mt-2 w-full max-w-md'>
                                {profileData.contactEmail && (
                                    <div className='flex items-center gap-3 text-gray-600 bg-white/50 p-3 rounded-xl hover:bg-white transition-colors border border-gray-100'>
                                        <FaEnvelope className="text-purple-500 text-lg" />
                                        <a href={`mailto:${profileData.contactEmail}`} className='hover:text-purple-600 transition-colors'>
                                            {profileData.contactEmail}
                                        </a>
                                    </div>
                                )}
                                {profileData.websiteLink && (
                                    <div className='flex items-center gap-3 text-gray-600 bg-white/50 p-3 rounded-xl hover:bg-white transition-colors border border-gray-100'>
                                        <FaGlobe className="text-purple-500 text-lg" />
                                        <a 
                                            href={profileData.websiteLink} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className='hover:text-purple-600 transition-colors'
                                        >
                                            {profileData.websiteLink}
                                        </a>
                                    </div>
                                )}
                                <div className='flex items-center gap-3 text-gray-600 bg-white/50 p-3 rounded-xl border border-gray-100'>
                                    <FaCalendarAlt className="text-purple-500 text-lg" />
                                    <span>Joined {formatDate(profileData.created_at || profileData.createdAt)}</span>
                                </div>
                            </div>

                            {/* Removed Kinde auth specific edit link */}
                        </div>
                    </div>
                </div>

                {/* About Me Section */}
                {profileData.aboutMe && (
                    <div className='bg-gray-50/50 rounded-2xl shadow-sm p-6 sm:p-8 mb-8 border border-gray-100'>
                        <h2 className='text-2xl font-semibold mb-4 text-gray-900'>About</h2>
                        <p className='text-gray-600 whitespace-pre-wrap leading-relaxed'>{profileData.aboutMe}</p>
                    </div>
                )}

                {/* User's Models */}
                <div className='bg-gray-50/50 rounded-2xl shadow-sm p-6 sm:p-8 border border-gray-100'>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <FaCode className="text-purple-500 text-xl" />
                            <h2 className='text-2xl font-semibold text-gray-900'>Published Models</h2>
                        </div>
                        <span className="text-gray-500 bg-white/50 px-3 py-1 rounded-lg text-sm border border-gray-100">
                            {userModels.length} {userModels.length === 1 ? 'model' : 'models'}
                        </span>
                    </div>
                    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
                        {userModels.map((model) => (
                            <NavigationLink
                                href={`/modelsList/${model.id}`}
                                key={model.id}
                                className='group'
                            >
                                <div className='bg-white/50 rounded-xl border border-gray-100 hover:border-purple-200 hover:shadow-lg transition-all duration-300 overflow-hidden'>
                                    <div className='relative w-full h-32 overflow-hidden'>
                                        {(model.img_url || model.imgUrl) ? (
                                            <img
                                                src={model.img_url || model.imgUrl}
                                                alt={model.name}
                                                className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-300'
                                            />
                                        ) : (
                                            <DefaultModelImage size="large" />
                                        )}
                                    </div>
                                    <div className='p-3'>
                                        <h3 className='text-base font-semibold group-hover:text-purple-600 transition-colors mb-1'>
                                            {model.name}
                                        </h3>
                                        <p className='text-gray-500 text-xs line-clamp-2 mb-2'>
                                            {model.description}
                                        </p>
                                        <div className='flex gap-1.5 flex-wrap'>
                                            {(model.tags || []).slice(0, 3).map((tag, index) => (
                                                <span
                                                    key={index}
                                                    className='px-2 py-0.5 bg-purple-50 text-purple-600 rounded-lg text-xs font-medium'
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </NavigationLink>
                        ))}
                    </div>
                    {userModels.length === 0 && (
                        <div className="text-center py-8">
                            <p className='text-gray-500 text-lg'>
                                No models published yet.
                            </p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
} 