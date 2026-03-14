'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useSidebar } from '@/lib/contexts/sidebar-context';
import { useThemeAdaptive } from '@/lib/contexts/theme-adaptive-context';
import { FiChevronsLeft } from 'react-icons/fi';

export default function SidebarToggle() {
  const { isExpanded, setIsExpanded } = useSidebar();
  const { isDarkMode } = useThemeAdaptive();
  const router = useRouter();

  if (!isExpanded) {
    return (
      <div className="flex items-center justify-center h-14 px-2">
        <button
          onClick={() => setIsExpanded(true)}
          className="focus:outline-none"
          aria-label="Expand sidebar"
        >
          <Image src="/logo.png" alt="Logo" width={28} height={28} className="flex-shrink-0" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between h-14 px-3">
      <button
        onClick={() => router.push('/')}
        className="flex items-center gap-2 focus:outline-none"
      >
        <Image src="/logo.png" alt="Logo" width={28} height={28} className="flex-shrink-0" />
        <span className={`text-sm font-semibold tracking-tight ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
          ModelGrow
        </span>
        <span className="text-xs font-medium px-1.5 py-0.5 rounded-md bg-purple-500/20 text-purple-400">beta</span>
      </button>

      <button
        onClick={() => setIsExpanded(false)}
        className={`p-1.5 rounded-lg transition-colors focus:outline-none ${
          isDarkMode
            ? 'text-gray-400 hover:text-white hover:bg-white/8'
            : 'text-gray-400 hover:text-gray-700 hover:bg-black/5'
        }`}
        aria-label="Collapse sidebar"
      >
        <FiChevronsLeft className="w-4 h-4" />
      </button>
    </div>
  );
}
