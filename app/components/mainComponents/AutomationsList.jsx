'use client';

import { useState, useEffect, useRef } from 'react';
import { useThemeAdaptive } from '@/lib/contexts/theme-adaptive-context';

export default function AutomationsList({ isVisible = true }) {
    const { isDarkMode } = useThemeAdaptive();
    const [automations, setAutomations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const scrollRef = useRef(null);
    const ITEMS_PER_PAGE = 9;

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
                if (data.length < ITEMS_PER_PAGE) {
                    setHasMore(false);
                }
                setAutomations(prev => [...prev, ...data]);
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

    return (
        <div className={`fixed left-1/2 -translate-x-1/2 bottom-6 w-full max-w-4xl px-6 z-40 transition-opacity duration-500 ${
            isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}>
            <div className="rounded-[2rem] h-80 relative">
                <div 
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="h-full overflow-y-auto p-3"
                    style={{ scrollbarWidth: 'thin' }}
                >
                    <div className="grid grid-cols-3 gap-3">
                        {automations.map((automation, index) => (
                            <div
                                key={`${automation.id}-${index}`}
                                className={`p-3 rounded-xl border cursor-pointer transition-all hover:scale-[1.02] ${
                                    isDarkMode 
                                        ? 'bg-slate-800 border-slate-700 hover:border-purple-500' 
                                        : 'bg-white border-slate-200 hover:border-purple-400'
                                }`}
                            >
                                <h3 className={`font-semibold text-sm mb-2 line-clamp-1 ${
                                    isDarkMode ? 'text-white' : 'text-gray-900'
                                }`}>
                                    {automation.name}
                                </h3>
                                <p className={`text-xs mb-3 line-clamp-2 ${
                                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                    {automation.description}
                                </p>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-purple-400">
                                        {automation.price_per_run ? `$${automation.price_per_run}` : 'Free'}
                                    </span>
                                    <span className={`text-xs ${
                                        isDarkMode ? 'text-gray-500' : 'text-gray-500'
                                    }`}>
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
