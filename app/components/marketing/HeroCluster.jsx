'use client';

import Link from 'next/link';
import { Mail, Sparkles, Table2, Megaphone, Briefcase } from 'lucide-react';

// Five real automations floating at different depths. Deliberately NOT a node
// graph: nothing connects to anything, because wiring is the thing customers are
// running from. What is on screen is a shelf of finished things, one already on.

const SLOTS = ['a', 'b', 'c', 'd', 'e'];
const ICONS = [Sparkles, Briefcase, Table2, Megaphone, Mail];

function initials(email = '') {
  const handle = String(email).replace(/@.*$/, '');
  if (!handle) return '··';
  const parts = handle.split(/[\s._-]+/).filter(Boolean);
  return (parts.length > 1 ? parts[0][0] + parts[1][0] : handle.slice(0, 2)).toUpperCase();
}

function shortName(email = '') {
  return String(email).replace(/@.*$/, '') || 'ModelGrow';
}

// Card descriptions have to be glanceable. Take the first clause and cap it —
// anything longer stops being readable at this size and on this angle.
function gist(description = '') {
  const first = String(description).split(/[.!?]/)[0].trim();
  if (first.length <= 52) return first;
  // Cut on a word boundary — "looking for sear…" reads as a bug, not a summary.
  const clipped = first.slice(0, 52);
  return `${clipped.slice(0, clipped.lastIndexOf(' ')).trimEnd()}…`;
}

export default function HeroCluster({ automations = [] }) {
  const cards = automations.slice(0, SLOTS.length);
  if (cards.length === 0) return null;

  return (
    <div className="marketing-scene" aria-label="Automations available on ModelGrow">
      <div className="marketing-cluster" data-cluster>
        {cards.map((automation, index) => {
          const runs = Number(automation.total_runs) || 0;
          return (
            <Link
              key={automation.id || automation.name}
              href={`/explore?search=${encodeURIComponent(automation.name)}`}
              // Stacked on a phone, five cards cost 822px of hero before the
              // page has said anything. Two still prove the claim: these are
              // real, and someone else wrote them. The `!` is required because
              // .marketing-acard is unlayered CSS and beats Tailwind's layer.
              className={`marketing-acard marketing-acard--${SLOTS[index]}${runs > 0 ? ' is-live' : ''}${index > 1 ? ' max-[720px]:!hidden' : ''}`}
            >
              <span className={`marketing-acard__glyph marketing-acard__glyph--${SLOTS[index]}`} aria-hidden="true">
                {(() => { const Icon = ICONS[index]; return <Icon className="h-4 w-4 text-white" strokeWidth={2.2} />; })()}
              </span>
              <span className="marketing-acard__body">
                <span className="marketing-acard__name">{automation.name}</span>
                <span className="marketing-acard__gist">{gist(automation.description)}</span>
              </span>
              <span className="marketing-acard__foot">
                <span className="marketing-acard__who">
                  <span className="marketing-acard__pip">{initials(automation.author_email)}</span>
                  {shortName(automation.author_email)}
                </span>
                {runs > 0 ? (
                  <span className="marketing-acard__runs">{runs} runs</span>
                ) : (
                  <span className="marketing-acard__runs marketing-acard__runs--new">New</span>
                )}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
