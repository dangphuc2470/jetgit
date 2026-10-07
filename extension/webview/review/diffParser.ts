import { LINE_HEIGHT, state } from './state';
import { DiffBlock, ScrollSegment } from './types';

export function isBlockStaged(
  block: DiffBlock,
  stagedDiff: string | undefined,
  baseLines: string[],
  currentLines: string[]
): boolean {
  if (!stagedDiff || !stagedDiff.trim()) return false;
  if (block.type === 'add' || block.type === 'mod') {
    for (let i = 0; i < (block.addCount || 0); i++) {
      const line = currentLines[(block.rightStart - 1) + i];
      if (line !== undefined && stagedDiff.includes('+' + line)) {
        return true;
      }
    }
  }
  if (block.type === 'del' || block.type === 'mod') {
    for (let i = 0; i < (block.delCount || 0); i++) {
      const line = baseLines[(block.leftStart - 1) + i];
      if (line !== undefined && stagedDiff.includes('-' + line)) {
        return true;
      }
    }
  }
  return false;
}

export function buildStagedContent(
  baseContent: string,
  currentContent: string,
  blocks: DiffBlock[]
): string {
  const baseLines = (baseContent || '').split('\n');
  const currentLines = (currentContent || '').split('\n');
  const result: string[] = [];
  let curBaseLine = 1;

  const sorted = [...blocks].sort((a, b) => a.leftStart - b.leftStart);

  for (const b of sorted) {
    while (curBaseLine < b.leftStart && curBaseLine <= baseLines.length) {
      result.push(baseLines[curBaseLine - 1]);
      curBaseLine++;
    }

    if (b.staged) {
      if (b.addCount && b.addCount > 0) {
        for (let i = 0; i < b.addCount; i++) {
          const cIdx = (b.rightStart - 1) + i;
          if (cIdx >= 0 && cIdx < currentLines.length) {
            result.push(currentLines[cIdx]);
          }
        }
      }
      curBaseLine += (b.delCount || 0);
    } else {
      if (b.delCount && b.delCount > 0) {
        for (let i = 0; i < b.delCount; i++) {
          if (curBaseLine <= baseLines.length) {
            result.push(baseLines[curBaseLine - 1]);
            curBaseLine++;
          }
        }
      }
    }
  }

  while (curBaseLine <= baseLines.length) {
    result.push(baseLines[curBaseLine - 1]);
    curBaseLine++;
  }

  return result.join('\n');
}

