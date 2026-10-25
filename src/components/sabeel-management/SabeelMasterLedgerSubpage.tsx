import React, { useState, useMemo } from 'react';
import {
  Coins,
  Search,
  Filter,
  CreditCard,
  Edit,
  Trash2,
  Plus,
  Lock,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  TrendingUp,
  MapPin,
  ExternalLink,
  HelpCircle,
  ArrowRight,
  User,
  ShieldCheck,
  Building,
} from 'lucide-react';
import {
  SabeelLedgerRecord,
  SabeelCategory,
  SabeelAccountStatus,
  HeadOfFamily,
  UserProfile,
  FinancialYear,
} from '../../types';
import { saveStoredSabeelLedger, logSabeelAudit } from '../../utils/sabeelManagement';
import { checkUserPermission } from '../../utils/rbac';

interface SabeelMasterLedgerSubpageProps {
  ledger: SabeelLedgerRecord[];
  setLedger: React.Dispatch<React.SetStateAction<SabeelLedgerRecord[]>>;
  hofs: HeadOfFamily[];
  currentUser: UserProfile;
  financialYear: FinancialYear;
  showToast: (msg: string) => void;
  onNavigateToPayment: (itsNumber: string) => void;
  onNavigateToHistory: (itsNumber?: string) => void;
}

