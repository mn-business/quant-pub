<script lang="ts">
  import { screener } from '$lib/state/screener.svelte';
  import { formatPercent, formatNumber, getChangeColorClass } from '$lib/utils/formatters';
</script>

{#if screener.activeMacros.length > 0}
  <div class="bg-[#181c27] border-b border-[#2a2e39] px-4 py-1.5 flex items-center gap-3 overflow-x-auto text-xs">
    <div class="flex items-center gap-1.5 font-bold text-amber-400 shrink-0 text-[11px]">
      <span>🌍</span>
      <span>신고가 매크로 지표:</span>
    </div>
    <div class="flex items-center gap-2 overflow-x-auto py-0.5">
      {#each screener.activeMacros as m}
        <div class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#131722] border border-[#2a2e39] shrink-0 text-[11px]">
          <span class="text-gray-400 font-mono">[{m.category}]</span>
          <span class="font-medium text-gray-200">{m.name}</span>
          <span class="font-mono text-gray-300 font-bold">{formatNumber(m.close, 2)}</span>
          <span class="font-mono {getChangeColorClass(m.changePct, screener.colorScheme)}">
            {formatPercent(m.changePct)}
          </span>
          {#if m.daysSincePrevHigh !== null}
            <span class="text-[10px] text-gray-400">
              ({m.daysSincePrevHigh === 1 ? '연속 신고가' : `${m.daysSincePrevHigh}일만 돌파`})
            </span>
          {/if}
        </div>
      {/each}
    </div>
  </div>
{/if}
