import { ArrowRight, Compass, Globe, Loader2, SearchX } from 'lucide-react';
import {
  QUICK_PAGE_LINKS,
  SUGGESTED_SEARCHES,
  type AppRoute,
} from '../data/searchIndex';

interface SearchEmptyStateProps {
  query: string;
  suggestions?: string[];
  onSelectSuggestion: (term: string) => void;
  onQuickNavigate?: (route: AppRoute) => void;
  onSearchGoogle?: (query: string) => void;
  webLoading?: boolean;
  compact?: boolean;
}

export function SearchEmptyState({
  query,
  suggestions = SUGGESTED_SEARCHES,
  onSelectSuggestion,
  onQuickNavigate,
  onSearchGoogle,
  webLoading = false,
  compact = false,
}: SearchEmptyStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={compact ? 'px-4 py-3.5 space-y-3' : 'px-4 py-4 space-y-3.5'}
    >
      <div className="flex items-start gap-2.5">
        <SearchX className="w-4 h-4 text-slate-400 dark:text-slate-500 mt-0.5 shrink-0" />
        <div className="min-w-0">
          <div className="text-xs font-semibold text-slate-900 dark:text-white">
            No matching pages or features for &ldquo;{query}&rdquo;
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Try one of these popular topics, jump straight to a tool below, or run a live Google Search.
          </p>
        </div>
      </div>

      {/* Clickable Suggested Queries */}
      <div className="space-y-1.5">
        <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
          Suggested searches
        </div>
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => onSelectSuggestion(suggestion)}
              className="px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-[#F8FAFC] dark:bg-[#0B0F17] text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {/* Direct Page Jumps */}
      {onQuickNavigate && (
        <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
            <Compass className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span>Explore main pages</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {QUICK_PAGE_LINKS.slice(0, compact ? 4 : 5).map((item) => (
              <button
                key={item.route}
                type="button"
                onClick={() => onQuickNavigate(item.route)}
                className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0F1522] hover:border-emerald-400 dark:hover:border-emerald-500/50 text-left transition-colors cursor-pointer"
              >
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {item.label}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {item.snippet}
                  </div>
                </div>
                <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Optional On-Demand Google Search */}
      {onSearchGoogle && (
        <div className="pt-1 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Need broader Python documentation?
          </span>
          <button
            type="button"
            onClick={() => onSearchGoogle(query)}
            disabled={webLoading}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-sky-300 dark:border-sky-500/40 bg-sky-50 dark:bg-sky-500/15 text-sky-800 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-500/25 text-[11px] font-semibold whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
          >
            {webLoading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Globe className="w-3 h-3" />
            )}
            Search Google
          </button>
        </div>
      )}
    </div>
  );
}
