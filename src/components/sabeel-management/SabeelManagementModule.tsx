import React, { useState, useEffect } from 'react';
import {
  Coins,
  CreditCard,
  ArrowLeftRight,
  ShieldAlert,
} from 'lucide-react';
import {
  UserProfile,
  FinancialYear,
  SabeelLedgerRecord,
  SabeelTransactionEntry,
  HeadOfFamily,
} from '../../types';
import {
  getStoredSabeelLedger,
  getStoredSabeelTransactions,
} from '../../utils/sabeelManagement';
import { getStoredHofs } from '../../utils/memberMaster';
import { checkUserPermission } from '../../utils/rbac';
import { SabeelMasterLedgerSubpage } from './SabeelMasterLedgerSubpage';
import { SabeelTakhmeenCollectionSubpage } from './SabeelTakhmeenCollectionSubpage';
import { SabeelTransferHistorySubpage } from './SabeelTransferHistorySubpage';

interface SabeelManagementModuleProps {
  currentUser: UserProfile;
  activeSubItemId: string;
  subItemLabel: string;
  financialYear: FinancialYear;
  showToast: (msg: string) => void;
}

export const SabeelManagementModule: React.FC<SabeelManagementModuleProps> = ({
  currentUser,
  activeSubItemId,
  subItemLabel,
  financialYear,
  showToast,
}) => {
  // Shared persistent state
  const [ledger, setLedger] = useState<SabeelLedgerRecord[]>(() => getStoredSabeelLedger());
  const [transactions, setTransactions] = useState<SabeelTransactionEntry[]>(() =>
    getStoredSabeelTransactions()
  );
  const [hofs, setHofs] = useState<HeadOfFamily[]>(() => getStoredHofs());

  // Active sub-page tab state
  const [activeTab, setActiveTab] = useState<'sabeel-ledger' | 'sabeel-collection' | 'sabeel-history'>(
    (activeSubItemId as any) || 'sabeel-ledger'
  );

  // Target ITS when navigating between tabs
  const [targetIts, setTargetIts] = useState<string | undefined>(undefined);

  // Sync tab whenever sidebar navigation changes
  useEffect(() => {
    if (
      activeSubItemId === 'sabeel-ledger' ||
      activeSubItemId === 'sabeel-collection' ||
      activeSubItemId === 'sabeel-history'
    ) {
      setActiveTab(activeSubItemId);
    }
  }, [activeSubItemId]);

  // Navigate to payment desk with specific member pre-filled
  const handleNavigateToPayment = (itsNumber: string) => {
    setTargetIts(itsNumber);
    setActiveTab('sabeel-collection');
  };

  // Navigate to history with specific member
  const handleNavigateToHistory = (itsNumber?: string) => {
    setTargetIts(itsNumber);
    setActiveTab('sabeel-history');
  };

  // Granular RBAC View Permissions
  const canViewLedger = checkUserPermission(currentUser, 'sabeel-ledger', 'view');
  const canViewCollection = checkUserPermission(currentUser, 'sabeel-collection', 'view');
  const canViewHistory = checkUserPermission(currentUser, 'sabeel-history', 'view');

  return (
    <div className="space-y-5">
      {/* ── Sub-Page Navigation Tabs ── */}
      <div className="bg-white border border-amber-300/40 rounded-xl p-1.5 shadow-xs flex items-center gap-1.5 overflow-x-auto">
        {canViewLedger && (
          <button
            type="button"
            onClick={() => setActiveTab('sabeel-ledger')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'sabeel-ledger'
                ? 'bg-amber-400 text-slate-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-amber-50'
            }`}
          >
            <Coins className="w-4 h-4 text-amber-900" />
            <span>1. Sabeel Master Ledger</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-800 font-mono font-bold">
              {ledger.length} Accounts
            </span>
          </button>
        )}

        {canViewCollection && (
          <button
            type="button"
            onClick={() => setActiveTab('sabeel-collection')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'sabeel-collection'
                ? 'bg-amber-400 text-slate-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-amber-50'
            }`}
          >
            <CreditCard className="w-4 h-4 text-amber-900" />
            <span>2. Sabeel Takhmeen & Collection</span>
          </button>
        )}

        {canViewHistory && (
          <button
            type="button"
            onClick={() => setActiveTab('sabeel-history')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'sabeel-history'
                ? 'bg-amber-400 text-slate-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-amber-50'
            }`}
          >
            <ArrowLeftRight className="w-4 h-4 text-amber-900" />
            <span>3. Transfer & History Log</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 text-blue-800 font-mono font-bold">
              {transactions.length} Logs
            </span>
          </button>
        )}
      </div>

      {/* ── Sub-Page Rendering with RBAC Enforcement ── */}
      {activeTab === 'sabeel-ledger' && (
        <>
          {canViewLedger ? (
            <SabeelMasterLedgerSubpage
              ledger={ledger}
              setLedger={setLedger}
              hofs={hofs}
              currentUser={currentUser}
              financialYear={financialYear}
              showToast={showToast}
              onNavigateToPayment={handleNavigateToPayment}
              onNavigateToHistory={handleNavigateToHistory}
            />
          ) : (
            <AccessDeniedBanner subpageName="Sabeel Master Ledger" />
          )}
        </>
      )}

      {activeTab === 'sabeel-collection' && (
        <>
          {canViewCollection ? (
            <SabeelTakhmeenCollectionSubpage
              ledger={ledger}
              setLedger={setLedger}
              transactions={transactions}
              setTransactions={setTransactions}
              hofs={hofs}
              currentUser={currentUser}
              financialYear={financialYear}
              showToast={showToast}
              preselectedIts={targetIts}
            />
          ) : (
            <AccessDeniedBanner subpageName="Sabeel Takhmeen & Collection" />
          )}
        </>
      )}

      {activeTab === 'sabeel-history' && (
        <>
          {canViewHistory ? (
            <SabeelTransferHistorySubpage
              ledger={ledger}
              setLedger={setLedger}
              transactions={transactions}
              setTransactions={setTransactions}
              hofs={hofs}
              currentUser={currentUser}
              financialYear={financialYear}
              showToast={showToast}
              preselectedIts={targetIts}
            />
          ) : (
            <AccessDeniedBanner subpageName="Transfer & History Log" />
          )}
        </>
      )}
    </div>
  );
};

const AccessDeniedBanner: React.FC<{ subpageName: string }> = ({ subpageName }) => (
  <div className="bg-white border border-rose-200 rounded-2xl p-8 text-center max-w-md mx-auto shadow-sm space-y-3">
    <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
      <ShieldAlert className="w-6 h-6" />
    </div>
    <h3 className="text-base font-bold text-slate-900">Access Restricted</h3>
    <p className="text-xs text-slate-500">
      You do not have <span className="font-bold text-rose-700">[View]</span> permission to access{' '}
      <span className="font-semibold">{subpageName}</span>. Contact the Super Admin or Janab Amil
      Saheb to request access.
    </p>
  </div>
);
