'use client';

import { FaChevronRight } from 'react-icons/fa';
import { useSidebar } from '@/lib/contexts/sidebar-context';
import { useThemeAdaptive } from '@/lib/contexts/theme-adaptive-context';

export default function SidebarExpandButton() {
  const { setIsExpanded } = useSidebar();
  const { isDarkMode } = useThemeAdaptive();

  return (
    <div className="border-t border-purple-500/20 pt-2 pb-2">
      <button
        onClick={() => setIsExpanded(true)}
        className={`w-full h-8 flex items-center justify-center rounded-lg transition-colors mx-auto ${
          isDarkMode
            ? 'text-gray-400 hover:text-white hover:bg-white/8'
            : 'text-gray-500 hover:text-gray-900 hover:bg-black/5'
        }`}
        title="Expand Sidebar"
      >
        <FaChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
