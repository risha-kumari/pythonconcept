import {
  DETECTOR_PRESETS,
  LEARNING_LESSONS,
  PRACTICE_QUIZ,
  SYNTAX_ERROR_PRESETS,
  TEST_QUESTIONS,
} from './curriculum';

export type AppRoute =
  | 'home'
  | 'steps'
  | 'sandbox'
  | 'detector'
  | 'syntax'
  | 'learning'
  | 'practice'
  | 'test'
  | 'game';

export type DetectorTab = 'explanation' | 'flow' | 'graphs' | 'boolean';

export type SearchCategory = 'all' | 'page' | 'lesson' | 'example' | 'quiz';

export interface SearchActions {
  onNavigate: (route: AppRoute) => void;
  onLoadCodeInDetector: (code: string) => void;
  onOpenLesson: (lessonId: string) => void;
  onOpenSyntaxCode: (code: string) => void;
  onOpenDetectorTab?: (tab: DetectorTab) => void;
  onOpenCodeBuddy?: () => void;
  onOpenLiveRoom?: () => void;
}

export interface SearchResultItem {
  id: string;
  category: Exclude<SearchCategory, 'all'>;
  kind: string;
  routeLabel: string;
  title: string;
  subtitle: string;
  searchText: string;
  score: number;
  action: () => void;
}

export const SUGGESTED_SEARCHES = [
  'Animated Video Topics',
  'Logic Detector',
  'Boolean Gates',
  'NAND NOR XNOR',
  'Syntax Checker',
  'Sandbox',
  'For Loop',
  'CodeBuddy',
];

export const QUICK_PAGE_LINKS: { route: AppRoute; label: string; snippet: string }[] = [
  {
    route: 'detector',
    label: 'Logic Detector',
    snippet: 'Step-by-step execution & flow',
  },
  {
    route: 'sandbox',
    label: 'Sandbox',
    snippet: 'Run Python code & templates',
  },
  {
    route: 'syntax',
    label: 'Syntax Checker',
    snippet: 'Spot & fix Python mistakes',
  },
  {
    route: 'learning',
    label: 'Learning',
    snippet: '10 guided beginner lessons',
  },
  {
    route: 'test',
    label: 'Test',
    snippet: 'Easy, Medium & Hard quiz',
  },
];

export function normalizeSearchQuery(raw: string): {
  trimmed: string;
  normalized: string;
  tokens: string[];
} {
  const trimmed = raw.trim().replace(/\s+/g, ' ');
  const normalized = trimmed.toLowerCase();
  const tokens = normalized ? normalized.split(' ').filter(Boolean) : [];
  return { trimmed, normalized, tokens };
}

