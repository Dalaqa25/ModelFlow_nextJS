'use client';

import { useAuth } from '@/lib/supabase-auth-context';
import { useSidebar } from '@/lib/sidebar-context';
import SidebarToggle from './actions/SidebarToggle';
import SidebarNavIcons from './SidebarNavIcons';
import SidebarUploadIcon from './SidebarUploadIcon';
import SidebarExpandButton from './actions/SidebarExpandButton';
import SidebarCollapseButton from './actions/SidebarCollapseButton';
import UploadTooltip from './UploadTooltip';

export default function Sidebar() {
  const { isAuthenticated } = useAuth();
  const { isExpanded } = useSidebar();

  // Only show for authenticated users
  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <div 
        className={`fixed left-0 top-0 bottom-0 z-40 flex flex-col transition-all duration-300 border-r border-purple-500/20 ${
          isExpanded 
            ? 'w-48 bg-slate-900/60 backdrop-blur-sm' 
            : 'w-13 bg-transparent'
        }`}
      >
        <SidebarToggle />

        <div className="flex-1 flex flex-col">
          <SidebarNavIcons />
          <div className={isExpanded ? 'px-3 pb-3' : 'pb-3'}>
            <SidebarUploadIcon />
          </div>
        </div>

        {isExpanded ? <SidebarCollapseButton /> : <SidebarExpandButton />}
      </div>
      
      <UploadTooltip />
    </>
  );
}