export const SabeelMasterLedgerSubpage: React.FC<SabeelMasterLedgerSubpageProps> = ({
  ledger,
  setLedger,
  hofs,
  currentUser,
  financialYear,
  showToast,
  onNavigateToPayment,
  onNavigateToHistory,
}) => {
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [mohallahFilter, setMohallahFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Modal State for Add / Edit Sabeel Entry
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<SabeelLedgerRecord | null>(null);

  // Form State
  const [formIts, setFormIts] = useState('');
  const [formHofName, setFormHofName] = useState('');
  const [formSabeelNo, setFormSabeelNo] = useState('');
  const [formMobile, setFormMobile] = useState('');
  const [formMohallah, setFormMohallah] = useState('');
  const [formCategory, setFormCategory] = useState<SabeelCategory>('Residential');
  const [formCommitted, setFormCommitted] = useState<number>(24000);
  const [formPaid, setFormPaid] = useState<number>(0);
  const [formNotes, setFormNotes] = useState('');

  // Granular RBAC Permissions
  const canAdd = checkUserPermission(currentUser, 'sabeel-ledger', 'add');
  const canEdit = checkUserPermission(currentUser, 'sabeel-ledger', 'edit');
  const canDelete = checkUserPermission(currentUser, 'sabeel-ledger', 'delete');

  // Open Add Modal
  const handleOpenAdd = () => {
    if (!canAdd) {
      showToast('Access Restricted: You do not have [Add] permission for Sabeel Ledger.');
      return;
    }
    setEditingRecord(null);
    setFormIts('');
    setFormHofName('');
    setFormSabeelNo('');
    setFormMobile('');
    setFormMohallah('');
    setFormCategory('Residential');
    setFormCommitted(24000);
    setFormPaid(0);
    setFormNotes('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (record: SabeelLedgerRecord) => {
    if (!canEdit) {
      showToast('Access Restricted: You do not have [Edit] permission for Sabeel Ledger.');
      return;
    }
    setEditingRecord(record);
    setFormIts(record.itsNumber);
    setFormHofName(record.hofName);
    setFormSabeelNo(record.sabeelNo);
    setFormMobile(record.mobileNumber);
    setFormMohallah(record.mohallahName);
    setFormCategory(record.category);
    setFormCommitted(record.committedAmount);
    setFormPaid(record.paidAmount);
    setFormNotes(record.notes || '');
    setIsModalOpen(true);
  };

  // Select HOF in Add Modal
  const handleSelectHof = (its: string) => {
    setFormIts(its);
    const matched = hofs.find((h) => h.itsNumber === its);
    if (matched) {
      setFormHofName(matched.fullName);
      setFormMobile(matched.mobileNumber);
      setFormMohallah(matched.mohallahName || 'Burhani Mohallah');
      setFormSabeelNo(matched.sabeelNo || `SB-${String(ledger.length + 101).padStart(3, '0')}`);
    }
  };

  // Save Add/Edit Sabeel Entry
  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formIts || formCommitted <= 0) {
      showToast('Please select a valid member and specify a commitment amount.');
      return;
    }

    const calculatedBalance = Math.max(0, formCommitted - formPaid);
    const calculatedStatus: SabeelAccountStatus =
      calculatedBalance === 0 ? 'Settled' : formPaid > 0 ? 'Partial' : 'Pending';

    const now = new Date().toISOString().slice(0, 10);

    if (editingRecord) {
      // Update
      const updated = ledger.map((rec) =>
        rec.id === editingRecord.id
          ? {
              ...rec,
              sabeelNo: formSabeelNo.trim() || rec.sabeelNo,
              category: formCategory,
              committedAmount: formCommitted,
              paidAmount: formPaid,
              balanceDue: calculatedBalance,
              status: calculatedStatus,
              notes: formNotes.trim() || undefined,
              updatedAt: now,
            }
          : rec
      );
      setLedger(updated);
      saveStoredSabeelLedger(updated);
      logSabeelAudit(
        currentUser.username,
        'Sabeel Master Ledger',
        'EDIT',
        editingRecord.itsNumber,
        `Updated Sabeel ${editingRecord.sabeelNo} for ${editingRecord.hofName}: Commitment ₹${formCommitted.toLocaleString(
          'en-IN'
        )}, Paid ₹${formPaid.toLocaleString('en-IN')}, Balance Due ₹${calculatedBalance.toLocaleString('en-IN')}.`
      );
      showToast(`Updated Sabeel account ${editingRecord.sabeelNo} successfully.`);
    } else {
      // Check existing
      if (ledger.some((l) => l.itsNumber === formIts && l.financialYear === financialYear)) {
        showToast(`Member with ITS ${formIts} already has a Sabeel account for ${financialYear}.`);
        return;
      }

      const newRecord: SabeelLedgerRecord = {
        id: `sb-${formIts}-${Date.now().toString().slice(-4)}`,
        itsNumber: formIts,
        hofName: formHofName,
        sabeelNo: formSabeelNo.trim() || `SB-${String(ledger.length + 101).padStart(3, '0')}`,
        mobileNumber: formMobile,
        mohallahName: formMohallah || 'Burhani Mohallah',
        financialYear,
        category: formCategory,
        committedAmount: formCommitted,
        paidAmount: formPaid,
        balanceDue: calculatedBalance,
        status: calculatedStatus,
        notes: formNotes.trim() || undefined,
        createdAt: now,
        updatedAt: now,
      };

      const updated = [newRecord, ...ledger];
      setLedger(updated);
      saveStoredSabeelLedger(updated);
      logSabeelAudit(
        currentUser.username,
        'Sabeel Master Ledger',
        'ADD',
        formIts,
        `Created new Sabeel account ${newRecord.sabeelNo} for ${formHofName} (Target ₹${formCommitted.toLocaleString(
          'en-IN'
        )}).`
      );
      showToast(`Created Sabeel account ${newRecord.sabeelNo} successfully.`);
    }

    setIsModalOpen(false);
  };

  // Delete Record
  const handleDelete = (record: SabeelLedgerRecord) => {
    if (!canDelete) {
      showToast('Access Restricted: You do not have [Delete] permission for Sabeel Ledger.');
      return;
    }

    if (
      window.confirm(
        `Are you sure you want to remove Sabeel account ${record.sabeelNo} for ${record.hofName}?`
      )
    ) {
      const updated = ledger.filter((l) => l.id !== record.id);
      setLedger(updated);
      saveStoredSabeelLedger(updated);
      logSabeelAudit(
        currentUser.username,
        'Sabeel Master Ledger',
        'DELETE',
        record.itsNumber,
        `Deleted Sabeel ledger account ${record.sabeelNo} of ${record.hofName}.`
      );
      showToast(`Removed Sabeel account ${record.sabeelNo}.`);
    }
  };

  // Financial Summary Metrics
  const summary = useMemo(() => {
    const totalCommitted = ledger.reduce((sum, item) => sum + (item.committedAmount || 0), 0);
    const totalPaid = ledger.reduce((sum, item) => sum + (item.paidAmount || 0), 0);
    const totalDue = ledger.reduce((sum, item) => sum + (item.balanceDue || 0), 0);
    const recoveryRate = totalCommitted > 0 ? Math.round((totalPaid / totalCommitted) * 100) : 0;
    const settledCount = ledger.filter((l) => l.status === 'Settled').length;
    const pendingCount = ledger.filter((l) => l.status === 'Pending' || l.balanceDue > 0).length;

    return { totalCommitted, totalPaid, totalDue, recoveryRate, settledCount, pendingCount };
  }, [ledger]);

  // Unique Mohallahs for Filter
  const uniqueMohallahs = useMemo(() => {
    const set = new Set<string>();
    ledger.forEach((l) => {
      if (l.mohallahName) set.add(l.mohallahName);
    });
    return Array.from(set);
  }, [ledger]);

  // Filtered Ledger
  const filteredLedger = useMemo(() => {
    return ledger.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.itsNumber.includes(q) ||
        item.hofName.toLowerCase().includes(q) ||
        item.sabeelNo.toLowerCase().includes(q) ||
        item.mobileNumber.includes(q);

      const matchStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'defaulters'
          ? item.balanceDue > 0
          : item.status === statusFilter;

      const matchMohallah = mohallahFilter === 'all' || item.mohallahName === mohallahFilter;
      const matchCategory = categoryFilter === 'all' || item.category === categoryFilter;

      return matchSearch && matchStatus && matchMohallah && matchCategory;
    });
  }, [ledger, searchQuery, statusFilter, mohallahFilter, categoryFilter]);

  // Render Status Badge
  const renderStatusBadge = (status: SabeelAccountStatus) => {
    switch (status) {
      case 'Settled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Settled (Paid)
          </span>
        );
      case 'Partial':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            Partial Dues
          </span>
        );
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            Pending (Due)
          </span>
        );
      case 'Exempt':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
            Exempted
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Intuitive Page Header & Guidance ── */}
      <div className="bg-white border-l-4 border-amber-500 rounded-xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Coins className="w-5 h-5 text-amber-600" />
            <span>Sabeel Master Ledger — Central Community Accounts</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            View all official household Sabeel accounts, verify pledged contributions vs. recovered amounts,
            and monitor outstanding community balances in real-time.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-mono font-bold bg-amber-100 text-amber-900 px-3 py-1 rounded-full border border-amber-300">
            {financialYear}
          </span>
        </div>
      </div>

      {/* ── Summary Metric Cards for Executive Overview ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Target */}
        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Total Sabeel Target</p>
            <p className="text-xl sm:text-2xl font-black text-slate-900 font-mono mt-0.5">
              ₹{summary.totalCommitted.toLocaleString('en-IN')}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">{ledger.length} Active Accounts</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
            <Coins className="w-5 h-5" />
          </div>
        </div>

        {/* Total Collected */}
        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-700">Total Collected</p>
            <p className="text-xl sm:text-2xl font-black text-emerald-900 font-mono mt-0.5">
              ₹{summary.totalPaid.toLocaleString('en-IN')}
            </p>
            <p className="text-[10px] text-emerald-600 font-bold mt-0.5">
              {summary.recoveryRate}% Overall Recovery
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Total Pending Dues */}
        <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-rose-700">Total Pending Dues</p>
            <p className="text-xl sm:text-2xl font-black text-rose-900 font-mono mt-0.5">
              ₹{summary.totalDue.toLocaleString('en-IN')}
            </p>
            <p className="text-[10px] text-rose-500 font-bold mt-0.5">
              {summary.pendingCount} Accounts Outstanding
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Fully Cleared Accounts */}
        <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-blue-700">Fully Cleared</p>
            <p className="text-xl sm:text-2xl font-black text-blue-900 font-mono mt-0.5">
              {summary.settledCount} / {ledger.length}
            </p>
            <p className="text-[10px] text-blue-600 font-medium mt-0.5">100% Sabeel Settled</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
            <TrendingUp className="w-5 h-5" />
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
              placeholder="Instant Search by ITS No, HOF Full Name, Sabeel No, or Mobile..."
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

          {/* Action Button: [ + New Sabeel Entry ] */}
          {canAdd ? (
            <button
              type="button"
              onClick={handleOpenAdd}
              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
              title="Add a new Sabeel account for a Mumineen household"
            >
              <Plus className="w-4 h-4" />
              <span>+ New Sabeel Entry</span>
            </button>
          ) : (
            <div
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 text-slate-400 rounded-lg text-xs font-medium cursor-not-allowed shrink-0"
              title="Add Restricted by RBAC"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>New Sabeel Entry (Restricted)</span>
            </div>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1 text-slate-500 font-semibold mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter By:</span>
          </div>

          {/* Payment Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">All Payment Statuses ({ledger.length})</option>
            <option value="defaulters">⚠️ Defaulters / Pending Dues ({summary.pendingCount})</option>
            <option value="Settled">✅ Cleared / Settled ({summary.settledCount})</option>
            <option value="Partial">🔄 Partial Payments</option>
          </select>

          {/* Mohallah Filter */}
          <select
            value={mohallahFilter}
            onChange={(e) => setMohallahFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">All Mohallah Sectors</option>
            {uniqueMohallahs.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">All Categories</option>
            <option value="Residential">Residential</option>
            <option value="Commercial">Commercial</option>
            <option value="Special">Special Account</option>
          </select>

          {(statusFilter !== 'all' || mohallahFilter !== 'all' || categoryFilter !== 'all' || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setStatusFilter('all');
                setMohallahFilter('all');
                setCategoryFilter('all');
                setSearchQuery('');
              }}
              className="ml-auto text-xs text-amber-700 hover:text-amber-800 font-bold hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* ── Sabeel Master Table ── */}
      <div className="bg-white border border-amber-200/90 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0F172A] text-white uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="py-3 px-3.5">ITS No</th>
                <th className="py-3 px-3.5">Sabeel No</th>
                <th className="py-3 px-3.5">HOF Full Name</th>
                <th className="py-3 px-3.5">Mohallah</th>
                <th className="py-3 px-3.5 text-right">Committed (₹)</th>
                <th className="py-3 px-3.5 text-right">Paid (₹)</th>
                <th className="py-3 px-3.5 text-right">Balance Due (₹)</th>
                <th className="py-3 px-3.5">Account Status</th>
                <th className="py-3 px-3.5 text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLedger.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-500">
                    <Coins className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-700">No Sabeel Accounts Found</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Adjust your search or filter options, or register a new Sabeel entry.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredLedger.map((item) => (
                  <tr key={item.id} className="hover:bg-amber-50/50 transition-colors">
                    {/* ITS Number */}
                    <td className="py-3 px-3.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {item.itsNumber}
                    </td>

                    {/* Sabeel Number */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <span className="font-mono font-bold text-amber-900 px-2 py-0.5 rounded bg-amber-100 border border-amber-300">
                        {item.sabeelNo}
                      </span>
                    </td>

                    {/* HOF Full Name */}
                    <td className="py-3 px-3.5">
                      <div className="font-bold text-slate-900">{item.hofName}</div>
                      <div className="text-[11px] font-mono text-slate-500">{item.mobileNumber}</div>
                    </td>

                    {/* Mohallah */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-slate-700 font-medium">
                        <MapPin className="w-3 h-3 text-amber-600 shrink-0" />
                        <span className="truncate max-w-[140px]">{item.mohallahName}</span>
                      </div>
                    </td>

                    {/* Committed Amount */}
                    <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                      ₹{item.committedAmount.toLocaleString('en-IN')}
                    </td>

                    {/* Total Paid */}
                    <td className="py-3 px-3.5 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                      ₹{item.paidAmount.toLocaleString('en-IN')}
                    </td>

                    {/* Balance Due */}
                    <td className="py-3 px-3.5 text-right whitespace-nowrap">
                      <span
                        className={`font-mono font-bold ${
                          item.balanceDue > 0 ? 'text-rose-700 text-sm' : 'text-slate-400'
                        }`}
                      >
                        ₹{item.balanceDue.toLocaleString('en-IN')}
                      </span>
                    </td>

                    {/* Account Status */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      {renderStatusBadge(item.status)}
                    </td>

                    {/* Quick Actions */}
                    <td className="py-3 px-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* 💳 Record Payment button (if balance is due) */}
                        {item.balanceDue > 0 && (
                          <button
                            type="button"
                            onClick={() => onNavigateToPayment(item.itsNumber)}
                            className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-md text-[11px] flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                            title="Collect Sabeel payment for this account"
                          >
                            <CreditCard className="w-3 h-3" />
                            <span>💳 Record Payment</span>
                          </button>
                        )}

                        {/* ✏️ Edit Commitment button */}
                        {canEdit ? (
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 rounded-md cursor-pointer transition-colors"
                            title="Edit Sabeel Commitment Details"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="p-1.5 text-slate-300" title="Edit Restricted">
                            <Lock className="w-3.5 h-3.5" />
                          </span>
                        )}

                        {/* 🗑️ Delete button */}
                        {canDelete ? (
                          <button
                            type="button"
                            onClick={() => handleDelete(item)}
                            className="p-1.5 bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-700 rounded-md cursor-pointer transition-colors"
                            title="Delete Sabeel Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── ADD / EDIT SABEEL ENTRY MODAL ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-amber-300 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-[#0F172A] text-white p-4 sm:p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">
                  {editingRecord ? `Edit Sabeel (${editingRecord.sabeelNo})` : 'New Sabeel Account Entry'}
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

            {/* Modal Form */}
            <form onSubmit={handleSaveModal} className="p-4 sm:p-6 space-y-4 text-xs">
              {/* Member Selection */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Select Head of Family (from Member Master) *
                </label>
                {editingRecord ? (
                  <div className="p-2.5 bg-slate-100 rounded-lg text-slate-900 font-bold flex items-center justify-between">
                    <span>
                      {formHofName} (ITS: {formIts})
                    </span>
                    <span className="text-[10px] text-slate-500 uppercase">Linked</span>
                  </div>
                ) : (
                  <select
                    value={formIts}
                    onChange={(e) => handleSelectHof(e.target.value)}
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

              {/* Sabeel Number & Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Sabeel Number *
                  </label>
                  <input
                    type="text"
                    value={formSabeelNo}
                    onChange={(e) => setFormSabeelNo(e.target.value)}
                    placeholder="e.g. SB-105"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Account Category *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as SabeelCategory)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold"
                  >
                    <option value="Residential">Residential Household</option>
                    <option value="Commercial">Commercial / Shop</option>
                    <option value="Special">Special Account</option>
                  </select>
                </div>
              </div>

              {/* Committed Amount */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Annual Committed Sabeel Target (₹) *
                </label>
                <input
                  type="number"
                  min={500}
                  step={500}
                  value={formCommitted || ''}
                  onChange={(e) => setFormCommitted(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
                <div className="flex gap-2 mt-1.5">
                  {[12000, 18000, 24000, 36000, 48000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setFormCommitted(amt)}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-amber-100 text-slate-700 text-[10px] font-mono font-semibold"
                    >
                      ₹{amt.toLocaleString('en-IN')}
                    </button>
                  ))}
                </div>
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
                    max={formCommitted}
                    value={formPaid || 0}
                    onChange={(e) => setFormPaid(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-emerald-800 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Balance Due (₹)
                  </label>
                  <div className="p-2.5 bg-slate-100 border border-slate-200 rounded-lg text-rose-800 font-mono font-bold">
                    ₹{Math.max(0, formCommitted - formPaid).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Account Notes / Remarks
                </label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="e.g. Registered for Sector A residential dues"
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
                  {editingRecord ? 'Save Changes' : 'Confirm & Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
