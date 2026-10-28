import React, { useState, useEffect } from 'react';
import {
  Coins, LayoutDashboard, Plus, Search, Filter, Download,
  Receipt, CreditCard, ArrowUpRight, CheckCircle2, X, AlertCircle,
  FileSpreadsheet, Ban, Wallet, TrendingUp, Calendar, RefreshCw,
  Printer, User, Tag, Sliders, Layers, Landmark, TrendingDown,
  RotateCcw
} from 'lucide-react';
import { UserProfile, FinancialYear } from '../../types';
import {
  FaizHubCategory, FaizHubMasterRecord, FaizHubReceipt, FaizPaymentMode,
  getStoredFaizCategories, saveStoredFaizCategories,
  getStoredFaizHubs, saveStoredFaizHubs,
  getStoredFaizReceipts, saveStoredFaizReceipts
} from '../../utils/faizModule';
import { getStoredHofs } from '../../utils/memberMaster';
import { appendActivityLog } from '../../utils/rbac';

// Part 1 Subpages
import { FaizDashboardStatisticsSubpage } from './FaizDashboardStatisticsSubpage';
import { SetDefaultTakhmeenYearSubpage } from './SetDefaultTakhmeenYearSubpage';
import { NiyazOpeningBalanceSubpage } from './NiyazOpeningBalanceSubpage';
import { ShowDueOnReceiptSubpage } from './ShowDueOnReceiptSubpage';
import { PrintTakhmeenFormSubpage } from './PrintTakhmeenFormSubpage';
import { NiyazExpenseEntrySubpage } from './NiyazExpenseEntrySubpage';
import { NiyazIncomeEntrySubpage } from './NiyazIncomeEntrySubpage';
import { FaizAdditionalMastersSubpage } from './FaizAdditionalMastersSubpage';

// Part 2 Subpages
import { FaizReceiptManagementSubpage } from './FaizReceiptManagementSubpage';
import { FaizReportsSuiteSubpage } from './FaizReportsSuiteSubpage';
import { FaizAuditChequeCancellationSubpage } from './FaizAuditChequeCancellationSubpage';
import { FaizOfficialPrintReceipt } from './FaizOfficialPrintReceipt';

export type FaizSubTab =
  | 'faiz-hub-dashboard'
  | 'faiz-default-year'
  | 'faiz-opening-balance'
  | 'faiz-receipt-due-config'
  | 'faiz-print-takhmeen'
  | 'faiz-expense-entry'
  | 'faiz-income-entry'
  | 'faiz-additional-masters'
  | 'faiz-receipt-management'
  | 'faiz-official-receipt'
  | 'faiz-reports-suite'
  | 'faiz-audit-cheques'
  | 'faiz-category-master'
  | 'faiz-hub-master'
  | 'faiz-payment-entry'
  | 'faiz-outstanding-report'
  | 'faiz-receipt-report'
  | 'faiz-ledger-report'
  | 'faiz-cancelled-receipts';

