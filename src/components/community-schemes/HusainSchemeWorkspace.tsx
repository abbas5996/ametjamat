import React, { useState } from 'react';
import {
  LayoutDashboard, FileSpreadsheet, ClipboardList, BookOpen,
  ArrowDownUp, CalendarClock, Ban, EyeOff, Plus, X, CheckCircle2
} from 'lucide-react';
import { FinancialYear, UserProfile } from '../../types';
import {
  HusainContribution,
  HusainSchemeRequest,
  HusainWithdrawal,
  HusainHideAccountSettings,
  HusainRequestStatus,
  HusainContributionStatus,
  SchemeReceiptMode,
  fmtINR,
  formatDisplayDate,
  getTodayIso,
  toOfficialReceiptData,
  getStoredHusainContributions,
  saveStoredHusainContributions,
  getStoredHusainRequests,
  saveStoredHusainRequests,
  getStoredHusainWithdrawals,
  saveStoredHusainWithdrawals,
  getStoredHusainHideSettings,
  saveStoredHusainHideSettings,
  getStoredHusainEnrolledIts,
  saveStoredHusainEnrolledIts,
} from '../../utils/communitySchemes';
import { numberToWordsIndian } from '../../utils/fmbPart2Data';
import { appendActivityLog } from '../../utils/rbac';
import { TrustOfficialReceiptModal } from '../common/TrustOfficialReceiptModal';
import { OfficialReceiptData } from '../faiz-hub/FaizOfficialPrintReceipt';
import { useMemberSabeelLookup } from './useSchemeSearch';
import {
  SchemeViewModal,
  DetailField,
  SchemeBulkPrintModal,
  CancelReceiptModal,
} from './SchemeSharedUI';
import { HusainDashboardView } from './HusainDashboardView';
import { HusainOperationsViews, HusainOperationsSubPage } from './HusainOperationsViews';

export type HusainSchemeSubPage = 'dashboard' | HusainOperationsSubPage;

interface Props {
  activeSubPage: HusainSchemeSubPage;
  onSubPageChange: (page: HusainSchemeSubPage) => void;
  currentUser: UserProfile;
  financialYear: FinancialYear;
  showToast: (msg: string) => void;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export const HusainSchemeWorkspace: React.FC<Props> = ({
  activeSubPage,
  onSubPageChange,
  currentUser,
  financialYear,
  showToast,
  canAdd,
  canEdit,
  canDelete,
}) => {
  const [contributions, setContributions] = useState<HusainContribution[]>(() =>
    getStoredHusainContributions()
  );
  const [requests, setRequests] = useState<HusainSchemeRequest[]>(() =>
    getStoredHusainRequests()
  );
  const [withdrawals, setWithdrawals] = useState<HusainWithdrawal[]>(() =>
    getStoredHusainWithdrawals()
  );
  const [hideSettings, setHideSettings] = useState<HusainHideAccountSettings>(() =>
    getStoredHusainHideSettings()
  );
  const [enrolledIts, setEnrolledIts] = useState<string[]>(() =>
    getStoredHusainEnrolledIts()
  );

  const { directory, findByIts, findBySabeel } = useMemberSabeelLookup();

  // Modals
  const [viewModal, setViewModal] = useState<{
    title: string;
    subtitle: string;
    fields: DetailField[];
    official?: Partial<OfficialReceiptData>;
  } | null>(null);
  const [soloPrintData, setSoloPrintData] = useState<Partial<OfficialReceiptData> | null>(null);
  const [bulkPrintList, setBulkPrintList] = useState<Partial<OfficialReceiptData>[] | null>(null);
  const [cancelTarget, setCancelTarget] = useState<HusainContribution | null>(null);
  const [editingContribution, setEditingContribution] = useState<HusainContribution | null>(null);

  // New Contribution Modal
  const [showNewModal, setShowNewModal] = useState(false);
  const [newIts, setNewIts] = useState('');
  const [newSabeel, setNewSabeel] = useState('');
  const [newName, setNewName] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newMohallah, setNewMohallah] = useState('');
  const [newAmount, setNewAmount] = useState('25000');
  const [newDate, setNewDate] = useState(getTodayIso());
  const [newTenure, setNewTenure] = useState('6');
  const [newMode, setNewMode] = useState<SchemeReceiptMode>('Online');
  const [newRef, setNewRef] = useState('');
  const [newNotes, setNewNotes] = useState('');

