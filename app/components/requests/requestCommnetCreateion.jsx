'use client';
import { FiSend } from "react-icons/fi";
import { useState } from "react";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import toast from 'react-hot-toast';

export default function RequestCommnetCreateion({ requestId, onCommentAdded }) { 
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user } = useKindeBrowserClient();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!content.trim() || !user) return;

        const toastId = toast.loading('Posting comment...');

        try {
            setIsSubmitting(true);
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

            setContent('');
            if (onCommentAdded) {
                onCommentAdded();
            }
            toast.success('Comment posted successfully!', {
                id: toastId,
            });
        } catch (error) {
            console.error('Error posting comment:', error);
            toast.error('Failed to post comment. Please try again.', {
                id: toastId,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-full flex mt-2.5 ml-2.5 items-center">
            <form onSubmit={handleSubmit} className="p-2 w-1/2 rounded-2xl bg-white">
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="write a comment..."
                    className="bg-white p-2 w-full text-base focus:outline-none focus:ring-0 focus:border-transparent font-light resize-none overflow-y-auto"
                    disabled={isSubmitting || !user}
                />
                <button 
                    type="submit"
                    disabled={isSubmitting || !user || !content.trim()}
                    className="cursor-pointer text-2xl ml-auto hover:text-purple-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <FiSend />
                </button>
            </form>
        </div>
    );
}