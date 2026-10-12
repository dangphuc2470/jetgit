# Svelte Migration Plan: IntelliJ Git VS Code Extension

## 1. Executive Summary & Objective

This document outlines the systematic migration strategy to convert all remaining template-string HTML dialogs and vanilla DOM webview views in `intellij-git-ext` to idiomatic Svelte 5 components.

### Goals
- Eliminate template strings containing inline HTML/CSS/JavaScript across `src/views/`.
- Replace manual DOM mutations with declarative, reactive Svelte 5 runes (`$state`, `$derived`, `$effect`).
- Achieve smooth 60fps-120fps scrolling and conflict block resolution in the 3-Way Merge Editor.
- Enforce strict end-to-end type safety via the newly introduced shared IPC protocol (`src/shared/protocol.ts`).
- Ensure 100% backward compatibility with existing keyboard shortcuts (e.g. F7 / Shift+F7, Ctrl+Z/Cmd+Z, Escape, Enter) and VS Code Extension APIs.

---

## 2. Inventory & Current State Assessment

| Module / View | Current Implementation | Files Involved | Target Architecture |
| :--- | :--- | :--- | :--- |
| **Git Graph** | Svelte 5 | `webview/graph/App.svelte`, `CommitList.svelte`, `FilterBar.svelte`, `BranchSidebar.svelte` | Maintained (Reference implementation) |
| **Interactive Rebase** | Svelte 5 | `webview/rebase/App.svelte`, `CommitRow.svelte` | Maintained (Reference implementation) |
| **3-Way Merge Editor** | Template strings + Vanilla JS | `src/views/mergeEditor/mergeEditorHtml.ts`, `mergeEditorScript.ts`, `mergeEditorStyles.ts` | `webview/merge/App.svelte`, `MergeColumn.svelte`, `MergeRibbons.svelte`, `MergeToolbar.svelte` |
| **Conflicts Dialog** | Template strings + Vanilla JS | `src/views/conflictsDialogHtml.ts`, `src/views/dialogs/conflictsDialogScript.ts`, `conflictsDialogStyles.ts` | `webview/conflicts/App.svelte`, `ConflictItem.svelte` |
| **Push Dialog** | Template strings + Vanilla JS | `src/views/pushDialogHtml.ts`, `src/views/dialogs/pushDialogScript.ts`, `pushDialogStyles.ts` | `webview/push/App.svelte`, `PushBranchSelect.svelte`, `PushCommitList.svelte` |
| **Review Diff** | Vanilla TS DOM manipulation | `webview/review/main.ts` (52 KB), `diffParser.ts`, `editorHistory.ts`, `navigation.ts` | `webview/review/App.svelte`, `DiffPane.svelte`, `DiffGutter.svelte`, `ReviewToolbar.svelte` |
| **Commit Tool Window** | Vanilla TS DOM manipulation | `webview/commit/main.ts` (29 KB), `treeView.ts`, `dialogs.ts`, `diffViewer.ts`, `commit.css` | `webview/commit/App.svelte`, `ChangesTree.svelte`, `CommitBox.svelte` |

---

## 3. Phased Execution Roadmap

### Phase 1: 3-Way Merge Editor Migration (`webview/merge/`)
**Priority:** High (Directly addresses performance, layout thrashing, and template string cleanup)

1. **Build Configuration:**
   - Add entry `{ input: 'webview/merge/main.ts', outfile: 'dist/webview/merge/merge.js' }` to `build-webview.mjs`.
2. **Component Architecture:**
   - `webview/merge/App.svelte`: Root orchestrator managing 3-pane state (Yours, Result, Theirs), active conflict index, and layout metrics.
   - `webview/merge/MergeToolbar.svelte`: Actions bar containing Accept Left, Accept Right, Resolve All Ours, Resolve All Theirs, Apply, and Cancel.
   - `webview/merge/MergeColumn.svelte`: Reusable single-pane editor column with line numbers, diff highlight classes, and editable result buffer.
   - `webview/merge/MergeRibbons.svelte`: SVG canvas drawing bezier curved ribbons linking corresponding conflict blocks across gutters.
3. **Performance Optimization:**
   - Decouple scroll synchronization from DOM reflows using `requestAnimationFrame`.
   - Compute line heights and gutter alignment via cached metrics instead of continuous `getBoundingClientRect` calls.
4. **Host Panel Integration:**
   - Refactor `src/views/mergeEditorPanel.ts` to serve `dist/webview/merge/merge.js` using webview URIs and nonce-secured CSP.
   - Deprecate and remove `src/views/mergeEditor/mergeEditorHtml.ts`, `mergeEditorScript.ts`, and `mergeEditorStyles.ts`.

