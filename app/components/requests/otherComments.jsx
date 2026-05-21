'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FaEnvelope } from 'react-icons/fa';
import { useAuth } from '@/lib/auth/supabase-auth-context';
import MessageStartModal from '@/app/components/messages/MessageStartModal';
import { getAvatarColor, getInitial } from '@/lib/messages/avatar-utils';
import { useMessagesDock } from '@/lib/contexts/messages-dock-context';

export default function OtherComments({ requestId, requestTitle }) {
    const { openThread } = useMessagesDock();
    const { user } = useAuth();
    const [messageTarget, setMessageTarget] = useState(null);

    const { data: currentUser } = useQuery({
        queryKey: ['currentUserProfile'],
        queryFn: async () => {
            const res = await fetch('/api/user', { credentials: 'include' });
            if (!res.ok) return null;
            return res.json();
        },
        enabled: !!user,
    });

    const { data: comments = [], isLoading, error, refetch } = useQuery({
        queryKey: ['requestComments', requestId],
        queryFn: async () => {
            const response = await fetch(`/api/requests/${requestId}/comments`);
            if (!response.ok) {
                throw new Error('Failed to fetch comments');
            }
            return response.json();
        },
    });

    const getTimeAgo = (dateString) => {
        const now = new Date();
        const created = new Date(dateString);
        const diffMs = now - created;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return created.toLocaleDateString();
    };

    if (isLoading) {
        return (
            <div className="space-y-3">
                {[1, 2].map((i) => (
                    <div key={i} className="flex items-start gap-3 animate-pulse">
                        <div className="w-8 h-8 rounded-full bg-slate-700/40 flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                            <div className="h-3 bg-slate-700/40 rounded w-24" />
                            <div className="h-3 bg-slate-700/30 rounded w-full" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-6">
                <p className="text-red-400 text-sm mb-2">{error.message}</p>
                <button
                    onClick={() => refetch()}
                    className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                >
                    Try again
                </button>
            </div>
        );
    }

    if (comments.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-slate-500 text-sm">No comments yet</p>
                <p className="text-slate-600 text-xs mt-1">Be the first to share your thoughts</p>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-0.5">
                {comments.map((comment) => {
                    const author = comment.author || {};
                    const name = author.display_name || 'User';
                    const authorId = author.id;
                    const seed = author.id || name;
                    const canMessage =
                        user &&
                        currentUser?.id &&
                        authorId &&
                        authorId !== currentUser.id;

                    return (
                        <div
                            key={comment.id}
                            className="group flex items-start gap-3 p-3 rounded-xl hover:bg-slate-800/30 transition-colors duration-150"
                        >
                            <div
                                className={`w-8 h-8 rounded-full bg-gradient-to-br ${getAvatarColor(seed)} flex items-center justify-center flex-shrink-0`}
                            >
                                <span className="text-[10px] font-bold text-white">
                                    {getInitial(name)}
                                </span>
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-baseline justify-between gap-2 mb-0.5">
                                    <div className="flex items-baseline gap-2 min-w-0">
                                        <span className="text-xs font-semibold text-purple-300 truncate">
                                            {name}
                                        </span>
                                        <span className="text-[10px] text-slate-600 flex-shrink-0">
                                            {getTimeAgo(comment.created_at)}
                                        </span>
                                    </div>
                                    {canMessage && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setMessageTarget({
                                                    id: authorId,
                                                    name,
                                                })
                                            }
                                            className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[10px] text-purple-400 hover:text-purple-300 transition-opacity shrink-0"
                                        >
                                            <FaEnvelope />
                                            Message
                                        </button>
                                    )}
                                </div>
                                <p className="text-sm text-slate-300 leading-relaxed break-words whitespace-pre-wrap">
                                    {comment.content}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {messageTarget && (
                <MessageStartModal
                    isOpen={!!messageTarget}
                    onClose={() => setMessageTarget(null)}
                    recipientUserId={messageTarget.id}
                    requestId={requestId}
                    requestTitle={requestTitle}
                    recipientName={messageTarget.name}
                    onStarted={(threadId) => {
                        setMessageTarget(null);
                        openThread(threadId, { tab: 'requests' });
                    }}
                />
            )}
        </>
    );
}
