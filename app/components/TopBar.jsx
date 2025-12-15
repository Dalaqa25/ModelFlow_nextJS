'use client';

import { useAuth } from '@/lib/supabase-auth-context';
import { useRouter } from 'next/navigation';
import { FaUser } from 'react-icons/fa';

export default function TopBar() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  // Only show for authenticated users
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 h-14 bg-transparent border-none border-purple-500/20 z-50 flex items-center justify-between px-4">
      {/* Left: Model Selector */}
      <div className="flex items-center gap-2">
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-800/60 transition-colors text-white">
          <span className="text-lg font-medium">ModelGrow</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Right: User Profile */}
      <div className="relative">
        <button
          onClick={() => router.push('/profile')}
          className="w-8 h-8 rounded-full bg-slate-700/60 hover:bg-slate-600/60 transition-colors flex items-center justify-center text-white border border-purple-500/30"
        >
          <FaUser className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
