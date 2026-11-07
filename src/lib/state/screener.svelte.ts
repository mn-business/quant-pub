import { base } from '$app/paths';
import type { Manifest, CategoryMeta, StockRecord, MacroRecord, DateFilterMode, ColumnPreset, ColorScheme, ColumnMeta } from '$lib/types/screener';

export const ALL_COLUMNS: ColumnMeta[] = [
  { field: 'recordDate', label: '기록일', defaultVisible: true },
  { field: 'market', label: '시장', defaultVisible: true, required: true },
  { field: 'code', label: '종목코드', defaultVisible: true, required: true },
  { field: 'name', label: '종목명', defaultVisible: true, required: true },
  { field: 'appearCount', label: '기간출현횟수', defaultVisible: true },
  { field: 'sectorA', label: '섹터A (대분류)', defaultVisible: true },
  { field: 'sectorB', label: '섹터B (소분류)', defaultVisible: true },
  { field: 'close', label: '당일종가', defaultVisible: true },
  { field: 'changePct', label: '등락률(%)', defaultVisible: true },
  { field: 'breakoutPct', label: '돌파강도(%)', defaultVisible: true },
  { field: 'daysSincePrevHigh', label: '전고점경과일', defaultVisible: true },
  { field: 'prevHighDate', label: '기존최고일', defaultVisible: true },
  { field: 'prevHigh', label: '기존최고가', defaultVisible: true },
  { field: 'high', label: '당일고가', defaultVisible: true },
  { field: 'low', label: '당일저가', defaultVisible: true },
  { field: 'return1w', label: '1주상승률(%)', defaultVisible: true },
  { field: 'return3m', label: '3개월상승률(%)', defaultVisible: true },
  { field: 'volume', label: '거래량', defaultVisible: true },
  { field: 'tradingValue', label: '거래대금(백만)', defaultVisible: true },
  { field: 'marketCap', label: '시가총액(억)', defaultVisible: true }
];

function getDefaultVisibility(): Record<string, boolean> {
  const map: Record<string, boolean> = {};
  for (const c of ALL_COLUMNS) {
    map[c.field] = c.defaultVisible;
  }
  return map;
}

export class ScreenerState {
  manifest = $state<Manifest | null>(null);
  activeCategoryId = $state<string>('60day_high');
  
  dateFilterMode = $state<DateFilterMode>('single');
  selectedDate = $state<string>('');
  dateRange = $state<{ start: string; end: string }>({ start: '', end: '' });
  selectedMonth = $state<string>('');

  selectedMarkets = $state<string[]>(['all']);
  includeLegacy = $state<boolean>(false);
  searchKeyword = $state<string>('');
  quickPreset = $state<string | null>(null);
  columnPreset = $state<ColumnPreset>('all');
  groupBy = $state<string | null>(null);
  colorScheme = $state<ColorScheme>('kr');

  visibleColumns = $state<Record<string, boolean>>(getDefaultVisibility());
  isColumnModalOpen = $state<boolean>(false);

  selectedStock = $state<StockRecord | null>(null);
  isDrawerOpen = $state<boolean>(false);
  isLoading = $state<boolean>(false);

  // Cache: category -> month -> { stocks, macros }
  private monthCache = new Map<string, { stocks: StockRecord[]; macros: MacroRecord[] }>();
  // All loaded stock records for the active category
  allCategoryStocks = $state<StockRecord[]>([]);
  allCategoryMacros = $state<MacroRecord[]>([]);

  constructor() {}

  // Active Category metadata
  activeCategory = $derived.by<CategoryMeta | null>(() => {
    if (!this.manifest) return null;
    return this.manifest.categories.find(c => c.id === this.activeCategoryId) || this.manifest.categories[0] || null;
  });

  // Available dates for active category
  availableDates = $derived<string[]>(this.activeCategory?.dates || []);
  
  // Available months for active category
  availableMonths = $derived<string[]>(this.activeCategory?.months || []);

  // Distinct markets list for active category
  availableMarkets = $derived<string[]>(() => {
    if (!this.activeCategory) return [];
    return this.activeCategory.markets.filter(m => {
      if (!this.includeLegacy && (m === 'krx' || m === 'yf_mixed')) return false;
      return true;
    });
  });

