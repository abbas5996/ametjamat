import React, { useState, useMemo, useEffect } from 'react';
import {
  UtensilsCrossed,
  Search,
  Filter,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Clock,
  Ban,
  MapPin,
  Phone,
  User,
  Plus,
  Lock,
  X,
  ExternalLink,
  ChevronDown,
  Calendar,
  Truck,
  Building,
  Download,
} from 'lucide-react';
import {
  ThaaliRecord,
  ThaaliStatus,
  TakhmeenTier,
  DeliveryType,
  HeadOfFamily,
  UserProfile,
} from '../../types';
import { saveStoredThaalis, logFmbAudit } from '../../utils/fmbTakhmeen';
import { checkUserPermission } from '../../utils/rbac';

interface ThaaliStatusSubpageProps {
  thaalis: ThaaliRecord[];
  setThaalis: React.Dispatch<React.SetStateAction<ThaaliRecord[]>>;
  hofs: HeadOfFamily[];
  currentUser: UserProfile;
  showToast: (msg: string) => void;
  exportTrigger?: number;
}

export const ThaaliStatusSubpage: React.FC<ThaaliStatusSubpageProps> = ({
  thaalis,
  setThaalis,
  hofs,
  currentUser,
  showToast,
  exportTrigger,
}) => {
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [deliveryFilter, setDeliveryFilter] = useState<string>('all');

  // Modal State
  const [editingRecord, setEditingRecord] = useState<ThaaliRecord | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewingHofDetails, setViewingHofDetails] = useState<HeadOfFamily | null>(null);

  // Form State for Edit Modal
  const [modalStatus, setModalStatus] = useState<ThaaliStatus>('Active');
  const [modalTier, setModalTier] = useState<TakhmeenTier>('Full');
  const [modalDeliveryType, setModalDeliveryType] = useState<DeliveryType>('Home Delivery');
  const [modalAddress, setModalAddress] = useState('');
  const [modalPickupPoint, setModalPickupPoint] = useState('');
  const [modalVacationFrom, setModalVacationFrom] = useState('');
  const [modalVacationTo, setModalVacationTo] = useState('');
  const [modalReason, setModalReason] = useState('');

  // Form State for Add Modal
  const [addSelectedIts, setAddSelectedIts] = useState('');
  const [addThaaliNo, setAddThaaliNo] = useState('');
  const [addTier, setAddTier] = useState<TakhmeenTier>('Full');
  const [addStatus, setAddStatus] = useState<ThaaliStatus>('Active');
  const [addDeliveryType, setAddDeliveryType] = useState<DeliveryType>('Home Delivery');
  const [addAddress, setAddAddress] = useState('');
  const [addPickupPoint, setAddPickupPoint] = useState('');

  // Granular RBAC Permissions
  const canAdd = checkUserPermission(currentUser, 'thaali-status', 'add');
  const canEdit = checkUserPermission(currentUser, 'thaali-status', 'edit');
  const canDelete = checkUserPermission(currentUser, 'thaali-status', 'delete');

  // Open Edit/Control Modal
  const handleOpenEdit = (record: ThaaliRecord) => {
    if (!canEdit) {
      showToast('Access Restricted: You do not have [Edit] permission for Thaali Status.');
      return;
    }
    setEditingRecord(record);
    setModalStatus(record.status);
    setModalTier(record.tier);
    setModalDeliveryType(record.deliveryType);
    setModalAddress(record.assignedAddress);
    setModalPickupPoint(record.pickupPoint || '');
    setModalVacationFrom(record.vacationFrom || '');
    setModalVacationTo(record.vacationTo || '');
    setModalReason(record.reason || '');
  };

  // Quick Status Toggle from table row
  const handleQuickStatusToggle = (record: ThaaliRecord, newStatus: ThaaliStatus) => {
    if (!canEdit) {
      showToast('Access Restricted: You do not have [Edit] permission.');
      return;
    }
    const updated = thaalis.map((t) =>
      t.id === record.id
        ? {
            ...t,
            status: newStatus,
            updatedAt: new Date().toISOString().slice(0, 10),
          }
        : t
    );
    setThaalis(updated);
    saveStoredThaalis(updated);
    logFmbAudit(
      currentUser.username,
      'Thaali Status Manager',
      'EDIT',
      record.itsNumber,
      `Quick updated Thaali ${record.thaaliNo} status from [${record.status}] to [${newStatus}].`
    );
    showToast(`Thaali ${record.thaaliNo} updated to ${newStatus}`);
  };

  // Save Modal Edits
  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    if (!canEdit) {
      showToast('Access Restricted: You do not have [Edit] permission.');
      return;
    }

    const updated = thaalis.map((t) =>
      t.id === editingRecord.id
        ? {
            ...t,
            status: modalStatus,
            tier: modalTier,
            deliveryType: modalDeliveryType,
            assignedAddress: modalAddress.trim() || t.assignedAddress,
            pickupPoint: modalDeliveryType === 'Pickup Point' ? modalPickupPoint.trim() : undefined,
            vacationFrom: modalStatus === 'Vacation' ? modalVacationFrom : undefined,
            vacationTo: modalStatus === 'Vacation' ? modalVacationTo : undefined,
            reason: modalStatus === 'Vacation' || modalStatus === 'Blocked' ? modalReason.trim() : undefined,
            updatedAt: new Date().toISOString().slice(0, 10),
          }
        : t
    );

    setThaalis(updated);
    saveStoredThaalis(updated);
    logFmbAudit(
      currentUser.username,
      'Thaali Status Manager',
      'EDIT',
      editingRecord.itsNumber,
      `Updated Thaali ${editingRecord.thaaliNo}: Status [${modalStatus}], Tier [${modalTier}], Mode [${modalDeliveryType}].`
    );

    showToast(`Thaali ${editingRecord.thaaliNo} preferences saved successfully.`);
    setEditingRecord(null);
  };

  // Handle Add New Thaali
  const handleSaveAddModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAdd) {
      showToast('Access Restricted: You do not have [Add] permission.');
      return;
    }

    if (!addSelectedIts) {
      showToast('Please select a Head of Family.');
      return;
    }

    const matchedHof = hofs.find((h) => h.itsNumber === addSelectedIts);
    if (!matchedHof) {
      showToast('Selected member not found in Member Master.');
      return;
    }

    // Check if ITS already registered
    const exists = thaalis.some((t) => t.itsNumber === addSelectedIts);
    if (exists) {
      showToast(`Member with ITS ${addSelectedIts} already has an assigned Thaali.`);
      return;
    }

    const newThaali: ThaaliRecord = {
      id: `th-${addSelectedIts}`,
      itsNumber: addSelectedIts,
      hofName: matchedHof.fullName,
      mobileNumber: matchedHof.mobileNumber,
      thaaliNo: addThaaliNo.trim() || `TH-${String(thaalis.length + 101).padStart(3, '0')}`,
      status: addStatus,
      tier: addTier,
      deliveryType: addDeliveryType,
      assignedAddress: addAddress.trim() || matchedHof.fullAddress,
      pickupPoint: addDeliveryType === 'Pickup Point' ? addPickupPoint.trim() : undefined,
      mohallahName: matchedHof.mohallahName,
      updatedAt: new Date().toISOString().slice(0, 10),
    };

    const updated = [newThaali, ...thaalis];
    setThaalis(updated);
    saveStoredThaalis(updated);

    logFmbAudit(
      currentUser.username,
      'Thaali Status Manager',
      'ADD',
      addSelectedIts,
      `Registered new Thaali ${newThaali.thaaliNo} for HOF "${matchedHof.fullName}" (${addTier} Tier, ${addStatus}).`
    );

    showToast(`Registered Thaali ${newThaali.thaaliNo} successfully!`);
    setIsAddModalOpen(false);
    // Reset Add Form
    setAddSelectedIts('');
    setAddThaaliNo('');
    setAddAddress('');
    setAddPickupPoint('');
  };

  // Find linked HOF for detail popup
  const handleViewHof = (itsNumber: string) => {
    const matched = hofs.find((h) => h.itsNumber === itsNumber);
    if (matched) {
      setViewingHofDetails(matched);
    } else {
      showToast(`No HOF Master record found for ITS: ${itsNumber}`);
    }
  };

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = thaalis.length;
    const active = thaalis.filter((t) => t.status === 'Active').length;
    const vacation = thaalis.filter((t) => t.status === 'Vacation').length;
    const blockedOrClosed = thaalis.filter((t) => t.status === 'Blocked' || t.status === 'Closed').length;
    return { total, active, vacation, blockedOrClosed };
  }, [thaalis]);

  // Filtered List
  const filteredThaalis = useMemo(() => {
    return thaalis.filter((item) => {
      // Search
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        item.itsNumber.includes(q) ||
        item.hofName.toLowerCase().includes(q) ||
        item.thaaliNo.toLowerCase().includes(q) ||
        item.assignedAddress.toLowerCase().includes(q) ||
        (item.pickupPoint && item.pickupPoint.toLowerCase().includes(q));

      // Status
      const matchStatus = statusFilter === 'all' || item.status === statusFilter;

      // Tier
      const matchTier = tierFilter === 'all' || item.tier === tierFilter;

      // Delivery Type
      const matchDelivery = deliveryFilter === 'all' || item.deliveryType === deliveryFilter;

      return matchQuery && matchStatus && matchTier && matchDelivery;
    });
  }, [thaalis, searchQuery, statusFilter, tierFilter, deliveryFilter]);

  // Get status badge styling
  const renderStatusBadge = (status: ThaaliStatus) => {
    switch (status) {
      case 'Active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Active
          </span>
        );
      case 'Vacation':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3 h-3 text-amber-600" />
            Vacation
          </span>
        );
      case 'Closed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
            <AlertCircle className="w-3 h-3 text-slate-500" />
            Closed
          </span>
        );
      case 'Blocked':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <Ban className="w-3 h-3 text-rose-600" />
            Blocked
          </span>
        );
    }
  };

  // Get tier badge styling
  const renderTierBadge = (tier: TakhmeenTier) => {
    switch (tier) {
      case 'Full':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
            Full Tier
          </span>
        );
      case 'Half':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
            Half Tier
          </span>
        );
      case 'Special':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
            Special Tier
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700">
            {tier}
          </span>
        );
    }
  };

  // Export currently displayed (filtered) thaali table data to CSV
  const handleExportCsv = () => {
    if (filteredThaalis.length === 0) {
      showToast('No thaali records found in current view to export.');
      return;
    }

    const headers = [
      'ITS No',
      'HOF Name',
      'Mobile',
      'Thaali Status',
      'Tier',
      'Address',
    ];

    const rows = filteredThaalis.map((item) => [
      `"${item.itsNumber}"`,
      `"${(item.hofName || '').replace(/"/g, '""')}"`,
      `"${item.mobileNumber || ''}"`,
      `"${item.status || ''}"`,
      `"${item.tier || ''}"`,
      `"${(item.assignedAddress || item.pickupPoint || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `thaali_status_roster_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    logFmbAudit(
      currentUser.username,
      'Thaali Status Manager',
      'EDIT',
      'ALL',
      `Officer @${currentUser.username} exported ${filteredThaalis.length} thaali records to CSV.`
    );
    showToast(`Exported ${filteredThaalis.length} thaali records to CSV.`);
  };

  // Synchronize with external header Export CTA
  useEffect(() => {
    if (exportTrigger && exportTrigger > 0) {
      handleExportCsv();
    }
  }, [exportTrigger]);

  useEffect(() => {
    const handleCustomExport = () => {
      handleExportCsv();
    };
    window.addEventListener('jamat_export_thaali_status', handleCustomExport);
    return () => {
      window.removeEventListener('jamat_export_thaali_status', handleCustomExport);
    };
  }, [filteredThaalis, currentUser]);

  return (
    <div className="space-y-6">
      {/* ── Summary Statistics Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Total Registered</p>
            <p className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5 font-mono">
              {metrics.total}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-700">Active Dispatch</p>
            <p className="text-xl sm:text-2xl font-black text-emerald-900 mt-0.5 font-mono">
              {metrics.active}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-300 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-amber-700">Vacation / Paused</p>
            <p className="text-xl sm:text-2xl font-black text-amber-900 mt-0.5 font-mono">
              {metrics.vacation}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-rose-700">Closed / Blocked</p>
            <p className="text-xl sm:text-2xl font-black text-rose-900 mt-0.5 font-mono">
              {metrics.blockedOrClosed}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold">
            <Ban className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ── Filter Bar & Actions ── */}
      <div className="bg-white border border-amber-200/80 rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by ITS, HOF Name, Thaali No, or Address..."
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

          <div className="flex items-center gap-2 shrink-0">
            {/* Export CSV Button */}
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              title="Export currently displayed table data to CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Export CSV</span>
            </button>

            {/* Action Button: Add Thaali */}
            {canAdd ? (
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Register New Thaali</span>
              </button>
            ) : (
              <div
                className="flex items-center gap-1 px-3 py-2 bg-slate-100 text-slate-400 rounded-lg text-xs font-medium cursor-not-allowed"
                title="Add Restricted by RBAC"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Register Thaali (Restricted)</span>
              </div>
            )}
          </div>
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
            <option value="all">All Statuses ({thaalis.length})</option>
            <option value="Active">Active Only</option>
            <option value="Vacation">Vacation / Paused</option>
            <option value="Closed">Closed</option>
            <option value="Blocked">Blocked</option>
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

          {/* Delivery Mode Filter */}
          <select
            value={deliveryFilter}
            onChange={(e) => setDeliveryFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">All Delivery Modes</option>
            <option value="Home Delivery">Home Delivery</option>
            <option value="Pickup Point">Pickup Point Hub</option>
            <option value="Dawat Centre">Dawat Centre</option>
          </select>

          {(statusFilter !== 'all' || tierFilter !== 'all' || deliveryFilter !== 'all' || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setStatusFilter('all');
                setTierFilter('all');
                setDeliveryFilter('all');
                setSearchQuery('');
              }}
              className="ml-auto text-xs text-amber-700 hover:text-amber-800 font-bold hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* ── Master Table ── */}
      <div className="bg-white border border-amber-200/90 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0F172A] text-white uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="py-3 px-3.5">ITS No</th>
                <th className="py-3 px-3.5">HOF Name & Mohallah</th>
                <th className="py-3 px-3.5">Mobile</th>
                <th className="py-3 px-3.5">Thaali & Tier</th>
                <th className="py-3 px-3.5">Thaali Status</th>
                <th className="py-3 px-3.5">Assigned Address / Pickup</th>
                <th className="py-3 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredThaalis.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    <UtensilsCrossed className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-700">No Thaalis Found</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Adjust your search or filter criteria to see matching records.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredThaalis.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-amber-50/50 transition-colors group"
                  >
                    {/* ITS Number */}
                    <td className="py-3 px-3.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleViewHof(item.itsNumber)}
                        className="text-amber-700 hover:text-amber-900 hover:underline flex items-center gap-1 cursor-pointer"
                        title="View Member Master profile"
                      >
                        <span>{item.itsNumber}</span>
                        <ExternalLink className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100" />
                      </button>
                    </td>

                    {/* HOF Name & Mohallah */}
                    <td className="py-3 px-3.5">
                      <div className="font-bold text-slate-900">{item.hofName}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                        <span className="truncate">{item.mohallahName || 'Unassigned Mohallah'}</span>
                      </div>
                    </td>

                    {/* Mobile */}
                    <td className="py-3 px-3.5 font-mono text-slate-700 whitespace-nowrap">
                      <a
                        href={`tel:${item.mobileNumber}`}
                        className="hover:text-amber-700 flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{item.mobileNumber}</span>
                      </a>
                    </td>

                    {/* Thaali No & Tier */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <div className="font-bold font-mono text-slate-900">{item.thaaliNo}</div>
                      <div className="mt-1">{renderTierBadge(item.tier)}</div>
                    </td>

                    {/* Thaali Status */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <div>{renderStatusBadge(item.status)}</div>
                      {item.status === 'Vacation' && item.vacationFrom && (
                        <div className="text-[10px] text-amber-700 mt-1 font-mono">
                          {item.vacationFrom} to {item.vacationTo || 'Open'}
                        </div>
                      )}
                      {item.status === 'Blocked' && item.reason && (
                        <div className="text-[10px] text-rose-600 mt-0.5 truncate max-w-[140px]" title={item.reason}>
                          {item.reason}
                        </div>
                      )}
                    </td>

                    {/* Assigned Address */}
                    <td className="py-3 px-3.5 max-w-xs">
                      <div className="text-slate-800 line-clamp-2" title={item.assignedAddress}>
                        {item.assignedAddress}
                      </div>
                      <div className="text-[10px] font-semibold text-slate-500 mt-0.5 flex items-center gap-1">
                        <Truck className="w-3 h-3 text-slate-400" />
                        <span>
                          {item.deliveryType}
                          {item.pickupPoint ? ` • ${item.pickupPoint}` : ''}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Quick Toggle Dropdown */}
                        {canEdit ? (
                          <div className="relative inline-block text-left">
                            <select
                              aria-label="Change Thaali status"
                              value={item.status}
                              onChange={(e) =>
                                handleQuickStatusToggle(item, e.target.value as ThaaliStatus)
                              }
                              className="text-[11px] font-bold py-1 px-2 rounded-md bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 cursor-pointer focus:outline-none"
                            >
                              <option value="Active">Set Active</option>
                              <option value="Vacation">Set Vacation</option>
                              <option value="Closed">Set Closed</option>
                              <option value="Blocked">Set Blocked</option>
                            </select>
                          </div>
                        ) : null}

                        {/* Edit Control Button */}
                        {canEdit ? (
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-md font-bold transition-colors cursor-pointer"
                            title="Open Thaali Status Control Modal"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span
                            className="p-1.5 bg-slate-100 text-slate-300 rounded-md"
                            title="Edit Restricted by RBAC"
                          >
                            <Lock className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── THAALI STATUS CONTROL MODAL ── */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-amber-300 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-[#0F172A] text-white p-4 sm:p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
                  <UtensilsCrossed className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Control Thaali {editingRecord.thaaliNo}</span>
                  </h3>
                  <p className="text-xs text-amber-300 font-mono">
                    ITS: {editingRecord.itsNumber} • {editingRecord.hofName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="text-slate-400 hover:text-white p-1 rounded-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveModal} className="p-4 sm:p-6 space-y-4 text-xs">
              {/* Linked Member Master Info Box */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center shrink-0 font-bold">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-900">{editingRecord.hofName}</p>
                  <p className="text-slate-600 mt-0.5">
                    Mobile: <span className="font-mono">{editingRecord.mobileNumber}</span> •
                    Mohallah: <span>{editingRecord.mohallahName || 'Burhani Mohallah'}</span>
                  </p>
                </div>
              </div>

              {/* Status & Tier Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Thaali Status *
                  </label>
                  <select
                    value={modalStatus}
                    onChange={(e) => setModalStatus(e.target.value as ThaaliStatus)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Active">Active (Daily Dispatch)</option>
                    <option value="Vacation">Vacation / Travel Pause</option>
                    <option value="Closed">Closed (Voluntary Discontinuation)</option>
                    <option value="Blocked">Blocked (Administrative Hold)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Takhmeen Tier *
                  </label>
                  <select
                    value={modalTier}
                    onChange={(e) => setModalTier(e.target.value as TakhmeenTier)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Full">Full Tier (Standard Family)</option>
                    <option value="Half">Half Tier (2-Person Family)</option>
                    <option value="Special">Special Tier (Extended / Custom)</option>
                  </select>
                </div>
              </div>

              {/* Vacation Dates if Vacation */}
              {modalStatus === 'Vacation' && (
                <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-300 space-y-3">
                  <p className="font-bold text-amber-900 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-amber-700" />
                    <span>Vacation / Safar Schedule</span>
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">From Date</label>
                      <input
                        type="date"
                        value={modalVacationFrom}
                        onChange={(e) => setModalVacationFrom(e.target.value)}
                        className="w-full p-2 bg-white border border-slate-300 rounded-md text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">To Date</label>
                      <input
                        type="date"
                        value={modalVacationTo}
                        onChange={(e) => setModalVacationTo(e.target.value)}
                        className="w-full p-2 bg-white border border-slate-300 rounded-md text-slate-800"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Delivery Mode */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Delivery Mode *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Home Delivery', 'Pickup Point', 'Dawat Centre'] as DeliveryType[]).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setModalDeliveryType(mode)}
                      className={`p-2 rounded-lg font-bold border text-center transition-all cursor-pointer ${
                        modalDeliveryType === mode
                          ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Assigned Address */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Assigned Delivery Address / Flat No *
                </label>
                <textarea
                  rows={2}
                  value={modalAddress}
                  onChange={(e) => setModalAddress(e.target.value)}
                  placeholder="Enter full flat, building, and lane delivery address..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              {/* Pickup Point Hub if Pickup */}
              {modalDeliveryType === 'Pickup Point' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Central Pickup Point Hub Name
                  </label>
                  <input
                    type="text"
                    value={modalPickupPoint}
                    onChange={(e) => setModalPickupPoint(e.target.value)}
                    placeholder="e.g. Sector C Community Hub / Mawaid Counter"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
              )}

              {/* Reason / Remarks */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Remarks / Reason for Status Change
                </label>
                <input
                  type="text"
                  value={modalReason}
                  onChange={(e) => setModalReason(e.target.value)}
                  placeholder="e.g. Traveling for Ziyarat / Address updated per request..."
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              {/* Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg shadow-sm cursor-pointer"
                >
                  Save & Update Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── REGISTER NEW THAALI MODAL ── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-amber-300 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-[#0F172A] text-white p-4 sm:p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Register New Thaali</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAddModal} className="p-4 sm:p-6 space-y-4 text-xs">
              {/* Select Member from Member Master */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Select Head of Family (from Member Master) *
                </label>
                <select
                  value={addSelectedIts}
                  onChange={(e) => {
                    const its = e.target.value;
                    setAddSelectedIts(its);
                    const matched = hofs.find((h) => h.itsNumber === its);
                    if (matched) {
                      setAddAddress(matched.fullAddress);
                      setAddThaaliNo(matched.thaaliNo || `TH-${String(thaalis.length + 101).padStart(3, '0')}`);
                    }
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                >
                  <option value="">-- Choose Member --</option>
                  {hofs.map((h) => (
                    <option key={h.id} value={h.itsNumber}>
                      {h.fullName} (ITS: {h.itsNumber}) • {h.mohallahName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Thaali Number & Tier */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Thaali Number *
                  </label>
                  <input
                    type="text"
                    value={addThaaliNo}
                    onChange={(e) => setAddThaaliNo(e.target.value)}
                    placeholder="e.g. TH-188"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Takhmeen Tier *
                  </label>
                  <select
                    value={addTier}
                    onChange={(e) => setAddTier(e.target.value as TakhmeenTier)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold"
                  >
                    <option value="Full">Full Tier</option>
                    <option value="Half">Half Tier</option>
                    <option value="Special">Special Tier</option>
                  </select>
                </div>
              </div>

              {/* Status & Delivery Mode */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Initial Status
                  </label>
                  <select
                    value={addStatus}
                    onChange={(e) => setAddStatus(e.target.value as ThaaliStatus)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  >
                    <option value="Active">Active</option>
                    <option value="Vacation">Vacation</option>
                    <option value="Closed">Closed</option>
                    <option value="Blocked">Blocked</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Delivery Type
                  </label>
                  <select
                    value={addDeliveryType}
                    onChange={(e) => setAddDeliveryType(e.target.value as DeliveryType)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  >
                    <option value="Home Delivery">Home Delivery</option>
                    <option value="Pickup Point">Pickup Point</option>
                    <option value="Dawat Centre">Dawat Centre</option>
                  </select>
                </div>
              </div>

              {/* Assigned Address */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Delivery Address *
                </label>
                <textarea
                  rows={2}
                  value={addAddress}
                  onChange={(e) => setAddAddress(e.target.value)}
                  placeholder="Enter full delivery address..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  required
                />
              </div>

              {/* Modal Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg shadow-sm cursor-pointer"
                >
                  Register Thaali
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MEMBER MASTER PROFILE QUICK VIEW MODAL ── */}
      {viewingHofDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-amber-300 w-full max-w-md overflow-hidden">
            <div className="bg-[#0F172A] text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Building className="w-4 h-4 text-amber-400" />
                <span>Member Master Profile</span>
              </h3>
              <button
                type="button"
                onClick={() => setViewingHofDetails(null)}
                className="text-slate-400 hover:text-white p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3 text-xs">
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold">HOF Full Name</p>
                <p className="text-sm font-bold text-slate-900">{viewingHofDetails.fullName}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">ITS Number</p>
                  <p className="font-mono font-bold text-amber-800">{viewingHofDetails.itsNumber}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Mobile</p>
                  <p className="font-mono text-slate-800">{viewingHofDetails.mobileNumber}</p>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold">Mohallah Sector</p>
                <p className="text-slate-800 font-semibold">{viewingHofDetails.mohallahName}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold">Full Address</p>
                <p className="text-slate-700">{viewingHofDetails.fullAddress}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold">Family Members</p>
                <p className="text-slate-800 font-bold">
                  {viewingHofDetails.familyMembers.length + 1} Mumineen in household
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setViewingHofDetails(null)}
                  className="w-full py-2 bg-amber-400 text-slate-950 font-bold rounded-lg text-center"
                >
                  Close Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
