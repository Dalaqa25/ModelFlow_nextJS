'use client';

import { FaComments } from 'react-icons/fa';
import { useSidebar } from '@/lib/contexts/sidebar-context';
import { useThemeAdaptive } from '@/lib/contexts/theme-adaptive-context';

export default function SidebarConversationIcon({ isMobileExpanded = false, onOpenConversations }) {
  const { isExpanded } = useSidebar();
  const { isDarkMode } = useThemeAdaptive();
  const showLabel = isExpanded || isMobileExpanded;

  return (
    <button
      onClick={onOpenConversations}
      className={`flex items-center gap-3 rounded-lg transition-colors ${
        isDarkMode
          ? 'text-gray-400 hover:text-white hover:bg-white/8'
          : 'text-gray-500 hover:text-gray-900 hover:bg-black/5'
      } ${showLabel ? 'w-full px-3 py-2' : 'w-8 h-8 justify-center'}`}
      title="Conversations"
    >
      <FaComments className="w-4 h-4 flex-shrink-0" />
      {showLabel && <span className="text-sm">Conversations</span>}
    </button>
  );
}
