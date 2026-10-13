<script lang="ts">
  import type { DiffBlock } from "./types";

  interface Props {
    blocks: DiffBlock[];
    totalLines: number;
    onJumpToBlock: (index: number) => void;
  }

  let { blocks, totalLines, onJumpToBlock }: Props = $props();

  let safeTotal = $derived(Math.max(totalLines, 1));
</script>

<div class="studio-overview-ruler">
  {#each blocks as b, idx (b.id)}
    {@const lineStart = b.isRightEmpty ? b.leftStart : b.rightStart}
    {@const lineCount = b.isRightEmpty ? (b.leftEnd - b.leftStart + 1) : (b.rightEnd - b.rightStart + 1)}
    {@const topPct = (lineStart / safeTotal) * 100}
    {@const heightPct = Math.max((lineCount / safeTotal) * 100, 1.2)}
    <div
      class={`ruler-stripe stripe-${b.type}`}
      style={`top: ${topPct}%; height: ${heightPct}%;`}
      title={`${b.type.toUpperCase()}: Line ${lineStart}`}
      role="button"
      tabindex="0"
      onclick={() => onJumpToBlock(idx)}
      onkeydown={(e) => { if (e.key === 'Enter') onJumpToBlock(idx); }}
    ></div>
  {/each}
</div>
