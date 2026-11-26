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
      'Syntax is the set of grammar rules Python follows. Unlike languages that use curly braces { }, Python uses colons (:) and consistent 4-space indentation to organize code blocks.',
    exampleCode: `score = 80
if score >= 50:
    print("Passed")`,
    visualType: 'syntax',
    question: 'What happens if you forget to indent the line right after an if statement?',
    options: [
      'Python skips the line silently',
      'Python raises an IndentationError',
      'Python automatically adds 4 spaces',
      'The program prints False',
    ],
    correctIndex: 1,
    explanation:
      'Python uses indentation to know which lines belong inside a block. Missing indentation after a colon (:) triggers an IndentationError.',
  },
  {
    id: 'variables',
    index: '02',
    title: 'Variables',
    definition:
      'A variable is a named label that stores a value in memory so your program can read, update, and reuse it later using the = assignment operator.',
    exampleCode: `name = "Maya"
points = 10
points = points + 5
print(name, points)`,
    visualType: 'variables',
    question: 'In Python, what does the single = sign in age = 18 do?',
    options: [
      'Checks if age is equal to 18',
      'Assigns the value 18 to the variable age',
      'Prints 18 to the screen',
      'Deletes the variable age',
    ],
    correctIndex: 1,
    explanation:
      'A single = assigns (stores) a value on the right into the variable name on the left. Double == is used for comparison.',
  },
  {
    id: 'datatypes',
    index: '03',
    title: 'Data Types',
    definition:
      'Every value in Python has a type that determines what operations work on it: int (whole numbers), float (decimals), str (text), and bool (True or False).',
    exampleCode: `age = 19
gpa = 3.85
course = "CS101"
enrolled = True`,
    visualType: 'datatypes',
    question: 'Which Python data type represents "42" wrapped in quotation marks?',
    options: ['int', 'float', 'str (string)', 'bool'],
    correctIndex: 2,
    explanation:
      'Anything enclosed inside single or double quotes is a string (str), even if the characters inside are digits.',
  },
  {
    id: 'operators',
    index: '04',
    title: 'Operators',
    definition:
      'Operators perform actions on values. Arithmetic operators (+, -, *, /) compute numbers, while comparison operators (==, !=, >, <, >=, <=) produce True or False.',
    exampleCode: `x = 12
y = 5
print(x + y)
print(x >= 10)`,
    visualType: 'operators',
    question: 'What does 10 != 12 evaluate to in Python?',
    options: ['True', 'False', '2', 'SyntaxError'],
    correctIndex: 0,
    explanation:
      'The != operator means "not equal to". Since 10 is not equal to 12, the expression evaluates to True.',
  },
  {
    id: 'boolean',
    index: '05',
    title: 'Boolean Logic',
    definition:
      'Boolean logic combines True and False values using and (both must be True), or (at least one must be True), and not (flips the Boolean value).',
    exampleCode: `is_adult = True
has_id = False
print(is_adult and has_id)
print(is_adult or has_id)`,
    visualType: 'boolean',
    question: 'What is the result of (True and False) or True?',
    options: ['False', 'True', 'None', 'Error'],
    correctIndex: 1,
    explanation:
      'First, (True and False) evaluates to False. Then False or True evaluates to True because "or" only needs one side to be True.',
  },
  {
    id: 'ifelse',
    index: '06',
    title: 'If-Else',
    definition:
      'Conditional statements let your program choose different paths. Python checks the if condition first, optional elif checks next, and falls back to else if all were False.',
    exampleCode: `temp = 32
if temp > 30:
    print("Hot day")
else:
    print("Mild day")`,
    visualType: 'ifelse',
    question: 'When does an else block execute?',
    options: [
      'Always, even if the if condition was True',
      'Only when the preceding if and elif conditions are False',
      'Before the if condition is checked',
      'Only when there is a syntax error',
    ],
    correctIndex: 1,
    explanation:
      'The else branch is a fallback path that runs exclusively when none of the earlier if or elif conditions evaluated to True.',
  },
  {
    id: 'loops',
    index: '07',
    title: 'Loops',
    definition:
      'Loops repeat a block of code automatically. A for loop steps through every item in a sequence (like range(3)), while a while loop repeats as long as a condition stays True.',
    exampleCode: `for i in range(1, 4):
    print("Step", i)`,
    visualType: 'loops',
    question: 'How many times does the loop `for i in range(3):` run?',
    options: ['2 times', '3 times (0, 1, 2)', '4 times (0, 1, 2, 3)', 'Forever'],
    correctIndex: 1,
    explanation:
      'range(3) generates 3 numbers starting at 0 and stopping before 3: 0, 1, and 2.',
  },
  {
    id: 'functions',
    index: '08',
    title: 'Functions',
    definition:
      'A function groups reusable steps under a name using def. It can accept inputs (parameters) and send a computed result back using return.',
    exampleCode: `def add(a, b):
    return a + b

print(add(4, 7))`,
    visualType: 'functions',
    question: 'Which keyword is used to send a value back from a function?',
    options: ['send', 'output', 'return', 'def'],
    correctIndex: 2,
    explanation:
      'def defines the function, and return sends a value back to the line of code that called the function.',
  },
  {
    id: 'lists',
    index: '09',
    title: 'Lists',
    definition:
      'A list stores an ordered collection of items inside square brackets [ ]. Items are indexed starting at 0 and can be added or changed dynamically.',
    exampleCode: `fruits = ["apple", "mango", "kiwi"]
print(fruits[0])
fruits.append("pear")`,
    visualType: 'lists',
    question: 'In colors = ["red", "green", "blue"], what is colors[1]?',
    options: ['"red"', '"green"', '"blue"', 'IndexError'],
    correctIndex: 1,
    explanation:
      'Python lists use zero-based indexing: index 0 is "red", index 1 is "green", and index 2 is "blue".',
  },
  {
    id: 'strings',
    index: '10',
    title: 'Strings',
    definition:
      'A string is a sequence of characters wrapped in quotes. You can measure its length with len(), transform case with .upper(), or slice parts using [start:end].',
    exampleCode: `word = "Python"
print(word.upper())
print(word[0:2])`,
    visualType: 'strings',
    question: 'What does len("Code") return?',
    options: ['3', '4', '5', '"Code"'],
    correctIndex: 1,
    explanation:
      'len() counts every character in the string. "Code" has 4 characters: C, o, d, e.',
  },
];

