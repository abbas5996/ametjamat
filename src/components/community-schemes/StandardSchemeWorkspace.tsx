import React, { useState, useMemo } from 'react';
import {
  Wallet, Receipt, FileSpreadsheet, Ban, Plus, Search, Download,
  Printer, CheckCircle2, RefreshCw, RotateCcw, CreditCard, UserCheck,
  Landmark, Coins, Calendar, X, Save
} from 'lucide-react';
import { FinancialYear, UserProfile } from '../../types';
import {
  PrimarySchemeName,
  OpeningBalanceType,
  SchemeReceiptMode,
  SchemeOpeningBalance,
  SchemeLedgerReceipt,
  fmtINR,
  getTodayIso,
  formatDisplayDate,
  toOfficialReceiptData,
  exportRowsToCsv,
  getStoredOpeningBalances,
  saveStoredOpeningBalances,
  getStoredPrimaryReceipts,
  saveStoredPrimaryReceipts,
} from '../../utils/communitySchemes';
import { numberToWordsIndian } from '../../utils/fmbPart2Data';
import { appendActivityLog } from '../../utils/rbac';
import { TrustOfficialReceiptModal } from '../common/TrustOfficialReceiptModal';
import { QuickDatePresetsBar } from '../common/DateFilterBar';
import { OfficialReceiptData } from '../faiz-hub/FaizOfficialPrintReceipt';
import { useSchemeFilter, useMemberSabeelLookup } from './useSchemeSearch';
import {
  SchemeStatCard,
  TableActionButtons,
  SchemeViewModal,
  DetailField,
  SchemeBulkPrintModal,
  CancelReceiptModal,
} from './SchemeSharedUI';

export type StandardSchemeSubPage =
  | 'opening-balance'
  | 'make-receipt'
  | 'ledger-datewise'
  | 'cancelled-receipts';

