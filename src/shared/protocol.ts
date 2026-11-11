/**
 * Shared IPC Protocol definitions between VS Code Extension Host (src/)
 * and Webview panels (webview/).
 *
 * All messages passed across vscode.postMessage and onDidReceiveMessage
 * should be typed here for end-to-end type safety.
 */

// ============================================================================
// 1. Commit Review Panel (Side-by-side / Unified Diff)
// ============================================================================

export interface FileDiffPayload {
  path: string;
  filePath?: string;
  fileName: string;
  fileDir: string;
  diff: string;
  stagedDiff?: string;
  baseContent: string;
  currentContent: string;
  filesList: string[];
  currentFileIndex: number;
  highlightWords?: boolean;
  readOnly: boolean;
  baseTitle?: string;
  targetTitle?: string;
  focusTarget?: { focusLine: number; focusOffset?: number } | null;
  focusLine?: number;
  focusOffset?: number;
  jumpDirection?: number;
  fromFileList?: boolean;
}

export type ExtensionToReviewMessage =
  | { type: 'fileDiff'; payload: FileDiffPayload }
  | { type: 'jumpDiff'; payload: { direction: number; fromFileList?: boolean } }
  | { type: 'stagedDiffUpdated'; payload: { stagedDiff: string } }
  | { type: 'themeTokens'; payload: Record<string, string> };

export type ReviewToExtensionMessage =
  | { type: 'ready' }
  | { type: 'refreshDiff'; payload?: string }
  | { type: 'navigateFile'; payload: number }
  | {
      type: 'updateBlockStage';
      payload: {
        filePath: string;
        stagedContent: string;
        stagedCount: number;
        totalCount: number;
      };
    }
  | {
      type: 'revertBlockContent';
      payload: {
        filePath: string;
        newContent: string;
      };
    }
  | {
      type: 'saveFileContent';
      payload: {
        filePath: string;
        content: string;
        focusLine: number;
        focusOffset?: number;
      };
    }
  | {
      type: 'applyHunkPatch';
      payload: {
        patch: string;
        reverse?: boolean;
      };
    }
  | { type: 'openFile'; payload: string }
  | { type: 'rollbackHunk'; payload: { patch: string } }
  | { type: 'webviewLog'; payload: string }
  | { type: 'webviewError'; payload: string };


// ============================================================================
// 2. Commit Panel (Changes & Commit Tool Window)
// ============================================================================

export interface CommitFileItem {
  path: string;
  status: string;
  staged?: boolean;
  oldPath?: string;
}

export interface ChangelistItem {
  id: string;
  name: string;
  isDefault?: boolean;
  files: CommitFileItem[];
}

export interface CommitPanelState {
  stagedFiles: CommitFileItem[];
  unstagedFiles: CommitFileItem[];
  untrackedFiles: CommitFileItem[];
  changelists?: ChangelistItem[];
  branchName?: string;
  amendMessage?: string;
  isAmending?: boolean;
}

export type ExtensionToCommitMessage =
  | { type: 'state'; payload: CommitPanelState }
  | { type: 'closeAllMenus' }
  | { type: 'commitSuccess' }
  | { type: 'pushSuccess' }
  | { type: 'pushError'; payload: { error: string } }
  | { type: 'aiCommitMessage'; payload: { message: string } }
  | { type: 'setCommitMessage'; payload: { message: string } }
  | { type: 'generateAiError' }
  | { type: 'fileDiff'; payload: { path: string; diff: string } }
  | { type: 'themeTokens'; payload: Record<string, string> }
  | { type: 'skippedFiles'; payload: { files: any[] } };

