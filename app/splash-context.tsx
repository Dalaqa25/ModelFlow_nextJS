// app/splash-context.tsx
'use client';
import { usePathname } from 'next/navigation';
import { createContext, useContext, useEffect, useState } from 'react';

const SplashContext = createContext({ loading: false });

export function SplashProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const seenSplash = localStorage.getItem('seenSplash');
    if (!seenSplash) {
      setLoading(true);
      localStorage.setItem('seenSplash', 'true');
      const timer = setTimeout(() => setLoading(false), 2000);
      return () => clearTimeout(timer);
    } else {
      setLoading(false);
    }
  }, []);

  return (
    <SplashContext.Provider value={{ loading }}>
      {loading ? <SplashScreen /> : children}
    </SplashContext.Provider>
  );
}

function SplashScreen() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mb-6">
        <svg className="animate-spin h-12 w-12 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-30" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      </div>
      <h1 className="text-3xl font-extrabold text-white drop-shadow-lg tracking-wide animate-pulse">
        Loading ModelFlow...
      </h1>
    </div>
  );
}