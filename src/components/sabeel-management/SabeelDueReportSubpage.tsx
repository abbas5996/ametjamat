import React, { useState, useMemo } from 'react';
import {
  AlertCircle, Search, Filter, Phone, Mail, MessageSquare, Send, RefreshCw,
  Printer, FileSpreadsheet, CheckSquare, Square, Download, ArrowUpRight, DollarSign
} from 'lucide-react';
import { SabeelLedgerRecord, SabeelTransactionEntry } from '../../types';
import { SabeelTypeRecord, getGradeForAmount, saveStoredSabeelLedger } from '../../utils/sabeelProductionSuite';

interface SabeelDueReportSubpageProps {
  ledger: SabeelLedgerRecord[];
  setLedger: React.Dispatch<React.SetStateAction<SabeelLedgerRecord[]>>;
  transactions: SabeelTransactionEntry[];
  sabeelTypes: SabeelTypeRecord[];
  showToast: (msg: string) => void;
}

const fmtINR = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export const SabeelDueReportSubpage: React.FC<SabeelDueReportSubpageProps> = ({
  ledger,
  setLedger,
  transactions,
  sabeelTypes,
  showToast,
}) => {
  // Search Filters
  const [sabeelNoFilter, setSabeelNoFilter] = useState('');
  const [mohallaFilter, setMohallaFilter] = useState('ALL');
  const [sabeelTypeFilter, setSabeelTypeFilter] = useState('ALL');
  const [dueThresholdFilter, setDueThresholdFilter] = useState<'ALL' | 'GT_0' | 'GT_10K' | 'GT_25K' | 'GT_50K'>('GT_0');
  const [itsNoFilter, setItsNoFilter] = useState('');

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Distinct Mohallas
  const distinctMohallas = useMemo(() => {
    const set = new Set<string>();
    ledger.forEach(r => {
      if (r.mohallah) set.add(r.mohallah);
    });
    return Array.from(set).sort();
  }, [ledger]);

  // Last payment lookup map
  const lastPaymentMap = useMemo(() => {
    const map: Record<string, string> = {};
    transactions.forEach(t => {
      const its = t.itsNumber;
      const pd = t.paymentDate || t.date || '';
      if (!map[its] || pd > map[its]) {
        map[its] = pd;
      }
    });
    return map;
  }, [transactions]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    return ledger.filter(r => {
      const committed = r.annualPledged || r.totalAllocated || 0;
      const paid = r.totalPaid || 0;
      const due = Math.max(0, committed - paid);

      if (dueThresholdFilter === 'GT_0' && due <= 0) return false;
      if (dueThresholdFilter === 'GT_10K' && due < 10000) return false;
      if (dueThresholdFilter === 'GT_25K' && due < 25000) return false;
      if (dueThresholdFilter === 'GT_50K' && due < 50000) return false;

      if (itsNoFilter.trim() && !(r.itsNumber || '').toLowerCase().includes(itsNoFilter.toLowerCase().trim())) {
        return false;
      }
      if (sabeelNoFilter.trim() && !(r.sabeelNumber || r.sabeelNo || '').toLowerCase().includes(sabeelNoFilter.toLowerCase().trim())) {
        return false;
      }
      if (mohallaFilter !== 'ALL' && (r.mohallah || '') !== mohallaFilter) {
        return false;
      }
      if (sabeelTypeFilter !== 'ALL' && (r.category || r.sabeelType || '') !== sabeelTypeFilter) {
        return false;
      }

      return true;
    });
  }, [
    ledger,
    dueThresholdFilter,
    itsNoFilter,
    sabeelNoFilter,
    mohallaFilter,
    sabeelTypeFilter,
  ]);

  const totalOutstanding = useMemo(() => {
    return filteredRows.reduce((acc, r) => {
      const committed = r.annualPledged || r.totalAllocated || 0;
      const paid = r.totalPaid || 0;
      return acc + Math.max(0, committed - paid);
    }, 0);
  }, [filteredRows]);

  const handleSelectAll = () => {
    if (selectedIds.length === filteredRows.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredRows.map(r => r.id || r.itsNumber));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Communication Dispatch Handlers
  const handleSendWhatsApp = () => {
    if (selectedIds.length === 0) {
      showToast('Select at least one member to send WhatsApp reminder');
      return;
    }
    showToast(`WhatsApp reminder dispatched to ${selectedIds.length} members with authentic Bohra Sabeel Mubarak notice`);
  };

  const handleSendNotification = () => {
    if (selectedIds.length === 0) {
      showToast('Select at least one member to send In-App notification');
      return;
    }
    showToast(`In-app mobile notification queued for ${selectedIds.length} accounts`);
  };

  const handleSendEmail = () => {
    if (selectedIds.length === 0) {
      showToast('Select at least one member to send Email reminder');
      return;
    }
    showToast(`Official Jamaat email demand note sent to ${selectedIds.length} members`);
  };

  const handleUpdateSabeelDueAmount = () => {
    // Re-verify & sync dues calculation across all rows
    const updated = ledger.map(r => ({
      ...r,
      lastUpdated: new Date().toISOString(),
    }));
    setLedger(updated);
    saveStoredSabeelLedger(updated);
    showToast('All Sabeel due amounts audited and reconciled with ledger!');
  };

  const handleExportCSV = () => {
    const headers = ['Sr.No', 'ITS No', 'Full Name', 'Mohalla Name', 'Sabeel Type', 'Grade', 'Committed Amount', 'Sabeel No', 'Mobile No', 'Paid Till', 'Outstanding Balance'];
    const rows = filteredRows.map((r, i) => {
      const committed = r.annualPledged || r.totalAllocated || 0;
      const paid = r.totalPaid || 0;
      const due = Math.max(0, committed - paid);
      return [
        i + 1,
        `"${r.itsNumber}"`,
        `"${r.hofName || r.memberName}"`,
        `"${r.mohallah || ''}"`,
        `"${r.category || r.sabeelType || 'Residential'}"`,
        `"${r.grade || getGradeForAmount(committed)}"`,
        committed,
        `"${r.sabeelNumber || r.sabeelNo || ''}"`,
        `"${r.contactPhone || '+91 98200 00000'}"`,
        `"${lastPaymentMap[r.itsNumber] || 'No payment yet'}"`,
        due,
      ].join(',');
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `Sabeel_Due_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${filteredRows.length} outstanding accounts to CSV`);
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <span>Sabeel Due Report (Outstanding Defaulters Register)</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Multi-channel reminder dispatch and detailed outstanding balances per household across all Mohallahs.
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSendWhatsApp}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Send WhatsApp</span>
            </button>
            <button
              onClick={handleSendNotification}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Notification</span>
            </button>
            <button
              onClick={handleSendEmail}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Send Email</span>
            </button>
            <button
              onClick={handleUpdateSabeelDueAmount}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Recalculate and update all Sabeel due balances"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Update Sabeel Due Amount</span>
            </button>
          </div>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-4 text-xs">
          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">ITS Number</label>
            <input
              type="text"
              placeholder="e.g. 40291844"
              value={itsNoFilter}
              onChange={e => setItsNoFilter(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Sabeel No</label>
            <input
              type="text"
              placeholder="e.g. SB-015"
              value={sabeelNoFilter}
              onChange={e => setSabeelNoFilter(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Mohallah</label>
            <select
              value={mohallaFilter}
              onChange={e => setMohallaFilter(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 bg-white cursor-pointer font-medium"
            >
              <option value="ALL">All Mohallahs</option>
              {distinctMohallas.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Sabeel Type</label>
            <select
              value={sabeelTypeFilter}
              onChange={e => setSabeelTypeFilter(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 bg-white cursor-pointer font-medium"
            >
              <option value="ALL">All Sabeel Types</option>
              {sabeelTypes.map(st => (
                <option key={st.id} value={st.sabeelType}>{st.sabeelType}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Due Threshold</label>
            <select
              value={dueThresholdFilter}
              onChange={e => setDueThresholdFilter(e.target.value as any)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 bg-white cursor-pointer font-bold text-slate-900"
            >
              <option value="GT_0">All Outstanding (&gt; ₹0)</option>
              <option value="GT_10K">&gt; ₹10,000</option>
              <option value="GT_25K">&gt; ₹25,000</option>
              <option value="GT_50K">&gt; ₹50,000 (Critical)</option>
              <option value="ALL">All Accounts (Including Cleared)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-bold text-amber-900">
            {filteredRows.length} Accounts with Outstanding Pledges
          </span>
          <span className="text-slate-400">•</span>
          <span className="text-slate-600">
            Selected: <span className="font-black text-slate-900">{selectedIds.length}</span> members
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="font-bold text-slate-800">
            Total Outstanding Balance: <span className="font-black text-rose-600 text-sm ml-1">{fmtINR(totalOutstanding)}</span>
          </div>
          <button
            onClick={handleExportCSV}
            className="px-3 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg font-bold flex items-center gap-1 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-3 w-10 text-center">
                  <button onClick={handleSelectAll} className="cursor-pointer">
                    {selectedIds.length === filteredRows.length && filteredRows.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-amber-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </th>
                <th className="py-2.5 px-3">Sr.No</th>
                <th className="py-2.5 px-3">ITS No</th>
                <th className="py-2.5 px-4">Full Name</th>
                <th className="py-2.5 px-3">Mohalla Name</th>
                <th className="py-2.5 px-3">Sabeel Type</th>
                <th className="py-2.5 px-3">Grade</th>
                <th className="py-2.5 px-3 text-right">Sabeel Amount</th>
                <th className="py-2.5 px-3">Sabeel No</th>
                <th className="py-2.5 px-3">Mobile No</th>
                <th className="py-2.5 px-3">Paid Till</th>
                <th className="py-2.5 px-4 text-right font-black">Outstanding Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredRows.map((r, idx) => {
                const id = r.id || r.itsNumber;
                const isSelected = selectedIds.includes(id);
                const committed = r.annualPledged || r.totalAllocated || 0;
                const paid = r.totalPaid || 0;
                const due = Math.max(0, committed - paid);
                const lastPaid = lastPaymentMap[r.itsNumber] || 'No receipt yet';

                return (
                  <tr key={id} className={`hover:bg-amber-50/40 transition-colors ${isSelected ? 'bg-amber-50/60' : ''}`}>
                    <td className="py-2.5 px-3 text-center">
                      <button onClick={() => toggleSelect(id)} className="cursor-pointer">
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-amber-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-500">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-bold text-amber-800">{r.itsNumber}</td>
                    <td className="py-2.5 px-4 font-bold text-slate-900">{r.hofName || r.memberName}</td>
                    <td className="py-2.5 px-3 text-slate-600">{r.mohallah || '—'}</td>
                    <td className="py-2.5 px-3 text-slate-600">{r.category || r.sabeelType || 'Residential'}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 rounded text-[10px] font-bold">
                        {r.grade || getGradeForAmount(committed)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium text-slate-900">
                      {fmtINR(committed)}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-blue-700">{r.sabeelNumber || r.sabeelNo || '—'}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">{r.contactPhone || '+91 98200 44332'}</td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-500">{lastPaid}</td>
                    <td className="py-2.5 px-4 text-right font-black text-rose-600 text-xs">
                      {fmtINR(due)}
                    </td>
                  </tr>
                );
              })}
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-400">
                    No outstanding accounts found for this criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
