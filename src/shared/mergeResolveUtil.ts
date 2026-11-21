// Copyright 2000-2024 JetBrains s.r.o. and contributors. Use of this source code is governed by the Apache 2.0 license.
// Aligned with platform/diff-impl/src/com/intellij/diff/merge/MergeUtil.java and MergeResolveUtil.kt

export interface ConflictHunk {
  id: number;
  type: 'common' | 'conflict';
  commonLines?: string[];
  baseLines?: string[];
  yoursLines?: string[];
  theirsLines?: string[];
  resolved?: boolean;
  chosen?: 'yours' | 'theirs' | 'custom' | 'ignored' | null;
  leftStatus?: 'pending' | 'accepted' | 'ignored';
  rightStatus?: 'pending' | 'accepted' | 'ignored';
  resultLines?: string[];
  changeKind?: 'conflict' | 'insert' | 'modify';
  activeSide?: 'yours' | 'theirs' | 'both';
}

export function areLinesEqual(a?: string[], b?: string[]): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export interface AutoResolveResult {
  canResolve: boolean;
  side?: 'yours' | 'theirs';
  lines?: string[];
  reason?: 'identical_modifications' | 'yours_unmodified' | 'theirs_unmodified' | 'one_sided_addition';
}

/**
 * Checks whether a single conflict hunk can be resolved automatically without human intervention.
 * Implements the IntelliJ IDEA MergeResolveUtil logic:
 * 1. Identical modifications: both sides made the exact same edit.
 * 2. One-sided modification: only one side changed relative to base, the other side is unchanged.
 */
export function checkAutoResolveHunk(hunk: ConflictHunk): AutoResolveResult {
  if (hunk.type !== 'conflict') {
    return { canResolve: false };
  }

  const yours = hunk.yoursLines || [];
  const theirs = hunk.theirsLines || [];
  const base = hunk.baseLines;

  // 1. Identical modifications on both sides (left == right)
  if (areLinesEqual(yours, theirs)) {
    return {
      canResolve: true,
      side: 'yours',
      lines: [...yours],
      reason: 'identical_modifications',
    };
  }

  // 2. Base is available: 3-way analysis
  if (base !== undefined) {
    const yoursModified = !areLinesEqual(yours, base);
    const theirsModified = !areLinesEqual(theirs, base);

    // Only Yours modified; Theirs matches Base -> Accept Yours
    if (yoursModified && !theirsModified) {
      return {
        canResolve: true,
        side: 'yours',
        lines: [...yours],
        reason: 'theirs_unmodified',
      };
    }

    // Only Theirs modified; Yours matches Base -> Accept Theirs
    if (theirsModified && !yoursModified) {
      return {
        canResolve: true,
        side: 'theirs',
        lines: [...theirs],
        reason: 'yours_unmodified',
      };
    }
  }

  // 3. One side is completely empty and base was empty (one-sided addition)
  if (base && base.length === 0) {
    if (yours.length > 0 && theirs.length === 0) {
      return {
        canResolve: true,
        side: 'yours',
        lines: [...yours],
        reason: 'one_sided_addition',
      };
    }
    if (theirs.length > 0 && yours.length === 0) {
      return {
        canResolve: true,
        side: 'theirs',
        lines: [...theirs],
        reason: 'one_sided_addition',
      };
    }
  }

  return { canResolve: false };
}

/**
 * Applies all non-conflicting changes to the provided array of hunks.
 * Modifies hunks in-place and returns the number of newly resolved blocks.
 */
