'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  Bot,
  Briefcase,
  CalendarDays,
  Database,
  Mail,
  Search,
  Sparkles,
  TrendingUp,
  Workflow,
} from 'lucide-react';
import { useSidebar } from '@/lib/contexts/sidebar-context';
import { useAuth } from '@/lib/auth/supabase-auth-context';
import MarketingFooter from '@/app/components/marketing/MarketingFooter';
import { getAutomationCreator, getCreatorInitials } from '@/lib/automations/public-creator';

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

const cardTones = [
  { background: '#f2edff', accent: '#7041d6' },
  { background: '#e9f6f2', accent: '#168262' },
  { background: '#fff1dc', accent: '#a86b17' },
  { background: '#eaf2ff', accent: '#376ac3' },
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

function AutomationCard({ automation, onUse, index = 0, featured = false }) {
  const Icon = getAutomationIcon(automation);
  const connectors = parseConnectors(automation.required_connectors);
  const tokenCost = automation.token_cost || 0;
  const tone = cardTones[index % cardTones.length];
  const creator = getAutomationCreator(automation);

  return (
    <article
      onClick={() => onUse(automation)}
      className={`group flex cursor-pointer flex-col rounded-[28px] border border-[#17203a]/9 bg-white p-6 shadow-[0_14px_42px_rgba(23,32,58,0.055)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_60px_rgba(51,37,111,0.12)] ${featured ? 'min-h-[330px]' : 'min-h-[300px]'}`}
    >
      <div className="flex items-start justify-between">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ color: tone.accent, backgroundColor: tone.background }}>
          <Icon className="h-5 w-5" />
        </span>
        <span className="rounded-full bg-[#f4f2f8] px-3 py-1.5 text-[11px] font-black text-[#737b8e]">
          {tokenCost > 0 ? `${tokenCost} tokens` : 'Free'}
        </span>
      </div>

      <div className="mt-7 flex-1">
        <h3 className="line-clamp-2 text-[1.3rem] font-black leading-7 tracking-[-0.035em] text-[#151b2d]">{automation.name}</h3>
        <p className="mt-3 line-clamp-3 text-sm font-medium leading-6 text-[#697287]">{automation.description || 'A ready-made workflow you can set up in ModelGrow.'}</p>
      </div>

      <div className="mt-5 flex items-center gap-2.5">
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#eee9f8] bg-cover bg-center text-[9px] font-black text-[#6844bb] ring-1 ring-[#17203a]/7"
          style={creator.profile_image_url ? { backgroundImage: `url(${creator.profile_image_url})` } : undefined}
          aria-hidden="true"
        >
          {!creator.profile_image_url && getCreatorInitials(creator.display_name)}
        </span>
        <span className="min-w-0 truncate text-xs font-bold text-[#7c8393]">
          By <span className="text-[#3b4254]">{creator.display_name}</span>
        </span>
      </div>

      <div className="mt-4 flex min-h-8 flex-wrap gap-1.5">
        {connectors.slice(0, 3).map((connector) => (
          <span key={connector} className="rounded-full border border-[#17203a]/8 bg-[#faf9fc] px-2.5 py-1 text-[10px] font-black text-[#71798c]">
            {connector}
          </span>
        ))}
        {connectors.length > 3 && <span className="rounded-full bg-[#f4f2f8] px-2.5 py-1 text-[10px] font-black text-[#71798c]">+{connectors.length - 3}</span>}
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-[#17203a]/8 pt-5">
        <span className="text-[11px] font-black uppercase tracking-[0.13em] text-[#999fac]">{automation.total_runs || 0} runs</span>
        <span className="flex items-center gap-1.5 text-sm font-black" style={{ color: tone.accent }}>
          Set it up <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </article>
  );
}

