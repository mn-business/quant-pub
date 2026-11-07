<script lang="ts">
  import { screener } from '$lib/state/screener.svelte';
  import { onMount } from 'svelte';

  let isDark = $state(true);

  onMount(() => {
    isDark = document.documentElement.classList.contains('dark');
  });

  function toggleDarkMode() {
    isDark = !isDark;
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  function toggleColorScheme() {
    screener.colorScheme = screener.colorScheme === 'kr' ? 'us' : 'kr';
  }
</script>

<header class="border-b border-[#2a2e39] bg-[#1e222d] px-4 py-2.5 flex items-center justify-between sticky top-0 z-30 shadow-md">
  <div class="flex items-center gap-4">
    <!-- Brand / Title -->
    <div class="flex items-center gap-2">
      <div class="w-8 h-8 rounded bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-black text-white text-base shadow-sm">
        Q
      </div>
      <div>
        <div class="flex items-center gap-2">
          <h1 class="font-bold text-sm tracking-wide text-white flex items-center gap-1.5">
            QUANT-PUB <span class="text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-normal">Screener</span>
          </h1>
        </div>
        <p class="text-[10px] text-gray-400">글로벌 신고가 다차원 퀀트 분석 그리드</p>
      </div>
    </div>

    <!-- 1-Depth Dynamic Categories from result/ -->
    <div class="hidden md:flex items-center gap-1 pl-4 border-l border-[#2a2e39]">
      {#if screener.manifest}
        {#each screener.manifest.categories as cat}
          <button
            onclick={() => screener.setCategory(cat.id)}
            class="px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 {screener.activeCategoryId === cat.id ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white hover:bg-[#2a2e39]'}"
          >
            <span>📈</span>
            <span>{cat.label}</span>
            <span class="text-[10px] px-1 py-0.2 rounded {screener.activeCategoryId === cat.id ? 'bg-blue-700 text-blue-100' : 'bg-[#131722] text-gray-400'}">
              {cat.dates.length}일
            </span>
          </button>
        {/each}
      {/if}
    </div>
  </div>

  <!-- Right Controls: Color mode, Dark mode, Legacy toggle, Status -->
  <div class="flex items-center gap-2.5 text-xs">
    {#if screener.isLoading}
      <div class="flex items-center gap-1.5 text-blue-400 animate-pulse text-[11px] mr-2">
        <svg class="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
        </svg>
        <span>데이터 로딩 중...</span>
      </div>
    {/if}

    <!-- Legacy Data Toggle -->
    <label class="hidden sm:flex items-center gap-1.5 text-gray-400 hover:text-gray-200 cursor-pointer text-[11px] mr-1">
      <input
        type="checkbox"
        bind:checked={screener.includeLegacy}
        class="rounded bg-[#131722] border-[#2a2e39] text-blue-600 focus:ring-0 w-3.5 h-3.5"
      />
      <span>레거시(6~7월 yf) 포함</span>
    </label>

    <!-- Color Scheme Switch (KR: Red Up / US: Green Up) -->
    <button
      onclick={toggleColorScheme}
      title="상승/하락 색상 스킴 토글 (한국식 빨강 vs 미국식 초록)"
      class="px-2.5 py-1 rounded bg-[#131722] hover:bg-[#2a2e39] border border-[#2a2e39] flex items-center gap-1.5 transition text-[11px]"
    >
      <span class="font-bold {screener.colorScheme === 'kr' ? 'text-red-500' : 'text-emerald-500'}">▲</span>
      <span class="font-medium text-gray-300">{screener.colorScheme === 'kr' ? '한국형 (적/청)' : '미국형 (녹/적)'}</span>
    </button>

    <!-- Theme Toggle (Dark / Light) -->
    <button
      onclick={toggleDarkMode}
      title="다크 / 라이트 모드 전환"
      class="p-1.5 rounded bg-[#131722] hover:bg-[#2a2e39] border border-[#2a2e39] text-gray-300 transition"
      aria-label="테마 전환"
    >
      {#if isDark}
        <!-- Sun icon -->
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
        </svg>
      {:else}
        <!-- Moon icon -->
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      {/if}
    </button>
  </div>
</header>
