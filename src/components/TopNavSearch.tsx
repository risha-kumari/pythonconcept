import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  ExternalLink,
  Globe,
  Loader2,
  Search,
  X,
} from 'lucide-react';
import {
  buildSearchCandidates,
  isSafeWebUrl,
  normalizeSearchQuery,
  QUICK_PAGE_LINKS,
  searchAppItems,
  SUGGESTED_SEARCHES,
  type SearchActions,
  type SearchCategory,
} from '../data/searchIndex';
import { SearchEmptyState } from './SearchEmptyState';

interface TopNavSearchProps extends SearchActions {}

interface WebGroundingResult {
  query: string;
  answer: string;
  sources: { title: string; uri: string }[];
  model?: string;
}

export function TopNavSearch({
  onNavigate,
  onLoadCodeInDetector,
  onOpenLesson,
  onOpenSyntaxCode,
  onOpenDetectorTab,
  onOpenCodeBuddy,
  onOpenLiveRoom,
}: TopNavSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState<SearchCategory>('all');
  const [activeIndex, setActiveIndex] = useState(0);
  const [webLoading, setWebLoading] = useState(false);
  const [webError, setWebError] = useState<string | null>(null);
  const [webResult, setWebResult] = useState<WebGroundingResult | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const webAbortRef = useRef<AbortController | null>(null);

  const { trimmed, normalized } = normalizeSearchQuery(query);

  const candidates = useMemo(
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
    () => searchAppItems(query, candidates),
    [query, candidates],
  );

  const categoryCounts = useMemo(
    () => ({
      all: allMatches.length,
      page: allMatches.filter((m) => m.category === 'page').length,
      lesson: allMatches.filter((m) => m.category === 'lesson').length,
      example: allMatches.filter((m) => m.category === 'example').length,
      quiz: allMatches.filter((m) => m.category === 'quiz').length,
    }),
    [allMatches],
  );

  const filteredMatches = useMemo(() => {
    if (category === 'all') return allMatches;
    return allMatches.filter((m) => m.category === category);
  }, [allMatches, category]);

  const visibleResults = useMemo(
    () => filteredMatches.slice(0, 8),
    [filteredMatches],
  );

  useEffect(() => {
    setActiveIndex(0);
  }, [normalized, category]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, []);

  // Global '/' shortcut to focus top navigation search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }
      e.preventDefault();
      inputRef.current?.focus();
      setIsOpen(true);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const closeAndClear = () => {
    webAbortRef.current?.abort();
    setQuery('');
    setCategory('all');
    setIsOpen(false);
    setWebLoading(false);
    setWebError(null);
    setWebResult(null);
  };

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
    setIsOpen(true);
    setWebError(null);
    if (
      webResult &&
      next.trim().replace(/\s+/g, ' ').toLowerCase() !== webResult.query.toLowerCase()
    ) {
      setWebResult(null);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
      return;
    }

    if (e.key === 'ArrowDown' && visibleResults.length > 0) {
      e.preventDefault();
      setIsOpen(true);
      setActiveIndex((prev) => (prev + 1) % visibleResults.length);
      return;
    }

    if (e.key === 'ArrowUp' && visibleResults.length > 0) {
      e.preventDefault();
      setIsOpen(true);
      setActiveIndex((prev) => (prev - 1 + visibleResults.length) % visibleResults.length);
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (!normalized) {
        setIsOpen(true);
        return;
      }
      if (visibleResults.length > 0) {
        const chosen = visibleResults[activeIndex] ?? visibleResults[0];
        chosen.action();
        closeAndClear();
      } else if (allMatches.length > 0) {
        setCategory('all');
        allMatches[0].action();
        closeAndClear();
      } else {
        void runGoogleGroundingSearch(trimmed);
      }
    }
  };

  const showDropdown = isOpen;

  return (
    <div ref={containerRef} className="relative flex-1 sm:flex-initial max-w-[230px] sm:w-56 xl:w-52 2xl:w-64 min-w-0">
      <div className="relative flex items-center">
        <Search className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 absolute left-2.5 pointer-events-none" />
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls="top-nav-search-results"
          aria-label="Search pages and features"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => handleQueryChange(e.target.value)}
          onKeyDown={handleInputKeyDown}
          placeholder="Search pages, features..."
          className="w-full h-9 bg-[#F8FAFC] dark:bg-[#111827] border border-slate-200 dark:border-slate-700/80 focus:border-emerald-600 dark:focus:border-emerald-400 rounded-lg pl-8 pr-11 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none transition-colors"
        />
        {query ? (
          <button
            type="button"
            onClick={closeAndClear}
            aria-label="Clear top search"
            className="absolute right-1.5 p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <kbd
            aria-hidden="true"
            className="hidden sm:inline-flex items-center justify-center absolute right-2 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-[#0B0F17] pointer-events-none"
          >
            /
          </kbd>
        )}
      </div>

      {showDropdown && (
        <div
          id="top-nav-search-results"
          role="region"
          aria-label="Top navigation search results"
          className="fixed left-3 right-3 top-[66px] md:absolute md:left-auto md:right-0 md:top-full md:mt-2 md:w-[460px] z-50 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-lg overflow-hidden"
        >
          {!normalized ? (
            /* Initial Quick-Jump View When Input Is Focused & Empty */
            <div className="p-3.5 space-y-3">
              <div className="space-y-1.5">
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Quick page links
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {QUICK_PAGE_LINKS.map((item) => (
                    <button
                      key={item.route}
                      type="button"
                      onClick={() => {
                        onNavigate(item.route);
                        closeAndClear();
                      }}
                      className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-[#F8FAFC] dark:bg-[#0B0F17] hover:border-emerald-500 text-left transition-colors cursor-pointer"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                          {item.label}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {item.snippet}
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Popular feature searches
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTED_SEARCHES.slice(0, 6).map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => handleQueryChange(term)}
                      className="px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0F1522] text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Category Filter Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-slate-100 dark:border-slate-800 bg-[#F8FAFC] dark:bg-[#0B0F17]">
                <div className="flex flex-wrap items-center gap-1">
                  {(
                    [
                      { id: 'all', label: `All (${categoryCounts.all})` },
                      { id: 'page', label: `Pages & Features (${categoryCounts.page})` },
                      { id: 'lesson', label: `Lessons (${categoryCounts.lesson})` },
                      { id: 'example', label: `Examples (${categoryCounts.example})` },
                      { id: 'quiz', label: `Quiz (${categoryCounts.quiz})` },
                    ] as { id: SearchCategory; label: string }[]
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setCategory(tab.id)}
                      className={`px-2 py-1 text-[11px] font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        category === tab.id
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums shrink-0">
                  {filteredMatches.length} {filteredMatches.length === 1 ? 'match' : 'matches'}
                </span>
              </div>

              {/* Relevant Page Links & Feature Snippets OR Empty State */}
              {visibleResults.length > 0 ? (
                <div className="divide-y divide-slate-100 dark:divide-slate-800/70 max-h-80 overflow-y-auto">
                  {visibleResults.map((item, idx) => {
                    const isHighlighted = idx === activeIndex;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onMouseEnter={() => setActiveIndex(idx)}
                        onClick={() => {
                          item.action();
                          closeAndClear();
                        }}
                        className={`w-full px-4 py-2.5 text-left flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                          isHighlighted
                            ? 'bg-emerald-50/80 dark:bg-slate-800/70'
                            : 'hover:bg-emerald-50/60 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-white">
                            <span className="font-mono text-[11px] text-emerald-700 dark:text-[#7CC4FF] shrink-0">
                              {item.kind}
                            </span>
                            <span aria-hidden="true" className="text-slate-300 dark:text-slate-600 shrink-0">
                              ·
                            </span>
                            <span className="truncate">{item.title}</span>
                            <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400 shrink-0">
                              ({item.routeLabel})
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-0.5">
                            {item.subtitle}
                          </p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      </button>
                    );
                  })}
                </div>
              ) : allMatches.length > 0 ? (
                <div className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300 flex flex-wrap items-center justify-between gap-2">
                  <span>
                    0 matches inside this tab, but{' '}
                    <strong className="tabular-nums">{allMatches.length}</strong>{' '}
                    {allMatches.length === 1 ? 'match exists' : 'matches exist'} overall.
                  </span>
                  <button
                    type="button"
                    onClick={() => setCategory('all')}
                    className="px-2.5 py-1 rounded-md bg-emerald-600 text-white text-[11px] font-semibold cursor-pointer"
                  >
                    Show all {allMatches.length}
                  </button>
                </div>
              ) : (
                <SearchEmptyState
                  query={trimmed}
                  compact
                  webLoading={webLoading}
                  onSelectSuggestion={(term) => {
                    setCategory('all');
                    handleQueryChange(term);
                  }}
                  onQuickNavigate={(route) => {
                    onNavigate(route);
                    closeAndClear();
                  }}
                  onSearchGoogle={(searchTerm) => void runGoogleGroundingSearch(searchTerm)}
                />
              )}

              {/* Live Google Search Grounding Result */}
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
                      Searching Google for &ldquo;{trimmed}&rdquo;...
                    </div>
                  )}

                  {webError && (
                    <div className="text-xs text-rose-700 dark:text-rose-400">{webError}</div>
                  )}

                  {webResult && (
                    <div className="space-y-2">
                      <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap max-h-36 overflow-y-auto">
                        {webResult.answer}
                      </p>
                      {webResult.sources.length > 0 && (
                        <div className="pt-1.5 border-t border-sky-200/70 dark:border-sky-500/20">
                          <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Sources
                          </div>
                          <div className="flex flex-wrap gap-x-3 gap-y-1">
                            {webResult.sources.slice(0, 4).map((src) => (
                              <a
                                key={src.uri}
                                href={src.uri}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] text-sky-700 dark:text-sky-300 hover:underline max-w-[200px]"
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
            </>
          )}
        </div>
      )}
    </div>
  );
}
