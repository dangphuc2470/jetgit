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
  // Active columns: each slot holds the hash of the next expected commit, or null if empty
  const columns: (string | null)[] = [];
  // Map hash -> color index for consistent branch coloring
  const colorMap = new Map<string, number>();
  let nextColor = 0;

  const hashToRow = new Map<string, number>();
  commits.forEach((c, i) => hashToRow.set(c.hash, i));

  for (let row = 0; row < commits.length; row++) {
    const commit = commits[row];
    const lines: GraphLine[] = [];

    // Find which column this commit occupies
    let col = columns.indexOf(commit.hash);
    if (col === -1) {
      // New branch — find first empty slot or append
      col = columns.indexOf(null);
      if (col === -1) {
        col = columns.length;
        columns.push(null);
      }
    }

    // Assign color
    if (!colorMap.has(commit.hash)) {
      colorMap.set(commit.hash, nextColor++);
    }
    const color = colorMap.get(commit.hash)!;

    // Clear this column slot
    columns[col] = null;

    // Process parents
    const parents = commit.parents.filter(p => hashToRow.has(p));
    const usedColsThisRow = new Set<number>();

    for (let pi = 0; pi < parents.length; pi++) {
      const parentHash = parents[pi];
      let parentCol = columns.indexOf(parentHash);

      if (parentCol !== -1) {
        // Parent already has a reserved column — draw line to it on next row
        const lineColor = colorMap.get(parentHash) ?? color;
        lines.push({
          fromColumn: col,
          fromRow: row,
          toColumn: parentCol,
          toRow: row + 1,
          color: lineColor,
        });
        usedColsThisRow.add(parentCol);
      } else {
        // First parent continues in the same column if free, others fork
        let targetCol: number;
        if (pi === 0 && col !== -1 && !columns[col]) {
          targetCol = col;
        } else {
          targetCol = columns.indexOf(null);
          if (targetCol === -1) {
            targetCol = columns.length;
            columns.push(null);
          }
        }
        columns[targetCol] = parentHash;

        // Assign color to parent if new branch
        if (!colorMap.has(parentHash)) {
          colorMap.set(parentHash, pi === 0 ? color : nextColor++);
        }

        const lineColor = colorMap.get(parentHash)!;
        lines.push({
          fromColumn: col,
          fromRow: row,
          toColumn: targetCol,
          toRow: row + 1,
          color: lineColor,
        });
        usedColsThisRow.add(targetCol);
      }
    }

    // Continuation lines: columns that pass through this row unchanged
    for (let c = 0; c < columns.length; c++) {
      if (columns[c] !== null && !usedColsThisRow.has(c)) {
        const targetHash = columns[c]!;
        const targetRow = hashToRow.get(targetHash);
        if (targetRow !== undefined && targetRow > row) {
          const lineColor = colorMap.get(targetHash) ?? 0;
          lines.push({
            fromColumn: c,
            fromRow: row,
            toColumn: c,
            toRow: row + 1,
            color: lineColor,
          });
        }
      }
    }

    nodes.push({ hash: commit.hash, column: col, color, lines });
  }

  // Trim unused columns from the right
  const maxCol = Math.max(0, ...nodes.map(n => n.column));
  // No need to trim, the renderer handles dynamic width

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