export function applyAllNonConflicting(hunks: ConflictHunk[]): { resolvedCount: number; remainingCount: number } {
  let resolvedCount = 0;

  for (const h of hunks) {
    if (h.type === 'conflict' && !h.resolved) {
      const result = checkAutoResolveHunk(h);
      if (result.canResolve && result.lines && result.side) {
        h.resolved = true;
        h.chosen = result.side;
        h.resultLines = result.lines;
        if (result.reason === 'identical_modifications') {
          h.leftStatus = 'accepted';
          h.rightStatus = 'accepted';
        } else if (result.side === 'yours') {
          h.leftStatus = 'accepted';
          h.rightStatus = 'ignored';
        } else if (result.side === 'theirs') {
          h.leftStatus = 'ignored';
          h.rightStatus = 'accepted';
        }
        resolvedCount++;
      } else {
        if (!h.leftStatus) h.leftStatus = 'pending';
        if (!h.rightStatus) h.rightStatus = 'pending';
      }
    }
  }

  const remainingCount = hunks.filter(h => h.type === 'conflict' && !h.resolved).length;
  return { resolvedCount, remainingCount };
}

/**
 * Parses conflict hunks from file content on disk.
 * Supports standard 2-way conflict markers (<<<<<<<, =======, >>>>>>>)
 * and 3-way diff3 markers (<<<<<<<, |||||||, =======, >>>>>>>).
 */
export function parseConflictHunksFromText(
  fileOnDisk: string,
  yoursContent: string = '',
  theirsContent: string = '',
  baseContent: string = '',
): ConflictHunk[] {
  const hunks: ConflictHunk[] = [];
  let hunkId = 1;

  if (fileOnDisk.includes('<<<<<<<') && fileOnDisk.includes('=======')) {
    const lines = fileOnDisk.split(/\r?\n/);
    let currentCommon: string[] = [];
    let currentYours: string[] = [];
    let currentBase: string[] = [];
    let currentTheirs: string[] = [];
    let inOurs = false;
    let inBase = false;
    let inTheirs = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith('<<<<<<<')) {
        if (currentCommon.length > 0) {
          hunks.push({
            id: hunkId++,
            type: 'common',
            commonLines: currentCommon,
          });
          currentCommon = [];
        }
        inOurs = true;
        inBase = false;
        inTheirs = false;
        currentYours = [];
        currentBase = [];
        currentTheirs = [];
      } else if (inOurs && line.startsWith('|||||||')) {
        inOurs = false;
        inBase = true;
        currentBase = [];
      } else if ((inOurs || inBase) && line.startsWith('=======')) {
        inOurs = false;
        inBase = false;
        inTheirs = true;
        currentTheirs = [];
      } else if (inTheirs && line.startsWith('>>>>>>>')) {
        inTheirs = false;
        hunks.push({
          id: hunkId++,
          type: 'conflict',
          yoursLines: currentYours,
          baseLines: currentBase.length > 0 || fileOnDisk.includes('|||||||') ? currentBase : undefined,
          theirsLines: currentTheirs,
          resolved: false,
          chosen: null,
          leftStatus: 'pending',
          rightStatus: 'pending',
          resultLines: [],
        });
        currentYours = [];
        currentBase = [];
        currentTheirs = [];
      } else {
        if (inOurs) {
          currentYours.push(line);
        } else if (inBase) {
          currentBase.push(line);
        } else if (inTheirs) {
          currentTheirs.push(line);
        } else {
          currentCommon.push(line);
        }
      }
    }

    if (currentCommon.length > 0) {
      hunks.push({
        id: hunkId++,
        type: 'common',
        commonLines: currentCommon,
      });
    }
    return hunks;
  }

  // Fallback if no conflict markers
  const yLines = yoursContent ? yoursContent.split(/\r?\n/) : [];
  const tLines = theirsContent ? theirsContent.split(/\r?\n/) : [];
  const bLines = baseContent ? baseContent.split(/\r?\n/) : undefined;

  if (yoursContent === theirsContent && yoursContent.length > 0) {
    return [{
      id: 1,
      type: 'common',
      commonLines: yLines,
    }];
  }

  return [{
    id: 1,
    type: 'conflict',
    yoursLines: yLines,
    baseLines: bLines,
    theirsLines: tLines,
    resolved: false,
    chosen: null,
    leftStatus: 'pending',
    rightStatus: 'pending',
    resultLines: [],
    changeKind: 'conflict',
    activeSide: 'both',
  }];
}

interface DiffEdit {
  baseStart: number;
  baseEnd: number;
  targetStart: number;
  targetEnd: number;
}

