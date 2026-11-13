import React, { useState, useMemo, useEffect } from 'react';
import {
  Layers, Plus, Search, Download, CreditCard, CheckCircle2, X,
  AlertCircle, Ban, FileSpreadsheet
} from 'lucide-react';
import { FinancialYear, UserProfile } from '../../types';
import {
  SchemeName,
  SchemeCategory,
  SchemeTakhmeen,
  SchemeReceipt,
  PaymentMode,
  getStoredSchemeCategories,
  saveStoredSchemeCategories,
  getStoredSchemeTakhmeens,
  saveStoredSchemeTakhmeens,
  getStoredSchemeReceipts,
  saveStoredSchemeReceipts,
} from '../../utils/part2bManagement';
import { getStoredHofs } from '../../utils/memberMaster';
import { appendActivityLog } from '../../utils/rbac';
import {
  fmtINR,
  exportRowsToCsv,
  toOfficialReceiptData,
} from '../../utils/communitySchemes';
import { TrustOfficialReceiptModal } from '../common/TrustOfficialReceiptModal';
import { OfficialReceiptData } from '../faiz-hub/FaizOfficialPrintReceipt';
import { TableActionButtons, SchemeViewModal, DetailField, CancelReceiptModal } from './SchemeSharedUI';

export type LegacySchemeTab =
  | 'scheme-takhmeen-master'
  | 'scheme-payment-entry'
  | 'scheme-category-master'
  | 'scheme-outstanding-report'
  | 'scheme-ledger-report'
  | 'scheme-cancelled-receipts';

const LEGACY_SCHEMES: SchemeName[] = ['Hoob', 'Corpus Fund', 'Sarkari Lagat'];

interface Props {
  initialTab?: LegacySchemeTab;
  currentUser: UserProfile;
  financialYear: FinancialYear;
  showToast: (msg: string) => void;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export const LegacySchemesView: React.FC<Props> = ({
  initialTab = 'scheme-takhmeen-master',
  currentUser,
  financialYear,
  showToast,
  canAdd,
  canEdit,
  canDelete,
}) => {
  const [selectedScheme, setSelectedScheme] = useState<SchemeName>('Hoob');
  const [activeTab, setActiveTab] = useState<LegacySchemeTab>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);
  const [categories, setCategories] = useState<SchemeCategory[]>(() => getStoredSchemeCategories());
  const [takhmeens, setTakhmeens] = useState<SchemeTakhmeen[]>(() => getStoredSchemeTakhmeens());
  const [receipts, setReceipts] = useState<SchemeReceipt[]>(() => getStoredSchemeReceipts());
  const [hofs] = useState(() => getStoredHofs());
  const [searchQuery, setSearchQuery] = useState('');

  const [showTakhmeenModal, setShowTakhmeenModal] = useState(false);
  const [takhmeenForm, setTakhmeenForm] = useState({
    itsNumber: '',
    hofName: '',
    mohallahName: 'Saifee Mohalla',
    categoryCode: '',
    committedAmount: 11000,
  });

  const [showCatModal, setShowCatModal] = useState(false);
  const [editingCat, setEditingCat] = useState<SchemeCategory | null>(null);
  const [catForm, setCatForm] = useState({
    name: '',
    code: '',
    suggestedTakhmeen: 11000,
    description: '',
    isActive: true,
  });

  const [paymentForm, setPaymentForm] = useState({
    takhmeenId: '',
    itsNumber: '',
    hofName: '',
    amount: 5000,
    paymentMode: 'Cash' as PaymentMode,
    transactionRef: '',
    date: new Date().toISOString().split('T')[0],
  });

  const [viewDetails, setViewDetails] = useState<{
    title: string;
    subtitle: string;
    fields: DetailField[];
    official?: Partial<OfficialReceiptData>;
  } | null>(null);
  const [soloPrintData, setSoloPrintData] = useState<Partial<OfficialReceiptData> | null>(null);
  const [cancelTarget, setCancelTarget] = useState<SchemeReceipt | null>(null);

  const schemeCategories = useMemo(
    () => categories.filter((c) => c.schemeName === selectedScheme),
    [categories, selectedScheme]
  );
  const schemeTakhmeens = useMemo(
    () => takhmeens.filter((t) => t.schemeName === selectedScheme),
    [takhmeens, selectedScheme]
  );
  const activeReceipts = useMemo(
    () => receipts.filter((r) => r.schemeName === selectedScheme && !r.isCancelled),
    [receipts, selectedScheme]
  );
  const cancelledReceipts = useMemo(
    () => receipts.filter((r) => r.schemeName === selectedScheme && r.isCancelled),
    [receipts, selectedScheme]
  );

