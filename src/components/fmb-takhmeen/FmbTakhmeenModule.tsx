import React, { useState, useEffect } from 'react';
import {
  UtensilsCrossed,
  Coins,
  Receipt,
  Lock,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import {
  UserProfile,
  FinancialYear,
  ThaaliRecord,
  TakhmeenRecord,
  FmbCollectionEntry,
  HeadOfFamily,
} from '../../types';
import {
  getStoredThaalis,
  getStoredTakhmeens,
  getStoredCollections,
} from '../../utils/fmbTakhmeen';
import { getStoredHofs } from '../../utils/memberMaster';
import { checkUserPermission } from '../../utils/rbac';
import { ThaaliStatusSubpage } from './ThaaliStatusSubpage';
import { TakhmeenAllocationSubpage } from './TakhmeenAllocationSubpage';
import { DailyCollectionSubpage } from './DailyCollectionSubpage';

interface FmbTakhmeenModuleProps {
  currentUser: UserProfile;
  activeSubItemId: string;
  subItemLabel: string;
  financialYear: FinancialYear;
  showToast: (msg: string) => void;
  exportTrigger?: number;
}

export const FmbTakhmeenModule: React.FC<FmbTakhmeenModuleProps> = ({
  currentUser,
  activeSubItemId,
  subItemLabel,
  financialYear,
  showToast,
  exportTrigger,
}) => {
  // Shared persistent state across the 3 sub-pages
  const [thaalis, setThaalis] = useState<ThaaliRecord[]>(() => getStoredThaalis());
  const [takhmeens, setTakhmeens] = useState<TakhmeenRecord[]>(() => getStoredTakhmeens());
  const [collections, setCollections] = useState<FmbCollectionEntry[]>(() =>
    getStoredCollections()
  );
  const [hofs, setHofs] = useState<HeadOfFamily[]>(() => getStoredHofs());

  // Active sub-page tab state (allows in-module switching and sidebar sync)
  const [activeTab, setActiveTab] = useState<'thaali-status' | 'takhmeen-allocation' | 'fmb-dues'>(
    (activeSubItemId as any) || 'thaali-status'
  );

  // Target ITS when navigating from Takhmeen or Thaali directly into Collection desk
  const [collectionTargetIts, setCollectionTargetIts] = useState<string | undefined>(undefined);

  // Sync tab whenever sidebar navigation changes
  useEffect(() => {
    if (
      activeSubItemId === 'thaali-status' ||
      activeSubItemId === 'takhmeen-allocation' ||
      activeSubItemId === 'fmb-dues'
    ) {
      setActiveTab(activeSubItemId);
    }
  }, [activeSubItemId]);

  // Navigate to collection desk from Takhmeen table
  const handleNavigateToCollection = (itsNumber: string) => {
    setCollectionTargetIts(itsNumber);
    setActiveTab('fmb-dues');
  };

  // Granular RBAC View Permissions
  const canViewThaali = checkUserPermission(currentUser, 'thaali-status', 'view');
  const canViewTakhmeen = checkUserPermission(currentUser, 'takhmeen-allocation', 'view');
  const canViewDues = checkUserPermission(currentUser, 'fmb-dues', 'view');

  return (
    <div className="space-y-5">
      {/* ── Sub-Page Navigation Tabs ── */}
      <div className="bg-white border border-amber-300/40 rounded-xl p-1.5 shadow-xs flex items-center gap-1.5 overflow-x-auto">
        {canViewThaali && (
          <button
            type="button"
            onClick={() => setActiveTab('thaali-status')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'thaali-status'
                ? 'bg-amber-400 text-slate-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-amber-50'
            }`}
          >
            <UtensilsCrossed className="w-4 h-4 text-amber-900" />
            <span>1. Thaali Status Manager</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-mono font-bold">
              {thaalis.filter((t) => t.status === 'Active').length} Active
            </span>
          </button>
        )}

        {canViewTakhmeen && (
          <button
            type="button"
            onClick={() => setActiveTab('takhmeen-allocation')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'takhmeen-allocation'
                ? 'bg-amber-400 text-slate-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-amber-50'
            }`}
          >
            <Coins className="w-4 h-4 text-amber-900" />
            <span>2. Takhmeen Allocation & Ledger</span>
          </button>
        )}

        {canViewDues && (
          <button
            type="button"
            onClick={() => setActiveTab('fmb-dues')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'fmb-dues'
                ? 'bg-amber-400 text-slate-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-amber-50'
            }`}
          >
            <Receipt className="w-4 h-4 text-amber-900" />
            <span>3. Daily Collection & Dues</span>
          </button>
        )}
      </div>

      {/* ── Sub-Page Rendering with RBAC Enforcement ── */}
      {activeTab === 'thaali-status' && (
        <>
          {canViewThaali ? (
            <ThaaliStatusSubpage
              thaalis={thaalis}
              setThaalis={setThaalis}
              hofs={hofs}
              currentUser={currentUser}
              showToast={showToast}
              exportTrigger={exportTrigger}
            />
          ) : (
            <AccessDeniedBanner subpageName="Thaali Status Manager" />
          )}
        </>
      )}

      {activeTab === 'takhmeen-allocation' && (
        <>
          {canViewTakhmeen ? (
            <TakhmeenAllocationSubpage
              takhmeens={takhmeens}
              setTakhmeens={setTakhmeens}
              hofs={hofs}
              currentUser={currentUser}
              financialYear={financialYear}
              showToast={showToast}
              onNavigateToCollection={handleNavigateToCollection}
            />
          ) : (
            <AccessDeniedBanner subpageName="Takhmeen Allocation & Ledger" />
          )}
        </>
      )}

      {activeTab === 'fmb-dues' && (
        <>
          {canViewDues ? (
            <DailyCollectionSubpage
              takhmeens={takhmeens}
              setTakhmeens={setTakhmeens}
              collections={collections}
              setCollections={setCollections}
              hofs={hofs}
              currentUser={currentUser}
              financialYear={financialYear}
              showToast={showToast}
              preselectedIts={collectionTargetIts}
            />
          ) : (
            <AccessDeniedBanner subpageName="Daily Collection & Dues" />
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