function computeLineDiffEdits(base: string[], target: string[]): DiffEdit[] | null {
  let prefix = 0;
  while (prefix < base.length && prefix < target.length && base[prefix] === target[prefix]) {
    prefix++;
  }

  let baseEnd = base.length;
  let targetEnd = target.length;
  while (baseEnd > prefix && targetEnd > prefix && base[baseEnd - 1] === target[targetEnd - 1]) {
    baseEnd--;
    targetEnd--;
  }

  const m = baseEnd - prefix;
  const n = targetEnd - prefix;
  if (m === 0 && n === 0) {
    return [];
  }
  if (m === 0 || n === 0) {
    return [{ baseStart: prefix, baseEnd, targetStart: prefix, targetEnd }];
  }
  if (m * n > 2_000_000) {
    return null;
  }

  const cols = n + 1;
  const dp = new Uint32Array((m + 1) * cols);
  for (let i = m - 1; i >= 0; i--) {
    const bLine = base[prefix + i];
    const rowOff = i * cols;
    const nextRowOff = (i + 1) * cols;
    for (let j = n - 1; j >= 0; j--) {
      if (bLine === target[prefix + j]) {
        dp[rowOff + j] = dp[nextRowOff + j + 1] + 1;
      } else {
        const down = dp[nextRowOff + j];
        const right = dp[rowOff + j + 1];
        dp[rowOff + j] = down >= right ? down : right;
      }
    }
  }

  const matches: Array<[number, number]> = [];
  let i = 0;
  let j = 0;
  while (i < m && j < n) {
    if (base[prefix + i] === target[prefix + j]) {
      matches.push([prefix + i, prefix + j]);
      i++;
      j++;
    } else if (dp[(i + 1) * cols + j] >= dp[i * cols + j + 1]) {
      i++;
    } else {
      j++;
    }
  }
  matches.push([baseEnd, targetEnd]);

  const edits: DiffEdit[] = [];
  let curB = prefix;
  let curT = prefix;
  for (const [mb, mt] of matches) {
    if (mb > curB || mt > curT) {
      edits.push({
        baseStart: curB,
        baseEnd: mb,
        targetStart: curT,
        targetEnd: mt,
      });
    }
    curB = mb + 1;
    curT = mt + 1;
  }

  return edits;
}

function mapBaseRangeToTarget(
  bStart: number,
  bEnd: number,
  edits: DiffEdit[],
): [number, number] {
  let offsetBefore = 0;
  let deltaInside = 0;

  for (const e of edits) {
    if (e.baseEnd < bStart || (e.baseEnd === bStart && e.baseStart < bStart)) {
      offsetBefore += (e.targetEnd - e.targetStart) - (e.baseEnd - e.baseStart);
    } else if (e.baseStart <= bEnd && e.baseEnd >= bStart) {
      deltaInside += (e.targetEnd - e.targetStart) - (e.baseEnd - e.baseStart);
    }
  }

  const tStart = bStart + offsetBefore;
  const tEnd = bEnd + offsetBefore + deltaInside;
  return [tStart, tEnd];
}

/**
 * Computes IntelliJ-style 3-way merge hunks directly from Base, Yours, and Theirs contents.
 * Distinguishes between insertions (green), modifications (blue), and true conflicts (red).
 * Returns null if the files are too large for exact line diffing (caller falls back to conflict markers).
 */
