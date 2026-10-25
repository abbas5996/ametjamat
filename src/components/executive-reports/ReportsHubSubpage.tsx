import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Filter,
  Users,
  Utensils,
  Wallet,
  Building2,
  ShieldAlert,
  Search,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  MapPin,
  RefreshCw,
} from 'lucide-react';
import { ReportType, UserProfile, FinancialYear, Mohallah } from '../../types';
import { MOHALLAH_LIST } from '../../utils/memberMaster';
import {
  generateReportDataset,
  exportToCSV,
  exportToExcel,
} from '../../utils/executiveReports';
import { appendActivityLog } from '../../utils/rbac';

interface ReportsHubSubpageProps {
  currentUser: UserProfile;
  financialYear: FinancialYear;
  canExport: boolean;
  showToast: (msg: string) => void;
}

export const ReportsHubSubpage: React.FC<ReportsHubSubpageProps> = ({
  currentUser,
  canExport,
  showToast,
}) => {
  // Selected Report Type
  const [selectedReport, setSelectedReport] = useState<ReportType>('member-directory');

  // Filter States
  const [mohallahFilter, setMohallahFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [tableSearch, setTableSearch] = useState<string>('');

  // Report Card definitions
  const reportCards: {
    id: ReportType;
    title: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    tag: string;
  }[] = [
    {
      id: 'member-directory',
      title: '1. Member Directory & Family Tree Export',
      description: 'Master census data, HOF contact information, and family member aggregates.',
      icon: <Users className="w-5 h-5 text-indigo-600" />,
      color: 'hover:border-indigo-500',
      tag: 'Member Master',
    },
    {
      id: 'fmb-defaulters',
      title: '2. FMB Takhmeen & Defaulters Dues Report',
      description: 'Active Thaali commitments, installment receipts, and balance dues.',
      icon: <Utensils className="w-5 h-5 text-amber-600" />,
      color: 'hover:border-amber-500',
      tag: 'FMB Faiz',
    },
    {
      id: 'sabeel-status',
      title: '3. Sabeel Ledger & Collection Status Report',
      description: 'Annual Sabeel ul Khair commitments, collection metrics, and pending arrears.',
      icon: <Wallet className="w-5 h-5 text-blue-600" />,
      color: 'hover:border-blue-500',
      tag: 'Sabeel',
    },
    {
      id: 'hall-revenue',
      title: '4. Hall Booking Schedule & Revenue Report',
      description: 'Facility utilization calendar, advance deposits, and settlement status.',
      icon: <Building2 className="w-5 h-5 text-emerald-600" />,
      color: 'hover:border-emerald-500',
      tag: 'Hall Facilities',
    },
    {
      id: 'activity-audit',
      title: '5. Central Activity Log / Audit Trail Export',
      description: 'System actions, password resets, financial changes, and security events.',
      icon: <ShieldAlert className="w-5 h-5 text-rose-600" />,
      color: 'hover:border-rose-500',
      tag: 'Audit Log',
    },
  ];

  // Compile dataset based on selected report & filters
  const reportData = useMemo(() => {
    return generateReportDataset(selectedReport, {
      mohallah: mohallahFilter,
      status: statusFilter,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });
  }, [selectedReport, mohallahFilter, statusFilter, startDate, endDate]);

  // Client-side text search within compiled table
  const displayedRows = useMemo(() => {
    if (!tableSearch.trim()) return reportData.rows;
    const query = tableSearch.toLowerCase();
    return reportData.rows.filter((row) =>
      row.some((cell) => String(cell).toLowerCase().includes(query))
    );
  }, [reportData.rows, tableSearch]);

  // Action handlers
  const handleExportCSV = () => {
    if (!canExport) {
      showToast('Permission restricted: You do not have export access.');
      return;
    }
    const filename = `Jamaat_${selectedReport}_${new Date().toISOString().split('T')[0]}`;
    exportToCSV(filename, reportData.headers, displayedRows);

    // Activity log entry
    appendActivityLog(
      currentUser.username,
      'Reports Hub',
      'Reports & Exports',
      'VIEW',
      `Exported CSV: ${reportData.title} (${displayedRows.length} records)`
    );

    showToast(`Exported ${displayedRows.length} rows to CSV successfully.`);
  };

  const handleExportExcel = () => {
    if (!canExport) {
      showToast('Permission restricted: You do not have export access.');
      return;
    }
    const filename = `Jamaat_${selectedReport}_${new Date().toISOString().split('T')[0]}`;
    exportToExcel(filename, reportData.headers, displayedRows);

    // Activity log entry
    appendActivityLog(
      currentUser.username,
      'Reports Hub',
      'Reports & Exports',
      'VIEW',
      `Exported Excel (XLS): ${reportData.title} (${displayedRows.length} records)`
    );

    showToast(`Exported ${displayedRows.length} rows to Excel successfully.`);
  };

  const handlePrintReport = () => {
    // Activity log entry
    appendActivityLog(
      currentUser.username,
      'Reports Hub',
      'Reports & Exports',
      'VIEW',
      `Printed Report: ${reportData.title} (${displayedRows.length} records)`
    );
    window.print();
  };

  const handleResetFilters = () => {
    setMohallahFilter('all');
    setStatusFilter('all');
    setStartDate('');
    setEndDate('');
    setTableSearch('');
  };

  return (
    <div className="space-y-6">
      {/* ── Sub-Page Top Header ── */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Reports Hub & Data Export Engine
              </h2>
              <p className="text-xs text-slate-500">
                Generate official executive reports, filter parameters, and export to CSV or Excel spreadsheet.
              </p>
            </div>
          </div>
        </div>

        {/* Global Export Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={!canExport}
            className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              canExport
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
            title="Download formatted CSV file"
          >
            <Download className="w-3.5 h-3.5" />
            <span>📥 Export as CSV</span>
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            disabled={!canExport}
            className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer ${
              canExport
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
            title="Download Excel spreadsheet (.xls)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>📊 Export as Excel</span>
          </button>

          <button
            type="button"
            onClick={handlePrintReport}
            className="px-3 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            title="Print report preview table"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>🖨️ Print Report</span>
          </button>
        </div>
      </div>

      {/* ── Centralized Report Generator Cards (Selectable Report Types) ── */}
      <div>
        <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-amber-600" />
          <span>Select Report Module</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {reportCards.map((rc) => {
            const isSelected = selectedReport === rc.id;
            return (
              <div
                key={rc.id}
                onClick={() => setSelectedReport(rc.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-amber-50/70 border-amber-500 shadow-xs ring-1 ring-amber-400/50'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                      {rc.icon}
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {rc.tag}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 leading-snug">
                    {rc.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                    {rc.description}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span
                    className={`font-semibold ${
                      isSelected ? 'text-amber-800' : 'text-slate-400'
                    }`}
                  >
                    {isSelected ? 'Active Selection' : 'Click to preview'}
                  </span>
                  <ArrowRight
                    className={`w-3 h-3 ${
                      isSelected ? 'text-amber-700' : 'text-slate-300'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Report Preview Table & Filter Controls ── */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        {/* Dynamic Filter Controls Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {reportData.title}
            </h3>
            <p className="text-xs text-slate-500">{reportData.subtitle}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Text Filter */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              <input
                type="text"
                placeholder="Filter table rows..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white outline-none w-44 sm:w-52"
              />
            </div>

            {/* Mohallah Filter (applicable to member, fmb, sabeel) */}
            {['member-directory', 'fmb-defaulters', 'sabeel-status'].includes(selectedReport) && (
              <select
                value={mohallahFilter}
                onChange={(e) => setMohallahFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 outline-none cursor-pointer"
              >
                <option value="all">All Mohallahs</option>
                {MOHALLAH_LIST.map((m: Mohallah) => (
                  <option key={m.id} value={m.name}>
                    {m.name}
                  </option>
                ))}
              </select>
            )}

            {/* Status Filter (applicable to FMB, Sabeel, Hall) */}
            {['fmb-defaulters', 'sabeel-status'].includes(selectedReport) && (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 outline-none cursor-pointer"
              >
                <option value="all">All Payment Statuses</option>
                <option value="Defaulters">Defaulters Only (Balance &gt; 0)</option>
                <option value="Cleared">Cleared Only (Zero Balance)</option>
              </select>
            )}

            {selectedReport === 'hall-revenue' && (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 outline-none cursor-pointer"
              >
                <option value="all">All Booking Statuses</option>
                <option value="Paid">Fully Paid</option>
                <option value="Partial">Partial / Advance Paid</option>
                <option value="Unpaid">Unpaid</option>
              </select>
            )}

            {/* Date Range Picker (applicable to Hall bookings, audit logs) */}
            {['hall-revenue', 'activity-audit'].includes(selectedReport) && (
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs">
                <span className="text-[11px] text-slate-400">Date:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent text-slate-800 outline-none text-xs"
                />
                <span className="text-slate-300">-</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-transparent text-slate-800 outline-none text-xs"
                />
              </div>
            )}

            {(mohallahFilter !== 'all' || statusFilter !== 'all' || startDate || endDate || tableSearch) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                title="Reset active table filters"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Live Preview Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-lg max-h-[500px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 z-10 shadow-2xs">
              <tr className="border-b border-slate-200">
                <th className="py-2.5 px-3 text-center w-12 text-slate-400">#</th>
                {reportData.headers.map((h, i) => (
                  <th key={i} className="py-2.5 px-3 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">
                    {rIdx + 1}
                  </td>
                  {row.map((cell, cIdx) => {
                    const isCurrency =
                      typeof cell === 'number' &&
                      reportData.headers[cIdx]?.includes('(₹)');
                    return (
                      <td
                        key={cIdx}
                        className={`py-2.5 px-3 whitespace-nowrap ${
                          isCurrency ? 'font-mono font-semibold text-slate-900 text-right' : 'text-slate-700'
                        }`}
                      >
                        {isCurrency ? `₹ ${cell.toLocaleString()}` : String(cell)}
                      </td>
                    );
                  })}
                </tr>
              ))}

              {displayedRows.length === 0 && (
                <tr>
                  <td
                    colSpan={reportData.headers.length + 1}
                    className="py-10 text-center text-slate-400"
                  >
                    No matching records found for the selected report filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Statistics */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 gap-2">
          <span>
            Displaying <span className="font-bold text-slate-800">{displayedRows.length}</span> of{' '}
            <span className="font-bold text-slate-800">{reportData.rows.length}</span> total entries
          </span>
          <span className="font-mono text-[11px] text-slate-400">
            Export Engine • Compatible with MS Excel 2013+, Google Sheets, LibreOffice Calc
          </span>
        </div>
      </div>
    </div>
  );
};
