'use client';

import { useSidebar } from '@/lib/contexts/sidebar-context';
import SidebarToggle from './actions/SidebarToggle';
import SidebarNavIcons from './SidebarNavIcons';
import SidebarUploadIcon from './SidebarUploadIcon';
import SidebarRecents from './SidebarRecents';
import SidebarExpandButton from './actions/SidebarExpandButton';
import SidebarCollapseButton from './actions/SidebarCollapseButton';
import UploadTooltip from './UploadTooltip';

import { useThemeAdaptive } from '@/lib/contexts/theme-adaptive-context';

export default function Sidebar() {
  const { isExpanded } = useSidebar();
  const { isDarkMode } = useThemeAdaptive();

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
