'use client';

import { useState, useEffect } from 'react';
import { useThemeAdaptive } from '@/lib/contexts/theme-adaptive-context';
import { FolderOpen, MessageSquare, Trash2, Archive } from 'lucide-react';

export default function ConversationSidebar({ isOpen, onClose, onConversationSelect, currentConversationId }) {
  const { isDarkMode } = useThemeAdaptive();
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load conversations when sidebar opens
  useEffect(() => {
    if (isOpen) {
      loadConversations();
    }
  }, [isOpen]);

  const loadConversations = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/conversations', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setIsLoading(false);
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
        if (currentConversationId === conversationId) {
          onConversationSelect(null);
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
    <>
      {/* Sidebar */}
      <div
        className={`
          fixed top-0 left-0 h-full z-50
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          ${isDarkMode ? 'bg-slate-900/95' : 'bg-white/95'}
          backdrop-blur-xl shadow-2xl
          w-80
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className={`
            p-6 border-b
            ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}
          `}>
            <h2 className={`
              text-xl font-semibold
              ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}
            `}>
              Conversations
            </h2>
            <p className={`
              text-sm mt-1
              ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}
            `}>
              {conversations.length} total
            </p>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className={`
                  animate-spin rounded-full h-8 w-8 border-b-2
                  ${isDarkMode ? 'border-purple-400' : 'border-purple-600'}
                `} />
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className={`
                  w-12 h-12 mx-auto mb-3 opacity-30
                  ${isDarkMode ? 'text-slate-400' : 'text-gray-400'}
                `} />
                <p className={`
                  text-sm
                  ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}
                `}>
                  No conversations yet
                </p>
              </div>
            ) : (
              conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => {
                    onConversationSelect(conversation.id);
                    onClose();
                  }}
                  className={`
                    w-full p-4 rounded-xl text-left
                    transition-all duration-200
                    group relative
                    ${currentConversationId === conversation.id
                      ? isDarkMode
                        ? 'bg-purple-600/20 border-2 border-purple-500/50'
                        : 'bg-purple-50 border-2 border-purple-300'
                      : isDarkMode
                        ? 'bg-slate-800/50 hover:bg-slate-800 border-2 border-transparent'
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                    }
                  `}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className={`
                        font-medium truncate
                        ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}
                      `}>
                        {conversation.title}
                      </h3>
                      <p className={`
                        text-xs mt-1
                        ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}
                      `}>
                        {formatDate(conversation.last_message_at || conversation.created_at)}
                      </p>
                    </div>
                    
                    {/* Delete button */}
                    <button
                      onClick={(e) => handleDelete(conversation.id, e)}
                      className={`
                        opacity-0 group-hover:opacity-100
                        p-1.5 rounded-lg
                        transition-all duration-200
                        ${isDarkMode
                          ? 'hover:bg-red-500/20 text-red-400'
                          : 'hover:bg-red-50 text-red-600'
                        }
                      `}
                      title="Delete conversation"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className={`
            p-4 border-t
            ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}
          `}>
            <button
              onClick={() => {
                onConversationSelect(null);
                onClose();
              }}
              className={`
                w-full py-3 px-4 rounded-xl
                font-medium transition-all duration-200
                ${isDarkMode
                  ? 'bg-purple-600 hover:bg-purple-700 text-white'
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
                }
              `}
            >
              + New Conversation
            </button>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300"
        />
      )}
    </>
  );
}
