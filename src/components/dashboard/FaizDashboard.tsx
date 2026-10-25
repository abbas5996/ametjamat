import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Utensils,
  Flame,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  RefreshCw,
  Search,
  ArrowUpRight,
  TrendingUp,
  Clock,
  Phone,
  Filter,
  ShieldAlert,
  ChevronRight,
  Send,
  Zap,
} from 'lucide-react';
import {
  FinancialYear,
  UserProfile,
  ThaaliRecord,
  TakhmeenRecord,
  FmbCollectionEntry,
  ThaaliStatus,
} from '../../types';
import {
  getStoredThaalis,
  saveStoredThaalis,
  getStoredTakhmeens,
  getStoredCollections,
} from '../../utils/fmbTakhmeen';
import { appendActivityLog } from '../../utils/rbac';

interface FaizDashboardProps {
  financialYear: FinancialYear;
  currentUser: UserProfile;
  onQuickAction: (msg: string) => void;
}

export const FaizDashboard: React.FC<FaizDashboardProps> = ({
  financialYear,
  currentUser,
  onQuickAction,
}) => {
  // Live Data States
  const [thaalis, setThaalis] = useState<ThaaliRecord[]>([]);
  const [takhmeens, setTakhmeens] = useState<TakhmeenRecord[]>([]);
  const [collections, setCollections] = useState<FmbCollectionEntry[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Real-time Clock
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch / Sync all FMB data from localStorage
  const loadFmbData = useCallback(() => {
    setIsRefreshing(true);
    try {
      const storedThaalis = getStoredThaalis();
      const storedTakhmeens = getStoredTakhmeens();
      const storedCollections = getStoredCollections();

      setThaalis(storedThaalis);
      setTakhmeens(storedTakhmeens);
      setCollections(storedCollections);
      setLastSyncTime(new Date());
    } finally {
      setTimeout(() => setIsRefreshing(false), 300);
    }
  }, []);

  // Initial load + Event Listeners for real-time synchronization
  useEffect(() => {
    loadFmbData();

    // Listen to localStorage changes across tabs and within the window
    const handleStorageChange = (e: StorageEvent) => {
      if (
        !e.key ||
        e.key.includes('jamat_thaali') ||
        e.key.includes('jamat_takhmeen') ||
        e.key.includes('jamat_fmb')
      ) {
        loadFmbData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    // Custom internal broadcast event for in-tab sync
    const handleLocalBroadcast = () => loadFmbData();
    window.addEventListener('jamat_fmb_updated', handleLocalBroadcast);

    // Auto-polling interval every 5 seconds to ensure real-time command center state
    const pollInterval = setInterval(loadFmbData, 5000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('jamat_fmb_updated', handleLocalBroadcast);
      clearInterval(pollInterval);
    };
  }, [loadFmbData]);

  // Quick Thaali Status Toggle (Active <-> Vacation)
  const handleToggleStatus = (thaaliId: string, currentStatus: ThaaliStatus) => {
    const nextStatus: ThaaliStatus = currentStatus === 'Active' ? 'Vacation' : 'Active';
    const updated = thaalis.map((t) => {
      if (t.id === thaaliId) {
        return {
          ...t,
          status: nextStatus,
          updatedAt: new Date().toISOString().split('T')[0],
        };
      }
      return t;
    });

    saveStoredThaalis(updated);
    setThaalis(updated);

    const changedItem = updated.find((t) => t.id === thaaliId);
    if (changedItem) {
      appendActivityLog(
        currentUser.username,
        'FMB & Takhmeen',
        'Faiz Dashboard',
        'EDIT',
        `Live Command Center: Thaali ${changedItem.thaaliNo} (ITS: ${changedItem.itsNumber}) toggled from [${currentStatus}] to [${nextStatus}].`
      );
    }

    // Trigger local broadcast
    window.dispatchEvent(new Event('jamat_fmb_updated'));
    onQuickAction(`Thaali #${changedItem?.thaaliNo || ''} status updated to ${nextStatus}`);
  };

  // Calculations: Thaalis
  const activeThaalisCount = useMemo(() => {
    return thaalis.filter((t) => t.status === 'Active').length;
  }, [thaalis]);

  const vacationThaalisCount = useMemo(() => {
    return thaalis.filter((t) => t.status === 'Vacation').length;
  }, [thaalis]);

  const closedThaalisCount = useMemo(() => {
    return thaalis.filter((t) => t.status === 'Closed' || t.status === 'Blocked').length;
  }, [thaalis]);

  const totalThaalis = thaalis.length || 1;
  const activePercent = Math.round((activeThaalisCount / totalThaalis) * 100);

  // Calculations: Takhmeen Financial Ticker
  const totalCommitted = useMemo(() => {
    return takhmeens.reduce((sum, t) => sum + (t.committedAmount || 0), 0);
  }, [takhmeens]);

  const totalCollected = useMemo(() => {
    return takhmeens.reduce((sum, t) => sum + (t.paidAmount || 0), 0);
  }, [takhmeens]);

  const totalOutstanding = useMemo(() => {
    return takhmeens.reduce((sum, t) => sum + (t.balanceDue || 0), 0);
  }, [takhmeens]);

  const realizationPct =
    totalCommitted > 0 ? Math.min(100, Math.round((totalCollected / totalCommitted) * 100)) : 0;

  // Defaulters list (balanceDue > 0), sorted highest balance first
  const defaultersList = useMemo(() => {
    return takhmeens
      .filter((t) => t.balanceDue > 0)
      .sort((a, b) => b.balanceDue - a.balanceDue);
  }, [takhmeens]);

  // Filtered Thaalis for the live roster table
  const filteredThaalis = useMemo(() => {
    return thaalis.filter((t) => {
      const matchesSearch =
        searchQuery === '' ||
        t.itsNumber.includes(searchQuery) ||
        t.hofName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.thaaliNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.assignedAddress && t.assignedAddress.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesTier = tierFilter === 'all' || t.tier === tierFilter;
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;

      return matchesSearch && matchesTier && matchesStatus;
    });
  }, [thaalis, searchQuery, tierFilter, statusFilter]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ── TOP LIVE COMMAND BANNER ── */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 border border-amber-500/30 rounded-2xl p-4 sm:p-5 text-white shadow-xl relative overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.4)]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
                LIVE COMMAND CENTER
              </span>

              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-400/15 text-amber-300 border border-amber-400/30">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                Kitchen Sync Real-Time
              </span>

              <span className="text-xs text-slate-400 font-mono">
                {financialYear}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-amber-200 tracking-tight flex items-center gap-2">
              Faiz ul Mawaid il Burhaniyah Operations
            </h1>
            <p className="text-xs text-slate-300 max-w-xl">
              Live automated distribution monitoring, daily thaali kitchen roster, and real-time takhmeen collection telemetry.
            </p>
          </div>

          {/* Clock & Instant Refresh CTA */}
          <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-700/60">
            <div className="flex items-center gap-2 text-xs font-mono text-amber-300 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-700">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{currentTime.toLocaleTimeString()}</span>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span>Synced {lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              <button
                type="button"
                onClick={loadFmbData}
                disabled={isRefreshing}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
                title="Force refresh telemetry"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── LIVE METRIC CARDS (TOP ROW) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Thaalis */}
        <div className="bg-white border border-emerald-200 rounded-xl p-4 shadow-xs relative overflow-hidden group hover:border-emerald-400 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full blur-xl -mr-6 -mt-6"></div>
          <div className="relative z-10 flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Active Kitchen Thaalis
              </span>
              <div className="text-2xl sm:text-3xl font-black text-slate-900">
                {activeThaalisCount}
              </div>
              <p className="text-[11px] text-slate-500">
                {activePercent}% of registered community
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Utensils className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${activePercent}%` }}
            ></div>
          </div>
        </div>

        {/* Card 2: Vacation Thaalis */}
        <div className="bg-white border border-amber-200 rounded-xl p-4 shadow-xs relative overflow-hidden group hover:border-amber-400 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-full blur-xl -mr-6 -mt-6"></div>
          <div className="relative z-10 flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                Temporary Vacation
              </span>
              <div className="text-2xl sm:text-3xl font-black text-slate-900">
                {vacationThaalisCount}
              </div>
              <p className="text-[11px] text-slate-500">
                Paused delivery on request
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-[11px] text-amber-700 font-medium">
            <span>Saves ~{vacationThaalisCount * 4} meals daily</span>
          </div>
        </div>

        {/* Card 3: Closed / Blocked */}
        <div className="bg-white border border-rose-200 rounded-xl p-4 shadow-xs relative overflow-hidden group hover:border-rose-400 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-full blur-xl -mr-6 -mt-6"></div>
          <div className="relative z-10 flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                Closed / Blocked
              </span>
              <div className="text-2xl sm:text-3xl font-black text-slate-900">
                {closedThaalisCount}
              </div>
              <p className="text-[11px] text-slate-500">
                Dues default or discontinued
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-[11px] text-rose-700 font-medium">
            <span>Requires administrative action</span>
          </div>
        </div>

        {/* Card 4: Daily Total Meals Produced */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs relative overflow-hidden group hover:border-slate-300 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full blur-xl -mr-6 -mt-6"></div>
          <div className="relative z-10 flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                Daily Kitchen Output
              </span>
              <div className="text-2xl sm:text-3xl font-black text-slate-900">
                ~{activeThaalisCount * 4}
              </div>
              <p className="text-[11px] text-slate-500">
                Estimated individual servings
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-[11px] text-slate-600 font-medium">
            <span>Prepared at Central Mawaid Complex</span>
          </div>
        </div>
      </div>

      {/* ── FINANCIAL TELEMETRY TICKER (TAKHMEEN PROGRESS) ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Faiz Financial Telemetry & Collection Progress
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                {realizationPct}% Realized
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live tracking of committed annual takhmeens vs actual receipts logged
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="text-right">
              <div className="text-[11px] text-slate-400 font-medium">Total Target</div>
              <div className="font-bold text-slate-900 font-mono">₹{totalCommitted.toLocaleString('en-IN')}</div>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-emerald-600 font-medium">Collected</div>
              <div className="font-bold text-emerald-700 font-mono">₹{totalCollected.toLocaleString('en-IN')}</div>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-rose-600 font-medium">Pending Dues</div>
              <div className="font-bold text-rose-700 font-mono">₹{totalOutstanding.toLocaleString('en-IN')}</div>
            </div>
          </div>
        </div>

        {/* Multi-segmented Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden flex">
          <div
            className="bg-gradient-to-r from-emerald-500 to-teal-500 h-3 transition-all duration-700"
            style={{ width: `${realizationPct}%` }}
            title={`Realized: ${realizationPct}%`}
          ></div>
          <div
            className="bg-amber-400/40 h-3 transition-all duration-700"
            style={{ width: `${100 - realizationPct}%` }}
            title={`Pending: ${100 - realizationPct}%`}
          ></div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              Collected: ₹{totalCollected.toLocaleString('en-IN')}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
              Pending: ₹{totalOutstanding.toLocaleString('en-IN')}
            </span>
          </div>

          <span className="font-medium text-slate-500">
            Average Per Thaali: ₹{totalThaalis > 0 ? Math.round(totalCommitted / totalThaalis).toLocaleString('en-IN') : 0}
          </span>
        </div>
      </div>

      {/* ── TWO-COLUMN SECTION: DEFAULTER ALERT BOX & LIVE THAALI ROSTER ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (1 col): Defaulter Alert Box */}
        <div className="bg-white border border-rose-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-rose-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Critical Defaulter Alerts
                </h3>
                <p className="text-[11px] text-slate-500">
                  {defaultersList.length} accounts with pending balance
                </p>
              </div>
            </div>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
              URGENT
            </span>
          </div>

          {/* List of defaulters */}
          <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[380px] pr-1">
            {defaultersList.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="font-semibold text-slate-700">Zero Defaulters!</p>
                <p className="text-[11px]">All FMB accounts are completely settled.</p>
              </div>
            ) : (
              defaultersList.map((d) => (
                <div
                  key={d.id}
                  className="p-3 rounded-xl border border-rose-100 bg-rose-50/40 hover:bg-rose-50 transition-colors flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 text-xs truncate">
                      {d.hofName}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                      <span className="font-mono text-amber-800 font-bold">ITS: {d.itsNumber}</span>
                      <span>•</span>
                      <span className="text-slate-600">{d.tier} Tier</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-bold text-rose-700 text-xs font-mono">
                      ₹{d.balanceDue.toLocaleString('en-IN')}
                    </div>
                    <button
                      type="button"
                      onClick={() => onQuickAction(`Reminder queued for ITS ${d.itsNumber} (${d.hofName})`)}
                      className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                    >
                      <Send className="w-2.5 h-2.5" />
                      <span>Remind</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column (2 cols): Live Thaali Distribution Roster with Quick Status Toggle */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Utensils className="w-4 h-4 text-amber-600" />
                Live Thaali Distribution Roster
              </h3>
              <p className="text-[11px] text-slate-500">
                Directly toggle delivery status between Active and Vacation with instant kitchen telemetry reflection
              </p>
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search ITS or Thaali..."
                  className="pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-amber-400 w-36 sm:w-44"
                />
              </div>

              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
                className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none cursor-pointer text-slate-700"
              >
                <option value="all">All Tiers</option>
                <option value="Full">Full Tier</option>
                <option value="Half">Half Tier</option>
                <option value="Special">Special Tier</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none cursor-pointer text-slate-700"
              >
                <option value="all">All Statuses</option>
                <option value="Active">Active Only</option>
                <option value="Vacation">Vacation Only</option>
                <option value="Closed">Closed Only</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto flex-1 max-h-[380px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 sticky top-0 z-10 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Thaali #</th>
                  <th className="py-2.5 px-3">HOF Member</th>
                  <th className="py-2.5 px-3">Tier</th>
                  <th className="py-2.5 px-3">Address</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredThaalis.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                      No thaali records found matching current filters.
                    </td>
                  </tr>
                ) : (
                  filteredThaalis.map((t) => (
                    <tr key={t.id} className="hover:bg-amber-50/40 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-amber-900">
                        {t.thaaliNo}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900">{t.hofName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">ITS: {t.itsNumber}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          {t.tier}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 truncate max-w-[140px]" title={t.assignedAddress}>
                        {t.assignedAddress || 'Direct Pickup'}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            t.status === 'Active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : t.status === 'Vacation'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              t.status === 'Active'
                                ? 'bg-emerald-500'
                                : t.status === 'Vacation'
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                          ></span>
                          {t.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(t.id, t.status)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all shadow-2xs cursor-pointer ${
                            t.status === 'Active'
                              ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                              : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300'
                          }`}
                        >
                          {t.status === 'Active' ? 'Set Vacation' : 'Set Active'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