  const mapReceiptOfficial = (r: SchemeReceipt): Partial<OfficialReceiptData> => {
    const hof = hofs.find((h) => h.itsNumber === r.itsNumber);
    return toOfficialReceiptData({
      receiptNo: r.receiptNo,
      date: r.date,
      memberName: r.hofName,
      itsNumber: r.itsNumber,
      sabeelNo: hof?.sabeelNo,
      address: hof?.fullAddress,
      mohallahName: hof?.mohallahName,
      amount: r.amount,
      paymentMode: r.paymentMode,
      schemeTitle: r.isCancelled ? `${r.schemeName} (CANCELLED)` : r.schemeName,
    });
  };

  const handleSaveTakhmeen = (e: React.FormEvent) => {
    e.preventDefault();
    if (!takhmeenForm.hofName || !takhmeenForm.itsNumber || takhmeenForm.committedAmount <= 0) {
      showToast('Enter valid ITS, Name, and pledge amount.');
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
      `Registered ${selectedScheme} pledge of ${fmtINR(newT.committedAmount)} for ${newT.hofName}`
    );
    showToast(`Registered ${selectedScheme} commitment for ${newT.hofName}.`);
    setShowTakhmeenModal(false);
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentForm.takhmeenId || paymentForm.amount <= 0) {
      showToast('Select a pledge and enter a valid amount.');
      return;
    }
    const recNo = `SCH-${new Date().getFullYear()}-${String(receipts.length + 1).padStart(3, '0')}`;
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

    const updatedTakhmeens = takhmeens.map((t) => {
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
    setSoloPrintData(mapReceiptOfficial(newR));
    showToast(`Receipt ${recNo} generated.`);
  };

  const handleConfirmCancel = (reason: string) => {
    if (!cancelTarget) return;
    const updatedReceipts = receipts.map((r) =>
      r.id === cancelTarget.id
        ? {
            ...r,
            isCancelled: true,
            cancelledAt: new Date().toISOString().split('T')[0],
            cancelledBy: currentUser.username,
            cancellationReason: reason,
          }
        : r
    );
    const updatedTakhmeens = takhmeens.map((t) => {
      if (t.id === cancelTarget.takhmeenId) {
        const revertedPaid = Math.max(0, t.paidAmount - cancelTarget.amount);
        return {
          ...t,
          paidAmount: revertedPaid,
          balanceAmount: t.committedAmount - revertedPaid,
          status: (revertedPaid === 0 ? 'Pledged' : 'Partially Paid') as 'Pledged' | 'Partially Paid',
        };
      }
      return t;
    });
    setReceipts(updatedReceipts);
    saveStoredSchemeReceipts(updatedReceipts);
    setTakhmeens(updatedTakhmeens);
    saveStoredSchemeTakhmeens(updatedTakhmeens);
    showToast(`Receipt ${cancelTarget.receiptNo} cancelled.`);
    setCancelTarget(null);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catForm.name || !catForm.code) return;
    const updated = editingCat
      ? categories.map((c) => (c.id === editingCat.id ? { ...c, ...catForm } : c))
      : [...categories, { id: `scat-${Date.now()}`, schemeName: selectedScheme, ...catForm }];
    setCategories(updated);
    saveStoredSchemeCategories(updated);
    showToast(editingCat ? 'Category updated.' : 'Category added.');
    setShowCatModal(false);
    setEditingCat(null);
  };

