'use client';
import { usePathname } from 'next/navigation';
import { createContext, useContext, useEffect, useState } from 'react';
import { useThemeAdaptive } from '@/lib/contexts/theme-adaptive-context';

const SplashContext = createContext({ loading: false });

export function SplashProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (!hasMounted) {
    // Prevent rendering until after mount, so SSR and client match
    return null;
  }

  return (
    <SplashContext.Provider value={{ loading }}>
      {loading ? <SplashScreen /> : children}
    </SplashContext.Provider>
  );
}

function SplashScreen() {
  // Use shared theme context
  const { isDarkMode } = useThemeAdaptive();

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
      <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center backdrop-blur-sm min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="flex-1 flex flex-col justify-center items-center w-full">
          <img
            src="/3dcube.png"
            alt="ModelFlow Logo"
            className="w-56 h-56 object-contain mb-8 animate-[popIn_0.7s_ease]"
          />
        </div>
        <div className="w-full flex justify-center pb-8">
          <span className={`text-sm tracking-wide ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Powered by Dalaqa</span>
        </div>
      </div>
    </>
  );
}