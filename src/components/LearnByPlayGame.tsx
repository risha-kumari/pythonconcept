import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Gamepad2,
  Trophy,
  RotateCcw,
  Sparkles,
  Zap,
  CheckCircle2,
  Volume2,
  VolumeX,
  Layers,
  Search,
  Move,
  Flame,
} from 'lucide-react';

type GameMode = 'cards' | 'dragdrop' | 'wordsearch';

interface Flashcard {
  id: string;
  front: string;
  back: string;
  category: string;
}

interface DragDropItem {
  id: string;
  code: string;
  targetSlot: string;
}

interface WordSearchItem {
  word: string;
  hint: string;
}

const FLASHCARDS: Flashcard[] = [
  { id: 'f1', front: 'print("Hello")', back: 'Outputs text or expression results to the user screen.', category: 'Syntax' },
  { id: 'f2', front: 'score = 100', back: 'Assigns the number 100 into a labeled variable box called score.', category: 'Variables' },
  { id: 'f3', front: 'if x > 10:', back: 'Starts a condition branch checked when x is strictly greater than 10.', category: 'Conditions' },
  { id: 'f4', front: 'for i in range(3):', back: 'Repeats indented code for numbers 0, 1, and 2 automatically.', category: 'Loops' },
  { id: 'f5', front: 'fruits.append("apple")', back: 'Adds a new item to the end of a Python list.', category: 'Lists' },
  { id: 'f6', front: 'def double(n): return n*2', back: 'Creates a reusable mini-recipe function that doubles its input.', category: 'Functions' },
];

const DRAG_ITEMS: DragDropItem[] = [
  { id: 'd1', code: 'if', targetSlot: 'condition-start' },
  { id: 'd2', code: ':', targetSlot: 'colon-end' },
  { id: 'd3', code: 'print', targetSlot: 'output-func' },
  { id: 'd4', code: 'range(3)', targetSlot: 'loop-range' },
];

const WORD_ITEMS: WordSearchItem[] = [
  { word: 'PYTHON', hint: 'The programming language we are learning' },
  { word: 'INDENT', hint: 'The 4-space rule required after a colon' },
  { word: 'BOOLEAN', hint: 'True or False data type' },
  { word: 'STRING', hint: 'Text wrapped inside quote marks' },
  { word: 'LOOP', hint: 'Repeats code blocks automatically' },
  { word: 'FUNCTION', hint: 'Reusable mini-recipe created with def' },
];

interface LearnByPlayGameProps {
  playerName?: string;
  onSubmitScore?: (score: number, total: number) => void;
}

