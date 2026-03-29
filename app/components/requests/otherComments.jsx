'use client';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

export default function OtherComments({ requestId }) {
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

    const getInitial = (email) => {
        return email ? email.charAt(0).toUpperCase() : '?';
    };

    const getAvatarColor = (email) => {
        const colors = [
            'from-purple-500 to-indigo-500',
            'from-pink-500 to-rose-500',
            'from-blue-500 to-cyan-500',
            'from-amber-500 to-orange-500',
            'from-emerald-500 to-teal-500',
            'from-violet-500 to-purple-500',
        ];
        const hash = email?.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) || 0;
        return colors[hash % colors.length];
    };

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
                {[1, 2].map(i => (
                    <div key={i} className="flex items-start gap-3 animate-pulse">
                        <div className="w-8 h-8 rounded-full bg-slate-700/40 flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                            <div className="h-3 bg-slate-700/40 rounded w-24" />
                            <div className="h-3 bg-slate-700/30 rounded w-full" />
                            <div className="h-3 bg-slate-700/30 rounded w-2/3" />
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
        <div className="space-y-0.5">
            {comments.map((comment, idx) => (
                <div
                    key={comment.id}
                    className="group flex items-start gap-3 p-3 rounded-xl hover:bg-slate-800/30 transition-colors duration-150"
                >
                    {/* Avatar */}
                    <div
                        className={`w-8 h-8 rounded-full bg-gradient-to-br ${getAvatarColor(comment.author_email)} flex items-center justify-center flex-shrink-0 cursor-pointer`}
                        onClick={() => router.push(`/profile/${comment.author_email}`)}
                    >
                        <span className="text-[10px] font-bold text-white">{getInitial(comment.author_email)}</span>
                    </div>

                    {/* Comment Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 mb-0.5">
                            <span
                                onClick={() => router.push(`/profile/${comment.author_email}`)}
                                className="text-xs font-semibold text-purple-300 hover:text-purple-200 cursor-pointer transition-colors truncate"
                            >
                                {comment.author_email}
                            </span>
                            <span className="text-[10px] text-slate-600 flex-shrink-0">
                                {getTimeAgo(comment.created_at)}
                            </span>
                        </div>
                        <p className="text-sm text-slate-300 leading-relaxed break-words whitespace-pre-wrap">
                            {comment.content}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}