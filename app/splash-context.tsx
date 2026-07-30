'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/supabase-auth-context';
import { useThemeAdaptive } from '@/lib/contexts/theme-adaptive-context';

const SplashContext = createContext({ loading: false });

// Marketing pages must never sit behind the splash. The splash exists to wait
// for auth and theme before painting the signed-in shell; a visitor landing on
// the homepage has nothing to wait for, and holding the page back means the
// hero is not server-rendered at all — so search engines and first-time
// visitors get a logo on a gradient instead of the product.
const MARKETING_ROUTES = ['/', '/developers', '/pricing'];

export function SplashProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMarketingRoute = MARKETING_ROUTES.includes(pathname);
  const { loading: authLoading } = useAuth() as { loading: boolean };
  const { mounted: themeMounted } = useThemeAdaptive();
  const [hasMounted, setHasMounted] = useState(false);
  const [minimumElapsed, setMinimumElapsed] = useState(false);
  const [documentReady, setDocumentReady] = useState(false);

  useEffect(() => {
    setHasMounted(true);

    const minimumTimer = window.setTimeout(() => setMinimumElapsed(true), 500);
    const readyFallback = window.setTimeout(() => setDocumentReady(true), 2500);
    const markReady = () => {
      // Wait for two paints so the authenticated shell is actually styled before
      // replacing the splash screen.
      requestAnimationFrame(() => requestAnimationFrame(() => setDocumentReady(true)));
    };

    if (document.readyState === 'complete') {
      markReady();
    } else {
      window.addEventListener('load', markReady, { once: true });
    }

    return () => {
      window.clearTimeout(minimumTimer);
      window.clearTimeout(readyFallback);
      window.removeEventListener('load', markReady);
    };
  }, []);

  const loading =
    !isMarketingRoute &&
    (!hasMounted || !themeMounted || authLoading || !minimumElapsed || !documentReady);

  return (
    <SplashContext.Provider value={{ loading }}>
      {loading ? <SplashScreen /> : children}
    </SplashContext.Provider>
  );
}

function SplashScreen() {
  // Add animation using Tailwind and a custom keyframes style
  return (
    <>
      <style jsx global>{`
        @keyframes popIn {
          0% { transform: scale(0.7); opacity: 0; }
          80% { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
      <div className="modelgrow-splash fixed inset-0 z-[100] flex min-h-screen flex-col items-center justify-center">
        <div className="flex-1 flex flex-col justify-center items-center w-full">
          <img
            src="/3dcube.png"
            alt="ModelGrow Logo"
            className="w-56 h-56 object-contain mb-8 animate-[popIn_0.7s_ease]"
          />
        </div>
        <div className="w-full flex justify-center pb-8">
          <span className="modelgrow-splash-credit text-sm tracking-wide">Powered by Dalaqa</span>
        </div>
      </div>
    </>
  );
}
