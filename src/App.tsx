import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Menu,
  X,
  Users,
  Home,
  ListOrdered,
  Cpu,
  ShieldCheck,
  BookOpen,
  CheckSquare,
  Terminal,
  Sun,
  Moon,
  Palette,
  MousePointerClick,
  MessageSquare,
  type LucideIcon,
} from 'lucide-react';
import { motion } from 'motion/react';
import { DETECTOR_PRESETS } from './data/curriculum';
import { analyzePythonCode, type SyntaxIssue } from './engine/pythonAnalyzer';
import { useRealtimeCollab } from './hooks/useRealtimeCollab';
import { HomeView, type AppRoute } from './components/HomeView';
import { StepsToUseView } from './components/StepsToUseView';
import { SandboxView } from './components/SandboxView';
import { CodeEditorPanel } from './components/CodeEditorPanel';
import { SmartExplanationPanel } from './components/SmartExplanationPanel';
import { ConditionFlowchart } from './components/ConditionFlowchart';
import { LogicGateSimulator } from './components/LogicGateSimulator';
import { ExecutionGraphsPanel, replaceNumericVarInCode } from './components/ExecutionGraphsPanel';
import { SyntaxCheckerView } from './components/SyntaxCheckerView';
import { LearningView } from './components/LearningView';
import { PracticeView } from './components/PracticeView';
import { CollabDrawer } from './components/CollabDrawer';
import { BackToTopButton } from './components/BackToTopButton';
import { InteractiveBackground, type BgPalette } from './components/InteractiveBackground';
import { CodeBuddyChat } from './components/CodeBuddyChat';

interface SidebarItem {
  id: AppRoute;
  label: string;
  icon: LucideIcon;
  iconColor: string;
  activeClass: string;
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  {
    id: 'home',
    label: 'Home',
    icon: Home,
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    activeClass:
      'bg-emerald-50/95 dark:bg-emerald-500/15 text-emerald-900 dark:text-white border-emerald-200 dark:border-emerald-500/40',
  },
  {
    id: 'steps',
    label: 'Steps to Use',
    icon: ListOrdered,
    iconColor: 'text-sky-600 dark:text-sky-400',
    activeClass:
      'bg-sky-50/95 dark:bg-sky-500/15 text-sky-900 dark:text-white border-sky-200 dark:border-sky-500/40',
  },
  {
    id: 'sandbox',
    label: 'Sandbox',
    icon: Terminal,
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    activeClass:
      'bg-indigo-50/95 dark:bg-indigo-500/15 text-indigo-900 dark:text-white border-indigo-200 dark:border-indigo-500/40',
  },
  {
    id: 'detector',
    label: 'Logic Detector',
    icon: Cpu,
    iconColor: 'text-teal-600 dark:text-teal-400',
    activeClass:
      'bg-teal-50/95 dark:bg-teal-500/15 text-teal-900 dark:text-white border-teal-200 dark:border-teal-500/40',
  },
  {
    id: 'syntax',
    label: 'Syntax Checker',
    icon: ShieldCheck,
    iconColor: 'text-amber-600 dark:text-amber-400',
    activeClass:
      'bg-amber-50/95 dark:bg-amber-500/15 text-amber-900 dark:text-white border-amber-200 dark:border-amber-500/40',
  },
  {
    id: 'learning',
    label: 'Learning',
    icon: BookOpen,
    iconColor: 'text-blue-600 dark:text-blue-400',
    activeClass:
      'bg-blue-50/95 dark:bg-blue-500/15 text-blue-900 dark:text-white border-blue-200 dark:border-blue-500/40',
  },
  {
    id: 'practice',
    label: 'Practice',
    icon: CheckSquare,
    iconColor: 'text-rose-600 dark:text-rose-400',
    activeClass:
      'bg-rose-50/95 dark:bg-rose-500/15 text-rose-900 dark:text-white border-rose-200 dark:border-rose-500/40',
  },
];

