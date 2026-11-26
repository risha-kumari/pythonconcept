import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Play,
  CheckCircle2,
  AlertTriangle,
  Search,
  X,
  Globe,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { analyzePythonCode } from '../engine/pythonAnalyzer';
import {
  buildSearchCandidates,
  isSafeWebUrl,
  normalizeSearchQuery,
  searchAppItems,
  type AppRoute,
  type DetectorTab,
  type SearchCategory,
} from '../data/searchIndex';
import { SearchEmptyState } from './SearchEmptyState';
import { replaceNumericVarInCode } from './ExecutionGraphsPanel';

export type { AppRoute, DetectorTab };

interface HomeViewProps {
  onNavigate: (route: AppRoute) => void;
  onLoadCodeInDetector: (code: string) => void;
  onOpenLesson: (lessonId: string) => void;
  onOpenSyntaxCode: (code: string) => void;
  onOpenDetectorTab?: (tab: DetectorTab) => void;
  onOpenCodeBuddy?: () => void;
  onOpenLiveRoom?: () => void;
}

interface WebGroundingResult {
  query: string;
  answer: string;
  sources: { title: string; uri: string }[];
  model?: string;
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
  onOpenDetectorTab,
  onOpenCodeBuddy,
  onOpenLiveRoom,
}: HomeViewProps) {
  const [previewCode, setPreviewCode] = useState(QUICK_SAMPLE);
  const [query, setQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState<SearchCategory>('all');
  const [webLoading, setWebLoading] = useState(false);
  const [webError, setWebError] = useState<string | null>(null);
  const [webResult, setWebResult] = useState<WebGroundingResult | null>(null);
  const webAbortRef = useRef<AbortController | null>(null);

  const analysis = analyzePythonCode(previewCode);

  const previewVarMatch = previewCode.match(/^([A-Za-z_]\w*)\s*=\s*(-?\d+)/m);
  const previewVarName = previewVarMatch?.[1] ?? null;
  const previewVarValue = previewVarMatch ? Number(previewVarMatch[2]) : null;

  const { trimmed: trimmedQuery, normalized: normalizedQuery } = normalizeSearchQuery(query);

  const searchCandidates = useMemo(
    () =>
      buildSearchCandidates({
        onNavigate,
        onLoadCodeInDetector,
        onOpenLesson,
        onOpenSyntaxCode,
        onOpenDetectorTab,
        onOpenCodeBuddy,
        onOpenLiveRoom,
      }),
    [
      onNavigate,
      onLoadCodeInDetector,
      onOpenLesson,
      onOpenSyntaxCode,
      onOpenDetectorTab,
      onOpenCodeBuddy,
      onOpenLiveRoom,
    ],
  );

  const allMatches = useMemo(
    () => searchAppItems(query, searchCandidates),
    [query, searchCandidates],
  );

  const categoryCounts = useMemo(() => {
    return {
      all: allMatches.length,
      page: allMatches.filter((m) => m.category === 'page').length,
      lesson: allMatches.filter((m) => m.category === 'lesson').length,
      example: allMatches.filter((m) => m.category === 'example').length,
      quiz: allMatches.filter((m) => m.category === 'quiz').length,
    };
  }, [allMatches]);

  const filteredMatches = useMemo(() => {
    if (searchCategory === 'all') return allMatches;
    return allMatches.filter((m) => m.category === searchCategory);
  }, [allMatches, searchCategory]);

  const visibleResults = filteredMatches.slice(0, 10);

  const runGoogleGroundingSearch = async (searchTerm: string) => {
    const clean = searchTerm.trim().replace(/\s+/g, ' ');
    if (!clean) return;
    webAbortRef.current?.abort();
    const controller = new AbortController();
    webAbortRef.current = controller;

    setWebLoading(true);
    setWebError(null);
    setWebResult(null);

    try {
      const res = await fetch('/api/search/grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({ query: clean }),
      });
      const data = (await res.json().catch(() => ({}))) as Partial<WebGroundingResult> & {
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error || 'Could not fetch Google Search results.');
      }
      setWebResult({
        query: data.query ?? clean,
        answer: data.answer ?? '',
        sources: Array.isArray(data.sources) ? data.sources.filter((s) => isSafeWebUrl(s.uri)) : [],
        model: data.model,
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setWebError(err instanceof Error ? err.message : 'Unable to reach Google Search grounding.');
    } finally {
      setWebLoading(false);
    }
  };

  const handleQueryChange = (next: string) => {
    setQuery(next);
    setWebError(null);
    if (webResult && next.trim().replace(/\s+/g, ' ').toLowerCase() !== webResult.query.toLowerCase()) {
      setWebResult(null);
    }
  };

  const handleClearSearch = () => {
    webAbortRef.current?.abort();
    setQuery('');
    setSearchCategory('all');
    setWebLoading(false);
    setWebError(null);
    setWebResult(null);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!normalizedQuery) return;
    if (visibleResults.length > 0) {
      visibleResults[0].action();
      handleClearSearch();
    } else if (allMatches.length > 0) {
      // Never hide matches because of a category filter
      setSearchCategory('all');
      allMatches[0].action();
      handleClearSearch();
    } else {
      void runGoogleGroundingSearch(trimmedQuery);
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
      {/* Home Search Bar + Live Google Search Grounding */}
      <section className="relative max-w-2xl mb-5">
        <form onSubmit={handleSearchSubmit} className="relative flex items-center gap-2 max-w-md">
          <div className="relative flex-1 flex items-center">
            <Search className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 absolute left-3 pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              aria-label="Search Python topics, pages, features, or Google Search"
              placeholder="Search Python topics, gates, test, errors..."
              className="w-full bg-white/95 dark:bg-[#111827]/95 border border-slate-200/90 dark:border-slate-800/90 focus:border-emerald-600 dark:focus:border-emerald-400 rounded-lg pl-8 pr-8 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 shadow-xs focus:outline-none transition-colors"
            />
            {query && (
              <button
                type="button"
                onClick={handleClearSearch}
                aria-label="Clear search"
                className="absolute right-2 p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {normalizedQuery !== '' && (
            <button
              type="button"
              onClick={() => void runGoogleGroundingSearch(trimmedQuery)}
              disabled={webLoading}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-sky-300 dark:border-sky-500/40 bg-sky-50 dark:bg-sky-500/15 text-sky-800 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-500/25 text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
            >
              {webLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Globe className="w-3.5 h-3.5" />
              )}
              Google Search
            </button>
          )}
        </form>

        {normalizedQuery !== '' && (
          <div className="mt-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] overflow-hidden shadow-md">
            {/* Category Filter Strip with Counts (Prevents Hidden Results) */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-slate-100 dark:border-slate-800 bg-[#F8FAFC] dark:bg-[#0B0F17]">
              <div className="flex flex-wrap items-center gap-1">
                {(
                  [
                    { id: 'all', label: `All (${categoryCounts.all})` },
                    { id: 'page', label: `Pages & Features (${categoryCounts.page})` },
                    { id: 'lesson', label: `Lessons (${categoryCounts.lesson})` },
                    { id: 'example', label: `Examples (${categoryCounts.example})` },
                    { id: 'quiz', label: `Quiz & Test (${categoryCounts.quiz})` },
                  ] as { id: SearchCategory; label: string }[]
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSearchCategory(tab.id)}
                    className={`px-2 py-1 text-[11px] font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      searchCategory === tab.id
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                {filteredMatches.length} {filteredMatches.length === 1 ? 'result' : 'results'}
              </span>
            </div>

            {/* Matching Results / Filter Safeguard / Useful Empty State */}
            {visibleResults.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/70 max-h-80 overflow-y-auto">
                {visibleResults.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      item.action();
                      handleClearSearch();
                    }}
                    className="w-full px-4 py-2.5 text-left flex items-center justify-between gap-4 hover:bg-emerald-50/70 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 text-sm font-medium text-slate-900 dark:text-white">
                        <span className="text-xs font-mono font-semibold text-emerald-700 dark:text-[#7CC4FF] shrink-0">
                          {item.kind}
                        </span>
                        <span className="text-slate-300 dark:text-slate-600 shrink-0">·</span>
                        <span className="truncate">{item.title}</span>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-normal shrink-0">
                          ({item.routeLabel})
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 truncate mt-0.5">
                        {item.subtitle}
                      </p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </button>
                ))}
              </div>
            ) : allMatches.length > 0 ? (
              <div className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300 flex flex-wrap items-center justify-between gap-2">
                <span>
                  0 matches inside this category filter, but{' '}
                  <strong className="tabular-nums">{allMatches.length}</strong>{' '}
                  {allMatches.length === 1 ? 'match exists' : 'matches exist'} across all sections.
                </span>
                <button
                  type="button"
                  onClick={() => setSearchCategory('all')}
                  className="px-2.5 py-1 rounded-md bg-emerald-600 text-white text-[11px] font-semibold cursor-pointer"
                >
                  Show all {allMatches.length} matches
                </button>
              </div>
            ) : (
              <SearchEmptyState
                query={trimmedQuery}
                webLoading={webLoading}
                onSelectSuggestion={(suggestion) => {
                  setSearchCategory('all');
                  handleQueryChange(suggestion);
                }}
                onQuickNavigate={(route) => {
                  onNavigate(route);
                  handleClearSearch();
                }}
                onSearchGoogle={(term) => void runGoogleGroundingSearch(term)}
              />
            )}

            {/* Google Search Grounding Answer & Sources Panel */}
            {(webLoading || webError || webResult) && (
              <div className="border-t border-sky-200 dark:border-sky-500/30 bg-sky-50/60 dark:bg-sky-950/20 px-4 py-3 space-y-2">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-sky-800 dark:text-sky-300">
                    <Globe className="w-3.5 h-3.5" />
                    Google Search Grounded Result
                  </span>
                  {webResult?.model && (
                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                      {webResult.model}
                    </span>
                  )}
                </div>

                {webLoading && (
                  <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 py-1">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-600" />
                    Searching the web for "{trimmedQuery}"...
                  </div>
                )}

                {webError && (
                  <div className="text-xs text-rose-700 dark:text-rose-400">{webError}</div>
                )}

                {webResult && (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                      {webResult.answer}
                    </p>
                    {webResult.sources.length > 0 && (
                      <div className="pt-1.5 border-t border-sky-200/70 dark:border-sky-500/20">
                        <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Sources
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-1">
                          {webResult.sources.slice(0, 5).map((src) => (
                            <a
                              key={src.uri}
                              href={src.uri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-sky-700 dark:text-sky-300 hover:underline max-w-[240px]"
                            >
                              <ExternalLink className="w-3 h-3 shrink-0" />
                              <span className="truncate">{src.title}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Footer action for on-demand Google Search Grounding */}
            {!webLoading && !webResult && (
              <div className="border-t border-slate-100 dark:border-slate-800 bg-[#F8FAFC] dark:bg-[#0B0F17] px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-slate-500 dark:text-slate-400">
                  Want up-to-date Python docs or web answers?
                </span>
                <button
                  type="button"
                  onClick={() => void runGoogleGroundingSearch(trimmedQuery)}
                  className="inline-flex items-center gap-1.5 text-sky-700 dark:text-sky-300 font-semibold hover:underline cursor-pointer"
                >
                  <Globe className="w-3.5 h-3.5" />
                  Search Google for "{trimmedQuery}"
                </button>
              </div>
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
                  max={Math.max(100, previewVarValue)}
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
