'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, MessageSquare, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useThemeAdaptive } from '@/lib/contexts/theme-adaptive-context';

export default function SidebarConversationList({ onBack }) {
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const listRef = useRef(null);
  const router = useRouter();
  const { isDarkMode } = useThemeAdaptive();
  const LIMIT = 15;

  useEffect(() => {
    loadConversations(0);
  }, []);

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
        
        // If the deleted conversation is currently open, redirect to new chat
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
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className={`p-4 border-b ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={onBack}
            className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-white/8' : 'text-gray-400 hover:text-gray-700 hover:bg-black/5'}`}
            title="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h2 className={`text-sm font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
            Conversations
          </h2>
        </div>
        <p className={`text-xs pl-9 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          {conversations.length} total
        </p>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5" onScroll={handleScroll}>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-400" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className={`w-8 h-8 mx-auto mb-2 opacity-30 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />
            <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              No conversations yet
            </p>
          </div>
        ) : (
          conversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => { router.push(`/main?chat=${conversation.id}`); }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') router.push(`/main?chat=${conversation.id}`); }}
              className={`w-full p-3 rounded-lg text-left transition-all duration-200 group relative border border-transparent cursor-pointer ${
                isDarkMode
                  ? 'bg-white/5 hover:bg-white/8 hover:border-purple-500/30'
                  : 'bg-black/3 hover:bg-black/5 hover:border-indigo-200'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className={`font-medium text-sm truncate ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                    {conversation.title}
                  </h3>
                  <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    {formatDate(conversation.last_message_at || conversation.created_at)}
                  </p>
                </div>
                <button
                  onClick={(e) => handleDelete(conversation.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 text-red-400 transition-all duration-200"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* New Conversation Button */}
      <div className={`p-3 border-t ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
        <button
          onClick={() => {
            router.push('/main');
            onBack();
          }}
          className="w-full py-2.5 px-3 rounded-lg font-medium text-sm transition-all duration-200 bg-purple-600 hover:bg-purple-700 text-white"
        >
          + New Chat
        </button>
      </div>
    </div>
  );
}
