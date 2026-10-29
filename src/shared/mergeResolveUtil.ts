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
  }];
}
