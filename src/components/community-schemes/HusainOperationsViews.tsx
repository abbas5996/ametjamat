import React, { useMemo, useState } from 'react';
import {
  FileSpreadsheet, ClipboardList, BookOpen, ArrowDownUp, CalendarClock,
  Ban, EyeOff, Download, Printer, RefreshCw, Plus, CheckCircle2,
  XCircle, RotateCcw, Search, ShieldAlert, Eye
} from 'lucide-react';
import {
  HusainContribution,
  HusainSchemeRequest,
  HusainWithdrawal,
  HusainHideAccountSettings,
  HusainRequestType,
  HusainRequestStatus,
  HusainWithdrawalStatus,
  SchemeReceiptMode,
  MemberDirectoryRecord,
  fmtINR,
  formatDisplayDate,
  getDaysUntil,
  getTodayIso,
  exportRowsToCsv,
  toOfficialReceiptData,
} from '../../utils/communitySchemes';
import { OfficialReceiptData } from '../faiz-hub/FaizOfficialPrintReceipt';
import { useSchemeFilter } from './useSchemeSearch';
import { TableActionButtons } from './SchemeSharedUI';
import { QuickDatePresetsBar } from '../common/DateFilterBar';

export type HusainOperationsSubPage =
  | 'datewise-report'
  | 'request-manager'
  | 'ledger-report'
  | 'withdrawals'
  | 'maturing-tracking'
  | 'cancelled-receipts'
  | 'hide-account';

interface Props {
  subPage: HusainOperationsSubPage;
  contributions: HusainContribution[];
  requests: HusainSchemeRequest[];
  withdrawals: HusainWithdrawal[];
  hideSettings: HusainHideAccountSettings;
  directory: MemberDirectoryRecord[];
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
  showToast: (msg: string) => void;
  onViewContribution: (c: HusainContribution) => void;
  onEditContribution: (c: HusainContribution) => void;
  onSoloPrintOfficial: (data: Partial<OfficialReceiptData>) => void;
  onBulkPrintOfficial: (list: Partial<OfficialReceiptData>[]) => void;
  onVoidContribution: (c: HusainContribution) => void;
  onRestoreContribution: (c: HusainContribution) => void;
  onRenewContribution: (c: HusainContribution) => void;
  onCreateRequest: (req: Omit<HusainSchemeRequest, 'id' | 'requestNo' | 'status'>) => void;
  onUpdateRequestStatus: (id: string, status: HusainRequestStatus) => void;
  onViewRequest: (r: HusainSchemeRequest) => void;
  onCreateWithdrawal: (input: {
    contributionId: string;
    withdrawalAmount: number;
    payoutMode: SchemeReceiptMode;
    remarks: string;
  }) => void;
  onProcessWithdrawalPayout: (id: string, paidNow: number, mode: SchemeReceiptMode, ref: string) => void;
  onViewWithdrawal: (w: HusainWithdrawal) => void;
  onUpdateHideSettings: (next: HusainHideAccountSettings) => void;
  onOpenNewContribution: () => void;
}

