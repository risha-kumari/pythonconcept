import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Bookmark,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  PanelRightClose,
  PanelRightOpen,
  RotateCcw,
  Shuffle,
  Trophy,
  XCircle,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import {
  TEST_QUESTIONS,
  type TestDifficulty,
  type TestQuestion,
} from '../data/curriculum';

interface TestViewProps {
  playerName: string;
  onSubmitScore: (score: number, total: number) => void;
  onOpenLeaderboard: () => void;
}

const DIFFICULTY_META: Record<
  TestDifficulty,
  {
    label: string;
    textClass: string;
    activeBtnClass: string;
    paletteBtnClass: string;
  }
> = {
  easy: {
    label: 'Easy',
    textClass: 'text-emerald-700 dark:text-emerald-400',
    activeBtnClass:
      'bg-emerald-600 text-white border-emerald-600 dark:bg-emerald-500 dark:text-[#0B0F17] dark:border-emerald-500',
    paletteBtnClass:
      'border-emerald-300 dark:border-emerald-500/40 hover:border-emerald-500',
  },
  medium: {
    label: 'Medium',
    textClass: 'text-amber-700 dark:text-amber-400',
    activeBtnClass:
      'bg-amber-600 text-white border-amber-600 dark:bg-amber-500 dark:text-[#0B0F17] dark:border-amber-500',
    paletteBtnClass:
      'border-amber-300 dark:border-amber-500/40 hover:border-amber-500',
  },
  hard: {
    label: 'Hard',
    textClass: 'text-rose-700 dark:text-rose-400',
    activeBtnClass:
      'bg-rose-600 text-white border-rose-600 dark:bg-rose-500 dark:text-white dark:border-rose-500',
    paletteBtnClass:
      'border-rose-300 dark:border-rose-500/40 hover:border-rose-500',
  },
};

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function getPerformanceStatement(percentage: number): {
  title: 'Excellent' | 'Very Good' | 'Good' | 'Better luck next time';
  message: string;
  accentClass: string;
  surfaceClass: string;
} {
  if (percentage >= 85) {
    return {
      title: 'Excellent',
      message:
        'Strong command across Easy, Medium, and Hard Python logic, tracing, and edge cases.',
      accentClass: 'text-emerald-700 dark:text-emerald-300',
      surfaceClass:
        'border-emerald-300 dark:border-emerald-500/45 bg-emerald-50/80 dark:bg-emerald-950/30',
    };
  }
  if (percentage >= 70) {
    return {
      title: 'Very Good',
      message:
        'Solid accuracy across core Python rules. Review the missed Medium or Hard questions below to reach full mastery.',
      accentClass: 'text-sky-700 dark:text-sky-300',
      surfaceClass:
        'border-sky-300 dark:border-sky-500/45 bg-sky-50/80 dark:bg-sky-950/30',
    };
  }
  if (percentage >= 50) {
    return {
      title: 'Good',
      message:
        'You have a working grasp of Python fundamentals. Read each explanation below carefully before your next attempt.',
      accentClass: 'text-amber-700 dark:text-amber-300',
      surfaceClass:
        'border-amber-300 dark:border-amber-500/45 bg-amber-50/80 dark:bg-amber-950/30',
    };
  }
  return {
    title: 'Better luck next time',
    message:
      'Keep practicing! Study the detailed step-by-step explanations below and revisit Learning or Practice to strengthen your foundation.',
    accentClass: 'text-rose-700 dark:text-rose-300',
    surfaceClass:
      'border-rose-300 dark:border-rose-500/45 bg-rose-50/80 dark:bg-rose-950/30',
  };
}

