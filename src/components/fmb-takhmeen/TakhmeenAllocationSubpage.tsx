import React, { useState, useMemo } from 'react';
import {
  Coins,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Lock,
  X,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Percent,
  Calendar,
  User,
  ArrowUpRight,
  HelpCircle,
} from 'lucide-react';
import {
  TakhmeenRecord,
  TakhmeenTier,
  HeadOfFamily,
  UserProfile,
  FinancialYear,
} from '../../types';
import { saveStoredTakhmeens, logFmbAudit } from '../../utils/fmbTakhmeen';
import { checkUserPermission } from '../../utils/rbac';

interface TakhmeenAllocationSubpageProps {
  takhmeens: TakhmeenRecord[];
  setTakhmeens: React.Dispatch<React.SetStateAction<TakhmeenRecord[]>>;
  hofs: HeadOfFamily[];
  currentUser: UserProfile;
  financialYear: FinancialYear;
  showToast: (msg: string) => void;
  onNavigateToCollection?: (itsNumber: string) => void;
}

export const TakhmeenAllocationSubpage: React.FC<TakhmeenAllocationSubpageProps> = ({
  takhmeens,
  setTakhmeens,
  hofs,
  currentUser,
  financialYear,
  showToast,
  onNavigateToCollection,
}) => {
  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<string>(financialYear);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<TakhmeenRecord | null>(null);

  // Form State
  const [formIts, setFormIts] = useState('');
  const [formHofName, setFormHofName] = useState('');
  const [formMobile, setFormMobile] = useState('');
  const [formYear, setFormYear] = useState<string>(financialYear);
  const [formTier, setFormTier] = useState<TakhmeenTier>('Full');
  const [formCommittedAmount, setFormCommittedAmount] = useState<number>(52000);
  const [formPaidAmount, setFormPaidAmount] = useState<number>(0);
  const [formRemarks, setFormRemarks] = useState('');

  // Granular RBAC Permissions
  const canAdd = checkUserPermission(currentUser, 'takhmeen-allocation', 'add');
  const canEdit = checkUserPermission(currentUser, 'takhmeen-allocation', 'edit');
  const canDelete = checkUserPermission(currentUser, 'takhmeen-allocation', 'delete');

  // Open Add Modal
  const handleOpenAdd = () => {
    if (!canAdd) {
      showToast('Access Restricted: You do not have [Add] permission for Takhmeen Allocation.');
      return;
    }
    setEditingRecord(null);
    setFormIts('');
    setFormHofName('');
    setFormMobile('');
    setFormYear(financialYear);
    setFormTier('Full');
    setFormCommittedAmount(52000);
    setFormPaidAmount(0);
    setFormRemarks('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (record: TakhmeenRecord) => {
    if (!canEdit) {
      showToast('Access Restricted: You do not have [Edit] permission for Takhmeen Allocation.');
      return;
    }
    setEditingRecord(record);
    setFormIts(record.itsNumber);
    setFormHofName(record.hofName);
    setFormMobile(record.mobileNumber);
    setFormYear(record.financialYear);
    setFormTier(record.tier);
    setFormCommittedAmount(record.committedAmount);
    setFormPaidAmount(record.paidAmount);
    setFormRemarks(record.remarks || '');
    setIsModalOpen(true);
  };

  // Handle HOF Selection (Auto-fetch)
  const handleHofSelect = (its: string) => {
    setFormIts(its);
    const matched = hofs.find((h) => h.itsNumber === its);
    if (matched) {
      setFormHofName(matched.fullName);
      setFormMobile(matched.mobileNumber);
    }
  };

  // Preset commitment tiers
  const handlePresetAmount = (amount: number, tier: TakhmeenTier) => {
    setFormCommittedAmount(amount);
    setFormTier(tier);
  };

  // Save Add/Edit
  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formIts || formCommittedAmount <= 0) {
      showToast('Please select a member and specify a valid commitment amount.');
      return;
    }

    const calculatedBalance = Math.max(0, formCommittedAmount - formPaidAmount);
    const calculatedStatus: TakhmeenRecord['status'] =
      calculatedBalance === 0 ? 'Completed' : formPaidAmount > 0 ? 'Partial' : 'Unpaid';

    const now = new Date().toISOString().slice(0, 10);

    if (editingRecord) {
      // Update
      const updated = takhmeens.map((t) =>
        t.id === editingRecord.id
          ? {
              ...t,
              tier: formTier,
              committedAmount: formCommittedAmount,
              paidAmount: formPaidAmount,
              balanceDue: calculatedBalance,
              status: calculatedStatus,
              financialYear: formYear,
              remarks: formRemarks.trim() || undefined,
              updatedAt: now,
            }
          : t
      );
      setTakhmeens(updated);
      saveStoredTakhmeens(updated);
      logFmbAudit(
        currentUser.username,
        'Takhmeen Allocation',
        'EDIT',
        editingRecord.itsNumber,
        `Updated Takhmeen for ${editingRecord.hofName}: Commitment ₹${formCommittedAmount.toLocaleString(
          'en-IN'
        )}, Paid ₹${formPaidAmount.toLocaleString('en-IN')}, Balance ₹${calculatedBalance.toLocaleString('en-IN')}.`
      );
      showToast(`Takhmeen allocation for ${editingRecord.hofName} updated.`);
    } else {
      // Add
      const newRecord: TakhmeenRecord = {
        id: `tak-${formIts}-${Date.now().toString().slice(-4)}`,
        itsNumber: formIts,
        hofName: formHofName,
        mobileNumber: formMobile,
        financialYear: formYear,
        tier: formTier,
        committedAmount: formCommittedAmount,
        paidAmount: formPaidAmount,
        balanceDue: calculatedBalance,
        status: calculatedStatus,
        remarks: formRemarks.trim() || undefined,
        createdAt: now,
        updatedAt: now,
      };
      const updated = [newRecord, ...takhmeens];
      setTakhmeens(updated);
      saveStoredTakhmeens(updated);
      logFmbAudit(
        currentUser.username,
        'Takhmeen Allocation',
        'ADD',
        formIts,
        `Allocated annual Takhmeen commitment ₹${formCommittedAmount.toLocaleString(
          'en-IN'
        )} (${formTier} Tier) for ${formHofName}.`
      );
      showToast(`Takhmeen commitment allocated successfully!`);
    }

    setIsModalOpen(false);
  };

  // Delete Record
  const handleDelete = (record: TakhmeenRecord) => {
    if (!canDelete) {
      showToast('Access Restricted: You do not have [Delete] permission for Takhmeen Allocation.');
      return;
    }

    if (
      window.confirm(
        `Are you sure you want to remove the Takhmeen commitment record for ${record.hofName} (${record.financialYear})?`
      )
    ) {
      const updated = takhmeens.filter((t) => t.id !== record.id);
      setTakhmeens(updated);
      saveStoredTakhmeens(updated);
      logFmbAudit(
        currentUser.username,
        'Takhmeen Allocation',
        'DELETE',
        record.itsNumber,
        `Deleted Takhmeen commitment record of ₹${record.committedAmount.toLocaleString(
          'en-IN'
        )} for ${record.hofName}.`
      );
      showToast(`Removed Takhmeen record for ${record.hofName}.`);
    }
  };

  // Financial Metrics & Aggregation
  const financialSummary = useMemo(() => {
    const totalCommitted = takhmeens.reduce((sum, item) => sum + (item.committedAmount || 0), 0);
    const totalPaid = takhmeens.reduce((sum, item) => sum + (item.paidAmount || 0), 0);
    const totalDue = takhmeens.reduce((sum, item) => sum + (item.balanceDue || 0), 0);
    const recoveryPercentage = totalCommitted > 0 ? Math.round((totalPaid / totalCommitted) * 100) : 0;
    const completedCount = takhmeens.filter((t) => t.status === 'Completed').length;
    const partialCount = takhmeens.filter((t) => t.status === 'Partial').length;
    const unpaidCount = takhmeens.filter((t) => t.status === 'Unpaid').length;

    return {
      totalCommitted,
      totalPaid,
      totalDue,
      recoveryPercentage,
      completedCount,
      partialCount,
      unpaidCount,
    };
  }, [takhmeens]);

  // Filtered Records
  const filteredTakhmeens = useMemo(() => {
    return takhmeens.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.itsNumber.includes(q) ||
        item.hofName.toLowerCase().includes(q) ||
        item.mobileNumber.includes(q);

      const matchStatus = statusFilter === 'all' || item.status === statusFilter;
      const matchTier = tierFilter === 'all' || item.tier === tierFilter;
      const matchYear = yearFilter === 'all' || item.financialYear === yearFilter;

      return matchSearch && matchStatus && matchTier && matchYear;
    });
  }, [takhmeens, searchQuery, statusFilter, tierFilter, yearFilter]);

  return (
    <div className="space-y-6">
      {/* ── Community Financial Progress View Banner ── */}
      <div className="bg-gradient-to-br from-[#0F172A] to-slate-900 text-white rounded-2xl p-5 sm:p-6 border border-amber-500/30 shadow-lg space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold flex items-center gap-2 text-white">
              <Coins className="w-5 h-5 text-amber-400" />
              <span>FMB Takhmeen Financial Overview ({financialYear})</span>
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Cumulative pledged takhmeen commitments, counter recovery rate, and pending balance.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 font-mono">
              Recovery: {financialSummary.recoveryPercentage}%
            </span>
          </div>
        </div>

        {/* Aggregate Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-emerald-400">
              Recovered: ₹{financialSummary.totalPaid.toLocaleString('en-IN')}
            </span>
            <span className="text-amber-400">
              Target: ₹{financialSummary.totalCommitted.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="w-full h-3.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, financialSummary.recoveryPercentage)}%` }}
            />
          </div>
        </div>

        {/* 3 Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800 text-xs">
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
            <p className="text-slate-400 font-medium">Total Committed (Hub)</p>
            <p className="text-lg font-bold text-white mt-0.5 font-mono">
              ₹{financialSummary.totalCommitted.toLocaleString('en-IN')}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Across {takhmeens.length} Families</p>
          </div>

          <div className="bg-emerald-950/40 p-3 rounded-xl border border-emerald-800/40">
            <p className="text-emerald-400 font-medium">Total Paid / Received</p>
            <p className="text-lg font-bold text-emerald-300 mt-0.5 font-mono">
              ₹{financialSummary.totalPaid.toLocaleString('en-IN')}
            </p>
            <p className="text-[10px] text-emerald-400 mt-0.5">
              {financialSummary.completedCount} Fully Settled • {financialSummary.partialCount} Partial
            </p>
          </div>

          <div className="bg-rose-950/40 p-3 rounded-xl border border-rose-800/40">
            <p className="text-rose-400 font-medium">Total Balance Due</p>
            <p className="text-lg font-bold text-rose-300 mt-0.5 font-mono">
              ₹{financialSummary.totalDue.toLocaleString('en-IN')}
            </p>
            <p className="text-[10px] text-rose-400 mt-0.5">
              {financialSummary.unpaidCount} Awaiting 1st Installment
            </p>
          </div>
        </div>
      </div>

      {/* ── Search & Filter Bar ── */}
      <div className="bg-white border border-amber-200/80 rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by ITS, HOF Name, or Mobile Number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Action Button: Add Takhmeen */}
          {canAdd ? (
            <button
              type="button"
              onClick={handleOpenAdd}
              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Allocate New Takhmeen</span>
            </button>
          ) : (
            <div
              className="flex items-center gap-1 px-3 py-2 bg-slate-100 text-slate-400 rounded-lg text-xs font-medium cursor-not-allowed shrink-0"
              title="Add Restricted by RBAC"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Allocate Takhmeen (Restricted)</span>
            </div>
          )}
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1 text-slate-500 font-semibold mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">All Payment Statuses ({takhmeens.length})</option>
            <option value="Completed">Completed (100% Paid)</option>
            <option value="Partial">Partial Dues</option>
            <option value="Unpaid">Unpaid (Zero Paid)</option>
          </select>

          {/* Tier Filter */}
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">All Tiers</option>
            <option value="Full">Full Tier</option>
            <option value="Half">Half Tier</option>
            <option value="Special">Special Tier</option>
          </select>

          {/* Year Filter */}
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">All Hijri Years</option>
            <option value="1447-1448 Hijri">1447-1448 Hijri (Active)</option>
            <option value="1446-1447 Hijri">1446-1447 Hijri (Previous)</option>
          </select>
        </div>
      </div>

      {/* ── Takhmeen Setup Table ── */}
      <div className="bg-white border border-amber-200/90 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0F172A] text-white uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="py-3 px-3.5">ITS No</th>
                <th className="py-3 px-3.5">HOF Name</th>
                <th className="py-3 px-3.5">Hijri Year</th>
                <th className="py-3 px-3.5">Tier</th>
                <th className="py-3 px-3.5 text-right">Committed (₹)</th>
                <th className="py-3 px-3.5 text-right">Paid (₹)</th>
                <th className="py-3 px-3.5 text-right">Balance Due (₹)</th>
                <th className="py-3 px-3.5 min-w-[140px]">Progress</th>
                <th className="py-3 px-3.5">Status</th>
                <th className="py-3 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTakhmeens.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-slate-500">
                    <Coins className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-700">No Takhmeen Records Found</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Try clearing search queries or allocate a new commitment.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredTakhmeens.map((item) => {
                  const percent =
                    item.committedAmount > 0
                      ? Math.min(100, Math.round((item.paidAmount / item.committedAmount) * 100))
                      : 0;

                  return (
                    <tr key={item.id} className="hover:bg-amber-50/50 transition-colors">
                      {/* ITS Number */}
                      <td className="py-3 px-3.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {item.itsNumber}
                      </td>

                      {/* HOF Name */}
                      <td className="py-3 px-3.5">
                        <div className="font-bold text-slate-900">{item.hofName}</div>
                        <div className="text-[11px] font-mono text-slate-500">{item.mobileNumber}</div>
                      </td>

                      {/* Hijri Year */}
                      <td className="py-3 px-3.5 whitespace-nowrap font-medium text-slate-700">
                        {item.financialYear}
                      </td>

                      {/* Tier */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                          {item.tier}
                        </span>
                      </td>

                      {/* Committed Amount */}
                      <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                        ₹{item.committedAmount.toLocaleString('en-IN')}
                      </td>

                      {/* Paid Amount */}
                      <td className="py-3 px-3.5 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                        ₹{item.paidAmount.toLocaleString('en-IN')}
                      </td>

                      {/* Balance Due */}
                      <td className="py-3 px-3.5 text-right font-mono font-bold text-rose-700 whitespace-nowrap">
                        ₹{item.balanceDue.toLocaleString('en-IN')}
                      </td>

                      {/* Progress Bar per Family */}
                      <td className="py-3 px-3.5">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-mono font-bold text-slate-600">
                            <span>{percent}%</span>
                            <span>
                              {item.balanceDue === 0 ? 'Settled' : `Due: ₹${item.balanceDue.toLocaleString('en-IN')}`}
                            </span>
                          </div>
                          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                percent === 100
                                  ? 'bg-emerald-500'
                                  : percent > 50
                                  ? 'bg-amber-500'
                                  : percent > 0
                                  ? 'bg-blue-500'
                                  : 'bg-slate-300'
                              }`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        {item.status === 'Completed' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Completed
                          </span>
                        ) : item.status === 'Partial' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                            <Percent className="w-3 h-3 text-blue-600" />
                            Partial
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                            <AlertCircle className="w-3 h-3 text-rose-600" />
                            Unpaid
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {/* Quick Pay / Collect shortcut */}
                          {item.balanceDue > 0 && onNavigateToCollection && (
                            <button
                              type="button"
                              onClick={() => onNavigateToCollection(item.itsNumber)}
                              className="px-2 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                              title="Counter Payment Entry"
                            >
                              <span>Collect</span>
                              <ArrowUpRight className="w-3 h-3" />
                            </button>
                          )}

                          {/* Edit Button */}
                          {canEdit ? (
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(item)}
                              className="p-1.5 text-slate-600 hover:text-amber-800 hover:bg-amber-100 rounded-md cursor-pointer"
                              title="Edit Takhmeen Commitment"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <span className="p-1.5 text-slate-300" title="Edit Restricted">
                              <Lock className="w-3.5 h-3.5" />
                            </span>
                          )}

                          {/* Delete Button */}
                          {canDelete ? (
                            <button
                              type="button"
                              onClick={() => handleDelete(item)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-100 rounded-md cursor-pointer"
                              title="Delete Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <span className="p-1.5 text-slate-300" title="Delete Restricted">
                              <Lock className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── ADD / EDIT TAKHMEEN MODAL ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-amber-300 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-[#0F172A] text-white p-4 sm:p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">
                  {editingRecord ? `Edit Takhmeen (${editingRecord.hofName})` : 'Allocate Annual Takhmeen'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveModal} className="p-4 sm:p-6 space-y-4 text-xs">
              {/* Select Member (Auto-fetch) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Select Head of Family (from Member Master) *
                </label>
                {editingRecord ? (
                  <div className="p-2.5 bg-slate-100 rounded-lg text-slate-900 font-bold flex items-center justify-between">
                    <span>
                      {formHofName} (ITS: {formIts})
                    </span>
                    <span className="text-[11px] text-slate-500 font-normal">Locked</span>
                  </div>
                ) : (
                  <select
                    value={formIts}
                    onChange={(e) => handleHofSelect(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  >
                    <option value="">-- Choose Member HOF --</option>
                    {hofs.map((h) => (
                      <option key={h.id} value={h.itsNumber}>
                        {h.fullName} (ITS: {h.itsNumber}) • {h.mohallahName}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Hijri Year & Tier */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Financial Hijri Year *
                  </label>
                  <select
                    value={formYear}
                    onChange={(e) => setFormYear(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold"
                  >
                    <option value="1447-1448 Hijri">1447-1448 Hijri</option>
                    <option value="1446-1447 Hijri">1446-1447 Hijri</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Takhmeen Tier *
                  </label>
                  <select
                    value={formTier}
                    onChange={(e) => setFormTier(e.target.value as TakhmeenTier)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold"
                  >
                    <option value="Full">Full Tier</option>
                    <option value="Half">Half Tier</option>
                    <option value="Special">Special Tier</option>
                  </select>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1.5">
                  Standard Takhmeen Tier Presets:
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handlePresetAmount(28000, 'Half')}
                    className="p-2 border border-slate-200 rounded-lg text-center hover:bg-amber-50 cursor-pointer"
                  >
                    <p className="font-bold text-slate-800">₹28,000</p>
                    <p className="text-[10px] text-slate-500">Half Tier</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetAmount(52000, 'Full')}
                    className="p-2 border border-amber-300 bg-amber-50/60 rounded-lg text-center hover:bg-amber-100 cursor-pointer"
                  >
                    <p className="font-bold text-amber-900">₹52,000</p>
                    <p className="text-[10px] text-amber-700">Full Standard</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetAmount(75000, 'Special')}
                    className="p-2 border border-slate-200 rounded-lg text-center hover:bg-amber-50 cursor-pointer"
                  >
                    <p className="font-bold text-slate-800">₹75,000</p>
                    <p className="text-[10px] text-slate-500">Special Hub</p>
                  </button>
                </div>
              </div>

              {/* Total Committed Amount */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Total Committed Takhmeen Amount (₹) *
                </label>
                <input
                  type="number"
                  min={1000}
                  step={500}
                  value={formCommittedAmount || ''}
                  onChange={(e) => setFormCommittedAmount(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              {/* Paid Amount */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Amount Already Paid (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={formCommittedAmount}
                    value={formPaidAmount || 0}
                    onChange={(e) => setFormPaidAmount(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-emerald-800 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Calculated Balance Due (₹)
                  </label>
                  <div className="p-2.5 bg-slate-100 border border-slate-200 rounded-lg text-rose-800 font-mono font-bold">
                    ₹{Math.max(0, formCommittedAmount - formPaidAmount).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Commitment Remarks / Installment Plan
                </label>
                <input
                  type="text"
                  value={formRemarks}
                  onChange={(e) => setFormRemarks(e.target.value)}
                  placeholder="e.g. 2 quarterly installments / Shehrullah pledge"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              {/* Modal Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg shadow-sm cursor-pointer"
                >
                  {editingRecord ? 'Save Changes' : 'Confirm Allocation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
