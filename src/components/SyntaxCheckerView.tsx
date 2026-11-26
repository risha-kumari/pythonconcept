import { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Wrench,
  ArrowRight,
  Play,
  Sparkles,
  Trash2,
  Terminal,
} from 'lucide-react';
import { DETECTOR_PRESETS, SYNTAX_ERROR_PRESETS } from '../data/curriculum';
import type { PythonAnalysisResult, SyntaxIssue } from '../engine/pythonAnalyzer';

interface SyntaxCheckerViewProps {
  code: string;
  onChangeCode: (nextCode: string) => void;
  analysis: PythonAnalysisResult;
  onApplyFix: (issue: SyntaxIssue) => void;
  onOpenInDetector: () => void;
}

export function SyntaxCheckerView({
  code,
  onChangeCode,
  analysis,
  onApplyFix,
  onOpenInDetector,
}: SyntaxCheckerViewProps) {
  const [lastExecutedCode, setLastExecutedCode] = useState<string | null>(null);
  const [runCount, setRunCount] = useState(0);

  const lines = code.split('\n');
  const errorLines = new Set(analysis.syntaxIssues.map((i) => i.line));
  const isEmpty = code.trim() === '';
  const hasRun = lastExecutedCode !== null && lastExecutedCode === code;

  const handleRunCode = () => {
    if (isEmpty) return;
    setLastExecutedCode(code);
    setRunCount((c) => c + 1);
  };

  const handleTryExample = () => {
    const currentIdx = DETECTOR_PRESETS.findIndex((p) => p.code.trim() === code.trim());
    const nextPreset = DETECTOR_PRESETS[(currentIdx + 1) % DETECTOR_PRESETS.length];
    onChangeCode(nextPreset.code);
    setLastExecutedCode(nextPreset.code);
    setRunCount((c) => c + 1);
  };

  const handleClear = () => {
    onChangeCode('');
    setLastExecutedCode(null);
  };

  const firstSyntaxSummary =
    analysis.syntaxIssues.length > 0
      ? `Line ${analysis.syntaxIssues[0].line}: ${analysis.syntaxIssues[0].title} — ${analysis.syntaxIssues[0].reason}`
      : null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Python Syntax Checker
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
            Test broken Python code or try common beginner mistakes to see the exact line, plain-English reason, and a one-click fix.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {isEmpty ? (
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#111827] text-slate-700 dark:text-slate-300 text-sm font-semibold whitespace-nowrap">
              <Terminal className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              Syntax Status: Waiting for Code
            </div>
          ) : analysis.isValidSyntax ? (
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-emerald-300 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 text-sm font-semibold whitespace-nowrap">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Syntax Status: Valid
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-rose-300 dark:border-rose-500/40 bg-rose-50 dark:bg-rose-500/10 text-rose-800 dark:text-rose-300 text-sm font-semibold whitespace-nowrap">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              Syntax Status: Error Found
            </div>
          )}
        </div>
      </div>

      {/* Main Two-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-5 items-start">
        {/* Left: Sticky Code Input & Error Presets */}
        <div className="lg:col-span-6 lg:sticky lg:top-20 flex flex-col gap-3">
          <div className="rounded-xl border border-amber-200/90 dark:border-slate-800/80 bg-white/95 dark:bg-[#111827]/95 overflow-hidden shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b border-amber-100 dark:border-slate-800/80 bg-gradient-to-r from-amber-50/90 via-rose-50/60 to-emerald-50/70 dark:from-[#0F1522] dark:to-[#131B2E]">
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Test Code Input
              </span>
              <span className="text-xs text-slate-600 dark:text-slate-400">
                Try a common mistake below
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 px-4 py-2 border-b border-emerald-100 dark:border-slate-800/60 bg-[#F8FAFC] dark:bg-[#0D131F]">
              {SYNTAX_ERROR_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onChangeCode(preset.code)}
                  className="px-2.5 py-1 text-xs font-medium rounded-md text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white bg-white dark:bg-slate-800/50 hover:bg-emerald-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="flex min-h-[220px] bg-[#F8FAFC] dark:bg-[#0B0F17] font-mono text-[13.5px] leading-6">
              <div
                aria-hidden="true"
                className="w-10 shrink-0 py-3 text-right pr-2.5 select-none bg-[#F0FDF4] dark:bg-[#0B0F17] border-r border-emerald-100 dark:border-slate-800/60 tabular-nums"
              >
                {lines.map((_, idx) => {
                  const lineNum = idx + 1;
                  const hasErr = errorLines.has(lineNum);
                  return (
                    <div
                      key={lineNum}
                      className={`h-6 ${
                        hasErr
                          ? 'text-rose-600 dark:text-rose-400 font-semibold'
                          : 'text-slate-400 dark:text-slate-600'
                      }`}
                    >
                      {lineNum}
                    </div>
                  );
                })}
              </div>
              <textarea
                value={code}
                onChange={(e) => onChangeCode(e.target.value)}
                spellCheck={false}
                placeholder="Write or paste Python code here, or click Try Example..."
                aria-label="Syntax checker Python editor"
                className="flex-1 min-h-[220px] resize-y bg-transparent px-3.5 py-3 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none leading-6 font-mono caret-emerald-600 dark:caret-[#FFD43B]"
              />
            </div>

            {/* Editor Action Controls: Run Code, Try Example, Clear */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-t border-emerald-100 dark:border-slate-800/80 bg-emerald-50/40 dark:bg-[#0F1522]">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleRunCode}
                  disabled={isEmpty}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-slate-950 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Run Code
                </button>

                <button
                  type="button"
                  onClick={handleTryExample}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-emerald-300 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-500/25 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Try Example
                </button>

                <button
                  type="button"
                  onClick={handleClear}
                  disabled={code.length === 0}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700/80 bg-white dark:bg-transparent text-slate-700 dark:text-slate-300 hover:text-rose-700 dark:hover:text-rose-300 hover:border-rose-300 dark:hover:border-rose-500/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear
                </button>
              </div>

              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 tabular-nums whitespace-nowrap">
                {lines.length} {lines.length === 1 ? 'line' : 'lines'}
              </span>
            </div>

            {/* Console Output Strip */}
            <div className="px-4 py-2.5 border-t border-emerald-100 dark:border-slate-800/80 bg-[#F8FAFC] dark:bg-[#0B0F17]">
              <div className="flex items-center justify-between gap-2 text-[11px] mb-1.5">
                <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                  <Terminal className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Console Output</span>
                </div>
                {hasRun ? (
                  firstSyntaxSummary ? (
                    <span className="inline-flex items-center gap-1 font-medium text-rose-600 dark:text-rose-400">
                      <AlertTriangle className="w-3 h-3" />
                      Execution Blocked by Syntax Error
                    </span>
                  ) : analysis.runtimeNotice ? (
                    <span className="inline-flex items-center gap-1 font-medium text-amber-700 dark:text-amber-400">
                      <AlertTriangle className="w-3 h-3" />
                      Runtime Notice
                    </span>
                  ) : (
                    <span
                      key={runCount}
                      className="inline-flex items-center gap-1 font-medium text-emerald-700 dark:text-emerald-400 tabular-nums"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      Executed ({analysis.steps.length} step{analysis.steps.length === 1 ? '' : 's'})
                    </span>
                  )
                ) : (
                  <span className="text-slate-400 dark:text-slate-500">
                    Click Run Code to test output
                  </span>
                )}
              </div>

              <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] px-3 py-2 font-mono text-xs min-h-[42px] max-h-28 overflow-y-auto leading-5">
                {isEmpty ? (
                  <span className="text-slate-400 dark:text-slate-500">
                    Editor cleared. Write Python code above or click Try Example.
                  </span>
                ) : !hasRun ? (
                  <span className="text-slate-500 dark:text-slate-400">
                    Ready — press <strong className="font-semibold text-emerald-700 dark:text-emerald-400">Run Code</strong> to check and execute.
                  </span>
                ) : firstSyntaxSummary ? (
                  <span className="text-rose-600 dark:text-rose-400">{firstSyntaxSummary}</span>
                ) : analysis.runtimeNotice ? (
                  <span className="text-amber-700 dark:text-amber-400">{analysis.runtimeNotice}</span>
                ) : analysis.finalOutput.length === 0 ? (
                  <span className="text-slate-500 dark:text-slate-400">
                    Program ran cleanly across {analysis.steps.length} step{analysis.steps.length === 1 ? '' : 's'} (no print() statements).
                  </span>
                ) : (
                  analysis.finalOutput.map((line, i) => (
                    <div key={i} className="text-emerald-700 dark:text-[#FFD43B] font-medium break-words">
                      <span className="text-slate-400 dark:text-slate-500 mr-2">&gt;</span>
                      {line}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 px-1">
            <span>Checks colons, indentation, brackets, quotes, keywords, and operators.</span>
            <button
              type="button"
              onClick={onOpenInDetector}
              className="inline-flex items-center gap-1 text-emerald-700 dark:text-[#7CC4FF] hover:underline font-semibold whitespace-nowrap cursor-pointer"
            >
              Simulate in Logic Detector
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right: Diagnostics */}
        <div className="lg:col-span-6 flex flex-col gap-3.5">
          {isEmpty ? (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white/95 dark:bg-[#111827]/95 p-5 shadow-xs">
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold text-base">
                <Terminal className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>Editor Is Empty</span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                Paste your own Python code on the left, select a mistake preset to inspect how syntax fixes work, or load a working sample.
              </p>
              <button
                type="button"
                onClick={handleTryExample}
                className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Try Example
              </button>
            </div>
          ) : analysis.isValidSyntax ? (
            <div className="rounded-xl border border-emerald-300 dark:border-emerald-500/30 bg-emerald-50/60 dark:bg-[#111827] p-5">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold text-base">
                <CheckCircle2 className="w-5 h-5" />
                <span>No Syntax Mistakes Found</span>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 mt-1.5 leading-relaxed">
                Your colons, indentation levels, quotes, brackets, and Python keywords are valid. You can run it on the left or watch it step by step in the Logic Detector.
              </p>
              <button
                type="button"
                onClick={onOpenInDetector}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-[#FFD43B] dark:text-[#0B0F17] dark:hover:bg-[#FFE066] transition-colors cursor-pointer"
              >
                Open in Logic Detector
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3.5">
              {analysis.syntaxIssues.map((issue) => (
                <div
                  key={issue.id}
                  className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#111827] p-4 flex flex-col gap-3 shadow-xs"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-xs text-rose-600 dark:text-rose-400 font-semibold tabular-nums">
                        Line {issue.line} · Column {issue.column}
                      </div>
                      <h3 className="text-base font-semibold text-slate-900 dark:text-white mt-0.5">
                        {issue.title}
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={() => onApplyFix(issue)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      Apply Fix
                    </button>
                  </div>

                  {/* Incorrect Line */}
                  <div className="rounded-lg border border-rose-200 dark:border-rose-500/30 bg-rose-50/70 dark:bg-[#0B0F17] p-2.5">
                    <div className="text-[11px] font-semibold text-rose-700 dark:text-rose-400 mb-0.5">
                      Incorrect Code Line
                    </div>
                    <pre className="font-mono text-xs text-slate-900 dark:text-slate-200 overflow-x-auto">
                      {issue.lineContent || '(empty line)'}
                    </pre>
                  </div>

                  {/* Reason in simple English */}
                  <div>
                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      What went wrong
                    </div>
                    <p className="text-sm text-slate-800 dark:text-slate-200 mt-0.5">{issue.reason}</p>
                  </div>

                  {/* Corrected Code Example */}
                  <div className="rounded-lg border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/70 dark:bg-[#0B0F17] p-2.5">
                    <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 mb-0.5">
                      How to Fix It
                    </div>
                    <pre className="font-mono text-xs text-emerald-900 dark:text-emerald-300 overflow-x-auto">
                      {issue.correctedLine}
                    </pre>
                  </div>

                  {/* Explanation */}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800/70">
                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Why Python needs this
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                      {issue.explanation}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
