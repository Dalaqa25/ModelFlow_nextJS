'use client';

import { useState } from 'react';
import { FaUpload } from 'react-icons/fa';
import { useSidebar } from '@/lib/contexts/sidebar-context';
import { useThemeAdaptive } from '@/lib/contexts/theme-adaptive-context';
import AutomationUpload from '@/app/components/automationUpload/AutomationUpload';

export default function SidebarUploadIcon({ isMobileExpanded = false }) {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const { isExpanded } = useSidebar();
  const { isDarkMode } = useThemeAdaptive();
  const showLabel = isExpanded || isMobileExpanded;

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setShowUploadDialog(true)}
          className={`flex items-center gap-3 rounded-lg transition-colors ${
            showLabel ? 'w-full px-3 py-2' : 'w-full h-8 justify-center'
          } text-gray-400 ${isDarkMode ? 'hover:text-white hover:bg-white/8' : 'hover:text-gray-900 hover:bg-black/5'}`}
          title="Upload Automation"
        >
          <FaUpload className="w-4 h-4 flex-shrink-0" />
          <span className={`text-sm whitespace-nowrap overflow-hidden transition-all duration-200 ${
            showLabel ? 'opacity-100 max-w-[160px]' : 'opacity-0 max-w-0'
          }`}>Upload</span>
        </button>
      </div>

      <AutomationUpload
        isOpen={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
        onUploadSuccess={() => setShowUploadDialog(false)}
      />
    </>
  );
}
