'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/supabase-auth-context';
import { useEffect, useState } from 'react';
import SignInDialog from './auth/login/SignInDialog';
import SignUpDialog from './auth/signup/SignUpDialog';
import { ArrowUpRight, Menu, X } from 'lucide-react';

export default function PublicNavbar() {
  const { isAuthenticated, loading } = useAuth();
  const pathname = usePathname();
  const isImmersiveHome = pathname === '/' || pathname === '/developers';
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const switchToSignUp = () => { setIsSignInOpen(false); setIsSignUpOpen(true); };
  const switchToSignIn = () => { setIsSignUpOpen(false); setIsSignInOpen(true); };

  useEffect(() => {
    const openSignIn = () => setIsSignInOpen(true);
    const openSignUp = () => setIsSignUpOpen(true);

    window.addEventListener('modelgrow:open-signin', openSignIn);
    window.addEventListener('modelgrow:open-signup', openSignUp);
    return () => {
      window.removeEventListener('modelgrow:open-signin', openSignIn);
      window.removeEventListener('modelgrow:open-signup', openSignUp);
    };
  }, []);

  useEffect(() => {
    const updateNavbarTone = () => setIsScrolled(window.scrollY > 560);
    updateNavbarTone();
    window.addEventListener('scroll', updateNavbarTone, { passive: true });
    return () => window.removeEventListener('scroll', updateNavbarTone);
  }, []);

  if (loading || (isAuthenticated && pathname !== '/')) return null;

  const isAuthenticatedHome = isAuthenticated && pathname === '/';
  const useDarkNav = isImmersiveHome && !isScrolled;

  return (
    <>
      <header className={`marketing-nav marketing-nav--floating fixed inset-x-0 top-0 z-[100] border-b ${isScrolled ? 'marketing-nav--lifted backdrop-blur-2xl' : 'backdrop-blur-xl'} ${useDarkNav ? 'border-white/10 bg-[#10184a]/45' : 'marketing-nav--light border-[#17203a]/8 bg-[#fbfaf7]/92'}`}>
        <nav className="mx-auto flex h-[76px] max-w-[1240px] items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5" aria-label="ModelGrow home">
            <Image src="/logo.png" alt="" width={34} height={34} className="object-contain" priority />
            <span className={`text-[18px] font-black tracking-[-0.035em] ${useDarkNav ? 'text-white' : 'text-[#12182b]'}`}>ModelGrow</span>
          </Link>

          <div className={`hidden items-center gap-7 text-sm font-bold lg:flex ${useDarkNav ? 'text-white/75' : 'text-[#596176]'}`}>
            <Link href="/#how-it-works" className={`transition-colors ${useDarkNav ? 'hover:text-white' : 'hover:text-[#12182b]'}`}>How it works</Link>
            <Link href="/#use-cases" className={`transition-colors ${useDarkNav ? 'hover:text-white' : 'hover:text-[#12182b]'}`}>Use cases</Link>
            <Link href="/explore" className={`transition-colors ${useDarkNav ? 'hover:text-white' : 'hover:text-[#12182b]'}`}>Automations</Link>
            <Link href="/pricing" className={`transition-colors ${useDarkNav ? 'hover:text-white' : 'hover:text-[#12182b]'}`}>Pricing</Link>
            <span className={`h-4 w-px ${useDarkNav ? 'bg-white/20' : 'bg-[#17203a]/12'}`} />
            <Link href="/developers" className={`inline-flex items-center gap-1 transition-colors ${useDarkNav ? 'hover:text-white' : 'hover:text-[#12182b]'}`}>
              For developers
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="hidden items-center gap-2 sm:flex">
            {isAuthenticatedHome ? (
              <Link href="/main" className={`rounded-full px-5 py-2.5 text-sm font-extrabold shadow-[0_8px_24px_rgba(21,26,45,0.16)] transition-all hover:-translate-y-0.5 ${useDarkNav ? 'bg-white text-[#171c30] hover:bg-[#f3efff]' : 'marketing-primary-button bg-[#151a2d] text-white hover:bg-[#252b46]'}`}>
                Open workspace
              </Link>
            ) : (
              <>
                <button
                  onClick={() => setIsSignInOpen(true)}
                  className={`rounded-full px-4 py-2.5 text-sm font-extrabold transition-colors ${useDarkNav ? 'text-white hover:bg-white/10' : 'text-[#343b50] hover:bg-[#17203a]/5'}`}
                >
                  Log in
                </button>
                <button
                  onClick={() => setIsSignUpOpen(true)}
                  className={`rounded-full px-5 py-2.5 text-sm font-extrabold shadow-[0_8px_24px_rgba(21,26,45,0.16)] transition-all hover:-translate-y-0.5 ${useDarkNav ? 'bg-white text-[#171c30] hover:bg-[#f3efff]' : 'marketing-primary-button bg-[#151a2d] text-white hover:bg-[#252b46]'}`}
                >
                  Get started
                </button>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            className={`flex h-10 w-10 items-center justify-center rounded-full border sm:hidden ${useDarkNav ? 'border-white/20 text-white' : 'border-[#17203a]/10 text-[#12182b]'}`}
            aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>

        {isMenuOpen && (
          <div className={`border-t px-5 py-5 sm:hidden ${useDarkNav ? 'border-white/10 bg-[#11194b]' : 'border-[#17203a]/8 bg-[#fbfaf7]'}`}>
            <div className={`mx-auto grid max-w-[1240px] gap-1 text-sm font-bold ${useDarkNav ? 'text-white/85' : 'text-[#343b50]'}`}>
              <Link href="/#how-it-works" onClick={() => setIsMenuOpen(false)} className="rounded-xl px-3 py-3 hover:bg-white/10">How it works</Link>
              <Link href="/#use-cases" onClick={() => setIsMenuOpen(false)} className="rounded-xl px-3 py-3 hover:bg-white/10">Use cases</Link>
              <Link href="/explore" onClick={() => setIsMenuOpen(false)} className="rounded-xl px-3 py-3 hover:bg-white/10">Automations</Link>
              <Link href="/pricing" onClick={() => setIsMenuOpen(false)} className="rounded-xl px-3 py-3 hover:bg-white/10">Pricing</Link>
              <Link href="/developers" onClick={() => setIsMenuOpen(false)} className="rounded-xl px-3 py-3 hover:bg-white/10">For developers</Link>
              <div className={`mt-3 grid grid-cols-2 gap-2 border-t pt-4 ${useDarkNav ? 'border-white/10' : 'border-[#17203a]/8'}`}>
                {isAuthenticatedHome ? (
                  <Link href="/main" onClick={() => setIsMenuOpen(false)} className={`col-span-2 rounded-full px-4 py-3 text-center font-extrabold ${useDarkNav ? 'bg-white text-[#171c30]' : 'marketing-primary-button bg-[#151a2d] text-white'}`}>Open workspace</Link>
                ) : (
                  <>
                    <button onClick={() => { setIsMenuOpen(false); setIsSignInOpen(true); }} className={`rounded-full border px-4 py-3 font-extrabold ${useDarkNav ? 'border-white/20 text-white' : 'border-[#17203a]/12'}`}>Log in</button>
                    <button onClick={() => { setIsMenuOpen(false); setIsSignUpOpen(true); }} className={`rounded-full px-4 py-3 font-extrabold ${useDarkNav ? 'bg-white text-[#171c30]' : 'marketing-primary-button bg-[#151a2d] text-white'}`}>Get started</button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      <SignInDialog isOpen={isSignInOpen} onClose={() => setIsSignInOpen(false)} onSwitchToSignUp={switchToSignUp} />
      <SignUpDialog isOpen={isSignUpOpen} onClose={() => setIsSignUpOpen(false)} onSwitchToSignIn={switchToSignIn} />
    </>
  );
}