interface Props {
  schemeName: PrimarySchemeName;
  activeSubPage: StandardSchemeSubPage;
  onSubPageChange: (page: StandardSchemeSubPage) => void;
  currentUser: UserProfile;
  financialYear: FinancialYear;
  showToast: (msg: string) => void;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

interface ReceiptFormState {
  itsNumber: string;
  sabeelNo: string;
  memberName: string;
  mohallahName: string;
  address: string;
  date: string;
  amount: string;
  paymentMode: SchemeReceiptMode;
  chequeNo: string;
  chequeDate: string;
  bankName: string;
  transactionRef: string;
  notes: string;
}

const createEmptyReceiptForm = (): ReceiptFormState => ({
  itsNumber: '',
  sabeelNo: '',
  memberName: '',
  mohallahName: '',
  address: '',
  date: getTodayIso(),
  amount: '5000',
  paymentMode: 'Cash',
  chequeNo: '',
  chequeDate: getTodayIso(),
  bankName: '',
  transactionRef: '',
  notes: '',
});

export const StandardSchemeWorkspace: React.FC<Props> = ({
  schemeName,
  activeSubPage,
  onSubPageChange,
  currentUser,
  financialYear,
  showToast,
  canAdd,
  canEdit,
  canDelete,
}) => {
  const [openingBalances, setOpeningBalances] = useState<SchemeOpeningBalance[]>(() =>
    getStoredOpeningBalances()
  );
  const [receipts, setReceipts] = useState<SchemeLedgerReceipt[]>(() =>
    getStoredPrimaryReceipts()
  );

  const { directory, findByIts, findBySabeel } = useMemberSabeelLookup();

  // Scoped records for the selected scheme (Taher or Mohammedi)
  const schemeOpeningBalances = useMemo(
    () => openingBalances.filter((ob) => ob.schemeName === schemeName),
    [openingBalances, schemeName]
  );

  const activeReceipts = useMemo(
    () => receipts.filter((r) => r.schemeName === schemeName && !r.isCancelled),
    [receipts, schemeName]
  );

  const cancelledReceipts = useMemo(
    () => receipts.filter((r) => r.schemeName === schemeName && r.isCancelled),
    [receipts, schemeName]
  );

  // ── 1. OPENING BALANCE FORM STATE ──
  const [obDate, setObDate] = useState<string>(getTodayIso());
  const [obAmount, setObAmount] = useState<string>('25000');
  const [obType, setObType] = useState<OpeningBalanceType>('Cash');
  const [obAccountLabel, setObAccountLabel] = useState<string>('');
  const [obRemarks, setObRemarks] = useState<string>('');
  const [editingObId, setEditingObId] = useState<string | null>(null);
  const [obSearch, setObSearch] = useState<string>('');

  // ── 2. MAKE RECEIPT FORM STATE ──
  const [receiptForm, setReceiptForm] = useState<ReceiptFormState>(createEmptyReceiptForm);
  const [editingReceipt, setEditingReceipt] = useState<SchemeLedgerReceipt | null>(null);

  // ── MODALS (VIEW, SOLO PRINT, BULK PRINT, CANCEL) ──
  const [viewModalData, setViewModalData] = useState<{
    title: string;
    subtitle: string;
    fields: DetailField[];
    officialReceipt?: Partial<OfficialReceiptData>;
  } | null>(null);
  const [soloPrintData, setSoloPrintData] = useState<Partial<OfficialReceiptData> | null>(null);
  const [bulkPrintList, setBulkPrintList] = useState<Partial<OfficialReceiptData>[] | null>(null);
  const [cancelTarget, setCancelTarget] = useState<SchemeLedgerReceipt | null>(null);
  const [voidCandidateId, setVoidCandidateId] = useState<string>('');
  const [editingCancelReason, setEditingCancelReason] = useState<SchemeLedgerReceipt | null>(null);
  const [reasonDraft, setReasonDraft] = useState<string>('');

  // ── 3. LEDGER & DATEWISE FILTER HOOK ──
  const ledgerAccessors = useMemo(
    () => ({
      getId: (r: SchemeLedgerReceipt) => r.id,
      getDate: (r: SchemeLedgerReceipt) => r.date,
      getItsNo: (r: SchemeLedgerReceipt) => r.itsNumber,
      getSabeelNo: (r: SchemeLedgerReceipt) => r.sabeelNo,
      getMemberName: (r: SchemeLedgerReceipt) => r.memberName,
      getPaymentMode: (r: SchemeLedgerReceipt) => r.paymentMode,
      getSearchableText: (r: SchemeLedgerReceipt) => [
        r.receiptNo,
        r.transactionRef || '',
        r.chequeNo || '',
        r.notes || '',
      ],
    }),
    []
  );

  const ledgerFilter = useSchemeFilter<SchemeLedgerReceipt>(activeReceipts, ledgerAccessors);

  // ── 4. CANCELLED RECEIPTS FILTER HOOK ──
  const cancelledAccessors = useMemo(
    () => ({
      getId: (r: SchemeLedgerReceipt) => r.id,
      getDate: (r: SchemeLedgerReceipt) => r.cancelledAt || r.date,
      getItsNo: (r: SchemeLedgerReceipt) => r.itsNumber,
      getSabeelNo: (r: SchemeLedgerReceipt) => r.sabeelNo,
      getMemberName: (r: SchemeLedgerReceipt) => r.memberName,
      getSearchableText: (r: SchemeLedgerReceipt) => [
        r.receiptNo,
        r.cancellationReason || '',
        r.cancelledBy || '',
      ],
    }),
    []
  );

  const cancelledFilter = useSchemeFilter<SchemeLedgerReceipt>(
    cancelledReceipts,
    cancelledAccessors
  );

  // Opening Balance filtered list & totals
  const filteredOpeningBalances = useMemo(() => {
    const q = obSearch.trim().toLowerCase();
    if (!q) return schemeOpeningBalances;
    return schemeOpeningBalances.filter(
      (ob) =>
        ob.type.toLowerCase().includes(q) ||
        ob.accountLabel.toLowerCase().includes(q) ||
        ob.openingDate.includes(q) ||
        (ob.remarks || '').toLowerCase().includes(q)
    );
  }, [schemeOpeningBalances, obSearch]);

  const obTotals = useMemo(() => {
    const cash = schemeOpeningBalances
      .filter((ob) => ob.type === 'Cash')
      .reduce((s, ob) => s + ob.openingBalance, 0);
    const bank = schemeOpeningBalances
      .filter((ob) => ob.type === 'Bank')
      .reduce((s, ob) => s + ob.openingBalance, 0);
    return { total: cash + bank, cash, bank };
  }, [schemeOpeningBalances]);

  // Ledger summary breakdown
  const ledgerTotals = useMemo(() => {
    const rows = ledgerFilter.filteredItems;
    const cash = rows.filter((r) => r.paymentMode === 'Cash').reduce((s, r) => s + r.amount, 0);
    const cheque = rows.filter((r) => r.paymentMode === 'Cheque').reduce((s, r) => s + r.amount, 0);
    const online = rows.filter((r) => r.paymentMode === 'Online').reduce((s, r) => s + r.amount, 0);
    return { total: cash + cheque + online, cash, cheque, online };
  }, [ledgerFilter.filteredItems]);

  const prefixCode = schemeName === 'Taher Scheme' ? 'TS' : 'MS';
  const nextReceiptNo = `${prefixCode}-${new Date().getFullYear()}-${String(
    receipts.filter((r) => r.schemeName === schemeName).length + 101
  )}`;

  const liveAmountNum = parseFloat(receiptForm.amount) || 0;
  const liveAmountInWords = useMemo(() => numberToWordsIndian(liveAmountNum), [liveAmountNum]);

  // ── HANDLERS: OPENING BALANCE ──
  const resetOpeningForm = () => {
    setEditingObId(null);
    setObDate(getTodayIso());
    setObAmount('25000');
    setObType('Cash');
    setObAccountLabel('');
    setObRemarks('');
  };

  const handleOpeningBalanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numBal = parseFloat(obAmount);
    if (!obDate || isNaN(numBal) || numBal <= 0) {
      showToast('Enter a valid Opening Date and positive Opening Balance amount.');
      return;
    }

    if (editingObId) {
      if (!canEdit) {
        showToast('Edit permission required to update opening balance.');
        return;
      }
      const next = openingBalances.map((ob) =>
        ob.id === editingObId
          ? {
              ...ob,
              openingDate: obDate,
              openingBalance: numBal,
              type: obType,
              accountLabel:
                obAccountLabel.trim() ||
                (obType === 'Cash'
                  ? `Jamaat Cash Vault — ${schemeName}`
                  : `Trust Bank A/c — ${schemeName}`),
              remarks: obRemarks.trim(),
            }
          : ob
      );
      setOpeningBalances(next);
      saveStoredOpeningBalances(next);
      appendActivityLog(
        currentUser.username,
        'Community Schemes',
        `${schemeName} — Opening Balance`,
        'EDIT',
        `Updated ${obType} opening balance to ${fmtINR(numBal)} dated ${obDate}`
      );
      showToast(`Updated ${schemeName} opening balance entry.`);
      resetOpeningForm();
      return;
    }

    if (!canAdd) {
      showToast('Add permission required to record opening balance.');
      return;
    }

    const created: SchemeOpeningBalance = {
      id: `ob-${Date.now()}`,
      schemeName,
      openingDate: obDate,
      openingBalance: numBal,
      type: obType,
      accountLabel:
        obAccountLabel.trim() ||
        (obType === 'Cash'
          ? `Jamaat Cash Vault — ${schemeName}`
          : `Trust Bank A/c — ${schemeName}`),
      remarks: obRemarks.trim(),
      financialYear,
      createdBy: currentUser.username,
      createdAt: getTodayIso(),
    };

    const next = [created, ...openingBalances];
    setOpeningBalances(next);
    saveStoredOpeningBalances(next);
    appendActivityLog(
      currentUser.username,
      'Community Schemes',
      `${schemeName} — Opening Balance`,
      'ADD',
      `Added ${obType} opening balance of ${fmtINR(numBal)} dated ${obDate}`
    );
    showToast(`Saved ${obType} opening balance (${fmtINR(numBal)}) for ${schemeName}.`);
    resetOpeningForm();
  };

  // ── HANDLERS: MEMBER ITS / SABEEL LINKING ──
  const applyDirectoryMatch = (itsVal: string, sabeelVal: string) => {
    const byIts = itsVal ? findByIts(itsVal) : undefined;
    const bySabeel = !byIts && sabeelVal ? findBySabeel(sabeelVal) : undefined;
    const matched = byIts || bySabeel;
    if (matched) {
      setReceiptForm((prev) => ({
        ...prev,
        itsNumber: matched.itsNumber,
        sabeelNo: matched.sabeelNo,
        memberName: matched.fullName,
        mohallahName: matched.mohallahName,
        address: matched.address,
      }));
    }
  };

  const handleItsInput = (val: string) => {
    setReceiptForm((prev) => ({ ...prev, itsNumber: val }));
    const matched = findByIts(val);
    if (matched) {
      setReceiptForm((prev) => ({
        ...prev,
        itsNumber: matched.itsNumber,
        sabeelNo: matched.sabeelNo || prev.sabeelNo,
        memberName: matched.fullName,
        mohallahName: matched.mohallahName,
        address: matched.address,
      }));
    }
  };

  const handleSabeelInput = (val: string) => {
    setReceiptForm((prev) => ({ ...prev, sabeelNo: val }));
    const matched = findBySabeel(val);
    if (matched) {
      setReceiptForm((prev) => ({
        ...prev,
        itsNumber: matched.itsNumber,
        sabeelNo: matched.sabeelNo,
        memberName: matched.fullName,
        mohallahName: matched.mohallahName,
        address: matched.address,
      }));
    }
  };

