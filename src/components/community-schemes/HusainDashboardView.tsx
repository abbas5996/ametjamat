import React, { useMemo, useState } from 'react';
import {
  TrendingUp, Clock, Users, UserPlus, Search, Plus,
  CalendarClock, CheckCircle2, EyeOff, RefreshCw, X
} from 'lucide-react';
import {
  HusainContribution,
  HusainHideAccountSettings,
  HusainWithdrawal,
  MemberDirectoryRecord,
  fmtINR,
  formatDisplayDate,
  getDaysUntil,
} from '../../utils/communitySchemes';
import { SchemeStatCard, TableActionButtons } from './SchemeSharedUI';

interface Props {
  contributions: HusainContribution[];
  withdrawals: HusainWithdrawal[];
  directory: MemberDirectoryRecord[];
  enrolledIts: string[];
  hideSettings: HusainHideAccountSettings;
  canAdd: boolean;
  canEdit: boolean;
  onOpenNewContribution: () => void;
  onEnrollMember: (itsNumber: string) => void;
  onViewContribution: (c: HusainContribution) => void;
  onEditContribution: (c: HusainContribution) => void;
  onPrintContribution: (c: HusainContribution) => void;
  onSoloPrintContribution: (c: HusainContribution) => void;
  onNavigateToSubPage: (
    page:
      | 'datewise-report'
      | 'request-manager'
      | 'ledger-report'
      | 'withdrawals'
      | 'maturing-tracking'
      | 'cancelled-receipts'
      | 'hide-account'
  ) => void;
}

