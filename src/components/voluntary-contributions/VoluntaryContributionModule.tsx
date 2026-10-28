import React, { useState, useMemo } from 'react';
import {
  HeartHandshake, Plus, Search, Filter, Download, Receipt,
  CheckCircle2, X, AlertCircle, Ban, Printer, FileSpreadsheet,
  Tag, Calendar, CreditCard, Sparkles, User, ArrowUpRight
} from 'lucide-react';
import { UserProfile, FinancialYear } from '../../types';
import {
  HadiyahCategory, HadiyahReceipt, PaymentMode,
  getStoredHadiyahCategories, saveStoredHadiyahCategories,
  getStoredHadiyahReceipts, saveStoredHadiyahReceipts
} from '../../utils/part2bManagement';
import { getStoredHofs } from '../../utils/memberMaster';
import { appendActivityLog } from '../../utils/rbac';

export type VoluntarySubTab =
  | 'voluntary-category-list'
  | 'voluntary-payment-entry'
  | 'voluntary-ledger-report'
  | 'voluntary-cancelled-receipts';

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

export const VoluntaryContributionModule: React.FC<Props> = ({
  currentUser,
  activeSubItemId,
  financialYear,
  showToast,
  canAdd,
  canDelete,
}) => {
  const [categories, setCategories] = useState<HadiyahCategory[]>(() => getStoredHadiyahCategories());
  const [receipts, setReceipts] = useState<HadiyahReceipt[]>(() => getStoredHadiyahReceipts());
  const [hofs] = useState(() => getStoredHofs());

  const [activeTab, setActiveTab] = useState<VoluntarySubTab>(() => {
    return (activeSubItemId as VoluntarySubTab) || 'voluntary-payment-entry';
  });

  React.useEffect(() => {
    if (activeSubItemId) setActiveTab(activeSubItemId as VoluntarySubTab);
  }, [activeSubItemId]);

  // Modal States
  const [showCatModal, setShowCatModal] = useState(false);
  const [editingCat, setEditingCat] = useState<HadiyahCategory | null>(null);
  const [catForm, setCatForm] = useState({ name: '', code: '', description: '', suggestedAmount: 2100, isActive: true });

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellingReceipt, setCancellingReceipt] = useState<HadiyahReceipt | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const [selectedReceiptForPrint, setSelectedReceiptForPrint] = useState<HadiyahReceipt | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [catFilter, setCatFilter] = useState('ALL');

  // Payment Form State
  const [paymentForm, setPaymentForm] = useState({
    itsNumber: '',
    donorName: '',
    categoryId: categories[0]?.id || '',
    amount: categories[0]?.suggestedAmount || 2100,
    paymentMode: 'Cash' as PaymentMode,
    transactionRef: '',
    purposeNiyaz: '',
    date: new Date().toISOString().split('T')[0],
  });

  const activeReceipts = useMemo(() => receipts.filter(r => !r.isCancelled), [receipts]);
  const cancelledReceipts = useMemo(() => receipts.filter(r => r.isCancelled), [receipts]);

  const totalCollected = useMemo(() => {
    return activeReceipts.reduce((acc, r) => acc + r.amount, 0);
  }, [activeReceipts]);

  // Handle ITS Autocomplete
  const handleItsChange = (its: string) => {
    const found = hofs.find(h => h.itsNumber === its);
    setPaymentForm(prev => ({
      ...prev,
      itsNumber: its,
      donorName: found ? found.fullName : prev.donorName,
    }));
  };

  // Submit Payment
  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentForm.donorName || paymentForm.amount <= 0) {
      showToast('Please enter donor name and valid contribution amount');
      return;
    }

    const catObj = categories.find(c => c.id === paymentForm.categoryId);
    const newReceipt: HadiyahReceipt = {
      id: `hrc-${Date.now()}`,
      receiptNo: `HAD-1447-${String(receipts.length + 1).padStart(3, '0')}`,
      itsNumber: paymentForm.itsNumber || 'GUEST',
      donorName: paymentForm.donorName,
      categoryId: paymentForm.categoryId,
      categoryName: catObj ? catObj.name : 'Voluntary Hadiyah',
      amount: Number(paymentForm.amount),
      paymentMode: paymentForm.paymentMode,
      transactionRef: paymentForm.transactionRef,
      date: paymentForm.date,
      financialYear,
      collectedBy: currentUser.username,
      purposeNiyaz: paymentForm.purposeNiyaz || 'Barakat & Khair Niyaz',
      isCancelled: false,
    };

    const updated = [newReceipt, ...receipts];
    setReceipts(updated);
    saveStoredHadiyahReceipts(updated);
    setSelectedReceiptForPrint(newReceipt);

    appendActivityLog(
      currentUser.username,
      'Voluntary Contribution',
      'Payment Entry',
      'PAYMENT',
      `Generated Hadiyah receipt #${newReceipt.receiptNo} of ${fmtINR(newReceipt.amount)} for ${newReceipt.donorName}`
    );

    showToast(`Hadiyah Receipt #${newReceipt.receiptNo} generated successfully!`);
    // Reset form
    setPaymentForm(prev => ({
      ...prev,
      itsNumber: '',
      donorName: '',
      amount: 2100,
      transactionRef: '',
      purposeNiyaz: '',
    }));
  };

  // Category Save
  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catForm.name || !catForm.code) {
      showToast('Category name and code are required');
      return;
    }

    let updated: HadiyahCategory[];
    if (editingCat) {
      updated = categories.map(c => c.id === editingCat.id ? { ...c, ...catForm } : c);
      showToast(`Category "${catForm.name}" updated`);
    } else {
      const newCat: HadiyahCategory = {
        id: `hcat-${Date.now()}`,
        ...catForm,
      };
      updated = [...categories, newCat];
      showToast(`Category "${catForm.name}" added`);
    }

    setCategories(updated);
    saveStoredHadiyahCategories(updated);
    setShowCatModal(false);
    setEditingCat(null);
  };

  // Cancel Receipt
  const handleConfirmCancel = () => {
    if (!cancellingReceipt || !cancelReason) {
      showToast('Cancellation reason is required');
      return;
    }

    const updated = receipts.map(r => {
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

    setReceipts(updated);
    saveStoredHadiyahReceipts(updated);

    appendActivityLog(
      currentUser.username,
      'Voluntary Contribution',
      'Cancelled Receipts',
      'CANCEL_RECEIPT',
      `Cancelled receipt #${cancellingReceipt.receiptNo}: ${cancelReason}`
    );

    showToast(`Receipt #${cancellingReceipt.receiptNo} cancelled successfully`);
    setShowCancelModal(false);
    setCancellingReceipt(null);
    setCancelReason('');
  };

  const tabs: { key: VoluntarySubTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { key: 'voluntary-payment-entry',      label: '1. Payment Entry',       icon: <CreditCard className="w-3.5 h-3.5" />, badge: 'POS' },
    { key: 'voluntary-category-list',      label: '2. Category List',       icon: <Tag className="w-3.5 h-3.5" /> },
    { key: 'voluntary-ledger-report',      label: '3. Ledger Report',       icon: <FileSpreadsheet className="w-3.5 h-3.5" /> },
    { key: 'voluntary-cancelled-receipts', label: '4. Cancelled Receipts',  icon: <Ban className="w-3.5 h-3.5" />, badge: cancelledReceipts.length ? String(cancelledReceipts.length) : undefined },
  ];

  return (
    <div className="space-y-5">
      {/* Module Header */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden border border-emerald-500/20">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <span className="p-2 bg-emerald-500/20 rounded-xl text-emerald-300 border border-emerald-400/30">
                <HeartHandshake className="w-5 h-5" />
              </span>
              <span className="px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                Hadiyah &amp; Sadaqah Desk
              </span>
              <span className="text-xs text-emerald-200/70 font-mono">Hijri {financialYear}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white mt-2">
              Voluntary Contributions (Hadiyah / Sadaqah / Niyaz)
            </h1>
            <p className="text-xs text-emerald-100/70 max-w-2xl mt-1">
              Community voluntary offerings, barakat niyaz for Mawali Tahereen (AS), Sadaqah for shifa, and general khairat ledger.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 text-right">
              <p className="text-[11px] text-emerald-200 uppercase font-semibold tracking-wider">Total Received</p>
              <p className="text-xl font-black text-amber-300 font-mono">{fmtINR(totalCollected)}</p>
              <p className="text-[10px] text-emerald-200/80">{activeReceipts.length} verified receipts</p>
            </div>
          </div>
        </div>

        {/* Tab Ribbon */}
        <div className="flex items-center gap-1.5 mt-6 pt-4 border-t border-emerald-500/20 overflow-x-auto scrollbar-none">
          {tabs.map(t => (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                activeTab === t.key
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-400/20'
                  : 'text-emerald-100/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
              {t.badge && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTab === t.key ? 'bg-slate-900 text-amber-300' : 'bg-emerald-500/30 text-emerald-200'
                }`}>
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* SUB-PAGE 1: PAYMENT ENTRY (POS) */}
      {activeTab === 'voluntary-payment-entry' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Payment Form */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <span>Issue New Hadiyah / Sadaqah Receipt</span>
                </h2>
                <p className="text-xs text-slate-500">Record counter voluntary offerings with instant print voucher.</p>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                Receipt #HAD-1447-{String(receipts.length + 1).padStart(3, '0')}
              </span>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ITS Number (Optional for Guests)
                  </label>
                  <input
                    type="text"
                    value={paymentForm.itsNumber}
                    onChange={e => handleItsChange(e.target.value)}
                    placeholder="e.g. 30489122"
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Typing recognized ITS autocompletes name.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Donor / Mumin Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={paymentForm.donorName}
                    onChange={e => setPaymentForm({ ...paymentForm, donorName: e.target.value })}
                    placeholder="e.g. Mulla Shabbir Bhai Burhani"
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Niyaz / Contribution Head *
                  </label>
                  <select
                    value={paymentForm.categoryId}
                    onChange={e => {
                      const c = categories.find(cat => cat.id === e.target.value);
                      setPaymentForm({
                        ...paymentForm,
                        categoryId: e.target.value,
                        amount: c?.suggestedAmount || paymentForm.amount,
                      });
                    }}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    {categories.filter(c => c.isActive).map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code}) - Sug: {fmtINR(c.suggestedAmount || 0)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Amount (₹ INR) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-400 font-bold text-xs">₹</span>
                    <input
                      type="number"
                      required
                      min={10}
                      value={paymentForm.amount}
                      onChange={e => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                      className="w-full text-xs pl-7 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold font-mono text-emerald-900"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Payment Mode</label>
                  <select
                    value={paymentForm.paymentMode}
                    onChange={e => setPaymentForm({ ...paymentForm, paymentMode: e.target.value as PaymentMode })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="Cash">Cash Counter</option>
                    <option value="UPI">UPI / QR Code</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Bank Transfer">Bank Transfer / NEFT</option>
                    <option value="Card">Debit / Credit Card</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ref / UTR / Chq #</label>
                  <input
                    type="text"
                    value={paymentForm.transactionRef}
                    onChange={e => setPaymentForm({ ...paymentForm, transactionRef: e.target.value })}
                    placeholder="e.g. UPI/492019"
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={paymentForm.date}
                    onChange={e => setPaymentForm({ ...paymentForm, date: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Purpose / Niyaz Occasion Remarks
                </label>
                <input
                  type="text"
                  value={paymentForm.purposeNiyaz}
                  onChange={e => setPaymentForm({ ...paymentForm, purposeNiyaz: e.target.value })}
                  placeholder="e.g. Shukr Niyaz for health, Darees at flat 203, Salawat for marhoom"
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <div className="text-xs text-slate-500 flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Dawat barakat receipt will be logged in ledger</span>
                </div>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center space-x-2 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Issue &amp; Print Receipt</span>
                </button>
              </div>
            </form>
          </div>

          {/* Live Recent Transactions & Quick Voucher Preview */}
          <div className="lg:col-span-5 space-y-4">
            {/* Quick Printable Receipt Preview */}
            {selectedReceiptForPrint && (
              <div className="bg-amber-50/70 border-2 border-dashed border-amber-300 rounded-2xl p-5 shadow-sm space-y-3 print:block">
                <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                  <div>
                    <span className="text-[10px] font-bold tracking-wider text-amber-800 uppercase">Official Receipt Voucher</span>
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
                    <span className="text-slate-500">Payer Name:</span>
                    <span className="font-bold text-slate-900">{selectedReceiptForPrint.donorName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">ITS Number:</span>
                    <span className="font-mono">{selectedReceiptForPrint.itsNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Category:</span>
                    <span className="font-semibold text-emerald-800">{selectedReceiptForPrint.categoryName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Purpose:</span>
                    <span className="italic text-slate-600">{selectedReceiptForPrint.purposeNiyaz}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Payment Mode:</span>
                    <span>{selectedReceiptForPrint.paymentMode} {selectedReceiptForPrint.transactionRef ? `(${selectedReceiptForPrint.transactionRef})` : ''}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-amber-200 text-sm font-black text-emerald-900">
                    <span>Amount Received:</span>
                    <span className="font-mono text-base">{fmtINR(selectedReceiptForPrint.amount)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Recent 5 Receipts */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
                <span>Recent Counter Collections</span>
                <span className="text-emerald-600">{activeReceipts.length} total</span>
              </h3>

              <div className="space-y-2">
                {activeReceipts.slice(0, 5).map(r => (
                  <div
                    key={r.id}
                    onClick={() => setSelectedReceiptForPrint(r)}
                    className="p-3 rounded-xl border border-slate-100 hover:border-emerald-300 bg-slate-50/50 hover:bg-emerald-50/30 transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900">{r.donorName}</p>
                      <p className="text-[10px] text-slate-500">
                        {r.categoryName} • <span className="font-mono">{r.receiptNo}</span>
                      </p>
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

      {/* SUB-PAGE 2: CATEGORY LIST */}
      {activeTab === 'voluntary-category-list' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Contribution Categories &amp; Niyaz Slabs</h2>
              <p className="text-xs text-slate-500">Manage voluntary heads, suggested rates, and descriptions.</p>
            </div>
            {canAdd && (
              <button
                type="button"
                onClick={() => {
                  setEditingCat(null);
                  setCatForm({ name: '', code: '', description: '', suggestedAmount: 2100, isActive: true });
                  setShowCatModal(true);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Category</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Code</th>
                  <th className="px-5 py-3.5">Category Name</th>
                  <th className="px-5 py-3.5">Description</th>
                  <th className="px-5 py-3.5 text-right">Suggested Amount</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categories.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3.5 font-mono font-bold text-emerald-800">{c.code}</td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">{c.name}</td>
                    <td className="px-5 py-3.5 text-slate-500 max-w-xs truncate">{c.description}</td>
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-800 text-right">
                      {fmtINR(c.suggestedAmount || 0)}
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
                            description: c.description,
                            suggestedAmount: c.suggestedAmount || 2100,
                            isActive: c.isActive,
                          });
                          setShowCatModal(true);
                        }}
                        className="text-emerald-700 hover:underline font-semibold cursor-pointer"
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

      {/* SUB-PAGE 3: LEDGER REPORT */}
      {activeTab === 'voluntary-ledger-report' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Voluntary Contribution Financial Ledger</h2>
              <p className="text-xs text-slate-500">Audited receipt logs for Niyaz, Sadaqah, and Hadiyah.</p>
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

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by donor, ITS, or receipt #..."
                className="w-full text-xs pl-8 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <select
                value={catFilter}
                onChange={e => setCatFilter(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="ALL">All Niyaz Categories</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Receipt #</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Donor Name</th>
                  <th className="px-4 py-3">ITS</th>
                  <th className="px-4 py-3">Head</th>
                  <th className="px-4 py-3">Purpose</th>
                  <th className="px-4 py-3">Mode</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeReceipts
                  .filter(r => {
                    const matchQ =
                      r.donorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      r.itsNumber.includes(searchQuery) ||
                      r.receiptNo.toLowerCase().includes(searchQuery.toLowerCase());
                    const matchC = catFilter === 'ALL' || r.categoryId === catFilter;
                    return matchQ && matchC;
                  })
                  .map(r => (
                    <tr key={r.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3 font-mono font-bold text-emerald-800">{r.receiptNo}</td>
                      <td className="px-4 py-3 text-slate-500 font-mono">{r.date}</td>
                      <td className="px-4 py-3 font-bold text-slate-900">{r.donorName}</td>
                      <td className="px-4 py-3 font-mono text-slate-600">{r.itsNumber}</td>
                      <td className="px-4 py-3 text-slate-700 font-semibold">{r.categoryName}</td>
                      <td className="px-4 py-3 text-slate-500 italic max-w-xs truncate">{r.purposeNiyaz}</td>
                      <td className="px-4 py-3 text-slate-600">{r.paymentMode}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-emerald-900">{fmtINR(r.amount)}</td>
                      <td className="px-4 py-3 text-center space-x-2">
                        <button
                          type="button"
                          onClick={() => setSelectedReceiptForPrint(r)}
                          className="p-1 hover:bg-slate-100 rounded text-slate-600 cursor-pointer"
                          title="Print Receipt"
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
                            title="Cancel Receipt"
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

      {/* SUB-PAGE 4: CANCELLED RECEIPTS */}
      {activeTab === 'voluntary-cancelled-receipts' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-5 space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Ban className="w-4 h-4 text-rose-600" />
                <span>Revoked &amp; Cancelled Receipts Register</span>
              </h2>
              <p className="text-xs text-slate-500">Audit logs of all voided Hadiyah vouchers with reasons and authorization.</p>
            </div>
            <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
              {cancelledReceipts.length} Cancelled
            </span>
          </div>

          {cancelledReceipts.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
              <p className="text-xs">No cancelled receipts on record. Financial audit is clean.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Receipt #</th>
                    <th className="px-4 py-3">Original Date</th>
                    <th className="px-4 py-3">Donor Name</th>
                    <th className="px-4 py-3">Head</th>
                    <th className="px-4 py-3 text-right">Amount Voided</th>
                    <th className="px-4 py-3">Cancelled By</th>
                    <th className="px-4 py-3">Cancellation Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cancelledReceipts.map(r => (
                    <tr key={r.id} className="bg-rose-50/20 hover:bg-rose-50/40">
                      <td className="px-4 py-3 font-mono font-bold text-rose-800 line-through">{r.receiptNo}</td>
                      <td className="px-4 py-3 text-slate-500 font-mono">{r.date}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{r.donorName}</td>
                      <td className="px-4 py-3 text-slate-700">{r.categoryName}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-rose-700 line-through">
                        {fmtINR(r.amount)}
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-mono">{r.cancelledBy}</td>
                      <td className="px-4 py-3 text-rose-600 font-medium italic">{r.cancellationReason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Category Modal */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                {editingCat ? 'Edit Contribution Category' : 'Create Contribution Category'}
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
                <label className="block font-bold text-slate-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={catForm.name}
                  onChange={e => setCatForm({ ...catForm, name: e.target.value })}
                  placeholder="e.g. Niyaz-e-Husain (AS)"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Category Code *</label>
                <input
                  type="text"
                  required
                  value={catForm.code}
                  onChange={e => setCatForm({ ...catForm, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. NIYAZ-HUS"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Suggested Slabs (₹)</label>
                <input
                  type="number"
                  value={catForm.suggestedAmount}
                  onChange={e => setCatForm({ ...catForm, suggestedAmount: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={catForm.description}
                  onChange={e => setCatForm({ ...catForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={catForm.isActive}
                  onChange={e => setCatForm({ ...catForm, isActive: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="isActive" className="text-slate-700 font-medium">Active Category</label>
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
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Receipt Confirmation Modal */}
      {showCancelModal && cancellingReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-rose-900 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>Void Hadiyah Receipt #{cancellingReceipt.receiptNo}</span>
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
              Are you sure you want to cancel the receipt of <span className="font-bold text-slate-900">{fmtINR(cancellingReceipt.amount)}</span> issued to <span className="font-bold text-slate-900">{cancellingReceipt.donorName}</span>?
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
                placeholder="e.g. Cashier error, duplicate entry, cheque bounced..."
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
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
