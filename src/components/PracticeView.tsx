import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  Trophy,
  ArrowLeft,
  ArrowRight,
  Layers,
} from 'lucide-react';
import {
  PRACTICE_CATEGORIES,
  PRACTICE_QUIZ,
  type PracticeCategory,
} from '../data/curriculum';

interface PracticeViewProps {
  playerName: string;
  onSubmitScore: (score: number, total: number) => void;
  onOpenLeaderboard: () => void;
}

export function PracticeView({
  playerName,
  onSubmitScore,
  onOpenLeaderboard,
}: PracticeViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<'all' | PracticeCategory>('all');
  const [selectedSubTopic, setSelectedSubTopic] = useState<'all' | string>('all');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submittedToBoard, setSubmittedToBoard] = useState(false);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: PRACTICE_QUIZ.length };
    for (const cat of PRACTICE_CATEGORIES) {
      counts[cat.id] = PRACTICE_QUIZ.filter((q) => q.category === cat.id).length;
    }
    return counts;
  }, []);

  const categoryQuestions = useMemo(() => {
    if (selectedCategory === 'all') return PRACTICE_QUIZ;
    return PRACTICE_QUIZ.filter((q) => q.category === selectedCategory);
  }, [selectedCategory]);

  const availableSubTopics = useMemo(() => {
    const map = new Map<string, number>();
    for (const q of categoryQuestions) {
      map.set(q.subTopic, (map.get(q.subTopic) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
  }, [categoryQuestions]);

  const filteredQuestions = useMemo(() => {
    if (selectedSubTopic === 'all') return categoryQuestions;
    return categoryQuestions.filter((q) => q.subTopic === selectedSubTopic);
  }, [categoryQuestions, selectedSubTopic]);

  const total = filteredQuestions.length;
  const safeIdx = Math.min(currentIdx, Math.max(0, total - 1));
  const question = filteredQuestions[safeIdx];

  const selectedOption = question ? answers[question.id] : undefined;
  const hasAnsweredCurrent = selectedOption !== undefined;

  const answeredCount = filteredQuestions.filter((q) => answers[q.id] !== undefined).length;
  const correctCount = filteredQuestions.filter((q) => answers[q.id] === q.correctIndex).length;

  const overallAnsweredCount = PRACTICE_QUIZ.filter((q) => answers[q.id] !== undefined).length;
  const overallCorrectCount = PRACTICE_QUIZ.filter((q) => answers[q.id] === q.correctIndex).length;

  const isFilteredComplete = total > 0 && answeredCount === total;
  const isFinished = isFilteredComplete && safeIdx === total - 1 && hasAnsweredCurrent;

  const handleCategoryChange = (nextCategory: 'all' | PracticeCategory) => {
    setSelectedCategory(nextCategory);
    setSelectedSubTopic('all');
    setCurrentIdx(0);
  };

  const handleSubTopicChange = (nextSubTopic: 'all' | string) => {
    setSelectedSubTopic(nextSubTopic);
    setCurrentIdx(0);
  };

  const handleSelect = (optionIdx: number) => {
    if (!question || hasAnsweredCurrent) return;
    const nextAnswers = { ...answers, [question.id]: optionIdx };
    setAnswers(nextAnswers);

    const nextFilteredAnswered = filteredQuestions.filter(
      (q) => nextAnswers[q.id] !== undefined,
    ).length;
    if (nextFilteredAnswered === total) {
      const finalScore = filteredQuestions.filter(
        (q) => nextAnswers[q.id] === q.correctIndex,
      ).length;
      onSubmitScore(finalScore, total);
      setSubmittedToBoard(true);
    }
  };

  const handleReset = () => {
    setAnswers({});
    setCurrentIdx(0);
    setSubmittedToBoard(false);
  };

  const activeScopeLabel =
    selectedSubTopic !== 'all'
      ? selectedSubTopic
      : selectedCategory === 'all'
        ? 'Full Practice Quiz'
        : (PRACTICE_CATEGORIES.find((c) => c.id === selectedCategory)?.label ?? 'Topic Practice');

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      {/* Header & Session Progress */}
      <div className="flex flex-wrap items-end justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Python Practice Quiz
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Practice Logic Gates, Boolean Expressions, Syntax Errors, and Core Python organized by sub-topic.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-xs tabular-nums">
          <span className="text-slate-700 dark:text-slate-300 font-medium">
            Topic Score:{' '}
            <strong className="text-emerald-700 dark:text-[#FFD43B]">{correctCount}</strong> / {total}
          </span>
          <span aria-hidden="true" className="text-slate-400">·</span>
          <span className="text-slate-500 dark:text-slate-400">
            Overall: {overallCorrectCount} / {PRACTICE_QUIZ.length} ({overallAnsweredCount} answered)
          </span>
        </div>
      </div>

      {/* Topic & Sub-Topic Filter Controls */}
      <section className="mt-4 rounded-xl border border-slate-200/90 dark:border-slate-800/80 bg-white/90 dark:bg-[#111827]/90 p-3.5 space-y-3 shadow-xs">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
              <Layers className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Topics
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
              Showing {total} {total === 1 ? 'problem' : 'problems'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              aria-pressed={selectedCategory === 'all'}
              onClick={() => handleCategoryChange('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer border ${
                selectedCategory === 'all'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-[#F8FAFC] dark:bg-[#0B0F17] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-emerald-400'
              }`}
            >
              All Topics ({categoryCounts.all})
            </button>
            {PRACTICE_CATEGORIES.map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => handleCategoryChange(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer border ${
                    active
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-[#F8FAFC] dark:bg-[#0B0F17] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-emerald-400'
                  }`}
                >
                  {cat.label} ({categoryCounts[cat.id] ?? 0})
                </button>
              );
            })}
          </div>
        </div>

        {/* Sub-Topic Selector */}
        <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5">
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Sub-Topics
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              aria-pressed={selectedSubTopic === 'all'}
              onClick={() => handleSubTopicChange('all')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer border ${
                selectedSubTopic === 'all'
                  ? 'bg-sky-600 text-white border-sky-600'
                  : 'bg-white dark:bg-[#0F1522] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700/80 hover:border-sky-400'
              }`}
            >
              All Sub-Topics ({categoryQuestions.length})
            </button>
            {availableSubTopics.map((sub) => {
              const active = selectedSubTopic === sub.name;
              return (
                <button
                  key={sub.name}
                  type="button"
                  aria-pressed={active}
                  onClick={() => handleSubTopicChange(sub.name)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer border ${
                    active
                      ? 'bg-sky-600 text-white border-sky-600'
                      : 'bg-white dark:bg-[#0F1522] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700/80 hover:border-sky-400'
                  }`}
                >
                  {sub.name} ({sub.count})
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-slate-200/80 dark:bg-slate-800/80 rounded-full overflow-hidden mt-4">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 via-sky-500 to-rose-500 transition-all duration-300"
          style={{ width: `${total > 0 ? (answeredCount / total) * 100 : 0}%` }}
        />
      </div>

      {/* Question Card */}
      {question && (
        <div className="mt-4 rounded-xl border border-slate-200/90 dark:border-slate-800/80 bg-white/95 dark:bg-[#111827]/95 p-5 flex flex-col gap-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            <span>
              Question {safeIdx + 1} of {total} · {question.topic} · {question.subTopic}
            </span>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restart Quiz
            </button>
          </div>

          <h2 className="text-lg font-semibold text-slate-900 dark:text-white leading-snug">
            {question.question}
          </h2>

          {question.codeSnippet && (
            <pre className="rounded-lg border border-slate-200 dark:border-slate-800 bg-[#F8FAFC] dark:bg-[#0B0F17] p-3.5 font-mono text-xs sm:text-sm text-slate-900 dark:text-slate-100 leading-6 overflow-x-auto">
              {question.codeSnippet}
            </pre>
          )}

          <div className="flex flex-col gap-2">
            {question.options.map((opt, idx) => {
              const isChosen = selectedOption === idx;
              const isCorrectOpt = idx === question.correctIndex;
              let rowClass =
                'border-slate-200 dark:border-slate-800 bg-[#F8FAFC] dark:bg-[#0B0F17] text-slate-800 dark:text-slate-200 hover:border-emerald-400 dark:hover:border-slate-600 cursor-pointer';
              if (hasAnsweredCurrent) {
                if (isCorrectOpt) {
                  rowClass =
                    'border-emerald-400 bg-emerald-50 text-emerald-950 dark:border-emerald-500/60 dark:bg-emerald-500/10 dark:text-emerald-200 cursor-default';
                } else if (isChosen) {
                  rowClass =
                    'border-rose-400 bg-rose-50 text-rose-950 dark:border-rose-500/60 dark:bg-rose-500/10 dark:text-rose-200 cursor-default';
                } else {
                  rowClass =
                    'border-slate-200/70 dark:border-slate-800/60 bg-slate-50/60 dark:bg-[#0B0F17]/60 text-slate-400 dark:text-slate-500 cursor-default';
                }
              }

              return (
                <button
                  key={opt}
                  type="button"
                  disabled={hasAnsweredCurrent}
                  onClick={() => handleSelect(idx)}
                  className={`w-full px-4 py-2.5 rounded-lg border text-left text-sm font-medium flex items-center justify-between gap-3 transition-colors ${rowClass}`}
                >
                  <span>{opt}</span>
                  {hasAnsweredCurrent && isCorrectOpt && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  )}
                  {hasAnsweredCurrent && isChosen && !isCorrectOpt && (
                    <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {hasAnsweredCurrent && (
            <div
              className={`rounded-lg border p-3.5 text-sm leading-relaxed ${
                selectedOption === question.correctIndex
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200'
                  : 'border-rose-300 bg-rose-50 text-rose-950 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200'
              }`}
            >
              <div className="font-semibold mb-0.5">
                {selectedOption === question.correctIndex ? 'Correct Answer' : 'Incorrect Answer'}
              </div>
              <p className="text-xs">{question.explanation}</p>
            </div>
          )}

          {/* Navigation Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800/70">
            <div className="flex items-center gap-1.5 flex-wrap">
              {filteredQuestions.map((q, idx) => {
                const ans = answers[q.id];
                const isCurr = idx === safeIdx;
                let dotClass = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400';
                if (ans !== undefined) {
                  dotClass =
                    ans === q.correctIndex
                      ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-400 dark:border-emerald-500/50'
                      : 'bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-400 dark:border-rose-500/50';
                } else if (isCurr) {
                  dotClass = 'bg-emerald-600 text-white';
                }
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentIdx(idx)}
                    aria-label={`Go to question ${idx + 1}: ${q.subTopic}`}
                    className={`w-7 h-7 rounded-md text-xs font-mono tabular-nums transition-colors cursor-pointer ${dotClass}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={safeIdx === 0}
                onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer disabled:cursor-default"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Prev
              </button>

              {safeIdx < total - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentIdx((i) => Math.min(total - 1, i + 1))}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-[#FFD43B] dark:text-[#0B0F17] dark:hover:bg-[#FFE066] transition-colors cursor-pointer whitespace-nowrap"
                >
                  Next Question
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : isFinished ? (
                <button
                  type="button"
                  onClick={onOpenLeaderboard}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Trophy className="w-3.5 h-3.5" />
                  View Live Leaderboard
                </button>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Session Completion Summary */}
      {isFilteredComplete && (
        <div className="mt-4 rounded-xl border border-emerald-300 dark:border-[#FFD43B]/40 bg-emerald-50/70 dark:bg-[#111827] p-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-slate-900 dark:text-white">
              {activeScopeLabel} Complete · {correctCount} / {total} (
              {Math.round((correctCount / total) * 100)}%)
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              {submittedToBoard
                ? `Score synced to the live leaderboard as ${playerName}.`
                : 'Ready to post your score to the live room leaderboard.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {selectedCategory !== 'all' && (
              <button
                type="button"
                onClick={() => handleCategoryChange('all')}
                className="px-3.5 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-transparent text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                All Topics
              </button>
            )}
            <button
              type="button"
              onClick={handleReset}
              className="px-3.5 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-transparent text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              Try Again
            </button>
            <button
              type="button"
              onClick={onOpenLeaderboard}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-[#FFD43B] dark:text-[#0B0F17] dark:hover:bg-[#FFE066] cursor-pointer"
            >
              Open Leaderboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
