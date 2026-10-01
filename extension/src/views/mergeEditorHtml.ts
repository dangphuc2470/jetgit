import { ThemeTokens } from '../utils/themeTokens';

export function getMergeEditorHtml(cspSource: string, nonce: string, tokens: ThemeTokens): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none'; style-src 'unsafe-inline' ${cspSource}; script-src 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style id="dynamic-syntax-tokens">
    :root {
      --syn-kwd: ${tokens.kwd};
      --syn-type: ${tokens.type};
      --syn-fn: ${tokens.fn};
      --syn-str: ${tokens.str};
      --syn-num: ${tokens.num};
      --syn-const: ${tokens.constVal};
      --syn-var: ${tokens.varVal};
      --syn-comment: ${tokens.comment};
      --syn-anno: ${tokens.anno};
      --syn-punct: ${tokens.punct};
    }
  </style>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      user-select: none;
    }
    body, html {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background-color: var(--vscode-editor-background, #1e1f22);
      color: var(--vscode-editor-foreground, #bcbec4);
      font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
      font-size: 12px;
    }
    #app {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    /* Top Toolbar */
    .merge-toolbar {
      height: 38px;
      background: var(--vscode-sideBarSectionHeader-background, var(--vscode-editorGroupHeader-tabsBackground, #2b2d30));
      border-bottom: 1px solid var(--vscode-panel-border, #393b40);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 12px;
      flex-shrink: 0;
      gap: 12px;
    }
    .tool-group {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .tool-btn {
      background: transparent;
      border: 1px solid transparent;
      color: #9aa0a6;
      padding: 4px 8px;
      border-radius: 4px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      transition: all 0.12s;
    }
    .tool-btn:hover {
      background: #393b40;
      color: #dfe1e5;
    }
    .tool-btn svg {
      pointer-events: none;
    }
    .divider {
      width: 1px;
      height: 18px;
      background: #4e5157;
      margin: 0 4px;
    }
    .status-counter {
      font-size: 12px;
      font-weight: 500;
      padding: 2px 8px;
      border-radius: 10px;
      background: rgba(229, 165, 10, 0.18);
      color: #e5a50a;
      border: 1px solid rgba(229, 165, 10, 0.35);
    }
    .status-counter.all-resolved {
      background: rgba(46, 160, 67, 0.18);
      color: #3fb950;
      border: 1px solid rgba(46, 160, 67, 0.35);
    }
    .file-path-title {
      font-size: 13px;
      font-weight: 600;
      color: var(--vscode-foreground, #bcbec4);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 400px;
    }
    .action-btn {
      padding: 5px 14px;
      font-size: 12px;
      font-weight: 500;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.15s ease;
      outline: none;
    }
    .action-btn.btn-apply {
      background: #3574f0;
      color: #ffffff;
      border: 1px solid #3574f0;
    }
    .action-btn.btn-apply:hover {
      background: #3068d9;
    }
    .action-btn.btn-cancel {
      background: transparent;
      color: #bcbec4;
      border: 1px solid #4e5157;
    }
    .action-btn.btn-cancel:hover {
      background: #393b40;
      color: #ffffff;
    }

    /* Sub-header Columns */
    .columns-header {
      display: flex;
      height: 26px;
      background: var(--vscode-editorGroupHeader-tabsBackground, #232528);
      border-bottom: 1px solid var(--vscode-panel-border, #2f3136);
      font-size: 11px;
      font-weight: 600;
      color: var(--vscode-descriptionForeground, #7f848e);
      user-select: none;
    }
    .header-col {
      flex: 1;
      padding: 4px 16px;
      display: flex;
      align-items: center;
      gap: 6px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .header-col.center-col {
      color: #dfe1e5;
    }
    .header-col-gutter {
      width: 44px;
      min-width: 44px;
      max-width: 44px;
      background: var(--vscode-editorGutter-background, var(--vscode-editor-background, #1e1f22));
      border-left: 1px solid var(--vscode-panel-border, #2b2d30);
      border-right: 1px solid var(--vscode-panel-border, #2b2d30);
    }
    .editable-badge {
      font-size: 10px;
      font-weight: 500;
      padding: 1px 6px;
      border-radius: 3px;
      background: rgba(53, 116, 240, 0.18);
      color: #58a6ff;
      border: 1px solid rgba(53, 116, 240, 0.35);
    }

    /* Viewport & 3 Panes */
    .viewport-wrapper {
      flex: 1;
      display: flex;
      position: relative;
      overflow: hidden;
      background: var(--vscode-editor-background, #1e1f22);
    }
    .editor-pane {
      flex: 1;
      overflow-x: auto;
      overflow-y: auto;
      background: var(--vscode-editor-background, #1e1f22);
      min-width: 0;
      position: relative;
    }
    .editor-pane::-webkit-scrollbar {
      width: 10px;
      height: 10px;
    }
    .editor-pane::-webkit-scrollbar-thumb {
      background: #393b40;
      border-radius: 4px;
    }
    .editor-pane::-webkit-scrollbar-corner {
      background: transparent;
    }
    .lines-container {
      display: flex;
      flex-direction: column;
      min-width: 100%;
      width: max-content;
      position: relative;
    }
    .editor-line {
      height: 20px;
      min-height: 20px;
      max-height: 20px;
      line-height: 20px;
      display: flex;
      align-items: stretch;
      min-width: 100%;
      width: max-content;
      font-family: "JetBrains Mono", "JetBrains Mono NL", JetBrainsMono, Consolas, Menlo, Monaco, monospace;
      font-size: var(--vscode-editor-font-size, 12px);
      color: var(--vscode-editor-foreground, #bcbec4);
      white-space: pre;
    }
    .gutter-num {
      width: 44px;
      min-width: 44px;
      height: 20px;
      line-height: 20px;
      text-align: right;
      padding-right: 12px;
      color: var(--vscode-editorLineNumber-foreground, #5a5d63);
      user-select: none;
      font-size: 11px;
      font-family: "JetBrains Mono", "JetBrains Mono NL", monospace;
      position: sticky;
      left: 0;
      background: inherit;
      z-index: 2;
    }
    .line-content {
      flex: 1;
      height: 20px;
      line-height: 20px;
      padding-left: 6px;
      padding-right: 24px;
      white-space: pre;
      overflow: visible;
      user-select: text;
    }

    /* Middle Gutters */
    .merge-gutter {
      width: 44px;
      min-width: 44px;
      max-width: 44px;
      height: 100%;
      overflow: hidden;
      position: relative;
      background: var(--vscode-editorGutter-background, var(--vscode-editor-background, #1e1f22));
      border-left: 1px solid var(--vscode-panel-border, #2b2d30);
      border-right: 1px solid var(--vscode-panel-border, #2b2d30);
      user-select: none;
    }
    .gutter-svg {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
    }
    .gutter-controls {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
    }
    .conflict-ribbon {
      fill: rgba(186, 68, 68, 0.35);
      transition: fill 0.15s ease;
    }
    .conflict-ribbon.resolved {
      fill: rgba(46, 160, 67, 0.25);
    }
    .conflict-ribbon.ignored {
      fill: rgba(90, 95, 105, 0.15);
    }

    /* Action Buttons in Gutter (>> and <<) */
    .block-btn {
      position: absolute;
      width: 18px;
      height: 18px;
      pointer-events: auto;
      z-index: 6;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--vscode-editor-background, #1e1f22);
      border: 1px solid rgba(255, 255, 255, 0.28);
      border-radius: 3px;
      color: var(--vscode-foreground, #bcbec4);
      cursor: pointer;
      padding: 0;
      box-sizing: border-box;
      transition: all 0.12s ease;
    }
    .block-btn:hover {
      background: #3574f0;
      border-color: #3574f0;
      color: #ffffff;
      transform: scale(1.12);
    }
    .block-btn.btn-ignore {
      width: 16px;
      height: 16px;
      opacity: 0.65;
    }
    .block-btn.btn-ignore:hover {
      background: #ba4444;
      border-color: #ba4444;
      color: #ffffff;
      opacity: 1;
    }
    .block-btn.active-accepted {
      background: #2ea043;
      border-color: #2ea043;
      color: #ffffff;
    }

    /* Conflict Line Highlights */
    .line-conflict {
      background: rgba(186, 68, 68, 0.18) !important;
    }
    .line-conflict-resolved {
      background: rgba(46, 160, 67, 0.15) !important;
    }
    .line-placeholder {
      font-style: italic;
      color: #e5a50a;
      opacity: 0.8;
      background: rgba(229, 165, 10, 0.08);
      border-top: 1px dashed rgba(229, 165, 10, 0.3);
      border-bottom: 1px dashed rgba(229, 165, 10, 0.3);
    }

    /* Center Editable Line */
    .center-editor .line-content[contenteditable="plaintext-only"],
    .center-editor .line-content[contenteditable="true"] {
      outline: none !important;
      cursor: text;
    }

    /* Syntax Highlighting */
    .syn-kwd { color: var(--syn-kwd, #fd6883) !important; }
    .syn-type { color: var(--syn-type, #85dacc) !important; }
    .syn-fn { color: var(--syn-fn, #adda78) !important; }
    .syn-str { color: var(--syn-str, #f9cc6c) !important; }
    .syn-num { color: var(--syn-num, #a8a9eb) !important; }
    .syn-const { color: var(--syn-const, #a8a9eb) !important; }
    .syn-var { color: var(--syn-var, #fff1f3) !important; }
    .syn-comment { color: var(--syn-comment, #72696a) !important; font-style: italic; }
    .syn-anno { color: var(--syn-anno, #85dacc) !important; }
    .syn-punct { color: var(--syn-punct, #948a8b) !important; }
  </style>
</head>
<body>
  <div id="app">
    <!-- 1. Top Toolbar -->
    <div class="merge-toolbar">
      <div class="tool-group">
        <button class="tool-btn" id="btn-prev-conflict" title="Previous Conflict (Shift+F7)">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 7.5L6 4L9.5 7.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Prev
        </button>
        <button class="tool-btn" id="btn-next-conflict" title="Next Conflict (F7)">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Next
        </button>
        <div class="divider"></div>
        <button class="tool-btn" id="btn-apply-non-conflicting" title="Apply all non-conflicting changes">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6L4.5 8.5L10 3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Apply Non-Conflicting
        </button>
        <div class="divider"></div>
        <span class="status-counter" id="status-counter">0 conflicts remaining</span>
      </div>

      <div class="file-path-title" id="file-title">Resolving Conflicts</div>

      <div class="tool-group">
        <button class="action-btn btn-apply" id="btn-apply-merge" title="Apply merge and stage file (Cmd+Enter / Ctrl+Enter)">Apply</button>
        <button class="action-btn btn-cancel" id="btn-cancel-merge">Cancel</button>
      </div>
    </div>

    <!-- 2. Column Headers -->
    <div class="columns-header">
      <div class="header-col" id="header-yours">Your version</div>
      <div class="header-col-gutter"></div>
      <div class="header-col center-col">
        <span>Result</span>
        <span class="editable-badge">Editable</span>
      </div>
      <div class="header-col-gutter"></div>
      <div class="header-col" id="header-theirs">Their version</div>
    </div>

    <!-- 3. 3-Way Viewport -->
    <div class="viewport-wrapper">
      <!-- Left Editor (Yours) -->
      <div class="editor-pane left-editor" id="left-editor">
        <div class="lines-container" id="left-lines"></div>
      </div>

      <!-- Left Gutter (Yours -> Center) -->
      <div class="merge-gutter" id="left-gutter">
        <svg class="gutter-svg" id="left-svg"></svg>
        <div class="gutter-controls" id="left-controls"></div>
      </div>

      <!-- Center Editor (Merged Result) -->
      <div class="editor-pane center-editor" id="center-editor">
        <div class="lines-container" id="center-lines"></div>
      </div>

      <!-- Right Gutter (Center <- Theirs) -->
      <div class="merge-gutter" id="right-gutter">
        <svg class="gutter-svg" id="right-svg"></svg>
        <div class="gutter-controls" id="right-controls"></div>
      </div>

      <!-- Right Editor (Theirs) -->
      <div class="editor-pane right-editor" id="right-editor">
        <div class="lines-container" id="right-lines"></div>
      </div>
    </div>
  </div>

  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    const LINE_HEIGHT = 20;

    let state = {
      filePath: '',
      fileName: '',
      yoursBranch: 'HEAD',
      theirsBranch: 'Incoming',
      hunks: [],
      conflictBlocks: [],
      currentConflictIndex: 0,
    };

    const TOKEN_REGEX = /(\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/)|("(?:[^"\\\\]|\\\\.)*"|'(?:[^'\\\\]|\\\\.)*'|\`(?:[^\`\\\\]|\\\\.)*\`)|(\\b(?:0x[0-9a-fA-F]+|\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?)\\b)|(@[a-zA-Z_$][a-zA-Z0-9_$]*)|(\\b(?:abstract|as|assert|async|await|break|case|catch|class|const|continue|covariant|default|deferred|do|dynamic|else|enum|export|extends|extension|external|factory|final|finally|for|Function|get|hide|if|implements|import|in|interface|is|late|library|mixin|native|new|of|on|operator|part|rethrow|return|set|show|static|super|switch|sync|this|throw|try|typedef|var|void|while|with|yield|let|function|package|public|private|protected)\\b)|(\\b(?:true|false|null|undefined|nil|None)\\b)|(\\b(?:int|double|num|bool|boolean|String|string|List|Map|Set|Iterable|Future|Stream|Duration|DateTime|Uri|Object|Never|any|number|char|float|long|short|byte)\\b)|(\\b[a-zA-Z_$][a-zA-Z0-9_$]*(?=\\s*\\())|(\\b[A-Z][a-zA-Z0-9_$]*\\b)|(\\b[a-zA-Z_$][a-zA-Z0-9_$]*\\b)/g;

    function escapeHtml(text) {
      if (!text) return '';
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    function highlightCode(code) {
      if (!code) return '';
      let result = '';
      let lastIndex = 0;
      TOKEN_REGEX.lastIndex = 0;
      let match;
      while ((match = TOKEN_REGEX.exec(code)) !== null) {
        if (match.index > lastIndex) {
          result += escapeHtml(code.slice(lastIndex, match.index));
        }
        lastIndex = TOKEN_REGEX.lastIndex;
        const [full, comment, str, num, anno, kwd, constVal, builtinType, fnName, pascalType, ident] = match;
        if (comment) result += \`<span class="syn-comment">\${escapeHtml(comment)}</span>\`;
        else if (str) result += \`<span class="syn-str">\${escapeHtml(str)}</span>\`;
        else if (num) result += \`<span class="syn-num">\${escapeHtml(num)}</span>\`;
        else if (anno) result += \`<span class="syn-anno">\${escapeHtml(anno)}</span>\`;
        else if (kwd) result += \`<span class="syn-kwd">\${escapeHtml(kwd)}</span>\`;
        else if (constVal) result += \`<span class="syn-const">\${escapeHtml(constVal)}</span>\`;
        else if (builtinType) result += \`<span class="syn-type">\${escapeHtml(builtinType)}</span>\`;
        else if (fnName) result += \`<span class="syn-fn">\${escapeHtml(fnName)}</span>\`;
        else if (pascalType) result += \`<span class="syn-type">\${escapeHtml(pascalType)}</span>\`;
        else if (ident) result += \`<span class="syn-var">\${escapeHtml(ident)}</span>\`;
        else result += escapeHtml(full);
      }
      if (lastIndex < code.length) {
        result += escapeHtml(code.slice(lastIndex));
      }
      return result;
    }

    // Elements
    const leftEditor = document.getElementById('left-editor');
    const centerEditor = document.getElementById('center-editor');
    const rightEditor = document.getElementById('right-editor');
    const leftLinesEl = document.getElementById('left-lines');
    const centerLinesEl = document.getElementById('center-lines');
    const rightLinesEl = document.getElementById('right-lines');
    const leftSvg = document.getElementById('left-svg');
    const rightSvg = document.getElementById('right-svg');
    const leftControls = document.getElementById('left-controls');
    const rightControls = document.getElementById('right-controls');
    const statusCounter = document.getElementById('status-counter');
    const fileTitle = document.getElementById('file-title');
    const headerYours = document.getElementById('header-yours');
    const headerTheirs = document.getElementById('header-theirs');

    function render3Way() {
      leftLinesEl.innerHTML = '';
      centerLinesEl.innerHTML = '';
      rightLinesEl.innerHTML = '';
      state.conflictBlocks = [];

      let leftLineNo = 1;
      let centerLineNo = 1;
      let rightLineNo = 1;

      state.hunks.forEach((hunk) => {
        if (hunk.type === 'common') {
          const lines = hunk.commonLines || [];
          lines.forEach(text => {
            appendLine(leftLinesEl, leftLineNo++, text, '');
            appendLine(centerLinesEl, centerLineNo++, text, '', true, hunk.id);
            appendLine(rightLinesEl, rightLineNo++, text, '');
          });
        } else if (hunk.type === 'conflict') {
          const yLines = hunk.yoursLines || [];
          const tLines = hunk.theirsLines || [];

          const leftStart = leftLineNo;
          yLines.forEach(text => {
            appendLine(leftLinesEl, leftLineNo++, text, 'line-conflict');
          });
          const leftEnd = leftLineNo - 1;

          const rightStart = rightLineNo;
          tLines.forEach(text => {
            appendLine(rightLinesEl, rightLineNo++, text, 'line-conflict');
          });
          const rightEnd = rightLineNo - 1;

          const centerStart = centerLineNo;
          const rLines = hunk.resultLines || [];
          if (hunk.resolved && rLines.length > 0) {
            rLines.forEach(text => {
              appendLine(centerLinesEl, centerLineNo++, text, 'line-conflict-resolved', true, hunk.id);
            });
          } else if (hunk.resolved && rLines.length === 0) {
            // Ignored / empty result
          } else {
            // Unresolved placeholder
            appendLine(centerLinesEl, centerLineNo++, '// Unresolved conflict #' + hunk.id, 'line-placeholder', true, hunk.id);
          }
          const centerEnd = centerLineNo - 1;

          state.conflictBlocks.push({
            id: hunk.id,
            hunk,
            leftStart,
            leftEnd: Math.max(leftStart, leftEnd),
            leftCount: yLines.length,
            rightStart,
            rightEnd: Math.max(rightStart, rightEnd),
            rightCount: tLines.length,
            centerStart,
            centerEnd: Math.max(centerStart, centerEnd),
            resolved: hunk.resolved || false,
            chosen: hunk.chosen || null,
          });
        }
      });

      updateConflictCounter();
      updateRibbonsAndControls();
    }

    function appendLine(container, lineNo, text, extraClass, editable = false, hunkId = null) {
      const lineEl = document.createElement('div');
      lineEl.className = 'editor-line' + (extraClass ? ' ' + extraClass : '');
      if (hunkId !== null) {
        lineEl.setAttribute('data-hunk-id', hunkId);
      }

      const numEl = document.createElement('div');
      numEl.className = 'gutter-num';
      numEl.textContent = lineNo;
      lineEl.appendChild(numEl);

      const contentEl = document.createElement('div');
      contentEl.className = 'line-content';
      contentEl.innerHTML = highlightCode(text);
      if (editable) {
        contentEl.setAttribute('contenteditable', 'plaintext-only');
        contentEl.setAttribute('spellcheck', 'false');
      }
      lineEl.appendChild(contentEl);

      container.appendChild(lineEl);
    }

    function updateConflictCounter() {
      const remaining = state.conflictBlocks.filter(b => !b.resolved).length;
      if (remaining === 0) {
        statusCounter.textContent = 'All conflicts resolved';
        statusCounter.className = 'status-counter all-resolved';
      } else {
        statusCounter.textContent = \`\${remaining} conflict\${remaining > 1 ? 's' : ''} remaining\`;
        statusCounter.className = 'status-counter';
      }
    }

    function updateRibbonsAndControls() {
      const sLeft = leftEditor.scrollTop;
      const sCenter = centerEditor.scrollTop;
      const sRight = rightEditor.scrollTop;
      const viewH = leftEditor.clientHeight;
      const W = 44;

      let leftSvgHtml = '';
      let rightSvgHtml = '';
      let leftCtrlHtml = '';
      let rightCtrlHtml = '';

      state.conflictBlocks.forEach(b => {
        // Left -> Center
        const ly1 = (b.leftStart - 1) * LINE_HEIGHT - sLeft;
        const ly2 = b.leftCount === 0 ? ly1 : (b.leftEnd * LINE_HEIGHT - sLeft);
        const cy1 = (b.centerStart - 1) * LINE_HEIGHT - sCenter;
        const cy2 = (b.centerEnd * LINE_HEIGHT - sCenter);

        const leftD = \`M 0,\${ly1} L 6,\${ly1} C 16,\${ly1} \${W - 16},\${cy1} \${W - 6},\${cy1} L \${W},\${cy1} L \${W},\${cy2} L \${W - 6},\${cy2} C \${W - 16},\${cy2} 16,\${ly2} 6,\${ly2} L 0,\${ly2} Z\`;
        const ribbonClass = b.resolved ? (b.chosen === 'ignored' ? 'conflict-ribbon ignored' : 'conflict-ribbon resolved') : 'conflict-ribbon';

        leftSvgHtml += \`<path d="\${leftD}" class="\${ribbonClass}" data-id="\${b.id}"/>\`;

        // Left controls (>> and x)
        const btnY = Math.max(0, ly1 + 2);
        const leftAcceptActive = b.resolved && b.chosen === 'yours' ? ' active-accepted' : '';
        leftCtrlHtml += \`
          <button class="block-btn accept-left-btn\${leftAcceptActive}" style="top: \${btnY}px; left: 4px;" title="Accept Yours (Left)" data-id="\${b.id}">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 2L5 5L1.5 8M5 2L8.5 5L5 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <button class="block-btn btn-ignore ignore-left-btn" style="top: \${btnY}px; left: 24px;" title="Ignore Yours" data-id="\${b.id}">
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 1.5L6.5 6.5M6.5 1.5L1.5 6.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
          </button>
        \`;

        // Center <- Right
        const ry1 = (b.rightStart - 1) * LINE_HEIGHT - sRight;
        const ry2 = b.rightCount === 0 ? ry1 : (b.rightEnd * LINE_HEIGHT - sRight);

        const rightD = \`M 0,\${cy1} L 6,\${cy1} C 16,\${cy1} \${W - 16},\${ry1} \${W - 6},\${ry1} L \${W},\${ry1} L \${W},\${ry2} L \${W - 6},\${ry2} C \${W - 16},\${ry2} 16,\${cy2} 6,\${cy2} L 0,\${cy2} Z\`;
        rightSvgHtml += \`<path d="\${rightD}" class="\${ribbonClass}" data-id="\${b.id}"/>\`;

        const rBtnY = Math.max(0, ry1 + 2);
        const rightAcceptActive = b.resolved && b.chosen === 'theirs' ? ' active-accepted' : '';
        rightCtrlHtml += \`
          <button class="block-btn btn-ignore ignore-right-btn" style="top: \${rBtnY}px; left: 4px;" title="Ignore Theirs" data-id="\${b.id}">
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 1.5L6.5 6.5M6.5 1.5L1.5 6.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
          </button>
          <button class="block-btn accept-right-btn\${rightAcceptActive}" style="top: \${rBtnY}px; left: 22px;" title="Accept Theirs (Right)" data-id="\${b.id}">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M8.5 2L5 5L8.5 8M5 2L1.5 5L5 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        \`;
      });

      leftSvg.innerHTML = leftSvgHtml;
      rightSvg.innerHTML = rightSvgHtml;
      leftControls.innerHTML = leftCtrlHtml;
      rightControls.innerHTML = rightCtrlHtml;

      // Bind events
      leftControls.querySelectorAll('.accept-left-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = parseInt(btn.getAttribute('data-id'), 10);
          acceptConflict(id, 'yours');
        });
      });
      leftControls.querySelectorAll('.ignore-left-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = parseInt(btn.getAttribute('data-id'), 10);
          acceptConflict(id, 'ignored');
        });
      });
      rightControls.querySelectorAll('.accept-right-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = parseInt(btn.getAttribute('data-id'), 10);
          acceptConflict(id, 'theirs');
        });
      });
      rightControls.querySelectorAll('.ignore-right-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = parseInt(btn.getAttribute('data-id'), 10);
          acceptConflict(id, 'ignored');
        });
      });
    }

    function acceptConflict(id, choice) {
      const hunk = state.hunks.find(h => h.id === id);
      if (!hunk) return;

      hunk.resolved = true;
      hunk.chosen = choice;
      if (choice === 'yours') {
        hunk.resultLines = [...(hunk.yoursLines || [])];
      } else if (choice === 'theirs') {
        hunk.resultLines = [...(hunk.theirsLines || [])];
      } else if (choice === 'ignored') {
        hunk.resultLines = [];
      }

      render3Way();
    }

    // Synchronized Scrolling
    let isSyncing = false;
    function syncScroll(source) {
      if (isSyncing) return;
      isSyncing = true;
      const top = source.scrollTop;
      const left = source.scrollLeft;

      if (source !== leftEditor) leftEditor.scrollTop = top;
      if (source !== centerEditor) centerEditor.scrollTop = top;
      if (source !== rightEditor) rightEditor.scrollTop = top;

      updateRibbonsAndControls();
      isSyncing = false;
    }

    leftEditor.addEventListener('scroll', () => syncScroll(leftEditor));
    centerEditor.addEventListener('scroll', () => syncScroll(centerEditor));
    rightEditor.addEventListener('scroll', () => syncScroll(rightEditor));

    // Jump Between Conflicts
    function jumpConflict(direction) {
      const unresolved = state.conflictBlocks;
      if (unresolved.length === 0) return;

      state.currentConflictIndex = (state.currentConflictIndex + direction + unresolved.length) % unresolved.length;
      const target = unresolved[state.currentConflictIndex];
      if (target) {
        const targetY = Math.max(0, (target.centerStart - 4) * LINE_HEIGHT);
        centerEditor.scrollTo({ top: targetY, behavior: 'smooth' });
      }
    }

    document.getElementById('btn-prev-conflict').addEventListener('click', () => jumpConflict(-1));
    document.getElementById('btn-next-conflict').addEventListener('click', () => jumpConflict(1));

    document.getElementById('btn-apply-non-conflicting').addEventListener('click', () => {
      // Auto accept all non-conflicting or simple blocks
      state.hunks.forEach(h => {
        if (h.type === 'conflict' && !h.resolved) {
          if ((h.yoursLines || []).length === 0 && (h.theirsLines || []).length > 0) {
            h.resolved = true;
            h.chosen = 'theirs';
            h.resultLines = [...h.theirsLines];
          } else if ((h.theirsLines || []).length === 0 && (h.yoursLines || []).length > 0) {
            h.resolved = true;
            h.chosen = 'yours';
            h.resultLines = [...h.yoursLines];
          }
        }
      });
      render3Way();
    });

    // Apply & Cancel
    function getMergedContent() {
      const lineEls = centerLinesEl.querySelectorAll('.line-content');
      const lines = [];
      lineEls.forEach(el => {
        lines.push(el.textContent || '');
      });
      return lines.join('\\n');
    }

    document.getElementById('btn-apply-merge').addEventListener('click', () => {
      const remaining = state.conflictBlocks.filter(b => !b.resolved).length;
      if (remaining > 0) {
        // Highlight remaining
        jumpConflict(0);
      }
      const content = getMergedContent();
      vscode.postMessage({
        type: 'applyMerge',
        payload: {
          filePath: state.filePath,
          content,
        }
      });
    });

    document.getElementById('btn-cancel-merge').addEventListener('click', () => {
      vscode.postMessage({ type: 'cancelMerge' });
    });

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.key === 'F7') {
        e.preventDefault();
        jumpConflict(e.shiftKey ? -1 : 1);
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        document.getElementById('btn-apply-merge').click();
      } else if (e.key === 'Escape') {
        document.getElementById('btn-cancel-merge').click();
      }
    });

    // Webview Message Listener
    window.addEventListener('message', (e) => {
      const msg = e.data;
      if (msg.type === 'loadMergeData') {
        state.filePath = msg.payload.filePath;
        state.fileName = msg.payload.fileName;
        state.yoursBranch = msg.payload.yoursBranch;
        state.theirsBranch = msg.payload.theirsBranch;
        state.hunks = msg.payload.hunks || [];

        fileTitle.textContent = state.filePath;
        headerYours.textContent = \`Your version (\${state.yoursBranch})\`;
        headerTheirs.textContent = \`Their version (\${state.theirsBranch})\`;

        render3Way();
      }
    });

    vscode.postMessage({ type: 'ready' });
  </script>
</body>
</html>`;
}
