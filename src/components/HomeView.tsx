import React, { useMemo, useState } from 'react';
import { ArrowRight, Play, CheckCircle2, AlertTriangle, Search, X } from 'lucide-react';
import { analyzePythonCode } from '../engine/pythonAnalyzer';
import { DETECTOR_PRESETS, LEARNING_LESSONS, SYNTAX_ERROR_PRESETS } from '../data/curriculum';
import { replaceNumericVarInCode } from './ExecutionGraphsPanel';

export type AppRoute = 'home' | 'steps' | 'sandbox' | 'detector' | 'syntax' | 'learning' | 'practice';

interface HomeViewProps {
  onNavigate: (route: AppRoute) => void;
  onLoadCodeInDetector: (code: string) => void;
  onOpenLesson: (lessonId: string) => void;
  onOpenSyntaxCode: (code: string) => void;
}

interface SearchResultItem {
  id: string;
  kind: string;
  title: string;
  subtitle: string;
  action: () => void;
}

const QUICK_SAMPLE = `age = 18

if age >= 18:
    print("Eligible")
else:
    print("Not Eligible")`;

export function HomeView({
  onNavigate,
  onLoadCodeInDetector,
  onOpenLesson,
  onOpenSyntaxCode,
}: HomeViewProps) {
  const [previewCode, setPreviewCode] = useState(QUICK_SAMPLE);
  const [query, setQuery] = useState('');
  const analysis = analyzePythonCode(previewCode);

  const previewVarMatch = previewCode.match(/^([A-Za-z_]\w*)\s*=\s*(-?\d+)/m);
  const previewVarName = previewVarMatch?.[1] ?? null;
  const previewVarValue = previewVarMatch ? Number(previewVarMatch[2]) : null;

  const searchResults = useMemo<SearchResultItem[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const results: SearchResultItem[] = [];

    const tools: { title: string; subtitle: string; route: AppRoute; keywords: string }[] = [
      {
        title: 'Logic Detector & Step Simulator',
        subtitle: 'Analyze Python code, step line-by-line, and animate condition flow',
        route: 'detector',
        keywords: 'logic detector simulator step condition flow boolean graphs',
      },
      {
        title: 'Python Interactive Sandbox',
        subtitle: 'Experiment freely with starter templates, console output, and variables',
        route: 'sandbox',
        keywords: 'sandbox playground console run test template',
      },
      {
        title: 'Syntax Checker',
        subtitle: 'Detect missing colons, indentation errors, brackets, and typos',
        route: 'syntax',
        keywords: 'syntax checker error colon indentation brackets quotes fix',
      },
      {
        title: 'Steps to Use',
        subtitle: 'Five-step guide for beginners getting started with the workspace',
        route: 'steps',
        keywords: 'steps guide how to start tutorial help',
      },
      {
        title: 'Practice Quiz',
        subtitle: 'Beginner Python quiz with live scoring and explanations',
        route: 'practice',
        keywords: 'practice quiz questions test score leaderboard',
      },
    ];

    for (const tool of tools) {
      if (
        tool.title.toLowerCase().includes(q) ||
        tool.subtitle.toLowerCase().includes(q) ||
        tool.keywords.includes(q)
      ) {
        results.push({
          id: `tool-${tool.route}`,
          kind: 'Tool',
          title: tool.title,
          subtitle: tool.subtitle,
          action: () => onNavigate(tool.route),
        });
      }
    }

    for (const lesson of LEARNING_LESSONS) {
      if (
        lesson.title.toLowerCase().includes(q) ||
        lesson.definition.toLowerCase().includes(q) ||
        lesson.exampleCode.toLowerCase().includes(q)
      ) {
        results.push({
          id: `lesson-${lesson.id}`,
          kind: `Lesson ${lesson.index}`,
          title: lesson.title,
          subtitle: lesson.definition,
          action: () => onOpenLesson(lesson.id),
        });
      }
    }

    for (const preset of DETECTOR_PRESETS) {
      if (
        preset.label.toLowerCase().includes(q) ||
        preset.code.toLowerCase().includes(q)
      ) {
        results.push({
          id: `preset-${preset.id}`,
          kind: 'Example',
          title: preset.label,
          subtitle: 'Load preset into Logic Detector & Step Simulator',
          action: () => onLoadCodeInDetector(preset.code),
        });
      }
    }

    for (const errPreset of SYNTAX_ERROR_PRESETS) {
      if (
        errPreset.label.toLowerCase().includes(q) ||
        errPreset.code.toLowerCase().includes(q)
      ) {
        results.push({
          id: `syntax-${errPreset.id}`,
          kind: 'Syntax Demo',
          title: errPreset.label,
          subtitle: 'Inspect and fix this mistake in Syntax Checker',
          action: () => onOpenSyntaxCode(errPreset.code),
        });
      }
    }

    return results.slice(0, 7);
  }, [query, onNavigate, onOpenLesson, onLoadCodeInDetector, onOpenSyntaxCode]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchResults.length > 0) {
      searchResults[0].action();
      setQuery('');
    }
  };

  const capabilities: {
    index: string;
    title: string;
    summary: string;
    route: AppRoute;
    cardClass: string;
    indexClass: string;
    titleHoverClass: string;
    linkClass: string;
  }[] = [
    {
      index: '01.',
      title: 'Logic Detector',
      summary: 'Spots variables, conditions, operators, loops, and functions in plain English.',
      route: 'detector',
      cardClass:
        'border-emerald-200/90 dark:border-emerald-500/30 bg-emerald-50/85 dark:bg-emerald-950/35 hover:bg-emerald-100/75 dark:hover:bg-emerald-950/55 hover:border-emerald-400',
      indexClass: 'text-emerald-700 dark:text-emerald-400',
      titleHoverClass: 'group-hover:text-emerald-800 dark:group-hover:text-emerald-300',
      linkClass: 'text-emerald-700 dark:text-emerald-300',
    },
    {
      index: '02.',
      title: 'Syntax Checker',
      summary: 'Finds missing colons, indentation issues, quotes, and typos with one-click fixes.',
      route: 'syntax',
      cardClass:
        'border-amber-200/90 dark:border-amber-500/30 bg-amber-50/85 dark:bg-amber-950/30 hover:bg-amber-100/75 dark:hover:bg-amber-950/50 hover:border-amber-400',
      indexClass: 'text-amber-700 dark:text-amber-400',
      titleHoverClass: 'group-hover:text-amber-800 dark:group-hover:text-amber-300',
      linkClass: 'text-amber-700 dark:text-amber-300',
    },
    {
      index: '03.',
      title: 'Interactive Lessons',
      summary: 'Learn 10 Python basics with live sliders, visual demos, and quick checks.',
      route: 'learning',
      cardClass:
        'border-sky-200/90 dark:border-sky-500/30 bg-sky-50/85 dark:bg-sky-950/35 hover:bg-sky-100/75 dark:hover:bg-sky-950/55 hover:border-sky-400',
      indexClass: 'text-sky-700 dark:text-sky-400',
      titleHoverClass: 'group-hover:text-sky-800 dark:group-hover:text-sky-300',
      linkClass: 'text-sky-700 dark:text-sky-300',
    },
    {
      index: '04.',
      title: 'Practice & Live Room',
      summary: 'Take beginner quizzes, collaborate in real time, and climb the leaderboard.',
      route: 'practice',
      cardClass:
        'border-rose-200/90 dark:border-rose-500/30 bg-rose-50/85 dark:bg-rose-950/30 hover:bg-rose-100/75 dark:hover:bg-rose-950/50 hover:border-rose-400',
      indexClass: 'text-rose-700 dark:text-rose-400',
      titleHoverClass: 'group-hover:text-rose-800 dark:group-hover:text-rose-300',
      linkClass: 'text-rose-700 dark:text-rose-300',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Home Search Bar */}
      <section className="relative max-w-sm mb-5">
        <form onSubmit={handleSearchSubmit} className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 absolute left-3 pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search Python topics, examples, or tools"
            placeholder="Search topics, errors, examples..."
            className="w-full bg-white/95 dark:bg-[#111827]/95 border border-slate-200/90 dark:border-slate-800/90 focus:border-emerald-600 dark:focus:border-emerald-400 rounded-lg pl-8 pr-8 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 shadow-xs focus:outline-none transition-colors"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute right-2 p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </form>

        {query.trim() !== '' && (
          <div className="mt-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] divide-y divide-slate-100 dark:divide-slate-800/70 overflow-hidden shadow-md">
            {searchResults.length === 0 ? (
              <div className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                No matches for "{query.trim()}". Try searching for variables, boolean, indentation, loops, or sandbox.
              </div>
            ) : (
              searchResults.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    item.action();
                    setQuery('');
                  }}
                  className="w-full px-4 py-2.5 text-left flex items-center justify-between gap-4 hover:bg-emerald-50/70 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-white">
                      <span className="text-xs font-mono font-semibold text-emerald-700 dark:text-[#7CC4FF] shrink-0">
                        {item.kind}
                      </span>
                      <span className="text-slate-300 dark:text-slate-600 shrink-0">·</span>
                      <span className="truncate">{item.title}</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 truncate mt-0.5">{item.subtitle}</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </button>
              ))
            )}
          </div>
        )}
      </section>

      {/* Hero Split */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
        <div className="lg:col-span-6 flex flex-col justify-center gap-4">
          <div className="text-xs font-semibold text-teal-700 dark:text-teal-300">
            Interactive Python Analyzer · Step-by-Step Visualizer
          </div>

          <h1
            className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-slate-900 dark:text-white leading-[1.12]"
            style={{ textWrap: 'balance' }}
          >
            Visualize Python’s Logic,{' '}
            <span className="bg-gradient-to-r from-emerald-600 via-sky-600 to-teal-500 dark:from-emerald-400 dark:via-sky-300 dark:to-amber-300 bg-clip-text text-transparent">
              Line by Line.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed max-w-xl">
            Write or paste Python code to spot logic patterns, fix syntax mistakes in plain English, animate True/False branches, and watch variable graphs update live.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => onNavigate('detector')}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 hover:from-emerald-700 hover:via-teal-700 hover:to-sky-700 text-white shadow-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Open Logic Detector
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => onNavigate('sandbox')}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-200 hover:text-sky-800 dark:hover:text-white bg-white/95 dark:bg-[#111827]/90 border border-slate-300 dark:border-slate-700 hover:border-sky-400 dark:hover:border-sky-500 rounded-lg shadow-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Open Sandbox
            </button>
          </div>
        </div>

        {/* Live Interactive Quick Sandbox */}
        <div className="lg:col-span-6 flex flex-col rounded-xl border border-emerald-200/90 dark:border-slate-800/80 bg-white/95 dark:bg-[#111827]/95 overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-emerald-100 dark:border-slate-800/80 bg-gradient-to-r from-emerald-50 via-sky-50 to-amber-50 dark:from-[#0F1522] dark:to-[#131B2E]">
            <span className="text-xs font-semibold text-slate-900 dark:text-slate-200">
              Quick Live Preview
            </span>
            <button
              type="button"
              onClick={() => onLoadCodeInDetector(previewCode)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-[#FFD43B] hover:underline cursor-pointer whitespace-nowrap"
            >
              <Play className="w-3 h-3 fill-current" />
              Simulate Step-by-Step
            </button>
          </div>

          <textarea
            value={previewCode}
            onChange={(e) => setPreviewCode(e.target.value)}
            spellCheck={false}
            aria-label="Quick Python preview editor"
            className="w-full flex-1 min-h-[128px] resize-none bg-[#F8FAFC] dark:bg-[#0B0F17] px-4 py-3 font-mono text-[13px] leading-6 text-slate-900 dark:text-slate-100 focus:outline-none caret-emerald-600 dark:caret-[#FFD43B]"
          />

          {/* Interactive Live Slider + Mini Concept Graph */}
          <div className="px-4 py-2.5 border-t border-emerald-100 dark:border-slate-800/80 bg-[#F0FDF4]/60 dark:bg-[#0D131F] flex flex-col gap-2">
            {previewVarName && previewVarValue !== null && (
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="home-preview-slider" className="text-slate-700 dark:text-slate-300 font-medium">
                    Drag to test <code className="font-mono text-emerald-700 dark:text-[#7CC4FF]">{previewVarName}</code>
                  </label>
                  <span className="font-mono font-semibold text-emerald-700 dark:text-[#FFD43B] tabular-nums">
                    {previewVarName} = {previewVarValue}
                  </span>
                </div>
                <input
                  id="home-preview-slider"
                  type="range"
                  min={0}
                  max={40}
                  value={previewVarValue}
                  onChange={(e) =>
                    setPreviewCode(replaceNumericVarInCode(previewCode, previewVarName, Number(e.target.value)))
                  }
                  className="w-full accent-emerald-600 dark:accent-[#FFD43B] cursor-pointer"
                />
              </div>
            )}

            {analysis.steps.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 shrink-0">Flow:</span>
                <div className="flex-1 flex items-center gap-1">
                  {analysis.steps.slice(0, 8).map((st) => {
                    const barColor =
                      st.conditionResult === true
                        ? 'bg-emerald-600'
                        : st.conditionResult === false
                          ? 'bg-rose-500'
                          : st.statementType === 'print'
                            ? 'bg-amber-500'
                            : 'bg-sky-500';
                    return (
                      <div
                        key={st.stepIndex}
                        title={`Line ${st.line}: ${st.description}`}
                        className={`h-2 flex-1 rounded-full ${barColor} transition-colors`}
                      />
                    );
                  })}
                </div>
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 tabular-nums shrink-0">
                  {analysis.steps.length} steps
                </span>
              </div>
            )}
          </div>

          <div className="px-4 py-2.5 border-t border-emerald-100 dark:border-slate-800/80 bg-white dark:bg-[#0F1522] flex flex-col gap-1">
            <div className="flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5">
                {analysis.isValidSyntax ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                      Syntax Valid
                    </span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                    <span className="text-rose-700 dark:text-rose-400 font-semibold">
                      {analysis.syntaxIssues[0]?.title ?? 'Syntax Error Found'}
                    </span>
                  </>
                )}
              </div>

              <span className="font-mono font-semibold text-emerald-700 dark:text-[#FFD43B] truncate max-w-[200px]">
                {analysis.finalOutput.length > 0
                  ? `Output: ${analysis.finalOutput.join(' | ')}`
                  : 'No output'}
              </span>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
              Detected: {analysis.conceptCategories.length > 0 ? analysis.conceptCategories.join(' · ') : 'None'}
            </div>
          </div>
        </div>
      </section>

      {/* Compact 4-Column Capability Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-7 border-t border-slate-200/80 dark:border-slate-800/80">
        {capabilities.map((cap) => (
          <button
            key={cap.route}
            type="button"
            onClick={() => onNavigate(cap.route)}
            className={`text-left group flex flex-col justify-between gap-2.5 p-4 rounded-xl border transition-colors cursor-pointer shadow-xs ${cap.cardClass}`}
          >
            <div>
              <div className={`font-mono text-xs font-semibold ${cap.indexClass}`}>
                {cap.index}
              </div>
              <h2 className={`text-base font-semibold text-slate-900 dark:text-white mt-0.5 transition-colors ${cap.titleHoverClass}`}>
                {cap.title}
              </h2>
              <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">
                {cap.summary}
              </p>
            </div>
            <span className={`inline-flex items-center gap-1 text-xs font-semibold ${cap.linkClass}`}>
              Open
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </button>
        ))}
      </section>
    </div>
  );
}