export type CommitToExtensionMessage =
  | { type: 'ready' }
  | { type: 'refresh' }
  | { type: 'getSkippedFiles'; payload?: { force?: boolean } }
  | {
      type: 'selectFile';
      payload:
        | string
        | {
            filePath: string;
            jumpDiff?: boolean;
            fromFileList?: boolean;
            direction?: number;
          };
    }
  | {
      type: 'openReviewInCenter';
      payload:
        | string
        | {
            filePath: string;
            jumpDiff?: boolean;
            fromFileList?: boolean;
            direction?: number;
          };
    }
  | { type: 'stageFile'; payload: string }
  | { type: 'stageFiles'; payload: string[] }
  | { type: 'unstageFile'; payload: string }
  | { type: 'unstageFiles'; payload: string[] }
  | { type: 'discardFile'; payload: string }
  | { type: 'discardFiles'; payload: string[] }
  | {
      type: 'commit';
      payload: {
        message: string;
        files?: string[];
        amend?: boolean;
      };
    }
  | {
      type: 'commitAndPush';
      payload: {
        message: string;
        files?: string[];
        amend?: boolean;
      };
    }
  | { type: 'generateCommitMessage'; payload?: { files?: string[] } }
  | { type: 'newChangelist'; payload?: { name: string; comment?: string } }
  | { type: 'deleteChangelist'; payload: string }
  | { type: 'renameChangelist'; payload: string | { oldName: string; newName?: string } }
  | { type: 'setActiveChangelist'; payload: string }
  | {
      type: 'moveFilesToChangelist';
      payload: {
        files: string[];
        changelist: string;
      };
    }
  | { type: 'promptMoveToChangelist'; payload?: { files?: string[]; filePath?: string } }
  | { type: 'openFile'; payload: string }
  | { type: 'rollbackFiles'; payload: string[] }
  | { type: 'jumpToSource'; payload: string }
  | { type: 'deleteFile'; payload: string }
  | { type: 'getFileDiff'; payload: string }
  | { type: 'applyHunkPatch'; payload: { patch: string; reverse?: boolean } }
  | { type: 'openPushDialog'; payload?: { branch?: string } }
  | {
      type: 'executePush';
      payload?: {
        branch?: string;
        targetBranch?: string;
        force?: boolean;
        setUpstream?: boolean;
        remote?: string;
        tags?: boolean;
      };
    }
  | { type: 'acceptYours'; payload: { path: string } }
  | { type: 'acceptTheirs'; payload: { path: string } }
  | { type: 'openMergeEditor'; payload: { path: string } }
  | { type: 'abortMerge' }
  | { type: 'openConflictsDialog' }
  | { type: 'generateAiCommitMessage'; payload?: { files?: string[] } }
  | { type: 'openDiffInEditor'; payload: string }
  | { type: 'createStash' }
  | { type: 'stashPop'; payload: string }
  | { type: 'stashApply'; payload: string }
  | { type: 'stashDrop'; payload: string }
  | { type: 'openLog' }
  | { type: 'collapseView' }
  | { type: 'unskipFile'; payload: string }
  | { type: 'skipFile'; payload: string };


// ============================================================================
// 3. Git Graph Panel (Log & Branch Graph)
// ============================================================================

export interface GraphFilterOptions {
  branch?: string;
  author?: string;
  after?: string;
  before?: string;
  path?: string;
  query?: string;
  order?: 'date' | 'topo' | string;
  firstParent?: boolean;
  noMerges?: boolean;
  all?: boolean;
}

export type ExtensionToGraphMessage =
  | { type: 'init'; payload: any }
  | { type: 'commits'; payload: any }
  | { type: 'commitFiles'; payload: { hash: string; files: any[] } }
  | { type: 'reachedEnd' }
  | { type: 'updateBranchAndUser'; payload: any }
  | { type: 'closeAllMenus' }
  | { type: 'reposList'; payload: any }
  | { type: 'repoChanged'; payload: any }
  | { type: 'pushSuccess' }
  | { type: 'pushError'; payload: { error: string } }
  | { type: 'pullSuccess' }
  | { type: 'pullError'; payload: { error: string } }
  | { type: 'fetchSuccess' }
  | { type: 'fetchError'; payload: { error: string } }
  | { type: 'authSuccess'; payload: { remote: string } }
  | { type: 'scrollToCommit'; payload: string }
  | { type: 'openCheckoutBranchDialog'; payload: { remoteRef: string; defaultName?: string } }
  | { type: 'themeTokens'; payload: Record<string, string> }
  | { type: 'tasksUpdate'; payload: TaskItem[] };

export interface TaskItem {
  id: string;
  title: string;
  detail?: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: number;
  endTime?: number;
  canCancel: boolean;
}

export type GraphToExtensionMessage =
  | { type: 'ready' }
  | { type: 'refresh' }
  | { type: 'refreshBranches' }
  | { type: 'selectCommit'; payload: string }
  | { type: 'openDiff'; payload: { hash: string; file: any } }
  | { type: 'openReviewInCenter'; payload: string | { filePath: string } }
  | { type: 'loadMore' }
  | { type: 'filter'; payload: GraphFilterOptions }
  | { type: 'switchRepo'; payload: string }
  | { type: 'exitSubRepo' }
  | { type: 'initRepo' }
  | { type: 'checkout'; payload: string | { branch: string; name?: string; force?: boolean } }
  | { type: 'checkoutCommit'; payload: { hash: string } }
  | { type: 'createBranch'; payload: { name: string; target?: string; checkout?: boolean } }
  | { type: 'deleteBranch'; payload: { branch: string; force?: boolean } }
  | { type: 'merge'; payload: { branch: string } }
  | { type: 'rebase'; payload: { branch: string } }
  | { type: 'cherryPick'; payload: { hash: string } }
  | { type: 'revert'; payload: { hash: string } }
  | { type: 'dropCommit'; payload: { hash: string } }
  | { type: 'resetBranch'; payload: { hash: string; mode: string } }
  | { type: 'tagCommit'; payload: { hash: string; name: string } }
  | { type: 'push'; payload?: any }
  | { type: 'pull'; payload?: any }
  | { type: 'fetch'; payload?: any }
  | { type: 'cancelTask'; payload: { id: string } }
  | { type: 'dismissTask'; payload: { id: string } }
  | { type: 'clearFinishedTasks' };


