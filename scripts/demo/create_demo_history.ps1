$ErrorActionPreference = "Stop"

function Invoke-FakeCommit {
    param(
        [string]$AuthorName,
        [string]$AuthorEmail,
        [string]$IsoDate,
        [string]$Message
    )
    $env:GIT_AUTHOR_NAME = $AuthorName
    $env:GIT_AUTHOR_EMAIL = $AuthorEmail
    $env:GIT_AUTHOR_DATE = $IsoDate
    $env:GIT_COMMITTER_NAME = $AuthorName
    $env:GIT_COMMITTER_EMAIL = $AuthorEmail
    $env:GIT_COMMITTER_DATE = $IsoDate
    git add -A
    git commit -m $Message | Out-Null
}

function Invoke-FakeMerge {
    param(
        [string]$BranchToMerge,
        [string]$AuthorName,
        [string]$AuthorEmail,
        [string]$IsoDate,
        [string]$Message
    )
    $env:GIT_AUTHOR_NAME = $AuthorName
    $env:GIT_AUTHOR_EMAIL = $AuthorEmail
    $env:GIT_AUTHOR_DATE = $IsoDate
    $env:GIT_COMMITTER_NAME = $AuthorName
    $env:GIT_COMMITTER_EMAIL = $AuthorEmail
    $env:GIT_COMMITTER_DATE = $IsoDate
    git merge --no-ff $BranchToMerge -m $Message | Out-Null
}

# Start cleanly from master
git checkout -b demo/showcase master | Out-Null
New-Item -ItemType Directory -Force -Path "docs/showcase" | Out-Null

Set-Content "docs/showcase/roadmap.md" @"
# JetGit v0.2.0 Roadmap
- [x] LinearBek DAG Commit Graph
- [x] Commit & Changes Sidebar
- [ ] 3-Way Merge Conflict Resolver
- [ ] 2-Way Review Mode
"@
Set-Content "docs/showcase/draft-notes.md" "Temporary release scratchpad"
Invoke-FakeCommit "dangphuc2470" "dangnguyenhoangphuc1@gmail.com" "2026-11-20T09:15:00+07:00" "Initialize v0.2.0 roadmap and architecture notes"

# Branch 1: feat/3way-merge-conflict-markers
git checkout -b feat/3way-merge-conflict-markers demo/showcase | Out-Null
Set-Content "docs/showcase/conflict-parser.md" "# 3-Way Merge Parser`n- Parse ours / base / theirs hunks"
Invoke-FakeCommit "Minh Nguyen" "minh.nguyen@jetgit.dev" "2026-11-20T10:30:00+07:00" "Add conflict block parser for 3-way merge view"

Add-Content "docs/showcase/conflict-parser.md" "`n- Highlight base, yours, and theirs diff gutters"
Invoke-FakeCommit "Minh Nguyen" "minh.nguyen@jetgit.dev" "2026-11-20T13:10:00+07:00" "Highlight base, yours, and theirs diff gutters"

# Branch 2 (parallel from base): feat/linearbek-lane-colors
git checkout -b feat/linearbek-lane-colors demo/showcase | Out-Null
Set-Content "docs/showcase/lane-palette.md" "# DAG Lane Colors`n- Blue trunk, violet feature, amber release"
Invoke-FakeCommit "Linh Tran" "linh.tran@jetgit.dev" "2026-11-20T11:20:00+07:00" "Refine DAG lane color palette for dark and light themes"

Add-Content "docs/showcase/lane-palette.md" "`n- Smooth cubic bezier curves on branch/merge junctions"
Invoke-FakeCommit "Linh Tran" "linh.tran@jetgit.dev" "2026-11-20T14:05:00+07:00" "Smooth bezier branch curve junctions in graph canvas"

# Back to demo/showcase and merge feat/linearbek-lane-colors
git checkout demo/showcase | Out-Null
Invoke-FakeMerge "feat/linearbek-lane-colors" "dangphuc2470" "dangnguyenhoangphuc1@gmail.com" "2026-11-20T15:00:00+07:00" "Merge branch 'feat/linearbek-lane-colors' into demo/showcase"

# Add one more commit on feat/3way-merge-conflict-markers after trunk moved
git checkout feat/3way-merge-conflict-markers | Out-Null
Add-Content "docs/showcase/conflict-parser.md" "`n- Wire Alt+Left / Alt+Right accept hunk actions"
Invoke-FakeCommit "dangphuc2470" "dangnguyenhoangphuc1@gmail.com" "2026-11-20T16:20:00+07:00" "Wire accept-left and accept-right keyboard shortcuts"

