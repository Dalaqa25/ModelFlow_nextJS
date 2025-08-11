'use client';
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import NavigationLink from "../../NavigationLink";

export default function BreadcrumbNavigation() {
    const pathname = usePathname() || '/';
    const [breadcrumbs, setBreadcrumbs] = useState([]);

    // Route mapping for better display names
    const routeMapping = {
        'dashboard': 'Dashboard',
        'modelsList': 'Models',
        'requests': 'Community',
        'plans': 'Billing',
        'profile': 'Profile',
        'admin': 'Admin',
        'auth': 'Authentication'
    };

    useEffect(() => {
        const generateBreadcrumbs = async () => {
            const pathSegments = pathname.split('/').filter(segment => segment !== '');
            const crumbs = [];

            // Always start with root
            crumbs.push({
                label: 'Home',
                href: '/',
                isClickable: true
            });

            for (let i = 0; i < pathSegments.length; i++) {
                const segment = pathSegments[i];
                const href = '/' + pathSegments.slice(0, i + 1).join('/');
                
                // Check if this is a dynamic route (like model ID)
                if (i > 0 && pathSegments[i - 1] === 'modelsList' && segment !== 'modelsList') {
                    // This is a model ID/name, try to fetch the model name
                    try {
                        const response = await fetch(`/api/models/${segment}`);
                        if (response.ok) {
                            const modelData = await response.json();
                            crumbs.push({
                                label: modelData.name || segment,
                                href: href,
                                isClickable: true
                            });
                        } else {
                            crumbs.push({
                                label: segment,
                                href: href,
                                isClickable: true
                            });
                        }
                    } catch (error) {
                        console.error('Error fetching model data:', error);
                        crumbs.push({
                            label: segment,
                            href: href,
                            isClickable: true
                        });
                    }
                } else {
                    // Regular route segment
                    const displayName = routeMapping[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
                    crumbs.push({
                        label: displayName,
                        href: href,
                        isClickable: true
                    });
                }
            }

            setBreadcrumbs(crumbs);
        };

        generateBreadcrumbs();
    }, [pathname]);

    if (breadcrumbs.length <= 1) {
        return (
            <div className="flex items-center gap-2 text-gray-600">
                <span>/</span>
                <span className="font-medium text-gray-900">Dashboard</span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2 text-gray-600 overflow-x-auto">
            {breadcrumbs.map((crumb, index) => (
                <div key={crumb.href} className="flex items-center gap-2 whitespace-nowrap">
                    <span className="text-gray-400">/</span>
                    {crumb.isClickable && index < breadcrumbs.length - 1 ? (
                        <NavigationLink
                            href={crumb.href}
                            className="text-gray-600 hover:text-purple-600 transition-colors duration-200 font-medium"
                        >
                            {crumb.label}
                        </NavigationLink>
                    ) : (
                        <span className={`font-medium ${index === breadcrumbs.length - 1 ? 'text-gray-900' : 'text-gray-600'}`}>
                            {crumb.label}
                        </span>
                    )}
                </div>
            ))}
        </div>
    );
}