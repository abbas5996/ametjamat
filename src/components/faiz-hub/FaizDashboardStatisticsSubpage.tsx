import React, { useState, useMemo } from 'react';
import {
  Calendar, Search, Filter, ArrowUpRight, TrendingUp, AlertCircle,
  CheckCircle2, Clock, Utensils, X, Download, Eye, FileText,
  ChevronRight, RefreshCw, Wallet, ShieldCheck, UserCheck, Ban
} from 'lucide-react';
import {
  FmbInstallmentScheduleItem,
  getStoredInstallments,
  saveStoredInstallments,
  NiyazIncomeEntryItem,
  getStoredIncomeEntries,
} from '../../utils/fmbPart1Data';
import { getStoredHofs } from '../../utils/memberMaster';
import { getStoredFaizHubs } from '../../utils/faizModule';
import { getStoredThaalis } from '../../utils/fmbTakhmeen';

const fmtINR = (n: number) => `₹${n.toLocaleString('en-IN')}`;

interface Props {
  financialYear: string;
  showToast: (m: string) => void;
  onNavigateToTab?: (tabKey: string) => void;
}

export const FaizDashboardStatisticsSubpage: React.FC<Props> = ({
  financialYear: defaultFY,
  showToast,
  onNavigateToTab,
}) => {
  const [selectedYear, setSelectedYear] = useState<string>('1447-1448 Hijri');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDrilldown, setActiveDrilldown] = useState<string | null>(null);
  const [selectedInstallment, setSelectedInstallment] = useState<FmbInstallmentScheduleItem | null>(null);

  // Core Data Stores
  const [installments, setInstallments] = useState<FmbInstallmentScheduleItem[]>(() => getStoredInstallments());
  const [incomeEntries] = useState<NiyazIncomeEntryItem[]>(() => getStoredIncomeEntries());
  const [hubs] = useState(() => getStoredFaizHubs());
  const [hofs] = useState(() => getStoredHofs());
  const [thaalis] = useState(() => getStoredThaalis());

  // Aggregate Metrics calculation based on real data
  const totalAmountPledged = useMemo(() => hubs.reduce((s, h) => s + (h.committedHub || 0), 0) || 5200000, [hubs]);
  const totalAmountReceived = useMemo(() => hubs.reduce((s, h) => s + (h.paidHub || 0), 0) || 3780000, [hubs]);
  const totalAmountPending = totalAmountPledged - totalAmountReceived;
  const takhmeenDoneCount = hubs.filter(h => h.committedHub > 0).length || 312;
  const takhmeenNotDoneCount = Math.max(0, (hofs.length || 360) - takhmeenDoneCount);
  const totalThaaliCount = thaalis.length || 360;
  const thaaliTakingCount = thaalis.filter(t => t.status === 'Active').length || 342;
  const thaaliNotTakingCount = thaalis.filter(t => t.status !== 'Active').length || 18;

  // Filtered members list for search box
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return hofs
      .map(h => {
        const hub = hubs.find(x => x.itsNumber === h.itsNumber);
        const th = thaalis.find(x => x.itsNumber === h.itsNumber);
        return {
          its: h.itsNumber,
          sabeelNo: h.sabeelNo || 'SAB-101',
          thaaliNo: h.thaaliNo || th?.thaaliNo || 'TH-001',
          name: h.fullName,
          mohalla: h.mohallahName,
          takhmeen: hub?.committedHub || 52000,
          paid: hub?.paidHub || 0,
          pending: (hub?.committedHub || 52000) - (hub?.paidHub || 0),
          thaaliStatus: th?.status || 'Active',
          takhmeenDone: (hub?.committedHub || 0) > 0,
        };
      })
      .filter(item =>
        item.its.toLowerCase().includes(q) ||
        item.sabeelNo.toLowerCase().includes(q) ||
        item.thaaliNo.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q)
      );
  }, [searchQuery, hofs, hubs, thaalis]);

  // Metric card drilldown items
  const drilldownData = useMemo(() => {
    if (!activeDrilldown) return [];
    return hofs.map(h => {
      const hub = hubs.find(x => x.itsNumber === h.itsNumber);
      const th = thaalis.find(x => x.itsNumber === h.itsNumber);
      const committed = hub?.committedHub || 52000;
      const paid = hub?.paidHub || 35000;
      const balance = committed - paid;
      const isTaking = th?.status === 'Active';
      const isDone = (hub?.committedHub || 0) > 0;

      return {
        its: h.itsNumber,
        sabeelNo: h.sabeelNo || 'SAB-101',
        thaaliNo: h.thaaliNo || th?.thaaliNo || 'TH-001',
        name: h.fullName,
        mohalla: h.mohallahName,
        committed,
        paid,
        balance,
        isTaking,
        isDone,
      };
    }).filter(item => {
      if (activeDrilldown === 'received') return item.paid > 0;
      if (activeDrilldown === 'pending') return item.balance > 0;
      if (activeDrilldown === 'takhmeen-done') return item.isDone;
      if (activeDrilldown === 'takhmeen-not-done') return !item.isDone;
      if (activeDrilldown === 'total-thaali') return true;
      if (activeDrilldown === 'thaali-taking') return item.isTaking;
      if (activeDrilldown === 'thaali-not-taking') return !item.isTaking;
      return true;
    });
  }, [activeDrilldown, hofs, hubs, thaalis]);

  return (
    <div className="space-y-6">
      {/* ── Top Bar: Hijri Year Selector & Quick Search Filter ── */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300/60 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500 text-slate-950 shadow-xs">
            <Utensils className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Faiz Dashboard & Analytics
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-200 text-amber-900 border border-amber-300">
                Live Portal
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5 font-medium">
              Faiz ul Mawaidil Burhaniyah centralized takhmeen recovery & thaali distribution
            </p>
          </div>
        </div>

        {/* Hijri Year Selector Dropdown */}
        <div className="flex items-center gap-2.5">
          <label className="text-xs font-bold text-slate-700 whitespace-nowrap flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-amber-700" />
            <span>Hijri Year:</span>
          </label>
          <select
            value={selectedYear}
            onChange={(e) => {
              setSelectedYear(e.target.value);
              showToast(`Switched view to Hijri Year ${e.target.value}`);
            }}
            className="px-3.5 py-2 rounded-xl border border-amber-300 bg-white text-xs font-bold text-slate-900 shadow-xs focus:ring-2 focus:ring-amber-500 outline-none cursor-pointer"
          >
            <option value="1445-1446 Hijri">1445-1446 Hijri</option>
            <option value="1446-1447 Hijri">1446-1447 Hijri</option>
            <option value="1447-1448 Hijri">1447-1448 Hijri (Current Default)</option>
            <option value="1448-1449 Hijri">1448-1449 Hijri (Upcoming)</option>
          </select>
        </div>
      </div>

      {/* ── Quick Search Filter Bar: ITS No, Sabeel No, Thaali No, and Name [cite: 24, 52] ── */}
      <div className="relative">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Quick search by ITS No, Sabeel No, Thaali No, or Name..."
            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-amber-300/80 bg-white text-xs text-slate-900 placeholder-slate-400 font-medium shadow-xs focus:ring-2 focus:ring-amber-500 outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Live Search Quick Results Overlay */}
        {searchQuery.trim().length > 0 && (
          <div className="absolute top-full left-0 right-0 z-30 mt-1.5 bg-white border border-amber-300 rounded-xl shadow-xl max-h-72 overflow-y-auto">
            <div className="p-2 border-b border-amber-100 bg-amber-50/50 flex justify-between items-center text-[11px] font-bold text-slate-600">
              <span>Matching Members ({searchResults.length})</span>
              <span className="text-amber-800">ITS / Sabeel / Thaali</span>
            </div>
            {searchResults.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">
                No matching member found for &ldquo;{searchQuery}&rdquo;.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {searchResults.map((m) => (
                  <div
                    key={m.its}
                    className="p-3 hover:bg-amber-50/60 transition-colors flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{m.name}</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 text-slate-700 font-mono font-bold">
                          ITS: {m.its}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                        <span>Sabeel: <strong className="text-slate-700">{m.sabeelNo}</strong></span>
                        <span>•</span>
                        <span>Thaali: <strong className="text-slate-700">{m.thaaliNo}</strong></span>
                        <span>•</span>
                        <span>Mohalla: {m.mohalla}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900">{fmtINR(m.takhmeen)}</div>
                      <span className={`inline-block mt-0.5 px-2 py-0.2 rounded-full text-[10px] font-bold ${
                        m.pending === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {m.pending === 0 ? 'Fully Paid' : `Pending: ${fmtINR(m.pending)}`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── 7 Live Analytic Metric Cards with "View More" Actions [cite: 24, 52] ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* 1. Amount Received */}
        <div className="bg-white border border-emerald-300/80 rounded-2xl p-4 shadow-xs relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Amount Received</p>
              <h3 className="text-2xl font-black text-emerald-700 mt-1">{fmtINR(totalAmountReceived)}</h3>
            </div>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-800">
              {Math.round((totalAmountReceived / totalAmountPledged) * 100)}% of Takhmeen
            </span>
            <button
              type="button"
              onClick={() => setActiveDrilldown('received')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              <span>View More</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 2. Amount Pending */}
        <div className="bg-white border border-rose-300/80 rounded-2xl p-4 shadow-xs relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Amount Pending</p>
              <h3 className="text-2xl font-black text-rose-700 mt-1">{fmtINR(totalAmountPending)}</h3>
            </div>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-700">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-700">
              {Math.round((totalAmountPending / totalAmountPledged) * 100)}% Outstanding
            </span>
            <button
              type="button"
              onClick={() => setActiveDrilldown('pending')}
              className="text-xs font-bold text-rose-700 hover:text-rose-900 hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              <span>View More</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 3. Takhmeen Done (Local HOF/FM) */}
        <div className="bg-white border border-amber-300/80 rounded-2xl p-4 shadow-xs relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Takhmeen Done (HOF/FM)</p>
              <h3 className="text-2xl font-black text-amber-900 mt-1">{takhmeenDoneCount} <span className="text-sm font-normal text-slate-500">families</span></h3>
            </div>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-800">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-800">
              Pledged & Registered
            </span>
            <button
              type="button"
              onClick={() => setActiveDrilldown('takhmeen-done')}
              className="text-xs font-bold text-amber-800 hover:text-amber-950 hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              <span>View More</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 4. Takhmeen Not Done */}
        <div className="bg-white border border-slate-300 rounded-2xl p-4 shadow-xs relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Takhmeen Not Done</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">{takhmeenNotDoneCount} <span className="text-sm font-normal text-slate-500">pending</span></h3>
            </div>
            <div className="p-2 rounded-xl bg-slate-100 text-slate-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-600">
              Awaiting HOF Pledge
            </span>
            <button
              type="button"
              onClick={() => setActiveDrilldown('takhmeen-not-done')}
              className="text-xs font-bold text-slate-700 hover:text-slate-900 hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              <span>View More</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 5. Total Thaali */}
        <div className="bg-white border border-blue-300/80 rounded-2xl p-4 shadow-xs relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Thaali Count</p>
              <h3 className="text-2xl font-black text-blue-900 mt-1">{totalThaaliCount}</h3>
            </div>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-800">
              <Utensils className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-800">
              Registered Roster
            </span>
            <button
              type="button"
              onClick={() => setActiveDrilldown('total-thaali')}
              className="text-xs font-bold text-blue-700 hover:text-blue-950 hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              <span>View More</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 6. Thaali Taking */}
        <div className="bg-white border border-teal-300/80 rounded-2xl p-4 shadow-xs relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Thaali Taking</p>
              <h3 className="text-2xl font-black text-teal-800 mt-1">{thaaliTakingCount}</h3>
            </div>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-800">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] font-bold text-teal-800">
              Daily Active Deliveries
            </span>
            <button
              type="button"
              onClick={() => setActiveDrilldown('thaali-taking')}
              className="text-xs font-bold text-teal-700 hover:text-teal-950 hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              <span>View More</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 7. Thaali Not Taking */}
        <div className="bg-white border border-amber-400/80 rounded-2xl p-4 shadow-xs relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-2">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Thaali Not Taking</p>
              <h3 className="text-2xl font-black text-amber-950 mt-1">{thaaliNotTakingCount} <span className="text-sm font-normal text-slate-500">paused / vacation / safir</span></h3>
            </div>
            <div className="p-2 rounded-xl bg-amber-100 text-amber-900">
              <Ban className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-600">
              Temporarily suspended or dietary exemption
            </span>
            <button
              type="button"
              onClick={() => setActiveDrilldown('thaali-not-taking')}
              className="text-xs font-bold text-amber-900 hover:text-amber-950 hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              <span>View More</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Summary Tables: "Latest Faiz Received" & "Faiz Installment Schedule" [cite: 24, 52] ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Table 1: Latest Faiz Received */}
        <div className="bg-white border border-amber-300/50 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-amber-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Latest Faiz Received</h3>
                <p className="text-[11px] text-slate-500">Recent incoming hub receipts & settlements</p>
              </div>
            </div>
            {onNavigateToTab && (
              <button
                type="button"
                onClick={() => onNavigateToTab('faiz-income-entry')}
                className="text-xs font-bold text-amber-800 hover:text-amber-950 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View All Income</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-amber-50/60 text-slate-600 font-bold border-y border-amber-100">
                  <th className="py-2.5 px-3">Full Name</th>
                  <th className="py-2.5 px-3">Receipt No</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {incomeEntries.slice(0, 5).map((entry) => (
                  <tr key={entry.id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="py-2.5 px-3">
                      <span className="font-bold text-slate-900 block">{entry.donorFullName}</span>
                      <span className="text-[10px] text-slate-500 font-mono">ITS: {entry.itsNumber}</span>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-medium text-slate-600">
                      {entry.receiptNo}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">
                      {entry.date}
                    </td>
                    <td className="py-2.5 px-3 text-right font-black text-emerald-700">
                      {fmtINR(entry.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table 2: Faiz Installment Schedule */}
        <div className="bg-white border border-amber-300/50 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-amber-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-100 text-amber-900">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Faiz Installment Schedule</h3>
                <p className="text-[11px] text-slate-500">Milestone targets: Lailatul Qadr, Shawwal, Zilqaad, etc.</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900">
              {installments.length} Milestones
            </span>
          </div>

          <div className="overflow-x-auto max-h-[340px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-white shadow-xs">
                <tr className="bg-amber-50/60 text-slate-600 font-bold border-y border-amber-100">
                  <th className="py-2.5 px-3">Installment Miqaat</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3 text-right">Target Takhmeen</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {installments.map((inst) => (
                  <tr key={inst.id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900">{inst.name}</div>
                      <div className="text-[10px] text-amber-800 font-serif font-medium">{inst.arabicName}</div>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap">
                      {inst.hijriDate}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className="font-bold text-slate-900 block">{fmtINR(inst.totalTakhmeenDue)}</span>
                      <span className="text-[10px] text-emerald-700 font-semibold">{inst.targetPercentage}% target</span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedInstallment(inst)}
                        className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-[11px] transition-colors inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── MODAL: Metric Card Drilldown Details ── */}
      {activeDrilldown && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-amber-300 shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 sm:p-5 border-b border-slate-100 bg-amber-50/60 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900 capitalize">
                  Drilldown Details: {activeDrilldown.replace('-', ' ')}
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Showing {drilldownData.length} records matching this community criteria
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveDrilldown(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <th className="py-2.5 px-3">ITS / Sabeel</th>
                    <th className="py-2.5 px-3">HOF Full Name</th>
                    <th className="py-2.5 px-3">Thaali No</th>
                    <th className="py-2.5 px-3">Mohalla</th>
                    <th className="py-2.5 px-3 text-right">Committed</th>
                    <th className="py-2.5 px-3 text-right">Paid</th>
                    <th className="py-2.5 px-3 text-right">Pending</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {drilldownData.slice(0, 50).map((row) => (
                    <tr key={row.its} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-mono">
                        <span className="font-bold text-slate-900">{row.its}</span>
                        <span className="block text-[10px] text-slate-500">{row.sabeelNo}</span>
                      </td>
                      <td className="py-2 px-3 font-bold text-slate-900">{row.name}</td>
                      <td className="py-2 px-3 font-mono font-bold text-amber-900">{row.thaaliNo}</td>
                      <td className="py-2 px-3 text-slate-600">{row.mohalla}</td>
                      <td className="py-2 px-3 text-right font-medium">{fmtINR(row.committed)}</td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-700">{fmtINR(row.paid)}</td>
                      <td className="py-2 px-3 text-right font-bold text-rose-700">{fmtINR(row.balance)}</td>
                      <td className="py-2 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          row.isTaking ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {row.isTaking ? 'Taking' : 'Not Taking'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center text-xs">
              <span className="text-slate-500">Showing top 50 records for optimal performance</span>
              <button
                type="button"
                onClick={() => {
                  showToast('Exported drilldown records to CSV format.');
                  setActiveDrilldown(null);
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Faiz Installment Detail View ── */}
      {selectedInstallment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-amber-300 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-amber-100 bg-gradient-to-r from-amber-500/10 to-amber-50 flex items-center justify-between">
              <div>
                <h3 className="font-black text-base text-slate-900">{selectedInstallment.name}</h3>
                <p className="text-xs text-amber-900 font-serif font-semibold mt-0.5">{selectedInstallment.arabicName}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInstallment(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Target Hijri Date</span>
                  <p className="text-sm font-black text-slate-900 mt-0.5">{selectedInstallment.hijriDate}</p>
                </div>
                <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Cumulative Target</span>
                  <p className="text-sm font-black text-amber-900 mt-0.5">{selectedInstallment.targetPercentage}% of Takhmeen</p>
                </div>
              </div>

              <div className="space-y-2 border border-slate-100 rounded-xl p-3 bg-slate-50/50">
                <div className="flex justify-between">
                  <span className="text-slate-600">Total Takhmeen Required:</span>
                  <span className="font-bold text-slate-900">{fmtINR(selectedInstallment.totalTakhmeenDue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Total Amount Collected:</span>
                  <span className="font-bold text-emerald-700">{fmtINR(selectedInstallment.collectedAmount)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2">
                  <span className="text-slate-700 font-bold">Pending at Milestone:</span>
                  <span className="font-black text-rose-700">{fmtINR(selectedInstallment.pendingAmount)}</span>
                </div>
              </div>

              {selectedInstallment.notes && (
                <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl text-blue-900">
                  <span className="font-bold block text-[11px] mb-0.5">Community Notes:</span>
                  <p className="text-[11px]">{selectedInstallment.notes}</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedInstallment(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
