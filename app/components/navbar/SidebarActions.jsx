'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/supabase-auth-context';
import { FaCog, FaSignOutAlt } from 'react-icons/fa';

export default function SidebarActions() {
  const router = useRouter();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="border-t border-purple-500/20 p-3 space-y-1">
      <button
        onClick={() => router.push('/dashboard')}
        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800/60 transition-colors text-gray-300 text-sm"
      >
        <FaCog className="w-4 h-4" />
        <span>Dashboard</span>
      </button>
      <button
        onClick={handleSignOut}
        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800/60 transition-colors text-gray-300 text-sm"
      >
        <FaSignOutAlt className="w-4 h-4" />
        <span>Sign Out</span>
      </button>
    </div>
  );
}
