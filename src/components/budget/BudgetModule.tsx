import React, { useState, useMemo, useEffect } from 'react';
import {
  PieChart,
  Landmark,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Search,
  Download,
  Printer,
  Edit3,
  Trash2,
  Save,
  X,
  Calendar,
  Building2,
  Wallet,
  RefreshCw,
} from 'lucide-react';
import { FinancialYear, UserProfile } from '../../types';
import { appendActivityLog } from '../../utils/rbac';

export type BudgetFiscalYear =
  | '1448-1449 Hijri'
  | '1447-1448 Hijri'
  | '1446-1447 Hijri'
  | '1445-1446 Hijri';

export type BudgetEntityType = 'Department' | 'Trust Fund';
export type BudgetApprovalStatus = 'Approved' | 'Pending Review' | 'Revised' | 'Frozen';
export type VarianceHealth = 'Under Budget' | 'Near Limit' | 'Over Budget';

export interface BudgetAllocationRecord {
  id: string;
  budgetCode: string;
  fiscalYear: BudgetFiscalYear;
  entityType: BudgetEntityType;
  departmentOrTrust: string;
  expenseHead: string;
  estimatedBudget: number;
  actualSpent: number;
  approvalStatus: BudgetApprovalStatus;
  notes: string;
  updatedBy: string;
  updatedAt: string;
}

interface ComputedBudgetMetrics {
  varianceAmount: number; // estimated - actual (positive = remaining/surplus, negative = overrun)
  variancePercent: number;
  utilizationPercent: number;
  health: VarianceHealth;
}

const STORAGE_KEY = 'jamat_budget_allocations_v1';

const FISCAL_YEAR_OPTIONS: BudgetFiscalYear[] = [
  '1448-1449 Hijri',
  '1447-1448 Hijri',
  '1446-1447 Hijri',
  '1445-1446 Hijri',
];

const DEPARTMENT_PRESETS: Record<BudgetEntityType, string[]> = {
  Department: [
    'Faiz ul Mawaid il Burhaniyah (FMB)',
    'Marafiq Burhaniyah (Masjid & Complex)',
    'Al-Madrasa al-Saifiyah (Taleem)',
    'Umur Seheeyah (Medical Welfare)',
    'Miqaat & Ashara Ohbat',
    'Umur Dakhiliyah & Security',
  ],
  'Trust Fund': [
    'Dawoodi Bohra Jamaat Trust (General)',
    'Qardan Hasanah Revolving Corpus',
    'Avqaaf & Estate Maintenance Trust',
    'Burhani Park Capital Reserve Fund',
    'Sabeel ul Barkaat Endowment',
  ],
};

