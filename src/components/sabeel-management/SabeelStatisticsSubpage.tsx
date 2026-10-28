import React, { useState, useMemo } from 'react';
import {
  Calendar, Filter, Eye, Download, Printer, Search, X, CheckCircle2,
  AlertCircle, DollarSign, Gift, UserCheck, UserX, FileSpreadsheet, MapPin
} from 'lucide-react';
import { SabeelLedgerRecord, FinancialYear } from '../../types';
import { SabeelTypeRecord } from '../../utils/sabeelProductionSuite';

interface SabeelStatisticsSubpageProps {
  ledger: SabeelLedgerRecord[];
  sabeelTypes: SabeelTypeRecord[];
  financialYear: FinancialYear | { label: string } | string;
  showToast: (msg: string) => void;
}

type MetricType =
  | 'takhmeen_done'
  | 'takhmeen_not_done'
  | 'amount_pending'
  | 'gift_aid'
  | 'full_paid'
  | 'non_local_done'
  | 'non_local_not_done';

interface MetricDetailModalState {
  type: MetricType;
  title: string;
  items: SabeelLedgerRecord[];
}

const fmtINR = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export const SabeelStatisticsSubpage: React.FC<SabeelStatisticsSubpageProps> = ({
  ledger,
  sabeelTypes,
  financialYear,
  showToast,
}) => {
  const [selectedFiscalCycle, setSelectedFiscalCycle] = useState('01 Apr 2025 To 31 Mar 2026');
  const [selectedSabeelType, setSelectedSabeelType] = useState('ALL');
  const [modalState, setModalState] = useState<MetricDetailModalState | null>(null);
  const [modalSearch, setModalSearch] = useState('');

  const fiscalCycles = [
    '01 Apr 2025 To 31 Mar 2026',
    '01 Apr 2024 To 31 Mar 2025',
    '01 Apr 2026 To 31 Mar 2027',
  ];

  // Filter ledger based on selected Sabeel Type
  const filteredLedger = useMemo(() => {
    return ledger.filter(item => {
      if (selectedSabeelType === 'ALL') return true;
      return (item.category || item.sabeelType || '').toLowerCase().includes(selectedSabeelType.toLowerCase());
    });
  }, [ledger, selectedSabeelType]);

  // Derived 7 metric datasets
  const metrics = useMemo(() => {
    // 1. Takhmeen Done: Members with allocated/pledged amount > 0
    const takhmeenDone = filteredLedger.filter(r => (r.annualPledged || r.totalAllocated || 0) > 0);
    // 2. Takhmeen Not Done: Members with 0 or unassigned pledge
    const takhmeenNotDone = filteredLedger.filter(r => (r.annualPledged || r.totalAllocated || 0) === 0);
    // 3. Amount Pending: Members with outstanding balance > 0
    const amountPending = filteredLedger.filter(r => {
      const pledged = r.annualPledged || r.totalAllocated || 0;
      const paid = r.totalPaid || 0;
      return (pledged - paid) > 0;
    });
    // 4. Gift Aid Claimable: Members who paid and opted in / eligible for 25% tax relief
    const giftAid = filteredLedger.filter(r => (r.totalPaid || 0) > 0);
    // 5. Full Sabeel Paid: Members with totalPaid >= annualPledged
    const fullPaid = filteredLedger.filter(r => {
      const pledged = r.annualPledged || r.totalAllocated || 0;
      const paid = r.totalPaid || 0;
      return pledged > 0 && paid >= pledged;
    });
    // 6. Non-local Takhmeen Done: Members whose mohallah is 'Non-Local' or 'Outstation' with pledge > 0
    const nonLocalDone = filteredLedger.filter(r => {
      const isNonLocal = (r.mohallah || '').toLowerCase().includes('non-local') || 
                          (r.mohallah || '').toLowerCase().includes('outstation') ||
                          (r.category || '').toLowerCase().includes('non-local');
      return isNonLocal && (r.annualPledged || r.totalAllocated || 0) > 0;
    });
    // 7. Non-local Takhmeen Not Done
    const nonLocalNotDone = filteredLedger.filter(r => {
      const isNonLocal = (r.mohallah || '').toLowerCase().includes('non-local') || 
                          (r.mohallah || '').toLowerCase().includes('outstation') ||
                          (r.category || '').toLowerCase().includes('non-local');
      return isNonLocal && (r.annualPledged || r.totalAllocated || 0) === 0;
    });

    const totalCommitted = takhmeenDone.reduce((acc, r) => acc + (r.annualPledged || r.totalAllocated || 0), 0);
    const totalCollected = filteredLedger.reduce((acc, r) => acc + (r.totalPaid || 0), 0);
    const totalPendingAmount = amountPending.reduce((acc, r) => acc + Math.max(0, (r.annualPledged || r.totalAllocated || 0) - (r.totalPaid || 0)), 0);
    const totalGiftAid = totalCollected * 0.25;

    return {
      takhmeenDone,
      takhmeenNotDone,
      amountPending,
      giftAid,
      fullPaid,
      nonLocalDone,
      nonLocalNotDone,
      totalCommitted,
      totalCollected,
      totalPendingAmount,
      totalGiftAid,
    };
  }, [filteredLedger]);

  const openDrilldown = (type: MetricType, title: string, items: SabeelLedgerRecord[]) => {
    setModalSearch('');
    setModalState({ type, title, items });
  };

  const filteredModalItems = useMemo(() => {
    if (!modalState) return [];
    if (!modalSearch.trim()) return modalState.items;
    const q = modalSearch.toLowerCase();
    return modalState.items.filter(
      r =>
        (r.itsNumber || '').toLowerCase().includes(q) ||
        (r.hofName || r.memberName || '').toLowerCase().includes(q) ||
        (r.sabeelNumber || r.sabeelNo || '').toLowerCase().includes(q) ||
        (r.mohallah || '').toLowerCase().includes(q)
    );
  }, [modalState, modalSearch]);

  const exportModalToCSV = () => {
    if (!modalState) return;
    const headers = ['Sr.No', 'ITS Number', 'Full Name', 'Sabeel No', 'Mohalla', 'Takhmeen Pledged', 'Paid Amount', 'Pending Due'];
    const rows = filteredModalItems.map((r, i) => {
      const pledged = r.annualPledged || r.totalAllocated || 0;
      const paid = r.totalPaid || 0;
      const due = Math.max(0, pledged - paid);
      return [
        i + 1,
        `"${r.itsNumber || ''}"`,
        `"${r.hofName || r.memberName || ''}"`,
        `"${r.sabeelNumber || r.sabeelNo || ''}"`,
        `"${r.mohallah || ''}"`,
        pledged,
        paid,
        due,
      ].join(',');
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${modalState.type}_${selectedFiscalCycle.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${filteredModalItems.length} records to CSV`);
  };

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-600" />
              <span>Sabeel Statistics & Analytical Audit</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive breakdowns of Takhmeen assessments, recovery velocity, and Gift Aid tax schedules.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Fiscal Cycle Filter */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
              <span className="text-[11px] font-bold text-slate-600 uppercase">Fiscal Cycle:</span>
              <select
                value={selectedFiscalCycle}
                onChange={e => setSelectedFiscalCycle(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
              >
                {fiscalCycles.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Sabeel Type Filter */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
              <span className="text-[11px] font-bold text-slate-600 uppercase">Sabeel Type:</span>
              <select
                value={selectedSabeelType}
                onChange={e => setSelectedSabeelType(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Sabeel Types</option>
                {sabeelTypes.map(st => (
                  <option key={st.id} value={st.sabeelType}>{st.sabeelType}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 7 Analytic Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* 1. Takhmeen Done */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-emerald-400 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase">Takhmeen Done</span>
              <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <CheckCircle2 className="w-4 h-4" />
              </span>
            </div>
            <div className="text-3xl font-black text-slate-900">
              {metrics.takhmeenDone.length}
            </div>
            <div className="text-[11px] text-emerald-700 font-semibold mt-1">
              Committed: {fmtINR(metrics.totalCommitted)}
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Households with verified annual Sabeel pledge registered for this cycle.
            </p>
          </div>
          <button
            onClick={() => openDrilldown('takhmeen_done', 'Takhmeen Done - Households List', metrics.takhmeenDone)}
            className="mt-4 w-full py-2 bg-slate-50 hover:bg-emerald-50 text-emerald-700 border border-slate-200 hover:border-emerald-300 font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View More</span>
          </button>
        </div>

        {/* 2. Takhmeen Not Done */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-rose-400 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase">Takhmeen Not Done</span>
              <span className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                <AlertCircle className="w-4 h-4" />
              </span>
            </div>
            <div className="text-3xl font-black text-rose-600">
              {metrics.takhmeenNotDone.length}
            </div>
            <div className="text-[11px] text-rose-600 font-semibold mt-1">
              Assessment Pending
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Households awaiting interview or pledge finalization with Janab Amil Saheb.
            </p>
          </div>
          <button
            onClick={() => openDrilldown('takhmeen_not_done', 'Takhmeen Not Done - Pending Assessments', metrics.takhmeenNotDone)}
            className="mt-4 w-full py-2 bg-slate-50 hover:bg-rose-50 text-rose-700 border border-slate-200 hover:border-rose-300 font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View More</span>
          </button>
        </div>

        {/* 3. Amount Pending */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-amber-400 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase">Amount Pending</span>
              <span className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                <DollarSign className="w-4 h-4" />
              </span>
            </div>
            <div className="text-3xl font-black text-amber-600">
              {metrics.amountPending.length}
            </div>
            <div className="text-[11px] text-amber-700 font-semibold mt-1">
              Total Outstanding: {fmtINR(metrics.totalPendingAmount)}
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Active accounts with unpaid installments or deferred quarterly balances.
            </p>
          </div>
          <button
            onClick={() => openDrilldown('amount_pending', 'Amount Pending - Defaulters & Partial Dues', metrics.amountPending)}
            className="mt-4 w-full py-2 bg-slate-50 hover:bg-amber-50 text-amber-700 border border-slate-200 hover:border-amber-300 font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View More</span>
          </button>
        </div>

        {/* 4. Gift Aid Claimable */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-blue-400 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase">Gift Aid Claimable</span>
              <span className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Gift className="w-4 h-4" />
              </span>
            </div>
            <div className="text-3xl font-black text-blue-600">
              {metrics.giftAid.length}
            </div>
            <div className="text-[11px] text-blue-700 font-semibold mt-1">
              Reclaimable (25%): {fmtINR(metrics.totalGiftAid)}
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              UK / HMRC or international tax-relief eligible donors with active declarations.
            </p>
          </div>
          <button
            onClick={() => openDrilldown('gift_aid', 'Gift Aid Claimable Schedule', metrics.giftAid)}
            className="mt-4 w-full py-2 bg-slate-50 hover:bg-blue-50 text-blue-700 border border-slate-200 hover:border-blue-300 font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View More</span>
          </button>
        </div>

        {/* 5. Full Sabeel Paid */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-emerald-400 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase">Full Sabeel Paid</span>
              <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <UserCheck className="w-4 h-4" />
              </span>
            </div>
            <div className="text-3xl font-black text-emerald-700">
              {metrics.fullPaid.length}
            </div>
            <div className="text-[11px] text-emerald-700 font-semibold mt-1">
              100% Cleared Accounts
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Members who have completely settled their full annual commitment.
            </p>
          </div>
          <button
            onClick={() => openDrilldown('full_paid', 'Full Sabeel Paid - Cleared Accounts', metrics.fullPaid)}
            className="mt-4 w-full py-2 bg-slate-50 hover:bg-emerald-50 text-emerald-700 border border-slate-200 hover:border-emerald-300 font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View More</span>
          </button>
        </div>

        {/* 6. Non-local Takhmeen Done */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-indigo-400 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase">Non-local Done</span>
              <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <MapPin className="w-4 h-4" />
              </span>
            </div>
            <div className="text-3xl font-black text-indigo-600">
              {metrics.nonLocalDone.length}
            </div>
            <div className="text-[11px] text-indigo-700 font-semibold mt-1">
              Outstation Pledges Verified
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Diaspora and non-resident mumineen who maintain their Sabeel in this Jamaat.
            </p>
          </div>
          <button
            onClick={() => openDrilldown('non_local_done', 'Non-local Takhmeen Done', metrics.nonLocalDone)}
            className="mt-4 w-full py-2 bg-slate-50 hover:bg-indigo-50 text-indigo-700 border border-slate-200 hover:border-indigo-300 font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View More</span>
          </button>
        </div>

        {/* 7. Non-Local Takhmeen Not Done */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-amber-400 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase">Non-Local Not Done</span>
              <span className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                <UserX className="w-4 h-4" />
              </span>
            </div>
            <div className="text-3xl font-black text-amber-700">
              {metrics.nonLocalNotDone.length}
            </div>
            <div className="text-[11px] text-amber-700 font-semibold mt-1">
              Outstation Contact Required
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Non-resident files without an updated annual pledge for this cycle.
            </p>
          </div>
          <button
            onClick={() => openDrilldown('non_local_not_done', 'Non-Local Takhmeen Not Done', metrics.nonLocalNotDone)}
            className="mt-4 w-full py-2 bg-slate-50 hover:bg-amber-50 text-amber-700 border border-slate-200 hover:border-amber-300 font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View More</span>
          </button>
        </div>
      </div>

      {/* Drill-down Modal */}
      {modalState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h2 className="text-base font-bold text-slate-900">{modalState.title}</h2>
                <p className="text-xs text-slate-500">
                  Fiscal Cycle: {selectedFiscalCycle} • {filteredModalItems.length} records found
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={exportModalToCSV}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button
                  onClick={() => setModalState(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Search Filter */}
            <div className="px-6 py-3 border-b border-slate-100 bg-white">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by ITS Number, Full Name, Sabeel No, Mohallah..."
                  value={modalSearch}
                  onChange={e => setModalSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Records Table */}
            <div className="overflow-y-auto flex-1 p-6">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <th className="py-2.5 px-3">Sr.No</th>
                    <th className="py-2.5 px-3">ITS No</th>
                    <th className="py-2.5 px-4">Full Name</th>
                    <th className="py-2.5 px-3">Sabeel No</th>
                    <th className="py-2.5 px-3">Mohallah</th>
                    <th className="py-2.5 px-3 text-right">Committed</th>
                    <th className="py-2.5 px-3 text-right">Paid Amount</th>
                    <th className="py-2.5 px-3 text-right">Pending Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredModalItems.map((r, idx) => {
                    const pledged = r.annualPledged || r.totalAllocated || 0;
                    const paid = r.totalPaid || 0;
                    const due = Math.max(0, pledged - paid);
                    return (
                      <tr key={r.id || idx} className="hover:bg-amber-50/40 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-slate-500">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-bold text-amber-800">{r.itsNumber}</td>
                        <td className="py-2.5 px-4 font-bold text-slate-900">{r.hofName || r.memberName}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-700">{r.sabeelNumber || r.sabeelNo || '—'}</td>
                        <td className="py-2.5 px-3 text-slate-600">{r.mohallah || '—'}</td>
                        <td className="py-2.5 px-3 text-right font-medium">{fmtINR(pledged)}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-600">{fmtINR(paid)}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-amber-600">{fmtINR(due)}</td>
                      </tr>
                    );
                  })}
                  {filteredModalItems.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No records match the current filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Total displayed: {filteredModalItems.length} records
              </span>
              <button
                onClick={() => setModalState(null)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
