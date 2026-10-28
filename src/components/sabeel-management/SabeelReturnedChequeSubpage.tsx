import React, { useState, useMemo } from 'react';
import {
  AlertTriangle, Search, Filter, Phone, MessageSquare, Send, CheckCircle2,
  XCircle, Plus, RefreshCw, Printer, FileSpreadsheet, RotateCcw, X, Save
} from 'lucide-react';
import { SabeelLedgerRecord, HeadOfFamily } from '../../types';
import {
  ReturnedChequeRecord, saveReturnedCheques, saveStoredSabeelLedger
} from '../../utils/sabeelProductionSuite';

interface SabeelReturnedChequeSubpageProps {
  returnedCheques: ReturnedChequeRecord[];
  setReturnedCheques: React.Dispatch<React.SetStateAction<ReturnedChequeRecord[]>>;
  ledger: SabeelLedgerRecord[];
  setLedger: React.Dispatch<React.SetStateAction<SabeelLedgerRecord[]>>;
  hofs: HeadOfFamily[];
  showToast: (msg: string) => void;
}

const fmtINR = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export const SabeelReturnedChequeSubpage: React.FC<SabeelReturnedChequeSubpageProps> = ({
  returnedCheques,
  setReturnedCheques,
  ledger,
  setLedger,
  hofs,
  showToast,
}) => {
  // Modal State for new bounced cheque entry
  const [modalOpen, setModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<SabeelLedgerRecord | null>(null);

  // Form State
  const [formChequeNo, setFormChequeNo] = useState('');
  const [formReceiptNo, setFormReceiptNo] = useState('');
  const [formBankName, setFormBankName] = useState('HDFC Bank Ltd');
  const [formChequeAmount, setFormChequeAmount] = useState<number>(24000);
  const [formPenaltyFee, setFormPenaltyFee] = useState<number>(500);
  const [formReturnDate, setFormReturnDate] = useState(new Date().toISOString().split('T')[0]);
  const [formReturnReason, setFormReturnReason] = useState('Funds Insufficient (Signature Matched)');

  // Filter Bar
  const [chequeNoFilter, setChequeNoFilter] = useState('');
  const [itsNoFilter, setItsNoFilter] = useState('');
  const [sabeelNoFilter, setSabeelNoFilter] = useState('');
  const [mohallaFilter, setMohallaFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Distinct Mohallas
  const distinctMohallas = useMemo(() => {
    const set = new Set<string>();
    ledger.forEach(r => {
      if (r.mohallah) set.add(r.mohallah);
    });
    return Array.from(set).sort();
  }, [ledger]);

  const handleMemberSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const q = searchQuery.trim().toLowerCase();
    const found = ledger.find(
      r =>
        (r.itsNumber || '').toLowerCase() === q ||
        (r.sabeelNumber || r.sabeelNo || '').toLowerCase() === q
    );
    if (found) {
      setSelectedMember(found);
      setFormReceiptNo(`RCP-SB-1447-${Math.floor(100 + Math.random() * 900)}`);
      showToast(`Matched: ${found.hofName || found.memberName}`);
    } else {
      setSelectedMember(null);
      showToast('No member found with that ITS or Sabeel No');
    }
  };

  const handleSaveReturnedCheque = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || !formChequeNo.trim()) {
      showToast('Please specify a valid member and Cheque Number');
      return;
    }

    const newRecord: ReturnedChequeRecord = {
      id: `RC-${Date.now().toString().slice(-4)}`,
      chequeNo: formChequeNo.trim(),
      receiptNo: formReceiptNo.trim(),
      itsNumber: selectedMember.itsNumber,
      fullName: selectedMember.hofName || selectedMember.memberName || '—',
      sabeelNo: selectedMember.sabeelNumber || selectedMember.sabeelNo || '—',
      mohalla: selectedMember.mohallah || 'General',
      bankName: formBankName.trim(),
      chequeAmount: Number(formChequeAmount),
      penaltyFee: Number(formPenaltyFee),
      returnDate: formReturnDate,
      returnReason: formReturnReason.trim(),
      status: 'Bounced',
      smsNotificationSent: false,
    };

    // Reversal in ledger: reduce totalPaid by chequeAmount, and add penalty to balance due
    const updatedLedger = ledger.map(r =>
      r.id === selectedMember.id || r.itsNumber === selectedMember.itsNumber
        ? {
            ...r,
            totalPaid: Math.max(0, (r.totalPaid || 0) - Number(formChequeAmount)),
            annualPledged: (r.annualPledged || 24000) + Number(formPenaltyFee),
          }
        : r
    );

    const updatedList = [newRecord, ...returnedCheques];
    setReturnedCheques(updatedList);
    saveReturnedCheques(updatedList);
    setLedger(updatedLedger);
    saveStoredSabeelLedger(updatedLedger);

    showToast(`Logged bounced cheque ${formChequeNo}. Ledger reversed with ₹${formPenaltyFee} penalty.`);
    setModalOpen(false);
    setSelectedMember(null);
    setSearchQuery('');
    setFormChequeNo('');
  };

  // Dispatch SMS notification
  const handleSendSMS = (id: string, phone: string, name: string) => {
    const updated = returnedCheques.map(c =>
      c.id === id ? { ...c, smsNotificationSent: true } : c
    );
    setReturnedCheques(updated);
    saveReturnedCheques(updated);
    showToast(`SMS alert dispatched to ${name} regarding Cheque bounce reversal.`);
  };

  // Mark as settled
  const handleMarkSettled = (id: string) => {
    const updated = returnedCheques.map(c =>
      c.id === id ? { ...c, status: 'Settled via Cash' as const } : c
    );
    setReturnedCheques(updated);
    saveReturnedCheques(updated);
    showToast('Marked cheque bounce entry as Settled via Cash');
  };

  const filteredCheques = useMemo(() => {
    return returnedCheques.filter(c => {
      if (chequeNoFilter.trim() && !c.chequeNo.toLowerCase().includes(chequeNoFilter.toLowerCase().trim())) return false;
      if (itsNoFilter.trim() && !c.itsNumber.toLowerCase().includes(itsNoFilter.toLowerCase().trim())) return false;
      if (sabeelNoFilter.trim() && !c.sabeelNo.toLowerCase().includes(sabeelNoFilter.toLowerCase().trim())) return false;
      if (mohallaFilter !== 'ALL' && c.mohalla !== mohallaFilter) return false;
      if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
      return true;
    });
  }, [returnedCheques, chequeNoFilter, itsNoFilter, sabeelNoFilter, mohallaFilter, statusFilter]);

  const handleExportCSV = () => {
    const headers = ['Sr.No', 'Cheque No', 'Receipt No', 'ITS No', 'Full Name', 'Sabeel No', 'Mohallah', 'Bank Name', 'Cheque Amount', 'Penalty Fee', 'Return Date', 'Reason', 'Status', 'SMS Sent'];
    const rows = filteredCheques.map((c, i) => [
      i + 1,
      `"${c.chequeNo}"`,
      `"${c.receiptNo}"`,
      `"${c.itsNumber}"`,
      `"${c.fullName}"`,
      `"${c.sabeelNo}"`,
      `"${c.mohalla}"`,
      `"${c.bankName}"`,
      c.chequeAmount,
      c.penaltyFee,
      `"${c.returnDate}"`,
      `"${c.returnReason}"`,
      `"${c.status}"`,
      c.smsNotificationSent ? 'Yes' : 'No',
    ].join(','));
    const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csv));
    link.setAttribute('download', `Returned_Cheques_Register_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${filteredCheques.length} returned cheque records to CSV`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <span>Return Cheque Entry & Returned Cheque Register</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Record bank dishonored cheques, automatic ledger debit reversal with penalty fees, and SMS alert dispatch to donors.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSelectedMember(null);
                setSearchQuery('');
                setModalOpen(true);
              }}
              className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Record Returned Cheque</span>
            </button>
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

        {/* Filter Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-4 text-xs">
          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Cheque No</label>
            <input
              type="text"
              placeholder="Filter cheque..."
              value={chequeNoFilter}
              onChange={e => setChequeNoFilter(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">ITS Number</label>
            <input
              type="text"
              placeholder="e.g. 20394855"
              value={itsNoFilter}
              onChange={e => setItsNoFilter(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Sabeel No</label>
            <input
              type="text"
              placeholder="e.g. SB-007"
              value={sabeelNoFilter}
              onChange={e => setSabeelNoFilter(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Mohallah</label>
            <select
              value={mohallaFilter}
              onChange={e => setMohallaFilter(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 bg-white cursor-pointer font-medium"
            >
              <option value="ALL">All Mohallahs</option>
              {distinctMohallas.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 bg-white cursor-pointer font-bold text-slate-900"
            >
              <option value="ALL">All Statuses</option>
              <option value="Bounced">Bounced (Active Due)</option>
              <option value="Settled via Cash">Settled via Cash</option>
              <option value="Represented">Represented</option>
              <option value="Waived">Waived</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
          <span className="font-bold text-slate-700">
            Dishonored Cheques Log ({filteredCheques.length})
          </span>
          <span className="text-slate-500">Includes automatic ledger reconciliation</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-3">Sr.No</th>
                <th className="py-2.5 px-3">Cheque No</th>
                <th className="py-2.5 px-3">Receipt No</th>
                <th className="py-2.5 px-3">ITS No</th>
                <th className="py-2.5 px-4">Full Name</th>
                <th className="py-2.5 px-3">Sabeel No</th>
                <th className="py-2.5 px-3">Bank Name</th>
                <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                <th className="py-2.5 px-3 text-right">Penalty</th>
                <th className="py-2.5 px-3">Return Date</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-center">SMS Alert</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredCheques.map((c, idx) => (
                <tr key={c.id} className="hover:bg-amber-50/40 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-slate-500">{idx + 1}</td>
                  <td className="py-2.5 px-3 font-black text-slate-900 font-mono">{c.chequeNo}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-600">{c.receiptNo}</td>
                  <td className="py-2.5 px-3 font-bold text-amber-800">{c.itsNumber}</td>
                  <td className="py-2.5 px-4 font-bold text-slate-900">{c.fullName}</td>
                  <td className="py-2.5 px-3 font-semibold text-blue-700">{c.sabeelNo}</td>
                  <td className="py-2.5 px-3 text-slate-600">{c.bankName}</td>
                  <td className="py-2.5 px-3 text-right font-black text-rose-600">{fmtINR(c.chequeAmount)}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-amber-700">{fmtINR(c.penaltyFee)}</td>
                  <td className="py-2.5 px-3 text-slate-600">{c.returnDate}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      c.status === 'Bounced' ? 'bg-rose-100 text-rose-800' :
                      c.status === 'Settled via Cash' ? 'bg-emerald-100 text-emerald-800' :
                      'bg-slate-100 text-slate-800'
                    }`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {c.smsNotificationSent ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        ✓ Dispatched
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSendSMS(c.id, '+91 98200 44332', c.fullName)}
                        className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded text-[10px] font-bold cursor-pointer transition-colors"
                      >
                        Send SMS
                      </button>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {c.status === 'Bounced' ? (
                      <button
                        onClick={() => handleMarkSettled(c.id)}
                        className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded font-bold text-[10px] cursor-pointer transition-colors"
                      >
                        Mark Settled
                      </button>
                    ) : (
                      <span className="text-slate-400 text-[10px]">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredCheques.length === 0 && (
                <tr>
                  <td colSpan={13} className="py-12 text-center text-slate-400">
                    No returned cheques registered.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Returned Cheque Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Record Dishonored / Returned Cheque</span>
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {/* Member Search */}
              <form onSubmit={handleMemberSearch} className="space-y-2">
                <label className="block text-slate-700 font-bold">Search Member (ITS No or Sabeel No) *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="e.g. 20394855 or SB-007..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="flex-1 px-3 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 font-bold text-amber-800"
                  />
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Match Member
                  </button>
                </div>
              </form>

              {selectedMember && (
                <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200">
                  <div className="font-bold text-slate-900">{selectedMember.hofName || selectedMember.memberName}</div>
                  <div className="text-[11px] text-slate-600 mt-0.5">
                    ITS: {selectedMember.itsNumber} • Sabeel: {selectedMember.sabeelNumber || selectedMember.sabeelNo || '—'} • Mohallah: {selectedMember.mohallah || '—'}
                  </div>
                </div>
              )}

              <form onSubmit={handleSaveReturnedCheque} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Cheque Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. CHQ-882019"
                      value={formChequeNo}
                      onChange={e => setFormChequeNo(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Original Receipt No</label>
                    <input
                      type="text"
                      required
                      value={formReceiptNo}
                      onChange={e => setFormReceiptNo(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Drawee Bank Name</label>
                    <input
                      type="text"
                      required
                      value={formBankName}
                      onChange={e => setFormBankName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Dishonored Cheque Amount (₹) *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      step="500"
                      value={formChequeAmount}
                      onChange={e => setFormChequeAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 font-black text-rose-600 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Bank Penalty / Processing Fee (₹)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="100"
                      value={formPenaltyFee}
                      onChange={e => setFormPenaltyFee(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 font-bold text-amber-700"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Bank Return Date</label>
                    <input
                      type="date"
                      required
                      value={formReturnDate}
                      onChange={e => setFormReturnDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 font-medium"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-slate-600 font-bold mb-1">Reason for Return</label>
                    <select
                      value={formReturnReason}
                      onChange={e => setFormReturnReason(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 bg-white cursor-pointer font-medium"
                    >
                      <option value="Funds Insufficient (Signature Matched)">Funds Insufficient (Signature Matched)</option>
                      <option value="Signature Differs from Specimen">Signature Differs from Specimen</option>
                      <option value="Payment Stopped by Drawer">Payment Stopped by Drawer</option>
                      <option value="Stale / Post-dated Cheque">Stale / Post-dated Cheque</option>
                      <option value="Account Blocked / Frozen">Account Blocked / Frozen</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!selectedMember}
                    className={`px-5 py-2 font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer ${
                      selectedMember
                        ? 'bg-rose-600 hover:bg-rose-700 text-white'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <Save className="w-4 h-4" />
                    <span>Record Bounce & Reverse Ledger</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
