'use client';
import { FiSend } from "react-icons/fi";
import { useState } from "react";
import toast from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function RequestCommnetCreateion({ requestId, onCommentAdded }) {
    const [content, setContent] = useState('');
    const queryClient = useQueryClient();

    const { mutate: postComment, isPending } = useMutation({
        mutationFn: async (content) => {
            const response = await fetch(`/api/requests/${requestId}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ content: content.trim() }),
            });

            if (!response.ok) {
                throw new Error('Failed to post comment');
            }

            return response.json();
        },
        onSuccess: () => {
            setContent('');
            if (onCommentAdded) {
                onCommentAdded();
            }
            // Invalidate and refetch comments
            queryClient.invalidateQueries({ queryKey: ['requestComments', requestId] });
            toast.success('Comment posted successfully!');
        },
        onError: (error) => {
            toast.error('Failed to post comment. Please try again.');
        }
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!content.trim()) return;
        postComment(content);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="px-5 sm:px-6 py-3.5">
            <div className="flex items-end gap-2.5">
                <div className="flex-1 bg-slate-800/60 border border-slate-700/40 rounded-xl focus-within:border-purple-500/40 focus-within:ring-1 focus-within:ring-purple-500/20 transition-all duration-200">
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Add to the discussion..."
                        rows={1}
                        className="bg-transparent text-white text-sm placeholder-slate-500 px-3.5 py-2.5 w-full focus:outline-none resize-none max-h-24 overflow-y-auto"
                        disabled={isPending}
                        style={{
                            minHeight: '40px',
                        }}
                    />
                </div>
                <button
                    type="submit"
                    disabled={isPending || !content.trim()}
                    className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-purple-600/80 hover:bg-purple-500 text-white transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-purple-600/80"
                >
                    {isPending ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <FiSend className="text-sm" />
                    )}
                </button>
            </div>
            <p className="text-[10px] text-slate-600 mt-1.5 px-1">
                Press Enter to send · Shift+Enter for new line
            </p>
        </form>
    );
}