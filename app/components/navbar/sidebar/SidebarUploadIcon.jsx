'use client';

import { useState, useEffect } from 'react';
import { FaUpload } from 'react-icons/fa';
import { useSidebar } from '@/lib/contexts/sidebar-context';
import AutomationUpload from '@/app/components/automationUpload/AutomationUpload';
import { toast } from 'react-hot-toast';

const UPLOAD_SEEN_KEY = 'upload_button_seen';

export default function SidebarUploadIcon({ isMobileExpanded = false }) {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showAttention, setShowAttention] = useState(false);
  const { isExpanded } = useSidebar();
  
  const showLabel = isExpanded || isMobileExpanded;

  useEffect(() => {
    // Check if user has already seen/clicked the upload button
    const hasSeen = localStorage.getItem(UPLOAD_SEEN_KEY);
    if (!hasSeen) {
      setShowAttention(true);
    }
  }, []);

  const handleClick = () => {
    // Mark as seen and stop the animation
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
          className={`flex items-center gap-3 rounded-lg transition-colors text-gray-400 hover:text-white ${
            showLabel ? 'w-full px-3 py-2' : 'w-8 h-8 justify-center mx-auto'
          } ${showAttention ? 'upload-attention' : 'hover:bg-slate-800/60'}`}
          title="Upload Automation"
        >
          <FaUpload className={`w-4 h-4 ${showAttention ? 'text-purple-400' : ''}`} />
          {showLabel && <span className="text-sm">Upload</span>}
        </button>
      </div>

      <AutomationUpload
        isOpen={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
        onUploadSuccess={() => {
          setShowUploadDialog(false);
          // Toast already shown in AutomationUpload component
        }}
      />
    </>
  );
}