  const tabs: { key: LegacySchemeTab; label: string; icon: React.ReactNode }[] = [
    { key: 'scheme-takhmeen-master', label: 'Takhmeen Master', icon: <Layers className="w-3.5 h-3.5" /> },
    { key: 'scheme-payment-entry', label: 'Payment Entry (POS)', icon: <CreditCard className="w-3.5 h-3.5" /> },
    { key: 'scheme-category-master', label: 'Category Master', icon: <Layers className="w-3.5 h-3.5" /> },
    { key: 'scheme-outstanding-report', label: 'Outstanding Report', icon: <AlertCircle className="w-3.5 h-3.5" /> },
    { key: 'scheme-ledger-report', label: 'Ledger Report', icon: <FileSpreadsheet className="w-3.5 h-3.5" /> },
    { key: 'scheme-cancelled-receipts', label: 'Cancelled Receipts', icon: <Ban className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-black text-slate-900">
              Additional Community Endowments (Hoob / Corpus Fund / Sarkari Lagat)
            </h2>
            <p className="text-[11px] text-slate-500">
              Annual takhmeen pledges, categories, and outstanding recovery ledgers.
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            {LEGACY_SCHEMES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSelectedScheme(s)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                  selectedScheme === s
                    ? 'bg-amber-400 text-slate-950'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-100">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === t.key
                  ? 'bg-slate-900 text-amber-300'
                  : 'bg-slate-50 text-slate-700 hover:bg-amber-50 border border-slate-200'
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'scheme-takhmeen-master' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900">{selectedScheme} — Takhmeen Master</h3>
            {canAdd && (
              <button
                type="button"
                onClick={() => {
                  setTakhmeenForm({
                    itsNumber: '',
                    hofName: '',
                    mohallahName: 'Saifee Mohalla',
                    categoryCode: schemeCategories[0]?.code || '',
                    committedAmount: schemeCategories[0]?.suggestedTakhmeen || 11000,
                  });
                  setShowTakhmeenModal(true);
                }}
                className="px-3.5 py-2 bg-amber-400 text-slate-950 rounded-xl text-xs font-black inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Pledge</span>
              </button>
            )}
          </div>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ITS, name, or mohallah..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl"
            />
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">ITS</th>
                  <th className="px-4 py-3">Member Name</th>
                  <th className="px-4 py-3 text-right">Committed</th>
                  <th className="px-4 py-3 text-right">Paid</th>
                  <th className="px-4 py-3 text-right">Balance</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {schemeTakhmeens
                  .filter(
                    (t) =>
                      t.hofName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      t.itsNumber.includes(searchQuery)
                  )
                  .map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono font-bold text-amber-900">{t.itsNumber}</td>
                      <td className="px-4 py-3 font-bold text-slate-900">{t.hofName}</td>
                      <td className="px-4 py-3 text-right font-mono">{fmtINR(t.committedAmount)}</td>
                      <td className="px-4 py-3 text-right font-mono text-emerald-700">{fmtINR(t.paidAmount)}</td>
                      <td className="px-4 py-3 text-right font-mono text-amber-800">{fmtINR(t.balanceAmount)}</td>
                      <td className="px-4 py-3 text-right">
                        {t.balanceAmount > 0 ? (
                          <button
                            type="button"
                            onClick={() => {
                              setPaymentForm((p) => ({
                                ...p,
                                takhmeenId: t.id,
                                itsNumber: t.itsNumber,
                                hofName: t.hofName,
                                amount: t.balanceAmount,
                              }));
                              setActiveTab('scheme-payment-entry');
                            }}
                            className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                          >
                            Pay Dues
                          </button>
                        ) : (
                          <span className="text-emerald-700 font-bold inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Settled
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

      {activeTab === 'scheme-payment-entry' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h3 className="text-sm font-black text-slate-900">Receive Payment — {selectedScheme}</h3>
          <form onSubmit={handlePaymentSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <select
              required
              value={paymentForm.takhmeenId}
              onChange={(e) => {
                const sel = schemeTakhmeens.find((t) => t.id === e.target.value);
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
              className="md:col-span-2 px-3 py-2 border border-slate-300 rounded-xl bg-white"
            >
              <option value="">-- Select Pledged Member --</option>
              {schemeTakhmeens.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.hofName} ({t.itsNumber}) — Due: {fmtINR(t.balanceAmount)}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
              className="px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold"
            />
            <select
              value={paymentForm.paymentMode}
              onChange={(e) => setPaymentForm({ ...paymentForm, paymentMode: e.target.value as PaymentMode })}
              className="px-3 py-2 border border-slate-300 rounded-xl bg-white"
            >
              <option value="Cash">Cash</option>
              <option value="Cheque">Cheque</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="UPI">UPI</option>
            </select>
            <button
              type="submit"
              className="md:col-span-2 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black rounded-xl cursor-pointer"
            >
              Generate Official Receipt
            </button>
          </form>
        </div>
      )}

      {activeTab === 'scheme-category-master' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900">{selectedScheme} — Categories</h3>
            {canAdd && (
              <button
                type="button"
                onClick={() => {
                  setEditingCat(null);
                  setCatForm({ name: '', code: '', suggestedTakhmeen: 11000, description: '', isActive: true });
                  setShowCatModal(true);
                }}
                className="px-3.5 py-2 bg-amber-400 text-slate-950 rounded-xl text-xs font-black cursor-pointer"
              >
                + Add Category
              </button>
            )}
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3 text-right">Suggested</th>
                  <th className="px-4 py-3 text-right">Edit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {schemeCategories.map((c) => (
                  <tr key={c.id}>
                    <td className="px-4 py-3 font-mono font-bold">{c.code}</td>
                    <td className="px-4 py-3 font-bold">{c.name}</td>
                    <td className="px-4 py-3 text-right font-mono">{fmtINR(c.suggestedTakhmeen)}</td>
                    <td className="px-4 py-3 text-right">
                      {canEdit && (
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
                          className="text-blue-700 font-bold hover:underline cursor-pointer"
                        >
                          Edit
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

      {(activeTab === 'scheme-outstanding-report' || activeTab === 'scheme-ledger-report' || activeTab === 'scheme-cancelled-receipts') && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900">
              {selectedScheme} — {tabs.find((t) => t.key === activeTab)?.label}
            </h3>
            <button
              type="button"
              onClick={() =>
                exportRowsToCsv(
                  `${selectedScheme.replace(/\s+/g, '_')}.csv`,
                  ['Ref', 'Date', 'ITS', 'Member', 'Amount'],
                  (activeTab === 'scheme-cancelled-receipts' ? cancelledReceipts : activeReceipts).map((r) => [
                    r.receiptNo,
                    r.date,
                    r.itsNumber,
                    r.hofName,
                    r.amount,
                  ])
                )
              }
              className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Receipt / ITS</th>
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(activeTab === 'scheme-cancelled-receipts' ? cancelledReceipts : activeReceipts).map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3 font-mono font-bold">{r.receiptNo} • {r.itsNumber}</td>
                    <td className="px-4 py-3 font-bold">{r.hofName}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-emerald-800">{fmtINR(r.amount)}</td>
                    <td className="px-4 py-3 text-right">
                      <TableActionButtons
                        compact
                        canEdit={false}
                        canDelete={canDelete && !r.isCancelled}
                        onView={() =>
                          setViewDetails({
                            title: `${r.schemeName} Receipt`,
                            subtitle: r.receiptNo,
                            official: mapReceiptOfficial(r),
                            fields: [
                              { label: 'Receipt No', value: r.receiptNo, mono: true },
                              { label: 'Date', value: r.date },
                              { label: 'ITS', value: r.itsNumber, mono: true },
                              { label: 'Member', value: r.hofName },
                              { label: 'Amount', value: fmtINR(r.amount), highlight: true },
                            ],
                          })
                        }
                        onPrint={() => window.print()}
                        onSoloPrint={() => setSoloPrintData(mapReceiptOfficial(r))}
                        onCancel={!r.isCancelled ? () => setCancelTarget(r) : undefined}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showTakhmeenModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold">Add Pledge in {selectedScheme}</h3>
              <button type="button" onClick={() => setShowTakhmeenModal(false)} className="cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSaveTakhmeen} className="space-y-3 text-xs">
              <input
                type="text"
                required
                placeholder="ITS Number"
                value={takhmeenForm.itsNumber}
                onChange={(e) => {
                  const found = hofs.find((h) => h.itsNumber === e.target.value);
                  setTakhmeenForm((p) => ({
                    ...p,
                    itsNumber: e.target.value,
                    hofName: found?.fullName || p.hofName,
                    mohallahName: found?.mohallahName || p.mohallahName,
                  }));
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
              />
              <input
                type="text"
                required
                placeholder="HOF Full Name"
                value={takhmeenForm.hofName}
                onChange={(e) => setTakhmeenForm((p) => ({ ...p, hofName: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
              <input
                type="number"
                required
                min={100}
                value={takhmeenForm.committedAmount}
                onChange={(e) => setTakhmeenForm((p) => ({ ...p, committedAmount: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold"
              />
              <button type="submit" className="w-full py-2 bg-amber-400 text-slate-950 font-black rounded-xl cursor-pointer">
                Save Pledge
              </button>
            </form>
          </div>
        </div>
      )}

      {showCatModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold">{editingCat ? 'Edit Category' : 'Add Category'}</h3>
              <button type="button" onClick={() => setShowCatModal(false)} className="cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSaveCategory} className="space-y-3 text-xs">
              <input
                type="text"
                required
                placeholder="Category Name"
                value={catForm.name}
                onChange={(e) => setCatForm((p) => ({ ...p, name: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
              <input
                type="text"
                required
                placeholder="Code"
                value={catForm.code}
                onChange={(e) => setCatForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
              />
              <input
                type="number"
                value={catForm.suggestedTakhmeen}
                onChange={(e) => setCatForm((p) => ({ ...p, suggestedTakhmeen: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
              />
              <button type="submit" className="w-full py-2 bg-amber-400 text-slate-950 font-black rounded-xl cursor-pointer">
                Save Category
              </button>
            </form>
          </div>
        </div>
      )}

      <SchemeViewModal
        isOpen={!!viewDetails}
        onClose={() => setViewDetails(null)}
        title={viewDetails?.title || ''}
        subtitle={viewDetails?.subtitle}
        fields={viewDetails?.fields || []}
        onSoloPrint={
          viewDetails?.official
            ? () => {
                setSoloPrintData(viewDetails.official!);
                setViewDetails(null);
              }
            : undefined
        }
      />

      <TrustOfficialReceiptModal
        isOpen={!!soloPrintData}
        onClose={() => setSoloPrintData(null)}
        receiptData={soloPrintData || undefined}
        currentUser={currentUser}
      />

      <CancelReceiptModal
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        receiptLabel={cancelTarget?.receiptNo || ''}
        memberName={cancelTarget?.hofName || ''}
        amountFormatted={fmtINR(cancelTarget?.amount || 0)}
        onConfirm={handleConfirmCancel}
      />
    </div>
  );
};
