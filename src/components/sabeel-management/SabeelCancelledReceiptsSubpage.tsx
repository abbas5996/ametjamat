import React, { useState, useMemo } from 'react';
import {
  Ban, Search, Calendar, Printer, FileSpreadsheet, RefreshCw, XCircle, User
} from 'lucide-react';
import { CancelledReceipt } from '../../utils/sabeelExtended';

interface SabeelCancelledReceiptsSubpageProps {
  cancelledReceipts: CancelledReceipt[];
  showToast: (msg: string) => void;
}

const fmtINR = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export const SabeelCancelledReceiptsSubpage: React.FC<SabeelCancelledReceiptsSubpageProps> = ({
  cancelledReceipts,
  showToast,
}) => {
  const [fromDate, setFromDate] = useState('2025-01-01');
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return cancelledReceipts.filter(r => {
      const cDate = (r.cancelledDate || r.originalPaymentDate || r.cancellationDate || r.originalDate || '');
      if (cDate && (cDate < fromDate || cDate > toDate)) return false;
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const m1 = (r.receiptNo || r.originalReceiptNo || '').toLowerCase().includes(q);
        const m2 = (r.itsNumber || '').toLowerCase().includes(q);
        const m3 = (r.memberName || r.hofName || '').toLowerCase().includes(q);
        if (!m1 && !m2 && !m3) return false;
      }
      return true;
    });
  }, [cancelledReceipts, fromDate, toDate, search]);

  const totalCancelledAmount = useMemo(() => {
    return filtered.reduce((acc, r) => acc + (r.amount || 0), 0);
  }, [filtered]);

  const handleExportCSV = () => {
    const headers = ['Sr.No', 'Receipt No', 'Original Date', 'Cancelled Date', 'ITS No', 'Member Name', 'Cancelled Amount', 'Reason', 'Cancelled By'];
    const rows = filtered.map((r, i) => [
      i + 1,
      `"${r.receiptNo || r.originalReceiptNo}"`,
      `"${r.originalPaymentDate || r.originalDate}"`,
      `"${r.cancelledDate || r.cancellationDate}"`,
      `"${r.itsNumber}"`,
      `"${r.memberName || r.hofName}"`,
      r.amount,
      `"${r.reason || r.cancellationReason}"`,
      `"${r.cancelledBy}"`,
    ].join(','));
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `Cancelled_Sabeel_Receipts_${fromDate}_to_${toDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${filtered.length} cancelled receipts to CSV`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Ban className="w-5 h-5 text-rose-600" />
              <span>Cancelled Sabeel Receipts Register</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Permanent audit ledger of voided or cancelled transaction vouchers with authorization rationale.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* Date Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 text-xs">
          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Search Receipt / ITS</label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search Receipt No, ITS, Name..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 font-medium"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-rose-50 border border-rose-200 rounded-xl px-5 py-3 flex items-center justify-between text-xs">
        <span className="font-bold text-rose-900">
          Showing {filtered.length} cancelled vouchers
        </span>
        <div className="font-bold text-slate-800">
          Total Voided Amount: <span className="font-black text-rose-600 text-sm ml-1">{fmtINR(totalCancelledAmount)}</span>
        </div>
      </div>

      {/* Grid Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-3">Sr.No</th>
                <th className="py-2.5 px-3">Receipt No</th>
                <th className="py-2.5 px-3">Original Date</th>
                <th className="py-2.5 px-3">Cancelled Date</th>
                <th className="py-2.5 px-3">ITS No</th>
                <th className="py-2.5 px-4">Member Name</th>
                <th className="py-2.5 px-3 text-right">Amount Voided</th>
                <th className="py-2.5 px-4">Reason for Cancellation</th>
                <th className="py-2.5 px-3">Cancelled By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.map((r, idx) => (
                <tr key={r.id || r.originalReceiptNo} className="hover:bg-amber-50/40 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-slate-500">{idx + 1}</td>
                  <td className="py-2.5 px-3 font-black text-slate-900 font-mono">{r.receiptNo || r.originalReceiptNo}</td>
                  <td className="py-2.5 px-3 text-slate-500">{r.originalPaymentDate || r.originalDate}</td>
                  <td className="py-2.5 px-3 text-rose-700 font-bold">{r.cancelledDate || r.cancellationDate}</td>
                  <td className="py-2.5 px-3 font-bold text-amber-800">{r.itsNumber}</td>
                  <td className="py-2.5 px-4 font-bold text-slate-900">{r.memberName || r.hofName}</td>
                  <td className="py-2.5 px-3 text-right font-black text-rose-600">{fmtINR(r.amount)}</td>
                  <td className="py-2.5 px-4 text-slate-600 max-w-xs">{r.reason || r.cancellationReason}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-semibold">
                      {r.cancelledBy}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No cancelled receipts found in this date period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
