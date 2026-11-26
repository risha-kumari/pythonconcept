export type VideoVisualMode =
  | 'intro'
  | 'syntax'
  | 'variables'
  | 'datatypes'
  | 'operators'
  | 'ifelse'
  | 'gates'
  | 'loops'
  | 'lists'
  | 'functions'
  | 'wrapup';

export interface VideoCue {
  id: string;
  start: number;
  end: number;
  sceneTitle: string;
  subtitle: string;
  codeLines: string[];
  highlightLine: number;
  consoleOutput?: string[];
  visualMode: VideoVisualMode;
  visualState?: {
    boxName?: string;
    boxValue?: string;
    oldBoxValue?: string;
    secondBoxName?: string;
    secondBoxValue?: string;
    indentSpaces?: boolean;
    branchTaken?: 'none' | 'if' | 'elif' | 'else';
    gateName?: string;
    inputA?: boolean;
    inputB?: boolean;
    bulbOn?: boolean;
    loopStep?: number;
    loopLabel?: string;
    listItems?: string[];
    activeListIndex?: number;
    dictPairs?: { key: string; val: string }[];
    fnName?: string;
    fnIn?: string;
    fnOut?: string;
    formulaLeft?: string;
    formulaOp?: string;
    formulaRight?: string;
    formulaResult?: string;
    pillTags?: { label: string; kind: string }[];
  };
}

export interface VideoTopicLesson {
  id: string;
  index: number;
  title: string;
  shortTitle: string;
  durationSeconds: number;
  level: 'Beginner' | 'Core Logic' | 'Building';
  summary: string;
  cues: VideoCue[];
}

