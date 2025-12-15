"use client";
import "./globals.css";
import "./globals-light.css";
import { AuthProvider } from "@/lib/supabase-auth-context";
import { NavigationLoadingProvider } from "@/lib/navigation-loading-context";
import { SidebarProvider } from "@/lib/sidebar-context";
import NavigationLoader from "@/app/components/NavigationLoader";
import Navbar from "@/app/components/Navbar";
import TopBar from "@/app/components/navbar/TopBar";
import Sidebar from "@/app/components/navbar/Sidebar";
import { Inter } from 'next/font/google';
import { SplashProvider } from "./splash-context";
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from "@/lib/theme-context";

const inter = Inter({
    subsets: ['latin'],
    display: 'swap'
});

// Create a client
const queryClient = new QueryClient();

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <NavigationLoadingProvider>
              <SplashProvider>
                <AuthProvider>
                  <SidebarProvider>
                    <Navbar />
                    <TopBar />
                    <Sidebar />
                    {children}
                    <NavigationLoader />
                  </SidebarProvider>
                </AuthProvider>
              </SplashProvider>
            </NavigationLoadingProvider>
            <Toaster position="top-right" />
          </ThemeProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
