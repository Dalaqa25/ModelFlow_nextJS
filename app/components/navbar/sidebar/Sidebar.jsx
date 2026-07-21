'use client';

import { useSidebar } from '@/lib/contexts/sidebar-context';
import SidebarToggle from './actions/SidebarToggle';
import SidebarNavIcons from './SidebarNavIcons';
import SidebarUploadIcon from './SidebarUploadIcon';
import SidebarRecents from './SidebarRecents';
import SidebarExpandButton from './actions/SidebarExpandButton';
import SidebarCollapseButton from './actions/SidebarCollapseButton';
import UploadTooltip from './UploadTooltip';

export default function Sidebar({ tone = 'workspace' }) {
  const { isExpanded } = useSidebar();

  return (
    <>
      <div 
        className={`fixed left-0 top-0 bottom-0 z-40 flex flex-col transition-all duration-300 border-r app-sidebar app-shell-${tone} ${
          isExpanded 
            ? 'w-64'
            : 'w-14 app-sidebar-collapsed'
        }`}
      >
        <SidebarToggle />

        <div className="flex-1 flex flex-col min-h-0">
          <SidebarNavIcons />
          <div className={`${isExpanded ? 'px-3' : 'flex flex-col items-center gap-1'}`}>
            <SidebarUploadIcon />
          </div>

          {/* ChatGPT-style recents — only when expanded */}
          {isExpanded && <SidebarRecents />}
        </div>

        {isExpanded ? <SidebarCollapseButton /> : <SidebarExpandButton />}
      </div>
      
      <UploadTooltip />
    </>
  );
}
