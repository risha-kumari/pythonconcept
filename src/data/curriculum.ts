export interface CodePreset {
  id: string;
  label: string;
  code: string;
  sampleInput?: string;
}

export const DETECTOR_PRESETS: CodePreset[] = [
  {
    id: 'age-eligibility',
    label: 'Age Eligibility',
    code: `age = 18

if age >= 18:
    print("Eligible")
else:
    print("Not Eligible")`,
  },
  {
    id: 'marks-pass',
    label: 'Pass / Fail Grade',
    code: `marks = 72

if marks >= 40:
    print("Pass")
else:
    print("Fail")`,
  },
  {
    id: 'logical-and',
    label: 'Logical AND / OR',
    code: `has_ticket = True
age = 16

if has_ticket and age >= 15:
    print("Welcome inside")
else:
    print("Access denied")`,
  },
  {
    id: 'logic-gate-or',
    label: 'Logic Gate (OR)',
    code: `A = True
B = False
result = A or B
print("Output:", result)`,
  },
  {
    id: 'for-loop',
    label: 'For Loop & List',
    code: `scores = [10, 25, 40]
total = 0

for s in scores:
    total += s

print("Total:", total)`,
  },
  {
    id: 'function-def',
    label: 'Function & Return',
    code: `def square(n):
    return n * n

result = square(6)
print("Square is", result)`,
  },
];

export const SYNTAX_ERROR_PRESETS: CodePreset[] = [
  {
    id: 'missing-colon',
    label: 'Missing Colon',
    code: `marks = 85

if marks >= 40
    print("Pass")`,
  },
  {
    id: 'indent-error',
    label: 'Indentation Error',
    code: `age = 20

if age >= 18:
print("Eligible")`,
  },
  {
    id: 'unclosed-bracket',
    label: 'Missing Bracket',
    code: `items = ["apple", "banana"
print(items)`,
  },
  {
    id: 'unclosed-quote',
    label: 'Unclosed Quote',
    code: `name = "Python
print(name)`,
  },
  {
    id: 'typo-keyword',
    label: 'Misspelled Keyword',
    code: `score = 90
if score > 50:
    pritn("Great job")`,
  },
  {
    id: 'assign-in-if',
    label: 'Wrong Operator (=)',
    code: `level = 5
if level = 5:
    print("Max level")`,
  },
];

