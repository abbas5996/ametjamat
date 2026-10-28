import React, { useState, useMemo } from 'react';
import {
  Briefcase,
  Users,
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  FileText,
  Plus,
  Search,
  Filter,
  Download,
  Printer,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertCircle,
  X,
  Building,
  CreditCard,
  Layers,
  ChevronRight,
  Eye,
  Trash2,
  Edit,
} from 'lucide-react';
import {
  CommitteePortfolio,
  CommitteeMember,
  TrustOpeningBalance,
  TrustIncomeHead,
  TrustIncomeEntry,
  TrustExpenseHead,
  TrustExpenseEntry,
  TrustAccountTransfer,
  getCommitteePortfolios,
  saveCommitteePortfolios,
  getCommitteeMembers,
  saveCommitteeMembers,
  getTrustOpeningBalances,
  saveTrustOpeningBalances,
  getTrustIncomeHeads,
  saveTrustIncomeHeads,
  getTrustIncomeEntries,
  saveTrustIncomeEntries,
  getTrustExpenseHeads,
  saveTrustExpenseHeads,
  getTrustExpenseEntries,
  saveTrustExpenseEntries,
  getTrustAccountTransfers,
  saveTrustAccountTransfers,
} from '../../utils/part4Management';
import { UserProfile, FinancialYear } from '../../types';

interface CommitteeTrustModuleProps {
  currentUser: UserProfile;
  activeSubItemId: string;
  subItemLabel: string;
  financialYear: FinancialYear;
  showToast: (msg: string) => void;
  canAdd?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}