export function LearnByPlayGame({ playerName = 'Player', onSubmitScore }: LearnByPlayGameProps) {
  const [mode, setMode] = useState<GameMode>('cards');
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Flashcards state
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredCards, setMasteredCards] = useState<string[]>([]);

  // Drag & Drop state
  const [draggedItem, setDraggedItem] = useState<DragDropItem | null>(null);
  const [slots, setSlots] = useState<Record<string, string>>({});
  const [dragCompleted, setDragCompleted] = useState(false);

  // Word Search state
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [selectedLetters, setSelectedLetters] = useState<string[]>([]);

  const playSound = useCallback(
    (type: 'correct' | 'wrong' | 'click' | 'win') => {
      if (!soundEnabled || typeof window === 'undefined') return;
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        const now = ctx.currentTime;
        if (type === 'correct') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(659.25, now);
          osc.frequency.exponentialRampToValueAtTime(1318.5, now + 0.14);
          gain.gain.setValueAtTime(0.15, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
          osc.start(now);
          osc.stop(now + 0.2);
        } else if (type === 'wrong') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(300, now);
          osc.frequency.linearRampToValueAtTime(220, now + 0.16);
          gain.gain.setValueAtTime(0.12, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
          osc.start(now);
          osc.stop(now + 0.2);
        } else if (type === 'click') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(587.33, now);
          gain.gain.setValueAtTime(0.06, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.07);
          osc.start(now);
          osc.stop(now + 0.07);
        } else if (type === 'win') {
          const notes = [523.25, 659.25, 783.99, 1046.5];
          notes.forEach((freq, idx) => {
            const t = now + idx * 0.1;
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.type = 'sine';
            o.frequency.setValueAtTime(freq, t);
            g.gain.setValueAtTime(0.18, t);
            g.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
            o.connect(g);
            g.connect(ctx.destination);
            o.start(t);
            o.stop(t + 0.2);
          });
        }
      } catch {
        // Ignore audio errors
      }
    },
    [soundEnabled],
  );

  // Flashcards handlers
  const handleCardFlip = () => {
    playSound('click');
    setIsFlipped((v) => !v);
  };

  const handleCardRating = (mastered: boolean) => {
    playSound(mastered ? 'correct' : 'click');
    const currentCard = FLASHCARDS[cardIndex];
    if (mastered && !masteredCards.includes(currentCard.id)) {
      setMasteredCards((prev) => [...prev, currentCard.id]);
      setScore((s) => s + 50);
      setStreak((st) => st + 1);
    }
    setIsFlipped(false);
    if (cardIndex < FLASHCARDS.length - 1) {
      setCardIndex((i) => i + 1);
    } else {
      setCardIndex(0);
    }
  };

  // Drag & Drop handlers
  const handleDropSlot = (slotName: string) => {
    if (!draggedItem) return;
    if (draggedItem.targetSlot === slotName) {
      playSound('correct');
      const nextSlots = { ...slots, [slotName]: draggedItem.code };
      setSlots(nextSlots);
      setScore((s) => s + 75);
      setStreak((st) => st + 1);

      if (Object.keys(nextSlots).length === DRAG_ITEMS.length) {
        setDragCompleted(true);
        playSound('win');
        if (onSubmitScore) onSubmitScore(score + 300, 300);
      }
    } else {
      playSound('wrong');
      setStreak(0);
    }
    setDraggedItem(null);
  };

  // Word Search letter click
  const handleLetterClick = (letter: string) => {
    playSound('click');
    const nextLetters = [...selectedLetters, letter];
    const joined = nextLetters.join('');

    const matched = WORD_ITEMS.find((w) => w.word === joined && !foundWords.includes(w.word));
    if (matched) {
      playSound('correct');
      setFoundWords((prev) => [...prev, matched.word]);
      setSelectedLetters([]);
      setScore((s) => s + 100);
      setStreak((st) => st + 1);

      if (foundWords.length + 1 === WORD_ITEMS.length) {
        playSound('win');
        if (onSubmitScore) onSubmitScore(score + 600, 600);
      }
    } else if (joined.length > 8) {
      setSelectedLetters([]);
    } else {
      setSelectedLetters(nextLetters);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Arcade Header */}
      <div className="rounded-2xl border border-fuchsia-500/30 bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 text-white p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-fuchsia-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -top-10 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-fuchsia-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-fuchsia-500/30">
              <Gamepad2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-xs font-mono text-fuchsia-300 uppercase tracking-widest">
                Python Arcade Games
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Learn By Play</h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setSoundEnabled((v) => !v)}
              aria-label="Toggle sound effects"
              className="p-2 rounded-lg border border-fuchsia-500/40 bg-fuchsia-900/50 hover:bg-fuchsia-900 text-fuchsia-200 cursor-pointer transition-colors"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <div className="px-3.5 py-1.5 rounded-xl border border-fuchsia-500/40 bg-fuchsia-900/50 font-mono text-xs flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Score: <strong className="text-amber-300">{score}</strong></span>
            </div>

            <div className="px-3.5 py-1.5 rounded-xl border border-purple-500/40 bg-purple-900/50 font-mono text-xs flex items-center gap-2">
              <Flame className="w-4 h-4 text-emerald-400" />
              <span>Streak: <strong className="text-emerald-300">🔥 {streak}x</strong></span>
            </div>
          </div>
        </div>

        {/* Game Mode Selector Tabs */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-fuchsia-500/20">
          <button
            type="button"
            onClick={() => { playSound('click'); setMode('cards'); }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              mode === 'cards'
                ? 'bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-white shadow-lg'
                : 'bg-black/30 hover:bg-black/50 text-fuchsia-200 border border-fuchsia-500/30'
            }`}
          >
            <Layers className="w-4 h-4" />
            Flashcard Memory Game
          </button>
          <button
            type="button"
            onClick={() => { playSound('click'); setMode('dragdrop'); }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              mode === 'dragdrop'
                ? 'bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-white shadow-lg'
                : 'bg-black/30 hover:bg-black/50 text-fuchsia-200 border border-fuchsia-500/30'
            }`}
          >
            <Move className="w-4 h-4" />
            Drag &amp; Drop Code Builder
          </button>
          <button
            type="button"
            onClick={() => { playSound('click'); setMode('wordsearch'); }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              mode === 'wordsearch'
                ? 'bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-white shadow-lg'
                : 'bg-black/30 hover:bg-black/50 text-fuchsia-200 border border-fuchsia-500/30'
            }`}
          >
            <Search className="w-4 h-4" />
            Python Word Search
          </button>
        </div>
      </div>

      {/* GAME MODE 1: FLASHCARDS */}
      {mode === 'cards' && (
        <div className="mt-6 flex flex-col items-center gap-5">
          <div className="w-full flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400">
            <span>Card {cardIndex + 1} of {FLASHCARDS.length}</span>
            <span className="text-emerald-600 dark:text-emerald-400">Mastered: {masteredCards.length} / {FLASHCARDS.length}</span>
          </div>

          {/* 3D Flip Card */}
          <div
            onClick={handleCardFlip}
            className="w-full max-w-lg aspect-[16/10] rounded-2xl border-2 border-fuchsia-500/40 bg-gradient-to-br from-white via-fuchsia-50/40 to-indigo-50/40 dark:from-[#111827] dark:via-[#131B2E] dark:to-[#0F172A] p-8 shadow-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-transform hover:scale-[1.02]"
          >
            <span className="text-xs font-mono uppercase tracking-wider text-fuchsia-600 dark:text-fuchsia-400 mb-3">
              {FLASHCARDS[cardIndex].category} · {isFlipped ? 'Definition' : 'Code Snippet (Click to Flip)'}
            </span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white max-w-md">
              {isFlipped ? FLASHCARDS[cardIndex].back : FLASHCARDS[cardIndex].front}
            </div>
            <div className="text-[11px] text-slate-400 mt-6 font-mono">
              🔄 Click anywhere on card to flip
            </div>
          </div>

          {/* Rating Buttons */}
          <div className="flex items-center gap-3 w-full max-w-lg">
            <button
              type="button"
              onClick={() => handleCardRating(false)}
              className="flex-1 py-3 rounded-xl border border-rose-300 dark:border-rose-500/50 bg-rose-50 dark:bg-rose-500/10 text-rose-800 dark:text-rose-200 font-semibold text-xs cursor-pointer hover:bg-rose-100"
            >
              Still Learning 🔄
            </button>
            <button
              type="button"
              onClick={() => handleCardRating(true)}
              className="flex-1 py-3 rounded-xl border border-emerald-300 dark:border-emerald-500/50 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 font-semibold text-xs cursor-pointer hover:bg-emerald-100"
            >
              Mastered! ✨
            </button>
          </div>
        </div>
      )}

      {/* GAME MODE 2: DRAG & DROP CODE BUILDER */}
      {mode === 'dragdrop' && (
        <div className="mt-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Build the Python Loop &amp; Condition Block
            </h2>
            <button
              type="button"
              onClick={() => { playSound('click'); setSlots({}); setDragCompleted(false); }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Blocks
            </button>
          </div>

          {/* Target Code Slots */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-[#0B0F17] p-5 font-mono text-sm text-slate-200 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sky-400">score = 80</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Slot 1 */}
              <div
                onClick={() => handleDropSlot('condition-start')}
                className={`px-3 py-1.5 rounded-lg border text-xs font-mono cursor-pointer transition-colors ${
                  slots['condition-start']
                    ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 font-bold'
                    : 'border-dashed border-slate-600 bg-slate-900 text-slate-400 hover:border-fuchsia-400'
                }`}
              >
                {slots['condition-start'] || '[ Drop "if" here ]'}
              </div>
              <span>score &gt;= 50</span>
              {/* Slot 2 */}
              <div
                onClick={() => handleDropSlot('colon-end')}
                className={`px-3.5 py-1.5 rounded-lg border text-xs font-mono cursor-pointer transition-colors ${
                  slots['colon-end']
                    ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 font-bold'
                    : 'border-dashed border-slate-600 bg-slate-900 text-slate-400 hover:border-fuchsia-400'
                }`}
              >
                {slots['colon-end'] || '[ Drop ":" here ]'}
              </div>
            </div>
            <div className="pl-6 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Slot 3 */}
                <div
                  onClick={() => handleDropSlot('output-func')}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-mono cursor-pointer transition-colors ${
                    slots['output-func']
                      ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 font-bold'
                      : 'border-dashed border-slate-600 bg-slate-900 text-slate-400 hover:border-fuchsia-400'
                  }`}
                >
                  {slots['output-func'] || '[ Drop "print" here ]'}
                </div>
                <span>("Passed!")</span>
              </div>
            </div>
          </div>

          {/* Palette Blocks to Click & Place */}
          <div>
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Available Code Blocks (Click to select, then click a slot above):
            </div>
            <div className="flex flex-wrap gap-2.5">
              {DRAG_ITEMS.map((item) => {
                const isPlaced = Object.values(slots).includes(item.code);
                const isSelected = draggedItem?.id === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={isPlaced}
                    onClick={() => {
                      playSound('click');
                      setDraggedItem(item);
                    }}
                    className={`px-4 py-2.5 rounded-xl border font-mono text-xs font-semibold transition-all cursor-pointer ${
                      isPlaced
                        ? 'border-slate-800 bg-slate-900/50 text-slate-500 opacity-40 cursor-default'
                        : isSelected
                        ? 'border-fuchsia-500 bg-fuchsia-500/20 text-fuchsia-200 ring-2 ring-fuchsia-400/50'
                        : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#111827] text-slate-800 dark:text-slate-200 hover:border-fuchsia-400'
                    }`}
                  >
                    {item.code} {isPlaced ? '✓' : ''}
                  </button>
                );
              })}
            </div>
          </div>

          {dragCompleted && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 rounded-xl border border-emerald-500/40 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-950 dark:text-emerald-200 text-xs font-mono flex items-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Fantastic! You assembled the valid Python condition block correctly. +300 pts</span>
            </motion.div>
          )}
        </div>
      )}

      {/* GAME MODE 3: PYTHON WORD SEARCH */}
      {mode === 'wordsearch' && (
        <div className="mt-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Python Terminology Word Search
            </h2>
            <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400">
              Found {foundWords.length} of {WORD_ITEMS.length} words
            </span>
          </div>

          {/* Target Word Clues */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {WORD_ITEMS.map((item) => {
              const isFound = foundWords.includes(item.word);
              return (
                <div
                  key={item.word}
                  className={`p-3 rounded-xl border font-mono text-xs flex items-center justify-between ${
                    isFound
                      ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300 font-semibold'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B0F17] text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div>
                    <div className="font-bold tracking-wider">{isFound ? item.word : '• • • • • •'}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{item.hint}</div>
                  </div>
                  {isFound && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                </div>
              );
            })}
          </div>

          {/* Interactive Letter Grid */}
          <div className="rounded-2xl border border-indigo-200 dark:border-indigo-500/30 bg-gradient-to-br from-indigo-50 via-purple-50/60 to-fuchsia-50/60 dark:from-[#0F172A] dark:via-[#111C2D] dark:to-[#131B2E] p-6 flex flex-col items-center gap-4 shadow-xl">
            <div className="text-xs font-mono text-slate-700 dark:text-slate-300">
              Current selection: <strong className="text-fuchsia-600 dark:text-fuchsia-400 font-bold">{selectedLetters.join('') || '(none)'}</strong>
            </div>

            <div className="grid grid-cols-6 gap-2.5 max-w-sm w-full">
              {['P', 'Y', 'T', 'H', 'O', 'N', 'I', 'N', 'D', 'E', 'N', 'T', 'B', 'O', 'O', 'L', 'E', 'A', 'S', 'T', 'R', 'I', 'N', 'G', 'L', 'O', 'O', 'P', 'X', 'Z', 'F', 'U', 'N', 'C', 'T', 'I'].map((char, idx) => {
                const palettes = [
                  'from-emerald-500 to-teal-600 text-white shadow-emerald-500/20',
                  'from-sky-500 to-indigo-600 text-white shadow-sky-500/20',
                  'from-fuchsia-500 to-purple-600 text-white shadow-fuchsia-500/20',
                  'from-amber-500 to-orange-600 text-white shadow-amber-500/20',
                  'from-rose-500 to-pink-600 text-white shadow-rose-500/20',
                  'from-violet-500 to-purple-600 text-white shadow-violet-500/20',
                ];
                const palette = palettes[idx % palettes.length];
                return (
                  <button
                    key={`${char}-${idx}`}
                    type="button"
                    onClick={() => handleLetterClick(char)}
                    className={`aspect-square rounded-2xl bg-gradient-to-br ${palette} font-mono text-base sm:text-lg font-extrabold flex items-center justify-center cursor-pointer shadow-lg transition-transform hover:scale-105 active:scale-95`}
                  >
                    {char}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setSelectedLetters([])}
              className="px-4 py-2 rounded-xl border border-indigo-300 dark:border-indigo-500/40 bg-white dark:bg-[#111827] text-xs font-mono text-indigo-700 dark:text-indigo-300 font-semibold cursor-pointer shadow-sm hover:bg-indigo-50"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
