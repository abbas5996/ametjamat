import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  Users,
  Utensils,
  Wallet,
  Building2,
  FileSpreadsheet,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Filter,
  RefreshCw,
  Search,
  Calendar,
  Layers,
  MapPin,
  ChevronRight,
  Receipt,
  FileCheck2,
  DollarSign,
  Shield,
  Activity,
  Flame,
} from 'lucide-react';
import {
  FinancialYear,
  UserProfile,
  HeadOfFamily,
  Mohallah,
  ThaaliRecord,
  TakhmeenRecord,
  FmbCollectionEntry,
  SabeelLedgerRecord,
  SabeelTransactionEntry,
  FacilityRecord,
  BookingRecord,
  GeneralReceiptRecord,
  ActivityLogEntry,
} from '../../types';
import { getStoredHofs, getStoredMohallahs } from '../../utils/memberMaster';
import {
  getStoredThaalis,
  getStoredTakhmeens,
  getStoredCollections,
} from '../../utils/fmbTakhmeen';
import {
  getStoredSabeelLedger,
  getStoredSabeelTransactions,
} from '../../utils/sabeelManagement';
import {
  getStoredFacilities,
  getStoredBookings,
} from '../../utils/hallBooking';
import { getStoredGeneralReceipts } from '../../utils/executiveReports';
import { getStoredActivityLogs } from '../../utils/rbac';

export type ModuleFilterType = 'all' | 'fmb' | 'sabeel' | 'hall' | 'member' | 'reports';

interface MainOverviewDashboardProps {
  financialYear: FinancialYear;
  currentUser: UserProfile;
  onQuickAction: (msg: string) => void;
  onNavigateToModule?: (categoryId: string, subItemId: string) => void;
}

