'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useSidebar } from '@/lib/contexts/sidebar-context';
import { FiChevronsLeft } from 'react-icons/fi';

export default function SidebarToggle() {
  const { isExpanded, setIsExpanded } = useSidebar();
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
        <span className="text-sm font-semibold tracking-tight text-[var(--landing-ink)]">
          ModelGrow
        </span>
        <span className="text-xs font-semibold px-1.5 py-0.5 rounded-md bg-[var(--landing-yellow)]/25 text-[var(--landing-accent)]">beta</span>
      </button>

      <button
        onClick={() => setIsExpanded(false)}
        className="sidebar-nav-button p-1.5 rounded-lg transition-colors focus:outline-none"
        aria-label="Collapse sidebar"
      >
        <FiChevronsLeft className="w-4 h-4" />
      </button>
    </div>
  );
}
