import React, { useState, useMemo } from 'react';
import {
  ArrowLeftRight,
  Clock,
  Search,
  Filter,
  Printer,
  X,
  Lock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  FileText,
  User,
  ShieldCheck,
  Building,
  ArrowRight,
  TrendingUp,
  Receipt,
} from 'lucide-react';
import {
  SabeelLedgerRecord,
  SabeelTransactionEntry,
  SabeelTransactionType,
  HeadOfFamily,
  UserProfile,
  FinancialYear,
} from '../../types';
import { executeSabeelTransfer, logSabeelAudit } from '../../utils/sabeelManagement';
import { checkUserPermission } from '../../utils/rbac';

interface SabeelTransferHistorySubpageProps {
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

export const SabeelTransferHistorySubpage: React.FC<SabeelTransferHistorySubpageProps> = ({
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
  // Active View Tab: Transfer Tool vs History Log
  const [activeTab, setActiveTab] = useState<'history' | 'transfer'>('history');

  // Transfer Tool State
  const [fromIts, setFromIts] = useState(preselectedIts || '');
  const [toIts, setToIts] = useState('');
  const [transferAmount, setTransferAmount] = useState<number | ''>('');
  const [transferReason, setTransferReason] = useState('');
  const [transferDate, setTransferDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [isExecutingTransfer, setIsExecutingTransfer] = useState(false);

  // History Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Receipt Modal State
  const [activeReceipt, setActiveReceipt] = useState<SabeelTransactionEntry | null>(null);

  // Granular RBAC Permissions
  const canEdit = checkUserPermission(currentUser, 'sabeel-history', 'edit');
  const canAdd = checkUserPermission(currentUser, 'sabeel-history', 'add');

  // Source & Target Account lookups
  const sourceAccount = useMemo(() => {
    return ledger.find((l) => l.itsNumber === fromIts && l.financialYear === financialYear);
  }, [ledger, fromIts, financialYear]);

  const targetAccount = useMemo(() => {
    return ledger.find((l) => l.itsNumber === toIts && l.financialYear === financialYear);
  }, [ledger, toIts, financialYear]);

  // Execute Transfer
  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit && !canAdd) {
      showToast('Access Restricted: You do not have permission to execute Sabeel balance transfers.');
      return;
    }

    if (!fromIts || !toIts) {
      showToast('Please select both Source and Target accounts.');
      return;
    }

    if (fromIts === toIts) {
      showToast('Source and Target account cannot be the same.');
      return;
    }

    const amountNum = Number(transferAmount);
    if (!amountNum || amountNum <= 0) {
      showToast('Please enter a valid transfer amount.');
      return;
    }

    if (!transferReason.trim()) {
      showToast('A mandatory reason / justification note is required for audit compliance.');
      return;
    }

    if (!sourceAccount || !targetAccount) {
      showToast('Selected accounts could not be verified in the active financial year ledger.');
      return;
    }

    if (amountNum > sourceAccount.paidAmount) {
      if (
        !window.confirm(
          `Warning: The transfer amount (₹${amountNum.toLocaleString(
            'en-IN'
          )}) exceeds the source account's recorded paid balance (₹${sourceAccount.paidAmount.toLocaleString(
            'en-IN'
          )}). Do you want to proceed with this balance transfer adjustment?`
        )
      ) {
        return;
      }
    }

    setIsExecutingTransfer(true);

    try {
      const result = executeSabeelTransfer(
        {
          fromIts,
          fromHofName: sourceAccount.hofName,
          fromSabeelNo: sourceAccount.sabeelNo,
          toIts,
          toHofName: targetAccount.hofName,
          toSabeelNo: targetAccount.sabeelNo,
          amount: amountNum,
          financialYear,
          date: transferDate,
          reason: transferReason.trim(),
        },
        currentUser.username
      );

      setLedger(result.updatedLedger);
      setTransactions(result.updatedTransactions);

      showToast(
        `Successfully transferred ₹${amountNum.toLocaleString('en-IN')} from ${sourceAccount.hofName} to ${targetAccount.hofName}.`
      );

      // Reset
      setTransferAmount('');
      setTransferReason('');
      setActiveTab('history');
    } catch (err) {
      console.error(err);
      showToast('Transfer failed. Please check ledger state.');
    } finally {
      setIsExecutingTransfer(false);
    }
  };

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        t.receiptNo.toLowerCase().includes(q) ||
        t.itsNumber.includes(q) ||
        t.hofName.toLowerCase().includes(q) ||
        t.sabeelNo.toLowerCase().includes(q) ||
        t.notes.toLowerCase().includes(q);

      const matchType = typeFilter === 'all' || t.type === typeFilter;

      return matchSearch && matchType;
    });
  }, [transactions, searchQuery, typeFilter]);

  // Render Type Badge
  const renderTypeBadge = (type: SabeelTransactionType) => {
    switch (type) {
      case 'PAYMENT':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            Payment Received
          </span>
        );
      case 'TRANSFER_IN':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
            Transfer In (Credit)
          </span>
        );
      case 'TRANSFER_OUT':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-300">
            Transfer Out (Debit)
          </span>
        );
      case 'ADJUSTMENT':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
            Ledger Adjustment
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Sub-navigation Tabs ── */}
      <div className="bg-white border border-amber-300/40 rounded-xl p-1.5 shadow-xs flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-bold transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-[#0F172A] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-amber-50'
            }`}
          >
            <Clock className="w-4 h-4 text-amber-400" />
            <span>1. Transaction History Ledger ({transactions.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('transfer')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-bold transition-all cursor-pointer ${
              activeTab === 'transfer'
                ? 'bg-[#0F172A] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-amber-50'
            }`}
          >
            <ArrowLeftRight className="w-4 h-4 text-amber-400" />
            <span>2. Sabeel Transfer & Adjustment Tool</span>
          </button>
        </div>

        <span className="text-slate-500 font-semibold hidden md:inline-block pr-2">
          Central Sabeel Archive • <span className="font-mono font-bold text-amber-900">{financialYear}</span>
        </span>
      </div>

      {/* ── TAB 1: TRANSACTION HISTORY LEDGER ── */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="bg-white border border-amber-200/80 rounded-xl p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search history by Receipt No, Member ITS, Name, Sabeel No, or Notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Transaction Type Filter */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-slate-500 font-semibold">Type:</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="all">All Transactions ({transactions.length})</option>
                <option value="PAYMENT">Payments Only</option>
                <option value="TRANSFER_IN">Transfers In</option>
                <option value="TRANSFER_OUT">Transfers Out</option>
                <option value="ADJUSTMENT">Adjustments</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-amber-200/90 rounded-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0F172A] text-white uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="py-3 px-3.5">Receipt / Ref</th>
                    <th className="py-3 px-3.5">Date</th>
                    <th className="py-3 px-3.5">Type</th>
                    <th className="py-3 px-3.5">Member Name & ITS</th>
                    <th className="py-3 px-3.5">Sabeel No</th>
                    <th className="py-3 px-3.5 text-right">Amount (₹)</th>
                    <th className="py-3 px-3.5">Particulars / Reason</th>
                    <th className="py-3 px-3.5">Processed By</th>
                    <th className="py-3 px-3.5 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-12 text-slate-500">
                        <Clock className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                        <p className="font-semibold text-slate-700">No Transaction Records Found</p>
                        <p className="text-xs text-slate-400">
                          Transactions will automatically appear here as collections and transfers are recorded.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-amber-50/50 transition-colors">
                        {/* Receipt / Ref */}
                        <td className="py-3 px-3.5 font-mono font-bold text-amber-800 whitespace-nowrap">
                          {tx.receiptNo}
                        </td>

                        {/* Date */}
                        <td className="py-3 px-3.5 whitespace-nowrap text-slate-600 font-medium">
                          {tx.date}
                        </td>

                        {/* Type */}
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          {renderTypeBadge(tx.type)}
                        </td>

                        {/* Member Name & ITS */}
                        <td className="py-3 px-3.5">
                          <div className="font-bold text-slate-900">{tx.hofName}</div>
                          <div className="text-[11px] font-mono text-slate-500">ITS: {tx.itsNumber}</div>
                        </td>

                        {/* Sabeel No */}
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <span className="font-mono font-bold text-slate-800">{tx.sabeelNo}</span>
                        </td>

                        {/* Amount */}
                        <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                          <span
                            className={
                              tx.type === 'TRANSFER_OUT' ? 'text-purple-700' : 'text-emerald-700'
                            }
                          >
                            {tx.type === 'TRANSFER_OUT' ? '-' : '+'}₹
                            {tx.amount.toLocaleString('en-IN')}
                          </span>
                        </td>

                        {/* Particulars / Reason */}
                        <td className="py-3 px-3.5 max-w-xs">
                          <p className="text-slate-800 truncate" title={tx.notes}>
                            {tx.notes}
                          </p>
                          {tx.referenceNo && (
                            <p className="text-[10px] font-mono text-slate-400">
                              Ref: {tx.referenceNo}
                            </p>
                          )}
                        </td>

                        {/* Cashier / Officer */}
                        <td className="py-3 px-3.5 font-mono text-slate-600 text-[11px] whitespace-nowrap">
                          @{tx.collectedBy}
                        </td>

                        {/* Receipt View Button */}
                        <td className="py-3 px-3.5 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setActiveReceipt(tx)}
                            className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded font-bold text-[11px] flex items-center gap-1 cursor-pointer ml-auto"
                            title="Print / View Official Receipt"
                          >
                            <Printer className="w-3 h-3" />
                            <span>Print</span>
                          </button>
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

      {/* ── TAB 2: SABEEL TRANSFER & ADJUSTMENT TOOL ── */}
      {activeTab === 'transfer' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Transfer Form (7 cols) */}
          <div className="lg:col-span-7 bg-white border border-amber-200/90 rounded-2xl shadow-sm p-5 sm:p-6 space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-amber-600" />
                <span>Sabeel Balance Transfer & Reallocation</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Transfer paid credits or adjust allocations between Mumineen Sabeel accounts with mandatory
                audit justification.
              </p>
            </div>

            <form onSubmit={handleExecuteTransfer} className="space-y-4 text-xs">
              {/* Source Account (From) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  1. Source Account (Transfer From) *
                </label>
                <select
                  value={fromIts}
                  onChange={(e) => setFromIts(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                >
                  <option value="">-- Choose Debiting Account --</option>
                  {ledger.map((l) => (
                    <option key={l.id} value={l.itsNumber}>
                      {l.hofName} ({l.sabeelNo} • ITS: {l.itsNumber}) • Available Paid: ₹
                      {l.paidAmount.toLocaleString('en-IN')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Account (To) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  2. Target Account (Transfer To) *
                </label>
                <select
                  value={toIts}
                  onChange={(e) => setToIts(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                >
                  <option value="">-- Choose Crediting Account --</option>
                  {ledger
                    .filter((l) => l.itsNumber !== fromIts)
                    .map((l) => (
                      <option key={l.id} value={l.itsNumber}>
                        {l.hofName} ({l.sabeelNo} • ITS: {l.itsNumber}) • Due: ₹
                        {l.balanceDue.toLocaleString('en-IN')}
                      </option>
                    ))}
                </select>
              </div>

              {/* Transfer Amount */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  3. Transfer Amount (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={transferAmount}
                    onChange={(e) =>
                      setTransferAmount(e.target.value ? Number(e.target.value) : '')
                    }
                    placeholder="Enter amount to transfer..."
                    className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono font-bold text-base focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Transfer Date *
                </label>
                <input
                  type="date"
                  value={transferDate}
                  onChange={(e) => setTransferDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  required
                />
              </div>

              {/* Mandatory Reason Note */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  4. Mandatory Reason Note / Justification *
                </label>
                <textarea
                  rows={3}
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  placeholder="State the official reason (e.g. Relocated to another Mohallah / Family consolidation / Erroneous deposit reallocation)..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
                <p className="text-[10px] text-amber-700 mt-1">
                  Note: This reason is permanently recorded in the central audit ledger for financial compliance.
                </p>
              </div>

              {/* Submit Transfer Button */}
              {canEdit || canAdd ? (
                <button
                  type="submit"
                  disabled={
                    isExecutingTransfer ||
                    !fromIts ||
                    !toIts ||
                    !transferAmount ||
                    !transferReason.trim()
                  }
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                  <span>
                    {isExecutingTransfer
                      ? 'Executing Transfer...'
                      : `🔄 Execute Transfer of ₹${Number(transferAmount || 0).toLocaleString(
                          'en-IN'
                        )}`}
                  </span>
                </button>
              ) : (
                <div className="w-full py-3 bg-slate-100 text-slate-400 font-bold rounded-xl text-sm text-center flex items-center justify-center gap-2 cursor-not-allowed">
                  <Lock className="w-4 h-4" />
                  <span>Sabeel Transfers Restricted by RBAC</span>
                </div>
              )}
            </form>
          </div>

          {/* Transfer Preview Panel (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white border border-amber-300/80 rounded-2xl p-5 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-amber-600" />
                <span>Live Transfer Impact Preview</span>
              </h4>

              {/* Source Account Impact */}
              {sourceAccount ? (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                  <span className="font-bold text-slate-600 text-[10px] uppercase">
                    Debiting Account (From)
                  </span>
                  <p className="font-bold text-slate-900">{sourceAccount.hofName}</p>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {sourceAccount.sabeelNo} • ITS: {sourceAccount.itsNumber}
                  </p>
                  <div className="flex justify-between text-slate-700 pt-1 border-t border-slate-200">
                    <span>Current Paid:</span>
                    <span className="font-mono font-bold">
                      ₹{sourceAccount.paidAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  {transferAmount && Number(transferAmount) > 0 && (
                    <div className="flex justify-between text-rose-700 font-bold">
                      <span>After Debit:</span>
                      <span className="font-mono">
                        ₹
                        {Math.max(
                          0,
                          sourceAccount.paidAmount - Number(transferAmount)
                        ).toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-400 text-center">
                  Select a Source Account to view debit impact
                </div>
              )}

              {/* Target Account Impact */}
              {targetAccount ? (
                <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs space-y-1.5">
                  <span className="font-bold text-emerald-800 text-[10px] uppercase">
                    Crediting Account (To)
                  </span>
                  <p className="font-bold text-slate-900">{targetAccount.hofName}</p>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {targetAccount.sabeelNo} • ITS: {targetAccount.itsNumber}
                  </p>
                  <div className="flex justify-between text-slate-700 pt-1 border-t border-emerald-200">
                    <span>Current Due:</span>
                    <span className="font-mono font-bold text-rose-700">
                      ₹{targetAccount.balanceDue.toLocaleString('en-IN')}
                    </span>
                  </div>
                  {transferAmount && Number(transferAmount) > 0 && (
                    <div className="flex justify-between text-emerald-800 font-bold">
                      <span>New Projected Due:</span>
                      <span className="font-mono">
                        ₹
                        {Math.max(
                          0,
                          targetAccount.balanceDue - Number(transferAmount)
                        ).toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-400 text-center">
                  Select a Target Account to view credit impact
                </div>
              )}
            </div>

            {/* Audit Advisory */}
            <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 space-y-1.5">
              <p className="font-bold flex items-center gap-1.5 text-amber-950">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>Audit & Accounting Advisory</span>
              </p>
              <p className="text-slate-700 text-[11px] leading-relaxed">
                Both corresponding debit (<span className="font-mono">TRANSFER_OUT</span>) and credit (
                <span className="font-mono">TRANSFER_IN</span>) vouchers will be generated simultaneously
                with cross-referencing receipt codes.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── PRINTABLE RECEIPT / VOUCHER MODAL ── */}
      {activeReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-amber-400 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-[#0F172A] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm">Official Sabeel Transaction Voucher</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveReceipt(null)}
                className="text-slate-400 hover:text-white p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 text-xs font-sans">
              <div className="text-center pb-3 border-b border-dashed border-slate-300">
                <p className="font-black text-sm uppercase text-slate-900 tracking-wider">
                  Sabeel-e-Hussaini Department
                </p>
                <p className="text-[11px] text-slate-500">Anjuman-e-Saifee • Burhani Park Jamat</p>
                <p className="text-[10px] text-amber-800 font-bold mt-1">
                  OFFICIAL TRANSACTION VOUCHER
                </p>
              </div>

              <div className="flex justify-between text-[11px]">
                <div>
                  <p className="text-slate-400">Voucher / Receipt No:</p>
                  <p className="font-mono font-bold text-slate-900">{activeReceipt.receiptNo}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-400">Date & Time:</p>
                  <p className="font-mono text-slate-900">{activeReceipt.createdAt}</p>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Transaction Type:</span>
                  <span className="font-bold text-slate-900">{activeReceipt.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Member Name:</span>
                  <span className="font-bold text-slate-900">{activeReceipt.hofName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">ITS Number:</span>
                  <span className="font-mono font-bold text-slate-900">{activeReceipt.itsNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Sabeel No:</span>
                  <span className="font-mono font-bold text-amber-900">{activeReceipt.sabeelNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Mode / Channel:</span>
                  <span className="font-bold text-slate-900">{activeReceipt.paymentMode}</span>
                </div>
              </div>

              {/* Amount Box */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-300 flex justify-between items-center">
                <span className="font-bold text-amber-950 uppercase text-[11px]">
                  Transaction Amount:
                </span>
                <span className="font-mono font-black text-xl text-amber-950">
                  ₹{activeReceipt.amount.toLocaleString('en-IN')}
                </span>
              </div>

              {activeReceipt.notes && (
                <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="font-semibold text-slate-700">Remarks: </span>
                  {activeReceipt.notes}
                </div>
              )}

              <div className="pt-2 text-center text-[10px] text-slate-400 border-t border-slate-100">
                Authorized by Cashier @{activeReceipt.collectedBy} • System Verified Sabeel E-Voucher
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
                  <span>Print Voucher</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveReceipt(null)}
                  className="py-2 px-3 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-lg cursor-pointer text-center"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
