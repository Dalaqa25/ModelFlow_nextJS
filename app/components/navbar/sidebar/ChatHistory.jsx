'use client';

import { FaComments } from 'react-icons/fa';

export default function ChatHistory() {
  return (
    <div className="flex-1 overflow-y-auto px-3 py-2">
      <div className="text-xs text-gray-400 mb-2 px-2">Recent</div>
      <div className="space-y-1">
        <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800/60 transition-colors text-gray-300 text-sm flex items-center gap-2">
          <FaComments className="w-3 h-3" />
          <span className="truncate">Previous conversations will appear here</span>
        </button>
      </div>
    </div>
  );
}