export const CommitteeTrustModule: React.FC<CommitteeTrustModuleProps> = ({
  currentUser,
  activeSubItemId,
  financialYear,
  showToast,
  canAdd = true,
  canEdit = true,
  canDelete = true,
}) => {
  // Navigation tabs within Committee & Trust
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (activeSubItemId && activeSubItemId !== 'committee-trust') {
      return activeSubItemId;
    }
    return 'committee-dashboard';
  });

  // State
  const [portfolios, setPortfolios] = useState<CommitteePortfolio[]>(getCommitteePortfolios);
  const [members, setMembers] = useState<CommitteeMember[]>(getCommitteeMembers);
  const [openingBalances, setOpeningBalances] = useState<TrustOpeningBalance[]>(getTrustOpeningBalances);
  const [incomeHeads, setIncomeHeads] = useState<TrustIncomeHead[]>(getTrustIncomeHeads);
  const [incomeEntries, setIncomeEntries] = useState<TrustIncomeEntry[]>(getTrustIncomeEntries);
  const [expenseHeads, setExpenseHeads] = useState<TrustExpenseHead[]>(getTrustExpenseHeads);
  const [expenseEntries, setExpenseEntries] = useState<TrustExpenseEntry[]>(getTrustExpenseEntries);
  const [transfers, setTransfers] = useState<TrustAccountTransfer[]>(getTrustAccountTransfers);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [headFilter, setHeadFilter] = useState('ALL');

  // Modals
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showOpeningModal, setShowOpeningModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<TrustIncomeEntry | null>(null);

  // Form States
  const [memberForm, setMemberForm] = useState({
    fullName: '',
    itsNumber: '',
    roleTitle: '',
    portfolioId: '',
    contact: '',
    email: '',
    tenureStartHijri: '1446 Hijri',
    tenureEndHijri: '1448 Hijri',
  });

  const [incomeForm, setIncomeForm] = useState({
    headId: '',
    amount: '',
    receivedFrom: '',
    itsNumber: '',
    paymentMode: 'Bank Transfer' as TrustIncomeEntry['paymentMode'],
    referenceNo: '',
    bankAccountId: 'HDFC Bank — General Jamaat A/C 9081',
    remarks: '',
  });

  const [expenseForm, setExpenseForm] = useState({
    headId: '',
    amount: '',
    paidTo: '',
    paymentMode: 'Bank Transfer' as TrustExpenseEntry['paymentMode'],
    bankAccountId: 'HDFC Bank — General Jamaat A/C 9081',
    approvedBy: 'Janab Amil Saheb',
    invoiceRef: '',
    remarks: '',
  });

  const [transferForm, setTransferForm] = useState({
    fromAccountId: 'Cash in Hand (Main Khazina)',
    toAccountId: 'HDFC Bank — General Jamaat A/C 9081',
    amount: '',
    referenceNo: '',
    narration: '',
  });

  const [openingForm, setOpeningForm] = useState({
    accountName: '',
    accountType: 'Bank' as TrustOpeningBalance['accountType'],
    openingBalance: '',
    asOfDate: '1447-01-01',
    notes: '',
  });

  // Calculate Metrics
  const totalOpeningBalance = useMemo(() => {
    return openingBalances.reduce((sum, b) => sum + b.openingBalance, 0);
  }, [openingBalances]);

  const totalIncome = useMemo(() => {
    return incomeEntries.reduce((sum, e) => sum + e.amount, 0);
  }, [incomeEntries]);

  const totalExpense = useMemo(() => {
    return expenseEntries.reduce((sum, e) => sum + e.amount, 0);
  }, [expenseEntries]);

  const netSurplus = totalIncome - totalExpense;

  // Handlers
  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberForm.fullName || !memberForm.itsNumber || !memberForm.roleTitle) {
      alert('Please fill in Full Name, ITS Number, and Role Title');
      return;
    }
    const selectedPort = portfolios.find((p) => p.id === memberForm.portfolioId);
    const newMember: CommitteeMember = {
      id: `CM-${Date.now()}`,
      itsNumber: memberForm.itsNumber,
      fullName: memberForm.fullName,
      roleTitle: memberForm.roleTitle,
      portfolioId: memberForm.portfolioId,
      portfolioName: selectedPort ? selectedPort.name : 'General Executive',
      contact: memberForm.contact,
      email: memberForm.email,
      tenureStartHijri: memberForm.tenureStartHijri,
      tenureEndHijri: memberForm.tenureEndHijri,
      status: 'Active',
    };
    const updated = [newMember, ...members];
    setMembers(updated);
    saveCommitteeMembers(updated);
    setShowMemberModal(false);
    setMemberForm({
      fullName: '',
      itsNumber: '',
      roleTitle: '',
      portfolioId: '',
      contact: '',
      email: '',
      tenureStartHijri: '1446 Hijri',
      tenureEndHijri: '1448 Hijri',
    });
    showToast(`Committee Member ${newMember.fullName} enrolled successfully.`);
  };

  const handleSaveIncome = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(incomeForm.amount);
    if (!amt || amt <= 0 || !incomeForm.headId) {
      alert('Please enter a valid amount and select an Income Head.');
      return;
    }
    const head = incomeHeads.find((h) => h.id === incomeForm.headId);
    const newEntry: TrustIncomeEntry = {
      id: `TIE-${Date.now()}`,
      receiptNo: `TR-INC-1447-${String(incomeEntries.length + 1).padStart(3, '0')}`,
      headId: incomeForm.headId,
      headName: head ? head.name : 'General Income',
      date: new Date().toISOString().split('T')[0],
      amount: amt,
      receivedFrom: incomeForm.receivedFrom || 'Mumineen Benefactor',
      itsNumber: incomeForm.itsNumber || '30491024',
      paymentMode: incomeForm.paymentMode,
      referenceNo: incomeForm.referenceNo || `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
      bankAccountId: incomeForm.bankAccountId,
      remarks: incomeForm.remarks,
      createdBy: currentUser.username,
      createdAt: new Date().toISOString(),
    };
    const updated = [newEntry, ...incomeEntries];
    setIncomeEntries(updated);
    saveTrustIncomeEntries(updated);
    setShowIncomeModal(false);
    setIncomeForm({
      headId: '',
      amount: '',
      receivedFrom: '',
      itsNumber: '',
      paymentMode: 'Bank Transfer',
      referenceNo: '',
      bankAccountId: 'HDFC Bank — General Jamaat A/C 9081',
      remarks: '',
    });
    showToast(`Income receipt ${newEntry.receiptNo} of ₹${amt.toLocaleString('en-IN')} recorded.`);
  };

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(expenseForm.amount);
    if (!amt || amt <= 0 || !expenseForm.headId || !expenseForm.paidTo) {
      alert('Please enter valid amount, Expense Head, and Payee name.');
      return;
    }
    const head = expenseHeads.find((h) => h.id === expenseForm.headId);
    const newEntry: TrustExpenseEntry = {
      id: `TEE-${Date.now()}`,
      voucherNo: `TR-EXP-1447-${String(expenseEntries.length + 1).padStart(3, '0')}`,
      headId: expenseForm.headId,
      headName: head ? head.name : 'General Expense',
      date: new Date().toISOString().split('T')[0],
      amount: amt,
      paidTo: expenseForm.paidTo,
      paymentMode: expenseForm.paymentMode,
      bankAccountId: expenseForm.bankAccountId,
      approvedBy: expenseForm.approvedBy,
      invoiceRef: expenseForm.invoiceRef || `INV-${Math.floor(1000 + Math.random() * 9000)}`,
      remarks: expenseForm.remarks,
      createdBy: currentUser.username,
      createdAt: new Date().toISOString(),
    };
    const updated = [newEntry, ...expenseEntries];
    setExpenseEntries(updated);
    saveTrustExpenseEntries(updated);
    setShowExpenseModal(false);
    setExpenseForm({
      headId: '',
      amount: '',
      paidTo: '',
      paymentMode: 'Bank Transfer',
      bankAccountId: 'HDFC Bank — General Jamaat A/C 9081',
      approvedBy: 'Janab Amil Saheb',
      invoiceRef: '',
      remarks: '',
    });
    showToast(`Expense voucher ${newEntry.voucherNo} of ₹${amt.toLocaleString('en-IN')} recorded.`);
  };

  const handleSaveTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(transferForm.amount);
    if (!amt || amt <= 0 || transferForm.fromAccountId === transferForm.toAccountId) {
      alert('Please enter a valid amount and ensure Source and Destination accounts differ.');
      return;
    }
    const newTransfer: TrustAccountTransfer = {
      id: `TAT-${Date.now()}`,
      transferNo: `TR-XFR-1447-${String(transfers.length + 1).padStart(3, '0')}`,
      transferDate: new Date().toISOString().split('T')[0],
      fromAccountId: transferForm.fromAccountId,
      fromAccountName: transferForm.fromAccountId,
      toAccountId: transferForm.toAccountId,
      toAccountName: transferForm.toAccountId,
      amount: amt,
      referenceNo: transferForm.referenceNo || `XFR-${Math.floor(100000 + Math.random() * 900000)}`,
      narration: transferForm.narration || 'Internal account contra transfer',
      createdBy: currentUser.username,
      createdAt: new Date().toISOString(),
    };
    const updated = [newTransfer, ...transfers];
    setTransfers(updated);
    saveTrustAccountTransfers(updated);
    setShowTransferModal(false);
    setTransferForm({
      fromAccountId: 'Cash in Hand (Main Khazina)',
      toAccountId: 'HDFC Bank — General Jamaat A/C 9081',
      amount: '',
      referenceNo: '',
      narration: '',
    });
    showToast(`Transfer ${newTransfer.transferNo} of ₹${amt.toLocaleString('en-IN')} executed.`);
  };

  const handleSaveOpening = (e: React.FormEvent) => {
    e.preventDefault();
    const bal = parseFloat(openingForm.openingBalance);
    if (!openingForm.accountName || isNaN(bal)) {
      alert('Please enter Account Name and Opening Balance amount.');
      return;
    }
    const newBal: TrustOpeningBalance = {
      id: `OB-${Date.now()}`,
      hijriYear: financialYear,
      accountName: openingForm.accountName,
      accountType: openingForm.accountType,
      openingBalance: bal,
      asOfDate: openingForm.asOfDate,
      notes: openingForm.notes,
    };
    const updated = [newBal, ...openingBalances];
    setOpeningBalances(updated);
    saveTrustOpeningBalances(updated);
    setShowOpeningModal(false);
    setOpeningForm({
      accountName: '',
      accountType: 'Bank',
      openingBalance: '',
      asOfDate: '1447-01-01',
      notes: '',
    });
    showToast(`Opening Balance for ${newBal.accountName} set to ₹${bal.toLocaleString('en-IN')}`);
  };

  return (
    <div className="space-y-6">
      {/* Sub-navigation Tabs */}
      <div className="bg-white border border-[#D97706]/30 rounded-xl p-2 shadow-xs flex flex-wrap gap-1.5 text-xs font-semibold">
        {[
          { id: 'committee-dashboard', label: 'Executive Dashboard', icon: Briefcase },
          { id: 'committee-members', label: 'Portfolios & Members', icon: Users },
          { id: 'opening-balance', label: 'Opening Balances', icon: Wallet },
          { id: 'income-entry', label: 'Income Heads & Entry', icon: TrendingUp },
          { id: 'expense-entry', label: 'Expense Heads & Entry', icon: TrendingDown },
          { id: 'account-transfers', label: 'Account Transfers', icon: ArrowRightLeft },
          { id: 'trust-ledger', label: 'Ledger Reports', icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center space-x-2 px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#EAB308] text-[#0F172A] font-black shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: EXECUTIVE DASHBOARD */}
      {activeTab === 'committee-dashboard' && (
        <div className="space-y-6">
          {/* KPI Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">Executive Portfolios</span>
                <Briefcase className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">{portfolios.length}</p>
              <p className="text-xs text-emerald-600 font-semibold mt-1">100% Assigned & Active</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">Trust Opening Balance</span>
                <Wallet className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">
                ₹{totalOpeningBalance.toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-slate-500 mt-1">Cash, Banks & Corpus Funds</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">YTD Trust Inflows</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-black text-emerald-700 mt-2">
                ₹{totalIncome.toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-slate-500 mt-1">{incomeEntries.length} verified receipts</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">YTD Expenses & Outflows</span>
                <TrendingDown className="w-4 h-4 text-rose-600" />
              </div>
              <p className="text-2xl font-black text-rose-700 mt-2">
                ₹{totalExpense.toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-emerald-600 font-semibold mt-1">
                Net Surplus: ₹{netSurplus.toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          {/* Quick Actions & Portfolios Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <Briefcase className="w-4 h-4 text-amber-600" />
                  <span>Executive Committee Portfolios & Mandates</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveTab('committee-members')}
                  className="text-xs text-amber-700 hover:underline font-semibold flex items-center"
                >
                  <span>Manage All</span>
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {portfolios.slice(0, 6).map((port) => (
                  <div
                    key={port.id}
                    className="p-3.5 rounded-lg border border-slate-100 bg-slate-50 hover:bg-amber-50/40 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-amber-900">{port.name}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {port.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{port.description}</p>
                    <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-800">{port.assignedMemberName}</span>
                      <span className="text-slate-400 font-mono">ITS {port.assignedMemberIts}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>Executive Governance Actions</span>
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Trust committee operations strictly adhere to Dawat-e-Hadiyah protocols, requiring dual-signoff on large disbursements.
              </p>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setShowIncomeModal(true)}
                  className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-amber-400 bg-slate-50 hover:bg-amber-50/30 transition-all flex items-center justify-between text-xs font-semibold text-slate-800 cursor-pointer"
                >
                  <span className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span>Record Trust Income Receipt</span>
                  </span>
                  <Plus className="w-3.5 h-3.5 text-slate-400" />
                </button>

                <button
                  type="button"
                  onClick={() => setShowExpenseModal(true)}
                  className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-amber-400 bg-slate-50 hover:bg-amber-50/30 transition-all flex items-center justify-between text-xs font-semibold text-slate-800 cursor-pointer"
                >
                  <span className="flex items-center space-x-2">
                    <TrendingDown className="w-4 h-4 text-rose-600" />
                    <span>Issue Authorized Expense Voucher</span>
                  </span>
                  <Plus className="w-3.5 h-3.5 text-slate-400" />
                </button>

                <button
                  type="button"
                  onClick={() => setShowTransferModal(true)}
                  className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-amber-400 bg-slate-50 hover:bg-amber-50/30 transition-all flex items-center justify-between text-xs font-semibold text-slate-800 cursor-pointer"
                >
                  <span className="flex items-center space-x-2">
                    <ArrowRightLeft className="w-4 h-4 text-blue-600" />
                    <span>Execute Account Contra Transfer</span>
                  </span>
                  <Plus className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PORTFOLIOS & COMMITTEE MEMBERS */}
      {activeTab === 'committee-members' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Executive Committee Members & Portfolios</h3>
              <p className="text-xs text-slate-500">Official portfolio holders under the leadership of Janab Amil Saheb</p>
            </div>
            {canAdd && (
              <button
                type="button"
                onClick={() => setShowMemberModal(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-black text-[#0F172A] bg-[#EAB308] hover:bg-[#D4AF37] rounded-lg transition-all shadow-xs cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Committee Member</span>
              </button>
            )}
          </div>

          {/* Members Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 font-bold">
                  <th className="py-2.5 px-3">ITS #</th>
                  <th className="py-2.5 px-3">Full Name & Title</th>
                  <th className="py-2.5 px-3">Role / Designation</th>
                  <th className="py-2.5 px-3">Assigned Portfolio</th>
                  <th className="py-2.5 px-3">Contact</th>
                  <th className="py-2.5 px-3">Tenure</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members.map((m) => (
                  <tr key={m.id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{m.itsNumber}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{m.fullName}</td>
                    <td className="py-2.5 px-3 text-slate-700">{m.roleTitle}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[10px]">
                        {m.portfolioName}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 font-mono">{m.contact}</td>
                    <td className="py-2.5 px-3 text-slate-500">{m.tenureStartHijri} – {m.tenureEndHijri}</td>
                    <td className="py-2.5 px-3 text-right">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {m.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: OPENING BALANCES */}
      {activeTab === 'opening-balance' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Trust Opening Balance Setup ({financialYear})</h3>
              <p className="text-xs text-slate-500">Initial bank, cash, and corpus balances for the financial cycle</p>
            </div>
            {canAdd && (
              <button
                type="button"
                onClick={() => setShowOpeningModal(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-black text-[#0F172A] bg-[#EAB308] hover:bg-[#D4AF37] rounded-lg transition-all shadow-xs cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Account Opening Balance</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {openingBalances.map((ob) => (
              <div key={ob.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">{ob.accountName}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-900">
                    {ob.accountType}
                  </span>
                </div>
                <div className="text-xl font-black text-slate-900">
                  ₹{ob.openingBalance.toLocaleString('en-IN')}
                </div>
                <p className="text-[11px] text-slate-500">As of: {ob.asOfDate} • {ob.notes}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: INCOME HEADS & ENTRY */}
      {activeTab === 'income-entry' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Trust Income Heads & Receipts Register</h3>
              <p className="text-xs text-slate-500">Donations, Sadaqah, hall revenues, and endowment inflows</p>
            </div>
            <div className="flex items-center space-x-2">
              {canAdd && (
                <button
                  type="button"
                  onClick={() => setShowIncomeModal(true)}
                  className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-black text-[#0F172A] bg-[#EAB308] hover:bg-[#D4AF37] rounded-lg transition-all shadow-xs cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Record Income Receipt</span>
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 font-bold">
                  <th className="py-2.5 px-3">Receipt #</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Income Head</th>
                  <th className="py-2.5 px-3">Received From</th>
                  <th className="py-2.5 px-3">Mode & Ref</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3 text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {incomeEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-amber-900">{entry.receiptNo}</td>
                    <td className="py-2.5 px-3 text-slate-600">{entry.date}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{entry.headName}</td>
                    <td className="py-2.5 px-3">
                      <span className="font-bold text-slate-900">{entry.receivedFrom}</span>
                      <span className="block text-[10px] text-slate-400 font-mono">ITS {entry.itsNumber}</span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      <span className="font-semibold">{entry.paymentMode}</span>
                      <span className="block text-[10px] text-slate-400 font-mono">{entry.referenceNo}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-black text-emerald-700">
                      ₹{entry.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedReceipt(entry)}
                        className="p-1 text-slate-600 hover:text-amber-700 hover:bg-amber-100 rounded cursor-pointer"
                        title="Print Official Receipt"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: EXPENSE HEADS & ENTRY */}
      {activeTab === 'expense-entry' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Trust Expense Heads & Payment Vouchers</h3>
              <p className="text-xs text-slate-500">Utilities, repairs, staff disbursements, and religious programs</p>
            </div>
            {canAdd && (
              <button
                type="button"
                onClick={() => setShowExpenseModal(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-black text-[#0F172A] bg-[#EAB308] hover:bg-[#D4AF37] rounded-lg transition-all shadow-xs cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Issue Expense Voucher</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 font-bold">
                  <th className="py-2.5 px-3">Voucher #</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Expense Head</th>
                  <th className="py-2.5 px-3">Paid To / Payee</th>
                  <th className="py-2.5 px-3">Approved By</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenseEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-rose-900">{entry.voucherNo}</td>
                    <td className="py-2.5 px-3 text-slate-600">{entry.date}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{entry.headName}</td>
                    <td className="py-2.5 px-3">
                      <span className="font-bold text-slate-900">{entry.paidTo}</span>
                      <span className="block text-[10px] text-slate-400 font-mono">Inv: {entry.invoiceRef}</span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 font-semibold">{entry.approvedBy}</td>
                    <td className="py-2.5 px-3 text-right font-black text-rose-700">
                      ₹{entry.amount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: ACCOUNT TRANSFERS */}
      {activeTab === 'account-transfers' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Contra & Inter-Account Transfers</h3>
              <p className="text-xs text-slate-500">Internal movements between physical cash vaults and bank accounts</p>
            </div>
            {canAdd && (
              <button
                type="button"
                onClick={() => setShowTransferModal(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-black text-[#0F172A] bg-[#EAB308] hover:bg-[#D4AF37] rounded-lg transition-all shadow-xs cursor-pointer shrink-0"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Execute Transfer</span>
              </button>
            )}
          </div>

          <div className="space-y-3">
            {transfers.map((t) => (
              <div
                key={t.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-amber-900">{t.transferNo}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-600">{t.transferDate}</span>
                  </div>
                  <p className="font-bold text-slate-900">
                    {t.fromAccountName} <span className="text-amber-600">→</span> {t.toAccountName}
                  </p>
                  <p className="text-slate-500 text-[11px]">{t.narration}</p>
                </div>
                <div className="text-right">
                  <span className="text-base font-black text-slate-900">
                    ₹{t.amount.toLocaleString('en-IN')}
                  </span>
                  <span className="block text-[10px] text-slate-400 font-mono">Ref: {t.referenceNo}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: TRUST LEDGER REPORTS */}
      {activeTab === 'trust-ledger' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Consolidated Trust General Ledger</h3>
              <p className="text-xs text-slate-500">Chronological audit ledger with running balance and dual debits/credits</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Ledger</span>
              </button>
            </div>
          </div>

          {/* Unified Ledger Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-sans">
              <thead>
                <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 font-bold">
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">Doc Ref</th>
                  <th className="py-2 px-3">Particulars & Head</th>
                  <th className="py-2 px-3 text-right">Debit (₹)</th>
                  <th className="py-2 px-3 text-right">Credit (₹)</th>
                  <th className="py-2 px-3 text-right">Balance (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="bg-amber-50/50 font-bold text-slate-800">
                  <td className="py-2.5 px-3">1447-01-01</td>
                  <td className="py-2.5 px-3 font-mono">OB-SUMMARY</td>
                  <td className="py-2.5 px-3">Opening Balances Brought Forward</td>
                  <td className="py-2.5 px-3 text-right text-emerald-700">₹{totalOpeningBalance.toLocaleString('en-IN')}</td>
                  <td className="py-2.5 px-3 text-right text-slate-400">-</td>
                  <td className="py-2.5 px-3 text-right font-black text-slate-900">₹{totalOpeningBalance.toLocaleString('en-IN')}</td>
                </tr>

                {incomeEntries.map((inc) => (
                  <tr key={inc.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 text-slate-600">{inc.date}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-800">{inc.receiptNo}</td>
                    <td className="py-2.5 px-3 text-slate-800">
                      <span className="font-semibold">{inc.headName}</span> — {inc.receivedFrom}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-700">₹{inc.amount.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-3 text-right text-slate-400">-</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                      ₹{(totalOpeningBalance + inc.amount).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}

                {expenseEntries.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 text-slate-600">{exp.date}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-rose-800">{exp.voucherNo}</td>
                    <td className="py-2.5 px-3 text-slate-800">
                      <span className="font-semibold">{exp.headName}</span> — {exp.paidTo}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-400">-</td>
                    <td className="py-2.5 px-3 text-right font-bold text-rose-700">₹{exp.amount.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                      ₹{(totalOpeningBalance + totalIncome - exp.amount).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD COMMITTEE MEMBER */}
      {showMemberModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-amber-300 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Users className="w-5 h-5 text-amber-600" />
                <span>Add Executive Committee Member</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowMemberModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name & Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shk. Taher Bhai Rangwala"
                  value={memberForm.fullName}
                  onChange={(e) => setMemberForm({ ...memberForm, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ITS Number</label>
                  <input
                    type="text"
                    required
                    placeholder="8-digit ITS"
                    value={memberForm.itsNumber}
                    onChange={(e) => setMemberForm({ ...memberForm, itsNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Role Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Joint Secretary"
                    value={memberForm.roleTitle}
                    onChange={(e) => setMemberForm({ ...memberForm, roleTitle: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Executive Portfolio</label>
                <select
                  value={memberForm.portfolioId}
                  onChange={(e) => setMemberForm({ ...memberForm, portfolioId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">Select Portfolio...</option>
                  {portfolios.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mobile Contact</label>
                  <input
                    type="text"
                    placeholder="+91 98200 00000"
                    value={memberForm.contact}
                    onChange={(e) => setMemberForm({ ...memberForm, contact: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="officer@burhanipark.org"
                    value={memberForm.email}
                    onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowMemberModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#EAB308] hover:bg-[#D4AF37] text-[#0F172A] font-black rounded-lg cursor-pointer"
                >
                  Save Committee Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RECORD INCOME */}
      {showIncomeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-emerald-300 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                <span>Record Trust Income Receipt</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowIncomeModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveIncome} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Income Head</label>
                  <select
                    required
                    value={incomeForm.headId}
                    onChange={(e) => setIncomeForm({ ...incomeForm, headId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">Select Income Head...</option>
                    {incomeHeads.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="50000"
                    value={incomeForm.amount}
                    onChange={(e) => setIncomeForm({ ...incomeForm, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-black text-emerald-700 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Received From</label>
                  <input
                    type="text"
                    required
                    placeholder="Mumin Full Name"
                    value={incomeForm.receivedFrom}
                    onChange={(e) => setIncomeForm({ ...incomeForm, receivedFrom: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ITS Number</label>
                  <input
                    type="text"
                    placeholder="8-digit ITS"
                    value={incomeForm.itsNumber}
                    onChange={(e) => setIncomeForm({ ...incomeForm, itsNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Mode</label>
                  <select
                    value={incomeForm.paymentMode}
                    onChange={(e) => setIncomeForm({ ...incomeForm, paymentMode: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Bank Transfer">Bank Transfer / NEFT</option>
                    <option value="UPI">UPI</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Cash">Cash Vault</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ref / Cheque #</label>
                  <input
                    type="text"
                    placeholder="UTR / Cheque No"
                    value={incomeForm.referenceNo}
                    onChange={(e) => setIncomeForm({ ...incomeForm, referenceNo: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Credited Account</label>
                <select
                  value={incomeForm.bankAccountId}
                  onChange={(e) => setIncomeForm({ ...incomeForm, bankAccountId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-amber-500"
                >
                  <option value="HDFC Bank — General Jamaat A/C 9081">HDFC Bank — General Jamaat A/C 9081</option>
                  <option value="State Bank of India — FMB Kitchen A/C 3341">State Bank of India — FMB Kitchen A/C 3341</option>
                  <option value="Cash in Hand (Main Khazina)">Cash in Hand (Main Khazina)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Remarks / Purpose</label>
                <textarea
                  rows={2}
                  placeholder="Notes on receipt / barakat intentions..."
                  value={incomeForm.remarks}
                  onChange={(e) => setIncomeForm({ ...incomeForm, remarks: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowIncomeModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-lg cursor-pointer"
                >
                  Confirm & Generate Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ISSUE EXPENSE VOUCHER */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-rose-300 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <TrendingDown className="w-5 h-5 text-rose-600" />
                <span>Issue Authorized Expense Voucher</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowExpenseModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Expense Head</label>
                  <select
                    required
                    value={expenseForm.headId}
                    onChange={(e) => setExpenseForm({ ...expenseForm, headId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">Select Expense Head...</option>
                    {expenseHeads.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="25000"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-black text-rose-700 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Paid To / Payee Vendor</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Torrent Power Ltd / Burhani Hardware"
                  value={expenseForm.paidTo}
                  onChange={(e) => setExpenseForm({ ...expenseForm, paidTo: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Disbursed From</label>
                  <select
                    value={expenseForm.bankAccountId}
                    onChange={(e) => setExpenseForm({ ...expenseForm, bankAccountId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="HDFC Bank — General Jamaat A/C 9081">HDFC Bank — General Jamaat A/C 9081</option>
                    <option value="State Bank of India — FMB Kitchen A/C 3341">State Bank of India — FMB Kitchen A/C 3341</option>
                    <option value="Cash in Hand (Main Khazina)">Cash in Hand (Main Khazina)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Approved By</label>
                  <select
                    value={expenseForm.approvedBy}
                    onChange={(e) => setExpenseForm({ ...expenseForm, approvedBy: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-amber-900 focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Janab Amil Saheb">Janab Amil Saheb</option>
                    <option value="Mulla Shabbir Bhai Vasi (Treasurer)">Mulla Shabbir Bhai Vasi (Treasurer)</option>
                    <option value="Shk. Mufaddal Bhai Gulamali (Secretary)">Shk. Mufaddal Bhai Gulamali (Secretary)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Invoice / Bill Reference</label>
                  <input
                    type="text"
                    placeholder="INV-2026-99"
                    value={expenseForm.invoiceRef}
                    onChange={(e) => setExpenseForm({ ...expenseForm, invoiceRef: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Mode</label>
                  <select
                    value={expenseForm.paymentMode}
                    onChange={(e) => setExpenseForm({ ...expenseForm, paymentMode: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Bank Transfer">Bank Transfer / NEFT</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Cash">Cash Vault</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Narration / Bill Details</label>
                <textarea
                  rows={2}
                  placeholder="Details of repair, service or supply..."
                  value={expenseForm.remarks}
                  onChange={(e) => setExpenseForm({ ...expenseForm, remarks: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-lg cursor-pointer"
                >
                  Authorize & Issue Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: ACCOUNT CONTRA TRANSFER */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-blue-300 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <ArrowRightLeft className="w-5 h-5 text-blue-600" />
                <span>Internal Account Contra Transfer</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowTransferModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTransfer} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">From Account (Source)</label>
                  <select
                    value={transferForm.fromAccountId}
                    onChange={(e) => setTransferForm({ ...transferForm, fromAccountId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Cash in Hand (Main Khazina)">Cash in Hand (Main Khazina)</option>
                    <option value="HDFC Bank — General Jamaat A/C 9081">HDFC Bank — General Jamaat A/C 9081</option>
                    <option value="State Bank of India — FMB Kitchen A/C 3341">State Bank of India — FMB Kitchen A/C 3341</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">To Account (Destination)</label>
                  <select
                    value={transferForm.toAccountId}
                    onChange={(e) => setTransferForm({ ...transferForm, toAccountId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="HDFC Bank — General Jamaat A/C 9081">HDFC Bank — General Jamaat A/C 9081</option>
                    <option value="State Bank of India — FMB Kitchen A/C 3341">State Bank of India — FMB Kitchen A/C 3341</option>
                    <option value="Cash in Hand (Main Khazina)">Cash in Hand (Main Khazina)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Transfer Amount (₹)</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="50000"
                  value={transferForm.amount}
                  onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-black text-slate-900 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Bank Challan / Reference #</label>
                <input
                  type="text"
                  placeholder="DEP-CHALLAN-991"
                  value={transferForm.referenceNo}
                  onChange={(e) => setTransferForm({ ...transferForm, referenceNo: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Narration</label>
                <textarea
                  rows={2}
                  placeholder="Reason for fund re-allocation..."
                  value={transferForm.narration}
                  onChange={(e) => setTransferForm({ ...transferForm, narration: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-lg cursor-pointer"
                >
                  Post Contra Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: SET OPENING BALANCE */}
      {showOpeningModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-amber-300 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Wallet className="w-5 h-5 text-amber-600" />
                <span>Configure Account Opening Balance</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowOpeningModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOpening} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Account / Vault Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bank of Baroda — Corpus A/C"
                  value={openingForm.accountName}
                  onChange={(e) => setOpeningForm({ ...openingForm, accountName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Account Type</label>
                  <select
                    value={openingForm.accountType}
                    onChange={(e) => setOpeningForm({ ...openingForm, accountType: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Bank">Bank Account</option>
                    <option value="Cash">Cash Vault</option>
                    <option value="Corpus Fund">Corpus Fund</option>
                    <option value="Waqf Asset">Waqf Asset</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Opening Balance (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="1000000"
                    value={openingForm.openingBalance}
                    onChange={(e) => setOpeningForm({ ...openingForm, openingBalance: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-black text-slate-900 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Audit Notes / Verification Ref</label>
                <textarea
                  rows={2}
                  placeholder="Auditor certificate reference number..."
                  value={openingForm.notes}
                  onChange={(e) => setOpeningForm({ ...openingForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowOpeningModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#EAB308] hover:bg-[#D4AF37] text-[#0F172A] font-black rounded-lg cursor-pointer"
                >
                  Save Balance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECEIPT PRINT MODAL */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border-2 border-amber-300 space-y-4">
            <div className="text-center border-b border-amber-200 pb-3">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-widest">
                Anjuman-e-Saifee • Burhani Park
              </span>
              <h2 className="text-lg font-black text-slate-900 mt-0.5">Trust Income Receipt</h2>
              <p className="text-[11px] text-slate-500 font-mono">Receipt No: {selectedReceipt.receiptNo}</p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Date:</span>
                <span className="font-bold text-slate-900">{selectedReceipt.date}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Received From:</span>
                <span className="font-bold text-slate-900">{selectedReceipt.receivedFrom}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">ITS Number:</span>
                <span className="font-mono font-bold text-slate-900">{selectedReceipt.itsNumber}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Income Head:</span>
                <span className="font-bold text-amber-900">{selectedReceipt.headName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Payment Mode:</span>
                <span className="font-semibold text-slate-900">
                  {selectedReceipt.paymentMode} ({selectedReceipt.referenceNo})
                </span>
              </div>
              <div className="flex justify-between py-2 bg-amber-50 rounded px-2 mt-2">
                <span className="font-bold text-slate-800">Total Amount Received:</span>
                <span className="font-black text-emerald-800 text-sm">
                  ₹{selectedReceipt.amount.toLocaleString('en-IN')}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 italic text-center pt-2">
                "May Allah Ta'ala bless the donor with barakaat in rozi and aafiyat."
              </p>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print();
                  setSelectedReceipt(null);
                }}
                className="px-4 py-2 bg-[#EAB308] hover:bg-[#D4AF37] text-[#0F172A] font-black rounded-lg text-xs flex items-center space-x-1 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Document</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
