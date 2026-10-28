import React, { useState, useMemo } from 'react';
import {
  UserProfile,
  FinancialYear,
} from '../../types';
import {
  ChartOfAccount,
  FinancialVoucher,
  VoucherType,
  VoucherEntryItem,
  CHART_OF_ACCOUNTS_KEY,
  FINANCIAL_VOUCHERS_KEY,
  INITIAL_CHART_OF_ACCOUNTS,
  INITIAL_FINANCIAL_VOUCHERS,
  loadFromStorage,
  saveToStorage,
} from '../../utils/part3Management';
import { appendActivityLog } from '../../utils/rbac';
import {
  Calculator,
  Plus,
  Search,
  Printer,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  ArrowRightLeft,
  X,
  CreditCard,
  Briefcase,
  Layers,
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  TrendingUp,
} from 'lucide-react';

interface AccountsManagerModuleProps {
  currentUser: UserProfile;
  activeSubItemId: string;
  subItemLabel: string;
  financialYear: FinancialYear;
  showToast: (msg: string) => void;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export const AccountsManagerModule: React.FC<AccountsManagerModuleProps> = ({
  currentUser,
  activeSubItemId,
  financialYear,
  showToast,
  canAdd,
}) => {
  // Local state with localStorage synchronization
  const [accounts, setAccounts] = useState<ChartOfAccount[]>(() =>
    loadFromStorage(CHART_OF_ACCOUNTS_KEY, INITIAL_CHART_OF_ACCOUNTS)
  );
  const [vouchers, setVouchers] = useState<FinancialVoucher[]>(() =>
    loadFromStorage(FINANCIAL_VOUCHERS_KEY, INITIAL_FINANCIAL_VOUCHERS)
  );

  // Tab State
  const [activeTab, setActiveTab] = useState<string>(activeSubItemId);
  React.useEffect(() => {
    setActiveTab(activeSubItemId);
  }, [activeSubItemId]);

  // Modals & Forms
  const [isNewVoucherModalOpen, setIsNewVoucherModalOpen] = useState(false);
  const [isNewAccountModalOpen, setIsNewAccountModalOpen] = useState(false);
  const [selectedLedgerAccountId, setSelectedLedgerAccountId] = useState<string>(
    accounts[0]?.id || 'coa-102'
  );

  // New Voucher Form
  const [voucherType, setVoucherType] = useState<VoucherType>('PAYMENT');
  const [voucherDate, setVoucherDate] = useState(new Date().toISOString().split('T')[0]);
  const [referenceNo, setReferenceNo] = useState('');
  const [narration, setNarration] = useState('');
  const [entryRows, setEntryRows] = useState<VoucherEntryItem[]>([
    { accountId: accounts[0]?.id || '', accountName: accounts[0]?.name || '', debit: 0, credit: 0, narration: '' },
    { accountId: accounts[1]?.id || '', accountName: accounts[1]?.name || '', debit: 0, credit: 0, narration: '' },
  ]);

  // New Account Form
  const [newAccForm, setNewAccForm] = useState({
    code: '',
    name: '',
    type: 'EXPENSE' as ChartOfAccount['type'],
    group: 'Operating Expense',
    openingBalance: 0,
    description: '',
  });

  // Calculate Voucher Totals & Validation
  const voucherMath = useMemo(() => {
    const totalDebit = entryRows.reduce((acc, r) => acc + Number(r.debit || 0), 0);
    const totalCredit = entryRows.reduce((acc, r) => acc + Number(r.credit || 0), 0);
    const isBalanced = totalDebit === totalCredit && totalDebit > 0;
    const difference = Math.abs(totalDebit - totalCredit);
    return { totalDebit, totalCredit, isBalanced, difference };
  }, [entryRows]);

  // Overall Financial Totals
  const accountingSummary = useMemo(() => {
    const totalAssets = accounts
      .filter((a) => a.type === 'ASSET')
      .reduce((acc, a) => acc + a.currentBalance, 0);
    const totalLiabilities = accounts
      .filter((a) => a.type === 'LIABILITY')
      .reduce((acc, a) => acc + a.currentBalance, 0);
    const totalIncome = accounts
      .filter((a) => a.type === 'INCOME')
      .reduce((acc, a) => acc + a.currentBalance, 0);
    const totalExpenses = accounts
      .filter((a) => a.type === 'EXPENSE')
      .reduce((acc, a) => acc + a.currentBalance, 0);
    const netSurplus = totalIncome - totalExpenses;
    return { totalAssets, totalLiabilities, totalIncome, totalExpenses, netSurplus };
  }, [accounts]);

  // Handle Double-Entry Voucher Creation
  const handleCreateVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAdd) {
      showToast('Access Denied: You do not have permission to post vouchers');
      return;
    }
    if (!voucherMath.isBalanced) {
      showToast('Voucher Error: Total Debit must equal Total Credit!');
      return;
    }

