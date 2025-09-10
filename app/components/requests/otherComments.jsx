'use client';
import { IoClose } from "react-icons/io5";
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

export default function OtherComments({ requestId, onClose }) {
    const router = useRouter();
    const { data: comments = [], isLoading, error, refetch } = useQuery({
        queryKey: ['requestComments', requestId],
        queryFn: async () => {
            const response = await fetch(`/api/requests/${requestId}/comments`);
            if (!response.ok) {
                throw new Error('Failed to fetch comments');
            }
            const data = await response.json();
            return data;
        }
    });

    if (isLoading) {
        return (
            <div className="absolute left-0 top-0 w-full h-full bg-slate-800/95 rounded-xl shadow overflow-y-auto z-20 border-2 border-slate-700/50">
                <IoClose
                    onClick={onClose}
                    className="text-3xl bg-slate-700/50 text-white cursor-pointer absolute z-30 right-2 top-1 rounded-full hover:bg-slate-600/50 transition-all"
                />
                <div className="flex items-center justify-center h-full">
                    <p className="text-slate-300">Loading comments...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="absolute left-0 top-0 w-full h-full bg-slate-800/95 rounded-xl shadow overflow-y-auto z-20 border-2 border-slate-700/50">
                <IoClose
                    onClick={onClose}
                    className="text-3xl bg-slate-700/50 text-white cursor-pointer absolute z-30 right-2 top-1 rounded-full hover:bg-slate-600/50 transition-all"
                />
                <div className="flex flex-col items-center justify-center h-full">
                    <p className="text-red-400">{error.message}</p>
                    <button 
                        onClick={() => refetch()} 
                        className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="absolute left-0 top-0 w-full h-full bg-slate-800/95 backdrop-blur-md rounded-xl shadow overflow-y-auto z-20 border-2 border-slate-700/50">
            <IoClose
                onClick={onClose}
                className="text-3xl bg-slate-700/50 text-white cursor-pointer absolute z-30 right-2 top-1 rounded-full hover:bg-slate-600/50 transition-all"
            />
            <div className="py-6">
                {comments.length === 0 ? (
                    <p className="text-center text-slate-300">No comments yet</p>
                ) : (
                    comments.map((comment, idx) => (
                        <div
                            key={comment.id}
                            className={`w-full flex items-center my-2 px-4 mb-3 ${idx % 2 === 0 ? 'justify-start' : 'justify-end'}`}
                        >
                            <div className={`p-3 rounded-2xl max-w-[60%] break-words flex flex-col ${
                                idx % 2 === 0 
                                    ? 'bg-slate-700/60 border border-slate-600/50' 
                                    : 'bg-purple-500/20 border border-purple-500/30'
                            }`}>
                                <span
                                    onClick={() => router.push(`/profile/${comment.author_email}`)}
                                    className="text-xs font-semibold mb-1 hover:underline cursor-pointer text-purple-300 hover:text-purple-200 transition-colors"
                                >
                                    {comment.author_email}
                                </span>
                                <p className="text-base break-words font-light text-white">{comment.content}</p>
                                <span className="text-xs text-slate-400 mt-1">
                                    {new Date(comment.created_at).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}