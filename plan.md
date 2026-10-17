# IntelliJ Git Alignment & Enhancement Roadmap

## 1. Executive Summary & Objective

Following the successful migration of all webviews to Svelte 5 (Phases 1-5, release `v0.1.1`), this document establishes the master alignment roadmap between `intellij-git-ext` and the official JetBrains IntelliJ IDEA Community source code (`intellij-community/`).

The objective is to achieve feature, behavioral, algorithmic, and visual parity with IntelliJ IDEA's Git integration while preserving native VS Code performance and lightweight responsiveness.

---

## 2. Module Mapping & Source References

| Extension Module | Source Path (`unpacked/`) | Official IntelliJ Community Reference | Core Class / Logic Reference |
| :--- | :--- | :--- | :--- |
| **Git Log & DAG Graph** | `src/git/graphBuilder.ts`<br>`src/git/operations/commitOperations.ts`<br>`webview/graph/` | `platform/vcs-log/`<br>`plugins/git4idea/backend/src/log/` | `LinearBekController.kt`<br>`LinearBekGraphBuilder.java`<br>`GitLogUtil.java` (`LOG_ALL`)<br>`SimpleGraphCellPainter.kt`<br>`LabelPainter.java` |
| **3-Way Merge Tool** | `src/views/mergeEditorPanel.ts`<br>`webview/merge/` | `platform/diff-impl/src/com/intellij/diff/merge/` | `TextMergeTool.java`<br>`MergeUtil.java`<br>`TextMergeViewer.java` |
| **Interactive Rebase** | `src/views/rebasePanel.ts`<br>`webview/rebase/` | `plugins/git4idea/backend/src/rebase/` | `GitInteractiveRebaseDialog.kt`<br>`GitInteractiveRebaseEditorHandler.java`<br>`GitRebaseProcess.kt` |
| **Commit Tool Window & Changelists** | `src/views/commitPanel.ts`<br>`webview/commit/` | `platform/vcs-impl/src/com/intellij/openapi/vcs/changes/`<br>`platform/vcs-api/` | `ChangeListManagerImpl.java`<br>`LocalChangeList.java`<br>`CommitWorkflow.kt` |
| **Push & Conflicts Dialogs** | `src/views/pushDialogPanel.ts`<br>`src/views/conflictsDialogPanel.ts`<br>`webview/push/`, `webview/conflicts/` | `plugins/git4idea/backend/src/push/`<br>`plugins/git4idea/backend/src/merge/` | `GitPushDialog.kt`<br>`GitPushSupport.java`<br>`GitMergeUtil.java` |

---

## 3. Phased Execution Roadmap

### Phase 1: Git Log Query & LinearBek DAG Graph Perfection
**Focus:** Graph layout accuracy, query cleanliness, and branch/tag visualization.

- [x] **1.1 Clean Query Standard (Completed):**
  - Replaced `--all` with JetBrains IntelliJ standard `LOG_ALL = ['HEAD', '--branches', '--remotes', '--tags']` in `src/git/operations/commitOperations.ts`.
  - Eliminates dangling commits from `refs/stash` and internal git notes.
- [x] **1.2 LinearBek Graph Layout Engine (Completed):**
  - Implemented `linearizeCommitsBek` in `src/git/graphBuilder.ts`: clusters feature branch commits consecutively after merge commits to avoid interleaving with trunk commits.
  - Implemented strict backbone continuity: Column 0 (primary trunk) retains highest priority and never shifts horizontally.
  - Implemented compact slot allocation: re-uses holes in `lanes` to maintain minimal horizontal width.
  - Added unit test suite in `test/graphBuilder.test.mts` (29 passing tests).
- [ ] **1.3 IntelliJ Label Painter Alignment:**
  - Reference: `platform/vcs-log/impl/src/com/intellij/vcs/log/ui/render/LabelPainter.java`.
  - Truncate long branch names with `..` when exceeding length (IntelliJ `MAX_LENGTH = 22`).
  - Align badge border-radius to `LABEL_ARC = 6px` and exact padding (`top: 1px`, `bottom: 2px`, `left/right: 4px`).
  - Distinct SVG icons for Local Branch, Remote Tracking Branch, Tag, and HEAD commit.
- [ ] **1.4 Highlighting & Filtering Parity:**
  - Current Branch / HEAD commit row highlighting matching IntelliJ's visual distinction.
  - Path and author filter refinements matching `VcsLogClassicFilterUi.java`.

---

### Phase 2: 3-Way Merge Tool Engine Alignment
**Focus:** Accurate conflict block detection and automated resolution logic.

- [ ] **2.1 "Apply All Non-Conflicting Changes" Engine:**
  - Reference: `platform/diff-impl/src/com/intellij/diff/merge/MergeUtil.java`.
  - Analyze differences between Base vs Yours and Base vs Theirs.
  - When changes occur on only one side for a block, automatically apply that modification to Result.
  - When both sides make identical modifications, apply without conflict.
  - Leave only true conflicting overlapping edits for manual resolution.
