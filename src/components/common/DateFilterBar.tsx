import React, { useMemo } from 'react';
import { Calendar, CalendarRange, RotateCcw, AlertCircle } from 'lucide-react';
import {
  DateFilterState,
  DateFilterMode,
  createDefaultDateFilter,
  extractAvailableMonths,
  getCurrentYearMonth,
  getMonthRange,
  getThisWeekRange,
  resolveDateRange,
} from '../../utils/dateFilters';

interface DateFilterBarProps {
  value: DateFilterState;
  onChange: (next: DateFilterState) => void;
  availableDates?: (string | undefined | null)[];
  title?: string;
  compact?: boolean;
}

export const DateFilterBar: React.FC<DateFilterBarProps> = ({
  value,
  onChange,
  availableDates = [],
  title = 'Period Filter',
  compact = false,
}) => {
  const monthOptions = useMemo(
    () => extractAvailableMonths(availableDates, 12),
    [availableDates]
  );

  const resolved = useMemo(() => resolveDateRange(value), [value]);

  const selectMode = (mode: DateFilterMode) => {
    if (mode === 'all') {
      onChange(createDefaultDateFilter('all'));
      return;
    }
    if (mode === 'this-week' || mode === 'this-month') {
      onChange({ ...value, mode });
      return;
    }
    if (mode === 'month') {
      onChange({
        ...value,
        mode: 'month',
        month: value.month || monthOptions[0]?.value || getCurrentYearMonth(),
      });
      return;
    }
    onChange({ ...value, mode: 'custom' });
  };

  return (
    <div
      className={`bg-white border border-slate-200 rounded-xl shadow-xs ${
        compact ? 'p-3' : 'p-4'
      } space-y-3`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left: Quick Preset Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 mr-1">
            <Calendar className="w-3.5 h-3.5 text-amber-600" />
            <span>{title}:</span>
          </span>

          {(
            [
              { id: 'all', label: 'All Dates' },
              { id: 'this-week', label: 'This Week' },
              { id: 'this-month', label: 'This Month' },
              { id: 'month', label: 'Choose Month' },
              { id: 'custom', label: 'Date Range' },
            ] as { id: DateFilterMode; label: string }[]
          ).map((btn) => {
            const active = value.mode === btn.id;
            return (
              <button
                key={btn.id}
                type="button"
                onClick={() => selectMode(btn.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  active
                    ? 'bg-amber-400 text-slate-950 shadow-2xs'
                    : 'bg-slate-50 hover:bg-amber-50 text-slate-700 border border-slate-200'
                }`}
              >
                {btn.label}
              </button>
            );
          })}
        </div>

        {/* Right: Active Scope Pill + Reset */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span
            className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] border ${
              resolved.error
                ? 'bg-rose-50 text-rose-800 border-rose-200'
                : value.mode === 'all'
                ? 'bg-slate-50 text-slate-600 border-slate-200'
                : 'bg-amber-50 text-amber-900 border-amber-200'
            }`}
          >
            {resolved.label}
          </span>

          {value.mode !== 'all' && (
            <button
              type="button"
              onClick={() => onChange(createDefaultDateFilter('all'))}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              title="Reset date filter"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Dynamic Month Selector Controls */}
      {value.mode === 'month' && (
        <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-2">
            <label
              htmlFor="dynamic-month-select"
              className="font-bold text-slate-700 whitespace-nowrap"
            >
              Month List:
            </label>
            <select
              id="dynamic-month-select"
              value={
                monthOptions.some((m) => m.value === value.month) ? value.month : '__custom__'
              }
              onChange={(e) => {
                if (e.target.value !== '__custom__') {
                  onChange({ ...value, mode: 'month', month: e.target.value });
                }
              }}
              className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-semibold text-slate-900 outline-none focus:border-amber-500 cursor-pointer"
            >
              {!monthOptions.some((m) => m.value === value.month) && (
                <option value="__custom__">{resolved.label}</option>
              )}
              {monthOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                  {opt.count > 0 ? ` (${opt.count} entries)` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label
              htmlFor="direct-month-picker"
              className="font-semibold text-slate-500 whitespace-nowrap"
            >
              Or pick any month:
            </label>
            <input
              id="direct-month-picker"
              type="month"
              value={value.month}
              onChange={(e) =>
                onChange({
                  ...value,
                  mode: 'month',
                  month: e.target.value || getCurrentYearMonth(),
                })
              }
              className="px-2.5 py-1 bg-slate-50 border border-slate-300 rounded-lg font-mono text-xs text-slate-900 outline-none focus:border-amber-500"
            />
          </div>
        </div>
      )}

      {/* Custom Date Range Picker Controls */}
      {value.mode === 'custom' && (
        <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-600 font-bold">
            <CalendarRange className="w-3.5 h-3.5 text-amber-600" />
            <span>Custom Range:</span>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="filter-from-date" className="text-slate-500 font-semibold">
              From
            </label>
            <input
              id="filter-from-date"
              type="date"
              value={value.startDate}
              onChange={(e) =>
                onChange({ ...value, mode: 'custom', startDate: e.target.value })
              }
              className="px-2.5 py-1 bg-slate-50 border border-slate-300 rounded-lg font-mono text-xs text-slate-900 outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="filter-to-date" className="text-slate-500 font-semibold">
              To
            </label>
            <input
              id="filter-to-date"
              type="date"
              value={value.endDate}
              onChange={(e) =>
                onChange({ ...value, mode: 'custom', endDate: e.target.value })
              }
              className="px-2.5 py-1 bg-slate-50 border border-slate-300 rounded-lg font-mono text-xs text-slate-900 outline-none focus:border-amber-500"
            />
          </div>

          {resolved.error && (
            <span className="inline-flex items-center gap-1 text-rose-700 font-semibold text-xs">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{resolved.error}</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

interface QuickDatePresetsBarProps {
  fromDate: string;
  toDate: string;
  onSelectRange: (fromDate: string, toDate: string) => void;
  availableDates?: (string | undefined | null)[];
}

export const QuickDatePresetsBar: React.FC<QuickDatePresetsBarProps> = ({
  fromDate,
  toDate,
  onSelectRange,
  availableDates = [],
}) => {
  const weekRange = useMemo(() => getThisWeekRange(), []);
  const thisMonthRange = useMemo(() => getMonthRange(getCurrentYearMonth()), []);
  const monthOptions = useMemo(() => extractAvailableMonths(availableDates, 12), [availableDates]);

  const isAll = !fromDate && !toDate;
  const isThisWeek = fromDate === weekRange.from && toDate === weekRange.to;
  const isThisMonth = fromDate === thisMonthRange.from && toDate === thisMonthRange.to;
  const matchedMonth = monthOptions.find((m) => {
    const r = getMonthRange(m.value);
    return r.from === fromDate && r.to === toDate;
  });

  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs">
      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mr-1">
        Quick Period:
      </span>
      <button
        type="button"
        onClick={() => onSelectRange('', '')}
        className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
          isAll ? 'bg-slate-900 text-amber-300' : 'bg-slate-100 text-slate-700 hover:bg-amber-50'
        }`}
      >
        All Dates
      </button>
      <button
        type="button"
        onClick={() => onSelectRange(weekRange.from, weekRange.to)}
        className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
          isThisWeek ? 'bg-amber-400 text-slate-950' : 'bg-slate-100 text-slate-700 hover:bg-amber-50'
        }`}
      >
        This Week
      </button>
      <button
        type="button"
        onClick={() => onSelectRange(thisMonthRange.from, thisMonthRange.to)}
        className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
          isThisMonth ? 'bg-amber-400 text-slate-950' : 'bg-slate-100 text-slate-700 hover:bg-amber-50'
        }`}
      >
        This Month
      </button>
      <select
        aria-label="Select Month"
        value={matchedMonth ? matchedMonth.value : ''}
        onChange={(e) => {
          if (!e.target.value) {
            onSelectRange('', '');
            return;
          }
          const r = getMonthRange(e.target.value);
          onSelectRange(r.from, r.to);
        }}
        className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 font-semibold text-slate-800 outline-none focus:border-amber-500 cursor-pointer"
      >
        <option value="">Month List...</option>
        {monthOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}{opt.count > 0 ? ` (${opt.count})` : ''}
          </option>
        ))}
      </select>
    </div>
  );
};
