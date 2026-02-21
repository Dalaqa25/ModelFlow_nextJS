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

export default function Sidebar() {
  const { isAuthenticated } = useAuth();
  const { isExpanded, setIsExpanded } = useSidebar();
  const [showConversations, setShowConversations] = useState(false);

  // Only show for authenticated users
  if (!isAuthenticated) {
    return null;
  }

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
            ? 'w-64 bg-slate-900/60 backdrop-blur-sm' 
            : 'w-13 bg-transparent'
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
