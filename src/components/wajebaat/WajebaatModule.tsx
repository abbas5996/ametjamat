import React, { useState, useMemo } from 'react';
import {
  Scale, LayoutDashboard, Calendar, Plus, Search, Filter, Download,
  Receipt, CreditCard, CheckCircle2, X, AlertCircle, Ban, Printer,
  FileSpreadsheet, ShieldCheck, Sparkles, TrendingUp, User, Building,
  PieChart, BarChart3, ArrowUpRight
} from 'lucide-react';
import { UserProfile, FinancialYear } from '../../types';
import {
  WajebaatYearMaster, WajebaatTakhmeen, WajebaatReceipt, WajebaatCategory, PaymentMode,
  getStoredWajebaatYears, saveStoredWajebaatYears,
  getStoredWajebaatTakhmeens, saveStoredWajebaatTakhmeens,
  getStoredWajebaatReceipts, saveStoredWajebaatReceipts
} from '../../utils/part2bManagement';
import { getStoredHofs } from '../../utils/memberMaster';
import { appendActivityLog } from '../../utils/rbac';

export type WajebaatSubTab =
  | 'wajebaat-dashboard'
  | 'wajebaat-year-master'
  | 'wajebaat-takhmeen-master'
  | 'wajebaat-payment-entry'
  | 'wajebaat-outstanding-report'
  | 'wajebaat-ledger'
  | 'wajebaat-cancelled-receipts';

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

const WAJEBAAT_CATEGORIES: WajebaatCategory[] = [
  'Khums',
  'Zakat-ul-Maal',
  'Zakat-ul-Fitr',
  'Kaffarah',
  'Haqqun-Nafs',
  'Nazr-ul-Malaeka',
  'General Wajebaat',
];