  // Calculate target dates according to dateFilterMode
  activeTargetDates = $derived.by<string[]>(() => {
    if (this.dateFilterMode === 'single') {
      return this.selectedDate ? [this.selectedDate] : [];
    } else if (this.dateFilterMode === 'month') {
      if (!this.selectedMonth) return [];
      return this.availableDates.filter(d => d.replace(/-/g, '').startsWith(this.selectedMonth));
    } else {
      // Range mode
      if (!this.dateRange.start || !this.dateRange.end) return [];
      const s = this.dateRange.start;
      const e = this.dateRange.end;
      return this.availableDates.filter(d => d >= s && d <= e);
    }
  });

  // Macro records for the active target dates
  activeMacros = $derived.by<MacroRecord[]>(() => {
    const dates = new Set(this.activeTargetDates);
    return this.allCategoryMacros.filter(m => dates.has(m.recordDate));
  });

  // Appear count map (how many times a stock appeared in the active target dates)
  appearCountMap = $derived.by<Map<string, number>>(() => {
    const map = new Map<string, number>();
    const dates = new Set(this.activeTargetDates);
    for (const s of this.allCategoryStocks) {
      if (dates.has(s.recordDate)) {
        const key = `${s.market}_${s.code}`;
        map.set(key, (map.get(key) || 0) + 1);
      }
    }
    return map;
  });

  // Filtered Stock rows ready for Tabulator
  activeRows = $derived.by<StockRecord[]>(() => {
    const dates = new Set(this.activeTargetDates);
    if (dates.size === 0) return [];

    const isAllMarkets = this.selectedMarkets.includes('all') || this.selectedMarkets.length === 0;
    const marketSet = new Set(this.selectedMarkets);
    const kw = this.searchKeyword.trim().toLowerCase();
    const appearMap = this.appearCountMap;

    return this.allCategoryStocks.filter(s => {
      // 1. Date check
      if (!dates.has(s.recordDate)) return false;

      // 2. Legacy check
      if (!this.includeLegacy && (s.sourceType === 'yf' || s.sourceType === 'yf_krx')) {
        return false;
      }

      // 3. Market check
      if (!isAllMarkets && !marketSet.has(s.market)) {
        return false;
      }

      // 4. Search keyword check
      if (kw) {
        const matchCode = s.code.toLowerCase().includes(kw);
        const matchName = s.name.toLowerCase().includes(kw);
        const matchSectorA = s.sectorA.toLowerCase().includes(kw);
        const matchSectorB = s.sectorB.toLowerCase().includes(kw);
        if (!matchCode && !matchName && !matchSectorA && !matchSectorB) {
          return false;
        }
      }

      // 5. Quick Preset check
      if (this.quickPreset) {
        if (this.quickPreset === 'consecutive') {
          // 연속 돌파: 전고점 경과일 1~3일 이내
          if (s.daysSincePrevHigh === null || s.daysSincePrevHigh > 3) return false;
        } else if (this.quickPreset === 'long_breakout') {
          // 장기 저항 돌파: 전고점 경과일 30일 이상
          if (s.daysSincePrevHigh === null || s.daysSincePrevHigh < 30) return false;
        } else if (this.quickPreset === 'surge') {
          // 당일 급등: 등락률 +5% 이상
          if (s.changePct === null || s.changePct < 5) return false;
        } else if (this.quickPreset === 'super_momentum') {
          // 3개월 상승률 +50% 이상
          if (s.return3m === null || s.return3m < 50) return false;
        } else if (this.quickPreset === 'multi_appear') {
          // 기간 내 2회 이상 출현
          const key = `${s.market}_${s.code}`;
          if ((appearMap.get(key) || 0) < 2) return false;
        }
      }

      return true;
    }).map(s => {
      const key = `${s.market}_${s.code}`;
      return {
        ...s,
        appearCount: appearMap.get(key) || 1
      };
    });
  });

  // Market counts breakdown for active target dates
  marketCounts = $derived.by<Record<string, number>>(() => {
    const counts: Record<string, number> = { all: 0 };
    const dates = new Set(this.activeTargetDates);
    for (const s of this.allCategoryStocks) {
      if (dates.has(s.recordDate)) {
        if (!this.includeLegacy && (s.sourceType === 'yf' || s.sourceType === 'yf_krx')) continue;
        counts.all = (counts.all || 0) + 1;
        counts[s.market] = (counts[s.market] || 0) + 1;
      }
    }
    return counts;
  });

