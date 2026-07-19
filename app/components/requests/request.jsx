import { FaRegComment } from 'react-icons/fa';
import { useState, useMemo } from 'react';
import RequestInfo from './requestInfo';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { getAvatarColor, getInitial } from '@/lib/messages/avatar-utils';

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
                    <div key={i} className="community-surface h-[150px] animate-pulse rounded-lg p-5">
                        <div className="mb-4 h-4 w-1/2 rounded bg-[var(--landing-border)]" />
                        <div className="mb-3 h-3 w-full rounded bg-[var(--landing-border)]" />
                        <div className="h-3 w-3/4 rounded bg-[var(--landing-border)]" />
                    </div>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="col-span-1 md:col-span-2 rounded-lg border border-red-500/20 bg-red-500/10 p-8 text-center">
                <p className="text-sm font-bold text-red-400 mb-1">{error.message}</p>
                <button
                    onClick={() => refetch()}
                    className="mt-2 text-xs font-bold text-red-400 hover:text-red-300"
                >
                    Try again
                </button>
            </div>
        );
    }

    if (requests.length === 0) {
        return (
            <div className="col-span-1 md:col-span-2 rounded-lg border border-dashed border-[var(--landing-border)] bg-white/20 p-10 text-center dark:bg-white/[0.03]">
                <p className="mb-1 font-black text-[var(--landing-ink)]">No suggestions yet</p>
                <p className="text-sm font-semibold text-[var(--landing-muted)]">Be the first to suggest an automation.</p>
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

    const getDisplayName = (req) => req.author?.display_name || 'User';

    const getAvatarSeed = (req) => req.author?.id || req.author?.display_name || 'user';

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
                    className="community-surface group cursor-pointer rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--landing-accent-2)]/35"
                >
                    <div className="p-4 sm:p-5">
                        {/* Title */}
                        <h2 className="text-[15px] sm:text-base font-black text-[var(--landing-ink)] mb-1.5 transition-colors">
                            {req.title}
                        </h2>

                        {/* Description */}
                        <p className="text-sm font-medium text-[var(--landing-muted)] leading-relaxed mb-3 line-clamp-2">
                            {req.description}
                        </p>

                        {/* Tags */}
                        {req.tags?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-3">
                                {req.tags.map((tag, i) => (
                                    <span
                                        key={i}
                                        className="rounded-md border border-[var(--landing-border)] bg-white/30 px-2 py-0.5 text-xs font-bold text-[var(--landing-accent-3)] dark:bg-white/[0.05]"
                                    >
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Footer: Author · Time · Comments */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--landing-muted)]">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                    }}
                                    className="flex items-center gap-1.5 text-[var(--landing-muted)]"
                                >
                                    <div className={`w-[18px] h-[18px] rounded-full bg-gradient-to-br ${getAvatarColor(getAvatarSeed(req))} flex items-center justify-center`}>
                                        <span className="text-[8px] font-bold text-white leading-none">{getInitial(getDisplayName(req))}</span>
                                    </div>
                                    <span className="truncate max-w-[150px]">{getDisplayName(req)}</span>
                                </button>
                                <span className="text-[var(--landing-border)]">·</span>
                                <span>{getTimeAgo(req.created_at)}</span>
                            </div>

                            <div className="flex items-center gap-1 text-xs font-semibold text-[var(--landing-muted)]">
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
