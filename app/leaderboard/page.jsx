'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, Sparkles, Trophy } from 'lucide-react';
import { useSidebar } from '@/lib/contexts/sidebar-context';
import { useThemeAdaptive } from '@/lib/contexts/theme-adaptive-context';
import AdaptiveBackground from '@/app/components/shared/AdaptiveBackground';

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

function CreatorCard({ creator, rank }) {
  const textSecondary = 'text-[var(--landing-muted)]';
  const rankColor = rank === 1 ? 'text-amber-500' : rank === 2 ? 'text-slate-400' : rank === 3 ? 'text-orange-500' : 'text-[var(--landing-muted)]';
  const rankBg = rank === 1
    ? 'bg-amber-500/12'
    : rank === 2
      ? 'bg-slate-400/12'
      : rank === 3
        ? 'bg-orange-500/12'
        : 'bg-white/30 dark:bg-white/[0.05]';

  return (
    <div className="community-surface flex flex-col rounded-[1.75rem] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--landing-accent-2)]/40">
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--landing-accent),var(--landing-accent-3))] text-lg font-black text-white shadow-[0_12px_30px_rgba(93,88,255,0.22)]">
            {getInitials(creator.name)}
          </div>
          <div>
            <h3 className="text-base font-black text-[var(--landing-ink)]">{creator.name}</h3>
            <p className={`text-xs font-semibold ${textSecondary}`}>{creator.email}</p>
          </div>
        </div>
        <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${rankColor} ${rankBg}`}>
          #{rank}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-5">
        <div className="rounded-2xl border border-[var(--landing-border)] bg-white/30 p-3 dark:bg-white/[0.05]">
          <p className={`text-[10px] font-black uppercase tracking-[0.16em] ${textSecondary}`}>Score</p>
          <p className="mt-1 text-lg font-black text-[var(--landing-ink)]">{creator.score}</p>
        </div>
        <div className="rounded-2xl border border-[var(--landing-border)] bg-white/30 p-3 dark:bg-white/[0.05]">
          <p className={`text-[10px] font-black uppercase tracking-[0.16em] ${textSecondary}`}>Runs</p>
          <p className="mt-1 text-lg font-black text-[var(--landing-ink)]">{creator.runs}</p>
        </div>
        <div className="rounded-2xl border border-[var(--landing-border)] bg-white/30 p-3 dark:bg-white/[0.05]">
          <p className={`text-[10px] font-black uppercase tracking-[0.16em] ${textSecondary}`}>Flows</p>
          <p className="mt-1 text-lg font-black text-[var(--landing-ink)]">{creator.automations}</p>
        </div>
      </div>

      <div className="mt-auto border-t border-[var(--landing-border)] pt-4">
        <p className={`text-[10px] font-black uppercase tracking-[0.16em] ${textSecondary}`}>Top Automation</p>
        <p className="mt-1 line-clamp-1 text-sm font-bold text-[var(--landing-ink)]">
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

  if (!mounted) return <div className="min-h-screen bg-[var(--landing-cream)]" />;

  return (
    <AdaptiveBackground variant="content" className="pt-16" showPattern>
      <main
        className="min-h-screen px-5 py-10 transition-[padding] duration-300 sm:px-6 sm:py-12"
        style={{ paddingLeft: sidebarOffset }}
      >
        <div className="mx-auto max-w-6xl">
          <div className="community-surface rounded-[2rem] p-6 sm:p-7">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--landing-border)] bg-white/35 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-[var(--landing-muted)] dark:bg-white/[0.06]">
                  <Sparkles className="h-3.5 w-3.5 text-[var(--landing-accent)]" />
                  Creator leaderboard
                </div>
                <h1 className="text-3xl font-black leading-tight text-[var(--landing-ink)] sm:text-4xl">
                  See who is actually shipping the best automations.
                </h1>
                <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[var(--landing-muted)] sm:text-base">
                  Rankings are based on published flows, total runs, and overall usage momentum across the marketplace.
                </p>
              </div>
              <div className="landing-card-soft flex w-full max-w-md items-center gap-3 rounded-2xl px-4 py-3">
                <Search className="h-5 w-5 text-[var(--landing-muted)]" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search creators..."
                  className="w-full bg-transparent text-sm font-bold text-[var(--landing-ink)] outline-none placeholder:text-[var(--landing-muted)]"
                />
              </div>
            </div>
          </div>

          <div className="mt-10">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-xl font-black text-[var(--landing-ink)]">
                <Trophy className="h-5 w-5 text-[var(--landing-accent-3)]" />
                Rankings
              </h2>
              <span className="text-sm font-bold text-[var(--landing-muted)]">{filteredCreators.length} creators</span>
            </div>

            {loading ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="community-surface h-48 animate-pulse rounded-[1.75rem]" />
                ))}
              </div>
            ) : filteredCreators.length === 0 ? (
              <div className="community-surface rounded-[1.75rem] py-20 text-center">
                <p className="text-lg font-black text-[var(--landing-ink)]">No creators found</p>
                <p className="mt-2 text-sm font-semibold text-[var(--landing-muted)]">Try adjusting your search.</p>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filteredCreators.map((creator, index) => (
                  <CreatorCard 
                    key={creator.email} 
                    creator={creator} 
                    rank={index + 1}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </AdaptiveBackground>
  );
}
