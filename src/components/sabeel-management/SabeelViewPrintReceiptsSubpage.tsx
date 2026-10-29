import React, { useState, useMemo } from 'react';
import {
  Receipt, Search, Filter, Printer, Download, Plus, RefreshCw, X, Eye, Ban,
  FileSpreadsheet, Calendar, User, CreditCard, ShieldCheck, QrCode, CheckSquare, Square
} from 'lucide-react';
import { SabeelTransactionEntry, SabeelLedgerRecord, UserProfile, SabeelPaymentMode } from '../../types';
import { SabeelReceiptConfig, SabeelTypeRecord } from '../../utils/sabeelProductionSuite';
import { TrustOfficialReceiptModal } from '../common/TrustOfficialReceiptModal';
import { numberToWordsIndian } from '../../utils/fmbPart2Data';

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

  // Bulk Print Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

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
    setSelectedIds([]);
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredTransactions.length && filteredTransactions.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredTransactions.map(t => t.id || t.receiptNo));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleBulkPrint = () => {
    const toPrint = selectedIds.length > 0
      ? filteredTransactions.filter(t => selectedIds.includes(t.id || t.receiptNo))
      : filteredTransactions;

    if (toPrint.length === 0) {
      showToast('No receipts to print.');
      return;
    }
    showToast(`Bulk print studio initiated for ${toPrint.length} Sabeel receipts...`);
    window.print();
  };

  const handleSoloPrint = (tx: SabeelTransactionEntry) => {
    setReceiptToPreview(tx);
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
              className="px-3.5 py-2 bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer border border-amber-300 shadow-2xs"
              title="Bulk Print Selected or Filtered Receipts"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Bulk Print {selectedIds.length > 0 ? `(${selectedIds.length})` : `(${filteredTransactions.length})`}</span>
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
                <th className="py-2.5 px-3 text-center w-10">
                  <input
                    type="checkbox"
                    checked={filteredTransactions.length > 0 && selectedIds.length === filteredTransactions.length}
                    onChange={handleToggleSelectAll}
                    className="w-3.5 h-3.5 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                    title="Select all for bulk print"
                  />
                </th>
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
                <th className="py-2.5 px-3 text-center">Receipt Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredTransactions.map((tx, idx) => (
                <tr key={tx.id || tx.receiptNo} className="hover:bg-amber-50/40 transition-colors">
                  <td className="py-2.5 px-3 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(tx.id || tx.receiptNo)}
                      onChange={() => handleToggleSelect(tx.id || tx.receiptNo)}
                      className="w-3.5 h-3.5 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                      title="Select for bulk print"
                    />
                  </td>
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
                    <div className="flex items-center justify-center gap-1.5">
                      {/* Dedicated Solo / Individual Print Button */}
                      <button
                        type="button"
                        onClick={() => handleSoloPrint(tx)}
                        className="px-2.5 py-1 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-[10px] rounded-lg shadow-2xs transition-all flex items-center gap-1 cursor-pointer"
                        title="Solo / Individual Print Official Trust Voucher"
                      >
                        <Printer className="w-3 h-3 stroke-[2.5]" />
                        <span>Solo Print</span>
                      </button>

                      {/* View / Edit Preview Button */}
                      <button
                        type="button"
                        onClick={() => setReceiptToPreview(tx)}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[10px] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        title="View & Edit Receipt Preview"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Preview</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-400">
                    No receipts found for the selected criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Standardized Official Trust Receipt Studio Modal */}
      <TrustOfficialReceiptModal
        isOpen={!!receiptToPreview}
        onClose={() => setReceiptToPreview(null)}
        currentUser={currentUser}
        title="Official Dawoodi Bohra Jamaat Trust Sabeel Receipt"
        receiptData={
          receiptToPreview
            ? {
                trustTitle: 'DAWOODI BOHRA JAMAAT TRUST, BURHANIPARK VATWA',
                trustRegnNo: 'Regn No - B/81',
                managedBy: 'Managed By Anjuman e Mufaddal',
                accountTitle: 'A/c : Sabeel ul Barkaat / Sabeel Mubarak',
                receiptNo:
                  (receiptToPreview.receiptNo || '').replace(/[^0-9]/g, '') ||
                  receiptToPreview.receiptNo,
                dateStr: receiptToPreview.paymentDate || receiptToPreview.date,
                memberName: (receiptToPreview.memberName || '').toUpperCase(),
                honorificLeft: '(حفظه الله تعالى)',
                itsNo: receiptToPreview.itsNumber,
                address: (
                  ledger.find((l) => l.itsNumber === receiptToPreview.itsNumber)?.address ||
                  ledger.find((l) => l.itsNumber === receiptToPreview.itsNumber)?.fullAddress ||
                  `${receiptToPreview.mohallah ? receiptToPreview.mohallah + ', ' : ''}BURHANI PARK, VATWA, AHMEDABAD`
                ).toUpperCase(),
                greetingArabic: 'بعد السلام الجميل',
                amount: receiptToPreview.amountPaid ?? receiptToPreview.amount ?? 0,
                amountInWords: numberToWordsIndian(
                  receiptToPreview.amountPaid ?? receiptToPreview.amount ?? 0
                ),
                descriptorRight: 'اپ طرف سي',
                descriptorAnke: 'انکه',
                paymentModeStr:
                  receiptToPreview.paymentMode === 'Cash'
                    ? 'By Cash.'
                    : receiptToPreview.paymentMode === 'Cheque'
                    ? 'By Cheque.'
                    : `By ${receiptToPreview.paymentMode}.`,
                purposeTitle: receiptToPreview.sabeelNo
                  ? `Sabeel Mubarak (${receiptToPreview.sabeelNo})`
                  : 'Sabeel Mubarak',
                purposePhrase: 'طریقے وصول تھیا چھے',
                receiverSignature: '(وصول کرنار نی صحیح) عبد سید ناطع',
              }
            : undefined
        }
      />
    </div>
  );
};
