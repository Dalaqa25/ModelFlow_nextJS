'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Clock3, RefreshCw } from 'lucide-react';
import { COMPARISONS, comparisonForRole } from '@/lib/marketing/without-with';

// The strongest thing on the page: what this costs you now, against what it
// costs once. Weight carries the argument — the left column is stacked,
// shadowed and desaturated, the right is a single card floating clear. You
// should feel which side is heavier before reading either.
//
// It cycles through jobs until the visitor picks a role, then locks to theirs.
// A fixed example would make this look like a tool for that one job.

const CYCLE_MS = 5200;

export default function WithoutWith({ role = null }) {
  const [index, setIndex] = useState(0);
  const [shown, setShown] = useState(false);
  const sectionRef = useRef(null);

  const locked = role ? comparisonForRole(role) : null;
  const entry = locked || COMPARISONS[index];

  // Reveal on entry rather than on load, so the stagger is seen.
  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return undefined;
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setShown(true)),
      { threshold: 0.25 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (locked) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const timer = window.setInterval(
      () => setIndex((current) => (current + 1) % COMPARISONS.length),
      CYCLE_MS
    );
    return () => window.clearInterval(timer);
  }, [locked]);

  return (
    <section ref={sectionRef} data-ground="dark" id="why-modelgrow" className="mg-ww" data-shown={shown}>
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <h2 className="mg-ww__title marketing-display">
          The same {entry.job}, twice.
        </h2>

        <div className="mg-ww__grid">
          {/* Heavy side: stacked, pressed down, drained of colour. */}
          <div className="mg-ww__side mg-ww__side--manual">
            <div className="mg-ww__label">
              <Clock3 className="h-3.5 w-3.5" />
              {entry.manual.cost} · {entry.manual.unit}
            </div>

            <ol className="mg-ww__steps">
              {entry.manual.steps.map((step, i) => (
                <li key={step} style={{ transitionDelay: `${i * 70}ms` }}>
                  <span className="mg-ww__num">{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>

            <p className="mg-ww__repeat">
              <RefreshCw className="h-3.5 w-3.5" />
              Then again for the next one
            </p>
          </div>

          {/* Light side: one card, floating clear. */}
          <div className="mg-ww__side mg-ww__side--auto">
            <div className="mg-ww__label mg-ww__label--good">
              <Check className="h-3.5 w-3.5" />
              {entry.automated.settled}
            </div>

            <div className="mg-ww__ask">{entry.automated.ask}</div>

            <div className="mg-ww__found">
              <span className="mg-ww__foundName">{entry.automated.automation}</span>
              <span className="mg-ww__running">
                <span className="mg-ww__dot" />
                Running
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
