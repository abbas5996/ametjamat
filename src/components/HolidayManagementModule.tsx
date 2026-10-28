import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Plus,
  Edit,
  Trash2,
  Search,
  X,
  CalendarDays,
  Clock,
  Tag,
  AlertCircle,
  CheckCircle2,
  Save,
  RefreshCw,
  Filter,
  Building2,
  Star,
  Repeat,
} from 'lucide-react';
import {
  HolidayRecord,
  WeekendConfig,
  HolidayType,
  DayOfWeek,
  getStoredHolidays,
  saveStoredHolidays,
  getStoredWeekendConfig,
  saveStoredWeekendConfig,
  generateHolidayId,
  HOLIDAY_TYPES,
  DEPARTMENTS,
  DAYS_OF_WEEK,
} from '../utils/holidayManagement';
import { UserProfile } from '../types';
import { appendActivityLog } from '../utils/rbac';

interface HolidayManagementModuleProps {
  currentUser: UserProfile;
  activeSubItemId: string;
  showToast: (msg: string) => void;
}

const HOLIDAY_TYPE_COLORS: Record<HolidayType, string> = {
  'Public Holiday':     'bg-amber-100 text-amber-800 border-amber-200',
  'Weekend':            'bg-slate-100 text-slate-700 border-slate-200',
  'Miqaat Holiday':     'bg-emerald-100 text-emerald-800 border-emerald-200',
  'Emergency Closure':  'bg-rose-100 text-rose-800 border-rose-200',
  'National Holiday':   'bg-blue-100 text-blue-800 border-blue-200',
};

const HOLIDAY_TYPE_ICONS: Record<HolidayType, React.ReactNode> = {
  'Public Holiday':     <Star className="w-3 h-3" />,
  'Weekend':            <CalendarDays className="w-3 h-3" />,
  'Miqaat Holiday':     <CheckCircle2 className="w-3 h-3" />,
  'Emergency Closure':  <AlertCircle className="w-3 h-3" />,
  'National Holiday':   <Building2 className="w-3 h-3" />,
};

const BLANK_HOLIDAY: Omit<HolidayRecord, 'id' | 'createdAt' | 'updatedAt'> = {
  title: '',
  type: 'Public Holiday',
  date: '',
  hijriDate: '',
  description: '',
  isRecurring: false,
  recurringYear: '1447-1448 Hijri',
  affectedDepartments: ['All'],
  createdBy: '',
};

