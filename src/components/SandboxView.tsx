import React, { useMemo, useState } from 'react';
import {
  Play,
  RotateCcw,
  Plus,
  ArrowRight,
  Bookmark,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Terminal,
} from 'lucide-react';
import { analyzePythonCode } from '../engine/pythonAnalyzer';
import { ExecutionGraphsPanel, replaceNumericVarInCode } from './ExecutionGraphsPanel';

interface SandboxViewProps {
  code: string;
  onChangeCode: (nextCode: string) => void;
  onOpenInDetector: (code: string) => void;
  onOpenInSyntax: (code: string) => void;
}

interface SavedSnippet {
  id: string;
  label: string;
  code: string;
}

const SANDBOX_TEMPLATES: { label: string; code: string }[] = [
  {
    label: 'Hello & Variables',
    code: `name = "Ada"
score = 95
print("Welcome,", name)
print("Score:", score)`,
  },
  {
    label: 'If / Elif / Else',
    code: `marks = 78

if marks >= 90:
    print("Grade: A")
elif marks >= 60:
    print("Grade: B")
else:
    print("Grade: C")`,
  },
  {
    label: 'For Loop',
    code: `total = 0
for n in range(1, 6):
    total += n
    print("Added", n, "-> total =", total)`,
  },
  {
    label: 'While Counter',
    code: `count = 3
while count > 0:
    print("Countdown:", count)
    count -= 1
print("Go!")`,
  },
  {
    label: 'Function',
    code: `def greet(user):
    return "Hello, " + user

message = greet("Python")
print(message)`,
  },
  {
    label: 'List & Dict',
    code: `languages = ["Python", "SQL"]
languages.append("HTML")
profile = {"track": "AI", "level": 1}
print(languages)
print("Track:", profile["track"])`,
  },
];

function inferTypeLabel(rawVal: string): string {
  if (rawVal === 'True' || rawVal === 'False') return 'bool';
  if (rawVal === 'None') return 'NoneType';
  if (rawVal.startsWith('"') || rawVal.startsWith("'")) return 'str';
  if (rawVal.startsWith('[')) return 'list';
  if (rawVal.startsWith('{')) return 'dict';
  if (/^-?\d+\.\d+$/.test(rawVal)) return 'float';
  if (/^-?\d+$/.test(rawVal)) return 'int';
  return 'value';
}