  // ── HANDLERS: MAKE RECEIPT ──
  const handleReceiptSubmit = (e: React.FormEvent, openPrintAfter = true) => {
    e.preventDefault();
    if (!canAdd) {
      showToast('Add permission required to generate receipts.');
      return;
    }
    const amt = parseFloat(receiptForm.amount);
    if (!receiptForm.itsNumber.trim() || !receiptForm.memberName.trim() || isNaN(amt) || amt <= 0) {
      showToast('Please enter valid ITS No, Member Name, and positive Amount.');
      return;
    }
    if (receiptForm.paymentMode === 'Cheque' && !receiptForm.chequeNo.trim()) {
      showToast('Please enter Cheque Number for Cheque payments.');
      return;
    }

    const newRec: SchemeLedgerReceipt = {
      id: `prec-${Date.now()}`,
      receiptNo: nextReceiptNo,
      schemeName,
      itsNumber: receiptForm.itsNumber.trim(),
      sabeelNo: receiptForm.sabeelNo.trim() || '—',
      memberName: receiptForm.memberName.trim(),
      mohallahName: receiptForm.mohallahName.trim() || 'Burhani Park',
      address: receiptForm.address.trim() || 'Burhani Park, Vatwa, Ahmedabad',
      amount: amt,
      amountInWords: numberToWordsIndian(amt),
      paymentMode: receiptForm.paymentMode,
      chequeNo: receiptForm.paymentMode === 'Cheque' ? receiptForm.chequeNo.trim() : undefined,
      chequeDate: receiptForm.paymentMode === 'Cheque' ? receiptForm.chequeDate : undefined,
      bankName: receiptForm.paymentMode === 'Cheque' ? receiptForm.bankName.trim() : undefined,
      transactionRef:
        receiptForm.paymentMode === 'Cheque'
          ? `CHQ#${receiptForm.chequeNo.trim()}`
          : receiptForm.transactionRef.trim() || undefined,
      date: receiptForm.date || getTodayIso(),
      financialYear,
      collectedBy: currentUser.username,
      notes: receiptForm.notes.trim() || `${schemeName} contribution receipt`,
      isCancelled: false,
    };

    const next = [newRec, ...receipts];
    setReceipts(next);
    saveStoredPrimaryReceipts(next);

    appendActivityLog(
      currentUser.username,
      'Community Schemes',
      `${schemeName} — Make Receipt`,
      'PAYMENT',
      `Issued receipt ${newRec.receiptNo} of ${fmtINR(amt)} for ${newRec.memberName} (ITS ${newRec.itsNumber})`
    );
    showToast(`Receipt ${newRec.receiptNo} created for ${newRec.memberName}.`);

    if (openPrintAfter) {
      setSoloPrintData(
        toOfficialReceiptData({
          ...newRec,
          schemeTitle: schemeName,
        })
      );
    }
    setReceiptForm(createEmptyReceiptForm());
  };

