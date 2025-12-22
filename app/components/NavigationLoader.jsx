'use client';
import { useNavigationLoading } from '@/lib/navigation-loading-context';

export default function NavigationLoader() {
    const { isNavigating, targetPath } = useNavigationLoading();

    if (!isNavigating) return null;

    return (
        <>
            {/* Top loading bar */}
            <div className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-gradient-to-r from-purple-500 to-blue-500">
                <div className="h-full bg-gradient-to-r from-purple-600 to-blue-600 loading-bar" />
            </div>
        </>
    );
}

function getPageName(path) {
    const pathMap = {
        '/': 'Home',
        '/dashboard': 'Dashboard',
        '/community': 'Community',
        '/profile': 'Profile',
        '/auth/login': 'Login',
        '/auth/signup': 'Sign Up'
    };
    
    return pathMap[path] || path.split('/').pop() || 'page';
}