export function parseDiffData(rawDiff: string): void {
  state.baseLines = state.baseContent ? state.baseContent.split('\n') : [];
  state.currentLines = state.currentContent ? state.currentContent.split('\n') : [];

  const L_total = state.baseLines.length;
  const R_total = state.currentLines.length;

  if (!rawDiff || !rawDiff.trim()) {
    if (L_total === 0 && R_total > 0) {
      state.blocks = [{
        id: 0,
        type: 'add',
        leftStart: 1,
        leftEnd: 1,
        isLeftEmpty: true,
        rightStart: 1,
        rightEnd: R_total,
        isRightEmpty: false,
        staged: false,
        patchContent: ''
      }];
      state.segments = [{
        leftY: 0,
        rightY: 0,
        hLeft: 0,
        hRight: R_total * LINE_HEIGHT,
        isDiff: true
      }];
    } else if (R_total === 0 && L_total > 0) {
      state.blocks = [{
        id: 0,
        type: 'del',
        leftStart: 1,
        leftEnd: L_total,
        isLeftEmpty: false,
        rightStart: 1,
        rightEnd: 1,
        isRightEmpty: true,
        staged: false,
        patchContent: ''
      }];
      state.segments = [{
        leftY: 0,
        rightY: 0,
        hLeft: L_total * LINE_HEIGHT,
        hRight: 0,
        isDiff: true
      }];
    } else {
      state.blocks = [];
      state.segments = [{
        leftY: 0,
        rightY: 0,
        hLeft: L_total * LINE_HEIGHT,
        hRight: R_total * LINE_HEIGHT,
        isDiff: false
      }];
    }
    return;
  }

  const lines = rawDiff.split('\n');
  const hunks: any[] = [];
  let currentHunk: any = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('@@')) {
      const match = line.match(/@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
      if (match) {
        currentHunk = {
          header: line,
          oldStart: parseInt(match[1], 10),
          oldCount: match[2] !== undefined ? parseInt(match[2], 10) : 1,
          newStart: parseInt(match[3], 10),
          newCount: match[4] !== undefined ? parseInt(match[4], 10) : 1,
          diffLines: [],
          rawLines: [line]
        };
        hunks.push(currentHunk);
      }
    } else if (currentHunk) {
      currentHunk.rawLines.push(line);
      if (line.startsWith('+') || line.startsWith('-') || line.startsWith(' ')) {
        currentHunk.diffLines.push(line);
      }
    }
  }

  const blocks: DiffBlock[] = [];
  hunks.forEach((hunk) => {
    let bLine = hunk.oldStart;
    let cLine = hunk.newStart;
    let dIdx = 0;

    while (dIdx < hunk.diffLines.length) {
      const d = hunk.diffLines[dIdx];
      if (d.startsWith(' ')) {
        bLine++;
        cLine++;
        dIdx++;
      } else {
        const startLeft = bLine;
        const startRight = cLine;
        let delCount = 0;
        let addCount = 0;

        while (dIdx < hunk.diffLines.length && (hunk.diffLines[dIdx].startsWith('-') || hunk.diffLines[dIdx].startsWith('+'))) {
          const cur = hunk.diffLines[dIdx];
          if (cur.startsWith('-')) {
            delCount++;
            bLine++;
          } else if (cur.startsWith('+')) {
            addCount++;
            cLine++;
          }
          dIdx++;
        }

        let blockType: 'add' | 'del' | 'mod' = 'mod';
        if (delCount > 0 && addCount === 0) blockType = 'del';
        else if (addCount > 0 && delCount === 0) blockType = 'add';
        else blockType = 'mod';

        let patch = `--- a/${state.filePath}\n+++ b/${state.filePath}\n${hunk.header}\n`;
        hunk.rawLines.slice(1).forEach((l: string) => { patch += l + '\n'; });

        const bObj: DiffBlock = {
          id: blocks.length,
          type: blockType,
          leftStart: startLeft,
          leftEnd: delCount > 0 ? (startLeft + delCount - 1) : startLeft,
          isLeftEmpty: delCount === 0,
          rightStart: startRight,
          rightEnd: addCount > 0 ? (startRight + addCount - 1) : startRight,
          isRightEmpty: addCount === 0,
          delCount,
          addCount,
          staged: false,
          patchContent: patch
        };
        bObj.staged = isBlockStaged(bObj, state.stagedDiff, state.baseLines, state.currentLines);
        blocks.push(bObj);
      }
    }
  });

  state.blocks = blocks;
  state.segments = buildSegments(hunks, L_total, R_total);
}

