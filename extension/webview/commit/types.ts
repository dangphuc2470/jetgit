export interface CommitFile {
  path: string;
  name: string;
  dir: string;
  status: string;
  staged?: boolean;
  isUntracked?: boolean;
  partiallyStaged?: boolean;
}

export interface HunkLine {
  type: 'context' | 'insert' | 'delete';
  text: string;
  oldNum: number | null;
  newNum: number | null;
  raw: string;
  blockIdx: number;
}

export interface HunkBlock {
  blockIdx: number;
  type: 'insert' | 'delete' | 'modify';
  lines: HunkLine[];
  oldStart: number;
  oldCount: number;
  newStart: number;
  newCount: number;
  staged: boolean;
}

export interface DiffHunk {
  header: string;
  oldStart: number;
  oldCount: number;
  newStart: number;
  newCount: number;
  lines: HunkLine[];
  blocks: HunkBlock[];
  staged: boolean;
}

export interface DiffData {
  path: string;
  diff: string;
  hunks: DiffHunk[];
  isUntracked?: boolean;
  binary?: boolean;
}

export interface CommitState {
  activeTab: 'commit' | 'shelf' | 'stash';
  files: CommitFile[];
  changesCount: number;
  unversionedCount: number;
  selectedFile: string | null;
  checkedFiles: Set<string>;
  showDiff: boolean;
  diffData: DiffData | null;
  commitMessage: string;
  isAmend: boolean;
  recentMessages: string[];
  stashes: any[];
  expandChanges: boolean;
  expandUnversioned: boolean;
  showPaths: boolean;
  viewOptionsOpen: boolean;
  groupBy: 'none' | 'directory' | 'module';
  groupByDirectory: boolean;
  groupByModule: boolean;
  repoName: string;
  expandedFolders: Set<string>;
  collapsedFolders: Set<string>;
  expandAllFolders: boolean | null;
  showIgnoredFiles: boolean;
  commitOptionsOpen: boolean;
  recentOpen: boolean;
  isGeneratingAi: boolean;
  conflictInfo: any;
  splitRatio: number;
}
