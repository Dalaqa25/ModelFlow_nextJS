"use client";
import "./globals.css";
import { AuthProvider } from "@/lib/supabase-auth-context";
import { NavigationLoadingProvider } from "@/lib/navigation-loading-context";
import NavbarController from "@/app/components/navbar/NavbarController";
import LayoutWrapper from "@/app/components/navbar/LayoutWrapper";
import NavigationLoader from "@/app/components/NavigationLoader";
import { usePathname } from "next/navigation";
import { Inter } from 'next/font/google';
import { SplashProvider } from "./splash-context";
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const inter = Inter({
    subsets: ['latin'],
    display: 'swap'
});

// Create a client
const queryClient = new QueryClient();

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const isLoginOrSignUp = pathname === '/logIn' || pathname === '/signUp';
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryClientProvider client={queryClient}>
          <NavigationLoadingProvider>
            <SplashProvider>
              <AuthProvider>
                {!isLoginOrSignUp &&  <NavbarController/>}
                <LayoutWrapper>
                  {children}
                </LayoutWrapper>
                <NavigationLoader />
              </AuthProvider>
            </SplashProvider>
          </NavigationLoadingProvider>
          <Toaster position="top-right" />
        </QueryClientProvider>
      </body>
    </html>
  );
}
