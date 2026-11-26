export interface SyntaxIssue {
  id: string;
  line: number;
  column: number;
  lineContent: string;
  title: string;
  reason: string;
  correctedLine: string;
  explanation: string;
  fixedFullCode: string;
}

export interface DetectedConcept {
  category:
    | 'Variable'
    | 'Condition'
    | 'Comparison Operator'
    | 'Logical Operator'
    | 'Loop'
    | 'Function'
    | 'Input / Output'
    | 'List'
    | 'String'
    | 'Dictionary';
  token: string;
  line: number;
  summary: string;
}

export interface ConditionFlowModel {
  hasCondition: boolean;
  conditionExpr: string;
  trueLabel: string;
  falseLabel: string;
  conditionLine: number;
  trueLine: number | null;
  falseLine: number | null;
}

export interface ExecutionStep {
  stepIndex: number;
  line: number;
  codeLine: string;
  statementType:
    | 'assign'
    | 'if'
    | 'elif'
    | 'else'
    | 'for'
    | 'while'
    | 'def'
    | 'return'
    | 'print'
    | 'input'
    | 'expr';
  description: string;
  variables: Record<string, string>;
  conditionExpr: string | null;
  conditionEvaluated: string | null;
  conditionResult: boolean | null;
  branchTaken: 'true' | 'false' | null;
  output: string[];
  flowNode: 'start' | 'check' | 'true_branch' | 'false_branch' | 'output' | 'end';
}

export interface PythonAnalysisResult {
  isValidSyntax: boolean;
  syntaxIssues: SyntaxIssue[];
  detectedConcepts: DetectedConcept[];
  conceptCategories: string[];
  logicExplanation: string[];
  conditionFlow: ConditionFlowModel;
  usesInput: boolean;
  steps: ExecutionStep[];
  finalOutput: string[];
  runtimeNotice: string | null;
}

const KEYWORD_TYPOS: Record<string, string> = {
  pritn: 'print',
  prnt: 'print',
  pirnt: 'print',
  prin: 'print',
  esle: 'else',
  elss: 'else',
  els: 'else',
  eliff: 'elif',
  elseif: 'elif',
  whlie: 'while',
  wile: 'while',
  whil: 'while',
  fro: 'for',
  fo: 'for',
  dfe: 'def',
  deff: 'def',
  retrun: 'return',
  reutrn: 'return',
  retun: 'return',
  ture: 'True',
  Ture: 'True',
  trye: 'True',
  flase: 'False',
  Flase: 'False',
  fales: 'False',
  inpt: 'input',
  improt: 'import',
  imoprt: 'import',
};

const BLOCK_KEYWORDS = ['if', 'elif', 'else', 'for', 'while', 'def', 'try', 'except', 'finally', 'with', 'class'];

function stripCommentOutsideStrings(line: string): string {
  let inSingle = false;
  let inDouble = false;
  let escaped = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === '\\') {
      escaped = true;
      continue;
    }
    if (ch === "'" && !inDouble) {
      inSingle = !inSingle;
    } else if (ch === '"' && !inSingle) {
      inDouble = !inDouble;
    } else if (ch === '#' && !inSingle && !inDouble) {
      return line.slice(0, i);
    }
  }
  return line;
}

function replaceAtLine(lines: string[], lineIdx: number, newLine: string): string {
  const copy = [...lines];
  copy[lineIdx] = newLine;
  return copy.join('\n');
}

function insertIndentAtLine(lines: string[], lineIdx: number, spaces: number): string {
  const copy = [...lines];
  copy[lineIdx] = ' '.repeat(spaces) + copy[lineIdx].trimStart();
  return copy.join('\n');
}