export interface QuizQuestion {
  id: string;
  topic: string;
  question: string;
  codeSnippet?: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export const PRACTICE_QUIZ: QuizQuestion[] = [
  {
    id: 'q1',
    topic: 'Comparison Operators',
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
    id: 'q2',
    topic: 'Boolean Logic',
    question: 'What is the result of "True and False"?',
    options: ['True', 'False', 'None', 'SyntaxError'],
    correctIndex: 1,
    explanation:
      'The "and" operator only returns True when BOTH sides are True. Since one side is False, the result is False.',
  },
  {
    id: 'q3',
    topic: 'Conditionals',
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
    id: 'q4',
    topic: 'Python Syntax',
    question: 'Which symbol is required at the end of an "if" statement header?',
    options: ['; (semicolon)', ': (colon)', '{ (curly brace)', '-> (arrow)'],
    correctIndex: 1,
    explanation:
      'Python requires a colon (:) after if, elif, else, for, while, and def headers before starting an indented block.',
  },
  {
    id: 'q5',
    topic: 'Boolean Logic',
    question: 'What does "not True" return?',
    options: ['True', 'False', '0', '"not True"'],
    correctIndex: 1,
    explanation:
      'The "not" operator inverts a Boolean value: not True becomes False, and not False becomes True.',
  },
  {
    id: 'q6',
    topic: 'Boolean Logic',
    question: 'What is the result of "False or True"?',
    options: ['True', 'False', 'None', 'Error'],
    correctIndex: 0,
    explanation:
      'The "or" operator returns True if at least one of the two sides is True.',
  },
  {
    id: 'q7',
    topic: 'Syntax & Indentation',
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
    id: 'q8',
    topic: 'Loops',
    question: 'What numbers does range(4) produce in a for loop?',
    options: ['1, 2, 3, 4', '0, 1, 2, 3', '0, 1, 2, 3, 4', '1, 2, 3'],
    correctIndex: 1,
    explanation:
      'range(4) starts at 0 by default and stops right before 4, producing 0, 1, 2, and 3.',
  },
  {
    id: 'q9',
    topic: 'Functions',
    question: 'Which keyword starts a function definition in Python?',
    options: ['function', 'func', 'def', 'define'],
    correctIndex: 2,
    explanation:
      'In Python, functions are always defined using the "def" keyword followed by the function name and parentheses.',
  },
  {
    id: 'q10',
    topic: 'Lists',
    question: 'What does nums[0] return if nums = [15, 30, 45]?',
    options: ['0', '15', '30', '45'],
    correctIndex: 1,
    explanation:
      'Lists are zero-indexed, so index 0 always accesses the very first element in the list (15).',
  },
];
