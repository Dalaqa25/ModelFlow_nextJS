'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, Trash2, Plus } from 'lucide-react';
import { useThemeAdaptive } from '@/lib/contexts/theme-adaptive-context';
import { useAuth } from '@/lib/auth/supabase-auth-context';

export default function SidebarRecents() {
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const router = useRouter();
  const { isDarkMode } = useThemeAdaptive();
  const { isAuthenticated, user } = useAuth();
  const listRef = useRef(null);
  const LIMIT = 20;

  useEffect(() => {
    if (isAuthenticated && user) {
      loadConversations(0);
    }
  }, [isAuthenticated, user]);

  const loadConversations = async (currentOffset) => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/conversations?limit=${LIMIT}&offset=${currentOffset}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        if (currentOffset === 0) {
          setConversations(data);
        } else {
          setConversations(prev => [...prev, ...data]);
        }
        setHasMore(data.length === LIMIT);
        setOffset(currentOffset + data.length);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollHeight - scrollTop <= clientHeight + 60 && hasMore && !isLoading) {
      loadConversations(offset);
    }
  };

  const handleDelete = async (conversationId, e) => {
    e.stopPropagation();
    if (!confirm('Delete this conversation?')) return;

    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (response.ok) {
        setConversations(prev => prev.filter(c => c.id !== conversationId));
        const currentUrl = new URL(window.location.href);
        const currentChatId = currentUrl.searchParams.get('chat');
        if (currentChatId === conversationId) {
          router.push('/main');
        }
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Group conversations by time period
  const groupConversations = (convos) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    const weekAgo = new Date(today); weekAgo.setDate(today.getDate() - 7);

    const groups = { today: [], yesterday: [], thisWeek: [], older: [] };

    convos.forEach(c => {
      const date = new Date(c.last_message_at || c.created_at);
      if (date >= today) groups.today.push(c);
      else if (date >= yesterday) groups.yesterday.push(c);
      else if (date >= weekAgo) groups.thisWeek.push(c);
      else groups.older.push(c);
    });

    return groups;
  };

  if (!isAuthenticated) return null;

  const groups = groupConversations(conversations);
  const hasConversations = conversations.length > 0;

  const renderGroup = (label, convos) => {
    if (convos.length === 0) return null;
    return (
      <div key={label}>
        <p className={`px-3 pt-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider ${
          isDarkMode ? 'text-gray-500' : 'text-gray-400'
        }`}>
          {label}
        </p>
        {convos.map((conversation) => (
          <div
            key={conversation.id}
            onClick={() => router.push(`/main?chat=${conversation.id}`)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') router.push(`/main?chat=${conversation.id}`); }}
            className={`group flex items-center gap-2 px-3 py-2 mx-1 rounded-lg cursor-pointer transition-all duration-150 ${
              isDarkMode
                ? 'hover:bg-white/8 text-gray-300 hover:text-white'
                : 'hover:bg-black/5 text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="flex-1 text-sm truncate min-w-0">
              {conversation.title || 'New Chat'}
            </span>
            <button
              onClick={(e) => handleDelete(conversation.id, e)}
              className={`opacity-0 group-hover:opacity-100 p-1 rounded transition-all duration-150 flex-shrink-0 ${
                isDarkMode
                  ? 'hover:bg-red-500/20 text-red-400'
                  : 'hover:bg-red-50 text-red-400'
              }`}
              title="Delete"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-0 flex-1">
      {/* Divider above recents */}
      <div className={`mx-3 my-1 border-t ${isDarkMode ? 'border-white/8' : 'border-gray-200'}`} />

      {/* New Chat button */}
      <div className="px-3 pt-2 pb-1">
        <button
          onClick={() => router.push('/main')}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
            isDarkMode
              ? 'text-gray-300 hover:text-white hover:bg-white/8'
              : 'text-gray-600 hover:text-gray-900 hover:bg-black/5'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>New Chat</span>
        </button>
      </div>

      {/* Scrollable Recents */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto min-h-0 pb-2"
        onScroll={handleScroll}
      >
        {isLoading && conversations.length === 0 ? (
          <div className="flex items-center justify-center py-6">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-400" />
          </div>
        ) : !hasConversations ? (
          <div className="text-center py-6 px-4">
            <MessageSquare className={`w-6 h-6 mx-auto mb-2 opacity-30 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />
            <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              No conversations yet
            </p>
          </div>
        ) : (
          <>
            {renderGroup('Today', groups.today)}
            {renderGroup('Yesterday', groups.yesterday)}
            {renderGroup('This Week', groups.thisWeek)}
            {renderGroup('Older', groups.older)}
            {isLoading && (
              <div className="flex items-center justify-center py-3">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-400" />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
