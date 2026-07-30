'use client';

import { useEffect, useRef, useState } from 'react';
import { buildShowcase } from '@/lib/marketing/automation-stories';

// The cards from the hero come down, settle into a row, and then each one steps
// forward in turn to show what it actually does.
//
// Deliberately no connectors. Lines between cards would make this a workflow
// diagram, which is the thing the product exists to hide — the scroll sequence
// carries the narrative that an arrow would otherwise have to.
//
// Choreography is driven by one scroll position mapped to 0–1 progress:
//   0.00 – 0.18   cards gather from scattered into a centred row
//   0.18 – 0.94   each card in turn rises, tells its story, settles back
//   0.94 – 1.00   the row holds
//
// The section is tall; a sticky viewport inside it is what gets pinned. Three
// cards is deliberate — past roughly three screen-heights of pinning, a page
// starts to feel broken rather than cinematic.

const GATHER_END = 0.18;

function StoryPanel({ story, active }) {
  return (
    <div className="mg-show__story" data-active={active ? 'true' : 'false'} aria-hidden={!active}>
      {story.beats.map((beat, index) => (
        <div
          key={`${beat.kind}-${index}`}
          className={`mg-show__beat mg-show__beat--${beat.kind}`}
          style={{ transitionDelay: active ? `${index * 110}ms` : '0ms' }}
        >
          {beat.kind === 'result' ? (
            <ul className="mg-show__rows">
              {beat.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <span>{beat.text}</span>
          )}
        </div>
      ))}
    </div>
  );
}

export default function AutomationShowcase({ automations = [] }) {
  const showcase = buildShowcase(automations);
  const sectionRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  useEffect(() => {
    if (reduced || showcase.length === 0) return undefined;
    const section = sectionRef.current;
    if (!section) return undefined;

    let frame = 0;
    const measure = () => {
      frame = 0;
      const rect = section.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      if (scrollable <= 0) return;
      const raw = -rect.top / scrollable;
      setProgress(Math.min(1, Math.max(0, raw)));
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [reduced, showcase.length]);

  if (showcase.length === 0) return null;

  // Gather: 0 → 1 as the scattered cards pull into the row.
  const gather = Math.min(1, progress / GATHER_END);
  // Which card is telling its story, or -1 while they are still gathering.
  const storySpan = (1 - GATHER_END) / showcase.length;
  const activeIndex =
    progress <= GATHER_END ? -1 : Math.min(showcase.length - 1, Math.floor((progress - GATHER_END) / storySpan));

  return (
    <section
      ref={sectionRef}
      data-ground="dark"
      id="how-it-works"
      className="mg-show"
      style={{ '--mg-gather': reduced ? 1 : gather }}
    >
      <div className="mg-show__pin">
        <div className="mg-show__inner">
          <h2 className="mg-show__title marketing-display">
            {activeIndex < 0 ? 'Pick one.' : showcase[activeIndex].label}
          </h2>

          <div className="mg-show__row">
            {showcase.map((entry, index) => {
              const active = index === activeIndex;
              const runs = Number(entry.automation.total_runs) || 0;
              return (
                <article
                  key={entry.match}
                  className="mg-show__card"
                  data-active={active ? 'true' : 'false'}
                  style={{
                    // Scattered start positions collapse toward the row as
                    // --mg-gather approaches 1.
                    '--mg-x': `${[-32, 6, 30][index] ?? 0}%`,
                    '--mg-y': `${[-26, 18, -12][index] ?? 0}%`,
                    '--mg-z': `${[-140, 60, -80][index] ?? 0}px`,
                  }}
                >
                  <header className="mg-show__head">
                    <span className="mg-show__name">{entry.automation.name}</span>
                    <span className={runs > 0 ? 'mg-show__runs' : 'mg-show__runs mg-show__runs--new'}>
                      {runs > 0 ? `${runs} runs` : 'New'}
                    </span>
                  </header>

                  <StoryPanel story={entry} active={active} />

                  <footer className="mg-show__foot">
                    by {String(entry.automation.author_email || '').replace(/@.*$/, '') || 'ModelGrow'}
                  </footer>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
