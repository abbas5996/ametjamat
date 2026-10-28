import React, { useState, useMemo } from 'react';
import {
  Gift, Search, Calendar, Printer, FileSpreadsheet, Download, CheckCircle2,
  AlertCircle, DollarSign, Users, ShieldCheck, RefreshCw
} from 'lucide-react';
import { SabeelLedgerRecord, SabeelTransactionEntry } from '../../types';

interface SabeelGiftAidSubpageProps {
  ledger: SabeelLedgerRecord[];
  transactions: SabeelTransactionEntry[];
  showToast: (msg: string) => void;
}

const fmtINR = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export const SabeelGiftAidSubpage: React.FC<SabeelGiftAidSubpageProps> = ({
  ledger,
  transactions,
  showToast,
}) => {
  const [fromDate, setFromDate] = useState('2025-04-01');
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
  const [search, setSearch] = useState('');
  const [declarationFilter, setDeclarationFilter] = useState<'ALL' | 'SIGNED' | 'PENDING'>('ALL');

  // Filtered donor records
  const donorRows = useMemo(() => {
    return ledger
      .filter(r => (r.totalPaid || 0) > 0)
      .map(r => {
        const totalPaid = r.totalPaid || 0;
        const claim25 = totalPaid * 0.25;
        // Mock declaration status: Even ITS numbers have signed declarations
        const isSigned = Number(r.itsNumber.slice(-1)) % 2 === 0;
        return {
          ...r,
          totalPaid,
          claim25,
          isSigned,
          claimStatus: isSigned ? 'Ready for Submission' : 'Declaration Required',
        };
      })
      .filter(row => {
        if (search.trim()) {
          const q = search.toLowerCase().trim();
          const matchIts = (row.itsNumber || '').toLowerCase().includes(q);
          const matchName = (row.hofName || row.memberName || '').toLowerCase().includes(q);
          const matchSabeel = (row.sabeelNumber || row.sabeelNo || '').toLowerCase().includes(q);
          if (!matchIts && !matchName && !matchSabeel) return false;
        }
        if (declarationFilter === 'SIGNED' && !row.isSigned) return false;
        if (declarationFilter === 'PENDING' && row.isSigned) return false;
        return true;
      });
  }, [ledger, search, declarationFilter]);

  const summary = useMemo(() => {
    const totalDonations = donorRows.reduce((acc, r) => acc + r.totalPaid, 0);
    const totalClaimable = donorRows.reduce((acc, r) => acc + r.claim25, 0);
    const signedCount = donorRows.filter(r => r.isSigned).length;
    const pendingCount = donorRows.filter(r => !r.isSigned).length;
    return { totalDonations, totalClaimable, signedCount, pendingCount };
  }, [donorRows]);

  const handleExportCSV = () => {
    const headers = ['Sr.No', 'ITS Number', 'Donor Full Name', 'Sabeel No', 'Mohallah', 'Donation Amount (Paid)', 'Gift Aid Claim (25%)', 'Declaration Status'];
    const rows = donorRows.map((r, i) => [
      i + 1,
      `"${r.itsNumber}"`,
      `"${r.hofName || r.memberName}"`,
      `"${r.sabeelNumber || r.sabeelNo || ''}"`,
      `"${r.mohallah || ''}"`,
      r.totalPaid,
      r.claim25,
      `"${r.isSigned ? 'Signed Declaration on File' : 'Pending Declaration'}"`,
    ].join(','));
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `Sabeel_Gift_Aid_Schedule_${fromDate}_to_${toDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported Gift Aid schedule for ${donorRows.length} donors`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Gift className="w-5 h-5 text-emerald-600" />
              <span>Sabeel Gift Aid & Tax Relief Audit Schedule</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Track 25% reclaimable charity contributions on eligible Sabeel donations with signed taxpayer declarations.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export Schedule</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Form</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-4 text-xs">
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

          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Declaration Status</label>
            <select
              value={declarationFilter}
              onChange={e => setDeclarationFilter(e.target.value as any)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 bg-white cursor-pointer font-medium"
            >
              <option value="ALL">All Donors</option>
              <option value="SIGNED">Signed Declaration on File</option>
              <option value="PENDING">Pending Declaration</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Search Donor</label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search ITS, Name, Sabeel No..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 font-medium"
              />
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase block mb-1">Total Eligible Donations</span>
          <div className="text-2xl font-black text-slate-900">{fmtINR(summary.totalDonations)}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">From verified Mumineen collections</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs border-l-4 border-l-emerald-500">
          <span className="text-xs font-bold text-emerald-800 uppercase block mb-1">25% Gift Aid Claimable</span>
          <div className="text-2xl font-black text-emerald-600">{fmtINR(summary.totalClaimable)}</div>
          <span className="text-[11px] text-emerald-700 font-semibold mt-1 block">Net tax recovery for Jamaat Trust</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase block mb-1">Signed Declarations</span>
          <div className="text-2xl font-black text-blue-700">{summary.signedCount}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Ready for official submission</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase block mb-1">Declarations Pending</span>
          <div className="text-2xl font-black text-amber-600">{summary.pendingCount}</div>
          <span className="text-[11px] text-amber-700 font-semibold mt-1 block">Form dispatch requested</span>
        </div>
      </div>

      {/* Donor Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-3">Sr.No</th>
                <th className="py-2.5 px-3">ITS No</th>
                <th className="py-2.5 px-4">Donor Full Name</th>
                <th className="py-2.5 px-3">Sabeel No</th>
                <th className="py-2.5 px-3">Mohallah</th>
                <th className="py-2.5 px-4 text-right">Total Donated (₹)</th>
                <th className="py-2.5 px-4 text-right font-black">25% Gift Aid (₹)</th>
                <th className="py-2.5 px-4 text-center">Declaration Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {donorRows.map((r, idx) => (
                <tr key={r.id} className="hover:bg-amber-50/40 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-slate-500">{idx + 1}</td>
                  <td className="py-2.5 px-3 font-bold text-amber-800">{r.itsNumber}</td>
                  <td className="py-2.5 px-4 font-bold text-slate-900">{r.hofName || r.memberName}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-700">{r.sabeelNumber || r.sabeelNo || '—'}</td>
                  <td className="py-2.5 px-3 text-slate-600">{r.mohallah || '—'}</td>
                  <td className="py-2.5 px-4 text-right font-medium text-slate-900">{fmtINR(r.totalPaid)}</td>
                  <td className="py-2.5 px-4 text-right font-black text-emerald-600">{fmtINR(r.claim25)}</td>
                  <td className="py-2.5 px-4 text-center">
                    {r.isSigned ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Signed on File</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                        <AlertCircle className="w-3 h-3 text-amber-600" />
                        <span>Pending Signature</span>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {donorRows.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    No eligible donors found for this criteria.
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
