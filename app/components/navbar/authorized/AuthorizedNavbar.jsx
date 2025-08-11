'use client';
import { useAuth } from "@/lib/supabase-auth-context";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import NavigationLink from "../../NavigationLink";
import ResponsiveAuthNavbar from "./responsive/ResponsiveAuthNavbar";
import BreadcrumbNavigation from "./BreadcrumbNavigation";
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
    MdKeyboardArrowDown
} from "react-icons/md";

export default function AuthorizedNavbar() {
    console.log("🔒 AuthorizedNavbar is currently displayed");
    
    const { user, signOut } = useAuth();
    const pathname = usePathname() || '/';
    const [sidebarExpanded, setSidebarExpanded] = useState(false);
    const [sidebarPinned, setSidebarPinned] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

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
        { href: '/modelsList', title: 'Models', icon: MdViewInAr },
        { href: '/requests', title: 'Community', icon: MdGroup },
        { href: '/plans', title: 'Billing', icon: MdPayment },
        { href: '/profile', title: 'Profile', icon: MdPerson },
    ];


    return (
        <>
            {/* Top Bar */}
            <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-40 flex items-center px-4">
                <div className="flex items-center gap-4">
                    {/* Mobile menu button */}
                    <button 
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="lg:hidden p-2 rounded-md hover:bg-gray-100"
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
                </div>

                {/* Right side - User info */}
                <div className="ml-auto flex items-center gap-4">
                    <div className="hidden sm:flex items-center relative" ref={dropdownRef}>
                        <button
                            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                            className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                        >
                            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                {user?.user_metadata?.name?.[0] || user?.email?.[0] || 'U'}
                            </div>
                            <span className="text-sm text-gray-700">
                                {user?.user_metadata?.name || user?.email || 'User'}
                            </span>
                            <MdKeyboardArrowDown
                                className={`text-gray-400 transition-transform duration-200 ${
                                    userDropdownOpen ? 'rotate-180' : ''
                                }`}
                                size={16}
                            />
                        </button>

                        {/* User Dropdown Menu */}
                        {userDropdownOpen && (
                            <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                                <NavigationLink
                                    href="/profile"
                                    onClick={() => setUserDropdownOpen(false)}
                                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    <MdPerson size={16} />
                                    View Profile
                                </NavigationLink>
                                <hr className="my-1 border-gray-100" />
                                <button
                                    onClick={() => {
                                        setUserDropdownOpen(false);
                                        handleSignOut();
                                    }}
                                    className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
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
                className={`fixed left-0 top-16 bottom-0 bg-gray-50 border-r border-gray-200 z-30 transition-all duration-300 ease-in-out ${
                    sidebarExpanded ? 'w-64' : 'w-16'
                } hidden lg:flex lg:flex-col`}
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
                                        ? 'bg-purple-100 text-purple-700 border-l-4 border-purple-500' 
                                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
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
                <div className="p-4 border-t border-gray-200">
                    <button
                        onClick={toggleSidebarPin}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900 w-full ${
                            sidebarPinned ? 'bg-purple-50 text-purple-700' : ''
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
            />
        </>
    );
}