<script lang="ts">
  import { onMount } from 'svelte';
  import { screener } from '$lib/state/screener.svelte';
  import type { StockRecord } from '$lib/types/screener';
  import { formatNumber, formatPercent, getChangeColorClass } from '$lib/utils/formatters';
  import { getMarketFlag, getMarketLabel, getChartLinks } from '$lib/utils/links';

  let tableContainer: HTMLDivElement;
  let tabulatorInstance: any = null;
  let isMounted = false;

  // Custom header filter function for numbers (supports ">10", "<5", "10..50", ">=5")
  function customNumberFilter(headerValue: any, rowValue: any, rowData: any, filterParams: any) {
    if (headerValue === undefined || headerValue === null || headerValue === '') return true;
    if (rowValue === null || rowValue === undefined) return false;

    const query = String(headerValue).trim();
    const val = Number(rowValue);
    if (Number.isNaN(val)) return false;

    // Range: "10..50" or "10~50"
    const rangeMatch = query.match(/^([+-]?\d+(?:\.\d+)?)\s*(?:\.\.|~)\s*([+-]?\d+(?:\.\d+)?)$/);
    if (rangeMatch) {
      const min = Number(rangeMatch[1]);
      const max = Number(rangeMatch[2]);
      return val >= min && val <= max;
    }

    // Greater than or equal: ">=10"
    if (query.startsWith('>=')) {
      const target = Number(query.slice(2).trim());
      return val >= target;
    }
    // Less than or equal: "<=10"
    if (query.startsWith('<=')) {
      const target = Number(query.slice(2).trim());
      return val <= target;
    }
    // Greater than: ">10"
    if (query.startsWith('>')) {
      const target = Number(query.slice(1).trim());
      return val > target;
    }
    // Less than: "<10"
    if (query.startsWith('<')) {
      const target = Number(query.slice(1).trim());
      return val < target;
    }

    // Direct number: "10" -> val >= 10 by default for quant screener convenience
    const num = Number(query);
    if (!Number.isNaN(num)) {
      return val >= num;
    }

    return true;
  }

  function buildColumns(preset: string) {
    const isSingleDate = screener.dateFilterMode === 'single';

    return [
      // 1. Record Date (Frozen, hidden if single date)
      {
        title: '기록일',
        field: 'recordDate',
        width: 95,
        frozen: true,
        visible: (!isSingleDate || preset === 'all') && screener.isColumnVisible('recordDate'),
        sorter: 'string',
        headerFilter: 'input',
        formatter: (cell: any) => `<span class="font-mono text-gray-300 text-[11px]">${cell.getValue() || ''}</span>`
      },
      // 2. Market (Frozen)
      {
        title: '시장',
        field: 'market',
        width: 85,
        frozen: true,
        visible: screener.isColumnVisible('market'),
        sorter: 'string',
        headerFilter: 'list',
        headerFilterParams: { valuesLookup: 'all', clearable: true },
        formatter: (cell: any) => {
          const m = cell.getValue();
          return `<span class="inline-flex items-center gap-1 font-medium text-[11px]"><span class="text-xs">${getMarketFlag(m)}</span><span class="text-gray-300 uppercase">${m}</span></span>`;
        }
      },
      // 3. Code / Ticker (Frozen)
      {
        title: '종목코드',
        field: 'code',
        width: 95,
        frozen: true,
        visible: screener.isColumnVisible('code'),
        sorter: 'alphanum',
        headerFilter: 'input',
        formatter: (cell: any) => {
          const row = cell.getRow().getData();
          const code = cell.getValue();
          const links = getChartLinks(row.market, code);
          return `
            <div class="flex items-center justify-between group">
              <span class="font-mono font-bold text-blue-400 group-hover:underline cursor-pointer">${code}</span>
              <a href="${links.tradingView}" target="_blank" rel="noopener noreferrer" title="TradingView 차트 보기" class="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white ml-1 text-[10px]">↗</a>
            </div>
          `;
        }
      },
      // 4. Name (Frozen)
      {
        title: '종목명',
        field: 'name',
        width: 140,
        frozen: true,
        visible: screener.isColumnVisible('name'),
        sorter: 'string',
        headerFilter: 'input',
        formatter: (cell: any) => `<span class="font-semibold text-gray-100 hover:text-blue-400 transition cursor-pointer truncate block" title="${cell.getValue()}">${cell.getValue()}</span>`
      },
      // 5. Appear Count (in multi-date range)
      {
        title: '기간출현',
        field: 'appearCount',
        width: 75,
        hozAlign: 'center',
        visible: !isSingleDate && screener.isColumnVisible('appearCount'),
        sorter: 'number',
        sorterParams: { alignEmptyValues: 'bottom' },
        headerFilter: 'input',
        headerFilterFunc: customNumberFilter,
        formatter: (cell: any) => {
          const val = cell.getValue() || 1;
          const bg = val >= 3 ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : val === 2 ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' : 'bg-gray-800 text-gray-400 border-gray-700';
          return `<span class="px-1.5 py-0.2 rounded border text-[10px] font-mono font-bold ${bg}">${val}회</span>`;
        }
      },
      // 6. Sector A (Major)
      {
        title: '섹터A (대분류)',
        field: 'sectorA',
        width: 130,
        visible: screener.isColumnVisible('sectorA'),
        sorter: 'string',
        headerFilter: 'input',
        formatter: (cell: any) => `<span class="text-gray-300 text-[11px] truncate block" title="${cell.getValue() || ''}">${cell.getValue() || '-'}</span>`
      },
      // 7. Sector B (Sub)
      {
        title: '섹터B (소분류)',
        field: 'sectorB',
        width: 130,
        visible: screener.isColumnVisible('sectorB'),
        sorter: 'string',
        headerFilter: 'input',
        formatter: (cell: any) => `<span class="text-gray-400 text-[11px] truncate block" title="${cell.getValue() || ''}">${cell.getValue() || '-'}</span>`
      },
      // 8. Close price
      {
        title: '당일종가',
        field: 'close',
        width: 90,
        hozAlign: 'right',
        visible: screener.isColumnVisible('close'),
        sorter: 'number',
        sorterParams: { alignEmptyValues: 'bottom' },
        headerFilter: 'input',
        headerFilterFunc: customNumberFilter,
        formatter: (cell: any) => `<span class="font-mono text-gray-100 tabular-nums">${formatNumber(cell.getValue())}</span>`
      },
      // 9. Change %
      {
        title: '등락률',
        field: 'changePct',
        width: 85,
        hozAlign: 'right',
        visible: screener.isColumnVisible('changePct'),
        sorter: 'number',
        sorterParams: { alignEmptyValues: 'bottom' },
        headerFilter: 'input',
        headerFilterFunc: customNumberFilter,
        formatter: (cell: any) => {
          const val = cell.getValue();
          const colorClass = getChangeColorClass(val, screener.colorScheme);
          return `<span class="font-mono font-bold tabular-nums ${colorClass}">${formatPercent(val)}</span>`;
        }
      },
      // 10. Breakout %
      {
        title: '돌파강도',
        field: 'breakoutPct',
        width: 85,
        hozAlign: 'right',
        visible: screener.isColumnVisible('breakoutPct'),
        sorter: 'number',
        sorterParams: { alignEmptyValues: 'bottom' },
        headerFilter: 'input',
        headerFilterFunc: customNumberFilter,
        formatter: (cell: any) => {
          const val = cell.getValue();
          if (val === null || val === undefined) return '-';
          return `<span class="font-mono text-emerald-400 font-semibold tabular-nums">+${val.toFixed(2)}%</span>`;
        }
      },
      // 11. Days Since Prev High
      {
        title: '전고점경과',
        field: 'daysSincePrevHigh',
        width: 90,
        hozAlign: 'center',
        visible: screener.isColumnVisible('daysSincePrevHigh'),
        sorter: 'number',
        sorterParams: { alignEmptyValues: 'bottom' },
        headerFilter: 'input',
        headerFilterFunc: customNumberFilter,
        formatter: (cell: any) => {
          const val = cell.getValue();
          if (val === null || val === undefined) return '-';
          if (val <= 3) {
            return `<span class="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold">연속 (${val}일)</span>`;
          } else if (val >= 30) {
            return `<span class="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[10px]">돌파 (${val}일)</span>`;
          }
          return `<span class="font-mono text-gray-300 text-[11px]">${val}일</span>`;
        }
      },
      // 12. Prev High Date
      {
        title: '기존최고일',
        field: 'prevHighDate',
        width: 95,
        visible: screener.isColumnVisible('prevHighDate'),
        sorter: 'string',
        headerFilter: 'input',
        formatter: (cell: any) => `<span class="font-mono text-gray-400 text-[11px]">${cell.getValue() || '-'}</span>`
      },
      // 13. Prev High Price
      {
        title: '기존최고가',
        field: 'prevHigh',
        width: 90,
        hozAlign: 'right',
        visible: screener.isColumnVisible('prevHigh'),
        sorter: 'number',
        sorterParams: { alignEmptyValues: 'bottom' },
        headerFilter: 'input',
        headerFilterFunc: customNumberFilter,
        formatter: (cell: any) => `<span class="font-mono text-gray-300 tabular-nums">${formatNumber(cell.getValue())}</span>`
      },
      // 14. High
      {
        title: '당일고가',
        field: 'high',
        width: 85,
        hozAlign: 'right',
        visible: screener.isColumnVisible('high'),
        sorter: 'number',
        sorterParams: { alignEmptyValues: 'bottom' },
        headerFilter: 'input',
        headerFilterFunc: customNumberFilter,
        formatter: (cell: any) => `<span class="font-mono text-gray-300 tabular-nums">${formatNumber(cell.getValue())}</span>`
      },
      // 15. Low
      {
        title: '당일저가',
        field: 'low',
        width: 85,
        hozAlign: 'right',
        visible: screener.isColumnVisible('low'),
        sorter: 'number',
        sorterParams: { alignEmptyValues: 'bottom' },
        headerFilter: 'input',
        headerFilterFunc: customNumberFilter,
        formatter: (cell: any) => `<span class="font-mono text-gray-300 tabular-nums">${formatNumber(cell.getValue())}</span>`
      },
      // 16. 1-Week Return
      {
        title: '1주상승률',
        field: 'return1w',
        width: 85,
        hozAlign: 'right',
        visible: screener.isColumnVisible('return1w'),
        sorter: 'number',
        sorterParams: { alignEmptyValues: 'bottom' },
        headerFilter: 'input',
        headerFilterFunc: customNumberFilter,
        formatter: (cell: any) => {
          const val = cell.getValue();
          if (val === null || val === undefined) return '<span class="text-gray-500">-</span>';
          return `<span class="font-mono font-medium tabular-nums ${getChangeColorClass(val, screener.colorScheme)}">${formatPercent(val)}</span>`;
        }
      },
      // 17. 3-Month Return
      {
        title: '3개월상승률',
        field: 'return3m',
        width: 90,
        hozAlign: 'right',
        visible: screener.isColumnVisible('return3m'),
        sorter: 'number',
        sorterParams: { alignEmptyValues: 'bottom' },
        headerFilter: 'input',
        headerFilterFunc: customNumberFilter,
        formatter: (cell: any) => {
          const val = cell.getValue();
          if (val === null || val === undefined) return '<span class="text-gray-500">-</span>';
          return `<span class="font-mono font-bold tabular-nums ${getChangeColorClass(val, screener.colorScheme)}">${formatPercent(val)}</span>`;
        }
      },
      // 18. Volume
      {
        title: '거래량',
        field: 'volume',
        width: 95,
        hozAlign: 'right',
        visible: screener.isColumnVisible('volume'),
        sorter: 'number',
        sorterParams: { alignEmptyValues: 'bottom' },
        headerFilter: 'input',
        headerFilterFunc: customNumberFilter,
        formatter: (cell: any) => `<span class="font-mono text-gray-300 tabular-nums">${formatNumber(cell.getValue())}</span>`
      },
      // 19. Trading Value
      {
        title: '거래대금(백만)',
        field: 'tradingValue',
        width: 100,
        hozAlign: 'right',
        visible: screener.isColumnVisible('tradingValue'),
        sorter: 'number',
        sorterParams: { alignEmptyValues: 'bottom' },
        headerFilter: 'input',
        headerFilterFunc: customNumberFilter,
        formatter: (cell: any) => `<span class="font-mono text-amber-300 tabular-nums">${formatNumber(cell.getValue())}</span>`
      },
      // 20. Market Cap
      {
        title: '시가총액(억)',
        field: 'marketCap',
        width: 95,
        hozAlign: 'right',
        visible: screener.isColumnVisible('marketCap'),
        sorter: 'number',
        sorterParams: { alignEmptyValues: 'bottom' },
        headerFilter: 'input',
        headerFilterFunc: customNumberFilter,
        formatter: (cell: any) => {
          const val = cell.getValue();
          if (val === null || val === undefined) return '<span class="text-gray-500">N/A</span>';
          return `<span class="font-mono text-gray-300 tabular-nums">${formatNumber(val)}</span>`;
        }
      }
    ];
  }

  onMount(async () => {
    const { TabulatorFull: Tabulator } = await import('tabulator-tables');

    tabulatorInstance = new Tabulator(tableContainer, {
      data: screener.activeRows,
      layout: 'fitDataFill',
      renderVertical: 'virtual',
      renderVerticalBuffer: 200,
      height: '100%',
      columnHeaderSortMulti: true,
      groupBy: screener.groupBy || undefined,
      groupHeader: (value: any, count: any, data: any) => {
        let avgChange = 0;
        let cCount = 0;
        for (const item of data) {
          if (item.changePct !== null) {
            avgChange += item.changePct;
            cCount++;
          }
        }
        const avg = cCount > 0 ? (avgChange / cCount).toFixed(2) : '0';
        return `
          <div class="flex items-center gap-2">
            <span class="font-bold text-white">${value || '미분류'}</span>
            <span class="text-[11px] text-gray-400">(${count}개 종목)</span>
            <span class="text-[11px] text-gray-300">평균 등락: <span class="font-mono font-bold ${avg >= 0 ? 'text-red-400' : 'text-blue-400'}">${avg > 0 ? '+' : ''}${avg}%</span></span>
          </div>
        `;
      },
      columns: buildColumns(screener.columnPreset),
      placeholder: '해당 조건에 일치하는 신고가 종목이 없습니다.'
    });

    // Row click event -> open detail drawer
    tabulatorInstance.on('rowClick', (e: any, row: any) => {
      const data = row.getData() as StockRecord;
      screener.openStockDetail(data);
    });

    isMounted = true;

    // ResizeObserver to keep Tabulator virtual scroll height synced with container
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && tableContainer) {
      ro = new ResizeObserver(() => {
        if (tabulatorInstance) {
          tabulatorInstance.redraw(true);
        }
      });
      ro.observe(tableContainer);
    }

    return () => {
      if (ro) ro.disconnect();
      if (tabulatorInstance) {
        tabulatorInstance.destroy();
      }
    };
  });

  // Effect: Update table data seamlessly using replaceData
  $effect(() => {
    const rows = screener.activeRows;
    if (tabulatorInstance && isMounted) {
      tabulatorInstance.replaceData(rows);
    }
  });

  // Effect: Update columns when preset, visibleColumns, dateMode, or colorScheme changes
  $effect(() => {
    const preset = screener.columnPreset;
    const mode = screener.dateFilterMode;
    const scheme = screener.colorScheme;
    const vis = screener.visibleColumns; // Reactive tracking for column toggle
    if (tabulatorInstance && isMounted) {
      tabulatorInstance.setColumns(buildColumns(preset));
    }
  });

  // Effect: Update groupBy
  $effect(() => {
    const gb = screener.groupBy;
    if (tabulatorInstance && isMounted) {
      tabulatorInstance.setGroupBy(gb || undefined);
    }
  });

  // Export CSV with UTF-8 BOM (\uFEFF) for perfect Excel compatibility
  export function exportCsv() {
    const rows = screener.activeRows;
    if (!rows || rows.length === 0) {
      alert('내보낼 데이터가 없습니다.');
      return;
    }

    const headers = [
      '기록일',
      '시장',
      '종목코드',
      '종목명',
      '기간출현횟수',
      '섹터A(대분류)',
      '섹터B(소분류)',
      '당일종가',
      '등락률(%)',
      '돌파강도(%)',
      '전고점경과일',
      '기존최고가달성일',
      '기존최고가',
      '당일최고가',
      '당일최저가',
      '1주상승률(%)',
      '3개월상승률(%)',
      '거래량',
      '거래대금(백만원)',
      '시가총액(억원)'
    ];

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const lines = [headers.join(',')];

    for (const r of rows) {
      const line = [
        escapeCsv(r.recordDate),
        escapeCsv(r.market),
        escapeCsv(r.code),
        escapeCsv(r.name),
        escapeCsv(r.appearCount || 1),
        escapeCsv(r.sectorA),
        escapeCsv(r.sectorB),
        escapeCsv(r.close),
        escapeCsv(r.changePct),
        escapeCsv(r.breakoutPct),
        escapeCsv(r.daysSincePrevHigh),
        escapeCsv(r.prevHighDate),
        escapeCsv(r.prevHigh),
        escapeCsv(r.high),
        escapeCsv(r.low),
        escapeCsv(r.return1w),
        escapeCsv(r.return3m),
        escapeCsv(r.volume),
        escapeCsv(r.tradingValue),
        escapeCsv(r.marketCap)
      ];
      lines.push(line.join(','));
    }

    // Prefix with UTF-8 BOM (\uFEFF) so Excel recognizes Korean UTF-8 encoding automatically
    const csvContent = '\uFEFF' + lines.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateStr = screener.dateFilterMode === 'single' ? screener.selectedDate : 'quant-screener';
    a.download = `60day_high_${dateStr}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
</script>

<div class="w-full h-full flex-1 min-h-0 overflow-hidden" bind:this={tableContainer}></div>
