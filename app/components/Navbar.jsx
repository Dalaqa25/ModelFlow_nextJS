'use client';

import NavigationLink from './NavigationLink';
import { useAuth } from '@/lib/supabase-auth-context';
import { useTheme } from '@/lib/theme-context';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { FaHome, FaUsers, FaFileContract } from 'react-icons/fa';
import { MdPrivacyTip } from 'react-icons/md';

export default function Navbar() {
  const { isAuthenticated, loading } = useAuth();
  const { isDarkMode } = useTheme();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="w-full fixed top-4 z-50">
      <div className="w-full flex justify-center">
        <div className={`w-full max-w-6xl mx-auto px-4 sm:px-6 backdrop-blur-md rounded-2xl transition-colors ${
          isDarkMode 
            ? 'bg-slate-900/40 border border-purple-500/20 shadow-lg shadow-purple-900/20' 
            : 'bg-white/80 border border-purple-200/40 shadow-lg shadow-purple-200/20'
        }`}>
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo and App Name */}
            <NavigationLink 
              href="/" 
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <span className={`text-xl md:text-2xl font-bold tracking-tight ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                ModelGrow<span className="text-purple-400">.</span>
              </span>
            </NavigationLink>

            {/* Center Navigation Links */}
            <div className="hidden md:flex items-center gap-8 lg:gap-10">
              <NavigationLink
                href="/"
                className={`flex items-center gap-2 text-sm md:text-base font-medium transition-colors ${
                  pathname === '/' 
                    ? 'text-purple-400' 
                    : isDarkMode 
                      ? 'text-white hover:text-purple-300' 
                      : 'text-gray-700 hover:text-purple-600'
                }`}
              >
                <FaHome className="w-4 h-4" />
                Home
              </NavigationLink>
              <NavigationLink
                href="/requests"
                className={`flex items-center gap-2 text-sm md:text-base font-medium transition-colors ${
                  pathname === '/requests' 
                    ? 'text-purple-400' 
                    : isDarkMode 
                      ? 'text-white hover:text-purple-300' 
                      : 'text-gray-700 hover:text-purple-600'
                }`}
              >
                <FaUsers className="w-4 h-4" />
                Community
              </NavigationLink>
              <NavigationLink
                href="/privacy"
                className={`flex items-center gap-2 text-sm md:text-base font-medium transition-colors ${
                  pathname === '/privacy' 
                    ? 'text-purple-400' 
                    : isDarkMode 
                      ? 'text-white hover:text-purple-300' 
                      : 'text-gray-700 hover:text-purple-600'
                }`}
              >
                <MdPrivacyTip className="w-4 h-4" />
                Privacy
              </NavigationLink>
              <NavigationLink
                href="/terms"
                className={`flex items-center gap-2 text-sm md:text-base font-medium transition-colors ${
                  pathname === '/terms' 
                    ? 'text-purple-400' 
                    : isDarkMode 
                      ? 'text-white hover:text-purple-300' 
                      : 'text-gray-700 hover:text-purple-600'
                }`}
              >
                <FaFileContract className="w-4 h-4" />
                Terms
              </NavigationLink>
            </div>

            {/* Right Side - Auth Buttons & Mobile Menu */}
            <div className="flex items-center gap-3 md:gap-4">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`md:hidden p-2 transition-colors ${
                  isDarkMode 
                    ? 'text-white hover:text-purple-300' 
                    : 'text-gray-700 hover:text-purple-600'
                }`}
                aria-label="Toggle menu"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {isMobileMenuOpen ? (
                    <path d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>

              {/* Desktop Auth Buttons */}
              <div className="hidden md:flex items-center gap-3 md:gap-4">
                {!loading && !isAuthenticated ? (
                  <>
                    <NavigationLink
                      href="/auth/login"
                      className={`px-3 py-1.5 md:px-4 md:py-2 text-sm md:text-base font-medium rounded-lg transition-colors ${
                        isDarkMode
                          ? 'text-white bg-purple-600 hover:bg-purple-700 shadow-sm shadow-purple-900/50'
                          : 'text-white bg-purple-600 hover:bg-purple-700 shadow-sm shadow-purple-200/50'
                      }`}
                    >
                      Sign In
                    </NavigationLink>
                    <NavigationLink
                      href="/auth/signup"
                      className={`px-3 py-1.5 md:px-4 md:py-2 text-sm md:text-base font-medium rounded-lg transition-colors ${
                        isDarkMode
                          ? 'text-white bg-purple-600 hover:bg-purple-700 shadow-sm shadow-purple-900/50'
                          : 'text-white bg-purple-600 hover:bg-purple-700 shadow-sm shadow-purple-200/50'
                      }`}
                    >
                      Sign Up
                    </NavigationLink>
                  </>
                ) : !loading && isAuthenticated ? (
                  <NavigationLink
                    href="/dashboard"
                    className={`px-4 py-2 md:px-6 md:py-2.5 text-sm md:text-base font-medium rounded-lg transition-colors ${
                      isDarkMode
                        ? 'text-white bg-purple-600 hover:bg-purple-700 shadow-sm shadow-purple-900/50'
                        : 'text-white bg-purple-600 hover:bg-purple-700 shadow-sm shadow-purple-200/50'
                    }`}
                  >
                    Dashboard
                  </NavigationLink>
                ) : null}
              </div>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className={`md:hidden border-t mt-2 pt-4 pb-4 ${
              isDarkMode ? 'border-purple-500/20' : 'border-purple-200/40'
            }`}>
              <div className="flex flex-col gap-4">
                <NavigationLink
                  href="/"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-2 text-base font-medium transition-colors ${
                    pathname === '/' 
                      ? 'text-purple-400' 
                      : isDarkMode 
                        ? 'text-white hover:text-purple-300' 
                        : 'text-gray-700 hover:text-purple-600'
                  }`}
                >
                  <FaHome className="w-4 h-4" />
                  Home
                </NavigationLink>
                <NavigationLink
                  href="/requests"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-2 text-base font-medium transition-colors ${
                    pathname === '/requests' 
                      ? 'text-purple-400' 
                      : isDarkMode 
                        ? 'text-white hover:text-purple-300' 
                        : 'text-gray-700 hover:text-purple-600'
                  }`}
                >
                  <FaUsers className="w-4 h-4" />
                  Community
                </NavigationLink>
                <NavigationLink
                  href="/privacy"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-2 text-base font-medium transition-colors ${
                    pathname === '/privacy' 
                      ? 'text-purple-400' 
                      : isDarkMode 
                        ? 'text-white hover:text-purple-300' 
                        : 'text-gray-700 hover:text-purple-600'
                  }`}
                >
                  <MdPrivacyTip className="w-4 h-4" />
                  Privacy
                </NavigationLink>
                <NavigationLink
                  href="/terms"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-2 text-base font-medium transition-colors ${
                    pathname === '/terms' 
                      ? 'text-purple-400' 
                      : isDarkMode 
                        ? 'text-white hover:text-purple-300' 
                        : 'text-gray-700 hover:text-purple-600'
                  }`}
                >
                  <FaFileContract className="w-4 h-4" />
                  Terms
                </NavigationLink>
                <div className={`pt-2 border-t flex flex-col gap-2 ${
                  isDarkMode ? 'border-purple-500/20' : 'border-purple-200/40'
                }`}>
                  {!loading && !isAuthenticated ? (
                    <>
                      <NavigationLink
                        href="/auth/login"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`px-4 py-2 text-base font-medium rounded-lg transition-colors text-center ${
                          isDarkMode
                            ? 'text-white bg-purple-600 hover:bg-purple-700 shadow-sm shadow-purple-900/50'
                            : 'text-white bg-purple-600 hover:bg-purple-700 shadow-sm shadow-purple-200/50'
                        }`}
                      >
                        Sign In
                      </NavigationLink>
                      <NavigationLink
                        href="/auth/signup"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`px-4 py-2 text-base font-medium rounded-lg transition-colors text-center ${
                          isDarkMode
                            ? 'text-white bg-purple-600 hover:bg-purple-700 shadow-sm shadow-purple-900/50'
                            : 'text-white bg-purple-600 hover:bg-purple-700 shadow-sm shadow-purple-200/50'
                        }`}
                      >
                        Sign Up
                      </NavigationLink>
                    </>
                  ) : !loading && isAuthenticated ? (
                    <NavigationLink
                      href="/dashboard"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`px-4 py-2 text-base font-medium rounded-lg transition-colors text-center ${
                        isDarkMode
                          ? 'text-white bg-purple-600 hover:bg-purple-700 shadow-sm shadow-purple-900/50'
                          : 'text-white bg-purple-600 hover:bg-purple-700 shadow-sm shadow-purple-200/50'
                      }`}
                    >
                      Dashboard
                    </NavigationLink>
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
