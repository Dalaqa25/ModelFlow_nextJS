'use client';
import { useAuth } from "@/lib/supabase-auth-context";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import NavigationLink from "../../NavigationLink";
import ResponsiveAuthNavbar from "./responsive/ResponsiveAuthNavbar";
import BreadcrumbNavigation from "./BreadcrumbNavigation";
import Notifications from "../../notifications";
import ModelUpload from "../../model/modelupload/modelUpload";
import {
    MdDashboard,
    MdViewInAr,
    MdGroup,
    MdPayment,
    MdPerson,
    MdMenu,
    MdClose,
    MdChevronLeft,
    MdChevronRight,
    MdLogout,
    MdKeyboardArrowDown,
    MdNotifications,
    MdAdd,
    MdSearch,
    MdSettings
} from "react-icons/md";
import { useQuery } from '@tanstack/react-query';

export default function AuthorizedNavbar() {
    console.log("🔒 AuthorizedNavbar is currently displayed");
    
    const { user, signOut } = useAuth();
    const pathname = usePathname() || '/';
    const [sidebarExpanded, setSidebarExpanded] = useState(false);
    const [sidebarPinned, setSidebarPinned] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Fetch notifications for unread count
    const { data: notifications = [] } = useQuery({
        queryKey: ['notifications', user?.email],
        queryFn: async () => {
            if (!user?.email) return [];
            const response = await fetch('/api/notifications', { credentials: 'include' });
            if (!response.ok) throw new Error('Failed to fetch notifications');
            return response.json();
        },
        enabled: !!user?.email,
    });

    const unreadCount = notifications.filter(n => !n.read).length;

    // Load pinned state from localStorage on component mount
    useEffect(() => {
        const savedPinnedState = localStorage.getItem('sidebarPinned');
        if (savedPinnedState !== null) {
            const isPinned = JSON.parse(savedPinnedState);
            setSidebarPinned(isPinned);
            setSidebarExpanded(isPinned);
        }
    }, []);

    // Save pinned state to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('sidebarPinned', JSON.stringify(sidebarPinned));
    }, [sidebarPinned]);

    // Handle sidebar hover when not pinned
    const handleMouseEnter = () => {
        if (!sidebarPinned) {
            setSidebarExpanded(true);
        }
    };

    const handleMouseLeave = () => {
        if (!sidebarPinned) {
            setSidebarExpanded(false);
        }
    };

    // Toggle pin state
    const toggleSidebarPin = () => {
        const newPinnedState = !sidebarPinned;
        setSidebarPinned(newPinnedState);
        setSidebarExpanded(newPinnedState);
    };

    // Handle sign out
    const handleSignOut = async () => {
        try {
            await signOut();
        } catch (error) {
            console.error('Sign out error:', error);
        }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setUserDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Navigation routes with icons
    const navRoutes = [
        { href: '/dashboard', title: 'Dashboard', icon: MdDashboard },
        { href: '/modelsList', title: 'Explore Models', icon: MdViewInAr },
        { href: '/requests', title: 'Community', icon: MdGroup },
        { href: '/plans', title: 'Billing', icon: MdPayment },
        { href: '/profile', title: 'Profile', icon: MdPerson },
    ];


    return (
        <>
            {/* Top Bar */}
            <header className="fixed top-0 left-0 right-0 h-16 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50 z-40 flex items-center px-4 shadow-lg">
                <div className="flex items-center gap-4">
                    {/* Mobile menu button */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="lg:hidden p-2 rounded-md hover:bg-slate-800/50 text-purple-400"
                    >
                        {mobileMenuOpen ? <MdClose size={24} /> : <MdMenu size={24} />}
                    </button>
                    
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <img
                            src="/3dcube.png"
                            alt="3D Cube Logo"
                            width={32}
                            height={32}
                            className="flex-shrink-0"
                        />
                        
                        {/* Dynamic Breadcrumb Navigation */}
                        <BreadcrumbNavigation />
                    </div>

                    {/* Search Bar */}
                    <div className="hidden md:flex items-center ml-8">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search models..."
                                className="w-64 px-4 py-2 pl-10 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                            <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        </div>
                    </div>
                </div>

                {/* Right side - User info */}
                <div className="ml-auto flex items-center gap-4">
                    {/* Quick Upload Button */}
                    <button
                        onClick={() => setUploadDialogOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-purple-500/25"
                        title="Upload New Model"
                    >
                        <MdAdd size={20} />
                        <span className="hidden sm:inline">Upload Model</span>
                    </button>

                    {/* Notifications Bell */}
                    <button
                        onClick={() => setNotificationsOpen(true)}
                        className="relative p-2 rounded-lg hover:bg-slate-800/50 transition-colors duration-200 text-gray-300 hover:text-purple-400"
                        title="Notifications"
                    >
                        <MdNotifications size={20} />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                        )}
                    </button>
                    
                    <div className="hidden sm:flex items-center relative" ref={dropdownRef}>
                        <button
                            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                            className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-800/50 transition-colors duration-200"
                        >
                            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                {user?.user_metadata?.name?.[0] || user?.email?.[0] || 'U'}
                            </div>
                            <span className="text-sm text-white">
                                {user?.user_metadata?.name || user?.email || 'User'}
                            </span>
                            <MdKeyboardArrowDown
                                className={`text-gray-300 transition-transform duration-200 ${
                                    userDropdownOpen ? 'rotate-180' : ''
                                }`}
                                size={16}
                            />
                        </button>

                        {/* User Dropdown Menu */}
                        {userDropdownOpen && (
                            <div className="absolute top-full right-0 mt-2 w-48 bg-slate-800/95 backdrop-blur-md rounded-lg shadow-xl border border-slate-700/50 py-2 z-50">
                                <NavigationLink
                                    href="/profile"
                                    onClick={() => setUserDropdownOpen(false)}
                                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-slate-700/50 transition-colors"
                                >
                                    <MdPerson size={16} />
                                    View Profile
                                </NavigationLink>
                                <NavigationLink
                                    href="/profile"
                                    onClick={() => setUserDropdownOpen(false)}
                                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-slate-700/50 transition-colors"
                                >
                                    <MdSettings size={16} />
                                    Settings
                                </NavigationLink>
                                <hr className="my-1 border-slate-600/50" />
                                <button
                                    onClick={() => {
                                        setUserDropdownOpen(false);
                                        handleSignOut();
                                    }}
                                    className="flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-500/20 transition-colors w-full text-left"
                                >
                                    <MdLogout size={16} />
                                    Sign Out
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Sidebar */}
            <aside
                className={`fixed left-0 top-16 bottom-0 bg-slate-900/95 backdrop-blur-sm border-r border-slate-700/50 z-30 transition-all duration-300 ease-in-out ${
                    sidebarExpanded ? 'w-64' : 'w-16'
                } hidden lg:flex lg:flex-col shadow-lg`}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                <nav className="p-4 space-y-2 flex-1">
                    {navRoutes.map(({ href, title, icon: Icon }) => {
                        const isActive = pathname === href;
                        return (
                            <NavigationLink
                                key={href}
                                href={href}
                                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                                    isActive
                                        ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border-l-4 border-purple-400 shadow-sm'
                                        : 'text-gray-300 hover:bg-slate-800/50 hover:text-purple-400'
                                }`}
                            >
                                <Icon size={20} className="flex-shrink-0" />
                                <span className={`transition-all duration-300 ${
                                    sidebarExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'
                                }`}>
                                    {title}
                                </span>
                            </NavigationLink>
                        );
                    })}
                </nav>

                {/* Sidebar Toggle Button */}
                <div className="p-4 border-t border-slate-700/50">
                    <button
                        onClick={toggleSidebarPin}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-gray-300 hover:bg-slate-800/50 hover:text-purple-400 w-full ${
                            sidebarPinned ? 'bg-slate-800/50 text-purple-300' : ''
                        }`}
                        title={sidebarPinned ? 'Unpin sidebar' : 'Pin sidebar'}
                    >
                        {sidebarExpanded ? (
                            <MdChevronLeft size={20} className="flex-shrink-0" />
                        ) : (
                            <MdChevronRight size={20} className="flex-shrink-0" />
                        )}
                        <span className={`transition-all duration-300 ${
                            sidebarExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'
                        }`}>
                            {sidebarPinned ? 'Unpin' : 'Pin'} Sidebar
                        </span>
                    </button>
                </div>
            </aside>

            {/* Mobile Menu Component */}
            <ResponsiveAuthNavbar
                isOpen={mobileMenuOpen}
                onClose={() => setMobileMenuOpen(false)}
                navRoutes={navRoutes}
                onUploadClick={() => {
                    setMobileMenuOpen(false);
                    setUploadDialogOpen(true);
                }}
                onNotificationsClick={() => {
                    setMobileMenuOpen(false);
                    setNotificationsOpen(true);
                }}
            />

            {/* Notifications Dialog */}
            <Notifications
                isOpen={notificationsOpen}
                onClose={() => setNotificationsOpen(false)}
            />

            {/* Model Upload Dialog */}
            <ModelUpload
                isOpen={uploadDialogOpen}
                onClose={() => setUploadDialogOpen(false)}
                onUploadSuccess={() => {
                    setUploadDialogOpen(false);
                    // Optionally refresh data or show success message
                }}
            />
        </>
    );
}