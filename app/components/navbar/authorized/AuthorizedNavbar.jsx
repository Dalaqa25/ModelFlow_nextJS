'use client';
import { useAuth } from "@/lib/supabase-auth-context";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import NavigationLink from "../../NavigationLink";
import ResponsiveAuthNavbar from "./responsive/ResponsiveAuthNavbar";
import BreadcrumbNavigation from "./BreadcrumbNavigation";
import Notifications from "../../notifications";
import ModelUpload from "../../model/modelupload/modelUpload";
import PLANS from "../../../plans";
import { useTheme } from "../../../../lib/theme-context";
import {
    MdDashboard,
    MdViewInAr,
    MdGroup,
    MdPayment,
    MdPerson,
    MdMenu,
    MdClose,
    MdLogout,
    MdKeyboardArrowDown,
    MdNotifications,
    MdSearch,
    MdPushPin,
    MdOutlinePushPin,
    MdLightMode,
    MdDarkMode,
    MdCloudUpload,
    MdStorage,
    MdSettings
} from "react-icons/md";
import { useQuery } from '@tanstack/react-query';

export default function AuthorizedNavbar() {

    const { user, signOut } = useAuth();
    const pathname = usePathname() || '/';
    const [sidebarExpanded, setSidebarExpanded] = useState(false);
    const [sidebarPinned, setSidebarPinned] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [userData, setUserData] = useState({});
    const [userDataLoading, setUserDataLoading] = useState(true);

    // Use theme context instead of local state
    const { isDarkMode, toggleTheme } = useTheme();

    // Fetch user data from database
    useEffect(() => {
        const fetchUserData = async () => {
            if (!user?.email) {
                setUserDataLoading(false);
                return;
            }

            setUserDataLoading(true);
            try {
                const response = await fetch('/api/user');
                if (response.ok) {
                    const data = await response.json();
                    setUserData(data);
                }
            } catch (error) {
                console.error('Failed to fetch user data for navbar:', error);
            } finally {
                setUserDataLoading(false);
            }
        };

        fetchUserData();
    }, [user?.email]);



    // Storage data state
    const [storageData, setStorageData] = useState({
        used: 0,
        total: 5120, // 5GB in MB
        percentage: 0
    });
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
        if (typeof window !== 'undefined' && window.localStorage) {
            const savedPinnedState = window.localStorage.getItem('sidebarPinned');
            if (savedPinnedState !== null) {
                const isPinned = JSON.parse(savedPinnedState);
                setSidebarPinned(isPinned);
                setSidebarExpanded(isPinned);
            }
        }
    }, []);

    // Save pinned state to localStorage whenever it changes
    useEffect(() => {
        if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem('sidebarPinned', JSON.stringify(sidebarPinned));
        }
    }, [sidebarPinned]);

    // Fetch storage data
    useEffect(() => {
        const fetchStorageData = async () => {
            if (!user?.email) return;

            try {
                const response = await fetch(`/api/models/user-models?email=${encodeURIComponent(user.email)}`);
                if (response.ok) {
                    const data = await response.json();
                    const usedMB = data.totalStorageUsedMB || 0;
                    const userPlan = data.plan || 'basic';

                    // Get storage cap from PLANS based on user's actual plan
                    const storageCapStr = PLANS[userPlan]?.features?.activeStorage || '250 MB';
                    let totalMB = 250; // Default for basic plan

                    if (storageCapStr.toLowerCase().includes('gb')) {
                        totalMB = parseInt(storageCapStr.replace(/\D/g, '')) * 1024;
                    } else if (storageCapStr.toLowerCase().includes('mb')) {
                        totalMB = parseInt(storageCapStr.replace(/\D/g, ''));
                    }

                    const percentage = Math.min((usedMB / totalMB) * 100, 100);

                    setStorageData({
                        used: usedMB,
                        total: totalMB,
                        percentage: percentage
                    });
                }
            } catch (error) {
                console.error('Failed to fetch storage data:', error);
            }
        };

        fetchStorageData();
    }, [user?.email]);

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

    // Handle theme toggle
    const handleThemeToggle = () => {
        toggleTheme();
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
        { href: '/automations', title: 'Automations', icon: MdSettings },
        { href: '/modelsList', title: 'Explore Models', icon: MdViewInAr },
        { href: '/plans', title: 'Billing', icon: MdPayment },
        { href: '/requests', title: 'Community', icon: MdGroup },
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
                                {(userDataLoading ? '...' : (userData?.name || user?.user_metadata?.name || user?.email || 'User')[0])}
                            </div>
                            <span className="text-sm text-white">
                                {userDataLoading ? 'Loading...' : (userData?.name || user?.user_metadata?.name || user?.email || 'User')}
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
                                <button
                                    onClick={() => {
                                        handleThemeToggle();
                                        setUserDropdownOpen(false);
                                    }}
                                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-slate-700/50 transition-all duration-300 w-full text-left group"
                                >
                                    <div className="relative w-4 h-4 flex items-center justify-center overflow-hidden">
                                        <div className={`absolute inset-0 flex items-center justify-center transition-all duration-500 transform group-hover:rotate-12 ${
                                            isDarkMode
                                                ? 'opacity-100 rotate-0 scale-100 translate-y-0'
                                                : 'opacity-0 rotate-90 scale-75 -translate-y-2'
                                        }`}>
                                            <MdLightMode size={16} />
                                        </div>
                                        <div className={`absolute inset-0 flex items-center justify-center transition-all duration-500 transform group-hover:rotate-12 ${
                                            !isDarkMode
                                                ? 'opacity-100 rotate-0 scale-100 translate-y-0'
                                                : 'opacity-0 -rotate-90 scale-75 translate-y-2'
                                        }`}>
                                            <MdDarkMode size={16} />
                                        </div>
                                    </div>
                                    <span className="transition-all duration-300 group-hover:translate-x-1">
                                        {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                                    </span>
                                </button>
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
                    {/* Main Navigation Routes */}
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
                                <span className={`transition-all duration-300 whitespace-nowrap overflow-hidden ${
                                    sidebarExpanded
                                        ? 'opacity-100 translate-x-0 max-w-xs'
                                        : 'opacity-0 -translate-x-2 max-w-0'
                                }`}>
                                    {title}
                                </span>
                            </NavigationLink>
                        );
                    })}

                    {/* Separator */}
                    <div className="my-4 border-t border-slate-700/50"></div>


                    {/* Upload Model Section */}
                    <button
                        onClick={() => setUploadDialogOpen(true)}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-gray-300 hover:bg-slate-800/50 hover:text-purple-400 w-full"
                        title="Upload New Model"
                    >
                        <MdCloudUpload size={20} className="flex-shrink-0" />
                        <span className={`transition-all duration-300 whitespace-nowrap overflow-hidden ${
                            sidebarExpanded
                                ? 'opacity-100 translate-x-0 max-w-xs'
                                : 'opacity-0 -translate-x-2 max-w-0'
                        }`}>
                            Upload Model
                        </span>
                    </button>

                    {/* Another Separator */}
                    <div className="my-4 border-t border-slate-700/50"></div>

                    {/* Storage Usage Section */}
                    <div className="flex items-center gap-3 px-3 py-2">
                        {/* Circular Progress Indicator */}
                        <div className="relative flex-shrink-0">
                            <svg className="w-5 h-5 transform -rotate-90" viewBox="0 0 36 36">
                                {/* Background circle */}
                                <path
                                    className="text-slate-700"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                    fill="transparent"
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                />
                                {/* Progress circle */}
                                <path
                                    className={`transition-all duration-500 ${
                                        storageData.percentage > 80
                                            ? 'text-red-500'
                                            : storageData.percentage > 60
                                            ? 'text-yellow-500'
                                            : 'text-purple-500'
                                    }`}
                                    stroke="currentColor"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    fill="transparent"
                                    strokeDasharray={`${storageData.percentage}, 100`}
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                />
                            </svg>
                            {/* Storage icon in center */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <MdStorage size={12} className="text-gray-400" />
                            </div>
                        </div>

                        {/* Storage details when expanded */}
                        {sidebarExpanded && (
                            <div className="transition-all duration-300 opacity-100 translate-x-0 whitespace-nowrap overflow-hidden">
                                <div className="text-sm font-medium text-gray-300">Storage</div>
                                <div className="text-xs text-gray-400">
                                    {storageData.used < 1
                                        ? `${(storageData.used * 1024).toFixed(0)}KB`
                                        : `${storageData.used.toFixed(1)}MB`
                                    } / {(storageData.total / 1024).toFixed(1)}GB
                                </div>
                            </div>
                        )}
                    </div>
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
                        {sidebarPinned ? (
                            <MdPushPin size={20} className="flex-shrink-0 rotate-45" />
                        ) : (
                            <MdOutlinePushPin size={20} className="flex-shrink-0" />
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