import React, { useState, useMemo } from 'react';
import {
  History, Search, Calendar, Printer, FileSpreadsheet, ArrowRight, ShieldCheck,
  RefreshCw, User
} from 'lucide-react';
import { GradeChangeHistoryRecord } from '../../utils/sabeelProductionSuite';

interface SabeelGradeHistorySubpageProps {
  gradeHistory: GradeChangeHistoryRecord[];
  showToast: (msg: string) => void;
}

export const SabeelGradeHistorySubpage: React.FC<SabeelGradeHistorySubpageProps> = ({
  gradeHistory,
  showToast,
}) => {
  const [itsSearch, setItsSearch] = useState('');
  const [fromDate, setFromDate] = useState('2025-01-01');
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);

  const filteredHistory = useMemo(() => {
    return gradeHistory.filter(h => {
      if (itsSearch.trim() && !h.itsNumber.toLowerCase().includes(itsSearch.toLowerCase().trim())) {
        return false;
      }
      if (h.changeDate < fromDate || h.changeDate > toDate) {
        return false;
      }
      return true;
    });
  }, [gradeHistory, itsSearch, fromDate, toDate]);

  const resetFilters = () => {
    setItsSearch('');
    setFromDate('2025-01-01');
    setToDate(new Date().toISOString().split('T')[0]);
    showToast('Search filters reset');
  };

  const handleExportCSV = () => {
    const headers = ['Sr.No', 'ITS Number', 'Full Name', 'Sabeel No', 'Old Grade', 'New Grade', 'Change Date', 'Reason', 'Authorized By', 'Recorded Timestamp'];
    const rows = filteredHistory.map((h, i) => [
      i + 1,
      `"${h.itsNumber}"`,
      `"${h.fullName}"`,
      `"${h.sabeelNo}"`,
      `"${h.oldGrade}"`,
      `"${h.newGrade}"`,
      `"${h.changeDate}"`,
      `"${h.reason}"`,
      `"${h.authorizedBy}"`,
      `"${h.createdAt}"`,
    ].join(','));
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `Sabeel_Grade_Change_History_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${filteredHistory.length} audit records to CSV`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <History className="w-5 h-5 text-amber-600" />
              <span>Sabeel Grade Change History & Audit Log</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Historical ledger of all assessment grade modifications with justification notes and Raza authorization details.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Audit</span>
            </button>
            <button
              onClick={resetFilters}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              title="Reset Filters"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 text-xs">
          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Search ITS ID</label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Enter 8-digit ITS..."
                value={itsSearch}
                onChange={e => setItsSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 font-medium"
            />
          </div>
        </div>
      </div>

      {/* History Grid */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
          <span className="font-bold text-slate-700">
            Audit Trail Records ({filteredHistory.length})
          </span>
          <span className="text-slate-500">Immutable audit register</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-3">Sr.No</th>
                <th className="py-2.5 px-3">ITS No</th>
                <th className="py-2.5 px-4">Full Name</th>
                <th className="py-2.5 px-3">Sabeel No</th>
                <th className="py-2.5 px-3">Old Grade</th>
                <th className="py-2.5 px-3">New Grade</th>
                <th className="py-2.5 px-3">Change Date</th>
                <th className="py-2.5 px-4">Reason / Notes</th>
                <th className="py-2.5 px-3">Authorized By</th>
                <th className="py-2.5 px-3">Logged At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredHistory.map((h, idx) => (
                <tr key={h.id} className="hover:bg-amber-50/40 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-slate-500">{idx + 1}</td>
                  <td className="py-2.5 px-3 font-bold text-amber-800">{h.itsNumber}</td>
                  <td className="py-2.5 px-4 font-bold text-slate-900">{h.fullName}</td>
                  <td className="py-2.5 px-3 font-semibold text-blue-700">{h.sabeelNo}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-medium">
                      {h.oldGrade}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[10px] font-bold">
                      {h.newGrade}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">{h.changeDate}</td>
                  <td className="py-2.5 px-4 text-slate-600 max-w-xs">{h.reason}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 bg-amber-50 text-amber-800 rounded font-semibold text-[10px]">
                      {h.authorizedBy}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-[10px] text-slate-400">{h.createdAt}</td>
                </tr>
              ))}
              {filteredHistory.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-slate-400">
                    No grade change records found matching the search criteria.
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