  const populateNewMember = (its: string, sabeel: string) => {
    const match = (its ? findByIts(its) : undefined) || (sabeel ? findBySabeel(sabeel) : undefined);
    if (match) {
      setNewIts(match.itsNumber);
      setNewSabeel(match.sabeelNo);
      setNewName(match.fullName);
      setNewAddress(match.address);
      setNewMohallah(match.mohallahName);
    }
  };

  const mapContribOfficial = (c: HusainContribution): Partial<OfficialReceiptData> =>
    toOfficialReceiptData({
      receiptNo: c.receiptNo,
      date: c.contributionDate,
      memberName: c.memberName,
      itsNumber: c.itsNumber,
      sabeelNo: c.sabeelNo,
      address: c.address,
      mohallahName: c.mohallahName,
      amount: c.amount,
      paymentMode: c.paymentMode,
      chequeNo: c.chequeNo,
      chequeDate: c.chequeDate,
      bankName: c.bankName,
      schemeTitle: c.isCancelled ? 'Husain Scheme (CANCELLED)' : 'Husain Scheme',
    });

  const handleCreateContribution = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(newAmount);
    if (!newIts.trim() || !newName.trim() || isNaN(amt) || amt <= 0) {
      showToast('Enter valid ITS No., Member Name, and Amount.');
      return;
    }

    const months = Math.max(1, Number(newTenure) || 6);
    const matDateObj = new Date(`${newDate}T00:00:00`);
    matDateObj.setMonth(matDateObj.getMonth() + months);
    const maturityDate = matDateObj.toISOString().split('T')[0];

    const recNo = `HS-${new Date().getFullYear()}-${String(contributions.length + 301)}`;
    const created: HusainContribution = {
      id: `hs-c-${Date.now()}`,
      receiptNo: recNo,
      itsNumber: newIts.trim(),
      sabeelNo: newSabeel.trim() || '—',
      memberName: newName.trim(),
      mohallahName: newMohallah.trim() || 'Burhani Park',
      address: newAddress.trim() || 'Burhani Park, Vatwa, Ahmedabad',
      contributionDate: newDate,
      maturityDate,
      tenureMonths: months,
      amount: amt,
      amountInWords: numberToWordsIndian(amt),
      paymentMode: newMode,
      transactionRef: newRef.trim() || undefined,
      status: 'Active',
      notes: newNotes.trim() || `${months}-month Husain Scheme contribution`,
      collectedBy: currentUser.username,
      financialYear,
      isCancelled: false,
    };

    const nextContribs = [created, ...contributions];
    setContributions(nextContribs);
    saveStoredHusainContributions(nextContribs);

    if (!enrolledIts.includes(created.itsNumber)) {
      const nextEnrolled = [...enrolledIts, created.itsNumber];
      setEnrolledIts(nextEnrolled);
      saveStoredHusainEnrolledIts(nextEnrolled);
    }