  // Sector breakdown (top 5 sectors)
  topSectors = $derived.by<{ sector: string; count: number; pct: number }[]>(() => {
    const total = this.activeRows.length;
    if (total === 0) return [];
    const map = new Map<string, number>();
    for (const r of this.activeRows) {
      const sec = r.sectorA || '기타';
      map.set(sec, (map.get(sec) || 0) + 1);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([sector, count]) => ({
        sector,
        count,
        pct: Number(((count / total) * 100).toFixed(1))
      }));
  });

  // Summary stats
  summaryStats = $derived.by(() => {
    const rows = this.activeRows;
    if (rows.length === 0) {
      return { count: 0, avgChange: 0, avgReturn3m: 0, topBreakout: null };
    }
    let totalChange = 0;
    let changeCount = 0;
    let totalReturn3m = 0;
    let return3mCount = 0;
    let topBreakout = rows[0];

    for (const r of rows) {
      if (r.changePct !== null) {
        totalChange += r.changePct;
        changeCount++;
      }
      if (r.return3m !== null) {
        totalReturn3m += r.return3m;
        return3mCount++;
      }
      if (r.breakoutPct !== null && (topBreakout.breakoutPct === null || r.breakoutPct > topBreakout.breakoutPct)) {
        topBreakout = r;
      }
    }

    return {
      count: rows.length,
      avgChange: changeCount > 0 ? Number((totalChange / changeCount).toFixed(2)) : 0,
      avgReturn3m: return3mCount > 0 ? Number((totalReturn3m / return3mCount).toFixed(2)) : 0,
      topBreakout
    };
  });

  // Stock history across all loaded data for drawer
  selectedStockHistory = $derived.by<StockRecord[]>(() => {
    if (!this.selectedStock) return [];
    const targetCode = this.selectedStock.code;
    const targetMarket = this.selectedStock.market;
    return this.allCategoryStocks
      .filter(s => s.code === targetCode && s.market === targetMarket)
      .sort((a, b) => b.recordDate.localeCompare(a.recordDate));
  });

  // Initialize and load manifest
  async init() {
    try {
      this.loadColumnPreferences();
      this.isLoading = true;
      const res = await fetch(`${base}/data/manifest.json`);
      if (!res.ok) throw new Error(`Failed to load manifest: ${res.statusText}`);
      this.manifest = await res.json();

      if (this.manifest && this.manifest.categories.length > 0) {
        const firstCat = this.manifest.categories[0];
        this.activeCategoryId = firstCat.id;
        this.selectedDate = firstCat.latestDate;
        this.selectedMonth = firstCat.months[0] || '';
        if (firstCat.dates.length > 0) {
          const latest = firstCat.dates[0];
          const prev5 = firstCat.dates[Math.min(4, firstCat.dates.length - 1)];
          this.dateRange = { start: prev5, end: latest };
        }

        // Fast load latest data first, then load the latest month
        await this.loadMonthData(this.activeCategoryId, this.selectedMonth);
      }
    } catch (err) {
      console.error('[ScreenerState] Init error:', err);
    } finally {
      this.isLoading = false;
    }
  }

  // Switch category (e.g. 60day_high -> 120day_high)
  async setCategory(catId: string) {
    if (this.activeCategoryId === catId) return;
    this.activeCategoryId = catId;
    this.monthCache.clear();
    this.allCategoryStocks = [];
    this.allCategoryMacros = [];
    const cat = this.activeCategory;
    if (cat) {
      this.selectedDate = cat.latestDate;
      this.selectedMonth = cat.months[0] || '';
      if (cat.dates.length > 0) {
        const latest = cat.dates[0];
        const prev5 = cat.dates[Math.min(4, cat.dates.length - 1)];
        this.dateRange = { start: prev5, end: latest };
      }
      await this.loadMonthData(catId, this.selectedMonth);
    }
  }

  // Load a single month JSON
  async loadMonthData(catId: string, month: string) {
    if (!month) return;
    const cacheKey = `${catId}_${month}`;
    if (this.monthCache.has(cacheKey)) return;

    try {
      this.isLoading = true;
      const res = await fetch(`${base}/data/${catId}/${month}.json`);
      if (!res.ok) return;
      const data = await res.json();
      this.monthCache.set(cacheKey, { stocks: data.stocks || [], macros: data.macros || [] });

      // Merge into allCategory arrays
      this.allCategoryStocks = [...this.allCategoryStocks, ...(data.stocks || [])];
      this.allCategoryMacros = [...this.allCategoryMacros, ...(data.macros || [])];
    } catch (e) {
      console.error(`Failed to load ${month}.json:`, e);
    } finally {
      this.isLoading = false;
    }
  }

