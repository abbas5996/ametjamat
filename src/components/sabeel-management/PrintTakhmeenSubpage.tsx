import React, { useState, useMemo } from 'react';
import {
  Printer, Search, Filter, RefreshCw, CheckCircle2, AlertCircle, FileText,
  User, CheckSquare, Square, Download, X, Eye, MapPin
} from 'lucide-react';
import { SabeelLedgerRecord, HeadOfFamily } from '../../types';
import { getGradeForAmount } from '../../utils/sabeelProductionSuite';

interface PrintTakhmeenSubpageProps {
  ledger: SabeelLedgerRecord[];
  hofs: HeadOfFamily[];
  showToast: (msg: string) => void;
}

const fmtINR = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export const PrintTakhmeenSubpage: React.FC<PrintTakhmeenSubpageProps> = ({
  ledger,
  hofs,
  showToast,
}) => {
  // Advanced Search Filters
  const [itsNoFilter, setItsNoFilter] = useState('');
  const [sabeelNoFilter, setSabeelNoFilter] = useState('');
  const [firstNameFilter, setFirstNameFilter] = useState('');
  const [middleNameFilter, setMiddleNameFilter] = useState('');
  const [lastNameFilter, setLastNameFilter] = useState('');
  const [mohallaFilter, setMohallaFilter] = useState('ALL');
  const [hijriYear, setHijriYear] = useState('1447');
  const [hofFilter, setHofFilter] = useState<'ALL' | 'HOF_ONLY' | 'NON_HOF'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DONE' | 'PENDING'>('ALL');
  const [entriesPerPage, setEntriesPerPage] = useState<number>(50);

  // Selection for bulk printing
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modal for printable form preview
  const [previewMember, setPreviewMember] = useState<SabeelLedgerRecord | null>(null);

  // Distinct Mohallas
  const distinctMohallas = useMemo(() => {
    const set = new Set<string>();
    ledger.forEach(r => {
      if (r.mohallah) set.add(r.mohallah);
    });
    return Array.from(set).sort();
  }, [ledger]);

  // Filtered Records
  const filteredRecords = useMemo(() => {
    return ledger.filter(r => {
      if (itsNoFilter.trim() && !(r.itsNumber || '').toLowerCase().includes(itsNoFilter.toLowerCase().trim())) {
        return false;
      }
      if (sabeelNoFilter.trim() && !(r.sabeelNumber || r.sabeelNo || '').toLowerCase().includes(sabeelNoFilter.toLowerCase().trim())) {
        return false;
      }

      const fullName = (r.hofName || r.memberName || '').toLowerCase();
      if (firstNameFilter.trim() && !fullName.includes(firstNameFilter.toLowerCase().trim())) {
        return false;
      }
      if (middleNameFilter.trim() && !fullName.includes(middleNameFilter.toLowerCase().trim())) {
        return false;
      }
      if (lastNameFilter.trim() && !fullName.includes(lastNameFilter.toLowerCase().trim())) {
        return false;
      }

      if (mohallaFilter !== 'ALL' && (r.mohallah || '') !== mohallaFilter) {
        return false;
      }

      const pledged = r.annualPledged || r.totalAllocated || 0;
      if (statusFilter === 'DONE' && pledged === 0) return false;
      if (statusFilter === 'PENDING' && pledged > 0) return false;

      return true;
    });
  }, [
    ledger,
    itsNoFilter,
    sabeelNoFilter,
    firstNameFilter,
    middleNameFilter,
    lastNameFilter,
    mohallaFilter,
    statusFilter,
  ]);

  const displayedRecords = useMemo(() => {
    return filteredRecords.slice(0, entriesPerPage);
  }, [filteredRecords, entriesPerPage]);

  const handleSelectAll = () => {
    if (selectedIds.length === displayedRecords.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(displayedRecords.map(r => r.id || r.itsNumber));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const resetFilters = () => {
    setItsNoFilter('');
    setSabeelNoFilter('');
    setFirstNameFilter('');
    setMiddleNameFilter('');
    setLastNameFilter('');
    setMohallaFilter('ALL');
    setStatusFilter('ALL');
    setHofFilter('ALL');
    showToast('Search filters reset');
  };

  const handleBulkPrint = () => {
    if (selectedIds.length === 0) {
      showToast('Please select at least one record to print.');
      return;
    }
    showToast(`Generating Takhmeen forms for ${selectedIds.length} members...`);
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Printer className="w-5 h-5 text-amber-600" />
              <span>Print Takhmeen Forms (Pledge Master)</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Generate authentic Jamaat Takhmeen assessment forms for Mumineen families with Hijri cycle headers and Raza endorsement.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkPrint}
              disabled={selectedIds.length === 0}
              className={`px-4 py-2 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer ${
                selectedIds.length > 0
                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Printer className="w-4 h-4" />
              <span>Print Selected ({selectedIds.length})</span>
            </button>
            <button
              onClick={resetFilters}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Filter Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">ITS Number</label>
            <input
              type="text"
              placeholder="e.g. 40291844"
              value={itsNoFilter}
              onChange={e => setItsNoFilter(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Sabeel No</label>
            <input
              type="text"
              placeholder="e.g. SB-015"
              value={sabeelNoFilter}
              onChange={e => setSabeelNoFilter(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">First Name</label>
            <input
              type="text"
              placeholder="e.g. Huzefa"
              value={firstNameFilter}
              onChange={e => setFirstNameFilter(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Last / Family Name</label>
            <input
              type="text"
              placeholder="e.g. Jamali"
              value={lastNameFilter}
              onChange={e => setLastNameFilter(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Mohallah</label>
            <select
              value={mohallaFilter}
              onChange={e => setMohallaFilter(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-amber-500 bg-white cursor-pointer"
            >
              <option value="ALL">All Mohallahs</option>
              {distinctMohallas.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Hijri Year</label>
            <select
              value={hijriYear}
              onChange={e => setHijriYear(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-amber-500 bg-white cursor-pointer"
            >
              <option value="1447">1447 H (2025-26)</option>
              <option value="1446">1446 H (2024-25)</option>
              <option value="1448">1448 H (2026-27)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Takhmeen Status</label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-amber-500 bg-white cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="DONE">Takhmeen Done</option>
              <option value="PENDING">Takhmeen Pending</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Display Entries</label>
            <select
              value={entriesPerPage}
              onChange={e => setEntriesPerPage(Number(e.target.value))}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-amber-500 bg-white cursor-pointer font-bold"
            >
              <option value={10}>10 entries</option>
              <option value={25}>25 entries</option>
              <option value={50}>50 entries (Recommended)</option>
              <option value={100}>100 entries</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid Display */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 cursor-pointer"
            >
              {selectedIds.length === displayedRecords.length && displayedRecords.length > 0 ? (
                <CheckSquare className="w-4 h-4 text-amber-600" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>Select All on Page ({displayedRecords.length})</span>
            </button>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-600">
              Showing <span className="font-bold">{displayedRecords.length}</span> of <span className="font-bold">{filteredRecords.length}</span> total entries
            </span>
          </div>

          <div className="text-xs font-semibold text-slate-500">
            Year: <span className="text-amber-800 font-bold">{hijriYear} H</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-3 w-10 text-center">Select</th>
                <th className="py-2.5 px-3">Sr.No</th>
                <th className="py-2.5 px-3">ITS No</th>
                <th className="py-2.5 px-3">Sabeel No</th>
                <th className="py-2.5 px-4">Head of Family</th>
                <th className="py-2.5 px-3">Mohallah</th>
                <th className="py-2.5 px-3">Grade</th>
                <th className="py-2.5 px-3 text-right">Committed Pledge</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {displayedRecords.map((r, idx) => {
                const id = r.id || r.itsNumber;
                const isSelected = selectedIds.includes(id);
                const pledged = r.annualPledged || r.totalAllocated || 0;
                const grade = r.grade || getGradeForAmount(pledged);

                return (
                  <tr key={id} className={`hover:bg-amber-50/40 transition-colors ${isSelected ? 'bg-amber-50/60' : ''}`}>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => toggleSelect(id)}
                        className="text-slate-400 hover:text-amber-600 cursor-pointer"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-amber-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-500">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-bold text-amber-800">{r.itsNumber}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-700">{r.sabeelNumber || r.sabeelNo || '—'}</td>
                    <td className="py-2.5 px-4 font-bold text-slate-900">{r.hofName || r.memberName}</td>
                    <td className="py-2.5 px-3 text-slate-600">{r.mohallah || '—'}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 rounded text-[10px] font-bold">
                        {grade}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                      {pledged > 0 ? fmtINR(pledged) : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {pledged > 0 ? (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold">Done</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-[10px] font-bold">Pending</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => setPreviewMember(r)}
                        className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded font-bold text-[10px] flex items-center gap-1 mx-auto transition-colors cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Preview & Print</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
              {displayedRecords.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 text-xs">
                    No entries match your search criteria. Try modifying your filter values.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Takhmeen Form Modal */}
      {previewMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white border border-slate-300 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-8">
            {/* Action Bar */}
            <div className="px-6 py-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between no-print">
              <span className="text-xs font-bold text-slate-700">
                Official Takhmeen Pledge Sheet Preview • Hijri {hijriYear}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Form</span>
                </button>
                <button
                  onClick={() => setPreviewMember(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Form Sheet (Printable Canvas) */}
            <div className="p-8 space-y-6 text-slate-900 bg-white border-2 border-amber-700/20 m-6 rounded-xl">
              {/* Spiritual Header */}
              <div className="text-center space-y-1 border-b-2 border-amber-800/40 pb-4">
                <div className="text-base font-serif font-bold text-amber-900 tracking-wider">
                  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                </div>
                <div className="text-xs font-bold text-amber-800 tracking-wide uppercase">
                  Anjuman-e-Saifee • Dawoodi Bohra Jamaat (Burhani Park)
                </div>
                <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                  Sabeel Mubarak Takhmeen Assessment Form — {hijriYear} H
                </h2>
                <p className="text-[11px] text-slate-500 italic">
                  Under the blessed Raza Mubarak of Dai al-Mutlaq Syedna Mufaddal Saifuddin (TUS)
                </p>
              </div>

              {/* Family Head Identification */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-amber-50/40 p-4 rounded-xl border border-amber-200">
                <div>
                  <span className="text-slate-500 font-semibold block text-[10px] uppercase">Head of Family (HOF):</span>
                  <span className="font-black text-slate-900 text-sm">{previewMember.hofName || previewMember.memberName}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block text-[10px] uppercase">ITS Number:</span>
                  <span className="font-black text-amber-800 text-sm">{previewMember.itsNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block text-[10px] uppercase">Sabeel Number:</span>
                  <span className="font-bold text-slate-800">{previewMember.sabeelNumber || previewMember.sabeelNo || 'Unassigned'}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block text-[10px] uppercase">Mohallah:</span>
                  <span className="font-bold text-slate-800">{previewMember.mohallah || 'General'}</span>
                </div>
              </div>

              {/* Takhmeen Assessment Details */}
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <div className="bg-slate-50 px-4 py-2 font-bold text-slate-800 border-b border-slate-200">
                  Takhmeen Allocation & Grade Commitment
                </div>
                <div className="p-4 grid grid-cols-3 gap-4">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Prior Year Sabeel:</span>
                    <span className="font-bold text-slate-700 text-sm">
                      {fmtINR((previewMember.annualPledged || 24000) * 0.9)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Proposed New Pledge:</span>
                    <span className="font-black text-emerald-700 text-sm">
                      {fmtINR(previewMember.annualPledged || previewMember.totalAllocated || 24000)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Assigned Sabeel Grade:</span>
                    <span className="font-black text-amber-800 text-sm">
                      {previewMember.grade || getGradeForAmount(previewMember.annualPledged || 24000)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Installment Schedule */}
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <div className="bg-slate-50 px-4 py-2 font-bold text-slate-800 border-b border-slate-200">
                  Approved Payment Frequency & Schedule
                </div>
                <div className="p-4 grid grid-cols-3 gap-4 text-center">
                  <div className="p-2 border border-slate-100 rounded-lg bg-slate-50">
                    <span className="block text-[10px] text-slate-500 font-semibold uppercase">Monthly Contribution</span>
                    <span className="font-black text-slate-900 mt-1 block">
                      {fmtINR(Math.round((previewMember.annualPledged || 24000) / 12))} / month
                    </span>
                  </div>
                  <div className="p-2 border border-slate-100 rounded-lg bg-slate-50">
                    <span className="block text-[10px] text-slate-500 font-semibold uppercase">Quarterly Installment</span>
                    <span className="font-black text-slate-900 mt-1 block">
                      {fmtINR(Math.round((previewMember.annualPledged || 24000) / 4))} / quarter
                    </span>
                  </div>
                  <div className="p-2 border border-slate-100 rounded-lg bg-slate-50">
                    <span className="block text-[10px] text-slate-500 font-semibold uppercase">Annual Lump Sum</span>
                    <span className="font-black text-emerald-700 mt-1 block">
                      {fmtINR(previewMember.annualPledged || 24000)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Declaration & Signatures */}
              <div className="pt-4 border-t border-slate-200 text-xs space-y-8">
                <p className="text-[11px] text-slate-500 leading-relaxed italic">
                  I hereby commit to the above Sabeel Mubarak allocation for the Hijri year {hijriYear} to support the 
                  sacred khidmat of the Dawoodi Bohra Jamaat, Masjid maintenance, and community welfare programs.
                </p>

                <div className="grid grid-cols-3 gap-6 pt-6 text-center">
                  <div className="border-t border-slate-400 pt-2">
                    <span className="text-[11px] font-bold text-slate-700">Signature of HOF</span>
                    <p className="text-[10px] text-slate-400 mt-0.5">{previewMember.hofName || previewMember.memberName}</p>
                  </div>
                  <div className="border-t border-slate-400 pt-2">
                    <span className="text-[11px] font-bold text-slate-700">Janab Amil Saheb (Raza)</span>
                    <p className="text-[10px] text-slate-400 mt-0.5">Approved & Endorsed</p>
                  </div>
                  <div className="border-t border-slate-400 pt-2">
                    <span className="text-[11px] font-bold text-slate-700">Jamaat Secretary / Treasurer</span>
                    <p className="text-[10px] text-slate-400 mt-0.5">Office Seal & Date</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
