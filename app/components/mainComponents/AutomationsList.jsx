'use client';

import { useState, useEffect, useRef } from 'react';
import { useThemeAdaptive } from '@/lib/contexts/theme-adaptive-context';
import { useSidebar } from '@/lib/contexts/sidebar-context';
import { FaTiktok, FaLinkedinIn, FaFileInvoiceDollar, FaYoutube } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import { FiTrendingUp, FiZap, FiEdit2 } from 'react-icons/fi';

const FEATURED_NAMES = [
    'LinkedIn Auto Blog Poster',
    'TikTok Scheduled Auto-Post from Supabase',
    'TikTok Video Uploader',
    'TikTok Scheduled Auto-Post',
    'Viral Pattern Detector',
    'Video Pacing Analyzer',
    'Auto Caption Generator',
];

// Map automation name keywords to icon components
function getIcons(name = '') {
    const lower = name.toLowerCase();
    const icons = [];
    if (lower.includes('tiktok')) icons.push(<FaTiktok key="tiktok" className="w-3.5 h-3.5 text-white" />);
    if (lower.includes('linkedin')) icons.push(<FaLinkedinIn key="linkedin" className="w-3.5 h-3.5 text-[#0A66C2]" />);
    if (lower.includes('invoice')) icons.push(<FaFileInvoiceDollar key="invoice" className="w-3.5 h-3.5 text-purple-400" />);
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
                    // Sort: featured names first (in order), rest after
                    return unique.sort((a, b) => {
                        const ai = FEATURED_NAMES.findIndex(n => n.toLowerCase() === a.name?.toLowerCase());
                        const bi = FEATURED_NAMES.findIndex(n => n.toLowerCase() === b.name?.toLowerCase());
                        if (ai === -1 && bi === -1) return 0;
                        if (ai === -1) return 1;
                        if (bi === -1) return -1;
                        return ai - bi;
                    });
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

    const isFeatured = (automation) =>
        FEATURED_NAMES.slice(0, 3).some(n => n.toLowerCase() === automation.name?.toLowerCase());

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
                    <div className="grid grid-cols-3 gap-3">
                        {automations.map((automation, index) => (
                            <div
                                key={`${automation.id}-${index}`}
                                onClick={() => onSelect?.(automation)}
                                className={`p-3 rounded-xl border cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] relative ${isDarkMode
                                    ? 'bg-slate-800 border-slate-700 hover:border-purple-500 hover:shadow-lg hover:shadow-purple-900/20'
                                    : 'bg-white border-slate-200 hover:border-purple-400 hover:shadow-md'
                                } ${isFeatured(automation) ? (isDarkMode ? 'ring-1 ring-purple-500/30' : 'ring-1 ring-purple-300/50') : ''}`}
                            >
                                {automation.name?.toLowerCase().includes('linkedin') && (
                                    <span className="absolute top-2 right-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[#0A66C2]/20 text-[#0A66C2]">
                                        Featured
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
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-purple-400">
                                        {automation.price_per_run ? `${automation.price_per_run}` : 'Free'}
                                    </span>
                                    <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                        {automation.total_runs || 0} runs
                                    </span>
                                </div>
                            </div>
                        ))}
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