export function checkPythonSyntax(code: string): SyntaxIssue[] {
  const lines = code.split('\n');
  const issues: SyntaxIssue[] = [];

  // 1. Check quotes & brackets per line + multiline brackets
  const bracketStack: { char: string; line: number; col: number }[] = [];
  const matchingClose: Record<string, string> = { '(': ')', '[': ']', '{': '}' };
  const matchingOpen: Record<string, string> = { ')': '(', ']': '[', '}': '{' };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const lineNum = i + 1;
    let inSingle = false;
    let inDouble = false;
    let quoteStartCol = 1;
    let escaped = false;

    for (let c = 0; c < rawLine.length; c++) {
      const ch = rawLine[c];
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === '\\' && (inSingle || inDouble)) {
        escaped = true;
        continue;
      }
      if (ch === '#' && !inSingle && !inDouble) {
        break;
      }
      if (ch === "'" && !inDouble) {
        if (!inSingle) {
          inSingle = true;
          quoteStartCol = c + 1;
        } else {
          inSingle = false;
        }
        continue;
      }
      if (ch === '"' && !inSingle) {
        if (!inDouble) {
          inDouble = true;
          quoteStartCol = c + 1;
        } else {
          inDouble = false;
        }
        continue;
      }
      if (!inSingle && !inDouble) {
        if (ch === '(' || ch === '[' || ch === '{') {
          bracketStack.push({ char: ch, line: lineNum, col: c + 1 });
        } else if (ch === ')' || ch === ']' || ch === '}') {
          const top = bracketStack[bracketStack.length - 1];
          if (!top || top.char !== matchingOpen[ch]) {
            const expected = top ? matchingClose[top.char] : 'matching opening bracket';
            const correctedLine = top
              ? rawLine.slice(0, c) + matchingClose[top.char] + rawLine.slice(c + 1)
              : rawLine.slice(0, c) + rawLine.slice(c + 1);
            issues.push({
              id: `bracket-mismatch-${lineNum}-${c}`,
              line: lineNum,
              column: c + 1,
              lineContent: rawLine,
              title: 'Mismatched or Extra Bracket',
              reason: `Found '${ch}' at column ${c + 1}, expected ${expected}.`,
              correctedLine,
              explanation:
                'Every opening bracket (, [, or { in Python must be closed with its exact matching partner ), ], or } in the right order.',
              fixedFullCode: replaceAtLine(lines, i, correctedLine),
            });
          } else {
            bracketStack.pop();
          }
        }
      }
    }

    if (inSingle || inDouble) {
      const quoteChar = inSingle ? "'" : '"';
      const oppositeChar = inSingle ? '"' : "'";
      const trimmedEnd = rawLine.trimEnd();
      const endsWithOpposite = trimmedEnd.endsWith(oppositeChar);
      const correctedLine = endsWithOpposite
        ? trimmedEnd.slice(0, -1) + quoteChar
        : trimmedEnd + quoteChar;

      issues.push({
        id: `unclosed-quote-${lineNum}`,
        line: lineNum,
        column: quoteStartCol,
        lineContent: rawLine,
        title: endsWithOpposite ? 'Mismatched Quotation Marks' : 'Unclosed String Quotation Mark',
        reason: endsWithOpposite
          ? `String started with ${quoteChar} but ended with ${oppositeChar}.`
          : `A string starting with ${quoteChar} on line ${lineNum} was never closed.`,
        correctedLine,
        explanation:
          'Strings in Python must begin and end with the exact same quotation mark (either both single \'...\' or both double "...").',
        fixedFullCode: replaceAtLine(lines, i, correctedLine),
      });
    }
  }

  for (const unclosed of bracketStack) {
    const closeChar = matchingClose[unclosed.char];
    const lineIdx = unclosed.line - 1;
    const correctedLine = lines[lineIdx] + closeChar;
    issues.push({
      id: `unclosed-bracket-${unclosed.line}-${unclosed.col}`,
      line: unclosed.line,
      column: unclosed.col,
      lineContent: lines[lineIdx],
      title: `Missing Closing '${closeChar}'`,
      reason: `Opening '${unclosed.char}' on line ${unclosed.line} is missing a closing '${closeChar}'.`,
      correctedLine,
      explanation: `Whenever you open a '${unclosed.char}' in a function call, list, or dictionary, Python requires a matching '${closeChar}' to know where it ends.`,
      fixedFullCode: replaceAtLine(lines, lineIdx, correctedLine),
    });
  }

  // 2. Line-by-line Python syntax rules (colons, indentation, typos, operators, print parens)
  const indentStack: number[] = [0];
  let expectingIndentFromLine: { line: number; headerIndent: number; keyword: string } | null = null;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const lineNum = i + 1;
    const codeOnly = stripCommentOutsideStrings(rawLine);
    const trimmed = codeOnly.trim();

    if (!trimmed) continue;

    // Check tabs mixed with spaces
    const leadingWhitespace = rawLine.slice(0, rawLine.length - rawLine.trimStart().length);
    if (leadingWhitespace.includes('\t')) {
      const normalized = leadingWhitespace.replace(/\t/g, '    ') + rawLine.trimStart();
      issues.push({
        id: `tab-indent-${lineNum}`,
        line: lineNum,
        column: 1,
        lineContent: rawLine,
        title: 'Tab Indentation Warning',
        reason: 'Tabs are used for indentation; Python recommends 4 spaces per indent level.',
        correctedLine: normalized,
        explanation:
          'Mixing tabs and spaces causes TabError in Python. Using 4 spaces per indentation level keeps code clean and consistent.',
        fixedFullCode: replaceAtLine(lines, i, normalized),
      });
    }

    const indent = leadingWhitespace.replace(/\t/g, '    ').length;

    // Indentation checks
    if (expectingIndentFromLine) {
      if (indent <= expectingIndentFromLine.headerIndent) {
        const targetIndent = expectingIndentFromLine.headerIndent + 4;
        const correctedLine = ' '.repeat(targetIndent) + rawLine.trimStart();
        issues.push({
          id: `expected-indent-${lineNum}`,
          line: lineNum,
          column: 1,
          lineContent: rawLine,
          title: 'Expected Indented Block',
          reason: `Line ${lineNum} must be indented inside the '${expectingIndentFromLine.keyword}' block started on line ${expectingIndentFromLine.line}.`,
          correctedLine,
          explanation:
            'In Python, code that belongs inside an if, else, loop, or function must be indented (usually by 4 spaces) right after the colon (:).',
          fixedFullCode: insertIndentAtLine(lines, i, targetIndent),
        });
      } else {
        indentStack.push(indent);
      }
      expectingIndentFromLine = null;
    } else {
      const currentTop = indentStack[indentStack.length - 1];
      if (indent > currentTop) {
        const correctedLine = ' '.repeat(currentTop) + rawLine.trimStart();
        issues.push({
          id: `unexpected-indent-${lineNum}`,
          line: lineNum,
          column: 1,
          lineContent: rawLine,
          title: 'Unexpected Indentation',
          reason: `Line ${lineNum} is indented by ${indent} spaces, but there is no block header above it.`,
          correctedLine,
          explanation:
            'Python only allows extra indentation after a line ending with a colon (:). Remove extra leading spaces on normal statements.',
          fixedFullCode: insertIndentAtLine(lines, i, currentTop),
        });
      } else if (indent < currentTop) {
        while (indentStack.length > 1 && indentStack[indentStack.length - 1] > indent) {
          indentStack.pop();
        }
        if (indentStack[indentStack.length - 1] !== indent) {
          const expectedIndent = indentStack[indentStack.length - 1];
          const correctedLine = ' '.repeat(expectedIndent) + rawLine.trimStart();
          issues.push({
            id: `unindent-mismatch-${lineNum}`,
            line: lineNum,
            column: 1,
            lineContent: rawLine,
            title: 'Inconsistent Indentation',
            reason: `Indentation (${indent} spaces) does not match any outer block level (${expectedIndent} spaces).`,
            correctedLine,
            explanation:
              'When exiting an indented block, the next line must align cleanly with an earlier indentation level (such as 0 or 4 spaces).',
            fixedFullCode: insertIndentAtLine(lines, i, expectedIndent),
          });
        }
      }
    }

    // Check misspelled keywords at statement start or tokens
    const firstWordMatch = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\b/);
    if (firstWordMatch) {
      const word = firstWordMatch[1];
      const replacement = KEYWORD_TYPOS[word] ?? KEYWORD_TYPOS[word.toLowerCase()];
      if (replacement && replacement !== word) {
        const col = rawLine.indexOf(word) + 1;
        const correctedLine = rawLine.replace(new RegExp(`\\b${word}\\b`), replacement);
        issues.push({
          id: `typo-${lineNum}-${word}`,
          line: lineNum,
          column: col,
          lineContent: rawLine,
          title: `Misspelled Keyword '${word}'`,
          reason: `'${word}' is not a valid Python keyword or built-in. Did you mean '${replacement}'?`,
          correctedLine,
          explanation: `Python keywords and built-in functions are case-sensitive and must be spelled accurately ('${replacement}').`,
          fixedFullCode: replaceAtLine(lines, i, correctedLine),
        });
      }
    }

    // Check Python 2 print without parentheses: print "hello" or print x
    const printNoParenMatch = trimmed.match(/^print\s+(?!\()(.+)$/);
    if (printNoParenMatch) {
      const arg = printNoParenMatch[1].trim();
      const correctedLine = `${' '.repeat(indent)}print(${arg})`;
      issues.push({
        id: `print-parens-${lineNum}`,
        line: lineNum,
        column: rawLine.indexOf('print') + 6,
        lineContent: rawLine,
        title: 'Missing Parentheses in print()',
        reason: 'In Python 3, print is a function and requires parentheses around what you want to display.',
        correctedLine,
        explanation:
          'Unlike older Python 2, modern Python requires parentheses: write print("text") instead of print "text".',
        fixedFullCode: replaceAtLine(lines, i, correctedLine),
      });
    }

    // Check bare input without parentheses
    if (/=\s*input\s*$/.test(trimmed)) {
      const correctedLine = rawLine.replace(/\binput\s*$/, 'input()');
      issues.push({
        id: `input-parens-${lineNum}`,
        line: lineNum,
        column: rawLine.indexOf('input') + 1,
        lineContent: rawLine,
        title: 'Missing Parentheses in input()',
        reason: 'Calling input without () references the function instead of asking the user for input.',
        correctedLine,
        explanation: 'Add () after input to actually call the function and receive user text.',
        fixedFullCode: replaceAtLine(lines, i, correctedLine),
      });
    }

    // Check wrong operators inside expressions (outside strings)
    const outsideStrings = stripStrings(trimmed);
    if (/&&|\|\|/.test(outsideStrings)) {
      const op = outsideStrings.includes('&&') ? '&&' : '||';
      const pyOp = op === '&&' ? 'and' : 'or';
      const correctedLine = rawLine.replace('&&', 'and').replace('||', 'or');
      issues.push({
        id: `logic-op-${lineNum}`,
        line: lineNum,
        column: rawLine.indexOf(op) + 1,
        lineContent: rawLine,
        title: `Invalid Logical Operator '${op}'`,
        reason: `Python uses English words ('and', 'or') instead of '${op}'.`,
        correctedLine,
        explanation: `Replace '${op}' with '${pyOp}'. Python is designed to read like plain English!`,
        fixedFullCode: replaceAtLine(lines, i, correctedLine),
      });
    }

    if (/===|!==|<>/.test(outsideStrings)) {
      const badOp = outsideStrings.includes('===') ? '===' : outsideStrings.includes('!==') ? '!==' : '<>';
      const goodOp = badOp === '===' ? '==' : '!=';
      const correctedLine = rawLine.replace(badOp, goodOp);
      issues.push({
        id: `comp-op-${lineNum}`,
        line: lineNum,
        column: rawLine.indexOf(badOp) + 1,
        lineContent: rawLine,
        title: `Invalid Comparison Operator '${badOp}'`,
        reason: `'${badOp}' is not valid in Python. Use '${goodOp}' instead.`,
        correctedLine,
        explanation: `Python uses '==' to test equality and '!=' to test inequality.`,
        fixedFullCode: replaceAtLine(lines, i, correctedLine),
      });
    }

    if (/(\+\+|--)/.test(outsideStrings)) {
      const bad = outsideStrings.includes('++') ? '++' : '--';
      const varMatch = outsideStrings.match(/([A-Za-z_]\w*)\s*(\+\+|--)/);
      const varName = varMatch ? varMatch[1] : 'x';
      const correctedLine = `${' '.repeat(indent)}${varName} ${bad === '++' ? '+=' : '-='} 1`;
      issues.push({
        id: `inc-op-${lineNum}`,
        line: lineNum,
        column: rawLine.indexOf(bad) + 1,
        lineContent: rawLine,
        title: `Unsupported '${bad}' Operator`,
        reason: `Python does not have '${bad}'. Use '+= 1' or '-= 1' instead.`,
        correctedLine,
        explanation: `To add or subtract 1 from a variable in Python, write ${varName} += 1 or ${varName} -= 1.`,
        fixedFullCode: replaceAtLine(lines, i, correctedLine),
      });
    }

    // Check single '=' inside if / elif / while condition
    const condMatch = trimmed.match(/^(if|elif|while)\b(.*)$/);
    if (condMatch) {
      const bodyPart = stripStrings(condMatch[2]).replace(/:$/, '');
      // Match single '=' not preceded or followed by =, !, <, >
      const singleEqMatch = bodyPart.match(/(?<![=!<>])=(?!=)/);
      if (singleEqMatch && singleEqMatch.index !== undefined) {
        const colInTrimmed = condMatch[1].length + singleEqMatch.index + 1;
        const fixedRaw = rawLine.replace(/(?<![=!<>])=(?!=)/, '==');
        issues.push({
          id: `assign-in-cond-${lineNum}`,
          line: lineNum,
          column: indent + colInTrimmed,
          lineContent: rawLine,
          title: "Assignment '=' Used Inside Condition",
          reason: "Use '==' to compare two values in a condition; '=' is only for assigning variables.",
          correctedLine: fixedRaw,
          explanation:
            "In Python, a single '=' stores a value in a variable (x = 5), while double '==' asks a True/False question (if x == 5:).",
          fixedFullCode: replaceAtLine(lines, i, fixedRaw),
        });
      }
    }

    // Check missing colon ':' on block headers
    const normalizedFirstWord = firstWordMatch ? (KEYWORD_TYPOS[firstWordMatch[1]] ?? firstWordMatch[1]) : '';
    const isBlockHeader =
      BLOCK_KEYWORDS.includes(normalizedFirstWord) &&
      (normalizedFirstWord === 'else' ||
        normalizedFirstWord === 'try' ||
        normalizedFirstWord === 'finally' ||
        new RegExp(`^${firstWordMatch?.[1]}\\b`).test(trimmed));

    if (isBlockHeader) {
      // Ensure 'else' doesn't have random condition without colon, or check trailing ':'
      if (!trimmed.endsWith(':')) {
        const correctedLine = rawLine.trimEnd() + ':';
        issues.push({
          id: `missing-colon-${lineNum}`,
          line: lineNum,
          column: rawLine.trimEnd().length + 1,
          lineContent: rawLine,
          title: "Missing Colon ':'",
          reason: `The '${normalizedFirstWord}' statement on line ${lineNum} must end with a colon ':'.`,
          correctedLine,
          explanation: `Python uses a colon ':' at the end of '${normalizedFirstWord}' headers to signal that an indented block of code follows on the next line.`,
          fixedFullCode: replaceAtLine(lines, i, correctedLine),
        });
      }
      expectingIndentFromLine = {
        line: lineNum,
        headerIndent: indent,
        keyword: normalizedFirstWord,
      };
    }

    // Check misspelled True / False anywhere outside strings
    const tfMatches = outsideStrings.matchAll(/\b(Ture|ture|Flase|flase|true|false)\b/g);
    for (const m of tfMatches) {
      const badWord = m[1];
      const fixedWord = badWord.toLowerCase().startsWith('t') ? 'True' : 'False';
      const correctedLine = rawLine.replace(new RegExp(`\\b${badWord}\\b`), fixedWord);
      issues.push({
        id: `bool-case-${lineNum}-${badWord}`,
        line: lineNum,
        column: rawLine.indexOf(badWord) + 1,
        lineContent: rawLine,
        title: `Incorrect Boolean Spelling '${badWord}'`,
        reason: `Boolean values in Python must be capitalized as 'True' or 'False'.`,
        correctedLine,
        explanation: `Python is case-sensitive: '${fixedWord}' must start with a capital letter.`,
        fixedFullCode: replaceAtLine(lines, i, correctedLine),
      });
    }
  }

  // Deduplicate issues on same line + title
  const seen = new Set<string>();
  return issues.filter((iss) => {
    const key = `${iss.line}:${iss.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function stripStrings(str: string): string {
  return str.replace(/'([^'\\]|\\.)*'/g, "''").replace(/"([^"\\]|\\.)*"/g, '""');
}

export function detectPythonConcepts(code: string): {
  concepts: DetectedConcept[];
  categories: string[];
  logicExplanation: string[];
  conditionFlow: ConditionFlowModel;
  usesInput: boolean;
} {
  const lines = code.split('\n');
  const concepts: DetectedConcept[] = [];
  const logicExplanation: string[] = [];
  let usesInput = false;

  let firstCondExpr = '';
  let firstCondLine = 0;
  let firstTrueLabel = 'Execute if block';
  let firstFalseLabel = 'Continue program';
  let firstTrueLine: number | null = null;
  let firstFalseLine: number | null = null;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const lineNum = i + 1;
    const stripped = stripCommentOutsideStrings(raw).trim();
    if (!stripped) continue;

    const noStrings = stripStrings(stripped);

    // Function definition
    const defMatch = stripped.match(/^def\s+([A-Za-z_]\w*)\s*\(([^)]*)\)\s*:?/);
    if (defMatch) {
      concepts.push({
        category: 'Function',
        token: `def ${defMatch[1]}(${defMatch[2]})`,
        line: lineNum,
        summary: `Defines a reusable function named '${defMatch[1]}'${defMatch[2].trim() ? ` taking parameter(s) (${defMatch[2].trim()})` : ''}.`,
      });
      logicExplanation.push(
        `Line ${lineNum}: Defines function '${defMatch[1]}' so this block of logic can be reused later.`,
      );
      continue;
    }

    // Return
    if (/^return\b/.test(stripped)) {
      concepts.push({
        category: 'Function',
        token: stripped,
        line: lineNum,
        summary: 'Sends a computed value back from a function.',
      });
      logicExplanation.push(`Line ${lineNum}: Returns the result '${stripped.slice(6).trim() || 'None'}' back to the caller.`);
      continue;
    }

    // Conditions
    const ifMatch = stripped.match(/^(if|elif)\s+(.+?):?\s*$/);
    if (ifMatch) {
      const kw = ifMatch[1];
      const expr = ifMatch[2].replace(/:$/, '').trim();
      concepts.push({
        category: 'Condition',
        token: `${kw} ${expr}`,
        line: lineNum,
        summary:
          kw === 'if'
            ? `Tests whether '${expr}' is True before running the indented block.`
            : `Backup condition checked only if earlier conditions were False: '${expr}'.`,
      });
      logicExplanation.push(
        `Line ${lineNum}: Checks if '${expr}' evaluates to True or False.`,
      );
      if (kw === 'if' && !firstCondExpr) {
        firstCondExpr = expr;
        firstCondLine = lineNum;
        // Look ahead for first true action and else action
        const baseIndent = raw.length - raw.trimStart().length;
        for (let j = i + 1; j < lines.length; j++) {
          const nextTrim = stripCommentOutsideStrings(lines[j]).trim();
          if (!nextTrim) continue;
          const nextIndent = lines[j].length - lines[j].trimStart().length;
          if (nextIndent > baseIndent && !firstTrueLine) {
            firstTrueLabel = nextTrim;
            firstTrueLine = j + 1;
          } else if (nextIndent === baseIndent && /^(else|elif)\b/.test(nextTrim)) {
            for (let k = j + 1; k < lines.length; k++) {
              const elseBody = stripCommentOutsideStrings(lines[k]).trim();
              if (!elseBody) continue;
              firstFalseLabel = elseBody;
              firstFalseLine = k + 1;
              break;
            }
            break;
          } else if (nextIndent <= baseIndent) {
            break;
          }
        }
      }
    } else if (/^else\s*:?$/.test(stripped)) {
      concepts.push({
        category: 'Condition',
        token: 'else:',
        line: lineNum,
        summary: 'Fallback branch that runs when the preceding if/elif conditions are False.',
      });
      logicExplanation.push(`Line ${lineNum}: Fallback 'else' path when earlier conditions are False.`);
    }

    // Loops
    const forMatch = stripped.match(/^for\s+([A-Za-z_]\w*)\s+in\s+(.+?):?$/);
    if (forMatch) {
      const iterTarget = forMatch[2].replace(/:$/, '').trim();
      concepts.push({
        category: 'Loop',
        token: `for ${forMatch[1]} in ${iterTarget}`,
        line: lineNum,
        summary: `Repeats the indented block once for each item in '${iterTarget}', assigning each item to '${forMatch[1]}'.`,
      });
      logicExplanation.push(
        `Line ${lineNum}: Starts a 'for' loop iterating '${forMatch[1]}' through '${iterTarget}'.`,
      );
    }

    const whileMatch = stripped.match(/^while\s+(.+?):?$/);
    if (whileMatch) {
      const cond = whileMatch[1].replace(/:$/, '').trim();
      concepts.push({
        category: 'Loop',
        token: `while ${cond}`,
        line: lineNum,
        summary: `Keeps repeating the indented block as long as '${cond}' stays True.`,
      });
      logicExplanation.push(`Line ${lineNum}: Repeats loop body while '${cond}' remains True.`);
      if (!firstCondExpr) {
        firstCondExpr = cond;
        firstCondLine = lineNum;
        firstTrueLabel = 'Run loop body';
        firstFalseLabel = 'Exit loop';
      }
    }

    // Comparison Operators
    const compMatches = noStrings.match(/(==|!=|>=|<=|>|<)/g);
    if (compMatches) {
      for (const op of compMatches) {
        const meaningMap: Record<string, string> = {
          '==': 'Checks if two values are equal',
          '!=': 'Checks if two values are not equal',
          '>=': 'Checks if left value is greater than or equal to right value',
          '<=': 'Checks if left value is less than or equal to right value',
          '>': 'Checks if left value is strictly greater than right value',
          '<': 'Checks if left value is strictly less than right value',
        };
        concepts.push({
          category: 'Comparison Operator',
          token: op,
          line: lineNum,
          summary: `${meaningMap[op]} and produces True or False.`,
        });
      }
    }

    // Logical Operators
    const logicOps = noStrings.match(/\b(and|or|not)\b/g);
    if (logicOps) {
      for (const op of logicOps) {
        const desc =
          op === 'and'
            ? 'Requires both conditions to be True.'
            : op === 'or'
              ? 'Succeeds if at least one condition is True.'
              : 'Flips True to False and False to True.';
        concepts.push({
          category: 'Logical Operator',
          token: op,
          line: lineNum,
          summary: desc,
        });
      }
    }

    // Variables (assignments)
    const assignMatch = stripped.match(/^([A-Za-z_]\w*)\s*(\+=|-=|\*=|\/=|=)(?!=)\s*(.+)$/);
    if (assignMatch && !BLOCK_KEYWORDS.includes(assignMatch[1])) {
      const [, varName, assignOp, rhs] = assignMatch;
      concepts.push({
        category: 'Variable',
        token: `${varName} ${assignOp} ${rhs}`,
        line: lineNum,
        summary:
          assignOp === '='
            ? `Stores '${rhs}' inside the variable named '${varName}'.`
            : `Updates variable '${varName}' using '${assignOp} ${rhs}'.`,
      });
      logicExplanation.push(
        `Line ${lineNum}: ${assignOp === '=' ? `Creates/updates variable '${varName}' with value ${rhs}` : `Updates '${varName}' (${assignOp} ${rhs})`}.`,
      );
    }

    // Input & Output
    if (/\bprint\s*\(/.test(noStrings)) {
      concepts.push({
        category: 'Input / Output',
        token: 'print(...)',
        line: lineNum,
        summary: 'Displays output text or values to the screen.',
      });
      if (!ifMatch && !forMatch && !whileMatch) {
        logicExplanation.push(`Line ${lineNum}: Prints output to the console.`);
      }
    }
    if (/\binput\s*\(/.test(noStrings)) {
      usesInput = true;
      concepts.push({
        category: 'Input / Output',
        token: 'input(...)',
        line: lineNum,
        summary: 'Reads text typed by the user.',
      });
    }

    // Strings
    if (/(['"])(?:\\.|(?!\1).)*\1/.test(stripped)) {
      concepts.push({
        category: 'String',
        token: stripped.match(/(['"])(?:\\.|(?!\1).)*\1/)?.[0] ?? '"..."',
        line: lineNum,
        summary: 'Text data enclosed in quotation marks.',
      });
    }

    // Lists
    if (/\[[^\]]*\]/.test(noStrings) && !/^[A-Za-z_]\w*\[/.test(noStrings)) {
      concepts.push({
        category: 'List',
        token: noStrings.match(/\[[^\]]*\]/)?.[0] ?? '[...]',
        line: lineNum,
        summary: 'Ordered collection of items stored inside square brackets [...].',
      });
    }

    // Dictionaries
    if (/\{[^}]*:[^}]*\}/.test(noStrings)) {
      concepts.push({
        category: 'Dictionary',
        token: '{key: value}',
        line: lineNum,
        summary: 'Key-value mapping enclosed in curly braces {...}.',
      });
    }
  }

  const categories = Array.from(new Set(concepts.map((c) => c.category)));

  return {
    concepts,
    categories,
    logicExplanation:
      logicExplanation.length > 0
        ? logicExplanation
        : ['Enter Python statements such as variables, conditions, loops, or print() to see a step-by-step explanation.'],
    conditionFlow: {
      hasCondition: Boolean(firstCondExpr),
      conditionExpr: firstCondExpr || 'No condition in current code',
      trueLabel: firstTrueLabel,
      falseLabel: firstFalseLabel,
      conditionLine: firstCondLine,
      trueLine: firstTrueLine,
      falseLine: firstFalseLine,
    },
    usesInput,
  };
}

// ============================================================================
// SAFE DETERMINISTIC PYTHON SUBSET INTERPRETER (NO eval / NO Function)
// ============================================================================

type PyVal =
  | number
  | string
  | boolean
  | null
  | PyVal[]
  | { __pyDict: true; entries: Record<string, PyVal> }
  | { __pyFn: true; name: string; params: string[]; body: AstNode[] };

function isPyDict(v: PyVal): v is { __pyDict: true; entries: Record<string, PyVal> } {
  return typeof v === 'object' && v !== null && !Array.isArray(v) && '__pyDict' in v;
}

function isPyFn(v: PyVal): v is { __pyFn: true; name: string; params: string[]; body: AstNode[] } {
  return typeof v === 'object' && v !== null && !Array.isArray(v) && '__pyFn' in v;
}

export function formatPyVal(val: PyVal): string {
  if (val === null) return 'None';
  if (typeof val === 'boolean') return val ? 'True' : 'False';
  if (typeof val === 'number') return String(val);
  if (typeof val === 'string') return JSON.stringify(val);
  if (Array.isArray(val)) return `[${val.map(formatPyVal).join(', ')}]`;
  if (isPyDict(val)) {
    const pairs = Object.entries(val.entries).map(([k, v]) => `${JSON.stringify(k)}: ${formatPyVal(v)}`);
    return `{${pairs.join(', ')}}`;
  }
  if (isPyFn(val)) return `<function ${val.name}>`;
  return String(val);
}

function formatPyPrint(val: PyVal): string {
  if (typeof val === 'string') return val;
  return formatPyVal(val);
}

function toBool(val: PyVal): boolean {
  if (val === null || val === false) return false;
  if (val === true) return true;
  if (typeof val === 'number') return val !== 0;
  if (typeof val === 'string') return val.length > 0;
  if (Array.isArray(val)) return val.length > 0;
  if (isPyDict(val)) return Object.keys(val.entries).length > 0;
  return true;
}

function pyEqual(a: PyVal, b: PyVal): boolean {
  if (typeof a === 'boolean' && typeof b === 'number') return (a ? 1 : 0) === b;
  if (typeof a === 'number' && typeof b === 'boolean') return a === (b ? 1 : 0);
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, idx) => pyEqual(item, b[idx]));
  }
  return a === b;
}

interface AstNode {
  line: number;
  raw: string;
  type:
    | 'if_chain'
    | 'for'
    | 'while'
    | 'def'
    | 'return'
    | 'break'
    | 'continue'
    | 'pass'
    | 'assign'
    | 'aug_assign'
    | 'subscript_assign'
    | 'multi_assign'
    | 'expr';
  branches?: { kind: 'if' | 'elif' | 'else'; cond?: string; line: number; raw: string; body: AstNode[] }[];
  loopVar?: string;
  iterExpr?: string;
  condExpr?: string;
  fnName?: string;
  params?: string[];
  target?: string;
  targets?: string[];
  indexExpr?: string;
  op?: string;
  expr?: string;
  body?: AstNode[];
}

interface RawLine {
  line: number;
  indent: number;
  text: string;
}

function parseBlock(rawLines: RawLine[], startIdx: number, expectedIndent: number): { nodes: AstNode[]; nextIdx: number } {
  const nodes: AstNode[] = [];
  let idx = startIdx;

  while (idx < rawLines.length) {
    const item = rawLines[idx];
    if (item.indent < expectedIndent) {
      break;
    }

    const text = item.text;

    // if / elif / else chain
    if (/^if(?=\s|\().+:$/.test(text)) {
      const branches: NonNullable<AstNode['branches']> = [];
      const ifCond = text.slice(2, -1).trim();
      const ifBody = parseBlock(rawLines, idx + 1, item.indent + 1);
      branches.push({ kind: 'if', cond: ifCond, line: item.line, raw: text, body: ifBody.nodes });
      idx = ifBody.nextIdx;

      while (idx < rawLines.length && rawLines[idx].indent === item.indent) {
        const nextText = rawLines[idx].text;
        if (/^elif(?=\s|\().+:$/.test(nextText)) {
          const elifCond = nextText.slice(4, -1).trim();
          const elifBody = parseBlock(rawLines, idx + 1, item.indent + 1);
          branches.push({ kind: 'elif', cond: elifCond, line: rawLines[idx].line, raw: nextText, body: elifBody.nodes });
          idx = elifBody.nextIdx;
        } else if (/^else\s*:$/.test(nextText)) {
          const elseBody = parseBlock(rawLines, idx + 1, item.indent + 1);
          branches.push({ kind: 'else', line: rawLines[idx].line, raw: nextText, body: elseBody.nodes });
          idx = elseBody.nextIdx;
          break;
        } else {
          break;
        }
      }

      nodes.push({ line: item.line, raw: text, type: 'if_chain', branches });
      continue;
    }

    // for loop
    const forMatch = text.match(/^for\s+([A-Za-z_]\w*)\s+in\s+(.+):$/);
    if (forMatch) {
      const body = parseBlock(rawLines, idx + 1, item.indent + 1);
      nodes.push({
        line: item.line,
        raw: text,
        type: 'for',
        loopVar: forMatch[1],
        iterExpr: forMatch[2].trim(),
        body: body.nodes,
      });
      idx = body.nextIdx;
      continue;
    }

    // while loop
    const whileMatch = text.match(/^while(?=\s|\()(.+):$/);
    if (whileMatch) {
      const body = parseBlock(rawLines, idx + 1, item.indent + 1);
      nodes.push({
        line: item.line,
        raw: text,
        type: 'while',
        condExpr: whileMatch[1].trim(),
        body: body.nodes,
      });
      idx = body.nextIdx;
      continue;
    }

    // def
    const defMatch = text.match(/^def\s+([A-Za-z_]\w*)\s*\(([^)]*)\)\s*:$/);
    if (defMatch) {
      const body = parseBlock(rawLines, idx + 1, item.indent + 1);
      const params = defMatch[2]
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);
      nodes.push({
        line: item.line,
        raw: text,
        type: 'def',
        fnName: defMatch[1],
        params,
        body: body.nodes,
      });
      idx = body.nextIdx;
      continue;
    }

    // return / break / continue / pass
    if (/^return\b/.test(text)) {
      nodes.push({
        line: item.line,
        raw: text,
        type: 'return',
        expr: text.slice(6).trim() || 'None',
      });
      idx++;
      continue;
    }
    if (text === 'break') {
      nodes.push({ line: item.line, raw: text, type: 'break' });
      idx++;
      continue;
    }
    if (text === 'continue') {
      nodes.push({ line: item.line, raw: text, type: 'continue' });
      idx++;
      continue;
    }
    if (text === 'pass') {
      nodes.push({ line: item.line, raw: text, type: 'pass' });
      idx++;
      continue;
    }

    // augmented assignment
    const augMatch = text.match(/^([A-Za-z_]\w*)\s*(\+=|-=|\*=|\/=|%=|\/\/=)\s*(.+)$/);
    if (augMatch) {
      nodes.push({
        line: item.line,
        raw: text,
        type: 'aug_assign',
        target: augMatch[1],
        op: augMatch[2],
        expr: augMatch[3].trim(),
      });
      idx++;
      continue;
    }

    // subscript assignment: items[0] = val or dict["key"] = val
    const subAssignMatch = text.match(/^([A-Za-z_]\w*)\[(.+?)\]\s*=(?!=)\s*(.+)$/);
    if (subAssignMatch) {
      nodes.push({
        line: item.line,
        raw: text,
        type: 'subscript_assign',
        target: subAssignMatch[1],
        indexExpr: subAssignMatch[2].trim(),
        expr: subAssignMatch[3].trim(),
      });
      idx++;
      continue;
    }

    // tuple / multi-target assignment: a, b = 10, 20
    const multiAssignMatch = text.match(/^([A-Za-z_]\w*(?:\s*,\s*[A-Za-z_]\w*)+)\s*=(?!=)\s*(.+)$/);
    if (multiAssignMatch) {
      nodes.push({
        line: item.line,
        raw: text,
        type: 'multi_assign',
        targets: multiAssignMatch[1].split(',').map((t) => t.trim()),
        expr: multiAssignMatch[2].trim(),
      });
      idx++;
      continue;
    }

    // assignment
    const assignMatch = text.match(/^([A-Za-z_]\w*)\s*=(?!=)\s*(.+)$/);
    if (assignMatch) {
      nodes.push({
        line: item.line,
        raw: text,
        type: 'assign',
        target: assignMatch[1],
        expr: assignMatch[2].trim(),
      });
      idx++;
      continue;
    }

    // expression statement (print, method call, etc.)
    nodes.push({
      line: item.line,
      raw: text,
      type: 'expr',
      expr: text,
    });
    idx++;
  }

  return { nodes, nextIdx: idx };
}

// Tokenizer & Recursive Descent Expression Evaluator
type TokenKind = 'num' | 'str' | 'fstr' | 'ident' | 'op' | 'punct' | 'eof';
interface Token {
  kind: TokenKind;
  value: string;
}

function tokenizeExpr(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < input.length) {
    const ch = input[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    // f-string
    if ((ch === 'f' || ch === 'F') && (input[i + 1] === '"' || input[i + 1] === "'")) {
      const quote = input[i + 1];
      i += 2;
      let str = '';
      while (i < input.length && input[i] !== quote) {
        if (input[i] === '\\' && i + 1 < input.length) {
          str += input[i + 1];
          i += 2;
        } else {
          str += input[i];
          i++;
        }
      }
      i++;
      tokens.push({ kind: 'fstr', value: str });
      continue;
    }
    // string
    if (ch === '"' || ch === "'") {
      const quote = ch;
      i++;
      let str = '';
      while (i < input.length && input[i] !== quote) {
        if (input[i] === '\\' && i + 1 < input.length) {
          const next = input[i + 1];
          str += next === 'n' ? '\n' : next === 't' ? '\t' : next;
          i += 2;
        } else {
          str += input[i];
          i++;
        }
      }
      i++;
      tokens.push({ kind: 'str', value: str });
      continue;
    }
    // number
    if (/[0-9]/.test(ch) || (ch === '.' && /[0-9]/.test(input[i + 1] ?? ''))) {
      let numStr = '';
      while (i < input.length && /[0-9.]/.test(input[i])) {
        numStr += input[i];
        i++;
      }
      tokens.push({ kind: 'num', value: numStr });
      continue;
    }
    // identifier / keyword
    if (/[A-Za-z_]/.test(ch)) {
      let id = '';
      while (i < input.length && /[A-Za-z0-9_]/.test(input[i])) {
        id += input[i];
        i++;
      }
      if (id === 'and' || id === 'or' || id === 'not' || id === 'in' || id === 'is') {
        tokens.push({ kind: 'op', value: id });
      } else {
        tokens.push({ kind: 'ident', value: id });
      }
      continue;
    }
    // multi-char ops
    const two = input.slice(i, i + 2);
    if (['==', '!=', '>=', '<=', '//', '**'].includes(two)) {
      tokens.push({ kind: 'op', value: two });
      i += 2;
      continue;
    }
    if ('+-*/%<>='.includes(ch)) {
      tokens.push({ kind: 'op', value: ch });
      i++;
      continue;
    }
    if ('()[]{},:.'.includes(ch)) {
      tokens.push({ kind: 'punct', value: ch });
      i++;
      continue;
    }
    i++;
  }
  tokens.push({ kind: 'eof', value: '' });
  return tokens;
}

class ReturnSignal {
  value: PyVal;
  constructor(value: PyVal) {
    this.value = value;
  }
}

class BreakSignal {}
class ContinueSignal {}

interface ExecContext {
  env: Record<string, PyVal>;
  globalEnv: Record<string, PyVal>;
  output: string[];
  steps: ExecutionStep[];
  inputQueue: string[];
  inputCursor: number;
  maxSteps: number;
  callDepth: number;
  runtimeNotice: string | null;
}

function evalExpression(expr: string, ctx: ExecContext): PyVal {
  const tokens = tokenizeExpr(expr);
  let pos = 0;

  const peek = () => tokens[pos] ?? { kind: 'eof', value: '' };
  const consume = () => tokens[pos++];

  function lookupVar(name: string): PyVal {
    if (name in ctx.env) return ctx.env[name];
    if (name in ctx.globalEnv) return ctx.globalEnv[name];
    throw new Error(`Name '${name}' is not defined yet.`);
  }

  function parseOr(): PyVal {
    let left = parseAnd();
    while (peek().kind === 'op' && peek().value === 'or') {
      consume();
      const right = parseAnd();
      left = toBool(left) ? left : right;
    }
    return left;
  }

  function parseAnd(): PyVal {
    let left = parseNot();
    while (peek().kind === 'op' && peek().value === 'and') {
      consume();
      const right = parseNot();
      left = toBool(left) ? right : left;
    }
    return left;
  }

  function parseNot(): PyVal {
    if (peek().kind === 'op' && peek().value === 'not') {
      consume();
      return !toBool(parseNot());
    }
    return parseComparison();
  }

  function isCompOp(tok: Token): boolean {
    return (
      tok.kind === 'op' &&
      ['==', '!=', '<', '<=', '>', '>=', 'in', 'is'].includes(tok.value)
    );
  }

  function parseComparison(): PyVal {
    let left = parseAddSub();
    const isNotIn = () => peek().kind === 'op' && peek().value === 'not' && tokens[pos + 1]?.value === 'in';
    if (!isCompOp(peek()) && !isNotIn()) {
      return left;
    }
    let result = true;
    while (isCompOp(peek()) || isNotIn()) {
      let op = consume().value;
      if (op === 'not') {
        consume(); // 'in'
        op = 'not in';
      } else if (op === 'is' && peek().kind === 'op' && peek().value === 'not') {
        consume();
        op = 'is not';
      }
      const right = parseAddSub();
      let stepOk = false;
      if (op === '==') stepOk = pyEqual(left, right);
      else if (op === '!=') stepOk = !pyEqual(left, right);
      else if (op === 'is') stepOk = left === right;
      else if (op === 'is not') stepOk = left !== right;
      else if (op === '<') {
        stepOk = typeof left === 'string' && typeof right === 'string' ? left < right : Number(left) < Number(right);
      } else if (op === '<=') {
        stepOk = typeof left === 'string' && typeof right === 'string' ? left <= right : Number(left) <= Number(right);
      } else if (op === '>') {
        stepOk = typeof left === 'string' && typeof right === 'string' ? left > right : Number(left) > Number(right);
      } else if (op === '>=') {
        stepOk = typeof left === 'string' && typeof right === 'string' ? left >= right : Number(left) >= Number(right);
      } else if (op === 'in' || op === 'not in') {
        let found = false;
        if (typeof right === 'string') found = right.includes(String(left));
        else if (Array.isArray(right)) found = right.some((item) => pyEqual(item, left));
        else if (isPyDict(right)) found = String(left) in right.entries;
        stepOk = op === 'in' ? found : !found;
      }
      result = result && stepOk;
      left = right;
    }
    return result;
  }

  function parseAddSub(): PyVal {
    let left = parseMulDiv();
    while (peek().kind === 'op' && (peek().value === '+' || peek().value === '-')) {
      const op = consume().value;
      const right = parseMulDiv();
      if (op === '+') {
        if (typeof left === 'string' && typeof right === 'string') left = left + right;
        else if (Array.isArray(left) && Array.isArray(right)) left = [...left, ...right];
        else left = Number(left) + Number(right);
      } else {
        left = Number(left) - Number(right);
      }
    }
    return left;
  }

  function parseMulDiv(): PyVal {
    let left = parseUnary();
    while (peek().kind === 'op' && ['*', '/', '//', '%'].includes(peek().value)) {
      const op = consume().value;
      const right = parseUnary();
      if (op === '*') {
        if (typeof left === 'string' && typeof right === 'number') left = left.repeat(Math.max(0, Math.floor(right)));
        else left = Number(left) * Number(right);
      } else if (op === '/') {
        const d = Number(right);
        if (d === 0) throw new Error('Division by zero is not allowed.');
        left = Number(left) / d;
      } else if (op === '//') {
        const d = Number(right);
        if (d === 0) throw new Error('Division by zero is not allowed.');
        left = Math.floor(Number(left) / d);
      } else {
        left = Number(left) % Number(right);
      }
    }
    return left;
  }

  function parseUnary(): PyVal {
    if (peek().kind === 'op' && (peek().value === '-' || peek().value === '+')) {
      const op = consume().value;
      const val = parseUnary();
      return op === '-' ? -Number(val) : Number(val);
    }
    return parsePower();
  }

  function parsePower(): PyVal {
    const base = parsePostfix();
    if (peek().kind === 'op' && peek().value === '**') {
      consume();
      const exp = parseUnary();
      return Math.pow(Number(base), Number(exp));
    }
    return base;
  }

  function callBuiltinOrUserFn(name: string, args: PyVal[], kwargs: Record<string, PyVal> = {}): PyVal {
    if (name === 'print') {
      const sep = typeof kwargs.sep === 'string' ? kwargs.sep : ' ';
      const end = typeof kwargs.end === 'string' ? kwargs.end : '\n';
      const line = args.map(formatPyPrint).join(sep);
      if (end === '' && ctx.output.length > 0) {
        ctx.output[ctx.output.length - 1] += line;
      } else {
        ctx.output.push(line);
      }
      return null;
    }
    if (name === 'input') {
      const val = ctx.inputQueue[ctx.inputCursor] ?? '18';
      ctx.inputCursor++;
      return val;
    }
    if (name === 'len') {
      const target = args[0];
      if (typeof target === 'string' || Array.isArray(target)) return target.length;
      if (isPyDict(target)) return Object.keys(target.entries).length;
      return 0;
    }
    if (name === 'int') {
      const n = parseInt(String(args[0] ?? 0), 10);
      return Number.isNaN(n) ? 0 : n;
    }
    if (name === 'float') {
      const n = parseFloat(String(args[0] ?? 0));
      return Number.isNaN(n) ? 0 : n;
    }
    if (name === 'str') return formatPyPrint(args[0] ?? '');
    if (name === 'bool') return toBool(args[0] ?? false);
    if (name === 'abs') return Math.abs(Number(args[0] ?? 0));
    if (name === 'round') {
      const num = Number(args[0] ?? 0);
      const digits = args.length > 1 ? Math.max(0, Math.min(8, Math.floor(Number(args[1])))) : 0;
      const factor = Math.pow(10, digits);
      return Math.round(num * factor) / factor;
    }
    if (name === 'min') {
      const arr = Array.isArray(args[0]) ? args[0] : args;
      return Math.min(...arr.map(Number));
    }
    if (name === 'max') {
      const arr = Array.isArray(args[0]) ? args[0] : args;
      return Math.max(...arr.map(Number));
    }
    if (name === 'sum') {
      const arr = Array.isArray(args[0]) ? args[0] : [];
      return arr.reduce<number>((acc, x) => acc + Number(x), 0);
    }
    if (name === 'type') {
      const v = args[0];
      if (typeof v === 'boolean') return "<class 'bool'>";
      if (typeof v === 'number') return Number.isInteger(v) ? "<class 'int'>" : "<class 'float'>";
      if (typeof v === 'string') return "<class 'str'>";
      if (Array.isArray(v)) return "<class 'list'>";
      if (isPyDict(v)) return "<class 'dict'>";
      return "<class 'NoneType'>";
    }
    if (name === 'range') {
      let start = 0;
      let stop = 0;
      let step = 1;
      if (args.length === 1) stop = Number(args[0]);
      else if (args.length === 2) {
        start = Number(args[0]);
        stop = Number(args[1]);
      } else if (args.length >= 3) {
        start = Number(args[0]);
        stop = Number(args[1]);
        step = Number(args[2]) || 1;
      }
      const res: number[] = [];
      for (let k = start; step > 0 ? k < stop : k > stop; k += step) {
        res.push(k);
        if (res.length > 100) break;
      }
      return res;
    }

    const fnVal = lookupVar(name);
    if (!isPyFn(fnVal)) {
      throw new Error(`'${name}' is not a callable function.`);
    }
    if (ctx.callDepth > 20) {
      throw new Error('Maximum function call depth reached.');
    }
    const localEnv: Record<string, PyVal> = {};
    fnVal.params.forEach((p, idx) => {
      localEnv[p] = args[idx] ?? null;
    });
    const prevEnv = ctx.env;
    ctx.env = localEnv;
    ctx.callDepth++;
    let returnVal: PyVal = null;
    try {
      executeBlock(fnVal.body, ctx);
    } catch (sig) {
      if (sig instanceof ReturnSignal) {
        returnVal = sig.value;
      } else {
        ctx.env = prevEnv;
        ctx.callDepth--;
        throw sig;
      }
    }
    ctx.env = prevEnv;
    ctx.callDepth--;
    return returnVal;
  }

  function parsePostfix(): PyVal {
    let val = parsePrimary();

    while (true) {
      if (peek().kind === 'punct' && peek().value === '(') {
        // Should have been handled by ident call, fallback
        break;
      }
      if (peek().kind === 'punct' && peek().value === '[') {
        consume();
        // Check slice a:b
        let startIdx: PyVal = null;
        let isSlice = false;
        let endIdx: PyVal = null;
        if (peek().kind === 'punct' && peek().value === ':') {
          isSlice = true;
          consume();
          if (!(peek().kind === 'punct' && peek().value === ']')) {
            endIdx = parseOr();
          }
        } else {
          startIdx = parseOr();
          if (peek().kind === 'punct' && peek().value === ':') {
            isSlice = true;
            consume();
            if (!(peek().kind === 'punct' && peek().value === ']')) {
              endIdx = parseOr();
            }
          }
        }
        if (peek().kind === 'punct' && peek().value === ']') consume();

        if (isSlice && (typeof val === 'string' || Array.isArray(val))) {
          const s = startIdx === null ? 0 : Number(startIdx);
          const e = endIdx === null ? val.length : Number(endIdx);
          val = val.slice(s, e);
        } else if (Array.isArray(val) || typeof val === 'string') {
          const idxNum = Number(startIdx);
          const normalized = idxNum < 0 ? val.length + idxNum : idxNum;
          val = val[normalized] ?? null;
        } else if (isPyDict(val)) {
          val = val.entries[String(startIdx)] ?? null;
        }
        continue;
      }
      if (peek().kind === 'punct' && peek().value === '.') {
        consume();
        const methodName = consume().value;
        if (peek().kind === 'punct' && peek().value === '(') {
          consume();
          const args: PyVal[] = [];
          while (peek().kind !== 'eof' && !(peek().kind === 'punct' && peek().value === ')')) {
            args.push(parseOr());
            if (peek().kind === 'punct' && peek().value === ',') consume();
          }
          if (peek().kind === 'punct' && peek().value === ')') consume();

          if (Array.isArray(val)) {
            if (methodName === 'append') {
              val.push(args[0] ?? null);
              val = null;
            } else if (methodName === 'pop') {
              val = val.pop() ?? null;
            } else if (methodName === 'sort') {
              val.sort((a, b) => Number(a) - Number(b));
              val = null;
            }
          } else if (typeof val === 'string') {
            if (methodName === 'upper') val = val.toUpperCase();
            else if (methodName === 'lower') val = val.toLowerCase();
            else if (methodName === 'strip') val = val.trim();
            else if (methodName === 'split') val = val.split(typeof args[0] === 'string' ? args[0] : ' ');
            else if (methodName === 'replace') {
              val = val.replaceAll(String(args[0] ?? ''), String(args[1] ?? ''));
            }
          }
        }
        continue;
      }
      break;
    }

    return val;
  }

  function parsePrimary(): PyVal {
    const tok = peek();
    if (tok.kind === 'num') {
      consume();
      return Number(tok.value);
    }
    if (tok.kind === 'str') {
      consume();
      return tok.value;
    }
    if (tok.kind === 'fstr') {
      consume();
      return tok.value.replace(/\{([^}]+)\}/g, (_m, inner) => {
        try {
          return formatPyPrint(evalExpression(String(inner), ctx));
        } catch {
          return `{${inner}}`;
        }
      });
    }
    if (tok.kind === 'ident') {
      consume();
      if (tok.value === 'True') return true;
      if (tok.value === 'False') return false;
      if (tok.value === 'None') return null;

      if (peek().kind === 'punct' && peek().value === '(') {
        consume();
        const args: PyVal[] = [];
        const kwargs: Record<string, PyVal> = {};
        while (peek().kind !== 'eof' && !(peek().kind === 'punct' && peek().value === ')')) {
          if (
            peek().kind === 'ident' &&
            tokens[pos + 1]?.kind === 'op' &&
            tokens[pos + 1]?.value === '='
          ) {
            const kwName = consume().value;
            consume(); // '='
            kwargs[kwName] = parseOr();
          } else {
            args.push(parseOr());
          }
          if (peek().kind === 'punct' && peek().value === ',') consume();
        }
        if (peek().kind === 'punct' && peek().value === ')') consume();
        return callBuiltinOrUserFn(tok.value, args, kwargs);
      }

      return lookupVar(tok.value);
    }
    if (tok.kind === 'punct' && tok.value === '(') {
      consume();
      const v = parseOr();
      if (peek().kind === 'punct' && peek().value === ')') consume();
      return v;
    }
    if (tok.kind === 'punct' && tok.value === '[') {
      consume();
      const items: PyVal[] = [];
      while (peek().kind !== 'eof' && !(peek().kind === 'punct' && peek().value === ']')) {
        items.push(parseOr());
        if (peek().kind === 'punct' && peek().value === ',') consume();
      }
      if (peek().kind === 'punct' && peek().value === ']') consume();
      return items;
    }
    if (tok.kind === 'punct' && tok.value === '{') {
      consume();
      const entries: Record<string, PyVal> = {};
      while (peek().kind !== 'eof' && !(peek().kind === 'punct' && peek().value === '}')) {
        const k = parseOr();
        if (peek().kind === 'punct' && peek().value === ':') consume();
        const v = parseOr();
        entries[String(k)] = v;
        if (peek().kind === 'punct' && peek().value === ',') consume();
      }
      if (peek().kind === 'punct' && peek().value === '}') consume();
      return { __pyDict: true, entries };
    }
    consume();
    return null;
  }

  return parseOr();
}

function snapshotVars(env: Record<string, PyVal>, globalEnv: Record<string, PyVal>): Record<string, string> {
  const combined = { ...globalEnv, ...env };
  const result: Record<string, string> = {};
  for (const [k, v] of Object.entries(combined)) {
    if (!isPyFn(v)) {
      result[k] = formatPyVal(v);
    }
  }
  return result;
}

function formatSubstitutedCondition(condExpr: string, env: Record<string, PyVal>, globalEnv: Record<string, PyVal>): string {
  const combined = { ...globalEnv, ...env };
  return condExpr.replace(/\b([A-Za-z_]\w*)\b/g, (match) => {
    if (['and', 'or', 'not', 'in', 'True', 'False', 'None'].includes(match)) return match;
    if (match in combined && !isPyFn(combined[match])) {
      return formatPyVal(combined[match]);
    }
    return match;
  });
}

function pushStep(
  ctx: ExecContext,
  partial: Omit<ExecutionStep, 'stepIndex' | 'variables' | 'output'>,
) {
  if (ctx.steps.length >= ctx.maxSteps) {
    ctx.runtimeNotice = `Execution stopped after ${ctx.maxSteps} steps to prevent an infinite loop.`;
    throw new Error(ctx.runtimeNotice);
  }
  ctx.steps.push({
    ...partial,
    stepIndex: ctx.steps.length,
    variables: snapshotVars(ctx.env, ctx.globalEnv),
    output: [...ctx.output],
  });
}

function executeBlock(nodes: AstNode[], ctx: ExecContext) {
  for (const node of nodes) {
    if (node.type === 'assign' && node.target && node.expr !== undefined) {
      const val = evalExpression(node.expr, ctx);
      ctx.env[node.target] = val;
      if (ctx.callDepth === 0) ctx.globalEnv[node.target] = val;
      const isInput = /\binput\s*\(/.test(node.expr);
      pushStep(ctx, {
        line: node.line,
        codeLine: node.raw,
        statementType: isInput ? 'input' : 'assign',
        description: `Assigned ${formatPyVal(val)} to variable '${node.target}'.`,
        conditionExpr: null,
        conditionEvaluated: null,
        conditionResult: null,
        branchTaken: null,
        flowNode: 'start',
      });
    } else if (node.type === 'aug_assign' && node.target && node.op && node.expr !== undefined) {
      const current = ctx.env[node.target] ?? ctx.globalEnv[node.target] ?? 0;
      const rhs = evalExpression(node.expr, ctx);
      let nextVal: PyVal = current;
      if (node.op === '+=') {
        nextVal = typeof current === 'string' && typeof rhs === 'string' ? current + rhs : Number(current) + Number(rhs);
      } else if (node.op === '-=') nextVal = Number(current) - Number(rhs);
      else if (node.op === '*=') nextVal = Number(current) * Number(rhs);
      else if (node.op === '/=') nextVal = Number(rhs) === 0 ? 0 : Number(current) / Number(rhs);
      else if (node.op === '%=') nextVal = Number(rhs) === 0 ? 0 : Number(current) % Number(rhs);
      else if (node.op === '//=') nextVal = Number(rhs) === 0 ? 0 : Math.floor(Number(current) / Number(rhs));

      ctx.env[node.target] = nextVal;
      if (ctx.callDepth === 0) ctx.globalEnv[node.target] = nextVal;
      pushStep(ctx, {
        line: node.line,
        codeLine: node.raw,
        statementType: 'assign',
        description: `Updated '${node.target}' to ${formatPyVal(nextVal)}.`,
        conditionExpr: null,
        conditionEvaluated: null,
        conditionResult: null,
        branchTaken: null,
        flowNode: 'start',
      });
    } else if (node.type === 'subscript_assign' && node.target && node.indexExpr !== undefined && node.expr !== undefined) {
      const container = ctx.env[node.target] ?? ctx.globalEnv[node.target];
      const idxVal = evalExpression(node.indexExpr, ctx);
      const rhsVal = evalExpression(node.expr, ctx);
      if (Array.isArray(container)) {
        const idxNum = Number(idxVal);
        const normalized = idxNum < 0 ? container.length + idxNum : idxNum;
        if (normalized >= 0 && normalized < container.length) {
          container[normalized] = rhsVal;
        }
      } else if (isPyDict(container)) {
        container.entries[String(idxVal)] = rhsVal;
      }
      pushStep(ctx, {
        line: node.line,
        codeLine: node.raw,
        statementType: 'assign',
        description: `Updated ${node.target}[${formatPyVal(idxVal)}] = ${formatPyVal(rhsVal)}.`,
        conditionExpr: null,
        conditionEvaluated: null,
        conditionResult: null,
        branchTaken: null,
        flowNode: 'start',
      });
    } else if (node.type === 'multi_assign' && node.targets && node.expr !== undefined) {
      const rhsParts = node.expr.split(',').map((part) => evalExpression(part.trim(), ctx));
      const values =
        rhsParts.length === 1 && Array.isArray(rhsParts[0]) ? rhsParts[0] : rhsParts;
      node.targets.forEach((varName, i) => {
        const v = values[i] ?? null;
        ctx.env[varName] = v;
        if (ctx.callDepth === 0) ctx.globalEnv[varName] = v;
      });
      pushStep(ctx, {
        line: node.line,
        codeLine: node.raw,
        statementType: 'assign',
        description: `Assigned ${node.targets.join(', ')}.`,
        conditionExpr: null,
        conditionEvaluated: null,
        conditionResult: null,
        branchTaken: null,
        flowNode: 'start',
      });
    } else if (node.type === 'if_chain' && node.branches) {
      let matched = false;
      for (const branch of node.branches) {
        if (branch.kind === 'if' || branch.kind === 'elif') {
          const cond = branch.cond ?? 'False';
          const substituted = formatSubstitutedCondition(cond, ctx.env, ctx.globalEnv);
          const result = toBool(evalExpression(cond, ctx));
          pushStep(ctx, {
            line: branch.line,
            codeLine: branch.raw,
            statementType: branch.kind,
            description: `Evaluated ${branch.kind} condition '${cond}' (${substituted}) → ${result ? 'True' : 'False'}.`,
            conditionExpr: cond,
            conditionEvaluated: substituted,
            conditionResult: result,
            branchTaken: result ? 'true' : 'false',
            flowNode: 'check',
          });
          if (result) {
            matched = true;
            executeBlock(branch.body, ctx);
            break;
          }
        } else if (branch.kind === 'else' && !matched) {
          pushStep(ctx, {
            line: branch.line,
            codeLine: branch.raw,
            statementType: 'else',
            description: 'Previous conditions were False, entering the else branch.',
            conditionExpr: null,
            conditionEvaluated: null,
            conditionResult: false,
            branchTaken: 'false',
            flowNode: 'false_branch',
          });
          executeBlock(branch.body, ctx);
        }
      }
    } else if (node.type === 'for' && node.loopVar && node.iterExpr && node.body) {
      const iterable = evalExpression(node.iterExpr, ctx);
      const items: PyVal[] = Array.isArray(iterable)
        ? iterable
        : typeof iterable === 'string'
          ? iterable.split('')
          : [];
      for (const item of items) {
        ctx.env[node.loopVar] = item;
        if (ctx.callDepth === 0) ctx.globalEnv[node.loopVar] = item;
        pushStep(ctx, {
          line: node.line,
          codeLine: node.raw,
          statementType: 'for',
          description: `Loop iteration: set '${node.loopVar}' = ${formatPyVal(item)}.`,
          conditionExpr: `${node.loopVar} in ${node.iterExpr}`,
          conditionEvaluated: `${node.loopVar} = ${formatPyVal(item)}`,
          conditionResult: true,
          branchTaken: 'true',
          flowNode: 'check',
        });
        try {
          executeBlock(node.body, ctx);
        } catch (sig) {
          if (sig instanceof BreakSignal) break;
          if (sig instanceof ContinueSignal) continue;
          throw sig;
        }
      }
    } else if (node.type === 'while' && node.condExpr && node.body) {
      while (true) {
        const substituted = formatSubstitutedCondition(node.condExpr, ctx.env, ctx.globalEnv);
        const condOk = toBool(evalExpression(node.condExpr, ctx));
        pushStep(ctx, {
          line: node.line,
          codeLine: node.raw,
          statementType: 'while',
          description: `Checked while condition '${node.condExpr}' (${substituted}) → ${condOk ? 'True' : 'False'}.`,
          conditionExpr: node.condExpr,
          conditionEvaluated: substituted,
          conditionResult: condOk,
          branchTaken: condOk ? 'true' : 'false',
          flowNode: 'check',
        });
        if (!condOk) break;
        try {
          executeBlock(node.body, ctx);
        } catch (sig) {
          if (sig instanceof BreakSignal) break;
          if (sig instanceof ContinueSignal) continue;
          throw sig;
        }
      }
    } else if (node.type === 'def' && node.fnName && node.body) {
      const fnObj: PyVal = {
        __pyFn: true,
        name: node.fnName,
        params: node.params ?? [],
        body: node.body,
      };
      ctx.env[node.fnName] = fnObj;
      if (ctx.callDepth === 0) ctx.globalEnv[node.fnName] = fnObj;
      pushStep(ctx, {
        line: node.line,
        codeLine: node.raw,
        statementType: 'def',
        description: `Registered function '${node.fnName}(${(node.params ?? []).join(', ')})'.`,
        conditionExpr: null,
        conditionEvaluated: null,
        conditionResult: null,
        branchTaken: null,
        flowNode: 'start',
      });
    } else if (node.type === 'return' && node.expr !== undefined) {
      const val = evalExpression(node.expr, ctx);
      pushStep(ctx, {
        line: node.line,
        codeLine: node.raw,
        statementType: 'return',
        description: `Returning ${formatPyVal(val)} from function.`,
        conditionExpr: null,
        conditionEvaluated: null,
        conditionResult: null,
        branchTaken: null,
        flowNode: 'output',
      });
      throw new ReturnSignal(val);
    } else if (node.type === 'break') {
      pushStep(ctx, {
        line: node.line,
        codeLine: node.raw,
        statementType: 'expr',
        description: 'Exited the current loop early with break.',
        conditionExpr: null,
        conditionEvaluated: null,
        conditionResult: null,
        branchTaken: null,
        flowNode: 'end',
      });
      throw new BreakSignal();
    } else if (node.type === 'continue') {
      pushStep(ctx, {
        line: node.line,
        codeLine: node.raw,
        statementType: 'expr',
        description: 'Skipped to the next loop iteration with continue.',
        conditionExpr: null,
        conditionEvaluated: null,
        conditionResult: null,
        branchTaken: null,
        flowNode: 'check',
      });
      throw new ContinueSignal();
    } else if (node.type === 'pass') {
      pushStep(ctx, {
        line: node.line,
        codeLine: node.raw,
        statementType: 'expr',
        description: 'Executed pass (no operation).',
        conditionExpr: null,
        conditionEvaluated: null,
        conditionResult: null,
        branchTaken: null,
        flowNode: 'start',
      });
    } else if (node.type === 'expr' && node.expr !== undefined) {
      const prevOutLen = ctx.output.length;
      evalExpression(node.expr, ctx);
      const isPrint = ctx.output.length > prevOutLen || /\bprint\s*\(/.test(node.expr);
      pushStep(ctx, {
        line: node.line,
        codeLine: node.raw,
        statementType: isPrint ? 'print' : 'expr',
        description: isPrint
          ? `Printed: ${ctx.output[ctx.output.length - 1] ?? ''}`
          : `Evaluated expression '${node.expr}'.`,
        conditionExpr: null,
        conditionEvaluated: null,
        conditionResult: null,
        branchTaken: null,
        flowNode: isPrint ? 'output' : 'start',
      });
    }
  }
}

export function analyzePythonCode(code: string, sampleInputs: string[] = []): PythonAnalysisResult {
  const syntaxIssues = checkPythonSyntax(code);
  const isValidSyntax = syntaxIssues.length === 0;
  const { concepts, categories, logicExplanation, conditionFlow, usesInput } = detectPythonConcepts(code);

  const steps: ExecutionStep[] = [];
  const finalOutput: string[] = [];
  let runtimeNotice: string | null = null;

  if (isValidSyntax) {
    const rawLines: RawLine[] = code
      .split('\n')
      .map((line, idx) => {
        const clean = stripCommentOutsideStrings(line);
        const text = clean.trim();
        const indent = line.slice(0, line.length - line.trimStart().length).replace(/\t/g, '    ').length;
        return { line: idx + 1, indent, text };
      })
      .filter((r) => r.text.length > 0);

    try {
      const { nodes } = parseBlock(rawLines, 0, 0);
      const ctx: ExecContext = {
        env: {},
        globalEnv: {},
        output: [],
        steps: [],
        inputQueue: sampleInputs.length > 0 ? sampleInputs : ['18', 'Python'],
        inputCursor: 0,
        maxSteps: 160,
        callDepth: 0,
        runtimeNotice: null,
      };
      executeBlock(nodes, ctx);
      steps.push(...ctx.steps);
      finalOutput.push(...ctx.output);
      runtimeNotice = ctx.runtimeNotice;
    } catch (err) {
      runtimeNotice = err instanceof Error ? err.message : 'Unable to simulate this expression.';
    }
  }

  return {
    isValidSyntax,
    syntaxIssues,
    detectedConcepts: concepts,
    conceptCategories: categories,
    logicExplanation,
    conditionFlow,
    usesInput,
    steps,
    finalOutput,
    runtimeNotice,
  };
}
