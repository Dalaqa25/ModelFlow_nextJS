"use client";
import "./globals.css";
import { KindeProvider } from "@kinde-oss/kinde-auth-nextjs";
import Navbar from "@/app/components/navbar";
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
          <SplashProvider>
            <KindeProvider>
              {!isLoginOrSignUp &&  <Navbar/>}
              {children}
            </KindeProvider>
          </SplashProvider>
          <Toaster position="top-right" />
        </QueryClientProvider>
      </body>
    </html>
  );
}
