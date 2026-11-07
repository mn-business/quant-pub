<script lang="ts">
  import { screener, ALL_COLUMNS } from '$lib/state/screener.svelte';

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && screener.isColumnModalOpen) {
      screener.isColumnModalOpen = false;
    }
  }

  // Active visible count
  let visibleCount = $derived(
    ALL_COLUMNS.filter(c => screener.isColumnVisible(c.field)).length
  );
</script>

<svelte:window onkeydown={handleKeydown} />

{#if screener.isColumnModalOpen}
  <!-- Backdrop -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 bg-black/60 z-50 backdrop-blur-xs flex items-center justify-center p-4 transition-opacity"
    onclick={() => screener.isColumnModalOpen = false}
  >
    <!-- Modal Card -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="bg-[#181c27] border border-[#2a2e39] rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh] text-xs animate-in fade-in zoom-in-95 duration-150"
      onclick={(e) => e.stopPropagation()}
    >
      <!-- Header -->
      <div class="px-5 py-3.5 border-b border-[#2a2e39] bg-[#1e222d] flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="text-base">⚙️</span>
          <div>
            <h3 class="font-bold text-sm text-white flex items-center gap-2">
              <span>컬럼 표시 설정</span>
              <span class="text-[11px] font-normal px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-mono">
                {visibleCount} / {ALL_COLUMNS.length} 표시 중
              </span>
            </h3>
            <p class="text-[11px] text-gray-400 mt-0.5">화면에 노출할 컬럼을 자유롭게 체크하거나 해제하세요.</p>
          </div>
        </div>
        <button
          onclick={() => screener.isColumnModalOpen = false}
          class="w-7 h-7 rounded-md bg-[#131722] hover:bg-[#2a2e39] text-gray-400 hover:text-white flex items-center justify-center transition"
          aria-label="닫기"
        >
          ✕
        </button>
      </div>

      <!-- Quick Action Buttons -->
      <div class="px-5 py-2.5 bg-[#131722]/50 border-b border-[#2a2e39] flex items-center justify-between text-[11px]">
        <div class="flex items-center gap-2">
          <button
            onclick={() => screener.showAllColumns()}
            class="px-2.5 py-1 rounded bg-[#1e222d] hover:bg-[#2a2e39] border border-[#2a2e39] text-gray-200 transition font-medium"
          >
            ✓ 모두 표시
          </button>
          <button
            onclick={() => screener.resetColumns()}
            class="px-2.5 py-1 rounded bg-[#1e222d] hover:bg-[#2a2e39] border border-[#2a2e39] text-gray-400 hover:text-gray-200 transition"
          >
            ↺ 기본값 복원
          </button>
        </div>
        <span class="text-gray-500 text-[10px]">설정은 브라우저에 자동 저장됩니다.</span>
      </div>

      <!-- Checkbox Grid -->
      <div class="p-5 overflow-y-auto flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {#each ALL_COLUMNS as col}
          {@const isChecked = screener.isColumnVisible(col.field)}
          {@const isRequired = col.required}
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
          <label
            class="flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer {isChecked ? 'bg-[#1e222d] border-blue-500/40 text-gray-100 shadow-xs' : 'bg-[#131722]/70 border-[#2a2e39] text-gray-400 hover:bg-[#1e222d] hover:text-gray-300'}"
          >
            <div class="flex items-center gap-2.5">
              <input
                type="checkbox"
                checked={isChecked}
                disabled={isRequired}
                onchange={() => screener.toggleColumn(col.field)}
                class="rounded bg-[#131722] border-[#2a2e39] text-blue-600 focus:ring-0 w-4 h-4 cursor-pointer disabled:opacity-50"
              />
              <span class="font-medium text-[11px] {isRequired ? 'text-white' : ''}">
                {col.label}
              </span>
            </div>
            {#if isRequired}
              <span class="text-[9px] px-1.5 py-0.2 rounded bg-gray-700/60 text-gray-400 font-normal">
                고정 필수
              </span>
            {/if}
          </label>
        {/each}
      </div>

      <!-- Footer -->
      <div class="px-5 py-3 border-t border-[#2a2e39] bg-[#1e222d] flex justify-end">
        <button
          onclick={() => screener.isColumnModalOpen = false}
          class="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition text-xs shadow-sm"
        >
          확인
        </button>
      </div>
    </div>
  </div>
{/if}
