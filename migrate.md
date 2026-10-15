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
| **3-Way Merge Editor** | Svelte 5 | `webview/merge/App.svelte`, `MergeToolbar.svelte` | Migrated (Phase 1 Completed) |
| **Conflicts Dialog** | Svelte 5 | `webview/conflicts/App.svelte` | Migrated (Phase 2 Completed) |
| **Push Dialog** | Svelte 5 | `webview/push/App.svelte` | Migrated (Phase 2 Completed) |
| **Review Diff** | Vanilla TS DOM manipulation | `webview/review/main.ts` (52 KB), `diffParser.ts`, `editorHistory.ts`, `navigation.ts` | `webview/review/App.svelte`, `DiffPane.svelte`, `DiffGutter.svelte`, `ReviewToolbar.svelte` |
| **Commit Tool Window** | Vanilla TS DOM manipulation | `webview/commit/main.ts` (29 KB), `treeView.ts`, `dialogs.ts`, `diffViewer.ts`, `commit.css` | `webview/commit/App.svelte`, `ChangesTree.svelte`, `CommitBox.svelte` |

---

## 3. Phased Execution Roadmap

### Phase 1: 3-Way Merge Editor Migration (`webview/merge/`) - COMPLETED
**Status:** Completed (Commit `deb2201`)
**Key Results:**
- Replaced 902 lines of template string code (`mergeEditorHtml.ts`, `mergeEditorScript.ts`, `mergeEditorStyles.ts`) with idiomatic Svelte 5 components (`App.svelte`, `MergeToolbar.svelte`).
- Synchronized scrolling and SVG ribbon updates powered by `requestAnimationFrame`, eliminating synchronous layout thrashing.
- Fully verified in headless rendering harness with 100% visual and behavioral parity.

1. **Build Configuration:**
   - Added entry `{ input: 'webview/merge/main.ts', outfile: 'dist/webview/merge/merge.js' }` to `build-webview.mjs`.
2. **Component Architecture:**
   - `webview/merge/App.svelte`: Root orchestrator managing 3-pane reactive state (Yours, Result, Theirs), conflict blocks, line highlights, and keyboard events.
   - `webview/merge/MergeToolbar.svelte`: Action bar with Prev, Next, Apply Non-Conflicting, status counter, title, and Apply/Cancel buttons.
3. **Performance Optimization:**
   - Scroll synchronization between 3 editor panes decoupled using `requestAnimationFrame`.
   - SVG ribbon curves and gutter buttons rendered declaratively via Svelte derived state.
4. **Host Panel Integration:**
   - Refactored `src/views/mergeEditorPanel.ts` to serve `dist/webview/merge/merge.js`.
   - Deleted `src/views/mergeEditorHtml.ts`, `src/views/mergeEditor/mergeEditorScript.ts`, and `src/views/mergeEditor/mergeEditorStyles.ts`.

---

### Phase 2: Standalone Dialogs Migration (Conflicts & Push) - COMPLETED
**Status:** Completed
**Key Results:**
- Completely eliminated template string dialogs and eradicated `src/views/dialogs/`.
- Migrated Conflicts Dialog to idiomatic Svelte 5 (`webview/conflicts/App.svelte` and `main.ts`).
- Migrated Push Dialog to Svelte 5 (`webview/push/App.svelte` and `main.ts`) featuring smooth resizable splitters, inline remote branch editing, and commit-filtered file lists.
- Added bundles `dist/webview/conflicts/conflicts.js` and `dist/webview/push/push.js` in `build-webview.mjs`.
- Refactored `src/views/conflictsDialogPanel.ts` and `src/views/pushDialogPanel.ts` to load Svelte bundles with nonce-secured CSP.
- Verified with 0 TypeScript compiler errors and successful build generation.

---

### Phase 3: Review Diff Panel Migration (`webview/review/`) - COMPLETED
**Status:** Completed
**Key Results:**
- Completely replaced 1367 lines of legacy imperative DOM construction in `webview/review/main.ts` with idiomatic Svelte 5 components.
- Modularized architecture into `App.svelte`, `ReviewToolbar.svelte`, `DiffRibbon.svelte`, and `OverviewRuler.svelte`.
- Preserved existing calculation algorithms and navigation in `diffParser.ts`, `editorHistory.ts`, and `navigation.ts`.
- Declarative SVG diff ribbon rendering and synchronized scrolling powered by Svelte 5 runes (`$state`, `$derived`).
- Preserved inline editing, multi-line selection editing, undo/redo, auto-indent, and keyboard shortcuts (F7/Shift+F7, F4, Ctrl+Z/Ctrl+Y, Alt+Left/Alt+Right).
- Bundled into `dist/webview/commit/review.js` with 0 TypeScript errors.

---

### Phase 4: Commit Panel Migration (`webview/commit/`) - COMPLETED
**Status:** Completed
**Key Results:**
- Completely replaced 722 lines of legacy DOM string-based construction in `webview/commit/main.ts` with idiomatic Svelte 5 components.
- Modularized architecture into `App.svelte`, `ChangesTree.svelte`, and `CommitBox.svelte`.
- Preserved all changelists, unversioned files, flat mode, directory grouping (^P), module grouping, and IntelliJ-style tri-state checkbox semantics.
- Preserved amend commit, recent commit messages dropdown, before-commit settings, AI commit message generator, shelf tab, and stash tab management.
- Seamlessly integrated with standalone Conflicts and Push dialogs.
- Bundled into `dist/webview/commit/commit.js` with 0 TypeScript compiler errors.

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
