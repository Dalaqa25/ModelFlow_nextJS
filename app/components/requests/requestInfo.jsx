'use client';

import { FaTimes, FaEnvelope } from 'react-icons/fa';
import { useState, useEffect } from 'react';
import RequestCommnetCreateion from './requestCommnetCreateion';
import OtherComments from './otherComments';
import { useAuth } from '@/lib/auth/supabase-auth-context';
import { useMessagesDock } from '@/lib/contexts/messages-dock-context';
import { useQuery } from '@tanstack/react-query';
import MessageStartModal from '@/app/components/messages/MessageStartModal';
import { getAvatarColor, getInitial } from '@/lib/messages/avatar-utils';

export default function RequestInfo({ request, onClose }) {
    const [commentsUpdated, setCommentsUpdated] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const [messageModalOpen, setMessageModalOpen] = useState(false);
    const { openThread } = useMessagesDock();
    const { user } = useAuth();

    const { data: currentUser } = useQuery({
        queryKey: ['currentUserProfile'],
        queryFn: async () => {
            const res = await fetch('/api/user', { credentials: 'include' });
            if (!res.ok) return null;
            return res.json();
        },
        enabled: !!user,
    });

    useEffect(() => {
        setIsVisible(true);
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(() => {
            onClose();
        }, 300);
    };

    const handleCommentAdded = () => {
        setCommentsUpdated((prev) => prev + 1);
    };

    const author = request?.author;
    const authorName = author?.display_name || 'User';
    const authorId = author?.id;
    const avatarSeed = author?.id || authorName;
    const canMessage =
        authorId && currentUser?.id && authorId !== currentUser.id && user;

    const { data: existingThread, refetch: refetchExistingThread, isLoading: isCheckingThread } = useQuery({
        queryKey: ['checkThread', authorId],
        queryFn: async () => {
            if (!authorId) return null;
            const res = await fetch(`/api/messages/threads/check?userId=${authorId}`, {
                credentials: 'include'
            });
            if (!res.ok) return null;
            return res.json();
        },
        enabled: !!user && !!authorId && authorId !== currentUser?.id,
    });

    const hasExistingThread = existingThread?.exists;

    const handleMessageClick = () => {
        if (hasExistingThread) {
            handleMessageStarted(existingThread.threadId);
        } else {
            setMessageModalOpen(true);
        }
    };

    const handleMessageStarted = (threadId) => {
        refetchExistingThread();
        handleClose();
        setTimeout(() => {
            openThread(threadId, { tab: 'requests' });
        }, 300);
    };

    if (!request) return null;

    return (
        <>
            <div
                className={`fixed top-14 sm:top-0 right-0 h-[calc(100%-3.5rem)] sm:h-full z-50 w-full sm:w-[480px] lg:w-[520px] bg-slate-900/98 backdrop-blur-xl border-l border-slate-700/50 shadow-2xl shadow-black/50 flex flex-col transition-transform duration-300 ease-out ${
                    isVisible ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-700/40 flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                        <span className="text-sm font-medium text-slate-300">Suggestion Details</span>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all duration-200"
                    >
                        <FaTimes className="text-sm" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <div className="px-5 sm:px-6 py-5">
                        <h1 className="text-xl sm:text-2xl font-bold text-white mb-3 leading-tight">
                            {request.title}
                        </h1>

                        <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-5 whitespace-pre-wrap break-words">
                            {request.description}
                        </p>

                        {request.tags?.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-5">
                                {request.tags.map((tag, index) => (
                                    <span
                                        key={index}
                                        className="text-xs text-purple-300 rounded-lg font-medium px-2.5 py-1 bg-purple-500/12 border border-purple-500/20"
                                    >
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        <div className="flex items-center gap-3 p-3.5 bg-slate-800/50 rounded-xl border border-slate-700/30">
                            <div
                                className={`w-9 h-9 rounded-full bg-gradient-to-br ${getAvatarColor(avatarSeed)} flex items-center justify-center flex-shrink-0`}
                            >
                                <span className="text-xs font-bold text-white">
                                    {getInitial(authorName)}
                                </span>
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-purple-300 truncate">
                                    {authorName}
                                </p>
                                <p className="text-xs text-slate-500">
                                    {new Date(request.created_at).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </p>
                            </div>
                            {canMessage && (
                                <button
                                    type="button"
                                    onClick={handleMessageClick}
                                    disabled={isCheckingThread}
                                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isCheckingThread ? (
                                        <>
                                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Checking...
                                        </>
                                    ) : (
                                        <>
                                            <FaEnvelope className="text-[10px]" />
                                            {hasExistingThread ? 'Open Chat' : 'Message'}
                                        </>
                                    )}
                                </button>
                            )}
                        </div>

                        <p className="text-xs text-slate-600 mt-4">
                            Use Message for private collaboration — please do not share email in comments.
                        </p>
                    </div>

                    <div className="border-t border-slate-700/40">
                        <div className="px-5 sm:px-6 py-4">
                            <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
                                <span className="w-1 h-4 rounded-full bg-purple-500" />
                                Discussion
                            </h3>

                            <OtherComments
                                requestId={request.id}
                                requestTitle={request.title}
                                key={commentsUpdated}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex-shrink-0 border-t border-slate-700/40 bg-slate-900/90 backdrop-blur-sm">
                    <RequestCommnetCreateion
                        requestId={request.id}
                        onCommentAdded={handleCommentAdded}
                    />
                </div>
            </div>

            {canMessage && (
                <MessageStartModal
                    isOpen={messageModalOpen}
                    onClose={() => setMessageModalOpen(false)}
                    recipientUserId={authorId}
                    requestId={request.id}
                    requestTitle={request.title}
                    recipientName={authorName}
                    onStarted={handleMessageStarted}
                />
            )}
        </>
    );
}
