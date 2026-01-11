'use client';

import { FaChevronLeft } from 'react-icons/fa';
import { useSidebar } from '@/lib/contexts/sidebar-context';

export default function SidebarCollapseButton() {
  const { setIsExpanded } = useSidebar();

  return (
    <div className="border-t border-purple-500/20 p-3">
      <button
        onClick={() => setIsExpanded(false)}
        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800/60 transition-colors text-gray-400 hover:text-white"
      >
        <FaChevronLeft className="w-4 h-4" />
        <span className="text-sm">Collapse</span>
      </button>
    </div>
  );
}
