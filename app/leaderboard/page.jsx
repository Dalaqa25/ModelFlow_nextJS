'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useSidebar } from '@/lib/contexts/sidebar-context';
import { useThemeAdaptive } from '@/lib/contexts/theme-adaptive-context';

function getNameFromEmail(email = '') {
  const prefix = email.split('@')[0] || 'builder';
  return prefix
    .replace(/[._-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getInitials(name) {
  return name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function rankCreators(automations) {
  const creators = new Map();

  for (const automation of automations) {
    const email = automation.author_email || 'unknown@modelgrow.local';
    const current = creators.get(email) || {
      email,
      name: getNameFromEmail(email),
      automations: 0,
      runs: 0,
      tokensPerRunTotal: 0,
      topAutomation: null,
    };

    const runs = automation.total_runs || 0;
    current.automations += 1;
    current.runs += runs;
    current.tokensPerRunTotal += automation.token_cost || 0;
    if (!current.topAutomation || runs > (current.topAutomation.total_runs || 0)) {
      current.topAutomation = automation;
    }
    creators.set(email, current);
  }

  return Array.from(creators.values())
    .map((creator) => ({
      ...creator,
      score: creator.runs * 10 + creator.automations * 25 + creator.tokensPerRunTotal,
    }))
    .sort((a, b) => b.score - a.score);
}

function CreatorCard({ creator, rank, isDarkMode }) {
  const cardClasses = isDarkMode 
    ? "bg-[#1C1C1E] border-[#2A2A2D] hover:border-violet-500/50" 
    : "bg-white border-slate-200 hover:border-violet-400 hover:shadow-md";
    
  const textPrimary = isDarkMode ? "text-white" : "text-slate-900";
  const textSecondary = isDarkMode ? "text-slate-400" : "text-slate-500";
  
  const rankColor = rank === 1 ? "text-amber-500" : rank === 2 ? "text-slate-400" : rank === 3 ? "text-orange-500" : textSecondary;
  const rankBg = rank === 1 ? (isDarkMode ? "bg-amber-500/10" : "bg-amber-50") : 
                 rank === 2 ? (isDarkMode ? "bg-slate-400/10" : "bg-slate-100") : 
                 rank === 3 ? (isDarkMode ? "bg-orange-500/10" : "bg-orange-50") : 
                 (isDarkMode ? "bg-white/5" : "bg-slate-50");

  return (
    <div className={`flex flex-col rounded-xl border p-5 transition-all duration-200 ${cardClasses}`}>
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-violet-600 text-lg font-bold text-white shadow-sm">
            {getInitials(creator.name)}
          </div>
          <div>
            <h3 className={`text-base font-bold ${textPrimary}`}>{creator.name}</h3>
            <p className={`text-xs ${textSecondary}`}>{creator.email}</p>
          </div>
        </div>
        <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${rankColor} ${rankBg}`}>
          #{rank}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-5">
        <div className={`rounded-lg border p-3 ${isDarkMode ? 'border-[#2A2A2D] bg-[#2A2A2D]' : 'border-slate-100 bg-slate-50'}`}>
          <p className={`text-[10px] font-semibold uppercase tracking-wider ${textSecondary}`}>Score</p>
          <p className={`mt-1 text-lg font-bold ${textPrimary}`}>{creator.score}</p>
        </div>
        <div className={`rounded-lg border p-3 ${isDarkMode ? 'border-[#2A2A2D] bg-[#2A2A2D]' : 'border-slate-100 bg-slate-50'}`}>
          <p className={`text-[10px] font-semibold uppercase tracking-wider ${textSecondary}`}>Runs</p>
          <p className={`mt-1 text-lg font-bold ${textPrimary}`}>{creator.runs}</p>
        </div>
        <div className={`rounded-lg border p-3 ${isDarkMode ? 'border-[#2A2A2D] bg-[#2A2A2D]' : 'border-slate-100 bg-slate-50'}`}>
          <p className={`text-[10px] font-semibold uppercase tracking-wider ${textSecondary}`}>Flows</p>
          <p className={`mt-1 text-lg font-bold ${textPrimary}`}>{creator.automations}</p>
        </div>
      </div>

      <div className={`mt-auto pt-4 border-t ${isDarkMode ? 'border-[#2A2A2D]' : 'border-slate-100'}`}>
        <p className={`text-[10px] font-semibold uppercase tracking-wider ${textSecondary}`}>Top Automation</p>
        <p className={`mt-1 line-clamp-1 text-sm font-medium ${textPrimary}`}>
          {creator.topAutomation?.name || 'No automation yet'}
        </p>
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  const { isMobile, isExpanded } = useSidebar();
  const { isDarkMode, mounted } = useThemeAdaptive();
  const sidebarOffset = !isMobile ? (isExpanded ? 256 : 52) : 0;
  
  const [automations, setAutomations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let active = true;
    async function fetchAutomations() {
      try {
        const response = await fetch('/api/automations');
        const data = await response.json();
        if (active && Array.isArray(data)) setAutomations(data);
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchAutomations();
    return () => { active = false; };
  }, []);

  const creators = useMemo(() => rankCreators(automations), [automations]);
  const filteredCreators = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return creators;
    return creators.filter((creator) => (
      creator.name.toLowerCase().includes(search) ||
      creator.email.toLowerCase().includes(search) ||
      creator.topAutomation?.name?.toLowerCase().includes(search)
    ));
  }, [creators, query]);

  if (!mounted) return <div className="min-h-screen bg-[#F8FAFC]" />;

  const bgClass = isDarkMode ? "bg-[#09090B]" : "bg-[#F8FAFC]";
  const textPrimary = isDarkMode ? "text-white" : "text-slate-900";
  const textSecondary = isDarkMode ? "text-slate-400" : "text-slate-500";
  const searchBg = isDarkMode ? "bg-[#1C1C1E] border-[#2A2A2D] text-white placeholder-slate-500" : "bg-white border-slate-200 text-slate-900 placeholder-slate-400";

  return (
    <div className={`min-h-screen transition-colors duration-200 ${bgClass}`}>
      <main
        className="px-5 py-12 transition-[padding] duration-300 sm:px-8"
        style={{ paddingLeft: sidebarOffset }}
      >
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-10">
            <h1 className={`text-3xl font-bold sm:text-4xl ${textPrimary}`}>
              Leaderboard
            </h1>
            <p className={`mt-3 max-w-2xl text-base ${textSecondary}`}>
              The top developers building automations on ModelGrow.
            </p>
          </div>

          {/* Search Bar */}
          <div className="mb-10">
            <div className={`flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors focus-within:border-violet-500 focus-within:ring-1 focus-within:ring-violet-500 ${searchBg}`}>
              <Search className="h-5 w-5 opacity-50" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search creators..."
                className="w-full bg-transparent text-sm font-medium outline-none"
              />
            </div>
          </div>

          {/* Results */}
          <div>
            <div className="mb-5 flex items-center justify-between">
              <h2 className={`text-xl font-bold ${textPrimary}`}>Rankings</h2>
              <span className={`text-sm ${textSecondary}`}>{filteredCreators.length} creators</span>
            </div>

            {loading ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className={`h-48 animate-pulse rounded-xl border ${isDarkMode ? 'border-[#2A2A2D] bg-[#1C1C1E]' : 'border-slate-200 bg-slate-100'}`} />
                ))}
              </div>
            ) : filteredCreators.length === 0 ? (
              <div className={`rounded-xl border py-20 text-center ${isDarkMode ? 'border-[#2A2A2D] bg-[#1C1C1E]' : 'border-slate-200 bg-white'}`}>
                <p className={`text-lg font-semibold ${textPrimary}`}>No creators found</p>
                <p className={`mt-2 text-sm ${textSecondary}`}>Try adjusting your search.</p>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filteredCreators.map((creator, index) => (
                  <CreatorCard 
                    key={creator.email} 
                    creator={creator} 
                    rank={index + 1} 
                    isDarkMode={isDarkMode}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
