"use client";
import "./globals.css";
import { KindeProvider } from "@kinde-oss/kinde-auth-nextjs";
import Navbar from "@/app/components/navbar";
import { usePathname } from "next/navigation";
import { Inter } from 'next/font/google';

const inter = Inter({
    subsets: ['latin'],
    display: 'swap'
});

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const isLoginOrSignUp = pathname === '/logIn' || pathname === '/signUp';
  return (
    <html lang="en">
      <body className={inter.className}>
        <KindeProvider>
          {!isLoginOrSignUp &&  <Navbar/>}
          {children}
        </KindeProvider>
      </body>
    </html>
  );
}
