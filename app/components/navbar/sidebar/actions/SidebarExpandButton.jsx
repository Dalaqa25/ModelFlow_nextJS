'use client';

import { FaChevronRight } from 'react-icons/fa';
import { useSidebar } from '@/lib/sidebar-context';

export default function SidebarExpandButton() {
  const { setIsExpanded } = useSidebar();

  return (
    <div className="border-t border-purple-500/20 pt-2 pb-2">
      <button
        onClick={() => setIsExpanded(true)}
        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-800/60 transition-colors text-gray-400 hover:text-white mx-auto"
        title="Expand Sidebar"
      >
        <FaChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
