import { useEffect, useId, useMemo, useState } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Lightbulb,
  HelpCircle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Code2,
  Shuffle,
} from 'lucide-react';

export type GateType = 'and' | 'or' | 'notA' | 'xor' | 'nand' | 'nor' | 'xnor';

interface GateMeta {
  id: GateType;
  label: string;
  expr: string;
  rule: string;
  category: 'basic' | 'complex';
}

const GATE_OPTIONS: GateMeta[] = [
  {
    id: 'and',
    label: 'AND',
    expr: 'A and B',
    rule: 'Outputs 1 (True) only when both A and B are True.',
    category: 'basic',
  },
  {
    id: 'or',
    label: 'OR',
    expr: 'A or B',
    rule: 'Outputs 1 (True) whenever at least one input (A or B) is True.',
    category: 'basic',
  },
  {
    id: 'notA',
    label: 'NOT',
    expr: 'not A',
    rule: 'Inverts Input A: True (1) becomes False (0), and False (0) becomes True (1).',
    category: 'basic',
  },
  {
    id: 'xor',
    label: 'XOR',
    expr: 'A != B',
    rule: 'Outputs 1 (True) when A and B have different values (one True, one False).',
    category: 'basic',
  },
  {
    id: 'nand',
    label: 'NAND',
    expr: 'not (A and B)',
    rule: 'Inverted AND: outputs 0 (False) only when both A and B are True; otherwise outputs 1 (True).',
    category: 'complex',
  },
  {
    id: 'nor',
    label: 'NOR',
    expr: 'not (A or B)',
    rule: 'Inverted OR: outputs 1 (True) only when both A and B are False; otherwise outputs 0 (False).',
    category: 'complex',
  },
  {
    id: 'xnor',
    label: 'XNOR',
    expr: 'A == B',
    rule: 'Inverted XOR: outputs 1 (True) when A and B match (both True or both False).',
    category: 'complex',
  },
];

const TRUTH_ROWS = [
  { a: true, b: true, label: '(T, T)' },
  { a: true, b: false, label: '(T, F)' },
  { a: false, b: true, label: '(F, T)' },
  { a: false, b: false, label: '(F, F)' },
];

type QuizFilter = 'all' | GateType;

interface BooleanQuizProblem {
  key: string;
  prompt: string;
  gate: GateType;
  a: boolean;
  b: boolean;
  correctAnswer: boolean;
  explanation: string;
}

function formatBoolWord(v: boolean): string {
  return v ? 'True' : 'False';
}

function buildGateExplanation(gate: GateType, a: boolean, b: boolean, result: boolean): string {
  const aStr = `${formatBoolWord(a)} (${a ? '1' : '0'})`;
  const bStr = `${formatBoolWord(b)} (${b ? '1' : '0'})`;
  const outStr = `${formatBoolWord(result)} (${result ? '1' : '0'})`;

  switch (gate) {
    case 'and':
      return result
        ? `Both A = ${aStr} and B = ${bStr} are True, so A AND B evaluates to ${outStr}.`
        : `AND requires both inputs to be True. Since at least one input is False (A = ${aStr}, B = ${bStr}), A AND B is ${outStr}.`;
    case 'or':
      return result
        ? `OR returns True when at least one input is True. With A = ${aStr} and B = ${bStr}, A OR B evaluates to ${outStr}.`
        : `Both A = ${aStr} and B = ${bStr} are False, so A OR B evaluates to ${outStr}.`;
    case 'notA':
      return `NOT flips the input value: since A is ${aStr}, NOT A becomes ${outStr}.`;
    case 'xor':
      return result
        ? `XOR (A != B in Python) is True when the inputs are different. With A = ${aStr} and B = ${bStr}, the result is ${outStr}.`
        : `XOR (A != B in Python) is False when both inputs match. Since A = ${aStr} and B = ${bStr} are the same, the result is ${outStr}.`;
    case 'nand':
      return result
        ? `NAND inverts AND: A AND B is False for A = ${aStr} and B = ${bStr}, so not (A and B) flips it to ${outStr}.`
        : `NAND only outputs False when both inputs are True. Since A = ${aStr} and B = ${bStr} are both True, not (A and B) flips True to ${outStr}.`;
    case 'nor':
      return result
        ? `NOR inverts OR: since both A = ${aStr} and B = ${bStr} are False, A OR B is False and not (A or B) flips it to ${outStr}.`
        : `NOR outputs False whenever at least one input is True. With A = ${aStr} and B = ${bStr}, A OR B is True so not (A or B) becomes ${outStr}.`;
    case 'xnor':
      return result
        ? `XNOR (A == B in Python) is True when both inputs match. Since A = ${aStr} and B = ${bStr} are identical, the result is ${outStr}.`
        : `XNOR (A == B in Python) is False when inputs differ. Since A = ${aStr} and B = ${bStr} do not match, the result is ${outStr}.`;
  }
}

function generateRandomBooleanProblem(
  filter: QuizFilter = 'all',
  excludeKey?: string,
): BooleanQuizProblem {
  const gatesPool: GateType[] =
    filter === 'all' ? ['and', 'or', 'notA', 'xor', 'nand', 'nor', 'xnor'] : [filter];

  let candidate: BooleanQuizProblem | null = null;
  for (let attempt = 0; attempt < 16; attempt++) {
    const gate = gatesPool[Math.floor(Math.random() * gatesPool.length)];
    const a = Math.random() < 0.5;
    const b = Math.random() < 0.5;
    const key = gate === 'notA' ? `${gate}-${a}` : `${gate}-${a}-${b}`;

    const correctAnswer = evaluateGate(gate, a, b);
    let prompt = '';
    if (gate === 'notA') {
      prompt = `What is NOT A when A is ${formatBoolWord(a)}?`;
    } else if (gate === 'xor') {
      prompt = `What is A XOR B (A != B) when A is ${formatBoolWord(a)} and B is ${formatBoolWord(b)}?`;
    } else if (gate === 'nand') {
      prompt = `What is A NAND B (not (A and B)) when A is ${formatBoolWord(a)} and B is ${formatBoolWord(b)}?`;
    } else if (gate === 'nor') {
      prompt = `What is A NOR B (not (A or B)) when A is ${formatBoolWord(a)} and B is ${formatBoolWord(b)}?`;
    } else if (gate === 'xnor') {
      prompt = `What is A XNOR B (A == B) when A is ${formatBoolWord(a)} and B is ${formatBoolWord(b)}?`;
    } else {
      const gateWord = gate === 'and' ? 'AND' : 'OR';
      prompt = `What is A ${gateWord} B when A is ${formatBoolWord(a)} and B is ${formatBoolWord(b)}?`;
    }

    candidate = {
      key,
      prompt,
      gate,
      a,
      b,
      correctAnswer,
      explanation: buildGateExplanation(gate, a, b, correctAnswer),
    };

    if (!excludeKey || key !== excludeKey) {
      break;
    }
  }

  return candidate!;
}