export function SandboxView({
  code,
  onChangeCode,
  onOpenInDetector,
  onOpenInSyntax,
}: SandboxViewProps) {
  const [sampleInput, setSampleInput] = useState('18, Ada');
  const [hasRun, setHasRun] = useState(true);
  const [runCount, setRunCount] = useState(1);
  const [savedSnippets, setSavedSnippets] = useState<SavedSnippet[]>([]);
  const [rightTab, setRightTab] = useState<'console' | 'graphs'>('console');
  const [selectedStep, setSelectedStep] = useState(0);

  const inputQueue = useMemo(
    () =>
      sampleInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    [sampleInput],
  );

  const analysis = useMemo(
    () => analyzePythonCode(code, inputQueue),
    [code, inputQueue],
  );

  const lines = code.split('\n');
  const errorLines = new Set(analysis.syntaxIssues.map((i) => i.line));
  const clampedStep = Math.min(selectedStep, Math.max(0, analysis.steps.length - 1));
  const activeStep = analysis.steps[clampedStep] ?? null;
  const displayedVars = activeStep?.variables ?? {};

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const updated = code.slice(0, start) + '    ' + code.slice(end);
      onChangeCode(updated);
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
        onChangeCode(updated);
        requestAnimationFrame(() => {
          el.selectionStart = el.selectionEnd = start + 1 + indent.length;
        });
      }
    }
  };

  const handleSaveSnapshot = () => {
    const firstNonEmpty =
      code
        .split('\n')
        .map((l) => l.trim())
        .find(Boolean) ?? 'Untitled snippet';
    const label = firstNonEmpty.slice(0, 26);
    setSavedSnippets((prev) => [
      { id: `snip_${Date.now()}`, label, code },
      ...prev.slice(0, 5),
    ]);
  };

  const handleRunSandbox = () => {
    setHasRun(true);
    setRunCount((c) => c + 1);
    setSelectedStep(Math.max(0, analysis.steps.length - 1));
  };

  const handleTryExample = () => {
    const idx = SANDBOX_TEMPLATES.findIndex((t) => t.code.trim() === code.trim());
    const next = SANDBOX_TEMPLATES[(idx + 1) % SANDBOX_TEMPLATES.length];
    onChangeCode(next.code);
    const nextAnalysis = analyzePythonCode(next.code, inputQueue);
    setHasRun(true);
    setRunCount((c) => c + 1);
    setSelectedStep(Math.max(0, nextAnalysis.steps.length - 1));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Python Interactive Sandbox
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Experiment freely with Python templates, scrub step-by-step execution graphs, and inspect live memory.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onOpenInSyntax(code)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700/80 bg-white dark:bg-transparent text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer"
          >
            Check Syntax
          </button>
          <button
            type="button"
            onClick={() => onOpenInDetector(code)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-emerald-300 dark:border-slate-700/80 bg-emerald-50 dark:bg-transparent text-emerald-700 dark:text-[#7CC4FF] hover:bg-emerald-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer"
          >
            Open in Logic Detector
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Template Quick-Load Strip */}
      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        <span className="text-xs font-medium text-slate-600 dark:text-slate-400 mr-1">
          Starter Templates:
        </span>
        {SANDBOX_TEMPLATES.map((tpl) => (
          <button
            key={tpl.label}
            type="button"
            onClick={() => {
              onChangeCode(tpl.code);
              setHasRun(true);
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:border-emerald-400 dark:hover:border-slate-700 transition-colors whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-3 h-3 text-emerald-600 dark:text-[#FFD43B]" />
            {tpl.label}
          </button>
        ))}
      </div>

      {/* Split Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-4 items-start">
        {/* Left: Sticky Sandbox Editor */}
        <div className="lg:col-span-7 lg:sticky lg:top-20 rounded-xl border border-emerald-200/90 dark:border-slate-800/80 bg-white/95 dark:bg-[#111827]/95 overflow-hidden flex flex-col shadow-sm">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-emerald-100 dark:border-slate-800/80 bg-gradient-to-r from-emerald-50/90 via-sky-50/70 to-indigo-50/70 dark:from-[#0F1522] dark:to-[#131B2E]">
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Sandbox Workspace
            </span>
            <div className="flex items-center gap-2">
              {analysis.isValidSyntax ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Valid
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {analysis.syntaxIssues.length} Issue{analysis.syntaxIssues.length === 1 ? '' : 's'}
                </span>
              )}
            </div>
          </div>

          <div className="flex min-h-[240px] max-h-[340px] bg-[#F8FAFC] dark:bg-[#0B0F17] font-mono text-[13.5px] leading-6">
            <div
              aria-hidden="true"
              className="w-10 shrink-0 py-3 text-right pr-2.5 select-none bg-[#F0FDF4] dark:bg-[#0B0F17] border-r border-emerald-100 dark:border-slate-800/60 tabular-nums"
            >
              {lines.map((_, idx) => {
                const lineNum = idx + 1;
                const isErr = errorLines.has(lineNum);
                return (
                  <div
                    key={lineNum}
                    className={`h-6 ${
                      isErr
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
              onChange={(e) => {
                onChangeCode(e.target.value);
                setHasRun(true);
              }}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              aria-label="Python sandbox code editor"
              placeholder="Write Python code to test in the sandbox..."
              className="flex-1 min-h-[240px] resize-none bg-transparent px-3.5 py-3 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none leading-6 font-mono caret-emerald-600 dark:caret-[#FFD43B]"
            />
          </div>

          {analysis.usesInput && (
            <div className="flex items-center gap-3 px-4 py-2 border-t border-emerald-100 dark:border-slate-800/80 bg-emerald-50/40 dark:bg-[#0F1522]">
              <label htmlFor="sandbox-input" className="text-xs text-slate-700 dark:text-slate-300 whitespace-nowrap">
                input() values:
              </label>
              <input
                id="sandbox-input"
                type="text"
                value={sampleInput}
                onChange={(e) => setSampleInput(e.target.value)}
                className="flex-1 bg-white dark:bg-[#0B0F17] border border-slate-300 dark:border-slate-700/80 rounded-md px-2.5 py-1 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-400"
              />
            </div>
          )}

          {/* Action Footer */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-t border-emerald-100 dark:border-slate-800/80 bg-emerald-50/40 dark:bg-[#0F1522]">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleRunSandbox}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-[#FFD43B] dark:text-[#0B0F17] dark:hover:bg-[#FFE066] transition-colors whitespace-nowrap cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Run Sandbox
              </button>
              <button
                type="button"
                onClick={handleTryExample}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-emerald-300 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-500/25 transition-colors whitespace-nowrap cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Try Example
              </button>
              <button
                type="button"
                onClick={handleSaveSnapshot}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700/80 bg-white dark:bg-transparent text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer"
              >
                <Bookmark className="w-3.5 h-3.5" />
                Save Snapshot
              </button>
              <button
                type="button"
                onClick={() => {
                  onChangeCode('');
                  setHasRun(false);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700/80 bg-white dark:bg-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Clear
              </button>
            </div>

            <span className="text-xs text-slate-600 dark:text-slate-400 tabular-nums">
              {analysis.steps.length} step{analysis.steps.length === 1 ? '' : 's'} traced
            </span>
          </div>

          {/* Inline Console Output Strip */}
          <div className="px-4 py-2.5 border-t border-emerald-100 dark:border-slate-800/80 bg-[#F8FAFC] dark:bg-[#0B0F17]">
            <div className="flex items-center justify-between gap-2 text-[11px] mb-1.5">
              <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                <Terminal className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Live Output
              </span>
              {hasRun && analysis.isValidSyntax && !analysis.runtimeNotice && (
                <span key={runCount} className="text-emerald-700 dark:text-emerald-400 font-medium tabular-nums">
                  Ran · {analysis.finalOutput.length} output line{analysis.finalOutput.length === 1 ? '' : 's'}
                </span>
              )}
            </div>
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] px-3 py-2 font-mono text-xs min-h-[42px] max-h-28 overflow-y-auto leading-5">
              {!hasRun || code.trim() === '' ? (
                <span className="text-slate-500">Click Run Sandbox or Try Example to execute code.</span>
              ) : !analysis.isValidSyntax ? (
                <span className="text-rose-600 dark:text-rose-400">
                  Syntax Error on Line {analysis.syntaxIssues[0].line}: {analysis.syntaxIssues[0].reason}
                </span>
              ) : analysis.runtimeNotice ? (
                <span className="text-amber-700 dark:text-amber-400">{analysis.runtimeNotice}</span>
              ) : analysis.finalOutput.length === 0 ? (
                <span className="text-slate-500">Program finished across {analysis.steps.length} step(s) with no print() output.</span>
              ) : (
                analysis.finalOutput.map((outLine, i) => (
                  <div key={i} className="text-emerald-700 dark:text-[#FFD43B] font-medium break-words">
                    <span className="text-slate-400 dark:text-slate-500 mr-2">&gt;</span>
                    {outLine}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right: Interactive Graphs, Console Output, Variables */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-[#111827] border border-slate-200 dark:border-slate-800/80">
            <button
              type="button"
              onClick={() => setRightTab('graphs')}
              className={`py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                rightTab === 'graphs'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Interactive Graphs &amp; Sim
            </button>
            <button
              type="button"
              onClick={() => setRightTab('console')}
              className={`py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                rightTab === 'console'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Console &amp; Memory
            </button>
          </div>

          {rightTab === 'graphs' ? (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#111827] p-4 shadow-xs">
              <ExecutionGraphsPanel
                code={code}
                analysis={analysis}
                activeStepIndex={clampedStep}
                isStepping={true}
                onSelectStep={(idx) => setSelectedStep(idx)}
                onUpdateNumericVar={(varName, nextVal) =>
                  onChangeCode(replaceNumericVarInCode(code, varName, nextVal))
                }
              />
            </div>
          ) : (
            <>
              {/* Console Output */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#111827] overflow-hidden shadow-xs">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 dark:border-slate-800/80 bg-emerald-50/50 dark:bg-[#0F1522]">
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Console Output
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                    {hasRun ? `${analysis.finalOutput.length} line(s)` : 'Idle'}
                  </span>
                </div>

                <div className="p-4 bg-[#F8FAFC] dark:bg-[#0B0F17] min-h-[115px] font-mono text-xs leading-6">
                  {!hasRun || code.trim() === '' ? (
                    <span className="text-slate-500">Click Run Sandbox or type Python code to see output.</span>
                  ) : !analysis.isValidSyntax ? (
                    <div className="text-rose-600 dark:text-rose-400 space-y-1">
                      <div className="font-semibold">Syntax Error on Line {analysis.syntaxIssues[0].line}:</div>
                      <div>{analysis.syntaxIssues[0].reason}</div>
                    </div>
                  ) : analysis.runtimeNotice ? (
                    <span className="text-amber-700 dark:text-amber-400">{analysis.runtimeNotice}</span>
                  ) : analysis.finalOutput.length === 0 ? (
                    <span className="text-slate-500">Program finished with no print() output.</span>
                  ) : (
                    analysis.finalOutput.map((outLine, i) => (
                      <div key={i} className="text-emerald-700 dark:text-[#FFD43B] font-medium break-words">
                        <span className="text-slate-400 dark:text-slate-500 mr-2">&gt;</span>
                        {outLine}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Live Variables Table */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#111827] overflow-hidden shadow-xs">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 dark:border-slate-800/80 bg-emerald-50/50 dark:bg-[#0F1522]">
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Variables in Memory
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                    Step {clampedStep + 1} · {Object.keys(displayedVars).length} active
                  </span>
                </div>

                {Object.keys(displayedVars).length === 0 ? (
                  <div className="p-4 text-xs text-slate-500 font-mono">No variables assigned yet.</div>
                ) : (
                  <table className="w-full text-left font-mono text-xs tabular-nums">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800/80 text-slate-600 dark:text-slate-400 bg-[#F8FAFC] dark:bg-[#0D131F]">
                        <th className="py-2 px-4 font-semibold">Name</th>
                        <th className="py-2 px-4 font-semibold">Type</th>
                        <th className="py-2 px-4 font-semibold">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(displayedVars).map(([name, val]) => (
                        <tr key={name} className="border-b last:border-b-0 border-slate-100 dark:border-slate-800/50">
                          <td className="py-2 px-4 text-emerald-700 dark:text-[#7CC4FF] font-medium">{name}</td>
                          <td className="py-2 px-4 text-slate-500 dark:text-slate-400">{inferTypeLabel(val)}</td>
                          <td className="py-2 px-4 text-slate-900 dark:text-slate-100 break-all">{val}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}

          {/* Session Saved Snapshots */}
          {savedSnippets.length > 0 && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#111827] overflow-hidden shadow-xs">
              <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800/80 bg-emerald-50/50 dark:bg-[#0F1522] text-sm font-semibold text-slate-900 dark:text-slate-100">
                Saved Snapshots
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {savedSnippets.map((snip) => (
                  <div key={snip.id} className="px-4 py-2 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onChangeCode(snip.code);
                        setHasRun(true);
                      }}
                      className="text-xs font-mono text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-[#FFD43B] truncate text-left cursor-pointer"
                    >
                      {snip.label}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setSavedSnippets((prev) => prev.filter((item) => item.id !== snip.id))
                      }
                      aria-label="Remove snapshot"
                      className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
