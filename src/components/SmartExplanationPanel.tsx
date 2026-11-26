import { CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import type { ExecutionStep, PythonAnalysisResult } from '../engine/pythonAnalyzer';

interface SmartExplanationPanelProps {
  analysis: PythonAnalysisResult;
  activeStep: ExecutionStep | null;
  isStepping: boolean;
  onInspectSyntax: () => void;
}

export function SmartExplanationPanel({
  analysis,
  activeStep,
  isStepping,
  onInspectSyntax,
}: SmartExplanationPanelProps) {
  const displayedOutput = isStepping
    ? (activeStep?.output ?? [])
    : analysis.finalOutput;

  const displayedVars = isStepping
    ? (activeStep?.variables ?? {})
    : (analysis.steps[analysis.steps.length - 1]?.variables ?? {});

  return (
    <div className="flex flex-col gap-4">
      {/* 1. Syntax Analysis Summary */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800/80">
        <div>
          <div className="text-xs text-slate-500 dark:text-slate-400">Syntax Check</div>
          <div className="flex items-center gap-2 mt-0.5">
            {analysis.isValidSyntax ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                  Syntax Status: Valid
                </span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                <span className="text-sm font-semibold text-rose-700 dark:text-rose-400">
                  Syntax Status: Error Found ({analysis.syntaxIssues.length})
                </span>
              </>
            )}
          </div>
        </div>

        {!analysis.isValidSyntax && (
          <button
            type="button"
            onClick={onInspectSyntax}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-rose-300 dark:border-rose-500/40 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Fix Syntax
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Active Simulation Step Callout (when stepping) */}
      {isStepping && activeStep && (
        <div className="rounded-xl border border-emerald-300 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-500/10 p-3">
          <div className="flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300 font-semibold tabular-nums">
            <span>Running Line {activeStep.line}</span>
            <span>Step {activeStep.stepIndex + 1}</span>
          </div>
          <p className="text-sm text-slate-800 dark:text-slate-100 mt-1">{activeStep.description}</p>
          {activeStep.conditionEvaluated && (
            <div className="mt-1 font-mono text-xs text-slate-700 dark:text-slate-300">
              Question: {activeStep.conditionEvaluated} →{' '}
              <span
                className={
                  activeStep.conditionResult
                    ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                    : 'text-rose-700 dark:text-rose-400 font-semibold'
                }
              >
                {activeStep.conditionResult ? 'True' : 'False'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* 2. Execution Result & Variables */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-[#F8FAFC] dark:bg-[#0B0F17] p-3">
          <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
            Output Screen
          </div>
          {!analysis.isValidSyntax ? (
            <p className="text-xs text-rose-600 dark:text-rose-400">
              Fix the syntax issue first to see the output.
            </p>
          ) : analysis.runtimeNotice ? (
            <p className="text-xs text-amber-700 dark:text-amber-400">{analysis.runtimeNotice}</p>
          ) : displayedOutput.length === 0 ? (
            <p className="text-xs text-slate-500 font-mono">No print() output yet</p>
          ) : (
            <div className="font-mono text-xs font-medium text-emerald-700 dark:text-[#FFD43B] space-y-1 max-h-24 overflow-y-auto">
              {displayedOutput.map((line, i) => (
                <div key={i} className="break-words">
                  &gt; {line}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-[#F8FAFC] dark:bg-[#0B0F17] p-3">
          <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
            Memory Right Now (Variables)
          </div>
          {Object.keys(displayedVars).length === 0 ? (
            <p className="text-xs text-slate-500 font-mono">No variables stored yet</p>
          ) : (
            <div className="space-y-1 font-mono text-xs tabular-nums max-h-24 overflow-y-auto">
              {Object.entries(displayedVars).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-2">
                  <span className="text-emerald-700 dark:text-[#7CC4FF] font-medium truncate">{k}</span>
                  <span className="text-slate-800 dark:text-slate-200 truncate">{v}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. Detected Concepts */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-300">
            What Python Patterns Were Detected
          </h4>
          <span className="text-xs text-slate-500 tabular-nums">
            {analysis.conceptCategories.length} categories
          </span>
        </div>

        {analysis.detectedConcepts.length === 0 ? (
          <p className="text-xs text-slate-500">Type Python code to detect variables, conditions, loops, or print statements.</p>
        ) : (
          <div className="divide-y divide-slate-200/80 dark:divide-slate-800/60 border border-slate-200 dark:border-slate-800/80 rounded-xl bg-[#F8FAFC] dark:bg-[#0B0F17] max-h-40 overflow-y-auto">
            {analysis.detectedConcepts.slice(0, 12).map((item, idx) => (
              <div key={`${item.line}-${item.token}-${idx}`} className="px-3.5 py-2 flex flex-col gap-0.5">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {item.category} <span className="text-slate-400">·</span>{' '}
                    <code className="font-mono text-emerald-700 dark:text-[#FFD43B]">{item.token}</code>
                  </span>
                  <span className="text-slate-500 tabular-nums whitespace-nowrap shrink-0">Line {item.line}</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">{item.summary}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Logic Explanation */}
      <div>
        <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-300 mb-1.5">
          Step-by-Step Plain-English Guide
        </h4>
        <ol className="space-y-1 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
          {analysis.logicExplanation.map((line, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="font-mono text-emerald-600 dark:text-slate-500 font-semibold tabular-nums shrink-0">
                {idx + 1}.
              </span>
              <span>{line}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
