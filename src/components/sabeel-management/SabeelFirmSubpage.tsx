import React, { useState } from 'react';
import {
  Building2, Plus, Search, Edit, Trash2, CheckCircle2, XCircle, Link as LinkIcon,
  X, Save, Phone, MapPin, Hash, UserCheck, AlertCircle
} from 'lucide-react';
import { SabeelFirmRecord, saveSabeelFirms } from '../../utils/sabeelProductionSuite';
import { SabeelLedgerRecord, HeadOfFamily } from '../../types';

interface SabeelFirmSubpageProps {
  firms: SabeelFirmRecord[];
  setFirms: React.Dispatch<React.SetStateAction<SabeelFirmRecord[]>>;
  ledger: SabeelLedgerRecord[];
  hofs: HeadOfFamily[];
  showToast: (msg: string) => void;
}

export const SabeelFirmSubpage: React.FC<SabeelFirmSubpageProps> = ({
  firms,
  setFirms,
  ledger,
  hofs,
  showToast,
}) => {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [editingFirm, setEditingFirm] = useState<SabeelFirmRecord | null>(null);
  const [firmToLink, setFirmToLink] = useState<SabeelFirmRecord | null>(null);

  // Form State
  const [firmName, setFirmName] = useState('');
  const [registrationNo, setRegistrationNo] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [firmType, setFirmType] = useState<SabeelFirmRecord['firmType']>('Trading');
  const [ownerIts, setOwnerIts] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [linkedSabeelNo, setLinkedSabeelNo] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [address, setAddress] = useState('');

  // Link Form State
  const [linkTargetSabeelNo, setLinkTargetSabeelNo] = useState('');

  const openAddModal = () => {
    setEditingFirm(null);
    setFirmName('');
    setRegistrationNo('');
    setGstNumber('');
    setFirmType('Trading');
    setOwnerIts('');
    setOwnerName('');
    setLinkedSabeelNo('');
    setContactPhone('');
    setAddress('');
    setModalOpen(true);
  };

  const openEditModal = (f: SabeelFirmRecord) => {
    setEditingFirm(f);
    setFirmName(f.firmName);
    setRegistrationNo(f.registrationNo);
    setGstNumber(f.gstNumber);
    setFirmType(f.firmType);
    setOwnerIts(f.ownerIts);
    setOwnerName(f.ownerName);
    setLinkedSabeelNo(f.linkedSabeelNo);
    setContactPhone(f.contactPhone);
    setAddress(f.address);
    setModalOpen(true);
  };

  const handleOwnerItsBlur = () => {
    if (!ownerIts.trim()) return;
    const matched = hofs.find(h => h.itsNumber === ownerIts.trim()) ||
                    ledger.find(l => l.itsNumber === ownerIts.trim());
    if (matched) {
      const name = (matched as any).fullName || (matched as any).hofName || (matched as any).memberName;
      setOwnerName(name);
      if ((matched as any).sabeelNumber || (matched as any).sabeelNo) {
        setLinkedSabeelNo((matched as any).sabeelNumber || (matched as any).sabeelNo);
      }
      showToast(`Matched ITS: ${name}`);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firmName.trim() || !ownerIts.trim()) {
      showToast('Please provide Firm Name and Owner ITS Number');
      return;
    }

    if (editingFirm) {
      const updated = firms.map(f =>
        f.id === editingFirm.id
          ? {
              ...f,
              firmName: firmName.trim(),
              registrationNo: registrationNo.trim(),
              gstNumber: gstNumber.trim(),
              firmType,
              ownerIts: ownerIts.trim(),
              ownerName: ownerName.trim() || 'Mumin Firm Owner',
              linkedSabeelNo: linkedSabeelNo.trim(),
              contactPhone: contactPhone.trim(),
              address: address.trim(),
            }
          : f
      );
      setFirms(updated);
      saveSabeelFirms(updated);
      showToast(`Updated Firm: ${firmName}`);
    } else {
      const newFirm: SabeelFirmRecord = {
        id: `FRM-${Date.now().toString().slice(-4)}`,
        firmName: firmName.trim(),
        registrationNo: registrationNo.trim(),
        gstNumber: gstNumber.trim(),
        firmType,
        ownerIts: ownerIts.trim(),
        ownerName: ownerName.trim() || 'Mumin Firm Owner',
        linkedSabeelNo: linkedSabeelNo.trim(),
        contactPhone: contactPhone.trim(),
        address: address.trim(),
        isActive: true,
        createdAt: new Date().toISOString().split('T')[0],
      };
      const updated = [...firms, newFirm];
      setFirms(updated);
      saveSabeelFirms(updated);
      showToast(`Registered new Firm: ${firmName}`);
    }

    setModalOpen(false);
  };

  const openLinkModal = (firm: SabeelFirmRecord) => {
    setFirmToLink(firm);
    setLinkTargetSabeelNo(firm.linkedSabeelNo || '');
    setLinkModalOpen(true);
  };

  const handleSaveLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firmToLink) return;

    const updated = firms.map(f =>
      f.id === firmToLink.id ? { ...f, linkedSabeelNo: linkTargetSabeelNo.trim() } : f
    );
    setFirms(updated);
    saveSabeelFirms(updated);
    showToast(`Linked Firm "${firmToLink.firmName}" with Sabeel No: ${linkTargetSabeelNo}`);
    setLinkModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete Firm "${name}"?`)) {
      const updated = firms.filter(f => f.id !== id);
      setFirms(updated);
      saveSabeelFirms(updated);
      showToast(`Deleted Firm: ${name}`);
    }
  };

  const filteredFirms = firms.filter(
    f =>
      f.firmName.toLowerCase().includes(search.toLowerCase()) ||
      f.ownerIts.toLowerCase().includes(search.toLowerCase()) ||
      f.ownerName.toLowerCase().includes(search.toLowerCase()) ||
      f.linkedSabeelNo.toLowerCase().includes(search.toLowerCase()) ||
      f.gstNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Building2 className="w-5 h-5 text-amber-600" />
              <span>Add Firm & Link Firm with Sabeel</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Register commercial business entities owned by Mumineen and link commercial Sabeel accounts for tax compliance & pledge tracking.
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Firm</span>
          </button>
        </div>

        {/* Search */}
        <div className="mt-4 relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Firm Name, Owner ITS, Sabeel No, GST..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Firms Grid Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-3 px-4">Sr.No</th>
                <th className="py-3 px-4">Firm Name</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Owner ITS & Name</th>
                <th className="py-3 px-4">GST / Reg #</th>
                <th className="py-3 px-4">Linked Sabeel No</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredFirms.map((firm, idx) => (
                <tr key={firm.id} className="hover:bg-amber-50/40 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-500">{idx + 1}</td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{firm.firmName}</div>
                    <div className="text-[10px] text-slate-400 truncate max-w-xs">{firm.address || '—'}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded text-[10px] font-semibold">
                      {firm.firmType}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-amber-800">{firm.ownerIts}</div>
                    <div className="text-[11px] text-slate-600">{firm.ownerName}</div>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-700">
                    {firm.gstNumber || firm.registrationNo || '—'}
                  </td>
                  <td className="py-3 px-4">
                    {firm.linkedSabeelNo ? (
                      <span className="inline-flex items-center gap-1 font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        <LinkIcon className="w-3 h-3" />
                        <span>{firm.linkedSabeelNo}</span>
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Not Linked</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-600">{firm.contactPhone || '—'}</td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => openLinkModal(firm)}
                        className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded font-bold text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                        title="Link or change Sabeel Number"
                      >
                        <LinkIcon className="w-3 h-3" />
                        <span>Link</span>
                      </button>
                      <button
                        onClick={() => openEditModal(firm)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="Edit Firm"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(firm.id, firm.firmName)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Firm"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredFirms.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No commercial firms registered. Click "Add New Firm" to register.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Firm Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h2 className="text-sm font-bold text-slate-900">
                {editingFirm ? 'Edit Firm Details' : 'Register New Mumin Firm'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-slate-600 font-bold mb-1">Firm / Business Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Burhani Hardware & Sanitary Mart"
                    value={firmName}
                    onChange={e => setFirmName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Registration / Trade Lic #</label>
                  <input
                    type="text"
                    placeholder="e.g. REG/MH/2024/110"
                    value={registrationNo}
                    onChange={e => setRegistrationNo(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">GST Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 27AAAAA0000A1Z5"
                    value={gstNumber}
                    onChange={e => setGstNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Firm Sector / Type</label>
                  <select
                    value={firmType}
                    onChange={e => setFirmType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 bg-white cursor-pointer font-medium"
                  >
                    <option value="Trading">Trading</option>
                    <option value="Retail">Retail</option>
                    <option value="Wholesale">Wholesale</option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Services">Services</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Owner ITS Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="8-digit ITS"
                    value={ownerIts}
                    onChange={e => setOwnerIts(e.target.value)}
                    onBlur={handleOwnerItsBlur}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 font-bold text-amber-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Owner Full Name</label>
                  <input
                    type="text"
                    placeholder="Auto-populated or type name"
                    value={ownerName}
                    onChange={e => setOwnerName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Linked Sabeel No</label>
                  <input
                    type="text"
                    placeholder="e.g. SB-015"
                    value={linkedSabeelNo}
                    onChange={e => setLinkedSabeelNo(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 font-bold text-blue-700"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-slate-600 font-bold mb-1">Contact Phone</label>
                  <input
                    type="text"
                    placeholder="+91 98200 00000"
                    value={contactPhone}
                    onChange={e => setContactPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 font-medium"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-slate-600 font-bold mb-1">Commercial Premises Address</label>
                  <textarea
                    rows={2}
                    placeholder="Shop/Office location address..."
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>
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
                  <span>{editingFirm ? 'Update Firm' : 'Register Firm'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Link Modal */}
      {linkModalOpen && firmToLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-amber-600" />
                <span>Link Firm with Sabeel Number</span>
              </h2>
              <button
                onClick={() => setLinkModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLink} className="p-6 space-y-4 text-xs">
              <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-200 text-slate-800">
                <div className="font-bold text-slate-900">{firmToLink.firmName}</div>
                <div className="text-[11px] text-slate-600 mt-0.5">
                  Owner: {firmToLink.ownerName} (ITS: {firmToLink.ownerIts})
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Target Sabeel Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SB-015"
                  value={linkTargetSabeelNo}
                  onChange={e => setLinkTargetSabeelNo(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 font-black text-blue-700 text-sm"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Associate this commercial firm with the owner's active Sabeel account.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setLinkModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Sabeel Mapping</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
