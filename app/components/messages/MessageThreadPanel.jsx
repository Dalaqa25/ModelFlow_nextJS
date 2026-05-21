'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FaTimes, FaPaperPlane, FaArrowLeft, FaCheck, FaBan } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { getAvatarColor, getInitial } from '@/lib/messages/avatar-utils';

export default function MessageThreadPanel({
  threadId,
  onClose,
  onBack,
  onAccepted,
  compact = false,
}) {
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['threadMessages', threadId],
    queryFn: async () => {
      const res = await fetch(`/api/messages/threads/${threadId}/messages`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to load messages');
      return res.json();
    },
    enabled: !!threadId,
    refetchInterval: 8000,
  });

  const thread = data?.thread;
  const messages = data?.messages || [];
  const otherUser = data?.other_user;
  const requestTitle = data?.request_title;

  const otherName = otherUser?.display_name || 'User';
  const avatarSeed = otherUser?.id || otherName;

  const isPending = thread?.status === 'pending';
  const isIncoming =
    isPending && messages.length > 0 && !messages.some((m) => m.is_mine);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleAccept = async () => {
    try {
      const res = await fetch(`/api/messages/threads/${threadId}/accept`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      toast.success('Conversation started');
      await refetch();
      queryClient.invalidateQueries({ queryKey: ['messageThreads'] });
      queryClient.invalidateQueries({ queryKey: ['messageUnread'] });
      onAccepted?.();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleDecline = async () => {
    try {
      const res = await fetch(`/api/messages/threads/${threadId}/decline`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      toast.success('Request declined');
      queryClient.invalidateQueries({ queryKey: ['messageThreads'] });
      queryClient.invalidateQueries({ queryKey: ['messageUnread'] });
      onClose?.();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!draft.trim() || sending || thread?.status !== 'active') return;

    setSending(true);
    try {
      const res = await fetch(`/api/messages/threads/${threadId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ body: draft.trim() }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      setDraft('');
      refetch();
      queryClient.invalidateQueries({ queryKey: ['messageThreads'] });
      queryClient.invalidateQueries({ queryKey: ['messageUnread'] });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={`flex flex-col h-full w-full bg-transparent ${compact ? '' : 'border-l border-slate-700/50'}`}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-700/50 shrink-0 bg-slate-900/60 backdrop-blur-md">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl shrink-0 text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
            aria-label="Back to list"
          >
            <FaArrowLeft className="text-sm" />
          </button>
        )}
        <div
          className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarColor(avatarSeed)} flex items-center justify-center flex-shrink-0 shadow-inner`}
        >
          <span className="text-[11px] font-bold text-white tracking-wide">{getInitial(otherName)}</span>
        </div>
        <div className="min-w-0 flex-1 py-0.5">
          <p className="text-sm font-semibold truncate text-white">{otherName}</p>
          {requestTitle && (
            <p className="text-[11px] font-medium truncate text-purple-400/90">{requestTitle}</p>
          )}
          {isPending && isIncoming && (
            <p className="text-[10px] font-bold tracking-wider text-amber-400 uppercase mt-0.5">Message request</p>
          )}
          {isPending && !isIncoming && (
            <p className="text-[10px] text-slate-500 mt-0.5">Waiting for acceptance</p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-xl shrink-0 text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          aria-label="Close"
        >
          <FaTimes className="text-sm" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0 custom-scrollbar">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full space-y-3 opacity-60">
             <div className="w-5 h-5 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
          </div>
        ) : (
          messages.map((msg, index) => {
            const isLast = index === messages.length - 1;
            return (
              <div
                key={msg.id}
                className={`flex ${msg.is_mine ? 'justify-end' : 'justify-start'} ${isLast ? 'pb-2' : ''}`}
              >
                <div
                  className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed shadow-sm ${
                    msg.is_mine
                      ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-br-sm shadow-purple-900/20'
                      : 'bg-slate-800/90 text-slate-200 rounded-bl-sm border border-slate-700/50 shadow-black/10'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Accept/Decline for incoming requests */}
      {isIncoming && (
        <div className="px-4 py-4 border-t border-slate-700/50 flex gap-3 shrink-0 bg-slate-900/80 backdrop-blur-md">
          <button
            type="button"
            onClick={handleAccept}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl shadow-lg shadow-purple-900/20 transition-all"
          >
            <FaCheck className="text-[10px]" /> Accept
          </button>
          <button
            type="button"
            onClick={handleDecline}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-xl text-slate-300 border border-slate-600/50 hover:bg-slate-800/80 hover:text-white transition-all"
          >
            <FaBan className="text-[10px]" /> Decline
          </button>
        </div>
      )}

      {/* Send message form */}
      {thread?.status === 'active' && (
        <form
          onSubmit={handleSend}
          className="px-4 py-3 border-t border-slate-700/50 flex gap-2 items-end shrink-0 bg-slate-900/80 backdrop-blur-md"
        >
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
            rows={1}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-2xl text-[13px] text-white focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 placeholder-slate-500 transition-all resize-none max-h-32 shadow-inner"
          />
          <button
            type="submit"
            disabled={sending || !draft.trim()}
            className="p-3 bg-gradient-to-br from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl disabled:opacity-50 shrink-0 shadow-lg shadow-purple-900/20 transition-all"
          >
            {sending ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
                <FaPaperPlane className="text-xs" />
            )}
          </button>
        </form>
      )}

      {/* Pending notice */}
      {isPending && !isIncoming && (
        <div className="px-4 py-4 border-t border-slate-700/50 text-center text-xs font-medium shrink-0 bg-slate-900/80 backdrop-blur-md text-slate-400">
          They need to accept before you can send more messages
        </div>
      )}
    </div>
  );
}
