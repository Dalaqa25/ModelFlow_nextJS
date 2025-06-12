"use client";
import { useEffect, useState } from "react";
import { useKindeAuth } from "@kinde-oss/kinde-auth-nextjs";
import DefaultModelImage from "@/app/components/model/defaultModelImage";
import Link from "next/link";
import { use } from "react";
import { FaGlobe, FaEnvelope, FaCalendarAlt, FaEdit, FaCode } from "react-icons/fa";

export default function Profile(props) {
    const params = use(props.params);
    const { isAuthenticated, user } = useKindeAuth();
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userModels, setUserModels] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                setError(null);
                const profileRes = await fetch(`/api/user/profile?email=${params.email}`);
                if (!profileRes.ok) {
                    throw new Error(`Failed to fetch profile: ${profileRes.statusText}`);
                }
                const profileData = await profileRes.json();
                setProfileData(profileData);

                const modelsRes = await fetch(`/api/models/user-models?email=${params.email}`);
                if (!modelsRes.ok) {
                    throw new Error(`Failed to fetch models: ${modelsRes.statusText}`);
                }
                const models = await modelsRes.json();
                setUserModels(models);
                setLoading(false);
            } catch (error) {
                console.error("Error in fetchProfileData:", error);
                setError(error.message);
                setLoading(false);
            }
        };

        fetchProfileData();
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
                                <div className="w-full h-full flex items-center justify-center">
                                    <DefaultModelImage size="large" />
                                </div>
                            )}
                        </div>
                        <div className='flex-1 flex flex-col gap-4 items-center sm:items-start'>
                            <div className="text-center sm:text-left">
                                <h1 className='text-3xl sm:text-4xl font-bold text-gray-900 mb-2'>
                                    {profileData.name || params.email}
                                </h1>
                                <p className='text-gray-500 text-lg'>{params.email}</p>
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
                                    <span>Joined {formatDate(profileData.createdAt)}</span>
                                </div>
                            </div>

                            {isAuthenticated && user?.email === params.email && (
                                <Link 
                                    href="/profile/edit" 
                                    className='mt-4 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors flex items-center gap-2 shadow-sm hover:shadow-md'
                                >
                                    <FaEdit />
                                    Edit Profile
                                </Link>
                            )}
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
                            <Link 
                                href={`/modelsList/${model._id}`} 
                                key={model._id}
                                className='group'
                            >
                                <div className='bg-white/50 rounded-xl border border-gray-100 hover:border-purple-200 hover:shadow-lg transition-all duration-300 overflow-hidden'>
                                    <div className='relative w-full h-32 overflow-hidden'>
                                        {model.imgUrl ? (
                                            <img 
                                                src={model.imgUrl} 
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
                                            {model.tags.slice(0, 3).map((tag, index) => (
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
                            </Link>
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