    appendActivityLog(
      currentUser.username,
      'Community Schemes',
      'Husain Scheme — Contribution',
      'PAYMENT',
      `Issued ${recNo} (${fmtINR(amt)}) for ${created.memberName}`
    );
    showToast(`Contribution ${recNo} recorded and member enrolled.`);
    setShowNewModal(false);
    setSoloPrintData(mapContribOfficial(created));
  };

  const handleEnrollMember = (itsNumber: string) => {
    if (enrolledIts.includes(itsNumber)) return;
    const next = [...enrolledIts, itsNumber];
    setEnrolledIts(next);
    saveStoredHusainEnrolledIts(next);
    const member = findByIts(itsNumber);
    showToast(`Enrolled ${member?.fullName || itsNumber} into Husain Scheme.`);
  };

  const handleViewContribution = (c: HusainContribution) => {
    setViewModal({
      title: 'Husain Scheme Contribution Details',
      subtitle: `${c.receiptNo} • ${c.status}`,
      official: mapContribOfficial(c),
      fields: [
        { label: 'Receipt No', value: c.receiptNo, mono: true },
        { label: 'Contribution Date', value: formatDisplayDate(c.contributionDate) },
        { label: 'Maturity Date', value: formatDisplayDate(c.maturityDate) },
        { label: 'Tenure', value: `${c.tenureMonths} Months` },
        { label: 'Member Name', value: c.memberName },
        { label: 'ITS / Sabeel', value: `${c.itsNumber} / ${c.sabeelNo}`, mono: true },
        { label: 'Payment Mode', value: c.paymentMode },
        { label: 'Reference / Cheque', value: c.transactionRef || c.chequeNo || '—', mono: true },
        { label: 'Address', value: c.address },
        { label: 'Notes', value: c.notes || '—' },
        {
          label: 'Amount & In Words',
          value: `${fmtINR(c.amount)} (${c.amountInWords})`,
          highlight: true,
        },
      ],
    });
  };

  const handleSaveContributionEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContribution) return;
    const next = contributions.map((c) =>
      c.id === editingContribution.id
        ? { ...editingContribution, amountInWords: numberToWordsIndian(editingContribution.amount) }
        : c
    );
    setContributions(next);
    saveStoredHusainContributions(next);
    showToast(`Updated ${editingContribution.receiptNo}.`);
    setEditingContribution(null);
  };

  const handleConfirmVoid = (reason: string) => {
    if (!cancelTarget) return;
    const next = contributions.map((c) =>
      c.id === cancelTarget.id
        ? {
            ...c,
            isCancelled: true,
            cancelledAt: getTodayIso(),
            cancelledBy: currentUser.username,
            cancellationReason: reason,
          }
        : c
    );
    setContributions(next);
    saveStoredHusainContributions(next);
    appendActivityLog(
      currentUser.username,
      'Community Schemes',
      'Husain Scheme — Cancelled Receipts',
      'CANCEL_RECEIPT',
      `Voided ${cancelTarget.receiptNo}: ${reason}`
    );
    showToast(`Receipt ${cancelTarget.receiptNo} moved to Cancelled Receipts log.`);
    setCancelTarget(null);
  };

  const handleRestoreContribution = (c: HusainContribution) => {
    const next = contributions.map((item) =>
      item.id === c.id
        ? {
            ...item,
            isCancelled: false,
            cancelledAt: undefined,
            cancelledBy: undefined,
            cancellationReason: undefined,
          }
        : item
    );
    setContributions(next);
    saveStoredHusainContributions(next);
    showToast(`Restored ${c.receiptNo} to active ledger.`);
  };

  const handleRenewContribution = (c: HusainContribution) => {
    const currentMat = new Date(`${c.maturityDate}T00:00:00`);
    currentMat.setMonth(currentMat.getMonth() + 6);
    const nextMaturity = currentMat.toISOString().split('T')[0];

    const next = contributions.map((item) =>
      item.id === c.id
        ? {
            ...item,
            maturityDate: nextMaturity,
            tenureMonths: item.tenureMonths + 6,
            status: 'Renewed' as HusainContributionStatus,
            notes: `Renewed +6 months on ${getTodayIso()}`,
          }
        : item
    );
    setContributions(next);
    saveStoredHusainContributions(next);
    showToast(`Renewed ${c.receiptNo} for 6 more months (until ${formatDisplayDate(nextMaturity)}).`);
  };

  const handleCreateRequest = (reqInput: Omit<HusainSchemeRequest, 'id' | 'requestNo' | 'status'>) => {
    const newReq: HusainSchemeRequest = {
      id: `hs-req-${Date.now()}`,
      requestNo: `HSR-${new Date().getFullYear()}-${String(requests.length + 1).padStart(2, '0')}`,
      status: 'Pending',
      ...reqInput,
    };
    const next = [newReq, ...requests];
    setRequests(next);
    saveStoredHusainRequests(next);
    showToast(`Request ${newReq.requestNo} logged for ${newReq.memberName}.`);
  };

  const handleUpdateRequestStatus = (id: string, status: HusainRequestStatus) => {
    const next = requests.map((r) =>
      r.id === id
        ? { ...r, status, reviewedBy: currentUser.username, reviewedAt: getTodayIso() }
        : r
    );
    setRequests(next);
    saveStoredHusainRequests(next);

    if (status === 'Approved') {
      const target = requests.find((r) => r.id === id);
      if (target?.requestType === 'Enrollment') {
        handleEnrollMember(target.itsNumber);
      }
    }
    showToast(`Request status updated to ${status}.`);
  };

  const handleCreateWithdrawal = (input: {
    contributionId: string;
    withdrawalAmount: number;
    payoutMode: SchemeReceiptMode;
    remarks: string;
  }) => {
    const src = contributions.find((c) => c.id === input.contributionId);
    if (!src) return;
    const amt = Math.min(src.amount, Math.max(1, input.withdrawalAmount));
    const voucherNo = `HSW-${new Date().getFullYear()}-${String(withdrawals.length + 1).padStart(2, '0')}`;
    const newWd: HusainWithdrawal = {
      id: `hs-wd-${Date.now()}`,
      voucherNo,
      contributionId: src.id,
      receiptNo: src.receiptNo,
      itsNumber: src.itsNumber,
      sabeelNo: src.sabeelNo,
      memberName: src.memberName,
      mohallahName: src.mohallahName,
      contributionAmount: src.amount,
      withdrawalAmount: amt,
      pendingRefundAmount: amt,
      requestDate: getTodayIso(),
      payoutMode: input.payoutMode,
      status: 'Pending Refund',
      remarks: input.remarks || 'Member withdrawal initiated',
    };

    const nextWd = [newWd, ...withdrawals];
    setWithdrawals(nextWd);
    saveStoredHusainWithdrawals(nextWd);

    const nextContribs = contributions.map((c) =>
      c.id === src.id ? { ...c, status: 'Refund Pending' as HusainContributionStatus } : c
    );
    setContributions(nextContribs);
    saveStoredHusainContributions(nextContribs);
    showToast(`Withdrawal ${voucherNo} created (${fmtINR(amt)} pending refund).`);
  };

  const handleProcessWithdrawalPayout = (
    id: string,
    paidNow: number,
    mode: SchemeReceiptMode,
    ref: string
  ) => {
    const target = withdrawals.find((w) => w.id === id);
    if (!target || paidNow <= 0) return;

    const remaining = Math.max(0, target.pendingRefundAmount - paidNow);
    const nextStatus = remaining === 0 ? 'Completed' : 'Partially Refunded';

    const nextWd = withdrawals.map((w) =>
      w.id === id
        ? {
            ...w,
            pendingRefundAmount: remaining,
            status: nextStatus as HusainWithdrawal['status'],
            payoutMode: mode,
            payoutRef: ref || w.payoutRef,
            processedDate: getTodayIso(),
            processedBy: currentUser.username,
          }
        : w
    );
    setWithdrawals(nextWd);
    saveStoredHusainWithdrawals(nextWd);

    if (remaining === 0) {
      const nextContribs = contributions.map((c) =>
        c.id === target.contributionId
          ? { ...c, status: 'Withdrawn' as HusainContributionStatus }
          : c
      );
      setContributions(nextContribs);
      saveStoredHusainContributions(nextContribs);
    }
    showToast(`Refund payout of ${fmtINR(paidNow)} recorded (${nextStatus}).`);
  };

  const handleUpdateHideSettings = (next: HusainHideAccountSettings) => {
    const stamped = { ...next, updatedBy: currentUser.username, updatedAt: getTodayIso() };
    setHideSettings(stamped);
    saveStoredHusainHideSettings(stamped);
    showToast('Husain Scheme Hide Account settings updated.');
  };

  const subPages: { id: HusainSchemeSubPage; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-3.5 h-3.5" />, badge: 'Live' },
    { id: 'datewise-report', label: 'Datewise Report', icon: <FileSpreadsheet className="w-3.5 h-3.5" /> },
    { id: 'request-manager', label: 'Request Manager', icon: <ClipboardList className="w-3.5 h-3.5" />, badge: String(requests.filter((r) => r.status === 'Pending').length || '') || undefined },
    { id: 'ledger-report', label: 'Ledger Report', icon: <BookOpen className="w-3.5 h-3.5" /> },
    { id: 'withdrawals', label: 'Withdrawals', icon: <ArrowDownUp className="w-3.5 h-3.5" /> },
    { id: 'maturing-tracking', label: 'Maturing Tracking', icon: <CalendarClock className="w-3.5 h-3.5" /> },
    { id: 'cancelled-receipts', label: 'Cancelled Receipts', icon: <Ban className="w-3.5 h-3.5" /> },
    { id: 'hide-account', label: 'Hide Account', icon: <EyeOff className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="space-y-5">
      {/* Husain Scheme Sub-Navigation Strip */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <div>
            <h2 className="text-sm font-black text-slate-900">
              Husain Scheme — Command Center &amp; Operations
            </h2>
            <p className="text-[11px] text-slate-500">
              Dashboard, 15-day maturity radar, request queue, refund withdrawals, and account visibility controls.
            </p>
          </div>
          {canAdd && (
            <button
              type="button"
              onClick={() => {
                setNewDate(getTodayIso());
                setNewAmount('25000');
                setShowNewModal(true);
              }}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-amber-300 font-black text-xs rounded-xl inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Husain Contribution</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {subPages.map((tab) => {
            const active = activeSubPage === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSubPageChange(tab.id)}
                className={`px-3 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-all ${
                  active
                    ? 'bg-amber-400 text-slate-950 shadow-2xs'
                    : 'bg-slate-50 hover:bg-amber-50 text-slate-700 border border-slate-200'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                      active ? 'bg-slate-950 text-amber-300' : 'bg-amber-100 text-amber-900'
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

      {/* Active Sub-Page View */}
      {activeSubPage === 'dashboard' ? (
        <HusainDashboardView
          contributions={contributions}
          withdrawals={withdrawals}
          directory={directory}
          enrolledIts={enrolledIts}
          hideSettings={hideSettings}
          canAdd={canAdd}
          canEdit={canEdit}
          onOpenNewContribution={() => setShowNewModal(true)}
          onEnrollMember={handleEnrollMember}
          onViewContribution={handleViewContribution}
          onEditContribution={setEditingContribution}
          onPrintContribution={(c) => setSoloPrintData(mapContribOfficial(c))}
          onSoloPrintContribution={(c) => setSoloPrintData(mapContribOfficial(c))}
          onNavigateToSubPage={onSubPageChange}
        />
      ) : (
        <HusainOperationsViews
          subPage={activeSubPage}
          contributions={contributions}
          requests={requests}
          withdrawals={withdrawals}
          hideSettings={hideSettings}
          directory={directory}
          canAdd={canAdd}
          canEdit={canEdit}
          canDelete={canDelete}
          showToast={showToast}
          onViewContribution={handleViewContribution}
          onEditContribution={setEditingContribution}
          onSoloPrintOfficial={(d) => setSoloPrintData(d)}
          onBulkPrintOfficial={(list) => setBulkPrintList(list)}
          onVoidContribution={(c) => setCancelTarget(c)}
          onRestoreContribution={handleRestoreContribution}
          onRenewContribution={handleRenewContribution}
          onCreateRequest={handleCreateRequest}
          onUpdateRequestStatus={handleUpdateRequestStatus}
          onViewRequest={(r) =>
            setViewModal({
              title: `Request ${r.requestNo}`,
              subtitle: `${r.requestType} • ${r.status}`,
              fields: [
                { label: 'Request No', value: r.requestNo, mono: true },
                { label: 'Request Date', value: formatDisplayDate(r.requestDate) },
                { label: 'Member Name', value: r.memberName },
                { label: 'ITS / Sabeel', value: `${r.itsNumber} / ${r.sabeelNo}`, mono: true },
                { label: 'Type', value: r.requestType },
                { label: 'Status', value: r.status },
                { label: 'Remarks', value: r.remarks },
                { label: 'Requested Amount', value: fmtINR(r.requestedAmount), highlight: true },
              ],
            })
          }
          onCreateWithdrawal={handleCreateWithdrawal}
          onProcessWithdrawalPayout={handleProcessWithdrawalPayout}
          onViewWithdrawal={(w) =>
            setViewModal({
              title: `Withdrawal ${w.voucherNo}`,
              subtitle: `${w.status} • Ref ${w.receiptNo}`,
              fields: [
                { label: 'Voucher No', value: w.voucherNo, mono: true },
                { label: 'Source Receipt', value: w.receiptNo, mono: true },
                { label: 'Member Name', value: w.memberName },
                { label: 'ITS / Sabeel', value: `${w.itsNumber} / ${w.sabeelNo}`, mono: true },
                { label: 'Contribution Amount', value: fmtINR(w.contributionAmount), mono: true },
                { label: 'Withdrawal Amount', value: fmtINR(w.withdrawalAmount), mono: true },
                { label: 'Payout Mode', value: w.payoutMode },
                { label: 'Pending Refund', value: fmtINR(w.pendingRefundAmount), highlight: true },
              ],
            })
          }
          onUpdateHideSettings={handleUpdateHideSettings}
          onOpenNewContribution={() => setShowNewModal(true)}
        />
      )}

      {/* Modal: Record New Husain Contribution */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900">
                New Husain Scheme Contribution
              </h3>
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateContribution} className="space-y-3 text-xs">
              <select
                value=""
                onChange={(e) => populateNewMember(e.target.value, '')}
                className="w-full px-3 py-2 border border-amber-300 rounded-xl bg-amber-50/50 font-semibold"
              >
                <option value="">-- Quick Autofill Member (ITS / Sabeel) --</option>
                {directory.map((m) => (
                  <option key={m.itsNumber} value={m.itsNumber}>
                    {m.fullName} — ITS {m.itsNumber} ({m.sabeelNo || 'No Sabeel'})
                  </option>
                ))}
              </select>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ITS No. *</label>
                  <input
                    type="text"
                    required
                    value={newIts}
                    onChange={(e) => {
                      setNewIts(e.target.value);
                      populateNewMember(e.target.value, '');
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sabeel No.</label>
                  <input
                    type="text"
                    value={newSabeel}
                    onChange={(e) => {
                      setNewSabeel(e.target.value);
                      populateNewMember('', e.target.value);
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Member Name *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tenure (Months)</label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={newTenure}
                    onChange={(e) => setNewTenure(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Mode</label>
                  <select
                    value={newMode}
                    onChange={(e) => setNewMode(e.target.value as SchemeReceiptMode)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="Online">Online</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Transaction / Cheque Ref</label>
                  <input
                    type="text"
                    value={newRef}
                    onChange={(e) => setNewRef(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-[11px] font-bold text-emerald-900">
                {numberToWordsIndian(Number(newAmount) || 0)}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 rounded-xl font-black inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save &amp; Print Receipt</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Contribution */}
      {editingContribution && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-sm font-black text-slate-900">
              Edit Contribution — {editingContribution.receiptNo}
            </h3>
            <form onSubmit={handleSaveContributionEdit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    min={1}
                    value={editingContribution.amount}
                    onChange={(e) =>
                      setEditingContribution({
                        ...editingContribution,
                        amount: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Maturity Date</label>
                  <input
                    type="date"
                    value={editingContribution.maturityDate}
                    onChange={(e) =>
                      setEditingContribution({
                        ...editingContribution,
                        maturityDate: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Status</label>
                <select
                  value={editingContribution.status}
                  onChange={(e) =>
                    setEditingContribution({
                      ...editingContribution,
                      status: e.target.value as HusainContributionStatus,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                >
                  <option value="Active">Active</option>
                  <option value="Maturing Soon">Maturing Soon</option>
                  <option value="Matured">Matured</option>
                  <option value="Refund Pending">Refund Pending</option>
                  <option value="Renewed">Renewed</option>
                  <option value="Withdrawn">Withdrawn</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Notes</label>
                <input
                  type="text"
                  value={editingContribution.notes || ''}
                  onChange={(e) =>
                    setEditingContribution({ ...editingContribution, notes: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingContribution(null)}
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

      {/* Shared Modals */}
      <SchemeViewModal
        isOpen={!!viewModal}
        onClose={() => setViewModal(null)}
        title={viewModal?.title || ''}
        subtitle={viewModal?.subtitle}
        fields={viewModal?.fields || []}
        onSoloPrint={
          viewModal?.official
            ? () => {
                setSoloPrintData(viewModal.official!);
                setViewModal(null);
              }
            : undefined
        }
      />

      <TrustOfficialReceiptModal
        isOpen={!!soloPrintData}
        onClose={() => setSoloPrintData(null)}
        receiptData={soloPrintData || undefined}
        currentUser={currentUser}
        title="Official Dawoodi Bohra Jamaat Trust — Husain Scheme"
      />

      <SchemeBulkPrintModal
        isOpen={!!bulkPrintList}
        onClose={() => setBulkPrintList(null)}
        title="Husain Scheme Bulk Official Trust Receipts"
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
