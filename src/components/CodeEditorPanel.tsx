import React, { useRef } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  StepForward,
  Terminal,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import type { CodePreset } from '../data/curriculum';

interface CodeEditorPanelProps {
  code: string;
  onChange: (nextCode: string) => void;
  presets: CodePreset[];
  activeLine: number | null;
  errorLines: number[];
  usesInput: boolean;
  sampleInput: string;
  onSampleInputChange: (val: string) => void;
  // Simulator controls
  isPlaying: boolean;
  isStepping: boolean;
  currentStepIndex: number;
  totalSteps: number;
  speed: number;
  onRun: () => void;
  onStepMode: () => void;
  onNextStep: () => void;
  onReset: () => void;
  onTogglePlay: () => void;
  onSpeedChange: (speed: number) => void;
  onTryExample: () => void;
  hasRun: boolean;
  runCount: number;
  finalOutput: string[];
  syntaxErrorSummary: string | null;
  runtimeNotice: string | null;
  remoteNotice?: string | null;
}

export function CodeEditorPanel({
  code,
  onChange,
  presets,
  activeLine,
  errorLines,
  usesInput,
  sampleInput,
  onSampleInputChange,
  isPlaying,
  isStepping,
  currentStepIndex,
  totalSteps,
  speed,
  onRun,
  onStepMode,
  onNextStep,
  onReset,
  onTogglePlay,
  onSpeedChange,
  onTryExample,
  hasRun,
  runCount,
  finalOutput,
  syntaxErrorSummary,
  runtimeNotice,
  remoteNotice,
}: CodeEditorPanelProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const gutterRef = useRef<HTMLDivElement | null>(null);
  const highlightRef = useRef<HTMLDivElement | null>(null);

  const lines = code.split('\n');

  const handleScroll = () => {
    if (!textareaRef.current) return;
    const { scrollTop } = textareaRef.current;
    if (gutterRef.current) gutterRef.current.scrollTop = scrollTop;
    if (highlightRef.current) highlightRef.current.scrollTop = scrollTop;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const updated = code.slice(0, start) + '    ' + code.slice(end);
      onChange(updated);
      requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = start + 4;
      });
    } else if (e.key === 'Enter') {
      const start = el.selectionStart;
      const before = code.slice(0, start);
      const currentLine = before.split('\n').pop() ?? '';
      const indentMatch = currentLine.match(/^(\s*)/);
      let indent = indentMatch ? indentMatch[1] : '';
      if (currentLine.trimEnd().endsWith(':')) {
        indent += '    ';
      }
      if (indent.length > 0) {
        e.preventDefault();
        const updated = code.slice(0, start) + '\n' + indent + code.slice(el.selectionEnd);
        onChange(updated);
        requestAnimationFrame(() => {
          el.selectionStart = el.selectionEnd = start + 1 + indent.length;
        });
      }
    }
  };

  return (
    <div className="flex flex-col rounded-xl border border-emerald-200/90 dark:border-slate-800/80 bg-white/95 dark:bg-[#111827]/95 overflow-hidden shadow-sm">
      {/* Header & Presets */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-4 py-2.5 border-b border-emerald-100 dark:border-slate-800/80 bg-gradient-to-r from-emerald-50/90 via-sky-50/70 to-amber-50/70 dark:from-[#0F1522] dark:to-[#131B2E]">
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
            Python Editor
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums whitespace-nowrap">
            {lines.length} {lines.length === 1 ? 'line' : 'lines'}
            {remoteNotice ? ` · Synced by ${remoteNotice}` : ''}
          </span>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto max-w-full pb-0.5 sm:pb-0">
          {presets.map((preset) => {
            const isActive = code.trim() === preset.code.trim();
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onChange(preset.code)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white dark:bg-emerald-500/25 dark:text-emerald-300 dark:border dark:border-emerald-500/50'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-emerald-100/70 dark:hover:bg-slate-800/60'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Code Canvas */}
      <div className="relative flex min-h-[210px] max-h-[290px] bg-[#F8FAFC] dark:bg-[#0B0F17] font-mono text-[13.5px] leading-6">
        {/* Line Numbers */}
        <div
          ref={gutterRef}
          aria-hidden="true"
          className="w-10 shrink-0 py-3 text-right pr-2.5 select-none bg-[#F0FDF4] dark:bg-[#0B0F17] border-r border-emerald-100 dark:border-slate-800/60 overflow-hidden tabular-nums"
        >
          {lines.map((_, idx) => {
            const lineNum = idx + 1;
            const isExec = activeLine === lineNum;
            const isErr = errorLines.includes(lineNum);
            return (
              <div
                key={lineNum}
                className={`h-6 ${
                  isErr
                    ? 'text-rose-600 dark:text-rose-400 font-semibold'
                    : isExec
                      ? 'text-emerald-700 dark:text-[#FFD43B] font-semibold'
                      : 'text-slate-400 dark:text-slate-600'
                }`}
              >
                {lineNum}
              </div>
            );
          })}
        </div>

        {/* Highlight Backdrop + Textarea */}
        <div className="relative flex-1 overflow-hidden">
          <div
            ref={highlightRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 py-3 overflow-hidden"
          >
            {lines.map((_, idx) => {
              const lineNum = idx + 1;
              const isExec = activeLine === lineNum;
              const isErr = errorLines.includes(lineNum);
              return (
                <div
                  key={lineNum}
                  className={`h-6 w-full transition-colors duration-150 ${
                    isErr
                      ? 'bg-rose-100/80 dark:bg-rose-500/12'
                      : isExec
                        ? 'bg-emerald-100/90 dark:bg-[#FFD43B]/12'
                        : 'bg-transparent'
                  }`}
                />
              );
            })}
          </div>

          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => onChange(e.target.value)}
            onScroll={handleScroll}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            aria-label="Python code editor"
            placeholder="Write or paste Python code here..."
            className="relative z-10 w-full h-full min-h-[210px] resize-none bg-transparent px-3.5 py-3 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none leading-6 font-mono caret-emerald-600 dark:caret-[#FFD43B]"
          />
        </div>
      </div>

      {/* Optional Simulated Input Bar */}
      {usesInput && (
        <div className="flex items-center gap-3 px-4 py-2 border-t border-emerald-100 dark:border-slate-800/80 bg-emerald-50/50 dark:bg-[#0F1522]">
          <Terminal className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <label htmlFor="sim-input" className="text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap shrink-0">
            Sample input():
          </label>
          <input
            id="sim-input"
            type="text"
            value={sampleInput}
            onChange={(e) => onSampleInputChange(e.target.value)}
            placeholder="Comma-separated values (e.g. 18, Alex)"
            className="flex-1 min-w-0 bg-white dark:bg-[#0B0F17] border border-slate-300 dark:border-slate-700/80 rounded-md px-2.5 py-1 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-400"
          />
        </div>
      )}

      {/* Simulator Controls Bar */}
      <div className="flex flex-col gap-2 px-4 py-2.5 border-t border-emerald-100 dark:border-slate-800/80 bg-emerald-50/40 dark:bg-[#0F1522]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={onRun}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-slate-950 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Run Code
            </button>

            <button
              type="button"
              onClick={onTryExample}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-emerald-300 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-500/25 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Try Example
            </button>

            <button
              type="button"
              onClick={onStepMode}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isStepping
                  ? 'bg-emerald-100 border-emerald-400 text-emerald-900 dark:bg-emerald-500/20 dark:border-emerald-400 dark:text-emerald-200'
                  : 'bg-white dark:bg-slate-800/60 border-slate-300 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <StepForward className="w-3.5 h-3.5" />
              Step-by-Step
            </button>

            <button
              type="button"
              onClick={onNextStep}
              disabled={totalSteps === 0 || (isStepping && currentStepIndex >= totalSteps - 1)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700/80 bg-white dark:bg-slate-800/40 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <SkipForward className="w-3.5 h-3.5" />
              Next Step
            </button>

            <button
              type="button"
              onClick={onTogglePlay}
              disabled={totalSteps === 0}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700/80 bg-white dark:bg-slate-800/40 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {isPlaying ? 'Pause' : 'Play'}
            </button>

            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700/80 bg-white dark:bg-transparent text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>

          {/* Speed Control & Step Counter */}
          <div className="flex items-center gap-2.5">
            {totalSteps > 0 && (
              <span className="text-xs text-slate-600 dark:text-slate-400 tabular-nums whitespace-nowrap">
                Step {isStepping ? Math.max(1, currentStepIndex + 1) : totalSteps} / {totalSteps}
              </span>
            )}
            <div className="flex items-center gap-0.5 bg-white dark:bg-[#0B0F17] border border-slate-300 dark:border-slate-800 rounded-lg p-0.5">
              <span className="px-1.5 text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                Speed
              </span>
              {[0.5, 1, 2].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => onSpeedChange(val)}
                  className={`px-2 py-0.5 text-[11px] font-mono rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    speed === val
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {val}x
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Tip: Click <strong className="font-semibold text-slate-700 dark:text-slate-300">Run Code</strong> to execute immediately or <strong className="font-semibold text-slate-700 dark:text-slate-300">Try Example</strong> to test a working sample.
        </p>
      </div>

      {/* Live Console Output Strip */}
      <div className="px-4 py-2.5 border-t border-emerald-100 dark:border-slate-800/80 bg-[#F8FAFC] dark:bg-[#0B0F17]">
        <div className="flex items-center justify-between gap-2 text-[11px] mb-1.5">
          <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
            <Terminal className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Console Output</span>
          </div>
          {syntaxErrorSummary ? (
            <span className="inline-flex items-center gap-1 font-medium text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-3 h-3" />
              Syntax Error
            </span>
          ) : runtimeNotice ? (
            <span className="inline-flex items-center gap-1 font-medium text-amber-700 dark:text-amber-400">
              <AlertTriangle className="w-3 h-3" />
              Runtime Notice
            </span>
          ) : hasRun ? (
            <span
              key={runCount}
              className="inline-flex items-center gap-1 font-medium text-emerald-700 dark:text-emerald-400 tabular-nums"
            >
              <CheckCircle2 className="w-3 h-3" />
              Executed ({totalSteps} step{totalSteps === 1 ? '' : 's'})
            </span>
          ) : (
            <span className="text-slate-400 dark:text-slate-500">Click Run Code to execute</span>
          )}
        </div>

        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] px-3 py-2 font-mono text-xs min-h-[42px] max-h-28 overflow-y-auto leading-5">
          {code.trim() === '' ? (
            <span className="text-slate-400 dark:text-slate-500">Write Python code above or click Try Example.</span>
          ) : syntaxErrorSummary ? (
            <span className="text-rose-600 dark:text-rose-400">{syntaxErrorSummary}</span>
          ) : runtimeNotice ? (
            <span className="text-amber-700 dark:text-amber-400">{runtimeNotice}</span>
          ) : !hasRun && !isStepping ? (
            <span className="text-slate-500 dark:text-slate-400">
              Ready — press <strong className="font-semibold text-emerald-700 dark:text-emerald-400">Run Code</strong> to see output.
            </span>
          ) : finalOutput.length === 0 ? (
            <span className="text-slate-500 dark:text-slate-400">
              Program ran cleanly across {totalSteps} step{totalSteps === 1 ? '' : 's'} (no print() statements).
            </span>
          ) : (
            finalOutput.map((line, i) => (
              <div key={i} className="text-emerald-700 dark:text-[#FFD43B] font-medium break-words">
                <span className="text-slate-400 dark:text-slate-500 mr-2">&gt;</span>
                {line}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
