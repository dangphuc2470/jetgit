$ErrorActionPreference = "Continue"
git merge --abort 2>$null | Out-Null
$ErrorActionPreference = "Stop"

# Ensure we are on demo/showcase (create from current branch if missing)
$hasShowcase = git branch --list "demo/showcase"
if (-not $hasShowcase) {
    git checkout -b demo/showcase | Out-Null
} else {
    git checkout demo/showcase | Out-Null
}

New-Item -ItemType Directory -Force -Path "docs/showcase" | Out-Null

# 1. Base commit with spaced sections so 3-way merge shows green (insert), blue (modify), and red (conflict)
Set-Content "docs/showcase/graphRenderer.ts" @"
export interface LaneConfig {
  maxLanes: number;
  laneWidth: number;
  rowHeight: number;
}

export const DEFAULT_LANE_CONFIG: LaneConfig = {
  maxLanes: 16,
  laneWidth: 14,
  rowHeight: 26,
};

export function clampLaneIndex(index: number, config: LaneConfig): number {
  const safeMax = Math.max(1, config.maxLanes);
  if (index < 0) return 0;
  if (index >= safeMax) return safeMax - 1;
  return index;
}

export function resolveLaneColor(laneIndex: number, isDark: boolean): string {
  const darkPalette = ["#3574F0", "#A855F7", "#22C55E"];
  const lightPalette = ["#2563EB", "#7C3AED", "#16A34A"];
  return (isDark ? darkPalette : lightPalette)[laneIndex % 3];
}

export function formatCommitBadge(branchName: string): string {
  const clean = branchName.trim();
  if (!clean) return "HEAD";
  if (clean.length <= 24) return clean;
  return clean.slice(0, 23) + "...";
}

export function computeCommitY(rowIndex: number, config: LaneConfig): number {
  return rowIndex * config.rowHeight + config.rowHeight / 2;
}
"@

git add docs/showcase/graphRenderer.ts
git commit -m "Add base graphRenderer module with spaced sections" | Out-Null

# 2. Branch off feat/conflict-demo (Theirs)
#    - Modify DEFAULT_LANE_CONFIG (conflict)
#    - Insert helper in clampLaneIndex (green insert on Right)
#    - Modify resolveLaneColor (conflict)
#    - Modify formatCommitBadge only on Theirs (blue modify on Right)
#    - Modify computeCommitY (conflict)
git branch -f feat/conflict-demo HEAD | Out-Null
git checkout feat/conflict-demo | Out-Null

Set-Content "docs/showcase/graphRenderer.ts" @"
export interface LaneConfig {
  maxLanes: number;
  laneWidth: number;
  rowHeight: number;
}

export const DEFAULT_LANE_CONFIG: LaneConfig = {
  maxLanes: 24,
  laneWidth: 16,
  rowHeight: 28,
};

export function clampLaneIndex(index: number, config: LaneConfig): number {
  const safeMax = Math.max(1, config.maxLanes);
  // Guard NaN inputs from virtual scroll bounds
  if (!Number.isFinite(index)) return 0;
  if (index < 0) return 0;
  if (index >= safeMax) return safeMax - 1;
  return index;
}

export function resolveLaneColor(laneIndex: number, isDark: boolean): string {
  const darkPalette = ["#589DF6", "#C084FC", "#4ADE80"];
  const lightPalette = ["#1D4ED8", "#6D28D9", "#15803D"];
  return (isDark ? darkPalette : lightPalette)[Math.abs(laneIndex) % 3];
}

export function formatCommitBadge(branchName: string): string {
  const clean = branchName.trim();
  if (!clean) return "HEAD";
  if (clean.length <= 28) return clean;
  return clean.slice(0, 27) + "...";
}

export function computeCommitY(rowIndex: number, config: LaneConfig): number {
  return 8 + rowIndex * config.rowHeight + Math.floor(config.rowHeight / 2);
}
"@

$env:GIT_AUTHOR_NAME = "Minh Nguyen"
$env:GIT_AUTHOR_EMAIL = "minh.nguyen@jetgit.dev"
$env:GIT_COMMITTER_NAME = "Minh Nguyen"
$env:GIT_COMMITTER_EMAIL = "minh.nguyen@jetgit.dev"
git add docs/showcase/graphRenderer.ts
git commit -m "Use vibrant palette, NaN guard, and larger lane spacing" | Out-Null
Remove-Item Env:GIT_AUTHOR_NAME, Env:GIT_AUTHOR_EMAIL, Env:GIT_COMMITTER_NAME, Env:GIT_COMMITTER_EMAIL -ErrorAction SilentlyContinue

# 3. Back to demo/showcase (Yours)
#    - Insert header comment (green insert on Left)
#    - Modify LaneConfig strokeWidth (blue modify on Left)
#    - Modify DEFAULT_LANE_CONFIG (conflict)
#    - Modify resolveLaneColor (conflict)
#    - Modify computeCommitY (conflict)
git checkout demo/showcase | Out-Null

Set-Content "docs/showcase/graphRenderer.ts" @"
// JetGit LinearBek DAG Graph Renderer Utilities
export interface LaneConfig {
  maxLanes: number;
  laneWidth: number;
  rowHeight: number;
  strokeWidth?: number;
}

export const DEFAULT_LANE_CONFIG: LaneConfig = {
  maxLanes: 32,
  laneWidth: 12,
  rowHeight: 24,
};

export function clampLaneIndex(index: number, config: LaneConfig): number {
  const safeMax = Math.max(1, config.maxLanes);
  if (index < 0) return 0;
  if (index >= safeMax) return safeMax - 1;
  return index;
}

export function resolveLaneColor(laneIndex: number, isDark: boolean): string {
  const darkPalette = ["#60A5FA", "#E879F9", "#34D399"];
  const lightPalette = ["#1E40AF", "#5B21B6", "#047857"];
  return (isDark ? darkPalette : lightPalette)[(laneIndex >>> 0) % 3];
}

export function formatCommitBadge(branchName: string): string {
  const clean = branchName.trim();
  if (!clean) return "HEAD";
  if (clean.length <= 24) return clean;
  return clean.slice(0, 23) + "...";
}

export function computeCommitY(rowIndex: number, config: LaneConfig): number {
  return 4 + rowIndex * config.rowHeight + config.rowHeight * 0.5;
}
"@

git add docs/showcase/graphRenderer.ts
git commit -m "Use compact lane metrics and high-contrast palette" | Out-Null

# 4. Trigger 3-way merge conflict (expected exit code 1)
$ErrorActionPreference = "Continue"
git merge --no-ff feat/conflict-demo
$ErrorActionPreference = "Stop"

# 5. Add tracked changes and unversioned files for Commit / Changes sidebar showcase
if (Test-Path "docs/showcase/roadmap.md") {
    Add-Content "docs/showcase/roadmap.md" "`n- [x] Marketplace icon & screenshot polish"
}
if (Test-Path "docs/showcase/lane-palette.md") {
    Add-Content "docs/showcase/lane-palette.md" "`n- Added high-contrast accessibility tokens"
}

Set-Content "docs/showcase/new-feature-draft.ts" "export const DRAFT_MODE = true;`nexport const VERSION = '0.2.0';`n"
Set-Content "docs/showcase/theme-tokens.json" "{`n  `"trunk`": `"#3574F0`",`n  `"branch`": `"#A855F7`"`n}`n"
Set-Content "docs/showcase/screenshots-checklist.md" "- [ ] Git Graph & Branches`n- [ ] Commit Sidebar & Changes`n- [ ] 3-Way Merge Conflict Resolver`n- [ ] 2-Way Review`n"

git status -s
