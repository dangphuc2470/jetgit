export interface DiffBlock {
  id: number;
  type: 'add' | 'del' | 'mod';
  leftStart: number;
  leftEnd: number;
  isLeftEmpty: boolean;
  rightStart: number;
  rightEnd: number;
  isRightEmpty: boolean;
  delCount?: number;
  addCount?: number;
  staged: boolean;
  patchContent: string;
}

export interface ScrollSegment {
  leftY: number;
  rightY: number;
  hLeft: number;
  hRight: number;
  isDiff: boolean;
}

export interface FocusTarget {
  focusLine: number;
  focusOffset?: number;
}

export interface HistoryState {
  content: string;
  scrollTop: number;
}

export interface ReviewState {
  filePath: string;
  fileName: string;
  fileDir: string;
  diff: string;
  stagedDiff?: string;
  baseContent: string;
  currentContent: string;
  baseLines: string[];
  currentLines: string[];
  filesList: string[];
  currentFileIndex: number;
  highlightWords: boolean;
  blocks: DiffBlock[];
  segments: ScrollSegment[];
  currentDiffIndex: number;
  readOnly: boolean;
  focusTarget: FocusTarget | null;
  baseTitle?: string;
  targetTitle?: string;
  pendingJumpDirection?: number | null;
  pendingFromFileList?: boolean | null;
}
