'use client';

import { useRef } from 'react';
import CursorReactiveGrid from './CursorReactiveGrid';

export default function LightBackground({
  variant = 'default',
  children,
  className = '',
  showParticles = false,
  showPattern = false,
  showReactiveGrid = false,
}) {
  const containerRef = useRef(null);
  const isLandingVariant = variant === 'landing';
  const shouldShowPattern = showPattern || variant === 'content';

  return (
    <div
      ref={containerRef}
      className={`${isLandingVariant ? 'landing-shell' : ''} relative min-h-screen overflow-hidden ${className}`}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="decorative-blob"
          aria-hidden="true"
          style={{
            width: '520px',
            height: '520px',
            background: 'radial-gradient(circle, rgba(199,125,255,0.18) 0%, transparent 70%)',
            top: '-250px',
            right: '-150px',
            opacity: 0.22,
          }}
        />
        <div
          className="decorative-blob"
          aria-hidden="true"
          style={{
            width: '560px',
            height: '560px',
            background: 'radial-gradient(circle, rgba(93,88,255,0.16) 0%, transparent 70%)',
            top: '8%',
            left: '-170px',
            opacity: 0.3,
          }}
        />
      </div>

      {shouldShowPattern && (
        <div className="landing-pattern absolute inset-0" aria-hidden="true" />
      )}

      <CursorReactiveGrid enabled={showReactiveGrid && variant === 'content'} theme="light" />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
