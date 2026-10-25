import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Receipt,
  FileSpreadsheet,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import {
  UserProfile,
  FinancialYear,
  GeneralReceiptRecord,
} from '../../types';
import { checkUserPermission } from '../../utils/rbac';
import { getStoredGeneralReceipts, saveStoredGeneralReceipts } from '../../utils/executiveReports';
import { FinancialSummarySubpage } from './FinancialSummarySubpage';
import { GeneralReceiptGeneratorSubpage } from './GeneralReceiptGeneratorSubpage';
import { ReportsHubSubpage } from './ReportsHubSubpage';

interface ExecutiveReportsModuleProps {
  currentUser: UserProfile;
  subItemLabel: string;
  subItemId?: string;
  financialYear: FinancialYear;
  showToast: (msg: string) => void;
}

export const ExecutiveReportsModule: React.FC<ExecutiveReportsModuleProps> = ({
  currentUser,
  subItemId,
  financialYear,
  showToast,
}) => {
  // Shared Receipts State
  const [receipts, setReceipts] = useState<GeneralReceiptRecord[]>(() =>
    getStoredGeneralReceipts()
  );

  // Active Tab state: 'summary' | 'receipts' | 'reports'
  const [activeTab, setActiveTab] = useState<'summary' | 'receipts' | 'reports'>(() => {
    if (subItemId === 'counter-payment') return 'receipts';
    if (subItemId === 'refund-ledger') return 'reports';
    return 'summary';
  });

  // Sync tab if subItemId changes from sidebar navigation
  useEffect(() => {
    if (subItemId === 'counter-payment') {
      setActiveTab('receipts');
    } else if (subItemId === 'refund-ledger') {
      setActiveTab('reports');
    } else if (subItemId === 'receipts-history') {
      setActiveTab('summary');
    }
  }, [subItemId]);

  // Update receipts handler
  const handleReceiptsUpdated = (updated: GeneralReceiptRecord[]) => {
    setReceipts(updated);
    saveStoredGeneralReceipts(updated);
  };

  // Granular RBAC Permissions
  const canView = checkUserPermission(currentUser, 'counter-payment', 'view') ||
    checkUserPermission(currentUser, 'receipts-history', 'view') ||
    currentUser.role === 'super_admin';

  const canAdd = checkUserPermission(currentUser, 'counter-payment', 'add') ||
    currentUser.role === 'super_admin';

  const canEdit = checkUserPermission(currentUser, 'counter-payment', 'edit') ||
    currentUser.role === 'super_admin';

  const canDelete = checkUserPermission(currentUser, 'counter-payment', 'delete') ||
    currentUser.role === 'super_admin';

  // Permission access check
  if (!canView) {
    return (
      <div className="bg-white border border-rose-200 rounded-2xl p-8 text-center max-w-md mx-auto shadow-sm space-y-3">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900">Access Restricted</h3>
        <p className="text-xs text-slate-500">
          You do not have <span className="font-bold text-rose-700">[View]</span> permission to access{' '}
          <span className="font-semibold">Executive Reports & General Receipts</span>. Contact the Super Admin
          or Janab Amil Saheb for access authorization.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Sub-Page Navigation Tabs Bar ── */}
      <div className="bg-white border border-amber-300/40 rounded-xl p-1.5 shadow-xs flex items-center gap-1.5 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('summary')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'summary'
              ? 'bg-amber-400 text-slate-950 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-amber-50'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-amber-900" />
          <span>1. Executive Financial Summary</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('receipts')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'receipts'
              ? 'bg-amber-400 text-slate-950 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-amber-50'
          }`}
        >
          <Receipt className="w-4 h-4 text-amber-900" />
          <span>2. General Receipt Generator (POS)</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-800 font-mono font-bold">
            {receipts.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reports')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'reports'
              ? 'bg-amber-400 text-slate-950 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-amber-50'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-amber-900" />
          <span>3. Reports Hub & Data Export Engine</span>
        </button>
      </div>

      {/* ── Active Sub-Page Render ── */}
      {activeTab === 'summary' && (
        <FinancialSummarySubpage
          currentUser={currentUser}
          financialYear={financialYear}
          onNavigateToReceipts={() => setActiveTab('receipts')}
          onNavigateToReports={() => setActiveTab('reports')}
        />
      )}

      {activeTab === 'receipts' && (
        <GeneralReceiptGeneratorSubpage
          currentUser={currentUser}
          financialYear={financialYear}
          receipts={receipts}
          onReceiptsUpdated={handleReceiptsUpdated}
          canAdd={canAdd}
          canEdit={canEdit}
          canDelete={canDelete}
          showToast={showToast}
        />
      )}

      {activeTab === 'reports' && (
        <ReportsHubSubpage
          currentUser={currentUser}
          financialYear={financialYear}
          canExport={canView}
          showToast={showToast}
        />
      )}
    </div>
  );
};
