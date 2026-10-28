import React, { useState, useMemo } from 'react';
import {
  Receipt, Search, Filter, Printer, Download, Plus, RefreshCw, X, Eye, Ban,
  FileSpreadsheet, Calendar, User, CreditCard, ShieldCheck, QrCode
} from 'lucide-react';
import { SabeelTransactionEntry, SabeelLedgerRecord, UserProfile, SabeelPaymentMode } from '../../types';
import { SabeelReceiptConfig, SabeelTypeRecord } from '../../utils/sabeelProductionSuite';

interface SabeelViewPrintReceiptsSubpageProps {
  transactions: SabeelTransactionEntry[];
  setTransactions: React.Dispatch<React.SetStateAction<SabeelTransactionEntry[]>>;
  ledger: SabeelLedgerRecord[];
  sabeelTypes: SabeelTypeRecord[];
  receiptConfig: SabeelReceiptConfig;
  currentUser: UserProfile;
  showToast: (msg: string) => void;
  onNavigateToCollection: () => void;
}

const fmtINR = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export const SabeelViewPrintReceiptsSubpage: React.FC<SabeelViewPrintReceiptsSubpageProps> = ({
  transactions,
  setTransactions,
  ledger,
  sabeelTypes,
  receiptConfig,
  currentUser,
  showToast,
  onNavigateToCollection,
}) => {
  // Filters
  const [fromDate, setFromDate] = useState('2025-04-01');
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
  const [itsFilter, setItsFilter] = useState('');
  const [sabeelFilter, setSabeelFilter] = useState('');
  const [mohallaFilter, setMohallaFilter] = useState('ALL');
  const [sabeelTypeFilter, setSabeelTypeFilter] = useState('ALL');
  const [userFilter, setUserFilter] = useState('ALL');
  const [payTypeFilter, setPayTypeFilter] = useState<string>('ALL');

  // Preview Modal
  const [receiptToPreview, setReceiptToPreview] = useState<SabeelTransactionEntry | null>(null);

  // Mohallas
  const distinctMohallas = useMemo(() => {
    const set = new Set<string>();
    ledger.forEach(r => {
      if (r.mohallah) set.add(r.mohallah);
    });
    return Array.from(set).sort();
  }, [ledger]);

  // Distinct Collectors
  const distinctUsers = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach(t => {
      if (t.receivedBy) set.add(t.receivedBy);
    });
    return Array.from(set).sort();
  }, [transactions]);

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const pd = t.paymentDate || t.date;
      if (pd < fromDate || pd > toDate) return false;
      if (itsFilter.trim() && !(t.itsNumber || '').toLowerCase().includes(itsFilter.toLowerCase().trim())) return false;
      if (sabeelFilter.trim() && !(t.sabeelNo || '').toLowerCase().includes(sabeelFilter.toLowerCase().trim())) return false;
      if (mohallaFilter !== 'ALL' && (t.mohallah || '') !== mohallaFilter) return false;
      if (payTypeFilter !== 'ALL' && (t.paymentMode || '') !== payTypeFilter) return false;
      if (userFilter !== 'ALL' && (t.receivedBy || '') !== userFilter) return false;
      return true;
    });
  }, [
    transactions,
    fromDate,
    toDate,
    itsFilter,
    sabeelFilter,
    mohallaFilter,
    payTypeFilter,
    userFilter,
  ]);

  const totalAmount = useMemo(() => {
    return filteredTransactions.reduce((acc, t) => acc + (t.amountPaid || 0), 0);
  }, [filteredTransactions]);

  const resetFilters = () => {
    setFromDate('2025-04-01');
    setToDate(new Date().toISOString().split('T')[0]);
    setItsFilter('');
    setSabeelFilter('');
    setMohallaFilter('ALL');
    setSabeelTypeFilter('ALL');
    setUserFilter('ALL');
    setPayTypeFilter('ALL');
    showToast('Receipt filters reset');
  };

  const handleBulkPrint = () => {
    if (filteredTransactions.length === 0) {
      showToast('No receipts to print.');
      return;
    }
    showToast(`Printing ${filteredTransactions.length} receipts...`);
    window.print();
  };

  const handleExportCSV = () => {
    const headers = ['Sr.No', 'Receipt No', 'Date', 'Sabeel No', 'ITS No', 'Member Name', 'Mohallah', 'Payment Mode', 'Amount Paid', 'Received By'];
    const rows = filteredTransactions.map((t, i) => [
      i + 1,
      `"${t.receiptNo}"`,
      `"${t.paymentDate}"`,
      `"${t.sabeelNo || ''}"`,
      `"${t.itsNumber}"`,
      `"${t.memberName}"`,
      `"${t.mohallah || ''}"`,
      `"${t.paymentMode}"`,
      t.amountPaid,
      `"${t.receivedBy || ''}"`,
    ].join(','));
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Sabeel_Receipts_${fromDate}_to_${toDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${filteredTransactions.length} receipts to CSV`);
  };

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Receipt className="w-5 h-5 text-amber-600" />
              <span>View / Print Sabeel Receipts Register</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive transaction log with date range, mode filters, bulk printing, and authentic Jamaat receipt slip generation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onNavigateToCollection}
              className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Receipt (POS)</span>
            </button>
            <button
              onClick={handleBulkPrint}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Bulk Print</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export CSV</span>
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
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mt-4 text-xs">
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
            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">ITS Number</label>
            <input
              type="text"
              placeholder="Filter ITS..."
              value={itsFilter}
              onChange={e => setItsFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Sabeel No</label>
            <input
              type="text"
              placeholder="e.g. SB-015"
              value={sabeelFilter}
              onChange={e => setSabeelFilter(e.target.value)}
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
            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Pay Type</label>
            <select
              value={payTypeFilter}
              onChange={e => setPayTypeFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-amber-500 bg-white cursor-pointer"
            >
              <option value="ALL">All Modes</option>
              <option value="Cash">Cash</option>
              <option value="UPI">UPI / QR</option>
              <option value="Bank Transfer">Bank Transfer (NEFT)</option>
              <option value="Cheque">Cheque</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Received By</label>
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

      {/* Summary Strip */}
      <div className="bg-amber-50/60 border border-amber-200 rounded-xl px-5 py-3 flex items-center justify-between text-xs">
        <span className="font-semibold text-amber-900">
          Showing <span className="font-bold">{filteredTransactions.length}</span> receipts matching current filter parameters
        </span>
        <div className="font-bold text-slate-800">
          Total Filtered Collections: <span className="font-black text-emerald-700 text-sm ml-1">{fmtINR(totalAmount)}</span>
        </div>
      </div>

      {/* Receipts Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-3">Sr.No</th>
                <th className="py-2.5 px-3">Receipt No</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Sabeel No</th>
                <th className="py-2.5 px-3">ITS No</th>
                <th className="py-2.5 px-4">Full Name</th>
                <th className="py-2.5 px-3">Mohallah</th>
                <th className="py-2.5 px-3">Mode</th>
                <th className="py-2.5 px-4 text-right">Amount Paid</th>
                <th className="py-2.5 px-3">Received By</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredTransactions.map((tx, idx) => (
                <tr key={tx.id || tx.receiptNo} className="hover:bg-amber-50/40 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-slate-500">{idx + 1}</td>
                  <td className="py-2.5 px-3 font-black text-slate-900">{tx.receiptNo}</td>
                  <td className="py-2.5 px-3 text-slate-600 font-medium">{tx.paymentDate}</td>
                  <td className="py-2.5 px-3 font-semibold text-blue-700">{tx.sabeelNo || '—'}</td>
                  <td className="py-2.5 px-3 font-bold text-amber-800">{tx.itsNumber}</td>
                  <td className="py-2.5 px-4 font-bold text-slate-900">{tx.memberName}</td>
                  <td className="py-2.5 px-3 text-slate-600">{tx.mohallah || '—'}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded text-[10px] font-semibold">
                      {tx.paymentMode}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right font-black text-emerald-600">
                    {fmtINR(tx.amountPaid ?? tx.amount ?? 0)}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 text-[11px]">{tx.receivedBy || 'Admin'}</td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={() => setReceiptToPreview(tx)}
                      className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded font-bold text-[10px] flex items-center gap-1 mx-auto transition-colors cursor-pointer"
                      title="View & Print Official Receipt"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Print Slip</span>
                    </button>
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    No receipts found for the selected criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official Receipt Preview Modal */}
      {receiptToPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-300 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            {/* Header toolbar */}
            <div className="px-6 py-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between no-print">
              <span className="text-xs font-bold text-slate-700">Official Receipt Preview</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Receipt</span>
                </button>
                <button
                  onClick={() => setReceiptToPreview(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Receipt Body */}
            <div className="p-6 text-slate-900 space-y-4 text-xs bg-white">
              <div className="text-center space-y-1 border-b border-amber-800/30 pb-3">
                <div className="text-sm font-serif font-bold text-amber-900">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
                <div className="font-bold text-amber-800 text-[11px] uppercase tracking-wide">
                  {receiptConfig.customHeader || 'Anjuman-e-Saifee (Burhani Park Jamaat)'}
                </div>
                <div className="text-sm font-black text-slate-900 tracking-tight uppercase">
                  Sabeel Mubarak Collection Receipt
                </div>
              </div>

              <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Receipt No:</span>
                  <span className="font-black text-slate-900">{receiptToPreview.receiptNo}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Date:</span>
                  <span className="font-bold text-slate-700">{receiptToPreview.paymentDate}</span>
                </div>
              </div>

              <div className="space-y-2 border-b border-slate-100 pb-3">
                {receiptConfig.showHofName && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Received with thanks from:</span>
                    <span className="font-black text-slate-900">{receiptToPreview.memberName}</span>
                  </div>
                )}
                {receiptConfig.showItsNumber && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">ITS Number:</span>
                    <span className="font-bold text-amber-800">{receiptToPreview.itsNumber}</span>
                  </div>
                )}
                {receiptConfig.showSabeelNumber && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Sabeel Number:</span>
                    <span className="font-bold text-blue-700">{receiptToPreview.sabeelNo || '—'}</span>
                  </div>
                )}
                {receiptConfig.showMohalla && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Mohallah:</span>
                    <span className="font-medium text-slate-700">{receiptToPreview.mohallah || '—'}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Mode:</span>
                  <span className="font-bold text-slate-800">{receiptToPreview.paymentMode}</span>
                </div>
              </div>

              {/* Amount Paid Callout */}
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-emerald-800 uppercase block">Amount Received:</span>
                  <span className="text-lg font-black text-emerald-700">{fmtINR(receiptToPreview.amountPaid ?? receiptToPreview.amount ?? 0)}</span>
                </div>
                {receiptConfig.showBalanceDue && (
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Balance Due:</span>
                    <span className="text-xs font-bold text-slate-700">
                      {fmtINR(receiptToPreview.balanceDueAfterPayment || 0)}
                    </span>
                  </div>
                )}
              </div>

              {/* Footer info & verification */}
              <div className="pt-2 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400">Received By: {receiptToPreview.receivedBy || 'Admin'}</div>
                  <div className="text-[9px] text-slate-400">System Generated • Authentic Receipt</div>
                </div>
                {receiptConfig.showQrCode && (
                  <div className="p-1 bg-slate-50 border border-slate-200 rounded text-center">
                    <QrCode className="w-10 h-10 text-slate-800" />
                    <span className="text-[8px] text-slate-400 block font-mono">VERIFIED</span>
                  </div>
                )}
              </div>

              {receiptConfig.showDuaFooter && (
                <div className="text-[10px] text-center text-amber-800/80 italic pt-2 border-t border-slate-100">
                  {receiptConfig.customFooter}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
