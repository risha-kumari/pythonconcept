import { ArrowRight } from 'lucide-react';
import type { AppRoute } from './HomeView';

interface StepsToUseViewProps {
  onNavigate: (route: AppRoute) => void;
  onLoadSampleAndRun: () => void;
}

const GUIDE_STEPS: {
  step: string;
  title: string;
  description: string;
  tip: string;
  actionLabel: string;
  route: AppRoute;
}[] = [
  {
    step: '01',
    title: 'Write or Load Python Code',
    description:
      'Open the Logic Detector or Sandbox and type any beginner Python snippet, or pick a built-in example like Age Eligibility or For Loop.',
    tip: 'If your code uses input(), a simulated input box appears automatically below the editor.',
    actionLabel: 'Open Logic Detector',
    route: 'detector',
  },
  {
    step: '02',
    title: 'Verify Syntax & Fix Mistakes',
    description:
      'Switch to the Syntax Checker to catch missing colons, indentation errors, unclosed quotes, mismatched brackets, or misspelled keywords.',
    tip: 'Click Apply Fix on any detected error to repair the line and read why Python requires it.',
    actionLabel: 'Open Syntax Checker',
    route: 'syntax',
  },
  {
    step: '03',
    title: 'Step Through Logic, Flow & Graphs',
    description:
      'Click Next Step to watch one line run at a time, inspect variable memory, animate the True/False condition branch, and scrub the Graphs timeline.',
    tip: 'Use the 0.5x, 1x, or 2x speed selector with Play/Pause to follow loops comfortably.',
    actionLabel: 'Try Step Simulator',
    route: 'detector',
  },
  {
    step: '04',
    title: 'Explore Boolean Gates & Lessons',
    description:
      'Open the Logic Gates simulator tab to flip A/B switches and watch current light the bulb, or visit Learning for 10 guided lessons.',
    tip: 'Every lesson ends with a quick check question and plain-English explanation.',
    actionLabel: 'Open Learning',
    route: 'learning',
  },
  {
    step: '05',
    title: 'Take the Practice Quiz & Collaborate',
    description:
      'Answer the 10-question beginner Python quiz in Practice and open Live Room to code together or compare scores on the live leaderboard.',
    tip: 'Share your room code with classmates to sync editor code in real time.',
    actionLabel: 'Start Practice Quiz',
    route: 'practice',
  },
];

export function StepsToUseView({ onNavigate, onLoadSampleAndRun }: StepsToUseViewProps) {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex flex-wrap items-end justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Steps to Use
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
            Follow these five quick steps to analyze Python code, spot syntax mistakes, animate conditions, and practice core concepts.
          </p>
        </div>

        <button
          type="button"
          onClick={onLoadSampleAndRun}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-[#FFD43B] dark:text-[#0B0F17] dark:hover:bg-[#FFE066] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          Try Sample Code Now
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="mt-5 divide-y divide-slate-200/80 dark:divide-slate-800/80 border border-slate-200/90 dark:border-slate-800/80 rounded-xl bg-white/95 dark:bg-[#111827]/95 overflow-hidden shadow-xs">
        {GUIDE_STEPS.map((item, idx) => {
          const stepColors = [
            'text-emerald-600 dark:text-emerald-400',
            'text-amber-600 dark:text-amber-400',
            'text-sky-600 dark:text-sky-400',
            'text-indigo-600 dark:text-indigo-400',
            'text-rose-600 dark:text-rose-400',
          ];
          const hoverBg = [
            'hover:bg-emerald-50/40 dark:hover:bg-emerald-950/15',
            'hover:bg-amber-50/40 dark:hover:bg-amber-950/15',
            'hover:bg-sky-50/40 dark:hover:bg-sky-950/15',
            'hover:bg-indigo-50/40 dark:hover:bg-indigo-950/15',
            'hover:bg-rose-50/40 dark:hover:bg-rose-950/15',
          ];
          return (
            <div
              key={item.step}
              className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${hoverBg[idx % hoverBg.length]}`}
            >
              <div className="flex items-start gap-3.5 max-w-2xl">
                <span className={`font-mono text-sm font-semibold tabular-nums pt-0.5 shrink-0 ${stepColors[idx % stepColors.length]}`}>
                  {item.step}.
                </span>
                <div>
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                    {item.title}
                  </h2>
                  <p className="text-sm text-slate-700 dark:text-slate-300 mt-0.5 leading-relaxed">
                    {item.description}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">Tip: {item.tip}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigate(item.route)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700/80 bg-white dark:bg-transparent text-slate-800 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-slate-800 hover:border-emerald-300 transition-colors whitespace-nowrap shrink-0 self-start sm:self-center cursor-pointer"
              >
                {item.actionLabel}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
