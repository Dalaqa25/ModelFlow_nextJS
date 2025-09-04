"use client";
import { useEffect, useState } from "react";
import { use } from "react";
import { useTheme } from "@/lib/theme-context";
import ProfileHeader from "./ProfileHeader";
import AboutSection from "./AboutSection";
import PublishedModels from "./PublishedModels";

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
                
                // Handle both direct array and object with models property
                const models = Array.isArray(modelsData) ? modelsData : (modelsData.models || []);
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

    return (
        <div className={`min-h-screen ${isDarkMode ? 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900' : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100'}`}>
            <div className="pt-8 pb-16">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <ProfileHeader profileData={profileData} params={params} />

                    <AboutSection profileData={profileData} />

                    <PublishedModels userModels={userModels} />
                </div>
            </div>
        </div>
    );
} 