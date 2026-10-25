import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Search,
  Filter,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Printer,
  Copy,
  Phone,
  MessageSquare,
  Lock,
  ArrowRight,
  TrendingDown,
  Clock,
  Send,
  X,
  FileText,
  DollarSign,
  Download,
} from 'lucide-react';
import {
  TakhmeenRecord,
  FmbCollectionEntry,
  FmbPaymentMode,
  HeadOfFamily,
  UserProfile,
  FinancialYear,
} from '../../types';
import { recordCollectionPayment, saveStoredCollections, logFmbAudit } from '../../utils/fmbTakhmeen';
import { checkUserPermission } from '../../utils/rbac';

interface DailyCollectionSubpageProps {
  takhmeens: TakhmeenRecord[];
  setTakhmeens: React.Dispatch<React.SetStateAction<TakhmeenRecord[]>>;
  collections: FmbCollectionEntry[];
  setCollections: React.Dispatch<React.SetStateAction<FmbCollectionEntry[]>>;
  hofs: HeadOfFamily[];
  currentUser: UserProfile;
  financialYear: FinancialYear;
  showToast: (msg: string) => void;
  preselectedIts?: string;
}

export const DailyCollectionSubpage: React.FC<DailyCollectionSubpageProps> = ({
  takhmeens,
  setTakhmeens,
  collections,
  setCollections,
  hofs,
  currentUser,
  financialYear,
  showToast,
  preselectedIts,
}) => {
  // Active View Tab: Counter Entry vs Defaulters List vs Recent Collections
  const [activeTab, setActiveTab] = useState<'counter' | 'defaulters' | 'recent'>('counter');

  // Fast Counter Entry Form State
  const [selectedIts, setSelectedIts] = useState<string>(preselectedIts || '');
  const [payAmount, setPayAmount] = useState<number | ''>('');
  const [paymentMode, setPaymentMode] = useState<FmbPaymentMode>('Cash');
  const [referenceNo, setReferenceNo] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Receipt Modal State
  const [activeReceipt, setActiveReceipt] = useState<FmbCollectionEntry | null>(null);

  // Defaulters List Search & Filter
  const [defaulterSearch, setDefaulterSearch] = useState('');
  const [minDueFilter, setMinDueFilter] = useState<number>(0);

  // Granular RBAC Permissions
  const canAdd = checkUserPermission(currentUser, 'fmb-dues', 'add');
  const canEdit = checkUserPermission(currentUser, 'fmb-dues', 'edit');
  const canDelete = checkUserPermission(currentUser, 'fmb-dues', 'delete');

  // Lookup selected member details
  const selectedMemberData = useMemo(() => {
    if (!selectedIts) return null;
    const hof = hofs.find((h) => h.itsNumber === selectedIts);
    const tak = takhmeens.find(
      (t) => t.itsNumber === selectedIts && t.financialYear === financialYear
    );
    return { hof, tak };
  }, [selectedIts, hofs, takhmeens, financialYear]);

  // Handle Quick Select Member from dropdown or preset
  const handleSelectMember = (its: string) => {
    setSelectedIts(its);
    const matchedTak = takhmeens.find(
      (t) => t.itsNumber === its && t.financialYear === financialYear
    );
    if (matchedTak && matchedTak.balanceDue > 0) {
      setPayAmount(matchedTak.balanceDue);
    } else {
      setPayAmount('');
    }
  };

  // Submit Counter Payment
  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAdd) {
      showToast('Access Restricted: You do not have [Add] permission for Counter Collection.');
      return;
    }

    if (!selectedIts) {
      showToast('Please select a member.');
      return;
    }

    const amountNum = Number(payAmount);
    if (!amountNum || amountNum <= 0) {
      showToast('Please enter a valid collection amount.');
      return;
    }

    const memberName = selectedMemberData?.hof?.fullName || selectedMemberData?.tak?.hofName || 'Member';

    setIsSubmitting(true);

    try {
      const result = recordCollectionPayment(
        {
          itsNumber: selectedIts,
          hofName: memberName,
          amount: amountNum,
          paymentMode,
          referenceNo: referenceNo.trim() || undefined,
          financialYear,
          notes: notes.trim() || undefined,
          date: paymentDate,
        },
        currentUser.username
      );

      // Update state
      setCollections(result.updatedCollections);
      setTakhmeens(result.updatedTakhmeens);

      showToast(`Recorded payment of ₹${amountNum.toLocaleString('en-IN')}! Receipt generated.`);

      // Open print/view receipt modal
      setActiveReceipt(result.newCollection);

      // Reset form
      setPayAmount('');
      setReferenceNo('');
      setNotes('');
    } catch (err) {
      console.error(err);
      showToast('Failed to record payment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Defaulters List: Filter members with balanceDue > 0
  const defaultersList = useMemo(() => {
    return takhmeens
      .filter((t) => t.financialYear === financialYear && t.balanceDue > minDueFilter)
      .filter((t) => {
        if (!defaulterSearch.trim()) return true;
        const q = defaulterSearch.toLowerCase().trim();
        return (
          t.itsNumber.includes(q) ||
          t.hofName.toLowerCase().includes(q) ||
          t.mobileNumber.includes(q)
        );
      })
      .sort((a, b) => b.balanceDue - a.balanceDue);
  }, [takhmeens, financialYear, minDueFilter, defaulterSearch]);

  // Copy WhatsApp Reminder for a defaulter
  const handleCopyWhatsAppReminder = (record: TakhmeenRecord) => {
    const text = `Afzalus Salaam ${record.hofName} Bhai,\nThis is a gentle reminder regarding Faiz ul Mawaid il Burhaniyah (FMB) Takhmeen for ${record.financialYear}.\nCommitted: ₹${record.committedAmount.toLocaleString('en-IN')}\nPaid: ₹${record.paidAmount.toLocaleString('en-IN')}\nOutstanding Balance: ₹${record.balanceDue.toLocaleString('en-IN')}.\nKindly settle at the Jamaat Counter or via UPI at your earliest.\nShukran, Anjuman-e-Saifee.`;
    navigator.clipboard.writeText(text);
    showToast(`Copied WhatsApp reminder for ${record.hofName}!`);
  };

  return (
    <div className="space-y-6">
      {/* ── Sub-navigation: Counter vs Defaulters vs History ── */}
      <div className="bg-white border border-amber-300/40 rounded-xl p-1.5 shadow-xs flex items-center gap-1.5 overflow-x-auto text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('counter')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'counter'
              ? 'bg-[#0F172A] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-amber-50'
          }`}
        >
          <CreditCard className="w-4 h-4 text-amber-400" />
          <span>1. Fast Counter Payment Entry</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('defaulters')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'defaulters'
              ? 'bg-[#0F172A] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-amber-50'
          }`}
        >
          <TrendingDown className="w-4 h-4 text-rose-400" />
          <span>
            2. Pending Dues & Defaulters ({defaultersList.length})
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('recent')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'recent'
              ? 'bg-[#0F172A] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-amber-50'
          }`}
        >
          <Clock className="w-4 h-4 text-blue-400" />
          <span>3. Recent Collections Log ({collections.length})</span>
        </button>
      </div>

      {/* ── TAB 1: FAST COUNTER ENTRY ── */}
      {activeTab === 'counter' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Form: Counter Payment Entry (7 cols) */}
          <div className="lg:col-span-7 bg-white border border-amber-200/90 rounded-2xl shadow-sm p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-amber-600" />
                  <span>FMB Daily Collection Desk</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Counter POS receipt generator with real-time Takhmeen ledger balance recalculation.
                </p>
              </div>
              <span className="text-[11px] font-mono font-bold bg-amber-100 text-amber-900 px-2.5 py-1 rounded-md border border-amber-200">
                {financialYear}
              </span>
            </div>

            <form onSubmit={handleSubmitPayment} className="space-y-4 text-xs">
              {/* Select Member */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Select Head of Family (ITS Number / Name) *
                </label>
                <select
                  value={selectedIts}
                  onChange={(e) => handleSelectMember(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                >
                  <option value="">-- Choose Member HOF --</option>
                  {hofs.map((h) => {
                    const matchedTak = takhmeens.find(
                      (t) => t.itsNumber === h.itsNumber && t.financialYear === financialYear
                    );
                    const due = matchedTak ? matchedTak.balanceDue : 52000;
                    return (
                      <option key={h.id} value={h.itsNumber}>
                        {h.fullName} (ITS: {h.itsNumber}) • Due: ₹{due.toLocaleString('en-IN')}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Amount to Pay */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Collection Amount (₹) *
                  </label>
                  {selectedMemberData?.tak && selectedMemberData.tak.balanceDue > 0 && (
                    <button
                      type="button"
                      onClick={() => setPayAmount(selectedMemberData.tak!.balanceDue)}
                      className="text-[11px] font-bold text-amber-700 hover:text-amber-900 hover:underline cursor-pointer"
                    >
                      Fill Full Due (₹{selectedMemberData.tak.balanceDue.toLocaleString('en-IN')})
                    </button>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value ? Number(e.target.value) : '')}
                    placeholder="Enter amount received..."
                    className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono font-bold text-base focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>

                {/* Amount Quick Presets */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[5000, 10000, 15000, 25000, 35000, 52000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setPayAmount(preset)}
                      className="px-2 py-1 rounded bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 font-mono font-semibold text-[11px] transition-colors cursor-pointer border border-slate-200"
                    >
                      +₹{preset.toLocaleString('en-IN')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Mode */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Payment Mode *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['Cash', 'UPI', 'Bank Transfer', 'Cheque'] as FmbPaymentMode[]).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPaymentMode(mode)}
                      className={`p-2 rounded-lg font-bold border text-center transition-all cursor-pointer ${
                        paymentMode === mode
                          ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reference Number & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Transaction / Cheque / UTR Ref No
                  </label>
                  <input
                    type="text"
                    value={referenceNo}
                    onChange={(e) => setReferenceNo(e.target.value)}
                    placeholder={
                      paymentMode === 'UPI'
                        ? 'e.g. UPI/40294821...'
                        : paymentMode === 'Cheque'
                        ? 'e.g. Cheque No 849201...'
                        : 'e.g. Counter Cash Voucher...'
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Receipt Date *
                  </label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                    required
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Receipt Notes / Installment Particulars
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. 1st Shehrullah installment / Counter payment received"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              {/* Submit Button */}
              {canAdd ? (
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedIts || !payAmount}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {isSubmitting
                      ? 'Processing & Updating Ledger...'
                      : `Confirm & Print Receipt (₹${Number(payAmount || 0).toLocaleString('en-IN')})`}
                  </span>
                </button>
              ) : (
                <div className="w-full py-3 bg-slate-100 text-slate-400 font-bold rounded-xl text-sm text-center flex items-center justify-center gap-2 cursor-not-allowed">
                  <Lock className="w-4 h-4" />
                  <span>Counter Collection Restricted by RBAC</span>
                </div>
              )}
            </form>
          </div>

          {/* Right Panel: Selected Member Ledger Snapshot (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {selectedMemberData?.tak ? (
              <div className="bg-white border border-amber-300/80 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                      Live Member Ledger
                    </span>
                    <h4 className="text-base font-bold text-slate-900 mt-0.5">
                      {selectedMemberData.tak.hofName}
                    </h4>
                    <p className="text-xs text-slate-500 font-mono">
                      ITS: {selectedMemberData.tak.itsNumber} • {selectedMemberData.hof?.mohallahName}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900">
                    {selectedMemberData.tak.tier} Tier
                  </span>
                </div>

                {/* Ledger Breakdown Cards */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <p className="text-slate-500">Total Committed</p>
                    <p className="text-base font-bold text-slate-900 font-mono mt-0.5">
                      ₹{selectedMemberData.tak.committedAmount.toLocaleString('en-IN')}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                    <p className="text-emerald-700">Total Paid to Date</p>
                    <p className="text-base font-bold text-emerald-800 font-mono mt-0.5">
                      ₹{selectedMemberData.tak.paidAmount.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>

                {/* Outstanding Balance Highlight */}
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-rose-800">Current Outstanding Balance</p>
                    <p className="text-2xl font-black text-rose-900 font-mono mt-0.5">
                      ₹{selectedMemberData.tak.balanceDue.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-200 text-rose-900">
                      {selectedMemberData.tak.status}
                    </span>
                  </div>
                </div>

                {/* Projected Balance After Payment */}
                {payAmount && Number(payAmount) > 0 && (
                  <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-300 text-xs space-y-1">
                    <div className="flex justify-between text-slate-700">
                      <span>Payment entering now:</span>
                      <span className="font-bold text-emerald-700 font-mono">
                        -₹{Number(payAmount).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-amber-200">
                      <span>Projected New Balance:</span>
                      <span className="font-mono text-amber-900">
                        ₹
                        {Math.max(
                          0,
                          selectedMemberData.tak.balanceDue - Number(payAmount)
                        ).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 space-y-2">
                <Receipt className="w-10 h-10 mx-auto text-slate-300" />
                <p className="font-bold text-slate-700">No Member Selected</p>
                <p className="text-xs text-slate-400">
                  Select a Head of Family from the dropdown to inspect their active Takhmeen commitment
                  and balance due.
                </p>
              </div>
            )}

            {/* Quick Cashier Guidelines */}
            <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 space-y-1.5">
              <p className="font-bold flex items-center gap-1.5 text-amber-950">
                <CheckCircle2 className="w-4 h-4 text-amber-600" />
                <span>Cashier Best Practices</span>
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-700 text-[11px]">
                <li>All cash collections must have a physical Counter Voucher number.</li>
                <li>Digital UPI & Bank Transfer receipts are verified via UTR / Txn reference.</li>
                <li>Receipts are immediately recorded in Central Activity Log for audit compliance.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: PENDING DUES & DEFAULTERS LIST ── */}
      {activeTab === 'defaulters' && (
        <div className="space-y-4">
          <div className="bg-white border border-rose-200 rounded-xl p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search defaulters by ITS, Name, Mobile..."
                value={defaulterSearch}
                onChange={(e) => setDefaulterSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Min Due Filter */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-slate-600 font-semibold">Min Outstanding:</span>
              <select
                value={minDueFilter}
                onChange={(e) => setMinDueFilter(Number(e.target.value))}
                className="p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-bold"
              >
                <option value={0}>Any Due (&gt; ₹0)</option>
                <option value={10000}>&gt; ₹10,000</option>
                <option value={25000}>&gt; ₹25,000</option>
                <option value={50000}>&gt; ₹50,000</option>
              </select>
            </div>
          </div>

          {/* Defaulters Table */}
          <div className="bg-white border border-rose-200/90 rounded-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0F172A] text-white uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="py-3 px-3.5">ITS No</th>
                    <th className="py-3 px-3.5">HOF Name</th>
                    <th className="py-3 px-3.5">Mobile</th>
                    <th className="py-3 px-3.5">Committed</th>
                    <th className="py-3 px-3.5">Paid</th>
                    <th className="py-3 px-3.5 text-right">Outstanding Balance</th>
                    <th className="py-3 px-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {defaultersList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-500">
                        <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400 mb-2" />
                        <p className="font-semibold text-slate-700">No Outstanding Dues Found!</p>
                        <p className="text-xs text-slate-400">All filtered members are fully settled.</p>
                      </td>
                    </tr>
                  ) : (
                    defaultersList.map((item) => (
                      <tr key={item.id} className="hover:bg-rose-50/40 transition-colors">
                        <td className="py-3 px-3.5 font-mono font-bold text-slate-900">
                          {item.itsNumber}
                        </td>
                        <td className="py-3 px-3.5">
                          <div className="font-bold text-slate-900">{item.hofName}</div>
                          <div className="text-[11px] text-slate-500 font-medium">{item.financialYear}</div>
                        </td>
                        <td className="py-3 px-3.5 font-mono text-slate-700 whitespace-nowrap">
                          {item.mobileNumber}
                        </td>
                        <td className="py-3 px-3.5 font-mono font-semibold text-slate-800 whitespace-nowrap">
                          ₹{item.committedAmount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3.5 font-mono font-semibold text-emerald-700 whitespace-nowrap">
                          ₹{item.paidAmount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3.5 font-mono font-bold text-rose-700 text-right whitespace-nowrap">
                          ₹{item.balanceDue.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Collect Now Shortcut */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedIts(item.itsNumber);
                                setPayAmount(item.balanceDue);
                                setActiveTab('counter');
                              }}
                              className="px-2.5 py-1 bg-amber-400 hover:bg-amber-500 text-slate-950 rounded font-bold text-[11px] cursor-pointer"
                            >
                              Collect Now
                            </button>

                            {/* Copy WhatsApp Reminder */}
                            <button
                              type="button"
                              onClick={() => handleCopyWhatsAppReminder(item)}
                              className="p-1.5 bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-800 rounded font-bold cursor-pointer"
                              title="Copy WhatsApp Reminder text"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>

                            {/* Call Link */}
                            <a
                              href={`tel:${item.mobileNumber}`}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-bold"
                              title="Call Member"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: RECENT COLLECTIONS LOG ── */}
      {activeTab === 'recent' && (
        <div className="bg-white border border-amber-200/90 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0F172A] text-white uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="py-3 px-3.5">Receipt No</th>
                  <th className="py-3 px-3.5">Date</th>
                  <th className="py-3 px-3.5">Member ITS & Name</th>
                  <th className="py-3 px-3.5 text-right">Amount (₹)</th>
                  <th className="py-3 px-3.5">Payment Mode</th>
                  <th className="py-3 px-3.5">Transaction Ref</th>
                  <th className="py-3 px-3.5">Cashier</th>
                  <th className="py-3 px-3.5 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {collections.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-500">
                      <Receipt className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      <p className="font-semibold text-slate-700">No Collections Recorded Yet</p>
                    </td>
                  </tr>
                ) : (
                  collections.map((c) => (
                    <tr key={c.id} className="hover:bg-amber-50/50 transition-colors">
                      <td className="py-3 px-3.5 font-mono font-bold text-amber-800 whitespace-nowrap">
                        {c.receiptNo}
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap text-slate-600">{c.date}</td>
                      <td className="py-3 px-3.5">
                        <div className="font-bold text-slate-900">{c.hofName}</div>
                        <div className="text-[11px] font-mono text-slate-500">ITS: {c.itsNumber}</div>
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono font-bold text-emerald-800 whitespace-nowrap">
                        ₹{c.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-800">
                          {c.paymentMode}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                        {c.referenceNo || 'N/A'}
                      </td>
                      <td className="py-3 px-3.5 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                        @{c.collectedBy}
                      </td>
                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setActiveReceipt(c)}
                          className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded font-bold text-[11px] flex items-center gap-1 cursor-pointer ml-auto"
                        >
                          <Printer className="w-3 h-3" />
                          <span>View Receipt</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── PRINTABLE DIGITAL RECEIPT MODAL ── */}
      {activeReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-amber-400 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-[#0F172A] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm">Official Jamaat E-Receipt</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveReceipt(null)}
                className="text-slate-400 hover:text-white p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Receipt Body for Print Preview */}
            <div className="p-6 space-y-4 text-xs font-sans">
              <div className="text-center pb-3 border-b border-dashed border-slate-300">
                <p className="font-black text-sm uppercase text-slate-900 tracking-wider">
                  Faiz ul Mawaid il Burhaniyah
                </p>
                <p className="text-[11px] text-slate-500">Anjuman-e-Saifee • Burhani Park Jamat</p>
                <p className="text-[10px] text-amber-800 font-bold mt-1">
                  OFFICIAL PAYMENT RECEIPT
                </p>
              </div>

              <div className="flex justify-between text-[11px]">
                <div>
                  <p className="text-slate-400">Receipt No:</p>
                  <p className="font-mono font-bold text-slate-900">{activeReceipt.receiptNo}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-400">Date & Time:</p>
                  <p className="font-mono text-slate-900">{activeReceipt.createdAt}</p>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Member Name:</span>
                  <span className="font-bold text-slate-900">{activeReceipt.hofName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">ITS Number:</span>
                  <span className="font-mono font-bold text-slate-900">{activeReceipt.itsNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Financial Year:</span>
                  <span className="font-semibold text-slate-800">{activeReceipt.financialYear}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Mode:</span>
                  <span className="font-bold text-slate-900">{activeReceipt.paymentMode}</span>
                </div>
                {activeReceipt.referenceNo && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Ref / Txn No:</span>
                    <span className="font-mono text-slate-700">{activeReceipt.referenceNo}</span>
                  </div>
                )}
              </div>

              {/* Amount Box */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-300 flex justify-between items-center">
                <span className="font-bold text-amber-950 uppercase text-[11px]">
                  Amount Received:
                </span>
                <span className="font-mono font-black text-xl text-amber-950">
                  ₹{activeReceipt.amount.toLocaleString('en-IN')}
                </span>
              </div>

              {activeReceipt.notes && (
                <div className="text-[11px] text-slate-500 italic">
                  Note: {activeReceipt.notes}
                </div>
              )}

              <div className="pt-2 text-center text-[10px] text-slate-400 border-t border-slate-100">
                Processed by Cashier @{activeReceipt.collectedBy} • System Verified E-Receipt
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    window.print();
                  }}
                  className="py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-400" />
                  <span>Print Receipt</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveReceipt(null)}
                  className="py-2 px-3 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-lg cursor-pointer text-center"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