export function evaluateGate(gate: GateType, a: boolean, b: boolean): boolean {
  switch (gate) {
    case 'and':
      return a && b;
    case 'or':
      return a || b;
    case 'notA':
      return !a;
    case 'xor':
      return a !== b;
    case 'nand':
      return !(a && b);
    case 'nor':
      return !(a || b);
    case 'xnor':
      return a === b;
  }
}

export function buildGatePythonLines(gate: GateType, a: boolean, b: boolean): string[] {
  const aStr = a ? 'True' : 'False';
  const bStr = b ? 'True' : 'False';
  switch (gate) {
    case 'and':
      return [
        `A = ${aStr}`,
        `B = ${bStr}`,
        'result = A and B',
        'print("Output:", result)',
      ];
    case 'or':
      return [
        `A = ${aStr}`,
        `B = ${bStr}`,
        'result = A or B',
        'print("Output:", result)',
      ];
    case 'notA':
      return [
        `A = ${aStr}`,
        `B = ${bStr}  # Unused by NOT`,
        'result = not A',
        'print("Output:", result)',
      ];
    case 'xor':
      return [
        `A = ${aStr}`,
        `B = ${bStr}`,
        'result = A != B',
        'print("Output:", result)',
      ];
    case 'nand':
      return [
        `A = ${aStr}`,
        `B = ${bStr}`,
        'result = not (A and B)',
        'print("Output:", result)',
      ];
    case 'nor':
      return [
        `A = ${aStr}`,
        `B = ${bStr}`,
        'result = not (A or B)',
        'print("Output:", result)',
      ];
    case 'xnor':
      return [
        `A = ${aStr}`,
        `B = ${bStr}`,
        'result = A == B',
        'print("Output:", result)',
      ];
  }
}

interface LogicGateSimulatorProps {
  onSyncCode?: (pythonCode: string) => void;
  onActiveLineChange?: (line: number | null) => void;
}

