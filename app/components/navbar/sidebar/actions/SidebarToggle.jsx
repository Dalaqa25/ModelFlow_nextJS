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
      <div className="workspace-sidebar-header flex items-center justify-center h-14 px-2">
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
    <div className="workspace-sidebar-header flex items-center justify-between h-14 px-3">
      <button
        onClick={() => router.push('/')}
        className="flex items-center gap-2 focus:outline-none"
      >
        <Image src="/logo.png" alt="Logo" width={28} height={28} className="flex-shrink-0" />
        <span className="workspace-brand-name text-sm font-black tracking-tight">
          ModelGrow
        </span>
        <span className="workspace-beta-badge text-[10px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-[0.08em]">beta</span>
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