export const WajebaatModule: React.FC<Props> = ({
  currentUser,
  activeSubItemId,
  financialYear,
  showToast,
  canAdd,
  canDelete,
}) => {
  const [years, setYears] = useState<WajebaatYearMaster[]>(() => getStoredWajebaatYears());
  const [selectedHijriYear, setSelectedHijriYear] = useState<string>('1447 Hijri');
  const [takhmeens, setTakhmeens] = useState<WajebaatTakhmeen[]>(() => getStoredWajebaatTakhmeens());
  const [receipts, setReceipts] = useState<WajebaatReceipt[]>(() => getStoredWajebaatReceipts());
  const [hofs] = useState(() => getStoredHofs());

  const [activeTab, setActiveTab] = useState<WajebaatSubTab>(() => {
    return (activeSubItemId as WajebaatSubTab) || 'wajebaat-dashboard';
  });

  React.useEffect(() => {
    if (activeSubItemId) setActiveTab(activeSubItemId as WajebaatSubTab);
  }, [activeSubItemId]);

  // Modal States
  const [showYearModal, setShowYearModal] = useState(false);
  const [yearForm, setYearForm] = useState({
    hijriYear: '1449 Hijri',
    label: '1449 Hijri (2028)',
    startDate: '2028-05-26',
    endDate: '2029-05-15',
    status: 'Upcoming' as 'Active' | 'Closed' | 'Upcoming',
  });

  const [showTakhmeenModal, setShowTakhmeenModal] = useState(false);
  const [takhmeenForm, setTakhmeenForm] = useState({
    itsNumber: '',
    hofName: '',
    mohallahName: 'Saifee Mohalla',
    khums: 45000,
    zakatMaal: 25000,
    zakatFitr: 3500,
    kaffarah: 1500,
    haqqunNafs: 5000,
    nazrulMalaeka: 2000,
    general: 0,
    notes: '',
  });

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellingReceipt, setCancellingReceipt] = useState<WajebaatReceipt | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const [selectedReceiptForPrint, setSelectedReceiptForPrint] = useState<WajebaatReceipt | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [mohallahFilter, setMohallahFilter] = useState('ALL');

  // Payment Form
  const [paymentForm, setPaymentForm] = useState({
    takhmeenId: '',
    itsNumber: '',
    hofName: '',
    category: 'Khums' as WajebaatCategory,
    amount: 10000,
    paymentMode: 'Cash' as PaymentMode,
    transactionRef: '',
    receivedFrom: 'Self',
    date: new Date().toISOString().split('T')[0],
  });

  // Filtered by Selected Hijri Year
  const yearTakhmeens = useMemo(() => {
    return takhmeens.filter(t => t.hijriYear === selectedHijriYear);
  }, [takhmeens, selectedHijriYear]);

  const yearReceipts = useMemo(() => {
    return receipts.filter(r => r.hijriYear === selectedHijriYear);
  }, [receipts, selectedHijriYear]);

  const activeYearReceipts = useMemo(() => yearReceipts.filter(r => !r.isCancelled), [yearReceipts]);
  const cancelledYearReceipts = useMemo(() => yearReceipts.filter(r => r.isCancelled), [yearReceipts]);

  // Overall Financial Metrics
  const totalAllocated = useMemo(() => yearTakhmeens.reduce((acc, t) => acc + t.totalTakhmeen, 0), [yearTakhmeens]);
  const totalCollected = useMemo(() => yearTakhmeens.reduce((acc, t) => acc + t.totalPaid, 0), [yearTakhmeens]);
  const totalPending = useMemo(() => yearTakhmeens.reduce((acc, t) => acc + t.balanceDue, 0), [yearTakhmeens]);
  const recoveryPct = totalAllocated > 0 ? Math.round((totalCollected / totalAllocated) * 100) : 0;

  // Breakdown across heads for active year
  const headTotals = useMemo(() => {
    const res: Record<WajebaatCategory, number> = {
      'Khums': 0,
      'Zakat-ul-Maal': 0,
      'Zakat-ul-Fitr': 0,
      'Kaffarah': 0,
      'Haqqun-Nafs': 0,
      'Nazr-ul-Malaeka': 0,
      'General Wajebaat': 0,
    };
    yearTakhmeens.forEach(t => {
      WAJEBAAT_CATEGORIES.forEach(cat => {
        res[cat] += t.breakdown[cat] || 0;
      });
    });
    return res;
  }, [yearTakhmeens]);

  // Handle ITS Autocomplete in Takhmeen Modal
  const handleItsLookup = (its: string) => {
    const found = hofs.find(h => h.itsNumber === its);
    setTakhmeenForm(prev => ({
      ...prev,
      itsNumber: its,
      hofName: found ? found.fullName : prev.hofName,
      mohallahName: found ? found.mohallahName : prev.mohallahName,
    }));
  };

  // Save Takhmeen
  const handleSaveTakhmeen = (e: React.FormEvent) => {
    e.preventDefault();
    if (!takhmeenForm.hofName || !takhmeenForm.itsNumber) {
      showToast('ITS Number and HOF Name are mandatory');
      return;
    }

    const b = {
      'Khums': Number(takhmeenForm.khums),
      'Zakat-ul-Maal': Number(takhmeenForm.zakatMaal),
      'Zakat-ul-Fitr': Number(takhmeenForm.zakatFitr),
      'Kaffarah': Number(takhmeenForm.kaffarah),
      'Haqqun-Nafs': Number(takhmeenForm.haqqunNafs),
      'Nazr-ul-Malaeka': Number(takhmeenForm.nazrulMalaeka),
      'General Wajebaat': Number(takhmeenForm.general),
    };

    const sumTotal = Object.values(b).reduce((acc, v) => acc + v, 0);

    const newT: WajebaatTakhmeen = {
      id: `wt-${Date.now()}`,
      itsNumber: takhmeenForm.itsNumber,
      hofName: takhmeenForm.hofName,
      mohallahName: takhmeenForm.mohallahName,
      hijriYear: selectedHijriYear,
      breakdown: b,
      totalTakhmeen: sumTotal,
      totalPaid: 0,
      balanceDue: sumTotal,
      takhmeenDate: new Date().toISOString().split('T')[0],
      status: 'Pledged',
      notes: takhmeenForm.notes,
    };

    const updated = [newT, ...takhmeens];
    setTakhmeens(updated);
    saveStoredWajebaatTakhmeens(updated);

    appendActivityLog(
      currentUser.username,
      'Wajebaat',
      'Takhmeen Master',
      'ADD',
      `Registered Wajebaat commitment of ${fmtINR(sumTotal)} for ${newT.hofName} (ITS ${newT.itsNumber})`
    );

    showToast(`Wajebaat takhmeen registered for ${newT.hofName}!`);
    setShowTakhmeenModal(false);
  };

  // Submit Payment
  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentForm.takhmeenId || paymentForm.amount <= 0) {
      showToast('Please select a member takhmeen and enter valid amount');
      return;
    }

    const recNo = `WAJ-1447-${String(receipts.length + 1).padStart(3, '0')}`;
    const newR: WajebaatReceipt = {
      id: `wrec-${Date.now()}`,
      receiptNo: recNo,
      takhmeenId: paymentForm.takhmeenId,
      itsNumber: paymentForm.itsNumber,
      hofName: paymentForm.hofName,
      hijriYear: selectedHijriYear,
      category: paymentForm.category,
      amount: Number(paymentForm.amount),
      paymentMode: paymentForm.paymentMode,
      transactionRef: paymentForm.transactionRef,
      date: paymentForm.date,
      collectedBy: currentUser.username,
      receivedFrom: paymentForm.receivedFrom || 'Self',
      isCancelled: false,
    };

    // Update takhmeen
    const updatedTakhmeens = takhmeens.map(t => {
      if (t.id === paymentForm.takhmeenId) {
        const newPaid = t.totalPaid + newR.amount;
        const newBal = Math.max(0, t.totalTakhmeen - newPaid);
        return {
          ...t,
          totalPaid: newPaid,
          balanceDue: newBal,
          status: (newBal === 0 ? 'Paid' : 'Partially Paid') as 'Paid' | 'Partially Paid',
        };
      }
      return t;
    });

    const updatedReceipts = [newR, ...receipts];
    setTakhmeens(updatedTakhmeens);
    saveStoredWajebaatTakhmeens(updatedTakhmeens);
    setReceipts(updatedReceipts);
    saveStoredWajebaatReceipts(updatedReceipts);

    setSelectedReceiptForPrint(newR);

    appendActivityLog(
      currentUser.username,
      'Wajebaat',
      'Payment Entry',
      'PAYMENT',
      `Issued Wajebaat [${newR.category}] receipt #${recNo} of ${fmtINR(newR.amount)} for ${newR.hofName}`
    );

    showToast(`Wajebaat Receipt #${recNo} issued successfully!`);
  };

  // Cancel Receipt
  const handleConfirmCancel = () => {
    if (!cancellingReceipt || !cancelReason) {
      showToast('Cancellation reason is required');
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

    // Revert paid balance
    const updatedTakhmeens = takhmeens.map(t => {
      if (t.id === cancellingReceipt.takhmeenId) {
        const revertedPaid = Math.max(0, t.totalPaid - cancellingReceipt.amount);
        const revertedBal = t.totalTakhmeen - revertedPaid;
        return {
          ...t,
          totalPaid: revertedPaid,
          balanceDue: revertedBal,
          status: (revertedPaid === 0 ? 'Pledged' : 'Partially Paid') as 'Pledged' | 'Partially Paid',
        };
      }
      return t;
    });

    setReceipts(updatedReceipts);
    saveStoredWajebaatReceipts(updatedReceipts);
    setTakhmeens(updatedTakhmeens);
    saveStoredWajebaatTakhmeens(updatedTakhmeens);

    appendActivityLog(
      currentUser.username,
      'Wajebaat',
      'Cancelled Receipts',
      'CANCEL_RECEIPT',
      `Revoked Wajebaat receipt #${cancellingReceipt.receiptNo}: ${cancelReason}`
    );

    showToast(`Receipt #${cancellingReceipt.receiptNo} revoked successfully`);
    setShowCancelModal(false);
    setCancellingReceipt(null);
    setCancelReason('');
  };

  // Save Year Master
  const handleSaveYear = (e: React.FormEvent) => {
    e.preventDefault();
    const newY: WajebaatYearMaster = {
      id: `wyear-${Date.now()}`,
      hijriYear: yearForm.hijriYear,
      label: yearForm.label,
      startDate: yearForm.startDate,
      endDate: yearForm.endDate,
      status: yearForm.status,
      totalPledged: 0,
      totalCollected: 0,
    };
    const updated = [newY, ...years];
    setYears(updated);
    saveStoredWajebaatYears(updated);
    showToast(`Hijri Year ${yearForm.hijriYear} added!`);
    setShowYearModal(false);
  };

  const tabs: { key: WajebaatSubTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { key: 'wajebaat-dashboard',          label: '1. Dashboard',            icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
    { key: 'wajebaat-year-master',         label: '2. Year Master',          icon: <Calendar className="w-3.5 h-3.5" />, badge: selectedHijriYear },
    { key: 'wajebaat-takhmeen-master',     label: '3. Takhmeen Master',      icon: <Scale className="w-3.5 h-3.5" />, badge: `${yearTakhmeens.length}` },
    { key: 'wajebaat-payment-entry',       label: '4. Payment Entry',        icon: <CreditCard className="w-3.5 h-3.5" />, badge: 'POS' },
    { key: 'wajebaat-outstanding-report',  label: '5. Outstanding Report',   icon: <AlertCircle className="w-3.5 h-3.5" />, badge: totalPending > 0 ? fmtINR(totalPending) : undefined },
    { key: 'wajebaat-ledger',              label: '6. Ledger Report',        icon: <FileSpreadsheet className="w-3.5 h-3.5" /> },
    { key: 'wajebaat-cancelled-receipts',  label: '7. Cancelled Receipts',   icon: <Ban className="w-3.5 h-3.5" />, badge: cancelledYearReceipts.length ? String(cancelledYearReceipts.length) : undefined },
  ];

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-emerald-950 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden border border-amber-500/20">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-2 bg-amber-500/20 rounded-xl text-amber-300 border border-amber-400/30">
                <Scale className="w-5 h-5" />
              </span>
              <span className="px-3 py-0.5 rounded-full text-xs font-semibold bg-amber-400/20 text-amber-200 border border-amber-400/30">
                Wajebaat &amp; Huqooqullah Command
              </span>
              <span className="text-xs text-amber-200/70 font-mono">{selectedHijriYear}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white mt-2">
              Wajebaat (Khums, Zakat, Fitrah &amp; Kaffarah) Management
            </h1>
            <p className="text-xs text-amber-100/70 max-w-2xl mt-1">
              Authoritative Dawat-e-Hadiyah Wajebaat allocation, takhmeen commitments, secure counter collections, and audited barakat ledger.
            </p>
          </div>

          {/* Hijri Year Selector & Quick Metric */}
          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
              <label className="block text-[10px] text-amber-200 uppercase font-semibold mb-1">Active Hijri Year</label>
              <select
                value={selectedHijriYear}
                onChange={e => setSelectedHijriYear(e.target.value)}
                className="text-xs font-bold text-amber-300 bg-slate-900/80 border border-amber-400/30 rounded-lg px-2.5 py-1.5 focus:outline-none cursor-pointer"
              >
                {years.map(y => (
                  <option key={y.id} value={y.hijriYear}>{y.label}</option>
                ))}
              </select>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 text-right">
              <p className="text-[10px] text-emerald-300 uppercase font-semibold">Recovery Rate</p>
              <p className="text-xl font-black text-amber-300 font-mono">{recoveryPct}%</p>
              <p className="text-[10px] text-slate-300">{fmtINR(totalCollected)} remitted</p>
            </div>
          </div>
        </div>

        {/* Sub-Tabs Ribbon */}
        <div className="flex items-center gap-1.5 mt-6 pt-4 border-t border-amber-500/20 overflow-x-auto scrollbar-none">
          {tabs.map(t => (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                activeTab === t.key
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-400/20'
                  : 'text-amber-100/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
              {t.badge && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTab === t.key ? 'bg-slate-900 text-amber-300' : 'bg-amber-500/30 text-amber-200'
                }`}>
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* SUB-PAGE 1: DASHBOARD */}
      {activeTab === 'wajebaat-dashboard' && (
        <div className="space-y-5">
          {/* 4 Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Takhmeen</p>
              <p className="text-xl font-black text-slate-900 font-mono mt-1">{fmtINR(totalAllocated)}</p>
              <p className="text-[11px] text-slate-500 mt-1">{yearTakhmeens.length} households pledged</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Total Collected</p>
              <p className="text-xl font-black text-emerald-700 font-mono mt-1">{fmtINR(totalCollected)}</p>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1">{recoveryPct}% of pledge achieved</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Balance Pending</p>
              <p className="text-xl font-black text-amber-700 font-mono mt-1">{fmtINR(totalPending)}</p>
              <p className="text-[11px] text-amber-600 mt-1">{yearTakhmeens.filter(t => t.balanceDue > 0).length} families with dues</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Total Receipts Issued</p>
              <p className="text-xl font-black text-blue-700 font-mono mt-1">{activeYearReceipts.length}</p>
              <p className="text-[11px] text-slate-500 mt-1">{cancelledYearReceipts.length} cancelled vouchers</p>
            </div>
          </div>

          {/* Breakdown across Wajebaat heads */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <PieChart className="w-4 h-4 text-amber-600" />
                  <span>Category-wise Wajebaat Allocation ({selectedHijriYear})</span>
                </h3>
                <p className="text-xs text-slate-500">Distribution across Khums, Zakat-ul-Maal, Fitrah, Kaffarah, and Haqqun-Nafs.</p>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                100% Shariah compliant
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {WAJEBAAT_CATEGORIES.map(cat => (
                <div key={cat} className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-100">
                  <p className="text-[11px] font-bold text-slate-600 truncate">{cat}</p>
                  <p className="text-base font-black text-slate-900 font-mono mt-1">{fmtINR(headTotals[cat])}</p>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
                    <div
                      className="bg-amber-500 h-1.5 rounded-full"
                      style={{ width: `${totalAllocated > 0 ? (headTotals[cat] / totalAllocated) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-PAGE 2: YEAR MASTER */}
      {activeTab === 'wajebaat-year-master' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Hijri Fiscal Year Master</h2>
              <p className="text-xs text-slate-500">Manage Hijri calendar fiscal periods for Wajebaat declaration &amp; auditing.</p>
            </div>
            {canAdd && (
              <button
                type="button"
                onClick={() => setShowYearModal(true)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Hijri Year</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Hijri Year</th>
                  <th className="px-5 py-3.5">Display Label</th>
                  <th className="px-5 py-3.5">Start Date</th>
                  <th className="px-5 py-3.5">End Date</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {years.map(y => (
                  <tr key={y.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3.5 font-bold font-mono text-slate-900">{y.hijriYear}</td>
                    <td className="px-5 py-3.5 font-semibold text-slate-800">{y.label}</td>
                    <td className="px-5 py-3.5 text-slate-500 font-mono">{y.startDate}</td>
                    <td className="px-5 py-3.5 text-slate-500 font-mono">{y.endDate}</td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        y.status === 'Active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : y.status === 'Upcoming'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {y.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedHijriYear(y.hijriYear);
                          showToast(`Switched active view to ${y.hijriYear}`);
                        }}
                        className="text-amber-700 hover:underline font-bold text-xs cursor-pointer"
                      >
                        Set Active View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-PAGE 3: TAKHMEEN MASTER */}
      {activeTab === 'wajebaat-takhmeen-master' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Wajebaat Takhmeen Commitments ({selectedHijriYear})
              </h2>
              <p className="text-xs text-slate-500">Head-wise commitments declared per household.</p>
            </div>
            {canAdd && (
              <button
                type="button"
                onClick={() => {
                  setTakhmeenForm({
                    itsNumber: '',
                    hofName: '',
                    mohallahName: 'Saifee Mohalla',
                    khums: 45000,
                    zakatMaal: 25000,
                    zakatFitr: 3500,
                    kaffarah: 1500,
                    haqqunNafs: 5000,
                    nazrulMalaeka: 2000,
                    general: 0,
                    notes: '',
                  });
                  setShowTakhmeenModal(true);
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Declare Member Takhmeen</span>
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
              placeholder="Search by ITS, HOF name, or mohallah..."
              className="w-full text-xs pl-8 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">ITS</th>
                  <th className="px-4 py-3">HOF Name</th>
                  <th className="px-4 py-3">Mohallah</th>
                  <th className="px-4 py-3 text-right">Khums</th>
                  <th className="px-4 py-3 text-right">Zakat</th>
                  <th className="px-4 py-3 text-right">Fitrah</th>
                  <th className="px-4 py-3 text-right">Total Takhmeen</th>
                  <th className="px-4 py-3 text-right">Paid</th>
                  <th className="px-4 py-3 text-right">Balance Due</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {yearTakhmeens
                  .filter(t => {
                    return (
                      t.hofName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      t.itsNumber.includes(searchQuery) ||
                      t.mohallahName.toLowerCase().includes(searchQuery.toLowerCase())
                    );
                  })
                  .map(t => (
                    <tr key={t.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">{t.itsNumber}</td>
                      <td className="px-4 py-3 font-bold text-slate-900">{t.hofName}</td>
                      <td className="px-4 py-3 text-slate-500">{t.mohallahName}</td>
                      <td className="px-4 py-3 font-mono text-right text-slate-700">{fmtINR(t.breakdown['Khums'])}</td>
                      <td className="px-4 py-3 font-mono text-right text-slate-700">{fmtINR(t.breakdown['Zakat-ul-Maal'])}</td>
                      <td className="px-4 py-3 font-mono text-right text-slate-700">{fmtINR(t.breakdown['Zakat-ul-Fitr'])}</td>
                      <td className="px-4 py-3 font-mono text-right font-black text-slate-900">{fmtINR(t.totalTakhmeen)}</td>
                      <td className="px-4 py-3 font-mono text-right font-bold text-emerald-700">{fmtINR(t.totalPaid)}</td>
                      <td className="px-4 py-3 font-mono text-right font-bold text-amber-700">{fmtINR(t.balanceDue)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          t.status === 'Paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : t.status === 'Partially Paid'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {t.balanceDue > 0 ? (
                          <button
                            type="button"
                            onClick={() => {
                              setPaymentForm(prev => ({
                                ...prev,
                                takhmeenId: t.id,
                                itsNumber: t.itsNumber,
                                hofName: t.hofName,
                                amount: t.balanceDue,
                              }));
                              setActiveTab('wajebaat-payment-entry');
                            }}
                            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-[11px] font-bold cursor-pointer"
                          >
                            Receive
                          </button>
                        ) : (
                          <span className="text-emerald-600 font-bold text-[11px]">Paid</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-PAGE 4: PAYMENT ENTRY */}
      {activeTab === 'wajebaat-payment-entry' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <CreditCard className="w-4 h-4 text-amber-600" />
                  <span>Receive Wajebaat Payment ({selectedHijriYear})</span>
                </h2>
                <p className="text-xs text-slate-500">Record Khums, Zakat, or Fitrah payment against mumin ledger.</p>
              </div>
              <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                Receipt #WAJ-1447-{String(receipts.length + 1).padStart(3, '0')}
              </span>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Member Commitment *
                </label>
                <select
                  required
                  value={paymentForm.takhmeenId}
                  onChange={e => {
                    const sel = yearTakhmeens.find(t => t.id === e.target.value);
                    if (sel) {
                      setPaymentForm({
                        ...paymentForm,
                        takhmeenId: sel.id,
                        itsNumber: sel.itsNumber,
                        hofName: sel.hofName,
                        amount: sel.balanceDue > 0 ? sel.balanceDue : 5000,
                      });
                    }
                  }}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                >
                  <option value="">-- Choose Member from {selectedHijriYear} Register --</option>
                  {yearTakhmeens.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.hofName} ({t.itsNumber}) — Due: {fmtINR(t.balanceDue)} [Pledged: {fmtINR(t.totalTakhmeen)}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Wajebaat Head *</label>
                  <select
                    value={paymentForm.category}
                    onChange={e => setPaymentForm({ ...paymentForm, category: e.target.value as WajebaatCategory })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                  >
                    {WAJEBAAT_CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Amount to Remit (₹) *</label>
                  <input
                    type="number"
                    required
                    min={10}
                    value={paymentForm.amount}
                    onChange={e => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold font-mono text-emerald-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Payment Mode</label>
                  <select
                    value={paymentForm.paymentMode}
                    onChange={e => setPaymentForm({ ...paymentForm, paymentMode: e.target.value as PaymentMode })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                  >
                    <option value="Cash">Cash Counter</option>
                    <option value="UPI">UPI / QR Code</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Bank Transfer">Bank Transfer / NEFT</option>
                    <option value="Card">Debit / Credit Card</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ref / Cheque #</label>
                  <input
                    type="text"
                    value={paymentForm.transactionRef}
                    onChange={e => setPaymentForm({ ...paymentForm, transactionRef: e.target.value })}
                    placeholder="e.g. UTR#99201"
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={paymentForm.date}
                    onChange={e => setPaymentForm({ ...paymentForm, date: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs text-slate-500">Official receipt with Dawat seal will be generated</span>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center space-x-2 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Issue Wajebaat Receipt</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Voucher Preview */}
          <div className="lg:col-span-5 space-y-4">
            {selectedReceiptForPrint && (
              <div className="bg-amber-50/70 border-2 border-dashed border-amber-300 rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                  <div>
                    <span className="text-[10px] font-bold tracking-wider text-amber-800 uppercase">Wajebaat Barakat Voucher</span>
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
                    <span className="text-slate-500">Mumin Name:</span>
                    <span className="font-bold text-slate-900">{selectedReceiptForPrint.hofName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">ITS Number:</span>
                    <span className="font-mono">{selectedReceiptForPrint.itsNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Head:</span>
                    <span className="font-semibold text-amber-900">{selectedReceiptForPrint.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Hijri Year:</span>
                    <span className="font-semibold text-slate-900">{selectedReceiptForPrint.hijriYear}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Payment Mode:</span>
                    <span>{selectedReceiptForPrint.paymentMode}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-amber-200 text-sm font-black text-emerald-900">
                    <span>Amount Remitted:</span>
                    <span className="font-mono text-base">{fmtINR(selectedReceiptForPrint.amount)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Year Receipts */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
                <span>Recent {selectedHijriYear} Remittances</span>
                <span className="text-amber-600">{activeYearReceipts.length} total</span>
              </h3>

              <div className="space-y-2">
                {activeYearReceipts.slice(0, 5).map(r => (
                  <div
                    key={r.id}
                    onClick={() => setSelectedReceiptForPrint(r)}
                    className="p-3 rounded-xl border border-slate-100 hover:border-amber-300 bg-slate-50/50 hover:bg-amber-50/30 transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900">{r.hofName}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{r.receiptNo} • {r.category}</p>
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

      {/* SUB-PAGE 5: OUTSTANDING REPORT */}
      {activeTab === 'wajebaat-outstanding-report' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Wajebaat Outstanding Dues Aging ({selectedHijriYear})
              </h2>
              <p className="text-xs text-slate-500">Unsettled Wajebaat pledges requiring follow-up.</p>
            </div>
            <button
              type="button"
              onClick={() => showToast('Outstanding Wajebaat list exported')}
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
                  <th className="px-4 py-3 text-right">Committed Wajebaat</th>
                  <th className="px-4 py-3 text-right">Paid</th>
                  <th className="px-4 py-3 text-right">Balance Due</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {yearTakhmeens.filter(t => t.balanceDue > 0).map(t => (
                  <tr key={t.id} className="hover:bg-amber-50/30">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">{t.itsNumber}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{t.hofName}</td>
                    <td className="px-4 py-3 text-slate-600">{t.mohallahName}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-900">{fmtINR(t.totalTakhmeen)}</td>
                    <td className="px-4 py-3 text-right font-mono text-emerald-700">{fmtINR(t.totalPaid)}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-amber-700">{fmtINR(t.balanceDue)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentForm(prev => ({
                            ...prev,
                            takhmeenId: t.id,
                            itsNumber: t.itsNumber,
                            hofName: t.hofName,
                            amount: t.balanceDue,
                          }));
                          setActiveTab('wajebaat-payment-entry');
                        }}
                        className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-[11px] font-bold cursor-pointer"
                      >
                        Receive
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-PAGE 6: LEDGER */}
      {activeTab === 'wajebaat-ledger' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Wajebaat Central Remittance Ledger</h2>
              <p className="text-xs text-slate-500">Audited receipt collections for {selectedHijriYear}.</p>
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
                  <th className="px-4 py-3">Member Name</th>
                  <th className="px-4 py-3">ITS</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Mode</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeYearReceipts.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-mono font-bold text-amber-800">{r.receiptNo}</td>
                    <td className="px-4 py-3 text-slate-500 font-mono">{r.date}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{r.hofName}</td>
                    <td className="px-4 py-3 font-mono text-slate-600">{r.itsNumber}</td>
                    <td className="px-4 py-3 font-semibold text-slate-700">{r.category}</td>
                    <td className="px-4 py-3 text-slate-600">{r.paymentMode}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-emerald-900">{fmtINR(r.amount)}</td>
                    <td className="px-4 py-3 text-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setSelectedReceiptForPrint(r)}
                        className="p-1 hover:bg-slate-100 rounded text-slate-600 cursor-pointer"
                        title="Print Voucher"
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

      {/* SUB-PAGE 7: CANCELLED RECEIPTS */}
      {activeTab === 'wajebaat-cancelled-receipts' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Ban className="w-4 h-4 text-rose-600" />
                <span>Cancelled Wajebaat Receipts Register</span>
              </h2>
              <p className="text-xs text-slate-500">Revoked vouchers and balance restoration audit trail.</p>
            </div>
            <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
              {cancelledYearReceipts.length} Cancelled
            </span>
          </div>

          {cancelledYearReceipts.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
              <p className="text-xs">No cancelled receipts in {selectedHijriYear}.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Receipt #</th>
                    <th className="px-4 py-3">Original Date</th>
                    <th className="px-4 py-3">Member Name</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3 text-right">Amount Voided</th>
                    <th className="px-4 py-3">Cancelled By</th>
                    <th className="px-4 py-3">Cancellation Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cancelledYearReceipts.map(r => (
                    <tr key={r.id} className="bg-rose-50/20 hover:bg-rose-50/40">
                      <td className="px-4 py-3 font-mono font-bold text-rose-800 line-through">{r.receiptNo}</td>
                      <td className="px-4 py-3 text-slate-500 font-mono">{r.date}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{r.hofName}</td>
                      <td className="px-4 py-3 text-slate-700">{r.category}</td>
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

      {/* Modal: Add Hijri Year */}
      {showYearModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Add New Hijri Fiscal Year</h3>
              <button
                type="button"
                onClick={() => setShowYearModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveYear} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Hijri Year Code *</label>
                <input
                  type="text"
                  required
                  value={yearForm.hijriYear}
                  onChange={e => setYearForm({ ...yearForm, hijriYear: e.target.value })}
                  placeholder="e.g. 1449 Hijri"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Display Label *</label>
                <input
                  type="text"
                  required
                  value={yearForm.label}
                  onChange={e => setYearForm({ ...yearForm, label: e.target.value })}
                  placeholder="e.g. 1449 Hijri (2028)"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={yearForm.startDate}
                    onChange={e => setYearForm({ ...yearForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={yearForm.endDate}
                    onChange={e => setYearForm({ ...yearForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Status</label>
                <select
                  value={yearForm.status}
                  onChange={e => setYearForm({ ...yearForm, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                >
                  <option value="Upcoming">Upcoming</option>
                  <option value="Active">Active</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowYearModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  Save Year
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Takhmeen */}
      {showTakhmeenModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                Declare Wajebaat Takhmeen ({selectedHijriYear})
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ITS Number *</label>
                  <input
                    type="text"
                    required
                    value={takhmeenForm.itsNumber}
                    onChange={e => handleItsLookup(e.target.value)}
                    placeholder="e.g. 30489122"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">HOF Name *</label>
                  <input
                    type="text"
                    required
                    value={takhmeenForm.hofName}
                    onChange={e => setTakhmeenForm({ ...takhmeenForm, hofName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mohallah</label>
                <input
                  type="text"
                  value={takhmeenForm.mohallahName}
                  onChange={e => setTakhmeenForm({ ...takhmeenForm, mohallahName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-2 border-t border-slate-100">
                <p className="font-bold text-slate-800 mb-2">Category-wise Commitment Figures (₹)</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-0.5">Khums (₹)</label>
                    <input
                      type="number"
                      value={takhmeenForm.khums}
                      onChange={e => setTakhmeenForm({ ...takhmeenForm, khums: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-0.5">Zakat-ul-Maal (₹)</label>
                    <input
                      type="number"
                      value={takhmeenForm.zakatMaal}
                      onChange={e => setTakhmeenForm({ ...takhmeenForm, zakatMaal: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-0.5">Zakat-ul-Fitr (₹)</label>
                    <input
                      type="number"
                      value={takhmeenForm.zakatFitr}
                      onChange={e => setTakhmeenForm({ ...takhmeenForm, zakatFitr: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-0.5">Kaffarah (₹)</label>
                    <input
                      type="number"
                      value={takhmeenForm.kaffarah}
                      onChange={e => setTakhmeenForm({ ...takhmeenForm, kaffarah: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-0.5">Haqqun-Nafs (₹)</label>
                    <input
                      type="number"
                      value={takhmeenForm.haqqunNafs}
                      onChange={e => setTakhmeenForm({ ...takhmeenForm, haqqunNafs: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-0.5">Nazr-ul-Malaeka (₹)</label>
                    <input
                      type="number"
                      value={takhmeenForm.nazrulMalaeka}
                      onChange={e => setTakhmeenForm({ ...takhmeenForm, nazrulMalaeka: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                    />
                  </div>
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
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  Register Commitment
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
                <span>Void Wajebaat Receipt #{cancellingReceipt.receiptNo}</span>
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
              Voiding this receipt will revert <span className="font-bold text-slate-900">{fmtINR(cancellingReceipt.amount)}</span> back to <span className="font-bold text-slate-900">{cancellingReceipt.hofName}</span>&#39;s balance in {cancellingReceipt.hijriYear}.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Reason for Revocation *
              </label>
              <textarea
                rows={3}
                required
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                placeholder="e.g. Counter error, wrong head selected, payer bounced..."
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
                Confirm Revoke
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
