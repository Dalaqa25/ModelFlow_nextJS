'use client';
import { useAuth } from "@/lib/supabase-auth-context";
import { useState, useEffect } from "react";

export default function LayoutWrapper({ children }) {
    const { isAuthenticated, loading } = useAuth();
    const [sidebarPinned, setSidebarPinned] = useState(false);

    // Listen for sidebar pinned state changes
    useEffect(() => {
        const checkPinnedState = () => {
            const savedPinnedState = localStorage.getItem('sidebarPinned');
            if (savedPinnedState !== null) {
                setSidebarPinned(JSON.parse(savedPinnedState));
            }
        };

        // Check initial state
        checkPinnedState();

        // Listen for storage changes (when sidebar is toggled)
        const handleStorageChange = (e) => {
            if (e.key === 'sidebarPinned') {
                setSidebarPinned(JSON.parse(e.newValue));
            }
        };

        window.addEventListener('storage', handleStorageChange);

        // Also listen for direct changes within the same tab
        const interval = setInterval(checkPinnedState, 100);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            clearInterval(interval);
        };
    }, []);

    // Show default layout while loading
    if (loading) {
        return <div>{children}</div>;
    }

    // For authenticated users, add padding for sidebar and top bar
    if (isAuthenticated) {
        return (
            <div className={`transition-all duration-300 ${sidebarPinned ? 'lg:pl-64' : 'lg:pl-16'}`}>
                <main className="min-h-screen">
                    {children}
                </main>
            </div>
        );
    }

    // For unauthorized users, use default layout
    return <div>{children}</div>;
}