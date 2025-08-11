'use client';
import { useAuth } from "@/lib/supabase-auth-context";
import { usePathname } from "next/navigation";
import ModernUnauthorizedNavbar from "./unauthorized/ModernUnauthorizedNavbar";
import AuthorizedNavbar from "./authorized/AuthorizedNavbar";

export default function NavbarController() {
    const { isAuthenticated, loading: isLoading } = useAuth();
    const pathname = usePathname();

    // Use modern navbar only for the home page (landing page)
    const isHomePage = pathname === '/';

    // Show loading state while authentication is being determined
    if (isLoading) {
        return isHomePage ? <ModernUnauthorizedNavbar /> : <AuthorizedNavbar />;
    }

    // Return appropriate navbar based on authentication status and page
    if (isAuthenticated) {
        return <AuthorizedNavbar />;
    } else {
        return isHomePage ? <ModernUnauthorizedNavbar /> : <ModernUnauthorizedNavbar />;
    }
}