'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Bot, Briefcase, CalendarDays, Database, Mail, Search, TrendingUp, Workflow } from 'lucide-react';
import { useSidebar } from '@/lib/contexts/sidebar-context';
import { useThemeAdaptive } from '@/lib/contexts/theme-adaptive-context';
import AdaptiveBackground from '@/app/components/shared/AdaptiveBackground';

const CATEGORIES = [
  { label: 'All', keywords: [] },
  { label: 'Latest', keywords: [] },
  { label: 'Featured', keywords: ['featured', 'linkedin', 'gmail', 'slack', 'google', 'notion'] },
  { label: 'Everyday', keywords: ['email', 'gmail', 'calendar', 'task', 'briefing', 'schedule'] },
  { label: 'Sales', keywords: ['lead', 'hubspot', 'stripe', 'crm', 'sales'] },
  { label: 'Marketing', keywords: ['linkedin', 'content', 'blog', 'youtube', 'tiktok', 'viral'] },
  { label: 'Operations', keywords: ['sheet', 'notion', 'database', 'sync', 'report'] },
  { label: 'AI', keywords: ['ai', 'generate', 'summarize', 'analyze', 'content'] },
];

function parseConnectors(value) {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'string') return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }
}

function getAutomationIcon(automation) {
  const haystack = `${automation.name || ''} ${automation.description || ''} ${parseConnectors(automation.required_connectors).join(' ')}`.toLowerCase();
  if (haystack.includes('mail') || haystack.includes('gmail')) return Mail;
  if (haystack.includes('calendar') || haystack.includes('schedule')) return CalendarDays;
  if (haystack.includes('sheet') || haystack.includes('database') || haystack.includes('notion')) return Database;
  if (haystack.includes('job') || haystack.includes('lead') || haystack.includes('sales')) return Briefcase;
  if (haystack.includes('ai') || haystack.includes('generate') || haystack.includes('summar')) return Bot;
  if (haystack.includes('viral') || haystack.includes('trend')) return TrendingUp;
  return Workflow;
}

function matchesCategory(automation, category) {
  if (category.label === 'All' || category.label === 'Latest') return true;
  const haystack = `${automation.name || ''} ${automation.description || ''} ${parseConnectors(automation.required_connectors).join(' ')}`.toLowerCase();
  return category.keywords.some((keyword) => haystack.includes(keyword));
}

function getCreatedAtTime(automation) {
  const value = automation.created_at || automation.updated_at;
  const time = value ? new Date(value).getTime() : 0;
  return Number.isFinite(time) ? time : 0;
}

