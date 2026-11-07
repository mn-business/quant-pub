<script lang="ts">
  import { screener } from '$lib/state/screener.svelte';
  import { getMarketFlag, getMarketLabel, getChartLinks } from '$lib/utils/links';
  import { formatNumber, formatPercent, getChangeColorClass } from '$lib/utils/formatters';

  let stock = $derived(screener.selectedStock);
  let links = $derived(stock ? getChartLinks(stock.market, stock.code) : null);
  let history = $derived(screener.selectedStockHistory);

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && screener.isDrawerOpen) {
      screener.closeStockDetail();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if screener.isDrawerOpen && stock}
  <!-- Backdrop -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 bg-black/50 z-40 backdrop-blur-xs transition-opacity"
    onclick={() => screener.closeStockDetail()}
  ></div>

  <!-- Slide-over Drawer -->
  <aside class="fixed right-0 top-0 bottom-0 w-full sm:w-[480px] bg-[#181c27] border-l border-[#2a2e39] z-50 shadow-2xl flex flex-col text-xs transition-transform duration-200 ease-out">
    <!-- Header -->
    <div class="p-4 border-b border-[#2a2e39] bg-[#1e222d] flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="text-xl">{getMarketFlag(stock.market)}</span>
        <div>
          <div class="flex items-center gap-2">
            <h2 class="text-base font-bold text-white">{stock.name}</h2>
            <span class="font-mono text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-semibold">{stock.code}</span>
          </div>
          <div class="text-[11px] text-gray-400 mt-0.5">
            {getMarketLabel(stock.market)} • {stock.sectorA || '기타 업종'}
          </div>
        </div>
      </div>
      <button
        onclick={() => screener.closeStockDetail()}
        class="w-7 h-7 rounded-md bg-[#131722] hover:bg-[#2a2e39] text-gray-400 hover:text-white flex items-center justify-center text-sm"
        aria-label="닫기"
      >
        ✕
      </button>
    </div>

    <!-- Scrollable Content -->
    <div class="flex-1 overflow-y-auto p-4 space-y-4">
      <!-- Chart Quick Action Links -->
      {#if links}
        <div class="flex items-center gap-2 flex-wrap">
          <a
            href={links.tradingView}
            target="_blank"
            rel="noopener noreferrer"
            class="flex-1 min-w-[120px] py-2 px-3 rounded bg-[#2962ff] hover:bg-[#1e4bd8] text-white text-center font-semibold transition flex items-center justify-center gap-1.5 shadow"
          >
            <span>TradingView 차트</span>
            <span>↗</span>
          </a>
          {#if links.naver}
            <a
              href={links.naver}
              target="_blank"
              rel="noopener noreferrer"
              class="flex-1 min-w-[100px] py-2 px-3 rounded bg-[#03c75a] hover:bg-[#02b350] text-white text-center font-semibold transition flex items-center justify-center gap-1.5 shadow"
            >
              <span>네이버 금융</span>
              <span>↗</span>
            </a>
          {/if}
          <a
            href={links.yahoo}
            target="_blank"
            rel="noopener noreferrer"
            class="py-2 px-3 rounded bg-[#6001d2] hover:bg-[#5000b0] text-white text-center font-semibold transition flex items-center justify-center gap-1.5 shadow"
          >
            <span>Yahoo</span>
            <span>↗</span>
          </a>
        </div>
      {/if}

      <!-- Current Snapshot Stats -->
      <div class="grid grid-cols-2 gap-2 bg-[#131722] p-3 rounded border border-[#2a2e39]">
        <div>
          <span class="text-gray-400 text-[11px]">당일 종가</span>
          <div class="font-mono text-base font-bold text-white tabular-nums">
            {formatNumber(stock.close)}
          </div>
        </div>
        <div>
          <span class="text-gray-400 text-[11px]">당일 등락률</span>
          <div class="font-mono text-base font-bold tabular-nums {getChangeColorClass(stock.changePct, screener.colorScheme)}">
            {formatPercent(stock.changePct)}
          </div>
        </div>
        <div>
          <span class="text-gray-400 text-[11px]">1주 수익률</span>
          <div class="font-mono text-sm font-semibold tabular-nums {getChangeColorClass(stock.return1w, screener.colorScheme)}">
            {formatPercent(stock.return1w)}
          </div>
        </div>
        <div>
          <span class="text-gray-400 text-[11px]">3개월 수익률</span>
          <div class="font-mono text-sm font-semibold tabular-nums {getChangeColorClass(stock.return3m, screener.colorScheme)}">
            {formatPercent(stock.return3m)}
          </div>
        </div>
        <div>
          <span class="text-gray-400 text-[11px]">전고점 돌파 강도</span>
          <div class="font-mono text-sm text-emerald-400 font-bold tabular-nums">
            +{stock.breakoutPct}%
          </div>
        </div>
        <div>
          <span class="text-gray-400 text-[11px]">전고점 경과일</span>
          <div class="font-mono text-sm text-amber-300 font-bold tabular-nums">
            {stock.daysSincePrevHigh !== null ? `${stock.daysSincePrevHigh}일` : '-'}
          </div>
        </div>
      </div>

      <!-- Additional Details -->
      <div class="bg-[#131722] p-3 rounded border border-[#2a2e39] space-y-1.5 text-[11px]">
        <div class="flex justify-between">
          <span class="text-gray-400">기존 최고가 달성일:</span>
          <span class="text-gray-200 font-mono">{stock.prevHighDate || '-'}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-400">기존 최고가:</span>
          <span class="text-gray-200 font-mono">{formatNumber(stock.prevHigh)}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-400">당일 고가 / 저가:</span>
          <span class="text-gray-200 font-mono">{formatNumber(stock.high)} / {formatNumber(stock.low)}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-400">거래량:</span>
          <span class="text-gray-200 font-mono">{formatNumber(stock.volume)}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-400">거래대금(백만원):</span>
          <span class="text-gray-200 font-mono">{formatNumber(stock.tradingValue)}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-400">시가총액(억원):</span>
          <span class="text-gray-200 font-mono">{formatNumber(stock.marketCap)}</span>
        </div>
        {#if stock.sectorB}
          <div class="flex justify-between pt-1 border-t border-[#2a2e39]">
            <span class="text-gray-400">업종 세부(섹터B):</span>
            <span class="text-gray-300 truncate max-w-[240px] text-right" title={stock.sectorB}>{stock.sectorB}</span>
          </div>
        {/if}
      </div>

      <!-- Historical 60-Day High Timeline across dataset -->
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <h3 class="font-bold text-white text-xs flex items-center gap-1.5">
            <span>📅</span>
            <span>전체 60일 신고가 달성 이력 ({history.length}회)</span>
          </h3>
          <span class="text-[10px] text-gray-500">최신순 정렬</span>
        </div>

        <div class="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
          {#each history as item}
            <div class="p-2 rounded bg-[#131722] border border-[#2a2e39] hover:border-blue-500/50 transition flex items-center justify-between text-[11px]">
              <div>
                <span class="font-mono font-bold text-blue-400">{item.recordDate}</span>
                <span class="text-gray-400 text-[10px] ml-1.5">
                  ({item.daysSincePrevHigh === 1 ? '연속 신고가' : `${item.daysSincePrevHigh}일만 돌파`})
                </span>
              </div>
              <div class="flex items-center gap-3 font-mono">
                <span class="text-gray-200">{formatNumber(item.close)}</span>
                <span class="{getChangeColorClass(item.changePct, screener.colorScheme)} font-semibold">
                  {formatPercent(item.changePct)}
                </span>
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>
  </aside>
{/if}
