import React, { useState } from 'react';
import {
  Wallet, Plus, Search, Edit2, Trash2, X, Check,
  Building2, Landmark, Coins, AlertCircle, Save, Download
} from 'lucide-react';
import {
  NiyazOpeningBalanceItem,
  getStoredOpeningBalances,
  saveStoredOpeningBalances
} from '../../utils/fmbPart1Data';
import { UserProfile } from '../../types';

const fmtINR = (n: number) => `₹${n.toLocaleString('en-IN')}`;

interface Props {
  currentUser: UserProfile;
  showToast: (m: string) => void;
  canAdd?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}

export const NiyazOpeningBalanceSubpage: React.FC<Props> = ({
  currentUser,
  showToast,
  canAdd = true,
  canEdit = true,
  canDelete = true,
}) => {
  const [balances, setBalances] = useState<NiyazOpeningBalanceItem[]>(() => getStoredOpeningBalances());
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<NiyazOpeningBalanceItem | null>(null);

  // Form State
  const [openingBal, setOpeningBal] = useState<number>(100000);
  const [openingDate, setOpeningDate] = useState<string>('1447-01-01');
  const [accountType, setAccountType] = useState<'Bank' | 'Cash' | 'Reserve' | 'Endowment'>('Bank');
  const [accountNo, setAccountNo] = useState<string>('');
  const [bankName, setBankName] = useState<string>('');
  const [branchName, setBranchName] = useState<string>('');
  const [ifscCode, setIfscCode] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Aggregates
  const totalOpening = balances.reduce((s, b) => s + b.openingBal, 0);
  const totalBank = balances.filter(b => b.type === 'Bank').reduce((s, b) => s + b.openingBal, 0);
  const totalCash = balances.filter(b => b.type === 'Cash').reduce((s, b) => s + b.openingBal, 0);
  const totalEndowment = balances.filter(b => b.type === 'Endowment' || b.type === 'Reserve').reduce((s, b) => s + b.openingBal, 0);

  const filteredBalances = balances.filter(b => {
    const q = searchQuery.toLowerCase();
    return (
      b.accountNo.toLowerCase().includes(q) ||
      b.bankName.toLowerCase().includes(q) ||
      b.branchName.toLowerCase().includes(q) ||
      b.ifscCode.toLowerCase().includes(q) ||
      b.type.toLowerCase().includes(q)
    );
  });

  const openAddModal = () => {
    setEditingItem(null);
    setOpeningBal(50000);
    setOpeningDate('1447-01-01');
    setAccountType('Bank');
    setAccountNo('');
    setBankName('State Bank of India');
    setBranchName('Burhani Park Branch');
    setIfscCode('SBIN0004521');
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (item: NiyazOpeningBalanceItem) => {
    setEditingItem(item);
    setOpeningBal(item.openingBal);
    setOpeningDate(item.openingDate);
    setAccountType(item.type);
    setAccountNo(item.accountNo);
    setBankName(item.bankName);
    setBranchName(item.branchName);
    setIfscCode(item.ifscCode);
    setNotes(item.notes || '');
    setIsModalOpen(true);
  };

  const handleDelete = (item: NiyazOpeningBalanceItem) => {
    if (!canDelete) {
      showToast('You do not have permission to delete opening balance records.');
      return;
    }
    if (window.confirm(`Delete Opening Balance record for "${item.bankName} (${item.accountNo})"?`)) {
      const next = balances.filter(b => b.id !== item.id);
      setBalances(next);
      saveStoredOpeningBalances(next);
      showToast(`Removed opening balance for ${item.accountNo}`);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountNo.trim() || !bankName.trim() || openingBal <= 0) {
      showToast('Please enter valid account number, bank name, and positive opening balance.');
      return;
    }

    if (editingItem) {
      const updated = balances.map(b =>
        b.id === editingItem.id
          ? {
              ...b,
              openingBal,
              openingDate,
              type: accountType,
              accountNo: accountNo.trim(),
              bankName: bankName.trim(),
              branchName: branchName.trim(),
              ifscCode: ifscCode.trim(),
              notes: notes.trim(),
            }
          : b
      );
      setBalances(updated);
      saveStoredOpeningBalances(updated);
      showToast(`Updated opening balance for ${accountNo}`);
    } else {
      const newItem: NiyazOpeningBalanceItem = {
        id: `nob-${Date.now()}`,
        openingBal,
        openingDate,
        type: accountType,
        accountNo: accountNo.trim(),
        bankName: bankName.trim(),
        branchName: branchName.trim(),
        ifscCode: ifscCode.trim(),
        notes: notes.trim(),
        createdAt: new Date().toISOString().split('T')[0],
      };
      const updated = [newItem, ...balances];
      setBalances(updated);
      saveStoredOpeningBalances(updated);
      showToast(`Added new opening balance for ${accountNo}`);
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* ── Banner Card ── */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300/60 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500 text-slate-950 shadow-xs">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              Set Opening Balance (Niyaz Opening Balance List)
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Establish initial fiscal balances for all FMB operational bank accounts, cash chest, and waqf reserves [cite: 26]
            </p>
          </div>
        </div>

        {canAdd && (
          <button
            type="button"
            onClick={openAddModal}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Opening Balance</span>
          </button>
        )}
      </div>

      {/* ── Summary Stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white border border-amber-200 rounded-2xl p-4 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Opening Funds</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{fmtINR(totalOpening)}</p>
          <p className="text-[11px] text-amber-800 font-semibold mt-0.5">{balances.length} Managed Accounts</p>
        </div>
        <div className="bg-white border border-emerald-200 rounded-2xl p-4 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Bank Accounts</p>
          <p className="text-2xl font-black text-emerald-700 mt-1">{fmtINR(totalBank)}</p>
          <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Operative Clearing</p>
        </div>
        <div className="bg-white border border-blue-200 rounded-2xl p-4 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Cash Chest Vault</p>
          <p className="text-2xl font-black text-blue-800 mt-1">{fmtINR(totalCash)}</p>
          <p className="text-[11px] text-blue-600 font-semibold mt-0.5">Daily Kitchen Petty</p>
        </div>
        <div className="bg-white border border-purple-200 rounded-2xl p-4 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Waqf Endowments</p>
          <p className="text-2xl font-black text-purple-800 mt-1">{fmtINR(totalEndowment)}</p>
          <p className="text-[11px] text-purple-600 font-semibold mt-0.5">Dedicated Corpus</p>
        </div>
      </div>

      {/* ── Search & Table Container ── */}
      <div className="bg-white border border-amber-300/60 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Bank Name, Account No, IFSC, or Type..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => showToast('Exported Opening Balance ledger to CSV.')}
            className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Niyaz Opening Balance Table [cite: 26] */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-amber-50/60 text-slate-700 font-bold border-y border-amber-200">
                <th className="py-3 px-3">OpeningBal</th>
                <th className="py-3 px-3">OpeningDate</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Account No</th>
                <th className="py-3 px-3">Bank Name</th>
                <th className="py-3 px-3">Branch Name</th>
                <th className="py-3 px-3">IFSC Code</th>
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBalances.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No opening balance records found.
                  </td>
                </tr>
              ) : (
                filteredBalances.map((item) => (
                  <tr key={item.id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="py-3 px-3 font-black text-slate-900 text-sm">
                      {fmtINR(item.openingBal)}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600 whitespace-nowrap">
                      {item.openingDate}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.type === 'Bank' ? 'bg-emerald-100 text-emerald-800' :
                        item.type === 'Cash' ? 'bg-blue-100 text-blue-800' :
                        item.type === 'Endowment' ? 'bg-purple-100 text-purple-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-800">
                      {item.accountNo}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-900">
                      {item.bankName}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {item.branchName}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600">
                      {item.ifscCode}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => openEditModal(item)}
                            title="Edit Opening Balance"
                            className="p-1.5 rounded-lg text-slate-600 hover:text-amber-800 hover:bg-amber-100 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => handleDelete(item)}
                            title="Delete Record"
                            className="p-1.5 rounded-lg text-slate-600 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
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

      {/* ── MODAL: Add / Edit Niyaz Opening Balance [cite: 26] ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-amber-300 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-amber-100 bg-amber-50/70 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  {editingItem ? 'Edit Opening Balance' : 'Add New Niyaz Opening Balance'}
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">Enter account details and starting capital</p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Opening Balance (INR) *</label>
                  <input
                    type="number"
                    min="1"
                    value={openingBal}
                    onChange={(e) => setOpeningBal(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Opening Date (Hijri) *</label>
                  <input
                    type="text"
                    value={openingDate}
                    onChange={(e) => setOpeningDate(e.target.value)}
                    placeholder="e.g. 1447-01-01"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Account Type *</label>
                  <select
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                  >
                    <option value="Bank">Bank Account</option>
                    <option value="Cash">Cash Vault</option>
                    <option value="Reserve">Reserve Fund</option>
                    <option value="Endowment">Waqf Endowment</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Account / Vault No *</label>
                  <input
                    type="text"
                    value={accountNo}
                    onChange={(e) => setAccountNo(e.target.value)}
                    placeholder="e.g. 38920194018"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Bank / Custodian Name *</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. State Bank of India"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Branch Name</label>
                  <input
                    type="text"
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    placeholder="e.g. Burhani Park Main"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">IFSC Code</label>
                  <input
                    type="text"
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value)}
                    placeholder="e.g. SBIN0004521"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Notes / Remarks</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any allocation or audit notes..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-xs cursor-pointer"
                >
                  {editingItem ? 'Save Changes' : 'Create Balance Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
