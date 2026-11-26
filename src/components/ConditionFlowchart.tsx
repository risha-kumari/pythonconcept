import { motion } from 'motion/react';
import { CheckCircle2, XCircle, GitBranch } from 'lucide-react';
import type { ConditionFlowModel, ExecutionStep } from '../engine/pythonAnalyzer';

interface ConditionFlowchartProps {
  flow: ConditionFlowModel;
  activeStep: ExecutionStep | null;
  steps: ExecutionStep[];
}

export function ConditionFlowchart({ flow, activeStep, steps }: ConditionFlowchartProps) {
  const searchBound = activeStep ? activeStep.stepIndex : steps.length - 1;
  let lastConditionStep: ExecutionStep | null = null;
  for (let i = Math.min(searchBound, steps.length - 1); i >= 0; i--) {
    if (steps[i]?.conditionResult !== null) {
      lastConditionStep = steps[i];
      break;
    }
  }

  const branchResult = lastConditionStep?.conditionResult ?? null;
  const isAtStart = activeStep?.flowNode === 'start';
  const isChecking = activeStep?.flowNode === 'check';
  const isOutputting = activeStep?.flowNode === 'output';

  const activeConditionText = lastConditionStep?.conditionExpr || flow.conditionExpr;
  const evaluatedText = lastConditionStep?.conditionEvaluated;
  const outputText =
    activeStep && activeStep.output.length > 0
      ? activeStep.output[activeStep.output.length - 1]
      : branchResult === true
        ? flow.trueLabel
        : branchResult === false
          ? flow.falseLabel
          : 'Waiting for decision';

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Condition Flow Animation
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Green path runs when the check is True · Red path runs when False.
          </p>
        </div>
        {branchResult !== null && (
          <div className="flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap shrink-0">
            {branchResult ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-700 dark:text-emerald-400">Path: True</span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <span className="text-rose-700 dark:text-rose-400">Path: False</span>
              </>
            )}
          </div>
        )}
      </div>

      {!flow.hasCondition && lastConditionStep === null ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-[#F8FAFC] dark:bg-[#0B0F17] p-6 text-center">
          <GitBranch className="w-6 h-6 text-emerald-600 dark:text-slate-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
            No condition found in this code yet
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Add an <code className="font-mono text-emerald-700 dark:text-[#FFD43B]">if</code>,{' '}
            <code className="font-mono text-emerald-700 dark:text-[#FFD43B]">elif</code>, or{' '}
            <code className="font-mono text-emerald-700 dark:text-[#FFD43B]">while</code> check to watch the decision path animate.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-emerald-200/80 dark:border-slate-800/80 bg-[#F0FDF4]/60 dark:bg-[#0B0F17] p-4 flex flex-col items-center">
          {/* Node 1: Start */}
          <motion.div
            animate={{ scale: isAtStart ? 1.03 : 1 }}
            transition={{ duration: 0.16 }}
            className={`w-48 py-2 px-4 rounded-lg border text-center bg-white dark:bg-[#111827] ${
              isAtStart
                ? 'border-emerald-600 dark:border-[#FFD43B]'
                : 'border-slate-200 dark:border-slate-700/80'
            }`}
          >
            <div className="text-[11px] text-slate-500 dark:text-slate-400">Step 1 · Start</div>
            <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
              Set Initial Values
            </div>
          </motion.div>

          {/* Animated Vertical Connector: Start -> Condition */}
          <svg width="24" height="24" viewBox="0 0 24 24" className="my-0.5">
            <line x1="12" y1="0" x2="12" y2="20" stroke="rgba(100,116,139,0.45)" strokeWidth="1.5" />
            <polygon points="8,17 16,17 12,23" fill="rgba(100,116,139,0.65)" />
            <motion.circle
              cx="12"
              r="3"
              fill="#059669"
              animate={{ cy: [3, 19, 3] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            />
          </svg>

          {/* Node 2: Check Condition */}
          <motion.div
            animate={{ scale: isChecking ? 1.02 : 1 }}
            transition={{ duration: 0.16 }}
            className={`w-full max-w-sm py-2.5 px-4 rounded-xl border bg-white dark:bg-[#111827] text-center ${
              isChecking
                ? 'border-emerald-600 dark:border-emerald-400'
                : branchResult === true
                  ? 'border-emerald-500 dark:border-emerald-500/60'
                  : branchResult === false
                    ? 'border-rose-400 dark:border-rose-500/60'
                    : 'border-slate-200 dark:border-slate-700'
            }`}
          >
            <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
              Step 2 · Check Question
            </div>
            <div className="font-mono text-sm font-semibold text-slate-900 dark:text-white mt-0.5 break-all">
              {activeConditionText}
            </div>
            {evaluatedText && (
              <div className="font-mono text-xs text-slate-600 dark:text-slate-400 mt-1">
                Checks: {evaluatedText} →{' '}
                <span
                  className={
                    branchResult
                      ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                      : 'text-rose-700 dark:text-rose-400 font-semibold'
                  }
                >
                  {branchResult ? 'True' : 'False'}
                </span>
              </div>
            )}
          </motion.div>

          {/* Animated SVG Fork Paths */}
          <svg viewBox="0 0 320 34" className="w-full max-w-md h-8 overflow-visible">
            <path
              d="M 160 0 L 160 14 L 80 14 L 80 31"
              fill="none"
              stroke={branchResult === true ? '#059669' : 'rgba(100,116,139,0.28)'}
              strokeWidth={branchResult === true ? 2.2 : 1.5}
            />
            {branchResult === true && (
              <motion.circle
                r="3.5"
                fill="#10B981"
                animate={{ cx: [160, 160, 80, 80], cy: [2, 14, 14, 29] }}
                transition={{ duration: 1.3, repeat: Infinity, ease: 'linear' }}
              />
            )}

            <path
              d="M 160 0 L 160 14 L 240 14 L 240 31"
              fill="none"
              stroke={branchResult === false ? '#E11D48' : 'rgba(100,116,139,0.28)'}
              strokeWidth={branchResult === false ? 2.2 : 1.5}
            />
            {branchResult === false && (
              <motion.circle
                r="3.5"
                fill="#F43F5E"
                animate={{ cx: [160, 160, 240, 240], cy: [2, 14, 14, 29] }}
                transition={{ duration: 1.3, repeat: Infinity, ease: 'linear' }}
              />
            )}
          </svg>

          {/* Branch Cards */}
          <div className="grid grid-cols-2 gap-3 w-full max-w-md">
            <motion.div
              animate={{
                opacity: branchResult === null ? 0.75 : branchResult === true ? 1 : 0.45,
                scale: branchResult === true ? 1.02 : 1,
              }}
              transition={{ duration: 0.18 }}
              className={`rounded-xl border p-3 flex flex-col gap-1 ${
                branchResult === true
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827]'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className={branchResult === true ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}>
                  If True
                </span>
                {branchResult === true && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                )}
              </div>
              <div className="font-mono text-xs text-slate-800 dark:text-slate-200 break-words">
                {flow.trueLabel}
              </div>
            </motion.div>

            <motion.div
              animate={{
                opacity: branchResult === null ? 0.75 : branchResult === false ? 1 : 0.45,
                scale: branchResult === false ? 1.02 : 1,
              }}
              transition={{ duration: 0.18 }}
              className={`rounded-xl border p-3 flex flex-col gap-1 ${
                branchResult === false
                  ? 'border-rose-400 bg-rose-50 dark:bg-rose-500/10'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827]'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className={branchResult === false ? 'text-rose-700 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}>
                  If False
                </span>
                {branchResult === false && (
                  <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                )}
              </div>
              <div className="font-mono text-xs text-slate-800 dark:text-slate-200 break-words">
                {flow.falseLabel}
              </div>
            </motion.div>
          </div>

          {/* Animated Merge SVG -> Output */}
          <svg viewBox="0 0 320 30" className="w-full max-w-md h-7 overflow-visible">
            <path
              d="M 80 0 L 80 14 L 160 14 L 160 27"
              fill="none"
              stroke={branchResult === true ? '#059669' : 'rgba(100,116,139,0.28)'}
              strokeWidth={branchResult === true ? 2 : 1.5}
            />
            <path
              d="M 240 0 L 240 14 L 160 14 L 160 27"
              fill="none"
              stroke={branchResult === false ? '#E11D48' : 'rgba(100,116,139,0.28)'}
              strokeWidth={branchResult === false ? 2 : 1.5}
            />
            <polygon points="156,24 164,24 160,30" fill="#059669" />
          </svg>

          {/* Node 4: Output */}
          <motion.div
            animate={{ scale: isOutputting ? 1.02 : 1 }}
            transition={{ duration: 0.16 }}
            className={`w-full max-w-sm py-2 px-4 rounded-lg border bg-white dark:bg-[#111827] text-center ${
              isOutputting
                ? 'border-emerald-600 dark:border-[#FFD43B]'
                : 'border-slate-200 dark:border-slate-700/80'
            }`}
          >
            <div className="text-[11px] text-slate-500 dark:text-slate-400">Step 3 · Final Result</div>
            <div className="font-mono text-sm font-semibold text-emerald-700 dark:text-[#FFD43B] mt-0.5 break-words">
              {outputText}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
