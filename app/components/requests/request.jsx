import { FaRegComment } from 'react-icons/fa';
import { useState, useMemo } from 'react';
import RequestInfo from './requestInfo';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

export default function Request() {
    const [selectedRequestId, setSelectedRequestId] = useState(null);
    const router = useRouter();

    const { data: requests = [], isLoading, error, refetch } = useQuery({
        queryKey: ['requests'],
        queryFn: async () => {
            const res = await fetch('/api/requests', { credentials: 'include' });
            if (!res.ok) {
                throw new Error('Failed to fetch requests');
            }
            const data = await res.json();
            if (!Array.isArray(data)) {
                throw new Error('Invalid data format received');
            }
            return data;
        }
    });

    const sortedRequests = useMemo(() => {
        return [...requests].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }, [requests]);

    if (isLoading) {
        return (
            <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="bg-slate-800/30 border border-slate-700/20 rounded-xl p-5 animate-pulse h-[140px] flex flex-col justify-center">
                        <div className="h-4 bg-slate-700/40 rounded w-1/2 mb-4" />
                        <div className="h-3 bg-slate-700/30 rounded w-full mb-3" />
                        <div className="h-3 bg-slate-700/30 rounded w-3/4" />
                    </div>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="col-span-1 md:col-span-2 bg-red-500/8 border border-red-500/15 rounded-xl p-8 text-center">
                <p className="text-red-300 text-sm font-medium mb-1">{error.message}</p>
                <button
                    onClick={() => refetch()}
                    className="text-xs text-red-400/70 hover:text-red-300 mt-2 transition-colors"
                >
                    Try again
                </button>
            </div>
        );
    }

    if (requests.length === 0) {
        return (
            <div className="col-span-1 md:col-span-2 border border-slate-700/20 border-dashed rounded-xl p-10 text-center">
                <p className="text-slate-300 font-medium mb-1">No suggestions yet</p>
                <p className="text-slate-500 text-sm">Be the first to suggest an automation!</p>
            </div>
        );
    }

    const getTimeAgo = (dateString) => {
        const now = new Date();
        const created = new Date(dateString);
        const diffMs = now - created;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 30) return `${diffDays}d ago`;
        return created.toLocaleDateString();
    };

    const getInitial = (email) => email ? email.charAt(0).toUpperCase() : '?';

    const getAvatarColor = (email) => {
        const colors = [
            'from-purple-500 to-indigo-500',
            'from-pink-500 to-rose-500',
            'from-blue-500 to-cyan-500',
            'from-amber-500 to-orange-500',
            'from-emerald-500 to-teal-500',
            'from-violet-500 to-fuchsia-500',
        ];
        const hash = email?.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) || 0;
        return colors[hash % colors.length];
    };

    return (
        <>
            {/* Backdrop for detail panel */}
            <div
                className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 ${selectedRequestId ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setSelectedRequestId(null)}
            />

            {selectedRequestId && (
                <RequestInfo
                    request={requests.find(req => req.id === selectedRequestId)}
                    onClose={() => setSelectedRequestId(null)}
                />
            )}

            {sortedRequests.map((req) => (
                <div
                    key={req.id}
                    onClick={() => setSelectedRequestId(req.id)}
                    className="group bg-slate-800/25 hover:bg-slate-800/45 border border-slate-700/20 hover:border-slate-600/30 rounded-xl cursor-pointer transition-all duration-200"
                >
                    <div className="p-4 sm:p-5">
                        {/* Title */}
                        <h2 className="text-[15px] sm:text-base font-semibold text-white mb-1.5 group-hover:text-purple-100 transition-colors">
                            {req.title}
                        </h2>

                        {/* Description */}
                        <p className="text-sm text-slate-400 leading-relaxed mb-3 line-clamp-2">
                            {req.description}
                        </p>

                        {/* Tags */}
                        {req.tags?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-3">
                                {req.tags.map((tag, i) => (
                                    <span
                                        key={i}
                                        className="text-xs text-purple-300/70 bg-purple-500/8 border border-purple-500/10 rounded-md px-2 py-0.5 font-medium"
                                    >
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Footer: Author · Time · Comments */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        router.push(`/profile/${req.author_email}`);
                                    }}
                                    className="flex items-center gap-1.5 hover:text-purple-300 transition-colors"
                                >
                                    <div className={`w-4.5 h-4.5 w-[18px] h-[18px] rounded-full bg-gradient-to-br ${getAvatarColor(req.author_email)} flex items-center justify-center`}>
                                        <span className="text-[8px] font-bold text-white leading-none">{getInitial(req.author_email)}</span>
                                    </div>
                                    <span className="truncate max-w-[150px]">{req.author_email}</span>
                                </button>
                                <span className="text-slate-600">·</span>
                                <span>{getTimeAgo(req.created_at)}</span>
                            </div>

                            <div className="flex items-center gap-1 text-xs text-slate-500">
                                <FaRegComment className="text-[11px]" />
                                <span>{req.commentsCount || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </>
    );
}