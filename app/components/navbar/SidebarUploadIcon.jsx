'use client';

import { useState } from 'react';
import { FaUpload } from 'react-icons/fa';
import { useSidebar } from '@/lib/sidebar-context';
import AutomationUpload from '@/app/components/model/modelupload/automation/AutomationUpload';
import { toast } from 'react-hot-toast';

export default function SidebarUploadIcon() {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const { isExpanded } = useSidebar();

  return (
    <>
      <button
        onClick={() => setShowUploadDialog(true)}
        className={`flex items-center gap-3 rounded-lg hover:bg-slate-800/60 transition-colors text-gray-400 hover:text-white ${
          isExpanded ? 'w-full px-3 py-2' : 'w-8 h-8 justify-center mx-auto'
        }`}
        title="Upload Automation"
      >
        <FaUpload className="w-4 h-4" />
        {isExpanded && <span className="text-sm">Upload</span>}
      </button>

      <AutomationUpload
        isOpen={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
        onUploadSuccess={() => {
          setShowUploadDialog(false);
          toast.success('Automation uploaded successfully');
        }}
      />
    </>
  );
}