export const HusainOperationsViews: React.FC<Props> = ({
  subPage,
  contributions,
  requests,
  withdrawals,
  hideSettings,
  directory,
  canAdd,
  canEdit,
  canDelete,
  showToast,
  onViewContribution,
  onEditContribution,
  onSoloPrintOfficial,
  onBulkPrintOfficial,
  onVoidContribution,
  onRestoreContribution,
  onRenewContribution,
  onCreateRequest,
  onUpdateRequestStatus,
  onViewRequest,
  onCreateWithdrawal,
  onProcessWithdrawalPayout,
  onViewWithdrawal,
  onUpdateHideSettings,
  onOpenNewContribution,
}) => {
  // Visibility filter helper honoring Hide Account settings
  const activeContributions = useMemo(() => {
    const active = contributions.filter((c) => !c.isCancelled);
    if (!hideSettings.hideAccountEnabled) return active;
    return active.filter((c) => !hideSettings.hiddenItsNumbers.includes(c.itsNumber));
  }, [contributions, hideSettings]);

  const cancelledContributions = useMemo(
    () => contributions.filter((c) => c.isCancelled),
    [contributions]
  );

  const maskAmt = (amt: number) =>
    hideSettings.maskMemberBalances ? '₹ ••••••' : fmtINR(amt);

  // Filter hook for Contributions (shared across Datewise, Ledger, Maturing)
  const contribAccessors = useMemo(
    () => ({
      getId: (c: HusainContribution) => c.id,
      getDate: (c: HusainContribution) => c.contributionDate,
      getItsNo: (c: HusainContribution) => c.itsNumber,
      getSabeelNo: (c: HusainContribution) => c.sabeelNo,
      getMemberName: (c: HusainContribution) => c.memberName,
      getPaymentMode: (c: HusainContribution) => c.paymentMode,
      getStatus: (c: HusainContribution) => c.status,
      getSearchableText: (c: HusainContribution) => [c.receiptNo, c.notes || ''],
    }),
    []
  );

  const contribFilter = useSchemeFilter<HusainContribution>(activeContributions, contribAccessors);

  // Filter hook for Cancelled Receipts
  const cancelledAccessors = useMemo(
    () => ({
      getId: (c: HusainContribution) => c.id,
      getDate: (c: HusainContribution) => c.cancelledAt || c.contributionDate,
      getItsNo: (c: HusainContribution) => c.itsNumber,
      getSabeelNo: (c: HusainContribution) => c.sabeelNo,
      getMemberName: (c: HusainContribution) => c.memberName,
      getSearchableText: (c: HusainContribution) => [c.receiptNo, c.cancellationReason || ''],
    }),
    []
  );

  const cancelledFilter = useSchemeFilter<HusainContribution>(
    cancelledContributions,
    cancelledAccessors
  );

  // Filter hook for Requests
  const reqAccessors = useMemo(
    () => ({
      getId: (r: HusainSchemeRequest) => r.id,
      getDate: (r: HusainSchemeRequest) => r.requestDate,
      getItsNo: (r: HusainSchemeRequest) => r.itsNumber,
      getSabeelNo: (r: HusainSchemeRequest) => r.sabeelNo,
      getMemberName: (r: HusainSchemeRequest) => r.memberName,
      getStatus: (r: HusainSchemeRequest) => r.status,
      getSearchableText: (r: HusainSchemeRequest) => [r.requestNo, r.requestType, r.remarks],
    }),
    []
  );

  const reqFilter = useSchemeFilter<HusainSchemeRequest>(requests, reqAccessors);

  // Filter hook for Withdrawals
  const wdAccessors = useMemo(
    () => ({
      getId: (w: HusainWithdrawal) => w.id,
      getDate: (w: HusainWithdrawal) => w.requestDate,
      getItsNo: (w: HusainWithdrawal) => w.itsNumber,
      getSabeelNo: (w: HusainWithdrawal) => w.sabeelNo,
      getMemberName: (w: HusainWithdrawal) => w.memberName,
      getStatus: (w: HusainWithdrawal) => w.status,
      getSearchableText: (w: HusainWithdrawal) => [w.voucherNo, w.receiptNo, w.remarks || ''],
    }),
    []
  );

  const wdFilter = useSchemeFilter<HusainWithdrawal>(withdrawals, wdAccessors);

  // Local Form States for Request Manager, Withdrawals, Maturing, Hide Account
  const [newReqOpen, setNewReqOpen] = useState(false);
  const [reqIts, setReqIts] = useState(directory[0]?.itsNumber || '');
  const [reqType, setReqType] = useState<HusainRequestType>('Contribution');
  const [reqAmount, setReqAmount] = useState('25000');
  const [reqRemarks, setReqRemarks] = useState('');

  const [newWdOpen, setNewWdOpen] = useState(false);
  const [wdContributionId, setWdContributionId] = useState('');
  const [wdAmount, setWdAmount] = useState('20000');
  const [wdMode, setWdMode] = useState<SchemeReceiptMode>('Online');
  const [wdRemarks, setWdRemarks] = useState('');

  const [payoutTarget, setPayoutTarget] = useState<HusainWithdrawal | null>(null);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutMode, setPayoutMode] = useState<SchemeReceiptMode>('Online');
  const [payoutRef, setPayoutRef] = useState('');

  const [maturingWindow, setMaturingWindow] = useState<'ALL' | '15D' | '30D' | 'MATURED' | 'RENEWED'>('15D');
  const [voidCandidateId, setVoidCandidateId] = useState('');
  const [hideSearch, setHideSearch] = useState('');

  const mapContribToOfficial = (c: HusainContribution): Partial<OfficialReceiptData> =>
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

  // ===========================================================================
  // 1 & 3. DATEWISE HUSAIN SCHEME REPORT & LEDGER REPORT (Shared Filter Bar)
  // ===========================================================================
  if (subPage === 'datewise-report' || subPage === 'ledger-report') {
    const isDatewise = subPage === 'datewise-report';
    const rows = contribFilter.filteredItems;
    const totalAmt = rows.reduce((s, c) => s + c.amount, 0);

    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              {isDatewise ? (
                <FileSpreadsheet className="w-4 h-4 text-amber-600" />
              ) : (
                <BookOpen className="w-4 h-4 text-blue-600" />
              )}
              <span>
                {isDatewise ? 'Datewise Husain Scheme Report' : 'Husain Scheme — Ledger Report'}
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              {isDatewise
                ? 'Chronological contribution register filtered by date range, ITS, Sabeel, and member name.'
                : 'Complete audited Husain Scheme ledger with batch Trust voucher printing.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {canAdd && (
              <button
                type="button"
                onClick={onOpenNewContribution}
                className="px-3 py-2 bg-slate-900 text-amber-300 rounded-xl text-xs font-black inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Entry</span>
              </button>
            )}
            <button
              type="button"
              onClick={() =>
                exportRowsToCsv(
                  isDatewise ? 'Husain_Datewise_Report.csv' : 'Husain_Ledger_Report.csv',
                  ['Receipt No', 'Date', 'Maturity Date', 'ITS No', 'Sabeel No', 'Member Name', 'Mode', 'Amount', 'Status'],
                  rows.map((c) => [
                    c.receiptNo,
                    c.contributionDate,
                    c.maturityDate,
                    c.itsNumber,
                    c.sabeelNo,
                    c.memberName,
                    c.paymentMode,
                    c.amount,
                    c.status,
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
              onClick={() => {
                const chosen =
                  contribFilter.selectedIds.length > 0
                    ? rows.filter((r) => contribFilter.selectedIds.includes(r.id))
                    : rows;
                if (chosen.length === 0) {
                  showToast('No entries selected for bulk print.');
                  return;
                }
                onBulkPrintOfficial(chosen.map(mapContribToOfficial));
              }}
              className="px-3.5 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 rounded-xl text-xs font-black inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>
                Bulk Print ({contribFilter.selectedIds.length > 0 ? contribFilter.selectedIds.length : rows.length})
              </span>
            </button>
            <button
              type="button"
              onClick={contribFilter.resetFilters}
              className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:text-slate-800 cursor-pointer"
              title="Reset Filters"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Period Presets */}
        <QuickDatePresetsBar
          fromDate={contribFilter.filters.fromDate}
          toDate={contribFilter.filters.toDate}
          onSelectRange={contribFilter.setDateRange}
        />

        {/* Date Range & Search Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">From Date</label>
            <input
              type="date"
              value={contribFilter.filters.fromDate}
              onChange={(e) => contribFilter.setFilter('fromDate', e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">To Date</label>
            <input
              type="date"
              value={contribFilter.filters.toDate}
              onChange={(e) => contribFilter.setFilter('toDate', e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">ITS No.</label>
            <input
              type="text"
              value={contribFilter.filters.itsNo}
              onChange={(e) => contribFilter.setFilter('itsNo', e.target.value)}
              placeholder="ITS No..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Sabeel No.</label>
            <input
              type="text"
              value={contribFilter.filters.sabeelNo}
              onChange={(e) => contribFilter.setFilter('sabeelNo', e.target.value)}
              placeholder="Sabeel No..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Member Name</label>
            <input
              type="text"
              value={contribFilter.filters.memberName}
              onChange={(e) => contribFilter.setFilter('memberName', e.target.value)}
              placeholder="Search name..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
              {isDatewise ? 'Payment Mode' : 'Status'}
            </label>
            {isDatewise ? (
              <select
                value={contribFilter.filters.paymentMode}
                onChange={(e) => contribFilter.setFilter('paymentMode', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white cursor-pointer"
              >
                <option value="ALL">All Modes</option>
                <option value="Cash">Cash</option>
                <option value="Cheque">Cheque</option>
                <option value="Online">Online</option>
              </select>
            ) : (
              <select
                value={contribFilter.filters.status}
                onChange={(e) => contribFilter.setFilter('status', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Maturing Soon">Maturing Soon</option>
                <option value="Matured">Matured</option>
                <option value="Refund Pending">Refund Pending</option>
                <option value="Renewed">Renewed</option>
                <option value="Withdrawn">Withdrawn</option>
              </select>
            )}
          </div>
        </div>

        <div className="bg-amber-50/70 border border-amber-200 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs">
          <span className="font-bold text-amber-950">Showing {rows.length} contribution ledger record(s)</span>
          <span className="font-mono font-black text-emerald-900 text-sm">
            Filtered Total: {maskAmt(totalAmt)}
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="px-3 py-3 text-center w-9">
                  <input
                    type="checkbox"
                    checked={contribFilter.isAllSelected}
                    onChange={contribFilter.toggleSelectAll}
                    className="w-3.5 h-3.5 rounded border-slate-300 cursor-pointer"
                  />
                </th>
                <th className="px-3 py-3">Receipt No</th>
                <th className="px-3 py-3">Date</th>
                <th className="px-3 py-3">Maturity</th>
                <th className="px-3 py-3">ITS / Sabeel</th>
                <th className="px-3 py-3">Member Name</th>
                <th className="px-3 py-3">Mode</th>
                <th className="px-3 py-3 text-right">Amount</th>
                <th className="px-3 py-3 text-center">Status</th>
                <th className="px-3 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((c) => (
                <tr key={c.id} className="hover:bg-amber-50/30">
                  <td className="px-3 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={contribFilter.selectedIds.includes(c.id)}
                      onChange={() => contribFilter.toggleSelect(c.id)}
                      className="w-3.5 h-3.5 rounded border-slate-300 cursor-pointer"
                    />
                  </td>
                  <td className="px-3 py-3 font-mono font-bold text-slate-900 whitespace-nowrap">{c.receiptNo}</td>
                  <td className="px-3 py-3 font-mono text-slate-600 whitespace-nowrap">{formatDisplayDate(c.contributionDate)}</td>
                  <td className="px-3 py-3 font-mono text-slate-600 whitespace-nowrap">{formatDisplayDate(c.maturityDate)}</td>
                  <td className="px-3 py-3 font-mono">
                    <div className="font-bold text-amber-900">{c.itsNumber}</div>
                    <div className="text-[10px] text-blue-800">{c.sabeelNo}</div>
                  </td>
                  <td className="px-3 py-3 font-bold text-slate-900">{c.memberName}</td>
                  <td className="px-3 py-3">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[10px] font-bold">
                      {c.paymentMode}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right font-mono font-black text-emerald-800 whitespace-nowrap">
                    {maskAmt(c.amount)}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 text-[10px] font-bold whitespace-nowrap">
                      {c.status}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <TableActionButtons
                      compact
                      canEdit={canEdit}
                      canDelete={canDelete}
                      onView={() => onViewContribution(c)}
                      onEdit={() => onEditContribution(c)}
                      onPrint={() => onSoloPrintOfficial(mapContribToOfficial(c))}
                      onSoloPrint={() => onSoloPrintOfficial(mapContribToOfficial(c))}
                      onCancel={() => onVoidContribution(c)}
                    />
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-slate-400">
                    No records match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ===========================================================================
  // 2. HUSAIN SCHEME REQUEST MANAGER
  // ===========================================================================
  if (subPage === 'request-manager') {
    const selectedMember = directory.find((m) => m.itsNumber === reqIts);

    const handleAddRequest = (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedMember) {
        showToast('Please select a valid member.');
        return;
      }
      onCreateRequest({
        itsNumber: selectedMember.itsNumber,
        sabeelNo: selectedMember.sabeelNo || '—',
        memberName: selectedMember.fullName,
        mohallahName: selectedMember.mohallahName,
        requestType: reqType,
        requestedAmount: Number(reqAmount) || 0,
        requestDate: getTodayIso(),
        remarks: reqRemarks.trim() || `${reqType} request submitted`,
      });
      setNewReqOpen(false);
      setReqRemarks('');
    };

    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-blue-600" />
              <span>Husain Scheme Request Manager</span>
            </h3>
            <p className="text-xs text-slate-500">
              Review, approve, or decline member enrollment, refund, and maturity renewal requests.
            </p>
          </div>
          {canAdd && (
            <button
              type="button"
              onClick={() => setNewReqOpen((v) => !v)}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs rounded-xl inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{newReqOpen ? 'Close Request Form' : 'Log Member Request'}</span>
            </button>
          )}
        </div>

        {newReqOpen && (
          <form onSubmit={handleAddRequest} className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Member (ITS / Sabeel)</label>
              <select
                value={reqIts}
                onChange={(e) => setReqIts(e.target.value)}
                className="w-full px-3 py-2 border border-amber-300 rounded-xl bg-white font-semibold"
              >
                {directory.map((m) => (
                  <option key={m.itsNumber} value={m.itsNumber}>
                    {m.fullName} ({m.itsNumber})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Request Type</label>
              <select
                value={reqType}
                onChange={(e) => setReqType(e.target.value as HusainRequestType)}
                className="w-full px-3 py-2 border border-amber-300 rounded-xl bg-white font-semibold"
              >
                <option value="Enrollment">Enrollment</option>
                <option value="Contribution">Contribution</option>
                <option value="Refund / Withdrawal">Refund / Withdrawal</option>
                <option value="Maturity Renewal">Maturity Renewal</option>
                <option value="Account Update">Account Update</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Requested Amount (₹)</label>
              <input
                type="number"
                min={0}
                value={reqAmount}
                onChange={(e) => setReqAmount(e.target.value)}
                className="w-full px-3 py-2 border border-amber-300 rounded-xl bg-white font-mono font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Remarks</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={reqRemarks}
                  onChange={(e) => setReqRemarks(e.target.value)}
                  placeholder="Request details..."
                  className="flex-1 px-3 py-2 border border-amber-300 rounded-xl bg-white"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-amber-300 font-black rounded-xl cursor-pointer"
                >
                  Save
                </button>
              </div>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <input
            type="text"
            value={reqFilter.filters.itsNo}
            onChange={(e) => reqFilter.setFilter('itsNo', e.target.value)}
            placeholder="Filter by ITS No..."
            className="px-3 py-2 border border-slate-200 rounded-xl font-mono"
          />
          <input
            type="text"
            value={reqFilter.filters.sabeelNo}
            onChange={(e) => reqFilter.setFilter('sabeelNo', e.target.value)}
            placeholder="Filter by Sabeel No..."
            className="px-3 py-2 border border-slate-200 rounded-xl font-mono"
          />
          <input
            type="text"
            value={reqFilter.filters.memberName}
            onChange={(e) => reqFilter.setFilter('memberName', e.target.value)}
            placeholder="Filter by Member Name..."
            className="px-3 py-2 border border-slate-200 rounded-xl"
          />
          <select
            value={reqFilter.filters.status}
            onChange={(e) => reqFilter.setFilter('status', e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl bg-white"
          >
            <option value="ALL">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Completed">Completed</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="px-3.5 py-3">Request #</th>
                <th className="px-3.5 py-3">Date</th>
                <th className="px-3.5 py-3">ITS / Sabeel</th>
                <th className="px-3.5 py-3">Member Name</th>
                <th className="px-3.5 py-3">Type</th>
                <th className="px-3.5 py-3 text-right">Amount</th>
                <th className="px-3.5 py-3 text-center">Status</th>
                <th className="px-3.5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reqFilter.filteredItems.map((req) => {
                const reqOfficial = toOfficialReceiptData({
                  receiptNo: req.requestNo,
                  date: req.requestDate,
                  memberName: req.memberName,
                  itsNumber: req.itsNumber,
                  sabeelNo: req.sabeelNo,
                  mohallahName: req.mohallahName,
                  amount: req.requestedAmount,
                  paymentMode: 'Online',
                  schemeTitle: `Husain Scheme — ${req.requestType}`,
                });
                return (
                  <tr key={req.id} className="hover:bg-amber-50/30">
                    <td className="px-3.5 py-3 font-mono font-bold text-slate-900">{req.requestNo}</td>
                    <td className="px-3.5 py-3 font-mono text-slate-600">{formatDisplayDate(req.requestDate)}</td>
                    <td className="px-3.5 py-3 font-mono">
                      <div className="font-bold text-amber-900">{req.itsNumber}</div>
                      <div className="text-[10px] text-blue-800">{req.sabeelNo}</div>
                    </td>
                    <td className="px-3.5 py-3">
                      <p className="font-bold text-slate-900">{req.memberName}</p>
                      <p className="text-[10px] text-slate-500">{req.remarks}</p>
                    </td>
                    <td className="px-3.5 py-3 font-semibold text-slate-800">{req.requestType}</td>
                    <td className="px-3.5 py-3 text-right font-mono font-bold text-slate-900">
                      {maskAmt(req.requestedAmount)}
                    </td>
                    <td className="px-3.5 py-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          req.status === 'Approved' || req.status === 'Completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : req.status === 'Rejected'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td className="px-3.5 py-3 text-right">
                      <div className="inline-flex items-center gap-1 flex-wrap justify-end">
                        {req.status === 'Pending' && canEdit && (
                          <>
                            <button
                              type="button"
                              onClick={() => onUpdateRequestStatus(req.id, 'Approved')}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Approve</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => onUpdateRequestStatus(req.id, 'Rejected')}
                              className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <XCircle className="w-3 h-3" />
                              <span>Reject</span>
                            </button>
                          </>
                        )}
                        <TableActionButtons
                          compact
                          canEdit={canEdit}
                          onView={() => onViewRequest(req)}
                          onEdit={
                            req.status === 'Approved'
                              ? () => onUpdateRequestStatus(req.id, 'Completed')
                              : undefined
                          }
                          onPrint={() => window.print()}
                          onSoloPrint={() => onSoloPrintOfficial(reqOfficial)}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ===========================================================================
  // 4. HUSAIN SCHEME WITHDRAWAL MANAGEMENT
  // ===========================================================================
  if (subPage === 'withdrawals') {
    const eligibleContribs = activeContributions.filter((c) => c.status !== 'Withdrawn');

    const handleNewWithdrawalSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!wdContributionId) {
        showToast('Select a contribution to withdraw.');
        return;
      }
      onCreateWithdrawal({
        contributionId: wdContributionId,
        withdrawalAmount: Number(wdAmount) || 0,
        payoutMode: wdMode,
        remarks: wdRemarks.trim(),
      });
      setNewWdOpen(false);
      setWdRemarks('');
    };

    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <ArrowDownUp className="w-4 h-4 text-rose-600" />
              <span>Husain Scheme Withdrawal Management</span>
            </h3>
            <p className="text-xs text-slate-500">
              Initiate refund withdrawals, disburse partial or full payouts, and track pending refunds.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {canAdd && (
              <button
                type="button"
                onClick={() => setNewWdOpen((v) => !v)}
                className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs rounded-xl inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{newWdOpen ? 'Close Form' : 'Initiate Withdrawal'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() =>
                exportRowsToCsv(
                  'Husain_Withdrawals.csv',
                  ['Voucher No', 'Receipt No', 'ITS', 'Sabeel', 'Member', 'Withdrawal Amt', 'Pending Refund', 'Status'],
                  wdFilter.filteredItems.map((w) => [
                    w.voucherNo,
                    w.receiptNo,
                    w.itsNumber,
                    w.sabeelNo,
                    w.memberName,
                    w.withdrawalAmount,
                    w.pendingRefundAmount,
                    w.status,
                  ])
                )
              }
              className="px-3 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {newWdOpen && (
          <form onSubmit={handleNewWithdrawalSubmit} className="bg-rose-50/50 border border-rose-200 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Source Contribution</label>
              <select
                required
                value={wdContributionId}
                onChange={(e) => {
                  const sel = eligibleContribs.find((c) => c.id === e.target.value);
                  setWdContributionId(e.target.value);
                  if (sel) setWdAmount(String(sel.amount));
                }}
                className="w-full px-3 py-2 border border-rose-200 rounded-xl bg-white font-semibold"
              >
                <option value="">-- Select Receipt --</option>
                {eligibleContribs.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.receiptNo} • {c.memberName} ({fmtINR(c.amount)})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Withdrawal Amount (₹)</label>
              <input
                type="number"
                min={1}
                required
                value={wdAmount}
                onChange={(e) => setWdAmount(e.target.value)}
                className="w-full px-3 py-2 border border-rose-200 rounded-xl bg-white font-mono font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Payout Mode</label>
              <select
                value={wdMode}
                onChange={(e) => setWdMode(e.target.value as SchemeReceiptMode)}
                className="w-full px-3 py-2 border border-rose-200 rounded-xl bg-white"
              >
                <option value="Online">Online</option>
                <option value="Cheque">Cheque</option>
                <option value="Cash">Cash</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Remarks</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={wdRemarks}
                  onChange={(e) => setWdRemarks(e.target.value)}
                  placeholder="Refund reason..."
                  className="flex-1 px-3 py-2 border border-rose-200 rounded-xl bg-white"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 text-white font-bold rounded-xl cursor-pointer"
                >
                  Create
                </button>
              </div>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <input
            type="text"
            value={wdFilter.filters.itsNo}
            onChange={(e) => wdFilter.setFilter('itsNo', e.target.value)}
            placeholder="ITS No..."
            className="px-3 py-2 border border-slate-200 rounded-xl font-mono"
          />
          <input
            type="text"
            value={wdFilter.filters.sabeelNo}
            onChange={(e) => wdFilter.setFilter('sabeelNo', e.target.value)}
            placeholder="Sabeel No..."
            className="px-3 py-2 border border-slate-200 rounded-xl font-mono"
          />
          <input
            type="text"
            value={wdFilter.filters.memberName}
            onChange={(e) => wdFilter.setFilter('memberName', e.target.value)}
            placeholder="Member Name..."
            className="px-3 py-2 border border-slate-200 rounded-xl"
          />
          <select
            value={wdFilter.filters.status}
            onChange={(e) => wdFilter.setFilter('status', e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl bg-white"
          >
            <option value="ALL">All Statuses</option>
            <option value="Pending Refund">Pending Refund</option>
            <option value="Partially Refunded">Partially Refunded</option>
            <option value="Completed">Completed</option>
            <option value="On Hold">On Hold</option>
          </select>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="px-3.5 py-3">Voucher / Receipt</th>
                <th className="px-3.5 py-3">ITS / Sabeel</th>
                <th className="px-3.5 py-3">Member Name</th>
                <th className="px-3.5 py-3 text-right">Withdrawal</th>
                <th className="px-3.5 py-3 text-right">Pending Refund</th>
                <th className="px-3.5 py-3 text-center">Status</th>
                <th className="px-3.5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {wdFilter.filteredItems.map((w) => {
                const wdOfficial = toOfficialReceiptData({
                  receiptNo: w.voucherNo,
                  date: w.processedDate || w.requestDate,
                  memberName: w.memberName,
                  itsNumber: w.itsNumber,
                  sabeelNo: w.sabeelNo,
                  mohallahName: w.mohallahName,
                  amount: w.withdrawalAmount,
                  paymentMode: w.payoutMode,
                  schemeTitle: 'Husain Scheme — Refund / Withdrawal',
                  purposeTitle: `Husain Refund (${w.voucherNo})`,
                });
                return (
                  <tr key={w.id} className="hover:bg-amber-50/30">
                    <td className="px-3.5 py-3 font-mono">
                      <div className="font-bold text-slate-900">{w.voucherNo}</div>
                      <div className="text-[10px] text-slate-500">Ref: {w.receiptNo}</div>
                    </td>
                    <td className="px-3.5 py-3 font-mono">
                      <div className="font-bold text-amber-900">{w.itsNumber}</div>
                      <div className="text-[10px] text-blue-800">{w.sabeelNo}</div>
                    </td>
                    <td className="px-3.5 py-3">
                      <p className="font-bold text-slate-900">{w.memberName}</p>
                      <p className="text-[10px] text-slate-500">{w.remarks}</p>
                    </td>
                    <td className="px-3.5 py-3 text-right font-mono font-bold text-slate-900">
                      {maskAmt(w.withdrawalAmount)}
                    </td>
                    <td className="px-3.5 py-3 text-right font-mono font-black text-rose-700">
                      {maskAmt(w.pendingRefundAmount)}
                    </td>
                    <td className="px-3.5 py-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${
                          w.status === 'Completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : w.status === 'Pending Refund'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {w.status}
                      </span>
                    </td>
                    <td className="px-3.5 py-3 text-right">
                      <div className="inline-flex items-center gap-1 flex-wrap justify-end">
                        {w.pendingRefundAmount > 0 && canEdit && (
                          <button
                            type="button"
                            onClick={() => {
                              setPayoutTarget(w);
                              setPayoutAmount(String(w.pendingRefundAmount));
                              setPayoutMode(w.payoutMode);
                              setPayoutRef('');
                            }}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                          >
                            Process Refund
                          </button>
                        )}
                        <TableActionButtons
                          compact
                          canEdit={canEdit}
                          onView={() => onViewWithdrawal(w)}
                          onEdit={
                            w.pendingRefundAmount > 0
                              ? () => {
                                  setPayoutTarget(w);
                                  setPayoutAmount(String(w.pendingRefundAmount));
                                  setPayoutMode(w.payoutMode);
                                  setPayoutRef(w.payoutRef || '');
                                }
                              : undefined
                          }
                          onPrint={() => window.print()}
                          onSoloPrint={() => onSoloPrintOfficial(wdOfficial)}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Payout Modal */}
        {payoutTarget && (
          <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 text-xs">
              <h3 className="text-sm font-black text-slate-900">
                Process Refund Payout — {payoutTarget.voucherNo}
              </h3>
              <p className="text-slate-600">
                Pending refund for <strong>{payoutTarget.memberName}</strong>:{' '}
                <strong className="text-rose-700">{fmtINR(payoutTarget.pendingRefundAmount)}</strong>
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Amount Paying Now (₹)</label>
                  <input
                    type="number"
                    min={1}
                    max={payoutTarget.pendingRefundAmount}
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payout Mode</label>
                  <select
                    value={payoutMode}
                    onChange={(e) => setPayoutMode(e.target.value as SchemeReceiptMode)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="Online">Online</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">UTR / Cheque Reference</label>
                  <input
                    type="text"
                    value={payoutRef}
                    onChange={(e) => setPayoutRef(e.target.value)}
                    placeholder="e.g. NEFT-99201"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPayoutTarget(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onProcessWithdrawalPayout(
                      payoutTarget.id,
                      Number(payoutAmount) || 0,
                      payoutMode,
                      payoutRef.trim()
                    );
                    setPayoutTarget(null);
                  }}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-black cursor-pointer"
                >
                  Confirm Payout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ===========================================================================
  // 5. HUSAIN SCHEME MATURING TRACKING
  // ===========================================================================
  if (subPage === 'maturing-tracking') {
    const maturingRows = contribFilter.filteredItems.filter((c) => {
      const days = getDaysUntil(c.maturityDate);
      if (maturingWindow === '15D') return days >= 0 && days <= 15 && c.status !== 'Renewed';
      if (maturingWindow === '30D') return days >= 0 && days <= 30 && c.status !== 'Renewed';
      if (maturingWindow === 'MATURED') return days < 0 || c.status === 'Matured' || c.status === 'Refund Pending';
      if (maturingWindow === 'RENEWED') return c.status === 'Renewed';
      return true;
    });

    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-amber-600" />
              <span>Husain Scheme Maturing Tracking</span>
            </h3>
            <p className="text-xs text-slate-500">
              Monitor upcoming 15-day and 30-day maturities, process tenure renewals, or trigger refunds.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {([
              { id: '15D', label: 'Next 15 Days' },
              { id: '30D', label: 'Next 30 Days' },
              { id: 'MATURED', label: 'Matured / Due' },
              { id: 'RENEWED', label: 'Renewed' },
              { id: 'ALL', label: 'All' },
            ] as const).map((w) => (
              <button
                key={w.id}
                type="button"
                onClick={() => setMaturingWindow(w.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                  maturingWindow === w.id
                    ? 'bg-amber-400 text-slate-950'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <input
            type="text"
            value={contribFilter.filters.itsNo}
            onChange={(e) => contribFilter.setFilter('itsNo', e.target.value)}
            placeholder="Search ITS No..."
            className="px-3 py-2 border border-slate-200 rounded-xl font-mono"
          />
          <input
            type="text"
            value={contribFilter.filters.sabeelNo}
            onChange={(e) => contribFilter.setFilter('sabeelNo', e.target.value)}
            placeholder="Search Sabeel No..."
            className="px-3 py-2 border border-slate-200 rounded-xl font-mono"
          />
          <input
            type="text"
            value={contribFilter.filters.memberName}
            onChange={(e) => contribFilter.setFilter('memberName', e.target.value)}
            placeholder="Search Member Name..."
            className="px-3 py-2 border border-slate-200 rounded-xl"
          />
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="px-3.5 py-3">Receipt No</th>
                <th className="px-3.5 py-3">ITS / Sabeel</th>
                <th className="px-3.5 py-3">Member Name</th>
                <th className="px-3.5 py-3">Maturity Date</th>
                <th className="px-3.5 py-3 text-center">Countdown</th>
                <th className="px-3.5 py-3 text-right">Amount</th>
                <th className="px-3.5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {maturingRows.map((c) => {
                const days = getDaysUntil(c.maturityDate);
                return (
                  <tr key={c.id} className="hover:bg-amber-50/30">
                    <td className="px-3.5 py-3 font-mono font-bold text-slate-900">{c.receiptNo}</td>
                    <td className="px-3.5 py-3 font-mono">
                      <div className="font-bold text-amber-900">{c.itsNumber}</div>
                      <div className="text-[10px] text-blue-800">{c.sabeelNo}</div>
                    </td>
                    <td className="px-3.5 py-3 font-bold text-slate-900">{c.memberName}</td>
                    <td className="px-3.5 py-3 font-mono font-bold text-slate-800">
                      {formatDisplayDate(c.maturityDate)}
                    </td>
                    <td className="px-3.5 py-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          days < 0
                            ? 'bg-rose-100 text-rose-800'
                            : days <= 15
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {days < 0 ? `${Math.abs(days)}d Overdue` : `${days}d Left`}
                      </span>
                    </td>
                    <td className="px-3.5 py-3 text-right font-mono font-black text-emerald-800">
                      {maskAmt(c.amount)}
                    </td>
                    <td className="px-3.5 py-3 text-right">
                      <div className="inline-flex items-center gap-1 flex-wrap justify-end">
                        {canEdit && c.status !== 'Renewed' && (
                          <button
                            type="button"
                            onClick={() => onRenewContribution(c)}
                            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                          >
                            Renew +6m
                          </button>
                        )}
                        <TableActionButtons
                          compact
                          canEdit={canEdit}
                          onView={() => onViewContribution(c)}
                          onEdit={() => onEditContribution(c)}
                          onPrint={() => window.print()}
                          onSoloPrint={() => onSoloPrintOfficial(mapContribToOfficial(c))}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
              {maturingRows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    No contributions in this maturity window.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ===========================================================================
  // 6. CANCELLED RECEIPTS LOG
  // ===========================================================================
  if (subPage === 'cancelled-receipts') {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Ban className="w-4 h-4 text-rose-600" />
              <span>Husain Scheme — Cancelled Receipts Log</span>
            </h3>
            <p className="text-xs text-slate-500">
              Audit trail of voided Husain Scheme contribution vouchers with restore capability.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {canDelete && activeContributions.length > 0 && (
              <div className="flex items-center gap-1.5">
                <select
                  value={voidCandidateId}
                  onChange={(e) => setVoidCandidateId(e.target.value)}
                  className="text-xs px-2.5 py-1.5 border border-rose-200 rounded-xl bg-rose-50/40 font-semibold"
                >
                  <option value="">-- Void Active Receipt --</option>
                  {activeContributions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.receiptNo} • {c.memberName} ({fmtINR(c.amount)})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={!voidCandidateId}
                  onClick={() => {
                    const target = activeContributions.find((c) => c.id === voidCandidateId);
                    if (target) onVoidContribution(target);
                  }}
                  className="px-3 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-xl disabled:opacity-40 cursor-pointer"
                >
                  Void
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={() =>
                exportRowsToCsv(
                  'Husain_Cancelled_Receipts.csv',
                  ['Receipt No', 'Date', 'Cancelled At', 'ITS', 'Sabeel', 'Member', 'Amount', 'Reason'],
                  cancelledFilter.filteredItems.map((c) => [
                    c.receiptNo,
                    c.contributionDate,
                    c.cancelledAt || '',
                    c.itsNumber,
                    c.sabeelNo,
                    c.memberName,
                    c.amount,
                    c.cancellationReason || '',
                  ])
                )
              }
              className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <input
            type="text"
            value={cancelledFilter.filters.itsNo}
            onChange={(e) => cancelledFilter.setFilter('itsNo', e.target.value)}
            placeholder="Filter by ITS No..."
            className="px-3 py-2 border border-slate-200 rounded-xl font-mono"
          />
          <input
            type="text"
            value={cancelledFilter.filters.sabeelNo}
            onChange={(e) => cancelledFilter.setFilter('sabeelNo', e.target.value)}
            placeholder="Filter by Sabeel No..."
            className="px-3 py-2 border border-slate-200 rounded-xl font-mono"
          />
          <input
            type="text"
            value={cancelledFilter.filters.memberName}
            onChange={(e) => cancelledFilter.setFilter('memberName', e.target.value)}
            placeholder="Filter by Member Name..."
            className="px-3 py-2 border border-slate-200 rounded-xl"
          />
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="px-3.5 py-3">Receipt No</th>
                <th className="px-3.5 py-3">ITS / Sabeel</th>
                <th className="px-3.5 py-3">Member Name</th>
                <th className="px-3.5 py-3 text-right">Amount Voided</th>
                <th className="px-3.5 py-3">Reason</th>
                <th className="px-3.5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cancelledFilter.filteredItems.map((c) => (
                <tr key={c.id} className="bg-rose-50/20 hover:bg-rose-50/40">
                  <td className="px-3.5 py-3 font-mono font-bold text-rose-800 line-through">
                    {c.receiptNo}
                  </td>
                  <td className="px-3.5 py-3 font-mono">
                    <div className="font-bold text-slate-800">{c.itsNumber}</div>
                    <div className="text-[10px] text-blue-800">{c.sabeelNo}</div>
                  </td>
                  <td className="px-3.5 py-3 font-bold text-slate-900">{c.memberName}</td>
                  <td className="px-3.5 py-3 text-right font-mono font-black text-rose-700 line-through">
                    {fmtINR(c.amount)}
                  </td>
                  <td className="px-3.5 py-3 text-rose-800 italic">
                    {c.cancellationReason || '—'}
                  </td>
                  <td className="px-3.5 py-3 text-right">
                    <div className="inline-flex items-center gap-1 flex-wrap justify-end">
                      <TableActionButtons
                        compact
                        canEdit={canEdit}
                        onView={() => onViewContribution(c)}
                        onEdit={() => onEditContribution(c)}
                        onPrint={() => window.print()}
                        onSoloPrint={() => onSoloPrintOfficial(mapContribToOfficial(c))}
                      />
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => onRestoreContribution(c)}
                          className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer"
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
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    No cancelled Husain Scheme receipts.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ===========================================================================
  // 7. HIDE ACCOUNT TOGGLE / SETTING
  // ===========================================================================
  const filteredDirectory = useMemo(() => {
    const q = hideSearch.trim().toLowerCase();
    if (!q) return directory;
    return directory.filter(
      (m) =>
        m.itsNumber.toLowerCase().includes(q) ||
        m.sabeelNo.toLowerCase().includes(q) ||
        m.fullName.toLowerCase().includes(q)
    );
  }, [directory, hideSearch]);

  const toggleMemberHide = (itsNumber: string) => {
    const exists = hideSettings.hiddenItsNumbers.includes(itsNumber);
    const nextHidden = exists
      ? hideSettings.hiddenItsNumbers.filter((x) => x !== itsNumber)
      : [...hideSettings.hiddenItsNumbers, itsNumber];
    onUpdateHideSettings({
      ...hideSettings,
      hiddenItsNumbers: nextHidden,
      updatedAt: getTodayIso(),
    });
  };

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-slate-800" />
              <span>Husain Scheme — Hide Account Toggle &amp; Privacy Settings</span>
            </h3>
            <p className="text-xs text-slate-500">
              Control account visibility on dashboards, ledgers, and balance displays.
            </p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-extrabold ${
              hideSettings.hideAccountEnabled
                ? 'bg-slate-900 text-amber-300'
                : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            {hideSettings.hideAccountEnabled ? 'Hide Mode ON' : 'All Accounts Visible'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-slate-900">Enable Hide Account Filter</p>
              <p className="text-xs text-slate-500 mt-0.5">
                When enabled, flagged member accounts below are excluded from Dashboard stats &amp; reports.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={hideSettings.hideAccountEnabled}
              onClick={() =>
                onUpdateHideSettings({
                  ...hideSettings,
                  hideAccountEnabled: !hideSettings.hideAccountEnabled,
                  updatedAt: getTodayIso(),
                })
              }
              className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                hideSettings.hideAccountEnabled ? 'bg-amber-500' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-sm transition-transform ${
                  hideSettings.hideAccountEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-slate-900">Mask Financial Figures on Screen</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Obscure INR amounts in dashboards and tables during public counter sessions.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={hideSettings.maskMemberBalances}
              onClick={() =>
                onUpdateHideSettings({
                  ...hideSettings,
                  maskMemberBalances: !hideSettings.maskMemberBalances,
                  updatedAt: getTodayIso(),
                })
              }
              className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                hideSettings.maskMemberBalances ? 'bg-slate-900' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-sm transition-transform ${
                  hideSettings.maskMemberBalances ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={hideSearch}
            onChange={(e) => setHideSearch(e.target.value)}
            placeholder="Search member by ITS No., Sabeel No., or Name to toggle Hide Account..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">ITS No.</th>
                <th className="px-4 py-3">Sabeel No.</th>
                <th className="px-4 py-3">Member Name</th>
                <th className="px-4 py-3">Mohallah</th>
                <th className="px-4 py-3 text-center">Visibility</th>
                <th className="px-4 py-3 text-right">Hide Account Toggle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDirectory.map((m) => {
                const isHidden = hideSettings.hiddenItsNumbers.includes(m.itsNumber);
                return (
                  <tr key={m.itsNumber} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-bold text-amber-900">{m.itsNumber}</td>
                    <td className="px-4 py-3 font-mono font-semibold text-blue-800">{m.sabeelNo || '—'}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{m.fullName}</td>
                    <td className="px-4 py-3 text-slate-600">{m.mohallahName}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                          isHidden
                            ? 'bg-slate-900 text-amber-300'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {isHidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        <span>{isHidden ? 'Hidden' : 'Visible'}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => toggleMemberHide(m.itsNumber)}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-bold cursor-pointer ${
                          isHidden
                            ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'
                        }`}
                      >
                        {isHidden ? 'Unhide Account' : 'Hide Account'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-950 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
          <span>
            Last updated on {formatDisplayDate(hideSettings.updatedAt)} by <strong>@{hideSettings.updatedBy}</strong>.
          </span>
        </div>
      </div>
    </div>
  );
};