function AutomationCard({ automation, onUse, featured = false }) {
  const Icon = getAutomationIcon(automation);
  const connectors = parseConnectors(automation.required_connectors);
  const tokenCost = automation.token_cost || 0;

  return (
    <div 
      onClick={() => onUse(automation)}
      className={`community-surface group flex cursor-pointer flex-col rounded-[1.75rem] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--landing-accent-2)]/40 ${featured ? 'lg:min-h-[320px]' : ''}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--landing-border)] bg-white/35 text-[var(--landing-accent-3)] dark:bg-white/[0.07]">
          <Icon className="h-5 w-5" />
        </div>
        <div className={`rounded-full border px-2.5 py-1 text-xs font-black ${
          tokenCost > 0
            ? 'border-[var(--landing-accent-2)]/20 bg-[var(--landing-accent-2)]/12 text-[var(--landing-accent-2)]'
            : 'border-[var(--landing-border)] bg-white/30 text-[var(--landing-muted)] dark:bg-white/[0.05]'
        }`}>
          {tokenCost > 0 ? `${tokenCost} tokens` : 'Free'}
        </div>
      </div>

      <h3 className="mb-2 line-clamp-1 text-lg font-black leading-tight text-[var(--landing-ink)]">
        {automation.name}
      </h3>
      <p className="flex-grow text-sm font-semibold leading-relaxed text-[var(--landing-muted)] line-clamp-2">
        {automation.description || 'No description provided.'}
      </p>

      <div className="mt-5 flex flex-wrap gap-1.5">
        {connectors.slice(0, 3).map((connector) => (
          <span
            key={connector}
            className="rounded-full border border-[var(--landing-border)] bg-white/30 px-2.5 py-1 text-[11px] font-bold text-[var(--landing-muted)] dark:bg-white/[0.05]"
          >
            {connector}
          </span>
        ))}
        {connectors.length > 3 && (
          <span className="rounded-full border border-[var(--landing-border)] bg-white/30 px-2.5 py-1 text-[11px] font-bold text-[var(--landing-muted)] dark:bg-white/[0.05]">
            +{connectors.length - 3}
          </span>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-[var(--landing-border)] pt-4">
        <span className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--landing-muted)]">
          {automation.total_runs || 0} runs
        </span>
        <span className="flex items-center gap-1 text-sm font-black text-[var(--landing-accent-3)] transition-colors group-hover:text-[var(--landing-ink)]">
          Setup
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </div>
  );
}

export default function ExplorePage() {
  const router = useRouter();
  const { isMobile, isExpanded } = useSidebar();
  const { isDarkMode, mounted } = useThemeAdaptive();
  const sidebarOffset = !isMobile ? (isExpanded ? 256 : 52) : 0;
  
  const [automations, setAutomations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');

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

  const activeCategory = CATEGORIES.find((item) => item.label === category) || CATEGORIES[0];

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    const results = automations.filter((automation) => {
      const connectors = parseConnectors(automation.required_connectors);
      const haystack = `${automation.name || ''} ${automation.description || ''} ${connectors.join(' ')}`.toLowerCase();
      const searchMatch = !search || haystack.includes(search);
      return searchMatch && matchesCategory(automation, activeCategory);
    });

    if (activeCategory.label === 'Latest') {
      return [...results].sort((a, b) => getCreatedAtTime(b) - getCreatedAtTime(a));
    }
    return results;
  }, [automations, query, activeCategory]);

  const featured = useMemo(
    () => [...automations].sort((a, b) => (b.total_runs || 0) - (a.total_runs || 0)).slice(0, 4),
    [automations]
  );

  const handleUse = (automation) => {
    router.push(`/main?preview=${encodeURIComponent(automation.id)}`);
  };

  if (!mounted) return <div className="min-h-screen bg-[var(--landing-cream)]" />;

  const tabActive = isDarkMode
    ? 'bg-white/14 text-[var(--landing-ink)] border-[var(--landing-accent-2)]/30'
    : 'bg-white/65 text-[var(--landing-ink)] border-[var(--landing-border)]';

  const tabInactive = 'text-[var(--landing-muted)] hover:bg-white/30 hover:text-[var(--landing-ink)] dark:hover:bg-white/[0.06]';

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
                  <Workflow className="h-3.5 w-3.5 text-[var(--landing-accent)]" />
                  Explore automations
                </div>
                <h1 className="text-3xl font-black leading-tight text-[var(--landing-ink)] sm:text-4xl">
                  Find workflows that feel native to ModelGrow.
                </h1>
                <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[var(--landing-muted)] sm:text-base">
                  Browse community-built automations, filter by use case, and launch the ones that match your workflow.
                </p>
              </div>
              <div className="landing-card-soft flex w-full max-w-xl items-center gap-3 rounded-2xl px-4 py-3">
                <Search className="h-5 w-5 text-[var(--landing-muted)]" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search templates, apps, or use cases..."
                  className="w-full bg-transparent text-sm font-bold text-[var(--landing-ink)] outline-none placeholder:text-[var(--landing-muted)]"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {CATEGORIES.map((item) => (
                <button
                  key={item.label}
                  onClick={() => setCategory(item.label)}
                  className={`shrink-0 rounded-full border px-4 py-2 text-sm font-black transition-colors ${
                    category === item.label ? tabActive : tabInactive
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {!query && (category === 'All' || category === 'Latest') && featured.length > 0 && (
            <div className="mt-10 mb-12">
              <h2 className="mb-5 text-xl font-black text-[var(--landing-ink)]">Featured</h2>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {featured.map((automation) => (
                  <AutomationCard 
                    key={automation.id} 
                    automation={automation} 
                    onUse={handleUse} 
                    featured 
                  />
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-black text-[var(--landing-ink)]">
                {category === 'All' ? 'All Templates' : category}
              </h2>
              <span className="text-sm font-bold text-[var(--landing-muted)]">{filtered.length} results</span>
            </div>

            {loading ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="community-surface h-48 animate-pulse rounded-[1.75rem]" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="community-surface rounded-[1.75rem] py-20 text-center">
                <p className="text-lg font-black text-[var(--landing-ink)]">No automations found</p>
                <p className="mt-2 text-sm font-semibold text-[var(--landing-muted)]">Try adjusting your search or category filter.</p>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((automation) => (
                  <AutomationCard 
                    key={automation.id} 
                    automation={automation} 
                    onUse={handleUse} 
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
