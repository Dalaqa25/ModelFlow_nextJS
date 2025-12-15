'use client';

import { useRouter } from 'next/navigation';
import { FaPlus } from 'react-icons/fa';

export default function NewChatButton() {
  const router = useRouter();

  const handleNewChat = () => {
    router.push('/main');
  };

  return (
    <div className="px-3 pb-3">
      <button
        onClick={handleNewChat}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-800/60 hover:bg-slate-700/60 transition-colors text-white border border-purple-500/30"
      >
        <FaPlus className="w-4 h-4" />
        <span className="text-sm font-medium">New Chat</span>
      </button>
    </div>
  );
}
