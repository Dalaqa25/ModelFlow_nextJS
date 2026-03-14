'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth/supabase-auth-context';
import { useState } from 'react';
import SignInDialog from './auth/login/SignInDialog';
import SignUpDialog from './auth/signup/SignUpDialog';

export default function PublicNavbar() {
  const { isAuthenticated, loading } = useAuth();
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);

  const switchToSignUp = () => { setIsSignInOpen(false); setIsSignUpOpen(true); };
  const switchToSignIn = () => { setIsSignUpOpen(false); setIsSignInOpen(true); };

  if (loading || isAuthenticated) return null;

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-6 bg-transparent">
        {/* Left: Logo */}
        <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <Image src="/logo.png" alt="ModelGrow" width={28} height={28} className="object-contain" />
          <span className="text-white font-semibold text-base tracking-tight">
            ModelGrow<span className="text-purple-400">.</span>
          </span>
        </Link>

        {/* Center: Legal links */}
        <div className="hidden md:flex items-center gap-1">
          <Link href="/privacy" className="px-4 py-1.5 text-sm text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-all">
            Privacy
          </Link>
          <Link href="/terms" className="px-4 py-1.5 text-sm text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-all">
            Terms
          </Link>
          <Link href="/refund" className="px-4 py-1.5 text-sm text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-all">
            Refund
          </Link>
        </div>

        {/* Right: Auth buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSignInOpen(true)}
            className="px-4 py-1.5 text-sm text-gray-300 hover:text-white rounded-lg hover:bg-white/5 transition-all"
          >
            Sign in
          </button>
          <button
            onClick={() => setIsSignUpOpen(true)}
            className="px-4 py-1.5 text-sm font-medium text-white bg-purple-600 hover:bg-purple-500 rounded-lg transition-all"
          >
            Sign up
          </button>
        </div>
      </nav>

      <SignInDialog isOpen={isSignInOpen} onClose={() => setIsSignInOpen(false)} onSwitchToSignUp={switchToSignUp} />
      <SignUpDialog isOpen={isSignUpOpen} onClose={() => setIsSignUpOpen(false)} onSwitchToSignIn={switchToSignIn} />
    </>
  );
}
