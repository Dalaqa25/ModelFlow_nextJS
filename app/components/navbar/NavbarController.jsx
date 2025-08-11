'use client';
import { useAuth } from "@/lib/supabase-auth-context";
import UnauthorizedNavbar from "./unauthorized/UnauthorizedNavbar";
import AuthorizedNavbar from "./authorized/AuthorizedNavbar";

export default function NavbarController() {
    const { isAuthenticated, loading: isLoading } = useAuth();

    // Show loading state while authentication is being determined
    if (isLoading) {
        return <UnauthorizedNavbar />;
    }

    // Return appropriate navbar based on authentication status
    return isAuthenticated ? <AuthorizedNavbar /> : <UnauthorizedNavbar />;
}