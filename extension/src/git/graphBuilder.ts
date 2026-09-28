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
 * Assigns columns and colors to branches, producing connection lines.
 */
export function buildGraph(commits: Commit[]): GraphNode[] {
  if (commits.length === 0) return [];

  const nodes: GraphNode[] = [];
  const lanes: (string | null)[] = [];
  const colorMap = new Map<string, number>();
  let nextColor = 0;

  for (let row = 0; row < commits.length; row++) {
    const commit = commits[row];
    const lines: GraphLine[] = [];

    // 1. Find or create lane for this commit
    let col = lanes.indexOf(commit.hash);
    if (col === -1) {
      col = lanes.indexOf(null);
      if (col === -1) {
        col = lanes.length;
        lanes.push(null);
      }
      lanes[col] = commit.hash;
    }

    if (!colorMap.has(commit.hash)) {
      colorMap.set(commit.hash, nextColor++);
    }
    const color = colorMap.get(commit.hash)!;
    const prevLanes = [...lanes];

    // 2. Process parents
    const parents = commit.parents;
    if (parents.length === 0) {
      lanes[col] = null;
    } else {
      const p0 = parents[0];
      const p0Col = lanes.indexOf(p0);
      if (p0Col !== -1 && p0Col !== col) {
        lines.push({
          fromColumn: col,
          fromRow: row,
          toColumn: p0Col,
          toRow: row + 1,
          color,
        });
        lanes[col] = null;
      } else {
        lanes[col] = p0;
        if (!colorMap.has(p0)) colorMap.set(p0, color);
        lines.push({
          fromColumn: col,
          fromRow: row,
          toColumn: col,
          toRow: row + 1,
          color: colorMap.get(p0)!,
        });
      }

      for (let pi = 1; pi < parents.length; pi++) {
        const p = parents[pi];
        let pCol = lanes.indexOf(p);
        if (pCol !== -1) {
          lines.push({
            fromColumn: col,
            fromRow: row,
            toColumn: pCol,
            toRow: row + 1,
            color,
          });
        } else {
          pCol = lanes.indexOf(null);
          if (pCol === -1) {
            pCol = lanes.length;
            lanes.push(null);
          }
          lanes[pCol] = p;
          if (!colorMap.has(p)) colorMap.set(p, nextColor++);
          lines.push({
            fromColumn: col,
            fromRow: row,
            toColumn: pCol,
            toRow: row + 1,
            color,
          });
        }
      }
    }

    // 3. Continuation lines for all other active lanes
    for (let c = 0; c < prevLanes.length; c++) {
      if (c !== col && prevLanes[c] !== null && lanes[c] !== null) {
        lines.push({
          fromColumn: c,
          fromRow: row,
          toColumn: c,
          toRow: row + 1,
          color: colorMap.get(lanes[c]!) ?? 0,
        });
      }
    }

    nodes.push({ hash: commit.hash, column: col, color, lines });
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
