import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { SlidersHorizontal } from 'lucide-react';
import type { ExecutionStep, PythonAnalysisResult } from '../engine/pythonAnalyzer';

interface ExecutionGraphsPanelProps {
  code: string;
  analysis: PythonAnalysisResult;
  activeStepIndex: number;
  isStepping: boolean;
  onSelectStep: (stepIndex: number) => void;
  onUpdateNumericVar?: (varName: string, nextValue: number) => void;
}

const SERIES_COLORS = ['#059669', '#0284C7', '#D97706', '#7C3AED'];

function extractEditableNumericVar(code: string): { name: string; value: number; lineIdx: number } | null {
  const lines = code.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    const match = trimmed.match(/^([A-Za-z_]\w*)\s*=\s*(-?\d+(?:\.\d+)?)$/);
    if (match && !lines[i].startsWith(' ') && !lines[i].startsWith('\t')) {
      return { name: match[1], value: Number(match[2]), lineIdx: i };
    }
  }
  return null;
}

export function replaceNumericVarInCode(code: string, varName: string, nextValue: number): string {
  const lines = code.split('\n');
  const pattern = new RegExp(`^(\\s*${varName}\\s*=\\s*)(-?\\d+(?:\\.\\d+)?)(.*)$`);
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(pattern);
    if (m) {
      lines[i] = `${m[1]}${nextValue}${m[3]}`;
      break;
    }
  }
  return lines.join('\n');
}