export default function ExplorePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();
  const { isMobile, isExpanded } = useSidebar();
  const sidebarOffset = isAuthenticated && !isMobile ? (isExpanded ? 256 : 52) : 0;
  const [automations, setAutomations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');

  useEffect(() => {
    const incomingSearch = searchParams.get('search');
    if (incomingSearch) setQuery(incomingSearch);
  }, [searchParams]);

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
      return (!search || haystack.includes(search)) && matchesCategory(automation, activeCategory);
    });

    return activeCategory.label === 'Latest'
      ? [...results].sort((a, b) => getCreatedAtTime(b) - getCreatedAtTime(a))
      : results;
  }, [automations, query, activeCategory]);

  const featured = useMemo(
    () => [...automations].sort((a, b) => (b.total_runs || 0) - (a.total_runs || 0)).slice(0, 4),
    [automations]
  );

  const handleUse = (automation) => {
    if (!isAuthenticated) {
      window.dispatchEvent(new Event('modelgrow:open-signup'));
      return;
    }
    router.push(`/main?preview=${encodeURIComponent(automation.id)}`);
  };

  return (
    <div
      className="marketing-page overflow-hidden transition-[padding] duration-300"
      style={{ paddingLeft: sidebarOffset }}
    >
      <main className={isAuthenticated ? 'pt-16' : 'pt-[76px]'}>
        <section className="explore-hero relative overflow-hidden px-5 pb-20 pt-16 sm:px-8 sm:pb-24 sm:pt-20">
          <div className="absolute inset-0 marketing-hero-grid" />
          <div className="relative mx-auto grid min-w-0 max-w-[1240px] items-end gap-10 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="min-w-0">
              <p className="marketing-kicker flex items-center gap-2"><Sparkles className="h-4 w-4" /> Ready-made automations</p>
              <h1 className="marketing-display mt-5 max-w-[740px] text-[3.25rem] font-black leading-[0.92] tracking-[-0.055em] text-[#12182b] sm:text-[clamp(3.7rem,6vw,6.7rem)] sm:leading-[0.89] sm:tracking-[-0.06em]">
                Find the work you want to stop doing manually.
              </h1>
              <p className="mt-6 max-w-[650px] text-lg font-medium leading-8 text-[#646d82]">Search by task or app. Choose a proven automation, connect your accounts, and let ModelGrow guide the rest.</p>
            </div>
            <div className="explore-search-panel min-w-0 rounded-[30px] border border-[#17203a]/9 bg-white/82 p-5 shadow-[0_28px_75px_rgba(44,35,92,0.11)] backdrop-blur-xl sm:p-7">
              <label htmlFor="automation-search" className="text-[11px] font-black uppercase tracking-[0.14em] text-[#8a90a0]">What would you like to automate?</label>
              <div className="mt-3 flex items-center gap-3 rounded-[18px] border border-[#17203a]/10 bg-[#fbfaf7] px-4 py-4 focus-within:border-[#8056dc]">
                <Search className="h-5 w-5 text-[#7851cf]" />
                <input
                  id="automation-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Try “organize invoices” or “Google Sheets”…"
                  className="min-w-0 w-full bg-transparent text-base font-bold text-[#151b2d] outline-none placeholder:font-medium placeholder:text-[#9aa0ad]"
                />
              </div>
              <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {CATEGORIES.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setCategory(item.label)}
                    className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-black transition-colors ${category === item.label ? 'bg-[#151a2d] text-white' : 'bg-[#f1eef8] text-[#696f82] hover:bg-[#e8e2f6]'}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="px-5 py-20 sm:px-8 sm:py-24">
          <div className="mx-auto max-w-[1240px]">
            {!query && (category === 'All' || category === 'Latest') && featured.length > 0 && (
              <div className="mb-20">
                <div className="mb-7 flex items-end justify-between gap-4">
                  <div>
                    <p className="marketing-kicker">Popular starting points</p>
                    <h2 className="marketing-display mt-2 text-4xl font-black tracking-[-0.04em] text-[#12182b] sm:text-5xl">Chosen by people like you.</h2>
                  </div>
                  <span className="hidden text-sm font-bold text-[#858c9c] sm:block">Select a card to begin setup</span>
                </div>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {featured.map((automation, index) => (
                    <AutomationCard key={automation.id} automation={automation} onUse={handleUse} index={index} featured />
                  ))}
                </div>
              </div>
            )}

            <div className="mb-7 flex items-end justify-between gap-4">
              <div>
                <p className="marketing-kicker">Browse the library</p>
                <h2 className="marketing-display mt-2 text-4xl font-black tracking-[-0.04em] text-[#12182b] sm:text-5xl">{category === 'All' ? 'All automations' : category}</h2>
              </div>
              <span className="text-sm font-bold text-[#858c9c]">{filtered.length} results</span>
            </div>

            {loading ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, index) => <div key={index} className="h-[300px] animate-pulse rounded-[28px] border border-[#17203a]/7 bg-white" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-[30px] border border-[#17203a]/9 bg-white py-20 text-center">
                <p className="text-xl font-black text-[#151b2d]">No matching automation yet</p>
                <p className="mt-2 text-sm font-medium text-[#737b8e]">Try another task, app, or category.</p>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((automation, index) => (
                  <AutomationCard key={automation.id} automation={automation} onUse={handleUse} index={index} />
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="px-5 pb-24 sm:px-8 sm:pb-32">
          <div className="mx-auto flex max-w-[1240px] flex-col items-start justify-between gap-7 rounded-[32px] bg-[#ebe6f8] px-7 py-10 sm:px-10 lg:flex-row lg:items-center">
            <div>
              <p className="marketing-kicker">Not sure where to start?</p>
              <h2 className="marketing-display mt-3 text-4xl font-black tracking-[-0.04em] text-[#151b2d]">Tell ModelGrow what keeps repeating.</h2>
              <p className="mt-3 max-w-[650px] text-sm font-medium leading-6 text-[#697287]">Use plain language. ModelGrow can help you find the closest ready-made automation.</p>
            </div>
            <button
              type="button"
              onClick={() => isAuthenticated ? router.push('/main') : window.dispatchEvent(new Event('modelgrow:open-signup'))}
              className="marketing-primary-button flex shrink-0 items-center gap-2 rounded-full bg-[#151a2d] px-6 py-3.5 text-sm font-black text-white"
            >
              Ask ModelGrow <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>

        {!isAuthenticated && <MarketingFooter />}
      </main>
    </div>
  );
}
