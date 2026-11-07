export interface StockRecord {
  id: string;
  recordDate: string;        // YYYY-MM-DD
  sourceType: string;        // krx, yf_sp500, yf_nasdaq, ...
  sourceFile: string;
  market: string;            // kospi, kosdaq, konex, sp500, nasdaq, sse, szse, tse, twse, hose, etc.
  code: string;              // Ticker / code
  name: string;              // Company name
  sectorA: string;           // Major sector
  sectorB: string;           // Sub sector
  prevHighDate: string | null;
  daysSincePrevHigh: number | null; // Diff in days from recordDate
  prevHigh: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  change: number | null;
  changePct: number | null;
  breakoutPct: number | null;
  return1w: number | null;
  return3m: number | null;
  volume: number | null;
  tradingValue: number | null;
  marketCap: number | null;
  appearCount?: number;      // Calculated in memory for selected date range
}

export interface MacroRecord {
  recordDate: string;
  sourceFile: string;
  category: string;
  name: string;
  ticker: string;
  prevHighDate: string | null;
  prevHigh: number | null;
  close: number | null;
  change: number | null;
  changePct: number | null;
  daysSincePrevHigh: number | null;
}

export interface CategoryMeta {
  id: string;
  label: string;
  months: string[];
  dates: string[];
  latestDate: string;
  markets: string[];
  totalRecords: number;
}

export interface Manifest {
  generatedAt: string;
  categories: CategoryMeta[];
}

export type DateFilterMode = 'single' | 'range' | 'month';
export type ColumnPreset = 'all' | 'momentum' | 'price' | 'compact';
export type ColorScheme = 'kr' | 'us'; // KR: red=up, blue=down; US: green=up, red=down
