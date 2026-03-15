'use client';

import { FaChevronLeft } from 'react-icons/fa';
import { useSidebar } from '@/lib/contexts/sidebar-context';
import { useThemeAdaptive } from '@/lib/contexts/theme-adaptive-context';

export default function SidebarCollapseButton() {
  const { setIsExpanded } = useSidebar();
  const { isDarkMode } = useThemeAdaptive();

  return (
    <div className={`border-t p-3 ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
      <button
        onClick={() => setIsExpanded(false)}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
          isDarkMode
            ? 'text-gray-400 hover:text-white hover:bg-white/8'
            : 'text-gray-400 hover:text-gray-700 hover:bg-black/5'
        }`}
      >
        <FaChevronLeft className="w-4 h-4" />
        <span className="text-sm">Collapse</span>
      </button>
    </div>
  );
}
