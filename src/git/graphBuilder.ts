import type { Commit } from './gitService';

export interface GraphNode {
  hash: string;
  column: number;
  color: number; // index into color palette
  lines: GraphLine[];
}

export interface GraphLine {
  fromColumn: number;
  fromRow: number;
  toColumn: number;
  toRow: number;
  color: number;
}

/**
 * LinearBek topological sort:
 * Groups simple merge fragments (feature branch commits) contiguously
 * immediately following their merge commit, matching JetBrains IntelliJ LinearBek behavior.
 * This straightens out branches and prevents commits from other branches from interleaving.
 */
export function linearizeCommitsBek(commits: Commit[]): Commit[] {
  if (commits.length <= 2) return commits;

  const commitMap = new Map<string, Commit>();
  const childrenMap = new Map<string, string[]>();

  for (const c of commits) {
    commitMap.set(c.hash, c);
    for (const p of c.parents) {
      const list = childrenMap.get(p) ?? [];
      list.push(c.hash);
      childrenMap.set(p, list);
    }
  }

  const reordered: Commit[] = [];
  const placed = new Set<string>();

  for (let i = 0; i < commits.length; i++) {
    const c = commits[i];
    if (placed.has(c.hash)) continue;

    reordered.push(c);
    placed.add(c.hash);

    // If this is a merge commit (2 parents), linearize the feature branch fragment (p1)
    if (c.parents.length >= 2) {
      const p0 = c.parents[0];
      const p1 = c.parents[1];

      // Collect ancestors of p0 (bounded search up to 200 nodes)
      const p0Ancestors = new Set<string>();
      const q0 = [p0];
      let depth0 = 0;
      while (q0.length > 0 && depth0 < 200) {
        const cur = q0.shift()!;
        if (p0Ancestors.has(cur)) continue;
        p0Ancestors.add(cur);
        depth0++;
        const node = commitMap.get(cur);
        if (node) {
          for (const p of node.parents) {
            if (!p0Ancestors.has(p)) q0.push(p);
          }
        }
      }

      // Collect commits in p1's branch that are NOT in p0Ancestors and not yet placed
      const fragment: Commit[] = [];
      const q1 = [p1];
      const visited1 = new Set<string>();
      let isSimpleFragment = true;

      while (q1.length > 0) {
        const cur = q1.shift()!;
        if (visited1.has(cur) || p0Ancestors.has(cur)) continue;
        visited1.add(cur);

        const node = commitMap.get(cur);
        if (!node) continue;

        // Check if this commit has external children (other than merge commit or fragment)
        const children = childrenMap.get(cur) ?? [];
        const hasExternalChildren = children.some(ch => ch !== c.hash && !visited1.has(ch));
        if (hasExternalChildren) {
          isSimpleFragment = false;
          break;
        }

        fragment.push(node);
        if (fragment.length > 100) {
          isSimpleFragment = false;
          break;
        }

        for (const p of node.parents) {
          if (!p0Ancestors.has(p) && !visited1.has(p)) {
            q1.push(p);
          }
        }
      }

      // If it is a clean feature branch, sort by date (descending) and place contiguously
      if (isSimpleFragment && fragment.length > 0) {
        fragment.sort((a, b) => {
          const tA = new Date(a.authorDate).getTime() || 0;
          const tB = new Date(b.authorDate).getTime() || 0;
          return tB - tA;
        });

        for (const fragCommit of fragment) {
          if (!placed.has(fragCommit.hash)) {
            reordered.push(fragCommit);
            placed.add(fragCommit.hash);
          }
        }
      }
    }
  }

  // Append any remaining unplaced commits
  for (const c of commits) {
    if (!placed.has(c.hash)) {
      reordered.push(c);
      placed.add(c.hash);
    }
  }

  return reordered;
}

/**
 * Build a visual DAG layout from a list of commits (LinearBek topological order, newest first).
 * Follows IntelliJ IDEA / Android Studio VCS Log architecture:
 * - LinearBek fragment clustering straightens feature branches and prevents interleaving.
 * - Primary/first-parent backbone continuity: Column 0 and lower columns always take priority.
 * - Non-first parents branch out to the lowest available right slot to keep the graph compact.
 * - Automatic compaction of dead lanes to eliminate empty vertical gaps.
 */
