export function getChartLinks(market: string, code: string) {
  const m = (market || '').toLowerCase();
  const c = (code || '').trim();

  let tvSymbol = c;
  let naverUrl: string | null = null;
  let yahooUrl = `https://finance.yahoo.com/quote/${c}`;

  if (m === 'kospi' || m === 'kosdaq' || m === 'konex' || m === 'krx') {
    naverUrl = `https://finance.naver.com/item/main.naver?code=${c}`;
    tvSymbol = `KRX:${c}`;
    yahooUrl = `https://finance.yahoo.com/quote/${c}.${m === 'kosdaq' ? 'KQ' : 'KS'}`;
  } else if (m === 'sp500' || m === 'nasdaq') {
    tvSymbol = `NASDAQ:${c}`;
  } else if (m === 'sse') {
    tvSymbol = `SSE:${c}`;
    yahooUrl = `https://finance.yahoo.com/quote/${c}.SS`;
  } else if (m === 'szse') {
    tvSymbol = `SZSE:${c}`;
    yahooUrl = `https://finance.yahoo.com/quote/${c}.SZ`;
  } else if (m === 'tse') {
    tvSymbol = `TSE:${c}`;
    yahooUrl = `https://finance.yahoo.com/quote/${c}.T`;
  } else if (m === 'twse') {
    tvSymbol = `TWSE:${c}`;
    yahooUrl = `https://finance.yahoo.com/quote/${c}.TW`;
  } else if (m === 'hose') {
    tvSymbol = `HOSE:${c}`;
    yahooUrl = `https://finance.yahoo.com/quote/${c}.VN`;
  }

  const tvUrl = `https://kr.tradingview.com/chart/?symbol=${encodeURIComponent(tvSymbol)}`;

  return {
    tradingView: tvUrl,
    naver: naverUrl,
    yahoo: yahooUrl
  };
}

export function getMarketFlag(market: string): string {
  const m = (market || '').toLowerCase();
  if (m.includes('kospi') || m.includes('kosdaq') || m.includes('konex') || m.includes('krx')) return '🇰🇷';
  if (m.includes('sp500') || m.includes('nasdaq')) return '🇺🇸';
  if (m.includes('sse') || m.includes('szse')) return '🇨🇳';
  if (m.includes('tse')) return '🇯🇵';
  if (m.includes('twse')) return '🇹🇼';
  if (m.includes('hose')) return '🇻🇳';
  return '🌐';
}

export function getMarketLabel(market: string): string {
  const m = (market || '').toUpperCase();
  switch (m) {
    case 'KOSPI': return 'KOSPI';
    case 'KOSDAQ': return 'KOSDAQ';
    case 'KONEX': return 'KONEX';
    case 'KRX': return 'KRX';
    case 'SP500': return 'S&P 500';
    case 'NASDAQ': return 'NASDAQ';
    case 'SSE': return '상해 (SSE)';
    case 'SZSE': return '심천 (SZSE)';
    case 'TSE': return '도쿄 (TSE)';
    case 'TWSE': return '대만 (TWSE)';
    case 'HOSE': return '호치민 (HOSE)';
    default: return m;
  }
}
