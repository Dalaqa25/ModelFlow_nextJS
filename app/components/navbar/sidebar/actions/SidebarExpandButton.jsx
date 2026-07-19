'use client';

import { FaChevronRight } from 'react-icons/fa';
import { useSidebar } from '@/lib/contexts/sidebar-context';

export default function SidebarExpandButton() {
  const { setIsExpanded } = useSidebar();

  return (
    <div className="border-t border-[var(--landing-border)] pt-2 pb-2">
      <button
        onClick={() => setIsExpanded(true)}
        className="sidebar-nav-button w-full h-8 flex items-center justify-center rounded-lg transition-colors mx-auto"
        title="Expand Sidebar"
      >
        <FaChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