export function buildGraph(rawCommits: Commit[]): GraphNode[] {
  if (rawCommits.length === 0) return [];

  // 1. LinearBek pre-linearization of merge fragments
  const commits = linearizeCommitsBek(rawCommits);

  const nodes: GraphNode[] = [];
  let lanes: (string | null)[] = [];
  const colorMap = new Map<string, number>();
  let nextColor = 0;

  for (let row = 0; row < commits.length; row++) {
    const commit = commits[row];
    const lines: GraphLine[] = [];

    // 1. Find or assign lane for this commit
    let col = lanes.indexOf(commit.hash);
    if (col === -1) {
      const emptyIdx = lanes.indexOf(null);
      if (emptyIdx !== -1) {
        col = emptyIdx;
        lanes[col] = commit.hash;
      } else {
        col = lanes.length;
        lanes.push(commit.hash);
      }
    }

    if (!colorMap.has(commit.hash)) {
      colorMap.set(commit.hash, nextColor++);
    }
    const color = colorMap.get(commit.hash)!;
    const prevLanes = [...lanes];

    // 2. Process parents
    const parents = commit.parents;
    if (parents.length === 0) {
      // Root commit terminates this branch
      lanes[col] = null;
    } else {
      const p0 = parents[0];
      const p0Col = lanes.indexOf(p0);

      if (p0Col !== -1 && p0Col !== col) {
        // Priority rule (IntelliJ backbone preservation):
        // The lower column index has higher priority and ALWAYS survives.
        const survivingCol = Math.min(col, p0Col);
        const mergingCol = Math.max(col, p0Col);

        lanes[survivingCol] = p0;
        lanes[mergingCol] = null;

        if (!colorMap.has(p0)) {
          colorMap.set(p0, colorMap.get(lanes[survivingCol] ?? '') ?? color);
        }

        lines.push({
          fromColumn: col,
          fromRow: row,
          toColumn: survivingCol,
          toRow: row + 1,
          color,
        });

        // Merge line from the other lane if active
        if (mergingCol !== col) {
          lines.push({
            fromColumn: mergingCol,
            fromRow: row,
            toColumn: survivingCol,
            toRow: row + 1,
            color: colorMap.get(prevLanes[mergingCol] ?? '') ?? color,
          });
        }
      } else {
        // First parent inherits this lane and color (maintains continuous backbone)
        lanes[col] = p0;
        if (!colorMap.has(p0)) colorMap.set(p0, color);
      }

      // Process secondary parents (feature branches / merge heads)
      for (let pi = 1; pi < parents.length; pi++) {
        const p = parents[pi];
        const pCol = lanes.indexOf(p);
        if (pCol !== -1) {
          // Parent already tracked in another lane
          lines.push({
            fromColumn: col,
            fromRow: row,
            toColumn: pCol,
            toRow: row + 1,
            color: colorMap.get(p) ?? color,
          });
        } else {
          // LinearBek compact slot allocation:
          // Find the lowest available null slot to the right of col to keep lanes compact
          let targetSlot = -1;
          for (let s = col + 1; s < lanes.length; s++) {
            if (lanes[s] === null) {
              targetSlot = s;
              break;
            }
          }
          if (targetSlot === -1) {
            targetSlot = lanes.length;
            lanes.push(p);
          } else {
            lanes[targetSlot] = p;
          }

          if (!colorMap.has(p)) colorMap.set(p, nextColor++);
          lines.push({
            fromColumn: col,
            fromRow: row,
            toColumn: targetSlot,
            toRow: row + 1,
            color: colorMap.get(p)!,
          });
        }
      }
    }

    // 3. Compact dead lanes for the next row (eliminates empty vertical gaps)
    const nextLanes: string[] = [];
    const oldToNew = new Map<number, number>();
    for (let c = 0; c < lanes.length; c++) {
      if (lanes[c] !== null) {
        const newIdx = nextLanes.length;
        nextLanes.push(lanes[c]!);
        oldToNew.set(c, newIdx);
      }
    }

    // Remap target columns of existing lines based on compaction
    for (const l of lines) {
      if (oldToNew.has(l.toColumn)) {
        l.toColumn = oldToNew.get(l.toColumn)!;
      }
    }

    // 4. Continuation lines for all active lanes from prevLanes
    for (let c = 0; c < prevLanes.length; c++) {
      const h = prevLanes[c];
      if (h !== null && oldToNew.has(c)) {
        const currentHashAtC = lanes[c];
        const targetCol = oldToNew.get(c)!;
        const lineColor = (currentHashAtC ? colorMap.get(currentHashAtC) : undefined) ?? colorMap.get(h) ?? color;
        lines.push({
          fromColumn: c,
          fromRow: row,
          toColumn: targetCol,
          toRow: row + 1,
          color: lineColor,
        });
      }
    }

    // Deduplicate lines (same fromCol -> toCol)
    const uniqueLines: GraphLine[] = [];
    const seen = new Set<string>();
    for (const l of lines) {
      const key = `${l.fromColumn}->${l.toColumn}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueLines.push(l);
      }
    }

    lanes = nextLanes;
    nodes.push({ hash: commit.hash, column: col, color, lines: uniqueLines });
  }

  return nodes;
}

/**
 * Get the total number of columns needed for the graph.
 */
export function graphWidth(nodes: GraphNode[]): number {
  if (nodes.length === 0) return 1;
  let max = 0;
  for (const node of nodes) {
    if (node.column > max) max = node.column;
    for (const line of node.lines) {
      if (line.fromColumn > max) max = line.fromColumn;
      if (line.toColumn > max) max = line.toColumn;
    }
  }
  return max + 1;
}
