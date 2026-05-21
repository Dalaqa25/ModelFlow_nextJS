'use client';

import { useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

export default function MessageStartModal({
  isOpen,
  onClose,
  recipientUserId,
  requestId,
  requestTitle,
  recipientName,
  onStarted,
}) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || loading) return;

    setLoading(true);
    try {
      const res = await fetch('/api/messages/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          recipientUserId,
          requestId,
          message: message.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      toast.success(
        data.existing
          ? 'Opening existing conversation'
          : 'Message request sent'
      );
      setMessage('');
      onClose();
      if (onStarted) onStarted(data.threadId, data.existing);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        role="presentation"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Message {recipientName}</h3>
            {requestTitle && (
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                About: {requestTitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <FaTimes className="text-sm" />
          </button>
        </div>

        <p className="text-xs text-slate-500 mb-3">
          They will need to accept before you can continue chatting. Do not share email addresses.
        </p>

        <form onSubmit={handleSubmit}>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Hi! I saw your automation request and wanted to discuss..."
            rows={4}
            className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-700/40 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/40 resize-none"
            autoFocus
          />
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !message.trim()}
              className="relative w-[130px] flex items-center justify-center h-9 text-sm font-medium bg-purple-600 hover:bg-purple-500 text-white rounded-xl disabled:opacity-50 transition-all"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Sending...</span>
                </div>
              ) : (
                'Send request'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
