'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
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

// Where each card sits once the scroll has drawn them into a row, relative to
// the cluster centre. Every card keeps its size — the moment one grows, the
// even spacing stops working and they collide.
const ROW = [-2, -1, 0, 1, 2];

// Spacing in px, not vw: the row lives inside a 1240px container, so viewport
// units let it run off the edge on a wide screen. Five cards at this step span
// 1160px, which fits with room to spare.
const ROW_STEP_PX = 232;

// How far down the row settles from the cluster's centre.
const ROW_DROP_PX = 210;

export default function HeroCluster({ automations = [] }) {
  const cards = automations.slice(0, SLOTS.length);
  const sceneRef = useRef(null);
  const [gather, setGather] = useState(0);
  // The cluster sits in the hero's right column, so its centre is not the page
  // centre. Measure the difference and shift the row back by it, otherwise the
  // row is centred on the column and overflows to the right.
  const [rowShift, setRowShift] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    if (window.matchMedia('(max-width: 900px)').matches) return undefined;

    let frame = 0;
    const measure = () => {
      frame = 0;
      const node = sceneRef.current;
      if (!node) return;
      // Measure against the pinned hero: progress through its scrollable
      // height, so the cards finish arriving while still in view.
      const pinned = node.closest('.marketing-hero-world');
      if (!pinned) return;
      const rect = pinned.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      if (scrollable <= 0) return;
      const travelled = (-rect.top / scrollable) / 0.55;
      setGather(Math.min(1, Math.max(0, travelled)));

      const cluster = node.getBoundingClientRect();
      setRowShift(window.innerWidth / 2 - (cluster.left + cluster.width / 2));
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  if (cards.length === 0) return null;

  return (
    <div className="marketing-scene" ref={sceneRef} aria-label="Automations available on ModelGrow">
      <div
        className="marketing-cluster"
        data-cluster
        style={{ '--gather': gather, '--row-shift': `${rowShift}px`, '--row-drop': `${ROW_DROP_PX}px` }}
      >
        {cards.map((automation, index) => {
          const runs = Number(automation.total_runs) || 0;
          return (
            <Link
              key={automation.id || automation.name}
              href={`/explore?search=${encodeURIComponent(automation.name)}`}
              className={`marketing-acard marketing-acard--${SLOTS[index]}${runs > 0 ? ' is-live' : ''}`}
              style={{ '--row-x': `${ROW[index] * ROW_STEP_PX}px` }}
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
