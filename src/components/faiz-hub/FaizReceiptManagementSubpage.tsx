import React, { useState, useMemo } from 'react';
import {
  Receipt, Plus, Search, Filter, Printer, Download,
  Calendar, Check, X, Eye, CreditCard, Building2,
  FileText, QrCode, ShieldCheck, UserCheck, Utensils,
  CheckSquare, Square
} from 'lucide-react';
import {
  FaizReceiptItem,
  FmbReceiptCategory,
  FmbPaymentModeExtended,
  getStoredPart2Receipts,
  saveStoredPart2Receipts,
} from '../../utils/fmbPart2Data';
import { getStoredHofs } from '../../utils/memberMaster';
import { getStoredFaizHubs } from '../../utils/faizModule';
import { getStoredBanks } from '../../utils/fmbPart1Data';
import { FaizOfficialPrintReceipt } from './FaizOfficialPrintReceipt';
import { UserProfile } from '../../types';

const fmtINR = (n: number) => `₹${n.toLocaleString('en-IN')}`;

interface Props {
  currentUser: UserProfile;
  showToast: (m: string) => void;
  canAdd?: boolean;
}

export const FaizReceiptManagementSubpage: React.FC<Props> = ({
  currentUser,
  showToast,
  canAdd = true,
}) => {
  const [receipts, setReceipts] = useState<FaizReceiptItem[]>(() => getStoredPart2Receipts());
  const [hofs] = useState(() => getStoredHofs());
  const [hubs] = useState(() => getStoredFaizHubs());
  const [banks] = useState(() => getStoredBanks());

  // Filters [cite: 41]
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [itsFilter, setItsFilter] = useState('');
  const [sabeelFilter, setSabeelFilter] = useState('');
  const [thaaliFilter, setThaaliFilter] = useState('');
  const [mohallaFilter, setMohallaFilter] = useState('ALL');
  const [userFilter, setUserFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Category Checkboxes [cite: 41]
  const [categoryFilters, setCategoryFilters] = useState<Record<FmbReceiptCategory, boolean>>({
    Takhmeen: true,
    Hoob: true,
    Zabihat: true,
    Salwat: true,
    Fateha: true,
    Other: true,
  });

  // Payment Mode Filters [cite: 41]
  const [modeFilters, setModeFilters] = useState<Record<FmbPaymentModeExtended, boolean>>({
    Cash: true,
    Cheque: true,
    Online: true,
    'Standing Order': true,
  });

  // Selection for Bulk Print
  const [selectedReceiptIds, setSelectedReceiptIds] = useState<string[]>([]);
  const [activePrintReceipt, setActivePrintReceipt] = useState<FaizReceiptItem | null>(null);
  const [isPrintStudioOpen, setIsPrintStudioOpen] = useState(false);

  // Modals [cite: 41]
  const [isHoobModalOpen, setIsHoobModalOpen] = useState(false);
  const [isTakhmeenModalOpen, setIsTakhmeenModalOpen] = useState(false);

  // Modal 1: Add Hoob/Zabihat Entry
  const [hoobCategory, setHoobCategory] = useState<FmbReceiptCategory>('Hoob');
  const [hoobIts, setHoobIts] = useState(hofs[0]?.itsNumber || '');
  const [hoobAmount, setHoobAmount] = useState<number>(25000);
  const [hoobMode, setHoobMode] = useState<FmbPaymentModeExtended>('Online');
  const [hoobRef, setHoobRef] = useState('');
  const [hoobAccount, setHoobAccount] = useState(banks[0]?.bankName || 'State Bank of India');
  const [hoobNarration, setHoobNarration] = useState('');

  // Modal 2: Create Takhmeen Receipts
  const [takhmeenIts, setTakhmeenIts] = useState(hofs[0]?.itsNumber || '');
  const [takhmeenAmount, setTakhmeenAmount] = useState<number>(13000);
  const [takhmeenMode, setTakhmeenMode] = useState<FmbPaymentModeExtended>('Online');
  const [takhmeenRef, setTakhmeenRef] = useState('');
  const [takhmeenNarration, setTakhmeenNarration] = useState('Quarterly installment remittance');

  // Distinct Mohallas & Users
  const distinctMohallas = useMemo(() => {
    const set = new Set<string>();
    hofs.forEach(h => { if (h.mohallahName) set.add(h.mohallahName); });
    return Array.from(set).sort();
  }, [hofs]);

  const distinctUsers = useMemo(() => {
    const set = new Set<string>();
    receipts.forEach(r => { if (r.issuedBy) set.add(r.issuedBy); });
    return Array.from(set);
  }, [receipts]);

  // Toggle helpers
  const toggleCategory = (cat: FmbReceiptCategory) => {
    setCategoryFilters(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const toggleMode = (m: FmbPaymentModeExtended) => {
    setModeFilters(prev => ({ ...prev, [m]: !prev[m] }));
  };

  // Filtered Receipts
  const filteredReceipts = useMemo(() => {
    return receipts.filter(r => {
      // Category & Mode Checkboxes
      if (!categoryFilters[r.category]) return false;
      if (!modeFilters[r.paymentMode]) return false;

      // Date Range
      if (startDate && r.date < startDate) return false;
      if (endDate && r.date > endDate) return false;

      // Select Specific Filters
      if (itsFilter && !r.itsNumber.toLowerCase().includes(itsFilter.toLowerCase())) return false;
      if (sabeelFilter && !r.sabeelNo.toLowerCase().includes(sabeelFilter.toLowerCase())) return false;
      if (thaaliFilter && !r.thaaliNo.toLowerCase().includes(thaaliFilter.toLowerCase())) return false;
      if (mohallaFilter !== 'ALL' && r.mohalla !== mohallaFilter) return false;
      if (userFilter !== 'ALL' && r.issuedBy !== userFilter) return false;
      if (typeFilter !== 'ALL' && r.category !== typeFilter) return false;

      // Universal Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchRec = r.receiptNo.toLowerCase().includes(q);
        const matchName = r.hofName.toLowerCase().includes(q);
        const matchIts = r.itsNumber.toLowerCase().includes(q);
        const matchRef = r.referenceNo.toLowerCase().includes(q);
        if (!matchRec && !matchName && !matchIts && !matchRef) return false;
      }

      return true;
    });
  }, [receipts, categoryFilters, modeFilters, startDate, endDate, itsFilter, sabeelFilter, thaaliFilter, mohallaFilter, userFilter, typeFilter, searchQuery]);

  // Selection
  const handleSelectAll = () => {
    if (selectedReceiptIds.length === filteredReceipts.length) {
      setSelectedReceiptIds([]);
    } else {
      setSelectedReceiptIds(filteredReceipts.map(r => r.id));
    }
  };

  const handleToggleReceipt = (id: string) => {
    setSelectedReceiptIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Aggregates
  const totalAmount = useMemo(() => filteredReceipts.reduce((s, r) => s + (r.isCancelled ? 0 : r.amount), 0), [filteredReceipts]);
  const takhmeenShare = useMemo(() => filteredReceipts.filter(r => r.category === 'Takhmeen' && !r.isCancelled).reduce((s, r) => s + r.amount, 0), [filteredReceipts]);
  const hoobZabihatShare = useMemo(() => filteredReceipts.filter(r => (r.category === 'Hoob' || r.category === 'Zabihat') && !r.isCancelled).reduce((s, r) => s + r.amount, 0), [filteredReceipts]);

  // Modal 1 Save
  const handleSaveHoobEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const member = hofs.find(h => h.itsNumber === hoobIts) || hofs[0];
    const recNo = `FMB-${hoobCategory.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`;

    const newReceipt: FaizReceiptItem = {
      id: `frec-${Date.now()}`,
      receiptNo: recNo,
      date: new Date().toISOString().split('T')[0],
      itsNumber: member.itsNumber,
      hofName: member.fullName,
      sabeelNo: member.sabeelNo || 'SAB-101',
      thaaliNo: member.thaaliNo || 'TH-084',
      mohalla: member.mohallahName || 'Burhani Mohallah',
      category: hoobCategory,
      paymentMode: hoobMode,
      amount: hoobAmount,
      referenceNo: hoobRef || 'CHQ-ONLINE-AUTO',
      issuedBy: currentUser.username,
      accountName: hoobAccount,
      narration: hoobNarration || `${hoobCategory} contribution recorded with thanks`,
      isCancelled: false,
      giftAidEligible: false,
    };

    const next = [newReceipt, ...receipts];
    setReceipts(next);
    saveStoredPart2Receipts(next);
    showToast(`Receipt ${recNo} created for ${member.fullName}`);
    setIsHoobModalOpen(false);
    setActivePrintReceipt(newReceipt);
  };

  // Modal 2 Save
  const handleSaveTakhmeenReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    const member = hofs.find(h => h.itsNumber === takhmeenIts) || hofs[0];
    const recNo = `FMB-TAK-${Date.now().toString().slice(-4)}`;

    const newReceipt: FaizReceiptItem = {
      id: `frec-${Date.now()}`,
      receiptNo: recNo,
      date: new Date().toISOString().split('T')[0],
      itsNumber: member.itsNumber,
      hofName: member.fullName,
      sabeelNo: member.sabeelNo || 'SAB-101',
      thaaliNo: member.thaaliNo || 'TH-084',
      mohalla: member.mohallahName || 'Burhani Mohallah',
      category: 'Takhmeen',
      paymentMode: takhmeenMode,
      amount: takhmeenAmount,
      referenceNo: takhmeenRef || 'PLEDGE-PAY',
      issuedBy: currentUser.username,
      accountName: banks[0]?.bankName || 'State Bank of India — FMB Kitchen A/C',
      narration: takhmeenNarration,
      isCancelled: false,
      giftAidEligible: true,
    };

    const next = [newReceipt, ...receipts];
    setReceipts(next);
    saveStoredPart2Receipts(next);
    showToast(`Takhmeen Receipt ${recNo} generated for ${member.fullName}`);
    setIsTakhmeenModalOpen(false);
    setActivePrintReceipt(newReceipt);
  };

  return (
    <div className="space-y-6">
      {/* ── Banner Card ── */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300/60 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500 text-slate-950 shadow-xs">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              View / Print Faiz Receipts & Counter Desk
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Multi-parameter receipt register, bulk printing, Hoob/Zabihat and Takhmeen receipt generation [cite: 41]
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (selectedReceiptIds.length === 0) {
                showToast('Please select receipts to bulk print.');
                return;
              }
              const firstSelected = filteredReceipts.find(r => selectedReceiptIds.includes(r.id)) || filteredReceipts[0];
              setActivePrintReceipt(firstSelected);
            }}
            className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Bulk Print ({selectedReceiptIds.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setIsPrintStudioOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Official Print Voucher Studio</span>
          </button>

          {canAdd && (
            <>
              <button
                type="button"
                onClick={() => setIsHoobModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Hoob / Zabihat</span>
              </button>

              <button
                type="button"
                onClick={() => setIsTakhmeenModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create Takhmeen Receipts</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Summary Stat Metrics ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white border border-amber-200 rounded-2xl p-4 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Filtered Collection</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{fmtINR(totalAmount)}</p>
          <p className="text-[11px] text-amber-800 font-semibold mt-0.5">{filteredReceipts.length} Valid Receipts</p>
        </div>
        <div className="bg-white border border-emerald-200 rounded-2xl p-4 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Takhmeen Receipts</p>
          <p className="text-2xl font-black text-emerald-700 mt-1">{fmtINR(takhmeenShare)}</p>
          <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Core Annual Pledges</p>
        </div>
        <div className="bg-white border border-blue-200 rounded-2xl p-4 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Hoob & Zabihat</p>
          <p className="text-2xl font-black text-blue-800 mt-1">{fmtINR(hoobZabihatShare)}</p>
          <p className="text-[11px] text-blue-600 font-semibold mt-0.5">Special Niyaz & Sadqah</p>
        </div>
        <div className="bg-white border border-purple-200 rounded-2xl p-4 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Selection Count</p>
          <p className="text-2xl font-black text-purple-800 mt-1">{selectedReceiptIds.length}</p>
          <p className="text-[11px] text-purple-600 font-semibold mt-0.5">Marked for Sheet Print</p>
        </div>
      </div>

      {/* ── Multi-Filter Console (All 8 Filter Parameters) [cite: 41] ── */}
      <div className="bg-white border border-amber-300/60 rounded-2xl p-5 shadow-xs space-y-4">
        {/* Row 1: Search & Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="space-y-1 md:col-span-2">
            <label className="font-bold text-slate-700">Universal Receipt Search</label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search receipt no, member name, ITS, or transaction ref..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700">From Date</label>
            <input
              type="text"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="e.g. 1447-02-01"
              className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-mono text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700">To Date</label>
            <input
              type="text"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="e.g. 1447-02-29"
              className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-mono text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>
        </div>

        {/* Row 2: ITS, Sabeel, Thaali, Mohalla, User, Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">ITS No</label>
            <input
              type="text"
              value={itsFilter}
              onChange={(e) => setItsFilter(e.target.value)}
              placeholder="3048..."
              className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-mono text-slate-900"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Sabeel No</label>
            <input
              type="text"
              value={sabeelFilter}
              onChange={(e) => setSabeelFilter(e.target.value)}
              placeholder="SAB-101"
              className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-mono text-slate-900"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Thaali No</label>
            <input
              type="text"
              value={thaaliFilter}
              onChange={(e) => setThaaliFilter(e.target.value)}
              placeholder="TH-084"
              className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-mono text-slate-900"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Mohalla</label>
            <select
              value={mohallaFilter}
              onChange={(e) => setMohallaFilter(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-slate-900 cursor-pointer"
            >
              <option value="ALL">All Mohallas</option>
              {distinctMohallas.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Cashier User</label>
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-slate-900 cursor-pointer"
            >
              <option value="ALL">All Users</option>
              {distinctUsers.map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Select Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-bold text-slate-900 cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              <option value="Takhmeen">Takhmeen</option>
              <option value="Hoob">Hoob</option>
              <option value="Zabihat">Zabihat</option>
              <option value="Salwat">Salwat</option>
              <option value="Fateha">Fateha</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Row 3: Category Checkboxes [cite: 41] */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs">
          <span className="font-bold text-slate-700">Category Checkboxes:</span>
          {(['Takhmeen', 'Hoob', 'Zabihat', 'Salwat', 'Fateha', 'Other'] as FmbReceiptCategory[]).map(cat => (
            <label key={cat} className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={categoryFilters[cat]}
                onChange={() => toggleCategory(cat)}
                className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
              <span className="font-medium text-slate-800">{cat}</span>
            </label>
          ))}
        </div>

        {/* Row 4: Payment Mode Filters [cite: 41] */}
        <div className="pt-1 flex flex-wrap items-center gap-4 text-xs">
          <span className="font-bold text-slate-700">Payment Mode Checkboxes:</span>
          {(['Cash', 'Cheque', 'Online', 'Standing Order'] as FmbPaymentModeExtended[]).map(mode => (
            <label key={mode} className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={modeFilters[mode]}
                onChange={() => toggleMode(mode)}
                className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
              <span className="font-medium text-slate-800">{mode}</span>
            </label>
          ))}

          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setStartDate('');
              setEndDate('');
              setItsFilter('');
              setSabeelFilter('');
              setThaaliFilter('');
              setMohallaFilter('ALL');
              setUserFilter('ALL');
              setTypeFilter('ALL');
              setCategoryFilters({ Takhmeen: true, Hoob: true, Zabihat: true, Salwat: true, Fateha: true, Other: true });
              setModeFilters({ Cash: true, Cheque: true, Online: true, 'Standing Order': true });
            }}
            className="ml-auto text-xs font-bold text-amber-800 hover:text-amber-950 hover:underline cursor-pointer"
          >
            Reset All Filters
          </button>
        </div>
      </div>

      {/* ── Table Grid Display Entries [cite: 41] ── */}
      <div className="bg-white border border-amber-300/60 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSelectAll}
              className="font-bold text-slate-700 hover:text-slate-950 flex items-center gap-1.5 cursor-pointer"
            >
              {selectedReceiptIds.length === filteredReceipts.length && filteredReceipts.length > 0 ? (
                <CheckSquare className="w-4 h-4 text-amber-600" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>Select All Filtered ({filteredReceipts.length})</span>
            </button>
            <span className="text-slate-400">|</span>
            <span className="text-slate-600 font-semibold">
              Selected: <strong className="text-amber-900">{selectedReceiptIds.length}</strong>
            </span>
          </div>

          <button
            type="button"
            onClick={() => showToast('Exported receipt log to CSV.')}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-amber-50/60 text-slate-700 font-bold border-y border-amber-200">
                <th className="py-2.5 px-3 w-8"></th>
                <th className="py-2.5 px-3">Receipt No</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Full Name / ITS</th>
                <th className="py-2.5 px-3">Sabeel / Thaali</th>
                <th className="py-2.5 px-3">Mohalla</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Mode</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
                <th className="py-2.5 px-3">Cashier</th>
                <th className="py-2.5 px-3 text-center">Print / View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReceipts.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-500">
                    No receipts found matching filters.
                  </td>
                </tr>
              ) : (
                filteredReceipts.map((item) => {
                  const isChecked = selectedReceiptIds.includes(item.id);
                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-amber-50/40 transition-colors ${isChecked ? 'bg-amber-50/30' : ''}`}
                    >
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleReceipt(item.id)}
                          className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                        {item.receiptNo}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                        {item.date}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-slate-900 block">{item.hofName}</span>
                        <span className="text-[10px] text-slate-500 font-mono">ITS: {item.itsNumber}</span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-700">
                        <span className="block font-bold">{item.sabeelNo}</span>
                        <span className="text-[10px] text-amber-900">{item.thaaliNo}</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{item.mohalla}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.category === 'Takhmeen' ? 'bg-emerald-100 text-emerald-800' :
                          item.category === 'Hoob' ? 'bg-amber-100 text-amber-900' :
                          item.category === 'Zabihat' ? 'bg-purple-100 text-purple-800' :
                          item.category === 'Salwat' ? 'bg-blue-100 text-blue-800' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {item.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-slate-700">{item.paymentMode}</span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-emerald-700 text-sm">
                        {fmtINR(item.amount)}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600 text-[11px]">{item.issuedBy}</td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => setActivePrintReceipt(item)}
                          className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Printer className="w-3 h-3" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL 1: Add Hoob/Zabihat/Dawat-E-Hadiyah Entry [cite: 41] ── */}
      {isHoobModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-amber-300 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-amber-100 bg-amber-50/70 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900">Add Hoob / Zabihat / Dawat-E-Hadiyah Entry</h3>
                <p className="text-xs text-slate-600 mt-0.5">Specialized niyaz contributions and sadqah pledges</p>
              </div>
              <button
                type="button"
                onClick={() => setIsHoobModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveHoobEntry} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Occasion / Category *</label>
                  <select
                    value={hoobCategory}
                    onChange={(e) => setHoobCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-900"
                  >
                    <option value="Hoob">Hoob (Deg Niyaz Pledge)</option>
                    <option value="Zabihat">Zabihat (Sadqah / Aqiqa)</option>
                    <option value="Salwat">Salwat Jaman Sponsorship</option>
                    <option value="Fateha">Fateha Jaman</option>
                    <option value="Other">Dawat-E-Hadiyah Contribution</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Select HOF Member *</label>
                  <select
                    value={hoobIts}
                    onChange={(e) => setHoobIts(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-900"
                  >
                    {hofs.map(h => (
                      <option key={h.id} value={h.itsNumber}>{h.fullName} ({h.itsNumber})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Amount (INR) *</label>
                  <input
                    type="number"
                    min="1"
                    value={hoobAmount}
                    onChange={(e) => setHoobAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-black text-slate-900 text-sm"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Payment Mode *</label>
                  <select
                    value={hoobMode}
                    onChange={(e) => setHoobMode(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-900"
                  >
                    <option value="Online">Online / UPI</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Cash">Cash at Counter</option>
                    <option value="Standing Order">Standing Order</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Depository Bank Account</label>
                  <select
                    value={hoobAccount}
                    onChange={(e) => setHoobAccount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900"
                  >
                    {banks.map(b => (
                      <option key={b.id} value={b.bankName}>{b.bankName}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Cheque / Ref No</label>
                  <input
                    type="text"
                    value={hoobRef}
                    onChange={(e) => setHoobRef(e.target.value)}
                    placeholder="e.g. UTR-998812"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Occasion / Niyaz Narration</label>
                <textarea
                  rows={2}
                  value={hoobNarration}
                  onChange={(e) => setHoobNarration(e.target.value)}
                  placeholder="e.g. Deg Niyaz on Farzand Salgirah, or Sadqah Zabihat..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsHoobModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-xs cursor-pointer"
                >
                  Issue Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: Create Takhmeen Receipts [cite: 41] ── */}
      {isTakhmeenModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-amber-300 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-amber-100 bg-amber-50/70 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900">Create Takhmeen Counter Receipt</h3>
                <p className="text-xs text-slate-600 mt-0.5">Rapid counter installment remittance</p>
              </div>
              <button
                type="button"
                onClick={() => setIsTakhmeenModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTakhmeenReceipt} className="p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Select Family (Pledge Account) *</label>
                <select
                  value={takhmeenIts}
                  onChange={(e) => setTakhmeenIts(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-900"
                >
                  {hofs.map(h => (
                    <option key={h.id} value={h.itsNumber}>{h.fullName} (ITS: {h.itsNumber} | Thaali: {h.thaaliNo || 'TH-084'})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Installment Amount (INR) *</label>
                  <input
                    type="number"
                    min="1"
                    value={takhmeenAmount}
                    onChange={(e) => setTakhmeenAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-black text-slate-900 text-sm"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Payment Mode *</label>
                  <select
                    value={takhmeenMode}
                    onChange={(e) => setTakhmeenMode(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-900"
                  >
                    <option value="Online">Online Gateway / NetBanking</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Cash">Cash at Counter</option>
                    <option value="Standing Order">Standing Order</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Transaction Ref / Cheque No</label>
                <input
                  type="text"
                  value={takhmeenRef}
                  onChange={(e) => setTakhmeenRef(e.target.value)}
                  placeholder="e.g. UTR-990182"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Receipt Narration</label>
                <input
                  type="text"
                  value={takhmeenNarration}
                  onChange={(e) => setTakhmeenNarration(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTakhmeenModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-xs cursor-pointer"
                >
                  Generate Takhmeen Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 3: Official Dawoodi Bohra Jamaat Trust Receipt Print Studio [cite: 41] ── */}
      {(activePrintReceipt || isPrintStudioOpen) && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-amber-300 shadow-2xl max-w-4xl w-full my-6 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 bg-amber-50 border-b border-amber-200 flex items-center justify-between no-print">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-amber-900" />
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Official Dawoodi Bohra Jamaat Trust Receipt Print Studio
                  </h3>
                  <p className="text-[11px] text-slate-600 font-mono">
                    {activePrintReceipt
                      ? `Receipt #${activePrintReceipt.receiptNo} • ${activePrintReceipt.hofName}`
                      : 'Interactive FMB Voucher Customizer & Print Layout'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActivePrintReceipt(null);
                  setIsPrintStudioOpen(false);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-amber-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 max-h-[85vh] overflow-y-auto">
              <FaizOfficialPrintReceipt
                initialData={activePrintReceipt ? {
                  receiptNo: activePrintReceipt.receiptNo.replace(/[^0-9]/g, '') || activePrintReceipt.receiptNo,
                  dateStr: activePrintReceipt.date,
                  memberName: activePrintReceipt.hofName.toUpperCase(),
                  itsNo: activePrintReceipt.itsNumber,
                  address: (hofs.find(h => h.itsNumber === activePrintReceipt.itsNumber)?.address || 'BURHANI PARK, OPP. NAVANA PUMPING STATION, VATWA, AHMEDABAD').toUpperCase(),
                  amount: activePrintReceipt.amount,
                  paymentModeStr: activePrintReceipt.paymentMode === 'Cash' ? 'By Cash.' : (activePrintReceipt.paymentMode === 'Cheque' ? 'By Cheque.' : `By ${activePrintReceipt.paymentMode}.`),
                  purposeTitle: activePrintReceipt.category === 'Takhmeen' ? 'Takhmeen' : (activePrintReceipt.category === 'Hoob' ? 'Hoob' : 'Donation'),
                } : undefined}
                currentUser={currentUser}
                onClose={() => {
                  setActivePrintReceipt(null);
                  setIsPrintStudioOpen(false);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
