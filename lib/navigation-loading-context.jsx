'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

const NavigationLoadingContext = createContext();

export function NavigationLoadingProvider({ children }) {
    const [isNavigating, setIsNavigating] = useState(false);
    const [targetPath, setTargetPath] = useState(null);
    const pathname = usePathname();

    // Reset loading state when pathname changes (navigation complete)
    useEffect(() => {
        if (isNavigating) {
            // Small delay to ensure smooth transition
            const timer = setTimeout(() => {
                setIsNavigating(false);
                setTargetPath(null);
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [pathname, isNavigating]);

    const startNavigation = (path) => {
        // Only start loading if we're navigating to a different path
        if (path !== pathname) {
            setIsNavigating(true);
            setTargetPath(path);
        }
    };

    const stopNavigation = () => {
        setIsNavigating(false);
        setTargetPath(null);
    };

    return (
        <NavigationLoadingContext.Provider value={{
            isNavigating,
            targetPath,
            startNavigation,
            stopNavigation
        }}>
            {children}
        </NavigationLoadingContext.Provider>
    );
}

export function useNavigationLoading() {
    const context = useContext(NavigationLoadingContext);
    if (!context) {
        throw new Error('useNavigationLoading must be used within NavigationLoadingProvider');
    }
    return context;
}