# Branch 3: fix/webview-font-scale
git checkout -b fix/webview-font-scale demo/showcase | Out-Null
Set-Content "docs/showcase/font-scale.md" "# Font Scale`n- Sync --jetgit-font-scale from VS Code editor.fontSize"
Invoke-FakeCommit "Alex Rivera" "alex.rivera@jetgit.dev" "2026-11-20T17:05:00+07:00" "Sync webview font scale with VS Code editor settings"

Add-Content "docs/showcase/font-scale.md" "`n- Prevent branch pill badge clipping at 120% zoom"
Invoke-FakeCommit "Alex Rivera" "alex.rivera@jetgit.dev" "2026-11-20T18:15:00+07:00" "Fix branch badge clipping at 120% zoom level"

# Back to demo/showcase and merge feat/3way-merge-conflict-markers
git checkout demo/showcase | Out-Null
Invoke-FakeMerge "feat/3way-merge-conflict-markers" "Minh Nguyen" "minh.nguyen@jetgit.dev" "2026-11-21T09:10:00+07:00" "Merge branch 'feat/3way-merge-conflict-markers' into demo/showcase"

# Branch 4: hotfix/git-askpass-timeout from earlier linearbek commit
git checkout -b hotfix/git-askpass-timeout "feat/linearbek-lane-colors~1" | Out-Null
Set-Content "docs/showcase/askpass-fix.md" "# Askpass Fix`n- Increase SSH & credential helper timeout to 60s"
Invoke-FakeCommit "Sarah Chen" "sarah.chen@jetgit.dev" "2026-11-21T10:00:00+07:00" "Increase credential helper timeout for slow SSH remotes"

# Merge hotfix into demo/showcase
git checkout demo/showcase | Out-Null
Invoke-FakeMerge "hotfix/git-askpass-timeout" "dangphuc2470" "dangnguyenhoangphuc1@gmail.com" "2026-11-21T11:30:00+07:00" "Merge branch 'hotfix/git-askpass-timeout' into demo/showcase"
git tag "v0.2.0-beta.1"

# Branch 5: release/0.2.0
git checkout -b release/0.2.0 demo/showcase | Out-Null
Invoke-FakeMerge "fix/webview-font-scale" "Alex Rivera" "alex.rivera@jetgit.dev" "2026-11-21T13:15:00+07:00" "Merge branch 'fix/webview-font-scale' into release/0.2.0"

Remove-Item "docs/showcase/draft-notes.md" -Force
Set-Content "docs/showcase/roadmap.md" @"
# JetGit v0.2.0 Roadmap
- [x] LinearBek DAG Commit Graph
- [x] Commit & Changes Sidebar
- [x] 3-Way Merge Conflict Resolver
- [x] 2-Way Review Mode
"@
Invoke-FakeCommit "dangphuc2470" "dangnguyenhoangphuc1@gmail.com" "2026-11-21T14:40:00+07:00" "Prepare changelog and release checklist for v0.2.0"
git tag "v0.2.0-rc.1"

# Merge release/0.2.0 back into demo/showcase
git checkout demo/showcase | Out-Null
Invoke-FakeMerge "release/0.2.0" "dangphuc2470" "dangnguyenhoangphuc1@gmail.com" "2026-11-21T15:50:00+07:00" "Merge branch 'release/0.2.0' into demo/showcase"

# Open parallel feature branches at the top for active multi-lane look
git checkout -b feat/commit-search-filter demo/showcase | Out-Null
Set-Content "docs/showcase/search-filter.md" "# Search Filter`n- Support author:, branch:, and regex queries"
Invoke-FakeCommit "Linh Tran" "linh.tran@jetgit.dev" "2026-11-21T16:45:00+07:00" "Add author and branch filter chips to Git Log toolbar"

Add-Content "docs/showcase/search-filter.md" "`n- Debounce incremental graph query at 150ms"
Invoke-FakeCommit "Linh Tran" "linh.tran@jetgit.dev" "2026-11-21T17:30:00+07:00" "Debounce incremental log search query at 150ms"

git checkout -b chore/perf-virtual-list "demo/showcase~1" | Out-Null
Set-Content "docs/showcase/virtual-list.md" "# Virtual List`n- Reuse DOM row nodes when scrolling 10k+ commits"
Invoke-FakeCommit "Sarah Chen" "sarah.chen@jetgit.dev" "2026-11-21T18:10:00+07:00" "Optimize virtualized graph row recycling for large repos"

# Return to demo/showcase
git checkout demo/showcase | Out-Null

# Clear temporary env vars
Remove-Item Env:GIT_AUTHOR_NAME, Env:GIT_AUTHOR_EMAIL, Env:GIT_AUTHOR_DATE, Env:GIT_COMMITTER_NAME, Env:GIT_COMMITTER_EMAIL, Env:GIT_COMMITTER_DATE -ErrorAction SilentlyContinue

git log --oneline --graph --decorate -n 20
