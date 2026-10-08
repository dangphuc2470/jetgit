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
 * Build a visual DAG layout from a list of commits (topological order, newest first).
 * Follows IntelliJ/Android Studio layout:
 * - Topological order ensures branches are clustered and parents follow children.
 * - Primary/first-parent backbone continuity in the same column.
 * - Non-first parents branch out to the right.
 * - Automatic compaction of dead lanes to prevent empty vertical gaps.
 */
export function buildGraph(commits: Commit[]): GraphNode[] {
  if (commits.length === 0) return [];

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
      col = lanes.length;
      lanes.push(commit.hash);
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
        // First parent already tracked in another lane -> merge into p0's lane
        lines.push({
          fromColumn: col,
          fromRow: row,
          toColumn: p0Col,
          toRow: row + 1,
          color,
        });
        lanes[col] = null;
      } else {
        // First parent inherits this lane and color (maintains backbone)
        lanes[col] = p0;
        if (!colorMap.has(p0)) colorMap.set(p0, color);
      }

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
          // Branch out to a new lane to the right
          const newCol = lanes.length;
          lanes.push(p);
          if (!colorMap.has(p)) colorMap.set(p, nextColor++);
          lines.push({
            fromColumn: col,
            fromRow: row,
            toColumn: newCol,
            toRow: row + 1,
            color: colorMap.get(p)!,
          });
        }
      }
    }

    // 3. Compact lanes for the next row (eliminates empty vertical lanes)
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
