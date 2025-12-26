"use client";

import { AuthProvider } from "@/lib/supabase-auth-context";
import { NavigationLoadingProvider } from "@/lib/navigation-loading-context";
import { SidebarProvider } from "@/lib/sidebar-context";
import NavigationLoader from "@/app/components/NavigationLoader";
import PublicNavbar from "@/app/components/PublicNavbar";
import AppShell from "@/app/components/AppShell";
import { SplashProvider } from "./splash-context";
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from "@/lib/theme-context";
import { ThemeAdaptiveProvider } from "@/lib/theme-adaptive-context";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import { useState } from "react";

export default function ClientProviders({ children }) {
    const [queryClient] = useState(() => new QueryClient());

    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider>
                <ThemeAdaptiveProvider>
                    <NavigationLoadingProvider>
                        <SplashProvider>
                            <AuthProvider>
                                <SidebarProvider>
                                    <PublicNavbar />
                                    <AppShell />
                                    {children}
                                    <NavigationLoader />
                                </SidebarProvider>
                            </AuthProvider>
                        </SplashProvider>
                    </NavigationLoadingProvider>
                    <Toaster position="top-right" />
                    <SpeedInsights />
                    <Analytics />
                </ThemeAdaptiveProvider>
            </ThemeProvider>
        </QueryClientProvider>
    );
}
