# JetGit — IntelliJ & JetBrains Style Git Client for VS Code

A fast, lightweight, and modern Git client bringing JetBrains IntelliJ IDEA's Git workflow to Visual Studio Code, Cursor, Windsurf, Antigravity, and other VS Code-based editors.

Powered by **Svelte 5** and featuring the **LinearBek DAG graph layout engine**, JetGit delivers 60fps-120fps responsive scrolling, seamless 3-way merge conflict resolution, and intuitive branch management without paywalls or telemetry bloat.

---

## Key Features

### 1. Visual Commit Graph (DAG) with LinearBek Engine
A full interactive commit history with colored branch lines (DAG), mirroring IntelliJ IDEA's Git Log window:
- **LinearBek Graph Layout:** Clusters feature branches contiguous to their merge heads, preventing criss-crossing lines and maintaining an uninterrupted column-0 trunk.
- **Clean Git Query:** Directly queries `HEAD`, local branches, remote tracking branches, and tags, filtering out `refs/stash` and internal notes noise.
- **Detailed Commit Details:** Inspect all affected files per commit with side-by-side diff review.
- **Keyboard Shortcut:** `Cmd+9` (macOS) / `Ctrl+Shift+9` (Windows/Linux).

### 2. Svelte 5 Powered 3-Way Merge Tool
A dedicated IntelliJ-style 3-pane merge window:
- **Yours (Left), Result (Center), Theirs (Right)** with synchronized scrolling decoupled via `requestAnimationFrame`.
- **Declarative SVG Ribbon:** Smooth gutter connectors visually mapping conflict chunks across panes.
- **One-Click Resolvers:** Quick resolve buttons (`>>` Apply Yours, `<<` Apply Theirs).
- **Non-Conflicting Merges:** Bulk auto-resolution of non-overlapping changes.

### 3. Interactive Rebase Tool
A visual interface for interactive Git rebase operations:
- Easily reorder, squash, fixup, reword, edit, or drop commits.
- Drag-and-drop commit sequence reordering.
- Triggered directly from Git Log via "Interactively Rebase from Here...".

### 4. IntelliJ Commit Tool Window & Changelists
Bring JetBrains changelists and granular staging to VS Code:
- Group uncommitted changes into custom named lists.
- Track active changelists and commit changes selectively.
- Tri-state directory tree and flat views (`^P`).
- Amend commit, recent commit message history, and AI-assisted commit message generation.
- Keyboard Shortcut: `Cmd+K` (macOS) / `Ctrl+K` (Windows/Linux).

### 5. Inline Blame Annotations
Lightweight, non-intrusive git blame annotations in the editor gutter:
- Age-based subtle color highlights (fades smoothly for older changes).
- Hover to view full author, commit message, and hash.
- Click to reveal the commit immediately in the Git Log.
- Keyboard Shortcut: `Option+B` (macOS) / `Alt+B` (Windows/Linux).

### 6. Branch Manager & Standalone Push/Conflicts Dialogs
- Sidebar branch explorer: Local branches, Remote branches, and Tags.
- Standalone Svelte-powered Push Dialog with branch tracking and force-push safety.
- Dedicated standalone Conflicts Dialog.

---

## Keyboard Shortcuts

| Action | macOS | Windows / Linux |
| :--- | :--- | :--- |
| **Open Git Log** | `Cmd+9` | `Ctrl+Shift+9` |
| **Toggle Inline Blame** | `Option+B` | `Alt+B` |
| **Commit Tool Window** | `Cmd+K` | `Ctrl+K` |
| **Jump to Next Diff Chunk** | `F7` | `F7` |
| **Jump to Previous Diff Chunk** | `Shift+F7` | `Shift+F7` |

---

## Requirements

- VS Code `^1.85.0` or compatible editors (Cursor, Windsurf, Antigravity, Void, VSCodium).
- Git `2.0+` installed and available in your system `PATH`.

---

## Acknowledgements & Credits

This project was originally based on `intellij-git-ext` by **Murat Böck** ([muratbock.com](https://muratbock.com)).

Since 2026, the project has been fully rewritten with Svelte 5, modernized with the LinearBek DAG engine, and maintained by **Dang Phuc** ([github.com/dangphuc2470](https://github.com/dangphuc2470)).

---

## Disclaimer

JetGit is an independent open-source extension and is not affiliated with, endorsed by, or sponsored by JetBrains s.r.o. "IntelliJ", "IntelliJ IDEA", "WebStorm", "PyCharm", "Android Studio", and "JetBrains" are registered trademarks of JetBrains s.r.o.

---

## License

[MIT License](LICENSE) — Copyright (c) 2024 Murat Böck, Copyright (c) 2026 Dang Phuc.
