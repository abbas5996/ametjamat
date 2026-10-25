import React, { useState, useMemo } from 'react';
import {
  MapPin,
  Building,
  Plus,
  Edit2,
  Trash2,
  Users,
  CheckCircle2,
  AlertCircle,
  Phone,
  UserCheck,
  ArrowRight,
  CheckSquare,
  Square,
  Search,
  X,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Mohallah, HeadOfFamily, UserProfile } from '../../types';
import {
  saveStoredHofs,
  saveStoredMohallahs,
  logMemberAudit,
} from '../../utils/memberMaster';
import { appendActivityLog } from '../../utils/rbac';

interface MohallahMappingSubpageProps {
  currentUser: UserProfile;
  mohallahs: Mohallah[];
  setMohallahs: React.Dispatch<React.SetStateAction<Mohallah[]>>;
  hofs: HeadOfFamily[];
  setHofs: React.Dispatch<React.SetStateAction<HeadOfFamily[]>>;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
  showToast: (msg: string) => void;
  onNavigateToUpdater: (itsNumber: string) => void;
}

export const MohallahMappingSubpage: React.FC<MohallahMappingSubpageProps> = ({
  currentUser,
  mohallahs,
  setMohallahs,
  hofs,
  setHofs,
  canAdd,
  canEdit,
  canDelete,
  showToast,
  onNavigateToUpdater,
}) => {
  // Search
  const [searchTerm, setSearchTerm] = useState('');

  // Add / Edit Mohallah Modal state
  const [isMohallahModalOpen, setIsMohallahModalOpen] = useState(false);
  const [editingMohallahId, setEditingMohallahId] = useState<string | null>(null);
  const [mohallahFormData, setMohallahFormData] = useState({
    name: '',
    code: '',
    sectorInchargeName: '',
    sectorInchargeIts: '',
    inchargeMobile: '',
    notes: '',
  });
  const [mohallahFormError, setMohallahFormError] = useState<string | null>(null);

  // View Assigned HOFs Modal state
  const [viewingMohallahForHofs, setViewingMohallahForHofs] = useState<Mohallah | null>(null);

  // Bulk Assignment state
  const [selectedUnmappedHofIds, setSelectedUnmappedHofIds] = useState<Set<string>>(new Set());
  const [targetBulkMohallahId, setTargetBulkMohallahId] = useState<string>(
    mohallahs[0]?.id || ''
  );
  const [unmappedSearch, setUnmappedSearch] = useState('');

  // Count assigned HOFs per Mohallah
  const mohallahCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    mohallahs.forEach((m) => {
      counts[m.id] = 0;
    });

    let unassigned = 0;
    hofs.forEach((h) => {
      if (h.mohallahId && counts[h.mohallahId] !== undefined) {
        counts[h.mohallahId] += 1;
      } else {
        unassigned += 1;
      }
    });

    return { counts, unassigned };
  }, [mohallahs, hofs]);

  // List of unmapped HOFs
  const unmappedHofs = useMemo(() => {
    return hofs.filter((h) => !h.mohallahId || h.mohallahId === '');
  }, [hofs]);

  // Filtered unmapped HOFs
  const filteredUnmappedHofs = useMemo(() => {
    const q = unmappedSearch.trim().toLowerCase();
    if (!q) return unmappedHofs;
    return unmappedHofs.filter(
      (h) =>
        h.itsNumber.toLowerCase().includes(q) ||
        h.fullName.toLowerCase().includes(q) ||
        h.mobileNumber.toLowerCase().includes(q)
    );
  }, [unmappedHofs, unmappedSearch]);

  // Filtered Mohallahs
  const filteredMohallahs = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return mohallahs;
    return mohallahs.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.code.toLowerCase().includes(q) ||
        m.sectorInchargeName.toLowerCase().includes(q) ||
        m.sectorInchargeIts.toLowerCase().includes(q)
    );
  }, [mohallahs, searchTerm]);

  // Open Create Mohallah Modal
  const handleOpenCreateMohallah = () => {
    setEditingMohallahId(null);
    setMohallahFormData({
      name: '',
      code: `SEC-${String.fromCharCode(65 + mohallahs.length)}`,
      sectorInchargeName: '',
      sectorInchargeIts: '',
      inchargeMobile: '',
      notes: '',
    });
    setMohallahFormError(null);
    setIsMohallahModalOpen(true);
  };

  // Open Edit Mohallah Modal
  const handleOpenEditMohallah = (m: Mohallah) => {
    setEditingMohallahId(m.id);
    setMohallahFormData({
      name: m.name,
      code: m.code,
      sectorInchargeName: m.sectorInchargeName,
      sectorInchargeIts: m.sectorInchargeIts,
      inchargeMobile: m.inchargeMobile,
      notes: m.notes || '',
    });
    setMohallahFormError(null);
    setIsMohallahModalOpen(true);
  };

  // Save Mohallah
  const handleSaveMohallah = (e: React.FormEvent) => {
    e.preventDefault();
    setMohallahFormError(null);

    if (!mohallahFormData.name.trim()) {
      setMohallahFormError('Mohallah Name is required.');
      return;
    }
    if (!mohallahFormData.code.trim()) {
      setMohallahFormError('Zone/Sector Code is required.');
      return;
    }

    const cleanCode = mohallahFormData.code.trim().toUpperCase();

    // Check duplicate code
    const duplicate = mohallahs.find(
      (m) => m.code.toUpperCase() === cleanCode && m.id !== editingMohallahId
    );
    if (duplicate) {
      setMohallahFormError(`Sector Code "${cleanCode}" is already in use by ${duplicate.name}.`);
      return;
    }

    let updatedMohallahs: Mohallah[];

    if (editingMohallahId) {
      // Edit
      updatedMohallahs = mohallahs.map((m) => {
        if (m.id === editingMohallahId) {
          return {
            ...m,
            name: mohallahFormData.name.trim(),
            code: cleanCode,
            sectorInchargeName: mohallahFormData.sectorInchargeName.trim(),
            sectorInchargeIts: mohallahFormData.sectorInchargeIts.trim(),
            inchargeMobile: mohallahFormData.inchargeMobile.trim(),
            notes: mohallahFormData.notes.trim(),
          };
        }
        return m;
      });

      // Update mohallahName on linked HOFs as well
      const updatedHofs = hofs.map((h) => {
        if (h.mohallahId === editingMohallahId) {
          return {
            ...h,
            mohallahName: mohallahFormData.name.trim(),
          };
        }
        return h;
      });
      setHofs(updatedHofs);
      saveStoredHofs(updatedHofs);

      appendActivityLog(
        currentUser.username,
        'Member & Area Master',
        'Mohallah Area Mapping',
        'EDIT',
        `Updated Zone details for "${mohallahFormData.name.trim()}" (Code: ${cleanCode}).`
      );
      showToast(`Updated Mohallah: ${mohallahFormData.name}`);
    } else {
      // Add
      const newMohallah: Mohallah = {
        id: `MOH-${cleanCode.replace(/\s+/g, '-')}`,
        name: mohallahFormData.name.trim(),
        code: cleanCode,
        sectorInchargeName: mohallahFormData.sectorInchargeName.trim(),
        sectorInchargeIts: mohallahFormData.sectorInchargeIts.trim(),
        inchargeMobile: mohallahFormData.inchargeMobile.trim(),
        notes: mohallahFormData.notes.trim(),
        colorTag: 'amber',
      };

      updatedMohallahs = [...mohallahs, newMohallah];

      appendActivityLog(
        currentUser.username,
        'Member & Area Master',
        'Mohallah Area Mapping',
        'ADD',
        `Provisioned new Mohallah "${newMohallah.name}" (Code: ${newMohallah.code}). Incharge: ${newMohallah.sectorInchargeName}.`
      );
      showToast(`Added new Mohallah: ${newMohallah.name}`);
    }

    setMohallahs(updatedMohallahs);
    saveStoredMohallahs(updatedMohallahs);
    setIsMohallahModalOpen(false);
  };

  // Delete Mohallah
  const handleDeleteMohallah = (m: Mohallah) => {
    if (!canDelete) return;

    const assignedCount = mohallahCounts.counts[m.id] || 0;
    if (assignedCount > 0) {
      if (
        !window.confirm(
          `Mohallah "${m.name}" has ${assignedCount} assigned Head of Families! Deleting will reset these HOFs to Unassigned. Continue?`
        )
      ) {
        return;
      }
    } else if (!window.confirm(`Delete Mohallah "${m.name}" (${m.code})?`)) {
      return;
    }

    // Unassign HOFs mapped to this mohallah
    const updatedHofs = hofs.map((h) => {
      if (h.mohallahId === m.id) {
        return {
          ...h,
          mohallahId: '',
          mohallahName: 'Unassigned',
        };
      }
      return h;
    });
    setHofs(updatedHofs);
    saveStoredHofs(updatedHofs);

    const updatedMohallahs = mohallahs.filter((item) => item.id !== m.id);
    setMohallahs(updatedMohallahs);
    saveStoredMohallahs(updatedMohallahs);

    appendActivityLog(
      currentUser.username,
      'Member & Area Master',
      'Mohallah Area Mapping',
      'DELETE',
      `Removed Mohallah "${m.name}" (Code: ${m.code}). ${assignedCount} HOFs shifted to Unassigned.`
    );
    showToast(`Deleted Mohallah ${m.name}`);
  };

  // Single Individual HOF Mohallah Assignment
  const handleAssignSingleHof = (hofId: string, newMohallahId: string) => {
    const targetMohallah = mohallahs.find((m) => m.id === newMohallahId);
    const mohallahName = targetMohallah ? targetMohallah.name : 'Unassigned';

    let targetIts = '';
    const updatedHofs = hofs.map((h) => {
      if (h.id === hofId) {
        targetIts = h.itsNumber;
        return {
          ...h,
          mohallahId: newMohallahId,
          mohallahName,
        };
      }
      return h;
    });

    setHofs(updatedHofs);
    saveStoredHofs(updatedHofs);

    logMemberAudit(
      currentUser.username,
      'Mohallah Area Mapping',
      'EDIT',
      targetIts,
      `Assigned Head of Family to Mohallah: "${mohallahName}".`
    );
    showToast(`Assigned HOF to ${mohallahName}`);
  };

  // Toggle selection for Bulk Assignment
  const toggleSelectUnmapped = (hofId: string) => {
    setSelectedUnmappedHofIds((prev) => {
      const next = new Set(prev);
      if (next.has(hofId)) {
        next.delete(hofId);
      } else {
        next.add(hofId);
      }
      return next;
    });
  };

  // Toggle select all unmapped
  const toggleSelectAllUnmapped = () => {
    if (selectedUnmappedHofIds.size === filteredUnmappedHofs.length) {
      setSelectedUnmappedHofIds(new Set());
    } else {
      setSelectedUnmappedHofIds(new Set(filteredUnmappedHofs.map((h) => h.id)));
    }
  };

  // Execute Bulk Assignment
  const handleExecuteBulkAssignment = () => {
    if (selectedUnmappedHofIds.size === 0) {
      showToast('Please select at least one unmapped HOF.');
      return;
    }
    const targetMohallah = mohallahs.find((m) => m.id === targetBulkMohallahId);
    if (!targetMohallah) {
      showToast('Please select a valid destination Mohallah.');
      return;
    }

    const count = selectedUnmappedHofIds.size;
    const updatedHofs = hofs.map((h) => {
      if (selectedUnmappedHofIds.has(h.id)) {
        return {
          ...h,
          mohallahId: targetMohallah.id,
          mohallahName: targetMohallah.name,
        };
      }
      return h;
    });

    setHofs(updatedHofs);
    saveStoredHofs(updatedHofs);
    setSelectedUnmappedHofIds(new Set());

    appendActivityLog(
      currentUser.username,
      'Member & Area Master',
      'Mohallah Area Mapping',
      'EDIT',
      `Bulk assigned ${count} unmapped HOFs to Mohallah "${targetMohallah.name}" (${targetMohallah.code}).`
    );
    showToast(`Bulk assigned ${count} HOFs to ${targetMohallah.name}`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Overview Metric Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-amber-300/40 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-700 flex items-center justify-center shrink-0">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total Mohallahs / Sectors
            </p>
            <p className="text-xl font-black text-slate-900">{mohallahs.length} Zones</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-300/40 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-700 flex items-center justify-center shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Mapped HOFs
            </p>
            <p className="text-xl font-black text-emerald-800">
              {hofs.length - unmappedHofs.length} of {hofs.length}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-300/40 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-rose-500/10 text-rose-700 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Pending Area Assignment
            </p>
            <p className="text-xl font-black text-rose-700">
              {unmappedHofs.length} Unmapped HOFs
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 1: ZONE/MOHALLAH MASTER TABLE */}
      <div className="bg-white rounded-xl border border-amber-300/40 shadow-xs overflow-hidden space-y-4 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-700" />
              <span>Zone & Mohallah Master Roster</span>
            </h2>
            <p className="text-xs text-slate-500">
              Configured residential sectors, sector incharge leadership, and assigned HOF counts.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search sector or incharge..."
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg w-48 text-slate-800 font-medium focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
              />
            </div>

            {/* STRICT RBAC: Hide "Add Mohallah" if user lacks [Add] */}
            {canAdd && (
              <button
                type="button"
                onClick={handleOpenCreateMohallah}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-500 rounded-lg shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Add Mohallah</span>
              </button>
            )}
          </div>
        </div>

        {/* Master Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-amber-300 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3">Zone / Code</th>
                <th className="py-2.5 px-3">Mohallah Name</th>
                <th className="py-2.5 px-3">Sector Incharge Name & ITS</th>
                <th className="py-2.5 px-3">Incharge Mobile</th>
                <th className="py-2.5 px-3 text-center">Total Assigned HOFs</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMohallahs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No sectors match your search.
                  </td>
                </tr>
              ) : (
                filteredMohallahs.map((m) => {
                  const assignedCount = mohallahCounts.counts[m.id] || 0;
                  return (
                    <tr key={m.id} className="hover:bg-amber-50/40 transition-colors">
                      {/* Code */}
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                          {m.code}
                        </span>
                      </td>

                      {/* Name */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{m.name}</div>
                        {m.notes && (
                          <div className="text-[11px] text-slate-400 truncate max-w-xs">
                            {m.notes}
                          </div>
                        )}
                      </td>

                      {/* Incharge */}
                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-800">
                          {m.sectorInchargeName || 'Not Assigned'}
                        </div>
                        {m.sectorInchargeIts && (
                          <div className="text-[11px] font-mono text-slate-500">
                            ITS: {m.sectorInchargeIts}
                          </div>
                        )}
                      </td>

                      {/* Mobile */}
                      <td className="py-3 px-3 font-mono">
                        {m.inchargeMobile ? (
                          <div className="flex items-center gap-1 text-slate-700">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{m.inchargeMobile}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Assigned HOFs */}
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => setViewingMohallahForHofs(m)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300/60 transition-colors cursor-pointer"
                          title="Click to view assigned HOF roster"
                        >
                          <Users className="w-3 h-3" />
                          <span>{assignedCount} HOFs</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          {/* View HOFs */}
                          <button
                            type="button"
                            onClick={() => setViewingMohallahForHofs(m)}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded cursor-pointer"
                            title="View Assigned HOFs"
                          >
                            <Users className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Mohallah (RBAC) */}
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => handleOpenEditMohallah(m)}
                              className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-amber-100 rounded cursor-pointer"
                              title="Edit Mohallah Details"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Delete Mohallah (RBAC) */}
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => handleDeleteMohallah(m)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                              title="Delete Mohallah"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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

      {/* SECTION 2: BULK & INDIVIDUAL AREA ASSIGNMENT */}
      <div className="bg-white rounded-xl border border-amber-300/40 shadow-xs p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-rose-600" />
              <span>Unmapped HOF Area Assignment Engine</span>
              {unmappedHofs.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                  {unmappedHofs.length} Pending
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500">
              Map newly enrolled or unassigned Head of Families to their respective sectors individually or via bulk selection.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={unmappedSearch}
                onChange={(e) => setUnmappedSearch(e.target.value)}
                placeholder="Search unmapped HOFs..."
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg w-48 text-slate-800 font-medium focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
              />
            </div>
          </div>
        </div>

        {/* Bulk Action Controls Bar */}
        {canEdit && unmappedHofs.length > 0 && (
          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleSelectAllUnmapped}
                className="inline-flex items-center gap-1.5 font-bold text-slate-800 hover:text-amber-800 cursor-pointer"
              >
                {selectedUnmappedHofIds.size === filteredUnmappedHofs.length &&
                filteredUnmappedHofs.length > 0 ? (
                  <CheckSquare className="w-4 h-4 text-amber-600" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400" />
                )}
                <span>Select All ({filteredUnmappedHofs.length})</span>
              </button>
              <span className="text-slate-400">|</span>
              <span className="text-slate-600">
                <strong>{selectedUnmappedHofIds.size}</strong> selected for bulk assignment
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-600 font-semibold shrink-0">Assign to:</span>
              <select
                value={targetBulkMohallahId}
                onChange={(e) => setTargetBulkMohallahId(e.target.value)}
                className="py-1 px-2.5 bg-white border border-slate-300 rounded-md text-xs font-semibold text-slate-800"
              >
                {mohallahs.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.code})
                  </option>
                ))}
              </select>

              <button
                type="button"
                disabled={selectedUnmappedHofIds.size === 0}
                onClick={handleExecuteBulkAssignment}
                className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-md shadow-xs transition-all cursor-pointer"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>Assign ({selectedUnmappedHofIds.size})</span>
              </button>
            </div>
          </div>
        )}

        {/* Unmapped HOFs Table */}
        {unmappedHofs.length === 0 ? (
          <div className="py-10 text-center text-slate-400 border border-dashed border-slate-200 rounded-lg">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500 opacity-80" />
            <p className="font-bold text-sm text-slate-800">All Head of Families Mapped!</p>
            <p className="text-xs text-slate-500 mt-0.5">
              There are currently zero unassigned HOFs in Burhani Park Jamaat.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                  {canEdit && <th className="py-2 px-2.5 w-10 text-center">Select</th>}
                  <th className="py-2 px-3">ITS No</th>
                  <th className="py-2 px-3">HOF Name</th>
                  <th className="py-2 px-3">Mobile No</th>
                  <th className="py-2 px-3">Residential Address</th>
                  <th className="py-2 px-3">Assign Mohallah (Inline)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUnmappedHofs.map((hof) => {
                  const isChecked = selectedUnmappedHofIds.has(hof.id);
                  return (
                    <tr
                      key={hof.id}
                      className={`hover:bg-amber-50/40 transition-colors ${
                        isChecked ? 'bg-amber-50/60' : ''
                      }`}
                    >
                      {/* Checkbox for bulk */}
                      {canEdit && (
                        <td className="py-2.5 px-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => toggleSelectUnmapped(hof.id)}
                            className="cursor-pointer text-slate-500 hover:text-amber-800"
                          >
                            {isChecked ? (
                              <CheckSquare className="w-4 h-4 text-amber-600" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-300" />
                            )}
                          </button>
                        </td>
                      )}

                      {/* ITS */}
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                        {hof.itsNumber}
                      </td>

                      {/* Name */}
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-slate-900">{hof.fullName}</span>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Thaali: {hof.thaaliNo || 'N/A'} • Sabeel: {hof.sabeelNo || 'N/A'}
                        </div>
                      </td>

                      {/* Mobile */}
                      <td className="py-2.5 px-3 font-mono text-slate-700">{hof.mobileNumber}</td>

                      {/* Address */}
                      <td className="py-2.5 px-3 text-slate-600 truncate max-w-xs">
                        {hof.fullAddress}
                      </td>

                      {/* Inline Assignment Dropdown */}
                      <td className="py-2.5 px-3">
                        {canEdit ? (
                          <div className="flex items-center gap-1.5">
                            <select
                              defaultValue=""
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleAssignSingleHof(hof.id, e.target.value);
                                }
                              }}
                              className="py-1 px-2 text-xs bg-white border border-amber-300 rounded-md text-slate-800 font-semibold focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 cursor-pointer"
                            >
                              <option value="" disabled>
                                Select Mohallah...
                              </option>
                              {mohallahs.map((m) => (
                                <option key={m.id} value={m.id}>
                                  {m.name} ({m.code})
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            Assignment restricted (View Only)
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= MODAL: ADD / EDIT MOHALLAH ================= */}
      {isMohallahModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-amber-300 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base">
                  {editingMohallahId ? 'Edit Mohallah Area' : 'Add New Mohallah / Sector'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMohallahModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMohallah} className="p-6 space-y-4">
              {mohallahFormError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{mohallahFormError}</span>
                </div>
              )}

              <div className="space-y-3">
                {/* Mohallah Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Mohallah / Area Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={mohallahFormData.name}
                    onChange={(e) =>
                      setMohallahFormData({ ...mohallahFormData, name: e.target.value })
                    }
                    placeholder="e.g. Saifee Mohallah (Sector A)"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>

                {/* Zone Code */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Zone / Code / ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={mohallahFormData.code}
                    onChange={(e) =>
                      setMohallahFormData({ ...mohallahFormData, code: e.target.value })
                    }
                    placeholder="e.g. SEC-A or Z-1"
                    className="w-full px-3 py-2 text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>

                {/* Incharge Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Sector Incharge Full Name
                  </label>
                  <input
                    type="text"
                    value={mohallahFormData.sectorInchargeName}
                    onChange={(e) =>
                      setMohallahFormData({
                        ...mohallahFormData,
                        sectorInchargeName: e.target.value,
                      })
                    }
                    placeholder="e.g. Mulla Huzefa Bhai Jamali"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Incharge ITS */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Incharge ITS No
                    </label>
                    <input
                      type="text"
                      maxLength={8}
                      value={mohallahFormData.sectorInchargeIts}
                      onChange={(e) =>
                        setMohallahFormData({
                          ...mohallahFormData,
                          sectorInchargeIts: e.target.value.replace(/\D/g, ''),
                        })
                      }
                      placeholder="e.g. 20391823"
                      className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500/30"
                    />
                  </div>

                  {/* Incharge Mobile */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Incharge Mobile
                    </label>
                    <input
                      type="tel"
                      value={mohallahFormData.inchargeMobile}
                      onChange={(e) =>
                        setMohallahFormData({
                          ...mohallahFormData,
                          inchargeMobile: e.target.value,
                        })
                      }
                      placeholder="e.g. 9820011223"
                      className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500/30"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Notes & Sector Boundaries
                  </label>
                  <textarea
                    rows={2}
                    value={mohallahFormData.notes}
                    onChange={(e) =>
                      setMohallahFormData({ ...mohallahFormData, notes: e.target.value })
                    }
                    placeholder="e.g. Gate 1, Buildings 1 to 5, Flats 101 to 404"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsMohallahModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-500 rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  {editingMohallahId ? 'Save Changes' : 'Create Sector'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: VIEW ASSIGNED HOFS ================= */}
      {viewingMohallahForHofs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-amber-300 max-w-2xl w-full max-h-[85vh] flex flex-col">
            <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Building className="w-5 h-5 text-amber-400" />
                  <span>Assigned Families: {viewingMohallahForHofs.name}</span>
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Sector Incharge: {viewingMohallahForHofs.sectorInchargeName || 'Unassigned'} • Code:{' '}
                  {viewingMohallahForHofs.code}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingMohallahForHofs(null)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-2">
              {(() => {
                const assigned = hofs.filter(
                  (h) => h.mohallahId === viewingMohallahForHofs.id
                );

                if (assigned.length === 0) {
                  return (
                    <div className="py-12 text-center text-slate-400 text-xs">
                      No Head of Families currently mapped to this Mohallah.
                    </div>
                  );
                }

                return assigned.map((h) => (
                  <div
                    key={h.id}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-3 text-xs hover:bg-amber-50/40"
                  >
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <span>{h.fullName}</span>
                        <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-800 font-bold">
                          ITS: {h.itsNumber}
                        </span>
                      </div>
                      <div className="text-slate-500 text-[11px] mt-0.5">{h.fullAddress}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Phone: {h.mobileNumber} • { (h.familyMembers || []).length } Family Members
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setViewingMohallahForHofs(null);
                          onNavigateToUpdater(h.itsNumber);
                        }}
                        className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded cursor-pointer"
                      >
                        Profile
                      </button>

                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => handleAssignSingleHof(h.id, '')}
                          className="px-2 py-1 text-[10px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded border border-rose-200 cursor-pointer"
                          title="Unmap from this Mohallah"
                        >
                          Unassign
                        </button>
                      )}
                    </div>
                  </div>
                ));
              })()}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setViewingMohallahForHofs(null)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
