# IntelliJ Git — Free GitLens Alternative with Visual Commit Graph

A free, lightweight alternative to GitLens that brings IntelliJ IDEA's Git integration to Visual Studio Code, Cursor, Windsurf, Antigravity, and other VS Code-based editors.

If you've ever missed IntelliJ's visual commit graph, inline blame, or changelists after switching to VS Code — this extension is for you. No paid tiers, no feature gating — everything is free and open source.

## Features

### Visual Commit Graph

A full commit history with colored branch lines (DAG), just like IntelliJ's Git Log. Lives in the bottom panel for quick access.

- Colored branch lines showing merges, forks, and parallel development
- Branch and tag labels on commits
- Filter by branch, author, date range, or file path
- Click a commit to see all changed files
- Click a file to open a **side-by-side diff** view
- Right-click a commit to start an interactive rebase
- Infinite scroll — loads more commits as you scroll down
- Keyboard shortcut: `Cmd+9` (macOS) / `Ctrl+Shift+9` (Windows/Linux)

### Inline Blame Annotations

Toggle per-line blame annotations in the editor gutter, showing who last changed each line and when.

- Age-based coloring: recent changes are highlighted, older ones fade out
- Compact format: date + author name in the left gutter
- Hover for full commit details (message, hash, email)
- Click an annotation to jump to that commit in the Git Log
- Silently skips untracked files (no annoying popups)
- Keyboard shortcut: `Option+B` (macOS) / `Alt+B` (Windows/Linux)

### Branch Manager

A tree view in the Source Control sidebar showing all your branches organized by category.

- **HEAD** — current branch with star icon
- **Local** — all local branches
- **Remote** — remote branches grouped by remote name (origin, upstream, etc.)
- **Tags** — all tags
- Right-click context menu: Checkout, Create Branch, Merge, Rebase, Compare, Delete

### Changelists

Group your uncommitted changes into named lists — just like IntelliJ's changelists.

- Create multiple changelists to organize work-in-progress
- Set an active changelist (new changes go here)
- Commit individual changelists separately
- Stored per-workspace in `.vscode/changelists.json`
- Keyboard shortcut: `Cmd+K` (macOS) / `Ctrl+K` (Windows/Linux) to commit active changelist

### Interactive Rebase

A visual dialog for interactive rebase — reorder, squash, fixup, reword, edit, or drop commits.

- Drag-and-drop commit reordering
- Dropdown per commit: Pick, Squash, Fixup, Reword, Edit, Drop
- Trigger from the Git Log context menu: "Interactively Rebase from Here..."

### Merge Conflict Detection

Automatic detection of merge conflicts with quick resolution options.

- Status bar indicator showing conflict count
- "Resolve Conflicts" command opens VS Code's built-in merge editor
- "Accept All Non-Conflicting" for bulk resolution of trivial conflicts

## Keyboard Shortcuts

| Action | macOS | Windows/Linux |
|--------|-------|---------------|
| Open Git Log | `Cmd+9` | `Ctrl+Shift+9` |
| Toggle Blame | `Option+B` | `Alt+B` |
| Commit Active Changelist | `Cmd+K` | `Ctrl+K` |

## Commands

Open the Command Palette (`Cmd+Shift+P`) and type "IntelliJ Git" to see all available commands:

- **Open Git Log** — Focus the commit graph panel
- **Toggle Blame Annotations** — Show/hide inline blame
- **Interactive Rebase...** — Start an interactive rebase
- **New Changelist...** — Create a new changelist
- **Resolve Merge Conflicts** — Open conflict resolution
- **Refresh Branches** — Refresh the branch tree
- And more...

## Requirements

- VS Code 1.85+ (or any compatible editor: Cursor, Windsurf, Antigravity, Void, etc.)
- Git 2.0+ installed and available in PATH

## Why This Extension?

VS Code has good basic Git support, but lacks the cohesive, visual Git experience that JetBrains IDEs provide. GitLens is powerful but many features are locked behind a paid tier. **IntelliJ Git** is a completely free alternative that focuses on what IntelliJ/WebStorm/PyCharm users actually miss:

- A proper visual git graph with colored branch lines (not just a flat list)
- Git blame annotations that stay out of your way until you need them
- Changelists for organizing uncommitted work (just like JetBrains)
- Side-by-side diff viewer for any commit
- Git history and git timeline visualization
- Everything integrated into the existing VS Code UI — no extra sidebars or clutter

**Switching from GitLens?** IntelliJ Git covers the core features — commit graph, blame, diff, branch management — without the complexity. It's fast, free, and designed for developers who prefer the JetBrains workflow.

## Support the Developer

This extension is free and open source. If you find it useful, you can support the developer by checking out [adlibrary.com](https://www.adlibrary.com) — a competitive ad intelligence platform for performance marketers. If you or your team run paid ads, give it a try!

Need help with web development or scraping projects? Visit [muratbock.com](https://muratbock.com).

## Feedback & Issues

Found a bug or have a feature request? Open an issue on [GitHub](https://github.com/intellij-git-ext/intellij-git-ext/issues).

## License

MIT
