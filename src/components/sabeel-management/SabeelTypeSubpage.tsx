import React, { useState } from 'react';
import {
  Tag, Plus, Edit, Trash2, CheckCircle2, XCircle, X, Save, Search, AlertCircle
} from 'lucide-react';
import { SabeelTypeRecord, saveSabeelTypes } from '../../utils/sabeelProductionSuite';

interface SabeelTypeSubpageProps {
  sabeelTypes: SabeelTypeRecord[];
  setSabeelTypes: React.Dispatch<React.SetStateAction<SabeelTypeRecord[]>>;
  showToast: (msg: string) => void;
}

const fmtINR = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export const SabeelTypeSubpage: React.FC<SabeelTypeSubpageProps> = ({
  sabeelTypes,
  setSabeelTypes,
  showToast,
}) => {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SabeelTypeRecord | null>(null);

  // Form State
  const [formSabeelType, setFormSabeelType] = useState('');
  const [formCalcType, setFormCalcType] = useState<'Monthly' | 'Yearly'>('Yearly');
  const [formType, setFormType] = useState<'General' | 'Business' | 'Khidmat' | 'Special'>('General');
  const [formBaseAmount, setFormBaseAmount] = useState<number>(24000);
  const [formDescription, setFormDescription] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);

  const openAddModal = () => {
    setEditingItem(null);
    setFormSabeelType('');
    setFormCalcType('Yearly');
    setFormType('General');
    setFormBaseAmount(24000);
    setFormDescription('');
    setFormIsActive(true);
    setModalOpen(true);
  };

  const openEditModal = (item: SabeelTypeRecord) => {
    setEditingItem(item);
    setFormSabeelType(item.sabeelType);
    setFormCalcType(item.calcType);
    setFormType(item.type);
    setFormBaseAmount(item.baseAmount);
    setFormDescription(item.description);
    setFormIsActive(item.isActive);
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSabeelType.trim()) {
      showToast('Please provide a Sabeel Type name');
      return;
    }

    if (editingItem) {
      const updated = sabeelTypes.map(item =>
        item.id === editingItem.id
          ? {
              ...item,
              sabeelType: formSabeelType.trim(),
              calcType: formCalcType,
              type: formType,
              baseAmount: Number(formBaseAmount),
              description: formDescription.trim(),
              isActive: formIsActive,
            }
          : item
      );
      setSabeelTypes(updated);
      saveSabeelTypes(updated);
      showToast(`Updated Sabeel Type: ${formSabeelType}`);
    } else {
      const newItem: SabeelTypeRecord = {
        id: `ST-${Date.now().toString().slice(-4)}`,
        sabeelType: formSabeelType.trim(),
        calcType: formCalcType,
        type: formType,
        baseAmount: Number(formBaseAmount),
        description: formDescription.trim(),
        isActive: formIsActive,
        createdAt: new Date().toISOString().split('T')[0],
      };
      const updated = [...sabeelTypes, newItem];
      setSabeelTypes(updated);
      saveSabeelTypes(updated);
      showToast(`Added new Sabeel Type: ${formSabeelType}`);
    }

    setModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete Sabeel Type "${name}"?`)) {
      const updated = sabeelTypes.filter(x => x.id !== id);
      setSabeelTypes(updated);
      saveSabeelTypes(updated);
      showToast(`Deleted Sabeel Type: ${name}`);
    }
  };

  const toggleStatus = (id: string) => {
    const updated = sabeelTypes.map(x =>
      x.id === id ? { ...x, isActive: !x.isActive } : x
    );
    setSabeelTypes(updated);
    saveSabeelTypes(updated);
    showToast('Toggled Sabeel Type active status');
  };

  const filteredTypes = sabeelTypes.filter(
    t =>
      t.sabeelType.toLowerCase().includes(search.toLowerCase()) ||
      t.type.toLowerCase().includes(search.toLowerCase()) ||
      t.calcType.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Tag className="w-5 h-5 text-amber-600" />
              <span>Sabeel Type Master</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Define classifications, calculation modes (Monthly vs Yearly), and standard baseline amounts for Jamaat Sabeels.
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Sabeel Type</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="mt-4 relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search Sabeel Types..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Table View */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-3 px-4">Sr.No</th>
                <th className="py-3 px-4">SabeelType</th>
                <th className="py-3 px-4">CalcType</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4 text-right">Base Amount</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-center">Active</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredTypes.map((item, idx) => (
                <tr key={item.id} className="hover:bg-amber-50/40 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-500">{idx + 1}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{item.sabeelType}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      item.calcType === 'Monthly' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {item.calcType}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded text-[10px] font-semibold">
                      {item.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-black text-emerald-600">
                    {fmtINR(item.baseAmount)}
                  </td>
                  <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{item.description || '—'}</td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => toggleStatus(item.id)}
                      className="cursor-pointer"
                      title="Click to toggle active status"
                    >
                      {item.isActive ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto" />
                      ) : (
                        <XCircle className="w-5 h-5 text-slate-300 mx-auto" />
                      )}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => openEditModal(item)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="Edit Sabeel Type"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id, item.sabeelType)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Sabeel Type"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTypes.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No Sabeel Types found matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h2 className="text-sm font-bold text-slate-900">
                {editingItem ? 'Edit Sabeel Type' : 'Add New Sabeel Type'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Sabeel Type Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Commercial Business Sabeel"
                  value={formSabeelType}
                  onChange={e => setFormSabeelType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Calculation Type</label>
                  <select
                    value={formCalcType}
                    onChange={e => setFormCalcType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 bg-white cursor-pointer font-medium"
                  >
                    <option value="Yearly">Yearly (Annual Pledge)</option>
                    <option value="Monthly">Monthly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Classification Type</label>
                  <select
                    value={formType}
                    onChange={e => setFormType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 bg-white cursor-pointer font-medium"
                  >
                    <option value="General">General</option>
                    <option value="Business">Business</option>
                    <option value="Khidmat">Khidmat</option>
                    <option value="Special">Special</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Base Amount (₹)</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="500"
                  value={formBaseAmount}
                  onChange={e => setFormBaseAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Optional details or criteria for this Sabeel Type..."
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={formIsActive}
                  onChange={e => setFormIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300 cursor-pointer"
                />
                <label htmlFor="isActiveToggle" className="text-slate-700 font-semibold cursor-pointer">
                  Active in Sabeel Portal (Available for allocation)
                </label>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingItem ? 'Update Sabeel Type' : 'Save Sabeel Type'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
