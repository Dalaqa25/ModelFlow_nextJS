'use client';

import { useEffect, useState } from 'react';

// A rotating noun keeps the headline concrete without pinning the product to one
// job. Each word is a real thing in the catalog; the rotation is what says
// "there are many of these".
//
// Two things this has to get right, both of which bit us before:
//   * The rest of the line must not reflow as widths change. Every word is laid
//     invisibly in one grid cell, so the slot is always as wide as the longest.
//   * Only one word may ever be visible. Visibility is set inline rather than
//     through attribute selectors, so nothing in the global cascade can leave a
//     second word painted on top of the first.

export default function RotatingWord({ words = [], intervalMs = 2400, className = '' }) {
  const [index, setIndex] = useState(0);
  const [previous, setPrevious] = useState(-1);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    setAnimate(true);
    if (words.length < 2) return undefined;

    const timer = window.setInterval(() => {
      setIndex((current) => {
        setPrevious(current);
        return (current + 1) % words.length;
      });
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [words.length, intervalMs]);

  if (words.length === 0) return null;

  return (
    <span className={`marketing-rotating-word ${className}`.trim()}>
      <span aria-hidden="true" className="marketing-rotating-word__sizer">
        {words.map((word) => (
          <span key={word}>{word}</span>
        ))}
      </span>

      <span className="marketing-rotating-word__reader">{words[index]}</span>

      <span aria-hidden="true" className="marketing-rotating-word__track">
        {words.map((word, wordIndex) => {
          // Words roll through a clipped slot: the outgoing one exits upward
          // while the next arrives from below, so the two are never occupying
          // the same space. A crossfade in place turns big type into mush.
          const current = wordIndex === index;
          const leaving = wordIndex === previous;
          const offset = current ? '0%' : leaving ? '-115%' : '115%';

          return (
            <span
              key={word}
              className="marketing-rotating-word__item"
              style={{
                opacity: current ? 1 : 0,
                transform: `translateY(${offset})`,
                transition: animate
                  ? 'opacity 380ms cubic-bezier(0.22,1,0.36,1), transform 520ms cubic-bezier(0.22,1,0.36,1)'
                  : 'none',
              }}
            >
              {word}
            </span>
          );
        })}
      </span>
    </span>
  );
}
