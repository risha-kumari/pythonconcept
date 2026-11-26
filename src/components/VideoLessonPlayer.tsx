import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Subtitles,
  Maximize2,
  Minimize2,
  CheckCircle2,
  Lightbulb,
  GitBranch,
  Repeat,
  Box,
  Code2,
  Cpu,
  Cog,
  Terminal,
  ArrowRight,
  SkipForward,
  Calculator,
} from 'lucide-react';
import {
  VIDEO_LESSONS,
  formatVideoTime,
  type VideoCue,
  type VideoTopicLesson,
} from '../data/videoLesson';
import {
  getConsistentCleanVoice,
  speakPureEnglish,
  stopPureSpeech,
} from '../utils/maleNarrator';
import { ThreeDDiagramStage } from './ThreeDDiagramStage';

interface VideoLessonPlayerProps {
  onLoadInDetector?: (code: string) => void;
}

type StudioVoiceChoice = 'Charon' | 'Zephyr' | 'browser-pure';

const PLAYBACK_SPEEDS = [0.75, 1, 1.25, 1.5] as const;

/**
 * 60fps HTML5 Canvas background animation inside the 16:9 video frame.
 * Pauses cleanly when isPlaying is false, just like a real video stream.
 */
function AnimatedCanvasBackdrop({
  isPlaying,
  accentHex,
}: {
  isPlaying: boolean;
  accentHex: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const phaseRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const particles = Array.from({ length: 18 }, (_, i) => ({
      x: ((i * 73) % 100) / 100,
      y: ((i * 41) % 100) / 100,
      speed: 0.00045 + (i % 5) * 0.00018,
      radius: 1.5 + (i % 3) * 0.9,
    }));

    let rafId = 0;
    const drawFrame = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Animated subtle moving coordinate grid
      const gridSize = 36;
      const offset = (phaseRef.current * 18) % gridSize;
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.07)';
      ctx.lineWidth = 1;
      for (let x = offset; x < w; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = offset * 0.5; y < h; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Soft sweeping sine ribbon
      ctx.beginPath();
      for (let x = 0; x <= w; x += 12) {
        const y =
          h * 0.52 +
          Math.sin(x * 0.01 + phaseRef.current * 1.4) * 26 +
          Math.cos(x * 0.005 - phaseRef.current) * 14;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `${accentHex}22`;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Floating glowing data packets
      for (const p of particles) {
        const px = ((p.x + phaseRef.current * p.speed * 60) % 1) * w;
        const py =
          p.y * h + Math.sin(phaseRef.current * 1.8 + p.x * 10) * 10;
        ctx.beginPath();
        ctx.arc(px, py, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${accentHex}55`;
        ctx.fill();
      }

      if (isPlaying) {
        phaseRef.current += 0.02;
        rafId = window.requestAnimationFrame(drawFrame);
      }
    };

    drawFrame();
    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [accentHex, isPlaying]);

  return (
    <canvas
      ref={canvasRef}
      width={640}
      height={360}
      aria-hidden="true"
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
}

interface StageProps {
  cue: VideoCue;
  isPlaying: boolean;
  cueProgress: number;
}

function VideoVisualStage({ cue, isPlaying, cueProgress }: StageProps) {
  const vs = cue.visualState ?? {};

  if (cue.visualMode === 'intro') {
    const sampleLine = 'print("Step 3: Code Python")';
    const typedLen = Math.floor(Math.min(1, cueProgress * 1.35) * sampleLine.length);
    return (
      <div className="flex flex-col justify-between gap-3 p-4 h-full">
        <div className="flex items-center justify-between text-[11px] font-mono text-emerald-300">
          <span className="inline-flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5" />
            Live Python Runner
          </span>
          <span className="text-sky-300">Top → Bottom</span>
        </div>

        <div className="rounded-xl border border-slate-700/90 bg-[#070B14] p-3 font-mono text-xs space-y-2 shadow-inner">
          <div className="text-slate-200 flex items-center">
            <span className="text-emerald-400 mr-2">&gt;&gt;&gt;</span>
            <span>{sampleLine.slice(0, typedLen)}</span>
            <motion.span
              animate={isPlaying ? { opacity: [1, 0, 1] } : { opacity: 1 }}
              transition={{ duration: 0.7, repeat: Infinity }}
              className="inline-block w-2 h-4 bg-emerald-400 ml-0.5"
            />
          </div>
          {cueProgress > 0.45 && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-amber-300 font-semibold pl-6"
            >
              Step 3: Code Python
            </motion.div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-1.5 text-[11px] font-mono">
          {['Line 1 First', 'Line 2 Next', 'Line 3 Last'].map((label, idx) => (
            <motion.div
              key={label}
              animate={
                isPlaying
                  ? {
                      borderColor: [
                        'rgba(51,65,85,0.8)',
                        'rgba(52,211,153,0.8)',
                        'rgba(51,65,85,0.8)',
                      ],
                    }
                  : {}
              }
              transition={{ duration: 2.1, delay: idx * 0.45, repeat: Infinity }}
              className="rounded-md border border-slate-700 bg-slate-900/80 px-2 py-1.5 text-center text-sky-300"
            >
              {label}
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  if (cue.visualMode === 'syntax') {
    const hasSpaces = vs.indentSpaces !== false;
    return (
      <div className="flex flex-col justify-between gap-2.5 p-4 h-full">
        <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-slate-400">
          <span>Indentation Animation</span>
          <span className={hasSpaces ? 'text-emerald-300' : 'text-rose-300'}>
            {hasSpaces ? '4 Spaces Active' : '0 Spaces Error'}
          </span>
        </div>

        <div className="rounded-xl border border-slate-700/80 bg-[#070B14] p-3.5 font-mono text-xs space-y-3">
          <div className="text-slate-200 flex items-center gap-1">
            <span>if score &gt;= 50</span>
            <motion.span
              animate={isPlaying ? { scale: [1, 1.35, 1] } : {}}
              transition={{ duration: 1.2, repeat: Infinity }}
              className="inline-flex items-center justify-center w-5 h-5 rounded bg-amber-400/20 text-amber-300 font-bold"
            >
              :
            </motion.span>
            <span className="ml-1 text-[10px] text-amber-300">← colon</span>
          </div>

          <div className="flex items-center gap-1.5 overflow-hidden">
            {hasSpaces ? (
              <div className="flex items-center gap-1">
                {[0, 1, 2, 3].map((dot) => (
                  <motion.span
                    key={dot}
                    initial={{ scale: 0, x: -16 }}
                    animate={{ scale: 1, x: 0 }}
                    transition={{ delay: dot * 0.16, duration: 0.3 }}
                    className="w-4 h-5 rounded bg-emerald-500/25 border border-emerald-400/70 text-emerald-300 flex items-center justify-center text-[10px] font-bold"
                  >
                    ·
                  </motion.span>
                ))}
              </div>
            ) : (
              <motion.span
                animate={isPlaying ? { x: [0, -5, 5, -4, 0] } : {}}
                transition={{ duration: 0.7, repeat: Infinity, repeatDelay: 0.7 }}
                className="px-2 py-0.5 rounded bg-rose-500/25 border border-rose-400 text-rose-200 text-[10px] font-bold"
              >
                0 spaces!
              </motion.span>
            )}
            <motion.span
              animate={{ x: hasSpaces ? 4 : 0 }}
              className={
                hasSpaces ? 'text-emerald-300 font-semibold' : 'text-rose-300 font-semibold'
              }
            >
              print("Great job!")
            </motion.span>
          </div>
        </div>

        <div
          className={`text-xs font-medium px-3 py-2 rounded-lg border ${
            hasSpaces
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
              : 'border-rose-500/40 bg-rose-500/10 text-rose-300'
          }`}
        >
          {hasSpaces
            ? 'Clean! Four space blocks slide in after every colon (:).'
            : 'IndentationError! Add 4 spaces below the colon to fix.'}
        </div>
      </div>
    );
  }

  if (cue.visualMode === 'variables') {
    const showNewValue = cueProgress >= 0.32;
    const shownVal = showNewValue ? (vs.boxValue ?? '10') : (vs.oldBoxValue ?? '0');
    return (
      <div className="flex flex-col justify-between gap-2.5 p-4 h-full">
        <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-slate-400">
          <span>Memory Storage Box</span>
          <span className="text-amber-300">Live Value Transfer</span>
        </div>

        <div className="relative flex items-center justify-between gap-2 px-1 py-1.5">
          <div className="px-3 py-2 rounded-xl border border-sky-400/50 bg-sky-500/15 flex items-center gap-1.5 z-10">
            <Box className="w-4 h-4 text-sky-300 shrink-0" />
            <span className="font-mono text-xs sm:text-sm font-semibold text-sky-200">
              {vs.boxName ?? 'points'}
            </span>
          </div>

          <div className="flex-1 relative h-9 flex items-center">
            <svg viewBox="0 0 120 30" className="w-full h-8 overflow-visible">
              <path
                d="M 4 15 L 116 15"
                stroke="#fbbf24"
                strokeWidth="3"
                strokeDasharray="6 6"
                fill="none"
                style={{
                  animation: isPlaying ? 'gate-wire-flow 0.85s linear infinite' : 'none',
                }}
              />
              <motion.circle
                cx={110}
                cy={15}
                r={5.5}
                fill="#fbbf24"
                animate={isPlaying ? { cx: [110, 10] } : { cx: 60 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              />
            </svg>
          </div>

          <motion.div
            key={shownVal}
            initial={{ scale: 0.72, y: -8, opacity: 0.5 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 16 }}
            className="px-3.5 py-2 rounded-xl border-2 border-amber-300/70 bg-amber-400/15 font-mono text-base sm:text-lg font-bold text-amber-300 tabular-nums z-10 shadow-lg shadow-amber-500/15"
          >
            {shownVal}
          </motion.div>
        </div>

        {vs.secondBoxName && (
          <div className="flex items-center justify-between px-3 py-1.5 rounded-lg border border-slate-700/80 bg-slate-900/75 font-mono text-xs">
            <span className="text-sky-300">{vs.secondBoxName}</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-emerald-300 font-bold">{vs.secondBoxValue}</span>
          </div>
        )}

        <div className="text-xs text-slate-300 bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-1.5">
          Box <span className="text-sky-300 font-mono">{vs.boxName}</span> now holds{' '}
          <span className="text-amber-300 font-mono font-semibold">{vs.boxValue}</span>.
        </div>
      </div>
    );
  }

  if (cue.visualMode === 'operators') {
    return (
      <div className="flex flex-col justify-between gap-3 p-4 h-full">
        <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <Calculator className="w-3.5 h-3.5 text-sky-400" />
            Live Calculation
          </span>
          <span className="text-amber-300">Operator Flow</span>
        </div>

        <div className="flex items-center justify-center gap-2 font-mono my-auto flex-wrap">
          <motion.div
            animate={isPlaying ? { y: [0, -3, 0] } : {}}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="px-3 py-2 rounded-xl border border-sky-400/50 bg-sky-500/15 text-sky-200 text-sm font-bold"
          >
            {vs.formulaLeft ?? '10'}
          </motion.div>

          <motion.div
            animate={isPlaying ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 1.2, repeat: Infinity }}
            className="w-8 h-8 rounded-full border border-indigo-400/60 bg-indigo-500/20 text-indigo-200 flex items-center justify-center text-sm font-bold"
          >
            {vs.formulaOp ?? '+'}
          </motion.div>

          <motion.div
            animate={isPlaying ? { y: [0, 3, 0] } : {}}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="px-3 py-2 rounded-xl border border-sky-400/50 bg-sky-500/15 text-sky-200 text-sm font-bold"
          >
            {vs.formulaRight ?? '5'}
          </motion.div>

          <ArrowRight className="w-4 h-4 text-slate-400" />

          <motion.div
            animate={isPlaying ? { scale: [1, 1.08, 1] } : {}}
            transition={{ duration: 1.4, repeat: Infinity }}
            className="px-3.5 py-2 rounded-xl border-2 border-emerald-400/70 bg-emerald-500/20 text-emerald-200 text-base font-bold shadow-lg shadow-emerald-500/15"
          >
            {vs.formulaResult ?? '15'}
          </motion.div>
        </div>

        <div className="text-xs text-slate-300 text-center bg-slate-900/75 border border-slate-800 rounded-lg py-1.5 px-3 font-mono">
          {vs.formulaLeft} {vs.formulaOp} {vs.formulaRight} evaluates to{' '}
          <span className="text-emerald-300 font-bold">{vs.formulaResult}</span>
        </div>
      </div>
    );
  }

  if (cue.visualMode === 'datatypes') {
    const tags = vs.pillTags ?? [];
    const activeCardIdx = Math.floor(cueProgress * tags.length) % Math.max(1, tags.length);
    return (
      <div className="flex flex-col justify-center gap-3 p-4 h-full">
        <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-slate-400">
          <span>Value Scanner</span>
          <span className="text-emerald-300">Inspecting Each Kind</span>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {tags.map((tag, idx) => {
            const active = idx === activeCardIdx;
            return (
              <motion.div
                key={tag.label}
                animate={
                  active && isPlaying
                    ? { scale: [1.02, 1.06, 1.02], borderColor: '#34d399' }
                    : { scale: active ? 1.03 : 0.98 }
                }
                transition={{ duration: 1.2, repeat: active && isPlaying ? Infinity : 0 }}
                className={`rounded-xl border p-2.5 transition-colors ${
                  active
                    ? 'border-emerald-400 bg-emerald-500/15 shadow-md shadow-emerald-500/15'
                    : 'border-slate-700/80 bg-slate-900/70 opacity-70'
                }`}
              >
                <div className="font-mono text-sm font-bold text-amber-300 truncate">{tag.label}</div>
                <div className="text-[11px] text-slate-200 mt-0.5 truncate">{tag.kind}</div>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  }

  if (cue.visualMode === 'ifelse') {
    const branch = vs.branchTaken ?? 'none';
    const leftActive = branch === 'if' || branch === 'elif';
    const rightActive = branch === 'else';
    return (
      <div className="flex flex-col justify-between gap-2 p-4 h-full">
        <div className="flex items-center justify-between text-xs">
          <span className="inline-flex items-center gap-1.5 font-mono text-sky-300">
            <GitBranch className="w-3.5 h-3.5" />
            Decision Highway
          </span>
          {vs.boxName && (
            <span className="font-mono text-amber-300 bg-amber-400/10 border border-amber-400/40 px-2 py-0.5 rounded">
              {vs.boxName} = {vs.boxValue}
            </span>
          )}
        </div>

        <svg viewBox="0 0 260 105" className="w-full h-24">
          <path d="M 130 6 L 130 34" stroke="#38bdf8" strokeWidth="3" />
          <polygon
            points="130,26 168,45 130,64 92,45"
            fill="#1e293b"
            stroke="#38bdf8"
            strokeWidth="2"
          />
          <text
            x="130"
            y="49"
            textAnchor="middle"
            className="fill-sky-200 font-mono text-[10px] font-bold"
          >
            CHECK
          </text>

          <path
            d="M 92 45 L 48 45 L 48 90"
            fill="none"
            stroke={leftActive ? '#34d399' : '#334155'}
            strokeWidth={leftActive ? '3.5' : '2'}
            strokeDasharray={leftActive ? '6 5' : undefined}
            style={{
              animation:
                leftActive && isPlaying ? 'gate-wire-flow 0.8s linear infinite' : 'none',
            }}
          />
          <path
            d="M 168 45 L 212 45 L 212 90"
            fill="none"
            stroke={rightActive ? '#fbbf24' : '#334155'}
            strokeWidth={rightActive ? '3.5' : '2'}
            strokeDasharray={rightActive ? '6 5' : undefined}
            style={{
              animation:
                rightActive && isPlaying ? 'gate-wire-flow 0.8s linear infinite' : 'none',
            }}
          />

          {leftActive && (
            <motion.circle
              r="5"
              fill="#34d399"
              animate={
                isPlaying
                  ? { cx: [130, 130, 48, 48], cy: [8, 45, 45, 88] }
                  : { cx: 48, cy: 88 }
              }
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
          {rightActive && (
            <motion.circle
              r="5"
              fill="#fbbf24"
              animate={
                isPlaying
                  ? { cx: [130, 130, 212, 212], cy: [8, 45, 45, 88] }
                  : { cx: 212, cy: 88 }
              }
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
        </svg>

        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div
            className={`rounded-lg border px-2.5 py-1.5 text-center ${
              leftActive
                ? 'border-emerald-400 bg-emerald-500/15 text-emerald-200 font-semibold'
                : 'border-slate-800 bg-slate-900/50 text-slate-500'
            }`}
          >
            {branch === 'elif' ? 'elif (True) ✓' : 'if (True) ✓'}
          </div>
          <div
            className={`rounded-lg border px-2.5 py-1.5 text-center ${
              rightActive
                ? 'border-amber-400 bg-amber-500/15 text-amber-200 font-semibold'
                : 'border-slate-800 bg-slate-900/50 text-slate-500'
            }`}
          >
            else (False) {rightActive ? '✓' : ''}
          </div>
        </div>
      </div>
    );
  }

  if (cue.visualMode === 'gates') {
    const bulbOn = Boolean(vs.bulbOn);
    const gate = vs.gateName ?? 'AND';
    const hasB = vs.inputB !== undefined;
    return (
      <div className="flex flex-col justify-between gap-2 p-4 h-full">
        <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-sky-400" />
            Live Circuit · {gate}
          </span>
          <span className={bulbOn ? 'text-amber-300 font-bold' : 'text-slate-400'}>
            {bulbOn ? 'OUTPUT: ON (1)' : 'OUTPUT: OFF (0)'}
          </span>
        </div>

        <svg viewBox="0 0 280 110" className="w-full h-28">
          <rect
            x="6"
            y={hasB ? '16' : '40'}
            width="58"
            height="26"
            rx="6"
            fill={vs.inputA ? 'rgba(16,185,129,0.2)' : '#1e293b'}
            stroke={vs.inputA ? '#34d399' : '#475569'}
            strokeWidth="1.8"
          />
          <text
            x="35"
            y={hasB ? '33' : '57'}
            textAnchor="middle"
            className="fill-white font-mono text-[10px] font-bold"
          >
            A: {vs.inputA ? '1' : '0'}
          </text>

          <path
            d={hasB ? 'M 64 29 L 106 44' : 'M 64 53 L 106 53'}
            fill="none"
            stroke={vs.inputA ? '#34d399' : '#475569'}
            strokeWidth="3"
            strokeDasharray={vs.inputA ? '6 5' : undefined}
            style={{
              animation:
                vs.inputA && isPlaying ? 'gate-wire-flow 0.7s linear infinite' : 'none',
            }}
          />

          {hasB && (
            <>
              <rect
                x="6"
                y="68"
                width="58"
                height="26"
                rx="6"
                fill={vs.inputB ? 'rgba(16,185,129,0.2)' : '#1e293b'}
                stroke={vs.inputB ? '#34d399' : '#475569'}
                strokeWidth="1.8"
              />
              <text
                x="35"
                y="85"
                textAnchor="middle"
                className="fill-white font-mono text-[10px] font-bold"
              >
                B: {vs.inputB ? '1' : '0'}
              </text>
              <path
                d="M 64 81 L 106 62"
                fill="none"
                stroke={vs.inputB ? '#34d399' : '#475569'}
                strokeWidth="3"
                strokeDasharray={vs.inputB ? '6 5' : undefined}
                style={{
                  animation:
                    vs.inputB && isPlaying ? 'gate-wire-flow 0.7s linear infinite' : 'none',
                }}
              />
            </>
          )}

          <rect
            x="106"
            y="32"
            width="62"
            height="42"
            rx="10"
            fill="rgba(56,189,248,0.16)"
            stroke="#38bdf8"
            strokeWidth="2.2"
          />
          <text
            x="137"
            y="57"
            textAnchor="middle"
            className="fill-sky-200 font-mono text-[12px] font-bold"
          >
            {gate}
          </text>

          <path
            d="M 168 53 L 214 53"
            fill="none"
            stroke={bulbOn ? '#fbbf24' : '#475569'}
            strokeWidth="3.5"
            strokeDasharray={bulbOn ? '6 5' : undefined}
            style={{
              animation: bulbOn && isPlaying ? 'gate-wire-flow 0.65s linear infinite' : 'none',
            }}
          />

          {bulbOn && (
            <motion.circle
              cx="240"
              cy="53"
              r="24"
              fill="rgba(251,191,36,0.22)"
              animate={isPlaying ? { r: [20, 27, 20], opacity: [0.3, 0.75, 0.3] } : {}}
              transition={{ duration: 1.4, repeat: Infinity }}
            />
          )}
          <circle
            cx="240"
            cy="53"
            r="17"
            fill={bulbOn ? 'rgba(251,191,36,0.35)' : '#1e293b'}
            stroke={bulbOn ? '#fbbf24' : '#475569'}
            strokeWidth="2"
          />
        </svg>

        <div className="flex items-center justify-center gap-2 text-xs font-mono">
          <Lightbulb
            className={`w-4 h-4 ${bulbOn ? 'text-amber-300 fill-amber-300' : 'text-slate-500'}`}
          />
          <span className={bulbOn ? 'text-amber-300 font-semibold' : 'text-slate-400'}>
            {bulbOn ? 'Bulb shines ON → True' : 'Bulb stays OFF → False'}
          </span>
        </div>
      </div>
    );
  }

  if (cue.visualMode === 'loops') {
    const activeStep = vs.loopStep ?? 0;
    const animatedLap = Math.min(2, Math.floor(cueProgress * 3));
    const displayStep = isPlaying ? animatedLap : activeStep;
    return (
      <div className="flex flex-col justify-between gap-2.5 p-4 h-full">
        <div className="flex items-center justify-between text-xs font-mono text-sky-300">
          <span className="inline-flex items-center gap-1.5">
            <motion.span
              animate={isPlaying ? { rotate: 360 } : {}}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
              className="inline-flex"
            >
              <Repeat className="w-3.5 h-3.5" />
            </motion.span>
            {vs.loopLabel ?? 'Loop Orbit'}
          </span>
          <span className="text-amber-300">Lap {displayStep + 1} of 3</span>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {[0, 1, 2].map((step) => {
            const isCurrent = step === displayStep;
            const isDone = step < displayStep;
            return (
              <motion.div
                key={step}
                animate={
                  isCurrent && isPlaying
                    ? { scale: [1, 1.07, 1], y: [0, -3, 0] }
                    : { scale: isCurrent ? 1.04 : 1 }
                }
                transition={{ duration: 1.1, repeat: isCurrent && isPlaying ? Infinity : 0 }}
                className={`rounded-xl border p-3 text-center font-mono ${
                  isCurrent
                    ? 'border-amber-300 bg-amber-400/20 text-amber-200 shadow-lg shadow-amber-500/15'
                    : isDone
                    ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300'
                    : 'border-slate-700/80 bg-slate-900/60 text-slate-400'
                }`}
              >
                <div className="text-[10px] opacity-80">Turn {step + 1}</div>
                <div className="text-sm font-bold mt-1">step {step}</div>
              </motion.div>
            );
          })}
        </div>

        <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
          <motion.div
            animate={{ width: `${((displayStep + 1) / 3) * 100}%` }}
            transition={{ duration: 0.45 }}
            className="h-full bg-gradient-to-r from-emerald-400 to-amber-300"
          />
        </div>
      </div>
    );
  }

  if (cue.visualMode === 'lists') {
    const items = vs.listItems ?? ['apple', 'mango', 'kiwi'];
    const activeIdx = vs.activeListIndex ?? 0;
    return (
      <div className="flex flex-col justify-between gap-3 p-4 h-full">
        <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-slate-400">
          <span>Numbered Locker Rail</span>
          <span className="text-emerald-300">Spot [{activeIdx}] Active</span>
        </div>
        <div className="flex flex-wrap gap-2 items-center my-auto">
          {items.map((item, idx) => {
            const isActive = idx === activeIdx;
            return (
              <motion.div
                key={`${item}-${idx}`}
                initial={{ x: idx === 3 ? 34 : 0, scale: 0.85, opacity: 0 }}
                animate={{
                  x: 0,
                  scale: isActive ? 1.07 : 1,
                  y: isActive && isPlaying ? [0, -4, 0] : 0,
                  opacity: 1,
                }}
                transition={{
                  y: { duration: 1.3, repeat: Infinity },
                  duration: 0.35,
                }}
                className={`rounded-xl border px-3 py-2 text-center font-mono ${
                  isActive
                    ? 'border-emerald-400 bg-emerald-500/20 text-emerald-200 shadow-lg shadow-emerald-500/15'
                    : 'border-slate-700 bg-slate-900/75 text-slate-300'
                }`}
              >
                <div className="text-[10px] text-sky-300 font-bold">[{idx}]</div>
                <div className="text-xs font-semibold mt-0.5">"{item}"</div>
              </motion.div>
            );
          })}
        </div>
        <div className="text-xs text-slate-300 font-mono">
          Selected item: "{items[activeIdx] ?? items[0]}"
        </div>
      </div>
    );
  }

  if (cue.visualMode === 'functions') {
    return (
      <div className="flex flex-col justify-between gap-3 p-4 h-full">
        <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-slate-400">
          <span>Recipe Gear Machine</span>
          <span className="text-emerald-300">{vs.fnName ?? 'double(num)'}</span>
        </div>

        <div className="flex items-center justify-between gap-2 font-mono text-xs my-auto">
          <motion.div
            animate={isPlaying ? { x: [0, 6, 0] } : {}}
            transition={{ duration: 1.6, repeat: Infinity }}
            className="px-3 py-2.5 rounded-xl border border-sky-400/60 bg-sky-500/15 text-sky-200 text-center"
          >
            <div className="text-[10px] opacity-80">Input</div>
            <div className="text-sm font-bold">{vs.fnIn ?? '7'}</div>
          </motion.div>

          <div className="flex-1 flex flex-col items-center gap-1 px-2.5 py-2.5 rounded-xl border border-indigo-400/50 bg-indigo-500/15 text-indigo-200 text-center">
            <motion.div
              animate={isPlaying ? { rotate: 360 } : {}}
              transition={{ duration: 2.8, repeat: Infinity, ease: 'linear' }}
            >
              <Cog className="w-5 h-5 text-indigo-300" />
            </motion.div>
            <div className="font-semibold text-[11px]">{vs.fnName ?? 'recipe'}</div>
          </div>

          <motion.div
            animate={isPlaying ? { scale: [1, 1.08, 1] } : {}}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="px-3 py-2.5 rounded-xl border border-emerald-400/70 bg-emerald-500/20 text-emerald-200 text-center shadow-lg shadow-emerald-500/15"
          >
            <div className="text-[10px] opacity-80">Return</div>
            <div className="text-sm font-bold">{vs.fnOut ?? '14'}</div>
          </motion.div>
        </div>

        <div className="text-xs text-slate-300 text-center">
          Input {vs.fnIn ?? '7'} runs through the recipe → returns {vs.fnOut ?? '14'}.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center text-center gap-3 p-4 h-full">
      <motion.div
        animate={isPlaying ? { scale: [1, 1.12, 1] } : {}}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <CheckCircle2 className="w-9 h-9 text-emerald-400" />
      </motion.div>
      <div className="text-sm font-semibold text-white">Topic Mastered!</div>
      <p className="text-xs text-slate-300 max-w-xs">
        Try this code in the Logic Detector or move to the next 1–2 minute topic video below.
      </p>
    </div>
  );
}

export function VideoLessonPlayer({ onLoadInDetector }: VideoLessonPlayerProps) {
  const [selectedLessonId, setSelectedLessonId] = useState<string>(VIDEO_LESSONS[0].id);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [voiceChoice, setVoiceChoice] = useState<StudioVoiceChoice>('Charon');
  const [voiceStatusNote, setVoiceStatusNote] = useState<string>('Pure Studio Voice (Charon)');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const stageContainerRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ttsClientCacheRef = useRef<Map<string, string>>(new Map());
  const speechTokenRef = useRef<number>(0);
  const lastSpokenCueIdRef = useRef<string | null>(null);
  const activeTranscriptItemRef = useRef<HTMLButtonElement | null>(null);
  const rateLimitCooldownUntilRef = useRef<number>(0);

  const activeLesson: VideoTopicLesson = useMemo(
    () => VIDEO_LESSONS.find((l) => l.id === selectedLessonId) ?? VIDEO_LESSONS[0],
    [selectedLessonId],
  );

  const totalSeconds = activeLesson.durationSeconds;
  const cues = activeLesson.cues;

  const activeCueIndex = useMemo(() => {
    const idx = cues.findIndex((c) => currentTime >= c.start && currentTime < c.end);
    if (idx !== -1) return idx;
    return currentTime >= totalSeconds ? cues.length - 1 : 0;
  }, [cues, currentTime, totalSeconds]);

  const activeCue = cues[activeCueIndex] ?? cues[0];
  const cueDuration = Math.max(1, activeCue.end - activeCue.start);
  const cueProgress = Math.max(
    0,
    Math.min(1, (currentTime - activeCue.start) / cueDuration),
  );

  const nextLesson = useMemo(() => {
    const idx = VIDEO_LESSONS.findIndex((l) => l.id === activeLesson.id);
    return idx >= 0 && idx < VIDEO_LESSONS.length - 1 ? VIDEO_LESSONS[idx + 1] : null;
  }, [activeLesson.id]);

  const stopAllAudio = useCallback(() => {
    speechTokenRef.current += 1;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    stopPureSpeech();
  }, []);

  const speakCue = useCallback(
    async (cue: VideoCue, cueIndex: number) => {
      stopAllAudio();
      if (isMuted) return;

      const token = speechTokenRef.current;

      if (voiceChoice === 'browser-pure' || Date.now() < rateLimitCooldownUntilRef.current) {
        setVoiceStatusNote('Pure English Voice');
        speakPureEnglish(cue.subtitle, playbackRate);
        return;
      }

      const cacheKey = `${voiceChoice}:${cue.id}`;
      try {
        let dataUrl = ttsClientCacheRef.current.get(cacheKey);
        if (!dataUrl) {
          const res = await fetch('/api/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: cue.subtitle, voice: voiceChoice }),
          });
          if (res.status === 429) {
            // Stay on the consistent fallback voice for the rest of this topic video instead of bouncing mid-lesson
            rateLimitCooldownUntilRef.current = Date.now() + 180_000;
            throw new Error('Rate limited');
          }
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
          }
          const data = (await res.json()) as { audioBase64?: string; mimeType?: string };
          if (!data.audioBase64) throw new Error('Empty audio');
          dataUrl = `data:${data.mimeType || 'audio/wav'};base64,${data.audioBase64}`;
          ttsClientCacheRef.current.set(cacheKey, dataUrl);
        }

        if (token !== speechTokenRef.current) return;

        const audio = new Audio(dataUrl);
        audio.playbackRate = playbackRate;
        audioRef.current = audio;
        await audio.play();
        setVoiceStatusNote(`Pure Studio Voice (${voiceChoice})`);

        // Gently warm-cache ONLY the very next scene after a calm 3s spacing
        const nextCue = cues[cueIndex + 1];
        if (nextCue) {
          const nextKey = `${voiceChoice}:${nextCue.id}`;
          if (!ttsClientCacheRef.current.has(nextKey)) {
            window.setTimeout(() => {
              if (
                token === speechTokenRef.current &&
                Date.now() >= rateLimitCooldownUntilRef.current
              ) {
                void fetch('/api/tts', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ text: nextCue.subtitle, voice: voiceChoice }),
                })
                  .then((r) => (r.ok ? r.json() : null))
                  .then((d: { audioBase64?: string; mimeType?: string } | null) => {
                    if (d?.audioBase64) {
                      ttsClientCacheRef.current.set(
                        nextKey,
                        `data:${d.mimeType || 'audio/wav'};base64,${d.audioBase64}`,
                      );
                    }
                  })
                  .catch(() => {});
              }
            }, 3000);
          }
        }
      } catch {
        if (token !== speechTokenRef.current) return;
        setVoiceStatusNote('Pure English Voice');
        speakPureEnglish(cue.subtitle, playbackRate);
      }
    },
    [cues, isMuted, playbackRate, stopAllAudio, voiceChoice],
  );

  // Playback timer synced to active topic duration (90s–105s)
  useEffect(() => {
    if (!isPlaying) return;

    const intervalMs = 100;
    const timer = window.setInterval(() => {
      setCurrentTime((prev) => {
        const next = prev + (intervalMs / 1000) * playbackRate;
        if (next >= totalSeconds) {
          setIsPlaying(false);
          return totalSeconds;
        }
        return next;
      });
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [isPlaying, playbackRate, totalSeconds]);

  // Speak cleanly once per scene change
  useEffect(() => {
    if (!isPlaying || isMuted) {
      if (!isPlaying) {
        lastSpokenCueIdRef.current = null;
      }
      return;
    }

    if (lastSpokenCueIdRef.current !== activeCue.id) {
      lastSpokenCueIdRef.current = activeCue.id;
      void speakCue(activeCue, activeCueIndex);
    }
  }, [activeCue, activeCueIndex, isMuted, isPlaying, speakCue]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  useEffect(() => {
    activeTranscriptItemRef.current?.scrollIntoView({
      block: 'nearest',
      behavior: 'smooth',
    });
  }, [activeCue.id]);

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const assign = () => getConsistentCleanVoice();
      assign();
      window.speechSynthesis.addEventListener('voiceschanged', assign);
      return () => {
        window.speechSynthesis.removeEventListener('voiceschanged', assign);
        stopAllAudio();
      };
    }
    return () => {
      stopAllAudio();
    };
  }, [stopAllAudio]);

  const handleSelectTopic = (lessonId: string, autoPlay = false) => {
    stopAllAudio();
    lastSpokenCueIdRef.current = null;
    setSelectedLessonId(lessonId);
    setCurrentTime(0);
    setIsPlaying(autoPlay);
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      stopAllAudio();
      lastSpokenCueIdRef.current = null;
    } else {
      if (currentTime >= totalSeconds - 0.5) {
        setCurrentTime(0);
      }
      lastSpokenCueIdRef.current = null;
      setIsPlaying(true);
    }
  };

  const handleSeek = (seconds: number) => {
    const clamped = Math.max(0, Math.min(totalSeconds, seconds));
    stopAllAudio();
    lastSpokenCueIdRef.current = null;
    setCurrentTime(clamped);
  };

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (nextMuted) {
      stopAllAudio();
    } else if (isPlaying) {
      lastSpokenCueIdRef.current = null;
    }
  };

  const handleCycleVoice = () => {
    const order: StudioVoiceChoice[] = ['Charon', 'Zephyr', 'browser-pure'];
    const next = order[(order.indexOf(voiceChoice) + 1) % order.length];
    stopAllAudio();
    lastSpokenCueIdRef.current = null;
    rateLimitCooldownUntilRef.current = 0;
    setVoiceChoice(next);
    setVoiceStatusNote(
      next === 'browser-pure' ? 'Pure English Voice' : `Pure Studio Voice (${next})`,
    );
  };

  const handleToggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement && stageContainerRef.current) {
        await stageContainerRef.current.requestFullscreen();
      } else if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch {
      // Ignore fullscreen denial in restricted iframe contexts
    }
  };

  const progressPct = Math.min(100, (currentTime / totalSeconds) * 100);
  const accentHex =
    activeLesson.level === 'Beginner'
      ? '#34d399'
      : activeLesson.level === 'Core Logic'
      ? '#38bdf8'
      : '#a78bfa';

  return (
    <div className="flex flex-col gap-5">
      {/* Topic Selector Strip (8 Videos, 1.5 – 1.75 min each) */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#111827] p-3.5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              8 Animated Python Video Topics (1–2 Min Each)
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Complete Python guide with practical tips, pure voice narration, and animated visuals for every topic.
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-700 dark:text-emerald-400 tabular-nums">
            Topic {activeLesson.index} of {VIDEO_LESSONS.length} ·{' '}
            {formatVideoTime(activeLesson.durationSeconds, 300)}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {VIDEO_LESSONS.map((lesson) => {
            const isSelected = lesson.id === activeLesson.id;
            return (
              <button
                key={lesson.id}
                type="button"
                onClick={() => handleSelectTopic(lesson.id, true)}
                className={`rounded-lg border px-3 py-2 text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/15 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#0B0F17] hover:border-emerald-400/70'
                }`}
              >
                <div className="flex items-center justify-between gap-1 text-[11px] font-mono">
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                    #{lesson.index}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 tabular-nums">
                    {formatVideoTime(lesson.durationSeconds, 300)}
                  </span>
                </div>
                <div className="text-xs font-semibold text-slate-900 dark:text-white mt-0.5 truncate">
                  {lesson.shortTitle}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Theater Player Card */}
      <div
        ref={stageContainerRef}
        className={`rounded-2xl border border-slate-800 bg-[#0B0F17] text-slate-100 overflow-hidden shadow-xl flex flex-col ${
          isFullscreen ? 'justify-between p-4' : ''
        }`}
      >
        {/* 16:9 Animated Video Stage */}
        <div
          onClick={handleTogglePlay}
          className="relative w-full aspect-video min-h-[360px] sm:min-h-[430px] bg-gradient-to-br from-[#080C15] via-[#0F172A] to-[#0B172A] flex flex-col justify-between p-4 sm:p-6 overflow-hidden cursor-pointer select-none"
        >
          {/* Real 60fps Canvas Motion Backdrop */}
          <AnimatedCanvasBackdrop isPlaying={isPlaying} accentHex={accentHex} />

          {/* Top Stage Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 z-10">
            <div className="flex items-center gap-2.5 text-xs font-mono text-emerald-300 font-semibold">
              <span
                className={`w-2 h-2 rounded-full ${
                  isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                }`}
              />
              <span>
                Topic {activeLesson.index}: {activeLesson.title}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-sky-300">
              <span>{activeCue.sceneTitle}</span>
              {isPlaying && !isMuted && (
                <span className="inline-flex items-end gap-0.5 h-3" aria-hidden="true">
                  {[0, 1, 2].map((bar) => (
                    <motion.span
                      key={bar}
                      animate={{ height: ['4px', '12px', '5px'] }}
                      transition={{
                        duration: 0.65,
                        delay: bar * 0.15,
                        repeat: Infinity,
                      }}
                      className="w-0.5 bg-emerald-400 rounded-full"
                    />
                  ))}
                </span>
              )}
            </div>
          </div>

          {/* Center 2-Panel Synchronized Animation Stage */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="grid grid-cols-1 md:grid-cols-12 gap-3.5 my-auto py-2 z-10 items-stretch cursor-default"
          >
            {/* Left: Animated Python Code + Live Output */}
            <div className="md:col-span-6 rounded-xl border border-slate-700/80 bg-[#0A0F1A]/95 overflow-hidden flex flex-col justify-between shadow-lg">
              <div className="flex items-center justify-between px-3.5 py-2 border-b border-slate-800 bg-[#111827]">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-slate-300">
                  <Code2 className="w-3.5 h-3.5 text-emerald-400" />
                  lesson_{activeLesson.index}.py
                </span>
                {onLoadInDetector && (
                  <button
                    type="button"
                    onClick={() => onLoadInDetector(activeCue.codeLines.join('\n'))}
                    className="text-[11px] font-semibold text-amber-300 hover:underline cursor-pointer"
                  >
                    Try Code in Detector
                  </button>
                )}
              </div>

              <div className="p-3.5 font-mono text-xs sm:text-[13px] leading-6 space-y-1 flex-1 flex flex-col justify-center">
                {activeCue.codeLines.map((line, idx) => {
                  const isLineActive = idx === activeCue.highlightLine;
                  return (
                    <motion.div
                      key={`${activeCue.id}-line-${idx}`}
                      animate={{
                        backgroundColor: isLineActive
                          ? 'rgba(16, 185, 129, 0.18)'
                          : 'rgba(15, 23, 42, 0)',
                        x: isLineActive && isPlaying ? [0, 3, 0] : 0,
                      }}
                      transition={{
                        x: { duration: 1.6, repeat: Infinity },
                        backgroundColor: { duration: 0.2 },
                      }}
                      className={`flex items-center gap-2 px-2.5 py-0.5 rounded-md border-l-2 ${
                        isLineActive
                          ? 'border-emerald-400 text-white font-semibold'
                          : 'border-transparent text-slate-400'
                      }`}
                    >
                      <span className="w-3 text-emerald-400 text-[10px] shrink-0">
                        {isLineActive ? '▶' : ''}
                      </span>
                      <span className="text-[10px] text-slate-500 select-none w-3.5 text-right tabular-nums">
                        {idx + 1}
                      </span>
                      <span className="whitespace-pre overflow-x-auto">{line || ' '}</span>
                    </motion.div>
                  );
                })}
              </div>

              {/* Animated Console Output Bar */}
              {activeCue.consoleOutput && activeCue.consoleOutput.length > 0 && (
                <div className="px-3.5 py-2 border-t border-slate-800/90 bg-[#070B12] font-mono text-[11px] flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="text-slate-500">Output:</span>
                  {activeCue.consoleOutput.map((out, i) => (
                    <span
                      key={`${out}-${i}`}
                      className={
                        out.includes('Error') ? 'text-rose-300 font-semibold' : 'text-amber-300'
                      }
                    >
                      {out}
                    </span>
                  ))}
                </div>
              )}

              <div className="h-1 w-full bg-slate-800/80">
                <div
                  className="h-full bg-emerald-400 transition-[width] duration-150"
                  style={{ width: `${Math.round(cueProgress * 100)}%` }}
                />
              </div>
            </div>

            {/* Right: Interactive 3D Diagram Stage */}
            <div className="md:col-span-6 rounded-xl border border-slate-700/80 bg-[#0A0F1A]/95 min-h-[220px] shadow-lg overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeCue.id}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.22 }}
                  className="h-full"
                >
                  <ThreeDDiagramStage
                    visualMode={activeCue.visualMode}
                    isPlaying={isPlaying}
                    cueProgress={cueProgress}
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Initial Center Play Prompt or Next Topic Prompt */}
          {!isPlaying && currentTime === 0 && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-20 pointer-events-none">
              <div className="pointer-events-auto flex flex-col items-center gap-2.5 text-center px-4">
                <button
                  type="button"
                  onClick={handleTogglePlay}
                  aria-label={`Play ${activeLesson.title}`}
                  className="w-16 h-16 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-2xl shadow-emerald-950/60 cursor-pointer transition-transform hover:scale-105"
                >
                  <Play className="w-7 h-7 fill-current ml-1" />
                </button>
                <span className="text-xs font-medium text-white bg-black/80 border border-slate-700 px-3.5 py-1.5 rounded-full">
                  Play Topic {activeLesson.index}: {activeLesson.shortTitle} (
                  {formatVideoTime(totalSeconds, 300)}) · Pure Voice &amp; Subtitles
                </span>
              </div>
            </div>
          )}

          {!isPlaying && currentTime >= totalSeconds && nextLesson && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute inset-0 bg-black/55 flex items-center justify-center z-20"
            >
              <div className="rounded-2xl border border-emerald-500/40 bg-[#0F172A] p-5 text-center max-w-sm mx-4 shadow-2xl">
                <div className="text-xs font-mono text-emerald-300 font-semibold">
                  Topic {activeLesson.index} Complete!
                </div>
                <div className="text-sm font-semibold text-white mt-1">
                  Up Next: {nextLesson.index}. {nextLesson.title}
                </div>
                <button
                  type="button"
                  onClick={() => handleSelectTopic(nextLesson.id, true)}
                  className="mt-3.5 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                  Play Next Topic ({formatVideoTime(nextLesson.durationSeconds, 300)})
                </button>
              </div>
            </div>
          )}

          {/* Bottom Synchronized English Subtitles Overlay (Floating absolute when CC is on so it never pushes layout or scrolls) */}
          {showSubtitles && (
            <div className="absolute bottom-12 left-4 right-4 z-20 flex justify-center pointer-events-none">
              <div
                className="max-w-2xl text-center px-4 py-2 rounded-lg bg-black/85 border border-slate-700/80 text-white text-xs sm:text-sm leading-relaxed shadow-xl pointer-events-auto backdrop-blur-sm"
                role="status"
                aria-live="polite"
              >
                {activeCue.subtitle}
              </div>
            </div>
          )}
        </div>

        {/* Video Progress Bar & Player Controls */}
        <div className="bg-[#111827] border-t border-slate-800 px-4 py-3 flex flex-col gap-3">
          <div className="relative flex flex-col gap-1">
            <input
              type="range"
              aria-label="Video timeline"
              min={0}
              max={totalSeconds}
              step={1}
              value={Math.floor(currentTime)}
              onChange={(e) => handleSeek(Number(e.target.value))}
              className="w-full accent-emerald-400 cursor-pointer h-1.5"
              style={{
                background: `linear-gradient(to right, #34d399 ${progressPct}%, #334155 ${progressPct}%)`,
              }}
            />
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 tabular-nums">
              <span>{formatVideoTime(currentTime, 300)}</span>
              <span className="hidden sm:inline text-slate-400">{voiceStatusNote}</span>
              <span>{formatVideoTime(totalSeconds, 300)}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleTogglePlay}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    {currentTime > 0 && currentTime < totalSeconds ? 'Resume' : 'Play'}
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleSeek(currentTime - 15)}
                aria-label="Rewind 15 seconds"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs cursor-pointer whitespace-nowrap shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                -15s
              </button>

              <button
                type="button"
                onClick={() => handleSeek(currentTime + 15)}
                aria-label="Forward 15 seconds"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs cursor-pointer whitespace-nowrap shrink-0"
              >
                +15s
                <RotateCw className="w-3.5 h-3.5" />
              </button>

              {nextLesson && (
                <button
                  type="button"
                  onClick={() => handleSelectTopic(nextLesson.id, true)}
                  className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-sky-300 text-xs cursor-pointer whitespace-nowrap shrink-0"
                >
                  Next Topic
                  <SkipForward className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <div className="inline-flex items-center rounded-lg border border-slate-700 bg-slate-900 p-0.5">
                {PLAYBACK_SPEEDS.map((spd) => (
                  <button
                    key={spd}
                    type="button"
                    onClick={() => setPlaybackRate(spd)}
                    className={`px-2 py-1 text-[11px] font-mono rounded-md cursor-pointer transition-colors ${
                      playbackRate === spd
                        ? 'bg-emerald-600 text-white font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setShowSubtitles((s) => !s)}
                aria-pressed={showSubtitles}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium cursor-pointer whitespace-nowrap shrink-0 ${
                  showSubtitles
                    ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-300'
                    : 'border-slate-700 bg-slate-800/80 text-slate-400'
                }`}
              >
                <Subtitles className="w-3.5 h-3.5" />
                CC
              </button>

              <button
                type="button"
                onClick={handleToggleMute}
                aria-pressed={!isMuted}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium cursor-pointer whitespace-nowrap shrink-0 ${
                  !isMuted
                    ? 'border-sky-500/60 bg-sky-500/15 text-sky-300'
                    : 'border-slate-700 bg-slate-800/80 text-slate-400'
                }`}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                {isMuted ? 'Muted' : 'Sound On'}
              </button>

              <button
                type="button"
                onClick={handleCycleVoice}
                title="Switch studio voice (Charon / Zephyr) or Pure Browser English voice"
                className="px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-[11px] text-slate-300 cursor-pointer whitespace-nowrap shrink-0"
              >
                {voiceChoice === 'browser-pure'
                  ? 'Voice: Pure Browser'
                  : `Voice: Studio (${voiceChoice})`}
              </button>

              <button
                type="button"
                onClick={handleToggleFullscreen}
                aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                className="p-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 cursor-pointer shrink-0"
              >
                {isFullscreen ? (
                  <Minimize2 className="w-3.5 h-3.5" />
                ) : (
                  <Maximize2 className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Synchronized Scene Breakdown & English Subtitles for This Topic */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#111827] overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Topic {activeLesson.index} Script &amp; Animated Scenes ({formatVideoTime(totalSeconds, 300)})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {activeLesson.summary}
            </p>
          </div>
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
            Click any scene to jump
          </span>
        </div>

        <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
          {cues.map((cue) => {
            const isActive = cue.id === activeCue.id;
            return (
              <button
                key={cue.id}
                ref={isActive ? activeTranscriptItemRef : undefined}
                type="button"
                onClick={() => {
                  handleSeek(cue.start);
                  setIsPlaying(true);
                }}
                className={`w-full px-4 py-3 text-left flex items-start gap-3 transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-emerald-50 dark:bg-emerald-500/15 text-slate-900 dark:text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <span className="font-mono text-[11px] text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5 tabular-nums">
                  {formatVideoTime(cue.start, 300)}
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-sky-700 dark:text-sky-400">
                    {cue.sceneTitle}
                  </div>
                  <p className="text-xs leading-relaxed mt-0.5">{cue.subtitle}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
