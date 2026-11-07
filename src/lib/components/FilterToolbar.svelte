<script lang="ts">
  import { screener } from '$lib/state/screener.svelte';
  import { getMarketFlag, getMarketLabel } from '$lib/utils/links';

  let { onExportCsv } = $props<{ onExportCsv?: () => void }>();

  const quickPresets = [
    { id: 'consecutive', label: '🔥 연속 신고가 (≤3일)', desc: '전고점 달성 후 3일 이내 연속 돌파' },
    { id: 'long_breakout', label: '🚀 장기 저항 돌파 (≥30일)', desc: '30일 이상 묵은 전고점 돌파' },
    { id: 'surge', label: '📈 당일 급등 (≥+5%)', desc: '당일 등락률 +5% 이상' },
    { id: 'super_momentum', label: '💎 슈퍼 모멘텀 (3M ≥+50%)', desc: '3개월 상승률 +50% 이상' },
    { id: 'multi_appear', label: '👑 기간 내 다중 출현 (≥2회)', desc: '선택 기간 내 2회 이상 신고가 달성' }
  ];

  const columnPresets = [
    { id: 'all', label: '전체 컬럼' },
    { id: 'momentum', label: '돌파·모멘텀' },
    { id: 'price', label: '가격·거래대금' },
    { id: 'compact', label: '컴팩트' }
  ];

  const groupOptions = [
    { id: null, label: '그룹 없음' },
    { id: 'market', label: '시장별' },
    { id: 'sectorA', label: '섹터(대분류)별' },
    { id: 'recordDate', label: '기록일별' },
    { id: 'code', label: '종목코드별' }
  ];

  function handleDateChange(e: Event) {
    const val = (e.target as HTMLSelectElement).value;
    screener.selectedDate = val;
    screener.ensureDataForTarget();
  }

  function handleMonthChange(e: Event) {
    const val = (e.target as HTMLSelectElement).value;
    screener.selectedMonth = val;
    screener.ensureDataForTarget();
  }

  function setMode(mode: 'single' | 'range' | 'month') {
    screener.dateFilterMode = mode;
    screener.ensureDataForTarget();
  }
  function handlePresetClick(presetId: string) {
    screener.columnPreset = presetId as any;
    if (presetId === 'all') {
      screener.showAllColumns();
    } else if (presetId === 'momentum') {
      const active: Record<string, boolean> = {
        recordDate: true,
        market: true,
        code: true,
        name: true,
        appearCount: true,
        sectorA: true,
        sectorB: false,
        close: true,
        changePct: true,
        breakoutPct: true,
        daysSincePrevHigh: true,
        prevHighDate: false,
        prevHigh: false,
        high: false,
        low: false,
        return1w: true,
        return3m: true,
        volume: false,
        tradingValue: true,
        marketCap: false
      };
      screener.visibleColumns = active;
    } else if (presetId === 'price') {
      const active: Record<string, boolean> = {
        recordDate: false,
        market: true,
        code: true,
        name: true,
        appearCount: false,
        sectorA: true,
        sectorB: false,
        close: true,
        changePct: true,
        breakoutPct: false,
        daysSincePrevHigh: false,
        prevHighDate: true,
        prevHigh: true,
        high: true,
        low: true,
        return1w: false,
        return3m: false,
        volume: true,
        tradingValue: true,
        marketCap: true
      };
      screener.visibleColumns = active;
    } else if (presetId === 'compact') {
      const active: Record<string, boolean> = {
        recordDate: false,
        market: true,
        code: true,
        name: true,
        appearCount: false,
        sectorA: false,
        sectorB: false,
        close: true,
        changePct: true,
        breakoutPct: true,
        daysSincePrevHigh: true,
        prevHighDate: false,
        prevHigh: false,
        high: false,
        low: false,
        return1w: false,
        return3m: false,
        volume: true,
        tradingValue: false,
        marketCap: false
      };
      screener.visibleColumns = active;
    }
  }
</script>