  // Load months required by the active target dates or mode
  async ensureDataForTarget() {
    const cat = this.activeCategory;
    if (!cat) return;

    if (this.dateFilterMode === 'month') {
      if (this.selectedMonth) {
        await this.loadMonthData(cat.id, this.selectedMonth);
      }
    } else if (this.dateFilterMode === 'single') {
      if (this.selectedDate) {
        const m = this.selectedDate.replace(/-/g, '').slice(0, 6);
        await this.loadMonthData(cat.id, m);
      }
    } else if (this.dateFilterMode === 'range') {
      if (this.dateRange.start && this.dateRange.end) {
        const startMonth = this.dateRange.start.replace(/-/g, '').slice(0, 6);
        const endMonth = this.dateRange.end.replace(/-/g, '').slice(0, 6);
        for (const m of cat.months) {
          if (m >= startMonth && m <= endMonth) {
            await this.loadMonthData(cat.id, m);
          }
        }
      }
    }
  }

  // Pre-fetch all months in background for full multi-month search
  async loadAllMonths() {
    const cat = this.activeCategory;
    if (!cat) return;
    this.isLoading = true;
    for (const m of cat.months) {
      await this.loadMonthData(cat.id, m);
    }
    this.isLoading = false;
  }

  // Navigation helpers: next / prev trading day
  prevTradingDay() {
    const dates = this.availableDates;
    const idx = dates.indexOf(this.selectedDate);
    if (idx !== -1 && idx < dates.length - 1) {
      this.selectedDate = dates[idx + 1];
      this.ensureDataForTarget();
    }
  }

  nextTradingDay() {
    const dates = this.availableDates;
    const idx = dates.indexOf(this.selectedDate);
    if (idx > 0) {
      this.selectedDate = dates[idx - 1];
      this.ensureDataForTarget();
    }
  }

  // Market toggles
  toggleMarket(market: string) {
    if (market === 'all') {
      this.selectedMarkets = ['all'];
      return;
    }
    let next = this.selectedMarkets.filter(m => m !== 'all');
    if (next.includes(market)) {
      next = next.filter(m => m !== market);
      if (next.length === 0) next = ['all'];
    } else {
      next.push(market);
    }
    this.selectedMarkets = next;
  }

  // Quick preset toggle
  setQuickPreset(presetId: string) {
    this.quickPreset = this.quickPreset === presetId ? null : presetId;
  }

  openStockDetail(stock: StockRecord) {
    this.selectedStock = stock;
    this.isDrawerOpen = true;
    // ensure all months are loaded so we can see full historical breakdown
    this.loadAllMonths();
  }

  closeStockDetail() {
    this.isDrawerOpen = false;
  }

  // Column Visibility Controls
  toggleColumn(field: string) {
    const col = ALL_COLUMNS.find(c => c.field === field);
    if (col?.required) return; // 필수 컬럼은 숨김 방지

    const current = this.visibleColumns[field] !== false;
    this.visibleColumns = {
      ...this.visibleColumns,
      [field]: !current
    };
    this.saveColumnPreferences();
  }

  isColumnVisible(field: string): boolean {
    if (this.visibleColumns[field] !== undefined) {
      return this.visibleColumns[field];
    }
    const col = ALL_COLUMNS.find(c => c.field === field);
    return col ? col.defaultVisible : true;
  }

  showAllColumns() {
    const map: Record<string, boolean> = {};
    for (const c of ALL_COLUMNS) {
      map[c.field] = true;
    }
    this.visibleColumns = map;
    this.saveColumnPreferences();
  }

  resetColumns() {
    this.visibleColumns = getDefaultVisibility();
    this.saveColumnPreferences();
  }

  private saveColumnPreferences() {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('quant_screener_columns', JSON.stringify(this.visibleColumns));
      } catch {}
    }
  }

  loadColumnPreferences() {
    if (typeof localStorage !== 'undefined') {
      try {
        const saved = localStorage.getItem('quant_screener_columns');
        if (saved) {
          this.visibleColumns = { ...getDefaultVisibility(), ...JSON.parse(saved) };
        }
      } catch {}
    }
  }
}

export const screener = new ScreenerState();