    const typePrefix =
      voucherType === 'RECEIPT'
        ? 'VR'
        : voucherType === 'PAYMENT'
        ? 'VP'
        : voucherType === 'CONTRA'
        ? 'VC'
        : 'VJ';
    const voucherNo = `${typePrefix}-1447-${String(vouchers.length + 1).padStart(3, '0')}`;

    const newVoucher: FinancialVoucher = {
      id: `vch-${Date.now()}`,
      voucherNo,
      voucherType,
      date: voucherDate,
      financialYear,
      referenceNo,
      narration,
      totalAmount: voucherMath.totalDebit,
      createdBy: currentUser.username,
      isApproved: true,
      entries: entryRows.map((r) => ({
        ...r,
        debit: Number(r.debit || 0),
        credit: Number(r.credit || 0),
      })),
    };

    // Update affected account current balances
    const updatedAccounts = accounts.map((acc) => {
      let balanceChange = 0;
      entryRows.forEach((r) => {
        if (r.accountId === acc.id) {
          const deb = Number(r.debit || 0);
          const cred = Number(r.credit || 0);
          if (acc.type === 'ASSET' || acc.type === 'EXPENSE') {
            balanceChange += deb - cred;
          } else {
            // LIABILITY or INCOME
            balanceChange += cred - deb;
          }
        }
      });
      return balanceChange !== 0 ? { ...acc, currentBalance: acc.currentBalance + balanceChange } : acc;
    });

    const updatedVouchers = [newVoucher, ...vouchers];
    setVouchers(updatedVouchers);
    setAccounts(updatedAccounts);
    saveToStorage(FINANCIAL_VOUCHERS_KEY, updatedVouchers);
    saveToStorage(CHART_OF_ACCOUNTS_KEY, updatedAccounts);

    appendActivityLog(
      currentUser.username,
      'Accounts Manager',
      'Voucher Entry',
      'ADD',
      `Posted ${voucherType} voucher ${voucherNo} for ₹${voucherMath.totalDebit} with ${entryRows.length} entries`
    );

