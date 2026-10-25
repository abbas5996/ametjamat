import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Plus,
  Users,
  UserCheck,
  ChevronDown,
  ChevronUp,
  Edit2,
  Trash2,
  Phone,
  MessageSquare,
  Building,
  UserPlus,
  X,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  HeartHandshake,
  Download,
  Filter,
} from 'lucide-react';
import {
  HeadOfFamily,
  FamilyMember,
  Mohallah,
  FamilyRelation,
  Gender,
  MaritalStatus,
  BloodGroup,
  UserProfile,
} from '../../types';
import { logMemberAudit, saveStoredHofs } from '../../utils/memberMaster';

interface DirectoryHofSubpageProps {
  currentUser: UserProfile;
  hofs: HeadOfFamily[];
  setHofs: React.Dispatch<React.SetStateAction<HeadOfFamily[]>>;
  mohallahs: Mohallah[];
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
  showToast: (msg: string) => void;
  onNavigateToUpdater: (itsNumber: string) => void;
  openAddModalTrigger?: number;
}

const RELATION_OPTIONS: FamilyRelation[] = [
  'Wife',
  'Son',
  'Daughter',
  'Father',
  'Mother',
  'Daughter-in-law',
  'Grandchild',
  'Brother',
  'Sister',
  'Other',
];

