import React, { useState, useMemo } from 'react';
import {
  Coins,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Printer,
  X,
  Lock,
  ArrowRight,
  TrendingDown,
  Clock,
  User,
  ShieldCheck,
  Building,
  Calendar,
  Layers,
  HelpCircle,
} from 'lucide-react';
import {
  SabeelLedgerRecord,
  SabeelTransactionEntry,
  SabeelPaymentMode,
  SabeelCategory,
  SabeelAccountStatus,
  HeadOfFamily,
  UserProfile,
  FinancialYear,
} from '../../types';
import {
  recordSabeelPayment,
  saveStoredSabeelLedger,
  logSabeelAudit,
} from '../../utils/sabeelManagement';
import { checkUserPermission } from '../../utils/rbac';
import { TrustOfficialReceiptModal } from '../common/TrustOfficialReceiptModal';
import { numberToWordsIndian } from '../../utils/fmbPart2Data';

interface SabeelTakhmeenCollectionSubpageProps {
  ledger: SabeelLedgerRecord[];
  setLedger: React.Dispatch<React.SetStateAction<SabeelLedgerRecord[]>>;
  transactions: SabeelTransactionEntry[];
  setTransactions: React.Dispatch<React.SetStateAction<SabeelTransactionEntry[]>>;
  hofs: HeadOfFamily[];
  currentUser: UserProfile;
  financialYear: FinancialYear;
  showToast: (msg: string) => void;
  preselectedIts?: string;
}

