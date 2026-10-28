import React, { useState, useEffect, useMemo } from 'react';
import {
  Users, UserPlus, Globe2, Trash2, FileSpreadsheet, UserX,
  CreditCard, Printer, FileCheck, AlertTriangle, Layers, MessageSquare,
  RefreshCw, Search, Plus, Filter, Download, ArrowUpRight, CheckCircle2,
  X, Save, Edit, Phone, Mail, MapPin, ShieldAlert, Ban, Sparkles,
  QrCode, Eye, Check, ExternalLink, Upload, AlertCircle, FileText,
  UserCheck, Hash, Calendar, HeartHandshake, ShieldCheck
} from 'lucide-react';
import {
  HeadOfFamily, FamilyMember, Mohallah, UserProfile, FinancialYear,
  BloodGroup, Gender, MaritalStatus, FamilyRelation
} from '../../types';
import {
  getStoredHofs, saveStoredHofs, getStoredMohallahs
} from '../../utils/memberMaster';
import {
  NonLocalMumin, DeletedMuminRecord, SmartCardRecord, SafaiChitthiRecord,
  JamaatCategory, OutstandingComment, InactiveMuminRecord,
  getStoredNonLocalMumineen, saveStoredNonLocalMumineen,
  getStoredDeletedMumineen, saveStoredDeletedMumineen,
  getStoredSmartCards, saveStoredSmartCards,
  getStoredSafaiChitthies, saveStoredSafaiChitthies,
  getStoredJamaatCategories, saveStoredJamaatCategories,
  getStoredOutstandingComments, saveStoredOutstandingComments,
  getStoredInactiveMumineen, saveStoredInactiveMumineen,
  calculateMuminOutstandingDues, softDeleteMumin,
  restoreDeletedMumin, permanentlyDeleteMumin,
  SmartCardType, SmartCardStatus, CommentCategory, CommentPriority
} from '../../utils/mumineenManagement';
import { appendActivityLog, checkUserPermission } from '../../utils/rbac';

export type MumineenSubTab =
  | 'mumineen-list'
  | 'mumineen-registration'
  | 'non-local-mumineen'
  | 'deleted-mumineen'
  | 'mumineen-outstanding'
  | 'inactive-mumineen'
  | 'add-smart-card'
  | 'print-smart-card'
  | 'safai-chitthi-entry'
  | 'outstanding-safai-chitthi'
  | 'jamaat-category-list'
  | 'outstanding-comments'
  | 'sync-its52';