export function ExecutionGraphsPanel({
  code,
  analysis,
  activeStepIndex,
  isStepping,
  onSelectStep,
  onUpdateNumericVar,
}: ExecutionGraphsPanelProps) {
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);
  const [hiddenSeries, setHiddenSeries] = useState<string[]>([]);

  const editableVar = useMemo(() => extractEditableNumericVar(code), [code]);

  const { seriesNames, stepPoints, minVal, maxVal } = useMemo(() => {
    const namesSet = new Set<string>();
    const points: { step: ExecutionStep; values: Record<string, number> }[] = [];

    for (const step of analysis.steps) {
      const numericMap: Record<string, number> = {};
      for (const [k, raw] of Object.entries(step.variables)) {
        if (/^-?\d+(\.\d+)?$/.test(raw)) {
          numericMap[k] = Number(raw);
          namesSet.add(k);
        }
      }
      points.push({ step, values: numericMap });
    }

    const names = Array.from(namesSet).slice(0, 4);
    let min = Infinity;
    let max = -Infinity;
    for (const pt of points) {
      for (const name of names) {
        if (!hiddenSeries.includes(name) && name in pt.values) {
          min = Math.min(min, pt.values[name]);
          max = Math.max(max, pt.values[name]);
        }
      }
    }

    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      min = 0;
      max = 10;
    } else if (min === max) {
      min = min - 5;
      max = max + 5;
    }

    return { seriesNames: names, stepPoints: points, minVal: min, maxVal: max };
  }, [analysis.steps, hiddenSeries]);

  const conceptCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of analysis.detectedConcepts) {
      counts.set(c.category, (counts.get(c.category) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
  }, [analysis.detectedConcepts]);

  const branchSummary = useMemo(() => {
    let trueCount = 0;
    let falseCount = 0;
    for (const step of analysis.steps) {
      if (step.conditionResult === true) trueCount++;
      else if (step.conditionResult === false) falseCount++;
    }
    return { trueCount, falseCount, total: trueCount + falseCount };
  }, [analysis.steps]);

  const totalSteps = analysis.steps.length;
  const focusedStepIdx =
    hoveredStep !== null
      ? hoveredStep
      : isStepping
        ? Math.min(activeStepIndex, Math.max(0, totalSteps - 1))
        : Math.max(0, totalSteps - 1);

  const focusedStep = analysis.steps[focusedStepIdx] ?? null;

  const width = 520;
  const height = 180;
  const padLeft = 40;
  const padRight = 18;
  const padTop = 16;
  const padBottom = 24;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const getX = (idx: number) => {
    if (totalSteps <= 1) return padLeft + plotW / 2;
    return padLeft + (idx / (totalSteps - 1)) * plotW;
  };

  const getY = (val: number) => {
    const ratio = (val - minVal) / (maxVal - minVal || 1);
    return padTop + plotH - ratio * plotH;
  };

  const toggleSeries = (name: string) => {
    setHiddenSeries((prev) =>
      prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name],
    );
  };

  const maxConceptCount = Math.max(1, ...conceptCounts.map((c) => c.count));

  return (
    <div className="flex flex-col gap-4">
      {/* Interactive Variable Tweak Slider */}
      {editableVar && onUpdateNumericVar && (
        <div className="rounded-xl border border-emerald-200 dark:border-slate-800/80 bg-emerald-50/60 dark:bg-[#0B0F17] p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-800 dark:text-slate-200">
              <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600 dark:text-[#FFD43B]" />
              <label htmlFor="what-if-slider">
                Try changing <code className="font-mono text-emerald-700 dark:text-[#7CC4FF]">{editableVar.name}</code>:
              </label>
            </div>
            <span className="font-mono text-xs font-semibold text-emerald-700 dark:text-[#FFD43B] tabular-nums">
              {editableVar.name} = {editableVar.value}
            </span>
          </div>
          <input
            id="what-if-slider"
            type="range"
            min={Math.min(0, editableVar.value - 20)}
            max={Math.max(100, editableVar.value + 30)}
            step={Number.isInteger(editableVar.value) ? 1 : 0.5}
            value={editableVar.value}
            onChange={(e) => onUpdateNumericVar(editableVar.name, Number(e.target.value))}
            className="w-full accent-emerald-600 dark:accent-[#FFD43B] cursor-pointer"
          />
        </div>
      )}

      {/* 1. Variable Trajectory Line Graph */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-[#F8FAFC] dark:bg-[#0B0F17] p-3.5 flex flex-col gap-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-200">
              How Variable Values Change Over Steps
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Click any dot on the chart to jump the editor to that exact step.
            </p>
          </div>
          {seriesNames.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {seriesNames.map((name, idx) => {
                const color = SERIES_COLORS[idx % SERIES_COLORS.length];
                const isHidden = hiddenSeries.includes(name);
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => toggleSeries(name)}
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono border transition-opacity cursor-pointer ${
                      isHidden
                        ? 'opacity-40 border-slate-200 dark:border-slate-800 text-slate-400'
                        : 'border-slate-300 dark:border-slate-700/80 text-slate-800 dark:text-slate-200 bg-white dark:bg-[#111827]'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                    {name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {totalSteps === 0 || seriesNames.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500 font-mono">
            {totalSteps === 0
              ? 'Fix syntax errors or add statements to plot execution steps.'
              : 'Add numeric variables (e.g. count = 0, total += n) to plot value changes over time.'}
          </div>
        ) : (
          <>
            <div className="w-full overflow-x-auto">
              <svg
                viewBox={`0 0 ${width} ${height}`}
                className="w-full h-auto min-w-[320px] select-none"
                role="img"
                aria-label="Variable values plotted across execution steps"
              >
                {[0, 0.5, 1].map((t) => {
                  const yVal = minVal + t * (maxVal - minVal);
                  const yPos = getY(yVal);
                  return (
                    <g key={t}>
                      <line
                        x1={padLeft}
                        x2={width - padRight}
                        y1={yPos}
                        y2={yPos}
                        stroke="rgba(100,116,139,0.22)"
                        strokeDasharray="3 3"
                      />
                      <text
                        x={padLeft - 6}
                        y={yPos + 3.5}
                        textAnchor="end"
                        className="fill-slate-500 text-[10px] font-mono"
                      >
                        {Number.isInteger(yVal) ? yVal : yVal.toFixed(1)}
                      </text>
                    </g>
                  );
                })}

                {focusedStepIdx < totalSteps && (
                  <line
                    x1={getX(focusedStepIdx)}
                    x2={getX(focusedStepIdx)}
                    y1={padTop}
                    y2={height - padBottom}
                    stroke="#059669"
                    strokeOpacity={0.45}
                    strokeWidth={1.5}
                  />
                )}

                {seriesNames.map((name, sIdx) => {
                  if (hiddenSeries.includes(name)) return null;
                  const color = SERIES_COLORS[sIdx % SERIES_COLORS.length];
                  const validPts = stepPoints
                    .map((pt, idx) => ({ idx, val: pt.values[name] }))
                    .filter((item) => item.val !== undefined);

                  if (validPts.length === 0) return null;

                  const polylinePoints = validPts
                    .map((item) => `${getX(item.idx)},${getY(item.val)}`)
                    .join(' ');

                  return (
                    <g key={name}>
                      {validPts.length > 1 && (
                        <polyline
                          fill="none"
                          stroke={color}
                          strokeWidth={2.2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={polylinePoints}
                        />
                      )}
                      {validPts.map((item) => {
                        const isSelected = item.idx === focusedStepIdx;
                        return (
                          <circle
                            key={`${name}-${item.idx}`}
                            cx={getX(item.idx)}
                            cy={getY(item.val)}
                            r={isSelected ? 5 : 3.5}
                            fill={isSelected ? '#FFFFFF' : color}
                            stroke={color}
                            strokeWidth={isSelected ? 2.5 : 1.5}
                            className="cursor-pointer"
                            onMouseEnter={() => setHoveredStep(item.idx)}
                            onMouseLeave={() => setHoveredStep(null)}
                            onClick={() => onSelectStep(item.idx)}
                          />
                        );
                      })}
                    </g>
                  );
                })}

                {stepPoints.map((_, idx) => {
                  if (
                    totalSteps > 10 &&
                    idx !== 0 &&
                    idx !== totalSteps - 1 &&
                    idx % Math.ceil(totalSteps / 6) !== 0
                  ) {
                    return null;
                  }
                  return (
                    <text
                      key={idx}
                      x={getX(idx)}
                      y={height - 6}
                      textAnchor="middle"
                      className="fill-slate-500 text-[10px] font-mono"
                    >
                      S{idx + 1}
                    </text>
                  );
                })}
              </svg>
            </div>

            <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-200 dark:border-slate-800/70">
              <div className="text-[11px] font-mono text-slate-600 dark:text-slate-400 tabular-nums">
                {focusedStep
                  ? `Step ${focusedStep.stepIndex + 1} · Line ${focusedStep.line}: ${focusedStep.description}`
                  : 'Scrub execution timeline'}
              </div>
              {totalSteps > 1 && (
                <input
                  type="range"
                  min={0}
                  max={totalSteps - 1}
                  value={focusedStepIdx}
                  onChange={(e) => onSelectStep(Number(e.target.value))}
                  aria-label="Scrub execution steps"
                  className="w-full accent-emerald-600 dark:accent-emerald-400 cursor-pointer"
                />
              )}
            </div>
          </>
        )}
      </div>

      {/* 2. Concept Distribution & Branch Outcome Graphs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-[#F8FAFC] dark:bg-[#0B0F17] p-3.5 flex flex-col gap-2.5">
          <div className="text-xs font-semibold text-slate-900 dark:text-slate-200">
            Detected Pattern Mix
          </div>
          {conceptCounts.length === 0 ? (
            <p className="text-xs text-slate-500">No patterns detected yet.</p>
          ) : (
            <div className="space-y-2">
              {conceptCounts.slice(0, 5).map((item) => (
                <div key={item.category} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-700 dark:text-slate-300 truncate">{item.category}</span>
                    <span className="font-mono font-semibold text-emerald-700 dark:text-[#7CC4FF] tabular-nums">
                      {item.count}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800/80 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.count / maxConceptCount) * 100}%` }}
                      transition={{ duration: 0.22 }}
                      className="h-full bg-emerald-600 dark:bg-emerald-500 rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-[#F8FAFC] dark:bg-[#0B0F17] p-3.5 flex flex-col gap-2.5">
          <div className="text-xs font-semibold text-slate-900 dark:text-slate-200">
            Condition Results (True vs False)
          </div>
          {branchSummary.total === 0 ? (
            <p className="text-xs text-slate-500">
              No condition checks ran yet. Add an if or while loop to chart True vs False checks.
            </p>
          ) : (
            <div className="flex flex-col gap-2.5">
              <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden flex">
                <div
                  className="bg-emerald-600 h-full transition-all duration-300"
                  style={{ width: `${(branchSummary.trueCount / branchSummary.total) * 100}%` }}
                />
                <div
                  className="bg-rose-500 h-full transition-all duration-300"
                  style={{ width: `${(branchSummary.falseCount / branchSummary.total) * 100}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 font-mono text-xs tabular-nums">
                <div className="rounded-lg border border-emerald-300 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 p-2.5">
                  <div className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold">True</div>
                  <div className="text-base font-semibold text-slate-900 dark:text-white mt-0.5">
                    {branchSummary.trueCount}
                  </div>
                </div>
                <div className="rounded-lg border border-rose-300 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 p-2.5">
                  <div className="text-[11px] text-rose-700 dark:text-rose-300 font-semibold">False</div>
                  <div className="text-base font-semibold text-slate-900 dark:text-white mt-0.5">
                    {branchSummary.falseCount}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
