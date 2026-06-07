'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Bot, Briefcase, CalendarDays, Database, Mail, Search, TrendingUp, Workflow } from 'lucide-react';
import { useSidebar } from '@/lib/contexts/sidebar-context';
import { useThemeAdaptive } from '@/lib/contexts/theme-adaptive-context';

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

function AutomationCard({ automation, onUse, featured = false, isDarkMode }) {
  const Icon = getAutomationIcon(automation);
  const connectors = parseConnectors(automation.required_connectors);
  const tokenCost = automation.token_cost || 0;

  // Clean, SaaS-style classes based on theme
  const cardClasses = isDarkMode 
    ? "bg-[#1C1C1E] border-[#2A2A2D] hover:border-violet-500/50" 
    : "bg-white border-slate-200 hover:border-violet-400 hover:shadow-md";
    
  const textPrimary = isDarkMode ? "text-white" : "text-slate-900";
  const textSecondary = isDarkMode ? "text-slate-400" : "text-slate-500";
  
  const iconBg = isDarkMode ? "bg-white/10 text-white" : "bg-slate-100 text-slate-700";
  
  const badgeClasses = isDarkMode 
    ? "bg-[#2A2A2D] border border-transparent text-slate-300" 
    : "bg-slate-50 border border-slate-200 text-slate-600";

  return (
    <div 
      onClick={() => onUse(automation)}
      className={`group flex flex-col cursor-pointer rounded-xl border p-5 transition-all duration-200 ${cardClasses}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${iconBg}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
          tokenCost > 0 
            ? (isDarkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-700')
            : (isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500')
        }`}>
          {tokenCost > 0 ? `${tokenCost} tokens` : 'Free'}
        </div>
      </div>

      <h3 className={`text-lg font-bold leading-tight mb-2 line-clamp-1 ${textPrimary}`}>
        {automation.name}
      </h3>
      <p className={`text-sm leading-relaxed line-clamp-2 flex-grow ${textSecondary}`}>
        {automation.description || 'No description provided.'}
      </p>

      <div className="mt-5 flex flex-wrap gap-1.5">
        {connectors.slice(0, 3).map((connector) => (
          <span key={connector} className={`px-2 py-1 text-[11px] font-medium rounded-md ${badgeClasses}`}>
            {connector}
          </span>
        ))}
        {connectors.length > 3 && (
          <span className={`px-2 py-1 text-[11px] font-medium rounded-md ${badgeClasses}`}>
            +{connectors.length - 3}
          </span>
        )}
      </div>

      <div className={`mt-6 pt-4 border-t flex items-center justify-between ${isDarkMode ? 'border-[#2A2A2D]' : 'border-slate-100'}`}>
        <span className={`text-xs font-medium ${textSecondary}`}>
          {automation.total_runs || 0} runs
        </span>
        <span className="flex items-center gap-1 text-sm font-semibold text-violet-600 transition-colors group-hover:text-violet-500">
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

  if (!mounted) return <div className="min-h-screen bg-[#F8FAFC]" />;

  const bgClass = isDarkMode ? "bg-[#09090B]" : "bg-[#F8FAFC]";
  const textPrimary = isDarkMode ? "text-white" : "text-slate-900";
  const textSecondary = isDarkMode ? "text-slate-400" : "text-slate-500";
  
  const searchBg = isDarkMode 
    ? "bg-[#1C1C1E] border-[#2A2A2D] text-white placeholder-slate-500" 
    : "bg-white border-slate-200 text-slate-900 placeholder-slate-400";
    
  const tabActive = isDarkMode 
    ? "bg-white text-black" 
    : "bg-slate-900 text-white";
    
  const tabInactive = isDarkMode 
    ? "text-slate-400 hover:bg-[#1C1C1E] hover:text-white" 
    : "text-slate-600 hover:bg-slate-200 hover:text-slate-900";

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
              Explore Automations
            </h1>
            <p className={`mt-3 max-w-2xl text-base ${textSecondary}`}>
              Find and launch community-built workflows for your everyday tasks.
            </p>
          </div>

          {/* Search Bar */}
          <div className="mb-8">
            <div className={`flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors focus-within:border-violet-500 focus-within:ring-1 focus-within:ring-violet-500 ${searchBg}`}>
              <Search className="h-5 w-5 opacity-50" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search templates, apps, or use cases..."
                className="w-full bg-transparent text-sm font-medium outline-none"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="mb-10 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {CATEGORIES.map((item) => (
              <button
                key={item.label}
                onClick={() => setCategory(item.label)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  category === item.label ? tabActive : tabInactive
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Featured Section */}
          {!query && (category === 'All' || category === 'Latest') && featured.length > 0 && (
            <div className="mb-12">
              <h2 className={`mb-5 text-xl font-bold ${textPrimary}`}>Featured</h2>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {featured.map((automation) => (
                  <AutomationCard 
                    key={automation.id} 
                    automation={automation} 
                    onUse={handleUse} 
                    featured 
                    isDarkMode={isDarkMode} 
                  />
                ))}
              </div>
            </div>
          )}

          {/* All Results */}
          <div>
            <div className="mb-5 flex items-center justify-between">
              <h2 className={`text-xl font-bold ${textPrimary}`}>
                {category === 'All' ? 'All Templates' : category}
              </h2>
              <span className={`text-sm ${textSecondary}`}>{filtered.length} results</span>
            </div>

            {loading ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className={`h-48 animate-pulse rounded-xl border ${isDarkMode ? 'border-[#2A2A2D] bg-[#1C1C1E]' : 'border-slate-200 bg-slate-100'}`} />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className={`rounded-xl border py-20 text-center ${isDarkMode ? 'border-[#2A2A2D] bg-[#1C1C1E]' : 'border-slate-200 bg-white'}`}>
                <p className={`text-lg font-semibold ${textPrimary}`}>No automations found</p>
                <p className={`mt-2 text-sm ${textSecondary}`}>Try adjusting your search or category filter.</p>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((automation) => (
                  <AutomationCard 
                    key={automation.id} 
                    automation={automation} 
                    onUse={handleUse} 
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
