export interface Commit {
  hash: string;
  abbreviatedHash: string;
  parents: string[];
  author: string;
  authorEmail: string;
  authorDate: string;
  subject: string;
  body: string;
  refs: string[];
  isCurrentBranch?: boolean;
}

export interface FileChange {
  status: string; // 'A' | 'M' | 'D' | 'R' | 'C'
  path: string;
  oldPath?: string;
}

export interface BranchInfo {
  name: string;
  current: boolean;
  remote?: string;
  upstream?: string;
  hash: string;
  ahead?: number;
  behind?: number;
}

export interface TagInfo {
  name: string;
  hash: string;
}

export interface StatusEntry {
  x: string; // index status
  y: string; // worktree status
  path: string;
  origPath?: string;
}

export interface ConflictFileInfo {
  name: string;
  path: string;
  dir: string;
  yours: string;
  theirs: string;
  hasBothModified: boolean;
}

export interface ConflictInfo {
  hasConflicts: boolean;
  isMerging: boolean;
  isRebasing: boolean;
  yoursBranch: string;
  theirsBranch: string;
  conflicts: ConflictFileInfo[];
}

export interface PushCommitInfo {
  hash: string;
  shortHash: string;
  message: string;
  author: string;
  date: string;
  files: { path: string; name: string; dir: string; status: string }[];
}

export interface PushInfo {
  currentBranch: string;
  remoteBranch: string;
  remote: string;
  remotes: string[];
  isNew: boolean;
  commits: PushCommitInfo[];
  totalFiles: { path: string; name: string; dir: string; status: string }[];
  repoName: string;
}

export const SEP = '\x1e';
export const LOG_FORMAT = [
  '%x00%H', // hash with null byte commit delimiter
  '%h',   // abbreviated hash
  '%P',   // parent hashes
  '%an',  // author name
  '%ae',  // author email
  '%aI',  // author date ISO
  '%s',   // subject
  '%b',   // body
  '%D',   // ref names
].join(SEP);