const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const DirectoryHofSubpage: React.FC<DirectoryHofSubpageProps> = ({
  currentUser,
  hofs,
  setHofs,
  mohallahs,
  canAdd,
  canEdit,
  canDelete,
  showToast,
  onNavigateToUpdater,
  openAddModalTrigger,
}) => {
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMohallahFilter, setSelectedMohallahFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'ALL' | 'Active' | 'Inactive'>('ALL');
  const [expandedHofIds, setExpandedHofIds] = useState<Set<string>>(new Set());

  // HOF Add/Edit Modal state
  const [isHofModalOpen, setIsHofModalOpen] = useState(false);
  const [editingHofId, setEditingHofId] = useState<string | null>(null);
  const [hofFormData, setHofFormData] = useState({
    itsNumber: '',
    fullName: '',
    fatherName: '',
    surname: '',
    mobileNumber: '',
    whatsappNumber: '',
    fullAddress: '',
    occupation: '',
    mohallahId: '',
    status: 'Active' as 'Active' | 'Inactive',
    sabeelNo: '',
    thaaliNo: '',
    bloodGroup: 'B+' as BloodGroup,
    emergencyContact: '',
  });
  const [hofFormError, setHofFormError] = useState<string | null>(null);

  // FM Add/Edit Modal state
  const [isFmModalOpen, setIsFmModalOpen] = useState(false);
  const [targetHofForFm, setTargetHofForFm] = useState<HeadOfFamily | null>(null);
  const [editingFmId, setEditingFmId] = useState<string | null>(null);
  const [fmFormData, setFmFormData] = useState({
    itsNumber: '',
    fullName: '',
    relation: 'Wife' as FamilyRelation,
    gender: 'Female' as Gender,
    maritalStatus: 'Married' as MaritalStatus,
    bloodGroup: 'B+' as BloodGroup,
    age: 25,
    mobileNumber: '',
    status: 'Active' as 'Active' | 'Inactive',
  });
  const [fmFormError, setFmFormError] = useState<string | null>(null);

  // Toggle row expansion
  const toggleRowExpansion = (hofId: string) => {
    setExpandedHofIds((prev) => {
      const next = new Set(prev);
      if (next.has(hofId)) {
        next.delete(hofId);
      } else {
        next.add(hofId);
      }
      return next;
    });
  };

  // Filtered HOFs computation with memoization for high performance
  const filteredHofs = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return hofs.filter((hof) => {
      // Search match
      const matchesSearch =
        !q ||
        hof.itsNumber.toLowerCase().includes(q) ||
        hof.fullName.toLowerCase().includes(q) ||
        hof.fatherName.toLowerCase().includes(q) ||
        hof.surname.toLowerCase().includes(q) ||
        hof.mobileNumber.toLowerCase().includes(q) ||
        (hof.familyMembers &&
          hof.familyMembers.some(
            (fm) =>
              fm.itsNumber.toLowerCase().includes(q) ||
              fm.fullName.toLowerCase().includes(q)
          ));

      // Mohallah filter
      const matchesMohallah =
        selectedMohallahFilter === 'ALL' ||
        (selectedMohallahFilter === 'UNMAPPED'
          ? !hof.mohallahId || hof.mohallahId === ''
          : hof.mohallahId === selectedMohallahFilter);

      // Status filter
      const matchesStatus =
        selectedStatusFilter === 'ALL' || hof.status === selectedStatusFilter;

      return matchesSearch && matchesMohallah && matchesStatus;
    });
  }, [hofs, searchTerm, selectedMohallahFilter, selectedStatusFilter]);

  // KPI Statistics
  const stats = useMemo(() => {
    const totalHof = hofs.length;
    let totalFm = 0;
    let activeMumineen = 0;
    let unmappedCount = 0;

    hofs.forEach((h) => {
      totalFm += (h.familyMembers || []).length;
      if (h.status === 'Active') activeMumineen += 1;
      (h.familyMembers || []).forEach((fm) => {
        if (fm.status !== 'Inactive') activeMumineen += 1;
      });
      if (!h.mohallahId) unmappedCount += 1;
    });

    return {
      totalHof,
      totalFm,
      totalMumineen: totalHof + totalFm,
      activeMumineen,
      unmappedCount,
    };
  }, [hofs]);

  // Open HOF Modal for Create
  const handleOpenCreateHof = () => {
    setEditingHofId(null);
    setHofFormData({
      itsNumber: '',
      fullName: '',
      fatherName: '',
      surname: '',
      mobileNumber: '',
      whatsappNumber: '',
      fullAddress: '',
      occupation: '',
      mohallahId: mohallahs[0]?.id || '',
      status: 'Active',
      sabeelNo: '',
      thaaliNo: '',
      bloodGroup: 'B+',
      emergencyContact: '',
    });
    setHofFormError(null);
    setIsHofModalOpen(true);
  };

  // External trigger synchronization from top-right header button
  useEffect(() => {
    if (openAddModalTrigger && openAddModalTrigger > 0 && canAdd) {
      handleOpenCreateHof();
    }
  }, [openAddModalTrigger, canAdd]);

  useEffect(() => {
    const handleCustomTrigger = () => {
      if (canAdd) {
        handleOpenCreateHof();
      }
    };
    window.addEventListener('jamat_open_create_hof', handleCustomTrigger);
    return () => {
      window.removeEventListener('jamat_open_create_hof', handleCustomTrigger);
    };
  }, [canAdd, mohallahs]);

  // Open HOF Modal for Edit
  const handleOpenEditHof = (hof: HeadOfFamily) => {
    setEditingHofId(hof.id);
    setHofFormData({
      itsNumber: hof.itsNumber,
      fullName: hof.fullName,
      fatherName: hof.fatherName,
      surname: hof.surname,
      mobileNumber: hof.mobileNumber,
      whatsappNumber: hof.whatsappNumber || hof.mobileNumber,
      fullAddress: hof.fullAddress,
      occupation: hof.occupation,
      mohallahId: hof.mohallahId,
      status: hof.status,
      sabeelNo: hof.sabeelNo || '',
      thaaliNo: hof.thaaliNo || '',
      bloodGroup: hof.bloodGroup || 'B+',
      emergencyContact: hof.emergencyContact || '',
    });
    setHofFormError(null);
    setIsHofModalOpen(true);
  };

  // Save HOF
  const handleSaveHof = (e: React.FormEvent) => {
    e.preventDefault();
    setHofFormError(null);

    const cleanIts = hofFormData.itsNumber.trim();
    if (!cleanIts || cleanIts.length < 8) {
      setHofFormError('ITS Number must be an 8-digit unique number.');
      return;
    }
    if (!hofFormData.fullName.trim()) {
      setHofFormError('Full Name is required.');
      return;
    }
    if (!hofFormData.mobileNumber.trim()) {
      setHofFormError('Mobile Number is required.');
      return;
    }

    // Check duplicate ITS across other HOFs
    const duplicateHof = hofs.find(
      (h) => h.itsNumber === cleanIts && h.id !== editingHofId
    );
    if (duplicateHof) {
      setHofFormError(`ITS #${cleanIts} is already assigned to ${duplicateHof.fullName}.`);
      return;
    }

    const selectedMohallah = mohallahs.find((m) => m.id === hofFormData.mohallahId);
    const mohallahName = selectedMohallah ? selectedMohallah.name : 'Unassigned';

    let updatedHofs: HeadOfFamily[];

    if (editingHofId) {
      // Edit existing
      updatedHofs = hofs.map((h) => {
        if (h.id === editingHofId) {
          return {
            ...h,
            itsNumber: cleanIts,
            fullName: hofFormData.fullName.trim(),
            fatherName: hofFormData.fatherName.trim(),
            surname: hofFormData.surname.trim(),
            mobileNumber: hofFormData.mobileNumber.trim(),
            whatsappNumber: hofFormData.whatsappNumber.trim() || hofFormData.mobileNumber.trim(),
            fullAddress: hofFormData.fullAddress.trim(),
            occupation: hofFormData.occupation.trim(),
            mohallahId: hofFormData.mohallahId,
            mohallahName,
            status: hofFormData.status,
            sabeelNo: hofFormData.sabeelNo.trim(),
            thaaliNo: hofFormData.thaaliNo.trim(),
            bloodGroup: hofFormData.bloodGroup,
            emergencyContact: hofFormData.emergencyContact.trim(),
            updatedAt: new Date().toISOString().split('T')[0],
          };
        }
        return h;
      });

      logMemberAudit(
        currentUser.username,
        'Directory & Family HOF',
        'EDIT',
        cleanIts,
        `Updated Head of Family record for "${hofFormData.fullName.trim()}".`
      );
      showToast(`Updated HOF record for ${hofFormData.fullName}`);
    } else {
      // Add new HOF
      const newHof: HeadOfFamily = {
        id: `hof-${Date.now()}`,
        itsNumber: cleanIts,
        fullName: hofFormData.fullName.trim(),
        fatherName: hofFormData.fatherName.trim(),
        surname: hofFormData.surname.trim(),
        mobileNumber: hofFormData.mobileNumber.trim(),
        whatsappNumber: hofFormData.whatsappNumber.trim() || hofFormData.mobileNumber.trim(),
        fullAddress: hofFormData.fullAddress.trim(),
        occupation: hofFormData.occupation.trim(),
        mohallahId: hofFormData.mohallahId,
        mohallahName,
        status: hofFormData.status,
        sabeelNo: hofFormData.sabeelNo.trim() || `SB-${Math.floor(100 + Math.random() * 899)}`,
        thaaliNo: hofFormData.thaaliNo.trim() || `TH-${Math.floor(10 + Math.random() * 899)}`,
        bloodGroup: hofFormData.bloodGroup,
        emergencyContact: hofFormData.emergencyContact.trim(),
        familyMembers: [],
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
      };

      updatedHofs = [newHof, ...hofs];

      logMemberAudit(
        currentUser.username,
        'Directory & Family HOF',
        'ADD',
        cleanIts,
        `Enrolled new Head of Family "${newHof.fullName}" in Mohallah "${mohallahName}".`
      );
      showToast(`New HOF created: ${newHof.fullName} (ITS: ${cleanIts})`);
    }

    setHofs(updatedHofs);
    saveStoredHofs(updatedHofs);
    setIsHofModalOpen(false);
  };

  // Delete HOF
  const handleDeleteHof = (hof: HeadOfFamily) => {
    if (!canDelete) return;

    const memberCount = (hof.familyMembers || []).length;
    const confirmMsg = memberCount > 0
      ? `Delete HOF "${hof.fullName}" (ITS: ${hof.itsNumber}) and all ${memberCount} linked family members?`
      : `Delete HOF "${hof.fullName}" (ITS: ${hof.itsNumber})?`;

    if (window.confirm(confirmMsg)) {
      const updatedHofs = hofs.filter((h) => h.id !== hof.id);
      setHofs(updatedHofs);
      saveStoredHofs(updatedHofs);

      logMemberAudit(
        currentUser.username,
        'Directory & Family HOF',
        'DELETE',
        hof.itsNumber,
        `Deleted HOF "${hof.fullName}" and ${memberCount} linked family records.`
      );
      showToast(`Deleted HOF ${hof.fullName}`);
    }
  };

  // Open Add FM Modal
  const handleOpenAddFm = (hof: HeadOfFamily) => {
    setTargetHofForFm(hof);
    setEditingFmId(null);
    setFmFormData({
      itsNumber: '',
      fullName: '',
      relation: 'Wife',
      gender: 'Female',
      maritalStatus: 'Married',
      bloodGroup: 'B+',
      age: 28,
      mobileNumber: '',
      status: 'Active',
    });
    setFmFormError(null);
    setIsFmModalOpen(true);
  };

  // Open Edit FM Modal
  const handleOpenEditFm = (hof: HeadOfFamily, fm: FamilyMember) => {
    setTargetHofForFm(hof);
    setEditingFmId(fm.id);
    setFmFormData({
      itsNumber: fm.itsNumber,
      fullName: fm.fullName,
      relation: fm.relation,
      gender: fm.gender,
      maritalStatus: fm.maritalStatus,
      bloodGroup: fm.bloodGroup,
      age: fm.age,
      mobileNumber: fm.mobileNumber || '',
      status: fm.status || 'Active',
    });
    setFmFormError(null);
    setIsFmModalOpen(true);
  };

  // Save Family Member
  const handleSaveFm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetHofForFm) return;
    setFmFormError(null);

    const cleanIts = fmFormData.itsNumber.trim();
    if (!cleanIts || cleanIts.length < 8) {
      setFmFormError('ITS Number must be 8 digits.');
      return;
    }
    if (!fmFormData.fullName.trim()) {
      setFmFormError('Full Name is required.');
      return;
    }

    // Check duplicate ITS across all HOFs and FMs
    for (const h of hofs) {
      if (h.itsNumber === cleanIts) {
        setFmFormError(`ITS #${cleanIts} is already registered as HOF (${h.fullName}).`);
        return;
      }
      for (const fm of h.familyMembers || []) {
        if (fm.itsNumber === cleanIts && fm.id !== editingFmId) {
          setFmFormError(`ITS #${cleanIts} is already registered as family member (${fm.fullName}).`);
          return;
        }
      }
    }

    const updatedHofs = hofs.map((h) => {
      if (h.id === targetHofForFm.id) {
        const currentFms = h.familyMembers || [];
        let newFms: FamilyMember[];

        if (editingFmId) {
          // Update FM
          newFms = currentFms.map((fm) =>
            fm.id === editingFmId
              ? {
                  ...fm,
                  itsNumber: cleanIts,
                  fullName: fmFormData.fullName.trim(),
                  relation: fmFormData.relation,
                  gender: fmFormData.gender,
                  maritalStatus: fmFormData.maritalStatus,
                  bloodGroup: fmFormData.bloodGroup,
                  age: Number(fmFormData.age),
                  mobileNumber: fmFormData.mobileNumber.trim(),
                  status: fmFormData.status,
                }
              : fm
          );
        } else {
          // Add new FM
          const newFm: FamilyMember = {
            id: `fm-${Date.now()}`,
            itsNumber: cleanIts,
            fullName: fmFormData.fullName.trim(),
            relation: fmFormData.relation,
            gender: fmFormData.gender,
            maritalStatus: fmFormData.maritalStatus,
            bloodGroup: fmFormData.bloodGroup,
            age: Number(fmFormData.age),
            hofItsNumber: h.itsNumber,
            mobileNumber: fmFormData.mobileNumber.trim(),
            status: fmFormData.status,
          };
          newFms = [...currentFms, newFm];
        }

        return { ...h, familyMembers: newFms };
      }
      return h;
    });

    logMemberAudit(
      currentUser.username,
      'Directory & Family HOF',
      editingFmId ? 'EDIT' : 'ADD',
      cleanIts,
      editingFmId
        ? `Modified family member "${fmFormData.fullName}" linked to HOF ${targetHofForFm.fullName} (${targetHofForFm.itsNumber}).`
        : `Enrolled new family member "${fmFormData.fullName}" (${fmFormData.relation}) for HOF ${targetHofForFm.fullName} (${targetHofForFm.itsNumber}).`
    );

    setHofs(updatedHofs);
    saveStoredHofs(updatedHofs);
    setIsFmModalOpen(false);
    showToast(
      editingFmId
        ? `Updated family member ${fmFormData.fullName}`
        : `Added family member ${fmFormData.fullName}`
    );

    // Expand the HOF row so user sees the newly added FM
    setExpandedHofIds((prev) => new Set([...prev, targetHofForFm.id]));
  };

  // Delete Family Member
  const handleDeleteFm = (hof: HeadOfFamily, fm: FamilyMember) => {
    if (!canDelete) return;

    if (window.confirm(`Delete family member "${fm.fullName}" (${fm.relation}, ITS: ${fm.itsNumber})?`)) {
      const updatedHofs = hofs.map((h) => {
        if (h.id === hof.id) {
          return {
            ...h,
            familyMembers: (h.familyMembers || []).filter((item) => item.id !== fm.id),
          };
        }
        return h;
      });

      logMemberAudit(
        currentUser.username,
        'Directory & Family HOF',
        'DELETE',
        fm.itsNumber,
        `Removed family member "${fm.fullName}" (${fm.relation}) from HOF ${hof.fullName} (${hof.itsNumber}).`
      );

      setHofs(updatedHofs);
      saveStoredHofs(updatedHofs);
      showToast(`Removed family member ${fm.fullName}`);
    }
  };

  // Quick export of HOF roster
  const handleExportCsv = () => {
    const headers = [
      'ITS Number',
      'HOF Name',
      'Father Name',
      'Surname',
      'Mobile Number',
      'Mohallah',
      'Total FM',
      'Status',
      'Sabeel No',
      'Thaali No',
      'Full Address',
    ];

    const rows = filteredHofs.map((h) => [
      `"${h.itsNumber}"`,
      `"${h.fullName}"`,
      `"${h.fatherName}"`,
      `"${h.surname}"`,
      `"${h.mobileNumber}"`,
      `"${h.mohallahName || 'Unassigned'}"`,
      (h.familyMembers || []).length,
      `"${h.status}"`,
      `"${h.sabeelNo || ''}"`,
      `"${h.thaaliNo || ''}"`,
      `"${h.fullAddress.replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `burhani_park_hof_directory_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported HOF directory to CSV.');
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-amber-300/40 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-700 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total HOFs
            </p>
            <p className="text-lg sm:text-xl font-black text-slate-900">{stats.totalHof}</p>
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-blue-300/40 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-700 flex items-center justify-center shrink-0">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Family Members
            </p>
            <p className="text-lg sm:text-xl font-black text-slate-900">{stats.totalFm}</p>
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-emerald-300/40 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-700 flex items-center justify-center shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total Mumineen
            </p>
            <p className="text-lg sm:text-xl font-black text-emerald-800">
              {stats.totalMumineen}
            </p>
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-rose-300/40 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-rose-500/10 text-rose-700 flex items-center justify-center shrink-0">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Unassigned HOFs
            </p>
            <p className="text-lg sm:text-xl font-black text-rose-700">
              {stats.unmappedCount}
            </p>
          </div>
        </div>
      </div>

      {/* Control Bar: Filters, Search, Action Button */}
      <div className="bg-white p-4 rounded-xl border border-amber-300/40 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by ITS, Name, Mobile, or Family Member..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 text-slate-900 placeholder:text-slate-400 font-medium"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Mohallah Filter */}
          <div className="w-full sm:w-48">
            <select
              value={selectedMohallahFilter}
              onChange={(e) => setSelectedMohallahFilter(e.target.value)}
              className="w-full py-2 px-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
            >
              <option value="ALL">All Mohallahs</option>
              <option value="UNMAPPED">⚠️ Unassigned Area Only</option>
              {mohallahs.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="w-full sm:w-32">
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
              className="w-full py-2 px-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
            >
              <option value="ALL">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            title="Export CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          {/* STRICT RBAC ENFORCEMENT: If user lacks [Add], hide button entirely! */}
          {canAdd && (
            <button
              type="button"
              onClick={handleOpenCreateHof}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-500 active:bg-amber-600 rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add HOF</span>
            </button>
          )}
        </div>
      </div>

      {/* HOF Master Table */}
      <div className="bg-white border border-amber-300/40 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-amber-300 font-bold uppercase tracking-wider text-[11px] border-b border-slate-800">
                <th className="py-3 px-3 w-10 text-center">#</th>
                <th className="py-3 px-3">ITS No</th>
                <th className="py-3 px-3">HOF Full Name</th>
                <th className="py-3 px-3">Mobile No</th>
                <th className="py-3 px-3">Mohallah / Area</th>
                <th className="py-3 px-3 text-center">Family Members</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredHofs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-500" />
                    <p className="font-semibold text-sm text-slate-700">No HOF records found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Try clearing search queries or adjust the mohallah filter.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredHofs.map((hof, idx) => {
                  const isExpanded = expandedHofIds.has(hof.id);
                  const memberCount = (hof.familyMembers || []).length;
                  const isUnassigned = !hof.mohallahId;

                  return (
                    <React.Fragment key={hof.id}>
                      {/* Main HOF Row */}
                      <tr
                        className={`hover:bg-amber-50/50 transition-colors ${
                          isExpanded ? 'bg-amber-50/40 font-medium' : ''
                        }`}
                      >
                        {/* Expand toggle */}
                        <td className="py-3 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => toggleRowExpansion(hof.id)}
                            className="p-1 hover:bg-amber-100 rounded text-slate-600 transition-colors cursor-pointer"
                            title={isExpanded ? 'Collapse Family' : 'Expand Family Members'}
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-amber-700" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-500" />
                            )}
                          </button>
                        </td>

                        {/* ITS Number */}
                        <td className="py-3 px-3 font-mono font-bold text-slate-900">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                            {hof.itsNumber}
                          </span>
                        </td>

                        {/* Full Name & Occupation */}
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{hof.fullName}</span>
                            {hof.thaaliNo && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-mono font-semibold">
                                {hof.thaaliNo}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate max-w-xs">
                            {hof.occupation || 'Business / Trade'}
                          </div>
                        </td>

                        {/* Mobile Number */}
                        <td className="py-3 px-3 font-mono">
                          <div className="flex items-center gap-1 text-slate-800 font-medium">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{hof.mobileNumber}</span>
                          </div>
                        </td>

                        {/* Mohallah */}
                        <td className="py-3 px-3">
                          {isUnassigned ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                              <AlertCircle className="w-3 h-3" />
                              Unassigned
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                              {hof.mohallahName}
                            </span>
                          )}
                        </td>

                        {/* Total FM */}
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => toggleRowExpansion(hof.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
                            title="Click to view linked family members"
                          >
                            <Users className="w-3 h-3" />
                            <span>{memberCount} FM</span>
                          </button>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              hof.status === 'Active'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {hof.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3 text-right">
                          <div className="inline-flex items-center gap-1">
                            {/* Profile View Link */}
                            <button
                              type="button"
                              onClick={() => onNavigateToUpdater(hof.itsNumber)}
                              className="p-1.5 text-slate-500 hover:text-amber-800 hover:bg-amber-100 rounded-md transition-colors cursor-pointer"
                              title="View Full Profile in ITS Updater"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>

                            {/* Add FM (STRICT RBAC: only if canAdd is true) */}
                            {canAdd && (
                              <button
                                type="button"
                                onClick={() => handleOpenAddFm(hof)}
                                className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                                title="Add Family Member (FM)"
                              >
                                <UserPlus className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Edit HOF (STRICT RBAC: only if canEdit is true) */}
                            {canEdit && (
                              <button
                                type="button"
                                onClick={() => handleOpenEditHof(hof)}
                                className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-amber-100 rounded-md transition-colors cursor-pointer"
                                title="Edit HOF Details"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Delete HOF (STRICT RBAC: only if canDelete is true) */}
                            {canDelete && (
                              <button
                                type="button"
                                onClick={() => handleDeleteHof(hof)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                                title="Delete HOF and Family"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Family Members Sub-Table */}
                      {isExpanded && (
                        <tr className="bg-amber-50/20 border-y border-amber-200">
                          <td colSpan={8} className="p-4 pl-12 bg-slate-50/70">
                            <div className="bg-white rounded-lg border border-amber-200/80 p-3.5 shadow-2xs space-y-3">
                              {/* Subtable Header */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Users className="w-4 h-4 text-amber-700" />
                                  <span className="font-bold text-slate-900 text-xs">
                                    Family Members linked to {hof.fullName} (ITS: {hof.itsNumber})
                                  </span>
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">
                                    {memberCount} Registered
                                  </span>
                                </div>

                                {canAdd && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenAddFm(hof)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-slate-900 bg-amber-400 hover:bg-amber-500 rounded-md transition-all cursor-pointer"
                                  >
                                    <Plus className="w-3 h-3 stroke-[2.5]" />
                                    <span>Add Member</span>
                                  </button>
                                )}
                              </div>

                              {/* Members list */}
                              {memberCount === 0 ? (
                                <div className="py-4 text-center text-slate-400 text-xs">
                                  No family members linked to this HOF yet.
                                </div>
                              ) : (
                                <div className="overflow-x-auto">
                                  <table className="w-full text-left text-xs">
                                    <thead>
                                      <tr className="border-b border-slate-200 text-slate-500 font-bold text-[10px] uppercase">
                                        <th className="py-1.5 px-2">ITS No</th>
                                        <th className="py-1.5 px-2">Full Name</th>
                                        <th className="py-1.5 px-2">Relation</th>
                                        <th className="py-1.5 px-2">Gender</th>
                                        <th className="py-1.5 px-2">Marital Status</th>
                                        <th className="py-1.5 px-2">Blood Group</th>
                                        <th className="py-1.5 px-2">Age</th>
                                        <th className="py-1.5 px-2 text-right">Actions</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {hof.familyMembers.map((fm) => (
                                        <tr key={fm.id} className="hover:bg-slate-50">
                                          <td className="py-2 px-2 font-mono font-bold text-slate-900">
                                            {fm.itsNumber}
                                          </td>
                                          <td className="py-2 px-2 font-medium text-slate-800">
                                            {fm.fullName}
                                          </td>
                                          <td className="py-2 px-2">
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900">
                                              {fm.relation}
                                            </span>
                                          </td>
                                          <td className="py-2 px-2 text-slate-600">{fm.gender}</td>
                                          <td className="py-2 px-2 text-slate-600">{fm.maritalStatus}</td>
                                          <td className="py-2 px-2">
                                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                              {fm.bloodGroup}
                                            </span>
                                          </td>
                                          <td className="py-2 px-2 font-mono text-slate-700">{fm.age} yrs</td>
                                          <td className="py-2 px-2 text-right">
                                            <div className="inline-flex items-center gap-1">
                                              {canEdit && (
                                                <button
                                                  type="button"
                                                  onClick={() => handleOpenEditFm(hof, fm)}
                                                  className="p-1 text-slate-500 hover:text-amber-700 rounded cursor-pointer"
                                                  title="Edit Family Member"
                                                >
                                                  <Edit2 className="w-3 h-3" />
                                                </button>
                                              )}
                                              {canDelete && (
                                                <button
                                                  type="button"
                                                  onClick={() => handleDeleteFm(hof, fm)}
                                                  className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                                                  title="Delete Family Member"
                                                >
                                                  <Trash2 className="w-3 h-3" />
                                                </button>
                                              )}
                                            </div>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <span>
            Showing <strong className="text-slate-900">{filteredHofs.length}</strong> of{' '}
            <strong className="text-slate-900">{hofs.length}</strong> Head of Families
          </span>
          <span className="text-[11px] text-slate-400">
            Click row chevron or FM badge to expand linked family members.
          </span>
        </div>
      </div>

      {/* ================= MODAL: ADD / EDIT HOF ================= */}
      {isHofModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-amber-300 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base">
                  {editingHofId ? 'Edit Head of Family (HOF)' : 'Add New Head of Family (HOF)'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsHofModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveHof} className="p-6 space-y-4">
              {hofFormError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{hofFormError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* ITS Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    ITS Number (Unique ID) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={8}
                    value={hofFormData.itsNumber}
                    onChange={(e) =>
                      setHofFormData({
                        ...hofFormData,
                        itsNumber: e.target.value.replace(/\D/g, ''),
                      })
                    }
                    placeholder="e.g. 30489122"
                    className="w-full px-3 py-2 text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500/30"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">8-digit ITS identification number</p>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={hofFormData.fullName}
                    onChange={(e) => setHofFormData({ ...hofFormData, fullName: e.target.value })}
                    placeholder="e.g. Mulla Shabbir Bhai Fakhri"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>

                {/* Father Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Father's Name
                  </label>
                  <input
                    type="text"
                    value={hofFormData.fatherName}
                    onChange={(e) => setHofFormData({ ...hofFormData, fatherName: e.target.value })}
                    placeholder="e.g. Ibrahim Bhai"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>

                {/* Surname */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Surname / Family Name
                  </label>
                  <input
                    type="text"
                    value={hofFormData.surname}
                    onChange={(e) => setHofFormData({ ...hofFormData, surname: e.target.value })}
                    placeholder="e.g. Fakhri"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={hofFormData.mobileNumber}
                    onChange={(e) =>
                      setHofFormData({
                        ...hofFormData,
                        mobileNumber: e.target.value,
                        whatsappNumber:
                          hofFormData.whatsappNumber === hofFormData.mobileNumber
                            ? e.target.value
                            : hofFormData.whatsappNumber,
                      })
                    }
                    placeholder="e.g. 9820044556"
                    className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>

                {/* WhatsApp Number */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      WhatsApp Number
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setHofFormData({
                          ...hofFormData,
                          whatsappNumber: hofFormData.mobileNumber,
                        })
                      }
                      className="text-[10px] text-amber-700 hover:underline font-semibold cursor-pointer"
                    >
                      Same as Mobile
                    </button>
                  </div>
                  <input
                    type="tel"
                    value={hofFormData.whatsappNumber}
                    onChange={(e) =>
                      setHofFormData({ ...hofFormData, whatsappNumber: e.target.value })
                    }
                    placeholder="e.g. 9820044556"
                    className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>

                {/* Sector/Mohallah Dropdown */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Sector / Mohallah
                  </label>
                  <select
                    value={hofFormData.mohallahId}
                    onChange={(e) =>
                      setHofFormData({ ...hofFormData, mohallahId: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500/30"
                  >
                    <option value="">Unassigned / Not Mapped Yet</option>
                    {mohallahs.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Occupation */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Occupation
                  </label>
                  <input
                    type="text"
                    value={hofFormData.occupation}
                    onChange={(e) =>
                      setHofFormData({ ...hofFormData, occupation: e.target.value })
                    }
                    placeholder="e.g. Hardware Merchant, IT, Doctor"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Status
                  </label>
                  <select
                    value={hofFormData.status}
                    onChange={(e) =>
                      setHofFormData({
                        ...hofFormData,
                        status: e.target.value as 'Active' | 'Inactive',
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500/30"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                {/* Blood Group */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Blood Group
                  </label>
                  <select
                    value={hofFormData.bloodGroup}
                    onChange={(e) =>
                      setHofFormData({
                        ...hofFormData,
                        bloodGroup: e.target.value as BloodGroup,
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500/30"
                  >
                    {BLOOD_GROUPS.map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Full Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Residential Address
                </label>
                <textarea
                  rows={2}
                  value={hofFormData.fullAddress}
                  onChange={(e) =>
                    setHofFormData({ ...hofFormData, fullAddress: e.target.value })
                  }
                  placeholder="Flat No, Wing, Building Name, Street, Landmark"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500/30"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsHofModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-500 active:bg-amber-600 rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  {editingHofId ? 'Save Changes' : 'Create HOF Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD / EDIT FAMILY MEMBER (FM) ================= */}
      {isFmModalOpen && targetHofForFm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-amber-300 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between sticky top-0 z-10">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-amber-400" />
                  <span>
                    {editingFmId ? 'Edit Family Member' : 'Add Family Member (FM)'}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Linked to HOF: <span className="font-bold text-amber-300">{targetHofForFm.fullName}</span> (ITS: {targetHofForFm.itsNumber})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsFmModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveFm} className="p-6 space-y-4">
              {fmFormError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{fmFormError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* ITS Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    ITS Number *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={8}
                    value={fmFormData.itsNumber}
                    onChange={(e) =>
                      setFmFormData({
                        ...fmFormData,
                        itsNumber: e.target.value.replace(/\D/g, ''),
                      })
                    }
                    placeholder="e.g. 30489124"
                    className="w-full px-3 py-2 text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fmFormData.fullName}
                    onChange={(e) => setFmFormData({ ...fmFormData, fullName: e.target.value })}
                    placeholder="e.g. Fatema Bai Fakhri"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>

                {/* Relation to HOF */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Relation to HOF *
                  </label>
                  <select
                    value={fmFormData.relation}
                    onChange={(e) =>
                      setFmFormData({
                        ...fmFormData,
                        relation: e.target.value as FamilyRelation,
                        gender:
                          e.target.value === 'Wife' ||
                          e.target.value === 'Daughter' ||
                          e.target.value === 'Mother' ||
                          e.target.value === 'Daughter-in-law' ||
                          e.target.value === 'Sister'
                            ? 'Female'
                            : e.target.value === 'Son' || e.target.value === 'Father' || e.target.value === 'Brother'
                            ? 'Male'
                            : fmFormData.gender,
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500/30"
                  >
                    {RELATION_OPTIONS.map((rel) => (
                      <option key={rel} value={rel}>
                        {rel}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Gender *
                  </label>
                  <select
                    value={fmFormData.gender}
                    onChange={(e) =>
                      setFmFormData({ ...fmFormData, gender: e.target.value as Gender })
                    }
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500/30"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                  </select>
                </div>

                {/* Marital Status */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Marital Status
                  </label>
                  <select
                    value={fmFormData.maritalStatus}
                    onChange={(e) =>
                      setFmFormData({
                        ...fmFormData,
                        maritalStatus: e.target.value as MaritalStatus,
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500/30"
                  >
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Widowed">Widowed</option>
                    <option value="Divorced">Divorced</option>
                  </select>
                </div>

                {/* Blood Group */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Blood Group
                  </label>
                  <select
                    value={fmFormData.bloodGroup}
                    onChange={(e) =>
                      setFmFormData({ ...fmFormData, bloodGroup: e.target.value as BloodGroup })
                    }
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500/30"
                  >
                    {BLOOD_GROUPS.map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Age */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Age (Years)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={120}
                    value={fmFormData.age}
                    onChange={(e) =>
                      setFmFormData({ ...fmFormData, age: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>

                {/* Personal Mobile */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Personal Mobile (Optional)
                  </label>
                  <input
                    type="tel"
                    value={fmFormData.mobileNumber}
                    onChange={(e) =>
                      setFmFormData({ ...fmFormData, mobileNumber: e.target.value })
                    }
                    placeholder="e.g. 9820044558"
                    className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFmModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-500 active:bg-amber-600 rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  {editingFmId ? 'Save Member Changes' : 'Link Family Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
