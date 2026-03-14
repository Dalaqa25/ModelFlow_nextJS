'use client';

import { useState, useEffect } from 'react';
import { FaUpload } from 'react-icons/fa';
import { useSidebar } from '@/lib/contexts/sidebar-context';
import { useThemeAdaptive } from '@/lib/contexts/theme-adaptive-context';
import AutomationUpload from '@/app/components/automationUpload/AutomationUpload';

const UPLOAD_SEEN_KEY = 'upload_button_seen';

export default function SidebarUploadIcon({ isMobileExpanded = false }) {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showAttention, setShowAttention] = useState(false);
  const { isExpanded } = useSidebar();
  const { isDarkMode } = useThemeAdaptive();
  const showLabel = isExpanded || isMobileExpanded;

  useEffect(() => {
    const hasSeen = localStorage.getItem(UPLOAD_SEEN_KEY);
    if (!hasSeen) setShowAttention(true);
  }, []);

  const handleClick = () => {
    if (showAttention) {
      localStorage.setItem(UPLOAD_SEEN_KEY, 'true');
      setShowAttention(false);
    }
    setShowUploadDialog(true);
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={handleClick}
          className={`flex items-center gap-3 rounded-lg transition-colors ${
            showLabel ? 'w-full px-3 py-2' : 'w-8 h-8 justify-center mx-auto'
          } ${showAttention ? 'upload-attention text-purple-400' : `text-gray-400 ${isDarkMode ? 'hover:text-white hover:bg-white/8' : 'hover:text-gray-900 hover:bg-black/5'}`}`}
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
