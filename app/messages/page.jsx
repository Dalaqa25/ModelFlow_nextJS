'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useMessagesDock } from '@/lib/contexts/messages-dock-context';

function MessagesRedirect() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { openDock, openThread } = useMessagesDock();

  useEffect(() => {
    const threadId = searchParams.get('thread');
    if (threadId) {
      openThread(threadId, { tab: 'chats' });
    } else {
      openDock();
    }
    router.replace('/community');
  }, [searchParams, router, openDock, openThread]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-400 text-sm">
      Opening messages...
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-500">
          Loading...
        </div>
      }
    >
      <MessagesRedirect />
    </Suspense>
  );
}
