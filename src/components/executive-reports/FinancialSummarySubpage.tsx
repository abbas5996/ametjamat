import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  DollarSign,
  Utensils,
  Wallet,
  Building2,
  AlertCircle,
  Filter,
  Calendar,
  CheckCircle2,
  PieChart,
  RefreshCw,
  ArrowUpRight,
  ShieldCheck,
  MapPin,
} from 'lucide-react';
import { FinancialYear, UserProfile, Mohallah } from '../../types';
import { MOHALLAH_LIST } from '../../utils/memberMaster';
import { calculateFinancialMetrics } from '../../utils/executiveReports';

interface FinancialSummarySubpageProps {
  currentUser: UserProfile;
  financialYear: FinancialYear;
  onNavigateToReceipts: () => void;
  onNavigateToReports: () => void;
}

export const FinancialSummarySubpage: React.FC<FinancialSummarySubpageProps> = ({
  financialYear,
  onNavigateToReceipts,
  onNavigateToReports,
}) => {
  // Filter States
  const [selectedYear, setSelectedYear] = useState<string>(financialYear);
  const [selectedMohallah, setSelectedMohallah] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Reset filters
  const handleResetFilters = () => {
    setSelectedYear(financialYear);
    setSelectedMohallah('all');
    setStartDate('');
    setEndDate('');
  };

  // Re-calculate metrics dynamically based on filters
  const metrics = useMemo(() => {
    return calculateFinancialMetrics(selectedYear, selectedMohallah, startDate, endDate);
  }, [selectedYear, selectedMohallah, startDate, endDate]);

  // Percentages calculation
  const fmbPct =
    metrics.fmbTarget > 0 ? Math.min(100, Math.round((metrics.fmbCollected / metrics.fmbTarget) * 100)) : 0;
  const sabeelPct =
    metrics.sabeelTarget > 0
      ? Math.min(100, Math.round((metrics.sabeelCollected / metrics.sabeelTarget) * 100))
      : 0;
  const hallPct =
    metrics.hallBookingEarnings + metrics.hallBookingOutstanding > 0
      ? Math.min(
          100,
          Math.round(
            (metrics.hallBookingEarnings /
              (metrics.hallBookingEarnings + metrics.hallBookingOutstanding)) *
              100
          )
        )
      : 100;

  // Revenue share distribution percentages
  const fmbShare =
    metrics.totalRevenue > 0 ? Math.round((metrics.fmbCollected / metrics.totalRevenue) * 100) : 0;
  const sabeelShare =
    metrics.totalRevenue > 0 ? Math.round((metrics.sabeelCollected / metrics.totalRevenue) * 100) : 0;
  const hallShare =
    metrics.totalRevenue > 0
      ? Math.round((metrics.hallBookingEarnings / metrics.totalRevenue) * 100)
      : 0;
  const generalShare =
    metrics.totalRevenue > 0
      ? Math.max(0, 100 - (fmbShare + sabeelShare + hallShare))
      : 0;

  return (
    <div className="space-y-6">
      {/* ── Global Executive Filters Bar ── */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
              <Filter className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Financial Filter Controls
              </h3>
              <p className="text-[11px] text-slate-500">
                Segment financial aggregation by Hijri/Fiscal Year, Mohallah Zone, or Date
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Year Selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-transparent font-semibold text-slate-800 outline-none cursor-pointer"
              >
                <option value="1447-1448 Hijri">1447-1448 AH (Current Year)</option>
                <option value="1446-1447 Hijri">1446-1447 AH (Previous Year)</option>
                <option value="all">All Financial Years</option>
              </select>
            </div>

            {/* Mohallah Selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={selectedMohallah}
                onChange={(e) => setSelectedMohallah(e.target.value)}
                className="bg-transparent font-semibold text-slate-800 outline-none cursor-pointer"
              >
                <option value="all">All Mohallahs & Sectors</option>
                {MOHALLAH_LIST.map((m: Mohallah) => (
                  <option key={m.id} value={m.name}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range Picker */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs">
              <span className="text-[11px] text-slate-400 font-medium">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-slate-800 outline-none text-xs"
              />
              <span className="text-[11px] text-slate-400 font-medium">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-slate-800 outline-none text-xs"
              />
            </div>

            {(selectedMohallah !== 'all' || startDate || endDate || selectedYear !== financialYear) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                title="Reset all active filters"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Executive Metric Cards (Top Row) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* 1. Total Revenue Generated */}
        <div className="bg-linear-to-br from-[#0F172A] to-slate-800 rounded-xl p-4 text-white shadow-md border border-slate-700/60 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-amber-400/10 rounded-full blur-xl pointer-events-none" />
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold tracking-wider text-amber-300 uppercase">
                Total Revenue
              </span>
              <div className="w-7 h-7 rounded-lg bg-amber-400/20 text-amber-300 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight">
              ₹ {metrics.totalRevenue.toLocaleString()}
            </div>
            <p className="text-[10px] text-slate-300 mt-0.5">
              Across FMB, Sabeel, Hall & Donations
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-700 flex items-center justify-between text-[10px]">
            <span className="text-emerald-400 font-medium flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" />
              100% Realized
            </span>
            <span className="text-slate-400 font-mono">Combined</span>
          </div>
        </div>

        {/* 2. Total FMB Collections vs Target */}
        <div className="bg-white rounded-xl p-4 shadow-xs border border-slate-200 flex flex-col justify-between hover:border-amber-400 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                FMB Faiz Collections
              </span>
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                <Utensils className="w-4 h-4" />
              </div>
            </div>
            <div className="text-lg font-bold text-slate-900 font-mono">
              ₹ {metrics.fmbCollected.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Target: <span className="font-mono font-semibold">₹ {metrics.fmbTarget.toLocaleString()}</span>
            </p>
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between text-[10px] mb-1 font-bold">
              <span className="text-slate-600">FMB Realization</span>
              <span className="text-amber-700 font-mono">{fmbPct}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${fmbPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* 3. Total Sabeel Collections vs Target */}
        <div className="bg-white rounded-xl p-4 shadow-xs border border-slate-200 flex flex-col justify-between hover:border-blue-400 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                Sabeel ul Khair
              </span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div className="text-lg font-bold text-slate-900 font-mono">
              ₹ {metrics.sabeelCollected.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Target: <span className="font-mono font-semibold">₹ {metrics.sabeelTarget.toLocaleString()}</span>
            </p>
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between text-[10px] mb-1 font-bold">
              <span className="text-slate-600">Sabeel Realization</span>
              <span className="text-blue-700 font-mono">{sabeelPct}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${sabeelPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* 4. Total Hall Booking Earnings */}
        <div className="bg-white rounded-xl p-4 shadow-xs border border-slate-200 flex flex-col justify-between hover:border-emerald-400 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                Hall Booking Yield
              </span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-lg font-bold text-emerald-800 font-mono">
              ₹ {metrics.hallBookingEarnings.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Pending: <span className="font-mono text-rose-600 font-semibold">₹ {metrics.hallBookingOutstanding.toLocaleString()}</span>
            </p>
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between text-[10px] mb-1 font-bold">
              <span className="text-slate-600">Payment Collection</span>
              <span className="text-emerald-700 font-mono">{hallPct}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${hallPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* 5. Total Outstanding / Pending Dues across Jamaat */}
        <div className="bg-rose-50/70 rounded-xl p-4 shadow-xs border border-rose-200 flex flex-col justify-between hover:border-rose-400 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold tracking-wider text-rose-800 uppercase">
                Total Jamaat Dues
              </span>
              <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-lg font-bold text-rose-700 font-mono">
              ₹ {metrics.totalOutstanding.toLocaleString()}
            </div>
            <p className="text-[11px] text-rose-600 mt-0.5">
              FMB + Sabeel + Hall Unpaid
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-rose-200/80 flex items-center justify-between text-[10px]">
            <span className="text-rose-700 font-bold">Action Required</span>
            <button
              type="button"
              onClick={onNavigateToReports}
              className="text-rose-800 font-semibold hover:underline cursor-pointer flex items-center gap-0.5"
            >
              Export Defaulters →
            </button>
          </div>
        </div>
      </div>

      {/* ── Visual Breakdown & Analytics Section ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Module Performance Cards */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-600" />
                <span>Departmental Revenue & Collection Performance</span>
              </h3>
              <p className="text-xs text-slate-500">
                Detailed progress of budgeted targets versus actual realized collections
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {selectedMohallah === 'all' ? 'All Mohallahs' : selectedMohallah}
            </span>
          </div>

          <div className="space-y-4 pt-1">
            {/* FMB Bar */}
            <div className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/60 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="font-bold text-slate-900">Faiz ul Mawaid il Burhaniyah (FMB)</span>
                  <span className="text-[11px] text-slate-500">({fmbPct}% Target Achieved)</span>
                </div>
                <div className="font-mono text-slate-700">
                  <span className="font-bold text-emerald-700">
                    ₹ {metrics.fmbCollected.toLocaleString()}
                  </span>{' '}
                  /{' '}
                  <span className="text-slate-500">
                    ₹ {metrics.fmbTarget.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-amber-500 transition-all duration-500"
                  style={{ width: `${fmbPct}%` }}
                  title={`Collected: ${fmbPct}%`}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Pending Balance: ₹ {metrics.fmbOutstanding.toLocaleString()}</span>
                <span className="text-amber-800 font-medium">Daily Thaali Distribution Fund</span>
              </div>
            </div>

            {/* Sabeel Bar */}
            <div className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/60 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  <span className="font-bold text-slate-900">Sabeel ul Khair Community Contributions</span>
                  <span className="text-[11px] text-slate-500">({sabeelPct}% Target Achieved)</span>
                </div>
                <div className="font-mono text-slate-700">
                  <span className="font-bold text-emerald-700">
                    ₹ {metrics.sabeelCollected.toLocaleString()}
                  </span>{' '}
                  /{' '}
                  <span className="text-slate-500">
                    ₹ {metrics.sabeelTarget.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-blue-600 transition-all duration-500"
                  style={{ width: `${sabeelPct}%` }}
                  title={`Collected: ${sabeelPct}%`}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Pending Balance: ₹ {metrics.sabeelOutstanding.toLocaleString()}</span>
                <span className="text-blue-800 font-medium">Residential & Commercial Sabeel</span>
              </div>
            </div>

            {/* Hall Bookings Bar */}
            <div className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/60 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                  <span className="font-bold text-slate-900">Hall & Community Facility Bookings</span>
                  <span className="text-[11px] text-slate-500">({hallPct}% Paid)</span>
                </div>
                <div className="font-mono text-slate-700">
                  <span className="font-bold text-emerald-700">
                    ₹ {metrics.hallBookingEarnings.toLocaleString()}
                  </span>{' '}
                  /{' '}
                  <span className="text-slate-500">
                    ₹ {(metrics.hallBookingEarnings + metrics.hallBookingOutstanding).toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-emerald-600 transition-all duration-500"
                  style={{ width: `${hallPct}%` }}
                  title={`Collected: ${hallPct}%`}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Unsettled Booking Dues: ₹ {metrics.hallBookingOutstanding.toLocaleString()}</span>
                <span className="text-emerald-800 font-medium">Banquet Halls, Mawaid & Guest Rooms</span>
              </div>
            </div>

            {/* General Donations */}
            <div className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                <span className="font-bold text-slate-900">General Sadaqah, Zakat & Direct Counter Receipts</span>
              </div>
              <div className="font-mono font-bold text-purple-800 text-sm">
                ₹ {metrics.generalDonationsTotal.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Contribution Split & Quick Actions */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <PieChart className="w-4 h-4 text-blue-600" />
                <span>Revenue Share Distribution</span>
              </h3>
              <p className="text-xs text-slate-500">
                Proportion of funds contributed across all streams
              </p>
            </div>

            {/* Stacked Percentage Bar */}
            <div className="space-y-1.5">
              <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                {fmbShare > 0 && (
                  <div
                    style={{ width: `${fmbShare}%` }}
                    className="bg-amber-500 h-full transition-all"
                    title={`FMB: ${fmbShare}%`}
                  />
                )}
                {sabeelShare > 0 && (
                  <div
                    style={{ width: `${sabeelShare}%` }}
                    className="bg-blue-600 h-full transition-all"
                    title={`Sabeel: ${sabeelShare}%`}
                  />
                )}
                {hallShare > 0 && (
                  <div
                    style={{ width: `${hallShare}%` }}
                    className="bg-emerald-600 h-full transition-all"
                    title={`Hall Bookings: ${hallShare}%`}
                  />
                )}
                {generalShare > 0 && (
                  <div
                    style={{ width: `${generalShare}%` }}
                    className="bg-purple-600 h-full transition-all"
                    title={`General / Zakat: ${generalShare}%`}
                  />
                )}
              </div>
            </div>

            {/* Breakdown Legend with Values */}
            <div className="space-y-2.5 pt-1 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-amber-500" />
                  <span className="text-slate-700">FMB Collections</span>
                </div>
                <div className="font-mono font-bold text-slate-900">
                  {fmbShare}% <span className="text-slate-400 font-normal">({metrics.fmbCollected > 0 ? `₹${(metrics.fmbCollected / 1000).toFixed(0)}k` : '₹0'})</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-blue-600" />
                  <span className="text-slate-700">Sabeel Collections</span>
                </div>
                <div className="font-mono font-bold text-slate-900">
                  {sabeelShare}% <span className="text-slate-400 font-normal">({metrics.sabeelCollected > 0 ? `₹${(metrics.sabeelCollected / 1000).toFixed(0)}k` : '₹0'})</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-emerald-600" />
                  <span className="text-slate-700">Hall Facility Earnings</span>
                </div>
                <div className="font-mono font-bold text-slate-900">
                  {hallShare}% <span className="text-slate-400 font-normal">({metrics.hallBookingEarnings > 0 ? `₹${(metrics.hallBookingEarnings / 1000).toFixed(0)}k` : '₹0'})</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-purple-600" />
                  <span className="text-slate-700">General Receipts / Zakat</span>
                </div>
                <div className="font-mono font-bold text-slate-900">
                  {generalShare}% <span className="text-slate-400 font-normal">({metrics.generalDonationsTotal > 0 ? `₹${(metrics.generalDonationsTotal / 1000).toFixed(0)}k` : '₹0'})</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Action Navigation Buttons */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <button
              type="button"
              onClick={onNavigateToReceipts}
              className="w-full py-2.5 px-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <span>🧾 Open General Receipt Counter</span>
            </button>
            <button
              type="button"
              onClick={onNavigateToReports}
              className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span>📊 Access Reports & Exports Hub</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Executive Governance & Audit Verification Badge ── */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>
            Financial metrics consolidated live across <span className="font-semibold text-slate-800">Faiz ul Mawaid, Sabeel ul Khair, and Facility Hall Ledgers</span>.
          </span>
        </div>
        <span className="font-mono text-[11px] text-slate-400">
          Last Synchronized: {new Date().toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
};
