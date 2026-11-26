import { useEffect, useRef } from 'react';

export type BgPalette = 'prism' | 'meadow' | 'ocean' | 'sunset';

interface InteractiveBackgroundProps {
  theme: 'light' | 'dark';
  palette: BgPalette;
  interactive: boolean;
}

interface PaletteSpec {
  lightWash: string;
  darkWash: string;
  spotlightLight: string;
  spotlightDark: string;
  nodeColorsLight: string[];
  nodeColorsDark: string[];
}

const PALETTES: Record<BgPalette, PaletteSpec> = {
  prism: {
    lightWash:
      'radial-gradient(62% 55% at 10% 8%, rgba(16, 185, 129, 0.24) 0%, transparent 70%), ' +
      'radial-gradient(56% 52% at 92% 14%, rgba(14, 165, 233, 0.24) 0%, transparent 70%), ' +
      'radial-gradient(54% 52% at 84% 88%, rgba(244, 63, 94, 0.18) 0%, transparent 70%), ' +
      'radial-gradient(58% 54% at 16% 86%, rgba(245, 158, 11, 0.20) 0%, transparent 70%), ' +
      'linear-gradient(135deg, #f0fdf4 0%, #f0f9ff 48%, #fffbeb 100%)',
    darkWash:
      'radial-gradient(58% 52% at 12% 10%, rgba(16, 185, 129, 0.22) 0%, transparent 70%), ' +
      'radial-gradient(54% 50% at 90% 16%, rgba(14, 165, 233, 0.20) 0%, transparent 70%), ' +
      'radial-gradient(52% 50% at 82% 88%, rgba(244, 63, 94, 0.15) 0%, transparent 70%), ' +
      'radial-gradient(55% 50% at 18% 85%, rgba(245, 158, 11, 0.14) 0%, transparent 70%), ' +
      'linear-gradient(135deg, #071312 0%, #091120 50%, #150e1c 100%)',
    spotlightLight: 'rgba(16, 185, 129, 0.20)',
    spotlightDark: 'rgba(52, 211, 153, 0.16)',
    nodeColorsLight: ['#059669', '#0284c7', '#d97706', '#e11d48', '#4f46e5', '#0d9488'],
    nodeColorsDark: ['#34d399', '#38bdf8', '#fbbf24', '#fb7185', '#818cf8', '#2dd4bf'],
  },
  meadow: {
    lightWash:
      'radial-gradient(60% 55% at 14% 12%, rgba(16, 185, 129, 0.28) 0%, transparent 70%), ' +
      'radial-gradient(55% 55% at 88% 20%, rgba(132, 204, 22, 0.22) 0%, transparent 70%), ' +
      'radial-gradient(58% 54% at 50% 88%, rgba(20, 184, 166, 0.22) 0%, transparent 70%), ' +
      'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 50%, #f7fee7 100%)',
    darkWash:
      'radial-gradient(58% 52% at 14% 12%, rgba(16, 185, 129, 0.24) 0%, transparent 70%), ' +
      'radial-gradient(54% 50% at 88% 20%, rgba(132, 204, 22, 0.16) 0%, transparent 70%), ' +
      'radial-gradient(56% 52% at 50% 88%, rgba(20, 184, 166, 0.18) 0%, transparent 70%), ' +
      'linear-gradient(135deg, #061510 0%, #091916 55%, #0c1710 100%)',
    spotlightLight: 'rgba(5, 150, 105, 0.22)',
    spotlightDark: 'rgba(52, 211, 153, 0.18)',
    nodeColorsLight: ['#059669', '#16a34a', '#0d9488', '#65a30d', '#10b981'],
    nodeColorsDark: ['#34d399', '#4ade80', '#2dd4bf', '#a3e635', '#6ee7b7'],
  },
  ocean: {
    lightWash:
      'radial-gradient(60% 55% at 15% 10%, rgba(14, 165, 233, 0.26) 0%, transparent 70%), ' +
      'radial-gradient(56% 52% at 88% 24%, rgba(6, 182, 212, 0.24) 0%, transparent 70%), ' +
      'radial-gradient(58% 54% at 30% 90%, rgba(99, 102, 241, 0.18) 0%, transparent 70%), ' +
      'linear-gradient(135deg, #f0f9ff 0%, #ecfeff 50%, #eef2ff 100%)',
    darkWash:
      'radial-gradient(58% 52% at 15% 10%, rgba(14, 165, 233, 0.24) 0%, transparent 70%), ' +
      'radial-gradient(54% 50% at 88% 24%, rgba(6, 182, 212, 0.20) 0%, transparent 70%), ' +
      'radial-gradient(55% 50% at 30% 90%, rgba(99, 102, 241, 0.18) 0%, transparent 70%), ' +
      'linear-gradient(135deg, #07131e 0%, #091726 50%, #0c1026 100%)',
    spotlightLight: 'rgba(14, 165, 233, 0.22)',
    spotlightDark: 'rgba(56, 189, 248, 0.18)',
    nodeColorsLight: ['#0284c7', '#0891b2', '#4f46e5', '#0d9488', '#2563eb'],
    nodeColorsDark: ['#38bdf8', '#22d3ee', '#818cf8', '#2dd4bf', '#60a5fa'],
  },
  sunset: {
    lightWash:
      'radial-gradient(60% 55% at 12% 14%, rgba(245, 158, 11, 0.24) 0%, transparent 70%), ' +
      'radial-gradient(56% 52% at 90% 18%, rgba(244, 63, 94, 0.22) 0%, transparent 70%), ' +
      'radial-gradient(58% 54% at 45% 88%, rgba(249, 115, 22, 0.20) 0%, transparent 70%), ' +
      'linear-gradient(135deg, #fffbeb 0%, #fff1f2 52%, #fff7ed 100%)',
    darkWash:
      'radial-gradient(58% 52% at 12% 14%, rgba(245, 158, 11, 0.20) 0%, transparent 70%), ' +
      'radial-gradient(54% 50% at 90% 18%, rgba(244, 63, 94, 0.19) 0%, transparent 70%), ' +
      'radial-gradient(55% 50% at 45% 88%, rgba(249, 115, 22, 0.16) 0%, transparent 70%), ' +
      'linear-gradient(135deg, #1a1109 0%, #1d0e15 52%, #18101a 100%)',
    spotlightLight: 'rgba(244, 63, 94, 0.18)',
    spotlightDark: 'rgba(251, 113, 133, 0.16)',
    nodeColorsLight: ['#d97706', '#e11d48', '#ea580c', '#db2777', '#059669'],
    nodeColorsDark: ['#fbbf24', '#fb7185', '#fb923c', '#f472b6', '#34d399'],
  },
};

