import React, { useState, useMemo } from 'react';
import {
  Layers, Filter, Printer, FileSpreadsheet, RefreshCw, BarChart3, TrendingUp,
  DollarSign, CheckCircle2, Clock, AlertCircle, ArrowUpRight
} from 'lucide-react';
import { SabeelLedgerRecord, SabeelTransactionEntry } from '../../types';
import { SabeelTypeRecord, SabeelGradeRecord, getGradeForAmount } from '../../utils/sabeelProductionSuite';

interface SabeelDynamicGradeCountSubpageProps {
  ledger: SabeelLedgerRecord[];
  sabeelTypes: SabeelTypeRecord[];
  sabeelGrades: SabeelGradeRecord[];
  transactions: SabeelTransactionEntry[];
  showToast: (msg: string) => void;
}

const fmtINR = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export const SabeelDynamicGradeCountSubpage: React.FC<SabeelDynamicGradeCountSubpageProps> = ({
  ledger,
  sabeelTypes,
  sabeelGrades,
  transactions,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<'dynamic_due' | 'grade_count'>('dynamic_due');

  // Filters
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedGrade, setSelectedGrade] = useState('ALL');

  // Filtered Ledger
  const filteredLedger = useMemo(() => {
    return ledger.filter(r => {
      if (selectedType !== 'ALL' && (r.category || r.sabeelType || '') !== selectedType) {
        return false;
      }
      const grade = r.grade || getGradeForAmount(r.annualPledged || 24000);
      if (selectedGrade !== 'ALL' && grade !== selectedGrade) {
        return false;
      }
      return true;
    });
  }, [ledger, selectedType, selectedGrade]);

  // Aging analysis for Dynamic Due Report
  const dynamicDueData = useMemo(() => {
    const records = filteredLedger.map(r => {
      const committed = r.annualPledged || r.totalAllocated || 0;
      const paid = r.totalPaid || 0;
      const due = Math.max(0, committed - paid);
      // Mock aging bucket distribution based on ITS number mod
      const itsMod = Number(r.itsNumber.slice(-1));
      let bucket = '0–30 Days';
      if (itsMod >= 7) bucket = '180+ Days (Critical)';
      else if (itsMod >= 4) bucket = '91–180 Days';
      else if (itsMod >= 2) bucket = '31–90 Days';

      return {
        ...r,
        committed,
        paid,
        due,
        grade: r.grade || getGradeForAmount(committed),
        agingBucket: due > 0 ? bucket : 'Cleared',
      };
    });

    const duesOnly = records.filter(x => x.due > 0);
    const totalDues = duesOnly.reduce((acc, x) => acc + x.due, 0);

    const b0_30 = duesOnly.filter(x => x.agingBucket === '0–30 Days');
    const b31_90 = duesOnly.filter(x => x.agingBucket === '31–90 Days');
    const b91_180 = duesOnly.filter(x => x.agingBucket === '91–180 Days');
    const b180_plus = duesOnly.filter(x => x.agingBucket === '180+ Days (Critical)');

    return {
      records,
      duesOnly,
      totalDues,
      b0_30,
      b31_90,
      b91_180,
      b180_plus,
    };
  }, [filteredLedger]);

  // Grade Wise Count Matrix
  const gradeWiseMatrix = useMemo(() => {
    const list = sabeelGrades.map(g => {
      const matched = filteredLedger.filter(
        r => (r.grade || getGradeForAmount(r.annualPledged || 24000)) === g.gradeName
      );
      const count = matched.length;
      const committed = matched.reduce((acc, r) => acc + (r.annualPledged || r.totalAllocated || 0), 0);
      const collected = matched.reduce((acc, r) => acc + (r.totalPaid || 0), 0);
      const pending = Math.max(0, committed - collected);
      const recoveryPct = committed > 0 ? Math.round((collected / committed) * 100) : 0;

      return {
        grade: g.gradeName,
        targetBaseline: g.suggestedMonthly * 12,
        count,
        committed,
        collected,
        pending,
        recoveryPct,
      };
    });

    const grandCount = list.reduce((acc, x) => acc + x.count, 0);
    const grandCommitted = list.reduce((acc, x) => acc + x.committed, 0);
    const grandCollected = list.reduce((acc, x) => acc + x.collected, 0);
    const grandPending = list.reduce((acc, x) => acc + x.pending, 0);
    const grandRecoveryPct = grandCommitted > 0 ? Math.round((grandCollected / grandCommitted) * 100) : 0;

    return { list, grandCount, grandCommitted, grandCollected, grandPending, grandRecoveryPct };
  }, [sabeelGrades, filteredLedger]);

  const handleExportCSV = () => {
    if (activeTab === 'dynamic_due') {
      const headers = ['Sr.No', 'ITS No', 'Full Name', 'Mohallah', 'Type', 'Grade', 'Committed', 'Paid', 'Outstanding Due', 'Aging Bracket'];
      const rows = dynamicDueData.records.map((r, i) => [
        i + 1,
        `"${r.itsNumber}"`,
        `"${r.hofName || r.memberName}"`,
        `"${r.mohallah || ''}"`,
        `"${r.category || r.sabeelType || 'Residential'}"`,
        `"${r.grade}"`,
        r.committed,
        r.paid,
        r.due,
        `"${r.agingBucket}"`,
      ].join(','));
      const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
      const link = document.createElement('a');
      link.setAttribute('href', encodeURI(csv));
      link.setAttribute('download', `Dynamic_Due_Aging_Report.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const headers = ['Grade', 'Target Baseline', 'Enrolled Households', 'Total Committed', 'Total Collected', 'Recovery %', 'Pending Balance'];
      const rows = gradeWiseMatrix.list.map(r => [
        `"${r.grade}"`,
        r.targetBaseline,
        r.count,
        r.committed,
        r.collected,
        `${r.recoveryPct}%`,
        r.pending,
      ].join(','));
      rows.push(['Grand Total', '—', gradeWiseMatrix.grandCount, gradeWiseMatrix.grandCommitted, gradeWiseMatrix.grandCollected, `${gradeWiseMatrix.grandRecoveryPct}%`, gradeWiseMatrix.grandPending].join(','));
      const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
      const link = document.createElement('a');
      link.setAttribute('href', encodeURI(csv));
      link.setAttribute('download', `Grade_Wise_Count_Report.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    showToast('Exported report to CSV');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-600" />
              <span>Dynamic Due Report & Grade Wise Count Audit</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Multi-dimensional analysis by Sabeel Type, assessment grade brackets, and aging overdue buckets.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('dynamic_due')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'dynamic_due'
                    ? 'bg-amber-400 text-slate-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                1. Dynamic Due Report
              </button>
              <button
                onClick={() => setActiveTab('grade_count')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'grade_count'
                    ? 'bg-amber-400 text-slate-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                2. Grade Wise Count
              </button>
            </div>

            <button
              onClick={handleExportCSV}
              className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 text-xs max-w-xl">
          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Select Sabeel Type</label>
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 bg-white cursor-pointer font-bold text-slate-900"
            >
              <option value="ALL">All Sabeel Types</option>
              {sabeelTypes.map(st => (
                <option key={st.id} value={st.sabeelType}>{st.sabeelType}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Select Grade</label>
            <select
              value={selectedGrade}
              onChange={e => setSelectedGrade(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 bg-white cursor-pointer font-bold text-slate-900"
            >
              <option value="ALL">All Assessment Grades</option>
              {sabeelGrades.map(sg => (
                <option key={sg.id} value={sg.gradeName}>{sg.gradeName}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tab 1: Dynamic Due Report */}
      {activeTab === 'dynamic_due' && (
        <div className="space-y-6">
          {/* Aging Buckets Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">0–30 Days Overdue</span>
              <div className="text-xl font-black text-slate-900">{dynamicDueData.b0_30.length} households</div>
              <div className="text-xs font-bold text-slate-600 mt-1">
                {fmtINR(dynamicDueData.b0_30.reduce((acc, x) => acc + x.due, 0))}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-[10px] font-bold text-blue-600 uppercase block mb-1">31–90 Days Overdue</span>
              <div className="text-xl font-black text-blue-800">{dynamicDueData.b31_90.length} households</div>
              <div className="text-xs font-bold text-blue-700 mt-1">
                {fmtINR(dynamicDueData.b31_90.reduce((acc, x) => acc + x.due, 0))}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-[10px] font-bold text-amber-600 uppercase block mb-1">91–180 Days Overdue</span>
              <div className="text-xl font-black text-amber-800">{dynamicDueData.b91_180.length} households</div>
              <div className="text-xs font-bold text-amber-700 mt-1">
                {fmtINR(dynamicDueData.b91_180.reduce((acc, x) => acc + x.due, 0))}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs border-l-4 border-l-rose-500">
              <span className="text-[10px] font-bold text-rose-600 uppercase block mb-1">180+ Days (Critical)</span>
              <div className="text-xl font-black text-rose-700">{dynamicDueData.b180_plus.length} households</div>
              <div className="text-xs font-bold text-rose-600 mt-1">
                {fmtINR(dynamicDueData.b180_plus.reduce((acc, x) => acc + x.due, 0))}
              </div>
            </div>
          </div>

          {/* Records Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">
                Overdue Ledger Records ({dynamicDueData.records.length})
              </span>
              <span className="font-black text-rose-600">
                Total Overdue: {fmtINR(dynamicDueData.totalDues)}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <th className="py-2.5 px-3">Sr.No</th>
                    <th className="py-2.5 px-3">ITS No</th>
                    <th className="py-2.5 px-4">Full Name</th>
                    <th className="py-2.5 px-3">Mohallah</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Grade</th>
                    <th className="py-2.5 px-3 text-right">Committed</th>
                    <th className="py-2.5 px-3 text-right">Paid Amount</th>
                    <th className="py-2.5 px-3 text-right font-black">Outstanding Due</th>
                    <th className="py-2.5 px-3 text-center">Aging Bracket</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {dynamicDueData.records.map((r, idx) => (
                    <tr key={r.id || idx} className="hover:bg-amber-50/40 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-slate-500">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-bold text-amber-800">{r.itsNumber}</td>
                      <td className="py-2.5 px-4 font-bold text-slate-900">{r.hofName || r.memberName}</td>
                      <td className="py-2.5 px-3 text-slate-600">{r.mohallah || '—'}</td>
                      <td className="py-2.5 px-3 text-slate-600">{r.category || r.sabeelType || 'Residential'}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 rounded text-[10px] font-bold">
                          {r.grade}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium text-slate-900">{fmtINR(r.committed)}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-600">{fmtINR(r.paid)}</td>
                      <td className="py-2.5 px-3 text-right font-black text-rose-600">{fmtINR(r.due)}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.agingBucket.includes('Critical') ? 'bg-rose-100 text-rose-800' :
                          r.agingBucket.includes('91') ? 'bg-amber-100 text-amber-800' :
                          r.agingBucket === 'Cleared' ? 'bg-emerald-100 text-emerald-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {r.agingBucket}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {dynamicDueData.records.length === 0 && (
                    <tr>
                      <td colSpan={10} className="py-10 text-center text-slate-400">
                        No records match the selected type and grade filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Grade Wise Count Matrix */}
      {activeTab === 'grade_count' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700">
              Grade Wise Enrolled Households & Collection Realization Schedule
            </span>
            <span className="text-xs font-black text-emerald-700">
              Cumulative Recovery: {gradeWiseMatrix.grandRecoveryPct}%
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="py-3 px-4">Sabeel Grade</th>
                  <th className="py-3 px-4 text-right">Target Baseline</th>
                  <th className="py-3 px-4 text-center">Enrolled Households</th>
                  <th className="py-3 px-4 text-right">Total Committed Takhmeen</th>
                  <th className="py-3 px-4 text-right">Total Realized Collection</th>
                  <th className="py-3 px-4 text-center">Recovery %</th>
                  <th className="py-3 px-4 text-right font-black">Pending Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {gradeWiseMatrix.list.map(row => (
                  <tr key={row.grade} className="hover:bg-amber-50/40 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 px-2.5 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-lg">
                        {row.grade}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600 font-medium">
                      {fmtINR(row.targetBaseline)} / yr
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-800 text-sm">{row.count}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">{fmtINR(row.committed)}</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-600">{fmtINR(row.collected)}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        row.recoveryPct >= 80 ? 'bg-emerald-100 text-emerald-800' :
                        row.recoveryPct >= 50 ? 'bg-blue-100 text-blue-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {row.recoveryPct}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-black text-rose-600">{fmtINR(row.pending)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 text-slate-900 font-black border-t-2 border-slate-300">
                  <td className="py-3 px-4 uppercase tracking-wider">Grand Total</td>
                  <td className="py-3 px-4 text-right">—</td>
                  <td className="py-3 px-4 text-center text-sm">{gradeWiseMatrix.grandCount}</td>
                  <td className="py-3 px-4 text-right">{fmtINR(gradeWiseMatrix.grandCommitted)}</td>
                  <td className="py-3 px-4 text-right text-emerald-700">{fmtINR(gradeWiseMatrix.grandCollected)}</td>
                  <td className="py-3 px-4 text-center">{gradeWiseMatrix.grandRecoveryPct}%</td>
                  <td className="py-3 px-4 text-right text-rose-700 text-sm">{fmtINR(gradeWiseMatrix.grandPending)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
