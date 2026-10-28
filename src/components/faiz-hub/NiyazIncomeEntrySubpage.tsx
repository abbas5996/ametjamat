import React, { useState, useMemo } from 'react';
import {
  TrendingUp, Plus, Search, Filter, Printer, Download,
  Calendar, Check, X, Edit2, Trash2, Tag, CreditCard,
  Building2, ShieldCheck, Wallet, ArrowUpRight
} from 'lucide-react';
import {
  NiyazIncomeEntryItem,
  IncomeHeadItem,
  IncomePaymentMode,
  getStoredIncomeEntries,
  saveStoredIncomeEntries,
  getStoredIncomeHeads,
  saveStoredIncomeHeads,
  getStoredOpeningBalances,
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

export const NiyazIncomeEntrySubpage: React.FC<Props> = ({
  currentUser,
  showToast,
  canAdd = true,
  canEdit = true,
  canDelete = true,
}) => {
  const [entries, setEntries] = useState<NiyazIncomeEntryItem[]>(() => getStoredIncomeEntries());
  const [heads, setHeads] = useState<IncomeHeadItem[]>(() => getStoredIncomeHeads());
  const [accounts] = useState(() => getStoredOpeningBalances());

  // Filters [cite: 38, 39, 40]
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [paymentModeFilter, setPaymentModeFilter] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<NiyazIncomeEntryItem | null>(null);

  // Form Fields
  const [receiptNo, setReceiptNo] = useState('');
  const [date, setDate] = useState('1447-02-25');
  const [accountName, setAccountName] = useState('');
  const [incomeHeadId, setIncomeHeadId] = useState('');
  const [paymentMode, setPaymentMode] = useState<IncomePaymentMode>('Online');
  const [donorFullName, setDonorFullName] = useState('');
  const [itsNumber, setItsNumber] = useState('');
  const [sabeelNo, setSabeelNo] = useState('');
  const [amount, setAmount] = useState<number>(52000);
  const [referenceNo, setReferenceNo] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [narration, setNarration] = useState('');

  // Filtered Entries
  const filteredEntries = useMemo(() => {
    return entries.filter(e => {
      // 1. Category Filter
      if (categoryFilter !== 'all' && e.incomeHeadId !== categoryFilter) return false;

      // 2. Payment Mode Filter
      if (paymentModeFilter !== 'all' && e.paymentMode !== paymentModeFilter) return false;

      // 3. Date Range
      if (startDate && e.date < startDate) return false;
      if (endDate && e.date > endDate) return false;

      // 4. Search Filter (Donor, ITS, Sabeel, Receipt No)
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchName = e.donorFullName.toLowerCase().includes(q);
        const matchIts = e.itsNumber.toLowerCase().includes(q);
        const matchSabeel = e.sabeelNo.toLowerCase().includes(q);
        const matchRec = e.receiptNo.toLowerCase().includes(q);
        if (!matchName && !matchIts && !matchSabeel && !matchRec) return false;
      }

      return true;
    });
  }, [entries, categoryFilter, paymentModeFilter, startDate, endDate, searchQuery]);

  // Totals
  const totalFilteredIncome = useMemo(() => {
    return filteredEntries.reduce((s, e) => s + e.amount, 0);
  }, [filteredEntries]);

  // Open Modal for Add
  const openAddModal = () => {
    setEditingItem(null);
    setReceiptNo(`FMB-REC-${Date.now().toString().slice(-4)}`);
    setDate(new Date().toISOString().split('T')[0]);
    setAccountName(accounts[0]?.bankName ? `${accounts[0].bankName} (${accounts[0].accountNo})` : 'State Bank of India — FMB Kitchen A/C');
    setIncomeHeadId(heads[0]?.id || 'inc-1');
    setPaymentMode('Online');
    setDonorFullName('');
    setItsNumber('');
    setSabeelNo('SAB-101');
    setAmount(52000);
    setReferenceNo('');
    setIsActive(true);
    setNarration('FMB barakat thaali contribution received with thanks.');
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const openEditModal = (item: NiyazIncomeEntryItem) => {
    setEditingItem(item);
    setReceiptNo(item.receiptNo);
    setDate(item.date);
    setAccountName(item.accountName);
    setIncomeHeadId(item.incomeHeadId);
    setPaymentMode(item.paymentMode);
    setDonorFullName(item.donorFullName);
    setItsNumber(item.itsNumber);
    setSabeelNo(item.sabeelNo);
    setAmount(item.amount);
    setReferenceNo(item.referenceNo);
    setIsActive(item.isActive);
    setNarration(item.narration);
    setIsModalOpen(true);
  };

  const handleDelete = (item: NiyazIncomeEntryItem) => {
    if (!canDelete) {
      showToast('You do not have permission to delete income entries.');
      return;
    }
    if (window.confirm(`Delete income receipt "${item.receiptNo}" for ${fmtINR(item.amount)}?`)) {
      const next = entries.filter(e => e.id !== item.id);
      setEntries(next);
      saveStoredIncomeEntries(next);
      showToast(`Deleted receipt ${item.receiptNo}`);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!donorFullName.trim() || amount <= 0) {
      showToast('Please enter donor full name and positive income amount.');
      return;
    }

    const headObj = heads.find(h => h.id === incomeHeadId) || heads[0];

    if (editingItem) {
      const updated = entries.map(item =>
        item.id === editingItem.id
          ? {
              ...item,
              receiptNo,
              date,
              accountName,
              incomeHeadId,
              incomeHeadName: headObj.name,
              paymentMode,
              donorFullName: donorFullName.trim(),
              itsNumber: itsNumber.trim() || 'N/A',
              sabeelNo: sabeelNo.trim() || 'N/A',
              amount,
              referenceNo: referenceNo.trim() || 'N/A',
              isActive,
              narration: narration.trim(),
            }
          : item
      );
      setEntries(updated);
      saveStoredIncomeEntries(updated);
      showToast(`Updated income receipt ${receiptNo}`);
    } else {
      const newEntry: NiyazIncomeEntryItem = {
        id: `inc-${Date.now()}`,
        receiptNo,
        date,
        accountName,
        incomeHeadId,
        incomeHeadName: headObj.name,
        paymentMode,
        donorFullName: donorFullName.trim(),
        itsNumber: itsNumber.trim() || 'N/A',
        sabeelNo: sabeelNo.trim() || 'N/A',
        amount,
        referenceNo: referenceNo.trim() || 'N/A',
        isActive,
        narration: narration.trim(),
        receivedBy: currentUser.username,
      };
      const updated = [newEntry, ...entries];
      setEntries(updated);
      saveStoredIncomeEntries(updated);
      showToast(`Added new income receipt ${receiptNo}`);
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* ── Banner Card ── */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300/60 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500 text-slate-950 shadow-xs">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              Income Head & Niyaz Income Entry List
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Record annual FMB Hub collections, deg sponsorships, and miscellaneous revenue [cite: 38, 39, 40]
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => showToast(`Bulk printed ${filteredEntries.length} income receipts.`)}
            className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Bulk Print ({filteredEntries.length})</span>
          </button>

          {canAdd && (
            <button
              type="button"
              onClick={openAddModal}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Income Entry</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Account Names List with Active Status [cite: 38] ── */}
      <div className="bg-white border border-amber-200 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-amber-600" />
            <span>Designated Inflow Accounts & Active Status</span>
          </span>
          <span className="text-xs font-bold text-slate-700">
            Total Inflow Filtered: <strong className="text-emerald-700 text-sm font-black">{fmtINR(totalFilteredIncome)}</strong>
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {accounts.map(acc => (
            <div key={acc.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-2">
              <div>
                <span className="font-bold text-slate-900 block truncate">{acc.bankName}</span>
                <span className="text-[10px] text-slate-500 font-mono block">A/C: {acc.accountNo}</span>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 shrink-0">
                Active
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Filters Bar: Date Filters, Category Dropdowns, Payment Mode [cite: 38, 39, 40] ── */}
      <div className="bg-white border border-amber-300/60 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
          {/* Quick Search */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">Donor Name / ITS / Sabeel</label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search donor or receipt..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
          </div>

          {/* Category Dropdown (Income Heads) */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">Income Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none cursor-pointer"
            >
              <option value="all">All Income Categories (8)</option>
              {heads.map(h => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          </div>

          {/* Payment Mode Filter */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">Payment Mode</label>
            <select
              value={paymentModeFilter}
              onChange={(e) => setPaymentModeFilter(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none cursor-pointer"
            >
              <option value="all">All Payment Modes</option>
              <option value="Online">Online Gateway / NetBanking</option>
              <option value="UPI">UPI Quick Pay</option>
              <option value="Cheque">Cheque Deposit</option>
              <option value="Cash">Cash Receipt</option>
              <option value="NEFT/RTGS">NEFT / RTGS</option>
            </select>
          </div>

          {/* From Date */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">From Date</label>
            <input
              type="text"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="e.g. 1447-02-01"
              className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-mono text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>

          {/* To Date */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">To Date</label>
            <input
              type="text"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="e.g. 1447-02-29"
              className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-mono text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>
        </div>

        {(searchQuery || categoryFilter !== 'all' || paymentModeFilter !== 'all' || startDate || endDate) && (
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setCategoryFilter('all');
                setPaymentModeFilter('all');
                setStartDate('');
                setEndDate('');
              }}
              className="text-xs font-bold text-amber-800 hover:text-amber-950 hover:underline cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>

      {/* ── Income Entry List Table ── */}
      <div className="bg-white border border-amber-300/60 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-700">
            Income Vouchers ({filteredEntries.length})
          </span>
          <button
            type="button"
            onClick={() => showToast('Exported income ledger to CSV.')}
            className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-amber-50/60 text-slate-700 font-bold border-y border-amber-200">
                <th className="py-2.5 px-3">Receipt No</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Donor / Mumin Full Name</th>
                <th className="py-2.5 px-3">ITS / Sabeel</th>
                <th className="py-2.5 px-3">Category Head</th>
                <th className="py-2.5 px-3">Mode</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    No income entries found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((item) => (
                  <tr key={item.id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                      {item.receiptNo}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                      {item.date}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-bold text-slate-900 block">{item.donorFullName}</span>
                      <span className="text-[10px] text-slate-500 truncate block max-w-[180px]">{item.accountName}</span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-700">
                      <span className="font-bold text-slate-900 block">{item.itsNumber}</span>
                      <span className="text-[10px] text-slate-500">{item.sabeelNo}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-bold text-amber-950 bg-amber-100/70 px-2 py-0.5 rounded">
                        {item.incomeHeadName}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.paymentMode === 'Online' ? 'bg-blue-100 text-blue-800' :
                        item.paymentMode === 'UPI' ? 'bg-emerald-100 text-emerald-800' :
                        item.paymentMode === 'Cheque' ? 'bg-amber-100 text-amber-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {item.paymentMode}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-black text-emerald-700 text-sm">
                      {fmtINR(item.amount)}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {item.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => openEditModal(item)}
                            title="Edit Receipt"
                            className="p-1 rounded-md text-slate-600 hover:text-amber-800 hover:bg-amber-100 cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => handleDelete(item)}
                            title="Delete Receipt"
                            className="p-1 rounded-md text-slate-600 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
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

      {/* ── MODAL: Add / Edit Niyaz Income Entry [cite: 38, 39, 40] ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-amber-300 shadow-2xl max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-amber-100 bg-amber-50/70 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  {editingItem ? 'Edit Income Receipt' : 'Add New Niyaz Income Entry'}
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">Faiz hub, niyaz pledge, or sponsorship receipt</p>
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
                  <label className="font-bold text-slate-700">Receipt No *</label>
                  <input
                    type="text"
                    value={receiptNo}
                    onChange={(e) => setReceiptNo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Date (Hijri) *</label>
                  <input
                    type="text"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Income Category Head *</label>
                  <select
                    value={incomeHeadId}
                    onChange={(e) => setIncomeHeadId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                  >
                    {heads.map(h => (
                      <option key={h.id} value={h.id}>{h.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Payment Mode *</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                  >
                    <option value="Online">Online NetBanking</option>
                    <option value="UPI">UPI Quick Pay</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Cash">Cash Counter</option>
                    <option value="NEFT/RTGS">NEFT / RTGS</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Depository Account Name *</label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="e.g. State Bank of India — FMB Kitchen A/C"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1 col-span-1">
                  <label className="font-bold text-slate-700">Donor ITS No</label>
                  <input
                    type="text"
                    value={itsNumber}
                    onChange={(e) => setItsNumber(e.target.value)}
                    placeholder="e.g. 30489122"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
                <div className="space-y-1 col-span-1">
                  <label className="font-bold text-slate-700">Sabeel No</label>
                  <input
                    type="text"
                    value={sabeelNo}
                    onChange={(e) => setSabeelNo(e.target.value)}
                    placeholder="e.g. SAB-101"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
                <div className="space-y-1 col-span-1">
                  <label className="font-bold text-slate-700">Amount (INR) *</label>
                  <input
                    type="number"
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Donor / Mumin Full Name *</label>
                <input
                  type="text"
                  value={donorFullName}
                  onChange={(e) => setDonorFullName(e.target.value)}
                  placeholder="e.g. Shk. Mufaddal Bhai Poonawala"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Cheque / Transaction Ref</label>
                  <input
                    type="text"
                    value={referenceNo}
                    onChange={(e) => setReferenceNo(e.target.value)}
                    placeholder="e.g. UPI-992834 or CHQ-77881"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
                <div className="space-y-1 flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer pb-2">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                    />
                    <span className="font-bold text-slate-800">Active Receipt Status</span>
                  </label>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Narration / Occasion Notes</label>
                <textarea
                  rows={2}
                  value={narration}
                  onChange={(e) => setNarration(e.target.value)}
                  placeholder="e.g. Annual FMB Hub settled, or Deg Niyaz on Farzand Salgirah..."
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
                  {editingItem ? 'Save Receipt' : 'Record Income Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
