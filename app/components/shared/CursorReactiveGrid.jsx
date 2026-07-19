'use client';

import { useCallback, useEffect, useRef } from 'react';

const CELL_SIZE = 34;
const POINTER_RADIUS = CELL_SIZE * 1.15;
const FADE_MS = 1100;

const THEME_PALETTES = {
  light: [
    [93, 88, 255],
    [127, 140, 255],
    [94, 234, 212],
    [123, 114, 255],
  ],
  dark: [
    [123, 114, 255],
    [167, 139, 250],
    [94, 234, 212],
    [125, 211, 252],
  ],
};

function rgba([r, g, b], alpha) {
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function isUiSurface(target) {
  if (!(target instanceof Element)) return false;

  return Boolean(target.closest([
    'a',
    'button',
    'input',
    'textarea',
    'select',
    '[role="button"]',
    '[role="link"]',
    '[contenteditable="true"]',
    '.landing-input-card',
    '.landing-card',
    '.landing-card-soft',
    '.community-surface',
    '[class*="bg-white"]',
    '[class*="border-slate"]',
    '[class*="rounded-"]',
  ].join(',')));
}

export default function CursorReactiveGrid({ enabled = false, theme = 'light' }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const hasFinePointerRef = useRef(false);
  const viewportRef = useRef({ width: 0, height: 0, dpr: 1 });
  const pointerRef = useRef({
    x: 0,
    y: 0,
    lastMoveAt: 0,
  });

  const stopAnimation = useCallback(() => {
    if (animationRef.current !== null) {
      window.cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, []);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof window === 'undefined') return;

    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const width = window.innerWidth || 0;
    const height = window.innerHeight || 0;

    viewportRef.current = { width, height, dpr };
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const context = canvas.getContext('2d');
    if (context) {
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }, []);

  const drawFrame = useCallback((now) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    const { width, height } = viewportRef.current;

    if (!canvas || !context || !width || !height) {
      stopAnimation();
      return;
    }

    const timeSinceMove = now - pointerRef.current.lastMoveAt;
    const activity = Math.max(0, 1 - timeSinceMove / FADE_MS);

    context.clearRect(0, 0, width, height);

    if (activity <= 0) {
      stopAnimation();
      return;
    }

    const palette = THEME_PALETTES[theme] || THEME_PALETTES.light;
    const radius = POINTER_RADIUS * (0.96 + activity * 0.12);
    const minCol = Math.max(0, Math.floor((pointerRef.current.x - radius) / CELL_SIZE) - 2);
    const maxCol = Math.ceil((pointerRef.current.x + radius) / CELL_SIZE) + 2;
    const minRow = Math.max(0, Math.floor((pointerRef.current.y - radius) / CELL_SIZE) - 2);
    const maxRow = Math.ceil((pointerRef.current.y + radius) / CELL_SIZE) + 2;

    context.globalCompositeOperation = 'source-over';

    for (let row = minRow; row <= maxRow; row += 1) {
      for (let col = minCol; col <= maxCol; col += 1) {
        const x = col * CELL_SIZE;
        const y = row * CELL_SIZE;
        const colorPointX = x + CELL_SIZE / 2;
        const colorPointY = y + CELL_SIZE / 2;
        const dx = colorPointX - pointerRef.current.x;
        const dy = colorPointY - pointerRef.current.y;
        const angle = Math.atan2(dy, dx) + Math.PI;
        const sector = Math.floor(angle / (Math.PI / 2)) % 4;
        const color = palette[(sector + (col + row) % 2) % palette.length];
        const isTeal = color[1] > color[0] && color[1] > color[2];
        const baseAlpha = isTeal ? 0.08 : 0.1;
        const boostAlpha = isTeal ? 0.12 : 0.14;

        const horizontalDistance = Math.abs(pointerRef.current.y - y);
        if (horizontalDistance <= radius) {
          const nearestX = Math.max(x, Math.min(pointerRef.current.x, x + CELL_SIZE));
          const distance = Math.hypot(pointerRef.current.x - nearestX, pointerRef.current.y - y);

          if (distance <= radius) {
            const normalized = 1 - distance / radius;
            const intensity = normalized * normalized * (0.18 + activity * 0.3);
            const segment = Math.max(8, Math.min(CELL_SIZE * 0.72, CELL_SIZE * (0.3 + intensity * 0.55)));
            const startX = Math.max(x, pointerRef.current.x - segment / 2);
            const endX = Math.min(x + CELL_SIZE, pointerRef.current.x + segment / 2);

            context.lineWidth = 1;
            context.strokeStyle = rgba(color, baseAlpha + intensity * boostAlpha);
            context.beginPath();
            context.moveTo(startX + 0.5, y + 0.5);
            context.lineTo(endX + 0.5, y + 0.5);
            context.stroke();
          }
        }

        const verticalDistance = Math.abs(pointerRef.current.x - x);
        if (verticalDistance <= radius) {
          const nearestY = Math.max(y, Math.min(pointerRef.current.y, y + CELL_SIZE));
          const distance = Math.hypot(pointerRef.current.x - x, pointerRef.current.y - nearestY);

          if (distance <= radius) {
            const normalized = 1 - distance / radius;
            const intensity = normalized * normalized * (0.18 + activity * 0.3);
            const segment = Math.max(8, Math.min(CELL_SIZE * 0.72, CELL_SIZE * (0.3 + intensity * 0.55)));
            const startY = Math.max(y, pointerRef.current.y - segment / 2);
            const endY = Math.min(y + CELL_SIZE, pointerRef.current.y + segment / 2);

            context.lineWidth = 1;
            context.strokeStyle = rgba(color, baseAlpha + intensity * boostAlpha);
            context.beginPath();
            context.moveTo(x + 0.5, startY + 0.5);
            context.lineTo(x + 0.5, endY + 0.5);
            context.stroke();
          }
        }
      }
    }

    animationRef.current = window.requestAnimationFrame(drawFrame);
  }, [stopAnimation, theme]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return undefined;

    const media = window.matchMedia('(pointer: fine)');
    const updateSupport = () => {
      hasFinePointerRef.current = media.matches;
      if (!media.matches) {
        stopAnimation();
        const canvas = canvasRef.current;
        const context = canvas?.getContext('2d');
        if (context && canvas) {
          context.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
    };

    updateSupport();

    if (media.addEventListener) {
      media.addEventListener('change', updateSupport);
    } else {
      media.addListener(updateSupport);
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      if (media.removeEventListener) {
        media.removeEventListener('change', updateSupport);
      } else {
        media.removeListener(updateSupport);
      }
      window.removeEventListener('resize', resizeCanvas);
      stopAnimation();
    };
  }, [enabled, theme, resizeCanvas, stopAnimation]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return undefined;

    const handlePointerMove = (event) => {
      if (!hasFinePointerRef.current) return;

      if (isUiSurface(event.target)) {
        stopAnimation();
        const canvas = canvasRef.current;
        const context = canvas?.getContext('2d');
        if (context) {
          const { width, height } = viewportRef.current;
          context.clearRect(0, 0, width, height);
        }
        return;
      }

      pointerRef.current = {
        x: event.clientX,
        y: event.clientY,
        lastMoveAt: performance.now(),
      };

      if (animationRef.current === null) {
        animationRef.current = window.requestAnimationFrame(drawFrame);
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerMove, { passive: true });

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerMove);
    };
  }, [enabled, drawFrame, stopAnimation]);

  if (!enabled) {
    return null;
  }

  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: theme === 'dark'
            ? 'linear-gradient(rgba(185,195,255,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(185,195,255,0.055) 1px, transparent 1px)'
            : 'linear-gradient(rgba(90,102,140,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(90,102,140,0.055) 1px, transparent 1px)',
          backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`,
          opacity: 0.9,
          maskImage: 'radial-gradient(circle at 50% 20%, black, transparent 82%)',
        }}
      />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