<div class="bg-[#181c27] border-b border-[#2a2e39] p-3 space-y-2.5">
  <!-- Top Row: Date Mode & Date Selectors + Column Preset + GroupBy + Export -->
  <div class="flex flex-wrap items-center justify-between gap-3 text-xs">
    <!-- Date Controls -->
    <div class="flex items-center gap-2 flex-wrap">
      <!-- Mode Tabs -->
      <div class="inline-flex rounded-md p-0.5 bg-[#131722] border border-[#2a2e39]">
        <button
          onclick={() => setMode('single')}
          class="px-2.5 py-1 rounded text-xs font-medium transition {screener.dateFilterMode === 'single' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'}"
        >
          단일 날짜
        </button>
        <button
          onclick={() => setMode('range')}
          class="px-2.5 py-1 rounded text-xs font-medium transition {screener.dateFilterMode === 'range' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'}"
        >
          기간 범위
        </button>
        <button
          onclick={() => setMode('month')}
          class="px-2.5 py-1 rounded text-xs font-medium transition {screener.dateFilterMode === 'month' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'}"
        >
          월 전체
        </button>
      </div>

      <!-- Single Date Picker -->
      {#if screener.dateFilterMode === 'single'}
        <div class="flex items-center gap-1">
          <button
            onclick={() => screener.prevTradingDay()}
            title="이전 영업일"
            class="px-2 py-1 rounded bg-[#131722] hover:bg-[#2a2e39] border border-[#2a2e39] text-gray-300 transition"
          >
            ◀
          </button>
          <select
            value={screener.selectedDate}
            onchange={handleDateChange}
            class="bg-[#131722] text-white border border-[#2a2e39] rounded px-2.5 py-1 text-xs outline-none focus:border-blue-500 font-mono"
          >
            {#each screener.availableDates as date}
              <option value={date}>{date}</option>
            {/each}
          </select>
          <button
            onclick={() => screener.nextTradingDay()}
            title="다음 영업일"
            class="px-2 py-1 rounded bg-[#131722] hover:bg-[#2a2e39] border border-[#2a2e39] text-gray-300 transition"
          >
            ▶
          </button>
        </div>
      {:else if screener.dateFilterMode === 'range'}
        <div class="flex items-center gap-1.5 bg-[#131722] border border-[#2a2e39] rounded px-2 py-0.5">
          <span class="text-gray-400 text-[11px]">시작:</span>
          <select
            bind:value={screener.dateRange.start}
            onchange={() => screener.ensureDataForTarget()}
            class="bg-transparent text-white text-xs outline-none font-mono"
          >
            {#each screener.availableDates as date}
              <option value={date} class="bg-[#131722]">{date}</option>
            {/each}
          </select>
          <span class="text-gray-500">~</span>
          <span class="text-gray-400 text-[11px]">종료:</span>
          <select
            bind:value={screener.dateRange.end}
            onchange={() => screener.ensureDataForTarget()}
            class="bg-transparent text-white text-xs outline-none font-mono"
          >
            {#each screener.availableDates as date}
              <option value={date} class="bg-[#131722]">{date}</option>
            {/each}
          </select>
        </div>
      {:else if screener.dateFilterMode === 'month'}
        <div class="flex items-center gap-1">
          <select
            value={screener.selectedMonth}
            onchange={handleMonthChange}
            class="bg-[#131722] text-white border border-[#2a2e39] rounded px-2.5 py-1 text-xs outline-none focus:border-blue-500 font-mono"
          >
            {#each screener.availableMonths as month}
              <option value={month}>{month.slice(0, 4)}년 {month.slice(4)}월</option>
            {/each}
          </select>
        </div>
      {/if}

      <!-- Search Keyword -->
      <div class="relative w-44 sm:w-56">
        <input
          type="text"
          bind:value={screener.searchKeyword}
          placeholder="종목명 / 티커 / 섹터 검색..."
          class="w-full bg-[#131722] border border-[#2a2e39] rounded px-2.5 py-1 text-xs text-white placeholder-gray-500 outline-none focus:border-blue-500"
        />
        {#if screener.searchKeyword}
          <button
            onclick={() => screener.searchKeyword = ''}
            class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs"
          >
            ✕
          </button>
        {/if}
      </div>
    </div>

    <!-- Right Controls: View Presets, Grouping, Column Settings, CSV Export -->
    <div class="flex items-center gap-2 flex-wrap">
      <!-- Column Preset -->
      <div class="hidden lg:flex items-center bg-[#131722] border border-[#2a2e39] rounded p-0.5">
        {#each columnPresets as p}
          <button
            onclick={() => handlePresetClick(p.id)}
            class="px-2 py-0.5 rounded text-[11px] transition {screener.columnPreset === p.id ? 'bg-[#2a2e39] text-white font-medium' : 'text-gray-400 hover:text-gray-200'}"
          >
            {p.label}
          </button>
        {/each}
      </div>

      <!-- Column Settings Modal Toggle Button -->
      <button
        onclick={() => screener.isColumnModalOpen = true}
        class="px-2.5 py-1 rounded bg-[#131722] hover:bg-[#2a2e39] border border-[#2a2e39] text-gray-300 hover:text-white font-medium flex items-center gap-1.5 transition text-xs shadow-xs"
        title="표시할 컬럼 보이기/숨기기 설정"
      >
        <span>⚙️</span>
        <span>컬럼 설정</span>
      </button>

      <!-- GroupBy -->
      <div class="flex items-center gap-1">
        <span class="text-gray-400 text-[11px]">그룹:</span>
        <select
          bind:value={screener.groupBy}
          class="bg-[#131722] text-gray-300 border border-[#2a2e39] rounded px-2 py-1 text-xs outline-none focus:border-blue-500"
        >
          {#each groupOptions as opt}
            <option value={opt.id}>{opt.label}</option>
          {/each}
        </select>
      </div>

      <!-- CSV Export Button -->
      <button
        onclick={onExportCsv}
        class="px-2.5 py-1 rounded bg-emerald-600/80 hover:bg-emerald-600 text-white font-medium flex items-center gap-1 transition shadow-sm"
        title="현재 필터링된 결과 CSV로 다운로드"
      >
        <span>📥</span>
        <span>CSV</span>
      </button>
    </div>
  </div>

  <!-- Middle Row: Market Tabs with Counts (Finviz/Investing.com style) -->
  <div class="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
    <!-- All Market Tab -->
    <button
      onclick={() => screener.toggleMarket('all')}
      class="px-2.5 py-1 rounded font-medium flex items-center gap-1.5 shrink-0 transition {screener.selectedMarkets.includes('all') ? 'bg-blue-600 text-white' : 'bg-[#131722] text-gray-400 hover:bg-[#2a2e39] hover:text-white border border-[#2a2e39]'}"
    >
      <span>🌐</span>
      <span>전체</span>
      <span class="text-[10px] px-1 py-0.2 rounded {screener.selectedMarkets.includes('all') ? 'bg-blue-700 text-blue-100' : 'bg-[#1e222d] text-gray-400'}">
        {screener.marketCounts.all || 0}
      </span>
    </button>

    <!-- Specific Market Tabs -->
    {#each screener.availableMarkets as m}
      {@const isSelected = screener.selectedMarkets.includes(m)}
      {@const count = screener.marketCounts[m] || 0}
      <button
        onclick={() => screener.toggleMarket(m)}
        class="px-2.5 py-1 rounded font-medium flex items-center gap-1.5 shrink-0 transition {isSelected ? 'bg-blue-600 text-white' : 'bg-[#131722] text-gray-400 hover:bg-[#2a2e39] hover:text-white border border-[#2a2e39]'}"
      >
        <span>{getMarketFlag(m)}</span>
        <span>{getMarketLabel(m)}</span>
        <span class="text-[10px] px-1 py-0.2 rounded {isSelected ? 'bg-blue-700 text-blue-100' : 'bg-[#1e222d] text-gray-400'}">
          {count}
        </span>
      </button>
    {/each}
  </div>

  <!-- Bottom Row: Quick Quant Preset Chips -->
  <div class="flex items-center gap-1.5 flex-wrap text-xs pt-1 border-t border-[#2a2e39]/60">
    <span class="text-gray-400 text-[11px] font-semibold mr-1">퀀트 퀵 필터:</span>
    {#each quickPresets as q}
      {@const isActive = screener.quickPreset === q.id}
      <button
        onclick={() => screener.setQuickPreset(q.id)}
        title={q.desc}
        class="px-2.5 py-0.8 rounded-full transition text-[11px] flex items-center gap-1 border {isActive ? 'bg-amber-500/20 text-amber-300 border-amber-500 font-bold' : 'bg-[#131722] text-gray-400 border-[#2a2e39] hover:text-gray-200 hover:bg-[#2a2e39]'}"
      >
        <span>{q.label}</span>
      </button>
    {/each}

    {#if screener.quickPreset}
      <button
        onclick={() => screener.quickPreset = null}
        class="text-gray-400 hover:text-red-400 text-[11px] underline ml-1"
      >
        초기화
      </button>
    {/if}
  </div>
</div>
