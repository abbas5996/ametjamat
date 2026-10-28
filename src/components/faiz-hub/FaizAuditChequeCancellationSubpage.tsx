import React, { useState, useMemo } from 'react';
import {
  RotateCcw, Ban, Search, Filter, Phone, MessageSquare,
  Send, AlertTriangle, CheckCircle2, XCircle, Plus, Printer,
  FileSpreadsheet, X, Save, Download, Eye, Calendar, User
} from 'lucide-react';
import {
  FaizBouncedChequeItem,
  FaizCancelledVoucherItem,
  getStoredBouncedCheques,
  saveStoredBouncedCheques,
  getStoredCancelledVouchers,
  saveStoredCancelledVouchers,
} from '../../utils/fmbPart2Data';
import { getStoredHofs } from '../../utils/memberMaster';
import { UserProfile } from '../../types';

const fmtINR = (n: number) => `₹${n.toLocaleString('en-IN')}`;

type AuditTab = 'bounced-cheques' | 'cancelled-receipts' | 'cancelled-expenses' | 'cancelled-income';

interface Props {
  currentUser: UserProfile;
  showToast: (m: string) => void;
  canAdd?: boolean;
}

export const FaizAuditChequeCancellationSubpage: React.FC<Props> = ({
  currentUser,
  showToast,
  canAdd = true,
}) => {
  const [activeTab, setActiveTab] = useState<AuditTab>('bounced-cheques');

  // Stores
  const [bouncedCheques, setBouncedCheques] = useState<FaizBouncedChequeItem[]>(() => getStoredBouncedCheques());
  const [cancelledVouchers, setCancelledVouchers] = useState<FaizCancelledVoucherItem[]>(() => getStoredCancelledVouchers());
  const [hofs] = useState(() => getStoredHofs());

  // 1. CHEQUE SEARCH FILTERS [cite: 47, 50]
  const [chequeNoSearch, setChequeNoSearch] = useState('');
  const [itsSearch, setItsSearch] = useState('');
  const [sabeelSearch, setSabeelSearch] = useState('');
  const [thaaliSearch, setThaaliSearch] = useState('');
  const [mohallaSearch, setMohallaSearch] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // 2. CANCELLED LIST FILTERS [cite: 48, 49, 50]
  const [cancelSearch, setCancelSearch] = useState('');
  const [userFilter, setUserFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // MODALS
  const [smsTarget, setSmsTarget] = useState<FaizBouncedChequeItem | null>(null);
  const [smsMessage, setSmsMessage] = useState('');
  const [isAddChequeOpen, setIsAddChequeOpen] = useState(false);

  // New Cheque Form
  const [cChequeNo, setCChequeNo] = useState('');
  const [cReceiptNo, setCReceiptNo] = useState('');
  const [cBankName, setCBankName] = useState('State Bank of India');
  const [cAmount, setCAmount] = useState<number>(25000);
  const [cPenalty, setCPenalty] = useState<number>(500);
  const [cIts, setCIts] = useState(hofs[0]?.itsNumber || '');
  const [cReason, setCReason] = useState('Funds Insufficient (Code 01)');

  // Distinct Mohallas
  const distinctMohallas = useMemo(() => {
    const set = new Set<string>();
    hofs.forEach(h => { if (h.mohallahName) set.add(h.mohallahName); });
    return Array.from(set).sort();
  }, [hofs]);

  // Filtered Bounced Cheques [cite: 47, 50]
  const filteredCheques = useMemo(() => {
    return bouncedCheques.filter(c => {
      if (chequeNoSearch && !c.chequeNo.toLowerCase().includes(chequeNoSearch.toLowerCase())) return false;
      if (itsSearch && !c.itsNumber.toLowerCase().includes(itsSearch.toLowerCase())) return false;
      if (sabeelSearch && !c.sabeelNo.toLowerCase().includes(sabeelSearch.toLowerCase())) return false;
      if (thaaliSearch && !c.thaaliNo.toLowerCase().includes(thaaliSearch.toLowerCase())) return false;
      if (mohallaSearch !== 'ALL' && c.mohalla !== mohallaSearch) return false;
      if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
      return true;
    });
  }, [bouncedCheques, chequeNoSearch, itsSearch, sabeelSearch, thaaliSearch, mohallaSearch, statusFilter]);

  // Filtered Cancelled Records [cite: 48, 49, 50]
  const filteredCancelled = useMemo(() => {
    const targetType =
      activeTab === 'cancelled-receipts' ? 'Niyaz Receipt' :
      activeTab === 'cancelled-expenses' ? 'Niyaz Expense' :
      'Income Receipt';

    return cancelledVouchers.filter(v => {
      if (v.voucherType !== targetType) return false;
      if (userFilter !== 'ALL' && v.cancelledBy !== userFilter) return false;
      if (startDate && v.cancelledDate < startDate) return false;
      if (endDate && v.cancelledDate > endDate) return false;
      if (cancelSearch) {
        const q = cancelSearch.toLowerCase();
        const m1 = v.originalVoucherNo.toLowerCase().includes(q);
        const m2 = v.partyName.toLowerCase().includes(q);
        const m3 = v.reason.toLowerCase().includes(q);
        if (!m1 && !m2 && !m3) return false;
      }
      return true;
    });
  }, [cancelledVouchers, activeTab, userFilter, startDate, endDate, cancelSearch]);

  // Open SMS Modal
  const handleOpenSms = (item: FaizBouncedChequeItem) => {
    setSmsTarget(item);
    setSmsMessage(
      `Afzalus Salam, ${item.hofName} (ITS: ${item.itsNumber}). Aapno FMB cheque #${item.chequeNo} amount ${fmtINR(item.chequeAmount)} bank si bounce thayo chhe (${item.returnReason}). Meharbani kari Jamaat counter par penalty fee ${fmtINR(item.penaltyFee)} sathe clearance karawi lejo. Shukran.`
    );
  };

  const handleSendSms = () => {
    if (!smsTarget) return;
    const updated = bouncedCheques.map(c =>
      c.id === smsTarget.id ? { ...c, smsSent: true, lastContacted: new Date().toISOString().split('T')[0] } : c
    );
    setBouncedCheques(updated);
    saveStoredBouncedCheques(updated);
    showToast(`Dispatched official SMS reminder to ${smsTarget.phone} (${smsTarget.hofName})`);
    setSmsTarget(null);
  };

  // Add Bounced Cheque
  const handleSaveCheque = (e: React.FormEvent) => {
    e.preventDefault();
    const member = hofs.find(h => h.itsNumber === cIts) || hofs[0];
    const newItem: FaizBouncedChequeItem = {
      id: `bnc-${Date.now()}`,
      chequeNo: cChequeNo,
      receiptNo: cReceiptNo || 'FMB-REC-AUTO',
      chequeDate: new Date().toISOString().split('T')[0],
      returnDate: new Date().toISOString().split('T')[0],
      bankName: cBankName,
      chequeAmount: cAmount,
      penaltyFee: cPenalty,
      itsNumber: member.itsNumber,
      hofName: member.fullName,
      sabeelNo: member.sabeelNo || 'SAB-101',
      thaaliNo: member.thaaliNo || 'TH-084',
      mohalla: member.mohallahName || 'Burhani Mohallah',
      phone: member.mobileNumber || '+91 98201 11223',
      returnReason: cReason,
      status: 'Bounced',
      smsSent: false,
    };
    const next = [newItem, ...bouncedCheques];
    setBouncedCheques(next);
    saveStoredBouncedCheques(next);
    showToast(`Recorded bounced cheque #${cChequeNo} for ${member.fullName}`);
    setIsAddChequeOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* ── Banner Card ── */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300/60 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500 text-slate-950 shadow-xs">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              Audit Trails, Cancellations & Cheque Management
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Returned cheque tracking with SMS dispatch, voided receipt logs, and expense cancellation audits [cite: 47, 48, 49, 50]
            </p>
          </div>
        </div>

        {activeTab === 'bounced-cheques' && canAdd && (
          <button
            type="button"
            onClick={() => setIsAddChequeOpen(true)}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Bounced Cheque Entry</span>
          </button>
        )}
      </div>

      {/* ── Ribbon Navigation Tabs ── */}
      <div className="bg-white border border-amber-300/60 rounded-xl p-1.5 shadow-xs flex items-center gap-1 overflow-x-auto select-none">
        {[
          { key: 'bounced-cheques' as AuditTab,     label: '1. Cheque Returned List',      icon: RotateCcw, cite: '[cite: 47, 50]' },
          { key: 'cancelled-receipts' as AuditTab,  label: '2. Niyaz Cancelled List',       icon: Ban,       cite: '[cite: 48]' },
          { key: 'cancelled-expenses' as AuditTab,  label: '3. Niyaz Expense Cancelled',    icon: AlertTriangle, cite: '[cite: 49]' },
          { key: 'cancelled-income' as AuditTab,    label: '4. Cancelled Income Receipts',  icon: FileSpreadsheet, cite: '[cite: 50]' },
        ].map(({ key, label, icon: Icon, cite }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === key
                ? 'bg-amber-400 text-slate-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-amber-50'
            }`}
          >
            <Icon className="w-4 h-4 text-amber-900" />
            <span>{label}</span>
            <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">{cite}</span>
          </button>
        ))}
      </div>

      {/* =========================================================================
       * 1. RETURN CHEQUE & CHEQUE RETURNED LIST [cite: 47, 50]
       * ========================================================================= */}
      {activeTab === 'bounced-cheques' && (
        <div className="space-y-4">
          {/* Multi-Parameter Filters [cite: 47, 50] */}
          <div className="bg-white border border-amber-300/60 rounded-2xl p-5 shadow-xs space-y-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-amber-600" />
              <span>Cheque Search Parameters (Cheque No, ITS, Sabeel, Thaali, Mohalla)</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Cheque No</label>
                <input
                  type="text"
                  value={chequeNoSearch}
                  onChange={(e) => setChequeNoSearch(e.target.value)}
                  placeholder="CHQ-..."
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">ITS ID</label>
                <input
                  type="text"
                  value={itsSearch}
                  onChange={(e) => setItsSearch(e.target.value)}
                  placeholder="3048..."
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Sabeel No</label>
                <input
                  type="text"
                  value={sabeelSearch}
                  onChange={(e) => setSabeelSearch(e.target.value)}
                  placeholder="SAB-101"
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Thaali No</label>
                <input
                  type="text"
                  value={thaaliSearch}
                  onChange={(e) => setThaaliSearch(e.target.value)}
                  placeholder="TH-084"
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Mohalla</label>
                <select
                  value={mohallaSearch}
                  onChange={(e) => setMohallaSearch(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300"
                >
                  <option value="ALL">All Mohallas</option>
                  {distinctMohallas.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Cheque Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-bold"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Bounced">Bounced (Active)</option>
                  <option value="Re-Presented">Re-Presented</option>
                  <option value="Settled">Settled</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          {/* Cheque Table */}
          <div className="bg-white border border-amber-300/60 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700">{filteredCheques.length} Bounced Records Found</span>
              <span className="font-black text-rose-700 text-sm">
                Bounced Capital: {fmtINR(filteredCheques.reduce((s, c) => s + c.chequeAmount, 0))}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-rose-50 text-rose-950 font-bold border-y border-rose-200">
                    <th className="py-2.5 px-3">Cheque No</th>
                    <th className="py-2.5 px-3">Return Date</th>
                    <th className="py-2.5 px-3">Bank Name</th>
                    <th className="py-2.5 px-3">HOF / ITS</th>
                    <th className="py-2.5 px-3">Thaali / Sabeel</th>
                    <th className="py-2.5 px-3">Mohalla</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-3 text-right">Penalty</th>
                    <th className="py-2.5 px-3">Return Reason</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCheques.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono font-bold text-rose-900">{c.chequeNo}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{c.returnDate}</td>
                      <td className="py-2.5 px-3 text-slate-700">{c.bankName}</td>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-slate-900 block">{c.hofName}</span>
                        <span className="font-mono text-[10px] text-slate-500">ITS: {c.itsNumber}</span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-700">
                        <span className="font-bold text-amber-900 block">{c.thaaliNo}</span>
                        <span className="text-[10px] text-slate-500">{c.sabeelNo}</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{c.mohalla}</td>
                      <td className="py-2.5 px-3 text-right font-black text-rose-700">{fmtINR(c.chequeAmount)}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-amber-900">{fmtINR(c.penaltyFee)}</td>
                      <td className="py-2.5 px-3 text-slate-700 truncate max-w-[150px]">{c.returnReason}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          c.status === 'Settled' ? 'bg-emerald-100 text-emerald-800' :
                          c.status === 'Re-Presented' ? 'bg-blue-100 text-blue-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleOpenSms(c)}
                          className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold text-[10px] inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Send className="w-3 h-3 text-amber-800" />
                          <span>Send SMS</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
       * 2, 3 & 4. CANCELLED LISTS (RECEIPTS, EXPENSES, INCOME) [cite: 48, 49, 50]
       * ========================================================================= */}
      {activeTab !== 'bounced-cheques' && (
        <div className="space-y-4">
          <div className="bg-white border border-amber-300/60 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={cancelSearch}
                onChange={(e) => setCancelSearch(e.target.value)}
                placeholder="Search voucher, party, or cancellation reason..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-300"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">Date Range:</span>
              <input
                type="text"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="From..."
                className="px-2.5 py-1.5 rounded-xl border border-slate-300 font-mono w-28"
              />
              <input
                type="text"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="To..."
                className="px-2.5 py-1.5 rounded-xl border border-slate-300 font-mono w-28"
              />
            </div>
          </div>

          <div className="bg-white border border-amber-300/60 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700">
                Found {filteredCancelled.length} Annulled Records
              </span>
              <span className="font-black text-rose-700 text-sm">
                Total Reversal Value: {fmtINR(filteredCancelled.reduce((s, v) => s + v.amount, 0))}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 font-bold border-y">
                    <th className="py-2.5 px-3">Original Voucher</th>
                    <th className="py-2.5 px-3">Original Date</th>
                    <th className="py-2.5 px-3">Cancellation Date</th>
                    <th className="py-2.5 px-3">Party / Member Name</th>
                    <th className="py-2.5 px-3">Category / Head</th>
                    <th className="py-2.5 px-3 text-right">Revoked Amount</th>
                    <th className="py-2.5 px-3">Cancelled By</th>
                    <th className="py-2.5 px-3">Audit Reason</th>
                    <th className="py-2.5 px-3">Reversal Ref</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCancelled.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{v.originalVoucherNo}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{v.voucherDate}</td>
                      <td className="py-2.5 px-3 font-mono text-rose-700 font-bold">{v.cancelledDate}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{v.partyName}</td>
                      <td className="py-2.5 px-3 text-slate-700">{v.headOrCategory}</td>
                      <td className="py-2.5 px-3 text-right font-black text-rose-700">{fmtINR(v.amount)}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">{v.cancelledBy}</td>
                      <td className="py-2.5 px-3 text-slate-600 italic truncate max-w-[200px]">{v.reason}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">{v.reversalRef}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Send SMS / WhatsApp Notification [cite: 47, 50] ── */}
      {smsTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-amber-300 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 bg-amber-50 border-b border-amber-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Dispatch Bounced Cheque Notice</h3>
                <p className="text-[11px] text-slate-600">{smsTarget.hofName} ({smsTarget.phone})</p>
              </div>
              <button onClick={() => setSmsTarget(null)} className="p-1 rounded text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Cheque No:</span>
                  <span className="font-mono font-bold text-slate-900">{smsTarget.chequeNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Cheque Amount:</span>
                  <span className="font-bold text-rose-700">{fmtINR(smsTarget.chequeAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Bank Rejection Reason:</span>
                  <span className="font-bold text-slate-800">{smsTarget.returnReason}</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Official SMS & WhatsApp Message</label>
                <textarea
                  rows={4}
                  value={smsMessage}
                  onChange={(e) => setSmsMessage(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSmsTarget(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendSms}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send SMS Now</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Add Bounced Cheque Entry ── */}
      {isAddChequeOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-amber-300 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-amber-100 bg-amber-50 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">Record Returned / Bounced Cheque</h3>
              <button onClick={() => setIsAddChequeOpen(false)} className="p-1 rounded text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCheque} className="p-5 space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700">Select HOF Member *</label>
                <select
                  value={cIts}
                  onChange={(e) => setCIts(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-bold"
                >
                  {hofs.map(h => (
                    <option key={h.id} value={h.itsNumber}>{h.fullName} (ITS: {h.itsNumber})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Cheque No *</label>
                  <input
                    type="text"
                    value={cChequeNo}
                    onChange={(e) => setCChequeNo(e.target.value)}
                    placeholder="CHQ-889912"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Bank Name</label>
                  <input
                    type="text"
                    value={cBankName}
                    onChange={(e) => setCBankName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Cheque Amount (INR) *</label>
                  <input
                    type="number"
                    min="1"
                    value={cAmount}
                    onChange={(e) => setCAmount(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Return Penalty Fee</label>
                  <input
                    type="number"
                    value={cPenalty}
                    onChange={(e) => setCPenalty(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-bold text-amber-900"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700">Bank Return Reason *</label>
                <select
                  value={cReason}
                  onChange={(e) => setCReason(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300"
                >
                  <option value="Funds Insufficient (Code 01)">Funds Insufficient (Code 01)</option>
                  <option value="Drawers Signature Mismatch (Code 02)">Drawers Signature Mismatch (Code 02)</option>
                  <option value="Account Blocked / Frozen (Code 04)">Account Blocked / Frozen (Code 04)</option>
                  <option value="Post-Dated Cheque Presented Early">Post-Dated Cheque Presented Early</option>
                  <option value="Stale Cheque (Expired Validity)">Stale Cheque (Expired Validity)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddChequeOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
                >
                  Save Bounced Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