export function buildSegments(hunks: any[], L_total: number, R_total: number): ScrollSegment[] {
  const segments: ScrollSegment[] = [];
  let curL = 1;
  let curR = 1;

  hunks.forEach((hunk) => {
    // 1. Common unchanged code before hunk
    const commonCount = Math.min(
      Math.max(0, hunk.oldStart - curL),
      Math.max(0, hunk.newStart - curR)
    );
    if (commonCount > 0) {
      segments.push({
        leftY: (curL - 1) * LINE_HEIGHT,
        rightY: (curR - 1) * LINE_HEIGHT,
        hLeft: commonCount * LINE_HEIGHT,
        hRight: commonCount * LINE_HEIGHT,
        isDiff: false
      });
      curL += commonCount;
      curR += commonCount;
    }

    if (curL < hunk.oldStart) {
      const diffL = hunk.oldStart - curL;
      segments.push({
        leftY: (curL - 1) * LINE_HEIGHT,
        rightY: (curR - 1) * LINE_HEIGHT,
        hLeft: diffL * LINE_HEIGHT,
        hRight: 0,
        isDiff: true
      });
      curL += diffL;
    }
    if (curR < hunk.newStart) {
      const diffR = hunk.newStart - curR;
      segments.push({
        leftY: (curL - 1) * LINE_HEIGHT,
        rightY: (curR - 1) * LINE_HEIGHT,
        hLeft: 0,
        hRight: diffR * LINE_HEIGHT,
        isDiff: true
      });
      curR += diffR;
    }

    // 2. Inside hunk: walk diff lines
    let dIdx = 0;
    while (dIdx < hunk.diffLines.length) {
      const d = hunk.diffLines[dIdx];
      if (d.startsWith(' ')) {
        let ctxCount = 0;
        while (dIdx < hunk.diffLines.length && hunk.diffLines[dIdx].startsWith(' ')) {
          ctxCount++;
          dIdx++;
        }
        segments.push({
          leftY: (curL - 1) * LINE_HEIGHT,
          rightY: (curR - 1) * LINE_HEIGHT,
          hLeft: ctxCount * LINE_HEIGHT,
          hRight: ctxCount * LINE_HEIGHT,
          isDiff: false
        });
        curL += ctxCount;
        curR += ctxCount;
      } else {
        let delCount = 0;
        let addCount = 0;
        while (dIdx < hunk.diffLines.length && (hunk.diffLines[dIdx].startsWith('-') || hunk.diffLines[dIdx].startsWith('+'))) {
          if (hunk.diffLines[dIdx].startsWith('-')) delCount++;
          else if (hunk.diffLines[dIdx].startsWith('+')) addCount++;
          dIdx++;
        }
        segments.push({
          leftY: (curL - 1) * LINE_HEIGHT,
          rightY: (curR - 1) * LINE_HEIGHT,
          hLeft: delCount * LINE_HEIGHT,
          hRight: addCount * LINE_HEIGHT,
          isDiff: true
        });
        curL += delCount;
        curR += addCount;
      }
    }
  });

  // 3. Trailing common lines after last hunk
  const remL = Math.max(0, L_total - curL + 1);
  const remR = Math.max(0, R_total - curR + 1);
  const trailingCommon = Math.max(remL, remR);
  if (trailingCommon > 0) {
    segments.push({
      leftY: (curL - 1) * LINE_HEIGHT,
      rightY: (curR - 1) * LINE_HEIGHT,
      hLeft: remL * LINE_HEIGHT,
      hRight: remR * LINE_HEIGHT,
      isDiff: false
    });
  }

  return segments;
}

export function mapLeftToRight(sLeft: number): number {
  if (sLeft <= 0 || state.segments.length === 0) return 0;
  for (let i = 0; i < state.segments.length; i++) {
    const seg = state.segments[i];
    if (sLeft >= seg.leftY && sLeft <= seg.leftY + seg.hLeft) {
      if (!seg.isDiff) {
        return seg.rightY + (sLeft - seg.leftY);
      } else {
        if (seg.hLeft === 0 || seg.hRight === 0) {
          return seg.rightY;
        }
        const ratio = (sLeft - seg.leftY) / seg.hLeft;
        return seg.rightY + ratio * seg.hRight;
      }
    }
  }
  const last = state.segments[state.segments.length - 1];
  return last ? (last.rightY + last.hRight) : sLeft;
}

export function mapRightToLeft(sRight: number): number {
  if (sRight <= 0 || state.segments.length === 0) return 0;
  for (let i = 0; i < state.segments.length; i++) {
    const seg = state.segments[i];
    if (sRight >= seg.rightY && sRight <= seg.rightY + seg.hRight) {
      if (!seg.isDiff) {
        return seg.leftY + (sRight - seg.rightY);
      } else {
        if (seg.hRight === 0 || seg.hLeft === 0) {
          return seg.leftY;
        }
        const ratio = (sRight - seg.rightY) / seg.hRight;
        return seg.leftY + ratio * seg.hLeft;
      }
    }
  }
  const last = state.segments[state.segments.length - 1];
  return last ? (last.leftY + last.hLeft) : sRight;
}