export const HusainDashboardView: React.FC<Props> = ({
  contributions,
  withdrawals,
  directory,
  enrolledIts,
  hideSettings,
  canAdd,
  canEdit,
  onOpenNewContribution,
  onEnrollMember,
  onViewContribution,
  onEditContribution,
  onPrintContribution,
  onSoloPrintContribution,
  onNavigateToSubPage,
}) => {
  // Quick Search Bars for ITS No., Sabeel No., and Member Name
  const [quickIts, setQuickIts] = useState('');
  const [quickSabeel, setQuickSabeel] = useState('');
  const [quickName, setQuickName] = useState('');
  const [memberRosterModal, setMemberRosterModal] = useState<'members' | 'non-members' | null>(null);

  const currentYearPrefix = String(new Date().getFullYear());

  // Respect Hide Account settings
  const visibleContributions = useMemo(() => {
    const active = contributions.filter((c) => !c.isCancelled);
    if (!hideSettings.hideAccountEnabled) return active;
    return active.filter((c) => !hideSettings.hiddenItsNumbers.includes(c.itsNumber));
  }, [contributions, hideSettings]);

  const visibleWithdrawals = useMemo(() => {
    if (!hideSettings.hideAccountEnabled) return withdrawals;
    return withdrawals.filter((w) => !hideSettings.hiddenItsNumbers.includes(w.itsNumber));
  }, [withdrawals, hideSettings]);

  // Top 4 Statistic Metrics
  const amountContributedThisYear = useMemo(() => {
    return visibleContributions
      .filter((c) => c.contributionDate.startsWith(currentYearPrefix))
      .reduce((sum, c) => sum + c.amount, 0);
  }, [visibleContributions, currentYearPrefix]);

  const pendingRefundAmount = useMemo(() => {
    return visibleWithdrawals
      .filter((w) => w.status === 'Pending Refund' || w.status === 'Partially Refunded')
      .reduce((sum, w) => sum + w.pendingRefundAmount, 0);
  }, [visibleWithdrawals]);

  const enrolledSet = useMemo(() => new Set(enrolledIts), [enrolledIts]);

  const husainMembers = useMemo(
    () => directory.filter((m) => enrolledSet.has(m.itsNumber)),
    [directory, enrolledSet]
  );

  const husainNonMembers = useMemo(
    () => directory.filter((m) => !enrolledSet.has(m.itsNumber)),
    [directory, enrolledSet]
  );

  const maskValue = (val: string) => (hideSettings.maskMemberBalances ? '₹ ••••••' : val);

  // Filter helper for both Dashboard tables
  const matchesQuickSearch = (c: HusainContribution): boolean => {
    const itsQ = quickIts.trim().toLowerCase();
    const sabQ = quickSabeel.trim().toLowerCase();
    const nameQ = quickName.trim().toLowerCase();
    if (itsQ && !c.itsNumber.toLowerCase().includes(itsQ)) return false;
    if (sabQ && !c.sabeelNo.toLowerCase().includes(sabQ)) return false;
    if (nameQ && !c.memberName.toLowerCase().includes(nameQ)) return false;
    return true;
  };

  // Table 1: Latest Contribution Details
  const latestContributions = useMemo(() => {
    return [...visibleContributions]
      .filter(matchesQuickSearch)
      .sort((a, b) => b.contributionDate.localeCompare(a.contributionDate))
      .slice(0, 8);
  }, [visibleContributions, quickIts, quickSabeel, quickName]);

  // Table 2: Latest Maturing Contribution Details (15 Days)
  const maturing15Days = useMemo(() => {
    return visibleContributions
      .filter((c) => {
        if (c.status === 'Withdrawn' || c.status === 'Renewed') return false;
        const daysLeft = getDaysUntil(c.maturityDate);
        return daysLeft >= 0 && daysLeft <= 15;
      })
      .filter(matchesQuickSearch)
      .sort((a, b) => a.maturityDate.localeCompare(b.maturityDate));
  }, [visibleContributions, quickIts, quickSabeel, quickName]);

  const clearSearch = () => {
    setQuickIts('');
    setQuickSabeel('');
    setQuickName('');
  };

  return (
    <div className="space-y-5">
      {/* Privacy Notice Banner if Hide Account Mode is Active */}
      {(hideSettings.hideAccountEnabled || hideSettings.maskMemberBalances) && (
        <div className="bg-slate-900 text-amber-200 rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-xs border border-amber-400/40">
          <div className="flex items-center gap-2">
            <EyeOff className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Hide Account Protection Active:</strong>{' '}
              {hideSettings.hideAccountEnabled
                ? `${hideSettings.hiddenItsNumbers.length} flagged account(s) hidden from figures & tables.`
                : 'Balance masking enabled.'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onNavigateToSubPage('hide-account')}
            className="px-3 py-1 bg-amber-400 text-slate-950 font-bold rounded-lg text-[11px] cursor-pointer"
          >
            Manage Hide Settings
          </button>
        </div>
      )}

      {/* Top 4 Statistic Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <SchemeStatCard
          title="Amount Contributed this year"
          value={maskValue(fmtINR(amountContributedThisYear))}
          subtitle={`Year ${currentYearPrefix} • Active contributions`}
          icon={<TrendingUp className="w-5 h-5" />}
          tone="emerald"
          badgeText={currentYearPrefix}
          onClick={() => onNavigateToSubPage('datewise-report')}
        />

        <SchemeStatCard
          title="Pending Refund Amount"
          value={maskValue(fmtINR(pendingRefundAmount))}
          subtitle={`${visibleWithdrawals.filter((w) => w.pendingRefundAmount > 0).length} pending withdrawal voucher(s)`}
          icon={<Clock className="w-5 h-5" />}
          tone="rose"
          badgeText="Refunds"
          onClick={() => onNavigateToSubPage('withdrawals')}
        />

        <SchemeStatCard
          title="Husain Scheme Members"
          value={husainMembers.length}
          subtitle="Active enrolled HOF accounts (Click to view)"
          icon={<Users className="w-5 h-5" />}
          tone="blue"
          badgeText="Enrolled"
          onClick={() => setMemberRosterModal('members')}
        />

        <SchemeStatCard
          title="Husain Scheme Non-Members"
          value={husainNonMembers.length}
          subtitle="Jamaat HOFs not yet enrolled (Click to enroll)"
          icon={<UserPlus className="w-5 h-5" />}
          tone="amber"
          badgeText="Prospects"
          onClick={() => setMemberRosterModal('non-members')}
        />
      </div>

      {/* Quick Search Bars (ITS No., Sabeel No., Member Name) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-black text-slate-900">
              Quick Search — ITS No., Sabeel No., &amp; Member Name
            </h3>
            <p className="text-[11px] text-slate-500">
              Instantly filters Latest Contributions and 15-Day Maturing Contributions below.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {(quickIts || quickSabeel || quickName) && (
              <button
                type="button"
                onClick={clearSearch}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Clear</span>
              </button>
            )}
            {canAdd && (
              <button
                type="button"
                onClick={onOpenNewContribution}
                className="px-3.5 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs rounded-xl inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>New Contribution</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={quickIts}
              onChange={(e) => setQuickIts(e.target.value)}
              placeholder="Quick Search by ITS No. (e.g. 30489122)"
              aria-label="Quick Search by ITS No."
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={quickSabeel}
              onChange={(e) => setQuickSabeel(e.target.value)}
              placeholder="Quick Search by Sabeel No. (e.g. SB-042)"
              aria-label="Quick Search by Sabeel No."
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={quickName}
              onChange={(e) => setQuickName(e.target.value)}
              placeholder="Quick Search by Member Name..."
              aria-label="Quick Search by Member Name"
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
        </div>
      </div>

      {/* Table 1: Latest Contribution Details */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-black text-slate-900">Latest Contribution Details</h3>
            <p className="text-[11px] text-slate-500">
              Most recent Husain Scheme deposits and receipt vouchers
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateToSubPage('ledger-report')}
            className="text-xs font-bold text-blue-700 hover:underline cursor-pointer"
          >
            View Full Ledger →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Receipt No</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">ITS No.</th>
                <th className="px-4 py-3">Sabeel No.</th>
                <th className="px-4 py-3">Member Name</th>
                <th className="px-4 py-3">Mode</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {latestContributions.map((c) => (
                <tr key={c.id} className="hover:bg-amber-50/30">
                  <td className="px-4 py-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                    {c.receiptNo}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-600 whitespace-nowrap">
                    {formatDisplayDate(c.contributionDate)}
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-amber-900">{c.itsNumber}</td>
                  <td className="px-4 py-3 font-mono font-semibold text-blue-800">{c.sabeelNo}</td>
                  <td className="px-4 py-3 font-bold text-slate-900">{c.memberName}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[10px] font-bold">
                      {c.paymentMode}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-black text-emerald-800 whitespace-nowrap">
                    {maskValue(fmtINR(c.amount))}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${
                        c.status === 'Active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : c.status === 'Maturing Soon'
                          ? 'bg-amber-100 text-amber-900'
                          : c.status === 'Refund Pending'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <TableActionButtons
                      compact
                      canEdit={canEdit}
                      onView={() => onViewContribution(c)}
                      onEdit={() => onEditContribution(c)}
                      onPrint={() => onPrintContribution(c)}
                      onSoloPrint={() => onSoloPrintContribution(c)}
                    />
                  </td>
                </tr>
              ))}
              {latestContributions.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                    No contributions match the quick search filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Table 2: Latest Maturing Contribution Details (15 Days) */}
      <div className="bg-white rounded-2xl border border-amber-300/70 shadow-xs overflow-hidden">
        <div className="px-5 py-4 bg-amber-50/60 border-b border-amber-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-amber-700" />
            <div>
              <h3 className="text-sm font-black text-slate-900">
                Latest Maturing Contribution Details (15 Days)
              </h3>
              <p className="text-[11px] text-slate-600">
                Contributions reaching maturity within the next 15 days requiring renewal or refund action
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateToSubPage('maturing-tracking')}
            className="text-xs font-bold text-amber-900 hover:underline cursor-pointer"
          >
            Open Maturing Tracker →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Receipt No</th>
                <th className="px-4 py-3">ITS No.</th>
                <th className="px-4 py-3">Sabeel No.</th>
                <th className="px-4 py-3">Member Name</th>
                <th className="px-4 py-3">Contribution Date</th>
                <th className="px-4 py-3">Maturity Date</th>
                <th className="px-4 py-3 text-center">Countdown</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {maturing15Days.map((c) => {
                const daysLeft = getDaysUntil(c.maturityDate);
                return (
                  <tr key={c.id} className="hover:bg-amber-50/40">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {c.receiptNo}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-amber-900">{c.itsNumber}</td>
                    <td className="px-4 py-3 font-mono font-semibold text-blue-800">{c.sabeelNo}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{c.memberName}</td>
                    <td className="px-4 py-3 font-mono text-slate-600 whitespace-nowrap">
                      {formatDisplayDate(c.contributionDate)}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {formatDisplayDate(c.maturityDate)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold whitespace-nowrap ${
                          daysLeft <= 5
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}
                      >
                        {daysLeft === 0 ? 'Due Today' : `${daysLeft} Days Left`}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-black text-emerald-800 whitespace-nowrap">
                      {maskValue(fmtINR(c.amount))}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <TableActionButtons
                        compact
                        canEdit={canEdit}
                        onView={() => onViewContribution(c)}
                        onEdit={() => onEditContribution(c)}
                        onPrint={() => onPrintContribution(c)}
                        onSoloPrint={() => onSoloPrintContribution(c)}
                      />
                    </td>
                  </tr>
                );
              })}
              {maturing15Days.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                    No contributions are maturing within the next 15 days matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Members / Non-Members Roster */}
      {memberRosterModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold">
                  {memberRosterModal === 'members'
                    ? `Husain Scheme Members (${husainMembers.length})`
                    : `Husain Scheme Non-Members (${husainNonMembers.length})`}
                </h3>
                <p className="text-[11px] text-amber-300">
                  {memberRosterModal === 'members'
                    ? 'Enrolled Jamaat HOFs participating in Husain Scheme'
                    : 'Jamaat HOFs not yet enrolled — enroll directly with one click'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMemberRosterModal(null)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 max-h-[65vh] overflow-y-auto divide-y divide-slate-100 text-xs">
              {(memberRosterModal === 'members' ? husainMembers : husainNonMembers).map((m) => (
                <div key={m.itsNumber} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-900">{m.fullName}</p>
                    <p className="text-[11px] font-mono text-slate-500">
                      ITS: {m.itsNumber} • Sabeel: {m.sabeelNo || '—'} • {m.mohallahName}
                    </p>
                  </div>
                  {memberRosterModal === 'members' ? (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Active Member</span>
                    </span>
                  ) : (
                    canAdd && (
                      <button
                        type="button"
                        onClick={() => onEnrollMember(m.itsNumber)}
                        className="px-3 py-1.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black rounded-lg text-[11px] cursor-pointer"
                      >
                        + Enroll Now
                      </button>
                    )
                  )}
                </div>
              ))}
              {(memberRosterModal === 'members' ? husainMembers : husainNonMembers).length === 0 && (
                <p className="py-8 text-center text-slate-400">No members in this category.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

