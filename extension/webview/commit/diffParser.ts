export function parseDiff(rawDiff: string, filePath?: string): any[] {
  if (!rawDiff || !rawDiff.trim()) return [];
  const lines = rawDiff.split('\n');
  const hunks: any[] = [];
  let currentHunk: any = null;
  let oldLine = 0;
  let newLine = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('@@')) {
      let hunkOldStart = 1;
      let hunkNewStart = 1;
      const match = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
      if (match) {
        oldLine = parseInt(match[1], 10);
        newLine = parseInt(match[2], 10);
        hunkOldStart = oldLine;
        hunkNewStart = newLine;
      }
      currentHunk = {
        header: line,
        oldStart: hunkOldStart,
        newStart: hunkNewStart,
        lines: [],
        rawLines: [line],
        staged: true,
        blocks: []
      };
      hunks.push(currentHunk);
    } else if (currentHunk) {
      currentHunk.rawLines.push(line);
      if (line.startsWith('+')) {
        currentHunk.lines.push({
          type: 'add',
          oldNum: '',
          newNum: newLine++,
          text: line.slice(1),
          raw: line,
          staged: true
        });
      } else if (line.startsWith('-')) {
        currentHunk.lines.push({
          type: 'del',
          oldNum: oldLine++,
          newNum: '',
          text: line.slice(1),
          raw: line,
          staged: true
        });
      } else {
        currentHunk.lines.push({
          type: 'ctx',
          oldNum: oldLine++,
          newNum: newLine++,
          text: line.startsWith(' ') ? line.slice(1) : line,
          raw: line,
          staged: true
        });
      }
    }
  }

  // Group contiguous changed lines into change blocks
  hunks.forEach(hunk => {
    let currentBlock: any = null;
    hunk.lines.forEach((l: any, idx: number) => {
      if (l.type === 'add' || l.type === 'del') {
        if (!currentBlock) {
          currentBlock = {
            id: hunk.blocks.length,
            startIndex: idx,
            endIndex: idx,
            lines: [l],
            staged: true
          };
          hunk.blocks.push(currentBlock);
        } else {
          currentBlock.endIndex = idx;
          currentBlock.lines.push(l);
        }
        l.block = currentBlock;
        l.isBlockStart = (currentBlock.startIndex === idx);
      } else {
        currentBlock = null;
        l.isBlockStart = false;
        l.block = null;
      }
    });
  });

  return hunks;
}

export function constructHunkPatch(filePath: string, hunk: any): string {
  let patch = `--- a/${filePath}\n+++ b/${filePath}\n`;
  patch += hunk.rawLines.join('\n') + '\n';
  return patch;
}

export function constructBlockPatch(filePath: string, hunk: any, block: any): string {
  if (!hunk.blocks || hunk.blocks.length <= 1) {
    return constructHunkPatch(filePath, hunk);
  }
  let patch = `--- a/${filePath}\n+++ b/${filePath}\n`;
  let oldLen = 0;
  let newLen = 0;
  const patchBody: string[] = [];

  hunk.lines.forEach((l: any) => {
    if (l.block === block) {
      patchBody.push(l.raw);
      if (l.type === 'del') oldLen++;
      if (l.type === 'add') newLen++;
    } else if (l.type === 'ctx') {
      patchBody.push(l.raw);
      oldLen++;
      newLen++;
    } else if (l.type === 'del') {
      patchBody.push(' ' + l.raw.slice(1));
      oldLen++;
      newLen++;
    }
  });

  const header = `@@ -${hunk.oldStart},${oldLen} +${hunk.newStart},${newLen} @@`;
  patch += header + '\n' + patchBody.join('\n') + '\n';
  return patch;
}