const BG_PALETTE_OPTIONS: { id: BgPalette; label: string; swatchClass: string }[] = [
  {
    id: 'prism',
    label: 'Prism',
    swatchClass: 'bg-gradient-to-br from-emerald-500 via-sky-500 to-rose-500',
  },
  {
    id: 'meadow',
    label: 'Mint',
    swatchClass: 'bg-gradient-to-br from-emerald-500 to-lime-500',
  },
  {
    id: 'ocean',
    label: 'Ocean',
    swatchClass: 'bg-gradient-to-br from-sky-500 to-indigo-500',
  },
  {
    id: 'sunset',
    label: 'Sunset',
    swatchClass: 'bg-gradient-to-br from-amber-500 to-rose-500',
  },
];

export default function App() {
  const [route, setRoute] = useState<AppRoute>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      return window.localStorage.getItem('pylogic-theme') === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });
  const [bgPalette, setBgPalette] = useState<BgPalette>(() => {
    try {
      const saved = window.localStorage.getItem('pylogic-bg-palette');
      if (saved === 'meadow' || saved === 'ocean' || saved === 'sunset' || saved === 'prism') {
        return saved;
      }
    } catch {
      // Ignore storage failures
    }
    return 'prism';
  });
  const [interactiveBg, setInteractiveBg] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem('pylogic-bg-interactive') !== 'false';
    } catch {
      return true;
    }
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try {
      window.localStorage.setItem('pylogic-theme', theme);
    } catch {
      // Ignore storage failures in restricted contexts
    }
  }, [theme]);

  useEffect(() => {
    try {
      window.localStorage.setItem('pylogic-bg-palette', bgPalette);
    } catch {
      // Ignore storage failures
    }
  }, [bgPalette]);

  useEffect(() => {
    try {
      window.localStorage.setItem('pylogic-bg-interactive', String(interactiveBg));
    } catch {
      // Ignore storage failures
    }
  }, [interactiveBg]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const [code, setCode] = useState<string>(DETECTOR_PRESETS[0].code);
  const [sampleInput, setSampleInput] = useState<string>('18, Alex');

  // Interactive simulator state
  const [isStepping, setIsStepping] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [speed, setSpeed] = useState<number>(1);
  const [hasRun, setHasRun] = useState(true);
  const [runCount, setRunCount] = useState(1);

  // Right-hand detector workspace tab
  const [detectorTab, setDetectorTab] = useState<'explanation' | 'flow' | 'graphs' | 'boolean'>('explanation');
  const [gateActiveLine, setGateActiveLine] = useState<number | null>(null);

  // Learning progress
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<string>('syntax');

  // Real-time collaboration & leaderboard
  const isRemoteUpdateRef = useRef(false);
  const handleRemoteCode = useCallback((remoteCode: string) => {
    isRemoteUpdateRef.current = true;
    setCode(remoteCode);
    setIsPlaying(false);
    setIsStepping(false);
    setCurrentStepIndex(0);
  }, []);

  const collab = useRealtimeCollab({ onRemoteCode: handleRemoteCode });

  const handleCodeChange = useCallback(
    (nextCode: string) => {
      setCode(nextCode);
      setIsPlaying(false);
      setIsStepping(false);
      setHasRun(false);
      setCurrentStepIndex(0);
      if (isRemoteUpdateRef.current) {
        isRemoteUpdateRef.current = false;
        return;
      }
      collab.sendCodeUpdate(nextCode);
    },
    [collab],
  );

  const sampleInputsList = useMemo(
    () =>
      sampleInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    [sampleInput],
  );

  const analysis = useMemo(
    () => analyzePythonCode(code, sampleInputsList),
    [code, sampleInputsList],
  );

  const errorLines = useMemo(
    () => analysis.syntaxIssues.map((i) => i.line),
    [analysis.syntaxIssues],
  );

  const activeStep = useMemo(() => {
    if (!isStepping || analysis.steps.length === 0) return null;
    const clamped = Math.min(currentStepIndex, analysis.steps.length - 1);
    return analysis.steps[clamped] ?? null;
  }, [isStepping, analysis.steps, currentStepIndex]);

  // Playback timer
  useEffect(() => {
    if (!isPlaying || analysis.steps.length === 0) return;
    const intervalMs = Math.round(900 / speed);
    const timer = window.setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev >= analysis.steps.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [isPlaying, speed, analysis.steps.length]);

  const handleRun = () => {
    setIsPlaying(false);
    setHasRun(true);
    setRunCount((c) => c + 1);
    if (analysis.steps.length > 0) {
      setIsStepping(true);
      setCurrentStepIndex(analysis.steps.length - 1);
    } else {
      setIsStepping(false);
      setCurrentStepIndex(0);
    }
  };

  const handleTryExample = () => {
    const currentIdx = DETECTOR_PRESETS.findIndex((p) => p.code.trim() === code.trim());
    const nextPreset = DETECTOR_PRESETS[(currentIdx + 1) % DETECTOR_PRESETS.length];
    handleCodeChange(nextPreset.code);
    const nextAnalysis = analyzePythonCode(nextPreset.code, sampleInputsList);
    setHasRun(true);
    setRunCount((c) => c + 1);
    if (nextAnalysis.steps.length > 0) {
      setIsStepping(true);
      setCurrentStepIndex(nextAnalysis.steps.length - 1);
    }
  };

  const handleStepMode = () => {
    setIsPlaying(false);
    setHasRun(true);
    setIsStepping(true);
    setCurrentStepIndex(0);
  };

  const handleNextStep = () => {
    if (analysis.steps.length === 0) return;
    setIsPlaying(false);
    setHasRun(true);
    if (!isStepping) {
      setIsStepping(true);
      setCurrentStepIndex(0);
      return;
    }
    setCurrentStepIndex((prev) => Math.min(analysis.steps.length - 1, prev + 1));
  };

  const handleReset = () => {
    setIsPlaying(false);
    setIsStepping(false);
    setHasRun(false);
    setCurrentStepIndex(0);
  };

  const handleTogglePlay = () => {
    if (analysis.steps.length === 0) return;
    setHasRun(true);
    if (!isStepping) {
      setIsStepping(true);
      setCurrentStepIndex(0);
      setIsPlaying(true);
      return;
    }
    if (currentStepIndex >= analysis.steps.length - 1) {
      setCurrentStepIndex(0);
      setIsPlaying(true);
      return;
    }
    setIsPlaying((p) => !p);
  };

  const handleApplyFix = (issue: SyntaxIssue) => {
    handleCodeChange(issue.fixedFullCode);
    collab.submitScore({ syntaxFixedDelta: 1 });
  };

  const handleCompleteLesson = (lessonId: string) => {
    setCompletedLessons((prev) => {
      if (prev.includes(lessonId)) return prev;
      const next = [...prev, lessonId];
      collab.submitScore({ lessonsCompleted: next.length });
      return next;
    });
  };

  const handleLoadInDetector = (snippet: string) => {
    handleCodeChange(snippet);
    setRoute('detector');
    setDetectorTab('explanation');
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const navigate = (nextRoute: AppRoute) => {
    setRoute(nextRoute);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  return (
    <div className="min-h-screen flex flex-col relative text-slate-900 dark:text-slate-100">
      <InteractiveBackground
        theme={theme}
        palette={bgPalette}
        interactive={interactiveBg}
      />

      {/* Interactive Top Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-slate-200/90 dark:border-slate-800/80 bg-white/90 dark:bg-[#0B0F17]/90">
        <div
          aria-hidden="true"
          className="h-[2px] w-full bg-gradient-to-r from-emerald-500 via-sky-500 via-amber-400 to-rose-500"
        />
        <div className="px-4 sm:px-6 h-[62px] flex items-center justify-between gap-6">
          {/* Zone 1: Brand & Mobile Sidebar Toggle */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label="Toggle sidebar menu"
              className="md:hidden p-2 -ml-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-emerald-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <button
              type="button"
              onClick={() => navigate('home')}
              className="text-base sm:text-lg font-semibold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0 cursor-pointer"
            >
              Python Logic &amp; Syntax Detector
            </button>
          </div>

          {/* Zone 2: Interactive Horizontal Top Navigation Bar */}
          <nav
            aria-label="Top navigation"
            className="hidden lg:flex items-center gap-4 xl:gap-5"
          >
            {SIDEBAR_ITEMS.map((item) => {
              const active = route === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(item.id)}
                  className={`relative py-2 text-[13px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'text-emerald-700 dark:text-white font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-slate-100'
                  }`}
                >
                  {item.label}
                  {active && (
                    <motion.span
                      layoutId="top-nav-underline"
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                      className="absolute inset-x-0 -bottom-[1px] h-0.5 bg-gradient-to-r from-emerald-500 via-sky-500 to-amber-500 rounded-full"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Primary Action */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Users className="w-3.5 h-3.5" />
            Live Room
          </button>
        </div>
      </header>

      {/* Shell: Sidebar + Main Content */}
      <div className="relative z-10 flex-1 flex min-h-0">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex md:flex-col w-60 shrink-0 border-r border-slate-200/80 dark:border-slate-800/80 bg-white/85 dark:bg-[#0D131F]/90 px-3 py-5 justify-between md:sticky md:top-16 md:h-[calc(100vh-4rem)] md:overflow-y-auto">
          <nav aria-label="Sidebar navigation" className="flex flex-col gap-1">
            <div className="px-3 pb-2 text-[11px] font-medium text-slate-500 dark:text-slate-500">
              Navigation
            </div>
            {SIDEBAR_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = route === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer border ${
                    active
                      ? item.activeClass
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/90 dark:hover:bg-slate-800/50 border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${item.iconColor}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="px-2 pt-4 border-t border-slate-200/80 dark:border-slate-800/70 space-y-2.5">
            <button
              type="button"
              onClick={() => setChatOpen(true)}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>CodeBuddy</span>
              </span>
              <span className="text-[10px] opacity-90">Ask</span>
            </button>
            {/* Background Color Palette Switcher */}
            <div className="px-1 space-y-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                <Palette className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>Background Palette</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {BG_PALETTE_OPTIONS.map((opt) => {
                  const selected = bgPalette === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setBgPalette(opt.id)}
                      title={`${opt.label} background`}
                      aria-label={`Use ${opt.label} background palette`}
                      className={`flex flex-col items-center gap-1 py-1.5 px-1 rounded-md border text-[10px] font-medium transition-colors cursor-pointer ${
                        selected
                          ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-500/15 text-slate-900 dark:text-white'
                          : 'border-slate-200 dark:border-slate-700/70 bg-white/80 dark:bg-[#111827] text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-full ${opt.swatchClass}`} />
                      <span className="truncate">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Interactive Motion Toggle */}
            <button
              type="button"
              onClick={() => setInteractiveBg((v) => !v)}
              aria-label={interactiveBg ? 'Pause interactive background' : 'Enable interactive background'}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-200 hover:border-sky-300 dark:hover:border-sky-500/50 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <MousePointerClick className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span>Interactive BG</span>
              </span>
              <span
                className={`text-[11px] font-semibold ${
                  interactiveBg
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {interactiveBg ? 'Live' : 'Static'}
              </span>
            </button>

            {/* Light / Dark Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-200 hover:border-amber-300 dark:hover:border-amber-500/50 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                {theme === 'light' ? (
                  <Moon className="w-3.5 h-3.5 text-indigo-600" />
                ) : (
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                {theme === 'light' ? 'Off' : 'On'}
              </span>
            </button>

            <div className="px-1 text-xs text-slate-500 dark:text-slate-500 space-y-1">
              <div className="text-slate-700 dark:text-slate-400 font-medium tabular-nums">
                Lessons: {completedLessons.length} / 10
              </div>
              <div className="truncate">Room: {collab.roomId}</div>
            </div>
          </div>
        </aside>

        {/* Mobile Sidebar Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <div
              className="fixed inset-0 bg-slate-900/40 dark:bg-black/60"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />
            <aside className="relative z-10 w-64 max-w-[80vw] h-full bg-white/95 dark:bg-[#0D131F] border-r border-slate-200 dark:border-slate-800 px-3 py-5 flex flex-col justify-between overflow-y-auto">
              <nav aria-label="Mobile sidebar navigation" className="flex flex-col gap-1">
                <div className="flex items-center justify-between px-3 pb-3 border-b border-slate-200 dark:border-slate-800/70 mb-2">
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">Menu</span>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    aria-label="Close sidebar"
                    className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-emerald-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {SIDEBAR_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const active = route === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => navigate(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer border ${
                        active
                          ? item.activeClass
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/50 border-transparent'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${item.iconColor}`} />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="px-2 pt-4 border-t border-slate-200 dark:border-slate-800/70 space-y-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setChatOpen(true);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>CodeBuddy</span>
                  </span>
                  <span className="text-[10px] opacity-90">Ask</span>
                </button>
                <div className="grid grid-cols-4 gap-1.5">
                  {BG_PALETTE_OPTIONS.map((opt) => {
                    const selected = bgPalette === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setBgPalette(opt.id)}
                        className={`flex flex-col items-center gap-1 py-1.5 px-1 rounded-md border text-[10px] font-medium transition-colors cursor-pointer ${
                          selected
                            ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-500/15 text-slate-900 dark:text-white'
                            : 'border-slate-200 dark:border-slate-700/70 bg-white dark:bg-[#111827] text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded-full ${opt.swatchClass}`} />
                        <span className="truncate">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => setInteractiveBg((v) => !v)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <MousePointerClick className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                    <span>Interactive BG</span>
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    {interactiveBg ? 'Live' : 'Static'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={toggleTheme}
                  aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-200 hover:border-emerald-300 dark:hover:border-emerald-500/50 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    {theme === 'light' ? (
                      <Moon className="w-3.5 h-3.5 text-indigo-600" />
                    ) : (
                      <Sun className="w-3.5 h-3.5 text-amber-400" />
                    )}
                    <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
                  </span>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">
                    {theme === 'light' ? 'Off' : 'On'}
                  </span>
                </button>
                <div className="px-1 text-xs text-slate-500">Room: {collab.roomId}</div>
              </div>
            </aside>
          </div>
        )}

        {/* Main Workspace + Footer */}
        <div className="flex-1 flex flex-col min-w-0">
          <main className="flex-1">
            {route === 'home' && (
              <HomeView
                onNavigate={navigate}
                onLoadCodeInDetector={handleLoadInDetector}
                onOpenLesson={(lessonId) => {
                  setSelectedLessonId(lessonId);
                  navigate('learning');
                }}
                onOpenSyntaxCode={(syntaxCode) => {
                  handleCodeChange(syntaxCode);
                  navigate('syntax');
                }}
              />
            )}

            {route === 'steps' && (
              <StepsToUseView
                onNavigate={navigate}
                onLoadSampleAndRun={() => handleLoadInDetector(DETECTOR_PRESETS[0].code)}
              />
            )}

            {route === 'sandbox' && (
              <SandboxView
                code={code}
                onChangeCode={handleCodeChange}
                onOpenInDetector={(nextCode) => handleLoadInDetector(nextCode)}
                onOpenInSyntax={(nextCode) => {
                  handleCodeChange(nextCode);
                  navigate('syntax');
                }}
              />
            )}

            {route === 'detector' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
                <div className="flex flex-wrap items-end justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800/80">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
                      Logic Detector &amp; Step Simulator
                    </h1>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      Write Python code on the left and inspect plain-English explanations, animated condition paths, live graphs, and Boolean gates on the right.
                    </p>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                    {analysis.conceptCategories.length} concept groups · {analysis.steps.length} execution steps
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-5 items-start">
                  {/* Left Zone: Sticky Code Editor & Simulator */}
                  <div className="lg:col-span-6 lg:sticky lg:top-20 flex flex-col gap-4">
                    <CodeEditorPanel
                      code={code}
                      onChange={handleCodeChange}
                      presets={DETECTOR_PRESETS}
                      activeLine={
                        detectorTab === 'boolean' && gateActiveLine !== null
                          ? gateActiveLine
                          : (activeStep?.line ?? null)
                      }
                      errorLines={errorLines}
                      usesInput={analysis.usesInput}
                      sampleInput={sampleInput}
                      onSampleInputChange={setSampleInput}
                      isPlaying={isPlaying}
                      isStepping={isStepping}
                      currentStepIndex={currentStepIndex}
                      totalSteps={analysis.steps.length}
                      speed={speed}
                      onRun={handleRun}
                      onStepMode={handleStepMode}
                      onNextStep={handleNextStep}
                      onReset={handleReset}
                      onTogglePlay={handleTogglePlay}
                      onSpeedChange={setSpeed}
                      onTryExample={handleTryExample}
                      hasRun={hasRun}
                      runCount={runCount}
                      finalOutput={
                        isStepping
                          ? (activeStep?.output ?? analysis.finalOutput)
                          : analysis.finalOutput
                      }
                      syntaxErrorSummary={
                        !analysis.isValidSyntax && analysis.syntaxIssues[0]
                          ? `Line ${analysis.syntaxIssues[0].line}: ${analysis.syntaxIssues[0].reason}`
                          : null
                      }
                      runtimeNotice={analysis.runtimeNotice}
                      remoteNotice={collab.lastEditorName}
                    />
                  </div>

                  {/* Right Zone: Analytical Deck */}
                  <div className="lg:col-span-6 rounded-xl border border-slate-200/90 dark:border-slate-800/80 bg-white/95 dark:bg-[#111827]/95 overflow-hidden shadow-xs dark:shadow-none">
                    {/* Segmented Tabs */}
                    <div className="px-4 py-2.5 border-b border-slate-200/80 dark:border-slate-800/80 bg-gradient-to-r from-emerald-50/80 via-sky-50/70 to-amber-50/70 dark:from-[#0F1522] dark:to-[#111827]">
                      <div className="grid grid-cols-4 gap-1 p-1 rounded-lg bg-white/80 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => setDetectorTab('explanation')}
                          className={`py-1.5 px-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                            detectorTab === 'explanation'
                              ? 'bg-emerald-600 text-white'
                              : 'text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-slate-200'
                          }`}
                        >
                          Explanation
                        </button>
                        <button
                          type="button"
                          onClick={() => setDetectorTab('flow')}
                          className={`py-1.5 px-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                            detectorTab === 'flow'
                              ? 'bg-sky-600 text-white'
                              : 'text-slate-600 dark:text-slate-400 hover:text-sky-700 dark:hover:text-slate-200'
                          }`}
                        >
                          Flowchart
                        </button>
                        <button
                          type="button"
                          onClick={() => setDetectorTab('graphs')}
                          className={`py-1.5 px-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                            detectorTab === 'graphs'
                              ? 'bg-amber-600 text-white'
                              : 'text-slate-600 dark:text-slate-400 hover:text-amber-700 dark:hover:text-slate-200'
                          }`}
                        >
                          Graphs
                        </button>
                        <button
                          type="button"
                          onClick={() => setDetectorTab('boolean')}
                          className={`py-1.5 px-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                            detectorTab === 'boolean'
                              ? 'bg-indigo-600 text-white'
                              : 'text-slate-600 dark:text-slate-400 hover:text-indigo-700 dark:hover:text-slate-200'
                          }`}
                        >
                          Logic Gates
                        </button>
                      </div>
                    </div>

                    <div className="p-4 sm:p-5">
                      {detectorTab === 'explanation' && (
                        <SmartExplanationPanel
                          analysis={analysis}
                          activeStep={activeStep}
                          isStepping={isStepping}
                          onInspectSyntax={() => navigate('syntax')}
                        />
                      )}
                      {detectorTab === 'flow' && (
                        <ConditionFlowchart
                          flow={analysis.conditionFlow}
                          activeStep={activeStep}
                          steps={analysis.steps}
                        />
                      )}
                      {detectorTab === 'graphs' && (
                        <ExecutionGraphsPanel
                          code={code}
                          analysis={analysis}
                          activeStepIndex={currentStepIndex}
                          isStepping={isStepping}
                          onSelectStep={(idx) => {
                            setIsPlaying(false);
                            setIsStepping(true);
                            setCurrentStepIndex(idx);
                          }}
                          onUpdateNumericVar={(varName, nextVal) =>
                            handleCodeChange(replaceNumericVarInCode(code, varName, nextVal))
                          }
                        />
                      )}
                      {detectorTab === 'boolean' && (
                        <LogicGateSimulator
                          onSyncCode={handleCodeChange}
                          onActiveLineChange={setGateActiveLine}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {route === 'syntax' && (
              <SyntaxCheckerView
                code={code}
                onChangeCode={handleCodeChange}
                analysis={analysis}
                onApplyFix={handleApplyFix}
                onOpenInDetector={() => navigate('detector')}
              />
            )}

            {route === 'learning' && (
              <LearningView
                completedLessons={completedLessons}
                onCompleteLesson={handleCompleteLesson}
                onLoadInDetector={handleLoadInDetector}
                initialLessonId={selectedLessonId}
              />
            )}

            {route === 'practice' && (
              <PracticeView
                playerName={collab.displayName}
                onSubmitScore={(score, total) =>
                  collab.submitScore({ quizScore: score, quizTotal: total })
                }
                onOpenLeaderboard={() => setDrawerOpen(true)}
              />
            )}
          </main>

          {/* Minimal Footer */}
          <footer className="border-t border-slate-200/80 dark:border-slate-800/70 py-4 px-4 sm:px-6 text-xs text-slate-600 dark:text-slate-400 bg-white/75 dark:bg-[#0B0F17]/75">
            <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
              <span>Python Logic &amp; Syntax Detector</span>
              <span>Safe static analysis &amp; step-by-step Python logic sandbox</span>
            </div>
          </footer>
        </div>
      </div>

      {/* Real-Time Collaboration & Leaderboard Drawer */}
      <CollabDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        status={collab.status}
        displayName={collab.displayName}
        roomId={collab.roomId}
        syncEnabled={collab.syncEnabled}
        onToggleSync={collab.setSyncEnabled}
        participants={collab.participants}
        messages={collab.messages}
        leaderboard={collab.leaderboard}
        onJoinRoom={collab.joinRoom}
        onRenameUser={collab.renameUser}
        onSendMessage={collab.sendMessage}
      />

      {/* CodeBuddy Multi-Turn Streaming AI Chat */}
      <CodeBuddyChat
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        currentCode={code}
        syntaxSummary={
          analysis.isValidSyntax
            ? 'Valid syntax'
            : `Syntax error on line ${analysis.syntaxIssues[0]?.line ?? 1}: ${analysis.syntaxIssues[0]?.title ?? 'Issue found'}`
        }
        onApplyCode={(snippet) => {
          handleLoadInDetector(snippet);
          setChatOpen(false);
        }}
      />

      {/* Quick Back-to-Top Scroll Helper */}
      <BackToTopButton />

      {/* Floating CodeBuddy Trigger */}
      {!chatOpen && (
        <button
          type="button"
          onClick={() => setChatOpen(true)}
          aria-label="Open CodeBuddy"
          className="fixed bottom-5 right-5 z-30 inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 hover:from-emerald-700 hover:via-teal-700 hover:to-sky-700 text-white shadow-md transition-transform hover:-translate-y-0.5 whitespace-nowrap cursor-pointer"
        >
          <MessageSquare className="w-4 h-4" />
          <span>CodeBuddy</span>
        </button>
      )}
    </div>
  );
}
