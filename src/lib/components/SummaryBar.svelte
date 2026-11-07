<script lang="ts">
  import { screener } from '$lib/state/screener.svelte';
  import { formatPercent, getChangeColorClass } from '$lib/utils/formatters';

  const sectorColors = [
    'bg-blue-500',
    'bg-indigo-500',
    'bg-purple-500',
    'bg-teal-500',
    'bg-amber-500',
    'bg-rose-500',
    'bg-gray-600'
  ];
</script>

<div class="bg-[#131722] border-b border-[#2a2e39] px-4 py-2 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
  <!-- Key Metrics -->
  <div class="flex items-center gap-4 flex-wrap">
    <div class="flex items-center gap-1.5">
      <span class="text-gray-400">신고가 종목:</span>
      <span class="font-bold text-white font-mono text-sm">{screener.summaryStats.count.toLocaleString()}</span>
      <span class="text-gray-500 text-[11px]">개</span>
    </div>

    <div class="h-3.5 w-px bg-[#2a2e39] hidden sm:block"></div>

    <div class="flex items-center gap-1.5">
      <span class="text-gray-400">평균 등락률:</span>
      <span class="font-bold font-mono {getChangeColorClass(screener.summaryStats.avgChange, screener.colorScheme)}">
        {formatPercent(screener.summaryStats.avgChange)}
      </span>
    </div>

    <div class="h-3.5 w-px bg-[#2a2e39] hidden sm:block"></div>

    <div class="flex items-center gap-1.5">
      <span class="text-gray-400">평균 3개월 상승률:</span>
      <span class="font-bold font-mono {getChangeColorClass(screener.summaryStats.avgReturn3m, screener.colorScheme)}">
        {formatPercent(screener.summaryStats.avgReturn3m)}
      </span>
    </div>

    {#if screener.summaryStats.topBreakout}
      <div class="h-3.5 w-px bg-[#2a2e39] hidden md:block"></div>
      <div class="hidden md:flex items-center gap-1.5">
        <span class="text-gray-400">최대 돌파:</span>
        <span class="font-semibold text-amber-300">
          {screener.summaryStats.topBreakout.name} ({screener.summaryStats.topBreakout.code})
        </span>
        <span class="font-mono text-emerald-400 font-bold">
          +{screener.summaryStats.topBreakout.breakoutPct}%
        </span>
      </div>
    {/if}
  </div>

  <!-- Sector Distribution Mini Bar (Finviz Style) -->
  {#if screener.topSectors.length > 0}
    <div class="flex flex-col gap-1 w-full md:w-80">
      <div class="flex items-center justify-between text-[11px] text-gray-400">
        <span>섹터 분포 (상위 5)</span>
        <span class="truncate max-w-[150px] text-right font-medium text-gray-300">
          {screener.topSectors[0]?.sector} ({screener.topSectors[0]?.pct}%)
        </span>
      </div>
      <!-- Stacked bar -->
      <div class="w-full h-2 rounded-full bg-[#1e222d] overflow-hidden flex">
        {#each screener.topSectors as s, idx}
          <div
            class="{sectorColors[idx % sectorColors.length]} h-full transition-all"
            style="width: {s.pct}%"
            title="{s.sector}: {s.count}개 ({s.pct}%)"
          ></div>
        {/each}
      </div>
    </div>
  {/if}
</div>
