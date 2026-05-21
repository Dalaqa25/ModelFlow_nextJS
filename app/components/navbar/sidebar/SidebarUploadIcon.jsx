'use client';

import { useState } from 'react';
import { Upload } from 'lucide-react';
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
      <button
        onClick={() => setShowUploadDialog(true)}
        className={`flex items-center rounded-lg transition-colors ${
          isDarkMode
            ? 'text-gray-400 hover:text-white hover:bg-white/8'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
        } ${showLabel
          ? 'w-full gap-3 px-3 py-2'
          : 'w-10 h-10 justify-center'
        }`}
        title="Upload Automation"
      >
        <Upload className="w-[18px] h-[18px] flex-shrink-0" strokeWidth={1.75} />
        {showLabel && (
          <span className="text-sm whitespace-nowrap">Upload</span>
        )}
      </button>

      <AutomationUpload
        isOpen={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
        onUploadSuccess={() => setShowUploadDialog(false)}
      />
    </>
  );
}
