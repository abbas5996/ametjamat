import React, { useMemo } from 'react';
import {
  Coins, TrendingUp, TrendingDown, Users, CheckCircle2, Clock, AlertCircle,
  ArrowUpRight, BarChart3, Wallet, MapPin, Receipt, ShieldCheck
} from 'lucide-react';
import { SabeelLedgerRecord, SabeelTransactionEntry, HeadOfFamily } from '../../types';

interface SabeelDashboardSubpageProps {
  ledger: SabeelLedgerRecord[];
  transactions: SabeelTransactionEntry[];
  hofs: HeadOfFamily[];
  onNavigate: (subItemId: string) => void;
}

const fmtINR = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export const SabeelDashboardSubpage: React.FC<SabeelDashboardSubpageProps> = ({
  ledger,
  transactions,
  hofs,
  onNavigate,
}) => {
  const stats = useMemo(() => {
    const totalCommitted = ledger.reduce((acc, r) => acc + (r.annualPledged || r.totalAllocated || 0), 0);
    const totalCollected = ledger.reduce((acc, r) => acc + (r.totalPaid || 0), 0);
    const totalPending = Math.max(0, totalCommitted - totalCollected);
    const recoveryPct = totalCommitted > 0 ? Math.round((totalCollected / totalCommitted) * 100) : 0;
    const fullyPaidCount = ledger.filter(r => (r.totalPaid || 0) >= (r.annualPledged || r.totalAllocated || 0) && (r.annualPledged || 0) > 0).length;
    const partialCount = ledger.filter(r => (r.totalPaid || 0) > 0 && (r.totalPaid || 0) < (r.annualPledged || r.totalAllocated || 0)).length;
    const nilPaidCount = ledger.filter(r => (r.totalPaid || 0) === 0).length;

    // Mohalla distribution
    const mohallaMap: Record<string, { pledged: number; paid: number; count: number }> = {};
    ledger.forEach(r => {
      const m = r.mohallah || 'General';
      if (!mohallaMap[m]) mohallaMap[m] = { pledged: 0, paid: 0, count: 0 };
      mohallaMap[m].pledged += (r.annualPledged || r.totalAllocated || 0);
      mohallaMap[m].paid += (r.totalPaid || 0);
      mohallaMap[m].count += 1;
    });

    return {
      totalCommitted,
      totalCollected,
      totalPending,
      recoveryPct,
      fullyPaidCount,
      partialCount,
      nilPaidCount,
      mohallaMap,
    };
  }, [ledger]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-amber-900 via-amber-800 to-amber-950 text-white rounded-2xl p-6 shadow-md border border-amber-700/50">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-200 text-xs font-semibold mb-2 border border-amber-400/30">
              <Coins className="w-3.5 h-3.5" />
              <span>Sabeel Mubarak Financial Portal</span>
            </div>
            <h1 className="text-2xl font-black text-amber-100 tracking-tight">
              Sabeel Management & Collection Dashboard
            </h1>
            <p className="text-xs text-amber-200/80 mt-1 max-w-2xl leading-relaxed">
              Real-time monitoring of community Sabeel pledges (Takhmeen), collection realization, 
              outstanding balances, and donor compliance across all Mohallahs.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('sabeel-collection')}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Coins className="w-4 h-4" />
              <span>Quick Payment (POS)</span>
            </button>
            <button
              onClick={() => onNavigate('sabeel-due-report')}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer"
            >
              <AlertCircle className="w-4 h-4 text-amber-300" />
              <span>View Outstanding</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-amber-400 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Total Committed</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {fmtINR(stats.totalCommitted)}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
            <span className="font-bold text-slate-700">{ledger.length}</span> Households enrolled
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-emerald-400 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Realized Collection</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 tracking-tight">
            {fmtINR(stats.totalCollected)}
          </div>
          <div className="mt-2 text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{stats.recoveryPct}% Recovery Rate</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-amber-400 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Amount Pending</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 tracking-tight">
            {fmtINR(stats.totalPending)}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
            <span className="font-bold text-amber-700">{stats.partialCount + stats.nilPaidCount}</span> Dues pending
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-purple-400 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Fully Cleared Sabeels</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-700 tracking-tight">
            {stats.fullyPaidCount}
          </div>
          <div className="mt-2 text-[11px] text-purple-700 font-semibold flex items-center gap-1">
            <span>{ledger.length > 0 ? Math.round((stats.fullyPaidCount / ledger.length) * 100) : 0}% of all members</span>
          </div>
        </div>
      </div>

      {/* Mohalla Recovery Breakdown & Recent Receipts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mohalla Table */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-600" />
                <span>Mohallah-wise Sabeel Collection Status</span>
              </h2>
              <p className="text-[11px] text-slate-500">Distribution of pledges and recovery performance across localities</p>
            </div>
            <button
              onClick={() => onNavigate('sabeel-due-report')}
              className="text-xs text-amber-700 hover:text-amber-900 font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>Due Report</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="py-2.5 px-4">Mohallah Name</th>
                  <th className="py-2.5 px-3 text-center">Households</th>
                  <th className="py-2.5 px-4 text-right">Committed Pledged</th>
                  <th className="py-2.5 px-4 text-right">Realized Amount</th>
                  <th className="py-2.5 px-4 text-right">Balance Due</th>
                  <th className="py-2.5 px-3 text-center">Recovery</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {Object.entries(stats.mohallaMap).map(([mName, data]) => {
                  const due = Math.max(0, data.pledged - data.paid);
                  const pct = data.pledged > 0 ? Math.round((data.paid / data.pledged) * 100) : 0;
                  return (
                    <tr key={mName} className="hover:bg-amber-50/40 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">{mName}</td>
                      <td className="py-3 px-3 text-center text-slate-600 font-bold">{data.count}</td>
                      <td className="py-3 px-4 text-right font-medium">{fmtINR(data.pledged)}</td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600">{fmtINR(data.paid)}</td>
                      <td className="py-3 px-4 text-right font-bold text-amber-600">{fmtINR(due)}</td>
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          pct >= 80 ? 'bg-emerald-100 text-emerald-800' :
                          pct >= 50 ? 'bg-blue-100 text-blue-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {pct}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Transactions Feed */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-amber-600" />
                <span>Recent Sabeel Receipts</span>
              </h2>
              <p className="text-[11px] text-slate-500">Latest recorded payments</p>
            </div>
            <button
              onClick={() => onNavigate('sabeel-view-print-receipts')}
              className="text-xs text-amber-700 hover:text-amber-900 font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="divide-y divide-slate-100 overflow-y-auto max-h-[380px] p-2">
            {transactions.slice(0, 6).map((tx) => (
              <div key={tx.id || tx.receiptNo} className="p-3 hover:bg-slate-50 rounded-lg transition-colors flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-900 truncate">{tx.receiptNo}</span>
                    <span className="text-[9px] px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded font-bold">{tx.paymentMode}</span>
                  </div>
                  <div className="text-[11px] text-slate-600 truncate mt-0.5">{tx.memberName} • ITS: {tx.itsNumber}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{tx.paymentDate}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-black text-emerald-600">{fmtINR(tx.amountPaid ?? tx.amount ?? 0)}</div>
                  <div className="text-[10px] text-slate-400">Bal: {fmtINR(tx.balanceDueAfterPayment || 0)}</div>
                </div>
              </div>
            ))}
            {transactions.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-xs">
                No receipts recorded yet this cycle.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
