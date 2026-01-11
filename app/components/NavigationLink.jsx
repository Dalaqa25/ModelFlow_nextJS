'use client';
import Link from 'next/link';
import { useNavigationLoading } from '@/lib/contexts/navigation-loading-context';
import { usePathname } from 'next/navigation';

export default function NavigationLink({ 
    href, 
    children, 
    className = '', 
    onClick,
    ...props 
}) {
    const { startNavigation, isNavigating, targetPath } = useNavigationLoading();
    const pathname = usePathname();

    const handleClick = (e) => {
        // Call custom onClick if provided
        if (onClick) {
            onClick(e);
        }

        // Only start navigation loading if we're going to a different page
        if (href !== pathname && !e.defaultPrevented) {
            startNavigation(href);
        }
    };

    const isCurrentlyNavigating = isNavigating && targetPath === href;
    const isActive = pathname === href;

    return (
        <Link
            href={href}
            className={`${className} ${isCurrentlyNavigating ? 'pointer-events-none opacity-75' : ''}`}
            onClick={handleClick}
            {...props}
        >
            <span className={`inline-flex items-center gap-2 ${isCurrentlyNavigating ? 'animate-pulse' : ''}`}>
                {isCurrentlyNavigating && (
                    <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                )}
                {children}
            </span>
        </Link>
    );
}