// ============================================================================
// 4. Interactive Rebase Panel
// ============================================================================

export type ExtensionToRebaseMessage =
  | { type: 'init'; payload: { commits: any[]; baseHash: string; baseBranch?: string } }
  | { type: 'rebaseStarted' }
  | { type: 'rebaseSuccess' }
  | { type: 'rebaseError'; payload: { error: string } };

export type RebaseToExtensionMessage =
  | { type: 'ready' }
  | { type: 'startRebase'; payload: any }
  | { type: 'abort' }
  | { type: 'abortRebase' }
  | { type: 'continueRebase' };


// ============================================================================
// 5. 3-Way Merge Editor Panel
// ============================================================================

export interface ConflictHunk {
  id: number;
  type?: 'common' | 'conflict';
  commonLines?: string[];
  baseStart?: number;
  baseLines?: string[];
  yoursStart?: number;
  yoursLines?: string[];
  theirsStart?: number;
  theirsLines?: string[];
  resolved?: boolean;
  chosen?: 'yours' | 'theirs' | 'custom' | 'ignored' | null;
  chosenSide?: 'yours' | 'theirs' | 'both' | 'custom';
  leftStatus?: 'pending' | 'accepted' | 'ignored';
  rightStatus?: 'pending' | 'accepted' | 'ignored';
  resultLines?: string[];
}

export interface LoadMergeDataPayload {
  filePath: string;
  fileName: string;
  yoursBranch: string;
  theirsBranch: string;
  hunks: ConflictHunk[];
  baseContent: string;
  yoursContent: string;
  theirsContent: string;
}

export type ExtensionToMergeMessage =
  | { type: 'loadMergeData'; payload: LoadMergeDataPayload }
  | { type: 'themeTokens'; payload: Record<string, string> };

export type MergeToExtensionMessage =
  | { type: 'ready' }
  | { type: 'applyMerge'; payload: { filePath: string; content: string } }
  | { type: 'cancelMerge' };


// ============================================================================
// 6. Conflicts Dialog Panel
// ============================================================================

export interface ConflictFileEntry {
  path: string;
  yoursStatus?: string;
  theirsStatus?: string;
}

export type ExtensionToConflictsMessage =
  | { type: 'updateConflictInfo'; payload: any };

export type ConflictsToExtensionMessage =
  | { type: 'close' }
  | { type: 'acceptYours'; payload: { path: string } }
  | { type: 'acceptTheirs'; payload: { path: string } }
  | { type: 'openMergeEditor'; payload: { path: string } };


// ============================================================================
// 7. Push Dialog Panel
// ============================================================================

export type ExtensionToPushMessage =
  | { type: 'updatePushInfo'; payload: any }
  | { type: 'pushFailed'; error: string };

export type PushToExtensionMessage =
  | { type: 'close' }
  | {
      type: 'openReviewInCenter';
      payload: {
        filePath: string;
        commitHash?: string;
        filesList?: string[];
      };
    }
  | {
      type: 'executePush';
      payload: {
        branch: string;
        force?: boolean;
        setUpstream?: boolean;
        remote: string;
        tags?: boolean;
        targetBranch?: string;
      };
    };

// ============================================================================
// Overall Message Unions
// ============================================================================

export type AnyWebviewToExtensionMessage =
  | ReviewToExtensionMessage
  | CommitToExtensionMessage
  | GraphToExtensionMessage
  | RebaseToExtensionMessage
  | MergeToExtensionMessage
  | ConflictsToExtensionMessage
  | PushToExtensionMessage;

export type AnyExtensionToWebviewMessage =
  | ExtensionToReviewMessage
  | ExtensionToCommitMessage
  | ExtensionToGraphMessage
  | ExtensionToRebaseMessage
  | ExtensionToMergeMessage
  | ExtensionToConflictsMessage
  | ExtensionToPushMessage;

