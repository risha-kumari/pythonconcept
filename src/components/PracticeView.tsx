import { useState } from 'react';
import { CheckCircle2, XCircle, RotateCcw, Trophy, ArrowRight } from 'lucide-react';
import { PRACTICE_QUIZ } from '../data/curriculum';

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
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submittedToBoard, setSubmittedToBoard] = useState(false);

  const total = PRACTICE_QUIZ.length;
  const question = PRACTICE_QUIZ[currentIdx];
  const selectedOption = answers[question.id];
  const hasAnsweredCurrent = selectedOption !== undefined;

  const answeredCount = Object.keys(answers).length;
  const correctCount = PRACTICE_QUIZ.filter((q) => answers[q.id] === q.correctIndex).length;
  const isFinished = answeredCount === total && currentIdx === total - 1 && hasAnsweredCurrent;

  const handleSelect = (optionIdx: number) => {
    if (hasAnsweredCurrent) return;
    const nextAnswers = { ...answers, [question.id]: optionIdx };
    setAnswers(nextAnswers);
    const nextAnsweredCount = Object.keys(nextAnswers).length;
    if (nextAnsweredCount === total) {
      const finalScore = PRACTICE_QUIZ.filter((q) => nextAnswers[q.id] === q.correctIndex).length;
      onSubmitScore(finalScore, total);
      setSubmittedToBoard(true);
    }
  };

  const handleReset = () => {
    setAnswers({});
    setCurrentIdx(0);
    setSubmittedToBoard(false);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
      {/* Header & Session Progress */}
      <div className="flex flex-wrap items-end justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Python Practice Quiz
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Check your understanding of Python operators, Boolean logic, conditions, syntax, and loops.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs tabular-nums">
          <span className="text-slate-700 dark:text-slate-300 font-medium">
            Score: <strong className="text-emerald-700 dark:text-[#FFD43B]">{correctCount}</strong> / {total}
          </span>
          <span className="text-slate-400">·</span>
          <span className="text-slate-500 dark:text-slate-400">
            Progress: {answeredCount} / {total}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-slate-200/80 dark:bg-slate-800/80 rounded-full overflow-hidden mt-4">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 via-sky-500 to-rose-500 transition-all duration-300"
          style={{ width: `${(answeredCount / total) * 100}%` }}
        />
      </div>

      {/* Question Card */}
      <div className="mt-5 rounded-xl border border-slate-200/90 dark:border-slate-800/80 bg-white/95 dark:bg-[#111827]/95 p-5 flex flex-col gap-4 shadow-sm">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 tabular-nums">
          <span>
            Question {currentIdx + 1} of {total} · {question.topic}
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
            {PRACTICE_QUIZ.map((q, idx) => {
              const ans = answers[q.id];
              const isCurr = idx === currentIdx;
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
                  aria-label={`Go to question ${idx + 1}`}
                  className={`w-7 h-7 rounded-md text-xs font-mono tabular-nums transition-colors cursor-pointer ${dotClass}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {currentIdx < total - 1 ? (
            <button
              type="button"
              onClick={() => setCurrentIdx((i) => Math.min(total - 1, i + 1))}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-[#FFD43B] dark:text-[#0B0F17] dark:hover:bg-[#FFE066] transition-colors cursor-pointer"
            >
              Next Question
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : isFinished ? (
            <button
              type="button"
              onClick={onOpenLeaderboard}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer"
            >
              <Trophy className="w-3.5 h-3.5" />
              View Live Leaderboard
            </button>
          ) : null}
        </div>
      </div>

      {/* Session Completion Summary */}
      {answeredCount === total && (
        <div className="mt-4 rounded-xl border border-emerald-300 dark:border-[#FFD43B]/40 bg-emerald-50/70 dark:bg-[#111827] p-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-slate-900 dark:text-white">
              Quiz Complete · {correctCount} / {total} ({Math.round((correctCount / total) * 100)}%)
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              {submittedToBoard
                ? `Score synced to the live leaderboard as ${playerName}.`
                : 'Ready to post your score to the live room leaderboard.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
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
