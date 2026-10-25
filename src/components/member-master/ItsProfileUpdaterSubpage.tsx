import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  User,
  Users,
  ShieldCheck,
  Phone,
  MessageSquare,
  MapPin,
  Heart,
  Droplet,
  Activity,
  Edit3,
  Check,
  X,
  AlertCircle,
  CheckCircle2,
  Lock,
  GitFork,
  ArrowRight,
  Briefcase,
  Hash,
  Home,
  UserCheck,
  Building,
} from 'lucide-react';
import {
  HeadOfFamily,
  FamilyMember,
  BloodGroup,
  Mohallah,
  UserProfile,
} from '../../types';
import {
  saveStoredHofs,
  logMemberAudit,
  searchMemberByItsOrPhone,
} from '../../utils/memberMaster';

interface ItsProfileUpdaterSubpageProps {
  currentUser: UserProfile;
  hofs: HeadOfFamily[];
  setHofs: React.Dispatch<React.SetStateAction<HeadOfFamily[]>>;
  mohallahs: Mohallah[];
  canEdit: boolean;
  showToast: (msg: string) => void;
  targetItsProp?: string;
}

const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const ItsProfileUpdaterSubpage: React.FC<ItsProfileUpdaterSubpageProps> = ({
  currentUser,
  hofs,
  setHofs,
  mohallahs,
  canEdit,
  showToast,
  targetItsProp,
}) => {
  // Search state
  const [searchQuery, setSearchQuery] = useState(targetItsProp || (hofs[0]?.itsNumber ?? '30489122'));
  const [activeHof, setActiveHof] = useState<HeadOfFamily | null>(() => {
    if (targetItsProp) {
      const match = hofs.find(
        (h) =>
          h.itsNumber === targetItsProp ||
          (h.familyMembers || []).some((fm) => fm.itsNumber === targetItsProp)
      );
      if (match) return match;
    }
    return hofs[0] || null;
  });

  // Highlighted member ITS (if searching an FM)
  const [highlightedIts, setHighlightedIts] = useState<string>(targetItsProp || (hofs[0]?.itsNumber ?? '30489122'));

  // Inline editing state for active HOF
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [editedAddress, setEditedAddress] = useState('');

  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [editedPhone, setEditedPhone] = useState('');
  const [editedWhatsapp, setEditedWhatsapp] = useState('');

  const [isEditingEmergency, setIsEditingEmergency] = useState(false);
  const [editedEmergency, setEditedEmergency] = useState('');

  // Synchronize when targetItsProp changes from outside
  useEffect(() => {
    if (targetItsProp) {
      setSearchQuery(targetItsProp);
      const res = searchMemberByItsOrPhone(targetItsProp, hofs);
      if (res) {
        setActiveHof(res.parentHof);
        setHighlightedIts(res.targetMember.itsNumber);
      }
    }
  }, [targetItsProp, hofs]);

  // Synchronize inline edit fields when activeHof changes
  useEffect(() => {
    if (activeHof) {
      setEditedAddress(activeHof.fullAddress);
      setEditedPhone(activeHof.mobileNumber);
      setEditedWhatsapp(activeHof.whatsappNumber || activeHof.mobileNumber);
      setEditedEmergency(activeHof.emergencyContact || '');
      setIsEditingAddress(false);
      setIsEditingPhone(false);
      setIsEditingEmergency(false);
    }
  }, [activeHof]);

  // Search auto-complete suggestions
  const searchSuggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q || q.length < 2) return [];

    const matches: {
      itsNumber: string;
      fullName: string;
      relation: string;
      parentHof: HeadOfFamily;
    }[] = [];

    for (const h of hofs) {
      if (
        h.itsNumber.toLowerCase().includes(q) ||
        h.fullName.toLowerCase().includes(q) ||
        h.mobileNumber.includes(q)
      ) {
        matches.push({
          itsNumber: h.itsNumber,
          fullName: h.fullName,
          relation: 'Head of Family',
          parentHof: h,
        });
      }

      for (const fm of h.familyMembers || []) {
        if (
          fm.itsNumber.toLowerCase().includes(q) ||
          fm.fullName.toLowerCase().includes(q) ||
          (fm.mobileNumber && fm.mobileNumber.includes(q))
        ) {
          matches.push({
            itsNumber: fm.itsNumber,
            fullName: fm.fullName,
            relation: `${fm.relation} of ${h.fullName}`,
            parentHof: h,
          });
        }
      }

      if (matches.length >= 6) break;
    }

    return matches;
  }, [hofs, searchQuery]);

  // Select profile from search or suggestion
  const handleSelectProfile = (parentHof: HeadOfFamily, itsNumber: string) => {
    setActiveHof(parentHof);
    setHighlightedIts(itsNumber);
    setSearchQuery(itsNumber);
  };

  // Execute Search
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const res = searchMemberByItsOrPhone(searchQuery, hofs);
    if (res) {
      setActiveHof(res.parentHof);
      setHighlightedIts(res.targetMember.itsNumber);
      showToast(`Loaded ITS Profile: ${res.targetMember.fullName}`);
    } else {
      showToast(`No profile found matching "${searchQuery}"`);
    }
  };

  // Save Address Inline
  const handleSaveAddress = () => {
    if (!activeHof || !canEdit) return;

    const clean = editedAddress.trim();
    if (!clean) {
      showToast('Address cannot be empty.');
      return;
    }

    const updatedHofs = hofs.map((h) =>
      h.id === activeHof.id ? { ...h, fullAddress: clean } : h
    );

    setHofs(updatedHofs);
    saveStoredHofs(updatedHofs);
    setActiveHof((prev) => (prev ? { ...prev, fullAddress: clean } : null));
    setIsEditingAddress(false);

    logMemberAudit(
      currentUser.username,
      'ITS Profile Updater',
      'EDIT',
      activeHof.itsNumber,
      `Updated residential address inline for HOF ${activeHof.fullName}.`
    );
    showToast('Address updated successfully.');
  };

  // Save Phone / WhatsApp Inline
  const handleSavePhone = () => {
    if (!activeHof || !canEdit) return;

    const cleanPhone = editedPhone.trim();
    const cleanWa = editedWhatsapp.trim() || cleanPhone;
    if (!cleanPhone) {
      showToast('Mobile number cannot be empty.');
      return;
    }

    const updatedHofs = hofs.map((h) =>
      h.id === activeHof.id
        ? { ...h, mobileNumber: cleanPhone, whatsappNumber: cleanWa }
        : h
    );

    setHofs(updatedHofs);
    saveStoredHofs(updatedHofs);
    setActiveHof((prev) =>
      prev
        ? { ...prev, mobileNumber: cleanPhone, whatsappNumber: cleanWa }
        : null
    );
    setIsEditingPhone(false);

    logMemberAudit(
      currentUser.username,
      'ITS Profile Updater',
      'EDIT',
      activeHof.itsNumber,
      `Updated phone & WhatsApp numbers inline for ${activeHof.fullName}.`
    );
    showToast('Contact numbers updated.');
  };

  // Save Emergency Contact Inline
  const handleSaveEmergency = () => {
    if (!activeHof || !canEdit) return;

    const clean = editedEmergency.trim();
    const updatedHofs = hofs.map((h) =>
      h.id === activeHof.id ? { ...h, emergencyContact: clean } : h
    );

    setHofs(updatedHofs);
    saveStoredHofs(updatedHofs);
    setActiveHof((prev) => (prev ? { ...prev, emergencyContact: clean } : null));
    setIsEditingEmergency(false);

    logMemberAudit(
      currentUser.username,
      'ITS Profile Updater',
      'EDIT',
      activeHof.itsNumber,
      `Updated emergency contact inline for ${activeHof.fullName}.`
    );
    showToast('Emergency contact updated.');
  };

  // Instant Inline Blood Group Update
  const handleUpdateBloodGroup = (newBg: BloodGroup) => {
    if (!activeHof || !canEdit) return;

    const updatedHofs = hofs.map((h) =>
      h.id === activeHof.id ? { ...h, bloodGroup: newBg } : h
    );

    setHofs(updatedHofs);
    saveStoredHofs(updatedHofs);
    setActiveHof((prev) => (prev ? { ...prev, bloodGroup: newBg } : null));

    logMemberAudit(
      currentUser.username,
      'ITS Profile Updater',
      'EDIT',
      activeHof.itsNumber,
      `Updated blood group to ${newBg} for ${activeHof.fullName}.`
    );
    showToast(`Blood group updated to ${newBg}`);
  };

  // Instant Inline Status Toggle (Active / Inactive)
  const handleToggleStatus = () => {
    if (!activeHof || !canEdit) return;

    const nextStatus: 'Active' | 'Inactive' =
      activeHof.status === 'Active' ? 'Inactive' : 'Active';

    const updatedHofs = hofs.map((h) =>
      h.id === activeHof.id ? { ...h, status: nextStatus } : h
    );

    setHofs(updatedHofs);
    saveStoredHofs(updatedHofs);
    setActiveHof((prev) => (prev ? { ...prev, status: nextStatus } : null));

    logMemberAudit(
      currentUser.username,
      'ITS Profile Updater',
      'EDIT',
      activeHof.itsNumber,
      `Toggled status to ${nextStatus} for ${activeHof.fullName}.`
    );
    showToast(`Status switched to ${nextStatus}`);
  };

  // Categorize Family Members for Tree View
  const familyTree = useMemo(() => {
    if (!activeHof) return { spouses: [], children: [], parents: [], extended: [] };

    const spouses: FamilyMember[] = [];
    const children: FamilyMember[] = [];
    const parents: FamilyMember[] = [];
    const extended: FamilyMember[] = [];

    (activeHof.familyMembers || []).forEach((fm) => {
      if (fm.relation === 'Wife') {
        spouses.push(fm);
      } else if (fm.relation === 'Son' || fm.relation === 'Daughter') {
        children.push(fm);
      } else if (fm.relation === 'Father' || fm.relation === 'Mother') {
        parents.push(fm);
      } else {
        extended.push(fm);
      }
    });

    return { spouses, children, parents, extended };
  }, [activeHof]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Search Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-sky-950 text-white rounded-2xl p-5 sm:p-6 shadow-xl border border-sky-400/20 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-0.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Instant Verification & Tree Explorer</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              ITS Profile & Family Tree Updater
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Instant lookup by 8-digit ITS or Mobile. Edit emergency contact, address, status, and blood group inline.
            </p>
          </div>

          {/* Quick RBAC indicator */}
          <div className="shrink-0">
            {canEdit ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Inline Edit Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                <Lock className="w-3.5 h-3.5" />
                View Only Access
              </span>
            )}
          </div>
        </div>

        {/* Fast Search Form */}
        <form onSubmit={handleSearchSubmit} className="relative max-w-xl">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by 8-digit ITS number (e.g. 30489122) or Mobile..."
              className="w-full pl-10 pr-28 py-3 bg-slate-800/90 border border-slate-600 rounded-xl text-white placeholder:text-slate-400 text-xs sm:text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              Instant Lookup
            </button>
          </div>

          {/* Live search auto-complete dropdown */}
          {searchSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white text-slate-900 rounded-xl shadow-2xl border border-amber-300 overflow-hidden z-30 divide-y divide-slate-100 animate-in fade-in duration-100">
              {searchSuggestions.map((s) => (
                <button
                  type="button"
                  key={s.itsNumber}
                  onClick={() => handleSelectProfile(s.parentHof, s.itsNumber)}
                  className="w-full p-2.5 text-left text-xs hover:bg-amber-50/80 flex items-center justify-between transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                      {s.itsNumber}
                    </span>
                    <span className="font-bold text-slate-900">{s.fullName}</span>
                  </div>
                  <span className="text-[11px] text-amber-800 font-medium">
                    {s.relation}
                  </span>
                </button>
              ))}
            </div>
          )}
        </form>

        {/* Quick Recent Chips */}
        <div className="flex items-center gap-2 flex-wrap text-xs text-slate-300 pt-1">
          <span className="text-slate-400 font-semibold text-[11px]">Quick Samples:</span>
          {hofs.slice(0, 4).map((h) => (
            <button
              type="button"
              key={h.id}
              onClick={() => handleSelectProfile(h, h.itsNumber)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                activeHof?.id === h.id
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              {h.fullName.split(' ')[0]} ({h.itsNumber})
            </button>
          ))}
        </div>
      </div>

      {/* Main Profile & Family Tree View */}
      {!activeHof ? (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-400" />
          <p className="font-bold text-sm text-slate-700">No profile selected</p>
          <p className="text-xs text-slate-500 mt-1">
            Search by ITS Number or select one of the quick chips above.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* PROFILE CARD WITH INLINE UPDATE ACTIONS */}
          <div className="bg-white rounded-2xl border border-amber-300/60 shadow-md overflow-hidden">
            {/* Card Header Profile Banner */}
            <div className="p-6 bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-transparent border-b border-amber-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {/* Initials Avatar */}
                <div className="w-16 h-16 rounded-2xl bg-amber-400 text-slate-950 font-black text-xl flex items-center justify-center shadow-md border-2 border-white shrink-0">
                  {activeHof.fullName
                    .split(' ')
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((w) => w[0])
                    .join('')
                    .toUpperCase()}
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg sm:text-xl font-black text-slate-900">
                      {activeHof.fullName}
                    </h3>
                    <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-900 text-amber-300">
                      ITS: {activeHof.itsNumber}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                      HOF
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-3 flex-wrap">
                    <span className="flex items-center gap-1 font-semibold text-slate-700">
                      <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                      {activeHof.occupation || 'Business'}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-semibold text-slate-700">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      {activeHof.mohallahName || 'Unassigned Sector'}
                    </span>
                  </p>
                </div>
              </div>

              {/* Status Toggle & Badges */}
              <div className="flex flex-col sm:items-end gap-2 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-semibold">Status:</span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-black ${
                      activeHof.status === 'Active'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-rose-100 text-rose-800 border border-rose-300'
                    }`}
                  >
                    {activeHof.status}
                  </span>

                  {/* Inline Toggle Button (RBAC) */}
                  {canEdit && (
                    <button
                      type="button"
                      onClick={handleToggleStatus}
                      className="px-2.5 py-1 text-[11px] font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg shadow-2xs transition-all cursor-pointer"
                      title="Toggle Active/Inactive"
                    >
                      Switch to {activeHof.status === 'Active' ? 'Inactive' : 'Active'}
                    </button>
                  )}
                </div>

                <div className="text-[11px] font-mono text-slate-500 flex items-center gap-2">
                  <span>Thaali: <strong>{activeHof.thaaliNo || 'N/A'}</strong></span>
                  <span>•</span>
                  <span>Sabeel: <strong>{activeHof.sabeelNo || 'N/A'}</strong></span>
                </div>
              </div>
            </div>

            {/* Quick Inline Edit Information Panels */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* PANEL 1: CONTACT NUMBERS */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    Phone & WhatsApp
                  </span>

                  {canEdit && !isEditingPhone && (
                    <button
                      type="button"
                      onClick={() => setIsEditingPhone(true)}
                      className="text-[11px] font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  )}
                </div>

                {isEditingPhone ? (
                  <div className="space-y-2 text-xs">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500">Mobile:</label>
                      <input
                        type="tel"
                        value={editedPhone}
                        onChange={(e) => setEditedPhone(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono text-xs focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500">WhatsApp:</label>
                      <input
                        type="tel"
                        value={editedWhatsapp}
                        onChange={(e) => setEditedWhatsapp(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono text-xs focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsEditingPhone(false)}
                        className="px-2.5 py-1 text-slate-600 hover:bg-slate-200 rounded cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSavePhone}
                        className="px-3 py-1 bg-amber-400 hover:bg-amber-500 font-bold text-slate-950 rounded cursor-pointer"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 text-xs font-medium">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Mobile:</span>
                      <span className="font-mono font-bold text-slate-900">
                        {activeHof.mobileNumber}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">WhatsApp:</span>
                      <span className="font-mono font-bold text-slate-900">
                        {activeHof.whatsappNumber || activeHof.mobileNumber}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* PANEL 2: EMERGENCY CONTACT & BLOOD GROUP */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Droplet className="w-3.5 h-3.5 text-rose-500" />
                    Medical & Emergency
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  {/* Blood Group with Inline Dropdown */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-semibold">Blood Group:</span>
                    {canEdit ? (
                      <select
                        value={activeHof.bloodGroup || 'B+'}
                        onChange={(e) => handleUpdateBloodGroup(e.target.value as BloodGroup)}
                        className="py-1 px-2 font-mono font-bold text-xs bg-white border border-rose-300 text-rose-700 rounded-lg cursor-pointer"
                      >
                        {BLOOD_GROUPS.map((bg) => (
                          <option key={bg} value={bg}>
                            {bg}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="px-2 py-0.5 rounded font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        {activeHof.bloodGroup || 'Not Specified'}
                      </span>
                    )}
                  </div>

                  {/* Emergency Contact */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-slate-500 font-semibold">Emergency Phone:</span>
                      {canEdit && !isEditingEmergency && (
                        <button
                          type="button"
                          onClick={() => setIsEditingEmergency(true)}
                          className="text-[11px] font-bold text-amber-700 hover:text-amber-800 cursor-pointer"
                        >
                          Edit
                        </button>
                      )}
                    </div>

                    {isEditingEmergency ? (
                      <div className="space-y-1.5">
                        <input
                          type="tel"
                          value={editedEmergency}
                          onChange={(e) => setEditedEmergency(e.target.value)}
                          placeholder="Emergency contact number"
                          className="w-full px-2 py-1 text-xs font-mono bg-white border border-slate-300 rounded"
                        />
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setIsEditingEmergency(false)}
                            className="px-2 py-0.5 text-[11px] text-slate-600 cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveEmergency}
                            className="px-2.5 py-0.5 bg-amber-400 font-bold text-[11px] rounded cursor-pointer"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <span className="font-mono font-bold text-slate-800 text-xs">
                        {activeHof.emergencyContact || '—'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* PANEL 3: RESIDENTIAL ADDRESS */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Home className="w-3.5 h-3.5 text-slate-500" />
                    Residential Address
                  </span>

                  {canEdit && !isEditingAddress && (
                    <button
                      type="button"
                      onClick={() => setIsEditingAddress(true)}
                      className="text-[11px] font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  )}
                </div>

                {isEditingAddress ? (
                  <div className="space-y-2 text-xs">
                    <textarea
                      rows={2}
                      value={editedAddress}
                      onChange={(e) => setEditedAddress(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-amber-500"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsEditingAddress(false)}
                        className="px-2.5 py-1 text-slate-600 hover:bg-slate-200 rounded cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveAddress}
                        className="px-3 py-1 bg-amber-400 hover:bg-amber-500 font-bold text-slate-950 rounded cursor-pointer"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-700 font-medium leading-relaxed">
                    {activeHof.fullAddress}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* COMPLETE FAMILY TREE TREE-VIEW */}
          <div className="bg-white rounded-2xl border border-amber-300/60 shadow-md p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <GitFork className="w-5 h-5 text-amber-700 rotate-90" />
                  <span>Family Tree View Hierarchy</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Visual relationship tree from Head of Family to all registered dependents.
                </p>
              </div>

              <div className="text-xs text-slate-500">
                Total Family Members: <strong>{(activeHof.familyMembers || []).length + 1}</strong>
              </div>
            </div>

            {/* Tree Chart Visual Container */}
            <div className="space-y-8 py-2">
              {/* LEVEL 1: HOF (Root Node) */}
              <div className="flex flex-col items-center">
                <div
                  className={`p-4 rounded-2xl border-2 bg-white shadow-lg max-w-sm w-full text-center relative transition-all ${
                    highlightedIts === activeHof.itsNumber
                      ? 'border-amber-500 ring-4 ring-amber-300/40'
                      : 'border-slate-800'
                  }`}
                >
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-900 text-amber-300 border border-amber-400">
                    Head of Family (HOF)
                  </span>

                  <div className="font-bold text-slate-900 text-sm mt-1">{activeHof.fullName}</div>
                  <div className="text-xs font-mono font-bold text-amber-800">
                    ITS: {activeHof.itsNumber}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-center gap-2 flex-wrap">
                    <span>Blood: {activeHof.bloodGroup || 'B+'}</span>
                    <span>•</span>
                    <span>{activeHof.mobileNumber}</span>
                  </div>
                </div>

                {/* Vertical Stem Connector */}
                {(activeHof.familyMembers || []).length > 0 && (
                  <div className="w-0.5 h-8 bg-amber-400 mt-2" />
                )}
              </div>

              {/* LEVEL 2: SPOUSES & CHILDREN & PARENTS */}
              {(activeHof.familyMembers || []).length > 0 && (
                <div className="space-y-6">
                  {/* Category: Spouses */}
                  {familyTree.spouses.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[11px] font-black uppercase text-amber-800 tracking-wider flex items-center gap-1.5">
                        <Heart className="w-3.5 h-3.5 text-rose-500" />
                        <span>Spouse / Wife ({familyTree.spouses.length})</span>
                      </span>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {familyTree.spouses.map((fm) => (
                          <div
                            key={fm.id}
                            className={`p-3.5 rounded-xl border bg-white shadow-xs space-y-1.5 ${
                              highlightedIts === fm.itsNumber
                                ? 'border-amber-500 ring-2 ring-amber-400'
                                : 'border-slate-200 hover:border-amber-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-900">{fm.fullName}</span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                                {fm.relation}
                              </span>
                            </div>
                            <div className="text-xs font-mono text-slate-500">ITS: {fm.itsNumber}</div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-3">
                              <span>Age: {fm.age} yrs</span>
                              <span>Blood: {fm.bloodGroup}</span>
                              <span>{fm.gender}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Category: Children */}
                  {familyTree.children.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[11px] font-black uppercase text-amber-800 tracking-wider flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-blue-500" />
                        <span>Children ({familyTree.children.length})</span>
                      </span>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {familyTree.children.map((fm) => (
                          <div
                            key={fm.id}
                            className={`p-3.5 rounded-xl border bg-white shadow-xs space-y-1.5 ${
                              highlightedIts === fm.itsNumber
                                ? 'border-amber-500 ring-2 ring-amber-400'
                                : 'border-slate-200 hover:border-amber-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-900">{fm.fullName}</span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                                {fm.relation}
                              </span>
                            </div>
                            <div className="text-xs font-mono text-slate-500">ITS: {fm.itsNumber}</div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-3">
                              <span>Age: {fm.age} yrs</span>
                              <span>Blood: {fm.bloodGroup}</span>
                              <span>{fm.maritalStatus}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Category: Parents */}
                  {familyTree.parents.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[11px] font-black uppercase text-amber-800 tracking-wider flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-purple-500" />
                        <span>Parents ({familyTree.parents.length})</span>
                      </span>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {familyTree.parents.map((fm) => (
                          <div
                            key={fm.id}
                            className={`p-3.5 rounded-xl border bg-white shadow-xs space-y-1.5 ${
                              highlightedIts === fm.itsNumber
                                ? 'border-amber-500 ring-2 ring-amber-400'
                                : 'border-slate-200 hover:border-amber-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-900">{fm.fullName}</span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                                {fm.relation}
                              </span>
                            </div>
                            <div className="text-xs font-mono text-slate-500">ITS: {fm.itsNumber}</div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-3">
                              <span>Age: {fm.age} yrs</span>
                              <span>Blood: {fm.bloodGroup}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Category: Extended family */}
                  {familyTree.extended.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[11px] font-black uppercase text-amber-800 tracking-wider flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Extended Relatives & Grandchildren ({familyTree.extended.length})</span>
                      </span>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {familyTree.extended.map((fm) => (
                          <div
                            key={fm.id}
                            className={`p-3.5 rounded-xl border bg-white shadow-xs space-y-1.5 ${
                              highlightedIts === fm.itsNumber
                                ? 'border-amber-500 ring-2 ring-amber-400'
                                : 'border-slate-200 hover:border-amber-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-900">{fm.fullName}</span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                {fm.relation}
                              </span>
                            </div>
                            <div className="text-xs font-mono text-slate-500">ITS: {fm.itsNumber}</div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-3">
                              <span>Age: {fm.age} yrs</span>
                              <span>Blood: {fm.bloodGroup}</span>
                              <span>{fm.gender}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