export function isSafeWebUrl(uri: string): boolean {
  try {
    const parsed = new URL(uri);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function buildSearchCandidates(
  actions: SearchActions,
): Omit<SearchResultItem, 'score'>[] {
  const {
    onNavigate,
    onLoadCodeInDetector,
    onOpenLesson,
    onOpenSyntaxCode,
    onOpenDetectorTab,
    onOpenCodeBuddy,
    onOpenLiveRoom,
  } = actions;

  const candidates: Omit<SearchResultItem, 'score'>[] = [];

  // 1. All Available Pages & Core Features
  const pagesAndFeatures: {
    id: string;
    kind: string;
    routeLabel: string;
    title: string;
    subtitle: string;
    keywords: string;
    action: () => void;
  }[] = [
    {
      id: 'page-home',
      kind: 'Page',
      routeLabel: 'Home',
      title: 'Home Overview & Quick Python Preview',
      subtitle: 'Interactive preview slider, live syntax check, and quick tool launcher.',
      keywords: 'home overview start quick preview slider python age eligibility main page',
      action: () => onNavigate('home'),
    },
    {
      id: 'page-steps',
      kind: 'Page',
      routeLabel: 'Steps to Use',
      title: 'Steps to Use Guide',
      subtitle: 'Five-step beginner walkthrough for analyzing Python code line by line.',
      keywords: 'steps guide how to start tutorial help instructions beginners',
      action: () => onNavigate('steps'),
    },
    {
      id: 'page-sandbox',
      kind: 'Page',
      routeLabel: 'Sandbox',
      title: 'Python Interactive Sandbox',
      subtitle: 'Run Python code freely with starter templates, console output, and live variables.',
      keywords: 'sandbox playground console run code execute templates clear try example',
      action: () => onNavigate('sandbox'),
    },
    {
      id: 'page-detector',
      kind: 'Page',
      routeLabel: 'Logic Detector',
      title: 'Logic Detector & Step Simulator',
      subtitle: 'Analyze Python code, step line-by-line, and inspect variables and branches.',
      keywords: 'python logic detector simulator step by step execution trace play pause speed',
      action: () => onNavigate('detector'),
    },
    {
      id: 'feature-boolean-gates',
      kind: 'Feature',
      routeLabel: 'Logic Detector · Boolean Gates',
      title: 'Boolean Logic Gates Simulator (AND, OR, NOT, XOR, NAND, NOR, XNOR)',
      subtitle: 'Animate glowing wires, light bulb output, truth table, state graph, and gate quiz.',
      keywords:
        'boolean logic gates simulator and or not xor nand nor xnor truth table light bulb circuit quiz',
      action: () => (onOpenDetectorTab ? onOpenDetectorTab('boolean') : onNavigate('detector')),
    },
    {
      id: 'feature-flowchart',
      kind: 'Feature',
      routeLabel: 'Logic Detector · Flowchart',
      title: 'Condition Flowchart Visualizer',
      subtitle: 'See True/False branches animate live as Python conditions evaluate.',
      keywords: 'flowchart condition branch true false if elif else diagram visualizer',
      action: () => (onOpenDetectorTab ? onOpenDetectorTab('flow') : onNavigate('detector')),
    },
    {
      id: 'feature-graphs',
      kind: 'Feature',
      routeLabel: 'Logic Detector · Graphs',
      title: 'Execution Graphs & Variable Sliders',
      subtitle: 'Explore live numeric variable sliders and step-by-step concept graphs.',
      keywords: 'graphs execution chart variable slider numeric timeline',
      action: () => (onOpenDetectorTab ? onOpenDetectorTab('graphs') : onNavigate('detector')),
    },
    {
      id: 'page-syntax',
      kind: 'Page',
      routeLabel: 'Syntax Checker',
      title: 'Python Syntax Checker',
      subtitle: 'Detect missing colons, indentation errors, brackets, typos, and run one-click fixes.',
      keywords:
        'python syntax checker error colon indentation brackets quotes fix run code try example clear',
      action: () => onNavigate('syntax'),
    },
    {
      id: 'page-learning',
      kind: 'Page',
      routeLabel: 'Learning',
      title: 'Interactive Python Learning (10 Lessons)',
      subtitle: 'Guided beginner lessons on variables, data types, operators, loops, and functions.',
      keywords: 'learning lessons curriculum study beginners basics python 101',
      action: () => onNavigate('learning'),
    },
    {
      id: 'feature-video-lesson',
      kind: 'Videos · 1–2 Min Each',
      routeLabel: 'Learning · Animated Videos',
      title: '8 Animated Python Topic Videos (1–2 Min Each, English Voice & Subtitles)',
      subtitle:
        'Full beginner-to-builder animated videos covering Syntax, Variables, Operators, If-Elif-Else, Logic Gates, Loops, Lists & Dictionaries, and Functions.',
      keywords:
        'video lesson 1 min 2 min animated english voice subtitles audio cc beginners python tutorial watch topics',
      action: () => onOpenLesson('video'),
    },
    {
      id: 'page-practice',
      kind: 'Page',
      routeLabel: 'Practice',
      title: `Practice Quiz (${PRACTICE_QUIZ.length} Questions & Sub-Topics)`,
      subtitle: 'Practice Logic Gates, Boolean Expressions, Syntax Errors, and Core Python by sub-topic.',
      keywords:
        'practice quiz questions sub-topics logic gates boolean expressions syntax errors score leaderboard',
      action: () => onNavigate('practice'),
    },
    {
      id: 'page-test',
      kind: 'Page',
      routeLabel: 'Test',
      title: 'Python Assessment Test (Easy, Medium, Hard)',
      subtitle: 'Sliding question palette, timer, scoreboard, performance rating, and explanations.',
      keywords:
        'test exam assessment easy medium hard question palette scoreboard excellent very good good better luck next time',
      action: () => onNavigate('test'),
    },
    {
      id: 'page-game',
      kind: 'Arcade Game',
      routeLabel: 'Learn By Play',
      title: 'Python Code Quest Interactive Game',
      subtitle: 'Play interactive coding challenges with gorgeous arcade colors, streaks, scores, and sound effects.',
      keywords: 'game learn by play arcade quest code interactive challenges score streak audio',
      action: () => onNavigate('game'),
    },
    {
      id: 'feature-codebuddy',
      kind: 'Feature',
      routeLabel: 'CodeBuddy Drawer',
      title: 'CodeBuddy AI Tutor (Google Search Grounded)',
      subtitle: 'Streaming Python Tutor, Syntax Coach, and Practice Coach with live web search.',
      keywords:
        'codebuddy ai tutor chatbot syntax coach practice coach google search grounding help',
      action: () => (onOpenCodeBuddy ? onOpenCodeBuddy() : onNavigate('detector')),
    },
    {
      id: 'feature-liveroom',
      kind: 'Feature',
      routeLabel: 'Live Room Drawer',
      title: 'Live Collaboration Room & Leaderboard',
      subtitle: 'Collaborate in real time with shared Python code, chat, and quiz rankings.',
      keywords: 'live room collaboration leaderboard multiplayer chat participants score',
      action: () => (onOpenLiveRoom ? onOpenLiveRoom() : onNavigate('practice')),
    },
  ];

  for (const item of pagesAndFeatures) {
    candidates.push({
      id: item.id,
      category: 'page',
      kind: item.kind,
      routeLabel: item.routeLabel,
      title: item.title,
      subtitle: item.subtitle,
      searchText: `${item.title} ${item.subtitle} ${item.kind} ${item.routeLabel} ${item.keywords}`.toLowerCase(),
      action: item.action,
    });
  }

  // 2. All 10 Learning Lessons
  for (const lesson of LEARNING_LESSONS) {
    candidates.push({
      id: `lesson-${lesson.id}`,
      category: 'lesson',
      kind: `Lesson ${lesson.index}`,
      routeLabel: 'Learning',
      title: lesson.title,
      subtitle: lesson.definition,
      searchText: `python lesson ${lesson.index} ${lesson.title} ${lesson.definition} ${lesson.exampleCode} ${lesson.question} ${lesson.explanation}`.toLowerCase(),
      action: () => onOpenLesson(lesson.id),
    });
  }

  // 3. All 6 Detector Presets
  for (const preset of DETECTOR_PRESETS) {
    candidates.push({
      id: `preset-${preset.id}`,
      category: 'example',
      kind: 'Example',
      routeLabel: 'Logic Detector',
      title: preset.label,
      subtitle: 'Load this Python example into the Logic Detector & Step Simulator.',
      searchText: `python example preset ${preset.label} ${preset.code} logic detector`.toLowerCase(),
      action: () => onLoadCodeInDetector(preset.code),
    });
  }

  // 4. All 6 Syntax Error Presets
  for (const errPreset of SYNTAX_ERROR_PRESETS) {
    candidates.push({
      id: `syntax-${errPreset.id}`,
      category: 'example',
      kind: 'Syntax Demo',
      routeLabel: 'Syntax Checker',
      title: errPreset.label,
      subtitle: 'Inspect and fix this Python syntax mistake in the Syntax Checker.',
      searchText: `python syntax error demo ${errPreset.label} ${errPreset.code} fix`.toLowerCase(),
      action: () => onOpenSyntaxCode(errPreset.code),
    });
  }

  // 5. Practice Quiz Questions
  for (const q of PRACTICE_QUIZ) {
    candidates.push({
      id: `practice-${q.id}`,
      category: 'quiz',
      kind: `Practice · ${q.subTopic}`,
      routeLabel: 'Practice',
      title: `${q.topic}: ${q.question}`,
      subtitle: q.explanation,
      searchText: `python practice quiz ${q.topic} ${q.subTopic} ${q.question} ${q.codeSnippet ?? ''} ${q.explanation}`.toLowerCase(),
      action: () => onNavigate('practice'),
    });
  }

  // 6. Assessment Test Questions (Easy / Medium / Hard)
  for (const tq of TEST_QUESTIONS) {
    candidates.push({
      id: `test-${tq.id}`,
      category: 'quiz',
      kind: `Test · ${tq.difficulty.toUpperCase()}`,
      routeLabel: 'Test',
      title: `${tq.topic}: ${tq.question}`,
      subtitle: tq.explanation,
      searchText: `python test ${tq.difficulty} ${tq.topic} ${tq.question} ${tq.codeSnippet ?? ''} ${tq.explanation}`.toLowerCase(),
      action: () => onNavigate('test'),
    });
  }

  return candidates;
}

export function searchAppItems(
  rawQuery: string,
  candidates: Omit<SearchResultItem, 'score'>[],
): SearchResultItem[] {
  const { normalized, tokens } = normalizeSearchQuery(rawQuery);
  if (!normalized || tokens.length === 0) return [];

  const matched: SearchResultItem[] = [];
  for (const c of candidates) {
    const allTokensMatch = tokens.every((tok) => c.searchText.includes(tok));
    if (!allTokensMatch) continue;

    const titleLower = c.title.toLowerCase();
    const subtitleLower = c.subtitle.toLowerCase();
    let score = 10;
    if (titleLower === normalized) score += 120;
    else if (titleLower.startsWith(normalized)) score += 70;
    else if (titleLower.includes(normalized)) score += 45;
    else if (tokens.every((t) => titleLower.includes(t))) score += 30;
    else if (subtitleLower.includes(normalized)) score += 18;
    if (c.category === 'page') score += 16;

    matched.push({ ...c, score });
  }

  matched.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
  return matched;
}