export function computeThreeWayHunks(
  baseContent: string,
  yoursContent: string,
  theirsContent: string,
): ConflictHunk[] | null {
  const baseLines = baseContent === '' ? [] : baseContent.split(/\r?\n/);
  const yoursLines = yoursContent === '' ? [] : yoursContent.split(/\r?\n/);
  const theirsLines = theirsContent === '' ? [] : theirsContent.split(/\r?\n/);

  const yoursEdits = computeLineDiffEdits(baseLines, yoursLines);
  const theirsEdits = computeLineDiffEdits(baseLines, theirsLines);
  if (!yoursEdits || !theirsEdits) {
    return null;
  }

  const combined = [
    ...yoursEdits.map(e => ({ ...e })),
    ...theirsEdits.map(e => ({ ...e })),
  ].sort((a, b) => a.baseStart - b.baseStart || a.baseEnd - b.baseEnd);

  const mergedRanges: Array<{ baseStart: number; baseEnd: number }> = [];
  for (const edit of combined) {
    const last = mergedRanges[mergedRanges.length - 1];
    if (!last) {
      mergedRanges.push({ baseStart: edit.baseStart, baseEnd: edit.baseEnd });
      continue;
    }
    const overlaps =
      edit.baseStart < last.baseEnd ||
      (edit.baseStart === last.baseEnd && (edit.baseStart === edit.baseEnd || last.baseStart === last.baseEnd));
    if (overlaps) {
      if (edit.baseEnd > last.baseEnd) {
        last.baseEnd = edit.baseEnd;
      }
    } else {
      mergedRanges.push({ baseStart: edit.baseStart, baseEnd: edit.baseEnd });
    }
  }

  const hunks: ConflictHunk[] = [];
  let hunkId = 1;
  let cursor = 0;

  for (const range of mergedRanges) {
    if (range.baseStart > cursor) {
      hunks.push({
        id: hunkId++,
        type: 'common',
        commonLines: baseLines.slice(cursor, range.baseStart),
      });
    }

    const [yStart, yEnd] = mapBaseRangeToTarget(range.baseStart, range.baseEnd, yoursEdits);
    const [tStart, tEnd] = mapBaseRangeToTarget(range.baseStart, range.baseEnd, theirsEdits);

    const baseSlice = baseLines.slice(range.baseStart, range.baseEnd);
    const yoursSlice = yoursLines.slice(yStart, yEnd);
    const theirsSlice = theirsLines.slice(tStart, tEnd);

    const yoursChanged = !areLinesEqual(baseSlice, yoursSlice);
    const theirsChanged = !areLinesEqual(baseSlice, theirsSlice);

    if (!yoursChanged && !theirsChanged) {
      if (baseSlice.length > 0) {
        hunks.push({
          id: hunkId++,
          type: 'common',
          commonLines: baseSlice,
        });
      }
    } else if (yoursChanged && theirsChanged && areLinesEqual(yoursSlice, theirsSlice)) {
      if (yoursSlice.length > 0) {
        hunks.push({
          id: hunkId++,
          type: 'common',
          commonLines: yoursSlice,
        });
      }
    } else if (yoursChanged && !theirsChanged) {
      hunks.push({
        id: hunkId++,
        type: 'conflict',
        baseLines: baseSlice,
        yoursLines: yoursSlice,
        theirsLines: theirsSlice,
        resolved: false,
        chosen: null,
        leftStatus: 'pending',
        rightStatus: 'ignored',
        resultLines: [...baseSlice],
        changeKind: baseSlice.length === 0 ? 'insert' : 'modify',
        activeSide: 'yours',
      });
    } else if (!yoursChanged && theirsChanged) {
      hunks.push({
        id: hunkId++,
        type: 'conflict',
        baseLines: baseSlice,
        yoursLines: yoursSlice,
        theirsLines: theirsSlice,
        resolved: false,
        chosen: null,
        leftStatus: 'ignored',
        rightStatus: 'pending',
        resultLines: [...baseSlice],
        changeKind: baseSlice.length === 0 ? 'insert' : 'modify',
        activeSide: 'theirs',
      });
    } else {
      hunks.push({
        id: hunkId++,
        type: 'conflict',
        baseLines: baseSlice,
        yoursLines: yoursSlice,
        theirsLines: theirsSlice,
        resolved: false,
        chosen: null,
        leftStatus: 'pending',
        rightStatus: 'pending',
        resultLines: [...baseSlice],
        changeKind: 'conflict',
        activeSide: 'both',
      });
    }

    cursor = range.baseEnd;
  }

  if (cursor < baseLines.length) {
    hunks.push({
      id: hunkId++,
      type: 'common',
      commonLines: baseLines.slice(cursor),
    });
  }

  return hunks;
}
