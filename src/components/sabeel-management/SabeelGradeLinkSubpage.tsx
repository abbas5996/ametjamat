import React, { useState } from 'react';
import {
  Layers, Plus, Trash2, CheckCircle2, XCircle, Link as LinkIcon, Unlink,
  Save, AlertCircle, Edit, X
} from 'lucide-react';
import {
  SabeelGradeRecord, SabeelGradeLinkRecord, SabeelTypeRecord,
  saveSabeelGrades, saveSabeelGradeLinks
} from '../../utils/sabeelProductionSuite';

interface SabeelGradeLinkSubpageProps {
  sabeelGrades: SabeelGradeRecord[];
  setSabeelGrades: React.Dispatch<React.SetStateAction<SabeelGradeRecord[]>>;
  gradeLinks: SabeelGradeLinkRecord[];
  setGradeLinks: React.Dispatch<React.SetStateAction<SabeelGradeLinkRecord[]>>;
  sabeelTypes: SabeelTypeRecord[];
  showToast: (msg: string) => void;
}

const fmtINR = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export const SabeelGradeLinkSubpage: React.FC<SabeelGradeLinkSubpageProps> = ({
  sabeelGrades,
  setSabeelGrades,
  gradeLinks,
  setGradeLinks,
  sabeelTypes,
  showToast,
}) => {
  // Linking form state
  const [selectedTypeId, setSelectedTypeId] = useState(sabeelTypes[0]?.id || '');
  const [selectedGradeId, setSelectedGradeId] = useState(sabeelGrades[0]?.id || '');
  const [suggestedAnnual, setSuggestedAnnual] = useState<number>(36000);

  // Grade Modal State
  const [gradeModalOpen, setGradeModalOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<SabeelGradeRecord | null>(null);
  const [gradeName, setGradeName] = useState('');
  const [minAmount, setMinAmount] = useState<number>(24000);
  const [maxAmount, setMaxAmount] = useState<number>(36000);
  const [suggestedMonthly, setSuggestedMonthly] = useState<number>(2000);
  const [gradeDescription, setGradeDescription] = useState('');

  const handleLinkGrade = (e: React.FormEvent) => {
    e.preventDefault();
    const typeObj = sabeelTypes.find(t => t.id === selectedTypeId);
    const gradeObj = sabeelGrades.find(g => g.id === selectedGradeId);

    if (!typeObj || !gradeObj) {
      showToast('Please select valid Sabeel Type and Grade');
      return;
    }

    const existing = gradeLinks.find(
      l => l.sabeelTypeId === selectedTypeId && l.gradeId === selectedGradeId
    );
    if (existing) {
      showToast('This Grade is already linked with the selected Sabeel Type');
      return;
    }

    const newLink: SabeelGradeLinkRecord = {
      id: `SGL-${Date.now().toString().slice(-4)}`,
      sabeelTypeId: typeObj.id,
      sabeelTypeName: typeObj.sabeelType,
      gradeId: gradeObj.id,
      gradeName: gradeObj.gradeName,
      suggestedAnnual: Number(suggestedAnnual),
      isActive: true,
    };

    const updated = [...gradeLinks, newLink];
    setGradeLinks(updated);
    saveSabeelGradeLinks(updated);
    showToast(`Linked ${gradeObj.gradeName} to ${typeObj.sabeelType}`);
  };

  const handleUnlink = (linkId: string) => {
    if (confirm('Are you sure you want to unlink this grade from the Sabeel type?')) {
      const updated = gradeLinks.filter(l => l.id !== linkId);
      setGradeLinks(updated);
      saveSabeelGradeLinks(updated);
      showToast('Grade unlinked successfully');
    }
  };

  const handleSaveGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradeName.trim()) {
      showToast('Please enter a grade name');
      return;
    }

    if (editingGrade) {
      const updated = sabeelGrades.map(g =>
        g.id === editingGrade.id
          ? {
              ...g,
              gradeName: gradeName.trim(),
              minAmount: Number(minAmount),
              maxAmount: Number(maxAmount),
              suggestedMonthly: Number(suggestedMonthly),
              description: gradeDescription.trim(),
            }
          : g
      );
      setSabeelGrades(updated);
      saveSabeelGrades(updated);
      showToast(`Updated Grade: ${gradeName}`);
    } else {
      const newGrade: SabeelGradeRecord = {
        id: `GRD-${Date.now().toString().slice(-4)}`,
        gradeName: gradeName.trim(),
        minAmount: Number(minAmount),
        maxAmount: Number(maxAmount),
        suggestedMonthly: Number(suggestedMonthly),
        description: gradeDescription.trim(),
        colorCode: '#2563EB',
        isActive: true,
      };
      const updated = [...sabeelGrades, newGrade];
      setSabeelGrades(updated);
      saveSabeelGrades(updated);
      showToast(`Added new Grade: ${gradeName}`);
    }

    setGradeModalOpen(false);
  };

  const openAddGrade = () => {
    setEditingGrade(null);
    setGradeName('');
    setMinAmount(24000);
    setMaxAmount(36000);
    setSuggestedMonthly(2000);
    setGradeDescription('');
    setGradeModalOpen(true);
  };

  const openEditGrade = (g: SabeelGradeRecord) => {
    setEditingGrade(g);
    setGradeName(g.gradeName);
    setMinAmount(g.minAmount);
    setMaxAmount(g.maxAmount);
    setSuggestedMonthly(g.suggestedMonthly);
    setGradeDescription(g.description);
    setGradeModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Grade Master Cards */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-600" />
              <span>Sabeel Grade Master & Tier Classification</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Standard assessment brackets for Mumineen families according to financial capacity and Dai al-Mutlaq guidelines.
            </p>
          </div>
          <button
            onClick={openAddGrade}
            className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Grade</span>
          </button>
        </div>

        {/* Grades Table */}
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-3">Grade</th>
                <th className="py-2.5 px-4 text-right">Annual Range (Min - Max)</th>
                <th className="py-2.5 px-4 text-right">Suggested Monthly</th>
                <th className="py-2.5 px-4">Description</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {sabeelGrades.map(g => (
                <tr key={g.id} className="hover:bg-amber-50/40 transition-colors">
                  <td className="py-2.5 px-3">
                    <span className="font-bold text-slate-900 px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 rounded">
                      {g.gradeName}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right font-black text-slate-900">
                    {fmtINR(g.minAmount)} – {fmtINR(g.maxAmount)}
                  </td>
                  <td className="py-2.5 px-4 text-right font-bold text-emerald-600">
                    {fmtINR(g.suggestedMonthly)} / mo
                  </td>
                  <td className="py-2.5 px-4 text-slate-500 max-w-sm truncate">{g.description}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      <CheckCircle2 className="w-3 h-3" /> Active
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={() => openEditGrade(g)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                      title="Edit Grade"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Link Sabeel Grade Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Link Form */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
            <LinkIcon className="w-4 h-4 text-amber-600" />
            <span>Link Grade with Sabeel Type</span>
          </h2>
          <p className="text-[11px] text-slate-500 mb-4">
            Map assessment tiers to specific Sabeel categories for automated pledge guidance.
          </p>

          <form onSubmit={handleLinkGrade} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-600 font-bold mb-1">Select Sabeel Type *</label>
              <select
                value={selectedTypeId}
                onChange={e => setSelectedTypeId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 bg-white cursor-pointer font-medium"
              >
                {sabeelTypes.map(t => (
                  <option key={t.id} value={t.id}>{t.sabeelType} ({t.type})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-bold mb-1">Select Sabeel Grade *</label>
              <select
                value={selectedGradeId}
                onChange={e => setSelectedGradeId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 bg-white cursor-pointer font-medium"
              >
                {sabeelGrades.map(g => (
                  <option key={g.id} value={g.id}>{g.gradeName} ({fmtINR(g.minAmount)} - {fmtINR(g.maxAmount)})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-bold mb-1">Suggested Annual Amount (₹)</label>
              <input
                type="number"
                required
                min="0"
                step="500"
                value={suggestedAnnual}
                onChange={e => setSuggestedAnnual(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 font-black text-slate-900"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <LinkIcon className="w-4 h-4" />
              <span>Link Grade with Type</span>
            </button>
          </form>
        </div>

        {/* Linked Grades Table */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-600" />
              <span>Active Sabeel Grade Mappings ({gradeLinks.length})</span>
            </h2>
            <span className="text-[11px] text-slate-500">Cross-referenced in Takhmeen allocation</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="py-2.5 px-4">Sabeel Type</th>
                  <th className="py-2.5 px-4">Grade</th>
                  <th className="py-2.5 px-4 text-right">Suggested Annual</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center">Unlink</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {gradeLinks.map(link => (
                  <tr key={link.id} className="hover:bg-amber-50/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{link.sabeelTypeName}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 rounded text-[10px] font-bold">
                        {link.gradeName}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-black text-emerald-600">
                      {fmtINR(link.suggestedAnnual)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold">
                        Linked
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => handleUnlink(link.id)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Unlink Grade"
                      >
                        <Unlink className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {gradeLinks.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No grade links created yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add / Edit Grade Modal */}
      {gradeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h2 className="text-sm font-bold text-slate-900">
                {editingGrade ? 'Edit Sabeel Grade' : 'Add New Sabeel Grade'}
              </h2>
              <button
                onClick={() => setGradeModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGrade} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Grade Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grade A+"
                  value={gradeName}
                  onChange={e => setGradeName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Min Annual (₹)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="1000"
                    value={minAmount}
                    onChange={e => setMinAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Max Annual (₹)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="1000"
                    value={maxAmount}
                    onChange={e => setMaxAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Suggested Monthly (₹)</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="500"
                  value={suggestedMonthly}
                  onChange={e => setSuggestedMonthly(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 font-semibold text-emerald-600"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Tier classification criteria..."
                  value={gradeDescription}
                  onChange={e => setGradeDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setGradeModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Grade</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
