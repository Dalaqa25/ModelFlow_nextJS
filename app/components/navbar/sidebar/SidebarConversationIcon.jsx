'use client';

import { FaComments } from 'react-icons/fa';
import { useSidebar } from '@/lib/contexts/sidebar-context';

export default function SidebarConversationIcon({ isMobileExpanded = false, onOpenConversations }) {
  const { isExpanded } = useSidebar();
  const showLabel = isExpanded || isMobileExpanded;

  return (
    <button
      onClick={onOpenConversations}
      className={`flex items-center gap-3 rounded-lg hover:bg-slate-800/60 transition-colors text-gray-400 hover:text-white ${
        showLabel ? 'w-full px-3 py-2' : 'w-8 h-8 justify-center'
      }`}
      title="Conversations"
    >
      <FaComments className="w-4 h-4" />
      {showLabel && <span className="text-sm">Conversations</span>}
    </button>
  );
}
