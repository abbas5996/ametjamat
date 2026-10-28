import React, { useState, useMemo } from 'react';
import {
  MapPin, Plus, Edit, Trash2, Search, X, Save, Users, UserCheck,
  Phone, Mail, Hash, ChevronRight, CheckCircle2, Shield, Layers,
  RefreshCw, Filter, Building2, UserPlus, ArrowRightLeft,
} from 'lucide-react';
import {
  SubMohallah, MohallaIncharge, MohallaAssignment,
  getStoredSubMohallahs, saveStoredSubMohallahs,
  getStoredIncharges, saveStoredIncharges,
  getStoredMohallaAssignments, saveStoredMohallaAssignments,
  generateMohallaId, INCHARGE_DESIGNATIONS, ASSIGNMENT_ROLES,
} from '../../utils/mohallaManagement';
import { Mohallah, UserProfile } from '../../types';
import { getStoredMohallahs, saveStoredMohallahs } from '../../utils/memberMaster';
import { appendActivityLog } from '../../utils/rbac';

interface Props {
  currentUser: UserProfile;
  activeSubItemId: string;
  showToast: (msg: string) => void;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

type ActiveTab = 'mohalla-master' | 'sub-mohalla' | 'incharge-master' | 'assign-incharge';

const COLOR_TAG_MAP: Record<string, string> = {
  emerald: 'bg-emerald-500', blue: 'bg-blue-500',
  amber: 'bg-amber-500', purple: 'bg-purple-500',
  rose: 'bg-rose-500', cyan: 'bg-cyan-500',
};
const COLOR_OPTIONS = ['emerald', 'blue', 'amber', 'purple', 'rose', 'cyan'];

// ─────────────────────────────────────────────────────────────────────────────

export const MohallaManagementModule: React.FC<Props> = ({
  currentUser, activeSubItemId, showToast, canAdd, canEdit, canDelete,
}) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    if (activeSubItemId === 'mohalla-master' || activeSubItemId === 'sub-mohalla' || activeSubItemId === 'incharge-master' || activeSubItemId === 'assign-incharge') {
      return activeSubItemId;
    }
    return 'mohalla-master';
  });

  React.useEffect(() => {
    if (activeSubItemId === 'mohalla-master' || activeSubItemId === 'sub-mohalla' || activeSubItemId === 'incharge-master' || activeSubItemId === 'assign-incharge') {
      setActiveTab(activeSubItemId);
    }
  }, [activeSubItemId]);

  const [mohallahs, setMohallahs] = useState<Mohallah[]>(() => getStoredMohallahs());
  const [subMohallahs, setSubMohallahs] = useState<SubMohallah[]>(() => getStoredSubMohallahs());
  const [incharges, setIncharges] = useState<MohallaIncharge[]>(() => getStoredIncharges());
  const [assignments, setAssignments] = useState<MohallaAssignment[]>(() => getStoredMohallaAssignments());

  const tabs: { key: ActiveTab; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: 'mohalla-master',   label: '1. Mohalla Master',        icon: <MapPin className="w-4 h-4" />,     count: mohallahs.length },
    { key: 'sub-mohalla',      label: '2. Sub Mohalla',           icon: <Layers className="w-4 h-4" />,     count: subMohallahs.length },
    { key: 'incharge-master',  label: '3. Incharge Master',       icon: <UserCheck className="w-4 h-4" />,  count: incharges.length },
    { key: 'assign-incharge',  label: '4. Assign Incharge',       icon: <UserPlus className="w-4 h-4" />,   count: assignments.length },
  ];

  return (
    <div className="space-y-5">
      {/* Tab Bar */}
      <div className="bg-white border border-amber-300/40 rounded-xl p-1.5 shadow-xs flex items-center gap-1.5 overflow-x-auto">
        {tabs.map(({ key, label, icon, count }) => (
          <button key={key} type="button" onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === key ? 'bg-amber-400 text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-amber-50'
            }`}>
            {icon}<span>{label}</span>
            {count !== undefined && (
              <span className="ml-1 px-1.5 rounded-full text-[10px] bg-slate-100 text-slate-700 font-mono">{count}</span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'mohalla-master'  && <MohallaMasterTab  mohallahs={mohallahs}  setMohallahs={setMohallahs}  currentUser={currentUser} showToast={showToast} canAdd={canAdd} canEdit={canEdit} canDelete={canDelete} />}
      {activeTab === 'sub-mohalla'     && <SubMohallaTab     subMohallahs={subMohallahs} setSubMohallahs={setSubMohallahs} mohallahs={mohallahs} currentUser={currentUser} showToast={showToast} canAdd={canAdd} canEdit={canEdit} canDelete={canDelete} />}
      {activeTab === 'incharge-master' && <InchargeMasterTab incharges={incharges}   setIncharges={setIncharges}   currentUser={currentUser} showToast={showToast} canAdd={canAdd} canEdit={canEdit} canDelete={canDelete} />}
      {activeTab === 'assign-incharge' && <AssignInchargeTab assignments={assignments} setAssignments={setAssignments} mohallahs={mohallahs} subMohallahs={subMohallahs} incharges={incharges} currentUser={currentUser} showToast={showToast} canAdd={canAdd} canEdit={canEdit} canDelete={canDelete} />}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// Tab 1 — Mohalla Master
// ══════════════════════════════════════════════════════════════════════════════

const BLANK_MOHALLA: Omit<Mohallah, 'id'> = {
  name: '', code: '', sectorInchargeName: '', sectorInchargeIts: '', inchargeMobile: '', notes: '', colorTag: 'emerald',
};

const MohallaMasterTab: React.FC<{
  mohallahs: Mohallah[]; setMohallahs: (v: Mohallah[]) => void;
  currentUser: UserProfile; showToast: (m: string) => void;
  canAdd: boolean; canEdit: boolean; canDelete: boolean;
}> = ({ mohallahs, setMohallahs, currentUser, showToast, canAdd, canEdit, canDelete }) => {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(BLANK_MOHALLA);

  const filtered = useMemo(() =>
    mohallahs.filter(m => !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.code.toLowerCase().includes(search.toLowerCase())),
    [mohallahs, search]);

  const openAdd = () => { setEditId(null); setForm({ ...BLANK_MOHALLA }); setShowModal(true); };
  const openEdit = (m: Mohallah) => { setEditId(m.id); setForm({ name: m.name, code: m.code, sectorInchargeName: m.sectorInchargeName, sectorInchargeIts: m.sectorInchargeIts, inchargeMobile: m.inchargeMobile, notes: m.notes || '', colorTag: m.colorTag || 'emerald' }); setShowModal(true); };

  const handleDelete = (m: Mohallah) => {
    if (!window.confirm(`Delete Mohalla "${m.name}"?`)) return;
    const updated = mohallahs.filter(x => x.id !== m.id);
    setMohallahs(updated); saveStoredMohallahs(updated);
    appendActivityLog(currentUser.username, 'Member & Area Master', 'Mohalla Master', 'DELETE', `Deleted Mohalla: ${m.name}`);
    showToast(`Mohalla "${m.name}" deleted.`);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.code.trim()) { showToast('Name and Code are required.'); return; }
    const now = new Date().toLocaleDateString();
    const rec: Mohallah = { id: editId || `MOH-${Date.now()}`, ...form };
    const updated = editId ? mohallahs.map(m => m.id === editId ? rec : m) : [rec, ...mohallahs];
    setMohallahs(updated); saveStoredMohallahs(updated);
    appendActivityLog(currentUser.username, 'Member & Area Master', 'Mohalla Master', editId ? 'EDIT' : 'ADD', `${editId ? 'Updated' : 'Added'} Mohalla: ${rec.name} (${rec.code})`);
    showToast(`Mohalla "${rec.name}" ${editId ? 'updated' : 'added'}.`);
    setShowModal(false);
  };

  return (
    <div className="bg-white border border-amber-200/60 rounded-xl shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3 items-center justify-between">
        <div className="relative flex-1 max-w-xs min-w-[180px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search Mohalla..."
            className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300/50 bg-slate-50" />
        </div>
        {canAdd && <button type="button" onClick={openAdd} className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-black text-slate-950 bg-amber-400 hover:bg-amber-500 rounded-lg transition-all shadow-sm cursor-pointer min-h-[36px]"><Plus className="w-3.5 h-3.5" />Add Mohalla</button>}
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-slate-100">
        {[['Total Sectors', mohallahs.length], ['Active Incharges', mohallahs.filter(m => m.sectorInchargeName).length], ['Unassigned', mohallahs.filter(m => !m.sectorInchargeName).length], ['Total HOFs', '—']].map(([label, val]) => (
          <div key={label as string} className="px-4 py-3 border-r border-slate-100 last:border-r-0 text-center">
            <p className="text-[11px] text-slate-500">{label}</p>
            <p className="text-xl font-black text-slate-900">{val}</p>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto">
        {filtered.length === 0 ? (
          <div className="p-10 text-center"><MapPin className="w-10 h-10 text-amber-200 mx-auto mb-3" /><p className="text-sm font-semibold text-slate-600">No Mohallahs found</p></div>
        ) : (
          <table className="w-full text-xs">
            <thead><tr className="border-b border-slate-100 bg-slate-50/80">
              <th className="px-4 py-2.5 text-left font-bold text-slate-600">Mohalla / Sector</th>
              <th className="px-4 py-2.5 text-left font-bold text-slate-600">Code</th>
              <th className="px-4 py-2.5 text-left font-bold text-slate-600">Incharge</th>
              <th className="px-4 py-2.5 text-left font-bold text-slate-600 hidden sm:table-cell">Mobile</th>
              <th className="px-4 py-2.5 text-left font-bold text-slate-600 hidden md:table-cell">Notes</th>
              <th className="px-4 py-2.5 text-center font-bold text-slate-600">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(m => (
                <tr key={m.id} className="hover:bg-amber-50/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${COLOR_TAG_MAP[m.colorTag || 'emerald'] || 'bg-slate-400'}`} />
                      <span className="font-semibold text-slate-900">{m.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-amber-700 bg-amber-50/50 whitespace-nowrap">{m.code}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-800">{m.sectorInchargeName || '—'}</p>
                    {m.sectorInchargeIts && <p className="text-slate-400 font-mono">ITS: {m.sectorInchargeIts}</p>}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-600 hidden sm:table-cell">{m.inchargeMobile || '—'}</td>
                  <td className="px-4 py-3 text-slate-500 max-w-[180px] truncate hidden md:table-cell">{m.notes || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      {canEdit && <button type="button" onClick={() => openEdit(m)} className="p-1.5 hover:text-amber-700 hover:bg-amber-50 rounded-md cursor-pointer transition-colors"><Edit className="w-3.5 h-3.5" /></button>}
                      {canDelete && <button type="button" onClick={() => handleDelete(m)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md cursor-pointer transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900">{editId ? '✏️ Edit Mohalla' : '➕ Add New Mohalla'}</h3>
              <button type="button" onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"><X className="w-4 h-4 text-slate-500" /></button>
            </div>
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  ['Mohalla Name *', 'name', 'text', 'e.g., Saifee Mohallah'],
                  ['Sector Code *', 'code', 'text', 'e.g., SEC-A'],
                  ['Incharge Name', 'sectorInchargeName', 'text', 'Full name of sector incharge'],
                  ['Incharge ITS', 'sectorInchargeIts', 'text', '8-digit ITS number'],
                  ['Incharge Mobile', 'inchargeMobile', 'text', '10-digit mobile'],
                ].map(([label, field, type, placeholder]) => (
                  <div key={field as string} className={field === 'name' ? 'sm:col-span-2' : ''}>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">{label}</label>
                    <input type={type as string} value={(form as any)[field as string]} onChange={e => setForm(f => ({ ...f, [field as string]: e.target.value }))}
                      placeholder={placeholder as string} className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-300/50" />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Color Tag</label>
                  <div className="flex gap-2">
                    {COLOR_OPTIONS.map(c => (
                      <button key={c} type="button" onClick={() => setForm(f => ({ ...f, colorTag: c }))}
                        className={`w-6 h-6 rounded-full ${COLOR_TAG_MAP[c]} cursor-pointer transition-all ${form.colorTag === c ? 'ring-2 ring-offset-2 ring-slate-900 scale-110' : 'opacity-60 hover:opacity-100'}`} />
                    ))}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Notes</label>
                  <textarea rows={2} value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Optional notes..." className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-300/50 resize-none" />
                </div>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer">Cancel</button>
              <button type="button" onClick={handleSave} className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-black text-slate-950 bg-amber-400 hover:bg-amber-500 rounded-lg cursor-pointer shadow-sm">
                <Save className="w-3.5 h-3.5" />{editId ? 'Update' : 'Save Mohalla'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// Tab 2 — Sub Mohalla
// ══════════════════════════════════════════════════════════════════════════════

const SubMohallaTab: React.FC<{
  subMohallahs: SubMohallah[]; setSubMohallahs: (v: SubMohallah[]) => void;
  mohallahs: Mohallah[]; currentUser: UserProfile; showToast: (m: string) => void;
  canAdd: boolean; canEdit: boolean; canDelete: boolean;
}> = ({ subMohallahs, setSubMohallahs, mohallahs, currentUser, showToast, canAdd, canEdit, canDelete }) => {
  const [search, setSearch] = useState('');
  const [filterMohalla, setFilterMohalla] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<SubMohallah, 'id' | 'createdAt' | 'updatedAt'>>({
    mohallaId: '', mohallaName: '', name: '', code: '', description: '', totalFamilies: 0, notes: '',
  });

  const filtered = useMemo(() =>
    subMohallahs.filter(s => {
      const q = search.toLowerCase();
      return (!q || s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q))
        && (filterMohalla === 'all' || s.mohallaId === filterMohalla);
    }), [subMohallahs, search, filterMohalla]);

  const openAdd = () => { setEditId(null); setForm({ mohallaId: mohallahs[0]?.id || '', mohallaName: mohallahs[0]?.name || '', name: '', code: '', description: '', totalFamilies: 0, notes: '' }); setShowModal(true); };
  const openEdit = (s: SubMohallah) => { setEditId(s.id); setForm({ mohallaId: s.mohallaId, mohallaName: s.mohallaName, name: s.name, code: s.code, description: s.description || '', totalFamilies: s.totalFamilies, notes: s.notes || '' }); setShowModal(true); };

  const handleDelete = (s: SubMohallah) => {
    if (!window.confirm(`Delete Sub-Mohalla "${s.name}"?`)) return;
    const updated = subMohallahs.filter(x => x.id !== s.id);
    setSubMohallahs(updated); saveStoredSubMohallahs(updated);
    showToast(`Sub-Mohalla "${s.name}" deleted.`);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.mohallaId) { showToast('Name and Parent Mohalla are required.'); return; }
    const now = new Date().toLocaleDateString();
    const parent = mohallahs.find(m => m.id === form.mohallaId);
    const rec: SubMohallah = { id: editId || generateMohallaId('sub'), ...form, mohallaName: parent?.name || form.mohallaName, createdAt: now, updatedAt: now };
    const updated = editId ? subMohallahs.map(s => s.id === editId ? rec : s) : [rec, ...subMohallahs];
    setSubMohallahs(updated); saveStoredSubMohallahs(updated);
    showToast(`Sub-Mohalla "${rec.name}" ${editId ? 'updated' : 'added'}.`);
    setShowModal(false);
  };

  const handleMohallaChange = (id: string) => {
    const parent = mohallahs.find(m => m.id === id);
    setForm(f => ({ ...f, mohallaId: id, mohallaName: parent?.name || '' }));
  };

  return (
    <div className="bg-white border border-amber-200/60 rounded-xl shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center flex-1 min-w-0">
          <div className="relative flex-1 max-w-xs min-w-[160px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search sub-mohalla..."
              className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300/50 bg-slate-50" />
          </div>
          <select value={filterMohalla} onChange={e => setFilterMohalla(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-300/50 cursor-pointer">
            <option value="all">All Mohallahs</option>
            {mohallahs.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        {canAdd && <button type="button" onClick={openAdd} className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-black text-slate-950 bg-amber-400 hover:bg-amber-500 rounded-lg transition-all shadow-sm cursor-pointer min-h-[36px]"><Plus className="w-3.5 h-3.5" />Add Sub Mohalla</button>}
      </div>

      <div className="overflow-x-auto">
        {filtered.length === 0 ? (
          <div className="p-10 text-center"><Layers className="w-10 h-10 text-amber-200 mx-auto mb-3" /><p className="text-sm font-semibold text-slate-600">No Sub-Mohallahs found</p></div>
        ) : (
          <table className="w-full text-xs">
            <thead><tr className="border-b border-slate-100 bg-slate-50/80">
              <th className="px-4 py-2.5 text-left font-bold text-slate-600">Sub-Mohalla</th>
              <th className="px-4 py-2.5 text-left font-bold text-slate-600">Code</th>
              <th className="px-4 py-2.5 text-left font-bold text-slate-600">Parent Mohalla</th>
              <th className="px-4 py-2.5 text-left font-bold text-slate-600 hidden sm:table-cell">Families</th>
              <th className="px-4 py-2.5 text-left font-bold text-slate-600 hidden md:table-cell">Description</th>
              <th className="px-4 py-2.5 text-center font-bold text-slate-600">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(s => (
                <tr key={s.id} className="hover:bg-amber-50/40 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-900">{s.name}</td>
                  <td className="px-4 py-3 font-mono font-bold text-amber-700">{s.code}</td>
                  <td className="px-4 py-3 text-slate-600 max-w-[160px] truncate">{s.mohallaName}</td>
                  <td className="px-4 py-3 text-center font-bold text-slate-800 hidden sm:table-cell">{s.totalFamilies}</td>
                  <td className="px-4 py-3 text-slate-500 max-w-[160px] truncate hidden md:table-cell">{s.description || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      {canEdit && <button type="button" onClick={() => openEdit(s)} className="p-1.5 hover:text-amber-700 hover:bg-amber-50 rounded-md cursor-pointer"><Edit className="w-3.5 h-3.5" /></button>}
                      {canDelete && <button type="button" onClick={() => handleDelete(s)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900">{editId ? '✏️ Edit Sub-Mohalla' : '➕ Add Sub-Mohalla'}</h3>
              <button type="button" onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"><X className="w-4 h-4 text-slate-500" /></button>
            </div>
            <div className="p-5 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Parent Mohalla *</label>
                  <select value={form.mohallaId} onChange={e => handleMohallaChange(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-300/50 cursor-pointer">
                    {mohallahs.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                {[['Sub-Mohalla Name *', 'name', 'text', 'e.g., Saifee Block A1'], ['Code *', 'code', 'text', 'e.g., SEC-A1']].map(([label, field, type, placeholder]) => (
                  <div key={field as string}>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">{label}</label>
                    <input type={type as string} value={(form as any)[field as string]} onChange={e => setForm(f => ({ ...f, [field as string]: e.target.value }))}
                      placeholder={placeholder as string} className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-300/50" />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Total Families</label>
                  <input type="number" value={form.totalFamilies} onChange={e => setForm(f => ({ ...f, totalFamilies: parseInt(e.target.value) || 0 }))}
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-300/50" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Description</label>
                  <textarea rows={2} value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Brief description of this sub-zone..." className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-300/50 resize-none" />
                </div>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer">Cancel</button>
              <button type="button" onClick={handleSave} className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-black text-slate-950 bg-amber-400 hover:bg-amber-500 rounded-lg cursor-pointer shadow-sm">
                <Save className="w-3.5 h-3.5" />{editId ? 'Update' : 'Save Sub-Mohalla'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// Tab 3 — Incharge Master
// ══════════════════════════════════════════════════════════════════════════════

const InchargeMasterTab: React.FC<{
  incharges: MohallaIncharge[]; setIncharges: (v: MohallaIncharge[]) => void;
  currentUser: UserProfile; showToast: (m: string) => void;
  canAdd: boolean; canEdit: boolean; canDelete: boolean;
}> = ({ incharges, setIncharges, currentUser, showToast, canAdd, canEdit, canDelete }) => {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<MohallaIncharge, 'id' | 'createdAt' | 'updatedAt'>>({
    itsNumber: '', fullName: '', mobileNumber: '', whatsappNumber: '', designation: 'Sector Incharge', email: '', notes: '', isActive: true,
  });

  const filtered = useMemo(() =>
    incharges.filter(i => !search || i.fullName.toLowerCase().includes(search.toLowerCase()) || i.itsNumber.includes(search) || i.designation.toLowerCase().includes(search.toLowerCase())),
    [incharges, search]);

  const openAdd = () => { setEditId(null); setForm({ itsNumber: '', fullName: '', mobileNumber: '', whatsappNumber: '', designation: 'Sector Incharge', email: '', notes: '', isActive: true }); setShowModal(true); };
  const openEdit = (i: MohallaIncharge) => { setEditId(i.id); setForm({ itsNumber: i.itsNumber, fullName: i.fullName, mobileNumber: i.mobileNumber, whatsappNumber: i.whatsappNumber || '', designation: i.designation, email: i.email || '', notes: i.notes || '', isActive: i.isActive }); setShowModal(true); };

  const handleDelete = (i: MohallaIncharge) => {
    if (!window.confirm(`Delete Incharge "${i.fullName}"?`)) return;
    const updated = incharges.filter(x => x.id !== i.id);
    setIncharges(updated); saveStoredIncharges(updated);
    showToast(`Incharge "${i.fullName}" deleted.`);
  };

  const handleSave = () => {
    if (!form.fullName.trim() || !form.itsNumber.trim()) { showToast('Name and ITS are required.'); return; }
    const now = new Date().toLocaleDateString();
    const rec: MohallaIncharge = { id: editId || generateMohallaId('inc'), ...form, createdAt: now, updatedAt: now };
    const updated = editId ? incharges.map(i => i.id === editId ? rec : i) : [rec, ...incharges];
    setIncharges(updated); saveStoredIncharges(updated);
    showToast(`Incharge "${rec.fullName}" ${editId ? 'updated' : 'added'}.`);
    setShowModal(false);
  };

  return (
    <div className="bg-white border border-amber-200/60 rounded-xl shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3 items-center justify-between">
        <div className="relative flex-1 max-w-xs min-w-[180px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search incharges..."
            className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300/50 bg-slate-50" />
        </div>
        {canAdd && <button type="button" onClick={openAdd} className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-black text-slate-950 bg-amber-400 hover:bg-amber-500 rounded-lg transition-all shadow-sm cursor-pointer min-h-[36px]"><Plus className="w-3.5 h-3.5" />Add Incharge</button>}
      </div>

      <div className="overflow-x-auto">
        {filtered.length === 0 ? (
          <div className="p-10 text-center"><UserCheck className="w-10 h-10 text-amber-200 mx-auto mb-3" /><p className="text-sm font-semibold text-slate-600">No Incharges found</p></div>
        ) : (
          <table className="w-full text-xs">
            <thead><tr className="border-b border-slate-100 bg-slate-50/80">
              <th className="px-4 py-2.5 text-left font-bold text-slate-600">Name</th>
              <th className="px-4 py-2.5 text-left font-bold text-slate-600 hidden sm:table-cell">ITS</th>
              <th className="px-4 py-2.5 text-left font-bold text-slate-600">Designation</th>
              <th className="px-4 py-2.5 text-left font-bold text-slate-600 hidden md:table-cell">Mobile</th>
              <th className="px-4 py-2.5 text-center font-bold text-slate-600">Status</th>
              <th className="px-4 py-2.5 text-center font-bold text-slate-600">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(i => (
                <tr key={i.id} className="hover:bg-amber-50/40 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">{i.fullName}</p>
                    {i.email && <p className="text-slate-400 text-[10px]">{i.email}</p>}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-600 hidden sm:table-cell">{i.itsNumber}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">{i.designation}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-600 hidden md:table-cell">{i.mobileNumber}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${i.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                      {i.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      {canEdit && <button type="button" onClick={() => openEdit(i)} className="p-1.5 hover:text-amber-700 hover:bg-amber-50 rounded-md cursor-pointer"><Edit className="w-3.5 h-3.5" /></button>}
                      {canDelete && <button type="button" onClick={() => handleDelete(i)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900">{editId ? '✏️ Edit Incharge' : '➕ Add Incharge'}</h3>
              <button type="button" onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"><X className="w-4 h-4 text-slate-500" /></button>
            </div>
            <div className="p-5 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  ['sm:col-span-2', 'Full Name *', 'fullName', 'text', 'Full name of the incharge'],
                  ['', 'ITS Number *', 'itsNumber', 'text', '8-digit ITS'],
                  ['', 'Mobile Number', 'mobileNumber', 'text', '10-digit mobile'],
                  ['', 'WhatsApp Number', 'whatsappNumber', 'text', 'WhatsApp number'],
                  ['', 'Email', 'email', 'email', 'official@email.com'],
                ].map(([span, label, field, type, placeholder]) => (
                  <div key={field as string} className={span as string}>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">{label}</label>
                    <input type={type as string} value={(form as any)[field as string]} onChange={e => setForm(f => ({ ...f, [field as string]: e.target.value }))}
                      placeholder={placeholder as string} className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-300/50" />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Designation</label>
                  <select value={form.designation} onChange={e => setForm(f => ({ ...f, designation: e.target.value }))}
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-300/50 cursor-pointer">
                    {INCHARGE_DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-3">
                  <input type="checkbox" id="isActive" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="w-4 h-4 accent-amber-500 cursor-pointer" />
                  <label htmlFor="isActive" className="text-xs font-bold text-slate-700 cursor-pointer">Active Incharge</label>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Notes</label>
                  <textarea rows={2} value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Additional notes..." className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-300/50 resize-none" />
                </div>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer">Cancel</button>
              <button type="button" onClick={handleSave} className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-black text-slate-950 bg-amber-400 hover:bg-amber-500 rounded-lg cursor-pointer shadow-sm">
                <Save className="w-3.5 h-3.5" />{editId ? 'Update' : 'Save Incharge'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// Tab 4 — Assign Incharge
// ══════════════════════════════════════════════════════════════════════════════

const AssignInchargeTab: React.FC<{
  assignments: MohallaAssignment[]; setAssignments: (v: MohallaAssignment[]) => void;
  mohallahs: Mohallah[]; subMohallahs: SubMohallah[]; incharges: MohallaIncharge[];
  currentUser: UserProfile; showToast: (m: string) => void;
  canAdd: boolean; canEdit: boolean; canDelete: boolean;
}> = ({ assignments, setAssignments, mohallahs, subMohallahs, incharges, currentUser, showToast, canAdd, canEdit, canDelete }) => {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<MohallaAssignment, 'id' | 'createdAt' | 'updatedAt'>>({
    mohallaId: '', mohallaName: '', subMohallaId: '', subMohallaName: '',
    inchargeId: '', inchargeName: '', inchargeIts: '', inchargeMobile: '',
    role: 'Primary', assignedFrom: '', assignedTo: '', isActive: true, notes: '', assignedBy: '',
  });

  const filtered = useMemo(() =>
    assignments.filter(a => !search || a.inchargeName.toLowerCase().includes(search.toLowerCase()) || a.mohallaName.toLowerCase().includes(search.toLowerCase())),
    [assignments, search]);

  const relevantSubs = subMohallahs.filter(s => s.mohallaId === form.mohallaId);

  const handleMohallaChange = (id: string) => {
    const m = mohallahs.find(x => x.id === id);
    setForm(f => ({ ...f, mohallaId: id, mohallaName: m?.name || '', subMohallaId: '', subMohallaName: '' }));
  };

  const handleSubMohallaChange = (id: string) => {
    const s = subMohallahs.find(x => x.id === id);
    setForm(f => ({ ...f, subMohallaId: id, subMohallaName: s?.name || '' }));
  };

  const handleInchargeChange = (id: string) => {
    const i = incharges.find(x => x.id === id);
    setForm(f => ({ ...f, inchargeId: id, inchargeName: i?.fullName || '', inchargeIts: i?.itsNumber || '', inchargeMobile: i?.mobileNumber || '' }));
  };

  const openAdd = () => {
    setEditId(null);
    setForm({ mohallaId: mohallahs[0]?.id || '', mohallaName: mohallahs[0]?.name || '', subMohallaId: '', subMohallaName: '', inchargeId: incharges[0]?.id || '', inchargeName: incharges[0]?.fullName || '', inchargeIts: incharges[0]?.itsNumber || '', inchargeMobile: incharges[0]?.mobileNumber || '', role: 'Primary', assignedFrom: new Date().toISOString().split('T')[0], assignedTo: '', isActive: true, notes: '', assignedBy: currentUser.username });
    setShowModal(true);
  };

  const openEdit = (a: MohallaAssignment) => {
    setEditId(a.id);
    setForm({ mohallaId: a.mohallaId, mohallaName: a.mohallaName, subMohallaId: a.subMohallaId || '', subMohallaName: a.subMohallaName || '', inchargeId: a.inchargeId, inchargeName: a.inchargeName, inchargeIts: a.inchargeIts, inchargeMobile: a.inchargeMobile, role: a.role, assignedFrom: a.assignedFrom, assignedTo: a.assignedTo || '', isActive: a.isActive, notes: a.notes || '', assignedBy: a.assignedBy });
    setShowModal(true);
  };

  const handleDelete = (a: MohallaAssignment) => {
    if (!window.confirm(`Remove assignment for "${a.inchargeName}"?`)) return;
    const updated = assignments.filter(x => x.id !== a.id);
    setAssignments(updated); saveStoredMohallaAssignments(updated);
    showToast('Assignment removed.');
  };

  const handleSave = () => {
    if (!form.mohallaId || !form.inchargeId) { showToast('Mohalla and Incharge are required.'); return; }
    const now = new Date().toLocaleDateString();
    const rec: MohallaAssignment = { id: editId || generateMohallaId('asgn'), ...form, assignedBy: currentUser.username, createdAt: now, updatedAt: now };
    const updated = editId ? assignments.map(a => a.id === editId ? rec : a) : [rec, ...assignments];
    setAssignments(updated); saveStoredMohallaAssignments(updated);
    appendActivityLog(currentUser.username, 'Member & Area Master', 'Assign Incharge', editId ? 'EDIT' : 'ADD', `${editId ? 'Updated' : 'Assigned'} ${rec.inchargeName} as ${rec.role} Incharge of ${rec.mohallaName}`);
    showToast(`Assignment ${editId ? 'updated' : 'saved'} successfully.`);
    setShowModal(false);
  };

  const ROLE_COLORS = { Primary: 'bg-amber-100 text-amber-800', Secondary: 'bg-blue-100 text-blue-800', Backup: 'bg-slate-100 text-slate-700' };

  return (
    <div className="bg-white border border-amber-200/60 rounded-xl shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3 items-center justify-between">
        <div className="relative flex-1 max-w-xs min-w-[180px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search assignments..."
            className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300/50 bg-slate-50" />
        </div>
        {canAdd && <button type="button" onClick={openAdd} className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-black text-slate-950 bg-amber-400 hover:bg-amber-500 rounded-lg transition-all shadow-sm cursor-pointer min-h-[36px]"><UserPlus className="w-3.5 h-3.5" />Assign Incharge</button>}
      </div>

      <div className="overflow-x-auto">
        {filtered.length === 0 ? (
          <div className="p-10 text-center"><ArrowRightLeft className="w-10 h-10 text-amber-200 mx-auto mb-3" /><p className="text-sm font-semibold text-slate-600">No assignments found</p></div>
        ) : (
          <table className="w-full text-xs">
            <thead><tr className="border-b border-slate-100 bg-slate-50/80">
              <th className="px-4 py-2.5 text-left font-bold text-slate-600">Incharge</th>
              <th className="px-4 py-2.5 text-left font-bold text-slate-600">Mohalla</th>
              <th className="px-4 py-2.5 text-left font-bold text-slate-600 hidden sm:table-cell">Sub-Mohalla</th>
              <th className="px-4 py-2.5 text-center font-bold text-slate-600">Role</th>
              <th className="px-4 py-2.5 text-center font-bold text-slate-600 hidden md:table-cell">From</th>
              <th className="px-4 py-2.5 text-center font-bold text-slate-600">Status</th>
              <th className="px-4 py-2.5 text-center font-bold text-slate-600">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(a => (
                <tr key={a.id} className="hover:bg-amber-50/40 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">{a.inchargeName}</p>
                    <p className="text-slate-400 font-mono text-[10px]">ITS: {a.inchargeIts}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-700 max-w-[140px] truncate">{a.mohallaName}</td>
                  <td className="px-4 py-3 text-slate-500 max-w-[120px] truncate hidden sm:table-cell">{a.subMohallaName || '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${ROLE_COLORS[a.role]}`}>{a.role}</span>
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-slate-500 hidden md:table-cell">{a.assignedFrom}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${a.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                      {a.isActive ? 'Active' : 'Ended'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      {canEdit && <button type="button" onClick={() => openEdit(a)} className="p-1.5 hover:text-amber-700 hover:bg-amber-50 rounded-md cursor-pointer"><Edit className="w-3.5 h-3.5" /></button>}
                      {canDelete && <button type="button" onClick={() => handleDelete(a)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900">{editId ? '✏️ Edit Assignment' : '➕ Assign Incharge'}</h3>
              <button type="button" onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"><X className="w-4 h-4 text-slate-500" /></button>
            </div>
            <div className="p-5 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Select Mohalla *</label>
                  <select value={form.mohallaId} onChange={e => handleMohallaChange(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-300/50 cursor-pointer">
                    {mohallahs.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Sub-Mohalla (Optional)</label>
                  <select value={form.subMohallaId} onChange={e => handleSubMohallaChange(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-300/50 cursor-pointer">
                    <option value="">— None —</option>
                    {relevantSubs.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Select Incharge *</label>
                  <select value={form.inchargeId} onChange={e => handleInchargeChange(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-300/50 cursor-pointer">
                    {incharges.filter(i => i.isActive).map(i => <option key={i.id} value={i.id}>{i.fullName} — {i.designation}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Role</label>
                  <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as any }))}
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-300/50 cursor-pointer">
                    {ASSIGNMENT_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Assigned From</label>
                  <input type="date" value={form.assignedFrom} onChange={e => setForm(f => ({ ...f, assignedFrom: e.target.value }))}
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-300/50" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Assigned To (Optional)</label>
                  <input type="date" value={form.assignedTo || ''} onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value || undefined }))}
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-300/50" />
                </div>
                <div className="flex items-center gap-2 pt-3">
                  <input type="checkbox" id="asgn-active" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="w-4 h-4 accent-amber-500 cursor-pointer" />
                  <label htmlFor="asgn-active" className="text-xs font-bold text-slate-700 cursor-pointer">Active Assignment</label>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Notes</label>
                  <textarea rows={2} value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Assignment notes..." className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-300/50 resize-none" />
                </div>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer">Cancel</button>
              <button type="button" onClick={handleSave} className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-black text-slate-950 bg-amber-400 hover:bg-amber-500 rounded-lg cursor-pointer shadow-sm">
                <Save className="w-3.5 h-3.5" />{editId ? 'Update' : 'Save Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