const INITIAL_BUDGET_RECORDS: BudgetAllocationRecord[] = [
  {
    id: 'bdg-1',
    budgetCode: 'BDG-1447-01',
    fiscalYear: '1447-1448 Hijri',
    entityType: 'Department',
    departmentOrTrust: 'Faiz ul Mawaid il Burhaniyah (FMB)',
    expenseHead: 'Daily Ration, Halal Meat & Kitchen Fuel',
    estimatedBudget: 3500000,
    actualSpent: 2480000,
    approvalStatus: 'Approved',
    notes: 'Covers 12 months daily thaali kitchen operations and Deg Niyaz',
    updatedBy: 'janabadmin',
    updatedAt: '2026-10-28',
  },
  {
    id: 'bdg-2',
    budgetCode: 'BDG-1447-02',
    fiscalYear: '1447-1448 Hijri',
    entityType: 'Department',
    departmentOrTrust: 'Marafiq Burhaniyah (Masjid & Complex)',
    expenseHead: 'Masjid HVAC, Solar Grid & Acoustic Maintenance',
    estimatedBudget: 850000,
    actualSpent: 795000,
    approvalStatus: 'Approved',
    notes: 'Includes Shehrullah chiller servicing and line-array speaker upgrade',
    updatedBy: 'janabadmin',
    updatedAt: '2026-10-30',
  },
  {
    id: 'bdg-3',
    budgetCode: 'BDG-1447-03',
    fiscalYear: '1447-1448 Hijri',
    entityType: 'Department',
    departmentOrTrust: 'Al-Madrasa al-Saifiyah (Taleem)',
    expenseHead: 'Muallimeen Honorarium, Books & Scholarships',
    estimatedBudget: 900000,
    actualSpent: 520000,
    approvalStatus: 'Approved',
    notes: 'Term 1 & Term 2 disbursements settled',
    updatedBy: 'janabadmin',
    updatedAt: '2026-11-01',
  },
  {
    id: 'bdg-4',
    budgetCode: 'BDG-1447-04',
    fiscalYear: '1447-1448 Hijri',
    entityType: 'Department',
    departmentOrTrust: 'Miqaat & Ashara Ohbat',
    expenseHead: 'Ashara Marquee, Relay Screens & Ziyafat',
    estimatedBudget: 1200000,
    actualSpent: 1315000,
    approvalStatus: 'Revised',
    notes: 'Overrun due to extra marquee seating capacity expansion',
    updatedBy: 'janabadmin',
    updatedAt: '2026-11-04',
  },
  {
    id: 'bdg-5',
    budgetCode: 'BDG-1447-05',
    fiscalYear: '1447-1448 Hijri',
    entityType: 'Trust Fund',
    departmentOrTrust: 'Dawoodi Bohra Jamaat Trust (General)',
    expenseHead: 'Administrative Office, Audit & Utility Bills',
    estimatedBudget: 650000,
    actualSpent: 410000,
    approvalStatus: 'Approved',
    notes: 'ERP hosting, municipal taxes, and office stationery',
    updatedBy: 'janabadmin',
    updatedAt: '2026-11-05',
  },
  {
    id: 'bdg-6',
    budgetCode: 'BDG-1447-06',
    fiscalYear: '1447-1448 Hijri',
    entityType: 'Trust Fund',
    departmentOrTrust: 'Avqaaf & Estate Maintenance Trust',
    expenseHead: 'Property Structural Repairs & Legal Compliance',
    estimatedBudget: 500000,
    actualSpent: 465000,
    approvalStatus: 'Pending Review',
    notes: 'Waterproofing for Najmi Commercial block roof',
    updatedBy: 'janabadmin',
    updatedAt: '2026-11-06',
  },
  {
    id: 'bdg-7',
    budgetCode: 'BDG-1446-01',
    fiscalYear: '1446-1447 Hijri',
    entityType: 'Department',
    departmentOrTrust: 'Faiz ul Mawaid il Burhaniyah (FMB)',
    expenseHead: 'Annual FMB Kitchen & Thaali Logistics',
    estimatedBudget: 3200000,
    actualSpent: 3110000,
    approvalStatus: 'Approved',
    notes: 'Closed FY 1446-1447H audited actuals',
    updatedBy: 'janabadmin',
    updatedAt: '2025-06-20',
  },
  {
    id: 'bdg-8',
    budgetCode: 'BDG-1446-02',
    fiscalYear: '1446-1447 Hijri',
    entityType: 'Trust Fund',
    departmentOrTrust: 'Qardan Hasanah Revolving Corpus',
    expenseHead: 'Administrative & Legal Documentation Charges',
    estimatedBudget: 250000,
    actualSpent: 272000,
    approvalStatus: 'Revised',
    notes: 'Additional stamp duty & notary filings for loan deeds',
    updatedBy: 'janabadmin',
    updatedAt: '2025-06-22',
  },
];

function loadBudgetRecords(): BudgetAllocationRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_BUDGET_RECORDS));
      return INITIAL_BUDGET_RECORDS;
    }
    return JSON.parse(raw) as BudgetAllocationRecord[];
  } catch {
    return INITIAL_BUDGET_RECORDS;
  }
}

function saveBudgetRecords(items: BudgetAllocationRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.error('Failed to save budget records:', err);
  }
}

const fmtINR = (n: number): string => `₹${Math.abs(Math.round(n)).toLocaleString('en-IN')}`;
const fmtSignedINR = (n: number): string =>
  n < 0 ? `-₹${Math.abs(Math.round(n)).toLocaleString('en-IN')}` : `+₹${Math.round(n).toLocaleString('en-IN')}`;

function computeBudgetMetrics(estimated: number, actual: number): ComputedBudgetMetrics {
  const varianceAmount = estimated - actual;
  const utilizationPercent = estimated > 0 ? Math.round((actual / estimated) * 100) : 0;
  const variancePercent = estimated > 0 ? Math.round((varianceAmount / estimated) * 100) : 0;
  let health: VarianceHealth = 'Under Budget';
  if (actual > estimated) {
    health = 'Over Budget';
  } else if (utilizationPercent >= 85) {
    health = 'Near Limit';
  }
  return { varianceAmount, variancePercent, utilizationPercent, health };
}