- [ ] **2.2 Visual Ribbon & Gutter Controls:**
  - Declarative SVG ribbons connecting Yours -> Result and Result -> Theirs.
  - Dedicated action buttons (`>>` Apply Yours, `<<` Apply Theirs, `X` Ignore).
  - Live status indicator: `N conflicts remaining` with color-coded conflict badge.
- [ ] **2.3 Keyboard Navigation & Safety Controls:**
  - `F7` (Next Difference) and `Shift+F7` (Previous Difference).
  - Undo/Redo tracking per conflict block resolution.
  - Warning dialog before closing if unresolved conflicts remain.

---

### Phase 3: Interactive Rebase Engine & UX Parity
**Focus:** Intuitive commit management, sequence manipulation, and message squash tooling.

- [ ] **3.1 Rebase Action Keyboard Shortcuts:**
  - Reference: `plugins/git4idea/backend/src/rebase/interactive/dialog/GitInteractiveRebaseDialog.kt`.
  - Keyboard shortcuts:
    - `Alt+Shift+Up` / `Alt+Shift+Down` (or `Ctrl+Up` / `Ctrl+Down`): Move commit up/down.
    - `P`: Pick.
    - `R`: Reword.
    - `E`: Edit.
    - `D`: Drop.
    - `S`: Squash.
    - `F`: Fixup.
- [ ] **3.2 Drag-and-Drop Reordering:**
  - Smooth HTML5 drag-and-drop row reordering with visual insertion indicator bar.
- [ ] **3.3 Squash Message Editor:**
  - Automatically combine and pre-populate commit messages when commits are set to `squash`.
  - Multi-line squash editor modal allowing users to edit the final unified commit message.
- [ ] **3.4 Target Base Branch Selection:**
  - Quick dropdown to rebase onto upstream branches with validation guards.

---

### Phase 4: Commit Tool Window & Changelists Architecture
**Focus:** IntelliJ-style task management via Changelists and granular chunk staging.

- [ ] **4.1 Full Changelists Management:**
  - Reference: `platform/vcs-impl/src/com/intellij/openapi/vcs/changes/ChangeListManagerImpl.java`.
  - Support multiple changelists: Default changelist, custom changelists.
  - Context menu and actions:
    - "New Changelist...".
    - "Set Active Changelist".
    - "Move to Another Changelist...".
    - "Delete Changelist".
  - Changelist state persistence across IDE sessions.
- [ ] **4.2 Granular Chunk Staging (Partial Commit):**
  - Checkbox next to each unified diff chunk in the Commit Review panel.
  - Stage/unstage individual lines or hunks directly from the diff view.
- [ ] **4.3 Pre-commit & Post-commit Lifecycle:**
  - Amend commit checkbox state sync with previous commit message auto-population.
  - Recent commit messages dropdown history (up to 20 messages).
  - Before-commit validation guards (check unversioned files, formatting checks).

---

### Phase 5: Standalone Dialogs & Branch Manager Polish
**Focus:** Remote operations, safety checks, and branch workflow.

- [ ] **5.1 Push Dialog Advanced Safety & Tracking:**
  - Reference: `plugins/git4idea/backend/src/push/GitPushDialog.kt`.
  - Display full commit preview list scheduled to push per branch.
  - Safe Force Push with lease (`--force-with-lease`) with explicit confirmation.
  - Upstream branch tracking checkbox (`-u` / `--set-upstream`).
- [ ] **5.2 Standalone Conflicts Dialog Workflow:**
  - File list displaying conflict status (Both Modified, Deleted by Us, Deleted by Them).
  - Action buttons: "Accept Yours", "Accept Theirs", "Merge...".
- [ ] **5.3 Branch Popup & Context Actions:**
  - Branch actions: "Checkout", "Merge into Current", "Rebase Current onto Selected", "Compare with Current".

---

## 4. Architectural Rules & Anti-AI-Slop Styling

1. **State Management:** Strict Svelte 5 runes (`$state`, `$derived`, `$effect`). No global mutable leaks.
2. **Type Safety:** 100% type safety via `$protocol` (`src/shared/protocol.ts`) and TypeScript static validation (`npx tsc --noEmit`).
3. **UI Styling (Anti-AI-Slop):**
   - Flat, density-aligned JetBrains IntelliJ design.
   - Use predefined CSS variables (`var(--vscode-editor-background)`, `var(--vscode-list-hoverBackground)`).
   - No unnecessary glows, glassmorphism, or non-standard border radiuses.
4. **Git Safety:** Always preserve user data, validate repository state, and enforce non-destructive operations.

---

## 5. Verification & Quality Gates

Every implementation step must satisfy all four gates:
1. `npm test`: All unit and integration tests pass.
2. `npx tsc --noEmit`: 0 TypeScript compiler errors across workspace.
3. `npm run build`: Clean bundle compilation across all webview entrypoints.
4. Functional verification: Verified inside live extension harness with zero visual regressions.