function shuffleQuestions(list: TestQuestion[]): TestQuestion[] {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function TestView({
  playerName,
  onSubmitScore,
  onOpenLeaderboard,
}: TestViewProps) {
  const [questions, setQuestions] = useState<TestQuestion[]>(TEST_QUESTIONS);
  const [isShuffled, setIsShuffled] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [slideDir, setSlideDir] = useState<1 | -1>(1);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [paletteOpen, setPaletteOpen] = useState(true);
  const [paletteDifficulty, setPaletteDifficulty] = useState<'all' | TestDifficulty>('all');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [reviewOutcomeFilter, setReviewOutcomeFilter] = useState<'all' | 'incorrect' | 'correct'>('all');
  const [reviewDifficultyFilter, setReviewDifficultyFilter] = useState<'all' | TestDifficulty>('all');

  useEffect(() => {
    if (submitted) return;
    const timer = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [submitted]);

  const total = questions.length;
  const currentQuestion = questions[currentIdx] ?? questions[0];
  const selectedOption = answers[currentQuestion.id];
  const answeredCount = Object.keys(answers).length;
  const unansweredCount = total - answeredCount;
  const flaggedCount = Object.values(flagged).filter(Boolean).length;

  const paletteIndices = useMemo(() => {
    return questions
      .map((q, idx) => ({ q, idx }))
      .filter(({ q }) => paletteDifficulty === 'all' || q.difficulty === paletteDifficulty);
  }, [questions, paletteDifficulty]);

  const groupedByDifficulty = useMemo(() => {
    const tiers: TestDifficulty[] = ['easy', 'medium', 'hard'];
    return tiers.map((tier) => ({
      tier,
      items: questions
        .map((q, idx) => ({ q, idx }))
        .filter(({ q }) => q.difficulty === tier),
    }));
  }, [questions]);

  const results = useMemo(() => {
    const correctCount = questions.filter((q) => answers[q.id] === q.correctIndex).length;
    const maxPoints = questions.reduce((sum, q) => sum + q.points, 0);
    const earnedPoints = questions.reduce(
      (sum, q) => sum + (answers[q.id] === q.correctIndex ? q.points : 0),
      0,
    );
    const percentage = total > 0 ? Math.round((correctCount / total) * 100) : 0;

    const byDifficulty = (['easy', 'medium', 'hard'] as TestDifficulty[]).map((tier) => {
      const tierQuestions = questions.filter((q) => q.difficulty === tier);
      const tierAttempted = tierQuestions.filter((q) => answers[q.id] !== undefined).length;
      const tierCorrect = tierQuestions.filter((q) => answers[q.id] === q.correctIndex).length;
      const tierMaxPts = tierQuestions.reduce((s, q) => s + q.points, 0);
      const tierEarnedPts = tierQuestions.reduce(
        (s, q) => s + (answers[q.id] === q.correctIndex ? q.points : 0),
        0,
      );
      const tierPct =
        tierQuestions.length > 0 ? Math.round((tierCorrect / tierQuestions.length) * 100) : 0;
      return {
        tier,
        total: tierQuestions.length,
        attempted: tierAttempted,
        correct: tierCorrect,
        accuracy: tierPct,
        earnedPts: tierEarnedPts,
        maxPts: tierMaxPts,
      };
    });

    const topicMap = new Map<string, { total: number; correct: number }>();
    for (const q of questions) {
      const entry = topicMap.get(q.topic) ?? { total: 0, correct: 0 };
      entry.total += 1;
      if (answers[q.id] === q.correctIndex) entry.correct += 1;
      topicMap.set(q.topic, entry);
    }
    const byTopic = Array.from(topicMap.entries()).map(([topic, stats]) => ({
      topic,
      total: stats.total,
      correct: stats.correct,
      accuracy: Math.round((stats.correct / stats.total) * 100),
    }));

    return {
      correctCount,
      incorrectCount: total - correctCount,
      maxPoints,
      earnedPoints,
      percentage,
      statement: getPerformanceStatement(percentage),
      byDifficulty,
      byTopic,
    };
  }, [questions, answers, total]);

  const filteredReviewItems = useMemo(() => {
    return questions
      .map((q, idx) => ({ q, idx }))
      .filter(({ q }) => {
        if (reviewDifficultyFilter !== 'all' && q.difficulty !== reviewDifficultyFilter) {
          return false;
        }
        const isCorrect = answers[q.id] === q.correctIndex;
        if (reviewOutcomeFilter === 'correct') return isCorrect;
        if (reviewOutcomeFilter === 'incorrect') return !isCorrect;
        return true;
      });
  }, [questions, answers, reviewDifficultyFilter, reviewOutcomeFilter]);

  const goToIndex = (targetIdx: number) => {
    const clamped = Math.max(0, Math.min(total - 1, targetIdx));
    if (clamped === currentIdx) return;
    setSlideDir(clamped > currentIdx ? 1 : -1);
    setCurrentIdx(clamped);
    setConfirmSubmit(false);
  };

  const handleSelectOption = (optionIdx: number) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: optionIdx }));
    setConfirmSubmit(false);
  };

  const handleClearResponse = () => {
    if (submitted) return;
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[currentQuestion.id];
      return next;
    });
  };

  const handleToggleFlag = () => {
    if (submitted) return;
    setFlagged((prev) => ({
      ...prev,
      [currentQuestion.id]: !prev[currentQuestion.id],
    }));
  };

  const finalizeSubmission = () => {
    const finalCorrect = questions.filter((q) => answers[q.id] === q.correctIndex).length;
    setSubmitted(true);
    setConfirmSubmit(false);
    onSubmitScore(finalCorrect, total);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmitClick = () => {
    if (unansweredCount > 0 && !confirmSubmit) {
      setConfirmSubmit(true);
      return;
    }
    finalizeSubmission();
  };

  const handleRestart = (shuffle: boolean) => {
    setQuestions(shuffle ? shuffleQuestions(TEST_QUESTIONS) : TEST_QUESTIONS);
    setIsShuffled(shuffle);
    setAnswers({});
    setFlagged({});
    setCurrentIdx(0);
    setSlideDir(1);
    setElapsedSeconds(0);
    setConfirmSubmit(false);
    setSubmitted(false);
    setReviewOutcomeFilter('all');
    setReviewDifficultyFilter('all');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const diffMeta = DIFFICULTY_META[currentQuestion.difficulty];

  if (submitted) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800/80">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
              Test Result &amp; Scoreboard
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Score breakdown across Easy, Medium, and Hard tiers with full explanations below.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleRestart(false)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Retake Test
            </button>
            <button
              type="button"
              onClick={() => handleRestart(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Shuffle className="w-3.5 h-3.5" />
              Shuffle &amp; Retake
            </button>
            <button
              type="button"
              onClick={onOpenLeaderboard}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-[#FFD43B] dark:text-[#0B0F17] dark:hover:bg-[#FFE066] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Trophy className="w-3.5 h-3.5" />
              Open Leaderboard
            </button>
          </div>
        </div>

        {/* Performance Statement + Scoreboard Card */}
        <section
          className={`rounded-xl border p-5 sm:p-6 shadow-xs flex flex-col gap-5 ${results.statement.surfaceClass}`}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-white/90 dark:bg-[#0B0F17]/80 border border-slate-200/80 dark:border-slate-700/80 shrink-0">
                <Award className={`w-6 h-6 ${results.statement.accentClass}`} />
              </div>
              <div>
                <div className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Performance Statement · Candidate: {playerName}
                </div>
                <h2 className={`text-2xl sm:text-3xl font-semibold mt-0.5 ${results.statement.accentClass}`}>
                  {results.statement.title}
                </h2>
                <p className="text-sm text-slate-700 dark:text-slate-300 mt-1 max-w-2xl">
                  {results.statement.message}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:items-end tabular-nums">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Final Accuracy
              </span>
              <span className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
                {results.percentage}%
              </span>
              <span className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Synced to Live Leaderboard
              </span>
            </div>
          </div>

          {/* 4-Metric Scoreboard Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-200/80 dark:border-slate-700/60">
            <div className="rounded-lg bg-white/90 dark:bg-[#0B0F17]/80 border border-slate-200/80 dark:border-slate-800 px-3.5 py-2.5">
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Questions Correct
              </div>
              <div className="text-lg font-semibold text-slate-900 dark:text-white tabular-nums mt-0.5">
                {results.correctCount} / {total}
              </div>
            </div>

            <div className="rounded-lg bg-white/90 dark:bg-[#0B0F17]/80 border border-slate-200/80 dark:border-slate-800 px-3.5 py-2.5">
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Weighted Points
              </div>
              <div className="text-lg font-semibold text-slate-900 dark:text-white tabular-nums mt-0.5">
                {results.earnedPoints} / {results.maxPoints} pts
              </div>
            </div>

            <div className="rounded-lg bg-white/90 dark:bg-[#0B0F17]/80 border border-slate-200/80 dark:border-slate-800 px-3.5 py-2.5">
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Incorrect / Skipped
              </div>
              <div className="text-lg font-semibold text-slate-900 dark:text-white tabular-nums mt-0.5">
                {results.incorrectCount}
              </div>
            </div>

            <div className="rounded-lg bg-white/90 dark:bg-[#0B0F17]/80 border border-slate-200/80 dark:border-slate-800 px-3.5 py-2.5">
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Time Taken
              </div>
              <div className="text-lg font-semibold text-slate-900 dark:text-white tabular-nums mt-0.5">
                {formatDuration(elapsedSeconds)}
              </div>
            </div>
          </div>
        </section>

        {/* Scoreboard Breakdown: Difficulty Table + Topic Accuracy */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Difficulty Scoreboard Table */}
          <div className="lg:col-span-7 rounded-xl border border-slate-200/90 dark:border-slate-800/80 bg-white/95 dark:bg-[#111827]/95 p-5 shadow-xs">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              Difficulty Scoreboard
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 mb-3">
              Weighted scoring: Easy = 1 pt · Medium = 2 pts · Hard = 3 pts
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-left">
                    <th className="py-2 pr-3 font-medium">Difficulty</th>
                    <th className="py-2 px-3 font-medium text-right">Attempted</th>
                    <th className="py-2 px-3 font-medium text-right">Correct</th>
                    <th className="py-2 px-3 font-medium text-right">Accuracy</th>
                    <th className="py-2 pl-3 font-medium text-right">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 tabular-nums">
                  {results.byDifficulty.map((row) => {
                    const meta = DIFFICULTY_META[row.tier];
                    return (
                      <tr key={row.tier}>
                        <td className={`py-2.5 pr-3 font-semibold ${meta.textClass}`}>
                          {meta.label}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-700 dark:text-slate-300">
                          {row.attempted} / {row.total}
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium text-slate-900 dark:text-white">
                          {row.correct} / {row.total}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-700 dark:text-slate-300">
                          {row.accuracy}%
                        </td>
                        <td className="py-2.5 pl-3 text-right font-semibold text-slate-900 dark:text-white">
                          {row.earnedPts} / {row.maxPts}
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-slate-50/80 dark:bg-[#0B0F17]/60 font-semibold">
                    <td className="py-2.5 pr-3 text-slate-900 dark:text-white">Total</td>
                    <td className="py-2.5 px-3 text-right text-slate-700 dark:text-slate-300">
                      {answeredCount} / {total}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-900 dark:text-white">
                      {results.correctCount} / {total}
                    </td>
                    <td className="py-2.5 px-3 text-right text-emerald-700 dark:text-emerald-400">
                      {results.percentage}%
                    </td>
                    <td className="py-2.5 pl-3 text-right text-slate-900 dark:text-white">
                      {results.earnedPoints} / {results.maxPoints}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Topic Breakdown + Rating Scale Reference */}
          <div className="lg:col-span-5 rounded-xl border border-slate-200/90 dark:border-slate-800/80 bg-white/95 dark:bg-[#111827]/95 p-5 shadow-xs flex flex-col justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Topic Accuracy
              </h3>
              <div className="mt-3 flex flex-col gap-2.5">
                {results.byTopic.map((item) => (
                  <div key={item.topic} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {item.topic}
                      </span>
                      <span className="font-mono text-slate-600 dark:text-slate-400 tabular-nums">
                        {item.correct}/{item.total} ({item.accuracy}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 dark:bg-emerald-400 transition-all duration-300"
                        style={{ width: `${item.accuracy}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap gap-x-3 gap-y-1 tabular-nums">
              <span>85%+ Excellent</span>
              <span>·</span>
              <span>70–84% Very Good</span>
              <span>·</span>
              <span>50–69% Good</span>
              <span>·</span>
              <span>&lt;50% Better luck next time</span>
            </div>
          </div>
        </section>

        {/* Detailed Question-by-Question Explanations at Last */}
        <section className="rounded-xl border border-slate-200/90 dark:border-slate-800/80 bg-white/95 dark:bg-[#111827]/95 p-5 shadow-xs flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Result Explanations ({filteredReviewItems.length} shown)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Inspect your answer, the right answer, and why Python produces each result.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-50 dark:bg-[#0B0F17]">
                {(
                  [
                    { id: 'all', label: `All (${total})` },
                    { id: 'incorrect', label: `Missed (${results.incorrectCount})` },
                    { id: 'correct', label: `Correct (${results.correctCount})` },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setReviewOutcomeFilter(tab.id)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      reviewOutcomeFilter === tab.id
                        ? 'bg-emerald-600 text-white dark:bg-[#FFD43B] dark:text-[#0B0F17]'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="inline-flex items-center rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-50 dark:bg-[#0B0F17]">
                {(['all', 'easy', 'medium', 'hard'] as const).map((tier) => (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => setReviewDifficultyFilter(tier)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md capitalize transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      reviewDifficultyFilter === tier
                        ? 'bg-slate-900 text-white dark:bg-slate-200 dark:text-[#0B0F17]'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {tier === 'all' ? 'All Tiers' : tier}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {filteredReviewItems.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
              No questions match this filter combination.
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {filteredReviewItems.map(({ q, idx }) => {
                const chosen = answers[q.id];
                const isCorrect = chosen === q.correctIndex;
                const isUnanswered = chosen === undefined;
                const qMeta = DIFFICULTY_META[q.difficulty];

                return (
                  <article
                    key={q.id}
                    className={`rounded-xl border p-4 flex flex-col gap-3 ${
                      isCorrect
                        ? 'border-emerald-200 dark:border-emerald-500/35 bg-emerald-50/35 dark:bg-emerald-950/15'
                        : 'border-rose-200 dark:border-rose-500/35 bg-rose-50/35 dark:bg-rose-950/15'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                          Q{idx + 1}
                        </span>
                        <span className="text-slate-300 dark:text-slate-600">·</span>
                        <span className={`font-semibold ${qMeta.textClass}`}>
                          {qMeta.label} ({q.points} {q.points === 1 ? 'pt' : 'pts'})
                        </span>
                        <span className="text-slate-300 dark:text-slate-600">·</span>
                        <span className="text-slate-600 dark:text-slate-400">{q.topic}</span>
                      </div>

                      <div className="inline-flex items-center gap-1.5 font-semibold">
                        {isCorrect ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-emerald-700 dark:text-emerald-400">
                              Correct (+{q.points})
                            </span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                            <span className="text-rose-700 dark:text-rose-400">
                              {isUnanswered ? 'Skipped (0)' : 'Incorrect (0)'}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <h4 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white">
                      {q.question}
                    </h4>

                    {q.codeSnippet && (
                      <pre className="rounded-lg border border-slate-200 dark:border-slate-800 bg-[#F8FAFC] dark:bg-[#0B0F17] p-3 font-mono text-xs text-slate-900 dark:text-slate-100 leading-5 overflow-x-auto">
                        {q.codeSnippet}
                      </pre>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-[#0B0F17]/80 px-3 py-2">
                        <span className="text-slate-500 dark:text-slate-400 block mb-0.5">
                          Your Answer
                        </span>
                        <span
                          className={`font-mono font-medium whitespace-pre-wrap ${
                            isCorrect
                              ? 'text-emerald-700 dark:text-emerald-300'
                              : 'text-rose-700 dark:text-rose-300'
                          }`}
                        >
                          {isUnanswered ? 'Not answered' : q.options[chosen]}
                        </span>
                      </div>

                      <div className="rounded-lg border border-emerald-200/80 dark:border-emerald-500/30 bg-white/80 dark:bg-[#0B0F17]/80 px-3 py-2">
                        <span className="text-slate-500 dark:text-slate-400 block mb-0.5">
                          Correct Answer
                        </span>
                        <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-300 whitespace-pre-wrap">
                          {q.options[q.correctIndex]}
                        </span>
                      </div>
                    </div>

                    <div className="rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-[#0D131F] px-3.5 py-2.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        Explanation:{' '}
                      </span>
                      {q.explanation}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-end justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Python Assessment Test
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Easy, Medium, and Hard questions. Use the sliding question palette to jump anywhere; answers &amp; scoreboard unlock after submission.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300 tabular-nums">
            <span className="inline-flex items-center gap-1 font-medium">
              <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              {formatDuration(elapsedSeconds)}
            </span>
            <span className="text-slate-300 dark:text-slate-600">·</span>
            <span>
              Answered <strong className="text-slate-900 dark:text-white">{answeredCount}</strong>/{total}
            </span>
            <span className="text-slate-300 dark:text-slate-600">·</span>
            <span>Marked {flaggedCount}</span>
          </div>

          <button
            type="button"
            onClick={() => setPaletteOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-200 hover:border-emerald-500 whitespace-nowrap shrink-0 cursor-pointer"
          >
            {paletteOpen ? (
              <PanelRightClose className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <PanelRightOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            )}
            {paletteOpen ? 'Hide Palette' : 'Question Palette'}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-slate-200/80 dark:bg-slate-800/80 rounded-full overflow-hidden mt-4">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 transition-all duration-300"
          style={{ width: `${(answeredCount / total) * 100}%` }}
        />
      </div>

      {/* Compact Quick-Slide Question Strip */}
      <div className="mt-4 flex items-center gap-2 rounded-xl border border-slate-200/90 dark:border-slate-800/80 bg-white/90 dark:bg-[#111827]/90 px-3 py-2">
        <button
          type="button"
          onClick={() => goToIndex(currentIdx - 1)}
          disabled={currentIdx === 0}
          aria-label="Previous question"
          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer disabled:cursor-default shrink-0"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex-1 flex items-center gap-1.5 overflow-x-auto py-0.5">
          {questions.map((q, idx) => {
            const isCurr = idx === currentIdx;
            const isAns = answers[q.id] !== undefined;
            const isFlag = Boolean(flagged[q.id]);
            let btnClass =
              'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0B0F17] text-slate-600 dark:text-slate-400 hover:border-slate-400';

            if (isCurr) {
              btnClass =
                'border-slate-900 bg-slate-900 text-white dark:border-[#FFD43B] dark:bg-[#FFD43B] dark:text-[#0B0F17] font-semibold';
            } else if (isFlag) {
              btnClass =
                'border-amber-400 bg-amber-50 text-amber-800 dark:border-amber-500/60 dark:bg-amber-500/15 dark:text-amber-300';
            } else if (isAns) {
              btnClass =
                'border-emerald-400 bg-emerald-50 text-emerald-800 dark:border-emerald-500/50 dark:bg-emerald-500/15 dark:text-emerald-300';
            }

            return (
              <button
                key={q.id}
                type="button"
                onClick={() => goToIndex(idx)}
                title={`Q${idx + 1} · ${DIFFICULTY_META[q.difficulty].label} (${q.points} pt)`}
                className={`min-w-[2.1rem] h-8 px-2 rounded-md border text-xs font-mono tabular-nums transition-colors cursor-pointer shrink-0 flex items-center justify-center gap-1 ${btnClass}`}
              >
                <span>{idx + 1}</span>
                <span className="text-[9px] uppercase opacity-75">
                  {q.difficulty[0]}
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => goToIndex(currentIdx + 1)}
          disabled={currentIdx === total - 1}
          aria-label="Next question"
          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer disabled:cursor-default shrink-0"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Main Split Workspace: Question Card + Sliding Question Palette */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Question Card */}
        <div
          className={`${
            paletteOpen ? 'lg:col-span-8' : 'lg:col-span-12'
          } rounded-xl border border-slate-200/90 dark:border-slate-800/80 bg-white/95 dark:bg-[#111827]/95 p-5 shadow-xs overflow-hidden`}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, x: slideDir * 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: slideDir * -24 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="flex flex-col gap-4"
            >
              {/* Question Metadata Row */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex flex-wrap items-center gap-2 tabular-nums">
                  <span className="font-semibold text-slate-900 dark:text-white">
                    Question {currentIdx + 1} of {total}
                  </span>
                  <span className="text-slate-300 dark:text-slate-600">·</span>
                  <span className={`font-semibold ${diffMeta.textClass}`}>
                    {diffMeta.label} ({currentQuestion.points}{' '}
                    {currentQuestion.points === 1 ? 'pt' : 'pts'})
                  </span>
                  <span className="text-slate-300 dark:text-slate-600">·</span>
                  <span className="text-slate-600 dark:text-slate-400">
                    {currentQuestion.topic}
                  </span>
                  {isShuffled && (
                    <>
                      <span className="text-slate-300 dark:text-slate-600">·</span>
                      <span className="text-slate-500 dark:text-slate-400">Shuffled</span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleToggleFlag}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md border text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      flagged[currentQuestion.id]
                        ? 'border-amber-400 bg-amber-50 text-amber-800 dark:border-amber-500/50 dark:bg-amber-500/15 dark:text-amber-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-amber-400'
                    }`}
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    {flagged[currentQuestion.id] ? 'Marked' : 'Mark for Review'}
                  </button>

                  {selectedOption !== undefined && (
                    <button
                      type="button"
                      onClick={handleClearResponse}
                      className="px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <h2 className="text-lg font-semibold text-slate-900 dark:text-white leading-snug">
                {currentQuestion.question}
              </h2>

              {currentQuestion.codeSnippet && (
                <pre className="rounded-lg border border-slate-200 dark:border-slate-800 bg-[#F8FAFC] dark:bg-[#0B0F17] p-3.5 font-mono text-xs sm:text-sm text-slate-900 dark:text-slate-100 leading-6 overflow-x-auto">
                  {currentQuestion.codeSnippet}
                </pre>
              )}

              {/* Options */}
              <div className="flex flex-col gap-2">
                {currentQuestion.options.map((opt, idx) => {
                  const isChosen = selectedOption === idx;
                  const letter = String.fromCharCode(65 + idx);
                  return (
                    <button
                      key={`${currentQuestion.id}-${idx}`}
                      type="button"
                      onClick={() => handleSelectOption(idx)}
                      className={`w-full px-4 py-3 rounded-lg border text-left text-sm font-medium flex items-start gap-3 transition-colors cursor-pointer ${
                        isChosen
                          ? 'border-emerald-500 bg-emerald-50/90 text-emerald-950 dark:border-[#FFD43B] dark:bg-[#FFD43B]/10 dark:text-white'
                          : 'border-slate-200 dark:border-slate-800 bg-[#F8FAFC] dark:bg-[#0B0F17] text-slate-800 dark:text-slate-200 hover:border-emerald-400 dark:hover:border-slate-600'
                      }`}
                    >
                      <span
                        className={`w-6 h-6 rounded-md border text-xs font-mono flex items-center justify-center shrink-0 mt-0.5 ${
                          isChosen
                            ? 'border-emerald-600 bg-emerald-600 text-white dark:border-[#FFD43B] dark:bg-[#FFD43B] dark:text-[#0B0F17]'
                            : 'border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {letter}
                      </span>
                      <span className="whitespace-pre-wrap font-mono text-[13px] leading-6">
                        {opt}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Unanswered Confirmation Prompt */}
          {confirmSubmit && (
            <div className="mt-4 rounded-lg border border-amber-300 dark:border-amber-500/40 bg-amber-50/90 dark:bg-amber-950/30 p-3.5 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-amber-950 dark:text-amber-200">
                You still have <strong className="tabular-nums">{unansweredCount}</strong> unanswered{' '}
                {unansweredCount === 1 ? 'question' : 'questions'}. Submit anyway to view your scoreboard?
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmSubmit(false)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-amber-300 dark:border-amber-600/50 bg-white dark:bg-transparent text-amber-900 dark:text-amber-200 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Keep Reviewing
                </button>
                <button
                  type="button"
                  onClick={finalizeSubmission}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Confirm Submit
                </button>
              </div>
            </div>
          )}

          {/* Footer Navigation */}
          <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => goToIndex(currentIdx - 1)}
                disabled={currentIdx === 0}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 whitespace-nowrap shrink-0 cursor-pointer disabled:cursor-default"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Previous
              </button>

              <button
                type="button"
                onClick={() => goToIndex(currentIdx + 1)}
                disabled={currentIdx === total - 1}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 whitespace-nowrap shrink-0 cursor-pointer disabled:cursor-default"
              >
                Next
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleRestart(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Shuffle className="w-3.5 h-3.5" />
                Shuffle
              </button>

              <button
                type="button"
                onClick={handleSubmitClick}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-[#FFD43B] dark:text-[#0B0F17] dark:hover:bg-[#FFE066] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Submit Test
                <CheckCircle2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Sliding Question Palette (Easy / Medium / Hard) */}
        <AnimatePresence initial={false}>
          {paletteOpen && (
            <motion.aside
              key="sliding-question-palette"
              initial={{ opacity: 0, x: 28 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 28 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              aria-label="Sliding question palette"
              className="lg:col-span-4 rounded-xl border border-slate-200/90 dark:border-slate-800/80 bg-white/95 dark:bg-[#111827]/95 p-4 shadow-xs flex flex-col gap-4"
            >
              <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Question Palette
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Slide between Easy, Medium &amp; Hard questions
                  </p>
                </div>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                  {answeredCount}/{total}
                </span>
              </div>

              {/* Difficulty Filter Tabs */}
              <div className="grid grid-cols-4 gap-1 rounded-lg border border-slate-200 dark:border-slate-800 p-0.5 bg-slate-50 dark:bg-[#0B0F17]">
                {(
                  [
                    { id: 'all', label: 'All' },
                    { id: 'easy', label: 'Easy' },
                    { id: 'medium', label: 'Medium' },
                    { id: 'hard', label: 'Hard' },
                  ] as const
                ).map((tab) => {
                  const active = paletteDifficulty === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setPaletteDifficulty(tab.id)}
                      className={`py-1.5 px-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        active
                          ? tab.id === 'all'
                            ? 'bg-slate-900 text-white dark:bg-slate-200 dark:text-[#0B0F17]'
                            : DIFFICULTY_META[tab.id].activeBtnClass
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Grouped Palette Sections */}
              {paletteDifficulty === 'all' ? (
                <div className="flex flex-col gap-3.5">
                  {groupedByDifficulty.map(({ tier, items }) => {
                    const meta = DIFFICULTY_META[tier];
                    const tierDone = items.filter(({ q }) => answers[q.id] !== undefined).length;
                    return (
                      <div key={tier} className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className={`font-semibold ${meta.textClass}`}>
                            {meta.label} · {items[0]?.q.points ?? 1}{' '}
                            {(items[0]?.q.points ?? 1) === 1 ? 'pt' : 'pts'}
                          </span>
                          <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                            {tierDone}/{items.length}
                          </span>
                        </div>

                        <div className="grid grid-cols-5 gap-1.5">
                          {items.map(({ q, idx }) => {
                            const isCurr = idx === currentIdx;
                            const isAns = answers[q.id] !== undefined;
                            const isFlag = Boolean(flagged[q.id]);

                            let cellClass = `bg-slate-50 dark:bg-[#0B0F17] text-slate-700 dark:text-slate-300 ${meta.paletteBtnClass}`;
                            if (isCurr) {
                              cellClass =
                                'border-slate-900 bg-slate-900 text-white dark:border-[#FFD43B] dark:bg-[#FFD43B] dark:text-[#0B0F17] font-semibold';
                            } else if (isFlag) {
                              cellClass =
                                'border-amber-400 bg-amber-50 text-amber-900 dark:border-amber-500/60 dark:bg-amber-500/15 dark:text-amber-300';
                            } else if (isAns) {
                              cellClass =
                                'border-emerald-400 bg-emerald-50 text-emerald-800 dark:border-emerald-500/50 dark:bg-emerald-500/15 dark:text-emerald-300';
                            }

                            return (
                              <button
                                key={q.id}
                                type="button"
                                onClick={() => goToIndex(idx)}
                                aria-label={`Go to Question ${idx + 1} (${meta.label})`}
                                className={`h-9 rounded-lg border text-xs font-mono tabular-nums transition-colors cursor-pointer ${cellClass}`}
                              >
                                {idx + 1}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-5 gap-1.5">
                  {paletteIndices.map(({ q, idx }) => {
                    const meta = DIFFICULTY_META[q.difficulty];
                    const isCurr = idx === currentIdx;
                    const isAns = answers[q.id] !== undefined;
                    const isFlag = Boolean(flagged[q.id]);

                    let cellClass = `bg-slate-50 dark:bg-[#0B0F17] text-slate-700 dark:text-slate-300 ${meta.paletteBtnClass}`;
                    if (isCurr) {
                      cellClass =
                        'border-slate-900 bg-slate-900 text-white dark:border-[#FFD43B] dark:bg-[#FFD43B] dark:text-[#0B0F17] font-semibold';
                    } else if (isFlag) {
                      cellClass =
                        'border-amber-400 bg-amber-50 text-amber-900 dark:border-amber-500/60 dark:bg-amber-500/15 dark:text-amber-300';
                    } else if (isAns) {
                      cellClass =
                        'border-emerald-400 bg-emerald-50 text-emerald-800 dark:border-emerald-500/50 dark:bg-emerald-500/15 dark:text-emerald-300';
                    }

                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => goToIndex(idx)}
                        aria-label={`Go to Question ${idx + 1} (${meta.label})`}
                        className={`h-9 rounded-lg border text-xs font-mono tabular-nums transition-colors cursor-pointer ${cellClass}`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Palette Legend */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-slate-900 dark:bg-[#FFD43B] shrink-0" />
                  <span>Current</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs border border-emerald-400 bg-emerald-100 dark:bg-emerald-500/25 shrink-0" />
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs border border-amber-400 bg-amber-100 dark:bg-amber-500/25 shrink-0" />
                  <span>Marked</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0B0F17] shrink-0" />
                  <span>Unanswered</span>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
