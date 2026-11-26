import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, XCircle, Play, ArrowRight } from 'lucide-react';
import { LEARNING_LESSONS, type LessonTopic } from '../data/curriculum';

interface LearningViewProps {
  completedLessons: string[];
  onCompleteLesson: (lessonId: string) => void;
  onLoadInDetector: (code: string) => void;
  initialLessonId?: string;
}

function LessonInteractiveVisual({ lesson }: { lesson: LessonTopic }) {
  const [sliderVal, setSliderVal] = useState(18);
  const [toggleA, setToggleA] = useState(true);
  const [toggleB, setToggleB] = useState(false);
  const [loopStep, setLoopStep] = useState(0);
  const [listItems, setListItems] = useState<string[]>(['apple', 'mango', 'kiwi']);
  const [word, setWord] = useState('Python');
  const [fnInput, setFnInput] = useState(5);
  const [showIndent, setShowIndent] = useState(true);

  if (lesson.visualType === 'syntax') {
    return (
      <div className="rounded-xl border border-emerald-200/80 dark:border-slate-800/80 bg-[#F0FDF4]/70 dark:bg-[#0B0F17] p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Interactive Indentation Toggle
          </span>
          <button
            type="button"
            onClick={() => setShowIndent((v) => !v)}
            className="px-3 py-1 text-xs font-semibold rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 cursor-pointer"
          >
            {showIndent ? 'Remove Indentation' : 'Restore 4-Space Indent'}
          </button>
        </div>
        <div className="font-mono text-xs bg-white dark:bg-[#111827] rounded-lg p-3 border border-slate-200 dark:border-slate-800 space-y-1">
          <div className="text-slate-800 dark:text-slate-200">
            if score &gt;= 50<span className="text-emerald-600 dark:text-[#FFD43B] font-bold">:</span>
          </div>
          <motion.div
            animate={{ x: showIndent ? 20 : 0 }}
            transition={{ duration: 0.18 }}
            className={showIndent ? 'text-emerald-700 dark:text-emerald-400 font-medium' : 'text-rose-600 dark:text-rose-400 font-medium'}
          >
            print("Passed")
          </motion.div>
        </div>
        <div className={`text-xs font-medium ${showIndent ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
          {showIndent
            ? 'Valid: 4 spaces show print() belongs inside the if block.'
            : 'IndentationError: Python expects spaces after the colon (:).'}
        </div>
      </div>
    );
  }

  if (lesson.visualType === 'variables') {
    return (
      <div className="rounded-xl border border-emerald-200/80 dark:border-slate-800/80 bg-[#F0FDF4]/70 dark:bg-[#0B0F17] p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <label htmlFor="var-slider" className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Assign new value: <code className="font-mono text-emerald-700 dark:text-[#FFD43B]">points = {sliderVal}</code>
          </label>
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums">{sliderVal}</span>
        </div>
        <input
          id="var-slider"
          type="range"
          min={0}
          max={100}
          value={sliderVal}
          onChange={(e) => setSliderVal(Number(e.target.value))}
          className="accent-emerald-600 dark:accent-[#FFD43B] cursor-pointer"
        />
        <div className="flex items-center gap-4 pt-1">
          <div className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111827] font-mono text-xs text-emerald-700 dark:text-[#7CC4FF] font-semibold">
            points
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          <motion.div
            key={sliderVal}
            initial={{ scale: 0.94, opacity: 0.7 }}
            animate={{ scale: 1, opacity: 1 }}
            className="px-4 py-2 rounded-lg border border-emerald-400 dark:border-[#FFD43B]/50 bg-white dark:bg-[#FFD43B]/10 font-mono text-sm font-semibold text-emerald-700 dark:text-[#FFD43B] tabular-nums"
          >
            {sliderVal}
          </motion.div>
        </div>
      </div>
    );
  }

  if (lesson.visualType === 'datatypes') {
    const samples = [
      { label: '42', type: 'int', note: 'Whole number' },
      { label: '3.14', type: 'float', note: 'Decimal number' },
      { label: '"42"', type: 'str', note: 'Text inside quotes' },
      { label: 'True', type: 'bool', note: 'True or False state' },
    ];
    return (
      <div className="rounded-xl border border-emerald-200/80 dark:border-slate-800/80 bg-[#F0FDF4]/70 dark:bg-[#0B0F17] p-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {samples.map((s) => (
          <div
            key={s.label}
            className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-3 text-center"
          >
            <div className="font-mono text-sm font-semibold text-emerald-700 dark:text-[#FFD43B]">{s.label}</div>
            <div className="font-mono text-xs text-slate-800 dark:text-[#7CC4FF] mt-1 font-medium">{s.type}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{s.note}</div>
          </div>
        ))}
      </div>
    );
  }

  if (lesson.visualType === 'operators') {
    const passed = sliderVal >= 18;
    return (
      <div className="rounded-xl border border-emerald-200/80 dark:border-slate-800/80 bg-[#F0FDF4]/70 dark:bg-[#0B0F17] p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs">
          <label htmlFor="op-slider" className="text-slate-700 dark:text-slate-300 font-medium">
            Test value <code className="font-mono text-emerald-700 dark:text-[#7CC4FF]">age = {sliderVal}</code>
          </label>
          <span
            className={`font-mono font-semibold ${
              passed ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            age &gt;= 18 → {passed ? 'True' : 'False'}
          </span>
        </div>
        <input
          id="op-slider"
          type="range"
          min={10}
          max={30}
          value={sliderVal}
          onChange={(e) => setSliderVal(Number(e.target.value))}
          className="accent-emerald-600 dark:accent-emerald-400 cursor-pointer"
        />
      </div>
    );
  }

  if (lesson.visualType === 'boolean') {
    return (
      <div className="rounded-xl border border-emerald-200/80 dark:border-slate-800/80 bg-[#F0FDF4]/70 dark:bg-[#0B0F17] p-4 flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setToggleA((v) => !v)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-semibold cursor-pointer ${
              toggleA
                ? 'border-emerald-400 bg-emerald-100 text-emerald-800 dark:border-emerald-500/60 dark:bg-emerald-500/15 dark:text-emerald-300'
                : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-transparent text-slate-600 dark:text-slate-400'
            }`}
          >
            A = {toggleA ? 'True' : 'False'}
          </button>
          <button
            type="button"
            onClick={() => setToggleB((v) => !v)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-semibold cursor-pointer ${
              toggleB
                ? 'border-emerald-400 bg-emerald-100 text-emerald-800 dark:border-emerald-500/60 dark:bg-emerald-500/15 dark:text-emerald-300'
                : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-transparent text-slate-600 dark:text-slate-400'
            }`}
          >
            B = {toggleB ? 'True' : 'False'}
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2 font-mono text-xs">
          <div className="p-2.5 rounded-lg bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400">A and B: </span>
            <span className={toggleA && toggleB ? 'text-emerald-700 dark:text-emerald-400 font-semibold' : 'text-rose-600 dark:text-rose-400 font-semibold'}>
              {toggleA && toggleB ? 'True' : 'False'}
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400">A or B: </span>
            <span className={toggleA || toggleB ? 'text-emerald-700 dark:text-emerald-400 font-semibold' : 'text-rose-600 dark:text-rose-400 font-semibold'}>
              {toggleA || toggleB ? 'True' : 'False'}
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400">not A: </span>
            <span className={!toggleA ? 'text-emerald-700 dark:text-emerald-400 font-semibold' : 'text-rose-600 dark:text-rose-400 font-semibold'}>
              {!toggleA ? 'True' : 'False'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (lesson.visualType === 'ifelse') {
    const isHot = sliderVal > 30;
    return (
      <div className="rounded-xl border border-emerald-200/80 dark:border-slate-800/80 bg-[#F0FDF4]/70 dark:bg-[#0B0F17] p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs">
          <label htmlFor="temp-slider" className="text-slate-700 dark:text-slate-300 font-medium">
            Temperature: <span className="font-mono text-emerald-700 dark:text-[#FFD43B] tabular-nums">{sliderVal}°C</span>
          </label>
          <span className="font-mono text-slate-500 dark:text-slate-400">if temp &gt; 30:</span>
        </div>
        <input
          id="temp-slider"
          type="range"
          min={15}
          max={42}
          value={sliderVal}
          onChange={(e) => setSliderVal(Number(e.target.value))}
          className="accent-emerald-600 dark:accent-[#FFD43B] cursor-pointer"
        />
        <div className="grid grid-cols-2 gap-2.5 text-xs font-mono">
          <div
            className={`p-2.5 rounded-lg border ${
              isHot
                ? 'border-emerald-500 bg-emerald-100/80 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-300'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-transparent text-slate-400 dark:text-slate-500'
            }`}
          >
            True → print("Hot day")
          </div>
          <div
            className={`p-2.5 rounded-lg border ${
              !isHot
                ? 'border-amber-400 bg-amber-50 text-amber-900 dark:border-amber-500/60 dark:bg-amber-500/15 dark:text-amber-300'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-transparent text-slate-400 dark:text-slate-500'
            }`}
          >
            False → print("Mild day")
          </div>
        </div>
      </div>
    );
  }

  if (lesson.visualType === 'loops') {
    const steps = [1, 2, 3];
    return (
      <div className="rounded-xl border border-emerald-200/80 dark:border-slate-800/80 bg-[#F0FDF4]/70 dark:bg-[#0B0F17] p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-700 dark:text-slate-300 font-mono">for i in range(1, 4):</span>
          <button
            type="button"
            onClick={() => setLoopStep((s) => (s + 1) % 3)}
            className="px-3 py-1 text-xs font-semibold rounded-md bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
          >
            Next Iteration
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {steps.map((val, idx) => (
            <motion.div
              key={val}
              animate={{ scale: loopStep === idx ? 1.03 : 1 }}
              className={`p-2.5 rounded-lg border text-center font-mono text-xs font-semibold ${
                loopStep === idx
                  ? 'border-emerald-500 bg-white dark:bg-[#FFD43B]/10 text-emerald-700 dark:text-[#FFD43B]'
                  : 'border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-[#111827] text-slate-400'
              }`}
            >
              i = {val}
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  if (lesson.visualType === 'functions') {
    return (
      <div className="rounded-xl border border-emerald-200/80 dark:border-slate-800/80 bg-[#F0FDF4]/70 dark:bg-[#0B0F17] p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs">
          <label htmlFor="fn-slider" className="text-slate-700 dark:text-slate-300 font-medium">
            Input <code className="font-mono text-emerald-700 dark:text-[#7CC4FF]">n = {fnInput}</code>
          </label>
          <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-400">
            return n * n → {fnInput * fnInput}
          </span>
        </div>
        <input
          id="fn-slider"
          type="range"
          min={1}
          max={12}
          value={fnInput}
          onChange={(e) => setFnInput(Number(e.target.value))}
          className="accent-emerald-600 dark:accent-emerald-400 cursor-pointer"
        />
      </div>
    );
  }

  if (lesson.visualType === 'lists') {
    return (
      <div className="rounded-xl border border-emerald-200/80 dark:border-slate-800/80 bg-[#F0FDF4]/70 dark:bg-[#0B0F17] p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-xs font-medium text-slate-800 dark:text-slate-300">fruits</span>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() =>
                setListItems((prev) => (prev.length < 5 ? [...prev, 'pear'] : prev))
              }
              className="px-2.5 py-1 text-xs font-medium rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 cursor-pointer"
            >
              .append("pear")
            </button>
            <button
              type="button"
              onClick={() => setListItems(['apple', 'mango', 'kiwi'])}
              className="px-2.5 py-1 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-transparent text-slate-600 dark:text-slate-300 cursor-pointer"
            >
              Reset
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {listItems.map((item, idx) => (
            <div
              key={`${item}-${idx}`}
              className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] px-3 py-2 text-center font-mono"
            >
              <div className="text-[10px] text-slate-400 dark:text-slate-500">[{idx}]</div>
              <div className="text-xs font-semibold text-emerald-700 dark:text-[#FFD43B]">"{item}"</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-emerald-200/80 dark:border-slate-800/80 bg-[#F0FDF4]/70 dark:bg-[#0B0F17] p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor="str-demo" className="text-xs font-medium text-slate-700 dark:text-slate-300">
          Edit string:
        </label>
        <input
          id="str-demo"
          type="text"
          maxLength={10}
          value={word}
          onChange={(e) => setWord(e.target.value || 'Py')}
          className="bg-white dark:bg-[#111827] border border-slate-300 dark:border-slate-700 rounded-md px-2.5 py-1 text-xs font-mono text-slate-900 dark:text-white w-36 focus:outline-none focus:border-emerald-600"
        />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {word.split('').map((ch, idx) => (
          <div
            key={idx}
            className="w-9 py-1.5 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] text-center font-mono"
          >
            <div className="text-[10px] text-slate-400 dark:text-slate-500">{idx}</div>
            <div className="text-xs font-semibold text-emerald-700 dark:text-[#7CC4FF]">{ch}</div>
          </div>
        ))}
      </div>
      <div className="font-mono text-xs text-slate-600 dark:text-slate-400">
        len("{word}") = <span className="text-emerald-700 dark:text-[#FFD43B] font-semibold">{word.length}</span> · .upper() = "{word.toUpperCase()}"
      </div>
    </div>
  );
}

export function LearningView({
  completedLessons,
  onCompleteLesson,
  onLoadInDetector,
  initialLessonId,
}: LearningViewProps) {
  const [selectedId, setSelectedId] = useState(initialLessonId || LEARNING_LESSONS[0].id);
  const [answers, setAnswers] = useState<Record<string, number>>({});

  useEffect(() => {
    if (initialLessonId) {
      setSelectedId(initialLessonId);
    }
  }, [initialLessonId]);

  const activeLesson = LEARNING_LESSONS.find((l) => l.id === selectedId) ?? LEARNING_LESSONS[0];
  const selectedOption = answers[activeLesson.id];
  const hasAnswered = selectedOption !== undefined;
  const isCorrect = selectedOption === activeLesson.correctIndex;

  const handleSelectOption = (idx: number) => {
    setAnswers((prev) => ({ ...prev, [activeLesson.id]: idx }));
    if (idx === activeLesson.correctIndex) {
      onCompleteLesson(activeLesson.id);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex flex-wrap items-end justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Interactive Python Lessons
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Step through 10 foundational topics with interactive visuals, clear examples, and instant concept checks.
          </p>
        </div>
        <div className="text-xs font-semibold text-emerald-700 dark:text-slate-300 tabular-nums">
          Completed {completedLessons.length} / {LEARNING_LESSONS.length} lessons
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-5 items-start">
        {/* Left: Sticky Topic Index */}
        <nav
          aria-label="Lesson topics"
          className="lg:col-span-4 lg:sticky lg:top-20 rounded-xl border border-slate-200/90 dark:border-slate-800/80 bg-white/95 dark:bg-[#111827]/95 divide-y divide-slate-100 dark:divide-slate-800/60 overflow-hidden shadow-sm"
        >
          {LEARNING_LESSONS.map((lesson) => {
            const isActive = lesson.id === activeLesson.id;
            const isDone = completedLessons.includes(lesson.id);
            return (
              <button
                key={lesson.id}
                type="button"
                onClick={() => setSelectedId(lesson.id)}
                className={`w-full px-4 py-2.5 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-50 to-sky-50 dark:from-emerald-500/20 dark:to-sky-500/15 text-emerald-950 dark:text-white font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50/90 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono text-xs text-emerald-700 dark:text-sky-400 tabular-nums shrink-0">
                    {lesson.index}.
                  </span>
                  <span className="text-sm truncate">{lesson.title}</span>
                </div>
                {isDone && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right: Active Lesson Content */}
        <div className="lg:col-span-8 rounded-xl border border-slate-200/90 dark:border-slate-800/80 bg-white/95 dark:bg-[#111827]/95 p-5 flex flex-col gap-5 shadow-sm">
          <div>
            <div className="text-xs font-mono font-semibold text-sky-700 dark:text-sky-400">
              Lesson {activeLesson.index}
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mt-0.5">
              {activeLesson.title}
            </h2>
            <p className="text-sm text-slate-700 dark:text-slate-300 mt-1.5 leading-relaxed">
              {activeLesson.definition}
            </p>
          </div>

          {/* Simple Example */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-[#F8FAFC] dark:bg-[#0B0F17] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 dark:border-slate-800/80 bg-gradient-to-r from-emerald-50/80 via-sky-50/60 to-amber-50/60 dark:from-[#0F1522] dark:to-[#131B2E]">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Simple Example
              </span>
              <button
                type="button"
                onClick={() => onLoadInDetector(activeLesson.exampleCode)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-[#FFD43B] hover:underline cursor-pointer"
              >
                <Play className="w-3 h-3 fill-current" />
                Try in Detector
              </button>
            </div>
            <pre className="p-3.5 font-mono text-xs sm:text-[13px] text-slate-900 dark:text-slate-100 leading-6 overflow-x-auto">
              {activeLesson.exampleCode}
            </pre>
          </div>

          {/* Animated Visual & Interactive Demo */}
          <div>
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-300 mb-2">
              Interactive Visual Demo
            </div>
            <LessonInteractiveVisual key={activeLesson.id} lesson={activeLesson} />
          </div>

          {/* Practice Question */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800/80 flex flex-col gap-3">
            <div className="text-xs font-semibold text-emerald-700 dark:text-[#7CC4FF]">
              Quick Check Question
            </div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{activeLesson.question}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {activeLesson.options.map((opt, idx) => {
                const chosen = selectedOption === idx;
                const right = idx === activeLesson.correctIndex;
                let style =
                  'border-slate-200 dark:border-slate-800 bg-[#F8FAFC] dark:bg-[#0B0F17] text-slate-800 dark:text-slate-200 hover:border-emerald-400 dark:hover:border-slate-700';
                if (hasAnswered) {
                  if (right)
                    style =
                      'border-emerald-400 bg-emerald-50 text-emerald-900 dark:border-emerald-500/60 dark:bg-emerald-500/10 dark:text-emerald-300';
                  else if (chosen)
                    style =
                      'border-rose-400 bg-rose-50 text-rose-900 dark:border-rose-500/60 dark:bg-rose-500/10 dark:text-rose-300';
                }
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleSelectOption(idx)}
                    className={`px-3.5 py-2.5 rounded-lg border text-left text-xs font-medium transition-colors cursor-pointer ${style}`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            {hasAnswered && (
              <div
                className={`rounded-lg border p-3.5 text-xs leading-relaxed flex items-start gap-2.5 ${
                  isCorrect
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200'
                    : 'border-rose-300 bg-rose-50 text-rose-950 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200'
                }`}
              >
                {isCorrect ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-semibold mb-0.5">
                    {isCorrect ? 'Correct!' : 'Not quite — here is why:'}
                  </div>
                  <p>{activeLesson.explanation}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
