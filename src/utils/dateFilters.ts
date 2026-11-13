/**
 * Unified Date Normalization & Filtering Engine
 * Supports Gregorian ISO dates (YYYY-MM-DD), localized date/time strings,
 * and Hijri date prefixes (144x-MM-DD) across dashboards and reports.
 */

export type DateFilterMode = 'all' | 'this-week' | 'this-month' | 'month' | 'custom';

export interface DateFilterState {
  mode: DateFilterMode;
  month: string; // YYYY-MM format
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}

export interface ResolvedDateRange {
  from: string | null;
  to: string | null;
  label: string;
  error: string | null;
}

const PAD = (n: number): string => String(n).padStart(2, '0');

export const formatLocalIsoDate = (d: Date): string =>
  `${d.getFullYear()}-${PAD(d.getMonth() + 1)}-${PAD(d.getDate())}`;

export const getTodayIsoLocal = (): string => formatLocalIsoDate(new Date());

export const getCurrentYearMonth = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${PAD(now.getMonth() + 1)}`;
};

export const createDefaultDateFilter = (mode: DateFilterMode = 'all'): DateFilterState => ({
  mode,
  month: getCurrentYearMonth(),
  startDate: '',
  endDate: '',
});

/**
 * Converts tabular Islamic (Hijri) calendar YYYY-MM-DD (year 1400..1500)
 * into approximate Gregorian YYYY-MM-DD using standard Kuwaity tabular algorithm.
 */
function hijriToGregorianIso(hYear: number, hMonth: number, hDay: number): string | null {
  if (hYear < 1400 || hYear > 1500 || hMonth < 1 || hMonth > 12 || hDay < 1 || hDay > 30) {
    return null;
  }
  const jd =
    Math.floor((11 * hYear + 3) / 30) +
    354 * hYear +
    30 * hMonth -
    Math.floor((hMonth - 1) / 2) +
    hDay +
    1948440 -
    385;

  let l = jd + 68569;
  const n = Math.floor((4 * l) / 146097);
  l = l - Math.floor((146097 * n + 3) / 4);
  const i = Math.floor((4000 * (l + 1)) / 1461001);
  l = l - Math.floor((1461 * i) / 4) + 31;
  const j = Math.floor((80 * l) / 2447);
  const day = l - Math.floor((2447 * j) / 80);
  l = Math.floor(j / 11);
  const month = j + 2 - 12 * l;
  const year = 100 * (n - 49) + i + l;

  return `${year}-${PAD(month)}-${PAD(day)}`;
}

/**
 * Normalizes any supported date/timestamp string into Gregorian YYYY-MM-DD.
 */
export const toIsoDate = (raw?: string | null): string | null => {
  if (!raw) return null;
  const trimmed = String(raw).trim();
  if (!trimmed || trimmed === 'N/A') return null;

  // Match leading YYYY-MM-DD (handles ISO timestamps and space-separated time)
  const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10);
    const day = parseInt(isoMatch[3], 10);
    if (year >= 1400 && year <= 1550) {
      return hijriToGregorianIso(year, month, day);
    }
    if (year >= 1900 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${year}-${PAD(month)}-${PAD(day)}`;
    }
  }

  // Match DD/MM/YYYY or MM/DD/YYYY locale date prefixes
  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (slashMatch) {
    const a = parseInt(slashMatch[1], 10);
    const b = parseInt(slashMatch[2], 10);
    const year = parseInt(slashMatch[3], 10);
    // Disambiguate DD/MM vs MM/DD: if first part > 12 it is definitely day
    const month = a > 12 ? b : b > 12 ? a : b;
    const day = a > 12 ? a : b > 12 ? b : a;
    if (year >= 1900 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${year}-${PAD(month)}-${PAD(day)}`;
    }
  }

  // Fallback native Date parse
  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime()) && parsed.getFullYear() >= 1900) {
    return formatLocalIsoDate(parsed);
  }

  return null;
};

/**
 * Returns Monday..Sunday inclusive range for the week containing `referenceDate`.
 */
export const getThisWeekRange = (referenceDate = new Date()): { from: string; to: string } => {
  const ref = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
  const day = ref.getDay(); // 0=Sun..6=Sat
  const diffToMon = day === 0 ? -6 : 1 - day;
  const start = new Date(ref);
  start.setDate(ref.getDate() + diffToMon);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return {
    from: formatLocalIsoDate(start),
    to: formatLocalIsoDate(end),
  };
};

/**
 * Returns first..last day of a given YYYY-MM (defaults to current calendar month).
 */
export const getMonthRange = (ym?: string): { from: string; to: string; label: string } => {
  const fallback = getCurrentYearMonth();
  const target = ym && /^\d{4}-\d{2}$/.test(ym) ? ym : fallback;
  const [yStr, mStr] = target.split('-');
  const year = parseInt(yStr, 10);
  const monthIdx = parseInt(mStr, 10) - 1;
  const start = new Date(year, monthIdx, 1);
  const end = new Date(year, monthIdx + 1, 0);
  const label = start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  return {
    from: formatLocalIsoDate(start),
    to: formatLocalIsoDate(end),
    label,
  };
};

/**
 * Resolves a DateFilterState into explicit YYYY-MM-DD bounds + label + validation error.
 */
export const resolveDateRange = (filter: DateFilterState): ResolvedDateRange => {
  switch (filter.mode) {
    case 'all':
      return { from: null, to: null, label: 'All Records', error: null };

    case 'this-week': {
      const { from, to } = getThisWeekRange();
      return { from, to, label: `This Week (${from} to ${to})`, error: null };
    }

    case 'this-month': {
      const { from, to, label } = getMonthRange(getCurrentYearMonth());
      return { from, to, label: `This Month (${label})`, error: null };
    }

    case 'month': {
      const { from, to, label } = getMonthRange(filter.month);
      return { from, to, label, error: null };
    }

    case 'custom': {
      const from = filter.startDate || null;
      const to = filter.endDate || null;
      if (from && to && from > to) {
        return {
          from: null,
          to: null,
          label: 'Invalid Date Range',
          error: 'Start date cannot be later than End date.',
        };
      }
      if (!from && !to) {
        return { from: null, to: null, label: 'Custom Range (select dates)', error: null };
      }
      const desc =
        from && to ? `${from} to ${to}` : from ? `From ${from}` : `Until ${to}`;
      return { from, to, label: desc, error: null };
    }
  }
};

/**
 * Tests whether a raw record date falls inside the active DateFilterState.
 */
export const matchesDateFilter = (
  rawDate: string | undefined | null,
  filter: DateFilterState
): boolean => {
  if (filter.mode === 'all') return true;
  const { from, to, error } = resolveDateRange(filter);
  if (error) return false;
  if (!from && !to) return true;

  const iso = toIsoDate(rawDate);
  if (!iso) return false;

  if (from && iso < from) return false;
  if (to && iso > to) return false;
  return true;
};

/**
 * Builds a dynamic sorted list of YYYY-MM options from dataset dates + rolling 12 months.
 */
export const extractAvailableMonths = (
  rawDates: (string | undefined | null)[],
  rollingCount = 12
): { value: string; label: string; count: number }[] => {
  const counts = new Map<string, number>();

  rawDates.forEach((raw) => {
    const iso = toIsoDate(raw);
    if (iso) {
      const ym = iso.slice(0, 7);
      counts.set(ym, (counts.get(ym) || 0) + 1);
    }
  });

  // Ensure the last N rolling months are always selectable even if sparse
  const now = new Date();
  for (let i = 0; i < rollingCount; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const ym = `${d.getFullYear()}-${PAD(d.getMonth() + 1)}`;
    if (!counts.has(ym)) {
      counts.set(ym, 0);
    }
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([ym, count]) => {
      const { label } = getMonthRange(ym);
      return { value: ym, label, count };
    });
};