---

### Phase 2: Standalone Dialogs Migration (Conflicts & Push)
**Priority:** High (Clean eradication of `src/views/dialogs/`)

1. **Conflicts Dialog (`webview/conflicts/`):**
   - Create `webview/conflicts/App.svelte`: Conflict files table with status indicators (modified/deleted), action buttons (Accept Yours, Accept Theirs, Merge), and file counts.
   - Add bundle entry in `build-webview.mjs`.
   - Update `src/views/conflictsDialogPanel.ts` to load Svelte bundle.
   - Remove `conflictsDialogHtml.ts`, `conflictsDialogScript.ts`, and `conflictsDialogStyles.ts`.
2. **Push Dialog (`webview/push/`):**
   - Create `webview/push/App.svelte`: Branch target picker, commit list preview with checkboxes, Force Push toggle, and Push button.
   - Add bundle entry in `build-webview.mjs`.
   - Update `src/views/pushDialogPanel.ts` to load Svelte bundle.
   - Remove `pushDialogHtml.ts`, `pushDialogScript.ts`, and `pushDialogStyles.ts`.

---

### Phase 3: Review Diff Panel Migration (`webview/review/`)
**Priority:** Medium (Preserve existing robust F7 navigation and text selection fixes)

1. **Component Decomposition:**
   - Keep calculation logic in `diffParser.ts`, `editorHistory.ts`, and `navigation.ts` intact.
   - Implement `webview/review/App.svelte`: Global keydown handlers (`F7`, `Shift+F7`, `Ctrl+Z`, `Ctrl+Y`), file tabs, and state store.
   - Implement `webview/review/DiffPane.svelte`: Left (Base) and Right (Working copy) synchronized text areas.
   - Implement `webview/review/DiffRibbon.svelte`: Central gutter with chevron buttons (`>>`, `<<`) and staging checkboxes.
2. **Regression Guards:**
   - Maintain text selection styling (`user-select: text !important`) on all syntax spans.
   - Maintain cross-file jump logic: trigger `jumpToBlock(0)` on initial file load when navigated from outside.

---

### Phase 4: Commit Panel Migration (`webview/commit/`)
**Priority:** Low / Final Polish

1. **Component Decomposition:**
   - Implement `webview/commit/App.svelte`.
   - Implement `webview/commit/ChangesTree.svelte`: Changelists, Staged Changes, Unstaged Changes with IntelliJ-style checkboxes and context menus.
   - Implement `webview/commit/CommitBox.svelte`: Commit message textarea, Amend checkbox, AI commit generator trigger, Commit and Commit & Push buttons.
2. **Host Integration:**
   - Update `src/views/commitPanel.ts` to load Svelte bundle.

---

## 4. Architectural Standards & Design Rules

1. **State Management:**
   - Use Svelte 5 standard runes: `$state` for component state, `$derived` for computed values, `$effect` for DOM sync and animations.
   - Avoid global mutable singleton state; pass state down or use context/stores.
2. **Type Safety:**
   - Every IPC call must strictly use types from `$protocol` (`src/shared/protocol.ts`).
   - `postMessage` must be called with typed payloads.
   - `onMessage` must narrow incoming message events by `msg.type`.
3. **Styling & Theme Alignment:**
   - Re-use VS Code theme CSS variables (`var(--vscode-editor-background)`, `var(--vscode-editorGutter-background)`, etc.).
   - Strictly follow the Anti-AI-Slop protocol: Flat, functional, density-aligned UI matching IntelliJ IDEA standards. No unnecessary shadows, glows, or excessive border radiuses.
4. **Git Differencing:**
   - Changes must be delivered incrementally per module.
   - Do not reformat unrelated files. Keep diffs focused and minimal.

---

## 5. Verification & Quality Gates

Each phase must pass all four criteria before merging:
1. `npx tsc --noEmit`: 0 TypeScript compiler errors.
2. `npx svelte-check --threshold error`: 0 Svelte diagnostics errors.
3. `npm run build`: Successful bundle generation across all entrypoints.
4. Functional verification:
   - Panel opens without blank screen or flash of unstyled content.
   - Switching editor tabs and returning preserves cursor position and scroll state (`retainContextWhenHidden: true`).
   - Webview lifecycle events (`ready`, `dispose`) execute cleanly without memory leaks.

---

## 6. Rollback & Backup Strategy

- **Local Git Backup Branch:** `backup-pre-svelte-migration` created at commit `d2e29c5`.
- **Remote Synchronization:** Master branch pushed to `https://github.com/dangphuc2470/intellij-git-ext.git`.
- In case of critical regression in any phase, individual files can be restored via `git checkout backup-pre-svelte-migration -- <path>`.