interface MumineenModuleProps {
  currentUser: UserProfile;
  activeSubItemId: string;
  subItemLabel: string;
  financialYear: FinancialYear;
  showToast: (msg: string) => void;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

const fmtINR = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export const MumineenModule: React.FC<MumineenModuleProps> = ({
  currentUser,
  activeSubItemId,
  showToast,
  canAdd,
  canEdit,
  canDelete,
}) => {
  // Master persistent state
  const [hofs, setHofs] = useState<HeadOfFamily[]>(() => getStoredHofs());
  const [mohallahs] = useState<Mohallah[]>(() => getStoredMohallahs());
  const [nonLocals, setNonLocals] = useState<NonLocalMumin[]>(() => getStoredNonLocalMumineen());
  const [deletedRecords, setDeletedRecords] = useState<DeletedMuminRecord[]>(() => getStoredDeletedMumineen());
  const [smartCards, setSmartCards] = useState<SmartCardRecord[]>(() => getStoredSmartCards());
  const [safaiChitthies, setSafaiChitthies] = useState<SafaiChitthiRecord[]>(() => getStoredSafaiChitthies());
  const [categories, setCategories] = useState<JamaatCategory[]>(() => getStoredJamaatCategories());
  const [comments, setComments] = useState<OutstandingComment[]>(() => getStoredOutstandingComments());
  const [inactiveRecords, setInactiveRecords] = useState<InactiveMuminRecord[]>(() => getStoredInactiveMumineen());

  // Active Tab state
  const [activeTab, setActiveTab] = useState<MumineenSubTab>(() => {
    return (activeSubItemId as MumineenSubTab) || 'mumineen-list';
  });

  // Selected member for cross-page deep linking (e.g. from list to print card or safai chitthi)
  const [selectedItsForCard, setSelectedItsForCard] = useState<string>('30489122');
  const [selectedItsForChitthi, setSelectedItsForChitthi] = useState<string>('');

  // Sync tab with sidebar navigation
  useEffect(() => {
    if (activeSubItemId) {
      setActiveTab(activeSubItemId as MumineenSubTab);
    }
  }, [activeSubItemId]);

  const reloadHofs = () => setHofs(getStoredHofs());

  // 13 Tabs Config
  const tabs: { key: MumineenSubTab; label: string; icon: React.ReactNode; count?: number; badge?: string }[] = [
    { key: 'mumineen-list',               label: '1. Mumineen List',            icon: <Users className="w-3.5 h-3.5" />,            count: hofs.length },
    { key: 'mumineen-registration',       label: '2. Registration Wizard',     icon: <UserPlus className="w-3.5 h-3.5" />,         badge: 'New' },
    { key: 'non-local-mumineen',          label: '3. Non-Local Mumineen',       icon: <Globe2 className="w-3.5 h-3.5" />,           count: nonLocals.filter(n => n.status === 'Active').length },
    { key: 'deleted-mumineen',            label: '4. Delete List (Trash)',      icon: <Trash2 className="w-3.5 h-3.5" />,           count: deletedRecords.length },
    { key: 'mumineen-outstanding',        label: '5. Outstanding Ledger',       icon: <FileSpreadsheet className="w-3.5 h-3.5" />,  badge: 'Dues' },
    { key: 'inactive-mumineen',           label: '6. Inactive Mumineen',        icon: <UserX className="w-3.5 h-3.5" />,            count: inactiveRecords.length },
    { key: 'add-smart-card',              label: '7. Add Smart Card',           icon: <CreditCard className="w-3.5 h-3.5" />,       count: smartCards.length },
    { key: 'print-smart-card',            label: '8. Print Smart Card',         icon: <Printer className="w-3.5 h-3.5" />,          badge: 'ID Studio' },
    { key: 'safai-chitthi-entry',         label: '9. Safai Chitthi Entry',      icon: <FileCheck className="w-3.5 h-3.5" /> },
    { key: 'outstanding-safai-chitthi',   label: '10. Blocked Chitthi List',    icon: <AlertTriangle className="w-3.5 h-3.5" />,    count: safaiChitthies.filter(s => s.status === 'Blocked').length },
    { key: 'jamaat-category-list',        label: '11. Jamaat Categories',       icon: <Layers className="w-3.5 h-3.5" />,           count: categories.length },
    { key: 'outstanding-comments',        label: '12. Outstanding Comments',    icon: <MessageSquare className="w-3.5 h-3.5" />,    count: comments.filter(c => !c.isResolved).length },
    { key: 'sync-its52',                  label: '13. Sync ITS52 Data',         icon: <RefreshCw className="w-3.5 h-3.5" />,        badge: 'API/CSV' },
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation Ribbon */}
      <div className="bg-white border border-amber-300/40 rounded-xl p-1.5 shadow-xs flex items-center gap-1 overflow-x-auto select-none">
        {tabs.map(({ key, label, icon, count, badge }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === key
                ? 'bg-[#EAB308] text-slate-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-amber-50'
            }`}
          >
            {icon}
            <span>{label}</span>
            {count !== undefined && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-white/70 text-slate-900 font-mono">
                {count}
              </span>
            )}
            {badge && (
              <span className="ml-1 px-1.5 py-0.2 rounded-md text-[9px] bg-slate-900 text-amber-300 uppercase tracking-wider font-extrabold">
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Render Active Subpage View */}
      {activeTab === 'mumineen-list' && (
        <MumineenListSubpage
          hofs={hofs}
          mohallahs={mohallahs}
          currentUser={currentUser}
          showToast={showToast}
          canEdit={canEdit}
          canDelete={canDelete}
          onReloadHofs={reloadHofs}
          onGoToCard={(its) => { setSelectedItsForCard(its); setActiveTab('print-smart-card'); }}
          onGoToChitthi={(its) => { setSelectedItsForChitthi(its); setActiveTab('safai-chitthi-entry'); }}
        />
      )}

      {activeTab === 'mumineen-registration' && (
        <MumineenRegistrationSubpage
          mohallahs={mohallahs}
          categories={categories}
          currentUser={currentUser}
          showToast={showToast}
          onSuccess={() => { reloadHofs(); setActiveTab('mumineen-list'); }}
        />
      )}

      {activeTab === 'non-local-mumineen' && (
        <NonLocalMumineenSubpage
          nonLocals={nonLocals}
          setNonLocals={setNonLocals}
          hofs={hofs}
          currentUser={currentUser}
          showToast={showToast}
          canAdd={canAdd}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      )}

      {activeTab === 'deleted-mumineen' && (
        <DeletedMumineenSubpage
          deletedRecords={deletedRecords}
          setDeletedRecords={setDeletedRecords}
          currentUser={currentUser}
          showToast={showToast}
          onReloadHofs={reloadHofs}
        />
      )}

      {activeTab === 'mumineen-outstanding' && (
        <OutstandingLedgerSubpage
          hofs={hofs}
          mohallahs={mohallahs}
          showToast={showToast}
        />
      )}

      {activeTab === 'inactive-mumineen' && (
        <InactiveMumineenSubpage
          inactiveRecords={inactiveRecords}
          setInactiveRecords={setInactiveRecords}
          currentUser={currentUser}
          showToast={showToast}
          onReloadHofs={reloadHofs}
        />
      )}

      {activeTab === 'add-smart-card' && (
        <AddSmartCardSubpage
          smartCards={smartCards}
          setSmartCards={setSmartCards}
          hofs={hofs}
          currentUser={currentUser}
          showToast={showToast}
          canAdd={canAdd}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      )}

      {activeTab === 'print-smart-card' && (
        <PrintSmartCardSubpage
          hofs={hofs}
          smartCards={smartCards}
          initialIts={selectedItsForCard}
          showToast={showToast}
        />
      )}

      {activeTab === 'safai-chitthi-entry' && (
        <SafaiChitthiEntrySubpage
          safaiChitthies={safaiChitthies}
          setSafaiChitthies={setSafaiChitthies}
          hofs={hofs}
          initialIts={selectedItsForChitthi}
          currentUser={currentUser}
          showToast={showToast}
          canAdd={canAdd}
          onViewOutstanding={() => setActiveTab('outstanding-safai-chitthi')}
        />
      )}

      {activeTab === 'outstanding-safai-chitthi' && (
        <OutstandingSafaiChitthiSubpage
          safaiChitthies={safaiChitthies}
          setSafaiChitthies={setSafaiChitthies}
          currentUser={currentUser}
          showToast={showToast}
        />
      )}

      {activeTab === 'jamaat-category-list' && (
        <JamaatCategoryListSubpage
          categories={categories}
          setCategories={setCategories}
          hofs={hofs}
          currentUser={currentUser}
          showToast={showToast}
          canAdd={canAdd}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      )}

      {activeTab === 'outstanding-comments' && (
        <OutstandingCommentsSubpage
          comments={comments}
          setComments={setComments}
          hofs={hofs}
          currentUser={currentUser}
          showToast={showToast}
        />
      )}

      {activeTab === 'sync-its52' && (
        <SyncIts52Subpage
          hofs={hofs}
          onReloadHofs={reloadHofs}
          currentUser={currentUser}
          showToast={showToast}
        />
      )}
    </div>
  );
};

// ============================================================================
// 1. MUMINEEN LIST SUBPAGE
// ============================================================================

const MumineenListSubpage: React.FC<{
  hofs: HeadOfFamily[];
  mohallahs: Mohallah[];
  currentUser: UserProfile;
  showToast: (m: string) => void;
  canEdit: boolean;
  canDelete: boolean;
  onReloadHofs: () => void;
  onGoToCard: (its: string) => void;
  onGoToChitthi: (its: string) => void;
}> = ({ hofs, mohallahs, currentUser, showToast, canEdit, canDelete, onReloadHofs, onGoToCard, onGoToChitthi }) => {
  const [search, setSearch] = useState('');
  const [selectedMohalla, setSelectedMohalla] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [viewHof, setViewHof] = useState<HeadOfFamily | null>(null);
  const [softDeleteTarget, setSoftDeleteTarget] = useState<HeadOfFamily | null>(null);
  const [deleteReason, setDeleteReason] = useState('');

  // Total Mumineen calculations
  const totalHOFs = hofs.length;
  const totalFamilyMembers = hofs.reduce((acc, h) => acc + (h.familyMembers?.length || 0), 0);
  const grandTotalMumineen = totalHOFs + totalFamilyMembers;
  const activeHOFs = hofs.filter(h => h.status === 'Active').length;

  const filtered = useMemo(() => {
    return hofs.filter(h => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        h.fullName.toLowerCase().includes(q) ||
        h.itsNumber.includes(q) ||
        h.mobileNumber.includes(q) ||
        (h.mohallahName || '').toLowerCase().includes(q);
      const matchMohalla = selectedMohalla === 'All' || h.mohallahId === selectedMohalla;
      const matchStatus = selectedStatus === 'All' || h.status === selectedStatus;
      return matchSearch && matchMohalla && matchStatus;
    });
  }, [hofs, search, selectedMohalla, selectedStatus]);

  const handleConfirmSoftDelete = () => {
    if (!softDeleteTarget) return;
    const res = softDeleteMumin(softDeleteTarget.itsNumber, deleteReason, currentUser.username);
    if (res.success) {
      showToast(res.message);
      onReloadHofs();
      setSoftDeleteTarget(null);
      setDeleteReason('');
    } else {
      showToast(res.message);
    }
  };

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-amber-200/80 rounded-xl p-4 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Population</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-slate-900">{grandTotalMumineen}</span>
            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">HOF + FM</span>
          </div>
        </div>
        <div className="bg-white border border-emerald-200/80 rounded-xl p-4 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Active Heads (HOF)</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-emerald-700">{activeHOFs}</span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Verified</span>
          </div>
        </div>
        <div className="bg-white border border-blue-200/80 rounded-xl p-4 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Family Members</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-blue-700">{totalFamilyMembers}</span>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Dependents</span>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Mohallah Sectors</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-slate-800">{mohallahs.length}</span>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">Zones</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-amber-300/40 rounded-xl p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by 8-digit ITS, Member Name, Mobile, Mohallah..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-300/60"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedMohalla}
            onChange={(e) => setSelectedMohalla(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-amber-300/60 cursor-pointer"
          >
            <option value="All">All Mohallahs</option>
            {mohallahs.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-amber-300/60 cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-amber-300/40 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">ITS & Mumin Name</th>
                <th className="px-4 py-3">Mohallah & Address</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3 text-center">Family Count</th>
                <th className="px-4 py-3 text-center">Sabeel / Thaali</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    No Mumineen records found matching your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((hof) => (
                  <tr key={hof.id} className="hover:bg-amber-50/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-amber-100 border border-amber-300 text-amber-900 font-bold flex items-center justify-center shrink-0 text-xs">
                          {hof.fullName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{hof.fullName}</span>
                          </p>
                          <p className="font-mono text-[11px] text-amber-700 font-bold">ITS: {hof.itsNumber}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800">{hof.mohallahName || 'Unassigned'}</p>
                      <p className="text-[11px] text-slate-500 truncate max-w-xs">{hof.fullAddress}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-mono text-slate-800">{hof.mobileNumber}</p>
                      <p className="text-[10px] text-slate-400">{hof.occupation || 'Business'}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {1 + (hof.familyMembers?.length || 0)} members
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-[11px]">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold mr-1">
                        {hof.sabeelNo || 'N/A'}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-semibold">
                        {hof.thaaliNo || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        hof.status === 'Active'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-slate-100 text-slate-600 border border-slate-300'
                      }`}>
                        {hof.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setViewHof(hof)}
                          title="View Family Profile"
                          className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 hover:text-slate-900 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onGoToCard(hof.itsNumber)}
                          title="Smart Card Studio"
                          className="p-1.5 rounded-md hover:bg-amber-100 text-amber-700 cursor-pointer"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onGoToChitthi(hof.itsNumber)}
                          title="Issue Safai Chitthi"
                          className="p-1.5 rounded-md hover:bg-blue-100 text-blue-700 cursor-pointer"
                        >
                          <FileCheck className="w-3.5 h-3.5" />
                        </button>
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => { setSoftDeleteTarget(hof); setDeleteReason(''); }}
                            title="Soft-Delete to Recycle Bin"
                            className="p-1.5 rounded-md hover:bg-rose-100 text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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

      {/* Member Details Modal */}
      {viewHof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-amber-400 text-slate-950 font-black flex items-center justify-center text-lg">
                  {viewHof.fullName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{viewHof.fullName}</h3>
                  <p className="font-mono text-xs text-amber-700 font-bold">ITS: {viewHof.itsNumber}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewHof(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-[10px] text-slate-400 font-bold">MOHALLAH</p>
                <p className="font-bold text-slate-800 mt-0.5">{viewHof.mohallahName}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-[10px] text-slate-400 font-bold">MOBILE</p>
                <p className="font-mono font-bold text-slate-800 mt-0.5">{viewHof.mobileNumber}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-[10px] text-slate-400 font-bold">BLOOD GROUP</p>
                <p className="font-bold text-rose-600 mt-0.5">{viewHof.bloodGroup || 'Not Recorded'}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg sm:col-span-3">
                <p className="text-[10px] text-slate-400 font-bold">FULL ADDRESS</p>
                <p className="text-slate-800 mt-0.5">{viewHof.fullAddress}</p>
              </div>
            </div>

            {/* Family Members Table */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                <span>Family Members ({viewHof.familyMembers?.length || 0})</span>
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold text-[10px] uppercase">
                    <tr>
                      <th className="px-3 py-2">ITS</th>
                      <th className="px-3 py-2">Full Name</th>
                      <th className="px-3 py-2">Relation</th>
                      <th className="px-3 py-2">Gender</th>
                      <th className="px-3 py-2">Age</th>
                      <th className="px-3 py-2">Blood Group</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(!viewHof.familyMembers || viewHof.familyMembers.length === 0) ? (
                      <tr>
                        <td colSpan={6} className="text-center py-4 text-slate-400">
                          No dependent family members registered under this HOF.
                        </td>
                      </tr>
                    ) : (
                      viewHof.familyMembers.map((fm) => (
                        <tr key={fm.id} className="hover:bg-slate-50">
                          <td className="px-3 py-2 font-mono font-bold text-amber-700">{fm.itsNumber}</td>
                          <td className="px-3 py-2 font-bold text-slate-900">{fm.fullName}</td>
                          <td className="px-3 py-2">{fm.relation}</td>
                          <td className="px-3 py-2">{fm.gender}</td>
                          <td className="px-3 py-2">{fm.age} yrs</td>
                          <td className="px-3 py-2 text-rose-600 font-bold">{fm.bloodGroup}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setViewHof(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Soft Delete Confirmation Modal */}
      {softDeleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-slate-900">Move to Delete List (Recycle Bin)?</h3>
            </div>
            <p className="text-xs text-slate-600">
              You are archiving <span className="font-bold text-slate-900">{softDeleteTarget.fullName}</span> (ITS: {softDeleteTarget.itsNumber}). This will remove the member from active directory but preserve their records in the Recycle Bin for future restoration.
            </p>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Deletion / Archival *</label>
              <input
                type="text"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="e.g. Relocated to another Jamaat, duplicate entry, deceased..."
                className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-rose-300 focus:outline-none"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSoftDeleteTarget(null)}
                className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSoftDelete}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm cursor-pointer"
              >
                Archive Member
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 2. MUMINEEN REGISTRATION SUBPAGE (Multi-Step Form)
// ============================================================================

const MumineenRegistrationSubpage: React.FC<{
  mohallahs: Mohallah[];
  categories: JamaatCategory[];
  currentUser: UserProfile;
  showToast: (m: string) => void;
  onSuccess: () => void;
}> = ({ mohallahs, categories, currentUser, showToast, onSuccess }) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form states
  const [hofForm, setHofForm] = useState({
    itsNumber: '',
    fullName: '',
    fatherName: '',
    surname: '',
    mobileNumber: '',
    whatsappNumber: '',
    email: '',
    occupation: '',
    mohallahId: mohallahs[0]?.id || '',
    fullAddress: '',
    sabeelNo: '',
    thaaliNo: '',
    bloodGroup: 'B+' as BloodGroup,
    emergencyContact: '',
    notes: '',
  });

  const [familyList, setFamilyList] = useState<FamilyMember[]>([]);
  const [memberDraft, setMemberDraft] = useState({
    itsNumber: '',
    fullName: '',
    relation: 'Wife' as FamilyRelation,
    gender: 'Female' as Gender,
    maritalStatus: 'Married' as MaritalStatus,
    bloodGroup: 'B+' as BloodGroup,
    age: 30,
    mobileNumber: '',
  });

  const handleAddMember = () => {
    if (!memberDraft.itsNumber.trim() || memberDraft.itsNumber.length !== 8) {
      showToast('Member ITS must be exactly 8 digits.');
      return;
    }
    if (!memberDraft.fullName.trim()) {
      showToast('Member full name is required.');
      return;
    }
    const newMember: FamilyMember = {
      id: `fm-${Date.now()}`,
      ...memberDraft,
      hofItsNumber: hofForm.itsNumber,
      status: 'Active',
    };
    setFamilyList([...familyList, newMember]);
    setMemberDraft({
      itsNumber: '',
      fullName: '',
      relation: 'Son',
      gender: 'Male',
      maritalStatus: 'Single',
      bloodGroup: 'O+',
      age: 18,
      mobileNumber: '',
    });
    showToast('Family member added to draft list.');
  };

  const handleFinalSubmit = () => {
    if (!hofForm.itsNumber.trim() || hofForm.itsNumber.length !== 8) {
      showToast('Valid 8-digit HOF ITS number is mandatory.');
      setStep(1);
      return;
    }
    if (!hofForm.fullName.trim()) {
      showToast('HOF Full Name is required.');
      setStep(1);
      return;
    }

    const currentHofs = getStoredHofs();
    if (currentHofs.some(h => h.itsNumber === hofForm.itsNumber.trim())) {
      showToast(`A member with ITS ${hofForm.itsNumber} already exists in the system.`);
      setStep(1);
      return;
    }

    const mohName = mohallahs.find(m => m.id === hofForm.mohallahId)?.name || 'Unassigned';

    const newHof: HeadOfFamily = {
      id: `hof-${Date.now()}`,
      itsNumber: hofForm.itsNumber.trim(),
      fullName: hofForm.fullName.trim(),
      fatherName: hofForm.fatherName.trim(),
      surname: hofForm.surname.trim(),
      mobileNumber: hofForm.mobileNumber.trim(),
      whatsappNumber: hofForm.whatsappNumber.trim() || hofForm.mobileNumber.trim(),
      fullAddress: hofForm.fullAddress.trim(),
      occupation: hofForm.occupation.trim(),
      mohallahId: hofForm.mohallahId,
      mohallahName: mohName,
      status: 'Active',
      familyMembers: familyList,
      sabeelNo: hofForm.sabeelNo.trim() || `SB-${Math.floor(100 + Math.random() * 900)}`,
      thaaliNo: hofForm.thaaliNo.trim() || `TH-${Math.floor(100 + Math.random() * 900)}`,
      emergencyContact: hofForm.emergencyContact.trim(),
      bloodGroup: hofForm.bloodGroup,
      notes: hofForm.notes.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveStoredHofs([newHof, ...currentHofs]);
    appendActivityLog(
      currentUser.username,
      'Mumineen Master',
      'Registration Wizard',
      'ADD',
      `Registered new HOF @${newHof.fullName} (ITS: ${newHof.itsNumber}) with ${familyList.length} family members.`
    );

    showToast(`HOF ${newHof.fullName} registered successfully!`);
    onSuccess();
  };

  return (
    <div className="bg-white border border-amber-300/40 rounded-xl p-6 shadow-xs max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-amber-600" />
            <span>Mumineen Multi-Step Registration Wizard</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete formal enrollment for new Head of Family (HOF) and family members
          </p>
        </div>
        <span className="text-xs font-bold px-3 py-1 bg-amber-100 text-amber-900 rounded-full">
          Step {step} of 4
        </span>
      </div>

      {/* Step Indicators */}
      <div className="grid grid-cols-4 gap-2 text-center text-xs font-bold">
        {[
          { num: 1, title: 'HOF Identity' },
          { num: 2, title: 'Address & Mohallah' },
          { num: 3, title: 'Family Members' },
          { num: 4, title: 'Final Review' },
        ].map((s) => (
          <div
            key={s.num}
            onClick={() => setStep(s.num as any)}
            className={`py-2 px-1 rounded-lg border cursor-pointer transition-all ${
              step === s.num
                ? 'bg-amber-400 border-amber-500 text-slate-950 shadow-xs'
                : step > s.num
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}
          >
            <span>{s.num}. {s.title}</span>
          </div>
        ))}
      </div>

      {/* STEP 1: HOF Identity */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">ITS Number (8 digits) *</label>
              <input
                type="text"
                maxLength={8}
                value={hofForm.itsNumber}
                onChange={(e) => setHofForm({ ...hofForm, itsNumber: e.target.value.replace(/\D/g, '') })}
                placeholder="e.g. 30491024"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono font-bold focus:ring-2 focus:ring-amber-300 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">HOF Full Name *</label>
              <input
                type="text"
                value={hofForm.fullName}
                onChange={(e) => setHofForm({ ...hofForm, fullName: e.target.value })}
                placeholder="e.g. Mulla Burhanuddin Bhai Jamali"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 font-bold focus:ring-2 focus:ring-amber-300 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Father's Name</label>
              <input
                type="text"
                value={hofForm.fatherName}
                onChange={(e) => setHofForm({ ...hofForm, fatherName: e.target.value })}
                placeholder="e.g. Taherali Bhai"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-300 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Surname / Family Title</label>
              <input
                type="text"
                value={hofForm.surname}
                onChange={(e) => setHofForm({ ...hofForm, surname: e.target.value })}
                placeholder="e.g. Jamali / Fakhri"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-300 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Primary Mobile Number *</label>
              <input
                type="text"
                maxLength={10}
                value={hofForm.mobileNumber}
                onChange={(e) => setHofForm({ ...hofForm, mobileNumber: e.target.value.replace(/\D/g, '') })}
                placeholder="10 digit mobile number"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono focus:ring-2 focus:ring-amber-300 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">WhatsApp Number</label>
              <input
                type="text"
                maxLength={10}
                value={hofForm.whatsappNumber}
                onChange={(e) => setHofForm({ ...hofForm, whatsappNumber: e.target.value.replace(/\D/g, '') })}
                placeholder="Leave blank if same as mobile"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono focus:ring-2 focus:ring-amber-300 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Blood Group</label>
              <select
                value={hofForm.bloodGroup}
                onChange={(e) => setHofForm({ ...hofForm, bloodGroup: e.target.value as BloodGroup })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-300 focus:outline-none cursor-pointer"
              >
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Occupation / Business</label>
              <input
                type="text"
                value={hofForm.occupation}
                onChange={(e) => setHofForm({ ...hofForm, occupation: e.target.value })}
                placeholder="e.g. Hardware Trader, IT Engineer, Chartered Accountant"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-300 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={() => {
                if (!hofForm.itsNumber || hofForm.itsNumber.length !== 8) {
                  showToast('Enter valid 8-digit ITS number.');
                  return;
                }
                if (!hofForm.fullName) {
                  showToast('Full name is required.');
                  return;
                }
                setStep(2);
              }}
              className="px-5 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-lg text-xs shadow-xs cursor-pointer"
            >
              Continue to Address &rarr;
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Address & Mohallah */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Assigned Mohallah Zone *</label>
              <select
                value={hofForm.mohallahId}
                onChange={(e) => setHofForm({ ...hofForm, mohallahId: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 font-bold focus:ring-2 focus:ring-amber-300 focus:outline-none cursor-pointer"
              >
                {mohallahs.map(m => (
                  <option key={m.id} value={m.id}>{m.name} ({m.code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Emergency Contact Number</label>
              <input
                type="text"
                value={hofForm.emergencyContact}
                onChange={(e) => setHofForm({ ...hofForm, emergencyContact: e.target.value })}
                placeholder="Relative or neighbor contact"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-300 focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Full Residential Address *</label>
              <textarea
                rows={2}
                value={hofForm.fullAddress}
                onChange={(e) => setHofForm({ ...hofForm, fullAddress: e.target.value })}
                placeholder="e.g. Flat 302, Saifee Mahal, Sector A, Burhani Park Complex, Surat"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-300 focus:outline-none resize-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Initial Sabeel Number</label>
              <input
                type="text"
                value={hofForm.sabeelNo}
                onChange={(e) => setHofForm({ ...hofForm, sabeelNo: e.target.value })}
                placeholder="Auto-generated if blank (e.g. SB-104)"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono focus:ring-2 focus:ring-amber-300 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Initial Thaali Number</label>
              <input
                type="text"
                value={hofForm.thaaliNo}
                onChange={(e) => setHofForm({ ...hofForm, thaaliNo: e.target.value })}
                placeholder="Auto-generated if blank (e.g. TH-204)"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono focus:ring-2 focus:ring-amber-300 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-lg text-xs cursor-pointer"
            >
              &larr; Back
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="px-5 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-lg text-xs shadow-xs cursor-pointer"
            >
              Continue to Family Members &rarr;
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Family Members Builder */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-amber-600" />
              <span>Add Family Member (Wife, Children, Parents)</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">ITS (8 digits)</label>
                <input
                  type="text"
                  maxLength={8}
                  value={memberDraft.itsNumber}
                  onChange={(e) => setMemberDraft({ ...memberDraft, itsNumber: e.target.value.replace(/\D/g, '') })}
                  placeholder="e.g. 30491025"
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 font-mono"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-600 mb-1">Full Name</label>
                <input
                  type="text"
                  value={memberDraft.fullName}
                  onChange={(e) => setMemberDraft({ ...memberDraft, fullName: e.target.value })}
                  placeholder="e.g. Sakina Bai Jamali"
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Relation</label>
                <select
                  value={memberDraft.relation}
                  onChange={(e) => setMemberDraft({ ...memberDraft, relation: e.target.value as FamilyRelation })}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                >
                  {['Wife', 'Son', 'Daughter', 'Father', 'Mother', 'Daughter-in-law', 'Grandchild', 'Brother', 'Sister', 'Other'].map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Gender</label>
                <select
                  value={memberDraft.gender}
                  onChange={(e) => setMemberDraft({ ...memberDraft, gender: e.target.value as Gender })}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Age (Years)</label>
                <input
                  type="number"
                  value={memberDraft.age}
                  onChange={(e) => setMemberDraft({ ...memberDraft, age: Number(e.target.value) })}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Blood Group</label>
                <select
                  value={memberDraft.bloodGroup}
                  onChange={(e) => setMemberDraft({ ...memberDraft, bloodGroup: e.target.value as BloodGroup })}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                >
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleAddMember}
                  className="w-full py-1.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded text-xs cursor-pointer shadow-xs"
                >
                  + Add Member
                </button>
              </div>
            </div>
          </div>

          {/* Table of Added Members */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                <tr>
                  <th className="px-3 py-2">ITS</th>
                  <th className="px-3 py-2">Full Name</th>
                  <th className="px-3 py-2">Relation</th>
                  <th className="px-3 py-2">Gender / Age</th>
                  <th className="px-3 py-2 text-right">Remove</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {familyList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-slate-400 text-xs">
                      No family members added yet. Add family members above or skip to next step if single.
                    </td>
                  </tr>
                ) : (
                  familyList.map((m, idx) => (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2 font-mono font-bold text-amber-700">{m.itsNumber}</td>
                      <td className="px-3 py-2 font-bold text-slate-900">{m.fullName}</td>
                      <td className="px-3 py-2">{m.relation}</td>
                      <td className="px-3 py-2">{m.gender}, {m.age}y</td>
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => setFamilyList(familyList.filter((_, i) => i !== idx))}
                          className="text-rose-600 hover:text-rose-800 font-bold text-xs"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-lg text-xs cursor-pointer"
            >
              &larr; Back
            </button>
            <button
              type="button"
              onClick={() => setStep(4)}
              className="px-5 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-lg text-xs shadow-xs cursor-pointer"
            >
              Review & Submit &rarr;
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Final Review */}
      {step === 4 && (
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3 text-xs">
            <h4 className="font-black text-amber-900 text-sm uppercase">Summary Verification</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <div><span className="text-slate-500">HOF Name:</span> <span className="font-bold text-slate-900">{hofForm.fullName}</span></div>
              <div><span className="text-slate-500">ITS:</span> <span className="font-bold font-mono text-amber-700">{hofForm.itsNumber}</span></div>
              <div><span className="text-slate-500">Mobile:</span> <span className="font-bold font-mono">{hofForm.mobileNumber}</span></div>
              <div><span className="text-slate-500">Mohallah:</span> <span className="font-bold">{mohallahs.find(m => m.id === hofForm.mohallahId)?.name}</span></div>
              <div><span className="text-slate-500">Total Members:</span> <span className="font-bold">{1 + familyList.length}</span></div>
              <div><span className="text-slate-500">Blood Group:</span> <span className="font-bold text-rose-600">{hofForm.bloodGroup}</span></div>
            </div>
            <div>
              <span className="text-slate-500">Full Address:</span>
              <p className="font-semibold text-slate-800 mt-0.5">{hofForm.fullAddress}</p>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-lg text-xs cursor-pointer"
            >
              &larr; Back to Members
            </button>
            <button
              type="button"
              onClick={handleFinalSubmit}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-lg text-xs shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Confirm & Save Registration</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 3. NON-LOCAL MUMINEEN SUBPAGE
// ============================================================================

const NonLocalMumineenSubpage: React.FC<{
  nonLocals: NonLocalMumin[];
  setNonLocals: React.Dispatch<React.SetStateAction<NonLocalMumin[]>>;
  hofs: HeadOfFamily[];
  currentUser: UserProfile;
  showToast: (m: string) => void;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
}> = ({ nonLocals, setNonLocals, hofs, currentUser, showToast, canAdd, canDelete }) => {
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [draft, setDraft] = useState({
    itsNumber: '',
    fullName: '',
    originalCity: '',
    localAddress: '',
    hostHofIts: hofs[0]?.itsNumber || '',
    stayFrom: new Date().toISOString().split('T')[0],
    stayTo: '',
    purpose: '',
    mobileNumber: '',
  });

  const handleCreate = () => {
    if (!draft.itsNumber || draft.itsNumber.length !== 8) {
      showToast('Enter valid 8-digit ITS number.');
      return;
    }
    if (!draft.fullName) {
      showToast('Full name is required.');
      return;
    }
    const hostHof = hofs.find(h => h.itsNumber === draft.hostHofIts);
    const newRecord: NonLocalMumin = {
      id: `nlm-${Date.now()}`,
      itsNumber: draft.itsNumber,
      fullName: draft.fullName,
      originalCity: draft.originalCity || 'Other City',
      localAddress: draft.localAddress || hostHof?.fullAddress || '',
      hostHofIts: draft.hostHofIts,
      hostHofName: hostHof?.fullName || 'Local Host',
      stayFrom: draft.stayFrom,
      stayTo: draft.stayTo || '2025-12-31',
      purpose: draft.purpose || 'Personal / Business visit',
      mobileNumber: draft.mobileNumber,
      status: 'Active',
      createdAt: new Date().toISOString(),
    };

    const updated = [newRecord, ...nonLocals];
    setNonLocals(updated);
    saveStoredNonLocalMumineen(updated);
    appendActivityLog(currentUser.username, 'Mumineen Master', 'Non-Local Mumineen', 'ADD', `Registered guest mumin @${newRecord.fullName} from ${newRecord.originalCity}.`);
    showToast(`Non-Local Mumin ${newRecord.fullName} added.`);
    setShowAddModal(false);
  };

  const handleMarkReturned = (id: string) => {
    const updated = nonLocals.map(n => n.id === id ? { ...n, status: 'Returned' as const } : n);
    setNonLocals(updated);
    saveStoredNonLocalMumineen(updated);
    showToast('Member status updated to Returned.');
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return nonLocals.filter(n =>
      !q || n.fullName.toLowerCase().includes(q) || n.itsNumber.includes(q) || n.originalCity.toLowerCase().includes(q)
    );
  }, [nonLocals, search]);

  return (
    <div className="space-y-4">
      <div className="bg-white border border-amber-300/40 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search non-local mumin by ITS, Name, City of Origin..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-300/60"
          />
        </div>
        {canAdd && (
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="w-full sm:w-auto px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-lg text-xs shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Non-Local Mumin</span>
          </button>
        )}
      </div>

      <div className="bg-white border border-amber-300/40 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
              <tr>
                <th className="px-4 py-3">ITS & Full Name</th>
                <th className="px-4 py-3">Original Watan / City</th>
                <th className="px-4 py-3">Local Host (Burhani Park)</th>
                <th className="px-4 py-3">Stay Duration</th>
                <th className="px-4 py-3">Purpose</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    No non-local / visiting Mumineen recorded.
                  </td>
                </tr>
              ) : (
                filtered.map((n) => (
                  <tr key={n.id} className="hover:bg-amber-50/40">
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-900">{n.fullName}</p>
                      <p className="font-mono text-[11px] text-amber-700 font-bold">ITS: {n.itsNumber}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-800">{n.originalCity}</p>
                      <p className="text-[10px] text-slate-500">{n.mobileNumber}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800">{n.hostHofName}</p>
                      <p className="font-mono text-[10px] text-slate-400">Host ITS: {n.hostHofIts}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-600">
                      {n.stayFrom} to {n.stayTo}
                    </td>
                    <td className="px-4 py-3 text-slate-700 max-w-xs truncate">{n.purpose}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        n.status === 'Active'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {n.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {n.status === 'Active' && (
                        <button
                          type="button"
                          onClick={() => handleMarkReturned(n.id)}
                          className="px-2.5 py-1 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded cursor-pointer"
                        >
                          Mark Returned
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Non-Local Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900">Add Non-Local / Guest Mumin</h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">ITS (8 Digits) *</label>
                <input
                  type="text"
                  maxLength={8}
                  value={draft.itsNumber}
                  onChange={(e) => setDraft({ ...draft, itsNumber: e.target.value.replace(/\D/g, '') })}
                  placeholder="e.g. 50123984"
                  className="w-full border rounded px-3 py-2 font-mono font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={draft.fullName}
                  onChange={(e) => setDraft({ ...draft, fullName: e.target.value })}
                  placeholder="e.g. Shk Mustafa Bhai"
                  className="w-full border rounded px-3 py-2 font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Watan / Original City *</label>
                <input
                  type="text"
                  value={draft.originalCity}
                  onChange={(e) => setDraft({ ...draft, originalCity: e.target.value })}
                  placeholder="e.g. Mumbai / Karachi / Dubai"
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Mobile Number</label>
                <input
                  type="text"
                  value={draft.mobileNumber}
                  onChange={(e) => setDraft({ ...draft, mobileNumber: e.target.value })}
                  placeholder="Mobile number"
                  className="w-full border rounded px-3 py-2 font-mono"
                />
              </div>
              <div className="col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Local Host HOF (Burhani Park) *</label>
                <select
                  value={draft.hostHofIts}
                  onChange={(e) => setDraft({ ...draft, hostHofIts: e.target.value })}
                  className="w-full border rounded px-3 py-2 cursor-pointer"
                >
                  {hofs.map(h => (
                    <option key={h.id} value={h.itsNumber}>{h.fullName} (ITS: {h.itsNumber})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Stay From Date</label>
                <input
                  type="date"
                  value={draft.stayFrom}
                  onChange={(e) => setDraft({ ...draft, stayFrom: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Expected Return Date</label>
                <input
                  type="date"
                  value={draft.stayTo}
                  onChange={(e) => setDraft({ ...draft, stayTo: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div className="col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Purpose of Stay</label>
                <input
                  type="text"
                  value={draft.purpose}
                  onChange={(e) => setDraft({ ...draft, purpose: e.target.value })}
                  placeholder="e.g. Business assignment, Medical checkup, Ziyarat transit"
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreate}
                className="px-5 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-lg text-xs cursor-pointer shadow-xs"
              >
                Save Non-Local Mumin
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 4. DELETED MUMINEEN LIST SUBPAGE (Recycle Bin)
// ============================================================================

const DeletedMumineenSubpage: React.FC<{
  deletedRecords: DeletedMuminRecord[];
  setDeletedRecords: React.Dispatch<React.SetStateAction<DeletedMuminRecord[]>>;
  currentUser: UserProfile;
  showToast: (m: string) => void;
  onReloadHofs: () => void;
}> = ({ deletedRecords, setDeletedRecords, currentUser, showToast, onReloadHofs }) => {
  const [search, setSearch] = useState('');

  const handleRestore = (id: string) => {
    const res = restoreDeletedMumin(id, currentUser.username);
    if (res.success) {
      showToast(res.message);
      setDeletedRecords(getStoredDeletedMumineen());
      onReloadHofs();
    } else {
      showToast(res.message);
    }
  };

  const handlePermanentDelete = (id: string) => {
    if (window.confirm('WARNING: Are you sure you want to PERMANENTLY PURGE this record? This action CANNOT be undone.')) {
      const res = permanentlyDeleteMumin(id, currentUser.username);
      if (res.success) {
        showToast(res.message);
        setDeletedRecords(getStoredDeletedMumineen());
      }
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return deletedRecords.filter(r =>
      !q || r.originalHof.fullName.toLowerCase().includes(q) || r.originalHof.itsNumber.includes(q)
    );
  }, [deletedRecords, search]);

  return (
    <div className="space-y-4">
      <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-rose-800">
          <Trash2 className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-bold">Soft-Deleted Mumineen Archive (Recycle Bin)</p>
            <p className="text-[11px] text-rose-600">
              Archived records are kept safe here. You can restore any member back to the active list or permanently purge.
            </p>
          </div>
        </div>
        <span className="font-black text-rose-900 bg-rose-200/60 px-3 py-1 rounded-full">
          {deletedRecords.length} Archived
        </span>
      </div>

      <div className="bg-white border border-amber-300/40 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
              <tr>
                <th className="px-4 py-3">ITS & Member Name</th>
                <th className="px-4 py-3">Mohallah</th>
                <th className="px-4 py-3">Deletion Reason</th>
                <th className="px-4 py-3">Archived By / Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-400">
                    Recycle bin is empty. No deleted members recorded.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-rose-50/20">
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-900">{r.originalHof.fullName}</p>
                      <p className="font-mono text-[11px] text-amber-700 font-bold">ITS: {r.originalHof.itsNumber}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{r.originalHof.mohallahName}</td>
                    <td className="px-4 py-3 text-rose-700 max-w-xs">{r.reason}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                      @{r.deletedBy} &bull; {r.deletedAt}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleRestore(r.id)}
                          className="px-3 py-1 text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg border border-emerald-300 cursor-pointer"
                        >
                          Restore
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePermanentDelete(r.id)}
                          className="px-3 py-1 text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg border border-rose-300 cursor-pointer"
                        >
                          Purge
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 5. OUTSTANDING LEDGER SUBPAGE
// ============================================================================

const OutstandingLedgerSubpage: React.FC<{
  hofs: HeadOfFamily[];
  mohallahs: Mohallah[];
  showToast: (m: string) => void;
}> = ({ hofs, mohallahs, showToast }) => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'All' | 'Has Dues' | 'Clear'>('All');

  const consolidatedList = useMemo(() => {
    return hofs.map(h => calculateMuminOutstandingDues(h.itsNumber, h.fullName));
  }, [hofs]);

  const totalOutstandingAll = consolidatedList.reduce((acc, c) => acc + c.totalDue, 0);

  const filtered = useMemo(() => {
    return consolidatedList.filter(c => {
      const q = search.toLowerCase();
      const matchQ = !q || c.fullName.toLowerCase().includes(q) || c.itsNumber.includes(q);
      const matchFilter =
        filterType === 'All' ||
        (filterType === 'Has Dues' && c.totalDue > 0) ||
        (filterType === 'Clear' && c.totalDue === 0);
      return matchQ && matchFilter;
    });
  }, [consolidatedList, search, filterType]);

  return (
    <div className="space-y-4">
      {/* KPI Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 shadow-xs">
          <p className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">Total Consolidated Dues</p>
          <p className="text-2xl font-black text-rose-900 mt-1">{fmtINR(totalOutstandingAll)}</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-xs">
          <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Members With Pending Balances</p>
          <p className="text-2xl font-black text-amber-900 mt-1">
            {consolidatedList.filter(c => c.totalDue > 0).length} Families
          </p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 shadow-xs">
          <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Clear / Nil Balance</p>
          <p className="text-2xl font-black text-emerald-900 mt-1">
            {consolidatedList.filter(c => c.totalDue === 0).length} Families
          </p>
        </div>
      </div>

      <div className="bg-white border border-amber-300/40 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search dues by ITS or Member Name..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-amber-300"
          />
        </div>
        <div className="flex items-center gap-2">
          {(['All', 'Has Dues', 'Clear'] as const).map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilterType(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterType === tab
                  ? 'bg-amber-400 text-slate-950 shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-amber-300/40 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
              <tr>
                <th className="px-4 py-3">ITS & Member</th>
                <th className="px-4 py-3 text-right">Sabeel Due</th>
                <th className="px-4 py-3 text-right">FMB Takhmeen Due</th>
                <th className="px-4 py-3 text-right">Mawaid / Hall Due</th>
                <th className="px-4 py-3 text-right">Total Outstanding</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filtered.map((item) => (
                <tr key={item.itsNumber} className="hover:bg-amber-50/30">
                  <td className="px-4 py-3 font-sans">
                    <p className="font-bold text-slate-900">{item.fullName}</p>
                    <p className="font-mono text-[11px] text-amber-700 font-bold">ITS: {item.itsNumber}</p>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-700">{fmtINR(item.sabeelDue)}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{fmtINR(item.fmbDue)}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{fmtINR(item.hallDue)}</td>
                  <td className="px-4 py-3 text-right font-black text-sm text-slate-950">
                    {fmtINR(item.totalDue)}
                  </td>
                  <td className="px-4 py-3 text-center font-sans">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      item.totalDue === 0
                        ? 'bg-emerald-100 text-emerald-800'
                        : item.totalDue > 10000
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 6. INACTIVE MUMINEEN LIST SUBPAGE
// ============================================================================

const InactiveMumineenSubpage: React.FC<{
  inactiveRecords: InactiveMuminRecord[];
  setInactiveRecords: React.Dispatch<React.SetStateAction<InactiveMuminRecord[]>>;
  currentUser: UserProfile;
  showToast: (m: string) => void;
  onReloadHofs: () => void;
}> = ({ inactiveRecords, setInactiveRecords, currentUser, showToast, onReloadHofs }) => {
  const handleReactivate = (id: string, itsNumber: string) => {
    const hofs = getStoredHofs();
    const target = hofs.find(h => h.itsNumber === itsNumber);
    if (target) {
      const updatedHofs = hofs.map(h => h.itsNumber === itsNumber ? { ...h, status: 'Active' as const } : h);
      saveStoredHofs(updatedHofs);
      onReloadHofs();
    }
    const remaining = inactiveRecords.filter(r => r.id !== id);
    setInactiveRecords(remaining);
    saveStoredInactiveMumineen(remaining);
    appendActivityLog(currentUser.username, 'Mumineen Master', 'Inactive List', 'EDIT', `Reactivated mumin ITS: ${itsNumber} to active directory.`);
    showToast(`Member ITS ${itsNumber} reactivated successfully.`);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border border-amber-300/40 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
              <tr>
                <th className="px-4 py-3">ITS & Member</th>
                <th className="px-4 py-3">Inactivity Reason</th>
                <th className="px-4 py-3">Abroad Location / Country</th>
                <th className="px-4 py-3">Inactivated On</th>
                <th className="px-4 py-3">Expected Return</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {inactiveRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    No paused or inactive members recorded.
                  </td>
                </tr>
              ) : (
                inactiveRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-900">{r.fullName}</p>
                      <p className="font-mono text-amber-700 font-bold">ITS: {r.itsNumber}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{r.reason}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{r.foreignLocation}</td>
                    <td className="px-4 py-3 font-mono text-slate-500">{r.inactivatedDate}</td>
                    <td className="px-4 py-3 font-mono text-emerald-700 font-bold">{r.expectedReturnDate}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleReactivate(r.id, r.itsNumber)}
                        className="px-3 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300 rounded-lg font-bold text-xs cursor-pointer"
                      >
                        Reactivate Mumin
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 7. ADD SMART CARD SUBPAGE (RFID / NFC Mapping)
// ============================================================================

const AddSmartCardSubpage: React.FC<{
  smartCards: SmartCardRecord[];
  setSmartCards: React.Dispatch<React.SetStateAction<SmartCardRecord[]>>;
  hofs: HeadOfFamily[];
  currentUser: UserProfile;
  showToast: (m: string) => void;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
}> = ({ smartCards, setSmartCards, hofs, currentUser, showToast, canAdd, canDelete }) => {
  const [selectedIts, setSelectedIts] = useState(hofs[0]?.itsNumber || '');
  const [cardUid, setCardUid] = useState('');
  const [cardType, setCardType] = useState<SmartCardType>('Mifare 1K');
  const [accessGates, setAccessGates] = useState<string[]>(['Masjid Main Gate', 'Mawaid Hall Entrance']);

  const ALL_GATES = ['Masjid Main Gate', 'Mawaid Hall Entrance', 'Parking Gate B', 'Admin Office', 'FMB Central Kitchen'];

  const handleSimulateScan = () => {
    // Generate simulated Hex UID
    const hex = Array.from({ length: 5 }, () => Math.floor(Math.random() * 256).toString(16).toUpperCase().padStart(2, '0')).join('-');
    setCardUid(hex);
    showToast(`Card tapped! Detected UID: ${hex}`);
  };

  const handleMapCard = () => {
    if (!cardUid.trim()) {
      showToast('Please scan or enter RFID Card UID.');
      return;
    }
    const member = hofs.find(h => h.itsNumber === selectedIts);
    if (!member) {
      showToast('Selected member not found.');
      return;
    }
    const newCard: SmartCardRecord = {
      id: `sc-${Date.now()}`,
      itsNumber: member.itsNumber,
      memberName: member.fullName,
      mohallahName: member.mohallahName || 'Burhani Park',
      cardUid: cardUid.trim(),
      cardType,
      issuedDate: new Date().toISOString().split('T')[0],
      expiryDate: '2028-12-31',
      status: 'Active',
      accessGates,
      createdAt: new Date().toISOString(),
    };

    const updated = [newCard, ...smartCards.filter(c => c.itsNumber !== member.itsNumber)];
    setSmartCards(updated);
    saveStoredSmartCards(updated);
    appendActivityLog(currentUser.username, 'Mumineen Master', 'Smart Card', 'ADD', `Mapped RFID chip ${newCard.cardUid} to ITS ${newCard.itsNumber}.`);
    showToast(`Smart Card successfully mapped to ${member.fullName}!`);
    setCardUid('');
  };

  const handleToggleStatus = (id: string, currentStatus: SmartCardStatus) => {
    const nextStatus: SmartCardStatus = currentStatus === 'Active' ? 'Blocked' : 'Active';
    const updated = smartCards.map(c => c.id === id ? { ...c, status: nextStatus } : c);
    setSmartCards(updated);
    saveStoredSmartCards(updated);
    showToast(`Card status updated to ${nextStatus}.`);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Mapping Card Form */}
      <div className="bg-white border border-amber-300/40 rounded-xl p-6 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-amber-600" />
          <span>RFID / NFC Chip Hardware Mapping Interface</span>
        </h3>
        <p className="text-xs text-slate-500">
          Pair high-frequency 13.56MHz Mifare RFID badges or NFC credentials with member ITS profile.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Select Member (HOF) *</label>
            <select
              value={selectedIts}
              onChange={(e) => setSelectedIts(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 cursor-pointer font-bold"
            >
              {hofs.map(h => (
                <option key={h.id} value={h.itsNumber}>{h.fullName} (ITS: {h.itsNumber})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Card Technology / Chipset</label>
            <select
              value={cardType}
              onChange={(e) => setCardType(e.target.value as SmartCardType)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 cursor-pointer"
            >
              <option value="Mifare 1K">Mifare Classic 1K (RFID 13.56 MHz)</option>
              <option value="DesFire EV1">MIFARE DESFire EV1 (High Security)</option>
              <option value="NFC Type 2">NFC Type 2 Tag (Smartphone tap)</option>
              <option value="Digital QR">Digital Encrypted QR Badge</option>
            </select>
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Card Serial / Hex UID *</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={cardUid}
                onChange={(e) => setCardUid(e.target.value.toUpperCase())}
                placeholder="e.g. E2-80-68-1A-9F"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono font-bold"
              />
              <button
                type="button"
                onClick={handleSimulateScan}
                className="px-3 py-2 bg-slate-900 text-amber-300 hover:bg-slate-800 rounded-lg font-bold shrink-0 cursor-pointer flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Tap Sensor</span>
              </button>
            </div>
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Authorized Access Gates</label>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {ALL_GATES.map(gate => {
                const checked = accessGates.includes(gate);
                return (
                  <button
                    key={gate}
                    type="button"
                    onClick={() => {
                      if (checked) setAccessGates(accessGates.filter(g => g !== gate));
                      else setAccessGates([...accessGates, gate]);
                    }}
                    className={`px-2 py-1 rounded text-[10px] font-bold border cursor-pointer ${
                      checked
                        ? 'bg-amber-400 border-amber-500 text-slate-950'
                        : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}
                  >
                    {gate}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-3">
          <button
            type="button"
            onClick={handleMapCard}
            className="px-5 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-lg text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Map & Activate Smart Card</span>
          </button>
        </div>
      </div>

      {/* Existing Active Smart Cards Table */}
      <div className="bg-white border border-amber-300/40 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
            Issued Smart Cards Directory ({smartCards.length})
          </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold text-[10px] uppercase">
              <tr>
                <th className="px-4 py-3">ITS & Member</th>
                <th className="px-4 py-3">Card Hex UID</th>
                <th className="px-4 py-3">Chip Type</th>
                <th className="px-4 py-3">Expiry Date</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {smartCards.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-sans">
                    <p className="font-bold text-slate-900">{c.memberName}</p>
                    <p className="font-mono text-amber-700 font-bold text-[11px]">ITS: {c.itsNumber}</p>
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-900">{c.cardUid}</td>
                  <td className="px-4 py-3 font-sans text-slate-700">{c.cardType}</td>
                  <td className="px-4 py-3 text-slate-500">{c.expiryDate}</td>
                  <td className="px-4 py-3 text-center font-sans">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      c.status === 'Active'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-rose-100 text-rose-800 border border-rose-300'
                    }`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-sans">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(c.id, c.status)}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded cursor-pointer ${
                        c.status === 'Active'
                          ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      {c.status === 'Active' ? 'Block Card' : 'Unblock'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 8. PRINT SMART CARD SUBPAGE (Dual-Sided Print-Ready Studio)
// ============================================================================

const PrintSmartCardSubpage: React.FC<{
  hofs: HeadOfFamily[];
  smartCards: SmartCardRecord[];
  initialIts?: string;
  showToast: (m: string) => void;
}> = ({ hofs, smartCards, initialIts, showToast }) => {
  const [selectedIts, setSelectedIts] = useState(initialIts || hofs[0]?.itsNumber || '');

  const member = useMemo(() => {
    return hofs.find(h => h.itsNumber === selectedIts) || hofs[0];
  }, [hofs, selectedIts]);

  const cardInfo = useMemo(() => {
    return smartCards.find(c => c.itsNumber === selectedIts);
  }, [smartCards, selectedIts]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top selector */}
      <div className="bg-white border border-amber-300/40 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs font-bold text-slate-700 shrink-0">Select Member:</label>
          <select
            value={selectedIts}
            onChange={(e) => setSelectedIts(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-bold cursor-pointer w-full sm:w-72"
          >
            {hofs.map(h => (
              <option key={h.id} value={h.itsNumber}>{h.fullName} (ITS: {h.itsNumber})</option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={handlePrint}
          className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-300 font-black rounded-lg text-xs shadow-md cursor-pointer flex items-center justify-center gap-2"
        >
          <Printer className="w-4 h-4" />
          <span>Print Dual-Sided ID Badge</span>
        </button>
      </div>

      {/* DUAL-SIDED ID CARD PREVIEW (CR80 standard 85.6mm x 53.98mm ratio) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 place-items-center">
        {/* FRONT SIDE */}
        <div className="w-[340px] h-[215px] rounded-2xl bg-gradient-to-br from-amber-400 via-amber-200 to-amber-500 p-1 shadow-2xl relative select-none text-slate-900 flex flex-col overflow-hidden">
          <div className="bg-white rounded-xl w-full h-full p-3.5 flex flex-col justify-between relative overflow-hidden border border-amber-300/60">
            {/* Header */}
            <div className="flex items-center gap-2.5 border-b border-amber-200/60 pb-2">
              <div className="w-8 h-8 rounded-lg bg-amber-400 flex items-center justify-center font-black text-xs shadow-xs text-slate-950">
                BP
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-wider text-slate-900">Anjuman-e-Mufaddal</p>
                <p className="text-[9px] font-bold text-amber-700 uppercase tracking-widest">Burhani Park Jamaat</p>
              </div>
              <div className="ml-auto">
                <span className="text-[8px] font-extrabold bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded">MUMIN ID</span>
              </div>
            </div>

            {/* Middle Profile */}
            <div className="flex items-center gap-3 my-auto">
              <div className="w-16 h-16 rounded-xl bg-slate-100 border-2 border-amber-400 flex items-center justify-center font-black text-xl text-amber-800 shadow-inner shrink-0">
                {member ? member.fullName.slice(0, 2).toUpperCase() : 'JM'}
              </div>
              <div className="min-w-0">
                <p className="font-extrabold text-sm text-slate-900 leading-tight truncate">
                  {member?.fullName}
                </p>
                <p className="font-mono text-xs font-black text-amber-700 mt-0.5">
                  ITS: {member?.itsNumber}
                </p>
                <p className="text-[10px] text-slate-500 font-semibold truncate mt-0.5">
                  {member?.mohallahName}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 font-bold text-[9px]">
                    BG: {member?.bloodGroup || 'B+'}
                  </span>
                  <span className="text-[9px] text-slate-500 font-mono">
                    SB: {member?.sabeelNo || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-[8px] text-slate-400 font-mono">
              <span>CHIP: {cardInfo?.cardUid || 'E2-80-68-1A-9F'}</span>
              <span className="text-amber-800 font-bold">OFFICIAL IDENTIFICATION</span>
            </div>
          </div>
        </div>

        {/* BACK SIDE */}
        <div className="w-[340px] h-[215px] rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-1 shadow-2xl relative select-none text-white flex flex-col overflow-hidden">
          <div className="bg-slate-900 rounded-xl w-full h-full p-3.5 flex flex-col justify-between relative overflow-hidden border border-slate-700 text-[10px]">
            {/* Magnetic Stripe representation */}
            <div className="h-6 -mx-3.5 -mt-3.5 bg-black border-b border-slate-800 mb-2" />

            {/* Details */}
            <div className="space-y-1.5 text-[9px] text-slate-300">
              <p><span className="text-slate-500 font-bold">Emergency Contact:</span> {member?.emergencyContact || member?.mobileNumber}</p>
              <p className="line-clamp-2"><span className="text-slate-500 font-bold">Address:</span> {member?.fullAddress}</p>
              <p><span className="text-slate-500 font-bold">Authorized Access:</span> Masjid, Mawaid Complex, Gates</p>
            </div>

            {/* Terms and Signature */}
            <div className="border-t border-slate-800 pt-2 flex items-end justify-between">
              <div className="space-y-0.5 text-[7px] text-slate-400 max-w-[190px]">
                <p>&bull; This card is the property of Anjuman-e-Mufaddal.</p>
                <p>&bull; If found, please return to Burhani Park Jamaat Office.</p>
                <p>&bull; Helpline: +91 98200 11223</p>
              </div>
              <div className="text-center">
                <div className="h-5 w-20 border-b border-amber-400/80 mx-auto flex items-center justify-center">
                  <span className="font-serif italic text-[9px] text-amber-300">Amil Saheb</span>
                </div>
                <span className="text-[7px] text-slate-400 uppercase tracking-wider">Authorized Seal</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 9. SAFAI CHITTHI ENTRY SUBPAGE (Automated Dues Check Blocking Engine)
// ============================================================================

const SafaiChitthiEntrySubpage: React.FC<{
  safaiChitthies: SafaiChitthiRecord[];
  setSafaiChitthies: React.Dispatch<React.SetStateAction<SafaiChitthiRecord[]>>;
  hofs: HeadOfFamily[];
  initialIts?: string;
  currentUser: UserProfile;
  showToast: (m: string) => void;
  canAdd: boolean;
  onViewOutstanding: () => void;
}> = ({ safaiChitthies, setSafaiChitthies, hofs, initialIts, currentUser, showToast, canAdd, onViewOutstanding }) => {
  const [selectedIts, setSelectedIts] = useState(initialIts || hofs[0]?.itsNumber || '');
  const [destJamaat, setDestJamaat] = useState('Anjuman-e-Saifee (Mumbai, India)');
  const [reason, setReason] = useState('Permanent Family Relocation');
  const [departureDate, setDepartureDate] = useState(new Date().toISOString().split('T')[0]);
  const [overrideJustification, setOverrideJustification] = useState('');
  const [allowOverride, setAllowOverride] = useState(false);

  const dues = useMemo(() => {
    return calculateMuminOutstandingDues(selectedIts);
  }, [selectedIts]);

  const member = useMemo(() => {
    return hofs.find(h => h.itsNumber === selectedIts);
  }, [hofs, selectedIts]);

  const hasDues = dues.totalDue > 0;
  const isJanab = currentUser.username === 'janabadmin' || currentUser.role === 'Super Admin';

  const handleIssueChitthi = () => {
    if (!member) {
      showToast('Select valid member.');
      return;
    }

    if (hasDues && !allowOverride) {
      showToast('ISSUANCE BLOCKED: Member has pending dues. Settle dues or apply Janab override.');
      return;
    }

    const serialNumber = `SC-1447-${Math.floor(100 + Math.random() * 900)}`;

    const newRecord: SafaiChitthiRecord = {
      id: `sc-entry-${Date.now()}`,
      chitthiNo: serialNumber,
      itsNumber: member.itsNumber,
      fullName: member.fullName,
      destinationJamaat: destJamaat,
      reason,
      departureDate,
      totalDuesAtRequest: dues.totalDue,
      duesBreakdown: {
        sabeel: dues.sabeelDue,
        fmb: dues.fmbDue,
        hall: dues.hallDue,
      },
      status: hasDues ? 'Blocked' : 'Issued',
      overrideBy: (hasDues && allowOverride) ? currentUser.username : undefined,
      overrideReason: (hasDues && allowOverride) ? overrideJustification : undefined,
      issuedDate: new Date().toISOString().split('T')[0],
      issuedBy: currentUser.username,
      notes: hasDues && allowOverride ? `Special Janab clearance granted: ${overrideJustification}` : 'Normal clean clearance.',
    };

    const updated = [newRecord, ...safaiChitthies];
    setSafaiChitthies(updated);
    saveStoredSafaiChitthies(updated);

    appendActivityLog(
      currentUser.username,
      'Mumineen Master',
      'Safai Chitthi Entry',
      'ADD',
      `Issued Safai Chitthi #${serialNumber} for ITS ${member.itsNumber} to ${destJamaat}. Status: ${newRecord.status}`
    );

    if (hasDues && !allowOverride) {
      showToast(`Chitthi request registered as BLOCKED due to ₹${dues.totalDue} outstanding.`);
    } else {
      showToast(`Official Safai Chitthi #${serialNumber} generated successfully!`);
    }
  };

  return (
    <div className="bg-white border border-amber-300/40 rounded-xl p-6 shadow-xs max-w-3xl mx-auto space-y-6">
      <div className="border-b pb-3">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-amber-600" />
          <span>Safai Chitthi (Transfer / Clearance Certificate) Issuance Form</span>
        </h3>
        <p className="text-xs text-slate-500">
          Automated dues verification checks Sabeel, FMB and Hall records before approving official clearance.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div className="sm:col-span-2">
          <label className="block font-bold text-slate-700 mb-1">Select Transferring Mumin *</label>
          <select
            value={selectedIts}
            onChange={(e) => setSelectedIts(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 cursor-pointer font-bold"
          >
            {hofs.map(h => (
              <option key={h.id} value={h.itsNumber}>{h.fullName} (ITS: {h.itsNumber})</option>
            ))}
          </select>
        </div>

        {/* Dues Status Alert Banner */}
        <div className={`sm:col-span-2 p-4 rounded-xl border flex items-start justify-between gap-3 ${
          hasDues
            ? 'bg-rose-50 border-rose-300 text-rose-900'
            : 'bg-emerald-50 border-emerald-300 text-emerald-900'
        }`}>
          <div className="flex items-start gap-2.5">
            {hasDues ? <Ban className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" /> : <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />}
            <div>
              <p className="font-black text-sm">
                {hasDues ? `CLEARANCE BLOCKED: Pending Dues Detected (${fmtINR(dues.totalDue)})` : 'CLEARANCE APPROVED: NIL Dues Detected'}
              </p>
              <div className="flex flex-wrap gap-3 mt-1.5 text-xs">
                <span>Sabeel: <b>{fmtINR(dues.sabeelDue)}</b></span>
                <span>FMB Takhmeen: <b>{fmtINR(dues.fmbDue)}</b></span>
                <span>Hall: <b>{fmtINR(dues.hallDue)}</b></span>
              </div>
            </div>
          </div>
          {hasDues && (
            <button
              type="button"
              onClick={onViewOutstanding}
              className="px-3 py-1 bg-rose-200 text-rose-900 font-bold rounded-lg text-[11px] shrink-0 hover:bg-rose-300 cursor-pointer"
            >
              View Outstanding List
            </button>
          )}
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1">Destination Jamaat *</label>
          <input
            type="text"
            value={destJamaat}
            onChange={(e) => setDestJamaat(e.target.value)}
            placeholder="e.g. Anjuman-e-Najmi (Dubai)"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 font-semibold"
          />
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1">Departure / Transfer Date</label>
          <input
            type="date"
            value={departureDate}
            onChange={(e) => setDepartureDate(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block font-bold text-slate-700 mb-1">Reason for Safai Chitthi</label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Permanent relocation, Nikah transfer, Job shifting"
            className="w-full border border-slate-300 rounded-lg px-3 py-2"
          />
        </div>

        {/* Janab Override for Blocked Certificates */}
        {hasDues && isJanab && (
          <div className="sm:col-span-2 p-3 bg-amber-50 border border-amber-300 rounded-lg space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={allowOverride}
                onChange={(e) => setAllowOverride(e.target.checked)}
                className="w-4 h-4 accent-amber-500 cursor-pointer"
              />
              <span className="font-black text-amber-950">Janab Super Admin Special Clearance Override</span>
            </label>
            {allowOverride && (
              <input
                type="text"
                value={overrideJustification}
                onChange={(e) => setOverrideJustification(e.target.value)}
                placeholder="Enter authorized clearance justification note..."
                className="w-full border border-amber-300 rounded px-2.5 py-1.5 text-xs bg-white"
              />
            )}
          </div>
        )}
      </div>

      <div className="flex justify-end pt-3">
        <button
          type="button"
          onClick={handleIssueChitthi}
          className="px-6 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black rounded-lg text-xs shadow-md cursor-pointer flex items-center gap-2"
        >
          <FileCheck className="w-4 h-4 stroke-[2.5]" />
          <span>Generate Official Safai Chitthi</span>
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// 10. OUTSTANDING SAFAI CHITTHI LIST SUBPAGE
// ============================================================================

const OutstandingSafaiChitthiSubpage: React.FC<{
  safaiChitthies: SafaiChitthiRecord[];
  setSafaiChitthies: React.Dispatch<React.SetStateAction<SafaiChitthiRecord[]>>;
  currentUser: UserProfile;
  showToast: (m: string) => void;
}> = ({ safaiChitthies, setSafaiChitthies, currentUser, showToast }) => {
  const handleApproveOverride = (id: string) => {
    const reason = prompt('Enter Janab Super Admin override approval justification:') || 'Approved by Janab';
    const updated = safaiChitthies.map(s => s.id === id ? {
      ...s,
      status: 'Issued' as const,
      overrideBy: currentUser.username,
      overrideReason: reason,
    } : s);
    setSafaiChitthies(updated);
    saveStoredSafaiChitthies(updated);
    showToast('Safai Chitthi clearance approved via Janab override.');
  };

  const handleCancelRequest = (id: string) => {
    const updated = safaiChitthies.map(s => s.id === id ? { ...s, status: 'Cancelled' as const } : s);
    setSafaiChitthies(updated);
    saveStoredSafaiChitthies(updated);
    showToast('Safai Chitthi request cancelled.');
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border border-amber-300/40 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
            Clearance Certificates Log ({safaiChitthies.length})
          </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px]">
              <tr>
                <th className="px-4 py-3">Chitthi #</th>
                <th className="px-4 py-3">Member & ITS</th>
                <th className="px-4 py-3">Destination Jamaat</th>
                <th className="px-4 py-3">Pending Dues</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {safaiChitthies.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono font-bold text-amber-700">{s.chitthiNo}</td>
                  <td className="px-4 py-3">
                    <p className="font-bold text-slate-900">{s.fullName}</p>
                    <p className="font-mono text-slate-400 text-[11px]">ITS: {s.itsNumber}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-800">{s.destinationJamaat}</td>
                  <td className="px-4 py-3 font-mono text-rose-700 font-bold">
                    {fmtINR(s.totalDuesAtRequest)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      s.status === 'Issued'
                        ? 'bg-emerald-100 text-emerald-800'
                        : s.status === 'Blocked'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {s.status === 'Blocked' && (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleApproveOverride(s.id)}
                          className="px-2.5 py-1 text-[11px] font-bold bg-amber-100 text-amber-900 hover:bg-amber-200 rounded cursor-pointer"
                        >
                          Janab Override
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCancelRequest(s.id)}
                          className="px-2.5 py-1 text-[11px] font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 rounded cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 11. JAMAAT CATEGORY LIST SUBPAGE
// ============================================================================

const JamaatCategoryListSubpage: React.FC<{
  categories: JamaatCategory[];
  setCategories: React.Dispatch<React.SetStateAction<JamaatCategory[]>>;
  hofs: HeadOfFamily[];
  currentUser: UserProfile;
  showToast: (m: string) => void;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
}> = ({ categories, setCategories, currentUser, showToast, canAdd, canDelete }) => {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    code: '',
    name: '',
    description: '',
    priorityRank: 1,
    fmbDiscountPct: 0,
    sabeelDiscountPct: 0,
    privilegeNotes: '',
  });

  const handleCreate = () => {
    if (!form.name || !form.code) {
      showToast('Category code and name are required.');
      return;
    }
    const newCat: JamaatCategory = {
      id: `cat-${Date.now()}`,
      ...form,
      createdAt: new Date().toISOString(),
    };
    const updated = [...categories, newCat];
    setCategories(updated);
    saveStoredJamaatCategories(updated);
    showToast(`Category ${newCat.name} created.`);
    setShowModal(false);
    setForm({
      code: '',
      name: '',
      description: '',
      priorityRank: 1,
      fmbDiscountPct: 0,
      sabeelDiscountPct: 0,
      privilegeNotes: '',
    });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this classification category?')) {
      const updated = categories.filter(c => c.id !== id);
      setCategories(updated);
      saveStoredJamaatCategories(updated);
      showToast('Category deleted.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-white border border-amber-300/40 rounded-xl p-4 shadow-xs">
        <div>
          <h3 className="font-bold text-sm text-slate-900">Custom Member Classification & Grading Master</h3>
          <p className="text-xs text-slate-500">Configure member privilege tiers, concessions, and special protocol categories.</p>
        </div>
        {canAdd && (
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-lg text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Classification Tier</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map((c) => (
          <div key={c.id} className="bg-white border border-amber-200/80 rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-mono text-[10px] font-bold">
                  {c.code}
                </span>
                <h4 className="font-bold text-sm text-slate-900 mt-1">{c.name}</h4>
              </div>
              <span className="text-xs font-bold text-slate-400">Rank #{c.priorityRank}</span>
            </div>
            <p className="text-xs text-slate-600">{c.description}</p>
            {c.privilegeNotes && (
              <p className="text-[11px] text-amber-800 bg-amber-50/70 p-2 rounded-lg font-medium">
                Privileges: {c.privilegeNotes}
              </p>
            )}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
              <div className="flex gap-3 text-slate-500 font-mono">
                <span>FMB: <b>{c.fmbDiscountPct}% Off</b></span>
                <span>Sabeel: <b>{c.sabeelDiscountPct}% Off</b></span>
              </div>
              {canDelete && (
                <button
                  type="button"
                  onClick={() => handleDelete(c.id)}
                  className="text-rose-600 hover:text-rose-800 font-bold text-xs cursor-pointer"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900">Add Jamaat Category</h3>
              <button type="button" onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Category Code *</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. CAT-VIP"
                  className="w-full border rounded px-3 py-2 font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Category A (Senior Prominent)"
                  className="w-full border rounded px-3 py-2 font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Criteria for member inclusion..."
                  className="w-full border rounded px-3 py-2 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Priority Rank</label>
                  <input
                    type="number"
                    value={form.priorityRank}
                    onChange={(e) => setForm({ ...form, priorityRank: Number(e.target.value) })}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">FMB Concession %</label>
                  <input
                    type="number"
                    value={form.fmbDiscountPct}
                    onChange={(e) => setForm({ ...form, fmbDiscountPct: Number(e.target.value) })}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border rounded-lg text-xs font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreate}
                className="px-5 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-lg text-xs"
              >
                Save Category
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 12. OUTSTANDING COMMENTS SUBPAGE
// ============================================================================

const OutstandingCommentsSubpage: React.FC<{
  comments: OutstandingComment[];
  setComments: React.Dispatch<React.SetStateAction<OutstandingComment[]>>;
  hofs: HeadOfFamily[];
  currentUser: UserProfile;
  showToast: (m: string) => void;
}> = ({ comments, setComments, hofs, currentUser, showToast }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedIts, setSelectedIts] = useState(hofs[0]?.itsNumber || '');
  const [category, setCategory] = useState<CommentCategory>('Financial Follow-up');
  const [priority, setPriority] = useState<CommentPriority>('Medium');
  const [commentText, setCommentText] = useState('');

  const handleAddComment = () => {
    if (!commentText.trim()) {
      showToast('Comment text is required.');
      return;
    }
    const member = hofs.find(h => h.itsNumber === selectedIts);
    const newComment: OutstandingComment = {
      id: `com-${Date.now()}`,
      itsNumber: selectedIts,
      memberName: member?.fullName || 'Member',
      author: currentUser.username,
      category,
      priority,
      comment: commentText.trim(),
      isResolved: false,
      createdAt: new Date().toLocaleString(),
    };

    const updated = [newComment, ...comments];
    setComments(updated);
    saveStoredOutstandingComments(updated);
    showToast('Administrative remark added.');
    setShowAddModal(false);
    setCommentText('');
  };

  const handleResolve = (id: string) => {
    const updated = comments.map(c => c.id === id ? {
      ...c,
      isResolved: true,
      resolvedAt: new Date().toLocaleString(),
      resolvedBy: currentUser.username,
    } : c);
    setComments(updated);
    saveStoredOutstandingComments(updated);
    showToast('Remark marked as resolved.');
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <div className="bg-white border border-amber-300/40 rounded-xl p-4 shadow-xs flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm text-slate-900">Administrative Notes & Remark Audit Trail</h3>
          <p className="text-xs text-slate-500">Record follow-ups, disciplinary warnings, or special approvals per member profile.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-lg text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add Member Remark</span>
        </button>
      </div>

      <div className="space-y-3">
        {comments.map((c) => (
          <div
            key={c.id}
            className={`p-4 rounded-xl border transition-all ${
              c.isResolved
                ? 'bg-slate-50 border-slate-200 opacity-60'
                : c.priority === 'Critical'
                ? 'bg-rose-50 border-rose-300'
                : 'bg-white border-amber-200/80 shadow-xs'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    c.priority === 'Critical' ? 'bg-rose-600 text-white' :
                    c.priority === 'High' ? 'bg-rose-100 text-rose-800' :
                    c.priority === 'Medium' ? 'bg-amber-100 text-amber-900' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {c.priority}
                  </span>
                  <span className="font-bold text-xs text-slate-900">{c.memberName}</span>
                  <span className="font-mono text-amber-700 text-xs font-bold">(ITS: {c.itsNumber})</span>
                </div>
                <p className="text-xs text-slate-700 mt-2 font-medium">{c.comment}</p>
                <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400 font-mono">
                  <span>Category: <b>{c.category}</b></span>
                  <span>Author: @{c.author}</span>
                  <span>Timestamp: {c.createdAt}</span>
                </div>
              </div>
              <div>
                {!c.isResolved ? (
                  <button
                    type="button"
                    onClick={() => handleResolve(c.id)}
                    className="px-3 py-1 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Mark Resolved
                  </button>
                ) : (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Resolved
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900">Add Remark / Comment</h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Member *</label>
                <select
                  value={selectedIts}
                  onChange={(e) => setSelectedIts(e.target.value)}
                  className="w-full border rounded px-3 py-2 cursor-pointer font-bold"
                >
                  {hofs.map(h => (
                    <option key={h.id} value={h.itsNumber}>{h.fullName} (ITS: {h.itsNumber})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as CommentCategory)}
                    className="w-full border rounded px-3 py-2 cursor-pointer"
                  >
                    <option value="Financial Follow-up">Financial Follow-up</option>
                    <option value="Family Matter">Family Matter</option>
                    <option value="Address Verification">Address Verification</option>
                    <option value="General Administrative">General Administrative</option>
                    <option value="Disciplinary / Caution">Disciplinary / Caution</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as CommentPriority)}
                    className="w-full border rounded px-3 py-2 cursor-pointer"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Comment Details *</label>
                <textarea
                  rows={3}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Enter detailed internal administrative remarks..."
                  className="w-full border rounded px-3 py-2 resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border rounded-lg text-xs font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddComment}
                className="px-5 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-lg text-xs"
              >
                Save Remark
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 13. SYNC ITS52 DATA SUBPAGE (API Simulation & CSV Bulk Import)
// ============================================================================

const SyncIts52Subpage: React.FC<{
  hofs: HeadOfFamily[];
  onReloadHofs: () => void;
  currentUser: UserProfile;
  showToast: (m: string) => void;
}> = ({ hofs, onReloadHofs, currentUser, showToast }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncResult, setSyncResult] = useState<{ updated: number; added: number } | null>(null);

  const handleSimulateApiSync = () => {
    setIsSyncing(true);
    setSyncProgress(10);
    setSyncResult(null);

    const timer = setInterval(() => {
      setSyncProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setIsSyncing(false);
          setSyncResult({ updated: 14, added: 2 });
          appendActivityLog(currentUser.username, 'Mumineen Master', 'Sync ITS52', 'EDIT', 'Synchronized 16 records via central ITS52 API.');
          showToast('ITS52 cloud synchronization completed successfully!');
          return 100;
        }
        return prev + 25;
      });
    }, 400);
  };

  const handleDownloadCsvTemplate = () => {
    const csvContent =
      'ITS,FullName,FatherName,Surname,Mobile,Address,MohallahCode,BloodGroup,SabeelNo\n' +
      '30489122,Mulla Shabbir Bhai Fakhri,Ibrahim Bhai,Fakhri,9820044556,"Flat 402, Burhani Heights",SEC-B,B+,SB-042\n' +
      '20391823,Mulla Huzefa Bhai Jamali,Taherali Bhai,Jamali,9820011223,"Flat 102, Saifee Mahal",SEC-A,O+,SB-015\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'its52_mumineen_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Downloaded its52_mumineen_template.csv');
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    showToast(`Parsed CSV "${file.name}" with 18 records. Ready for merge.`);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Central API Sync Card */}
      <div className="bg-white border border-amber-300/40 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <RefreshCw className={`w-5 h-5 text-amber-600 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Live Dawat-e-Hadiyah ITS52 Gateway Sync</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Direct secure REST synchronization with central dawat ITS52 servers for automatic profile updates.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded bg-blue-50 text-blue-800 font-mono text-xs font-bold border border-blue-200">
            TLS 1.3 Active
          </span>
        </div>

        {isSyncing && (
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between text-xs font-bold text-slate-700">
              <span>Fetching remote records...</span>
              <span>{syncProgress}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-amber-400 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${syncProgress}%` }}
              />
            </div>
          </div>
        )}

        {syncResult && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Sync Complete! <b>{syncResult.updated} profiles updated</b>, <b>{syncResult.added} new records ingested</b> into local database.
            </span>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="button"
            disabled={isSyncing}
            onClick={handleSimulateApiSync}
            className="px-5 py-2.5 bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-slate-950 font-bold rounded-lg text-xs shadow-xs cursor-pointer flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing with ITS52...' : 'Start Cloud Sync Now'}</span>
          </button>
        </div>
      </div>

      {/* CSV Bulk Ingestion Card */}
      <div className="bg-white border border-amber-300/40 rounded-xl p-6 shadow-xs space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Upload className="w-5 h-5 text-amber-600" />
            <span>Bulk CSV / Excel File Ingestion</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Download our standard ITS template, populate member rows, and upload to bulk import.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-4 border-2 border-dashed border-slate-200 rounded-xl text-center space-y-2">
            <Download className="w-8 h-8 text-amber-600 mx-auto" />
            <p className="text-xs font-bold text-slate-800">Download Official CSV Template</p>
            <p className="text-[11px] text-slate-500">Includes all columns formatted for instant ingestion</p>
            <button
              type="button"
              onClick={handleDownloadCsvTemplate}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold cursor-pointer"
            >
              Download Template (.csv)
            </button>
          </div>

          <div className="p-4 border-2 border-dashed border-slate-200 rounded-xl text-center space-y-2">
            <Upload className="w-8 h-8 text-blue-600 mx-auto" />
            <p className="text-xs font-bold text-slate-800">Upload Filled Data CSV</p>
            <p className="text-[11px] text-slate-500">Drag & drop or select CSV from your computer</p>
            <label className="inline-block px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold cursor-pointer">
              <span>Select File</span>
              <input type="file" accept=".csv" onChange={handleCsvUpload} className="hidden" />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
