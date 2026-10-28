import React, { useState } from 'react';
import {
  RefreshCw, Search, CheckCircle2, AlertCircle, Save, Layers, Hash,
  User, ShieldCheck, Calendar, ArrowRight, History, Clock
} from 'lucide-react';
import { SabeelLedgerRecord, HeadOfFamily, UserProfile } from '../../types';
import {
  SabeelGradeRecord, GradeChangeHistoryRecord, SabeelNumberChangeRecord,
  saveGradeChangeHistory, getGradeChangeHistory, saveStoredSabeelLedger,
  getGradeForAmount
} from '../../utils/sabeelProductionSuite';

interface SabeelGradeNumberChangeSubpageProps {
  ledger: SabeelLedgerRecord[];
  setLedger: React.Dispatch<React.SetStateAction<SabeelLedgerRecord[]>>;
  sabeelGrades: SabeelGradeRecord[];
  gradeHistory: GradeChangeHistoryRecord[];
  setGradeHistory: React.Dispatch<React.SetStateAction<GradeChangeHistoryRecord[]>>;
  hofs: HeadOfFamily[];
  currentUser: UserProfile;
  showToast: (msg: string) => void;
}

const fmtINR = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export const SabeelGradeNumberChangeSubpage: React.FC<SabeelGradeNumberChangeSubpageProps> = ({
  ledger,
  setLedger,
  sabeelGrades,
  gradeHistory,
  setGradeHistory,
  hofs,
  currentUser,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<'grade_change' | 'number_change'>('grade_change');

  // Search state for Grade Change
  const [gradeSearchQuery, setGradeSearchQuery] = useState('');
  const [selectedMemberForGrade, setSelectedMemberForGrade] = useState<SabeelLedgerRecord | null>(null);
  const [newGrade, setNewGrade] = useState('Grade A');
  const [newPledgeAmount, setNewPledgeAmount] = useState<number>(36000);
  const [gradeChangeDate, setGradeChangeDate] = useState(new Date().toISOString().split('T')[0]);
  const [gradeChangeReason, setGradeChangeReason] = useState('');
  const [gradeAuthorizedBy, setGradeAuthorizedBy] = useState('Janab Amil Saheb');

  // Search state for Number Change
  const [numberSearchQuery, setNumberSearchQuery] = useState('');
  const [selectedMemberForNumber, setSelectedMemberForNumber] = useState<SabeelLedgerRecord | null>(null);
  const [newSabeelNo, setNewSabeelNo] = useState('');
  const [numberChangeDate, setNumberChangeDate] = useState(new Date().toISOString().split('T')[0]);
  const [numberChangeReason, setNumberChangeReason] = useState('');
  const [numberAuthorizedBy, setNumberAuthorizedBy] = useState('Secretary Saheb');

  // Search Member for Grade Change
  const handleSearchGradeMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradeSearchQuery.trim()) return;
    const q = gradeSearchQuery.trim().toLowerCase();
    const found = ledger.find(
      r =>
        (r.itsNumber || '').toLowerCase() === q ||
        (r.sabeelNumber || r.sabeelNo || '').toLowerCase() === q
    );
    if (found) {
      setSelectedMemberForGrade(found);
      const currGrade = found.grade || getGradeForAmount(found.annualPledged || 24000);
      setNewGrade(currGrade);
      setNewPledgeAmount(found.annualPledged || found.totalAllocated || 24000);
      showToast(`Selected member: ${found.hofName || found.memberName}`);
    } else {
      setSelectedMemberForGrade(null);
      showToast('No member found with that ITS or Sabeel No');
    }
  };

  // Search Member for Number Change
  const handleSearchNumberMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!numberSearchQuery.trim()) return;
    const q = numberSearchQuery.trim().toLowerCase();
    const found = ledger.find(
      r =>
        (r.itsNumber || '').toLowerCase() === q ||
        (r.sabeelNumber || r.sabeelNo || '').toLowerCase() === q
    );
    if (found) {
      setSelectedMemberForNumber(found);
      setNewSabeelNo('');
      showToast(`Selected member: ${found.hofName || found.memberName}`);
    } else {
      setSelectedMemberForNumber(null);
      showToast('No member found with that ITS or Sabeel No');
    }
  };

  // Execute Grade Change
  const handleSaveGradeChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberForGrade) return;
    if (!gradeChangeReason.trim()) {
      showToast('Please provide a reason for the grade change');
      return;
    }

    const oldGrade = selectedMemberForGrade.grade || getGradeForAmount(selectedMemberForGrade.annualPledged || 24000);
    const updatedLedger = ledger.map(r =>
      r.id === selectedMemberForGrade.id || r.itsNumber === selectedMemberForGrade.itsNumber
        ? {
            ...r,
            grade: newGrade,
            annualPledged: Number(newPledgeAmount),
            totalAllocated: Number(newPledgeAmount),
          }
        : r
    );

    const historyEntry: GradeChangeHistoryRecord = {
      id: `GCH-${Date.now().toString().slice(-4)}`,
      itsNumber: selectedMemberForGrade.itsNumber,
      fullName: selectedMemberForGrade.hofName || selectedMemberForGrade.memberName || '—',
      sabeelNo: selectedMemberForGrade.sabeelNumber || selectedMemberForGrade.sabeelNo || '—',
      oldGrade,
      newGrade,
      changeDate: gradeChangeDate,
      reason: gradeChangeReason.trim(),
      authorizedBy: gradeAuthorizedBy,
      createdAt: new Date().toLocaleString(),
    };

    const updatedHistory = [historyEntry, ...gradeHistory];
    setLedger(updatedLedger);
    saveStoredSabeelLedger(updatedLedger);
    setGradeHistory(updatedHistory);
    saveGradeChangeHistory(updatedHistory);

    showToast(`Grade successfully changed to ${newGrade} for ${selectedMemberForGrade.hofName || selectedMemberForGrade.memberName}`);
    setSelectedMemberForGrade(null);
    setGradeSearchQuery('');
    setGradeChangeReason('');
  };

  // Execute Number Change
  const handleSaveNumberChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberForNumber) return;
    if (!newSabeelNo.trim()) {
      showToast('Please provide the new Sabeel Number');
      return;
    }

    // Check uniqueness
    const exists = ledger.some(
      r =>
        (r.sabeelNumber || r.sabeelNo || '').toLowerCase() === newSabeelNo.trim().toLowerCase() &&
        r.itsNumber !== selectedMemberForNumber.itsNumber
    );
    if (exists) {
      showToast(`Sabeel Number "${newSabeelNo}" is already assigned to another household!`);
      return;
    }

    const oldSabeel = selectedMemberForNumber.sabeelNumber || selectedMemberForNumber.sabeelNo || 'Unassigned';
    const updatedLedger = ledger.map(r =>
      r.id === selectedMemberForNumber.id || r.itsNumber === selectedMemberForNumber.itsNumber
        ? {
            ...r,
            sabeelNumber: newSabeelNo.trim(),
            sabeelNo: newSabeelNo.trim(),
          }
        : r
    );

    setLedger(updatedLedger);
    saveStoredSabeelLedger(updatedLedger);

    showToast(`Sabeel Number updated from ${oldSabeel} to ${newSabeelNo} for ${selectedMemberForNumber.hofName || selectedMemberForNumber.memberName}`);
    setSelectedMemberForNumber(null);
    setNumberSearchQuery('');
    setNewSabeelNo('');
    setNumberChangeReason('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-amber-600" />
              <span>Sabeel Grade Change & Sabeel Number Reassignment</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Authorized adjustment tools for household pledge grade upgrades/downgrades and permanent Sabeel number modifications.
            </p>
          </div>

          {/* Sub Tab Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('grade_change')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'grade_change'
                  ? 'bg-amber-400 text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>1. Grade Change</span>
            </button>
            <button
              onClick={() => setActiveTab('number_change')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'number_change'
                  ? 'bg-amber-400 text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Hash className="w-3.5 h-3.5" />
              <span>2. Change Sabeel No</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab 1: Grade Change Tool */}
      {activeTab === 'grade_change' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Member Search & Form */}
          <div className="lg:col-span-2 space-y-5">
            {/* Search Box */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <form onSubmit={handleSearchGradeMember} className="space-y-3">
                <label className="block text-xs font-bold text-slate-700">
                  Search Member by ITS Number or Sabeel No:
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Enter 8-digit ITS or Sabeel No (e.g. 40291844 or SB-015)..."
                      value={gradeSearchQuery}
                      onChange={e => setGradeSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-amber-500 font-bold"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Search className="w-4 h-4" />
                    <span>Search</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Change Form when member selected */}
            {selectedMemberForGrade ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
                <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold text-amber-700 uppercase bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Active Sabeel Account
                    </span>
                    <h2 className="text-base font-black text-slate-900 mt-1">
                      {selectedMemberForGrade.hofName || selectedMemberForGrade.memberName}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      ITS: <span className="font-bold text-slate-700">{selectedMemberForGrade.itsNumber}</span> • 
                      Sabeel No: <span className="font-bold text-blue-700">{selectedMemberForGrade.sabeelNumber || selectedMemberForGrade.sabeelNo || '—'}</span> • 
                      Mohallah: <span className="font-bold text-slate-700">{selectedMemberForGrade.mohallah || '—'}</span>
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Current Grade:</span>
                    <span className="text-sm font-black text-blue-800 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 inline-block mt-0.5">
                      {selectedMemberForGrade.grade || getGradeForAmount(selectedMemberForGrade.annualPledged || 24000)}
                    </span>
                    <div className="text-[11px] text-slate-600 font-medium mt-1">
                      Pledge: {fmtINR(selectedMemberForGrade.annualPledged || selectedMemberForGrade.totalAllocated || 24000)}
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSaveGradeChange} className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-600 font-bold mb-1">Select New Grade *</label>
                      <select
                        value={newGrade}
                        onChange={e => {
                          setNewGrade(e.target.value);
                          const gObj = sabeelGrades.find(g => g.gradeName === e.target.value);
                          if (gObj) setNewPledgeAmount(gObj.minAmount);
                        }}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 bg-white cursor-pointer font-bold text-slate-900"
                      >
                        {sabeelGrades.map(g => (
                          <option key={g.id} value={g.gradeName}>
                            {g.gradeName} ({fmtINR(g.minAmount)} - {fmtINR(g.maxAmount)})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-600 font-bold mb-1">New Annual Pledge Amount (₹) *</label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="500"
                        value={newPledgeAmount}
                        onChange={e => setNewPledgeAmount(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 font-black text-emerald-600 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-bold mb-1">Effective Change Date</label>
                      <input
                        type="date"
                        required
                        value={gradeChangeDate}
                        onChange={e => setGradeChangeDate(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-bold mb-1">Authorized By (Raza)</label>
                      <select
                        value={gradeAuthorizedBy}
                        onChange={e => setGradeAuthorizedBy(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 bg-white cursor-pointer font-medium"
                      >
                        <option value="Janab Amil Saheb">Janab Amil Saheb (Direct Raza)</option>
                        <option value="Secretary Saheb">Jamaat Secretary Saheb</option>
                        <option value="Treasurer Saheb">Treasurer / Maliyah Committee</option>
                        <option value="Executive Committee">Executive Jamaat Committee</option>
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-slate-600 font-bold mb-1">Reason for Grade Change *</label>
                      <textarea
                        rows={2}
                        required
                        placeholder="State reason (e.g. Annual income assessment upgrade, family expansion, retirement concession approved)..."
                        value={gradeChangeReason}
                        onChange={e => setGradeChangeReason(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 resize-none font-medium"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedMemberForGrade(null)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>Commit Grade Change</span>
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-xs">
                Search for a member above by ITS Number or Sabeel No to begin the Grade Change workflow.
              </div>
            )}
          </div>

          {/* Audit Feed */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-amber-600" />
                <span>Recent Grade Audits</span>
              </h2>
              <span className="text-[10px] text-slate-500 font-bold">{gradeHistory.length} logged</span>
            </div>

            <div className="divide-y divide-slate-100 overflow-y-auto max-h-[500px] p-3 text-xs">
              {gradeHistory.slice(0, 6).map(h => (
                <div key={h.id} className="p-3 hover:bg-slate-50 rounded-xl transition-colors space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{h.fullName}</span>
                    <span className="text-[10px] text-slate-400">{h.changeDate}</span>
                  </div>
                  <div className="text-[11px] text-slate-600 flex items-center gap-2">
                    <span>ITS: {h.itsNumber}</span>
                    <span>•</span>
                    <span className="font-semibold text-slate-500">{h.oldGrade}</span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                    <span className="font-bold text-emerald-700">{h.newGrade}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 italic">"{h.reason}"</div>
                  <div className="text-[10px] text-amber-800 font-bold">Raza: {h.authorizedBy}</div>
                </div>
              ))}
              {gradeHistory.length === 0 && (
                <div className="p-8 text-center text-slate-400">
                  No grade changes logged yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Change Sabeel Number Tool */}
      {activeTab === 'number_change' && (
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Search Box */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <form onSubmit={handleSearchNumberMember} className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">
                Search Member to Renumber Sabeel:
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Enter ITS Number or Current Sabeel No..."
                    value={numberSearchQuery}
                    onChange={e => setNumberSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-amber-500 font-bold"
                  />
                </div>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  <span>Search</span>
                </button>
              </div>
            </form>
          </div>

          {/* Number Change Form */}
          {selectedMemberForNumber ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
              <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-200 flex items-center justify-between text-xs">
                <div>
                  <div className="font-black text-slate-900 text-sm">
                    {selectedMemberForNumber.hofName || selectedMemberForNumber.memberName}
                  </div>
                  <div className="text-slate-600 mt-0.5">
                    ITS: <span className="font-bold">{selectedMemberForNumber.itsNumber}</span> • 
                    Mohallah: <span className="font-bold">{selectedMemberForNumber.mohallah || '—'}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Current Sabeel No:</span>
                  <span className="text-sm font-black text-slate-700 bg-white px-2.5 py-1 rounded border border-slate-200 inline-block mt-0.5">
                    {selectedMemberForNumber.sabeelNumber || selectedMemberForNumber.sabeelNo || 'None'}
                  </span>
                </div>
              </div>

              <form onSubmit={handleSaveNumberChange} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">New Sabeel Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SB-142"
                    value={newSabeelNo}
                    onChange={e => setNewSabeelNo(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 font-black text-blue-700 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Effective Date</label>
                    <input
                      type="date"
                      required
                      value={numberChangeDate}
                      onChange={e => setNumberChangeDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Authorized By</label>
                    <select
                      value={numberAuthorizedBy}
                      onChange={e => setNumberAuthorizedBy(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 bg-white cursor-pointer font-medium"
                    >
                      <option value="Secretary Saheb">Jamaat Secretary Saheb</option>
                      <option value="Janab Amil Saheb">Janab Amil Saheb</option>
                      <option value="Daftar Incharge">Daftar Incharge</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Reason for Renumbering</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Mohallah reallocation, family partition, clerical correction..."
                    value={numberChangeReason}
                    onChange={e => setNumberChangeReason(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 resize-none font-medium"
                  />
                </div>

                <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedMemberForNumber(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Assign New Sabeel Number</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-xs">
              Search for an active member above to reassign their Sabeel Number.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