interface BudgetFormState {
  fiscalYear: BudgetFiscalYear;
  entityType: BudgetEntityType;
  departmentOrTrust: string;
  expenseHead: string;
  estimatedBudget: string;
  actualSpent: string;
  approvalStatus: BudgetApprovalStatus;
  notes: string;
}

const createDefaultForm = (fy: BudgetFiscalYear): BudgetFormState => ({
  fiscalYear: fy,
  entityType: 'Department',
  departmentOrTrust: DEPARTMENT_PRESETS.Department[0],
  expenseHead: '',
  estimatedBudget: '500000',
  actualSpent: '0',
  approvalStatus: 'Approved',
  notes: '',
});

interface BudgetModuleProps {
  currentUser: UserProfile;
  financialYear: FinancialYear;
  showToast: (msg: string) => void;
  canAdd?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}

export const BudgetModule: React.FC<BudgetModuleProps> = ({
  currentUser,
  financialYear,
  showToast,
  canAdd = true,
  canEdit = true,
  canDelete = true,
}) => {
  const [records, setRecords] = useState<BudgetAllocationRecord[]>(loadBudgetRecords);
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<BudgetFiscalYear>(financialYear);

  // Sync fiscal year when top navbar selector changes
  useEffect(() => {
    setSelectedFiscalYear(financialYear);
  }, [financialYear]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [entityFilter, setEntityFilter] = useState<'ALL' | BudgetEntityType>('ALL');
  const [healthFilter, setHealthFilter] = useState<'ALL' | VarianceHealth>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | BudgetApprovalStatus>('ALL');

  // Form State (Create & Edit)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BudgetFormState>(() => createDefaultForm(financialYear));

  // Quick Expense Posting Modal
  const [expenseTarget, setExpenseTarget] = useState<BudgetAllocationRecord | null>(null);
  const [expenseIncrement, setExpenseIncrement] = useState('');

  const fiscalRecords = useMemo(
    () => records.filter((r) => r.fiscalYear === selectedFiscalYear),
    [records, selectedFiscalYear]
  );

  const filteredRecords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return fiscalRecords.filter((rec) => {
      if (entityFilter !== 'ALL' && rec.entityType !== entityFilter) return false;
      if (statusFilter !== 'ALL' && rec.approvalStatus !== statusFilter) return false;
      const metrics = computeBudgetMetrics(rec.estimatedBudget, rec.actualSpent);
      if (healthFilter !== 'ALL' && metrics.health !== healthFilter) return false;
      if (!q) return true;
      return (
        rec.budgetCode.toLowerCase().includes(q) ||
        rec.departmentOrTrust.toLowerCase().includes(q) ||
        rec.expenseHead.toLowerCase().includes(q) ||
        rec.notes.toLowerCase().includes(q)
      );
    });
  }, [fiscalRecords, entityFilter, statusFilter, healthFilter, searchQuery]);

  // Summary Metrics for active fiscal year
  const summary = useMemo(() => {
    let totalEstimated = 0;
    let totalActual = 0;
    let overBudgetCount = 0;
    let nearLimitCount = 0;

    fiscalRecords.forEach((r) => {
      totalEstimated += r.estimatedBudget;
      totalActual += r.actualSpent;
      const m = computeBudgetMetrics(r.estimatedBudget, r.actualSpent);
      if (m.health === 'Over Budget') overBudgetCount += 1;
      else if (m.health === 'Near Limit') nearLimitCount += 1;
    });

    const netVariance = totalEstimated - totalActual;
    const utilizationPct =
      totalEstimated > 0 ? Math.round((totalActual / totalEstimated) * 100) : 0;

    return {
      totalEstimated,
      totalActual,
      netVariance,
      utilizationPct,
      overBudgetCount,
      nearLimitCount,
    };
  }, [fiscalRecords]);

  // Filtered Table Totals
  const filteredTotals = useMemo(() => {
    const estimated = filteredRecords.reduce((s, r) => s + r.estimatedBudget, 0);
    const actual = filteredRecords.reduce((s, r) => s + r.actualSpent, 0);
    return {
      estimated,
      actual,
      variance: estimated - actual,
    };
  }, [filteredRecords]);

  const formLiveMetrics = useMemo(() => {
    return computeBudgetMetrics(
      parseFloat(form.estimatedBudget) || 0,
      parseFloat(form.actualSpent) || 0
    );
  }, [form.estimatedBudget, form.actualSpent]);

  const openCreateForm = () => {
    setEditingId(null);
    setForm(createDefaultForm(selectedFiscalYear));
    setIsFormOpen(true);
  };

  const openEditForm = (rec: BudgetAllocationRecord) => {
    setEditingId(rec.id);
    setForm({
      fiscalYear: rec.fiscalYear,
      entityType: rec.entityType,
      departmentOrTrust: rec.departmentOrTrust,
      expenseHead: rec.expenseHead,
      estimatedBudget: String(rec.estimatedBudget),
      actualSpent: String(rec.actualSpent),
      approvalStatus: rec.approvalStatus,
      notes: rec.notes,
    });
    setIsFormOpen(true);
  };

  const handleSaveAllocation = (e: React.FormEvent) => {
    e.preventDefault();
    const est = parseFloat(form.estimatedBudget);
    const act = parseFloat(form.actualSpent) || 0;

    if (!form.departmentOrTrust.trim() || !form.expenseHead.trim() || isNaN(est) || est <= 0) {
      showToast('Enter valid Department/Trust, Expense Head, and positive Estimated Budget.');
      return;
    }

    const today = new Date().toISOString().split('T')[0];

    if (editingId) {
      if (!canEdit) {
        showToast('Edit permission required to update budget allocations.');
        return;
      }
      const next = records.map((r) =>
        r.id === editingId
          ? {
              ...r,
              fiscalYear: form.fiscalYear,
              entityType: form.entityType,
              departmentOrTrust: form.departmentOrTrust.trim(),
              expenseHead: form.expenseHead.trim(),
              estimatedBudget: est,
              actualSpent: Math.max(0, act),
              approvalStatus: form.approvalStatus,
              notes: form.notes.trim(),
              updatedBy: currentUser.username,
              updatedAt: today,
            }
          : r
      );
      setRecords(next);
      saveBudgetRecords(next);
      setSelectedFiscalYear(form.fiscalYear);
      appendActivityLog(
        currentUser.username,
        'Budget Module',
        'Budget Allocation',
        'EDIT',
        `Updated budget head "${form.expenseHead}" (${fmtINR(est)} est. / ${fmtINR(act)} actual) for ${form.fiscalYear}`
      );
      showToast('Budget allocation updated successfully.');
      setIsFormOpen(false);
      setEditingId(null);
      return;
    }

    if (!canAdd) {
      showToast('Add permission required to create budget allocations.');
      return;
    }

    const yearShort = form.fiscalYear.slice(0, 4);
    const newRec: BudgetAllocationRecord = {
      id: `bdg-${Date.now()}`,
      budgetCode: `BDG-${yearShort}-${String(records.length + 1).padStart(2, '0')}`,
      fiscalYear: form.fiscalYear,
      entityType: form.entityType,
      departmentOrTrust: form.departmentOrTrust.trim(),
      expenseHead: form.expenseHead.trim(),
      estimatedBudget: est,
      actualSpent: Math.max(0, act),
      approvalStatus: form.approvalStatus,
      notes: form.notes.trim(),
      updatedBy: currentUser.username,
      updatedAt: today,
    };

    const next = [newRec, ...records];
    setRecords(next);
    saveBudgetRecords(next);
    setSelectedFiscalYear(form.fiscalYear);
    appendActivityLog(
      currentUser.username,
      'Budget Module',
      'Budget Allocation',
      'ADD',
      `Allocated ${fmtINR(est)} to ${newRec.departmentOrTrust} (${newRec.expenseHead}) for ${form.fiscalYear}`
    );
    showToast(`Budget allocation ${newRec.budgetCode} created for ${form.fiscalYear}.`);
    setIsFormOpen(false);
  };

  const handleLogActualExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseTarget) return;
    const addAmt = parseFloat(expenseIncrement);
    if (isNaN(addAmt) || addAmt <= 0) {
      showToast('Enter a positive expense amount.');
      return;
    }

    const next = records.map((r) =>
      r.id === expenseTarget.id
        ? {
            ...r,
            actualSpent: r.actualSpent + addAmt,
            updatedBy: currentUser.username,
            updatedAt: new Date().toISOString().split('T')[0],
          }
        : r
    );
    setRecords(next);
    saveBudgetRecords(next);
    appendActivityLog(
      currentUser.username,
      'Budget Module',
      'Expense Tracking',
      'EDIT',
      `Logged ${fmtINR(addAmt)} actual expense against ${expenseTarget.budgetCode} (${expenseTarget.expenseHead})`
    );
    showToast(`Logged ${fmtINR(addAmt)} expense against ${expenseTarget.budgetCode}.`);
    setExpenseTarget(null);
    setExpenseIncrement('');
  };

  const handleDeleteRecord = (rec: BudgetAllocationRecord) => {
    if (!canDelete) return;
    if (!window.confirm(`Delete budget line "${rec.budgetCode} — ${rec.expenseHead}"?`)) return;
    const next = records.filter((r) => r.id !== rec.id);
    setRecords(next);
    saveBudgetRecords(next);
    showToast(`Removed budget allocation ${rec.budgetCode}.`);
  };

  const handleExportCsv = () => {
    const headers = [
      'Budget Code',
      'Fiscal Year',
      'Scope',
      'Department / Trust',
      'Expense Head',
      'Estimated Budget (INR)',
      'Actual Spent (INR)',
      'Variance (INR)',
      'Utilization %',
      'Variance Status',
      'Approval Status',
    ];
    const rows = filteredRecords.map((r) => {
      const m = computeBudgetMetrics(r.estimatedBudget, r.actualSpent);
      return [
        r.budgetCode,
        r.fiscalYear,
        r.entityType,
        r.departmentOrTrust,
        r.expenseHead,
        r.estimatedBudget,
        r.actualSpent,
        m.varianceAmount,
        `${m.utilizationPercent}%`,
        m.health,
        r.approvalStatus,
      ];
    });
    const csv = [
      headers.map((h) => `"${h}"`).join(','),
      ...rows.map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Budget_Variance_${selectedFiscalYear.replace(/\s+/g, '_')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Exported ${filteredRecords.length} budget records for ${selectedFiscalYear}.`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner + Fiscal Year Selector */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 rounded-2xl p-5 sm:p-6 text-white shadow-lg border border-amber-400/20">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="p-2 bg-amber-400/15 rounded-xl text-amber-300 border border-amber-400/30">
                <PieChart className="w-5 h-5" />
              </span>
              <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-amber-400/20 text-amber-200 border border-amber-400/30">
                Maliyah &amp; Fiscal Control
              </span>
              <span className="text-xs font-mono text-slate-300">{selectedFiscalYear}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-2">
              Departmental &amp; Trust Budget Module
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Allocate annual Jamaat &amp; Trust budgets, monitor estimated versus actual expenditure, and track real-time variance across Hijri fiscal years.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <div className="flex items-center gap-2 bg-white/10 border border-white/15 rounded-xl px-3 py-2">
              <Calendar className="w-4 h-4 text-amber-300" />
              <label htmlFor="budget-fiscal-year" className="text-[11px] font-bold text-amber-200">
                Fiscal Year:
              </label>
              <select
                id="budget-fiscal-year"
                value={selectedFiscalYear}
                onChange={(e) => setSelectedFiscalYear(e.target.value as BudgetFiscalYear)}
                className="bg-slate-900 text-white text-xs font-bold rounded-lg px-2.5 py-1 border border-white/20 cursor-pointer focus:outline-none"
              >
                {FISCAL_YEAR_OPTIONS.map((fy) => (
                  <option key={fy} value={fy}>
                    {fy}
                  </option>
                ))}
              </select>
            </div>

            {canAdd && (
              <button
                type="button"
                onClick={openCreateForm}
                className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-black inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Allocate Budget</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-blue-200 p-4 sm:p-5 shadow-xs">
          <div className="flex items-start justify-between">
            <span className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700">
              <Landmark className="w-5 h-5" />
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
              {fiscalRecords.length} Heads
            </span>
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-3">
            Total Estimated Budget
          </p>
          <p className="text-2xl font-black text-slate-900 font-mono mt-1">
            {fmtINR(summary.totalEstimated)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Fiscal Year {selectedFiscalYear}</p>
        </div>

        <div className="bg-white rounded-2xl border border-amber-300/80 p-4 sm:p-5 shadow-xs">
          <div className="flex items-start justify-between">
            <span className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700">
              <Wallet className="w-5 h-5" />
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
              {summary.utilizationPct}% Utilized
            </span>
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-3">
            Actual Expenditure
          </p>
          <p className="text-2xl font-black text-slate-900 font-mono mt-1">
            {fmtINR(summary.totalActual)}
          </p>
          <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
            <div
              className={`h-1.5 rounded-full ${
                summary.utilizationPct > 100 ? 'bg-rose-600' : 'bg-amber-500'
              }`}
              style={{ width: `${Math.min(100, summary.utilizationPct)}%` }}
            />
          </div>
        </div>

        <div
          className={`bg-white rounded-2xl border p-4 sm:p-5 shadow-xs ${
            summary.netVariance < 0 ? 'border-rose-200' : 'border-emerald-200'
          }`}
        >
          <div className="flex items-start justify-between">
            <span
              className={`p-2.5 rounded-xl border ${
                summary.netVariance < 0
                  ? 'bg-rose-50 border-rose-200 text-rose-700'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-700'
              }`}
            >
              {summary.netVariance < 0 ? (
                <TrendingDown className="w-5 h-5" />
              ) : (
                <TrendingUp className="w-5 h-5" />
              )}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                summary.netVariance < 0
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {summary.netVariance < 0 ? 'Net Overrun' : 'Surplus Remaining'}
            </span>
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-3">
            Net Budget Variance
          </p>
          <p
            className={`text-2xl font-black font-mono mt-1 ${
              summary.netVariance < 0 ? 'text-rose-700' : 'text-emerald-800'
            }`}
          >
            {fmtSignedINR(summary.netVariance)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Estimated minus Actual spent</p>
        </div>

        <div className="bg-white rounded-2xl border border-rose-200 p-4 sm:p-5 shadow-xs">
          <div className="flex items-start justify-between">
            <span className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700">
              <AlertTriangle className="w-5 h-5" />
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
              Alerts
            </span>
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-3">
            Variance Watchlist
          </p>
          <p className="text-2xl font-black text-slate-900 font-mono mt-1">
            {summary.overBudgetCount} Over / {summary.nearLimitCount} Near
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Heads exceeding 100% or ≥ 85% budget cap
          </p>
        </div>
      </div>

      {/* Allocation Form Card (Collapsible Create / Edit) */}
      {isFormOpen && (
        <div className="bg-white rounded-2xl border-2 border-amber-300 shadow-sm p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-black text-slate-900">
                {editingId
                  ? 'Edit Budget Allocation Record'
                  : 'New Departmental / Trust Budget Allocation'}
              </h3>
              <p className="text-xs text-slate-500">
                Assign estimated ceiling and track initial or updated actual expenditure.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsFormOpen(false);
                setEditingId(null);
              }}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSaveAllocation} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Fiscal Year *</label>
                <select
                  value={form.fiscalYear}
                  onChange={(e) =>
                    setForm({ ...form, fiscalYear: e.target.value as BudgetFiscalYear })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-bold"
                >
                  {FISCAL_YEAR_OPTIONS.map((fy) => (
                    <option key={fy} value={fy}>
                      {fy}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Allocation Scope *</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Department', 'Trust Fund'] as const).map((scope) => (
                    <button
                      key={scope}
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          entityType: scope,
                          departmentOrTrust: DEPARTMENT_PRESETS[scope][0],
                        })
                      }
                      className={`py-2 px-2 rounded-xl font-bold border text-center cursor-pointer transition-all ${
                        form.entityType === scope
                          ? 'bg-amber-400 text-slate-950 border-amber-500'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {scope}
                    </button>
                  ))}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">
                  {form.entityType === 'Department' ? 'Department Name *' : 'Trust / Endowment Fund *'}
                </label>
                <select
                  value={
                    DEPARTMENT_PRESETS[form.entityType].includes(form.departmentOrTrust)
                      ? form.departmentOrTrust
                      : 'CUSTOM'
                  }
                  onChange={(e) => {
                    if (e.target.value !== 'CUSTOM') {
                      setForm({ ...form, departmentOrTrust: e.target.value });
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-semibold mb-1.5"
                >
                  {DEPARTMENT_PRESETS[form.entityType].map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                  <option value="CUSTOM">-- Custom Department / Trust Name --</option>
                </select>
                <input
                  type="text"
                  required
                  value={form.departmentOrTrust}
                  onChange={(e) => setForm({ ...form, departmentOrTrust: e.target.value })}
                  placeholder="Enter Department or Trust Fund name"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">
                  Expense Head / Budget Line Item *
                </label>
                <input
                  type="text"
                  required
                  value={form.expenseHead}
                  onChange={(e) => setForm({ ...form, expenseHead: e.target.value })}
                  placeholder="e.g. Shehrullah Iftar & Kitchen Ration"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Estimated Budget (₹) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={form.estimatedBudget}
                  onChange={(e) => setForm({ ...form, estimatedBudget: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-black text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Actual Spent (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={form.actualSpent}
                  onChange={(e) => setForm({ ...form, actualSpent: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-black text-emerald-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 items-end">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Approval Status</label>
                <select
                  value={form.approvalStatus}
                  onChange={(e) =>
                    setForm({ ...form, approvalStatus: e.target.value as BudgetApprovalStatus })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-semibold"
                >
                  <option value="Approved">Approved</option>
                  <option value="Pending Review">Pending Review</option>
                  <option value="Revised">Revised</option>
                  <option value="Frozen">Frozen</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Remarks / Notes</label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Committee resolution or allocation justification..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-4 text-xs">
                <span>
                  Projected Variance:{' '}
                  <strong
                    className={`font-mono ${
                      formLiveMetrics.varianceAmount < 0 ? 'text-rose-700' : 'text-emerald-800'
                    }`}
                  >
                    {fmtSignedINR(formLiveMetrics.varianceAmount)} ({formLiveMetrics.variancePercent}%)
                  </strong>
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    formLiveMetrics.health === 'Over Budget'
                      ? 'bg-rose-100 text-rose-800'
                      : formLiveMetrics.health === 'Near Limit'
                      ? 'bg-amber-100 text-amber-900'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {formLiveMetrics.health} ({formLiveMetrics.utilizationPercent}% used)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsFormOpen(false);
                    setEditingId(null);
                  }}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-amber-300 rounded-xl font-black inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{editingId ? 'Update Allocation' : 'Save Allocation'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Estimated vs Actual Expense Tracking Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-black text-slate-900">
              Estimated vs Actual Expense Tracking ({selectedFiscalYear})
            </h3>
            <p className="text-xs text-slate-500">
              Monitor departmental &amp; trust budget utilization, variance alerts, and post actual expenses.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setEntityFilter('ALL');
                setHealthFilter('ALL');
                setStatusFilter('ALL');
              }}
              className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:text-slate-800 cursor-pointer"
              title="Reset Filters"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search code, department, or head..."
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value as 'ALL' | BudgetEntityType)}
            className="px-3 py-2 border border-slate-200 rounded-xl bg-white font-semibold cursor-pointer"
          >
            <option value="ALL">All Scopes (Dept &amp; Trust)</option>
            <option value="Department">Departments Only</option>
            <option value="Trust Fund">Trust Funds Only</option>
          </select>

          <select
            value={healthFilter}
            onChange={(e) => setHealthFilter(e.target.value as 'ALL' | VarianceHealth)}
            className="px-3 py-2 border border-slate-200 rounded-xl bg-white font-semibold cursor-pointer"
          >
            <option value="ALL">All Variance Indicators</option>
            <option value="Under Budget">Under Budget (&lt; 85%)</option>
            <option value="Near Limit">Near Limit (85% – 100%)</option>
            <option value="Over Budget">Over Budget (&gt; 100%)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'ALL' | BudgetApprovalStatus)}
            className="px-3 py-2 border border-slate-200 rounded-xl bg-white font-semibold cursor-pointer"
          >
            <option value="ALL">All Approval Statuses</option>
            <option value="Approved">Approved</option>
            <option value="Pending Review">Pending Review</option>
            <option value="Revised">Revised</option>
            <option value="Frozen">Frozen</option>
          </select>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="px-3.5 py-3">Code</th>
                <th className="px-3.5 py-3">Department / Trust</th>
                <th className="px-3.5 py-3">Expense Head</th>
                <th className="px-3.5 py-3 text-right">Estimated</th>
                <th className="px-3.5 py-3 text-right">Actual Spent</th>
                <th className="px-3.5 py-3">Variance &amp; Utilization</th>
                <th className="px-3.5 py-3 text-center">Status</th>
                <th className="px-3.5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map((rec) => {
                const m = computeBudgetMetrics(rec.estimatedBudget, rec.actualSpent);
                return (
                  <tr key={rec.id} className="hover:bg-amber-50/30">
                    <td className="px-3.5 py-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                      <div>{rec.budgetCode}</div>
                      <div className="text-[10px] text-slate-500 font-normal">{rec.updatedAt}</div>
                    </td>
                    <td className="px-3.5 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold mb-1 ${
                          rec.entityType === 'Trust Fund'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        <Building2 className="w-2.5 h-2.5" />
                        <span>{rec.entityType}</span>
                      </span>
                      <p className="font-bold text-slate-900">{rec.departmentOrTrust}</p>
                    </td>
                    <td className="px-3.5 py-3">
                      <p className="font-semibold text-slate-800">{rec.expenseHead}</p>
                      {rec.notes && (
                        <p className="text-[10px] text-slate-500 max-w-xs truncate">{rec.notes}</p>
                      )}
                    </td>
                    <td className="px-3.5 py-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                      {fmtINR(rec.estimatedBudget)}
                    </td>
                    <td className="px-3.5 py-3 text-right font-mono font-bold text-slate-800 whitespace-nowrap">
                      {fmtINR(rec.actualSpent)}
                    </td>
                    <td className="px-3.5 py-3 min-w-[190px]">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span
                          className={`font-mono font-black ${
                            m.health === 'Over Budget'
                              ? 'text-rose-700'
                              : m.health === 'Near Limit'
                              ? 'text-amber-800'
                              : 'text-emerald-800'
                          }`}
                        >
                          {fmtSignedINR(m.varianceAmount)}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold whitespace-nowrap ${
                            m.health === 'Over Budget'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : m.health === 'Near Limit'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {m.health} ({m.utilizationPercent}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full ${
                            m.health === 'Over Budget'
                              ? 'bg-rose-600'
                              : m.health === 'Near Limit'
                              ? 'bg-amber-500'
                              : 'bg-emerald-600'
                          }`}
                          style={{ width: `${Math.min(100, m.utilizationPercent)}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-3.5 py-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${
                          rec.approvalStatus === 'Approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : rec.approvalStatus === 'Revised'
                            ? 'bg-blue-100 text-blue-800'
                            : rec.approvalStatus === 'Frozen'
                            ? 'bg-slate-200 text-slate-700'
                            : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {rec.approvalStatus}
                      </span>
                    </td>
                    <td className="px-3.5 py-3 text-right">
                      <div className="inline-flex items-center gap-1 justify-end">
                        {canEdit && rec.approvalStatus !== 'Frozen' && (
                          <button
                            type="button"
                            onClick={() => {
                              setExpenseTarget(rec);
                              setExpenseIncrement('');
                            }}
                            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[10px] font-bold cursor-pointer whitespace-nowrap"
                          >
                            + Expense
                          </button>
                        )}
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => openEditForm(rec)}
                            title="Edit Allocation"
                            className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-lg cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => handleDeleteRecord(rec)}
                            title="Delete Allocation"
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-slate-400">
                    No budget allocations match your filters for {selectedFiscalYear}.
                  </td>
                </tr>
              )}
            </tbody>

            {filteredRecords.length > 0 && (
              <tfoot className="bg-slate-900 text-white font-mono text-xs">
                <tr>
                  <td colSpan={3} className="px-3.5 py-3 font-sans font-black text-amber-300">
                    Filtered Totals ({filteredRecords.length} budget lines)
                  </td>
                  <td className="px-3.5 py-3 text-right font-black">
                    {fmtINR(filteredTotals.estimated)}
                  </td>
                  <td className="px-3.5 py-3 text-right font-black text-amber-300">
                    {fmtINR(filteredTotals.actual)}
                  </td>
                  <td className="px-3.5 py-3 font-black">
                    <span
                      className={
                        filteredTotals.variance < 0 ? 'text-rose-400' : 'text-emerald-300'
                      }
                    >
                      {fmtSignedINR(filteredTotals.variance)}
                    </span>
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Modal: Log Actual Expense */}
      {expenseTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900">
                Log Actual Expense — {expenseTarget.budgetCode}
              </h3>
              <button
                type="button"
                onClick={() => setExpenseTarget(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <p className="font-bold text-slate-900">{expenseTarget.departmentOrTrust}</p>
              <p className="text-slate-600">{expenseTarget.expenseHead}</p>
              <p className="font-mono text-slate-700">
                Estimated: <strong>{fmtINR(expenseTarget.estimatedBudget)}</strong> • Spent so far:{' '}
                <strong>{fmtINR(expenseTarget.actualSpent)}</strong>
              </p>
            </div>
            <form onSubmit={handleLogActualExpense} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Additional Expense Amount (₹) *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={expenseIncrement}
                  onChange={(e) => setExpenseIncrement(e.target.value)}
                  placeholder="Enter expenditure amount..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-black text-slate-900"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setExpenseTarget(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Post Expense</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

