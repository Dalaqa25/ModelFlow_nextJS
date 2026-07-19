'use client';

import { useState } from 'react';
import { Upload } from 'lucide-react';
import { useSidebar } from '@/lib/contexts/sidebar-context';
import AutomationUpload from '@/app/components/automationUpload/AutomationUpload';
import UploadChoiceModal from '@/app/components/automationUpload/UploadChoiceModal';
import PublishFromBuilderDialog from '@/app/components/activepieces/PublishFromBuilderDialog';

export default function SidebarUploadIcon({ isMobileExpanded = false }) {
  const [showUploadChoice, setShowUploadChoice] = useState(false);
  const [showJsonUpload, setShowJsonUpload] = useState(false);
  const [showBuilderPublish, setShowBuilderPublish] = useState(false);
  const { isExpanded } = useSidebar();
  const showLabel = isExpanded || isMobileExpanded;

  const openBuilderPublish = () => {
    setShowUploadChoice(false);
    setShowBuilderPublish(true);
  };

  const openJsonUpload = () => {
    setShowUploadChoice(false);
    setShowJsonUpload(true);
  };

  return (
    <>
      <button
        onClick={() => setShowUploadChoice(true)}
        className={`sidebar-nav-button flex items-center rounded-lg transition-colors ${showLabel
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

      <UploadChoiceModal
        isOpen={showUploadChoice}
        onClose={() => setShowUploadChoice(false)}
        onChooseBuilder={openBuilderPublish}
        onChooseJson={openJsonUpload}
      />

      <AutomationUpload
        isOpen={showJsonUpload}
        onClose={() => setShowJsonUpload(false)}
        onUploadSuccess={() => setShowJsonUpload(false)}
      />

      <PublishFromBuilderDialog
        isOpen={showBuilderPublish}
        onClose={() => setShowBuilderPublish(false)}
        onPublishSuccess={() => setShowBuilderPublish(false)}
      />
    </>
  );
}
