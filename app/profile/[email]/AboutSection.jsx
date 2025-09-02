"use client";
import { FaEdit } from "react-icons/fa";
import { useTheme } from "@/lib/theme-context";

export default function AboutSection({ profileData }) {
    const { isDarkMode } = useTheme();

    // Only render if there's about content
    if (!profileData.about_me && !profileData.aboutMe) {
        return null;
    }

    return (
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
    );
}