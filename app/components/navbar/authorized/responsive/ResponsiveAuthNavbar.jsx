'use client';
import { useAuth } from "@/lib/supabase-auth-context";
import { usePathname } from "next/navigation";
import NavigationLink from "../../../NavigationLink";
import {
    MdDashboard,
    MdGroup,
    MdPayment,
    MdPerson,
    MdClose,
    MdLogout,
    MdSearch,
    MdAdd,
    MdNotifications
} from "react-icons/md";

export default function ResponsiveAuthNavbar({ isOpen, onClose, navRoutes, onUploadClick, onNotificationsClick }) {
    const { user, signOut } = useAuth();
    const pathname = usePathname() || '/';

    // Handle sign out
    const handleSignOut = async () => {
        try {
            await signOut();
        } catch (error) {
            console.error('Sign out error:', error);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="fixed left-0 top-0 bottom-0 w-64 bg-slate-900/95 backdrop-blur-md shadow-2xl border-r border-slate-700/50" onClick={(e) => e.stopPropagation()}>
                {/* Mobile menu header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
                    <div className="flex items-center gap-3">
                        <img
                            src="/3dcube.png"
                            alt="3D Cube Logo"
                            width={32}
                            height={32}
                        />
                        <span className="font-semibold text-white">ModelGrow</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-md hover:bg-slate-800/50 text-gray-300"
                    >
                        <MdClose size={20} />
                    </button>
                </div>

                {/* Mobile Search Bar */}
                <div className="px-4 py-3 border-b border-slate-700/50">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search models..."
                            className="w-full px-4 py-2 pl-10 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                        <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="px-4 py-3 border-b border-slate-700/50">
                    <div className="flex gap-2">
                        <button
                            onClick={onUploadClick}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium text-sm"
                        >
                            <MdAdd size={16} />
                            Upload Model
                        </button>
                        <button
                            onClick={onNotificationsClick}
                            className="flex items-center justify-center px-3 py-2 bg-slate-800/50 border border-slate-700/50 text-gray-300 rounded-lg hover:bg-slate-700/50"
                        >
                            <MdNotifications size={16} />
                        </button>
                    </div>
                </div>

                {/* Mobile menu navigation */}
                <nav className="p-4 space-y-2">
                    {navRoutes.map(({ href, title, icon: Icon }) => {
                        const isActive = pathname === href;
                        return (
                            <NavigationLink
                                key={href}
                                href={href}
                                onClick={onClose}
                                className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                                    isActive
                                        ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border-l-4 border-purple-400'
                                        : 'text-gray-300 hover:bg-slate-800/50 hover:text-purple-400'
                                }`}
                            >
                                <Icon size={20} />
                                <span>{title}</span>
                            </NavigationLink>
                        );
                    })}
                </nav>

                {/* Mobile user info */}
                <div className="absolute bottom-0 left-0 right-0 border-t border-slate-700/50">
                    <div className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-medium">
                                {user?.user_metadata?.name?.[0] || user?.email?.[0] || 'U'}
                            </div>
                            <div>
                                <div className="text-sm font-medium text-white">
                                    {user?.user_metadata?.name || 'User'}
                                </div>
                                <div className="text-xs text-gray-400">
                                    {user?.email}
                                </div>
                            </div>
                        </div>
                        
                        {/* Sign Out Button */}
                        <button
                            onClick={() => {
                                onClose();
                                handleSignOut();
                            }}
                            className="flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-red-500/20 transition-colors w-full text-left rounded-lg"
                        >
                            <MdLogout size={16} />
                            Sign Out
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}