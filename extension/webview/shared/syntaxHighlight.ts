import { escapeHtml } from './escape';

export const TOKEN_REGEX = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\b(?:0x[0-9a-fA-F]+|\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\b)|(@[a-zA-Z_$][a-zA-Z0-9_$]*)|(\b(?:abstract|as|assert|async|await|break|case|catch|class|const|continue|covariant|default|deferred|do|dynamic|else|enum|export|extends|extension|external|factory|final|finally|for|Function|get|hide|if|implements|import|in|interface|is|late|library|mixin|native|new|of|on|operator|part|rethrow|return|set|show|static|super|switch|sync|this|throw|try|typedef|var|void|while|with|yield|let|function|package|public|private|protected)\b)|(\b(?:true|false|null|undefined|nil|None)\b)|(\b(?:int|double|num|bool|boolean|String|string|List|Map|Set|Iterable|Future|Stream|Duration|DateTime|Uri|Object|Never|any|number|char|float|long|short|byte)\b)|(\b[a-zA-Z_$][a-zA-Z0-9_$]*(?=\s*\())|(\b[A-Z][a-zA-Z0-9_$]*\b)|(\b[a-zA-Z_$][a-zA-Z0-9_$]*\b)/g;

export function highlightCode(code: string): string {
  if (!code) return '';
  let result = '';
  let lastIndex = 0;
  TOKEN_REGEX.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = TOKEN_REGEX.exec(code)) !== null) {
    if (match.index > lastIndex) {
      result += escapeHtml(code.slice(lastIndex, match.index));
    }
    lastIndex = TOKEN_REGEX.lastIndex;

    const [full, comment, str, num, anno, kwd, constVal, builtinType, fnName, pascalType, ident] = match;

    if (comment) {
      result += `<span class="syn-comment">${escapeHtml(comment)}</span>`;
    } else if (str) {
      result += `<span class="syn-str">${escapeHtml(str)}</span>`;
    } else if (num) {
      result += `<span class="syn-num">${escapeHtml(num)}</span>`;
    } else if (anno) {
      result += `<span class="syn-anno">${escapeHtml(anno)}</span>`;
    } else if (kwd) {
      result += `<span class="syn-kwd">${escapeHtml(kwd)}</span>`;
    } else if (constVal) {
      result += `<span class="syn-const">${escapeHtml(constVal)}</span>`;
    } else if (builtinType) {
      result += `<span class="syn-type">${escapeHtml(builtinType)}</span>`;
    } else if (fnName) {
      result += `<span class="syn-fn">${escapeHtml(fnName)}</span>`;
    } else if (pascalType) {
      result += `<span class="syn-type">${escapeHtml(pascalType)}</span>`;
    } else if (ident) {
      result += `<span class="syn-var">${escapeHtml(ident)}</span>`;
    } else {
      result += escapeHtml(full);
    }
  }

  if (lastIndex < code.length) {
    result += escapeHtml(code.slice(lastIndex));
  }

  return result;
}

export function tokenize(str: string): string[] {
  if (!str) return [];
  const regex = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|([a-zA-Z0-9_$]+|[^\sa-zA-Z0-9_$]+|\s+)/g;
  return str.match(regex) || [str];
}

export function computeWordDiff(leftStr: string, rightStr: string, highlightWords = true): { leftHtml: string; rightHtml: string } {
  if (!highlightWords) {
    return {
      leftHtml: highlightCode(leftStr),
      rightHtml: highlightCode(rightStr)
    };
  }

  const leftTokens = tokenize(leftStr);
  const rightTokens = tokenize(rightStr);

  let start = 0;
  while (start < leftTokens.length && start < rightTokens.length && leftTokens[start] === rightTokens[start]) {
    start++;
  }
  let endLeft = leftTokens.length - 1;
  let endRight = rightTokens.length - 1;
  while (endLeft >= start && endRight >= start && leftTokens[endLeft] === rightTokens[endRight]) {
    endLeft--;
    endRight--;
  }

  let leftHtml = '';
  for (let i = 0; i < leftTokens.length; i++) {
    const token = leftTokens[i];
    if (i >= start && i <= endLeft) {
      leftHtml += `<span class="diff-word-delete">${highlightCode(token)}</span>`;
    } else {
      leftHtml += highlightCode(token);
    }
  }

  let rightHtml = '';
  for (let i = 0; i < rightTokens.length; i++) {
    const token = rightTokens[i];
    if (i >= start && i <= endRight) {
      rightHtml += `<span class="diff-word-insert">${highlightCode(token)}</span>`;
    } else {
      rightHtml += highlightCode(token);
    }
  }

  return { leftHtml, rightHtml };
}
