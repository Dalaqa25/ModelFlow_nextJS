'use client';

import NavigationLink from './NavigationLink';
import { useAuth } from '@/lib/supabase-auth-context';
import { useTheme } from '@/lib/theme-context';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import Image from 'next/image';
import SignInDialog from './auth/login/SignInDialog';
import SignUpDialog from './auth/signup/SignUpDialog';

export default function PublicNavbar() {
  const { isAuthenticated, loading } = useAuth();
  const { isDarkMode } = useTheme();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);

  // Switch between dialogs
  const switchToSignUp = () => {
    setIsSignInOpen(false);
    setIsSignUpOpen(true);
  };

  const switchToSignIn = () => {
    setIsSignUpOpen(false);
    setIsSignInOpen(true);
  };

  // Hide navbar completely when auth state is loading or user is authenticated
  if (loading || isAuthenticated) {
    return null;
  }

  const navLinks = [
    { href: '/', label: 'Home', protected: false },
    { href: '/pricing', label: 'Pricing', protected: false },
    { href: '/community', label: 'Community', protected: true },
    { href: '/terms', label: 'Terms', protected: false },
    { href: '/privacy', label: 'Privacy', protected: false },
    { href: '/refund', label: 'Refund', protected: false },
  ];

  // Handle nav link click - show sign in for protected routes
  const handleNavClick = (e, link) => {
    if (link.protected && !isAuthenticated) {
      e.preventDefault();
      setIsSignInOpen(true);
    }
  };

  return (
    <>
      <nav className="w-full fixed top-4 z-50 px-4 sm:px-6 lg:px-8">
        <div className="w-full flex justify-center">
          <div className={`w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 backdrop-blur-xl rounded-2xl transition-colors ${
            isDarkMode 
              ? 'bg-white/8 border border-white/10 shadow-lg shadow-purple-900/10' 
              : 'bg-white/70 border border-white/40 shadow-lg shadow-purple-200/20'
          }`}>
            <div className="flex items-center justify-between h-16 md:h-20">
              {/* Logo and App Name */}
              <NavigationLink 
                href="/" 
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                <Image 
                  src="/logo.png" 
                  alt="ModelGrow Logo" 
                  width={40} 
                  height={40}
                  className="object-contain"
                />
                <span className={`text-xl md:text-2xl font-bold tracking-tight ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  ModelGrow<span className="text-purple-400">.</span>
                </span>
              </NavigationLink>

              {/* Center Navigation Links */}
              <div className="hidden md:flex items-center gap-1 lg:gap-3 xl:gap-4 2xl:gap-6">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href || pathname === link.href.toLowerCase();
                  return (
                    <NavigationLink
                      key={link.href}
                      href={link.href}
                      onClick={(e) => handleNavClick(e, link)}
                      className={`px-5 py-2 text-sm md:text-base font-medium rounded-lg transition-all ${
                        isActive
                          ? 'bg-purple-500/40 text-white border border-purple-400/30'
                          : isDarkMode
                            ? 'text-gray-300 hover:text-white hover:bg-white/5'
                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/50'
                      }`}
                    >
                      {link.label}
                    </NavigationLink>
                  );
                })}
              </div>

              {/* Right Side - Auth Button & Mobile Menu */}
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

                {/* Desktop Auth Button */}
                <div className="hidden md:flex items-center">
                  {!loading && !isAuthenticated && (
                    <button
                      onClick={() => setIsSignInOpen(true)}
                      className="px-5 py-2 md:px-6 md:py-2.5 text-sm md:text-base font-medium rounded-lg text-white bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 transition-all shadow-md hover:shadow-lg"
                    >
                      Sign In
                    </button>
                  )}
                  {!loading && isAuthenticated && (
                    <NavigationLink
                      href="/dashboard"
                      className="px-5 py-2 md:px-6 md:py-2.5 text-sm md:text-base font-medium rounded-lg text-white bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 transition-all shadow-md hover:shadow-lg"
                    >
                      Dashboard
                    </NavigationLink>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
              <div className={`md:hidden border-t mt-2 pt-4 pb-4 ${
                isDarkMode ? 'border-purple-500/20' : 'border-purple-200/40'
              }`}>
                <div className="flex flex-col gap-2">
                  {navLinks.map((link) => {
                    const isActive = pathname === link.href || pathname === link.href.toLowerCase();
                    return (
                      <NavigationLink
                        key={link.href}
                        href={link.href}
                        onClick={(e) => {
                          if (link.protected && !isAuthenticated) {
                            e.preventDefault();
                            setIsMobileMenuOpen(false);
                            setIsSignInOpen(true);
                          } else {
                            setIsMobileMenuOpen(false);
                          }
                        }}
                        className={`px-4 py-2 text-base font-medium rounded-lg transition-all ${
                          isActive
                            ? 'bg-purple-500/40 text-white border border-purple-400/30'
                            : isDarkMode
                              ? 'text-gray-300 hover:text-white hover:bg-white/5'
                              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/50'
                        }`}
                      >
                        {link.label}
                      </NavigationLink>
                    );
                  })}
                  <div className={`pt-3 mt-2 border-t ${
                    isDarkMode ? 'border-purple-500/20' : 'border-purple-200/40'
                  }`}>
                    {!loading && !isAuthenticated && (
                      <button
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          setIsSignInOpen(true);
                        }}
                        className="w-full px-4 py-2.5 text-base font-medium rounded-full text-white bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 transition-all text-center"
                      >
                        Sign In
                      </button>
                    )}
                    {!loading && isAuthenticated && (
                      <NavigationLink
                        href="/dashboard"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="block px-4 py-2.5 text-base font-medium rounded-full text-white bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 transition-all text-center"
                      >
                        Dashboard
                      </NavigationLink>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Sign In Dialog */}
      <SignInDialog 
        isOpen={isSignInOpen} 
        onClose={() => setIsSignInOpen(false)} 
        onSwitchToSignUp={switchToSignUp}
      />

      {/* Sign Up Dialog */}
      <SignUpDialog 
        isOpen={isSignUpOpen} 
        onClose={() => setIsSignUpOpen(false)} 
        onSwitchToSignIn={switchToSignIn}
      />
    </>
  );
}
