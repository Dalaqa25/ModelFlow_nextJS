'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth/supabase-auth-context';
import { useSidebar } from '@/lib/contexts/sidebar-context';
import SidebarToggle from './actions/SidebarToggle';
import SidebarNavIcons from './SidebarNavIcons';
import SidebarUploadIcon from './SidebarUploadIcon';
import SidebarConversationIcon from './SidebarConversationIcon';
import SidebarExpandButton from './actions/SidebarExpandButton';
import SidebarCollapseButton from './actions/SidebarCollapseButton';
import UploadTooltip from './UploadTooltip';
import SidebarConversationList from './SidebarConversationList';

import { useThemeAdaptive } from '@/lib/contexts/theme-adaptive-context';

export default function Sidebar() {
  const { isExpanded, setIsExpanded } = useSidebar();
  const { isDarkMode } = useThemeAdaptive();
  const [showConversations, setShowConversations] = useState(false);

  const handleConversationIconClick = () => {
    setShowConversations(true);
    setIsExpanded(true); // Expand sidebar to show conversations
  };

  const handleBackToNav = () => {
    setShowConversations(false);
  };

  return (
    <>
      <div 
        className={`fixed left-0 top-0 bottom-0 z-40 flex flex-col transition-all duration-300 border-r border-purple-500/20 ${
          isExpanded 
            ? `w-64 ${isDarkMode ? 'bg-slate-800/70 backdrop-blur-xl' : 'bg-white'}`
            : 'w-14 bg-transparent'
        }`}
      >
        <SidebarToggle />

        {isExpanded && showConversations ? (
          // Show conversation list when expanded and conversations mode is active
          <SidebarConversationList onBack={handleBackToNav} />
        ) : (
          // Show normal navigation
          <div className="flex-1 flex flex-col">
            <SidebarNavIcons />
            <div className={`flex flex-col gap-2 ${isExpanded ? 'px-3' : 'items-center'}`}>
              <SidebarUploadIcon />
              <SidebarConversationIcon onOpenConversations={handleConversationIconClick} />
            </div>
          </div>
        )}

        {isExpanded ? <SidebarCollapseButton /> : <SidebarExpandButton />}
      </div>
      
      <UploadTooltip />
    </>
  );
}
