import React, { useState, useMemo } from 'react';
import {
  Calendar, CreditCard, Search, Filter, Printer, FileSpreadsheet, RefreshCw,
  TrendingUp, BarChart3, ArrowUpRight
} from 'lucide-react';
import { SabeelTransactionEntry, SabeelLedgerRecord, SabeelPaymentMode } from '../../types';
import { SabeelTypeRecord } from '../../utils/sabeelProductionSuite';

interface SabeelDatewisePaymentwiseSubpageProps {
  transactions: SabeelTransactionEntry[];
  ledger: SabeelLedgerRecord[];
  sabeelTypes: SabeelTypeRecord[];
  showToast: (msg: string) => void;
}

const fmtINR = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export const SabeelDatewisePaymentwiseSubpage: React.FC<SabeelDatewisePaymentwiseSubpageProps> = ({
  transactions,
  ledger,
  sabeelTypes,
  showToast,
}) => {
  const [activeReportTab, setActiveReportTab] = useState<'datewise' | 'paymentwise'>('datewise');

  // Filters
  const [fromDate, setFromDate] = useState('2025-04-01');
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
  const [mohallaFilter, setMohallaFilter] = useState('ALL');
  const [sabeelTypeFilter, setSabeelTypeFilter] = useState('ALL');
  const [sabeelNoFilter, setSabeelNoFilter] = useState('');
  const [userFilter, setUserFilter] = useState('ALL');
  const [payTypeFilter, setPayTypeFilter] = useState('ALL');

  // Distinct Mohallas & Users
  const distinctMohallas = useMemo(() => {
    const set = new Set<string>();
    ledger.forEach(r => {
      if (r.mohallah) set.add(r.mohallah);
    });
    return Array.from(set).sort();
  }, [ledger]);

  const distinctUsers = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach(t => {
      if (t.receivedBy) set.add(t.receivedBy);
    });
    return Array.from(set).sort();
  }, [transactions]);

  // Filtered transactions
  const filtered = useMemo(() => {
    return transactions.filter(t => {
      const pd = t.paymentDate || t.date;
      if (pd < fromDate || pd > toDate) return false;
      if (mohallaFilter !== 'ALL' && (t.mohallah || '') !== mohallaFilter) return false;
      if (sabeelNoFilter.trim() && !(t.sabeelNo || '').toLowerCase().includes(sabeelNoFilter.toLowerCase().trim())) return false;
      if (userFilter !== 'ALL' && (t.receivedBy || t.collectedBy || '') !== userFilter) return false;
      if (payTypeFilter !== 'ALL' && (t.paymentMode || '') !== payTypeFilter) return false;
      return true;
    });
  }, [transactions, fromDate, toDate, mohallaFilter, sabeelNoFilter, userFilter, payTypeFilter]);

  // Datewise Aggregations
  const datewiseData = useMemo(() => {
    const map: Record<string, { date: string; count: number; cash: number; upi: number; bank: number; cheque: number; total: number }> = {};
    filtered.forEach(t => {
      const d = t.paymentDate || t.date || '';
      if (!d) return;
      if (!map[d]) {
        map[d] = { date: d, count: 0, cash: 0, upi: 0, bank: 0, cheque: 0, total: 0 };
      }
      const paid = t.amountPaid ?? t.amount ?? 0;
      map[d].count += 1;
      map[d].total += paid;

      const mode = (t.paymentMode || '').toLowerCase();
      if (mode.includes('cash')) map[d].cash += paid;
      else if (mode.includes('upi')) map[d].upi += paid;
      else if (mode.includes('bank') || mode.includes('neft')) map[d].bank += paid;
      else if (mode.includes('cheque')) map[d].cheque += paid;
    });

    const list = Object.values(map).sort((a, b) => b.date.localeCompare(a.date));
    const grandTotal = list.reduce((acc, row) => acc + row.total, 0);
    const grandCash = list.reduce((acc, row) => acc + row.cash, 0);
    const grandUpi = list.reduce((acc, row) => acc + row.upi, 0);
    const grandBank = list.reduce((acc, row) => acc + row.bank, 0);
    const grandCheque = list.reduce((acc, row) => acc + row.cheque, 0);
    const grandCount = list.reduce((acc, row) => acc + row.count, 0);

    return { list, grandTotal, grandCash, grandUpi, grandBank, grandCheque, grandCount };
  }, [filtered]);

  // Paymentwise Aggregations
  const paymentwiseData = useMemo(() => {
    const map: Record<string, { mode: string; count: number; total: number; collectors: Set<string> }> = {};
    const MODES = ['Cash', 'UPI', 'Bank Transfer', 'Cheque'];
    MODES.forEach(m => {
      map[m] = { mode: m, count: 0, total: 0, collectors: new Set() };
    });

    filtered.forEach(t => {
      const m = t.paymentMode || 'Cash';
      if (!map[m]) map[m] = { mode: m, count: 0, total: 0, collectors: new Set() };
      map[m].count += 1;
      map[m].total += (t.amountPaid ?? t.amount ?? 0);
      const collector = t.receivedBy || t.collectedBy;
      if (collector) map[m].collectors.add(collector);
    });

    const list = Object.values(map);
    const grandTotal = list.reduce((acc, row) => acc + row.total, 0);
    const grandCount = list.reduce((acc, row) => acc + row.count, 0);

    return { list, grandTotal, grandCount };
  }, [filtered]);

  const resetFilters = () => {
    setFromDate('2025-04-01');
    setToDate(new Date().toISOString().split('T')[0]);
    setMohallaFilter('ALL');
    setSabeelTypeFilter('ALL');
    setSabeelNoFilter('');
    setUserFilter('ALL');
    setPayTypeFilter('ALL');
    showToast('Filters reset');
  };

  const handleExportCSV = () => {
    if (activeReportTab === 'datewise') {
      const headers = ['Date', 'Receipts Count', 'Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Daily Total'];
      const rows = datewiseData.list.map(r => [
        `"${r.date}"`,
        r.count,
        r.cash,
        r.upi,
        r.bank,
        r.cheque,
        r.total,
      ].join(','));
      rows.push(['Grand Total', datewiseData.grandCount, datewiseData.grandCash, datewiseData.grandUpi, datewiseData.grandBank, datewiseData.grandCheque, datewiseData.grandTotal].join(','));
      const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
      const link = document.createElement('a');
      link.setAttribute('href', encodeURI(csv));
      link.setAttribute('download', `Datewise_Sabeel_Report_${fromDate}_${toDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const headers = ['Payment Mode', 'Transaction Count', 'Total Collected', 'Percentage Share'];
      const rows = paymentwiseData.list.map(r => [
        `"${r.mode}"`,
        r.count,
        r.total,
        paymentwiseData.grandTotal > 0 ? `${((r.total / paymentwiseData.grandTotal) * 100).toFixed(1)}%` : '0%',
      ].join(','));
      rows.push(['Grand Total', paymentwiseData.grandCount, paymentwiseData.grandTotal, '100%'].join(','));
      const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
      const link = document.createElement('a');
      link.setAttribute('href', encodeURI(csv));
      link.setAttribute('download', `Paymentwise_Sabeel_Report_${fromDate}_${toDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    showToast('Report exported to CSV');
  };

  return (
    <div className="space-y-6">
      {/* Top Filter Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-600" />
              <span>Datewise & Paymentwise Sabeel Audit Reports</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Comparative reconciliation schedules showing daily collection velocity and payment mode distribution.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* View Switcher */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setActiveReportTab('datewise')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeReportTab === 'datewise'
                    ? 'bg-amber-400 text-slate-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Datewise Report
              </button>
              <button
                onClick={() => setActiveReportTab('paymentwise')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeReportTab === 'paymentwise'
                    ? 'bg-amber-400 text-slate-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Paymentwise Report
              </button>
            </div>

            <button
              onClick={handleExportCSV}
              className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={resetFilters}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              title="Reset Filters"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Inputs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4 text-xs">
          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Mohallah</label>
            <select
              value={mohallaFilter}
              onChange={e => setMohallaFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-amber-500 bg-white cursor-pointer"
            >
              <option value="ALL">All Mohallahs</option>
              {distinctMohallas.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Sabeel No</label>
            <input
              type="text"
              placeholder="e.g. SB-015"
              value={sabeelNoFilter}
              onChange={e => setSabeelNoFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Payment Mode</label>
            <select
              value={payTypeFilter}
              onChange={e => setPayTypeFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-amber-500 bg-white cursor-pointer"
            >
              <option value="ALL">All Modes</option>
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cheque">Cheque</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Collector / User</label>
            <select
              value={userFilter}
              onChange={e => setUserFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-amber-500 bg-white cursor-pointer"
            >
              <option value="ALL">All Users</option>
              {distinctUsers.map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Datewise View */}
      {activeReportTab === 'datewise' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">
              Datewise Daily Collections Matrix ({datewiseData.list.length} active collection days)
            </span>
            <span className="text-xs font-black text-emerald-700">
              Grand Total: {fmtINR(datewiseData.grandTotal)}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-3 text-center">Receipts Count</th>
                  <th className="py-2.5 px-4 text-right">Cash (₹)</th>
                  <th className="py-2.5 px-4 text-right">UPI (₹)</th>
                  <th className="py-2.5 px-4 text-right">Bank Transfer (₹)</th>
                  <th className="py-2.5 px-4 text-right">Cheque (₹)</th>
                  <th className="py-2.5 px-4 text-right font-black">Daily Grand Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {datewiseData.list.map(row => (
                  <tr key={row.date} className="hover:bg-amber-50/40 transition-colors">
                    <td className="py-2.5 px-4 font-bold text-slate-900">{row.date}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-600">{row.count}</td>
                    <td className="py-2.5 px-4 text-right font-medium text-slate-700">{row.cash > 0 ? fmtINR(row.cash) : '—'}</td>
                    <td className="py-2.5 px-4 text-right font-medium text-purple-700">{row.upi > 0 ? fmtINR(row.upi) : '—'}</td>
                    <td className="py-2.5 px-4 text-right font-medium text-blue-700">{row.bank > 0 ? fmtINR(row.bank) : '—'}</td>
                    <td className="py-2.5 px-4 text-right font-medium text-amber-700">{row.cheque > 0 ? fmtINR(row.cheque) : '—'}</td>
                    <td className="py-2.5 px-4 text-right font-black text-emerald-600">{fmtINR(row.total)}</td>
                  </tr>
                ))}
                {datewiseData.list.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No collections recorded within the selected date range.
                    </td>
                  </tr>
                )}
              </tbody>
              {datewiseData.list.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-100 text-slate-900 font-black border-t-2 border-slate-300">
                    <td className="py-3 px-4 uppercase tracking-wider">Grand Total</td>
                    <td className="py-3 px-3 text-center font-black">{datewiseData.grandCount}</td>
                    <td className="py-3 px-4 text-right">{fmtINR(datewiseData.grandCash)}</td>
                    <td className="py-3 px-4 text-right text-purple-800">{fmtINR(datewiseData.grandUpi)}</td>
                    <td className="py-3 px-4 text-right text-blue-800">{fmtINR(datewiseData.grandBank)}</td>
                    <td className="py-3 px-4 text-right text-amber-800">{fmtINR(datewiseData.grandCheque)}</td>
                    <td className="py-3 px-4 text-right text-emerald-700 text-sm">{fmtINR(datewiseData.grandTotal)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* Paymentwise View */}
      {activeReportTab === 'paymentwise' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">
                Payment Channel Volume & Share Analysis
              </span>
              <span className="text-xs font-black text-emerald-700">
                Total Realized: {fmtINR(paymentwiseData.grandTotal)}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <th className="py-2.5 px-4">Payment Channel / Mode</th>
                    <th className="py-2.5 px-3 text-center">Transactions</th>
                    <th className="py-2.5 px-4 text-right font-black">Total Collections (₹)</th>
                    <th className="py-2.5 px-4 text-right">Percentage Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {paymentwiseData.list.map(row => {
                    const share = paymentwiseData.grandTotal > 0
                      ? ((row.total / paymentwiseData.grandTotal) * 100).toFixed(1)
                      : '0';
                    return (
                      <tr key={row.mode} className="hover:bg-amber-50/40 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">{row.mode}</td>
                        <td className="py-3 px-3 text-center font-bold text-slate-700">{row.count}</td>
                        <td className="py-3 px-4 text-right font-black text-emerald-600 text-sm">
                          {fmtINR(row.total)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800">
                            {share}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 text-slate-900 font-black border-t-2 border-slate-300">
                    <td className="py-3 px-4 uppercase tracking-wider">Grand Total</td>
                    <td className="py-3 px-3 text-center font-black">{paymentwiseData.grandCount}</td>
                    <td className="py-3 px-4 text-right text-emerald-700 text-sm">{fmtINR(paymentwiseData.grandTotal)}</td>
                    <td className="py-3 px-4 text-right">100.0%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Quick Summary Cards */}
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase block mb-1">Direct Bank & Digital Share</span>
              <div className="text-2xl font-black text-purple-700">
                {paymentwiseData.grandTotal > 0
                  ? (
                      ((paymentwiseData.list.find(x => x.mode === 'UPI')?.total || 0) +
                        (paymentwiseData.list.find(x => x.mode === 'Bank Transfer')?.total || 0)) /
                      paymentwiseData.grandTotal *
                      100
                    ).toFixed(1)
                  : 0}%
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Proportion of digital transfers directly reconciled to Jamaat central accounts.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase block mb-1">Cash POS Volume</span>
              <div className="text-2xl font-black text-emerald-700">
                {fmtINR(paymentwiseData.list.find(x => x.mode === 'Cash')?.total || 0)}
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Counter collections requiring physical bank deposit slip endorsement.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
