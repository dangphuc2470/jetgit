import { ThemeTokens } from '../utils/themeTokens';
import { mergeEditorStyles } from './mergeEditor/mergeEditorStyles';
import { mergeEditorScript } from './mergeEditor/mergeEditorScript';

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
${mergeEditorStyles}
  </style>
</head>
<body data-vscode-context='{"preventDefaultContextMenuItems": true}'>
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
${mergeEditorScript}
  </script>
</body>
</html>`;
}