export const MainOverviewDashboard: React.FC<MainOverviewDashboardProps> = ({
  financialYear,
  currentUser,
  onQuickAction,
  onNavigateToModule,
}) => {
  // Master Module Filter Dropdown
  const [activeModule, setActiveModule] = useState<ModuleFilterType>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // Master State from localStorage across all modules
  const [hofs, setHofs] = useState<HeadOfFamily[]>([]);
  const [mohallahs, setMohallahs] = useState<Mohallah[]>([]);
  const [thaalis, setThaalis] = useState<ThaaliRecord[]>([]);
  const [takhmeens, setTakhmeens] = useState<TakhmeenRecord[]>([]);
  const [fmbCollections, setFmbCollections] = useState<FmbCollectionEntry[]>([]);
  const [sabeelLedgers, setSabeelLedgers] = useState<SabeelLedgerRecord[]>([]);
  const [sabeelTransactions, setSabeelTransactions] = useState<SabeelTransactionEntry[]>([]);
  const [facilities, setFacilities] = useState<FacilityRecord[]>([]);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [generalReceipts, setGeneralReceipts] = useState<GeneralReceiptRecord[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLogEntry[]>([]);

  // Function to load all system data live from localStorage
  const loadSystemData = () => {
    setIsRefreshing(true);
    try {
      setHofs(getStoredHofs());
      setMohallahs(getStoredMohallahs());
      setThaalis(getStoredThaalis());
      setTakhmeens(getStoredTakhmeens());
      setFmbCollections(getStoredCollections());
      setSabeelLedgers(getStoredSabeelLedger());
      setSabeelTransactions(getStoredSabeelTransactions());
      setFacilities(getStoredFacilities());
      setBookings(getStoredBookings());
      setGeneralReceipts(getStoredGeneralReceipts());
      setActivityLogs(getStoredActivityLogs());
      setLastRefreshed(new Date());
    } finally {
      setTimeout(() => setIsRefreshing(false), 250);
    }
  };

  useEffect(() => {
    loadSystemData();

    // Listen to cross-module storage updates
    const handleStorage = () => loadSystemData();
    window.addEventListener('storage', handleStorage);
    window.addEventListener('jamat_fmb_updated', handleStorage);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('jamat_fmb_updated', handleStorage);
    };
  }, []);

  // ── 1. GLOBAL AGGREGATIONS (Across All Modules) ──
  const totalHofsCount = hofs.length;
  const totalFamilyMembersCount = hofs.reduce(
    (sum, h) => sum + (h.familyMembers?.length || 0) + 1,
    0
  );

  const fmbCommitted = takhmeens.reduce((sum, t) => sum + (t.committedAmount || 0), 0);
  const fmbCollected = takhmeens.reduce((sum, t) => sum + (t.paidAmount || 0), 0);
  const fmbOutstanding = takhmeens.reduce((sum, t) => sum + (t.balanceDue || 0), 0);

  const sabeelTarget = sabeelLedgers.reduce((sum, s) => sum + (s.committedAmount || 0), 0);
  const sabeelCollected = sabeelLedgers.reduce((sum, s) => sum + (s.paidAmount || 0), 0);
  const sabeelOutstanding = sabeelLedgers.reduce((sum, s) => sum + (s.balanceDue || 0), 0);

  const hallEarnings = bookings.reduce((sum, b) => sum + (b.paidAmount || 0), 0);
  const hallOutstanding = bookings.reduce((sum, b) => sum + (b.balanceDue || 0), 0);

  const generalDonations = generalReceipts.reduce((sum, r) => sum + (r.amount || 0), 0);

  const totalRevenue = fmbCollected + sabeelCollected + hallEarnings + generalDonations;
  const totalPendingDues = fmbOutstanding + sabeelOutstanding + hallOutstanding;

  // Realization Percentages
  const fmbRealizedPct = fmbCommitted > 0 ? Math.min(100, Math.round((fmbCollected / fmbCommitted) * 100)) : 0;
  const sabeelRealizedPct = sabeelTarget > 0 ? Math.min(100, Math.round((sabeelCollected / sabeelTarget) * 100)) : 0;

  // Active Thaalis
  const activeThaalisCount = thaalis.filter((t) => t.status === 'Active').length;
  const vacationThaalisCount = thaalis.filter((t) => t.status === 'Vacation').length;
  const closedThaalisCount = thaalis.filter((t) => t.status === 'Closed' || t.status === 'Blocked').length;

  return (
    <div className="space-y-6">
      {/* ── TOP CONTROL BAR: MODULE SELECTOR + LIVE REFRESH ── */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">
                  Administrative Telemetry View
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  {financialYear}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Select a sub-system module to drill down or view consolidated Jamaat intelligence
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Master Module Filter Dropdown */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500 font-medium">Dashboard View:</span>
              <select
                value={activeModule}
                onChange={(e) => {
                  setActiveModule(e.target.value as ModuleFilterType);
                  onQuickAction(`Switched dashboard view to ${e.target.value}`);
                }}
                className="bg-transparent font-bold text-slate-900 outline-none cursor-pointer"
              >
                <option value="all">🌐 All Modules (Unified View)</option>
                <option value="fmb">🍲 FMB & Takhmeen</option>
                <option value="sabeel">🪙 Sabeel Management</option>
                <option value="hall">🏛️ Hall Booking & Facilities</option>
                <option value="member">👥 Member Master & Demographics</option>
                <option value="reports">📊 Reports & General Receipts</option>
              </select>
            </div>

            {/* Quick Refresh */}
            <button
              type="button"
              onClick={loadSystemData}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer disabled:opacity-50 min-h-[38px]"
              title="Force sync data from all modules"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sync Live</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── DYNAMIC VIEW SWITCHING CONTAINER WITH SMOOTH ANIMATION ── */}
      <div className="transition-all duration-300 ease-in-out">
        {/* ============================================================ */}
        {/* VIEW 1: UNIFIED ALL-MODULES EXECUTIVE DASHBOARD             */}
        {/* ============================================================ */}
        {activeModule === 'all' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Top Row: Executive Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Total Revenue */}
              <div className="bg-white border border-amber-200 rounded-xl p-4 shadow-xs relative overflow-hidden group hover:border-amber-400 transition-all">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Total Realized Revenue
                    </span>
                    <div className="text-2xl font-black text-slate-900 font-mono">
                      ₹{totalRevenue.toLocaleString('en-IN')}
                    </div>
                    <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> Combined receipts realized
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                    <DollarSign className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Card 2: Total Community Members */}
              <div className="bg-white border border-blue-200 rounded-xl p-4 shadow-xs relative overflow-hidden group hover:border-blue-400 transition-all">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Registered Mumineen
                    </span>
                    <div className="text-2xl font-black text-slate-900 font-mono">
                      {totalFamilyMembersCount}
                    </div>
                    <p className="text-[11px] text-blue-600 font-medium">
                      Across {totalHofsCount} Registered HOFs
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Card 3: FMB Active Thaalis */}
              <div className="bg-white border border-emerald-200 rounded-xl p-4 shadow-xs relative overflow-hidden group hover:border-emerald-400 transition-all">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Active Kitchen Thaalis
                    </span>
                    <div className="text-2xl font-black text-emerald-700 font-mono">
                      {activeThaalisCount}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {vacationThaalisCount} currently on vacation
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <Utensils className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Card 4: Total Outstanding Dues */}
              <div className="bg-white border border-rose-200 rounded-xl p-4 shadow-xs relative overflow-hidden group hover:border-rose-400 transition-all">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Consolidated Pending Dues
                    </span>
                    <div className="text-2xl font-black text-rose-700 font-mono">
                      ₹{totalPendingDues.toLocaleString('en-IN')}
                    </div>
                    <p className="text-[11px] text-rose-600 font-medium">
                      FMB, Sabeel & Hall Bookings
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center shrink-0">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>

            {/* Middle Grid: Module Intelligence Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Box 1: FMB & Takhmeen Overview Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                        <Utensils className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-900 uppercase">FMB & Takhmeen</h3>
                        <p className="text-[11px] text-slate-500">Faiz ul Mawaid il Burhaniyah</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold font-mono text-emerald-700">
                      {fmbRealizedPct}% Realized
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Committed Target:</span>
                      <span className="font-bold text-slate-900 font-mono">₹{fmbCommitted.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Collected to Date:</span>
                      <span className="font-bold text-emerald-700 font-mono">₹{fmbCollected.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Pending Balance:</span>
                      <span className="font-bold text-rose-700 font-mono">₹{fmbOutstanding.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mt-1">
                      <div
                        className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${fmbRealizedPct}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveModule('fmb')}
                  className="mt-4 w-full py-2 bg-slate-50 hover:bg-emerald-50 text-emerald-800 border border-slate-200 hover:border-emerald-300 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>Explore FMB Deep-Dive</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Box 2: Sabeel Management Overview Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                        <Wallet className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-900 uppercase">Sabeel ul Khair</h3>
                        <p className="text-[11px] text-slate-500">Community Contributions</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold font-mono text-amber-700">
                      {sabeelRealizedPct}% Cleared
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Sabeel Target:</span>
                      <span className="font-bold text-slate-900 font-mono">₹{sabeelTarget.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Total Collected:</span>
                      <span className="font-bold text-amber-700 font-mono">₹{sabeelCollected.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Pending Dues:</span>
                      <span className="font-bold text-rose-700 font-mono">₹{sabeelOutstanding.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mt-1">
                      <div
                        className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${sabeelRealizedPct}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveModule('sabeel')}
                  className="mt-4 w-full py-2 bg-slate-50 hover:bg-amber-50 text-amber-900 border border-slate-200 hover:border-amber-300 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>Explore Sabeel Deep-Dive</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Box 3: Hall Booking & Facilities Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-900 uppercase">Facilities & Halls</h3>
                        <p className="text-[11px] text-slate-500">{facilities.length} Community Venues</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold font-mono text-blue-700">
                      {bookings.length} Bookings
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Total Bookings Revenue:</span>
                      <span className="font-bold text-slate-900 font-mono">₹{hallEarnings.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Pending Booking Dues:</span>
                      <span className="font-bold text-rose-700 font-mono">₹{hallOutstanding.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Active Facilities:</span>
                      <span className="font-bold text-emerald-700 font-mono">
                        {facilities.filter((f) => f.status === 'Available').length} / {facilities.length}
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mt-1">
                      <div className="bg-blue-500 h-2 rounded-full w-full"></div>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveModule('hall')}
                  className="mt-4 w-full py-2 bg-slate-50 hover:bg-blue-50 text-blue-900 border border-slate-200 hover:border-blue-300 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>Explore Hall Bookings</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Bottom Row: Mohallah Demographics + Live Central Activity Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Demographics by Mohallah */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-amber-600" />
                    <h3 className="text-xs font-bold text-slate-900 uppercase">
                      Mohallah & Sector Distribution
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-slate-500">
                    {mohallahs.length} Sectors
                  </span>
                </div>

                <div className="space-y-3">
                  {mohallahs.map((m) => {
                    const count = hofs.filter(
                      (h) => h.mohallahId === m.id || h.mohallahName === m.name
                    ).length;
                    const pct = totalHofsCount > 0 ? Math.round((count / totalHofsCount) * 100) : 0;

                    return (
                      <div key={m.id} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-800">{m.name}</span>
                          <span className="font-mono text-slate-600">
                            {count} HOFs ({pct}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-amber-500 h-2 rounded-full"
                            style={{ width: `${pct}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Live Central Activity Stream */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-xs font-bold text-slate-900 uppercase">
                      Live Central Activity Feed
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    AUDITED
                  </span>
                </div>

                <div className="space-y-2.5 overflow-y-auto max-h-[220px] flex-1 pr-1">
                  {activityLogs.slice(0, 5).map((log) => (
                    <div
                      key={log.id}
                      className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/70 text-xs space-y-0.5"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-900">
                          @{log.username} • {log.actionType}
                        </span>
                        <span className="text-slate-400 font-mono text-[10px]">{log.timestamp}</span>
                      </div>
                      <p className="text-slate-600 text-[11px] truncate">{log.details}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* VIEW 2: FMB & TAKHMEEN DEEP-DIVE                            */}
        {/* ============================================================ */}
        {activeModule === 'fmb' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* FMB Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-emerald-200 rounded-xl p-4 shadow-xs">
                <span className="text-[11px] font-bold text-emerald-800 uppercase">Active Thaalis</span>
                <div className="text-2xl font-black text-slate-900 mt-1">{activeThaalisCount}</div>
                <p className="text-[11px] text-slate-500 mt-0.5">Receiving daily mawaid delivery</p>
              </div>

              <div className="bg-white border border-amber-200 rounded-xl p-4 shadow-xs">
                <span className="text-[11px] font-bold text-amber-800 uppercase">Vacation Thaalis</span>
                <div className="text-2xl font-black text-slate-900 mt-1">{vacationThaalisCount}</div>
                <p className="text-[11px] text-slate-500 mt-0.5">Temporary delivery pause</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                <span className="text-[11px] font-bold text-slate-600 uppercase">Committed Takhmeen</span>
                <div className="text-2xl font-black text-slate-900 font-mono mt-1">₹{fmbCommitted.toLocaleString('en-IN')}</div>
                <p className="text-[11px] text-slate-500 mt-0.5">{takhmeens.length} participating accounts</p>
              </div>

              <div className="bg-white border border-rose-200 rounded-xl p-4 shadow-xs">
                <span className="text-[11px] font-bold text-rose-800 uppercase">Outstanding Balance</span>
                <div className="text-2xl font-black text-rose-700 font-mono mt-1">₹{fmbOutstanding.toLocaleString('en-IN')}</div>
                <p className="text-[11px] text-rose-600 mt-0.5">Realization: {fmbRealizedPct}%</p>
              </div>
            </div>

            {/* FMB Takhmeen vs Collection Progress */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 uppercase">Takhmeen Collection Telemetry</h3>
                <span className="text-xs font-bold font-mono text-emerald-700">₹{fmbCollected.toLocaleString('en-IN')} Collected</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-emerald-500 h-3 rounded-full transition-all duration-700"
                  style={{ width: `${fmbRealizedPct}%` }}
                ></div>
              </div>
            </div>

            {/* FMB Defaulters Table */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <h3 className="text-xs font-bold text-slate-900 uppercase mb-3">Accounts with Pending Takhmeen Dues</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">ITS No</th>
                      <th className="py-2.5 px-3">HOF Name</th>
                      <th className="py-2.5 px-3">Tier</th>
                      <th className="py-2.5 px-3 text-right">Committed</th>
                      <th className="py-2.5 px-3 text-right">Paid</th>
                      <th className="py-2.5 px-3 text-right">Balance Due</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {takhmeens.filter((t) => t.balanceDue > 0).map((t) => (
                      <tr key={t.id} className="hover:bg-amber-50/30">
                        <td className="py-2.5 px-3 font-mono font-bold text-amber-900">{t.itsNumber}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{t.hofName}</td>
                        <td className="py-2.5 px-3">{t.tier}</td>
                        <td className="py-2.5 px-3 text-right font-mono">₹{t.committedAmount.toLocaleString('en-IN')}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-700">₹{t.paidAmount.toLocaleString('en-IN')}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-700">₹{t.balanceDue.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* VIEW 3: SABEEL MANAGEMENT DEEP-DIVE                         */}
        {/* ============================================================ */}
        {activeModule === 'sabeel' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Total Sabeel Target</span>
                <div className="text-2xl font-black text-slate-900 font-mono mt-1">₹{sabeelTarget.toLocaleString('en-IN')}</div>
                <p className="text-[11px] text-slate-500 mt-0.5">{sabeelLedgers.length} registered ledger accounts</p>
              </div>

              <div className="bg-white border border-emerald-200 rounded-xl p-4 shadow-xs">
                <span className="text-[11px] font-bold text-emerald-800 uppercase">Realized Sabeel</span>
                <div className="text-2xl font-black text-emerald-700 font-mono mt-1">₹{sabeelCollected.toLocaleString('en-IN')}</div>
                <p className="text-[11px] text-emerald-600 mt-0.5">{sabeelRealizedPct}% cleared</p>
              </div>

              <div className="bg-white border border-rose-200 rounded-xl p-4 shadow-xs">
                <span className="text-[11px] font-bold text-rose-800 uppercase">Defaulter Balance</span>
                <div className="text-2xl font-black text-rose-700 font-mono mt-1">₹{sabeelOutstanding.toLocaleString('en-IN')}</div>
                <p className="text-[11px] text-rose-600 mt-0.5">
                  {sabeelLedgers.filter((s) => s.balanceDue > 0).length} accounts pending
                </p>
              </div>

              <div className="bg-white border border-blue-200 rounded-xl p-4 shadow-xs">
                <span className="text-[11px] font-bold text-blue-800 uppercase">Settled Accounts</span>
                <div className="text-2xl font-black text-blue-800 font-mono mt-1">
                  {sabeelLedgers.filter((s) => s.status === 'Settled').length}
                </div>
                <p className="text-[11px] text-blue-600 mt-0.5">100% dues cleared</p>
              </div>
            </div>

            {/* Sabeel Recent Collections Ledger */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <h3 className="text-xs font-bold text-slate-900 uppercase mb-3">Recent Sabeel Receipts Ledger</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Receipt #</th>
                      <th className="py-2.5 px-3">Member Name</th>
                      <th className="py-2.5 px-3">Sabeel No</th>
                      <th className="py-2.5 px-3">Mode</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sabeelTransactions.slice(0, 6).map((tx) => (
                      <tr key={tx.id} className="hover:bg-amber-50/30">
                        <td className="py-2.5 px-3 font-mono font-bold text-amber-900">{tx.receiptNo}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{tx.hofName}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-500">{tx.sabeelNo}</td>
                        <td className="py-2.5 px-3">{tx.paymentMode}</td>
                        <td className="py-2.5 px-3 text-slate-500">{tx.date}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">₹{tx.amount.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* VIEW 4: HALL BOOKING & FACILITIES DEEP-DIVE                  */}
        {/* ============================================================ */}
        {activeModule === 'hall' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Total Venues</span>
                <div className="text-2xl font-black text-slate-900 font-mono mt-1">{facilities.length}</div>
                <p className="text-[11px] text-slate-500 mt-0.5">Community Hall, Dining, Guest Rooms</p>
              </div>

              <div className="bg-white border border-blue-200 rounded-xl p-4 shadow-xs">
                <span className="text-[11px] font-bold text-blue-800 uppercase">Confirmed Bookings</span>
                <div className="text-2xl font-black text-blue-800 font-mono mt-1">{bookings.length}</div>
                <p className="text-[11px] text-blue-600 mt-0.5">Reservations logged</p>
              </div>

              <div className="bg-white border border-emerald-200 rounded-xl p-4 shadow-xs">
                <span className="text-[11px] font-bold text-emerald-800 uppercase">Realized Revenue</span>
                <div className="text-2xl font-black text-emerald-700 font-mono mt-1">₹{hallEarnings.toLocaleString('en-IN')}</div>
                <p className="text-[11px] text-emerald-600 mt-0.5">Advance deposits & full payments</p>
              </div>

              <div className="bg-white border border-rose-200 rounded-xl p-4 shadow-xs">
                <span className="text-[11px] font-bold text-rose-800 uppercase">Pending Booking Dues</span>
                <div className="text-2xl font-black text-rose-700 font-mono mt-1">₹{hallOutstanding.toLocaleString('en-IN')}</div>
                <p className="text-[11px] text-rose-600 mt-0.5">Due before event dates</p>
              </div>
            </div>

            {/* Upcoming Bookings Schedule */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <h3 className="text-xs font-bold text-slate-900 uppercase mb-3">Facility Usage & Reservation Schedule</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Booking Code</th>
                      <th className="py-2.5 px-3">Facility</th>
                      <th className="py-2.5 px-3">Event Date</th>
                      <th className="py-2.5 px-3">Event Type</th>
                      <th className="py-2.5 px-3">Organizer</th>
                      <th className="py-2.5 px-3 text-right">Charges</th>
                      <th className="py-2.5 px-3">Payment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bookings.map((b) => (
                      <tr key={b.id} className="hover:bg-amber-50/30">
                        <td className="py-2.5 px-3 font-mono font-bold text-blue-900">{b.bookingCode}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{b.facilityName}</td>
                        <td className="py-2.5 px-3 text-slate-500 font-mono">{b.eventDate}</td>
                        <td className="py-2.5 px-3">{b.eventType}</td>
                        <td className="py-2.5 px-3">{b.hofName}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold">₹{b.totalCharges.toLocaleString('en-IN')}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              b.paymentStatus === 'Paid'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {b.paymentStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* VIEW 5: MEMBER MASTER & DEMOGRAPHICS DEEP-DIVE              */}
        {/* ============================================================ */}
        {activeModule === 'member' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Head of Families (HOF)</span>
                <div className="text-2xl font-black text-slate-900 font-mono mt-1">{totalHofsCount}</div>
                <p className="text-[11px] text-slate-500 mt-0.5">Primary household leads</p>
              </div>

              <div className="bg-white border border-blue-200 rounded-xl p-4 shadow-xs">
                <span className="text-[11px] font-bold text-blue-800 uppercase">Total Family Members</span>
                <div className="text-2xl font-black text-blue-800 font-mono mt-1">{totalFamilyMembersCount}</div>
                <p className="text-[11px] text-blue-600 mt-0.5">Combined census population</p>
              </div>

              <div className="bg-white border border-emerald-200 rounded-xl p-4 shadow-xs">
                <span className="text-[11px] font-bold text-emerald-800 uppercase">Active Members</span>
                <div className="text-2xl font-black text-emerald-700 font-mono mt-1">
                  {hofs.filter((h) => h.status === 'Active').length}
                </div>
                <p className="text-[11px] text-emerald-600 mt-0.5">In-station community</p>
              </div>

              <div className="bg-white border border-amber-200 rounded-xl p-4 shadow-xs">
                <span className="text-[11px] font-bold text-amber-800 uppercase">Mohallah Sectors</span>
                <div className="text-2xl font-black text-amber-800 font-mono mt-1">{mohallahs.length}</div>
                <p className="text-[11px] text-amber-700 mt-0.5">Sectors A, B, C, D</p>
              </div>
            </div>

            {/* Member Master Roster Preview */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <h3 className="text-xs font-bold text-slate-900 uppercase mb-3">Community HOF Census Directory</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">ITS No</th>
                      <th className="py-2.5 px-3">HOF Full Name</th>
                      <th className="py-2.5 px-3">Mohallah</th>
                      <th className="py-2.5 px-3">Mobile</th>
                      <th className="py-2.5 px-3">Family Size</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {hofs.map((h) => (
                      <tr key={h.id} className="hover:bg-amber-50/30">
                        <td className="py-2.5 px-3 font-mono font-bold text-amber-900">{h.itsNumber}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{h.fullName}</td>
                        <td className="py-2.5 px-3 text-slate-600">{h.mohallahName || h.mohallahId}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-500">{h.mobileNumber}</td>
                        <td className="py-2.5 px-3">{(h.familyMembers?.length || 0) + 1} members</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              h.status === 'Active'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {h.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* VIEW 6: REPORTS & GENERAL RECEIPTS DEEP-DIVE                */}
        {/* ============================================================ */}
        {activeModule === 'reports' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Total General Receipts</span>
                <div className="text-2xl font-black text-slate-900 font-mono mt-1">₹{generalDonations.toLocaleString('en-IN')}</div>
                <p className="text-[11px] text-slate-500 mt-0.5">{generalReceipts.length} receipts generated</p>
              </div>

              <div className="bg-white border border-emerald-200 rounded-xl p-4 shadow-xs">
                <span className="text-[11px] font-bold text-emerald-800 uppercase">Average Donation</span>
                <div className="text-2xl font-black text-emerald-700 font-mono mt-1">
                  ₹{generalReceipts.length > 0 ? Math.round(generalDonations / generalReceipts.length).toLocaleString('en-IN') : 0}
                </div>
                <p className="text-[11px] text-emerald-600 mt-0.5">Per receipt contribution</p>
              </div>

              <div className="bg-white border border-blue-200 rounded-xl p-4 shadow-xs">
                <span className="text-[11px] font-bold text-blue-800 uppercase">System Audit Events</span>
                <div className="text-2xl font-black text-blue-800 font-mono mt-1">{activityLogs.length}</div>
                <p className="text-[11px] text-blue-600 mt-0.5">Central audit trail entries logged</p>
              </div>
            </div>

            {/* General Receipts Table */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <h3 className="text-xs font-bold text-slate-900 uppercase mb-3">General Receipts Ledger Preview</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Receipt #</th>
                      <th className="py-2.5 px-3">Payer Name</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Payment Mode</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {generalReceipts.slice(0, 8).map((r) => (
                      <tr key={r.id} className="hover:bg-amber-50/30">
                        <td className="py-2.5 px-3 font-mono font-bold text-amber-900">{r.receiptNo}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{r.payerName}</td>
                        <td className="py-2.5 px-3">{r.category}</td>
                        <td className="py-2.5 px-3">{r.paymentMode}</td>
                        <td className="py-2.5 px-3 text-slate-500 font-mono">{r.date}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">₹{r.amount.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
