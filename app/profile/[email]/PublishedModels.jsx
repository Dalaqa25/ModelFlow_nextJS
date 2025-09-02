"use client";
import { FaCode } from "react-icons/fa";
import { useTheme } from "@/lib/theme-context";
import DefaultModelImage from "@/app/components/model/defaultModelImage";
import NavigationLink from "@/app/components/NavigationLink";

export default function PublishedModels({ userModels }) {
    const { isDarkMode } = useTheme();

    return (
        <div className={`${isDarkMode ? 'bg-slate-800/60' : 'bg-white/60'} backdrop-blur-sm rounded-3xl shadow-2xl border ${isDarkMode ? 'border-slate-700/30' : 'border-white/30'} p-8 relative overflow-hidden`}>
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-full blur-3xl -translate-y-32 translate-x-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-pink-500/10 to-purple-500/10 rounded-full blur-3xl translate-y-24 -translate-x-24"></div>

            <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <h2 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-3`}>
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
                            <FaCode className="text-white text-lg" />
                        </div>
                        Published Models
                    </h2>
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
                                        <div className="text-center">
                                            <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} group-hover:text-purple-600 transition-colors duration-300 mb-1.5 line-clamp-2 leading-tight`}>
                                                {model.name}
                                            </h3>
                                        </div>

                                        {/* Action indicator */}
                                        <div className="flex items-center justify-center mt-3">
                                            <div className={`text-xs font-medium ${isDarkMode ? 'text-purple-400' : 'text-purple-600'} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}>
                                                View Details →
                                            </div>
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
    );
}