export const VIDEO_LESSONS: VideoTopicLesson[] = [
  {
    id: 'vid-syntax',
    index: 1,
    title: 'Python Syntax, Print & Indentation Rules',
    shortTitle: 'Syntax & Rules',
    durationSeconds: 90, // 01:30
    level: 'Beginner',
    summary: 'How Python reads line by line, print() quotes, comments, colons, and 4-space blocks.',
    cues: [
      {
        id: 's1-1',
        start: 0,
        end: 15,
        sceneTitle: '1. Python Reads Top to Bottom',
        subtitle:
          'Welcome! Python is a clean language designed to read like everyday English. It runs your instructions smoothly from top to bottom, one line at a time.',
        codeLines: [
          '# Runs top to bottom',
          'print("Step 1: Wake up")',
          'print("Step 2: Drink water")',
          'print("Step 3: Code Python")',
        ],
        highlightLine: 1,
        consoleOutput: ['Step 1: Wake up', 'Step 2: Drink water', 'Step 3: Code Python'],
        visualMode: 'intro',
      },
      {
        id: 's1-2',
        start: 15,
        end: 30,
        sceneTitle: '2. Using print() With Words vs Numbers',
        subtitle:
          'The print command displays results on screen. Always wrap words inside quote marks, while plain numbers or math expressions work right without quotes.',
        codeLines: [
          'print("Hello, Python!")',
          'print("2 + 3")   # text words',
          'print(2 + 3)     # real math: 5',
        ],
        highlightLine: 2,
        consoleOutput: ['Hello, Python!', '2 + 3', '5'],
        visualMode: 'operators',
        visualState: {
          formulaLeft: '2',
          formulaOp: '+',
          formulaRight: '3',
          formulaResult: '5',
        },
      },
      {
        id: 's1-3',
        start: 30,
        end: 45,
        sceneTitle: '3. Single Quotes, Double Quotes & Comments',
        subtitle:
          'Both single and double quotes work in Python. And any line starting with a hash symbol is a helpful human note that Python simply skips over.',
        codeLines: [
          '# This note is ignored by Python',
          'print("It is a great day!")',
          "print('Welcome to Python')",
        ],
        highlightLine: 0,
        consoleOutput: ['It is a great day!', 'Welcome to Python'],
        visualMode: 'datatypes',
        visualState: {
          pillTags: [
            { label: '"..."', kind: 'Double quotes' },
            { label: "'...'", kind: 'Single quotes' },
            { label: '# note', kind: 'Comment (skipped)' },
            { label: 'print()', kind: 'Shows output' },
          ],
        },
      },
      {
        id: 's1-4',
        start: 45,
        end: 60,
        sceneTitle: '4. The Colon (:) & 4-Space Rule',
        subtitle:
          'Whenever Python makes a check or starts a group, place a colon at the end of that line, then press the spacebar four times on the line below.',
        codeLines: [
          'score = 88',
          'if score >= 50:',
          '    print("Great job!")',
          '    print("You passed!")',
        ],
        highlightLine: 2,
        consoleOutput: ['Great job!', 'You passed!'],
        visualMode: 'syntax',
        visualState: { indentSpaces: true },
      },
      {
        id: 's1-5',
        start: 60,
        end: 75,
        sceneTitle: '5. Fixing IndentationError Mistakes',
        subtitle:
          'Unlike languages that use curly braces, Python relies on neat spacing. If you forget those four spaces after a colon, Python stops with an IndentationError.',
        codeLines: [
          'score = 88',
          'if score >= 50:',
          'print("Missing 4 spaces!")  # Error!',
        ],
        highlightLine: 2,
        consoleOutput: ['IndentationError: expected an indented block'],
        visualMode: 'syntax',
        visualState: { indentSpaces: false },
      },
      {
        id: 's1-6',
        start: 75,
        end: 90,
        sceneTitle: '6. Quick Recap: Clean Python Style',
        subtitle:
          'Always match your opening and closing quotes, close every bracket, end checks with a colon, and indent neatly by four spaces. You are ready for variables!',
        codeLines: [
          'name = "Alex"',
          'if name != "":',
          '    print("Ready to code,", name)',
        ],
        highlightLine: 2,
        consoleOutput: ['Ready to code, Alex'],
        visualMode: 'wrapup',
      },
    ],
  },

  {
    id: 'vid-variables',
    index: 2,
    title: 'Variables, Naming Rules & Value Types',
    shortTitle: 'Variables & Types',
    durationSeconds: 105, // 01:45
    level: 'Beginner',
    summary: 'Memory boxes, snake_case naming, swapping values, int/float/str/bool, and type() conversion.',
    cues: [
      {
        id: 's2-1',
        start: 0,
        end: 15,
        sceneTitle: '1. Variables Are Labeled Memory Boxes',
        subtitle:
          'Think of a variable as a labeled storage box in memory. Using one equals sign places the value on the right neatly inside the box named on the left.',
        codeLines: ['points = 10', 'player = "Maya"', 'print(player, points)'],
        highlightLine: 0,
        consoleOutput: ['Maya 10'],
        visualMode: 'variables',
        visualState: { boxName: 'points', oldBoxValue: 'empty', boxValue: '10' },
      },
      {
        id: 's2-2',
        start: 15,
        end: 30,
        sceneTitle: '2. Updating & Changing Values Live',
        subtitle:
          'Variables are called variables because their contents can change anytime. Writing points equals points plus five replaces ten with fifteen inside the box.',
        codeLines: ['points = 10', 'points = points + 5', 'print(points)  # 15'],
        highlightLine: 1,
        consoleOutput: ['15'],
        visualMode: 'variables',
        visualState: { boxName: 'points', oldBoxValue: '10', boxValue: '15' },
      },
      {
        id: 's2-3',
        start: 30,
        end: 45,
        sceneTitle: '3. Clean Variable Naming Rules',
        subtitle:
          'Use lowercase words joined with underscores, called snake case. Never put spaces inside a variable name or start a name with a digit.',
        codeLines: [
          'user_age = 20       # Great name!',
          'top_score = 99      # Clear and valid',
          '# 2score = 50       <- Invalid: starts with digit',
        ],
        highlightLine: 0,
        visualMode: 'datatypes',
        visualState: {
          pillTags: [
            { label: 'user_age', kind: 'Valid snake_case' },
            { label: 'level_2', kind: 'Valid (digit later)' },
            { label: 'my name', kind: 'Invalid (has space)' },
            { label: '2fast', kind: 'Invalid (starts digit)' },
          ],
        },
      },
      {
        id: 's2-4',
        start: 45,
        end: 60,
        sceneTitle: '4. The Four Everyday Python Types',
        subtitle:
          'Python recognizes four core kinds of data: whole integers, decimal floats, text strings wrapped in quotes, and Boolean True or False answers.',
        codeLines: [
          'age = 18          # int (whole)',
          'price = 4.99      # float (decimal)',
          'city = "Paris"    # str (text)',
          'is_open = True    # bool (True/False)',
        ],
        highlightLine: 1,
        visualMode: 'datatypes',
        visualState: {
          pillTags: [
            { label: '18', kind: 'Whole int' },
            { label: '4.99', kind: 'Decimal float' },
            { label: '"Paris"', kind: 'Text str' },
            { label: 'True', kind: 'Logic bool' },
          ],
        },
      },
      {
        id: 's2-5',
        start: 60,
        end: 75,
        sceneTitle: '5. Checking & Converting Value Types',
        subtitle:
          'Use type() whenever you want to inspect a box. And if text holds digits like "25", wrap it in int() to convert it into a real math number.',
        codeLines: [
          'raw = "25"',
          'num = int(raw)',
          'print(num + 5)      # 30',
          'print(type(num))    # <class int>',
        ],
        highlightLine: 1,
        consoleOutput: ['30', "<class 'int'>"],
        visualMode: 'variables',
        visualState: { boxName: 'num', oldBoxValue: '"25"', boxValue: '25' },
      },
      {
        id: 's2-6',
        start: 75,
        end: 90,
        sceneTitle: '6. Python Shortcut: Swapping Two Boxes',
        subtitle:
          'Python has a neat shortcut to swap two boxes in a single line: write a comma b equals b comma a, and Python trades their values cleanly.',
        codeLines: ['a = 5', 'b = 9', 'a, b = b, a', 'print(a, b)  # 9 5'],
        highlightLine: 2,
        consoleOutput: ['9 5'],
        visualMode: 'variables',
        visualState: {
          boxName: 'a',
          oldBoxValue: '5',
          boxValue: '9',
          secondBoxName: 'b',
          secondBoxValue: '5',
        },
      },
      {
        id: 's2-7',
        start: 90,
        end: 105,
        sceneTitle: '7. Recap: Dynamic & Easy',
        subtitle:
          'Python figures out data types automatically without extra setup. Clear variable names make every program easy for anyone to read.',
        codeLines: ['lives = 3', 'bonus = 1.5', 'print("Total:", lives * bonus)'],
        highlightLine: 2,
        consoleOutput: ['Total: 4.5'],
        visualMode: 'wrapup',
      },
    ],
  },

  {
    id: 'vid-operators',
    index: 3,
    title: 'Math Operators, Comparisons & String Tricks',
    shortTitle: 'Operators & Math',
    durationSeconds: 90, // 01:30
    level: 'Beginner',
    summary: 'Arithmetic (+, -, *, /, //, %, **), comparisons (==, !=, >=), and joining strings.',
    cues: [
      {
        id: 's3-1',
        start: 0,
        end: 15,
        sceneTitle: '1. Everyday Arithmetic in Python',
        subtitle:
          'Python works like a fast pocket calculator. Use plus, minus, star for multiply, and forward slash for division, which always gives a clean decimal answer.',
        codeLines: [
          'print(10 + 4)   # 14',
          'print(10 - 4)   # 6',
          'print(10 * 4)   # 40',
          'print(10 / 4)   # 2.5',
        ],
        highlightLine: 3,
        consoleOutput: ['14', '6', '40', '2.5'],
        visualMode: 'operators',
        visualState: {
          formulaLeft: '10',
          formulaOp: '/',
          formulaRight: '4',
          formulaResult: '2.5',
        },
      },
      {
        id: 's3-2',
        start: 15,
        end: 30,
        sceneTitle: '2. Floor Division (//), Remainder (%) & Powers (**)',
        subtitle:
          'Double slash gives only the whole part of division. Percent finds the leftover remainder, which is great for checking even numbers. Double star calculates powers.',
        codeLines: [
          'print(10 // 3)  # 3 (whole times)',
          'print(10 % 3)   # 1 (leftover)',
          'print(2 ** 3)   # 8 (2 * 2 * 2)',
        ],
        highlightLine: 1,
        consoleOutput: ['3', '1', '8'],
        visualMode: 'operators',
        visualState: {
          formulaLeft: '10',
          formulaOp: '%',
          formulaRight: '3',
          formulaResult: '1',
        },
      },
      {
        id: 's3-3',
        start: 30,
        end: 45,
        sceneTitle: '3. Order of Operations With Brackets',
        subtitle:
          'Just like school math, Python multiplies and divides before adding. Wrap anything in parentheses whenever you want that part calculated first.',
        codeLines: [
          'a = 2 + 3 * 4     # 14',
          'b = (2 + 3) * 4   # 20',
          'print(a, b)',
        ],
        highlightLine: 1,
        consoleOutput: ['14 20'],
        visualMode: 'operators',
        visualState: {
          formulaLeft: '(2+3)',
          formulaOp: '*',
          formulaRight: '4',
          formulaResult: '20',
        },
      },
      {
        id: 's3-4',
        start: 45,
        end: 60,
        sceneTitle: '4. Comparing Values (==, !=, >, <)',
        subtitle:
          'Comparison operators ask a yes-or-no question and always return True or False. Remember: double equals checks if two items match, while exclamation equals checks difference.',
        codeLines: [
          'x = 15',
          'print(x == 15)   # True',
          'print(x != 10)   # True',
          'print(x > 20)    # False',
        ],
        highlightLine: 1,
        consoleOutput: ['True', 'True', 'False'],
        visualMode: 'datatypes',
        visualState: {
          pillTags: [
            { label: '15 == 15', kind: 'True (Equal)' },
            { label: '15 != 10', kind: 'True (Not equal)' },
            { label: '15 >= 15', kind: 'True (At least)' },
            { label: '15 > 20', kind: 'False' },
          ],
        },
      },
      {
        id: 's3-5',
        start: 60,
        end: 75,
        sceneTitle: '5. Joining Words & Modern f-Strings',
        subtitle:
          'Plus also glues words together, and star repeats text. Even cleaner: put the letter f before quotes so you can drop any variable inside curly braces.',
        codeLines: [
          'name = "Sam"',
          'coins = 12',
          'print("Hi " + name)',
          'print(f"{name} has {coins} coins")',
        ],
        highlightLine: 3,
        consoleOutput: ['Hi Sam', 'Sam has 12 coins'],
        visualMode: 'operators',
        visualState: {
          formulaLeft: '"Hi "',
          formulaOp: '+',
          formulaRight: '"Sam"',
          formulaResult: '"Hi Sam"',
        },
      },
      {
        id: 's3-6',
        start: 75,
        end: 90,
        sceneTitle: '6. Shortcut Updates (+=, -=)',
        subtitle:
          'Instead of writing score equals score plus ten, use plus equals as a clean shortcut. You now have all the tools to make smart decisions with code!',
        codeLines: ['score = 50', 'score += 10', 'print("New score:", score)'],
        highlightLine: 1,
        consoleOutput: ['New score: 60'],
        visualMode: 'variables',
        visualState: { boxName: 'score', oldBoxValue: '50', boxValue: '60' },
      },
    ],
  },

  {
    id: 'vid-ifelse',
    index: 4,
    title: 'Smart Decisions with if, elif & else',
    shortTitle: 'If-Elif-Else',
    durationSeconds: 105, // 01:45
    level: 'Core Logic',
    summary: 'Branching flowcharts, multi-step elif ladders, nested checks, and avoiding = vs == bugs.',
    cues: [
      {
        id: 's4-1',
        start: 0,
        end: 15,
        sceneTitle: '1. Code Fork in the Road',
        subtitle:
          'Programs often need to make choices based on changing numbers. An if statement tests a condition and decides which path of code Python should travel down.',
        codeLines: ['age = 20', 'if age >= 18:', '    print("Adult ticket")', 'print("Enjoy the show!")'],
        highlightLine: 1,
        consoleOutput: ['Adult ticket', 'Enjoy the show!'],
        visualMode: 'ifelse',
        visualState: { branchTaken: 'if', boxName: 'age', boxValue: '20' },
      },
      {
        id: 's4-2',
        start: 15,
        end: 30,
        sceneTitle: '2. Two Paths: if and else',
        subtitle:
          'When you add else, Python picks strictly one path: either the indented lines under if when True, or the fallback lines under else when False.',
        codeLines: [
          'age = 12',
          'if age >= 18:',
          '    print("Adult ticket")',
          'else:',
          '    print("Child ticket")',
        ],
        highlightLine: 4,
        consoleOutput: ['Child ticket'],
        visualMode: 'ifelse',
        visualState: { branchTaken: 'else', boxName: 'age', boxValue: '12' },
      },
      {
        id: 's4-3',
        start: 30,
        end: 45,
        sceneTitle: '3. Multiple Choices With elif',
        subtitle:
          'Real problems have more than two options. Add elif, short for else if, to check a ladder of conditions cleanly from top to bottom.',
        codeLines: [
          'marks = 78',
          'if marks >= 90:',
          '    print("Grade A")',
          'elif marks >= 70:',
          '    print("Grade B")',
          'else:',
          '    print("Grade C")',
        ],
        highlightLine: 4,
        consoleOutput: ['Grade B'],
        visualMode: 'ifelse',
        visualState: { branchTaken: 'elif', boxName: 'marks', boxValue: '78' },
      },
      {
        id: 's4-4',
        start: 45,
        end: 60,
        sceneTitle: '4. First Match Wins Rule',
        subtitle:
          'Important rule: Python stops at the very first True check in an if-elif chain and skips the rest. Always put your strictest highest check at the top!',
        codeLines: [
          'marks = 95',
          'if marks >= 90:    # True! Stops here',
          '    print("Grade A")',
          'elif marks >= 70:  # Skipped',
          '    print("Grade B")',
        ],
        highlightLine: 1,
        consoleOutput: ['Grade A'],
        visualMode: 'ifelse',
        visualState: { branchTaken: 'if', boxName: 'marks', boxValue: '95' },
      },
      {
        id: 's4-5',
        start: 60,
        end: 75,
        sceneTitle: '5. Nested Conditions (Check Inside a Check)',
        subtitle:
          'You can also place an if check inside another if block using eight spaces. That lets Python ask a follow-up question only when the first answer is True.',
        codeLines: [
          'has_ticket = True',
          'age = 20',
          'if has_ticket:',
          '    if age >= 18:',
          '        print("VIP Lounge Open")',
        ],
        highlightLine: 3,
        consoleOutput: ['VIP Lounge Open'],
        visualMode: 'ifelse',
        visualState: { branchTaken: 'if', boxName: 'has_ticket', boxValue: 'True' },
      },
      {
        id: 's4-6',
        start: 75,
        end: 90,
        sceneTitle: '6. Common Trap: = vs == Inside if',
        subtitle:
          'Watch out for a classic beginner typo: writing one equals sign inside an if statement causes a SyntaxError. Always use double equals when comparing values.',
        codeLines: [
          'pin = 1234',
          '# if pin = 1234:  <- SyntaxError!',
          'if pin == 1234:',
          '    print("Door Unlocked")',
        ],
        highlightLine: 2,
        consoleOutput: ['Door Unlocked'],
        visualMode: 'syntax',
        visualState: { indentSpaces: true },
      },
      {
        id: 's4-7',
        start: 90,
        end: 105,
        sceneTitle: '7. Recap: Try It Live in Detector',
        subtitle:
          'You can paste any if-elif-else ladder into the Logic Detector to watch each diamond condition light up step by step.',
        codeLines: [
          'temp = 32',
          'if temp > 30:',
          '    print("Stay hydrated!")',
        ],
        highlightLine: 1,
        consoleOutput: ['Stay hydrated!'],
        visualMode: 'wrapup',
      },
    ],
  },

  {
    id: 'vid-gates',
    index: 5,
    title: 'Boolean Logic & All 7 Logic Gates',
    shortTitle: 'Boolean & Gates',
    durationSeconds: 105, // 01:45
    level: 'Core Logic',
    summary: 'How AND, OR, NOT, XOR, NAND, NOR, and XNOR control switches in hardware and Python.',
    cues: [
      {
        id: 's5-1',
        start: 0,
        end: 15,
        sceneTitle: '1. Combining Rules With Light Switches',
        subtitle:
          'Real apps check several conditions together. Boolean logic combines True and False switches using logic gates inside both Python code and computer chips.',
        codeLines: ['has_ticket = True', 'has_id = True', 'print(has_ticket and has_id)'],
        highlightLine: 2,
        consoleOutput: ['True'],
        visualMode: 'gates',
        visualState: { gateName: 'AND', inputA: true, inputB: true, bulbOn: true },
      },
      {
        id: 's5-2',
        start: 15,
        end: 30,
        sceneTitle: '2. AND Gate (Strict: Needs Both ON)',
        subtitle:
          'The AND gate is strict. Both switch A and switch B must be True for electricity to light the bulb. If even one switch is False, output stays False.',
        codeLines: ['A = True', 'B = False', 'print(A and B)  # False'],
        highlightLine: 2,
        consoleOutput: ['False'],
        visualMode: 'gates',
        visualState: { gateName: 'AND', inputA: true, inputB: false, bulbOn: false },
      },
      {
        id: 's5-3',
        start: 30,
        end: 45,
        sceneTitle: '3. OR Gate (Friendly: Needs Just One ON)',
        subtitle:
          'The OR gate is welcoming. If switch A is True, switch B is True, or both are True, the light bulb shines bright. It is False only when both are OFF.',
        codeLines: ['A = True', 'B = False', 'print(A or B)   # True'],
        highlightLine: 2,
        consoleOutput: ['True'],
        visualMode: 'gates',
        visualState: { gateName: 'OR', inputA: true, inputB: false, bulbOn: true },
      },
      {
        id: 's5-4',
        start: 45,
        end: 60,
        sceneTitle: '4. NOT Gate (The Inverter Flip)',
        subtitle:
          'The NOT gate flips whatever single switch enters it. Send False in and get True out. Think of it like checking if it is not raining before going outside.',
        codeLines: ['is_raining = False', 'print(not is_raining)  # True'],
        highlightLine: 1,
        consoleOutput: ['True'],
        visualMode: 'gates',
        visualState: { gateName: 'NOT', inputA: false, bulbOn: true },
      },
      {
        id: 's5-5',
        start: 60,
        end: 75,
        sceneTitle: '5. XOR Gate (Different Inputs Only)',
        subtitle:
          'XOR means exclusive or. It lights up only when the two switches do not match: one ON and the other OFF. In Python, you write A not equal to B.',
        codeLines: ['A = True', 'B = False', 'print(A != B)   # True (XOR)'],
        highlightLine: 2,
        consoleOutput: ['True'],
        visualMode: 'gates',
        visualState: { gateName: 'XOR', inputA: true, inputB: false, bulbOn: true },
      },
      {
        id: 's5-6',
        start: 75,
        end: 90,
        sceneTitle: '6. NAND, NOR & XNOR (Inverted Gates)',
        subtitle:
          'NAND simply flips AND, NOR flips OR, and XNOR turns ON when both inputs match. Together, these seven gates power every smartphone and processor on Earth.',
        codeLines: [
          'A = True; B = True',
          'print(not (A and B))  # NAND -> False',
          'print(A == B)         # XNOR -> True',
        ],
        highlightLine: 1,
        consoleOutput: ['False', 'True'],
        visualMode: 'gates',
        visualState: { gateName: 'NAND', inputA: true, inputB: true, bulbOn: false },
      },
      {
        id: 's5-7',
        start: 90,
        end: 105,
        sceneTitle: '7. Combining Gates in Real Python',
        subtitle:
          'You can test every truth table row and flip glowing wires interactively inside our Boolean Gates simulator tab anytime!',
        codeLines: ['age = 16; vip = True', 'if age >= 18 or vip:', '    print("Welcome in!")'],
        highlightLine: 1,
        consoleOutput: ['Welcome in!'],
        visualMode: 'wrapup',
      },
    ],
  },

  {
    id: 'vid-loops',
    index: 6,
    title: 'Repeating Tasks: for, range() & while Loops',
    shortTitle: 'Loops & Range',
    durationSeconds: 105, // 01:45
    level: 'Core Logic',
    summary: 'How for loops, range(start, stop, step), while loops, break, and continue automate work.',
    cues: [
      {
        id: 's6-1',
        start: 0,
        end: 15,
        sceneTitle: '1. Why Programmers Love Loops',
        subtitle:
          'Suppose you want to send a message five times or process a thousand scores. Loops let Python repeat indented steps cleanly without copy-pasting code.',
        codeLines: ['for i in range(3):', '    print("Lap:", i)'],
        highlightLine: 0,
        consoleOutput: ['Lap: 0', 'Lap: 1', 'Lap: 2'],
        visualMode: 'loops',
        visualState: { loopStep: 0, loopLabel: 'for i in range(3)' },
      },
      {
        id: 's6-2',
        start: 15,
        end: 30,
        sceneTitle: '2. How range() Counts From Zero',
        subtitle:
          'In Python, range three produces zero, one, and two—stopping right before three. The variable i steps up one number each lap around the loop.',
        codeLines: ['for i in range(3):', '    print("Lap:", i)'],
        highlightLine: 1,
        consoleOutput: ['Lap: 0', 'Lap: 1', 'Lap: 2'],
        visualMode: 'loops',
        visualState: { loopStep: 1, loopLabel: 'i steps: 0 → 1 → 2' },
      },
      {
        id: 's6-3',
        start: 30,
        end: 45,
        sceneTitle: '3. Custom Start & Step With range()',
        subtitle:
          'Want to count from two up to six by twos? Pass start, stop, and step into range, and Python jumps smoothly across each even number.',
        codeLines: ['for n in range(2, 8, 2):', '    print(n)  # 2, 4, 6'],
        highlightLine: 0,
        consoleOutput: ['2', '4', '6'],
        visualMode: 'loops',
        visualState: { loopStep: 2, loopLabel: 'range(2, 8, 2)' },
      },
      {
        id: 's6-4',
        start: 45,
        end: 60,
        sceneTitle: '4. Looping Through Text & Items',
        subtitle:
          'A for loop does not only count numbers—it can visit every letter inside a word or every item inside a list, one character per turn.',
        codeLines: ['for letter in "CAT":', '    print(letter)'],
        highlightLine: 1,
        consoleOutput: ['C', 'A', 'T'],
        visualMode: 'lists',
        visualState: { listItems: ['C', 'A', 'T'], activeListIndex: 1 },
      },
      {
        id: 's6-5',
        start: 60,
        end: 75,
        sceneTitle: '5. while Loops Keep Running While True',
        subtitle:
          'Use a while loop when you want to repeat until a goal is reached, like charging a battery while energy is less than or equal to three.',
        codeLines: ['energy = 1', 'while energy <= 3:', '    print("Charging", energy)', '    energy += 1'],
        highlightLine: 1,
        consoleOutput: ['Charging 1', 'Charging 2', 'Charging 3'],
        visualMode: 'loops',
        visualState: { loopStep: 1, loopLabel: 'while energy <= 3' },
      },
      {
        id: 's6-6',
        start: 75,
        end: 90,
        sceneTitle: '6. Early Stop With break & Always Update Counters',
        subtitle:
          'Always remember to update your counter inside a while loop so it does not run forever. You can also write break anytime to exit a loop early.',
        codeLines: [
          'for n in range(10):',
          '    if n == 2:',
          '        break   # exits loop now',
          '    print(n)',
        ],
        highlightLine: 2,
        consoleOutput: ['0', '1'],
        visualMode: 'loops',
        visualState: { loopStep: 2, loopLabel: 'break exits cleanly' },
      },
      {
        id: 's6-7',
        start: 90,
        end: 105,
        sceneTitle: '7. Recap: Build Repetition Easily',
        subtitle:
          'Choose for loops when you know how many steps or items you have, and while loops when waiting for a condition to turn False.',
        codeLines: ['total = 0', 'for n in range(1, 4):', '    total += n', 'print(total)  # 6'],
        highlightLine: 3,
        consoleOutput: ['6'],
        visualMode: 'wrapup',
      },
    ],
  },

  {
    id: 'vid-lists',
    index: 7,
    title: 'Lists, Slicing, String Tools & Dictionaries',
    shortTitle: 'Lists & Dicts',
    durationSeconds: 105, // 01:45
    level: 'Building',
    summary: 'Zero-based and negative indexing, slicing, .append(), .pop(), and key-value dictionaries.',
    cues: [
      {
        id: 's7-1',
        start: 0,
        end: 15,
        sceneTitle: '1. Lists Hold Ordered Items in Brackets',
        subtitle:
          'When you want to store several items under one name, place them inside square brackets separated by commas, just like a neat row of numbered lockers.',
        codeLines: ['fruits = ["apple", "mango", "kiwi"]', 'print(fruits)'],
        highlightLine: 0,
        consoleOutput: ["['apple', 'mango', 'kiwi']"],
        visualMode: 'lists',
        visualState: { listItems: ['apple', 'mango', 'kiwi'], activeListIndex: 0 },
      },
      {
        id: 's7-2',
        start: 15,
        end: 30,
        sceneTitle: '2. Zero Indexing & Negative End Indexing',
        subtitle:
          'Every list position starts counting at zero. Even handier: index negative one reaches straight from the right end to grab the very last item.',
        codeLines: [
          'fruits = ["apple", "mango", "kiwi"]',
          'print(fruits[0])    # apple',
          'print(fruits[-1])   # kiwi (last!)',
        ],
        highlightLine: 2,
        consoleOutput: ['apple', 'kiwi'],
        visualMode: 'lists',
        visualState: { listItems: ['apple', 'mango', 'kiwi'], activeListIndex: 2 },
      },
      {
        id: 's7-3',
        start: 30,
        end: 45,
        sceneTitle: '3. Growing & Measuring Lists (.append, len)',
        subtitle:
          'Lists are flexible! Call dot append to tuck a new item onto the end, dot pop to remove from the end, and len() to count total items.',
        codeLines: [
          'fruits = ["apple", "mango", "kiwi"]',
          'fruits.append("pear")',
          'print(len(fruits))  # 4',
        ],
        highlightLine: 1,
        consoleOutput: ['4'],
        visualMode: 'lists',
        visualState: { listItems: ['apple', 'mango', 'kiwi', 'pear'], activeListIndex: 3 },
      },
      {
        id: 's7-4',
        start: 45,
        end: 60,
        sceneTitle: '4. Slicing Parts of a List',
        subtitle:
          'Need a smaller slice of your list? Put two numbers with a colon inside brackets, like zero colon two, to copy items from index zero up to one.',
        codeLines: [
          'nums = [10, 20, 30, 40]',
          'print(nums[0:2])   # [10, 20]',
          'print(nums[2:])    # [30, 40]',
        ],
        highlightLine: 1,
        consoleOutput: ['[10, 20]', '[30, 40]'],
        visualMode: 'lists',
        visualState: { listItems: ['10', '20', '30', '40'], activeListIndex: 1 },
      },
      {
        id: 's7-5',
        start: 60,
        end: 75,
        sceneTitle: '5. Handy String Methods',
        subtitle:
          'Words also come with built-in superpowers. Dot strip cleans extra spaces around edges, and dot upper converts every letter neatly into capitals.',
        codeLines: [
          'msg = "  hello python  "',
          'clean = msg.strip().upper()',
          'print(clean)  # HELLO PYTHON',
        ],
        highlightLine: 1,
        consoleOutput: ['HELLO PYTHON'],
        visualMode: 'datatypes',
        visualState: {
          pillTags: [
            { label: '.strip()', kind: 'Removes outer spaces' },
            { label: '.upper()', kind: 'ALL CAPITALS' },
            { label: '.lower()', kind: 'all lowercase' },
            { label: 'len(msg)', kind: 'Counts letters' },
          ],
        },
      },
      {
        id: 's7-6',
        start: 75,
        end: 90,
        sceneTitle: '6. Dictionaries: Named Key-Value Pairs',
        subtitle:
          'While lists look up items by number, dictionaries use curly braces to pair meaningful labels—called keys—with their values, just like a mini profile card.',
        codeLines: [
          'student = {"name": "Maya", "score": 95}',
          'print(student["name"])   # Maya',
          'print(student["score"])  # 95',
        ],
        highlightLine: 1,
        consoleOutput: ['Maya', '95'],
        visualMode: 'variables',
        visualState: {
          boxName: 'student["name"]',
          oldBoxValue: 'dict',
          boxValue: '"Maya"',
          secondBoxName: 'student["score"]',
          secondBoxValue: '95',
        },
      },
      {
        id: 's7-7',
        start: 90,
        end: 105,
        sceneTitle: '7. Recap: Lists vs Dictionaries',
        subtitle:
          'Choose lists for ordered sequences of items, and dictionaries whenever you want fast lookups by clear descriptive names.',
        codeLines: ['tasks = ["study", "code"]', 'user = {"level": 2, "ready": True}', 'print(tasks[0], user["level"])'],
        highlightLine: 2,
        consoleOutput: ['study 2'],
        visualMode: 'wrapup',
      },
    ],
  },

  {
    id: 'vid-functions',
    index: 8,
    title: 'Functions (def), Parameters & Return Values',
    shortTitle: 'Functions (def)',
    durationSeconds: 90, // 01:30
    level: 'Building',
    summary: 'Reusable mini-recipes with def, parameters, defaults, return vs print(), and clean scope.',
    cues: [
      {
        id: 's8-1',
        start: 0,
        end: 15,
        sceneTitle: '1. Functions Are Reusable Mini-Recipes',
        subtitle:
          'A function lets you save a group of steps under one memorable name using def. Write the recipe once, then call it as many times as you need.',
        codeLines: [
          'def say_hello():',
          '    print("Welcome to Python!")',
          '',
          'say_hello()',
        ],
        highlightLine: 0,
        consoleOutput: ['Welcome to Python!'],
        visualMode: 'functions',
        visualState: { fnName: 'say_hello()', fnIn: 'call', fnOut: 'Welcome!' },
      },
      {
        id: 's8-2',
        start: 15,
        end: 30,
        sceneTitle: '2. Sending Inputs With Parameters',
        subtitle:
          'Add parameter names inside the parentheses so your recipe accepts custom inputs. Each time you call the function, pass in a fresh value.',
        codeLines: [
          'def greet(name):',
          '    print(f"Hi, {name}!")',
          '',
          'greet("Liam")',
          'greet("Zara")',
        ],
        highlightLine: 3,
        consoleOutput: ['Hi, Liam!', 'Hi, Zara!'],
        visualMode: 'functions',
        visualState: { fnName: 'greet(name)', fnIn: '"Liam"', fnOut: '"Hi, Liam!"' },
      },
      {
        id: 's8-3',
        start: 30,
        end: 45,
        sceneTitle: '3. Handing Results Back With return',
        subtitle:
          'Print only shows text on screen, whereas return sends a real calculated answer back out of the function so your code can save and reuse it.',
        codeLines: [
          'def double(num):',
          '    return num * 2',
          '',
          'answer = double(7)',
          'print(answer + 1)  # 15',
        ],
        highlightLine: 1,
        consoleOutput: ['15'],
        visualMode: 'functions',
        visualState: { fnName: 'double(num)', fnIn: '7', fnOut: '14' },
      },
      {
        id: 's8-4',
        start: 45,
        end: 60,
        sceneTitle: '4. Multiple Inputs & Default Values',
        subtitle:
          'Functions can take two or more inputs separated by commas, and you can give any parameter a default backup value in case the caller skips it.',
        codeLines: [
          'def add_tax(price, rate=0.10):',
          '    return price + price * rate',
          '',
          'print(add_tax(100))       # 110.0',
          'print(add_tax(100, 0.2))  # 120.0',
        ],
        highlightLine: 0,
        consoleOutput: ['110.0', '120.0'],
        visualMode: 'functions',
        visualState: { fnName: 'add_tax(100)', fnIn: '100', fnOut: '110.0' },
      },
      {
        id: 's8-5',
        start: 60,
        end: 75,
        sceneTitle: '5. Local Scope Keeps Variables Neat',
        subtitle:
          'Variables created inside a function stay private inside that recipe. This protects the rest of your program from accidental name clashes.',
        codeLines: [
          'def make_bonus(x):',
          '    bonus = x + 5   # local inside',
          '    return bonus',
          '',
          'result = make_bonus(10)  # 15',
        ],
        highlightLine: 1,
        consoleOutput: ['15'],
        visualMode: 'variables',
        visualState: { boxName: 'result', oldBoxValue: 'make_bonus(10)', boxValue: '15' },
      },
      {
        id: 's8-6',
        start: 75,
        end: 90,
        sceneTitle: '6. You Know Core Python! Keep Building',
        subtitle:
          'Congratulations! You covered syntax, variables, math, if-else, gates, loops, lists, dictionaries, and functions. Test your skills in the Sandbox and Quizzes!',
        codeLines: [
          'def ready():',
          '    return "You are a Python builder!"',
          '',
          'print(ready())',
        ],
        highlightLine: 3,
        consoleOutput: ['You are a Python builder!'],
        visualMode: 'wrapup',
      },
    ],
  },
];

export function formatVideoTime(seconds: number, maxSeconds = 180): string {
  const clamped = Math.max(0, Math.min(maxSeconds, Math.floor(seconds)));
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