export function LogicGateSimulator({
  onSyncCode,
  onActiveLineChange,
}: LogicGateSimulatorProps) {
  const uid = useId().replace(/:/g, '');
  const glowFilterId = `gate-glow-${uid}`;
  const bulbGlowId = `bulb-glow-${uid}`;

  // Default matches the featured challenge: A = True, B = False, gate = OR
  const [selectedGate, setSelectedGate] = useState<GateType>('or');
  const [valA, setValA] = useState<boolean>(true);
  const [valB, setValB] = useState<boolean>(false);

  // Step-by-step animation state: 0 = Ready, 1 = Load A, 2 = Load B, 3 = Evaluate Gate, 4 = Output & Bulb
  const [simStep, setSimStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1);
  const [syncEditor, setSyncEditor] = useState<boolean>(true);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  // Interactive Random Boolean Logic Quiz state
  const [quizFilter, setQuizFilter] = useState<QuizFilter>('all');
  const [quizProblem, setQuizProblem] = useState<BooleanQuizProblem>(() =>
    generateRandomBooleanProblem('all'),
  );
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [attemptsCount, setAttemptsCount] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [bestStreak, setBestStreak] = useState<number>(0);

  const activeGateMeta = GATE_OPTIONS.find((g) => g.id === selectedGate) ?? GATE_OPTIONS[1];
  const outputResult = evaluateGate(selectedGate, valA, valB);
  const pythonLines = useMemo(
    () => buildGatePythonLines(selectedGate, valA, valB),
    [selectedGate, valA, valB],
  );

  const activeKey = `${valA}-${valB}`;
  const activePythonLine = simStep >= 1 && simStep <= 4 ? simStep : null;

  // Report active Python line back to Logic Detector's Python Editor
  useEffect(() => {
    onActiveLineChange?.(activePythonLine);
  }, [activePythonLine, onActiveLineChange]);

  useEffect(() => {
    return () => {
      onActiveLineChange?.(null);
    };
  }, [onActiveLineChange]);

  // Step-by-step playback timer
  useEffect(() => {
    if (!isPlaying) return;
    const stepDelayMs = Math.round(950 / speed);
    const timer = window.setInterval(() => {
      setSimStep((prev) => {
        if (prev >= 4) {
          setIsPlaying(false);
          return 4;
        }
        return prev + 1;
      });
    }, stepDelayMs);
    return () => window.clearInterval(timer);
  }, [isPlaying, speed]);

  const syncToLeftEditor = (gate: GateType, a: boolean, b: boolean) => {
    if (!syncEditor || !onSyncCode) return;
    onSyncCode(buildGatePythonLines(gate, a, b).join('\n'));
  };

  const handleSelectGate = (gate: GateType) => {
    setSelectedGate(gate);
    setIsPlaying(false);
    setSimStep(0);
    syncToLeftEditor(gate, valA, valB);
  };

  const handleToggleA = () => {
    const nextA = !valA;
    setValA(nextA);
    setIsPlaying(false);
    setSimStep(0);
    syncToLeftEditor(selectedGate, nextA, valB);
  };

  const handleToggleB = () => {
    const nextB = !valB;
    setValB(nextB);
    setIsPlaying(false);
    setSimStep(0);
    syncToLeftEditor(selectedGate, valA, nextB);
  };

  const handleSelectTruthRow = (a: boolean, b: boolean) => {
    setValA(a);
    setValB(b);
    setIsPlaying(false);
    setSimStep(3);
    syncToLeftEditor(selectedGate, a, b);
  };

  const handlePlayToggle = () => {
    syncToLeftEditor(selectedGate, valA, valB);
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }
    if (simStep === 0 || simStep >= 4) {
      setSimStep(1);
    }
    setIsPlaying(true);
  };

  const handleNextStep = () => {
    syncToLeftEditor(selectedGate, valA, valB);
    setIsPlaying(false);
    setSimStep((prev) => Math.min(4, prev + 1));
  };

  const handleReset = () => {
    setIsPlaying(false);
    setSimStep(0);
    onActiveLineChange?.(null);
  };

  const handleTestQuestionInSim = () => {
    setSelectedGate(quizProblem.gate);
    setValA(quizProblem.a);
    setValB(quizProblem.b);
    if (onSyncCode && syncEditor) {
      onSyncCode(
        buildGatePythonLines(quizProblem.gate, quizProblem.a, quizProblem.b).join('\n'),
      );
    }
    setSimStep(1);
    setIsPlaying(true);
  };

  const handleSelectQuizAnswer = (choice: boolean) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(choice);
    setAttemptsCount((c) => c + 1);
    if (choice === quizProblem.correctAnswer) {
      setCorrectCount((c) => c + 1);
      setStreak((prev) => {
        const next = prev + 1;
        setBestStreak((best) => Math.max(best, next));
        return next;
      });
    } else {
      setStreak(0);
    }
  };

  const handleNextRandomProblem = (nextFilter: QuizFilter = quizFilter) => {
    setSelectedAnswer(null);
    setQuizProblem(generateRandomBooleanProblem(nextFilter, quizProblem.key));
  };

  const handleResetQuizStats = () => {
    setCorrectCount(0);
    setAttemptsCount(0);
    setStreak(0);
    setBestStreak(0);
    setSelectedAnswer(null);
    setQuizProblem(generateRandomBooleanProblem(quizFilter, quizProblem.key));
  };

  const stepDescriptions: Record<number, { title: string; detail: string }> = {
    0: {
      title: 'Ready to Simulate',
      detail: 'Pick a gate, toggle A and B, then press Play or Next Step to watch current flow.',
    },
    1: {
      title: 'Step 1 · Load Input A (Line 1)',
      detail: `Variable A is ${valA ? 'True (1)' : 'False (0)'}. Current flows into the top wire toward the ${activeGateMeta.label} gate.`,
    },
    2: {
      title: 'Step 2 · Load Input B (Line 2)',
      detail:
        selectedGate === 'notA'
          ? `Variable B is ${valB ? 'True (1)' : 'False (0)'}, which the NOT gate ignores because it only reads Input A.`
          : `Variable B is ${valB ? 'True (1)' : 'False (0)'}. Current flows into the bottom wire toward the ${activeGateMeta.label} gate.`,
    },
    3: {
      title: `Step 3 · Evaluate ${activeGateMeta.expr} (Line 3)`,
      detail: (() => {
        const aWord = valA ? 'True' : 'False';
        const bWord = valB ? 'True' : 'False';
        const resWord = outputResult ? 'True (1)' : 'False (0)';
        switch (selectedGate) {
          case 'notA':
            return `Gate checks not ${aWord} → ${resWord} and matches the highlighted truth table row.`;
          case 'xor':
            return `Gate checks ${aWord} != ${bWord} → ${resWord} and matches the highlighted truth table row.`;
          case 'nand':
            return `Gate evaluates not (${aWord} and ${bWord}) → ${resWord} and matches the highlighted truth table row.`;
          case 'nor':
            return `Gate evaluates not (${aWord} or ${bWord}) → ${resWord} and matches the highlighted truth table row.`;
          case 'xnor':
            return `Gate checks ${aWord} == ${bWord} → ${resWord} and matches the highlighted truth table row.`;
          default:
            return `Gate checks ${aWord} ${selectedGate} ${bWord} → ${resWord} and matches the highlighted truth table row.`;
        }
      })(),
    },
    4: {
      title: 'Step 4 · Output Signal & Bulb (Line 4)',
      detail: outputResult
        ? 'Output is 1 (True)! Current flows to the bulb and lights it up.'
        : 'Output is 0 (False). No high voltage reaches the bulb, so it stays off.',
    },
  };

  const currentStepInfo = stepDescriptions[simStep] ?? stepDescriptions[0];

  // Wire energization flags
  const wireAOn = simStep >= 1;
  const wireBOn = simStep >= 2 && selectedGate !== 'notA';
  const gateActive = simStep >= 3;
  const outputWireOn = simStep >= 4;
  const bulbLit = simStep >= 4 && outputResult;

  const flowDuration = `${(1.15 / speed).toFixed(2)}s`;

  // Graph Relation coordinates
  const graphNodes = [
    { a: false, b: true, x: 75, y: 42, label: '(F, T)' },
    { a: true, b: true, x: 205, y: 42, label: '(T, T)' },
    { a: false, b: false, x: 75, y: 122, label: '(F, F)' },
    { a: true, b: false, x: 205, y: 122, label: '(T, F)' },
  ];
  const trueCount = TRUTH_ROWS.filter((r) => evaluateGate(selectedGate, r.a, r.b)).length;
  const truePct = Math.round((trueCount / TRUTH_ROWS.length) * 100);

  return (
    <div className="flex flex-col gap-4">
      {/* Header + Sync Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Boolean Logic Gates Simulator
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Watch current flow into basic (<code className="font-mono">AND</code>,{' '}
            <code className="font-mono">OR</code>, <code className="font-mono">NOT</code>,{' '}
            <code className="font-mono">XOR</code>) and complex (<code className="font-mono">NAND</code>,{' '}
            <code className="font-mono">NOR</code>, <code className="font-mono">XNOR</code>) gates.
          </p>
        </div>

        {onSyncCode && (
          <button
            type="button"
            onClick={() => {
              const next = !syncEditor;
              setSyncEditor(next);
              if (next) {
                onSyncCode(pythonLines.join('\n'));
              }
            }}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              syncEditor
                ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-300'
                : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-[#0B0F17] dark:text-slate-400'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            {syncEditor ? 'Editor Synced' : 'Sync Editor'}
          </button>
        )}
      </div>

      {/* 1. Gate Selector (Basic + Complex Gates) */}
      <div className="flex flex-col gap-1.5">
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-1 p-1 rounded-lg bg-slate-100 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800">
          {GATE_OPTIONS.map((gate) => {
            const isActive = selectedGate === gate.id;
            return (
              <button
                key={gate.id}
                type="button"
                onClick={() => handleSelectGate(gate.id)}
                className={`py-1.5 px-2 text-xs font-mono font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? gate.category === 'complex'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-emerald-600 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {gate.label}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-[11px] text-slate-600 dark:text-slate-400">
          <span>
            <strong className="font-semibold text-slate-800 dark:text-slate-200">
              {activeGateMeta.label} ({activeGateMeta.category === 'complex' ? 'Complex' : 'Basic'}):
            </strong>{' '}
            {activeGateMeta.rule}
          </span>
        </div>
      </div>

      {/* 2. Interactive Input Toggles A & B */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={handleToggleA}
          className={`flex items-center justify-between p-3 rounded-xl border transition-colors cursor-pointer ${
            valA
              ? 'border-emerald-400 bg-emerald-50 dark:border-emerald-500/60 dark:bg-emerald-500/10'
              : 'border-rose-200 dark:border-slate-800 bg-rose-50/40 dark:bg-[#0B0F17] hover:border-rose-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="text-left">
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Toggle Input A
            </div>
            <div
              className={`font-mono text-sm font-semibold mt-0.5 ${
                valA ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-400'
              }`}
            >
              {valA ? 'True (1)' : 'False (0)'}
            </div>
          </div>
          <span
            className={`px-2.5 py-1 rounded-md font-mono text-xs font-bold ${
              valA
                ? 'bg-emerald-600 text-white'
                : 'bg-rose-100 text-rose-700 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            {valA ? '1' : '0'}
          </span>
        </button>

        <button
          type="button"
          onClick={handleToggleB}
          className={`flex items-center justify-between p-3 rounded-xl border transition-colors cursor-pointer ${
            selectedGate === 'notA'
              ? 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B0F17]/60 opacity-65'
              : valB
                ? 'border-emerald-400 bg-emerald-50 dark:border-emerald-500/60 dark:bg-emerald-500/10'
                : 'border-rose-200 dark:border-slate-800 bg-rose-50/40 dark:bg-[#0B0F17] hover:border-rose-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="text-left">
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {selectedGate === 'notA' ? 'Input B (Unused in NOT)' : 'Toggle Input B'}
            </div>
            <div
              className={`font-mono text-sm font-semibold mt-0.5 ${
                valB ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-400'
              }`}
            >
              {valB ? 'True (1)' : 'False (0)'}
            </div>
          </div>
          <span
            className={`px-2.5 py-1 rounded-md font-mono text-xs font-bold ${
              valB
                ? 'bg-emerald-600 text-white'
                : 'bg-rose-100 text-rose-700 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            {valB ? '1' : '0'}
          </span>
        </button>
      </div>

      {/* 3. Animated Circuit Stage (Glowing Wires -> Logic Gate -> Light Bulb) */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-[#F8FAFC] dark:bg-[#0B0F17] p-3.5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            Animated Gate Circuit · {activeGateMeta.expr}
          </span>
          <span
            className={`font-mono font-semibold ${
              bulbLit
                ? 'text-emerald-700 dark:text-emerald-400'
                : simStep >= 4
                  ? 'text-rose-700 dark:text-rose-400'
                  : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            {simStep >= 4
              ? bulbLit
                ? 'BULB ON · Output 1'
                : 'BULB OFF · Output 0'
              : `Step ${simStep} / 4`}
          </span>
        </div>

        <svg
          viewBox="0 0 540 206"
          className="w-full h-auto select-none"
          role="img"
          aria-label="Animated logic gate simulator with glowing wires and output bulb"
        >
          <defs>
            <filter id={glowFilterId} x="-25%" y="-25%" width="150%" height="150%">
              <feGaussianBlur stdDeviation="3.2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <radialGradient id={bulbGlowId} cx="50%" cy="45%" r="55%">
              <stop offset="0%" stopColor="#fef08a" stopOpacity="0.95" />
              <stop offset="55%" stopColor="#facc15" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#facc15" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Base Wire Tracks */}
          <path
            d={
              selectedGate === 'notA'
                ? 'M 104 54 C 156 54, 168 103, 214 103'
                : 'M 104 54 C 156 54, 168 85, 214 85'
            }
            fill="none"
            stroke="rgba(148,163,184,0.35)"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path
            d="M 104 152 C 156 152, 168 121, 214 121"
            fill="none"
            stroke="rgba(148,163,184,0.28)"
            strokeWidth="5"
            strokeLinecap="round"
            opacity={selectedGate === 'notA' ? 0.35 : 1}
          />
          <line
            x1="322"
            y1="103"
            x2="424"
            y2="103"
            stroke="rgba(148,163,184,0.35)"
            strokeWidth="5"
            strokeLinecap="round"
          />

          {/* Energized Wire A + Current Flow */}
          {wireAOn && (
            <>
              <path
                d={
                  selectedGate === 'notA'
                    ? 'M 104 54 C 156 54, 168 103, 214 103'
                    : 'M 104 54 C 156 54, 168 85, 214 85'
                }
                fill="none"
                stroke={valA ? '#10b981' : '#f43f5e'}
                strokeWidth="3.5"
                strokeLinecap="round"
                filter={valA ? `url(#${glowFilterId})` : undefined}
              />
              <path
                d={
                  selectedGate === 'notA'
                    ? 'M 104 54 C 156 54, 168 103, 214 103'
                    : 'M 104 54 C 156 54, 168 85, 214 85'
                }
                fill="none"
                stroke={valA ? '#a7f3d0' : '#fda4af'}
                strokeWidth="2.5"
                strokeDasharray="6 8"
                strokeLinecap="round"
                className="animate-wire-flow"
                style={{ animationDuration: flowDuration }}
              />
            </>
          )}

          {/* Energized Wire B + Current Flow */}
          {wireBOn && (
            <>
              <path
                d="M 104 152 C 156 152, 168 121, 214 121"
                fill="none"
                stroke={valB ? '#10b981' : '#f43f5e'}
                strokeWidth="3.5"
                strokeLinecap="round"
                filter={valB ? `url(#${glowFilterId})` : undefined}
              />
              <path
                d="M 104 152 C 156 152, 168 121, 214 121"
                fill="none"
                stroke={valB ? '#a7f3d0' : '#fda4af'}
                strokeWidth="2.5"
                strokeDasharray="6 8"
                strokeLinecap="round"
                className="animate-wire-flow"
                style={{ animationDuration: flowDuration }}
              />
            </>
          )}

          {/* Energized Output Wire + Current Flow */}
          {outputWireOn && (
            <>
              <line
                x1="322"
                y1="103"
                x2="424"
                y2="103"
                stroke={outputResult ? '#10b981' : '#f43f5e'}
                strokeWidth="4"
                strokeLinecap="round"
                filter={outputResult ? `url(#${glowFilterId})` : undefined}
              />
              <line
                x1="322"
                y1="103"
                x2="424"
                y2="103"
                stroke={outputResult ? '#fde047' : '#fda4af'}
                strokeWidth="2.5"
                strokeDasharray="6 8"
                strokeLinecap="round"
                className="animate-wire-flow"
                style={{ animationDuration: flowDuration }}
              />
            </>
          )}

          {/* Wire Bit Labels */}
          <text
            x="156"
            y="48"
            textAnchor="middle"
            className={`text-[10px] font-mono font-bold ${
              wireAOn
                ? valA
                  ? 'fill-emerald-600 dark:fill-emerald-400'
                  : 'fill-rose-600 dark:fill-rose-400'
                : 'fill-slate-400'
            }`}
          >
            {valA ? '1' : '0'}
          </text>
          {selectedGate !== 'notA' && (
            <text
              x="156"
              y="168"
              textAnchor="middle"
              className={`text-[10px] font-mono font-bold ${
                wireBOn
                  ? valB
                    ? 'fill-emerald-600 dark:fill-emerald-400'
                    : 'fill-rose-600 dark:fill-rose-400'
                  : 'fill-slate-400'
              }`}
            >
              {valB ? '1' : '0'}
            </text>
          )}
          <text
            x="373"
            y="92"
            textAnchor="middle"
            className={`text-[10px] font-mono font-bold ${
              outputWireOn
                ? outputResult
                  ? 'fill-emerald-600 dark:fill-emerald-400'
                  : 'fill-rose-600 dark:fill-rose-400'
                : 'fill-slate-400'
            }`}
          >
            {outputWireOn ? (outputResult ? '1 (True)' : '0 (False)') : 'out'}
          </text>

          {/* Input A Clickable Node */}
          <g onClick={handleToggleA} className="cursor-pointer">
            <rect
              x="12"
              y="30"
              width="92"
              height="48"
              rx="10"
              fill={valA ? '#ecfdf5' : '#fff1f2'}
              stroke={valA ? '#059669' : '#e11d48'}
              strokeWidth={simStep === 1 ? '2.8' : '1.8'}
            />
            <text
              x="58"
              y="49"
              textAnchor="middle"
              className="fill-slate-600 text-[10px] font-semibold"
            >
              Input A
            </text>
            <text
              x="58"
              y="66"
              textAnchor="middle"
              className={`text-[12px] font-mono font-bold ${
                valA ? 'fill-emerald-700' : 'fill-rose-700'
              }`}
            >
              {valA ? 'True (1)' : 'False (0)'}
            </text>
          </g>

          {/* Input B Clickable Node */}
          <g
            onClick={handleToggleB}
            className="cursor-pointer"
            opacity={selectedGate === 'notA' ? 0.45 : 1}
          >
            <rect
              x="12"
              y="128"
              width="92"
              height="48"
              rx="10"
              fill={valB ? '#ecfdf5' : '#fff1f2'}
              stroke={valB ? '#059669' : '#e11d48'}
              strokeWidth={simStep === 2 ? '2.8' : '1.8'}
            />
            <text
              x="58"
              y="147"
              textAnchor="middle"
              className="fill-slate-600 text-[10px] font-semibold"
            >
              {selectedGate === 'notA' ? 'B (Ignored)' : 'Input B'}
            </text>
            <text
              x="58"
              y="164"
              textAnchor="middle"
              className={`text-[12px] font-mono font-bold ${
                valB ? 'fill-emerald-700' : 'fill-rose-700'
              }`}
            >
              {valB ? 'True (1)' : 'False (0)'}
            </text>
          </g>

          {/* Logic Gate Housing + Authentic Symbol */}
          <g>
            <rect
              x="214"
              y="58"
              width="108"
              height="90"
              rx="14"
              fill={gateActive ? '#312e81' : '#1e293b'}
              stroke={gateActive ? '#10b981' : '#475569'}
              strokeWidth={gateActive ? '2.6' : '1.6'}
              filter={gateActive ? `url(#${glowFilterId})` : undefined}
            />

            {/* Gate Symbol */}
            {selectedGate === 'and' && (
              <path
                d="M 246 74 L 268 74 A 22 22 0 0 1 268 118 L 246 118 Z"
                fill="rgba(16,185,129,0.2)"
                stroke="#34d399"
                strokeWidth="2.2"
              />
            )}
            {selectedGate === 'or' && (
              <path
                d="M 244 74 Q 256 96 244 118 Q 274 118 292 96 Q 274 74 244 74 Z"
                fill="rgba(16,185,129,0.2)"
                stroke="#34d399"
                strokeWidth="2.2"
              />
            )}
            {selectedGate === 'xor' && (
              <>
                <path
                  d="M 239 74 Q 251 96 239 118"
                  fill="none"
                  stroke="#34d399"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
                <path
                  d="M 247 74 Q 259 96 247 118 Q 276 118 293 96 Q 276 74 247 74 Z"
                  fill="rgba(16,185,129,0.2)"
                  stroke="#34d399"
                  strokeWidth="2.2"
                />
              </>
            )}
            {selectedGate === 'notA' && (
              <>
                <polygon
                  points="246,74 246,118 282,96"
                  fill="rgba(16,185,129,0.2)"
                  stroke="#34d399"
                  strokeWidth="2.2"
                />
                <circle
                  cx="288"
                  cy="96"
                  r="5"
                  fill="#1e293b"
                  stroke="#34d399"
                  strokeWidth="2.2"
                />
              </>
            )}
            {selectedGate === 'nand' && (
              <>
                <path
                  d="M 242 74 L 262 74 A 22 22 0 0 1 262 118 L 242 118 Z"
                  fill="rgba(99,102,241,0.24)"
                  stroke="#818cf8"
                  strokeWidth="2.2"
                />
                <circle
                  cx="290"
                  cy="96"
                  r="5"
                  fill="#1e293b"
                  stroke="#818cf8"
                  strokeWidth="2.2"
                />
              </>
            )}
            {selectedGate === 'nor' && (
              <>
                <path
                  d="M 240 74 Q 252 96 240 118 Q 268 118 284 96 Q 268 74 240 74 Z"
                  fill="rgba(99,102,241,0.24)"
                  stroke="#818cf8"
                  strokeWidth="2.2"
                />
                <circle
                  cx="291"
                  cy="96"
                  r="5"
                  fill="#1e293b"
                  stroke="#818cf8"
                  strokeWidth="2.2"
                />
              </>
            )}
            {selectedGate === 'xnor' && (
              <>
                <path
                  d="M 235 74 Q 247 96 235 118"
                  fill="none"
                  stroke="#818cf8"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
                <path
                  d="M 243 74 Q 255 96 243 118 Q 270 118 286 96 Q 270 74 243 74 Z"
                  fill="rgba(99,102,241,0.24)"
                  stroke="#818cf8"
                  strokeWidth="2.2"
                />
                <circle
                  cx="293"
                  cy="96"
                  r="5"
                  fill="#1e293b"
                  stroke="#818cf8"
                  strokeWidth="2.2"
                />
              </>
            )}

            <text
              x="268"
              y="138"
              textAnchor="middle"
              className="fill-white text-[11px] font-mono font-bold"
            >
              {activeGateMeta.label} GATE
            </text>
          </g>

          {/* Animated Output Light Bulb */}
          <g>
            {/* Outer warm glow & rays when Output = 1 */}
            {bulbLit && (
              <g>
                <circle cx="468" cy="86" r="54" fill={`url(#${bulbGlowId})`} />
                <line x1="468" y1="22" x2="468" y2="33" stroke="#eab308" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="422" y1="42" x2="430" y2="50" stroke="#eab308" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="514" y1="42" x2="506" y2="50" stroke="#eab308" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="408" y1="84" x2="419" y2="84" stroke="#eab308" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="517" y1="84" x2="528" y2="84" stroke="#eab308" strokeWidth="2.5" strokeLinecap="round" />
              </g>
            )}

            {/* Wire connection into bulb socket */}
            <path
              d="M 424 103 L 448 103 L 456 118"
              fill="none"
              stroke={outputWireOn ? (outputResult ? '#10b981' : '#f43f5e') : 'rgba(148,163,184,0.35)'}
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* Bulb Glass Dome */}
            <path
              d="M 442 84 A 26 26 0 1 1 494 84 C 494 98 482 106 482 118 L 454 118 C 454 106 442 98 442 84 Z"
              fill={bulbLit ? '#fef08a' : '#e2e8f0'}
              stroke={bulbLit ? '#ca8a04' : '#64748b'}
              strokeWidth="2.2"
            />

            {/* Inner Filament */}
            <path
              d="M 461 118 L 461 92 L 465 86 L 468 92 L 471 86 L 475 92 L 475 118"
              fill="none"
              stroke={bulbLit ? '#d97706' : '#64748b'}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Screw Base */}
            <rect x="454" y="118" width="28" height="14" rx="3" fill="#475569" />
            <line x1="454" y1="123" x2="482" y2="123" stroke="#94a3b8" strokeWidth="1.5" />
            <line x1="454" y1="128" x2="482" y2="128" stroke="#94a3b8" strokeWidth="1.5" />

            {/* Bulb State Label */}
            <text
              x="468"
              y="150"
              textAnchor="middle"
              className={`text-[11px] font-mono font-bold ${
                bulbLit
                  ? 'fill-amber-600 dark:fill-amber-400'
                  : simStep >= 4
                    ? 'fill-rose-600 dark:fill-rose-400'
                    : 'fill-slate-500 dark:fill-slate-400'
              }`}
            >
              {bulbLit ? 'ON · 1' : simStep >= 4 ? 'OFF · 0' : 'BULB'}
            </text>
          </g>
        </svg>

        {/* Step Controls + Speed Slider */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={handlePlayToggle}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              {isPlaying ? 'Pause' : simStep >= 4 ? 'Replay' : 'Play'}
            </button>

            <button
              type="button"
              onClick={handleNextStep}
              disabled={simStep >= 4}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <SkipForward className="w-3.5 h-3.5" />
              Next Step
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>

          {/* Speed Slider */}
          <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
            <span className="font-medium whitespace-nowrap">Speed:</span>
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.25"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              aria-label="Simulation speed"
              className="w-24 accent-emerald-600 cursor-pointer"
            />
            <span className="font-mono font-semibold tabular-nums w-10 text-right text-emerald-700 dark:text-emerald-400">
              {speed.toFixed(2).replace(/\.00$/, '')}x
            </span>
          </label>
        </div>
      </div>

      {/* 4. Python Line Trace & Output Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Highlighted Python Code Trace */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0B0F17] overflow-hidden">
          <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800/80 bg-emerald-50/60 dark:bg-[#0F1522] flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              Python Line Execution
            </span>
            <span className="font-mono text-[11px] text-emerald-700 dark:text-emerald-400 tabular-nums">
              {activePythonLine ? `Line ${activePythonLine} Active` : 'Idle'}
            </span>
          </div>
          <div className="p-2 font-mono text-xs leading-6">
            {pythonLines.map((lineText, idx) => {
              const lineNum = idx + 1;
              const isActive = activePythonLine === lineNum;
              return (
                <div
                  key={lineNum}
                  className={`flex items-center gap-2.5 px-2 py-0.5 rounded-md transition-colors ${
                    isActive
                      ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-950 dark:text-emerald-200 font-semibold'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span
                    className={`w-4 text-right tabular-nums select-none ${
                      isActive
                        ? 'text-emerald-700 dark:text-emerald-300'
                        : 'text-slate-400 dark:text-slate-600'
                    }`}
                  >
                    {lineNum}
                  </span>
                  <span className="truncate">{lineText}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Explanation & Output Panel */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0B0F17] p-3 flex flex-col justify-between gap-2.5">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                Output Panel
              </span>
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                Step {simStep} of 4
              </span>
            </div>
            <div className="mt-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              {currentStepInfo.title}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
              {currentStepInfo.detail}
            </p>
          </div>

          <div
            className={`rounded-lg border px-3 py-2 font-mono text-xs flex items-center justify-between ${
              simStep >= 4
                ? outputResult
                  ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-500/40 dark:bg-emerald-500/15 text-emerald-900 dark:text-emerald-200'
                  : 'border-rose-300 bg-rose-50 dark:border-rose-500/40 dark:bg-rose-500/15 text-rose-900 dark:text-rose-200'
                : 'border-slate-200 dark:border-slate-800 bg-[#F8FAFC] dark:bg-[#111827] text-slate-500 dark:text-slate-400'
            }`}
          >
            <span>
              {simStep >= 4
                ? `>>> Output: ${outputResult ? 'True' : 'False'}`
                : '>>> Waiting for Step 4...'}
            </span>
            <span className="inline-flex items-center gap-1 font-semibold">
              <Lightbulb className="w-3.5 h-3.5" />
              {simStep >= 4 ? (outputResult ? '1 (ON)' : '0 (OFF)') : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* 5. Matching Truth Table + State Space Graph Relation */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 items-start">
        {/* Interactive Truth Table */}
        <div className="xl:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0B0F17] overflow-x-auto">
          <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs bg-emerald-50/50 dark:bg-[#0F1522]">
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              Truth Table (Click any row)
            </span>
            <span className="font-mono text-[11px] text-emerald-700 dark:text-emerald-400">
              Active: {activeGateMeta.label}
            </span>
          </div>
          <table className="w-full text-left font-mono text-xs tabular-nums">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800/80 text-slate-600 dark:text-slate-400">
                <th className="py-2 px-2 font-semibold">A</th>
                <th className="py-2 px-2 font-semibold">B</th>
                {(['notA', 'and', 'or', 'xor', 'nand', 'nor', 'xnor'] as GateType[]).map((gateId) => {
                  const colLabel = GATE_OPTIONS.find((g) => g.id === gateId)?.label ?? gateId;
                  return (
                    <th
                      key={gateId}
                      onClick={() => handleSelectGate(gateId)}
                      className={`py-2 px-2 font-semibold cursor-pointer whitespace-nowrap ${
                        selectedGate === gateId
                          ? 'text-emerald-700 dark:text-emerald-300 underline'
                          : 'hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      {colLabel}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {TRUTH_ROWS.map((row) => {
                const rowKey = `${row.a}-${row.b}`;
                const isMatchedRow = rowKey === activeKey;
                const isEvaluatedMatch = isMatchedRow && simStep >= 3;
                const isHovered = rowKey === hoveredKey;
                const colGates: GateType[] = ['notA', 'and', 'or', 'xor', 'nand', 'nor', 'xnor'];

                return (
                  <tr
                    key={rowKey}
                    onMouseEnter={() => setHoveredKey(rowKey)}
                    onMouseLeave={() => setHoveredKey(null)}
                    onClick={() => handleSelectTruthRow(row.a, row.b)}
                    className={`border-b last:border-b-0 border-slate-100 dark:border-slate-800/50 cursor-pointer transition-colors ${
                      isEvaluatedMatch
                        ? 'bg-emerald-100/95 dark:bg-emerald-500/25 ring-1 ring-inset ring-emerald-500'
                        : isMatchedRow
                          ? 'bg-emerald-50/90 dark:bg-emerald-500/12'
                          : isHovered
                            ? 'bg-sky-50/70 dark:bg-sky-500/10'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <td
                      className={`py-2 px-2 whitespace-nowrap ${
                        row.a ? 'text-slate-900 dark:text-slate-100 font-semibold' : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {row.a ? 'T (1)' : 'F (0)'}
                    </td>
                    <td
                      className={`py-2 px-2 whitespace-nowrap ${
                        row.b ? 'text-slate-900 dark:text-slate-100 font-semibold' : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {row.b ? 'T (1)' : 'F (0)'}
                    </td>
                    {colGates.map((gateId) => {
                      const val = evaluateGate(gateId, row.a, row.b);
                      return (
                        <td
                          key={gateId}
                          className={`py-2 px-2 font-semibold ${
                            selectedGate === gateId ? 'bg-emerald-50/60 dark:bg-emerald-500/10 ' : ''
                          }${val ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}
                        >
                          {val ? '1' : '0'}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Graph Relation */}
        <div className="xl:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-[#F8FAFC] dark:bg-[#0B0F17] p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              State Graph Relation
            </span>
            <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
              {truePct}% True
            </span>
          </div>

          <svg
            viewBox="0 0 280 152"
            className="w-full h-auto select-none"
            role="img"
            aria-label="Boolean state graph relation"
          >
            <text x="140" y="146" textAnchor="middle" className="fill-slate-500 text-[9px] font-mono">
              A: False (left) ↔ True (right)
            </text>
            <line x1="75" y1="42" x2="205" y2="42" stroke="rgba(100,116,139,0.35)" strokeWidth="1.8" />
            <line x1="75" y1="122" x2="205" y2="122" stroke="rgba(100,116,139,0.35)" strokeWidth="1.8" />
            <line x1="75" y1="42" x2="75" y2="122" stroke="rgba(100,116,139,0.35)" strokeWidth="1.8" />
            <line x1="205" y1="42" x2="205" y2="122" stroke="rgba(100,116,139,0.35)" strokeWidth="1.8" />

            {graphNodes.map((node) => {
              const key = `${node.a}-${node.b}`;
              const out = evaluateGate(selectedGate, node.a, node.b);
              const isSelected = key === activeKey;
              const isHovered = key === hoveredKey;
              return (
                <g
                  key={key}
                  onMouseEnter={() => setHoveredKey(key)}
                  onMouseLeave={() => setHoveredKey(null)}
                  onClick={() => handleSelectTruthRow(node.a, node.b)}
                  className="cursor-pointer"
                >
                  {(isSelected || isHovered) && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={24}
                      fill="none"
                      stroke={isSelected ? '#059669' : '#0ea5e9'}
                      strokeWidth={2.2}
                    />
                  )}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={19}
                    fill={out ? '#059669' : '#e11d48'}
                  />
                  <text
                    x={node.x}
                    y={node.y - 2}
                    textAnchor="middle"
                    className="fill-white text-[9px] font-mono font-semibold"
                  >
                    {node.label}
                  </text>
                  <text
                    x={node.x}
                    y={node.y + 9}
                    textAnchor="middle"
                    className="fill-white text-[9px] font-mono font-bold"
                  >
                    {out ? '1' : '0'}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* 6. Interactive Random Boolean Truth Table Quiz */}
      <div className="rounded-xl border border-emerald-200/90 dark:border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-500/10 p-3.5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-900 dark:text-emerald-200">
            <HelpCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Boolean Logic Quiz</span>
          </div>

          {/* Score & Streak Tracker (Zero-pill unboxed typography) */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono tabular-nums text-slate-700 dark:text-slate-300">
            <span className="font-semibold text-emerald-800 dark:text-emerald-300">
              Score: {correctCount} / {attemptsCount}
              {attemptsCount > 0
                ? ` (${Math.round((correctCount / attemptsCount) * 100)}%)`
                : ''}
            </span>
            <span aria-hidden="true" className="text-slate-400">·</span>
            <span>Streak: {streak}</span>
            {bestStreak > 0 && (
              <>
                <span aria-hidden="true" className="text-slate-400">·</span>
                <span>Best: {bestStreak}</span>
              </>
            )}
          </div>
        </div>

        {/* Gate Practice Filter + Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1 p-0.5 rounded-lg bg-white/90 dark:bg-[#0B0F17] border border-emerald-200/80 dark:border-slate-800">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'and', label: 'AND' },
                { id: 'or', label: 'OR' },
                { id: 'notA', label: 'NOT' },
                { id: 'xor', label: 'XOR' },
                { id: 'nand', label: 'NAND' },
                { id: 'nor', label: 'NOR' },
                { id: 'xnor', label: 'XNOR' },
              ] as { id: QuizFilter; label: string }[]
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setQuizFilter(opt.id);
                  handleNextRandomProblem(opt.id);
                }}
                className={`px-2 py-1 text-[11px] font-mono font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  quizFilter === opt.id
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleTestQuestionInSim}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-md bg-white dark:bg-[#0B0F17] border border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Play className="w-3 h-3 fill-current" />
              Verify in Simulator
            </button>
            <button
              type="button"
              onClick={() => handleNextRandomProblem()}
              title="Generate a new random truth table problem"
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-md bg-white dark:bg-[#0B0F17] border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Shuffle className="w-3 h-3" />
              New Problem
            </button>
            {attemptsCount > 0 && (
              <button
                type="button"
                onClick={handleResetQuizStats}
                title="Reset quiz score"
                aria-label="Reset quiz score"
                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-md bg-white dark:bg-[#0B0F17] border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Generated Truth Table Question */}
        <div className="space-y-1">
          <div className="text-[11px] font-mono text-slate-600 dark:text-slate-400">
            Input A: {formatBoolWord(quizProblem.a)} ({quizProblem.a ? '1' : '0'})
            {quizProblem.gate !== 'notA' && (
              <>
                {' · '}Input B: {formatBoolWord(quizProblem.b)} ({quizProblem.b ? '1' : '0'})
              </>
            )}
            {' · '}Gate: {GATE_OPTIONS.find((g) => g.id === quizProblem.gate)?.label}
          </div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            {quizProblem.prompt}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {[true, false].map((choice) => {
            const picked = selectedAnswer === choice;
            const isCorrectChoice = choice === quizProblem.correctAnswer;
            let btnClass =
              'border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B0F17] text-slate-800 dark:text-slate-200 hover:border-emerald-400 cursor-pointer';

            if (selectedAnswer !== null) {
              if (isCorrectChoice) {
                btnClass = 'border-emerald-500 bg-emerald-600 text-white cursor-default';
              } else if (picked) {
                btnClass = 'border-rose-500 bg-rose-600 text-white cursor-default';
              } else {
                btnClass =
                  'border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-[#0B0F17]/60 text-slate-400 cursor-default';
              }
            }

            return (
              <button
                key={String(choice)}
                type="button"
                disabled={selectedAnswer !== null}
                onClick={() => handleSelectQuizAnswer(choice)}
                className={`px-3 py-2 rounded-lg border text-xs font-mono font-semibold transition-colors ${btnClass}`}
              >
                {choice ? 'True (1)' : 'False (0)'}
              </button>
            );
          })}
        </div>

        {selectedAnswer !== null && (
          <div className="flex flex-wrap items-start justify-between gap-2 pt-1 text-xs">
            <div className="flex items-start gap-1.5 flex-1 min-w-[200px]">
              {selectedAnswer === quizProblem.correctAnswer ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              )}
              <span className="text-slate-700 dark:text-slate-200 leading-relaxed">
                <strong className="font-semibold">
                  {selectedAnswer === quizProblem.correctAnswer ? 'Correct! ' : 'Not quite. '}
                </strong>
                {quizProblem.explanation}
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleNextRandomProblem()}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold whitespace-nowrap shrink-0 cursor-pointer"
            >
              Next Problem
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