const LOGIC_SYMBOLS = ['if', '==', '()', '{}', '[]', 'for', 'def', 'and', 'or', '!=', '>=', 'in'];

interface ParticleNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  colorIndex: number;
  glyph: string | null;
}

interface ClickRipple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  colorIndex: number;
}

export function InteractiveBackground({
  theme,
  palette,
  interactive,
}: InteractiveBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const spotlightRef = useRef<HTMLDivElement | null>(null);

  const spec = PALETTES[palette];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const colors = theme === 'dark' ? spec.nodeColorsDark : spec.nodeColorsLight;
    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();

    const nodeCount = Math.max(18, Math.min(34, Math.floor((width * height) / 42000)));
    const nodes: ParticleNode[] = Array.from({ length: nodeCount }, (_, idx) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.42,
      vy: (Math.random() - 0.5) * 0.42,
      radius: idx % 3 === 0 ? 4.2 : 2.6,
      colorIndex: idx % colors.length,
      glyph: idx % 3 === 0 ? LOGIC_SYMBOLS[idx % LOGIC_SYMBOLS.length] : null,
    }));

    const ripples: ClickRipple[] = [];
    const pointer = { x: width * 0.5, y: height * 0.35, active: false };

    const updateSpotlight = (px: number, py: number) => {
      if (spotlightRef.current) {
        spotlightRef.current.style.transform = `translate3d(${px - 260}px, ${py - 260}px, 0)`;
      }
    };
    updateSpotlight(pointer.x, pointer.y);

    const handlePointerMove = (e: PointerEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.active = true;
      updateSpotlight(pointer.x, pointer.y);
    };

    const handlePointerLeave = () => {
      pointer.active = false;
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (!interactive || prefersReducedMotion) return;
      ripples.push({
        x: e.clientX,
        y: e.clientY,
        radius: 8,
        maxRadius: 150,
        alpha: 0.42,
        colorIndex: Math.floor(Math.random() * colors.length),
      });

      // Gentle radial impulse away from click
      for (const node of nodes) {
        const dx = node.x - e.clientX;
        const dy = node.y - e.clientY;
        const dist = Math.hypot(dx, dy);
        if (dist > 4 && dist < 170) {
          const push = ((170 - dist) / 170) * 1.4;
          node.vx += (dx / dist) * push;
          node.vy += (dy / dist) * push;
        }
      }
    };

    window.addEventListener('resize', resize, { passive: true });
    if (interactive) {
      window.addEventListener('pointermove', handlePointerMove, { passive: true });
      window.addEventListener('pointerleave', handlePointerLeave, { passive: true });
      window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    }

    let rafId = 0;

    const drawFrame = (animate: boolean) => {
      ctx.clearRect(0, 0, width, height);

      // Draw click ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.radius += 3.6;
        r.alpha *= 0.94;
        if (r.alpha < 0.02 || r.radius > r.maxRadius) {
          ripples.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.strokeStyle = colors[r.colorIndex % colors.length];
        ctx.globalAlpha = r.alpha;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      }

      // Move nodes
      if (animate) {
        for (const node of nodes) {
          if (interactive && pointer.active) {
            const dx = pointer.x - node.x;
            const dy = pointer.y - node.y;
            const dist = Math.hypot(dx, dy);
            if (dist > 22 && dist < 185) {
              // Subtle orbit/attraction near pointer
              const force = ((185 - dist) / 185) * 0.028;
              node.vx += (dx / dist) * force;
              node.vy += (dy / dist) * force;
            }
          }

          // Clamp velocity gently
          node.vx = Math.max(-1.4, Math.min(1.4, node.vx * 0.992));
          node.vy = Math.max(-1.4, Math.min(1.4, node.vy * 0.992));

          // Maintain minimum drift
          if (Math.abs(node.vx) < 0.08 && Math.abs(node.vy) < 0.08) {
            node.vx += (Math.random() - 0.5) * 0.12;
            node.vy += (Math.random() - 0.5) * 0.12;
          }

          node.x += node.vx;
          node.y += node.vy;

          if (node.x < -30) node.x = width + 30;
          if (node.x > width + 30) node.x = -30;
          if (node.y < -30) node.y = height + 30;
          if (node.y > height + 30) node.y = -30;
        }
      }

      // Connecting lines between nearby nodes
      const maxLinkDist = 135;
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist < maxLinkDist) {
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = colors[a.colorIndex % colors.length];
            ctx.globalAlpha = (1 - dist / maxLinkDist) * (theme === 'dark' ? 0.20 : 0.17);
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.restore();
          }
        }

        // Interactive lines to pointer
        if (interactive && pointer.active) {
          const pdx = pointer.x - a.x;
          const pdy = pointer.y - a.y;
          const pdist = Math.hypot(pdx, pdy);
          if (pdist < 175) {
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(pointer.x, pointer.y);
            ctx.strokeStyle = colors[a.colorIndex % colors.length];
            ctx.globalAlpha = (1 - pdist / 175) * (theme === 'dark' ? 0.34 : 0.28);
            ctx.lineWidth = 1.25;
            ctx.stroke();
            ctx.restore();
          }
        }
      }

      // Draw nodes and Python logic glyphs
      ctx.font = '600 11px "JetBrains Mono", ui-monospace, monospace';
      ctx.textBaseline = 'middle';

      for (const node of nodes) {
        const color = colors[node.colorIndex % colors.length];
        ctx.save();
        ctx.fillStyle = color;
        ctx.globalAlpha = theme === 'dark' ? 0.38 : 0.32;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fill();

        if (node.glyph) {
          ctx.globalAlpha = theme === 'dark' ? 0.34 : 0.28;
          ctx.fillText(node.glyph, node.x + node.radius + 5, node.y);
        }
        ctx.restore();
      }
    };

    const tick = () => {
      if (!document.hidden && interactive && !prefersReducedMotion) {
        drawFrame(true);
      }
      if (interactive && !prefersReducedMotion) {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    // Draw initial frame immediately
    drawFrame(false);
    if (interactive && !prefersReducedMotion) {
      rafId = window.requestAnimationFrame(tick);
    }

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerleave', handlePointerLeave);
      window.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [theme, palette, interactive, spec]);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      style={{
        background: theme === 'dark' ? spec.darkWash : spec.lightWash,
      }}
    >
      {/* Pointer-Reactive Colorful Spotlight (GPU composited via translate3d) */}
      {interactive && (
        <div
          ref={spotlightRef}
          className="absolute top-0 left-0 w-[520px] h-[520px] rounded-full will-change-transform transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle, ${
              theme === 'dark' ? spec.spotlightDark : spec.spotlightLight
            } 0%, transparent 68%)`,
          }}
        />
      )}

      {/* Interactive Python Logic Constellation Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 block" />
    </div>
  );
}
