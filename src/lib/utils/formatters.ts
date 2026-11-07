import type { ColorScheme } from '$lib/types/screener';

export function formatNumber(val: number | null | undefined, decimals = 0): string {
  if (val === null || val === undefined || Number.isNaN(val)) return '-';
  return val.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

export function formatCompactNumber(val: number | null | undefined): string {
  if (val === null || val === undefined || Number.isNaN(val)) return '-';
  if (Math.abs(val) >= 1_000_000_000) return (val / 1_000_000_000).toFixed(1) + 'B';
  if (Math.abs(val) >= 1_000_000) return (val / 1_000_000).toFixed(1) + 'M';
  if (Math.abs(val) >= 1_000) return (val / 1_000).toFixed(1) + 'K';
  return val.toLocaleString();
}

export function formatPercent(val: number | null | undefined, includePlus = true): string {
  if (val === null || val === undefined || Number.isNaN(val)) return '-';
  const prefix = includePlus && val > 0 ? '+' : '';
  return `${prefix}${val.toFixed(2)}%`;
}

export function getChangeColorClass(val: number | null | undefined, scheme: ColorScheme = 'kr'): string {
  if (val === null || val === undefined || val === 0) return 'text-gray-400 dark:text-gray-400';
  if (val > 0) {
    return scheme === 'kr' ? 'text-red-500 font-semibold' : 'text-emerald-500 font-semibold';
  } else {
    return scheme === 'kr' ? 'text-blue-500 font-semibold' : 'text-red-500 font-semibold';
  }
}

export function getChangeBgClass(val: number | null | undefined, scheme: ColorScheme = 'kr'): string {
  if (val === null || val === undefined || val === 0) return 'bg-transparent';
  if (val > 0) {
    return scheme === 'kr' ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500';
  } else {
    return scheme === 'kr' ? 'bg-blue-500/10 text-blue-500' : 'bg-red-500/10 text-red-500';
  }
}
