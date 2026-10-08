import { ReviewState, HistoryState } from './types';

export const LINE_HEIGHT = 20;
export const MAX_HISTORY = 50;

export const state: ReviewState = {
  filePath: '',
  fileName: '',
  fileDir: '',
  diff: '',
  stagedDiff: '',
  baseContent: '',
  currentContent: '',
  baseLines: [],
  currentLines: [],
  filesList: [],
  currentFileIndex: 0,
  highlightWords: true,
  blocks: [],
  segments: [],
  currentDiffIndex: 0,
  readOnly: false,
  focusTarget: null,
  baseTitle: '',
  targetTitle: '',
  pendingJumpDirection: null,
  pendingFromFileList: null,
};

export const runtime = {
  savedScrollTop: null as number | null,
  isSyncing: false,
  isRendering: false,
  activeScroller: null as 'left' | 'right' | null,
  scrollerTimeout: null as any,
  scrollAnimId: null as number | null,
  updateRibbonsFn: null as (() => void) | null,
};

export const undoStack: HistoryState[] = [];
export const redoStack: HistoryState[] = [];
