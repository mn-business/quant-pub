<script lang="ts">
  import { onMount } from 'svelte';
  import { screener } from '$lib/state/screener.svelte';
  import HeaderNav from '$lib/components/HeaderNav.svelte';
  import MacroRibbon from '$lib/components/MacroRibbon.svelte';
  import FilterToolbar from '$lib/components/FilterToolbar.svelte';
  import SummaryBar from '$lib/components/SummaryBar.svelte';
  import TabulatorGrid from '$lib/components/TabulatorGrid.svelte';
  import StockDrawer from '$lib/components/StockDrawer.svelte';
  import ColumnSettingsModal from '$lib/components/ColumnSettingsModal.svelte';

  let gridRef: TabulatorGrid | undefined = $state();

  onMount(() => {
    screener.init();
  });

  function handleExportCsv() {
    if (gridRef) {
      gridRef.exportCsv();
    }
  }
</script>

<svelte:head>
  <title>글로벌 60일 신고가 퀀트 스크리너 | quant-pub</title>
</svelte:head>

<div class="flex-1 flex flex-col h-full min-h-0 overflow-hidden">
  <!-- Top Navigation & Category Bar -->
  <HeaderNav />

  <!-- Macro Indicator Ribbon -->
  <MacroRibbon />

  <!-- High-Density Filter Toolbar -->
  <FilterToolbar onExportCsv={handleExportCsv} />

  <!-- Summary Statistics Bar -->
  <SummaryBar />

  <!-- Main Tabulator Grid (Flexible Full Height with Internal Scroll) -->
  <main class="flex-1 min-h-0 relative p-2 bg-[#0f1117] flex flex-col overflow-hidden">
    <TabulatorGrid bind:this={gridRef} />
  </main>

  <!-- Stock Detail & Timeline Drawer -->
  <StockDrawer />

  <!-- Column Visibility Settings Modal -->
  <ColumnSettingsModal />
</div>
