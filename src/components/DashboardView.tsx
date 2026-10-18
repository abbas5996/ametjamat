import React, { useState, useMemo } from 'react';
import {
  Search,
  Users,
  UserCheck,
  Utensils,
  Ban,
  Shield,
  Eye,
  CreditCard,
  RefreshCw,
  Download,
  Printer,
  RotateCcw,
  SlidersHorizontal,
  Calendar,
  Lock,
  FileCheck2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { RoleView, FaizTransaction, InstallmentMilestone } from '../types';

interface DashboardViewProps {
  onQuickAction: (actionName: string) => void;
}

// Sample realistic Faiz received records
const INITIAL_TRANSACTIONS: FaizTransaction[] = [
  {
    id: 'tx-1',
    memberName: 'ADAM BHAI IBRAHIM VADGAMWALA',
    itsNumber: '30489122',
    sabeelNo: 'SB-042',
    thaaliNo: 'TH-084',
    amount: 5500.0,
    receiptNo: 'BP-1447-0104',
    date: '14-Shawwal-1447',
    head: 'Faiz al-Mawaid al-Burhaniyah',
    status: 'verified',
  },
  {
    id: 'tx-2',
    memberName: 'SHAIKH ABBAS BHAI KASAMALI RAJKOTWALA',
    itsNumber: '20381044',
    sabeelNo: 'SB-118',
    thaaliNo: 'TH-012',
    amount: 12000.0,
    receiptNo: 'BP-1447-0105',
    date: '13-Shawwal-1447',
    head: 'Annual Takhmeen 1st Installment',
    status: 'verified',
  },
  {
    id: 'tx-3',
    memberName: 'MULLA HUZEFA BHAI MUSTAFA KAPASI',
    itsNumber: '40192831',
    sabeelNo: 'SB-089',
    thaaliNo: 'TH-150',
    amount: 8500.0,
    receiptNo: 'BP-1447-0106',
    date: '13-Shawwal-1447',
    head: 'Faiz al-Mawaid al-Burhaniyah',
    status: 'verified',
  },
  {
    id: 'tx-4',
    memberName: 'JUZER BHAI MOHAMMED BAGASRAWALA',
    itsNumber: '50284910',
    sabeelNo: 'SB-023',
    thaaliNo: 'TH-033',
    amount: 25000.0,
    receiptNo: 'BP-1447-0107',
    date: '12-Shawwal-1447',
    head: 'Niyaaz Jaman Contribution',
    status: 'verified',
  },
  {
    id: 'tx-5',
    memberName: 'TAHER BHAI YUSUF ALI MERCHANT',
    itsNumber: '30928419',
    sabeelNo: 'SB-064',
    thaaliNo: 'TH-091',
    amount: 6000.0,
    receiptNo: 'BP-1447-0108',
    date: '11-Shawwal-1447',
    head: 'Faiz al-Mawaid al-Burhaniyah',
    status: 'verified',
  },
  {
    id: 'tx-6',
    memberName: 'ALI ASGHAR BHAI SHABBIR RATLAMWALA',
    itsNumber: '20847192',
    sabeelNo: 'SB-142',
    thaaliNo: 'TH-119',
    amount: 15000.0,
    receiptNo: 'BP-1447-0109',
    date: '10-Shawwal-1447',
    head: 'Takhmeen General Sabil',
    status: 'verified',
  },
];

// Sample Hijri Milestone Installment Schedule
const INSTALLMENT_SCHEDULE: InstallmentMilestone[] = [
  {
    id: 'sch-1',
    event: 'Lailatul Qadr Niyaaz & Sabil',
    hijriDate: '23-Ramadan-1447',
    totalTarget: 3500000,
    collectedAmount: 3320000,
    percentage: 94.8,
    status: 'completed',
  },
  {
    id: 'sch-2',
    event: 'Installment 2: Till 27-Shawwal',
    hijriDate: '27-Shawwal-1447',
    totalTarget: 2800000,
    collectedAmount: 1980000,
    percentage: 70.7,
    status: 'current',
  },
  {
    id: 'sch-3',
    event: 'Installment 3: Till 18-Zilhaj (Eid-e-Ghadir)',
    hijriDate: '18-Zilhaj-1447',
    totalTarget: 2500000,
    collectedAmount: 420000,
    percentage: 16.8,
    status: 'upcoming',
  },
  {
    id: 'sch-4',
    event: 'Final Clearance: Ashara Mubaraka',
    hijriDate: '01-Moharram-1448',
    totalTarget: 2200000,
    collectedAmount: 0,
    percentage: 0.0,
    status: 'upcoming',
  },
];

// Clean Metric Card Accents matching:
// - Card 1 (HOF): Gold/Amber Tint Accent (#D97706)
// - Card 2 (FM): Coral/Warm Rose Accent (#E11D48)
// - Card 3 (Active Thaali): Emerald Green Accent (#059669)
// - Card 4 (Blocked): Muted Purple Accent (#7C3AED)
type CardAccentType = 'gold-amber' | 'coral-rose' | 'emerald-green' | 'muted-purple';

interface KpiCardProps {
  label: string;
  value: string | number;
  subtext: string;
  colorScheme: CardAccentType;
  icon: React.ReactNode;
}

const COLOR_MAP: Record<CardAccentType, { border: string; bg: string; iconBg: string; text: string; subtext: string }> = {
  'gold-amber': {
    border: 'border-[#D97706]/50 hover:border-[#D97706]',
    bg: 'bg-white',
    iconBg: 'bg-[#FEF3C7] text-[#D97706]',
    text: 'text-[#0F172A]',
    subtext: 'text-[#B45309]',
  },
  'coral-rose': {
    border: 'border-[#D97706]/35 hover:border-[#E11D48]',
    bg: 'bg-white',
    iconBg: 'bg-[#FFE4E6] text-[#E11D48]',
    text: 'text-[#0F172A]',
    subtext: 'text-[#BE123C]',
  },
  'emerald-green': {
    border: 'border-[#D97706]/35 hover:border-[#059669]',
    bg: 'bg-white',
    iconBg: 'bg-emerald-50 text-[#059669]',
    text: 'text-[#0F172A]',
    subtext: 'text-[#047857]',
  },
  'muted-purple': {
    border: 'border-[#D97706]/35 hover:border-[#7C3AED]',
    bg: 'bg-white',
    iconBg: 'bg-purple-50 text-[#7C3AED]',
    text: 'text-[#0F172A]',
    subtext: 'text-[#6D28D9]',
  },
};

const KpiCard: React.FC<KpiCardProps> = ({ label, value, subtext, colorScheme, icon }) => {
  const styles = COLOR_MAP[colorScheme];
  return (
    <div
      className={`relative p-3 sm:p-4 rounded-xl border border-[#D97706]/35 ${styles.border} ${styles.bg} shadow-md hover:shadow-lg transition-all duration-150 flex flex-col justify-between`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-600 truncate">
          {label}
        </span>
        <div className={`p-1.5 rounded-lg shrink-0 shadow-2xs ${styles.iconBg}`}>
          {icon}
        </div>
      </div>
      <div className="mt-2 sm:mt-3">
        <div className={`text-xl sm:text-2xl font-black tracking-tight ${styles.text}`}>
          {value}
        </div>
        <p className={`text-[10px] sm:text-[11px] font-semibold mt-0.5 ${styles.subtext}`}>
          {subtext}
        </p>
      </div>
    </div>
  );
};

export const DashboardView: React.FC<DashboardViewProps> = ({ onQuickAction }) => {
  // RBAC Simulator state
  const [roleView, setRoleView] = useState<RoleView>('super_admin');

  // Search state
  const [searchParam, setSearchParam] = useState('');

  // Filter transactions dynamically
  const filteredTransactions = useMemo(() => {
    if (!searchParam.trim()) return INITIAL_TRANSACTIONS;
    const q = searchParam.toLowerCase().trim();
    return INITIAL_TRANSACTIONS.filter(
      (tx) =>
        tx.memberName.toLowerCase().includes(q) ||
        tx.itsNumber.includes(q) ||
        tx.sabeelNo.toLowerCase().includes(q) ||
        tx.thaaliNo.toLowerCase().includes(q) ||
        tx.receiptNo.toLowerCase().includes(q)
    );
  }, [searchParam]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onQuickAction(`Search executed for "${searchParam}"`);
  };

  return (
    <div className="space-y-6">
      {/* 4. ROLE-BASED ACCESS CONTROL (RBAC) VISUAL SIMULATOR */}
      <div className="bg-white border border-[#D97706]/30 rounded-xl p-3 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 bg-[#FEF3C7] text-[#B45309] rounded-lg shrink-0">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-[#0F172A] tracking-tight">
                RBAC Security Simulator
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]">
                Live Simulator
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden md:block">
              Switch role context to test permissions: Super Admin (Reversals/Overrides), Cashier (Receipts/Print), Read-Only (Audited).
            </p>
          </div>
        </div>

        {/* Role Switcher Pills — horizontally scrollable on mobile */}
        <div className="flex items-center p-1 bg-[#F1F5F9] rounded-lg border border-slate-200 w-full sm:w-auto max-w-full overflow-x-auto">
          <button
            type="button"
            onClick={() => {
              setRoleView('super_admin');
              onQuickAction('Switched to Super Admin View');
            }}
            className={`px-3 py-2 text-xs font-bold rounded-md transition-all flex items-center space-x-1.5 whitespace-nowrap min-h-[44px] ${
              roleView === 'super_admin'
                ? 'bg-[#0F172A] text-[#FACC15] border border-[#D4AF37]/50 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-[#FACC15]" />
            <span>Super Admin View</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setRoleView('cashier');
              onQuickAction('Switched to Cashier View');
            }}
            className={`px-3 py-2 text-xs font-bold rounded-md transition-all flex items-center space-x-1.5 whitespace-nowrap min-h-[44px] ${
              roleView === 'cashier'
                ? 'bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Cashier View</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setRoleView('read_only');
              onQuickAction('Switched to Read-Only View');
            }}
            className={`px-3 py-2 text-xs font-bold rounded-md transition-all flex items-center space-x-1.5 whitespace-nowrap min-h-[44px] ${
              roleView === 'read_only'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Read-Only View</span>
          </button>
        </div>
      </div>

      {/* 1. GLOBAL QUICK SEARCH BAR (High Visibility) */}
      <div className="bg-white border border-[#D97706]/30 rounded-xl p-3 sm:p-4 shadow-md">
        <form onSubmit={handleSearchSubmit} className="flex flex-col gap-2 sm:gap-3">
          <div className="relative flex-1 w-full">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-slate-400" />
            </div>
            <input
              type="text"
              value={searchParam}
              onChange={(e) => setSearchParam(e.target.value)}
              placeholder="Search ITS, Sabeel, Thaali, or Member Name..."
              className="block w-full pl-10 pr-16 py-2.5 text-xs sm:text-sm bg-white border border-[#D97706]/30 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#EAB308]/50 focus:border-[#D97706] transition-all font-medium min-h-[44px]"
            />
            {searchParam && (
              <button
                type="button"
                onClick={() => setSearchParam('')}
                className="absolute inset-y-0 right-2 pr-2 flex items-center text-xs text-slate-400 hover:text-slate-700"
              >
                Clear
              </button>
            )}
          </div>

          {/* Filter + Search buttons: vertical on mobile, horizontal on sm+ */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <button
              type="button"
              onClick={() => onQuickAction('Open Advanced Filters')}
              className="inline-flex items-center justify-center space-x-1.5 px-3.5 py-2.5 text-xs font-bold text-[#B45309] bg-[#FEF3C7] border border-[#FDE68A] rounded-lg hover:bg-[#FDE68A] transition-colors shadow-2xs min-h-[44px]"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#B45309]" />
              <span>Advanced Filters</span>
            </button>

            <button
              type="submit"
              className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 text-xs font-black text-[#0F172A] bg-[#EAB308] hover:bg-[#D4AF37] active:bg-[#CA8A04] rounded-lg transition-all shadow-[0_2px_8px_rgba(234,179,8,0.35)] focus:ring-2 focus:ring-[#EAB308]/60 min-h-[44px] sm:ml-auto"
            >
              <Search className="w-3.5 h-3.5 stroke-[2.8]" />
              <span>Fast Search</span>
            </button>
          </div>
        </form>

        {/* Quick parameters indicators */}
        <div className="flex items-center flex-wrap gap-1.5 mt-3 pt-3 border-t border-[#D97706]/20 text-[11px] text-slate-500">
          <span className="font-semibold text-slate-700">Quick Filters:</span>
          <button
            type="button"
            onClick={() => setSearchParam('30489122')}
            className="px-2 py-1 rounded bg-[#FEF3C7]/70 text-[#92400E] hover:bg-[#FEF3C7] hover:text-[#B45309] border border-[#FDE68A] transition-colors font-mono min-h-[32px]"
          >
            ITS: 30489122
          </button>
          <button
            type="button"
            onClick={() => setSearchParam('SB-042')}
            className="px-2 py-1 rounded bg-[#FEF3C7]/70 text-[#92400E] hover:bg-[#FEF3C7] hover:text-[#B45309] border border-[#FDE68A] transition-colors font-mono min-h-[32px]"
          >
            Sabeel: SB-042
          </button>
          <button
            type="button"
            onClick={() => setSearchParam('TH-084')}
            className="px-2 py-1 rounded bg-[#FEF3C7]/70 text-[#92400E] hover:bg-[#FEF3C7] hover:text-[#B45309] border border-[#FDE68A] transition-colors font-mono min-h-[32px]"
          >
            Thaali: TH-084
          </button>
          <button
            type="button"
            onClick={() => setSearchParam('VADGAMWALA')}
            className="px-2 py-1 rounded bg-[#FEF3C7]/70 text-[#92400E] hover:bg-[#FEF3C7] hover:text-[#B45309] border border-[#FDE68A] transition-colors min-h-[32px]"
          >
            Vadgamwala
          </button>
          <span className="ml-auto text-slate-500 font-medium">
            Showing {filteredTransactions.length} records
          </span>
        </div>
      </div>

      {/* 2. METRIC & KPI CARDS GRID — 1 col mobile / 2 col tablet / 4 col desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* ROW 1 */}
        {/* Card 1: HOF -> Gold/Amber Tint Accent (#D97706) */}
        <KpiCard
          label="Total HOF"
          value={147}
          subtext="Head of Families Registered"
          colorScheme="gold-amber"
          icon={<Users className="w-4 h-4" />}
        />

        {/* Card 2: FM -> Coral/Warm Rose Accent (#E11D48) */}
        <KpiCard
          label="Total FM"
          value={341}
          subtext="Family Members Associated"
          colorScheme="coral-rose"
          icon={<UserCheck className="w-4 h-4" />}
        />

        {/* Card 3: Male -> Gold/Amber Tint Accent (#D97706) */}
        <KpiCard
          label="Total Male"
          value={202}
          subtext="Male Mumineen Roster"
          colorScheme="gold-amber"
          icon={<Users className="w-4 h-4" />}
        />

        {/* Card 4: Female -> Coral/Warm Rose Accent (#E11D48) */}
        <KpiCard
          label="Total Female"
          value={187}
          subtext="Bahanat & Farzando Roster"
          colorScheme="coral-rose"
          icon={<Users className="w-4 h-4" />}
        />

        {/* ROW 2 */}
        {/* Card 5: Takhmeen Done -> Gold/Amber Tint Accent (#D97706) */}
        <KpiCard
          label="Takhmeen Done - Local HOF"
          value={128}
          subtext="87.1% Local Clearance Achieved"
          colorScheme="gold-amber"
          icon={<FileCheck2 className="w-4 h-4" />}
        />

        {/* Card 6: Takhmeen Pending -> Coral/Warm Rose Accent (#E11D48) */}
        <KpiCard
          label="Takhmeen Pending - Local HOF"
          value={19}
          subtext="Follow-up & Waivers Needed"
          colorScheme="coral-rose"
          icon={<AlertCircle className="w-4 h-4" />}
        />

        {/* Card 7: Active Thaali -> Emerald Green Accent (#059669) */}
        <KpiCard
          label="Active Thaali"
          value={150}
          subtext="Daily FMB Distribution Active"
          colorScheme="emerald-green"
          icon={<Utensils className="w-4 h-4" />}
        />

        {/* Card 8: Blocked/Closed Thaali -> Muted Purple Accent (#7C3AED) */}
        <KpiCard
          label="Blocked/Closed Thaali"
          value={3}
          subtext="Temporarily Suspended / Safar"
          colorScheme="muted-purple"
          icon={<Ban className="w-4 h-4" />}
        />
      </div>

      {/* 3. DATA TABLES SECTION — stacked on mobile, 2-col on lg+ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-7 bg-white border border-[#D97706]/30 rounded-xl shadow-md overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-[#D97706]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold text-[#0F172A] tracking-tight">
                  Latest Faiz Received Table
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]">
                  Live Sync
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Real-time Faiz al-Mawaid verified income entries
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => onQuickAction('Refresh Latest Faiz Table')}
                className="p-1.5 text-slate-600 hover:text-[#B45309] hover:bg-[#FEF3C7] rounded-md transition-colors"
                title="Refresh Table"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => onQuickAction('Export Latest Faiz CSV')}
                className="inline-flex items-center space-x-1 px-2.5 py-1.5 text-xs font-bold text-[#B45309] bg-[#FEF3C7] hover:bg-[#FDE68A] border border-[#FDE68A] rounded-md transition-colors"
              >
                <Download className="w-3 h-3 text-[#B45309]" />
                <span>Export</span>
              </button>
            </div>
          </div>

          {/* Table — horizontally scrollable on small screens */}
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs text-slate-600 border-collapse min-w-[560px]">
              <thead className="bg-[#FEF9C3] text-[11px] font-bold text-slate-700 uppercase tracking-wider border-b border-[#D97706]/25 select-none">
                <tr>
                  <th className="py-3 px-4 whitespace-nowrap">Member Full Name</th>
                  <th className="py-3 px-3 whitespace-nowrap">Amount Received</th>
                  <th className="py-3 px-3 whitespace-nowrap">Receipt No</th>
                  <th className="py-3 px-3 whitespace-nowrap">Date</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">
                    {roleView === 'read_only' ? 'Status' : 'Action'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredTransactions.map((tx, idx) => (
                  <tr
                    key={tx.id}
                    className={`transition-colors hover:bg-amber-50/40 ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-[#FEF9C3]/30'
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#0F172A] leading-tight">
                        {tx.memberName}
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center space-x-1.5 mt-0.5 whitespace-nowrap">
                        <span className="font-mono">ITS: {tx.itsNumber}</span>
                        <span>•</span>
                        <span className="font-mono">{tx.sabeelNo}</span>
                        <span>•</span>
                        <span className="font-mono">{tx.thaaliNo}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="font-mono font-bold text-[#0F172A] text-xs">
                        ₹ {tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                      <span className="text-[10px] text-[#059669] font-bold">Verified</span>
                    </td>

                    <td className="py-3 px-3 font-mono text-[11px] font-semibold text-slate-700 whitespace-nowrap">
                      {tx.receiptNo}
                    </td>

                    <td className="py-3 px-3 text-[11px] text-slate-600 whitespace-nowrap">
                      {tx.date}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {roleView === 'super_admin' && (
                        <div className="inline-flex items-center space-x-1.5">
                          <button
                            type="button"
                            onClick={() => onQuickAction(`Print Receipt ${tx.receiptNo}`)}
                            className="p-1.5 text-slate-600 hover:text-[#B45309] hover:bg-[#FEF3C7] rounded transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                            title="Print Receipt"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onQuickAction(`Reversal Request for ${tx.receiptNo}`)}
                            className="inline-flex items-center space-x-1 px-2 py-1.5 text-[11px] font-bold text-[#E11D48] bg-[#FFE4E6] hover:bg-[#FECDD3] border border-[#E11D48]/30 rounded transition-colors min-h-[36px]"
                            title="Super Admin Reverse Receipt"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Reverse</span>
                          </button>
                        </div>
                      )}

                      {roleView === 'cashier' && (
                        <button
                          type="button"
                          onClick={() => onQuickAction(`Print Receipt ${tx.receiptNo}`)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1.5 text-[11px] font-bold text-[#B45309] bg-[#FEF3C7] hover:bg-[#FDE68A] border border-[#FDE68A] rounded transition-colors min-h-[36px]"
                        >
                          <Printer className="w-3 h-3" />
                          <span>Print</span>
                        </button>
                      )}

                      {roleView === 'read_only' && (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Audited</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredTransactions.length === 0 && (
            <div className="py-8 text-center text-xs text-slate-500">
              No matching transactions found for "{searchParam}".
            </div>
          )}

          <div className="px-5 py-3 border-t border-[#D97706]/20 bg-[#FEF9C3]/35 flex items-center justify-between text-xs text-slate-600">
            <span>Showing recent Faiz collections</span>
            <span className="font-extrabold text-[#0F172A]">
              Total Page Sum: ₹{' '}
              {filteredTransactions
                .reduce((acc, curr) => acc + curr.amount, 0)
                .toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-5 bg-white border border-[#D97706]/30 rounded-xl shadow-md overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-[#D97706]/20 flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold text-[#0F172A] tracking-tight">
                  Takhmeen Installment Schedule Table
                </h2>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Hijri milestones & collection checkpoints
              </p>
            </div>

            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]">
              1447 Hijri
            </span>
          </div>

          {/* Table — horizontally scrollable on small screens */}
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs text-slate-600 border-collapse min-w-[380px]">
              <thead className="bg-[#FEF9C3] text-[11px] font-bold text-slate-700 uppercase tracking-wider border-b border-[#D97706]/25 select-none">
                <tr>
                  <th className="py-3 px-4 whitespace-nowrap">Installment Event / Date</th>
                  <th className="py-3 px-3 whitespace-nowrap">Target Amount</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {INSTALLMENT_SCHEDULE.map((sch, idx) => (
                  <tr
                    key={sch.id}
                    className={`transition-colors hover:bg-amber-50/30 ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-[#FEF9C3]/30'
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#0F172A] leading-tight">
                        {sch.event}
                      </div>
                      <div className="text-[10px] text-[#B45309] font-bold flex items-center space-x-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        <span>{sch.hijriDate}</span>
                      </div>
                      {/* Mini Progress in Gold & Emerald */}
                      <div className="w-full bg-slate-200 rounded-full h-1 mt-2">
                        <div
                          className={`h-1 rounded-full ${
                            sch.percentage >= 90
                              ? 'bg-[#059669]'
                              : sch.percentage > 50
                              ? 'bg-[#EAB308]'
                              : 'bg-[#E11D48]'
                          }`}
                          style={{ width: `${sch.percentage}%` }}
                        />
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-mono font-bold text-[#0F172A]">
                        ₹ {(sch.totalTarget / 100000).toFixed(2)} Lakhs
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium">
                        {sch.percentage}% Realized
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {roleView === 'super_admin' && (
                        <button
                          type="button"
                          onClick={() => onQuickAction(`Manage Waiver/Override for ${sch.event}`)}
                          className="px-2.5 py-1 text-[11px] font-black text-[#0F172A] bg-[#EAB308] hover:bg-[#D4AF37] rounded-md transition-colors shadow-2xs"
                        >
                          Override
                        </button>
                      )}

                      {roleView === 'cashier' && (
                        <button
                          type="button"
                          onClick={() => onQuickAction(`Record Installment Entry for ${sch.event}`)}
                          className="px-2.5 py-1 text-[11px] font-bold text-[#B45309] bg-[#FEF3C7] hover:bg-[#FDE68A] border border-[#FDE68A] rounded-md transition-colors"
                        >
                          Record
                        </button>
                      )}

                      {roleView === 'read_only' && (
                        <span className="inline-flex items-center text-slate-400 text-[10px] font-medium">
                          <Lock className="w-3 h-3 mr-1" />
                          Locked
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer Milestones Status */}
          <div className="px-5 py-3.5 border-t border-[#D97706]/20 bg-[#FEF9C3]/35 mt-auto flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">Cumulative Target:</span>
            <span className="font-black text-[#0F172A] font-mono">
              ₹ 1.10 Crore (Local Assessment)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
