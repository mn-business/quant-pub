import fs from 'node:fs';
import path from 'node:path';

const RESULT_DIR = path.resolve('result');
const OUTPUT_DIR = path.resolve('static/data');

// Simple robust CSV line parser handling quotes
function parseCsv(content) {
  const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  function parseLine(line) {
    const fields = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        fields.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    fields.push(current.trim());
    return fields;
  }

  const rawHeaders = parseLine(lines[0]);
  const headers = rawHeaders.map(h => h.trim().replace(/^"|"$/g, ''));
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    if (values.length === headers.length || values.some(v => v.length > 0)) {
      const row = {};
      headers.forEach((h, idx) => {
        let val = values[idx] !== undefined ? values[idx].trim().replace(/^"|"$/g, '') : '';
        row[h] = val;
      });
      rows.push(row);
    }
  }

  return { headers, rows };
}

function parseNumber(val) {
  if (val === undefined || val === null) return null;
  const s = String(val).trim().replace(/,/g, '').replace(/%/g, '').replace(/^\+/, '');
  if (s === '' || s === 'N/A' || s === 'nan' || s === '-' || s === 'null') return null;
  const num = Number(s);
  return Number.isFinite(num) ? num : null;
}

function parseDate(dateStr) {
  if (!dateStr) return null;
  const cleaned = String(dateStr).trim().replace(/\./g, '-').replace(/\//g, '-');
  return /^\d{4}-\d{2}-\d{2}$/.test(cleaned) ? cleaned : dateStr;
}

function calcDaysDiff(date1Str, date2Str) {
  if (!date1Str || !date2Str) return null;
  try {
    const d1 = new Date(date1Str);
    const d2 = new Date(date2Str);
    const diffTime = d1.getTime() - d2.getTime();
    if (Number.isNaN(diffTime)) return null;
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
  } catch {
    return null;
  }
}

function formatYYYYMMDD(str) {
  if (!str) return '';
  if (str.length === 8 && /^\d{8}$/.test(str)) {
    return `${str.slice(0, 4)}-${str.slice(4, 6)}-${str.slice(6, 8)}`;
  }
  return str;
}

function getCategoryLabel(id) {
  switch (id) {
    case '60day_high':
      return '60일 신고가';
    case '120day_high':
      return '120일 신고가';
    case '52w_high':
      return '52주 신고가';
    case 'volume_surge':
      return '거래량 급증';
    default:
      return id.replace(/_/g, ' ').toUpperCase();
  }
}

function getMarketCode(marketRaw, filenameSource) {
  const m = (marketRaw || '').toLowerCase().trim();
  const f = (filenameSource || '').toLowerCase().trim();

  if (m === 'kospi' || m === 'kosdaq' || m === 'konex') return m;
  if (m === 's&p500' || m === 'sp500' || f.includes('sp500')) return 'sp500';
  if (m === 'nasdaq' || f.includes('nasdaq')) return 'nasdaq';
  if (m === 'sse' || f.includes('sse')) return 'sse';
  if (m === 'szse' || f.includes('szse')) return 'szse';
  if (m === 'tse' || f.includes('tse')) return 'tse';
  if (m === 'twse' || f.includes('twse')) return 'twse';
  if (m === 'hose' || f.includes('hose')) return 'hose';
  
  if (f === 'krx' || f === 'yf_krx') return 'krx';
  if (f === 'yf') return 'yf_mixed';
  return m || f || 'other';
}

function main() {
  console.log('[build-data] Starting data pipeline indexing...');
  if (!fs.existsSync(RESULT_DIR)) {
    console.warn(`[build-data] result dir does not exist at ${RESULT_DIR}`);
    return;
  }

  // 1. Detect 1-depth folders
  const dirEntries = fs.readdirSync(RESULT_DIR, { withFileTypes: true });
  const categoryDirs = dirEntries.filter(d => d.isDirectory()).map(d => d.name);

  console.log(`[build-data] Found 1-depth categories:`, categoryDirs);

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    categories: []
  };

  for (const catId of categoryDirs) {
    const catPath = path.join(RESULT_DIR, catId);
    const catOutDir = path.join(OUTPUT_DIR, catId);
    if (!fs.existsSync(catOutDir)) {
      fs.mkdirSync(catOutDir, { recursive: true });
    }

    // Read months or files
    const subEntries = fs.readdirSync(catPath, { withFileTypes: true });
    const monthDirs = subEntries.filter(d => d.isDirectory() && /^\d{6}$/.test(d.name)).map(d => d.name).sort();

    const catDates = new Set();
    const catMarkets = new Set();
    let catTotalRecords = 0;
    const monthsData = [];

    for (const month of monthDirs) {
      const monthPath = path.join(catPath, month);
      const csvFiles = fs.readdirSync(monthPath).filter(f => f.endsWith('.csv')).sort();

      const monthStocks = [];
      const monthMacros = [];

      for (const csvFile of csvFiles) {
        // Filename pattern: YYYYMMDD_<type>.csv
        const match = csvFile.match(/^(\d{8})_(.+)\.csv$/i);
        if (!match) continue;
        const rawDate = match[1];
        const sourceType = match[2].toLowerCase();
        const recordDate = formatYYYYMMDD(rawDate);
        catDates.add(recordDate);

        const filePath = path.join(monthPath, csvFile);
        const content = fs.readFileSync(filePath, 'utf-8');
        const { rows } = parseCsv(content);

        if (sourceType === 'macro') {
          // Macro CSV: 구분,지표명,티커,기존최고가달성일,기존최고가,당일종가,대비,등락률
          for (const r of rows) {
            const prevHigh = parseNumber(r['기존최고가']);
            const close = parseNumber(r['당일종가']);
            const change = parseNumber(r['대비']);
            const changePct = parseNumber(r['등락률']);
            const prevHighDate = parseDate(r['기존최고가달성일']);
            const daysSincePrevHigh = calcDaysDiff(recordDate, prevHighDate);

            monthMacros.push({
              recordDate,
              sourceFile: csvFile,
              category: r['구분'] || '',
              name: r['지표명'] || '',
              ticker: r['티커'] || '',
              prevHighDate,
              prevHigh,
              close,
              change,
              changePct,
              daysSincePrevHigh
            });
          }
        } else {
          // Stock CSV: 13, 15, or 17 columns
          for (const r of rows) {
            const market = getMarketCode(r['시장구분'], sourceType);
            catMarkets.add(market);

            const prevHigh = parseNumber(r['기존최고가']);
            const close = parseNumber(r['당일종가']);
            const high = parseNumber(r['당일최고가']);
            const low = parseNumber(r['당일최저가']);
            const change = parseNumber(r['대비']);
            const changePct = parseNumber(r['등락률']);
            const return1w = parseNumber(r['1주 종가 상승률']);
            const return3m = parseNumber(r['3개월 종가 상승률']);
            const volume = parseNumber(r['종료일 거래량']);
            const tradingValue = parseNumber(r['종료일 거래금액(백만원)']);
            const marketCap = parseNumber(r['종료일 시가총액(억원)']);
            const prevHighDate = parseDate(r['기존최고가달성일']);
            const daysSincePrevHigh = calcDaysDiff(recordDate, prevHighDate);

            // Breakout strength %: ((close - prevHigh) / prevHigh) * 100
            let breakoutPct = null;
            if (close !== null && prevHigh !== null && prevHigh > 0) {
              breakoutPct = Number((((close - prevHigh) / prevHigh) * 100).toFixed(2));
            }

            const record = {
              id: `${recordDate}_${market}_${r['종목코드'] || r['티커'] || ''}`,
              recordDate,
              sourceType,
              sourceFile: csvFile,
              market,
              code: r['종목코드'] || r['티커'] || '',
              name: r['종목명'] || '',
              sectorA: r['섹터A'] || '',
              sectorB: r['섹터B'] || '',
              prevHighDate,
              daysSincePrevHigh,
              prevHigh,
              high,
              low,
              close,
              change,
              changePct,
              breakoutPct,
              return1w,
              return3m,
              volume,
              tradingValue,
              marketCap
            };

            monthStocks.push(record);
            catTotalRecords++;
          }
        }
      }

      // Save monthly JSON
      const monthData = {
        category: catId,
        month,
        stockCount: monthStocks.length,
        macroCount: monthMacros.length,
        stocks: monthStocks,
        macros: monthMacros
      };

      const monthOutFile = path.join(catOutDir, `${month}.json`);
      fs.writeFileSync(monthOutFile, JSON.stringify(monthData));
      console.log(`[build-data] Wrote ${monthOutFile} (stocks: ${monthStocks.length}, macros: ${monthMacros.length})`);

      monthsData.push({
        month,
        stockCount: monthStocks.length,
        macroCount: monthMacros.length
      });
    }

    const sortedDates = Array.from(catDates).sort().reverse(); // 최신순
    const latestDate = sortedDates[0] || '';

    // Create latest.json for instant load
    if (monthsData.length > 0) {
      const latestMonth = monthsData[monthsData.length - 1].month;
      const latestMonthFile = path.join(catOutDir, `${latestMonth}.json`);
      if (fs.existsSync(latestMonthFile)) {
        const latestData = JSON.parse(fs.readFileSync(latestMonthFile, 'utf-8'));
        const latestDateStocks = latestData.stocks.filter(s => s.recordDate === latestDate);
        const latestDateMacros = latestData.macros.filter(m => m.recordDate === latestDate);
        fs.writeFileSync(path.join(catOutDir, 'latest.json'), JSON.stringify({
          category: catId,
          latestDate,
          stocks: latestDateStocks,
          macros: latestDateMacros
        }));
      }
    }

    manifest.categories.push({
      id: catId,
      label: getCategoryLabel(catId),
      months: monthDirs.slice().reverse(),
      dates: sortedDates,
      latestDate,
      markets: Array.from(catMarkets).sort(),
      totalRecords: catTotalRecords
    });
  }

  const manifestPath = path.join(OUTPUT_DIR, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`[build-data] Successfully generated manifest.json at ${manifestPath}`);
}

main();