interface Props {
  currentUser: UserProfile;
  activeSubItemId: string;
  subItemLabel: string;
  financialYear: FinancialYear;
  showToast: (m: string) => void;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

const fmtINR = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export const FaizHubModule: React.FC<Props> = ({
  currentUser,
  activeSubItemId,
  financialYear,
  showToast,
  canAdd,
  canEdit,
  canDelete,
}) => {
  const [categories, setCategories] = useState<FaizHubCategory[]>(() => getStoredFaizCategories());
  const [hubs, setHubs] = useState<FaizHubMasterRecord[]>(() => getStoredFaizHubs());
  const [receipts, setReceipts] = useState<FaizHubReceipt[]>(() => getStoredFaizReceipts());
  const [hofs] = useState(() => getStoredHofs());

  const [activeTab, setActiveTab] = useState<FaizSubTab>(() => {
    return (activeSubItemId as FaizSubTab) || 'faiz-hub-dashboard';
  });

  useEffect(() => {
    if (activeSubItemId) setActiveTab(activeSubItemId as FaizSubTab);
  }, [activeSubItemId]);

  // Tab Groups for clean organization
  const tabGroups = [
    {
      groupTitle: 'Part 1: Dashboard & Masters',
      tabs: [
        { key: 'faiz-hub-dashboard' as FaizSubTab,       label: 'Dashboard & Stats',      icon: <LayoutDashboard className="w-3.5 h-3.5" />, badge: 'Live' },
        { key: 'faiz-default-year' as FaizSubTab,        label: 'Default Takhmeen Year',  icon: <Calendar className="w-3.5 h-3.5" /> },
        { key: 'faiz-opening-balance' as FaizSubTab,     label: 'Niyaz Opening Balance',  icon: <Wallet className="w-3.5 h-3.5" /> },
        { key: 'faiz-receipt-due-config' as FaizSubTab,  label: 'Show Due on Receipt',    icon: <Sliders className="w-3.5 h-3.5" /> },
        { key: 'faiz-print-takhmeen' as FaizSubTab,      label: 'Print Takhmeen Form',    icon: <Printer className="w-3.5 h-3.5" />, badge: 'Print' },
        { key: 'faiz-expense-entry' as FaizSubTab,       label: 'Expense Heads & Entry',  icon: <TrendingDown className="w-3.5 h-3.5" />, badge: 'Outflow' },
        { key: 'faiz-income-entry' as FaizSubTab,        label: 'Income Heads & Entry',   icon: <TrendingUp className="w-3.5 h-3.5" />, badge: 'Inflow' },
        { key: 'faiz-additional-masters' as FaizSubTab,  label: 'Additional Masters',     icon: <Layers className="w-3.5 h-3.5" />, badge: '6-in-1' },
      ],
    },
    {
      groupTitle: 'Part 2: Receipts, Reports & Audits',
      tabs: [
        { key: 'faiz-receipt-management' as FaizSubTab, label: 'View / Print Receipts',   icon: <Receipt className="w-3.5 h-3.5" />, badge: 'Part 2' },
        { key: 'faiz-official-receipt' as FaizSubTab,   label: 'Official Print Receipt', icon: <Printer className="w-3.5 h-3.5" />, badge: 'Trust' },
        { key: 'faiz-reports-suite' as FaizSubTab,      label: 'Faiz Reports Suite',       icon: <FileSpreadsheet className="w-3.5 h-3.5" />, badge: '6-in-1' },
        { key: 'faiz-audit-cheques' as FaizSubTab,      label: 'Cheques & Cancellations', icon: <RotateCcw className="w-3.5 h-3.5" />, badge: 'Audit' },
      ],
    },
    {
      groupTitle: 'Operations & Ledgers',
      tabs: [
        { key: 'faiz-category-master' as FaizSubTab,     label: 'Category Master',        icon: <Tag className="w-3.5 h-3.5" /> },
        { key: 'faiz-hub-master' as FaizSubTab,          label: 'Add Hub Master',         icon: <Plus className="w-3.5 h-3.5" />, badge: 'Pledge' },
        { key: 'faiz-payment-entry' as FaizSubTab,       label: 'Hub Payment Entry',      icon: <CreditCard className="w-3.5 h-3.5" />, badge: 'POS' },
        { key: 'faiz-outstanding-report' as FaizSubTab,  label: 'Hub Outstanding',        icon: <AlertCircle className="w-3.5 h-3.5" /> },
        { key: 'faiz-receipt-report' as FaizSubTab,      label: 'Receipt Report',         icon: <Receipt className="w-3.5 h-3.5" /> },
        { key: 'faiz-ledger-report' as FaizSubTab,       label: 'Ledger Report',          icon: <FileSpreadsheet className="w-3.5 h-3.5" /> },
        { key: 'faiz-cancelled-receipts' as FaizSubTab,  label: 'Cancelled Receipts',     icon: <Ban className="w-3.5 h-3.5" /> },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* ── Sub-tab Navigation Ribbon ── */}
      <div className="bg-white border border-amber-300/60 rounded-2xl p-2.5 shadow-xs space-y-2">
        {tabGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-2 block">
              {group.groupTitle}
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 select-none">
              {group.tabs.map(({ key, label, icon, badge }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                    activeTab === key
                      ? 'bg-amber-400 text-slate-950 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-amber-50'
                  }`}
                >
                  {icon}
                  <span>{label}</span>
                  {badge && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-md text-[9px] bg-slate-900 text-amber-300 font-extrabold uppercase">
                      {badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* =========================================================================
       * 1. FAIZ DASHBOARD & STATISTICS [cite: 24, 52]
       * ========================================================================= */}
      {activeTab === 'faiz-hub-dashboard' && (
        <FaizDashboardStatisticsSubpage
          financialYear={financialYear}
          showToast={showToast}
          onNavigateToTab={(t) => setActiveTab(t as FaizSubTab)}
        />
      )}

      {/* =========================================================================
       * 2. SET DEFAULT TAKHMEEN YEAR [cite: 25]
       * ========================================================================= */}
      {activeTab === 'faiz-default-year' && (
        <SetDefaultTakhmeenYearSubpage
          currentUser={currentUser}
          showToast={showToast}
        />
      )}

      {/* =========================================================================
       * 3. SET OPENING BALANCE (NIYAZ OPENING BALANCE LIST) [cite: 26]
       * ========================================================================= */}
      {activeTab === 'faiz-opening-balance' && (
        <NiyazOpeningBalanceSubpage
          currentUser={currentUser}
          showToast={showToast}
          canAdd={canAdd}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      )}

      {/* =========================================================================
       * 4. SHOW DUE ON RECEIPT [cite: 27]
       * ========================================================================= */}
      {activeTab === 'faiz-receipt-due-config' && (
        <ShowDueOnReceiptSubpage
          currentUser={currentUser}
          showToast={showToast}
        />
      )}

      {/* =========================================================================
       * 5. PRINT TAKHMEEN FORM [cite: 28]
       * ========================================================================= */}
      {activeTab === 'faiz-print-takhmeen' && (
        <PrintTakhmeenFormSubpage
          currentUser={currentUser}
          showToast={showToast}
        />
      )}

      {/* =========================================================================
       * 6. EXPENSE HEADS & NIYAZ EXPENSE ENTRY LIST [cite: 29, 30]
       * ========================================================================= */}
      {activeTab === 'faiz-expense-entry' && (
        <NiyazExpenseEntrySubpage
          currentUser={currentUser}
          showToast={showToast}
          canAdd={canAdd}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      )}

      {/* =========================================================================
       * 7. INCOME HEAD & NIYAZ INCOME ENTRY LIST [cite: 38, 39, 40]
       * ========================================================================= */}
      {activeTab === 'faiz-income-entry' && (
        <NiyazIncomeEntrySubpage
          currentUser={currentUser}
          showToast={showToast}
          canAdd={canAdd}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      )}

      {/* =========================================================================
       * 8. ADDITIONAL MASTERS [cite: 31, 32, 33, 35, 36, 37]
       * ========================================================================= */}
      {activeTab === 'faiz-additional-masters' && (
        <FaizAdditionalMastersSubpage
          currentUser={currentUser}
          showToast={showToast}
          canAdd={canAdd}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      )}

      {/* =========================================================================
       * PART 2.1: RECEIPT GENERATION & MANAGEMENT [cite: 41]
       * ========================================================================= */}
      {activeTab === 'faiz-receipt-management' && (
        <FaizReceiptManagementSubpage
          currentUser={currentUser}
          showToast={showToast}
          canAdd={canAdd}
        />
      )}

      {/* =========================================================================
       * PART 2.2: COMPREHENSIVE FAIZ REPORTS SUITE [cite: 42, 43, 44, 45, 46, 51]
       * ========================================================================= */}
      {activeTab === 'faiz-reports-suite' && (
        <FaizReportsSuiteSubpage
          currentUser={currentUser}
          showToast={showToast}
        />
      )}

      {/* =========================================================================
       * PART 2.3: AUDIT TRAILS, CANCELLATIONS & CHEQUE MANAGEMENT [cite: 47, 48, 49, 50]
       * ========================================================================= */}
      {activeTab === 'faiz-audit-cheques' && (
        <FaizAuditChequeCancellationSubpage
          currentUser={currentUser}
          showToast={showToast}
          canAdd={canAdd}
        />
      )}

      {/* =========================================================================
       * PART 2.4: OFFICIAL DAWOODI BOHRA JAMAAT TRUST PRINT RECEIPT [cite: reference image]
       * ========================================================================= */}
      {activeTab === 'faiz-official-receipt' && (
        <FaizOfficialPrintReceipt
          currentUser={currentUser}
        />
      )}

      {/* =========================================================================
       * 9. CATEGORY MASTER
       * ========================================================================= */}
      {activeTab === 'faiz-category-master' && (
        <div className="space-y-4">
          <div className="bg-white border border-amber-300/40 rounded-xl p-4 shadow-xs flex justify-between items-center">
            <div>
              <h3 className="font-bold text-sm text-slate-900">FMB Hub Contribution Categories & Rate Tiers</h3>
              <p className="text-xs text-slate-500">Standard slab structures for annual FMB hub pledge calculation.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map((c) => (
              <div key={c.id} className="bg-white border border-amber-200/70 rounded-xl p-5 shadow-xs space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-mono text-[10px] font-bold">{c.code}</span>
                    <h4 className="font-bold text-sm text-slate-900 mt-1">{c.name}</h4>
                  </div>
                  <span className="text-sm font-black text-emerald-700">{fmtINR(c.suggestedAnnualHub)}/yr</span>
                </div>
                <p className="text-xs text-slate-600">{c.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
       * 10. ADD HUB MASTER
       * ========================================================================= */}
      {activeTab === 'faiz-hub-master' && (
        <AddHubMasterSubpage
          hubs={hubs}
          setHubs={setHubs}
          categories={categories}
          hofs={hofs}
          financialYear={financialYear}
          currentUser={currentUser}
          showToast={showToast}
          canAdd={canAdd}
        />
      )}

      {/* =========================================================================
       * 11. HUB PAYMENT ENTRY
       * ========================================================================= */}
      {activeTab === 'faiz-payment-entry' && (
        <HubPaymentEntrySubpage
          hubs={hubs}
          setHubs={setHubs}
          receipts={receipts}
          setReceipts={setReceipts}
          financialYear={financialYear}
          currentUser={currentUser}
          showToast={showToast}
        />
      )}

      {/* =========================================================================
       * 12. HUB OUTSTANDING REPORT
       * ========================================================================= */}
      {activeTab === 'faiz-outstanding-report' && (
        <HubOutstandingReportSubpage hubs={hubs} showToast={showToast} />
      )}

      {/* =========================================================================
       * 13. RECEIPT REPORT
       * ========================================================================= */}
      {activeTab === 'faiz-receipt-report' && (
        <ReceiptReportSubpage receipts={receipts} showToast={showToast} />
      )}

      {/* =========================================================================
       * 14. LEDGER REPORT
       * ========================================================================= */}
      {activeTab === 'faiz-ledger-report' && (
        <LedgerReportSubpage hubs={hubs} receipts={receipts} />
      )}

      {/* =========================================================================
       * 15. CANCELLED RECEIPTS
       * ========================================================================= */}
      {activeTab === 'faiz-cancelled-receipts' && (
        <CancelledReceiptsSubpage
          receipts={receipts}
          setReceipts={setReceipts}
          hubs={hubs}
          setHubs={setHubs}
          currentUser={currentUser}
          showToast={showToast}
        />
      )}
    </div>
  );
};

/* ============================================================================
 * EMBEDDED SUBPAGE HELPERS (RETAINED FROM ORIGINAL OPERATIONAL SUITE)
 * ========================================================================= */

const AddHubMasterSubpage: React.FC<{
  hubs: FaizHubMasterRecord[];
  setHubs: React.Dispatch<React.SetStateAction<FaizHubMasterRecord[]>>;
  categories: FaizHubCategory[];
  hofs: any[];
  financialYear: string;
  currentUser: UserProfile;
  showToast: (m: string) => void;
  canAdd: boolean;
}> = ({ hubs, setHubs, categories, hofs, financialYear, currentUser, showToast, canAdd }) => {
  const [selectedIts, setSelectedIts] = useState(hofs[0]?.itsNumber || '');
  const [categoryCode, setCategoryCode] = useState(categories[0]?.code || 'HUB-GEN');
  const [committedAmount, setCommittedAmount] = useState(52000);
  const [plan, setPlan] = useState<'One-Time' | 'Quarterly' | 'Monthly' | 'Custom'>('Quarterly');
  const [notes, setNotes] = useState('');

  const handleCreateHub = () => {
    const member = hofs.find(h => h.itsNumber === selectedIts);
    if (!member) return;

    const newRecord: FaizHubMasterRecord = {
      id: `fhub-${Date.now()}`,
      itsNumber: member.itsNumber,
      hofName: member.fullName,
      mohallahName: member.mohallahName || 'Burhani Park',
      categoryCode,
      financialYear,
      committedHub: Number(committedAmount),
      paidHub: 0,
      balanceHub: Number(committedAmount),
      installmentPlan: plan,
      status: 'Pledged',
      notes,
      createdAt: new Date().toISOString(),
    };

    const updated = [newRecord, ...hubs];
    setHubs(updated);
    saveStoredFaizHubs(updated);
    appendActivityLog(currentUser.username, 'Faiz Module', 'Add Hub Master', 'ADD', `Recorded annual FMB hub pledge ₹${committedAmount} for ITS ${member.itsNumber}.`);
    showToast(`Hub pledge for ${member.fullName} created successfully.`);
    setNotes('');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-white border border-amber-300/40 rounded-xl p-6 shadow-xs space-y-4">
        <h3 className="font-bold text-base text-slate-900">Add Annual FMB Hub / Takhmeen Commitment</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Select Member (HOF) *</label>
            <select
              value={selectedIts}
              onChange={(e) => setSelectedIts(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 cursor-pointer font-bold"
            >
              {hofs.map(h => (
                <option key={h.id} value={h.itsNumber}>{h.fullName} (ITS: {h.itsNumber})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Hub Contribution Category</label>
            <select
              value={categoryCode}
              onChange={(e) => {
                setCategoryCode(e.target.value);
                const c = categories.find(x => x.code === e.target.value);
                if (c) setCommittedAmount(c.suggestedAnnualHub);
              }}
              className="w-full border rounded-lg px-3 py-2 cursor-pointer font-bold"
            >
              {categories.map(c => (
                <option key={c.id} value={c.code}>{c.name} ({fmtINR(c.suggestedAnnualHub)}/yr)</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Annual Committed Amount (INR) *</label>
            <input
              type="number"
              value={committedAmount}
              onChange={(e) => setCommittedAmount(Number(e.target.value))}
              className="w-full border rounded-lg px-3 py-2 font-black text-slate-900"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Installment Frequency</label>
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value as any)}
              className="w-full border rounded-lg px-3 py-2 cursor-pointer"
            >
              <option value="One-Time">One-Time Advance</option>
              <option value="Quarterly">Quarterly Installments</option>
              <option value="Monthly">Monthly Standing Instructions</option>
              <option value="Custom">Custom Plan</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block font-bold text-slate-700 mb-1">Notes / Miqaat Specific Instructions</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Cleared via online NEFT on Lailatul Qadr Mubarak"
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
        </div>
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            disabled={!canAdd}
            onClick={handleCreateHub}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>Create Hub Commitment</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const HubPaymentEntrySubpage: React.FC<{
  hubs: FaizHubMasterRecord[];
  setHubs: React.Dispatch<React.SetStateAction<FaizHubMasterRecord[]>>;
  receipts: FaizHubReceipt[];
  setReceipts: React.Dispatch<React.SetStateAction<FaizHubReceipt[]>>;
  financialYear: string;
  currentUser: UserProfile;
  showToast: (m: string) => void;
}> = ({ hubs, setHubs, receipts, setReceipts, financialYear, currentUser, showToast }) => {
  const [selectedHubId, setSelectedHubId] = useState(hubs[0]?.id || '');
  const [amount, setAmount] = useState(10000);
  const [mode, setMode] = useState<FaizPaymentMode>('Bank Transfer');
  const [ref, setRef] = useState('');
  const [notes, setNotes] = useState('');

  const targetHub = hubs.find(h => h.id === selectedHubId) || hubs[0];

  const handlePay = () => {
    if (!targetHub || amount <= 0) return;

    const receiptNo = `FMB-REC-${Date.now().toString().slice(-4)}`;
    const newReceipt: FaizHubReceipt = {
      id: `frec-${Date.now()}`,
      receiptNo,
      hubRecordId: targetHub.id,
      itsNumber: targetHub.itsNumber,
      hofName: targetHub.hofName,
      amount: Number(amount),
      paymentMode: mode,
      transactionRef: ref || 'COUNTER-CASH',
      date: new Date().toISOString().split('T')[0],
      financialYear,
      collectedBy: currentUser.username,
      notes,
      isCancelled: false,
    };

    const nextReceipts = [newReceipt, ...receipts];
    setReceipts(nextReceipts);
    saveStoredFaizReceipts(nextReceipts);

    const updatedHubs = hubs.map(h => {
      if (h.id === targetHub.id) {
        const newPaid = h.paidHub + Number(amount);
        const newBal = Math.max(0, h.committedHub - newPaid);
        return {
          ...h,
          paidHub: newPaid,
          balanceHub: newBal,
          status: newBal === 0 ? ('Settled' as const) : ('Partially Paid' as const),
        };
      }
      return h;
    });

    setHubs(updatedHubs);
    saveStoredFaizHubs(updatedHubs);

    appendActivityLog(currentUser.username, 'Faiz Module', 'Hub Payment Entry', 'ADD', `Collected ₹${amount} (${mode}) on receipt ${receiptNo} for ${targetHub.hofName}.`);
    showToast(`Receipt ${receiptNo} generated for ${fmtINR(amount)}.`);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-white border border-amber-300/40 rounded-xl p-6 shadow-xs space-y-4">
        <h3 className="font-bold text-base text-slate-900">Faiz Hub Counter Receipt & POS Collection</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Select Family Pledge Account</label>
            <select
              value={selectedHubId}
              onChange={(e) => setSelectedHubId(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 cursor-pointer font-bold"
            >
              {hubs.map(h => (
                <option key={h.id} value={h.id}>{h.hofName} (Bal: {fmtINR(h.balanceHub)})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Payment Mode</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as any)}
              className="w-full border rounded-lg px-3 py-2 cursor-pointer font-bold"
            >
              <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
              <option value="UPI">UPI / QR Scan</option>
              <option value="Cheque">Cheque</option>
              <option value="Cash">Cash at Counter</option>
            </select>
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Payment Amount (INR) *</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full border rounded-lg px-3 py-2 font-black text-slate-900 text-sm"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Reference / Cheque Number</label>
            <input
              type="text"
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              placeholder="e.g. UTR-9988219"
              className="w-full border rounded-lg px-3 py-2 font-mono"
            />
          </div>
        </div>

        {targetHub && (
          <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80 text-xs flex justify-between items-center">
            <div>
              <p className="font-bold text-slate-900">{targetHub.hofName} (ITS: {targetHub.itsNumber})</p>
              <p className="text-slate-500">{targetHub.mohallahName}</p>
            </div>
            <div className="text-right">
              <p className="text-slate-500 font-medium">Pending Balance</p>
              <p className="text-base font-black text-rose-700">{fmtINR(targetHub.balanceHub)}</p>
            </div>
          </div>
        )}

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={handlePay}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Receipt className="w-4 h-4" />
            <span>Generate & Issue Receipt</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const HubOutstandingReportSubpage: React.FC<{
  hubs: FaizHubMasterRecord[];
  showToast: (m: string) => void;
}> = ({ hubs, showToast }) => {
  const pendingHubs = hubs.filter(h => h.balanceHub > 0);
  return (
    <div className="bg-white border border-amber-300/40 rounded-xl p-5 shadow-xs space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-bold text-sm text-slate-900">Member-wise Hub Outstanding Report</h3>
          <p className="text-xs text-slate-500">{pendingHubs.length} households with pending dues</p>
        </div>
        <button
          type="button"
          onClick={() => showToast('Exported outstanding records to CSV.')}
          className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export CSV</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-amber-50 text-slate-700 font-bold border-y">
              <th className="py-2.5 px-3">ITS / HOF Name</th>
              <th className="py-2.5 px-3">Mohalla</th>
              <th className="py-2.5 px-3 text-right">Committed</th>
              <th className="py-2.5 px-3 text-right">Paid</th>
              <th className="py-2.5 px-3 text-right">Balance Due</th>
              <th className="py-2.5 px-3">Plan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pendingHubs.map(h => (
              <tr key={h.id} className="hover:bg-slate-50">
                <td className="py-2.5 px-3">
                  <span className="font-bold text-slate-900 block">{h.hofName}</span>
                  <span className="text-[10px] text-slate-500 font-mono">ITS: {h.itsNumber}</span>
                </td>
                <td className="py-2.5 px-3 text-slate-600">{h.mohallahName}</td>
                <td className="py-2.5 px-3 text-right font-medium">{fmtINR(h.committedHub)}</td>
                <td className="py-2.5 px-3 text-right font-bold text-emerald-700">{fmtINR(h.paidHub)}</td>
                <td className="py-2.5 px-3 text-right font-black text-rose-700">{fmtINR(h.balanceHub)}</td>
                <td className="py-2.5 px-3 font-semibold text-slate-700">{h.installmentPlan}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ReceiptReportSubpage: React.FC<{
  receipts: FaizHubReceipt[];
  showToast: (m: string) => void;
}> = ({ receipts, showToast }) => {
  return (
    <div className="bg-white border border-amber-300/40 rounded-xl p-5 shadow-xs space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-bold text-sm text-slate-900">Faiz Hub Historical Receipts Log</h3>
          <p className="text-xs text-slate-500">{receipts.length} total generated receipts</p>
        </div>
        <button
          type="button"
          onClick={() => showToast('Exported receipt log to CSV.')}
          className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Receipts</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-amber-50 text-slate-700 font-bold border-y">
              <th className="py-2.5 px-3">Receipt No</th>
              <th className="py-2.5 px-3">Date</th>
              <th className="py-2.5 px-3">HOF Name</th>
              <th className="py-2.5 px-3 text-right">Amount</th>
              <th className="py-2.5 px-3">Mode</th>
              <th className="py-2.5 px-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {receipts.map(r => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{r.receiptNo}</td>
                <td className="py-2.5 px-3 font-mono text-slate-600">{r.date}</td>
                <td className="py-2.5 px-3 font-semibold text-slate-900">{r.hofName}</td>
                <td className="py-2.5 px-3 text-right font-black text-emerald-700">{fmtINR(r.amount)}</td>
                <td className="py-2.5 px-3 text-slate-600">{r.paymentMode}</td>
                <td className="py-2.5 px-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    r.isCancelled ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {r.isCancelled ? 'Cancelled' : 'Valid'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const LedgerReportSubpage: React.FC<{
  hubs: FaizHubMasterRecord[];
  receipts: FaizHubReceipt[];
}> = ({ hubs, receipts }) => {
  const [selectedIts, setSelectedIts] = useState(hubs[0]?.itsNumber || '');
  const activeHub = hubs.find(h => h.itsNumber === selectedIts);
  const memberReceipts = receipts.filter(r => r.itsNumber === selectedIts);

  return (
    <div className="space-y-4">
      <div className="bg-white border border-amber-300/40 rounded-xl p-4 shadow-xs flex justify-between items-center text-xs">
        <div>
          <h3 className="font-bold text-sm text-slate-900">Individual Household FMB Master Ledger</h3>
          <p className="text-slate-500">Audit-ready debit-credit running statement</p>
        </div>
        <select
          value={selectedIts}
          onChange={(e) => setSelectedIts(e.target.value)}
          className="border rounded-lg px-3 py-1.5 font-bold cursor-pointer"
        >
          {hubs.map(h => (
            <option key={h.id} value={h.itsNumber}>{h.hofName} ({h.itsNumber})</option>
          ))}
        </select>
      </div>

      {activeHub && (
        <div className="bg-white border border-amber-300/40 rounded-xl p-5 shadow-xs space-y-4 text-xs">
          <div className="grid grid-cols-3 gap-4 border-b pb-4">
            <div>
              <span className="text-slate-500">Mumin Name</span>
              <p className="font-bold text-sm text-slate-900">{activeHub.hofName}</p>
            </div>
            <div>
              <span className="text-slate-500">Annual Pledged Hub</span>
              <p className="font-bold text-sm text-slate-900">{fmtINR(activeHub.committedHub)}</p>
            </div>
            <div>
              <span className="text-slate-500">Remaining Balance</span>
              <p className="font-black text-sm text-rose-700">{fmtINR(activeHub.balanceHub)}</p>
            </div>
          </div>

          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-amber-50 font-bold border-y">
                <th className="py-2 px-3">Date</th>
                <th className="py-2 px-3">Particulars / Ref</th>
                <th className="py-2 px-3 text-right">Debit</th>
                <th className="py-2 px-3 text-right">Credit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-2 px-3 font-mono">{activeHub.createdAt?.slice(0, 10) || '1447-01-01'}</td>
                <td className="py-2 px-3 font-bold">Annual FMB Hub Pledge Declaration</td>
                <td className="py-2 px-3 text-right font-black text-rose-700">{fmtINR(activeHub.committedHub)}</td>
                <td className="py-2 px-3 text-right text-slate-400">-</td>
              </tr>
              {memberReceipts.map(r => (
                <tr key={r.id}>
                  <td className="py-2 px-3 font-mono">{r.date}</td>
                  <td className="py-2 px-3">Receipt #{r.receiptNo} ({r.paymentMode})</td>
                  <td className="py-2 px-3 text-right text-slate-400">-</td>
                  <td className="py-2 px-3 text-right font-black text-emerald-700">{fmtINR(r.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const CancelledReceiptsSubpage: React.FC<{
  receipts: FaizHubReceipt[];
  setReceipts: React.Dispatch<React.SetStateAction<FaizHubReceipt[]>>;
  hubs: FaizHubMasterRecord[];
  setHubs: React.Dispatch<React.SetStateAction<FaizHubMasterRecord[]>>;
  currentUser: UserProfile;
  showToast: (m: string) => void;
}> = ({ receipts, setReceipts, hubs, setHubs, currentUser, showToast }) => {
  const cancelled = receipts.filter(r => r.isCancelled);

  return (
    <div className="bg-white border border-amber-300/40 rounded-xl p-5 shadow-xs space-y-4">
      <div>
        <h3 className="font-bold text-sm text-slate-900">Cancelled / Revoked FMB Receipts Log</h3>
        <p className="text-xs text-slate-500">Audit trail of annulled counter transactions</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-rose-50 text-rose-900 font-bold border-y border-rose-200">
              <th className="py-2.5 px-3">Receipt No</th>
              <th className="py-2.5 px-3">HOF Name</th>
              <th className="py-2.5 px-3 text-right">Annulled Amount</th>
              <th className="py-2.5 px-3">Cancelled By</th>
              <th className="py-2.5 px-3">Cancellation Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cancelled.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500">
                  No cancelled receipts recorded in this cycle.
                </td>
              </tr>
            ) : (
              cancelled.map(r => (
                <tr key={r.id}>
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{r.receiptNo}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-800">{r.hofName}</td>
                  <td className="py-2.5 px-3 text-right font-black text-rose-700">{fmtINR(r.amount)}</td>
                  <td className="py-2.5 px-3 text-slate-700">{r.cancelledBy || 'System Admin'}</td>
                  <td className="py-2.5 px-3 text-slate-600 italic">{r.cancellationReason || 'Wrong entry by cashier'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
