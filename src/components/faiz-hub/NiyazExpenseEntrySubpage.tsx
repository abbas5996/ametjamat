import React, { useState, useMemo } from 'react';
import {
  TrendingDown, Plus, Search, Filter, Printer, Download,
  Calendar, Check, X, Edit2, Trash2, Tag, CreditCard,
  Building2, AlertCircle, CheckCircle2, ChevronDown
} from 'lucide-react';
import {
  NiyazExpenseEntryItem,
  ExpenseHeadItem,
  ExpenseTransactionType,
  getStoredExpenseEntries,
  saveStoredExpenseEntries,
  getStoredExpenseHeads,
  saveStoredExpenseHeads,
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

export const NiyazExpenseEntrySubpage: React.FC<Props> = ({
  currentUser,
  showToast,
  canAdd = true,
  canEdit = true,
  canDelete = true,
}) => {
  const [entries, setEntries] = useState<NiyazExpenseEntryItem[]>(() => getStoredExpenseEntries());
  const [heads, setHeads] = useState<ExpenseHeadItem[]>(() => getStoredExpenseHeads());
  const [accounts] = useState(() => getStoredOpeningBalances());

  // Filters [cite: 29, 30]
  const [searchName, setSearchName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedHead, setSelectedHead] = useState('all');

  // Transaction Type Checkboxes [cite: 29, 30]
  const [typeFilters, setTypeFilters] = useState<Record<ExpenseTransactionType, boolean>>({
    Cash: true,
    Cheque: true,
    Online: true,
    'Standing Order': true,
  });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<NiyazExpenseEntryItem | null>(null);

  // Form Fields
  const [voucherNo, setVoucherNo] = useState('');
  const [date, setDate] = useState('1447-02-25');
  const [accountName, setAccountName] = useState('');
  const [expenseHeadId, setExpenseHeadId] = useState('');
  const [transactionType, setTransactionType] = useState<ExpenseTransactionType>('Online');
  const [payeeFullName, setPayeeFullName] = useState('');
  const [amount, setAmount] = useState<number>(15000);
  const [referenceNo, setReferenceNo] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'Approved' | 'Pending' | 'Paid'>('Paid');

  // Toggle transaction type filter
  const toggleTypeFilter = (t: ExpenseTransactionType) => {
    setTypeFilters(prev => ({ ...prev, [t]: !prev[t] }));
  };

  // Filtered Entries
  const filteredEntries = useMemo(() => {
    return entries.filter(e => {
      // 1. Transaction Type Checkbox match
      if (!typeFilters[e.transactionType]) return false;

      // 2. Full Name / Voucher Search
      if (searchName) {
        const q = searchName.toLowerCase();
        const matchPayee = e.payeeFullName.toLowerCase().includes(q);
        const matchVoucher = e.voucherNo.toLowerCase().includes(q);
        const matchAccount = e.accountName.toLowerCase().includes(q);
        if (!matchPayee && !matchVoucher && !matchAccount) return false;
      }

      // 3. Expense Head match
      if (selectedHead !== 'all' && e.expenseHeadId !== selectedHead) return false;

      // 4. Date Range
      if (startDate && e.date < startDate) return false;
      if (endDate && e.date > endDate) return false;

      return true;
    });
  }, [entries, typeFilters, searchName, selectedHead, startDate, endDate]);

  // Aggregate Totals
  const totalFilteredExpense = useMemo(() => {
    return filteredEntries.reduce((s, e) => s + e.amount, 0);
  }, [filteredEntries]);

  // Open Modal for Add
  const openAddModal = () => {
    setEditingItem(null);
    setVoucherNo(`FMB-VCH-${Date.now().toString().slice(-4)}`);
    setDate(new Date().toISOString().split('T')[0]);
    setAccountName(accounts[0]?.bankName ? `${accounts[0].bankName} (${accounts[0].accountNo})` : 'State Bank of India — FMB Kitchen A/C');
    setExpenseHeadId(heads[0]?.id || 'eh-1');
    setTransactionType('Online');
    setPayeeFullName('');
    setAmount(25000);
    setReferenceNo('');
    setDescription('');
    setStatus('Approved');
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const openEditModal = (item: NiyazExpenseEntryItem) => {
    setEditingItem(item);
    setVoucherNo(item.voucherNo);
    setDate(item.date);
    setAccountName(item.accountName);
    setExpenseHeadId(item.expenseHeadId);
    setTransactionType(item.transactionType);
    setPayeeFullName(item.payeeFullName);
    setAmount(item.amount);
    setReferenceNo(item.referenceNo);
    setDescription(item.description);
    setStatus(item.status);
    setIsModalOpen(true);
  };

  const handleDelete = (item: NiyazExpenseEntryItem) => {
    if (!canDelete) {
      showToast('You do not have permission to delete expense entries.');
      return;
    }
    if (window.confirm(`Delete expense voucher "${item.voucherNo}" for ${fmtINR(item.amount)}?`)) {
      const next = entries.filter(e => e.id !== item.id);
      setEntries(next);
      saveStoredExpenseEntries(next);
      showToast(`Deleted voucher ${item.voucherNo}`);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payeeFullName.trim() || amount <= 0) {
      showToast('Please enter payee full name and valid expense amount.');
      return;
    }

    const headObj = heads.find(h => h.id === expenseHeadId) || heads[0];

    if (editingItem) {
      const updated = entries.map(item =>
        item.id === editingItem.id
          ? {
              ...item,
              voucherNo,
              date,
              accountName,
              expenseHeadId,
              expenseHeadName: headObj.name,
              transactionType,
              payeeFullName: payeeFullName.trim(),
              amount,
              referenceNo: referenceNo.trim() || 'N/A',
              description: description.trim(),
              status,
            }
          : item
      );
      setEntries(updated);
      saveStoredExpenseEntries(updated);
      showToast(`Updated expense voucher ${voucherNo}`);
    } else {
      const newEntry: NiyazExpenseEntryItem = {
        id: `exp-${Date.now()}`,
        voucherNo,
        date,
        accountName,
        expenseHeadId,
        expenseHeadName: headObj.name,
        transactionType,
        payeeFullName: payeeFullName.trim(),
        amount,
        referenceNo: referenceNo.trim() || 'N/A',
        description: description.trim(),
        status,
        createdBy: currentUser.username,
      };
      const updated = [newEntry, ...entries];
      setEntries(updated);
      saveStoredExpenseEntries(updated);
      showToast(`Added new expense voucher ${voucherNo}`);
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* ── Banner Card ── */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300/60 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500 text-slate-950 shadow-xs">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              Expense Heads & Niyaz Expense Entry List
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Comprehensive disbursement registers, transaction mode filters, and bulk printing [cite: 29, 30]
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => showToast(`Bulk printed ${filteredEntries.length} expense vouchers.`)}
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
              <span>Add New Expense Entry</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Account Names Table Summary ── */}
      <div className="bg-white border border-amber-200 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-amber-600" />
            <span>Disbursement Bank & Vault Accounts</span>
          </span>
          <span className="text-xs font-bold text-slate-700">
            Total Filtered Outflow: <strong className="text-rose-700 text-sm font-black">{fmtINR(totalFilteredExpense)}</strong>
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {accounts.map(acc => (
            <div key={acc.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-bold text-slate-900 block truncate">{acc.bankName}</span>
              <span className="text-[10px] text-slate-500 font-mono block">A/C: {acc.accountNo}</span>
              <span className="text-[11px] font-black text-slate-700 block mt-1">Bal: {fmtINR(acc.openingBal)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Multi-Filter Control Console [cite: 29, 30] ── */}
      <div className="bg-white border border-amber-300/60 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 text-xs">
          {/* Full Name Search */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700">Full Name / Payee Search</label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="Search payee or voucher..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
          </div>

          {/* Expense Head Dropdown */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700">Expense Head</label>
            <select
              value={selectedHead}
              onChange={(e) => setSelectedHead(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none cursor-pointer"
            >
              <option value="all">All Expense Heads (9 Categories)</option>
              {heads.map(h => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          </div>

          {/* Date Range: Start Date */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700">From Date</label>
            <input
              type="text"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="e.g. 1447-02-01"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>

          {/* Date Range: End Date */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700">To Date</label>
            <input
              type="text"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="e.g. 1447-02-29"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>
        </div>

        {/* Transaction Type Checkboxes [cite: 29, 30] */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs">
          <span className="font-bold text-slate-700">Transaction Type Checkboxes:</span>
          {(['Cash', 'Cheque', 'Online', 'Standing Order'] as ExpenseTransactionType[]).map((t) => (
            <label key={t} className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={typeFilters[t]}
                onChange={() => toggleTypeFilter(t)}
                className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
              <span className="font-medium text-slate-800">{t}</span>
            </label>
          ))}
          {(startDate || endDate || searchName || selectedHead !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchName('');
                setStartDate('');
                setEndDate('');
                setSelectedHead('all');
                setTypeFilters({ Cash: true, Cheque: true, Online: true, 'Standing Order': true });
              }}
              className="ml-auto text-xs font-bold text-amber-800 hover:text-amber-950 hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* ── Niyaz Expense Entries Table ── */}
      <div className="bg-white border border-amber-300/60 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-700">
            Expense Records ({filteredEntries.length})
          </span>
          <button
            type="button"
            onClick={() => showToast('Exported expense ledger to CSV.')}
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
                <th className="py-2.5 px-3">Voucher No</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Account Name</th>
                <th className="py-2.5 px-3">Expense Head</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Payee Full Name</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
                <th className="py-2.5 px-3">Ref No</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500">
                    No expense entries found matching filters.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((item) => (
                  <tr key={item.id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                      {item.voucherNo}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                      {item.date}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 truncate max-w-[150px]">
                      {item.accountName}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-bold text-amber-950 bg-amber-100/70 px-2 py-0.5 rounded">
                        {item.expenseHeadName}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.transactionType === 'Online' ? 'bg-blue-100 text-blue-800' :
                        item.transactionType === 'Cheque' ? 'bg-amber-100 text-amber-800' :
                        item.transactionType === 'Cash' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {item.transactionType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {item.payeeFullName}
                    </td>
                    <td className="py-2.5 px-3 text-right font-black text-rose-700">
                      {fmtINR(item.amount)}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">
                      {item.referenceNo}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                        item.status === 'Approved' ? 'bg-blue-100 text-blue-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => openEditModal(item)}
                            title="Edit Voucher"
                            className="p-1 rounded-md text-slate-600 hover:text-amber-800 hover:bg-amber-100 cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => handleDelete(item)}
                            title="Delete Voucher"
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

      {/* ── MODAL: Add / Edit Niyaz Expense Entry [cite: 29, 30] ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-amber-300 shadow-2xl max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-amber-100 bg-amber-50/70 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  {editingItem ? 'Edit Expense Voucher' : 'Add New Niyaz Expense Entry'}
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">Kitchen disbursement voucher and payee details</p>
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
                  <label className="font-bold text-slate-700">Voucher No *</label>
                  <input
                    type="text"
                    value={voucherNo}
                    onChange={(e) => setVoucherNo(e.target.value)}
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
                  <label className="font-bold text-slate-700">Expense Head *</label>
                  <select
                    value={expenseHeadId}
                    onChange={(e) => setExpenseHeadId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                  >
                    {heads.map(h => (
                      <option key={h.id} value={h.id}>{h.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Transaction Type *</label>
                  <select
                    value={transactionType}
                    onChange={(e) => setTransactionType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                  >
                    <option value="Online">Online / NEFT / UPI</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Cash">Cash</option>
                    <option value="Standing Order">Standing Order</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Disbursement Account Name *</label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="e.g. State Bank of India — FMB Kitchen A/C"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Payee / Supplier Full Name *</label>
                  <input
                    type="text"
                    value={payeeFullName}
                    onChange={(e) => setPayeeFullName(e.target.value)}
                    placeholder="e.g. M/S Burhani Grain Merchants"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
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

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Cheque / Ref No</label>
                  <input
                    type="text"
                    value={referenceNo}
                    onChange={(e) => setReferenceNo(e.target.value)}
                    placeholder="e.g. CHQ-889912 or UPI Ref"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Approval Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                  >
                    <option value="Paid">Paid (Disbursed)</option>
                    <option value="Approved">Approved</option>
                    <option value="Pending">Pending Audit</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Expense Description / Narration</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Items procured, quantity, or specific kitchen miqaat notes..."
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
                  {editingItem ? 'Save Voucher' : 'Post Expense Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
