'use client';
import { IoClose } from "react-icons/io5";
import { useQuery } from '@tanstack/react-query';

export default function OtherComments({ requestId, onClose }) {
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
            <div className="absolute left-0 top-0 w-full h-full bg-gray-100 rounded-xl shadow overflow-y-auto z-20 border-2 border-gray-200">
                <IoClose
                    onClick={onClose}
                    className="text-3xl bg-gray-200 cursor-pointer absolute z-30 right-2 top-1 rounded-full hover:bg-gray-300 transition-all"
                />
                <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">Loading comments...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="absolute left-0 top-0 w-full h-full bg-gray-100 rounded-xl shadow overflow-y-auto z-20 border-2 border-gray-200">
                <IoClose
                    onClick={onClose}
                    className="text-3xl bg-gray-200 cursor-pointer absolute z-30 right-2 top-1 rounded-full hover:bg-gray-300 transition-all"
                />
                <div className="flex items-center justify-center h-full">
                    <p className="text-red-500">{error.message}</p>
                    <button 
                        onClick={() => refetch()} 
                        className="mt-4 px-4 py-2 bg-purple-800 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="absolute left-0 top-0 w-full h-full bg-gray-100 rounded-xl shadow overflow-y-auto z-20 border-2 border-gray-200">
            <IoClose
                onClick={onClose}
                className="text-3xl bg-gray-200 cursor-pointer absolute z-30 right-2 top-1 rounded-full hover:bg-gray-300 transition-all"
            />
            <div className="py-6">
                {comments.length === 0 ? (
                    <p className="text-center text-gray-500">No comments yet</p>
                ) : (
                    comments.map((comment, idx) => (
                        <div
                            key={comment.id}
                            className={`w-full flex items-center my-2 px-4 mb-3 ${idx % 2 === 0 ? 'justify-start' : 'justify-end'}`}
                        >
                            <div className={`p-3 rounded-2xl bg-white max-w-[60%] ${idx % 2 === 0 ? '' : 'bg-purple-50'} break-words flex flex-col`}>
                                <span className="text-xs text-gray-500 font-semibold mb-1">{comment.authorEmail}</span>
                                <p className="text-base break-words font-light text-gray-700">{comment.content}</p>
                                <span className="text-xs text-gray-400 mt-1">
                                    {new Date(comment.createdAt).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}