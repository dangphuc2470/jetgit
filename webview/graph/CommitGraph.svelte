<script lang="ts">
  import { branchColor } from '$shared/theme';

  interface Props {
    nodes: any[];
    startIndex: number;
    visibleCount: number;
    rowHeight: number;
    graphWidth: number;
    showLongEdges?: boolean;
  }

  let {
    nodes = [],
    startIndex = 0,
    visibleCount = 0,
    rowHeight = 28,
    graphWidth = 1,
    showLongEdges = false
  }: Props = $props();

  const COL_WIDTH = 16;
  const DOT_RADIUS = 3.8;
  const PADDING = 10;

  function computeAngularPath(x1: number, y1: number, x2: number, y2: number): string {
    if (x1 === undefined || y1 === undefined || x2 === undefined || y2 === undefined) return '';
    const dx = x2 - x1;
    if (Math.abs(dx) < 0.5) {
      return `M ${x1} ${y1} L ${x2} ${y2}`;
    }
    const midY = (y1 + y2) / 2;
    return `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
  }

  let svgWidth = $derived(Math.max(4, graphWidth || 1) * COL_WIDTH + PADDING * 2);
  let svgHeight = $derived(visibleCount * rowHeight);

  function cx(col: number): number {
    return PADDING + col * COL_WIDTH + COL_WIDTH / 2;
  }

  function cy(row: number): number {
    return (row - startIndex) * rowHeight + rowHeight / 2;
  }

  let visibleLines = $derived.by(() => {
    const result: Array<{ line: any; color: string }> = [];
    const endIndex = startIndex + visibleCount + 1;
    for (let i = Math.max(0, startIndex - 1); i < Math.min(nodes.length, endIndex + 1); i++) {
      const node = nodes[i];
      if (!node || !node.lines) continue;
      for (const line of node.lines) {
        result.push({ line, color: branchColor(line.color) });
      }
    }
    return result;
  });

  let visibleDots = $derived.by(() => {
    const endIndex = startIndex + visibleCount;
    const result: Array<{ x: number; y: number; color: string; hash: string; isHead: boolean }> = [];
    for (let i = startIndex; i < Math.min(nodes.length, endIndex); i++) {
      const node = nodes[i];
      if (!node) continue;
      result.push({
        x: cx(node.column),
        y: cy(i),
        color: branchColor(node.color),
        hash: node.hash,
        isHead: (i === 0)
      });
    }
    return result;
  });
</script>

<svg class="graph-svg" width={svgWidth} height={svgHeight}>
  {#each visibleLines as item}
    {@const isLong = Math.abs(item.line.toRow - item.line.fromRow) > 6}
    {#if item.line.fromColumn === item.line.toColumn}
      <line
        x1={cx(item.line.fromColumn)}
        y1={cy(item.line.fromRow)}
        x2={cx(item.line.toColumn)}
        y2={cy(item.line.toRow)}
        stroke={item.color}
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-dasharray={!showLongEdges && isLong ? "4 3" : undefined}
        opacity={!showLongEdges && isLong ? 0.45 : 1}
      />
    {:else}
      <path
        d={computeAngularPath(cx(item.line.fromColumn), cy(item.line.fromRow), cx(item.line.toColumn), cy(item.line.toRow))}
        stroke={item.color}
        fill="none"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-dasharray={!showLongEdges && isLong ? "4 3" : undefined}
        opacity={!showLongEdges && isLong ? 0.45 : 1}
      />
    {/if}
  {/each}

  {#each visibleDots as dot}
    {#if dot.isHead}
      <circle
        cx={dot.x}
        cy={dot.y}
        r="6.5"
        fill="none"
        stroke={dot.color}
        stroke-width="1.5"
      />
    {/if}
    <circle
      cx={dot.x}
      cy={dot.y}
      r={DOT_RADIUS}
      fill={dot.color}
      stroke="var(--vscode-editor-background)"
      stroke-width="1.5"
    />
  {/each}
</svg>

<style>
  .graph-svg {
    flex-shrink: 0;
  }
</style>
