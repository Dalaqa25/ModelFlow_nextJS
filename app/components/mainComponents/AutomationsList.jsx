'use client';

import { useState, useEffect, useRef } from 'react';
import { useThemeAdaptive } from '@/lib/contexts/theme-adaptive-context';
import { useSidebar } from '@/lib/contexts/sidebar-context';
import { FaTiktok, FaLinkedinIn, FaYoutube } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import { FiTrendingUp, FiZap, FiEdit2, FiBriefcase } from 'react-icons/fi';
import { getAutomationCreator, getCreatorInitials } from '@/lib/automations/public-creator';

// Anything added in this window is still worth calling out.
const NEW_FOR_DAYS = 14;

// Map automation name keywords to icon components
function getIcons(name = '') {
    const lower = name.toLowerCase();
    const icons = [];
    if (lower.includes('job') || lower.includes('matcher') || lower.includes('career')) icons.push(<FiBriefcase key="job" className="w-3.5 h-3.5 text-purple-400" />);
    if (lower.includes('tiktok')) icons.push(<FaTiktok key="tiktok" className="w-3.5 h-3.5 text-white" />);
    if (lower.includes('linkedin')) icons.push(<FaLinkedinIn key="linkedin" className="w-3.5 h-3.5 text-[#0A66C2]" />);
    if (lower.includes('youtube')) icons.push(<FaYoutube key="youtube" className="w-3.5 h-3.5 text-red-500" />);
    if (lower.includes('google') || lower.includes('sheet') || lower.includes('drive') || lower.includes('gmail')) icons.push(<FcGoogle key="google" className="w-3.5 h-3.5" />);
    if (lower.includes('viral') || lower.includes('pattern') || lower.includes('pacing') || lower.includes('analyzer')) icons.push(<FiTrendingUp key="trend" className="w-3.5 h-3.5 text-purple-400" />);
    if (lower.includes('caption')) icons.push(<FiEdit2 key="caption" className="w-3.5 h-3.5 text-gray-300" />);
    if (icons.length === 0) icons.push(<FiZap key="zap" className="w-3.5 h-3.5 text-purple-400" />);
    return icons;
}

export default function AutomationsList({ isVisible = true, onSelect }) {
    const { isDarkMode } = useThemeAdaptive();
    const { isExpanded, isMobile } = useSidebar();
    const [automations, setAutomations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const scrollRef = useRef(null);
    const ITEMS_PER_PAGE = 12;

    const sidebarOffset = !isMobile ? (isExpanded ? 256 : 52) : 0;

    useEffect(() => {
        fetchAutomations();
    }, []);

    const fetchAutomations = async () => {
        if (loading || !hasMore) return;
        try {
            setLoading(true);
            const offset = page * ITEMS_PER_PAGE;
            const response = await fetch(`/api/automations?limit=${ITEMS_PER_PAGE}&offset=${offset}`);
            if (response.ok) {
                const data = await response.json();
                if (!Array.isArray(data)) return;
                if (data.length < ITEMS_PER_PAGE) setHasMore(false);

                setAutomations(prev => {
                    const combined = [...prev, ...data];
                    // Deduplicate by id
                    const seen = new Set();
                    const unique = combined.filter(a => {
                        if (seen.has(a.id)) return false;
                        seen.add(a.id);
                        return true;
                    });
                    // The API already returns newest first. This used to be
                    // re-sorted against a hardcoded list of names, which pinned
                    // the same handful to the top no matter what was added
                    // since — so everything built recently was buried and the
                    // page aged badly on its own. Order comes from the data now.
                    return unique;
                });
                setPage(prev => prev + 1);
            }
        } catch (error) {
            console.error('Failed to fetch automations:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        if (scrollHeight - scrollTop <= clientHeight + 100 && hasMore && !loading) {
            fetchAutomations();
        }
    };

    // "New" is a fact about when it was published, so it keeps itself honest
    // and needs no editing when the next automation lands.
    const isFeatured = (automation) => {
        const created = new Date(automation.created_at || 0).getTime();
        if (!created) return false;
        return Date.now() - created <= NEW_FOR_DAYS * 86_400_000;
    };

    return (
        <div
            className={`fixed bottom-6 right-0 w-full max-w-4xl px-6 z-40 transition-all duration-500 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            style={{
                left: sidebarOffset,
                margin: '0 auto',
                transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.5s',
            }}
        >
            <div className="rounded-[2rem] h-96 relative">
                <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="h-full overflow-y-auto p-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                >
                    <div className="grid grid-cols-2 gap-3">
                        {automations.map((automation, index) => {
                            const creator = getAutomationCreator(automation);
                            return (
                            <div
                                key={`${automation.id}-${index}`}
                                onClick={() => onSelect?.(automation)}
                                className={`p-3 rounded-xl border cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] relative ${isDarkMode
                                    ? 'bg-slate-800 border-slate-700 hover:border-purple-500 hover:shadow-lg hover:shadow-purple-900/20'
                                    : 'bg-white border-slate-200 hover:border-purple-400 hover:shadow-md'
                                } ${automation.name?.toLowerCase().includes('vehicle')
                                    ? 'ring-1 ring-orange-500/60 shadow-[0_0_16px_3px_rgba(249,115,22,0.2)]'
                                    : isFeatured(automation) ? (isDarkMode ? 'ring-1 ring-purple-500/30' : 'ring-1 ring-purple-300/50') : ''}`}
                            >
                                {/* Badged on publish date, not on the words in the
                                    name — "Featured" went to anything containing
                                    "linkedin" and "New" to anything containing
                                    "vehicle", so the labels stopped meaning
                                    anything the moment the catalogue moved on. */}
                                {isFeatured(automation) && (
                                    <span className="absolute top-2 right-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400">
                                        New
                                    </span>
                                )}
                                <div className="flex items-center gap-1.5 mb-2">
                                    {getIcons(automation.name)}
                                </div>
                                <h3 className={`font-semibold text-sm mb-2 line-clamp-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {automation.name}
                                </h3>
                                <p className={`text-xs mb-3 line-clamp-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {automation.description}
                                </p>
                                <div className="mb-3 flex items-center gap-2">
                                    <span
                                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cover bg-center text-[8px] font-black ${isDarkMode ? 'bg-slate-700 text-purple-300' : 'bg-purple-50 text-purple-700'}`}
                                        style={creator.profile_image_url ? { backgroundImage: `url(${creator.profile_image_url})` } : undefined}
                                        aria-hidden="true"
                                    >
                                        {!creator.profile_image_url && getCreatorInitials(creator.display_name)}
                                    </span>
                                    <span className={`truncate text-[11px] font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                        By <span className={isDarkMode ? 'text-slate-300' : 'text-slate-700'}>{creator.display_name}</span>
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-purple-400">
                                        {automation.price_per_run ? `${automation.price_per_run}` : 'Free'}
                                    </span>
                                    <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                        {automation.total_runs || 0} runs
                                    </span>
                                </div>
                            </div>
                            );
                        })}
                    </div>
                    {loading && (
                        <div className="p-4 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-400"></div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