export const HolidayManagementModule: React.FC<HolidayManagementModuleProps> = ({
  currentUser,
  activeSubItemId,
  showToast,
}) => {
  const [holidays, setHolidays] = useState<HolidayRecord[]>(() => getStoredHolidays());
  const [weekendConfig, setWeekendConfig] = useState<WeekendConfig>(() => getStoredWeekendConfig());
  const [activeTab, setActiveTab] = useState<'holidays' | 'weekends' | 'calendar'>('holidays');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<HolidayType | 'All'>('All');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(BLANK_HOLIDAY);
  const [selectedDepts, setSelectedDepts] = useState<string[]>(['All']);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // Sync active tab with sub item
  useEffect(() => {
    if (activeSubItemId === 'add-holiday') setActiveTab('holidays');
    else if (activeSubItemId === 'weekend-config') setActiveTab('weekends');
  }, [activeSubItemId]);

  const filteredHolidays = useMemo(() => {
    return holidays
      .filter((h) => {
        const q = searchQuery.toLowerCase();
        const matchQ = !q || h.title.toLowerCase().includes(q) || h.date.includes(q) || (h.hijriDate || '').includes(q);
        const matchType = filterType === 'All' || h.type === filterType;
        return matchQ && matchType;
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [holidays, searchQuery, filterType]);

  // Calendar-view months
  const calendarDays = useMemo(() => {
    const firstDay = new Date(selectedYear, selectedMonth, 1).getDay();
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const cells: (number | null)[] = Array(firstDay).fill(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [selectedMonth, selectedYear]);

  const holidayDatesForMonth = useMemo(() => {
    const prefix = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-`;
    const map: Record<number, HolidayRecord[]> = {};
    holidays.forEach((h) => {
      if (h.date.startsWith(prefix)) {
        const d = parseInt(h.date.split('-')[2], 10);
        if (!map[d]) map[d] = [];
        map[d].push(h);
      }
    });
    return map;
  }, [holidays, selectedMonth, selectedYear]);

  const isWeekendDay = (day: number | null) => {
    if (!day) return false;
    const date = new Date(selectedYear, selectedMonth, day);
    const dayName = DAYS_OF_WEEK[date.getDay()];
    return weekendConfig.offDays.includes(dayName);
  };

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...BLANK_HOLIDAY, createdBy: currentUser.username });
    setSelectedDepts(['All']);
    setShowModal(true);
  };

  const openEdit = (h: HolidayRecord) => {
    setEditingId(h.id);
    setForm({
      title: h.title,
      type: h.type,
      date: h.date,
      hijriDate: h.hijriDate || '',
      description: h.description || '',
      isRecurring: h.isRecurring,
      recurringYear: h.recurringYear || '1447-1448 Hijri',
      affectedDepartments: h.affectedDepartments,
      createdBy: h.createdBy,
    });
    setSelectedDepts(h.affectedDepartments);
    setShowModal(true);
  };

  const handleDelete = (h: HolidayRecord) => {
    if (!window.confirm(`Delete holiday "${h.title}"?`)) return;
    const updated = holidays.filter((x) => x.id !== h.id);
    setHolidays(updated);
    saveStoredHolidays(updated);
    appendActivityLog(currentUser.username, 'System Settings', 'Holiday Management', 'DELETE', `Deleted holiday: ${h.title} on ${h.date}`);
    showToast(`Holiday "${h.title}" deleted.`);
  };

  const handleSave = () => {
    if (!form.title.trim()) { showToast('Holiday title is required.'); return; }
    if (!form.date) { showToast('Date is required.'); return; }

    const now = new Date();
    const nowStr = `${now.toLocaleDateString()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    const finalRecord: HolidayRecord = {
      id: editingId || generateHolidayId(),
      title: form.title.trim(),
      type: form.type,
      date: form.date,
      hijriDate: form.hijriDate || undefined,
      description: form.description || undefined,
      isRecurring: form.isRecurring,
      recurringYear: form.isRecurring ? form.recurringYear : undefined,
      affectedDepartments: selectedDepts.length ? selectedDepts : ['All'],
      createdBy: form.createdBy || currentUser.username,
      createdAt: editingId ? (holidays.find((h) => h.id === editingId)?.createdAt || nowStr) : nowStr,
      updatedAt: nowStr,
    };

    let updated: HolidayRecord[];
    if (editingId) {
      updated = holidays.map((h) => (h.id === editingId ? finalRecord : h));
      appendActivityLog(currentUser.username, 'System Settings', 'Holiday Management', 'EDIT', `Updated holiday: ${finalRecord.title} on ${finalRecord.date}`);
    } else {
      updated = [finalRecord, ...holidays];
      appendActivityLog(currentUser.username, 'System Settings', 'Holiday Management', 'ADD', `Added holiday: ${finalRecord.title} on ${finalRecord.date}`);
    }

    setHolidays(updated);
    saveStoredHolidays(updated);
    setShowModal(false);
    showToast(`Holiday "${finalRecord.title}" ${editingId ? 'updated' : 'added'} successfully.`);
  };

  const handleWeekendToggle = (day: DayOfWeek) => {
    const newOffDays = weekendConfig.offDays.includes(day)
      ? weekendConfig.offDays.filter((d) => d !== day)
      : [...weekendConfig.offDays, day];
    const updated: WeekendConfig = { ...weekendConfig, offDays: newOffDays };
    setWeekendConfig(updated);
    saveStoredWeekendConfig(updated);
    showToast(`Weekend configuration updated.`);
  };

  const handleDeptToggle = (dept: string) => {
    if (dept === 'All') {
      setSelectedDepts(['All']);
    } else {
      const without = selectedDepts.filter((d) => d !== 'All');
      if (without.includes(dept)) {
        setSelectedDepts(without.filter((d) => d !== dept));
      } else {
        setSelectedDepts([...without, dept]);
      }
    }
  };

  const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div className="space-y-5">
      {/* Tab Navigation */}
      <div className="bg-white border border-amber-300/40 rounded-xl p-1.5 shadow-xs flex items-center gap-1.5 overflow-x-auto">
        {([
          { key: 'holidays', label: '1. Holiday Master', icon: <CalendarDays className="w-4 h-4" /> },
          { key: 'weekends', label: '2. Weekend Configuration', icon: <Clock className="w-4 h-4" /> },
          { key: 'calendar', label: '3. Calendar View', icon: <Calendar className="w-4 h-4" /> },
        ] as const).map(({ key, label, icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === key
                ? 'bg-amber-400 text-slate-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-amber-50'
            }`}
          >
            {icon}
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* ── Tab 1: Holiday Master ────────────────────────────────────────────── */}
      {activeTab === 'holidays' && (
        <div className="bg-white border border-amber-200/60 rounded-xl shadow-sm overflow-hidden">
          {/* Toolbar */}
          <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3 items-center justify-between">
            <div className="flex flex-wrap gap-2 items-center flex-1 min-w-0">
              <div className="relative flex-1 max-w-xs min-w-[180px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search holidays..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300/50 bg-slate-50"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-300/50 cursor-pointer"
                >
                  <option value="All">All Types</option>
                  {HOLIDAY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <button
              type="button"
              onClick={openAdd}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-black text-slate-950 bg-amber-400 hover:bg-amber-500 rounded-lg transition-all shadow-sm min-h-[36px] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Holiday
            </button>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-0 border-b border-slate-100">
            {(HOLIDAY_TYPES).map((t) => {
              const count = holidays.filter((h) => h.type === t).length;
              return (
                <div key={t} className="px-3 py-2.5 border-r border-slate-100 last:border-r-0 text-center">
                  <p className="text-xs text-slate-500 truncate">{t}</p>
                  <p className="text-lg font-black text-slate-900">{count}</p>
                </div>
              );
            })}
          </div>

          {/* Holiday Table */}
          <div className="overflow-x-auto">
            {filteredHolidays.length === 0 ? (
              <div className="p-10 text-center">
                <CalendarDays className="w-10 h-10 text-amber-300 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-700">No holidays found</p>
                <p className="text-xs text-slate-500 mt-1">Add a new holiday using the button above</p>
              </div>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80">
                    <th className="px-4 py-2.5 text-left font-bold text-slate-600 whitespace-nowrap">Date</th>
                    <th className="px-4 py-2.5 text-left font-bold text-slate-600">Title</th>
                    <th className="px-4 py-2.5 text-left font-bold text-slate-600 whitespace-nowrap">Type</th>
                    <th className="px-4 py-2.5 text-left font-bold text-slate-600 whitespace-nowrap hidden sm:table-cell">Hijri Date</th>
                    <th className="px-4 py-2.5 text-left font-bold text-slate-600 whitespace-nowrap hidden md:table-cell">Departments</th>
                    <th className="px-4 py-2.5 text-center font-bold text-slate-600 whitespace-nowrap hidden sm:table-cell">Recurring</th>
                    <th className="px-4 py-2.5 text-center font-bold text-slate-600 whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredHolidays.map((h) => (
                    <tr key={h.id} className="hover:bg-amber-50/40 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900 whitespace-nowrap">{h.date}</td>
                      <td className="px-4 py-3 max-w-[200px]">
                        <p className="font-semibold text-slate-900 truncate">{h.title}</p>
                        {h.description && <p className="text-slate-400 truncate mt-0.5">{h.description}</p>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${HOLIDAY_TYPE_COLORS[h.type]}`}>
                          {HOLIDAY_TYPE_ICONS[h.type]}
                          {h.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600 whitespace-nowrap hidden sm:table-cell">{h.hijriDate || '—'}</td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-slate-600 truncate block max-w-[140px]">
                          {h.affectedDepartments.join(', ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center hidden sm:table-cell">
                        {h.isRecurring
                          ? <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold"><Repeat className="w-3 h-3" />Yes</span>
                          : <span className="text-slate-400">—</span>
                        }
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(h)}
                            className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-md transition-colors cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(h)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {filteredHolidays.length > 0 && (
            <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50 text-[11px] text-slate-500 flex justify-between">
              <span>Showing {filteredHolidays.length} of {holidays.length} holidays</span>
              <span>Last updated by @{currentUser.username}</span>
            </div>
          )}
        </div>
      )}

      {/* ── Tab 2: Weekend Configuration ────────────────────────────────────── */}
      {activeTab === 'weekends' && (
        <div className="space-y-4">
          <div className="bg-white border border-amber-200/60 rounded-xl shadow-sm p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              Weekend & Off-Day Configuration
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Select which days of the week are considered off-days / weekends for Jamaat operations.
            </p>
            <div className="grid grid-cols-7 gap-2">
              {DAYS_OF_WEEK.map((day) => {
                const isOff = weekendConfig.offDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleWeekendToggle(day)}
                    className={`rounded-xl py-4 flex flex-col items-center gap-1.5 text-xs font-bold transition-all border-2 cursor-pointer ${
                      isOff
                        ? 'bg-amber-400 border-amber-500 text-slate-950 shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-amber-300 hover:bg-amber-50'
                    }`}
                  >
                    <span className="text-[10px] uppercase tracking-wide">{day.slice(0, 3)}</span>
                    <span className="text-lg">{isOff ? '🌙' : '☀️'}</span>
                    {isOff && <span className="text-[9px] bg-slate-900/20 px-1.5 py-0.5 rounded-full">Off Day</span>}
                  </button>
                );
              })}
            </div>
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs font-semibold text-amber-900">
                Current Off Days: {weekendConfig.offDays.join(', ') || 'None configured'}
              </p>
              <p className="text-[11px] text-amber-700 mt-1">
                Effective from: {weekendConfig.effectiveFrom} • Configured by: @{weekendConfig.createdBy}
              </p>
            </div>
          </div>

          <div className="bg-white border border-amber-200/60 rounded-xl shadow-sm p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Tag className="w-4 h-4 text-amber-600" />
              Weekend Notes & Effective Period
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Effective From Date</label>
                <input
                  type="date"
                  value={weekendConfig.effectiveFrom}
                  onChange={(e) => {
                    const updated = { ...weekendConfig, effectiveFrom: e.target.value };
                    setWeekendConfig(updated);
                    saveStoredWeekendConfig(updated);
                  }}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-300/50"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Effective To Date (Optional)</label>
                <input
                  type="date"
                  value={weekendConfig.effectiveTo || ''}
                  onChange={(e) => {
                    const updated = { ...weekendConfig, effectiveTo: e.target.value || undefined };
                    setWeekendConfig(updated);
                    saveStoredWeekendConfig(updated);
                  }}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-300/50"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Notes</label>
                <textarea
                  rows={3}
                  value={weekendConfig.notes || ''}
                  onChange={(e) => {
                    const updated = { ...weekendConfig, notes: e.target.value };
                    setWeekendConfig(updated);
                    saveStoredWeekendConfig(updated);
                  }}
                  placeholder="Add notes about this weekend configuration..."
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-300/50 resize-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab 3: Calendar View ─────────────────────────────────────────────── */}
      {activeTab === 'calendar' && (
        <div className="bg-white border border-amber-200/60 rounded-xl shadow-sm overflow-hidden">
          {/* Calendar Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear(y => y - 1); }
                  else setSelectedMonth(m => m - 1);
                }}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 cursor-pointer"
              >
                ‹
              </button>
              <h3 className="text-sm font-bold text-slate-900 min-w-[140px] text-center">
                {MONTH_NAMES[selectedMonth]} {selectedYear}
              </h3>
              <button
                type="button"
                onClick={() => {
                  if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear(y => y + 1); }
                  else setSelectedMonth(m => m + 1);
                }}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 cursor-pointer"
              >
                ›
              </button>
            </div>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-rose-200 border border-rose-300 inline-block" />Weekend</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-amber-200 border border-amber-300 inline-block" />Holiday</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-emerald-200 border border-emerald-300 inline-block" />Miqaat</span>
            </div>
          </div>

          <div className="p-3 sm:p-4">
            {/* Day headers */}
            <div className="grid grid-cols-7 mb-2">
              {DAYS_OF_WEEK.map((day) => (
                <div
                  key={day}
                  className={`text-center text-[10px] font-bold py-1 ${
                    weekendConfig.offDays.includes(day) ? 'text-rose-500' : 'text-slate-500'
                  }`}
                >
                  {day.slice(0, 2).toUpperCase()}
                </div>
              ))}
            </div>

            {/* Calendar cells */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, idx) => {
                if (!day) return <div key={idx} />;
                const dayHolidays = holidayDatesForMonth[day] || [];
                const isOff = isWeekendDay(day);
                const isToday =
                  new Date().getDate() === day &&
                  new Date().getMonth() === selectedMonth &&
                  new Date().getFullYear() === selectedYear;

                const hasMiqaat = dayHolidays.some((h) => h.type === 'Miqaat Holiday');
                const hasHoliday = dayHolidays.some((h) => h.type !== 'Miqaat Holiday');

                return (
                  <div
                    key={idx}
                    title={dayHolidays.map((h) => h.title).join(', ')}
                    className={`
                      relative rounded-lg p-1.5 min-h-[48px] text-xs transition-all cursor-default border
                      ${isToday ? 'ring-2 ring-amber-400 ring-offset-1' : ''}
                      ${hasMiqaat ? 'bg-emerald-50 border-emerald-200' : hasHoliday ? 'bg-amber-50 border-amber-200' : isOff ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-100 hover:bg-slate-50'}
                    `}
                  >
                    <span className={`font-bold block text-right ${isToday ? 'text-amber-700' : isOff ? 'text-rose-600' : 'text-slate-700'}`}>
                      {day}
                    </span>
                    <div className="mt-0.5 space-y-0.5">
                      {dayHolidays.slice(0, 2).map((h) => (
                        <div
                          key={h.id}
                          className={`text-[8px] leading-tight px-1 py-0.5 rounded truncate font-semibold ${
                            h.type === 'Miqaat Holiday' ? 'bg-emerald-200 text-emerald-900' :
                            h.type === 'Emergency Closure' ? 'bg-rose-200 text-rose-900' :
                            'bg-amber-200 text-amber-900'
                          }`}
                        >
                          {h.title}
                        </div>
                      ))}
                      {dayHolidays.length > 2 && (
                        <div className="text-[8px] text-slate-500">+{dayHolidays.length - 2} more</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upcoming holidays list */}
          <div className="border-t border-slate-100 p-4">
            <h4 className="text-xs font-bold text-slate-700 mb-3">
              Holidays in {MONTH_NAMES[selectedMonth]} {selectedYear}
            </h4>
            {Object.keys(holidayDatesForMonth).length === 0 ? (
              <p className="text-xs text-slate-400">No holidays recorded for this month.</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(holidayDatesForMonth)
                  .sort(([a], [b]) => parseInt(a) - parseInt(b))
                  .flatMap(([, hols]) => hols)
                  .map((h) => (
                    <div key={h.id} className="flex items-center gap-3 text-xs">
                      <span className="font-mono font-bold text-slate-900 w-6 text-center">{h.date.split('-')[2]}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${HOLIDAY_TYPE_COLORS[h.type]}`}>{h.type}</span>
                      <span className="font-semibold text-slate-800">{h.title}</span>
                    </div>
                  ))
                }
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modal: Add/Edit Holiday ──────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900">
                {editingId ? '✏️ Edit Holiday' : '➕ Add New Holiday'}
              </h3>
              <button type="button" onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Holiday Title *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="e.g., Eid ul Fitr, Independence Day..."
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-300/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Date (Gregorian) *</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-300/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Hijri Date (Optional)</label>
                  <input
                    type="text"
                    value={form.hijriDate || ''}
                    onChange={(e) => setForm((f) => ({ ...f, hijriDate: e.target.value }))}
                    placeholder="e.g., 1447-09-01"
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-300/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Holiday Type *</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as HolidayType }))}
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-300/50 cursor-pointer"
                  >
                    {HOLIDAY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isRecurring}
                      onChange={(e) => setForm((f) => ({ ...f, isRecurring: e.target.checked }))}
                      className="w-4 h-4 accent-amber-500 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-700">Recurring Annually</span>
                  </label>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Description</label>
                  <textarea
                    rows={2}
                    value={form.description || ''}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Optional description or note..."
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-300/50 resize-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-2">Affected Departments</label>
                  <div className="flex flex-wrap gap-2">
                    {DEPARTMENTS.map((dept) => (
                      <button
                        key={dept}
                        type="button"
                        onClick={() => handleDeptToggle(dept)}
                        className={`px-2.5 py-1 text-[11px] rounded-full border font-semibold cursor-pointer transition-all ${
                          selectedDepts.includes(dept)
                            ? 'bg-amber-400 border-amber-500 text-slate-950'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-amber-300'
                        }`}
                      >
                        {dept}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-black text-slate-950 bg-amber-400 hover:bg-amber-500 rounded-lg transition-all shadow-sm cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                {editingId ? 'Update Holiday' : 'Save Holiday'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
