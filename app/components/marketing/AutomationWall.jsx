'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowRight, Clock3, Repeat2 } from 'lucide-react';

// The one section a build-your-own tool cannot copy: automations other people
// wrote, with the proof that they already run for someone else.
//
// Every number here is derived from real columns — nothing is decorative:
//   runs           -> automations.total_runs
//   minutesPerRun  -> the developer's own estimate, captured at publish time
//   HOURLY_RATE    -> stated openly below, never hidden inside a "value" figure
//
// An automation with no runs yet shows "New" rather than a zero. A wall of
// zeroes reads as abandoned, and inventing numbers to avoid that would be worse.

const HOURLY_RATE_USD = 25;

function authorInitials(email = '', name = '') {
  const source = String(name || email).trim();
  if (!source) return '··';
  const parts = source.replace(/@.*$/, '').split(/[\s._-]+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[1][0] : source.slice(0, 2);
  return letters.toUpperCase();
}

function authorLabel(email = '', name = '') {
  if (name) return name;
  const handle = String(email).replace(/@.*$/, '');
  return handle || 'ModelGrow';
}

function formatHours(hours) {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 10) return `${hours.toFixed(1).replace(/\.0$/, '')}h`;
  return `${Math.round(hours)}h`;
}

function formatMoney(value) {
  if (value >= 1000) return `$${(value / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  return `$${Math.round(value)}`;
}

function connectorLabel(connector) {
  const slug = String(connector || '').replace('@activepieces/piece-', '').trim();
  if (!slug) return null;
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function AutomationCard({ automation }) {
  const runs = Number(automation.total_runs) || 0;
  const minutesPerRun = Number(automation.minutes_per_run) || 0;
  const hoursSaved = (runs * minutesPerRun) / 60;
  const moneySaved = hoursSaved * HOURLY_RATE_USD;
  const proven = runs > 0 && minutesPerRun > 0;

  const connectors = (Array.isArray(automation.required_connectors)
    ? automation.required_connectors
    : []
  )
    .map(connectorLabel)
    .filter(Boolean)
    .slice(0, 3);

  return (
    <Link
      href={`/explore?search=${encodeURIComponent(automation.name)}`}
      className="group flex flex-col rounded-[24px] border border-[#17203a]/9 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#8e5cff]/25 hover:shadow-[0_22px_55px_rgba(23,32,58,0.08)]"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-[17px] font-black leading-snug tracking-[-0.025em] text-[#151b2d]">
          {automation.name}
        </h3>
        <span
          className={
            runs > 0
              ? 'shrink-0 rounded-full bg-[#e9fbf2] px-3 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-[#118357]'
              : 'shrink-0 rounded-full bg-[#f3f0fb] px-3 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-[#7143d4]'
          }
        >
          {runs > 0 ? `${runs} runs` : 'New'}
        </span>
      </div>

      <p className="mt-2 line-clamp-2 text-sm font-medium leading-6 text-[#747d92]">
        {automation.description}
      </p>

      {connectors.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {connectors.map((label) => (
            <span
              key={label}
              className="rounded-full border border-[#17203a]/10 px-2.5 py-1 text-[11px] font-bold text-[#4e566a]"
            >
              {label}
            </span>
          ))}
        </div>
      )}

      {/* Only shown once there is something real to show. */}
      {proven && (
        <div className="mt-5 flex items-center gap-5 border-t border-[#17203a]/8 pt-4">
          <span className="flex items-center gap-1.5 text-xs font-bold text-[#4e566a]">
            <Clock3 className="h-3.5 w-3.5 text-[#118357]" />
            {formatHours(hoursSaved)} saved
          </span>
          <span className="marketing-display text-base font-bold text-[#25204f]">
            {formatMoney(moneySaved)}
          </span>
        </div>
      )}

      <div className="mt-auto flex items-center justify-between gap-3 pt-5">
        <span className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#25204f] text-[10px] font-black text-white">
            {authorInitials(automation.author_email, automation.author_name)}
          </span>
          <span className="text-xs font-bold text-[#747d92]">
            by {authorLabel(automation.author_email, automation.author_name)}
          </span>
        </span>
        <span className="flex items-center gap-1 text-xs font-black text-[#7143d4] opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          Use it <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}

export default function AutomationWall({ automations = [], roleSelected = false }) {
  const [showAll, setShowAll] = useState(false);

  const totals = useMemo(() => {
    return automations.reduce(
      (acc, automation) => {
        const runs = Number(automation.total_runs) || 0;
        const minutes = Number(automation.minutes_per_run) || 0;
        acc.runs += runs;
        acc.hours += (runs * minutes) / 60;
        if (automation.author_email) acc.authors.add(automation.author_email);
        return acc;
      },
      { runs: 0, hours: 0, authors: new Set() }
    );
  }, [automations]);

  const visible = showAll ? automations : automations.slice(0, 6);
  if (automations.length === 0 && !roleSelected) return null;

  return (
    <section
      data-ground="light"
      id="automation-wall"
      className="marketing-anchor relative overflow-hidden border-b border-[#17203a]/7 bg-[#fbfaf7] py-16 sm:py-20"
    >
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <h2 className="marketing-display max-w-[640px] text-[clamp(2.5rem,4.4vw,4.5rem)] font-black leading-[0.94] tracking-[-0.05em] text-[#151b2d]">
          {automations.length === 0
            ? 'Nobody has built this yet.'
            : roleSelected
              ? 'People like you use these.'
              : 'Someone already solved it.'}
        </h2>

        {automations.length === 0 && (
          <p className="mt-5 max-w-[440px] text-base font-medium leading-7 text-[#4e566a]">
            Tell us what you repeat and we&apos;ll get it built.
          </p>
        )}

        {/* Real totals only — no rounding up to look busier than we are. */}
        {totals.runs > 0 && (
          <div className="mt-8 flex flex-wrap items-center gap-x-9 gap-y-4">
            <span className="flex items-baseline gap-2">
              <span className="marketing-display text-3xl font-bold text-[#25204f]">
                {totals.runs.toLocaleString()}
              </span>
              <span className="text-xs font-bold uppercase tracking-[0.1em] text-[#9299aa]">
                runs completed
              </span>
            </span>
            {totals.hours >= 1 && (
              <span className="flex items-baseline gap-2">
                <span className="marketing-display text-3xl font-bold text-[#25204f]">
                  {formatHours(totals.hours)}
                </span>
                <span className="text-xs font-bold uppercase tracking-[0.1em] text-[#9299aa]">
                  given back
                </span>
              </span>
            )}
            <span className="flex items-baseline gap-2">
              <span className="marketing-display text-3xl font-bold text-[#25204f]">
                {totals.authors.size}
              </span>
              <span className="text-xs font-bold uppercase tracking-[0.1em] text-[#9299aa]">
                {totals.authors.size === 1 ? 'developer' : 'developers'}
              </span>
            </span>
          </div>
        )}

        <div className="mt-11 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((automation) => (
            <AutomationCard key={automation.id || automation.name} automation={automation} />
          ))}
        </div>

        <div className="mt-9 flex flex-wrap items-center justify-between gap-4">
          {automations.length > 6 && !showAll ? (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="inline-flex items-center gap-2 rounded-full border border-[#17203a]/12 bg-white px-6 py-3 text-sm font-black text-[#151b2d] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#8e5cff]/30"
            >
              <Repeat2 className="h-4 w-4" />
              Show all {automations.length}
            </button>
          ) : (
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 rounded-full border border-[#17203a]/12 bg-white px-6 py-3 text-sm font-black text-[#151b2d] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#8e5cff]/30"
            >
              Browse every automation <ArrowRight className="h-4 w-4" />
            </Link>
          )}

          {/* State the assumption rather than burying it inside the dollar figure. */}
          <p className="text-xs font-semibold text-[#9299aa]">
            Real runs &middot; developer estimates &middot; ${HOURLY_RATE_USD}/hr
          </p>
        </div>
      </div>
    </section>
  );
}
