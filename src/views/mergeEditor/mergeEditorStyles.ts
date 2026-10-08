export const mergeEditorStyles = `
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
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex-shrink: 0;
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
      user-select: text !important;
      -webkit-user-select: text !important;
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
      user-select: text !important;
      -webkit-user-select: text !important;
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
      user-select: text !important;
      -webkit-user-select: text !important;
      cursor: text;
    }
    .gutter-num {
      width: 44px;
      min-width: 44px;
      height: 20px;
      line-height: 20px;
      text-align: right;
      padding-right: 12px;
      color: var(--vscode-editorLineNumber-foreground, #5a5d63);
      user-select: none !important;
      -webkit-user-select: none !important;
      font-size: 11px;
      font-family: "JetBrains Mono", "JetBrains Mono NL", monospace;
      position: sticky;
      left: 0;
      background: inherit;
      z-index: 2;
      cursor: default;
    }
    .line-content {
      flex: 1;
      height: 20px;
      line-height: 20px;
      padding-left: 6px;
      padding-right: 24px;
      white-space: pre;
      overflow: visible;
      user-select: text !important;
      -webkit-user-select: text !important;
      cursor: text !important;
    }
    .editor-line ::selection,
    .editor-line::selection {
      background: var(--vscode-editor-selectionBackground, #264f78) !important;
      color: inherit !important;
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
      user-select: none !important;
      -webkit-user-select: none !important;
    }
    .merge-gutter * {
      user-select: none !important;
      -webkit-user-select: none !important;
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
`;