export interface LessonTopic {
  id: string;
  index: string;
  title: string;
  definition: string;
  exampleCode: string;
  visualType:
    | 'syntax'
    | 'variables'
    | 'datatypes'
    | 'operators'
    | 'boolean'
    | 'ifelse'
    | 'loops'
    | 'functions'
    | 'lists'
    | 'strings';
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export const LEARNING_LESSONS: LessonTopic[] = [
  {
    id: 'syntax',
    index: '01',
    title: 'Python Syntax',
    definition:
      'Syntax just means the spelling and spacing rules of Python. Python uses a colon (:) at the end of a line and 4 spaces at the start of the next line to show what goes inside a group.',
    exampleCode: `score = 80
if score >= 50:
    print("Passed")`,
    visualType: 'syntax',
    question: 'What happens if you forget the 4 spaces on the line right after an if statement?',
    options: [
      'Python skips the line quietly',
      'Python shows a spacing error (IndentationError)',
      'Python adds the 4 spaces for you',
      'The program prints False',
    ],
    correctIndex: 1,
    explanation:
      'Python needs those spaces after a colon (:) to know which lines belong inside the if check. Without the spaces, Python stops and shows an IndentationError.',
  },
  {
    id: 'variables',
    index: '02',
    title: 'Variables',
    definition:
      'A variable is like a labeled box that holds a value, such as a number or a word. You use a single = sign to put a value into the box so you can use or change it later.',
    exampleCode: `name = "Maya"
points = 10
points = points + 5
print(name, points)`,
    visualType: 'variables',
    question: 'In Python, what does age = 18 do?',
    options: [
      'Checks if age is equal to 18',
      'Saves the number 18 inside the name age',
      'Prints 18 on the screen',
      'Deletes the word age',
    ],
    correctIndex: 1,
    explanation:
      'One = sign saves the value on the right (18) into the box on the left (age). If you want to compare two things, use two equals signs (==).',
  },
  {
    id: 'datatypes',
    index: '03',
    title: 'Data Types',
    definition:
      'Python puts values into 4 easy groups: whole numbers (int, like 19), numbers with a dot (float, like 3.85), words inside quotes (str, like "Hi"), and yes/no values (bool: True or False).',
    exampleCode: `age = 19
gpa = 3.85
course = "CS101"
enrolled = True`,
    visualType: 'datatypes',
    question: 'What kind of value is "42" when it has quote marks around it?',
    options: [
      'int (whole number)',
      'float (decimal number)',
      'str (text)',
      'bool (True or False)',
    ],
    correctIndex: 2,
    explanation:
      'Anything written inside quote marks (" ") is treated as text (a string, or str), even if it looks like a number.',
  },
  {
    id: 'operators',
    index: '04',
    title: 'Operators',
    definition:
      'Operators are math and compare signs. Math signs (+, -, *, /) calculate numbers. Compare signs (==, !=, >, <, >=, <=) check two values and answer True or False.',
    exampleCode: `x = 12
y = 5
print(x + y)
print(x >= 10)`,
    visualType: 'operators',
    question: 'What does 10 != 12 mean and give in Python?',
    options: ['True (10 is not equal to 12)', 'False', '2', 'An error'],
    correctIndex: 0,
    explanation:
      'The != sign asks "Are these two NOT equal?". Since 10 and 12 are different numbers, the answer is True.',
  },
  {
    id: 'boolean',
    index: '05',
    title: 'Boolean Logic',
    definition:
      'Boolean logic mixes True and False answers. Use "and" when both parts must be True, "or" when at least one part needs to be True, and "not" to flip True to False (or False to True).',
    exampleCode: `is_adult = True
has_id = False
print(is_adult and has_id)
print(is_adult or has_id)`,
    visualType: 'boolean',
    question: 'What is the answer to (True and False) or True?',
    options: ['False', 'True', 'Nothing', 'Error'],
    correctIndex: 1,
    explanation:
      'First, (True and False) is False because both are not True. Next, False or True is True because "or" only needs one side to be True.',
  },
  {
    id: 'ifelse',
    index: '06',
    title: 'If-Else',
    definition:
      'If-else lets your code pick which path to take, just like a fork in the road. Python checks "if" first, checks "elif" next if needed, and runs "else" at the end when nothing else was True.',
    exampleCode: `temp = 32
if temp > 30:
    print("Hot day")
else:
    print("Mild day")`,
    visualType: 'ifelse',
    question: 'When does the "else" part of the code run?',
    options: [
      'Every time, even if the "if" check was True',
      'Only when the "if" and "elif" checks above it were False',
      'Before the "if" check starts',
      'Only when your code has a mistake',
    ],
    correctIndex: 1,
    explanation:
      '"else" is the backup plan. It only runs if none of the "if" or "elif" checks above it were True.',
  },
  {
    id: 'loops',
    index: '07',
    title: 'Loops',
    definition:
      'Loops repeat the same steps automatically so you do not have to write them again and again. A "for" loop steps through items one by one, and a "while" loop keeps going while a rule is True.',
    exampleCode: `for i in range(1, 4):
    print("Step", i)`,
    visualType: 'loops',
    question: 'How many times does the loop `for i in range(3):` run?',
    options: [
      '2 times',
      '3 times (for 0, 1, and 2)',
      '4 times (for 0, 1, 2, and 3)',
      'It never stops',
    ],
    correctIndex: 1,
    explanation:
      'range(3) gives 3 numbers starting from 0 and stopping right before 3: 0, 1, and 2.',
  },
  {
    id: 'functions',
    index: '08',
    title: 'Functions',
    definition:
      'A function is a mini-recipe you name using "def" so you can reuse those steps anytime. You can send values into it and use "return" to hand back the final answer.',
    exampleCode: `def add(a, b):
    return a + b

print(add(4, 7))`,
    visualType: 'functions',
    question: 'Which word sends an answer back out of a function?',
    options: ['send', 'output', 'return', 'def'],
    correctIndex: 2,
    explanation:
      '"def" creates the function, and "return" hands the answer back to the line that called it.',
  },
  {
    id: 'lists',
    index: '09',
    title: 'Lists',
    definition:
      'A list keeps several items in order inside square brackets [ ], just like a shopping list. Python starts counting spots from 0, and you can add or change items anytime.',
    exampleCode: `fruits = ["apple", "mango", "kiwi"]
print(fruits[0])
fruits.append("pear")`,
    visualType: 'lists',
    question: 'In colors = ["red", "green", "blue"], what is colors[1]?',
    options: ['"red"', '"green"', '"blue"', 'An error'],
    correctIndex: 1,
    explanation:
      'Python starts counting list spots at 0: spot 0 is "red", spot 1 is "green", and spot 2 is "blue".',
  },
  {
    id: 'strings',
    index: '10',
    title: 'Strings',
    definition:
      'A string is just text inside quote marks, like "Python". You can count its letters with len(), turn it into big letters with .upper(), or cut out a piece using [start:end].',
    exampleCode: `word = "Python"
print(word.upper())
print(word[0:2])`,
    visualType: 'strings',
    question: 'What does len("Code") give you?',
    options: ['3', '4', '5', '"Code"'],
    correctIndex: 1,
    explanation:
      'len() counts how many letters or characters are inside the quotes. "Code" has 4 letters: C, o, d, e.',
  },
];

export type PracticeCategory =
  | 'logic-gates'
  | 'boolean-expressions'
  | 'syntax-errors'
  | 'core-python';

export interface QuizQuestion {
  id: string;
  category: PracticeCategory;
  topic: string;
  subTopic: string;
  question: string;
  codeSnippet?: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export const PRACTICE_CATEGORIES: { id: PracticeCategory; label: string }[] = [
  { id: 'logic-gates', label: 'Logic Gates' },
  { id: 'boolean-expressions', label: 'Boolean Expressions' },
  { id: 'syntax-errors', label: 'Syntax Errors' },
  { id: 'core-python', label: 'Core Python' },
];

export const PRACTICE_QUIZ: QuizQuestion[] = [
  // LOGIC GATES
  {
    id: 'lg1',
    category: 'logic-gates',
    topic: 'Logic Gates',
    subTopic: 'Basic Gates (AND / OR / NOT)',
    question: 'If inputs are A = 1 (True) and B = 0 (False), what is the output of an AND gate?',
    codeSnippet: `A = True\nB = False\noutput = A and B\nprint(output)`,
    options: ['True (Bulb ON)', 'False (Bulb OFF)', 'None', 'SyntaxError'],
    correctIndex: 1,
    explanation:
      'An AND gate only outputs 1 (True) when BOTH inputs A and B are 1. Since B is False (0), the output is False and the bulb stays OFF.',
  },
  {
    id: 'lg2',
    category: 'logic-gates',
    topic: 'Logic Gates',
    subTopic: 'XOR Gate',
    question: 'When does a 2-input XOR gate output 1 (True)?',
    codeSnippet: `A = True\nB = False\noutput = A != B\nprint(output)`,
    options: [
      'Only when both A and B are 1',
      'Only when A and B are different (one 1, one 0)',
      'Only when both A and B are 0',
      'Whenever A is 1',
    ],
    correctIndex: 1,
    explanation:
      'XOR (Exclusive OR) outputs 1 (True) strictly when its two inputs differ: (1, 0) or (0, 1). Matching inputs like (1, 1) or (0, 0) produce 0.',
  },
  {
    id: 'lg3',
    category: 'logic-gates',
    topic: 'Logic Gates',
    subTopic: 'Universal Gates (NAND / NOR)',
    question: 'What is the output of a NAND gate when both inputs are A = True and B = True?',
    codeSnippet: `A = True\nB = True\noutput = not (A and B)\nprint(output)`,
    options: ['True (1)', 'False (0)', 'True and False', 'Error'],
    correctIndex: 1,
    explanation:
      'NAND means NOT-AND. Since A and B is True for (True, True), applying NOT flips the result to False (0).',
  },
  {
    id: 'lg4',
    category: 'logic-gates',
    topic: 'Logic Gates',
    subTopic: 'Universal Gates (NAND / NOR)',
    question: 'Which input pair makes a NOR gate (not (A or B)) turn the output bulb ON (True)?',
    options: [
      'A = True, B = True',
      'A = True, B = False',
      'A = False, B = True',
      'A = False, B = False',
    ],
    correctIndex: 3,
    explanation:
      'A NOR gate is the inverse of OR. Because A or B is False only when both A and B are False, not (A or B) outputs True exclusively for (False, False).',
  },
  {
    id: 'lg5',
    category: 'logic-gates',
    topic: 'Logic Gates',
    subTopic: 'XNOR Gate',
    question: 'What will this Python XNOR gate simulation print?',
    codeSnippet: `A = False\nB = False\noutput = not (A ^ B)\nprint(output)`,
    options: ['False', 'True', '0', 'TypeError'],
    correctIndex: 1,
    explanation:
      'XNOR (Exclusive NOR) checks equivalence: it outputs True whenever A and B are equal—both True or both False. Here both are False, so output is True.',
  },

  // BOOLEAN EXPRESSIONS
  {
    id: 'q2',
    category: 'boolean-expressions',
    topic: 'Boolean Expressions',
    subTopic: 'Basic Operators (and / or / not)',
    question: 'What is the result of "True and False"?',
    options: ['True', 'False', 'None', 'SyntaxError'],
    correctIndex: 1,
    explanation:
      'The "and" operator only returns True when BOTH sides are True. Since one side is False, the result is False.',
  },
  {
    id: 'q5',
    category: 'boolean-expressions',
    topic: 'Boolean Expressions',
    subTopic: 'Basic Operators (and / or / not)',
    question: 'What does "not True" return?',
    options: ['True', 'False', '0', '"not True"'],
    correctIndex: 1,
    explanation:
      'The "not" operator inverts a Boolean value: not True becomes False, and not False becomes True.',
  },
  {
    id: 'q6',
    category: 'boolean-expressions',
    topic: 'Boolean Expressions',
    subTopic: 'Basic Operators (and / or / not)',
    question: 'What is the result of "False or True"?',
    options: ['True', 'False', 'None', 'Error'],
    correctIndex: 0,
    explanation:
      'The "or" operator returns True if at least one of the two sides is True.',
  },
  {
    id: 'be1',
    category: 'boolean-expressions',
    topic: 'Boolean Expressions',
    subTopic: 'Operator Precedence',
    question: 'What does this expression print in Python (watch operator precedence)?',
    codeSnippet: `result = True or False and False\nprint(result)`,
    options: ['False', 'True', 'None', 'SyntaxError'],
    correctIndex: 1,
    explanation:
      'In Python, "and" has higher precedence than "or", so False and False evaluates first (False). Then True or False evaluates to True.',
  },
  {
    id: 'be2',
    category: 'boolean-expressions',
    topic: 'Boolean Expressions',
    subTopic: 'Compound Conditions',
    question: 'What value is printed by this compound Boolean expression?',
    codeSnippet: `age = 16\nhas_pass = True\nis_banned = False\nprint((age >= 18 or has_pass) and not is_banned)`,
    options: ['False', 'True', '16', 'TypeError'],
    correctIndex: 1,
    explanation:
      'age >= 18 is False, but has_pass is True so (False or True) is True. not is_banned is also True, and True and True equals True.',
  },
  {
    id: 'be3',
    category: 'boolean-expressions',
    topic: 'Boolean Expressions',
    subTopic: 'Negation & Comparisons',
    question: 'What is the final Boolean output of this code?',
    codeSnippet: `x = 10\ny = 5\nprint(not (x < y or x == 10))`,
    options: ['True', 'False', '10', 'None'],
    correctIndex: 1,
    explanation:
      'Inside parentheses, x < y is False while x == 10 is True, making (False or True) equal True. Applying outer "not" flips True to False.',
  },

  // SYNTAX ERRORS
  {
    id: 'q4',
    category: 'syntax-errors',
    topic: 'Syntax Errors',
    subTopic: 'Colons & Headers',
    question: 'Which symbol is required at the end of an "if" statement header?',
    options: ['; (semicolon)', ': (colon)', '{ (curly brace)', '-> (arrow)'],
    correctIndex: 1,
    explanation:
      'Python requires a colon (:) after if, elif, else, for, while, and def headers before starting an indented block.',
  },
  {
    id: 'q7',
    category: 'syntax-errors',
    topic: 'Syntax Errors',
    subTopic: 'IndentationError',
    question: 'What will happen when you run this code?',
    codeSnippet: `age = 20\nif age >= 18:\nprint("Adult")`,
    options: [
      'It prints Adult',
      'It raises an IndentationError',
      'It prints nothing',
      'It prints True',
    ],
    correctIndex: 1,
    explanation:
      'Line 3 is not indented under the if statement. Python requires indentation (typically 4 spaces) inside every block.',
  },
  {
    id: 'se1',
    category: 'syntax-errors',
    topic: 'Syntax Errors',
    subTopic: 'Assignment (=) vs Comparison (==)',
    question: 'Why does this code fail with a SyntaxError?',
    codeSnippet: `score = 100\nif score = 100:\n    print("Perfect")`,
    options: [
      'score should be wrapped in quotes',
      'Line 2 uses assignment (=) instead of equality comparison (==)',
      'print("Perfect") needs a semicolon',
      '100 is too large for an if condition',
    ],
    correctIndex: 1,
    explanation:
      'Inside an if condition, Python requires "==" to test equality. Using a single "=" (assignment) raises a SyntaxError.',
  },
  {
    id: 'se2',
    category: 'syntax-errors',
    topic: 'Syntax Errors',
    subTopic: 'Unclosed Brackets & Quotes',
    question: 'What syntax mistake is present in this snippet?',
    codeSnippet: `nums = [10, 20, 30\nprint(nums)`,
    options: [
      'Missing colon after nums',
      'Missing closing square bracket ] on line 1',
      'print(nums) needs indentation',
      'Lists cannot hold three numbers',
    ],
    correctIndex: 1,
    explanation:
      'The list literal opened with "[" on line 1 is never closed with "]". Every opening bracket, parenthesis, or brace must have a matching closer.',
  },
  {
    id: 'se3',
    category: 'syntax-errors',
    topic: 'Syntax Errors',
    subTopic: 'Unclosed Brackets & Quotes',
    question: 'How do you fix the SyntaxError in this code?',
    codeSnippet: `greeting = "Hello Python\nprint(greeting)`,
    options: [
      'Add a closing double quote " at the end of line 1',
      'Remove print(greeting)',
      'Indent line 2 by 4 spaces',
      'Replace = with ==',
    ],
    correctIndex: 0,
    explanation:
      'Line 1 opens a string with " but misses the closing ", causing an unterminated string literal SyntaxError.',
  },
  {
    id: 'se4',
    category: 'syntax-errors',
    topic: 'Syntax Errors',
    subTopic: 'Colons & Headers',
    question: 'Which line causes a SyntaxError in this conditional block?',
    codeSnippet: `temp = 25\nif temp > 30:\n    print("Hot")\nelif temp > 20\n    print("Warm")`,
    options: [
      'Line 1 (temp = 25)',
      'Line 2 (if temp > 30:)',
      'Line 4 (elif temp > 20 is missing a colon :)',
      'Line 5 (print("Warm"))',
    ],
    correctIndex: 2,
    explanation:
      'Every elif header must end with a colon (:), just like if and else. Line 4 should be "elif temp > 20:".',
  },

  // CORE PYTHON
  {
    id: 'q1',
    category: 'core-python',
    topic: 'Core Python',
    subTopic: 'Comparison Operators',
    question: 'What does "==" mean in Python?',
    options: [
      'Assigns a value to a variable',
      'Checks whether two values are equal',
      'Multiplies two numbers',
      'Ends an if statement',
    ],
    correctIndex: 1,
    explanation:
      '"==" is the equality comparison operator. It checks if two values are equal and returns True or False.',
  },
  {
    id: 'q3',
    category: 'core-python',
    topic: 'Core Python',
    subTopic: 'Conditionals',
    question: 'What happens when an "if" condition is False?',
    options: [
      'Python crashes with a LogicError',
      'Python runs the indented if block anyway',
      'Python skips the if block and checks elif or else if present',
      'Python restarts the program',
    ],
    correctIndex: 2,
    explanation:
      'When an if condition evaluates to False, its indented block is skipped and Python moves on to any elif, else, or the next unindented line.',
  },
  {
    id: 'q8',
    category: 'core-python',
    topic: 'Core Python',
    subTopic: 'Loops',
    question: 'What numbers does range(4) produce in a for loop?',
    options: ['1, 2, 3, 4', '0, 1, 2, 3', '0, 1, 2, 3, 4', '1, 2, 3'],
    correctIndex: 1,
    explanation:
      'range(4) starts at 0 by default and stops right before 4, producing 0, 1, 2, and 3.',
  },
  {
    id: 'q9',
    category: 'core-python',
    topic: 'Core Python',
    subTopic: 'Functions',
    question: 'Which keyword starts a function definition in Python?',
    options: ['function', 'func', 'def', 'define'],
    correctIndex: 2,
    explanation:
      'In Python, functions are always defined using the "def" keyword followed by the function name and parentheses.',
  },
  {
    id: 'q10',
    category: 'core-python',
    topic: 'Core Python',
    subTopic: 'Lists',
    question: 'What does nums[0] return if nums = [15, 30, 45]?',
    options: ['0', '15', '30', '45'],
    correctIndex: 1,
    explanation:
      'Lists are zero-indexed, so index 0 always accesses the very first element in the list (15).',
  },
];

export type TestDifficulty = 'easy' | 'medium' | 'hard';

export interface TestQuestion {
  id: string;
  difficulty: TestDifficulty;
  points: number;
  topic: string;
  question: string;
  codeSnippet?: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export const TEST_QUESTIONS: TestQuestion[] = [
  // EASY (5 questions · 1 pt each)
  {
    id: 't-e1',
    difficulty: 'easy',
    points: 1,
    topic: 'Variables',
    question: 'What is printed when this code runs?',
    codeSnippet: `x = 5\nx = x + 3\nprint(x)`,
    options: ['5', '3', '8', 'x + 3'],
    correctIndex: 2,
    explanation:
      'First x stores 5. Next, x + 3 evaluates to 8 and reassigns x to 8, so print(x) outputs 8.',
  },
  {
    id: 't-e2',
    difficulty: 'easy',
    points: 1,
    topic: 'Data Types',
    question: 'Which Python data type is returned by type("3.14")?',
    options: ['float', 'int', 'str', 'bool'],
    correctIndex: 2,
    explanation:
      'Because "3.14" is wrapped in quotation marks, Python treats it as text (str), not a decimal number (float).',
  },
  {
    id: 't-e3',
    difficulty: 'easy',
    points: 1,
    topic: 'Boolean Logic',
    question: 'What is the output of False or True?',
    options: ['False', 'True', 'None', 'SyntaxError'],
    correctIndex: 1,
    explanation:
      'The or operator evaluates to True whenever at least one operand is True.',
  },
  {
    id: 't-e4',
    difficulty: 'easy',
    points: 1,
    topic: 'Python Syntax',
    question: 'Which statement has valid Python syntax?',
    options: [
      'if age >= 18\n    print("OK")',
      'if age >= 18:\n    print("OK")',
      'if (age >= 18) {\n    print("OK")\n}',
      'if age => 18:\n    print("OK")',
    ],
    correctIndex: 1,
    explanation:
      'Python requires a colon (:) after the if condition and indentation on the next line. Python uses >=, not =>, and does not use curly braces for blocks.',
  },
  {
    id: 't-e5',
    difficulty: 'easy',
    points: 1,
    topic: 'Lists',
    question: 'What does items[1] return for items = ["pen", "book", "bag"]?',
    options: ['"pen"', '"book"', '"bag"', 'IndexError'],
    correctIndex: 1,
    explanation:
      'List indexing starts at 0: items[0] is "pen", items[1] is "book", and items[2] is "bag".',
  },

  // MEDIUM (5 questions · 2 pts each)
  {
    id: 't-m1',
    difficulty: 'medium',
    points: 2,
    topic: 'Conditionals',
    question: 'What will this if / elif / else chain print?',
    codeSnippet: `score = 75\nif score >= 90:\n    print("A")\nelif score >= 70:\n    print("B")\nelif score >= 60:\n    print("C")\nelse:\n    print("F")`,
    options: ['A', 'B', 'B and C', 'F'],
    correctIndex: 1,
    explanation:
      'score >= 90 is False, so Python checks the first elif (score >= 70), which is True. It prints "B" and skips all remaining elif and else branches.',
  },
  {
    id: 't-m2',
    difficulty: 'medium',
    points: 2,
    topic: 'Loops',
    question: 'What value of total is printed after this loop finishes?',
    codeSnippet: `total = 0\nfor i in range(1, 5):\n    total += i\nprint(total)`,
    options: ['6', '10', '15', '5'],
    correctIndex: 1,
    explanation:
      'range(1, 5) produces 1, 2, 3, and 4 (stopping before 5). Adding them gives 1 + 2 + 3 + 4 = 10.',
  },
  {
    id: 't-m3',
    difficulty: 'medium',
    points: 2,
    topic: 'Strings',
    question: 'What does word[1:4] evaluate to when word = "Python"?',
    options: ['"Pyt"', '"yth"', '"ytho"', '"tho"'],
    correctIndex: 1,
    explanation:
      'String slicing [start:end] starts at index 1 ("y") and stops before index 4 ("o"), returning indices 1, 2, and 3: "yth".',
  },
  {
    id: 't-m4',
    difficulty: 'medium',
    points: 2,
    topic: 'Boolean Logic',
    question: 'What is the result of this Boolean expression?',
    codeSnippet: `a = False\nb = True\nprint(not a and (5 > 10 or b))`,
    options: ['True', 'False', 'None', 'Error'],
    correctIndex: 0,
    explanation:
      'not a becomes True. Inside parentheses, 5 > 10 is False, and False or True is True. Finally, True and True evaluates to True.',
  },
  {
    id: 't-m5',
    difficulty: 'medium',
    points: 2,
    topic: 'Functions',
    question: 'What is printed by the following function call?',
    codeSnippet: `def multiply(a, b=2):\n    return a * b\n\nprint(multiply(5) + multiply(2, 3))`,
    options: ['10', '12', '16', '11'],
    correctIndex: 2,
    explanation:
      'multiply(5) uses the default b=2, returning 5 * 2 = 10. multiply(2, 3) overrides b with 3, returning 2 * 3 = 6. Their sum is 10 + 6 = 16.',
  },

  // HARD (5 questions · 3 pts each)
  {
    id: 't-h1',
    difficulty: 'hard',
    points: 3,
    topic: 'Loops',
    question: 'What is the final output of this while loop?',
    codeSnippet: `n = 0\nsum_odd = 0\nwhile n < 6:\n    n += 1\n    if n % 2 == 0:\n        continue\n    sum_odd += n\nprint(sum_odd)`,
    options: ['6', '9', '12', '15'],
    correctIndex: 1,
    explanation:
      'n increments from 1 to 6. Even values (2, 4, 6) hit continue and skip sum_odd += n. Only odd values (1, 3, 5) are added: 1 + 3 + 5 = 9.',
  },
  {
    id: 't-h2',
    difficulty: 'hard',
    points: 3,
    topic: 'Lists',
    question: 'What does this code print about list aliasing?',
    codeSnippet: `a = [1, 2]\nb = a\nb.append(3)\nprint(a, len(a))`,
    options: ['[1, 2] 2', '[1, 2, 3] 3', '[1, 2] 3', 'TypeError'],
    correctIndex: 1,
    explanation:
      'b = a does not copy the list; both names reference the exact same list object in memory. Appending 3 via b mutates a as well, so a is [1, 2, 3] with length 3.',
  },
  {
    id: 't-h3',
    difficulty: 'hard',
    points: 3,
    topic: 'Conditionals & Loops',
    question: 'What number is printed by this nested loop?',
    codeSnippet: `count = 0\nfor i in range(3):\n    for j in range(3):\n        if i < j:\n            count += 1\nprint(count)`,
    options: ['3', '4', '6', '9'],
    correctIndex: 0,
    explanation:
      'For i, j in {0, 1, 2}, the pairs where i < j are (0, 1), (0, 2), and (1, 2). That is 3 pairs total, so count becomes 3.',
  },
  {
    id: 't-h4',
    difficulty: 'hard',
    points: 3,
    topic: 'Data Structures',
    question: 'What is the output of this dictionary lookup?',
    codeSnippet: `scores = {"amy": 10, "leo": 15}\nval = scores.get("max", 4) + scores["amy"]\nprint(val)`,
    options: ['KeyError', '10', '14', '19'],
    correctIndex: 2,
    explanation:
      'scores.get("max", 4) safely returns the fallback 4 because "max" is not in the dictionary. Adding scores["amy"] (10) produces 14.',
  },
  {
    id: 't-h5',
    difficulty: 'hard',
    points: 3,
    topic: 'Functions',
    question: 'What does this recursive function print?',
    codeSnippet: `def cascade(n):\n    if n <= 1:\n        return 1\n    return n + cascade(n - 1)\n\nprint(cascade(4))`,
    options: ['4', '6', '10', '24'],
    correctIndex: 2,
    explanation:
      'cascade(4) returns 4 + cascade(3) -> 4 + 3 + cascade(2) -> 4 + 3 + 2 + cascade(1) = 4 + 3 + 2 + 1 = 10.',
  },
];