    showToast(`Voucher ${voucherNo} posted and ledger updated!`);
    setIsNewVoucherModalOpen(false);
  };

  // Add Row to Voucher
  const handleAddVoucherRow = () => {
    setEntryRows([
      ...entryRows,
      {
        accountId: accounts[0]?.id || '',
        accountName: accounts[0]?.name || '',
        debit: 0,
        credit: 0,
        narration: '',
      },
    ]);
  };

  // Remove Row
  const handleRemoveVoucherRow = (idx: number) => {
    if (entryRows.length <= 2) {
      showToast('A double-entry voucher must have at least 2 lines.');
      return;
    }
    setEntryRows(entryRows.filter((_, i) => i !== idx));
  };

  // Handle New Account creation
  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccForm.code || !newAccForm.name) {
      showToast('Please specify account code and name');
      return;
    }
    const newAcc: ChartOfAccount = {
      id: `coa-${Date.now()}`,
      code: newAccForm.code,
      name: newAccForm.name,
      type: newAccForm.type,
      group: newAccForm.group,
      openingBalance: Number(newAccForm.openingBalance),
      currentBalance: Number(newAccForm.openingBalance),
      description: newAccForm.description,
      isSystem: false,
    };
    const updated = [...accounts, newAcc];
    setAccounts(updated);
    saveToStorage(CHART_OF_ACCOUNTS_KEY, updated);

    showToast(`Account [${newAcc.code}] ${newAcc.name} created!`);
    setIsNewAccountModalOpen(false);
  };

  // Selected Ledger Postings calculation
  const selectedLedger = useMemo(() => {
    const acc = accounts.find((a) => a.id === selectedLedgerAccountId) || accounts[0];
    if (!acc) return { account: null, postings: [], openingBal: 0, closingBal: 0 };

    let running = acc.openingBalance;
    const postings: Array<{
      date: string;
      voucherNo: string;
      narration: string;
      debit: number;
      credit: number;
      runningBalance: number;
    }> = [];

    vouchers.forEach((vch) => {
      vch.entries.forEach((e) => {
        if (e.accountId === acc.id) {
          if (acc.type === 'ASSET' || acc.type === 'EXPENSE') {
            running += e.debit - e.credit;
          } else {
            running += e.credit - e.debit;
          }
          postings.push({
            date: vch.date,
            voucherNo: vch.voucherNo,
            narration: e.narration || vch.narration,
            debit: e.debit,
            credit: e.credit,
            runningBalance: running,
          });
        }
      });
    });

    return {
      account: acc,
      postings,
      openingBal: acc.openingBalance,
      closingBal: acc.currentBalance,
    };
  }, [accounts, vouchers, selectedLedgerAccountId]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-700/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                Double-Entry Ledger Engine
              </span>
              <span className="text-xs text-slate-300">GAAP / Shariah Audited Accounting</span>
            </div>
            <h1 className="text-2xl font-black mt-1 tracking-tight text-white flex items-center gap-2">
              <Calculator className="w-7 h-7 text-blue-400" />
              General Accounts & Finance Management
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Strict double-entry journal vouchers, real-time cash and bank transaction books, and auto-generated Trial Balance, P&L, and Balance Sheet.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {canAdd && (
              <button
                type="button"
                onClick={() => setIsNewVoucherModalOpen(true)}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg transition-all transform active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                New Voucher Entry
              </button>
            )}
          </div>
        </div>

        {/* 4 Financial KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-700/60">
          <div className="bg-white/10 backdrop-blur-sm p-3.5 rounded-xl border border-white/10">
            <span className="text-[11px] text-slate-300 uppercase font-semibold">Total Assets</span>
            <p className="text-xl font-black text-white mt-0.5">₹{accountingSummary.totalAssets.toLocaleString()}</p>
            <span className="text-[10px] text-blue-300">Bank, Cash & Fixed Assets</span>
          </div>

          <div className="bg-white/10 backdrop-blur-sm p-3.5 rounded-xl border border-white/10">
            <span className="text-[11px] text-slate-300 uppercase font-semibold">Total Liabilities</span>
            <p className="text-xl font-black text-amber-300 mt-0.5">₹{accountingSummary.totalLiabilities.toLocaleString()}</p>
            <span className="text-[10px] text-amber-200/80">Corpus & Special Funds</span>
          </div>

          <div className="bg-white/10 backdrop-blur-sm p-3.5 rounded-xl border border-white/10">
            <span className="text-[11px] text-slate-300 uppercase font-semibold">Total Income YTD</span>
            <p className="text-xl font-black text-emerald-300 mt-0.5">₹{accountingSummary.totalIncome.toLocaleString()}</p>
            <span className="text-[10px] text-emerald-200/80">Hub, Sabeel & Wajebaat</span>
          </div>

          <div className="bg-white/10 backdrop-blur-sm p-3.5 rounded-xl border border-white/10">
            <span className="text-[11px] text-slate-300 uppercase font-semibold">Net Operating Surplus</span>
            <p className="text-xl font-black text-cyan-300 mt-0.5">₹{accountingSummary.netSurplus.toLocaleString()}</p>
            <span className="text-[10px] text-cyan-200/80">Revenue minus Expenditures</span>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs">
        {[
          { id: 'accounts-voucher-entry', label: 'Voucher Entry Register', count: vouchers.length },
          { id: 'accounts-chart', label: 'Chart of Accounts', count: accounts.length },
          { id: 'accounts-cash-bank-book', label: 'Cash & Bank Book' },
          { id: 'accounts-general-ledger', label: 'General Ledger' },
          { id: 'accounts-trial-balance', label: 'Trial Balance' },
          { id: 'accounts-financial-statements', label: 'Financial Statements (P&L / BS)' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === tab.id
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTab === tab.id ? 'bg-slate-700 text-slate-100' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: VOUCHER ENTRY REGISTER */}
      {/* ========================================================================= */}
      {activeTab === 'accounts-voucher-entry' && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                Financial Voucher Postings Register
              </h3>
              <p className="text-xs text-slate-500">Chronological journal of Receipt, Payment, Contra, and Journal vouchers</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Voucher No & Date</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Reference & Narration</th>
                  <th className="p-3 text-right">Debit / Credit Amount</th>
                  <th className="p-3">Double-Entry Breakdown</th>
                  <th className="p-3 text-center">Audited</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vouchers.map((vch) => (
                  <tr key={vch.id} className="hover:bg-slate-50/80">
                    <td className="p-3">
                      <span className="font-mono font-bold text-slate-900">{vch.voucherNo}</span>
                      <div className="text-[10px] text-slate-400 mt-0.5">{vch.date}</div>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          vch.voucherType === 'RECEIPT'
                            ? 'bg-emerald-100 text-emerald-800'
                            : vch.voucherType === 'PAYMENT'
                            ? 'bg-rose-100 text-rose-800'
                            : vch.voucherType === 'CONTRA'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {vch.voucherType}
                      </span>
                    </td>
                    <td className="p-3">
                      {vch.referenceNo && (
                        <span className="text-[10px] font-mono text-slate-500 block font-semibold">
                          Ref: {vch.referenceNo}
                        </span>
                      )}
                      <span className="text-slate-800">{vch.narration}</span>
                    </td>
                    <td className="p-3 text-right font-bold text-slate-900 font-mono text-sm">
                      ₹{vch.totalAmount.toLocaleString()}
                    </td>
                    <td className="p-3 text-[11px] space-y-1">
                      {vch.entries.map((entry, idx) => (
                        <div key={idx} className="flex justify-between text-[10px] font-mono">
                          <span className="text-slate-600 truncate max-w-[180px]">{entry.accountName}</span>
                          <span className={entry.debit > 0 ? 'text-blue-700 font-bold' : 'text-slate-500'}>
                            {entry.debit > 0 ? `Dr: ₹${entry.debit.toLocaleString()}` : `Cr: ₹${entry.credit.toLocaleString()}`}
                          </span>
                        </div>
                      ))}
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Posted
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CHART OF ACCOUNTS */}
      {/* ========================================================================= */}
      {activeTab === 'accounts-chart' && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                Chart of Accounts Master Hierarchy
              </h3>
              <p className="text-xs text-slate-500">Categorized tree of Assets, Liabilities, Income, and Expense heads</p>
            </div>
            {canAdd && (
              <button
                type="button"
                onClick={() => setIsNewAccountModalOpen(true)}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Account Head
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(['ASSET', 'LIABILITY', 'INCOME', 'EXPENSE'] as const).map((accType) => {
              const list = accounts.filter((a) => a.type === accType);
              const sum = list.reduce((acc, a) => acc + a.currentBalance, 0);
              const badgeColor =
                accType === 'ASSET'
                  ? 'bg-blue-100 text-blue-900'
                  : accType === 'LIABILITY'
                  ? 'bg-amber-100 text-amber-900'
                  : accType === 'INCOME'
                  ? 'bg-emerald-100 text-emerald-900'
                  : 'bg-rose-100 text-rose-900';

              return (
                <div key={accType} className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeColor}`}>
                      {accType}S ({list.length})
                    </span>
                    <span className="font-bold text-xs text-slate-800 font-mono">
                      ₹{sum.toLocaleString()}
                    </span>
                  </div>

                  <div className="divide-y divide-slate-200/80 max-h-96 overflow-y-auto">
                    {list.map((item) => (
                      <div key={item.id} className="py-2.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] text-slate-500">{item.code}</span>
                          <span className="font-bold text-slate-900 font-mono">
                            ₹{item.currentBalance.toLocaleString()}
                          </span>
                        </div>
                        <div className="font-semibold text-slate-800 mt-0.5">{item.name}</div>
                        <div className="text-[10px] text-slate-400">{item.group}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CASH & BANK BOOK */}
      {/* ========================================================================= */}
      {activeTab === 'accounts-cash-bank-book' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cash in Safe */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  Office Cash Book (Vault 01)
                </h3>
                <span className="font-mono font-bold text-emerald-700 text-sm">
                  ₹
                  {accounts
                    .find((a) => a.code === '1010')
                    ?.currentBalance.toLocaleString() || '0'}
                </span>
              </div>
              <p className="text-xs text-slate-500">Live petty cash and counter payments register</p>
              <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto text-xs">
                {vouchers
                  .filter((v) => v.entries.some((e) => e.accountId === 'coa-101'))
                  .map((v) => {
                    const entry = v.entries.find((e) => e.accountId === 'coa-101')!;
                    return (
                      <div key={v.id} className="py-2 flex justify-between items-center">
                        <div>
                          <span className="font-bold text-slate-800">{v.narration}</span>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            {v.voucherNo} • {v.date}
                          </span>
                        </div>
                        <span
                          className={`font-mono font-bold ${
                            entry.debit > 0 ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {entry.debit > 0 ? `+₹${entry.debit.toLocaleString()}` : `-₹${entry.credit.toLocaleString()}`}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Bank Book */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  Burhani Bank Operating Book
                </h3>
                <span className="font-mono font-bold text-blue-700 text-sm">
                  ₹
                  {accounts
                    .find((a) => a.code === '1020')
                    ?.currentBalance.toLocaleString() || '0'}
                </span>
              </div>
              <p className="text-xs text-slate-500">Clearing account with electronic transfers & cheques</p>
              <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto text-xs">
                {vouchers
                  .filter((v) => v.entries.some((e) => e.accountId === 'coa-102'))
                  .map((v) => {
                    const entry = v.entries.find((e) => e.accountId === 'coa-102')!;
                    return (
                      <div key={v.id} className="py-2 flex justify-between items-center">
                        <div>
                          <span className="font-bold text-slate-800">{v.narration}</span>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            {v.voucherNo} • {v.date}
                          </span>
                        </div>
                        <span
                          className={`font-mono font-bold ${
                            entry.debit > 0 ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {entry.debit > 0 ? `+₹${entry.debit.toLocaleString()}` : `-₹${entry.credit.toLocaleString()}`}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: GENERAL LEDGER */}
      {/* ========================================================================= */}
      {activeTab === 'accounts-general-ledger' && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                General Ledger Posting Statement
              </h3>
              <p className="text-xs text-slate-500">Select any account head to examine chronological double-entry postings</p>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-700">Account Head:</label>
              <select
                value={selectedLedgerAccountId}
                onChange={(e) => setSelectedLedgerAccountId(e.target.value)}
                className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 font-bold"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    [{a.code}] {a.name} ({a.type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedLedger.account && (
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl flex justify-between text-xs font-semibold border border-slate-200">
                <span>Opening Balance: ₹{selectedLedger.openingBal.toLocaleString()}</span>
                <span className="font-bold text-slate-900 font-mono">
                  Closing Balance: ₹{selectedLedger.closingBal.toLocaleString()}
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Date</th>
                      <th className="p-3">Voucher No</th>
                      <th className="p-3">Narration</th>
                      <th className="p-3 text-right">Debit (Dr)</th>
                      <th className="p-3 text-right">Credit (Cr)</th>
                      <th className="p-3 text-right">Running Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedLedger.postings.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-slate-400">
                          No transactions posted to this account head yet.
                        </td>
                      </tr>
                    ) : (
                      selectedLedger.postings.map((p, i) => (
                        <tr key={i} className="hover:bg-slate-50/80">
                          <td className="p-3 font-mono">{p.date}</td>
                          <td className="p-3 font-mono font-bold text-blue-700">{p.voucherNo}</td>
                          <td className="p-3 text-slate-800">{p.narration}</td>
                          <td className="p-3 text-right font-mono font-bold text-blue-700">
                            {p.debit > 0 ? `₹${p.debit.toLocaleString()}` : '—'}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-rose-700">
                            {p.credit > 0 ? `₹${p.credit.toLocaleString()}` : '—'}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-slate-900">
                            ₹{p.runningBalance.toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: TRIAL BALANCE */}
      {/* ========================================================================= */}
      {activeTab === 'accounts-trial-balance' && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Mathematical Trial Balance Sheet
              </h3>
              <p className="text-xs text-slate-500">Validation of double-entry ledger equilibrium for {financialYear}</p>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Trial Balance
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Account Code</th>
                  <th className="p-3">Account Title</th>
                  <th className="p-3">Classification</th>
                  <th className="p-3 text-right">Debit Balance (₹)</th>
                  <th className="p-3 text-right">Credit Balance (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {accounts.map((acc) => {
                  const isDebitNature = acc.type === 'ASSET' || acc.type === 'EXPENSE';
                  return (
                    <tr key={acc.id} className="hover:bg-slate-50/80">
                      <td className="p-3 font-mono text-slate-600">{acc.code}</td>
                      <td className="p-3 font-bold text-slate-900">{acc.name}</td>
                      <td className="p-3">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 font-semibold text-slate-700">
                          {acc.type}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-800">
                        {isDebitNature ? `₹${acc.currentBalance.toLocaleString()}` : '—'}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-800">
                        {!isDebitNature ? `₹${acc.currentBalance.toLocaleString()}` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                <tr>
                  <td colSpan={3} className="p-3 text-right uppercase">
                    Total Equilibrium:
                  </td>
                  <td className="p-3 text-right font-mono text-blue-800 text-sm">
                    ₹
                    {accounts
                      .filter((a) => a.type === 'ASSET' || a.type === 'EXPENSE')
                      .reduce((acc, a) => acc + a.currentBalance, 0)
                      .toLocaleString()}
                  </td>
                  <td className="p-3 text-right font-mono text-blue-800 text-sm">
                    ₹
                    {accounts
                      .filter((a) => a.type === 'LIABILITY' || a.type === 'INCOME')
                      .reduce((acc, a) => acc + a.currentBalance, 0)
                      .toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: FINANCIAL STATEMENTS (P&L AND BALANCE SHEET) */}
      {/* ========================================================================= */}
      {activeTab === 'accounts-financial-statements' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Income & Expenditure Statement */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                Income & Expenditure Statement (P&L)
              </h3>
              <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                Surplus: ₹{accountingSummary.netSurplus.toLocaleString()}
              </span>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <span className="font-bold text-slate-700 block mb-1 uppercase text-[10px] tracking-wider">
                  Revenues & Contributions
                </span>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {accounts
                    .filter((a) => a.type === 'INCOME')
                    .map((item) => (
                      <div key={item.id} className="p-2.5 flex justify-between bg-slate-50/50">
                        <span>{item.name}</span>
                        <span className="font-bold font-mono text-slate-900">
                          ₹{item.currentBalance.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  <div className="p-2.5 flex justify-between bg-emerald-50 font-bold text-emerald-900">
                    <span>Total Income</span>
                    <span className="font-mono">₹{accountingSummary.totalIncome.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-700 block mb-1 uppercase text-[10px] tracking-wider">
                  Operational Expenditures
                </span>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {accounts
                    .filter((a) => a.type === 'EXPENSE')
                    .map((item) => (
                      <div key={item.id} className="p-2.5 flex justify-between bg-slate-50/50">
                        <span>{item.name}</span>
                        <span className="font-bold font-mono text-slate-900">
                          ₹{item.currentBalance.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  <div className="p-2.5 flex justify-between bg-rose-50 font-bold text-rose-900">
                    <span>Total Expenses</span>
                    <span className="font-mono">₹{accountingSummary.totalExpenses.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Balance Sheet */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-blue-600" />
                Consolidated Balance Sheet
              </h3>
              <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                As on Current Date
              </span>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <span className="font-bold text-slate-700 block mb-1 uppercase text-[10px] tracking-wider">
                  Assets & Properties
                </span>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {accounts
                    .filter((a) => a.type === 'ASSET')
                    .map((item) => (
                      <div key={item.id} className="p-2.5 flex justify-between bg-slate-50/50">
                        <span>{item.name}</span>
                        <span className="font-bold font-mono text-slate-900">
                          ₹{item.currentBalance.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  <div className="p-2.5 flex justify-between bg-blue-50 font-bold text-blue-900">
                    <span>Total Assets</span>
                    <span className="font-mono">₹{accountingSummary.totalAssets.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-700 block mb-1 uppercase text-[10px] tracking-wider">
                  Liabilities & Fund Balances
                </span>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {accounts
                    .filter((a) => a.type === 'LIABILITY')
                    .map((item) => (
                      <div key={item.id} className="p-2.5 flex justify-between bg-slate-50/50">
                        <span>{item.name}</span>
                        <span className="font-bold font-mono text-slate-900">
                          ₹{item.currentBalance.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  <div className="p-2.5 flex justify-between bg-amber-50 font-bold text-amber-900">
                    <span>Total Liabilities & Corpus</span>
                    <span className="font-mono">₹{accountingSummary.totalLiabilities.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NEW VOUCHER ENTRY */}
      {/* ========================================================================= */}
      {isNewVoucherModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Calculator className="w-5 h-5 text-blue-600" />
                Post Double-Entry Financial Voucher
              </h3>
              <button
                type="button"
                onClick={() => setIsNewVoucherModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateVoucher} className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Voucher Type *</label>
                  <select
                    value={voucherType}
                    onChange={(e) => setVoucherType(e.target.value as VoucherType)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-bold text-slate-900"
                  >
                    <option value="PAYMENT">Payment Voucher</option>
                    <option value="RECEIPT">Receipt Voucher</option>
                    <option value="CONTRA">Contra (Bank / Cash)</option>
                    <option value="JOURNAL">Journal Voucher</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Voucher Date *</label>
                  <input
                    type="date"
                    required
                    value={voucherDate}
                    onChange={(e) => setVoucherDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cheque / Bill Ref</label>
                  <input
                    type="text"
                    placeholder="e.g. CHQ-449102"
                    value={referenceNo}
                    onChange={(e) => setReferenceNo(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">General Narration *</label>
                <input
                  type="text"
                  required
                  placeholder="Detail the financial transaction reason..."
                  value={narration}
                  onChange={(e) => setNarration(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50"
                />
              </div>

              {/* Multi-line Entry Table */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800">Double-Entry Posting Lines</span>
                  <button
                    type="button"
                    onClick={handleAddVoucherRow}
                    className="text-blue-600 hover:text-blue-700 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Row
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">Account Head</th>
                        <th className="p-2.5 text-right w-28">Debit (₹)</th>
                        <th className="p-2.5 text-right w-28">Credit (₹)</th>
                        <th className="p-2.5 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {entryRows.map((row, idx) => (
                        <tr key={idx}>
                          <td className="p-2">
                            <select
                              value={row.accountId}
                              onChange={(e) => {
                                const acc = accounts.find((a) => a.id === e.target.value);
                                const updated = [...entryRows];
                                updated[idx].accountId = e.target.value;
                                updated[idx].accountName = acc ? acc.name : '';
                                setEntryRows(updated);
                              }}
                              className="w-full px-2 py-1.5 border border-slate-200 rounded-lg bg-slate-50"
                            >
                              {accounts.map((a) => (
                                <option key={a.id} value={a.id}>
                                  [{a.code}] {a.name} ({a.type})
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min={0}
                              value={row.debit || ''}
                              onChange={(e) => {
                                const updated = [...entryRows];
                                updated[idx].debit = Number(e.target.value);
                                if (Number(e.target.value) > 0) updated[idx].credit = 0;
                                setEntryRows(updated);
                              }}
                              className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-right font-mono font-bold"
                              placeholder="0"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min={0}
                              value={row.credit || ''}
                              onChange={(e) => {
                                const updated = [...entryRows];
                                updated[idx].credit = Number(e.target.value);
                                if (Number(e.target.value) > 0) updated[idx].debit = 0;
                                setEntryRows(updated);
                              }}
                              className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-right font-mono font-bold"
                              placeholder="0"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveVoucherRow(idx)}
                              className="text-slate-400 hover:text-rose-600 cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                      <tr>
                        <td className="p-2.5 text-right">Totals:</td>
                        <td className="p-2.5 text-right font-mono text-blue-700">
                          ₹{voucherMath.totalDebit.toLocaleString()}
                        </td>
                        <td className="p-2.5 text-right font-mono text-rose-700">
                          ₹{voucherMath.totalCredit.toLocaleString()}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Balance Indicator */}
                <div
                  className={`p-2.5 rounded-xl text-xs flex items-center justify-between font-semibold ${
                    voucherMath.isBalanced
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    {voucherMath.isBalanced ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                    )}
                    <span>
                      {voucherMath.isBalanced
                        ? 'Voucher is balanced! (Debit = Credit)'
                        : `Out of balance by ₹${voucherMath.difference.toLocaleString()}`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewVoucherModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!voucherMath.isBalanced}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-md cursor-pointer"
                >
                  Post Voucher Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NEW ACCOUNT HEAD */}
      {/* ========================================================================= */}
      {isNewAccountModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                Add Account Head
              </h3>
              <button
                type="button"
                onClick={() => setIsNewAccountModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Account Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 4070"
                    value={newAccForm.code}
                    onChange={(e) => setNewAccForm({ ...newAccForm, code: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Account Classification *</label>
                  <select
                    value={newAccForm.type}
                    onChange={(e) => setNewAccForm({ ...newAccForm, type: e.target.value as ChartOfAccount['type'] })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-bold"
                  >
                    <option value="ASSET">ASSET</option>
                    <option value="LIABILITY">LIABILITY</option>
                    <option value="INCOME">INCOME</option>
                    <option value="EXPENSE">EXPENSE</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Account Title / Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Water Tanker AMC Charges"
                  value={newAccForm.name}
                  onChange={(e) => setNewAccForm({ ...newAccForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Group Classification</label>
                <input
                  type="text"
                  value={newAccForm.group}
                  onChange={(e) => setNewAccForm({ ...newAccForm, group: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewAccountModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md cursor-pointer"
                >
                  Save Account Head
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
