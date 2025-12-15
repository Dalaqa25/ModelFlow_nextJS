'use client';

import { useAuth } from '@/lib/supabase-auth-context';
import { useSidebar } from '@/lib/sidebar-context';
import SidebarToggle from './SidebarToggle';
import NewChatButton from './NewChatButton';
import ChatHistory from './ChatHistory';
import SidebarActions from './SidebarActions';
import SidebarNavIcons from './SidebarNavIcons';

export default function Sidebar() {
  const { isAuthenticated } = useAuth();
  const { isExpanded } = useSidebar();

  // Only show for authenticated users
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div 
      className={`fixed left-0 top-0 bottom-0 z-40 flex flex-col transition-all duration-300 border-r border-purple-500/20 ${
        isExpanded 
          ? 'w-64 bg-slate-900/95 backdrop-blur-sm' 
          : 'w-13 bg-transparent'
      }`}
    >
      <SidebarToggle />

      {isExpanded ? (
        <>
          <NewChatButton />
          <ChatHistory />
          <SidebarActions />
        </>
      ) : (
        <SidebarNavIcons />
      )}
    </div>
  );
}
