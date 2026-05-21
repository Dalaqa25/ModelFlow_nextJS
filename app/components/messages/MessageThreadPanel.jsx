'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FaTimes, FaPaperPlane, FaArrowLeft } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { getAvatarColor, getInitial } from '@/lib/messages/avatar-utils';
import { useThemeAdaptive } from '@/lib/contexts/theme-adaptive-context';

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
  const { isDarkMode } = useThemeAdaptive();

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
    <div className={`flex flex-col h-full w-full ${
      isDarkMode ? 'bg-slate-900' : 'bg-white'
    } ${compact ? '' : isDarkMode ? 'border-l border-slate-700/50' : 'border-l border-gray-200'}`}>
      {/* Header */}
      <div className={`flex items-center gap-2 px-3 py-2.5 border-b shrink-0 ${
        isDarkMode ? 'border-slate-700/40' : 'border-gray-200'
      }`}>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className={`p-1.5 rounded-lg shrink-0 ${
              isDarkMode ? 'text-slate-400 hover:text-white' : 'text-gray-400 hover:text-gray-700'
            }`}
            aria-label="Back to list"
          >
            <FaArrowLeft className="text-sm" />
          </button>
        )}
        <div
          className={`w-8 h-8 rounded-full bg-gradient-to-br ${getAvatarColor(avatarSeed)} flex items-center justify-center flex-shrink-0`}
        >
          <span className="text-[10px] font-bold text-white">{getInitial(otherName)}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-medium truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{otherName}</p>
          {requestTitle && (
            <p className={`text-[10px] truncate ${isDarkMode ? 'text-purple-400/90' : 'text-purple-600/80'}`}>{requestTitle}</p>
          )}
          {isPending && isIncoming && (
            <p className={`text-[10px] ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>Message request</p>
          )}
          {isPending && !isIncoming && (
            <p className={`text-[10px] ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>Waiting for acceptance</p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className={`p-1.5 rounded-lg shrink-0 ${
            isDarkMode ? 'text-slate-400 hover:text-white' : 'text-gray-400 hover:text-gray-700'
          }`}
          aria-label="Close"
        >
          <FaTimes className="text-sm" />
        </button>
      </div>

      {/* Messages */}
      <div className={`flex-1 overflow-y-auto px-3 py-2 space-y-2 min-h-0 ${
        isDarkMode ? '' : 'bg-gray-50/50'
      }`}>
        {isLoading ? (
          <p className={`text-xs text-center py-6 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>Loading...</p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.is_mine ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] px-2.5 py-1.5 rounded-2xl text-xs ${
                  msg.is_mine
                    ? 'bg-purple-600 text-white rounded-br-sm'
                    : isDarkMode
                      ? 'bg-slate-800 text-slate-200 rounded-bl-sm'
                      : 'bg-white text-gray-800 rounded-bl-sm border border-gray-200'
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{msg.body}</p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Accept/Decline for incoming requests */}
      {isIncoming && (
        <div className={`px-3 py-2 border-t flex gap-2 shrink-0 ${
          isDarkMode ? 'border-slate-700/40' : 'border-gray-200'
        }`}>
          <button
            type="button"
            onClick={handleAccept}
            className="flex-1 py-2 text-xs font-medium bg-purple-600 hover:bg-purple-500 text-white rounded-lg"
          >
            Accept
          </button>
          <button
            type="button"
            onClick={handleDecline}
            className={`flex-1 py-2 text-xs rounded-lg ${
              isDarkMode
                ? 'text-slate-300 border border-slate-600 hover:bg-slate-800'
                : 'text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Decline
          </button>
        </div>
      )}

      {/* Send message form */}
      {thread?.status === 'active' && (
        <form
          onSubmit={handleSend}
          className={`px-3 py-2 border-t flex gap-2 items-end shrink-0 ${
            isDarkMode ? 'border-slate-700/40' : 'border-gray-200'
          }`}
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
            className={`flex-1 px-2.5 py-2 border rounded-xl text-xs resize-none focus:outline-none max-h-20 ${
              isDarkMode
                ? 'bg-slate-800/80 border-slate-700/40 text-white focus:border-purple-500/40 placeholder-slate-500'
                : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-purple-400 placeholder-gray-400'
            }`}
          />
          <button
            type="submit"
            disabled={sending || !draft.trim()}
            className="p-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl disabled:opacity-50 shrink-0"
          >
            <FaPaperPlane className="text-xs" />
          </button>
        </form>
      )}

      {/* Pending notice */}
      {isPending && !isIncoming && (
        <div className={`px-3 py-3 border-t text-center text-[10px] shrink-0 ${
          isDarkMode ? 'border-slate-700/40 text-slate-500' : 'border-gray-200 text-gray-400'
        }`}>
          They need to accept before you can send more messages
        </div>
      )}
    </div>
  );
}