  // ── HANDLERS: EDIT / VOID / RESTORE RECEIPT ──
  const handleSaveEditedReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReceipt) return;
    const updatedList = receipts.map((r) =>
      r.id === editingReceipt.id
        ? {
            ...editingReceipt,
            amountInWords: numberToWordsIndian(editingReceipt.amount),
          }
        : r
    );
    setReceipts(updatedList);
    saveStoredPrimaryReceipts(updatedList);
    appendActivityLog(
      currentUser.username,
      'Community Schemes',
      `${schemeName} — Edit Receipt`,
      'EDIT',
      `Updated receipt ${editingReceipt.receiptNo} (${fmtINR(editingReceipt.amount)})`
    );
    showToast(`Receipt ${editingReceipt.receiptNo} updated.`);
    setEditingReceipt(null);
  };

  const handleConfirmVoid = (reason: string) => {
    if (!cancelTarget) return;
    const next = receipts.map((r) =>
      r.id === cancelTarget.id
        ? {
            ...r,
            isCancelled: true,
            cancelledAt: getTodayIso(),
            cancelledBy: currentUser.username,
            cancellationReason: reason,
          }
        : r
    );
    setReceipts(next);
    saveStoredPrimaryReceipts(next);
    appendActivityLog(
      currentUser.username,
      'Community Schemes',
      `${schemeName} — Cancelled Receipts`,
      'CANCEL_RECEIPT',
      `Voided ${cancelTarget.receiptNo} (${fmtINR(cancelTarget.amount)}): ${reason}`
    );
    showToast(`Receipt ${cancelTarget.receiptNo} voided.`);
    setCancelTarget(null);
    setVoidCandidateId('');
  };

  const handleRestoreReceipt = (rec: SchemeLedgerReceipt) => {
    if (!canEdit) {
      showToast('Edit permission required to restore cancelled receipts.');
      return;
    }
    const next = receipts.map((r) =>
      r.id === rec.id
        ? {
            ...r,
            isCancelled: false,
            cancelledAt: undefined,
            cancelledBy: undefined,
            cancellationReason: undefined,
          }
        : r
    );
    setReceipts(next);
    saveStoredPrimaryReceipts(next);
    appendActivityLog(
      currentUser.username,
      'Community Schemes',
      `${schemeName} — Cancelled Receipts`,
      'EDIT',
      `Restored voided receipt ${rec.receiptNo} to active ledger`
    );
    showToast(`Receipt ${rec.receiptNo} restored to active ledger.`);
  };

  const openReceiptSoloPrint = (r: SchemeLedgerReceipt) => {
    setSoloPrintData(
      toOfficialReceiptData({
        ...r,
        schemeTitle: r.isCancelled ? `${schemeName} (CANCELLED)` : schemeName,
      })
    );
  };

  const openReceiptViewModal = (r: SchemeLedgerReceipt) => {
    setViewModalData({
      title: `${schemeName} Receipt Details`,
      subtitle: `${r.receiptNo} • ${formatDisplayDate(r.date)}`,
      officialReceipt: toOfficialReceiptData({ ...r, schemeTitle: schemeName }),
      fields: [
        { label: 'Receipt No', value: r.receiptNo, mono: true },
        { label: 'Receipt Date', value: formatDisplayDate(r.date) },
        { label: 'Member Name', value: r.memberName },
        { label: 'ITS Number', value: r.itsNumber, mono: true },
        { label: 'Sabeel Number', value: r.sabeelNo || '—', mono: true },
        { label: 'Mohallah', value: r.mohallahName },
        { label: 'Payment Mode', value: r.paymentMode },
        { label: 'Reference / Cheque', value: r.transactionRef || r.chequeNo || '—', mono: true },
        { label: 'Address', value: r.address },
        { label: 'Collected By', value: r.collectedBy, mono: true },
        {
          label: 'Amount & In Words',
          value: `${fmtINR(r.amount)} (${r.amountInWords})`,
          highlight: true,
        },
        ...(r.isCancelled
          ? [
              { label: 'Cancellation Status', value: `Voided by ${r.cancelledBy || 'Admin'} on ${r.cancelledAt || ''}` },
              { label: 'Cancellation Reason', value: r.cancellationReason || '—' },
            ]
          : []),
      ],
    });
  };

  const handleBulkPrintLedger = () => {
    const selected =
      ledgerFilter.selectedIds.length > 0
        ? ledgerFilter.filteredItems.filter((r) => ledgerFilter.selectedIds.includes(r.id))
        : ledgerFilter.filteredItems;
    if (selected.length === 0) {
      showToast('No receipts match the current selection for bulk printing.');
      return;
    }
    setBulkPrintList(
      selected.map((r) => toOfficialReceiptData({ ...r, schemeTitle: schemeName }))
    );
  };

  const subTabs: { id: StandardSchemeSubPage; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'opening-balance', label: 'Set Opening Balance', icon: <Wallet className="w-3.5 h-3.5" />, badge: String(schemeOpeningBalances.length) },
    { id: 'make-receipt', label: 'Make Receipt', icon: <Receipt className="w-3.5 h-3.5" />, badge: 'Trust' },
    { id: 'ledger-datewise', label: 'Ledger Report & Datewise Entry', icon: <FileSpreadsheet className="w-3.5 h-3.5" />, badge: String(activeReceipts.length) },
    { id: 'cancelled-receipts', label: 'Cancelled Receipts', icon: <Ban className="w-3.5 h-3.5" />, badge: cancelledReceipts.length ? String(cancelledReceipts.length) : undefined },
  ];

  return (
    <div className="space-y-5">
      {/* Sub-page Ribbon for Active Scheme */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-300 text-amber-900 flex items-center justify-center font-black text-xs">
            {prefixCode}
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900">{schemeName} Workspace</h2>
            <p className="text-[11px] text-slate-500">
              Opening balances, official Trust receipts, datewise ledger, and void register.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
          {subTabs.map((tab) => {
            const active = activeSubPage === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSubPageChange(tab.id)}
                className={`px-3 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                  active
                    ? 'bg-slate-900 text-amber-300 shadow-xs'
                    : 'bg-slate-50 hover:bg-amber-50 text-slate-700 border border-slate-200'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                      active ? 'bg-amber-400 text-slate-950' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* =====================================================================
          SUB-PAGE 1: SET OPENING BALANCE
         ===================================================================== */}
      {activeSubPage === 'opening-balance' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SchemeStatCard
              title={`${schemeName} Opening Total`}
              value={fmtINR(obTotals.total)}
              subtitle={`${schemeOpeningBalances.length} opening balance entries`}
              icon={<Wallet className="w-5 h-5" />}
              tone="amber"
            />
            <SchemeStatCard
              title="Cash Opening Balance"
              value={fmtINR(obTotals.cash)}
              subtitle="Office Cash Vault Carry-forward"
              icon={<Coins className="w-5 h-5" />}
              tone="emerald"
            />
            <SchemeStatCard
              title="Bank Opening Balance"
              value={fmtINR(obTotals.bank)}
              subtitle="Trust Bank Accounts Carry-forward"
              icon={<Landmark className="w-5 h-5" />}
              tone="blue"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Form Card */}
            <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    {editingObId ? 'Edit Opening Balance' : 'Set Opening Balance'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Record cash or bank opening balance for {schemeName}
                  </p>
                </div>
                {editingObId && (
                  <button
                    type="button"
                    onClick={resetOpeningForm}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

              <form onSubmit={handleOpeningBalanceSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Opening Date *</label>
                  <input
                    type="date"
                    required
                    value={obDate}
                    onChange={(e) => setObDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 font-medium text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Opening Balance (₹) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    step="any"
                    value={obAmount}
                    onChange={(e) => setObAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 font-mono font-black text-emerald-900 text-sm"
                  />
                  <p className="text-[11px] text-slate-500 mt-1 italic">
                    {numberToWordsIndian(parseFloat(obAmount) || 0)}
                  </p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Type (Cash / Bank) *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['Cash', 'Bank'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setObType(t)}
                        className={`py-2 px-3 rounded-xl font-bold text-xs border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          obType === t
                            ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-2xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {t === 'Cash' ? <Coins className="w-3.5 h-3.5" /> : <Landmark className="w-3.5 h-3.5" />}
                        <span>{t}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Account / Vault Reference</label>
                  <input
                    type="text"
                    value={obAccountLabel}
                    onChange={(e) => setObAccountLabel(e.target.value)}
                    placeholder={obType === 'Cash' ? 'e.g. Office Cash Vault' : 'e.g. SBI Burhani Park A/c'}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Remarks</label>
                  <textarea
                    rows={2}
                    value={obRemarks}
                    onChange={(e) => setObRemarks(e.target.value)}
                    placeholder="Audit notes or fiscal carry-forward description..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-amber-300 font-black text-xs rounded-xl shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{editingObId ? 'Update Opening Balance' : 'Save Opening Balance'}</span>
                </button>
              </form>
            </div>

            {/* Previous Entries Table */}
            <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Previous Opening Balance Entries ({schemeName})
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Historical opening balances categorized by Cash and Bank vaults.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      exportRowsToCsv(
                        `${prefixCode}_Opening_Balances.csv`,
                        ['Date', 'Scheme', 'Type', 'Account', 'Amount', 'Remarks', 'Created By'],
                        filteredOpeningBalances.map((ob) => [
                          ob.openingDate,
                          ob.schemeName,
                          ob.type,
                          ob.accountLabel,
                          ob.openingBalance,
                          ob.remarks || '',
                          ob.createdBy,
                        ])
                      )
                    }
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print</span>
                  </button>
                </div>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={obSearch}
                  onChange={(e) => setObSearch(e.target.value)}
                  placeholder="Filter by Type (Cash/Bank), account name, or date..."
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-3.5 py-3">Opening Date</th>
                      <th className="px-3.5 py-3">Type</th>
                      <th className="px-3.5 py-3">Account / Vault</th>
                      <th className="px-3.5 py-3 text-right">Opening Balance</th>
                      <th className="px-3.5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredOpeningBalances.map((ob) => {
                      const obOfficial = toOfficialReceiptData({
                        receiptNo: ob.id.replace(/[^0-9]/g, '') || '1',
                        date: ob.openingDate,
                        memberName: ob.accountLabel,
                        itsNumber: 'OPENING-BAL',
                        address: ob.remarks || `${schemeName} Opening Balance (${ob.type})`,
                        amount: ob.openingBalance,
                        paymentMode: ob.type,
                        schemeTitle: `${schemeName} — Opening Balance`,
                        purposeTitle: `${ob.type} Opening Balance`,
                      });
                      return (
                        <tr key={ob.id} className="hover:bg-amber-50/30">
                          <td className="px-3.5 py-3 font-mono font-semibold text-slate-800 whitespace-nowrap">
                            {formatDisplayDate(ob.openingDate)}
                          </td>
                          <td className="px-3.5 py-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                ob.type === 'Bank'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {ob.type}
                            </span>
                          </td>
                          <td className="px-3.5 py-3">
                            <p className="font-bold text-slate-900">{ob.accountLabel}</p>
                            {ob.remarks && <p className="text-[11px] text-slate-500">{ob.remarks}</p>}
                          </td>
                          <td className="px-3.5 py-3 text-right font-mono font-black text-slate-900 whitespace-nowrap">
                            {fmtINR(ob.openingBalance)}
                          </td>
                          <td className="px-3.5 py-3 text-right">
                            <TableActionButtons
                              compact
                              canEdit={canEdit}
                              canDelete={canDelete}
                              cancelLabel="Delete"
                              onView={() =>
                                setViewModalData({
                                  title: `${schemeName} Opening Balance`,
                                  subtitle: `${ob.type} Entry • ${formatDisplayDate(ob.openingDate)}`,
                                  officialReceipt: obOfficial,
                                  fields: [
                                    { label: 'Scheme', value: ob.schemeName },
                                    { label: 'Opening Date', value: formatDisplayDate(ob.openingDate) },
                                    { label: 'Type', value: ob.type },
                                    { label: 'Account / Reference', value: ob.accountLabel },
                                    { label: 'Financial Year', value: ob.financialYear },
                                    { label: 'Recorded By', value: ob.createdBy, mono: true },
                                    { label: 'Remarks', value: ob.remarks || '—' },
                                    {
                                      label: 'Opening Balance',
                                      value: `${fmtINR(ob.openingBalance)} (${numberToWordsIndian(ob.openingBalance)})`,
                                      highlight: true,
                                    },
                                  ],
                                })
                              }
                              onEdit={() => {
                                setEditingObId(ob.id);
                                setObDate(ob.openingDate);
                                setObAmount(String(ob.openingBalance));
                                setObType(ob.type);
                                setObAccountLabel(ob.accountLabel);
                                setObRemarks(ob.remarks || '');
                              }}
                              onPrint={() => window.print()}
                              onSoloPrint={() => setSoloPrintData(obOfficial)}
                              onCancel={() => {
                                if (!window.confirm(`Delete opening balance entry "${ob.accountLabel}"?`)) return;
                                const next = openingBalances.filter((x) => x.id !== ob.id);
                                setOpeningBalances(next);
                                saveStoredOpeningBalances(next);
                                showToast('Opening balance entry removed.');
                              }}
                            />
                          </td>
                        </tr>
                      );
                    })}
                    {filteredOpeningBalances.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                          No opening balance entries found for {schemeName}.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SUB-PAGE 2: MAKE RECEIPT
         ===================================================================== */}
      {activeSubPage === 'make-receipt' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Transaction Entry Form */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-amber-600" />
                  <span>Make Receipt — {schemeName}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Linked with Member ITS &amp; Sabeel records • Official Trust Receipt Studio integration
                </p>
              </div>
              <span className="px-3 py-1 rounded-lg bg-amber-50 border border-amber-300 text-amber-950 font-mono text-xs font-black">
                Next #{nextReceiptNo}
              </span>
            </div>

            {/* Quick Member Directory Selector */}
            <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-3.5 space-y-2">
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-amber-950">
                Quick Link Member from ITS / Sabeel Master
              </label>
              <select
                value=""
                onChange={(e) => applyDirectoryMatch(e.target.value, '')}
                className="w-full text-xs px-3 py-2 border border-amber-300 rounded-xl bg-white font-semibold text-slate-900 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <option value="">-- Select Mumin (Name • ITS No • Sabeel No) --</option>
                {directory.map((m) => (
                  <option key={m.itsNumber} value={m.itsNumber}>
                    {m.fullName} — ITS: {m.itsNumber} {m.sabeelNo ? `• Sabeel: ${m.sabeelNo}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <form onSubmit={(e) => handleReceiptSubmit(e, true)} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ITS No *</label>
                  <input
                    type="text"
                    required
                    value={receiptForm.itsNumber}
                    onChange={(e) => handleItsInput(e.target.value)}
                    placeholder="e.g. 30489122"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sabeel No</label>
                  <input
                    type="text"
                    value={receiptForm.sabeelNo}
                    onChange={(e) => handleSabeelInput(e.target.value)}
                    placeholder="e.g. SB-042"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold text-blue-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Member Full Name *</label>
                  <input
                    type="text"
                    required
                    value={receiptForm.memberName}
                    onChange={(e) =>
                      setReceiptForm((prev) => ({ ...prev, memberName: e.target.value }))
                    }
                    placeholder="Auto-filled on ITS / Sabeel lookup"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mohallah</label>
                  <input
                    type="text"
                    value={receiptForm.mohallahName}
                    onChange={(e) =>
                      setReceiptForm((prev) => ({ ...prev, mohallahName: e.target.value }))
                    }
                    placeholder="e.g. Burhani Mohallah"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Residential Address</label>
                <input
                  type="text"
                  value={receiptForm.address}
                  onChange={(e) =>
                    setReceiptForm((prev) => ({ ...prev, address: e.target.value }))
                  }
                  placeholder="Address printed on Official Trust Receipt"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    step="any"
                    value={receiptForm.amount}
                    onChange={(e) =>
                      setReceiptForm((prev) => ({ ...prev, amount: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-black text-emerald-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Receipt Date *</label>
                  <input
                    type="date"
                    required
                    value={receiptForm.date}
                    onChange={(e) =>
                      setReceiptForm((prev) => ({ ...prev, date: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Mode *</label>
                  <select
                    value={receiptForm.paymentMode}
                    onChange={(e) =>
                      setReceiptForm((prev) => ({
                        ...prev,
                        paymentMode: e.target.value as SchemeReceiptMode,
                      }))
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-bold cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Online">Online (UPI / NEFT / RTGS)</option>
                  </select>
                </div>
              </div>

              {/* Automatic Number-to-Words Readout */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase text-emerald-800">
                  Amount in Words:
                </span>
                <span className="text-xs font-black text-emerald-950 text-right">
                  {liveAmountInWords}
                </span>
              </div>

              {/* Mode-Specific Details */}
              {receiptForm.paymentMode === 'Cheque' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-blue-50/70 border border-blue-200 rounded-xl p-3">
                  <div>
                    <label className="block font-bold text-blue-900 mb-1">Cheque No *</label>
                    <input
                      type="text"
                      required
                      value={receiptForm.chequeNo}
                      onChange={(e) =>
                        setReceiptForm((prev) => ({ ...prev, chequeNo: e.target.value }))
                      }
                      placeholder="e.g. 490218"
                      className="w-full px-3 py-1.5 border border-blue-200 rounded-lg bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-blue-900 mb-1">Cheque Date</label>
                    <input
                      type="date"
                      value={receiptForm.chequeDate}
                      onChange={(e) =>
                        setReceiptForm((prev) => ({ ...prev, chequeDate: e.target.value }))
                      }
                      className="w-full px-3 py-1.5 border border-blue-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-blue-900 mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={receiptForm.bankName}
                      onChange={(e) =>
                        setReceiptForm((prev) => ({ ...prev, bankName: e.target.value }))
                      }
                      placeholder="e.g. HDFC Bank"
                      className="w-full px-3 py-1.5 border border-blue-200 rounded-lg bg-white"
                    />
                  </div>
                </div>
              )}

              {receiptForm.paymentMode === 'Online' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    UTR / UPI / Bank Transaction Reference
                  </label>
                  <input
                    type="text"
                    value={receiptForm.transactionRef}
                    onChange={(e) =>
                      setReceiptForm((prev) => ({ ...prev, transactionRef: e.target.value }))
                    }
                    placeholder="e.g. UPI/662910482 or NEFT-REF-9921"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Notes / Narration</label>
                <input
                  type="text"
                  value={receiptForm.notes}
                  onChange={(e) =>
                    setReceiptForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  placeholder={`Optional remarks for ${schemeName} voucher`}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReceiptForm(createEmptyReceiptForm())}
                  className="px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Clear Form
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-sm inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save &amp; Open Official Trust Receipt</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Official Trust Voucher Preview + Recent Receipts */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-white rounded-2xl border-2 border-amber-300 shadow-xs p-5 space-y-3">
              <div className="border-b border-amber-200 pb-2 text-center">
                <p className="text-[11px] font-black uppercase tracking-wide text-slate-900">
                  DAWOODI BOHRA JAMAAT TRUST, BURHANIPARK VATWA
                </p>
                <p className="text-[10px] font-bold text-slate-600">
                  Regn No - B/81 • Managed By Anjuman e Mufaddal
                </p>
                <p className="text-xs font-black text-amber-900 mt-1">A/c : {schemeName}</p>
              </div>

              <div className="text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Receipt No / Date:</span>
                  <span className="font-mono font-bold text-slate-900">
                    #{nextReceiptNo} • {formatDisplayDate(receiptForm.date)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Member:</span>
                  <span className="font-bold text-slate-900 text-right">
                    {(receiptForm.memberName || 'SELECT MEMBER').toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">ITS / Sabeel:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {receiptForm.itsNumber || '—'} / {receiptForm.sabeelNo || '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Mode:</span>
                  <span className="font-bold text-slate-800">{receiptForm.paymentMode}</span>
                </div>
                <div className="pt-2 border-t border-amber-200 flex justify-between items-baseline">
                  <span className="font-bold text-slate-700">Amount:</span>
                  <span className="font-mono font-black text-base text-emerald-800">
                    {fmtINR(liveAmountNum)}
                  </span>
                </div>
                <p className="text-[11px] text-center font-semibold text-slate-700 bg-amber-50 rounded-lg py-1.5 px-2">
                  {liveAmountInWords}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Recent {schemeName} Receipts
                </h4>
                <button
                  type="button"
                  onClick={() => onSubPageChange('ledger-datewise')}
                  className="text-[11px] font-bold text-blue-700 hover:underline cursor-pointer"
                >
                  Full Ledger →
                </button>
              </div>
              <div className="space-y-2.5">
                {activeReceipts.slice(0, 4).map((r) => (
                  <div
                    key={r.id}
                    className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/70 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-bold text-slate-900">{r.memberName}</p>
                        <p className="text-[10px] font-mono text-slate-500">
                          {r.receiptNo} • ITS {r.itsNumber} • Sabeel {r.sabeelNo}
                        </p>
                      </div>
                      <span className="font-mono font-black text-xs text-emerald-800">
                        {fmtINR(r.amount)}
                      </span>
                    </div>
                    <div className="flex justify-end">
                      <TableActionButtons
                        compact
                        canEdit={canEdit}
                        canDelete={false}
                        onView={() => openReceiptViewModal(r)}
                        onEdit={() => setEditingReceipt(r)}
                        onPrint={() => openReceiptSoloPrint(r)}
                        onSoloPrint={() => openReceiptSoloPrint(r)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SUB-PAGE 3: LEDGER REPORT & DATEWISE ENTRY
         ===================================================================== */}
      {activeSubPage === 'ledger-datewise' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {schemeName} — Ledger Report &amp; Datewise Entry
                </h3>
                <p className="text-xs text-slate-500">
                  Filterable transaction ledger with CSV export, table print, and batch Trust receipt printing.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    exportRowsToCsv(
                      `${prefixCode}_Ledger_Report.csv`,
                      ['Receipt No', 'Date', 'ITS No', 'Sabeel No', 'Member Name', 'Mode', 'Ref', 'Amount', 'Amount In Words'],
                      ledgerFilter.filteredItems.map((r) => [
                        r.receiptNo,
                        r.date,
                        r.itsNumber,
                        r.sabeelNo,
                        r.memberName,
                        r.paymentMode,
                        r.transactionRef || r.chequeNo || '',
                        r.amount,
                        r.amountInWords,
                      ])
                    )
                  }
                  className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button
                  type="button"
                  onClick={handleBulkPrintLedger}
                  className="px-3.5 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 rounded-xl text-xs font-black inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>
                    Bulk Print (
                    {ledgerFilter.selectedIds.length > 0
                      ? ledgerFilter.selectedIds.length
                      : ledgerFilter.filteredItems.length}
                    )
                  </span>
                </button>
                <button
                  type="button"
                  onClick={ledgerFilter.resetFilters}
                  className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-50 cursor-pointer"
                  title="Reset Filters"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Period Presets */}
            <QuickDatePresetsBar
              fromDate={ledgerFilter.filters.fromDate}
              toDate={ledgerFilter.filters.toDate}
              onSelectRange={ledgerFilter.setDateRange}
            />

            {/* Required Search Inputs: From Date, To Date, ITS No, Sabeel No + Mode */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  value={ledgerFilter.filters.fromDate}
                  onChange={(e) => ledgerFilter.setFilter('fromDate', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  To Date
                </label>
                <input
                  type="date"
                  value={ledgerFilter.filters.toDate}
                  onChange={(e) => ledgerFilter.setFilter('toDate', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  ITS No
                </label>
                <input
                  type="text"
                  value={ledgerFilter.filters.itsNo}
                  onChange={(e) => ledgerFilter.setFilter('itsNo', e.target.value)}
                  placeholder="Search ITS No..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Sabeel No
                </label>
                <input
                  type="text"
                  value={ledgerFilter.filters.sabeelNo}
                  onChange={(e) => ledgerFilter.setFilter('sabeelNo', e.target.value)}
                  placeholder="Search Sabeel No..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Payment Mode
                </label>
                <select
                  value={ledgerFilter.filters.paymentMode}
                  onChange={(e) => ledgerFilter.setFilter('paymentMode', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="ALL">All Modes</option>
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Online">Online</option>
                </select>
              </div>
            </div>

            {/* Summary Strip */}
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="font-bold text-amber-950">
                Showing {ledgerFilter.filteredItems.length} datewise entry record(s)
              </span>
              <div className="flex flex-wrap items-center gap-4 font-mono">
                <span className="text-slate-600">Cash: <strong className="text-slate-900">{fmtINR(ledgerTotals.cash)}</strong></span>
                <span className="text-slate-600">Cheque: <strong className="text-slate-900">{fmtINR(ledgerTotals.cheque)}</strong></span>
                <span className="text-slate-600">Online: <strong className="text-slate-900">{fmtINR(ledgerTotals.online)}</strong></span>
                <span className="text-emerald-900 font-black text-sm">
                  Total: {fmtINR(ledgerTotals.total)}
                </span>
              </div>
            </div>

            {/* Ledger Data Grid */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-3 text-center w-9">
                      <input
                        type="checkbox"
                        checked={ledgerFilter.isAllSelected}
                        onChange={ledgerFilter.toggleSelectAll}
                        aria-label="Select all receipts for bulk print"
                        className="w-3.5 h-3.5 rounded border-slate-300 text-amber-600 cursor-pointer"
                      />
                    </th>
                    <th className="px-3 py-3">Receipt No</th>
                    <th className="px-3 py-3">Date</th>
                    <th className="px-3 py-3">ITS No</th>
                    <th className="px-3 py-3">Sabeel No</th>
                    <th className="px-3 py-3">Member Name</th>
                    <th className="px-3 py-3">Mode / Ref</th>
                    <th className="px-3 py-3 text-right">Amount</th>
                    <th className="px-3 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ledgerFilter.filteredItems.map((r) => (
                    <tr key={r.id} className="hover:bg-amber-50/30">
                      <td className="px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={ledgerFilter.selectedIds.includes(r.id)}
                          onChange={() => ledgerFilter.toggleSelect(r.id)}
                          aria-label={`Select ${r.receiptNo}`}
                          className="w-3.5 h-3.5 rounded border-slate-300 text-amber-600 cursor-pointer"
                        />
                      </td>
                      <td className="px-3 py-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {r.receiptNo}
                      </td>
                      <td className="px-3 py-3 font-mono text-slate-600 whitespace-nowrap">
                        {formatDisplayDate(r.date)}
                      </td>
                      <td className="px-3 py-3 font-mono font-bold text-amber-900">{r.itsNumber}</td>
                      <td className="px-3 py-3 font-mono font-semibold text-blue-800">{r.sabeelNo}</td>
                      <td className="px-3 py-3">
                        <p className="font-bold text-slate-900">{r.memberName}</p>
                        <p className="text-[10px] text-slate-500 truncate max-w-[200px]">
                          {r.amountInWords}
                        </p>
                      </td>
                      <td className="px-3 py-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[10px] font-bold">
                          {r.paymentMode}
                        </span>
                        {(r.transactionRef || r.chequeNo) && (
                          <p className="text-[10px] font-mono text-slate-500 mt-0.5">
                            {r.transactionRef || r.chequeNo}
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right font-mono font-black text-emerald-800 whitespace-nowrap">
                        {fmtINR(r.amount)}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <TableActionButtons
                          compact
                          canEdit={canEdit}
                          canDelete={canDelete}
                          onView={() => openReceiptViewModal(r)}
                          onEdit={() => setEditingReceipt(r)}
                          onPrint={() => openReceiptSoloPrint(r)}
                          onSoloPrint={() => openReceiptSoloPrint(r)}
                          onCancel={() => setCancelTarget(r)}
                        />
                      </td>
                    </tr>
                  ))}
                  {ledgerFilter.filteredItems.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-4 py-10 text-center text-slate-400">
                        No {schemeName} ledger entries match the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SUB-PAGE 4: CANCELLED RECEIPTS
         ===================================================================== */}
      {activeSubPage === 'cancelled-receipts' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Ban className="w-4 h-4 text-rose-600" />
                <span>{schemeName} — Cancelled Receipts Register</span>
              </h3>
              <p className="text-xs text-slate-500">
                Track, audit, and manage voided or cancelled {schemeName} receipt vouchers.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {canDelete && activeReceipts.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <select
                    value={voidCandidateId}
                    onChange={(e) => setVoidCandidateId(e.target.value)}
                    className="text-xs px-2.5 py-1.5 border border-rose-200 rounded-xl bg-rose-50/40 text-slate-800 font-semibold cursor-pointer"
                  >
                    <option value="">-- Select Active Receipt to Void --</option>
                    {activeReceipts.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.receiptNo} • {r.memberName} ({fmtINR(r.amount)})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={!voidCandidateId}
                    onClick={() => {
                      const found = activeReceipts.find((r) => r.id === voidCandidateId);
                      if (found) setCancelTarget(found);
                    }}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Void Selected
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() =>
                  exportRowsToCsv(
                    `${prefixCode}_Cancelled_Receipts.csv`,
                    ['Receipt No', 'Original Date', 'Cancelled Date', 'ITS No', 'Sabeel No', 'Member Name', 'Amount', 'Cancelled By', 'Reason'],
                    cancelledFilter.filteredItems.map((r) => [
                      r.receiptNo,
                      r.date,
                      r.cancelledAt || '',
                      r.itsNumber,
                      r.sabeelNo,
                      r.memberName,
                      r.amount,
                      r.cancelledBy || '',
                      r.cancellationReason || '',
                    ])
                  )
                }
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export</span>
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>
            </div>
          </div>

          <QuickDatePresetsBar
            fromDate={cancelledFilter.filters.fromDate}
            toDate={cancelledFilter.filters.toDate}
            onSelectRange={cancelledFilter.setDateRange}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <input
              type="date"
              value={cancelledFilter.filters.fromDate}
              onChange={(e) => cancelledFilter.setFilter('fromDate', e.target.value)}
              aria-label="From Date"
              className="px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
            <input
              type="date"
              value={cancelledFilter.filters.toDate}
              onChange={(e) => cancelledFilter.setFilter('toDate', e.target.value)}
              aria-label="To Date"
              className="px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
            <input
              type="text"
              value={cancelledFilter.filters.itsNo}
              onChange={(e) => cancelledFilter.setFilter('itsNo', e.target.value)}
              placeholder="Filter by ITS No..."
              className="px-3 py-2 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
            <input
              type="text"
              value={cancelledFilter.filters.sabeelNo}
              onChange={(e) => cancelledFilter.setFilter('sabeelNo', e.target.value)}
              placeholder="Filter by Sabeel No..."
              className="px-3 py-2 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
          </div>

          <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs">
            <span className="font-bold text-rose-900">
              {cancelledFilter.filteredItems.length} cancelled receipt(s)
            </span>
            <span className="font-mono font-black text-rose-800">
              Total Voided:{' '}
              {fmtINR(cancelledFilter.filteredItems.reduce((s, r) => s + r.amount, 0))}
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="px-3.5 py-3">Receipt No</th>
                  <th className="px-3.5 py-3">Original / Void Date</th>
                  <th className="px-3.5 py-3">ITS / Sabeel</th>
                  <th className="px-3.5 py-3">Member Name</th>
                  <th className="px-3.5 py-3 text-right">Amount Voided</th>
                  <th className="px-3.5 py-3">Cancellation Reason</th>
                  <th className="px-3.5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cancelledFilter.filteredItems.map((r) => (
                  <tr key={r.id} className="bg-rose-50/20 hover:bg-rose-50/40">
                    <td className="px-3.5 py-3 font-mono font-bold text-rose-800 line-through whitespace-nowrap">
                      {r.receiptNo}
                    </td>
                    <td className="px-3.5 py-3 font-mono text-slate-600 whitespace-nowrap">
                      <div>{formatDisplayDate(r.date)}</div>
                      {r.cancelledAt && (
                        <div className="text-[10px] text-rose-700">Void: {formatDisplayDate(r.cancelledAt)}</div>
                      )}
                    </td>
                    <td className="px-3.5 py-3 font-mono">
                      <div className="font-bold text-slate-800">{r.itsNumber}</div>
                      <div className="text-[10px] text-blue-800">{r.sabeelNo}</div>
                    </td>
                    <td className="px-3.5 py-3 font-bold text-slate-900">{r.memberName}</td>
                    <td className="px-3.5 py-3 text-right font-mono font-black text-rose-700 line-through whitespace-nowrap">
                      {fmtINR(r.amount)}
                    </td>
                    <td className="px-3.5 py-3">
                      <p className="text-rose-800 italic">{r.cancellationReason || '—'}</p>
                      <p className="text-[10px] font-mono text-slate-500">By: {r.cancelledBy || 'Admin'}</p>
                    </td>
                    <td className="px-3.5 py-3 text-right">
                      <div className="inline-flex items-center gap-1 flex-wrap justify-end">
                        <TableActionButtons
                          compact
                          canEdit={canEdit}
                          canDelete={false}
                          onView={() => openReceiptViewModal(r)}
                          onEdit={() => {
                            setEditingCancelReason(r);
                            setReasonDraft(r.cancellationReason || '');
                          }}
                          onPrint={() => openReceiptSoloPrint(r)}
                          onSoloPrint={() => openReceiptSoloPrint(r)}
                        />
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => handleRestoreReceipt(r)}
                            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer"
                            title="Restore Receipt to Active Ledger"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Restore</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {cancelledFilter.filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                      No cancelled receipts recorded for {schemeName}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MODAL: EDIT ACTIVE RECEIPT ── */}
      {editingReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900">
                Edit Receipt {editingReceipt.receiptNo}
              </h3>
              <button
                type="button"
                onClick={() => setEditingReceipt(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveEditedReceipt} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Receipt Date</label>
                  <input
                    type="date"
                    required
                    value={editingReceipt.date}
                    onChange={(e) =>
                      setEditingReceipt({ ...editingReceipt, date: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={editingReceipt.amount}
                    onChange={(e) =>
                      setEditingReceipt({
                        ...editingReceipt,
                        amount: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Mode</label>
                  <select
                    value={editingReceipt.paymentMode}
                    onChange={(e) =>
                      setEditingReceipt({
                        ...editingReceipt,
                        paymentMode: e.target.value as SchemeReceiptMode,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Online">Online</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ref / Cheque No</label>
                  <input
                    type="text"
                    value={editingReceipt.transactionRef || ''}
                    onChange={(e) =>
                      setEditingReceipt({ ...editingReceipt, transactionRef: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Notes</label>
                <input
                  type="text"
                  value={editingReceipt.notes || ''}
                  onChange={(e) =>
                    setEditingReceipt({ ...editingReceipt, notes: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingReceipt(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-amber-300 rounded-xl font-black cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: EDIT CANCELLATION REASON ── */}
      {editingCancelReason && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-sm font-black text-slate-900">
              Edit Cancellation Reason — {editingCancelReason.receiptNo}
            </h3>
            <textarea
              rows={3}
              value={reasonDraft}
              onChange={(e) => setReasonDraft(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingCancelReason(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const next = receipts.map((r) =>
                    r.id === editingCancelReason.id
                      ? { ...r, cancellationReason: reasonDraft.trim() }
                      : r
                  );
                  setReceipts(next);
                  saveStoredPrimaryReceipts(next);
                  showToast('Cancellation reason updated.');
                  setEditingCancelReason(null);
                }}
                className="px-4 py-2 bg-slate-900 text-amber-300 rounded-xl text-xs font-black cursor-pointer"
              >
                Update Reason
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SHARED MODALS: VIEW, SOLO PRINT, BULK PRINT, CANCEL ── */}
      <SchemeViewModal
        isOpen={!!viewModalData}
        onClose={() => setViewModalData(null)}
        title={viewModalData?.title || ''}
        subtitle={viewModalData?.subtitle}
        fields={viewModalData?.fields || []}
        onSoloPrint={
          viewModalData?.officialReceipt
            ? () => {
                setSoloPrintData(viewModalData.officialReceipt!);
                setViewModalData(null);
              }
            : undefined
        }
      />

      <TrustOfficialReceiptModal
        isOpen={!!soloPrintData}
        onClose={() => setSoloPrintData(null)}
        receiptData={soloPrintData || undefined}
        currentUser={currentUser}
        title={`Official Dawoodi Bohra Jamaat Trust — ${schemeName}`}
      />

      <SchemeBulkPrintModal
        isOpen={!!bulkPrintList}
        onClose={() => setBulkPrintList(null)}
        title={`${schemeName} Bulk Official Trust Receipts`}
        receipts={bulkPrintList || []}
      />

      <CancelReceiptModal
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        receiptLabel={cancelTarget?.receiptNo || ''}
        memberName={cancelTarget?.memberName || ''}
        amountFormatted={fmtINR(cancelTarget?.amount || 0)}
        onConfirm={handleConfirmVoid}
      />
    </div>
  );
};