export const SabeelTakhmeenCollectionSubpage: React.FC<SabeelTakhmeenCollectionSubpageProps> = ({
  ledger,
  setLedger,
  transactions,
  setTransactions,
  hofs,
  currentUser,
  financialYear,
  showToast,
  preselectedIts,
}) => {
  // Active Section Mode: Payment Collection vs Yearly Commitment Setting
  const [activeSection, setActiveSection] = useState<'collection' | 'takhmeen'>('collection');

  // Fast Payment Form State
  const [selectedIts, setSelectedIts] = useState<string>(preselectedIts || '');
  const [payAmount, setPayAmount] = useState<number | ''>('');
  const [paymentMode, setPaymentMode] = useState<SabeelPaymentMode>('Cash');
  const [referenceNo, setReferenceNo] = useState('');
  const [receiptDate, setReceiptDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // E-Receipt Popup State
  const [activeReceipt, setActiveReceipt] = useState<SabeelTransactionEntry | null>(null);

  // Yearly Commitment Allocation State
  const [allocIts, setAllocIts] = useState('');
  const [allocCategory, setAllocCategory] = useState<SabeelCategory>('Residential');
  const [allocCommitted, setAllocCommitted] = useState<number>(24000);
  const [allocNotes, setAllocNotes] = useState('');

  // Granular RBAC Permissions
  const canAdd = checkUserPermission(currentUser, 'sabeel-collection', 'add');
  const canEdit = checkUserPermission(currentUser, 'sabeel-collection', 'edit');

  // Auto-populated selected account info
  const selectedAccount = useMemo(() => {
    if (!selectedIts) return null;
    const account = ledger.find(
      (l) => l.itsNumber === selectedIts && l.financialYear === financialYear
    );
    const hof = hofs.find((h) => h.itsNumber === selectedIts);
    return { account, hof };
  }, [selectedIts, ledger, hofs, financialYear]);

  // Handle member selection in payment desk
  const handleSelectMember = (its: string) => {
    setSelectedIts(its);
    const matched = ledger.find(
      (l) => l.itsNumber === its && l.financialYear === financialYear
    );
    if (matched && matched.balanceDue > 0) {
      setPayAmount(matched.balanceDue);
    } else {
      setPayAmount('');
    }
  };

  // Submit Payment
  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAdd) {
      showToast('Access Restricted: You do not have [Add] permission for Sabeel Collection.');
      return;
    }

    if (!selectedIts) {
      showToast('Please select a member account.');
      return;
    }

    const amountNum = Number(payAmount);
    if (!amountNum || amountNum <= 0) {
      showToast('Please specify a valid payment amount.');
      return;
    }

    const memberName =
      selectedAccount?.account?.hofName || selectedAccount?.hof?.fullName || 'Mumineen Member';
    const sabeelNo = selectedAccount?.account?.sabeelNo || 'SB-GEN';

    setIsSubmitting(true);

    try {
      const result = recordSabeelPayment(
        {
          itsNumber: selectedIts,
          hofName: memberName,
          sabeelNo,
          amount: amountNum,
          paymentMode,
          referenceNo: referenceNo.trim() || undefined,
          financialYear,
          date: receiptDate,
          notes: notes.trim() || undefined,
        },
        currentUser.username
      );

      setLedger(result.updatedLedger);
      setTransactions(result.updatedTransactions);

      showToast(`Recorded Sabeel payment of ₹${amountNum.toLocaleString('en-IN')}!`);
      setActiveReceipt(result.newTransaction);

      // Reset
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

  // Submit Yearly Commitment Allocation
  const handleSubmitAllocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit && !canAdd) {
      showToast('Access Restricted: You do not have permission to allocate Sabeel commitments.');
      return;
    }

    if (!allocIts || allocCommitted <= 0) {
      showToast('Please select a member and enter a valid commitment target.');
      return;
    }

    const matchedHof = hofs.find((h) => h.itsNumber === allocIts);
    const existing = ledger.find(
      (l) => l.itsNumber === allocIts && l.financialYear === financialYear
    );

    const now = new Date().toISOString().slice(0, 10);

    if (existing) {
      // Update existing commitment
      const newBalance = Math.max(0, allocCommitted - (existing.paidAmount || 0));
      const newStatus: SabeelAccountStatus =
        newBalance === 0 ? 'Settled' : (existing.paidAmount || 0) > 0 ? 'Partial' : 'Pending';

      const updated = ledger.map((l) =>
        l.id === existing.id
          ? {
              ...l,
              category: allocCategory,
              committedAmount: allocCommitted,
              balanceDue: newBalance,
              status: newStatus,
              notes: allocNotes.trim() || l.notes,
              updatedAt: now,
            }
          : l
      );

      setLedger(updated);
      saveStoredSabeelLedger(updated);
      logSabeelAudit(
        currentUser.username,
        'Sabeel Takhmeen & Collection',
        'EDIT',
        allocIts,
        `Updated annual Sabeel commitment to ₹${allocCommitted.toLocaleString(
          'en-IN'
        )} (${allocCategory}) for ${existing.hofName}.`
      );
      showToast(`Updated annual Sabeel commitment for ${existing.hofName}.`);
    } else {
      // Create new commitment
      const newRecord: SabeelLedgerRecord = {
        id: `sb-${allocIts}-${Date.now().toString().slice(-4)}`,
        itsNumber: allocIts,
        hofName: matchedHof?.fullName || 'Member',
        sabeelNo: matchedHof?.sabeelNo || `SB-${String(ledger.length + 101).padStart(3, '0')}`,
        mobileNumber: matchedHof?.mobileNumber || '',
        mohallahName: matchedHof?.mohallahName || 'Burhani Mohallah',
        financialYear,
        category: allocCategory,
        committedAmount: allocCommitted,
        paidAmount: 0,
        balanceDue: allocCommitted,
        status: 'Pending',
        notes: allocNotes.trim() || 'Annual Sabeel allocation registered',
        createdAt: now,
        updatedAt: now,
      };

      const updated = [newRecord, ...ledger];
      setLedger(updated);
      saveStoredSabeelLedger(updated);
      logSabeelAudit(
        currentUser.username,
        'Sabeel Takhmeen & Collection',
        'ADD',
        allocIts,
        `Allocated annual Sabeel commitment ₹${allocCommitted.toLocaleString(
          'en-IN'
        )} (${allocCategory}) for ${newRecord.hofName}.`
      );
      showToast(`Allocated annual Sabeel commitment for ${newRecord.hofName}.`);
    }

    // Reset allocation form
    setAllocIts('');
    setAllocNotes('');
  };

  return (
    <div className="space-y-6">
      {/* ── Mode Switcher Tabs ── */}
      <div className="bg-white border border-amber-300/40 rounded-xl p-1.5 shadow-xs flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveSection('collection')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-bold transition-all cursor-pointer ${
              activeSection === 'collection'
                ? 'bg-[#0F172A] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-amber-50'
            }`}
          >
            <CreditCard className="w-4 h-4 text-amber-400" />
            <span>💳 Fast Payment Collection Desk</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('takhmeen')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-bold transition-all cursor-pointer ${
              activeSection === 'takhmeen'
                ? 'bg-[#0F172A] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-amber-50'
            }`}
          >
            <Layers className="w-4 h-4 text-amber-400" />
            <span>🎯 Annual Sabeel Takhmeen Setup</span>
          </button>
        </div>

        <span className="text-slate-500 font-semibold hidden md:inline-block pr-2">
          Financial Year: <span className="font-mono font-bold text-amber-900">{financialYear}</span>
        </span>
      </div>

      {/* ── SECTION 1: FAST PAYMENT COLLECTION DESK ── */}
      {activeSection === 'collection' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Collection Form (7 cols) */}
          <div className="lg:col-span-7 bg-white border border-amber-200/90 rounded-2xl shadow-sm p-5 sm:p-6 space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-amber-600" />
                <span>Record Sabeel Payment</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Counter receipt desk for instantaneous cash, UPI, cheque, and bank collections with live balance deduction.
              </p>
            </div>

            <form onSubmit={handleSubmitPayment} className="space-y-4 text-xs">
              {/* Select Member */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Select Head of Family (ITS Number or Name) *
                </label>
                <select
                  value={selectedIts}
                  onChange={(e) => handleSelectMember(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                >
                  <option value="">-- Choose Member Account --</option>
                  {ledger.map((l) => (
                    <option key={l.id} value={l.itsNumber}>
                      {l.hofName} ({l.sabeelNo} • ITS: {l.itsNumber}) • Due: ₹{l.balanceDue.toLocaleString('en-IN')}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Selecting a member automatically fetches their active Sabeel number and current pending dues.
                </p>
              </div>

              {/* Collection Amount */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Collection Amount (₹) *
                  </label>
                  {selectedAccount?.account && selectedAccount.account.balanceDue > 0 && (
                    <button
                      type="button"
                      onClick={() => setPayAmount(selectedAccount.account!.balanceDue)}
                      className="text-[11px] font-bold text-amber-700 hover:text-amber-900 hover:underline cursor-pointer"
                    >
                      Fill Full Due (₹{selectedAccount.account.balanceDue.toLocaleString('en-IN')})
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
                    placeholder="Enter amount collected..."
                    className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono font-bold text-base focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[2000, 3000, 6000, 12000, 18000, 24000].map((preset) => (
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
                  {(['Cash', 'UPI', 'Bank Transfer', 'Cheque'] as SabeelPaymentMode[]).map((mode) => (
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

              {/* Transaction Ref & Receipt Date */}
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
                        ? 'e.g. UPI/REF/984102...'
                        : paymentMode === 'Cheque'
                        ? 'e.g. Cheque No 40291...'
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
                    value={receiptDate}
                    onChange={(e) => setReceiptDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                    required
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Payment Particulars / Remarks
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Q1 Sabeel installment / Counter cash receipt"
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
                  <CreditCard className="w-4 h-4" />
                  <span>
                    {isSubmitting
                      ? 'Processing Collection & Updating Ledger...'
                      : `💳 Record Sabeel Payment (₹${Number(payAmount || 0).toLocaleString('en-IN')})`}
                  </span>
                </button>
              ) : (
                <div className="w-full py-3 bg-slate-100 text-slate-400 font-bold rounded-xl text-sm text-center flex items-center justify-center gap-2 cursor-not-allowed">
                  <Lock className="w-4 h-4" />
                  <span>Payment Collection Restricted by RBAC</span>
                </div>
              )}
            </form>
          </div>

          {/* Account Live Status Panel (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {selectedAccount?.account ? (
              <div className="bg-white border border-amber-300/80 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                      Selected Sabeel Account
                    </span>
                    <h4 className="text-base font-bold text-slate-900 mt-0.5">
                      {selectedAccount.account.hofName}
                    </h4>
                    <p className="text-xs text-slate-500 font-mono">
                      ITS: {selectedAccount.account.itsNumber} • {selectedAccount.account.mohallahName}
                    </p>
                  </div>
                  <span className="font-mono font-bold text-amber-900 px-2 py-0.5 rounded bg-amber-100 border border-amber-300 text-xs">
                    {selectedAccount.account.sabeelNo}
                  </span>
                </div>

                {/* Ledger Breakdown Cards */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <p className="text-slate-500">Annual Target</p>
                    <p className="text-base font-bold text-slate-900 font-mono mt-0.5">
                      ₹{selectedAccount.account.committedAmount.toLocaleString('en-IN')}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                    <p className="text-emerald-700">Total Paid</p>
                    <p className="text-base font-bold text-emerald-800 font-mono mt-0.5">
                      ₹{selectedAccount.account.paidAmount.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>

                {/* Outstanding Balance */}
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-rose-800">Remaining Balance Due</p>
                    <p className="text-2xl font-black text-rose-900 font-mono mt-0.5">
                      ₹{selectedAccount.account.balanceDue.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-200 text-rose-900">
                      {selectedAccount.account.status}
                    </span>
                  </div>
                </div>

                {/* Live Projected Balance Calculation */}
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
                          selectedAccount.account.balanceDue - Number(payAmount)
                        ).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 space-y-2">
                <CreditCard className="w-10 h-10 mx-auto text-slate-300" />
                <p className="font-bold text-slate-700">No Member Selected</p>
                <p className="text-xs text-slate-400">
                  Select a member from the dropdown to load their active Sabeel account, current balance,
                  and payment history.
                </p>
              </div>
            )}

            {/* Quick Helper Tips */}
            <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 space-y-1.5">
              <p className="font-bold flex items-center gap-1.5 text-amber-950">
                <HelpCircle className="w-4 h-4 text-amber-600" />
                <span>Quick Counter Guidelines</span>
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-700 text-[11px]">
                <li>Always confirm member's 8-digit ITS number before saving receipt.</li>
                <li>Digital receipt will be shown immediately for printing or PDF save.</li>
                <li>Receipts are immutably archived in the Central Activity Log.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION 2: ANNUAL TAKHMEEN COMMITMENT SETUP ── */}
      {activeSection === 'takhmeen' && (
        <div className="bg-white border border-amber-200/90 rounded-2xl shadow-sm p-5 sm:p-6 space-y-5 max-w-2xl">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-600" />
              <span>Annual Sabeel Takhmeen Allocation</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure or revise yearly Sabeel commitments linked directly to Member Master HOF profiles.
            </p>
          </div>

          <form onSubmit={handleSubmitAllocation} className="space-y-4 text-xs">
            {/* Select Member */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Select Head of Family *
              </label>
              <select
                value={allocIts}
                onChange={(e) => {
                  const its = e.target.value;
                  setAllocIts(its);
                  const existing = ledger.find(
                    (l) => l.itsNumber === its && l.financialYear === financialYear
                  );
                  if (existing) {
                    setAllocCategory(existing.category);
                    setAllocCommitted(existing.committedAmount);
                  }
                }}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              >
                <option value="">-- Choose Member HOF --</option>
                {hofs.map((h) => {
                  const existing = ledger.find(
                    (l) => l.itsNumber === h.itsNumber && l.financialYear === financialYear
                  );
                  return (
                    <option key={h.id} value={h.itsNumber}>
                      {h.fullName} (ITS: {h.itsNumber}) • {existing ? `Active: ₹${existing.committedAmount}` : 'Unallocated'}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Sabeel Category */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Sabeel Category *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Residential', 'Commercial', 'Special'] as SabeelCategory[]).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setAllocCategory(cat)}
                    className={`p-2.5 rounded-lg font-bold border text-center transition-all cursor-pointer ${
                      allocCategory === cat
                        ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Amount */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Annual Committed Target Amount (₹) *
              </label>
              <input
                type="number"
                min={1000}
                step={500}
                value={allocCommitted || ''}
                onChange={(e) => setAllocCommitted(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
              <div className="flex gap-2 mt-1.5">
                {[12000, 18000, 24000, 36000, 48000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAllocCommitted(amt)}
                    className="px-2.5 py-1 rounded bg-slate-100 hover:bg-amber-100 text-slate-700 text-[10px] font-mono font-semibold"
                  >
                    ₹{amt.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Allocation Notes / Justification
              </label>
              <input
                type="text"
                value={allocNotes}
                onChange={(e) => setAllocNotes(e.target.value)}
                placeholder="e.g. Approved annual pledge for 1447 Hijri"
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!allocIts || allocCommitted <= 0}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-sm cursor-pointer"
            >
              🎯 Update / Save Annual Commitment
            </button>
          </form>
        </div>
      )}

      {/* ── STANDARDIZED OFFICIAL TRUST RECEIPT STUDIO MODAL ── */}
      <TrustOfficialReceiptModal
        isOpen={!!activeReceipt}
        onClose={() => setActiveReceipt(null)}
        currentUser={currentUser}
        title="Official Dawoodi Bohra Jamaat Trust Sabeel Receipt"
        receiptData={
          activeReceipt
            ? {
                trustTitle: 'DAWOODI BOHRA JAMAAT TRUST, BURHANIPARK VATWA',
                trustRegnNo: 'Regn No - B/81',
                managedBy: 'Managed By Anjuman e Mufaddal',
                accountTitle: 'A/c : Sabeel ul Barkaat / Sabeel Mubarak',
                receiptNo:
                  (activeReceipt.receiptNo || '').replace(/[^0-9]/g, '') ||
                  activeReceipt.receiptNo,
                dateStr:
                  activeReceipt.createdAt ? activeReceipt.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
                memberName: (activeReceipt.hofName || '').toUpperCase(),
                honorificLeft: '(حفظه الله تعالى)',
                itsNo: activeReceipt.itsNumber,
                address: (
                  ledger.find((l) => l.itsNumber === activeReceipt.itsNumber)?.address ||
                  ledger.find((l) => l.itsNumber === activeReceipt.itsNumber)?.fullAddress ||
                  'BURHANI PARK, OPP. NAVANA PUMPING STATION, VATWA, AHMEDABAD'
                ).toUpperCase(),
                greetingArabic: 'بعد السلام الجميل',
                amount: activeReceipt.amount,
                amountInWords: numberToWordsIndian(activeReceipt.amount),
                descriptorRight: 'اپ طرف سي',
                descriptorAnke: 'انکه',
                paymentModeStr:
                  activeReceipt.paymentMode === 'Cash'
                    ? 'By Cash.'
                    : activeReceipt.paymentMode === 'Cheque'
                    ? 'By Cheque.'
                    : `By ${activeReceipt.paymentMode}.`,
                purposeTitle: activeReceipt.sabeelNo
                  ? `Sabeel Mubarak (${activeReceipt.sabeelNo})`
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
