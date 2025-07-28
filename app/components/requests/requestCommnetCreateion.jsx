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
            console.error('Error posting comment:', error);
            toast.error('Failed to post comment. Please try again.');
        }
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!content.trim()) return;
        postComment(content);
    };

    return (
        <div className="w-full flex mt-2.5 ml-2.5 items-center">
            <form onSubmit={handleSubmit} className="p-2 w-1/2 rounded-2xl bg-white">
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="write a comment..."
                    className="bg-white p-2 w-full text-base focus:outline-none focus:ring-0 focus:border-transparent font-light resize-none overflow-y-auto"
                    disabled={isPending}
                />
                <button 
                    type="submit"
                    disabled={isPending || !content.trim()}
                    className="cursor-pointer text-2xl ml-auto hover:text-purple-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <FiSend />
                </button>
            </form>
        </div>
    );
}