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
      <nav className="absolute top-0 left-0 right-0 z-50 h-20 flex items-center justify-between px-5 sm:px-10 bg-transparent">
        {/* Left: Logo */}
        <Link href="/" className="landing-card-soft flex items-center gap-2.5 rounded-2xl px-3 py-2 hover:-translate-y-0.5 transition-all">
          <Image src="/logo.png" alt="ModelGrow" width={30} height={30} className="object-contain" />
          <span className="text-[var(--landing-ink)] font-black text-lg tracking-tight">
            ModelGrow
          </span>
        </Link>

        {/* Center: Legal links (hidden on very small screens to keep Scrimba style clean) */}
        <div className="landing-card-soft hidden md:flex items-center gap-1 rounded-2xl px-2 py-1.5 text-sm font-bold">
          <Link href="/privacy" className="landing-copy hover:text-[var(--landing-ink)] transition-colors px-3 py-1.5 rounded-xl hover:bg-white/30">
            Privacy
          </Link>
          <Link href="/terms" className="landing-copy hover:text-[var(--landing-ink)] transition-colors px-3 py-1.5 rounded-xl hover:bg-white/30">
            Terms
          </Link>
          <Link href="/refund" className="landing-copy hover:text-[var(--landing-ink)] transition-colors px-3 py-1.5 rounded-xl hover:bg-white/30">
            Refund
          </Link>
        </div>

        {/* Right: Auth buttons */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => setIsSignInOpen(true)}
            className="auth-link-button rounded-lg px-4 py-2 text-sm font-black transition-all"
          >
            Sign In
          </button>
          <button
            onClick={() => setIsSignUpOpen(true)}
            className="auth-primary-button rounded-lg px-5 py-2.5 text-sm font-black transition-all"
          >
            Start Building
          </button>
        </div>
      </nav>

      <SignInDialog isOpen={isSignInOpen} onClose={() => setIsSignInOpen(false)} onSwitchToSignUp={switchToSignUp} />
      <SignUpDialog isOpen={isSignUpOpen} onClose={() => setIsSignUpOpen(false)} onSwitchToSignIn={switchToSignIn} />
    </>
  );
}
