import React, { useState, useMemo } from 'react';
import {
  Layers, Plus, Search, Filter, Download, Receipt, CreditCard,
  CheckCircle2, X, AlertCircle, Ban, Printer, FileSpreadsheet,
  Calendar, User, ArrowUpRight, TrendingUp, Sparkles, Building2, Shield
} from 'lucide-react';
import { UserProfile, FinancialYear } from '../../types';
import {
  SchemeName, ALL_SCHEMES, SchemeCategory, SchemeTakhmeen, SchemeReceipt, PaymentMode,
  getStoredSchemeCategories, saveStoredSchemeCategories,
  getStoredSchemeTakhmeens, saveStoredSchemeTakhmeens,
  getStoredSchemeReceipts, saveStoredSchemeReceipts
} from '../../utils/part2bManagement';
import { getStoredHofs } from '../../utils/memberMaster';
import { appendActivityLog } from '../../utils/rbac';

export type SchemeSubTab =
  | 'scheme-category-master'
  | 'scheme-takhmeen-master'
  | 'scheme-payment-entry'
  | 'scheme-outstanding-report'
  | 'scheme-ledger-report'
  | 'scheme-cancelled-receipts';

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

export const CommunitySchemesModule: React.FC<Props> = ({
  currentUser,
  activeSubItemId,
  financialYear,
  showToast,
  canAdd,
  canDelete,
}) => {
  const [selectedScheme, setSelectedScheme] = useState<SchemeName>('Taher Scheme');
  const [categories, setCategories] = useState<SchemeCategory[]>(() => getStoredSchemeCategories());
  const [takhmeens, setTakhmeens] = useState<SchemeTakhmeen[]>(() => getStoredSchemeTakhmeens());
  const [receipts, setReceipts] = useState<SchemeReceipt[]>(() => getStoredSchemeReceipts());
  const [hofs] = useState(() => getStoredHofs());

  const [activeTab, setActiveTab] = useState<SchemeSubTab>(() => {
    return (activeSubItemId as SchemeSubTab) || 'scheme-takhmeen-master';
  });

  React.useEffect(() => {
    if (activeSubItemId) setActiveTab(activeSubItemId as SchemeSubTab);
  }, [activeSubItemId]);

  // Modal States
  const [showCatModal, setShowCatModal] = useState(false);
  const [editingCat, setEditingCat] = useState<SchemeCategory | null>(null);
  const [catForm, setCatForm] = useState({ name: '', code: '', suggestedTakhmeen: 15000, description: '', isActive: true });

  const [showTakhmeenModal, setShowTakhmeenModal] = useState(false);
  const [takhmeenForm, setTakhmeenForm] = useState({
    itsNumber: '',
    hofName: '',
    mohallahName: 'Saifee Mohalla',
    categoryCode: '',
    committedAmount: 25000,
  });

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellingReceipt, setCancellingReceipt] = useState<SchemeReceipt | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const [selectedReceiptForPrint, setSelectedReceiptForPrint] = useState<SchemeReceipt | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [schemeScopeFilter, setSchemeScopeFilter] = useState<string>('CURRENT'); // 'CURRENT' or 'ALL'

  // Payment Entry State
  const [paymentForm, setPaymentForm] = useState({
    takhmeenId: '',
    itsNumber: '',
    hofName: '',
    amount: 5000,
    paymentMode: 'Cash' as PaymentMode,
    transactionRef: '',
    date: new Date().toISOString().split('T')[0],
  });

  // Filtered lists for the active scheme (or all)
  const schemeCategories = useMemo(() => {
    return categories.filter(c => c.schemeName === selectedScheme);
  }, [categories, selectedScheme]);

  const schemeTakhmeens = useMemo(() => {
    return takhmeens.filter(t => t.schemeName === selectedScheme);
  }, [takhmeens, selectedScheme]);

  const schemeReceipts = useMemo(() => {
    return receipts.filter(r => r.schemeName === selectedScheme);
  }, [receipts, selectedScheme]);

  const activeSchemeReceipts = useMemo(() => schemeReceipts.filter(r => !r.isCancelled), [schemeReceipts]);
  const cancelledSchemeReceipts = useMemo(() => schemeReceipts.filter(r => r.isCancelled), [schemeReceipts]);

  // Metrics for Current Scheme
  const totalCommitted = useMemo(() => schemeTakhmeens.reduce((acc, t) => acc + t.committedAmount, 0), [schemeTakhmeens]);
  const totalPaid = useMemo(() => schemeTakhmeens.reduce((acc, t) => acc + t.paidAmount, 0), [schemeTakhmeens]);
  const totalBalance = useMemo(() => schemeTakhmeens.reduce((acc, t) => acc + t.balanceAmount, 0), [schemeTakhmeens]);
  const recoveryRate = totalCommitted > 0 ? Math.round((totalPaid / totalCommitted) * 100) : 0;

  // Handle ITS Autocomplete on Takhmeen Modal
  const handleItsLookupTakhmeen = (its: string) => {
    const found = hofs.find(h => h.itsNumber === its);
    setTakhmeenForm(prev => ({
      ...prev,
      itsNumber: its,
      hofName: found ? found.fullName : prev.hofName,
      mohallahName: found ? found.mohallahName : prev.mohallahName,
    }));
  };

  // Submit New Takhmeen
  const handleSaveTakhmeen = (e: React.FormEvent) => {
    e.preventDefault();
    if (!takhmeenForm.hofName || !takhmeenForm.itsNumber || takhmeenForm.committedAmount <= 0) {
      showToast('Please enter valid ITS, Name, and commitment amount');
      return;
    }

    const newT: SchemeTakhmeen = {
      id: `st-${Date.now()}`,
      schemeName: selectedScheme,
      categoryCode: takhmeenForm.categoryCode || schemeCategories[0]?.code || 'STD',
      itsNumber: takhmeenForm.itsNumber,
      hofName: takhmeenForm.hofName,
      mohallahName: takhmeenForm.mohallahName,
      financialYear,
      committedAmount: Number(takhmeenForm.committedAmount),
      paidAmount: 0,
      balanceAmount: Number(takhmeenForm.committedAmount),
      status: 'Pledged',
      createdAt: new Date().toISOString().split('T')[0],
    };

    const updated = [newT, ...takhmeens];
    setTakhmeens(updated);
    saveStoredSchemeTakhmeens(updated);

    appendActivityLog(
      currentUser.username,
      'Community Schemes',
      'Takhmeen Master',
      'ADD',
      `Registered new ${selectedScheme} pledge of ${fmtINR(newT.committedAmount)} for ${newT.hofName} (ITS ${newT.itsNumber})`
    );

    showToast(`Pledge for ${newT.hofName} registered in ${selectedScheme}!`);
    setShowTakhmeenModal(false);
  };

  // Select Takhmeen for Payment
  const handleSelectTakhmeenForPayment = (t: SchemeTakhmeen) => {
    setPaymentForm(prev => ({
      ...prev,
      takhmeenId: t.id,
      itsNumber: t.itsNumber,
      hofName: t.hofName,
      amount: t.balanceAmount > 0 ? t.balanceAmount : 5000,
    }));
    setActiveTab('scheme-payment-entry');
  };

  // Submit Payment Entry
  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentForm.takhmeenId || paymentForm.amount <= 0) {
      showToast('Please select an active member commitment and enter valid amount');
      return;
    }

    const recNo = `SCH-1447-${String(receipts.length + 1).padStart(3, '0')}`;
    const newR: SchemeReceipt = {
      id: `srec-${Date.now()}`,
      receiptNo: recNo,
      takhmeenId: paymentForm.takhmeenId,
      schemeName: selectedScheme,
      itsNumber: paymentForm.itsNumber,
      hofName: paymentForm.hofName,
      amount: Number(paymentForm.amount),
      paymentMode: paymentForm.paymentMode,
      transactionRef: paymentForm.transactionRef,
      date: paymentForm.date,
      financialYear,
      collectedBy: currentUser.username,
      isCancelled: false,
    };

    // Update Takhmeen ledger
    const updatedTakhmeens = takhmeens.map(t => {
      if (t.id === paymentForm.takhmeenId) {
        const newPaid = t.paidAmount + newR.amount;
        const newBal = Math.max(0, t.committedAmount - newPaid);
        return {
          ...t,
          paidAmount: newPaid,
          balanceAmount: newBal,
          status: (newBal === 0 ? 'Settled' : 'Partially Paid') as 'Settled' | 'Partially Paid',
        };
      }
      return t;
    });

    const updatedReceipts = [newR, ...receipts];
    setTakhmeens(updatedTakhmeens);
    saveStoredSchemeTakhmeens(updatedTakhmeens);
    setReceipts(updatedReceipts);
    saveStoredSchemeReceipts(updatedReceipts);

    setSelectedReceiptForPrint(newR);

    appendActivityLog(
      currentUser.username,
      'Community Schemes',
      'Payment Entry',
      'PAYMENT',
      `Issued ${selectedScheme} receipt #${recNo} of ${fmtINR(newR.amount)} for ${newR.hofName}`
    );

    showToast(`Receipt #${recNo} generated for ${selectedScheme}!`);
  };

  // Cancel Receipt
  const handleConfirmCancel = () => {
    if (!cancellingReceipt || !cancelReason) {
      showToast('Cancellation reason required');
      return;
    }

    const updatedReceipts = receipts.map(r => {
      if (r.id === cancellingReceipt.id) {
        return {
          ...r,
          isCancelled: true,
          cancelledAt: new Date().toISOString().split('T')[0],
          cancelledBy: currentUser.username,
          cancellationReason: cancelReason,
        };
      }
      return r;
    });

    // Revert Takhmeen paid balance
    const updatedTakhmeens = takhmeens.map(t => {
      if (t.id === cancellingReceipt.takhmeenId) {
        const revertedPaid = Math.max(0, t.paidAmount - cancellingReceipt.amount);
        const revertedBal = t.committedAmount - revertedPaid;
        return {
          ...t,
          paidAmount: revertedPaid,
          balanceAmount: revertedBal,
          status: (revertedPaid === 0 ? 'Pledged' : 'Partially Paid') as 'Pledged' | 'Partially Paid',
        };
      }
      return t;
    });

    setReceipts(updatedReceipts);
    saveStoredSchemeReceipts(updatedReceipts);
    setTakhmeens(updatedTakhmeens);
    saveStoredSchemeTakhmeens(updatedTakhmeens);

    appendActivityLog(
      currentUser.username,
      'Community Schemes',
      'Cancelled Receipts',
      'CANCEL_RECEIPT',
      `Voided ${cancellingReceipt.schemeName} receipt #${cancellingReceipt.receiptNo}: ${cancelReason}`
    );

    showToast(`Receipt #${cancellingReceipt.receiptNo} cancelled and balance restored`);
    setShowCancelModal(false);
    setCancellingReceipt(null);
    setCancelReason('');
  };

  // Category Save
  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catForm.name || !catForm.code) return;

    let updated: SchemeCategory[];
    if (editingCat) {
      updated = categories.map(c => c.id === editingCat.id ? { ...c, ...catForm } : c);
      showToast('Category updated');
    } else {
      const newCat: SchemeCategory = {
        id: `scat-${Date.now()}`,
        schemeName: selectedScheme,
        ...catForm,
      };
      updated = [...categories, newCat];
      showToast(`Category added to ${selectedScheme}`);
    }

    setCategories(updated);
    saveStoredSchemeCategories(updated);
    setShowCatModal(false);
    setEditingCat(null);
  };

  const tabs: { key: SchemeSubTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { key: 'scheme-takhmeen-master',    label: '1. Takhmeen Master',      icon: <Layers className="w-3.5 h-3.5" />, badge: `${schemeTakhmeens.length}` },
    { key: 'scheme-payment-entry',       label: '2. Payment Entry',       icon: <CreditCard className="w-3.5 h-3.5" />, badge: 'POS' },
    { key: 'scheme-category-master',     label: '3. Category Master',     icon: <Layers className="w-3.5 h-3.5" /> },
    { key: 'scheme-outstanding-report',  label: '4. Outstanding Report',  icon: <AlertCircle className="w-3.5 h-3.5" />, badge: totalBalance > 0 ? fmtINR(totalBalance) : undefined },
    { key: 'scheme-ledger-report',       label: '5. Ledger Report',       icon: <FileSpreadsheet className="w-3.5 h-3.5" /> },
    { key: 'scheme-cancelled-receipts',  label: '6. Cancelled Receipts',  icon: <Ban className="w-3.5 h-3.5" />, badge: cancelledSchemeReceipts.length ? String(cancelledSchemeReceipts.length) : undefined },
  ];

  return (
    <div className="space-y-5">
      {/* Top Banner & Scheme Switcher */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden border border-blue-500/20">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-2 bg-blue-500/20 rounded-xl text-blue-300 border border-blue-400/30">
                <Building2 className="w-5 h-5" />
              </span>
              <span className="px-3 py-0.5 rounded-full text-xs font-semibold bg-blue-400/20 text-blue-200 border border-blue-400/30">
                Community Schemes Central
              </span>
              <span className="text-xs text-blue-200/70 font-mono">Hijri {financialYear}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white mt-2">
              Community Schemes &amp; Welfare Endowments
            </h1>
            <p className="text-xs text-blue-100/70 max-w-2xl mt-1">
              Active commitment ledgers for Taher Scheme, Mohammedii Scheme, Husain Scheme, Hoob, Corpus Fund, and Sarkari Lagat.
            </p>
          </div>

          {/* KPI Snapshot for Selected Scheme */}
          <div className="grid grid-cols-3 gap-2 bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 text-center">
            <div>
              <p className="text-[10px] text-blue-200 uppercase font-semibold">Pledged</p>
              <p className="text-sm font-bold text-white font-mono">{fmtINR(totalCommitted)}</p>
            </div>
            <div>
              <p className="text-[10px] text-emerald-300 uppercase font-semibold">Recovered</p>
              <p className="text-sm font-bold text-emerald-300 font-mono">{fmtINR(totalPaid)}</p>
            </div>
            <div>
              <p className="text-[10px] text-amber-300 uppercase font-semibold">Balance</p>
              <p className="text-sm font-bold text-amber-300 font-mono">{fmtINR(totalBalance)}</p>
            </div>
          </div>
        </div>

        {/* Scheme Switcher Carousel / Badges */}
        <div className="mt-5 pt-4 border-t border-blue-500/20">
          <p className="text-[11px] font-bold text-blue-200 uppercase tracking-wider mb-2">Select Active Community Scheme:</p>
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
            {ALL_SCHEMES.map(s => {
              const isSelected = selectedScheme === s;
              const sTakhmeens = takhmeens.filter(t => t.schemeName === s);
              const sBalance = sTakhmeens.reduce((acc, t) => acc + t.balanceAmount, 0);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSelectedScheme(s)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20 scale-102'
                      : 'bg-white/10 hover:bg-white/15 text-blue-100 border border-white/10'
                  }`}
                >
                  <span>{s}</span>
                  {sBalance > 0 && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      isSelected ? 'bg-slate-900 text-amber-300 font-mono' : 'bg-amber-400/20 text-amber-300 font-mono'
                    }`}>
                      {fmtINR(sBalance)} due
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sub-Tabs Ribbon */}
        <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-blue-500/10 overflow-x-auto scrollbar-none">
          {tabs.map(t => (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                activeTab === t.key
                  ? 'bg-blue-600 text-white font-bold shadow-md'
                  : 'text-blue-100/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
              {t.badge && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTab === t.key ? 'bg-white text-blue-900' : 'bg-blue-500/30 text-blue-200'
                }`}>
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* SUB-PAGE 1: TAKHMEEN MASTER */}
      {activeTab === 'scheme-takhmeen-master' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <span>{selectedScheme} — Takhmeen Commitment Master</span>
                <span className="text-xs bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-md">
                  {recoveryRate}% Recovered
                </span>
              </h2>
              <p className="text-xs text-slate-500">Annual commitment declarations and recovery ledger for {selectedScheme}.</p>
            </div>

            {canAdd && (
              <button
                type="button"
                onClick={() => {
                  setTakhmeenForm({
                    itsNumber: '',
                    hofName: '',
                    mohallahName: 'Saifee Mohalla',
                    categoryCode: schemeCategories[0]?.code || '',
                    committedAmount: schemeCategories[0]?.suggestedTakhmeen || 25000,
                  });
                  setShowTakhmeenModal(true);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Pledge Commitment</span>
              </button>
            )}
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={`Search ${selectedScheme} commitments by ITS, name, or mohallah...`}
              className="w-full text-xs pl-8 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">ITS</th>
                  <th className="px-4 py-3">HOF Full Name</th>
                  <th className="px-4 py-3">Mohallah</th>
                  <th className="px-4 py-3">Tier</th>
                  <th className="px-4 py-3 text-right">Committed</th>
                  <th className="px-4 py-3 text-right">Paid</th>
                  <th className="px-4 py-3 text-right">Balance</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {schemeTakhmeens
                  .filter(t => {
                    return (
                      t.hofName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      t.itsNumber.includes(searchQuery) ||
                      t.mohallahName.toLowerCase().includes(searchQuery.toLowerCase())
                    );
                  })
                  .map(t => (
                    <tr key={t.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3 font-mono font-bold text-blue-900">{t.itsNumber}</td>
                      <td className="px-4 py-3 font-bold text-slate-900">{t.hofName}</td>
                      <td className="px-4 py-3 text-slate-500">{t.mohallahName}</td>
                      <td className="px-4 py-3 font-semibold text-slate-700">{t.categoryCode}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">{fmtINR(t.committedAmount)}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">{fmtINR(t.paidAmount)}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-amber-700">{fmtINR(t.balanceAmount)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          t.status === 'Settled'
                            ? 'bg-emerald-100 text-emerald-800'
                            : t.status === 'Partially Paid'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        {t.balanceAmount > 0 ? (
                          <button
                            type="button"
                            onClick={() => handleSelectTakhmeenForPayment(t)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[11px] font-bold cursor-pointer"
                          >
                            Pay Dues
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-600 font-bold flex items-center justify-end space-x-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Cleared</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-PAGE 2: PAYMENT ENTRY (POS) */}
      {activeTab === 'scheme-payment-entry' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  <span>Receive Payment for {selectedScheme}</span>
                </h2>
                <p className="text-xs text-slate-500">Record counter recovery against mumin commitment voucher.</p>
              </div>
              <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                Receipt #SCH-1447-{String(receipts.length + 1).padStart(3, '0')}
              </span>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Pledged Member *
                </label>
                <select
                  required
                  value={paymentForm.takhmeenId}
                  onChange={e => {
                    const sel = schemeTakhmeens.find(t => t.id === e.target.value);
                    if (sel) {
                      setPaymentForm({
                        ...paymentForm,
                        takhmeenId: sel.id,
                        itsNumber: sel.itsNumber,
                        hofName: sel.hofName,
                        amount: sel.balanceAmount > 0 ? sel.balanceAmount : 5000,
                      });
                    }
                  }}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">-- Choose Member from {selectedScheme} Register --</option>
                  {schemeTakhmeens.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.hofName} ({t.itsNumber}) — Due: {fmtINR(t.balanceAmount)} [Pledged: {fmtINR(t.committedAmount)}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ITS Number</label>
                  <input
                    type="text"
                    readOnly
                    value={paymentForm.itsNumber}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Amount to Pay (₹) *</label>
                  <input
                    type="number"
                    required
                    min={10}
                    value={paymentForm.amount}
                    onChange={e => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold font-mono text-emerald-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Payment Mode</label>
                  <select
                    value={paymentForm.paymentMode}
                    onChange={e => setPaymentForm({ ...paymentForm, paymentMode: e.target.value as PaymentMode })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="Cash">Cash Counter</option>
                    <option value="UPI">UPI / QR Code</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Bank Transfer">Bank Transfer / NEFT</option>
                    <option value="Card">Debit / Credit Card</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ref / UTR / Cheque #</label>
                  <input
                    type="text"
                    value={paymentForm.transactionRef}
                    onChange={e => setPaymentForm({ ...paymentForm, transactionRef: e.target.value })}
                    placeholder="e.g. CHQ#99201"
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Receipt Date</label>
                  <input
                    type="date"
                    value={paymentForm.date}
                    onChange={e => setPaymentForm({ ...paymentForm, date: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs text-slate-500">Receipt will adjust pledge balance automatically</span>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center space-x-2 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Generate Official Receipt</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Receipt Voucher Preview */}
          <div className="lg:col-span-5 space-y-4">
            {selectedReceiptForPrint && (
              <div className="bg-amber-50/70 border-2 border-dashed border-amber-300 rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                  <div>
                    <span className="text-[10px] font-bold tracking-wider text-amber-800 uppercase">Scheme Receipt Voucher</span>
                    <h3 className="text-sm font-black text-slate-900 font-mono">{selectedReceiptForPrint.receiptNo}</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="p-1.5 bg-amber-200 hover:bg-amber-300 rounded-lg text-amber-900 text-xs font-bold flex items-center space-x-1 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print</span>
                  </button>
                </div>

                <div className="text-xs space-y-1.5 text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Scheme:</span>
                    <span className="font-bold text-blue-900">{selectedReceiptForPrint.schemeName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Donor Name:</span>
                    <span className="font-bold text-slate-900">{selectedReceiptForPrint.hofName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">ITS Number:</span>
                    <span className="font-mono">{selectedReceiptForPrint.itsNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Payment Mode:</span>
                    <span>{selectedReceiptForPrint.paymentMode} {selectedReceiptForPrint.transactionRef ? `(${selectedReceiptForPrint.transactionRef})` : ''}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-amber-200 text-sm font-black text-emerald-900">
                    <span>Amount Credited:</span>
                    <span className="font-mono text-base">{fmtINR(selectedReceiptForPrint.amount)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Scheme Receipts List */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
                <span>Recent {selectedScheme} Receipts</span>
                <span className="text-blue-600">{activeSchemeReceipts.length} total</span>
              </h3>

              <div className="space-y-2">
                {activeSchemeReceipts.slice(0, 5).map(r => (
                  <div
                    key={r.id}
                    onClick={() => setSelectedReceiptForPrint(r)}
                    className="p-3 rounded-xl border border-slate-100 hover:border-blue-300 bg-slate-50/50 hover:bg-blue-50/30 transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900">{r.hofName}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{r.receiptNo} • {r.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-mono font-black text-emerald-700">{fmtINR(r.amount)}</p>
                      <p className="text-[10px] text-slate-400">{r.paymentMode}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-PAGE 3: CATEGORY MASTER */}
      {activeTab === 'scheme-category-master' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Category Master for {selectedScheme}</h2>
              <p className="text-xs text-slate-500">Commitment tiering slabs, baseline figures, and privilege categories.</p>
            </div>
            {canAdd && (
              <button
                type="button"
                onClick={() => {
                  setEditingCat(null);
                  setCatForm({ name: '', code: '', suggestedTakhmeen: 15000, description: '', isActive: true });
                  setShowCatModal(true);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Tier Category</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Scheme</th>
                  <th className="px-5 py-3.5">Code</th>
                  <th className="px-5 py-3.5">Category Name</th>
                  <th className="px-5 py-3.5">Description</th>
                  <th className="px-5 py-3.5 text-right">Suggested Takhmeen</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {schemeCategories.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3.5 font-bold text-blue-900">{c.schemeName}</td>
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-800">{c.code}</td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">{c.name}</td>
                    <td className="px-5 py-3.5 text-slate-500 max-w-xs truncate">{c.description}</td>
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-800 text-right">
                      {fmtINR(c.suggestedTakhmeen)}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        c.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {c.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCat(c);
                          setCatForm({
                            name: c.name,
                            code: c.code,
                            suggestedTakhmeen: c.suggestedTakhmeen,
                            description: c.description,
                            isActive: c.isActive,
                          });
                          setShowCatModal(true);
                        }}
                        className="text-blue-700 hover:underline font-semibold cursor-pointer"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-PAGE 4: OUTSTANDING REPORT */}
      {activeTab === 'scheme-outstanding-report' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">{selectedScheme} — Outstanding Dues Aging Report</h2>
              <p className="text-xs text-slate-500">Summary of overdue balances and follow-up rosters.</p>
            </div>
            <button
              type="button"
              onClick={() => showToast('Outstanding report exported to CSV')}
              className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 flex items-center space-x-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">ITS</th>
                  <th className="px-4 py-3">HOF Name</th>
                  <th className="px-4 py-3">Mohallah</th>
                  <th className="px-4 py-3 text-right">Pledged Amount</th>
                  <th className="px-4 py-3 text-right">Amount Paid</th>
                  <th className="px-4 py-3 text-right">Balance Due</th>
                  <th className="px-4 py-3 text-center">Recovery %</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {schemeTakhmeens.filter(t => t.balanceAmount > 0).map(t => {
                  const pct = Math.round((t.paidAmount / t.committedAmount) * 100);
                  return (
                    <tr key={t.id} className="hover:bg-amber-50/30">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">{t.itsNumber}</td>
                      <td className="px-4 py-3 font-bold text-slate-900">{t.hofName}</td>
                      <td className="px-4 py-3 text-slate-600">{t.mohallahName}</td>
                      <td className="px-4 py-3 text-right font-mono text-slate-900">{fmtINR(t.committedAmount)}</td>
                      <td className="px-4 py-3 text-right font-mono text-emerald-700">{fmtINR(t.paidAmount)}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-amber-700">{fmtINR(t.balanceAmount)}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="w-20 mx-auto bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-emerald-500 h-2 rounded-full"
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-500">{pct}%</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleSelectTakhmeenForPayment(t)}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-[11px] font-bold cursor-pointer"
                        >
                          Collect
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-PAGE 5: LEDGER REPORT */}
      {activeTab === 'scheme-ledger-report' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">{selectedScheme} — Comprehensive Receipt Ledger</h2>
              <p className="text-xs text-slate-500">Audited receipt collections for {selectedScheme}.</p>
            </div>
            <button
              type="button"
              onClick={() => showToast('Ledger exported to CSV')}
              className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 flex items-center space-x-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Receipt #</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Donor Name</th>
                  <th className="px-4 py-3">ITS</th>
                  <th className="px-4 py-3">Mode</th>
                  <th className="px-4 py-3">Ref</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeSchemeReceipts.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-mono font-bold text-blue-900">{r.receiptNo}</td>
                    <td className="px-4 py-3 text-slate-500 font-mono">{r.date}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{r.hofName}</td>
                    <td className="px-4 py-3 font-mono text-slate-600">{r.itsNumber}</td>
                    <td className="px-4 py-3 text-slate-600">{r.paymentMode}</td>
                    <td className="px-4 py-3 font-mono text-slate-500">{r.transactionRef || '—'}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-emerald-900">{fmtINR(r.amount)}</td>
                    <td className="px-4 py-3 text-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setSelectedReceiptForPrint(r)}
                        className="p-1 hover:bg-slate-100 rounded text-slate-600 cursor-pointer"
                        title="Print"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => {
                            setCancellingReceipt(r);
                            setShowCancelModal(true);
                          }}
                          className="p-1 hover:bg-rose-50 rounded text-rose-600 cursor-pointer"
                          title="Cancel"
                        >
                          <Ban className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-PAGE 6: CANCELLED RECEIPTS */}
      {activeTab === 'scheme-cancelled-receipts' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Ban className="w-4 h-4 text-rose-600" />
                <span>Cancelled {selectedScheme} Receipts</span>
              </h2>
              <p className="text-xs text-slate-500">Revocation log and audit trail of cancelled vouchers.</p>
            </div>
            <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
              {cancelledSchemeReceipts.length} Cancelled
            </span>
          </div>

          {cancelledSchemeReceipts.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
              <p className="text-xs">No cancelled receipts for {selectedScheme}.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Receipt #</th>
                    <th className="px-4 py-3">Original Date</th>
                    <th className="px-4 py-3">Member Name</th>
                    <th className="px-4 py-3 text-right">Amount Voided</th>
                    <th className="px-4 py-3">Cancelled By</th>
                    <th className="px-4 py-3">Cancellation Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cancelledSchemeReceipts.map(r => (
                    <tr key={r.id} className="bg-rose-50/20 hover:bg-rose-50/40">
                      <td className="px-4 py-3 font-mono font-bold text-rose-800 line-through">{r.receiptNo}</td>
                      <td className="px-4 py-3 text-slate-500 font-mono">{r.date}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{r.hofName}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-rose-700 line-through">{fmtINR(r.amount)}</td>
                      <td className="px-4 py-3 text-slate-600 font-mono">{r.cancelledBy}</td>
                      <td className="px-4 py-3 text-rose-600 italic">{r.cancellationReason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal: Add Takhmeen */}
      {showTakhmeenModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                Register Commitment in {selectedScheme}
              </h3>
              <button
                type="button"
                onClick={() => setShowTakhmeenModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTakhmeen} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">ITS Number *</label>
                <input
                  type="text"
                  required
                  value={takhmeenForm.itsNumber}
                  onChange={e => handleItsLookupTakhmeen(e.target.value)}
                  placeholder="e.g. 30489122"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">HOF Full Name *</label>
                <input
                  type="text"
                  required
                  value={takhmeenForm.hofName}
                  onChange={e => setTakhmeenForm({ ...takhmeenForm, hofName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mohallah</label>
                  <input
                    type="text"
                    value={takhmeenForm.mohallahName}
                    onChange={e => setTakhmeenForm({ ...takhmeenForm, mohallahName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pledge Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min={100}
                    value={takhmeenForm.committedAmount}
                    onChange={e => setTakhmeenForm({ ...takhmeenForm, committedAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowTakhmeenModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  Save Pledge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Category Master */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                {editingCat ? `Edit Tier for ${selectedScheme}` : `Add Tier for ${selectedScheme}`}
              </h3>
              <button
                type="button"
                onClick={() => setShowCatModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tier Name *</label>
                <input
                  type="text"
                  required
                  value={catForm.name}
                  onChange={e => setCatForm({ ...catForm, name: e.target.value })}
                  placeholder="e.g. Taher Prime Tier"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tier Code *</label>
                <input
                  type="text"
                  required
                  value={catForm.code}
                  onChange={e => setCatForm({ ...catForm, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. TS-PRIME"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Suggested Commitment (₹)</label>
                <input
                  type="number"
                  value={catForm.suggestedTakhmeen}
                  onChange={e => setCatForm({ ...catForm, suggestedTakhmeen: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={catForm.description}
                  onChange={e => setCatForm({ ...catForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCatModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  Save Tier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Cancel Receipt */}
      {showCancelModal && cancellingReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-rose-900 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>Void {cancellingReceipt.schemeName} Receipt #{cancellingReceipt.receiptNo}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Voiding this receipt will revert <span className="font-bold text-slate-900">{fmtINR(cancellingReceipt.amount)}</span> back to <span className="font-bold text-slate-900">{cancellingReceipt.hofName}</span>&#39;s pending balance.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Reason for Cancellation *
              </label>
              <textarea
                rows={3}
                required
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                placeholder="e.g. Allocation head correction, wrong cheque provided..."
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Confirm Void
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
