import React, { useState, useMemo } from 'react';
import {
  Ban, Search, Filter, Printer, Copy, FileSpreadsheet, FileText, CheckCircle2,
  AlertCircle, X, ShieldAlert, ArrowRight, RotateCcw, Download, UserX
} from 'lucide-react';
import { SabeelLedgerRecord, HeadOfFamily, UserProfile } from '../../types';
import {
  ClosedSabeelRecord, saveClosedSabeels, getClosedSabeels, saveStoredSabeelLedger
} from '../../utils/sabeelProductionSuite';

interface SabeelCloseClosedSubpageProps {
  ledger: SabeelLedgerRecord[];
  setLedger: React.Dispatch<React.SetStateAction<SabeelLedgerRecord[]>>;
  closedSabeels: ClosedSabeelRecord[];
  setClosedSabeels: React.Dispatch<React.SetStateAction<ClosedSabeelRecord[]>>;
  hofs: HeadOfFamily[];
  currentUser: UserProfile;
  showToast: (msg: string) => void;
}

const fmtINR = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export const SabeelCloseClosedSubpage: React.FC<SabeelCloseClosedSubpageProps> = ({
  ledger,
  setLedger,
  closedSabeels,
  setClosedSabeels,
  hofs,
  currentUser,
  showToast,
}) => {
  // Search state for closing
  const [itsNoSearch, setItsNoSearch] = useState('');
  const [sabeelNoSearch, setSabeelNoSearch] = useState('');
  const [mohallaSearch, setMohallaSearch] = useState('ALL');
  const [selectedMember, setSelectedMember] = useState<SabeelLedgerRecord | null>(null);

  // Closure form
  const [closeDate, setCloseDate] = useState(new Date().toISOString().split('T')[0]);
  const [closeReason, setCloseReason] = useState('');
  const [approvedBy, setApprovedBy] = useState('Janab Amil Saheb');
  const [clearanceStatus, setClearanceStatus] = useState<ClosedSabeelRecord['clearanceStatus']>('Safai Chitthi Issued');

  // Closed List Search
  const [closedListSearch, setClosedListSearch] = useState('');

  // Distinct Mohallas
  const distinctMohallas = useMemo(() => {
    const set = new Set<string>();
    ledger.forEach(r => {
      if (r.mohallah) set.add(r.mohallah);
    });
    return Array.from(set).sort();
  }, [ledger]);

  // Handle Search for member to close
  const handleSearchActive = (e: React.FormEvent) => {
    e.preventDefault();
    const found = ledger.find(r => {
      if (itsNoSearch.trim() && (r.itsNumber || '').toLowerCase() === itsNoSearch.trim().toLowerCase()) return true;
      if (sabeelNoSearch.trim() && (r.sabeelNumber || r.sabeelNo || '').toLowerCase() === sabeelNoSearch.trim().toLowerCase()) return true;
      return false;
    });

    if (found) {
      setSelectedMember(found);
      showToast(`Selected member: ${found.hofName || found.memberName}`);
    } else {
      setSelectedMember(null);
      showToast('No active Sabeel account found matching your search');
    }
  };

  // Execute Close
  const handleExecuteClose = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    if (!closeReason.trim()) {
      showToast('Please state a reason for closure');
      return;
    }

    const newClosedRecord: ClosedSabeelRecord = {
      id: `CSB-${Date.now().toString().slice(-4)}`,
      sabeelNumber: selectedMember.sabeelNumber || selectedMember.sabeelNo || '—',
      itsNumber: selectedMember.itsNumber,
      fullName: selectedMember.hofName || selectedMember.memberName || '—',
      sabeelType: selectedMember.category || selectedMember.sabeelType || 'Residential Sabeel',
      grade: selectedMember.grade || 'Grade B',
      closedDate: closeDate,
      closedReason: closeReason.trim(),
      approvedBy,
      clearanceStatus,
      isActive: false,
    };

    const updatedClosed = [newClosedRecord, ...closedSabeels];
    setClosedSabeels(updatedClosed);
    saveClosedSabeels(updatedClosed);

    // Remove or mark inactive in active ledger
    const updatedLedger = ledger.filter(r => r.id !== selectedMember.id && r.itsNumber !== selectedMember.itsNumber);
    setLedger(updatedLedger);
    saveStoredSabeelLedger(updatedLedger);

    showToast(`Sabeel ${newClosedRecord.sabeelNumber} has been closed and archived.`);
    setSelectedMember(null);
    setItsNoSearch('');
    setSabeelNoSearch('');
    setCloseReason('');
  };

  // Reactivate a closed sabeel
  const handleReactivate = (closed: ClosedSabeelRecord) => {
    if (confirm(`Do you want to re-open Sabeel account ${closed.sabeelNumber} for ${closed.fullName}?`)) {
      const restoredLedgerRecord: SabeelLedgerRecord = {
        id: `LDR-${Date.now().toString().slice(-4)}`,
        itsNumber: closed.itsNumber,
        hofName: closed.fullName,
        memberName: closed.fullName,
        sabeelNumber: closed.sabeelNumber,
        sabeelNo: closed.sabeelNumber,
        category: closed.sabeelType as any,
        sabeelType: closed.sabeelType,
        grade: closed.grade,
        annualPledged: 24000,
        totalAllocated: 24000,
        totalPaid: 0,
        mohallah: 'General',
        committedAmount: 24000,
        paidAmount: 0,
        balanceDue: 24000,
        status: 'Pending',
        mobileNumber: '',
        mohallahName: 'General',
        financialYear: new Date().getFullYear().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatedLedger = [restoredLedgerRecord, ...ledger];
      const updatedClosed = closedSabeels.filter(c => c.id !== closed.id);

      setLedger(updatedLedger);
      saveStoredSabeelLedger(updatedLedger);
      setClosedSabeels(updatedClosed);
      saveClosedSabeels(updatedClosed);

      showToast(`Sabeel ${closed.sabeelNumber} reactivated successfully!`);
    }
  };

  // Filtered Closed List
  const filteredClosedList = useMemo(() => {
    return closedSabeels.filter(
      c =>
        c.sabeelNumber.toLowerCase().includes(closedListSearch.toLowerCase()) ||
        c.itsNumber.toLowerCase().includes(closedListSearch.toLowerCase()) ||
        c.fullName.toLowerCase().includes(closedListSearch.toLowerCase()) ||
        c.clearanceStatus.toLowerCase().includes(closedListSearch.toLowerCase())
    );
  }, [closedSabeels, closedListSearch]);

  // Export handlers
  const handleCopy = () => {
    const text = filteredClosedList
      .map((c, i) => `${i + 1}\t${c.sabeelNumber}\t${c.itsNumber}\t${c.fullName}\t${c.sabeelType}\t${c.grade}\t${c.closedDate}\t${c.clearanceStatus}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    showToast(`Copied ${filteredClosedList.length} rows to clipboard`);
  };

  const handleExportCSV = () => {
    const headers = ['Sr.No', 'Sabeel Number', 'ITS No', 'Full Name', 'Sabeel Type', 'Grade', 'Closed Date', 'Clearance Status', 'Reason', 'Approved By'];
    const rows = filteredClosedList.map((c, i) => [
      i + 1,
      `"${c.sabeelNumber}"`,
      `"${c.itsNumber}"`,
      `"${c.fullName}"`,
      `"${c.sabeelType}"`,
      `"${c.grade}"`,
      `"${c.closedDate}"`,
      `"${c.clearanceStatus}"`,
      `"${c.closedReason}"`,
      `"${c.approvedBy}"`,
    ].join(','));
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Closed_Sabeels_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${filteredClosedList.length} records to CSV`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Ban className="w-5 h-5 text-rose-600" />
          <span>Close Sabeel & Closed Sabeel Register</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Process formal Sabeel closures (Relocation to other Jamaat, Safai Chitthi issuance, or waiver) and maintain permanent audit archive.
        </p>
      </div>

      {/* Close Active Sabeel Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Search & Dues Check Box */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Search className="w-4 h-4 text-amber-600" />
            <span>Search Active Sabeel to Close</span>
          </h2>

          <form onSubmit={handleSearchActive} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-600 font-bold mb-1">ITS Number</label>
              <input
                type="text"
                placeholder="Enter 8-digit ITS..."
                value={itsNoSearch}
                onChange={e => setItsNoSearch(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-bold mb-1">Sabeel Number</label>
              <input
                type="text"
                placeholder="e.g. SB-099"
                value={sabeelNoSearch}
                onChange={e => setSabeelNoSearch(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 font-bold"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer mt-2"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Verify & Select Sabeel</span>
            </button>
          </form>

          {/* Dues Alert Banner if selected */}
          {selectedMember && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-2 mt-2">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Account Dues Verification</span>
              </div>
              <div className="text-[11px] text-amber-800">
                Pledged: <span className="font-bold">{fmtINR(selectedMember.annualPledged || 24000)}</span> • 
                Paid: <span className="font-bold text-emerald-700">{fmtINR(selectedMember.totalPaid || 0)}</span>
              </div>
              {((selectedMember.annualPledged || 24000) - (selectedMember.totalPaid || 0)) > 0 ? (
                <div className="text-[10px] text-rose-700 font-bold bg-rose-50 p-2 rounded border border-rose-200">
                  ⚠️ Outstanding Balance: {fmtINR((selectedMember.annualPledged || 24000) - (selectedMember.totalPaid || 0))}.
                  Must be cleared or official Jamaat Waiver / Safai Chitthi must be granted.
                </div>
              ) : (
                <div className="text-[10px] text-emerald-700 font-bold bg-emerald-50 p-2 rounded border border-emerald-200">
                  ✓ Full Clearance: No outstanding dues on this Sabeel account.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Closure Form */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
            <Ban className="w-4 h-4 text-rose-600" />
            <span>Closure Authorization & Clearance Status</span>
          </h2>

          {selectedMember ? (
            <form onSubmit={handleExecuteClose} className="space-y-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-black text-slate-900 text-sm">
                    {selectedMember.hofName || selectedMember.memberName}
                  </div>
                  <div className="text-slate-500 mt-0.5">
                    ITS: <span className="font-bold text-slate-700">{selectedMember.itsNumber}</span> • 
                    Sabeel No: <span className="font-bold text-blue-700">{selectedMember.sabeelNumber || selectedMember.sabeelNo || '—'}</span> • 
                    Mohallah: <span className="font-bold text-slate-700">{selectedMember.mohallah || '—'}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Grade:</span>
                  <span className="text-xs font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 inline-block mt-0.5">
                    {selectedMember.grade || 'Grade B'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Effective Closure Date</label>
                  <input
                    type="date"
                    required
                    value={closeDate}
                    onChange={e => setCloseDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Clearance Status *</label>
                  <select
                    value={clearanceStatus}
                    onChange={e => setClearanceStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 bg-white cursor-pointer font-bold text-slate-900"
                  >
                    <option value="Safai Chitthi Issued">Safai Chitthi Issued (Relocated)</option>
                    <option value="Full Clearance">Full Clearance (Zero Dues)</option>
                    <option value="Waiver Granted">Waiver Granted (Special Raza)</option>
                    <option value="Relocated">Relocated to Outstation</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-slate-600 font-bold mb-1">Approved By (Raza)</label>
                  <select
                    value={approvedBy}
                    onChange={e => setApprovedBy(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 bg-white cursor-pointer font-medium"
                  >
                    <option value="Janab Amil Saheb">Janab Amil Saheb</option>
                    <option value="Secretary Saheb">Jamaat Secretary Saheb</option>
                    <option value="Treasurer Saheb">Treasurer Saheb</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-slate-600 font-bold mb-1">Reason for Closure *</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="e.g. Family permanently relocated to Surat with official Safai Chitthi approval..."
                    value={closeReason}
                    onChange={e => setCloseReason(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 resize-none font-medium"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedMember(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Ban className="w-4 h-4" />
                  <span>Execute Sabeel Closure</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-12 text-center text-slate-400 text-xs">
              Search and verify an active Sabeel account on the left to activate the closure protocol.
            </div>
          )}
        </div>
      </div>

      {/* Closed Sabeel List Table & Export Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <UserX className="w-4 h-4 text-rose-600" />
              <span>Closed Sabeel List & Archive Register ({filteredClosedList.length})</span>
            </h2>
            <p className="text-[11px] text-slate-500">Historical records of deactivated, settled, or relocated Sabeel accounts</p>
          </div>

          {/* Export Action Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel / CSV</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-bold text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="px-5 py-2.5 bg-white border-b border-slate-100">
          <div className="relative max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by Sabeel No, ITS No, Name, Status..."
              value={closedListSearch}
              onChange={e => setClosedListSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-3">Sr.No</th>
                <th className="py-2.5 px-3">SabeelNumber</th>
                <th className="py-2.5 px-3">ITS No</th>
                <th className="py-2.5 px-4">Full Name</th>
                <th className="py-2.5 px-3">SabeelType</th>
                <th className="py-2.5 px-3">Grade</th>
                <th className="py-2.5 px-3">Closed Date</th>
                <th className="py-2.5 px-4">Clearance Status</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredClosedList.map((c, idx) => (
                <tr key={c.id} className="hover:bg-amber-50/40 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-slate-500">{idx + 1}</td>
                  <td className="py-2.5 px-3 font-black text-slate-900">{c.sabeelNumber}</td>
                  <td className="py-2.5 px-3 font-bold text-amber-800">{c.itsNumber}</td>
                  <td className="py-2.5 px-4 font-bold text-slate-900">{c.fullName}</td>
                  <td className="py-2.5 px-3 text-slate-600">{c.sabeelType}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded text-[10px] font-bold">
                      {c.grade}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">{c.closedDate}</td>
                  <td className="py-2.5 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      c.clearanceStatus === 'Safai Chitthi Issued' ? 'bg-purple-100 text-purple-800' :
                      c.clearanceStatus === 'Full Clearance' ? 'bg-emerald-100 text-emerald-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {c.clearanceStatus}
                    </span>
                    <div className="text-[10px] text-slate-400 truncate max-w-xs mt-0.5">{c.closedReason}</div>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={() => handleReactivate(c)}
                      className="px-2 py-1 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 rounded font-bold text-[10px] flex items-center gap-1 mx-auto transition-colors cursor-pointer"
                      title="Re-open Sabeel Account"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Re-open</span>
                    </button>
                  </td>
                </tr>
              ))}
              {filteredClosedList.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No closed Sabeel accounts registered.
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
