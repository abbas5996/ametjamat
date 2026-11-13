import React, { useState, useEffect } from 'react';
import { Building2, Layers, LayoutDashboard, Sparkles } from 'lucide-react';
import { UserProfile, FinancialYear } from '../../types';
import { CommunitySchemeTabKey } from '../../utils/communitySchemes';
import { StandardSchemeWorkspace, StandardSchemeSubPage } from './StandardSchemeWorkspace';
import { HusainSchemeWorkspace, HusainSchemeSubPage } from './HusainSchemeWorkspace';
import { LegacySchemesView, LegacySchemeTab } from './LegacySchemesView';

interface Props {
  currentUser: UserProfile;
  activeSubItemId: string;
  subItemLabel: string;
  financialYear: FinancialYear;
  showToast: (m: string) => void;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

interface ResolvedRoute {
  schemeTab: CommunitySchemeTabKey;
  standardSubPage: StandardSchemeSubPage;
  husainSubPage: HusainSchemeSubPage;
  legacyTab: LegacySchemeTab;
}

const resolveRouteFromSubItem = (subItemId: string): ResolvedRoute => {
  switch (subItemId) {
    case 'taher-opening-balance':
      return { schemeTab: 'Taher Scheme', standardSubPage: 'opening-balance', husainSubPage: 'dashboard', legacyTab: 'scheme-takhmeen-master' };
    case 'taher-make-receipt':
      return { schemeTab: 'Taher Scheme', standardSubPage: 'make-receipt', husainSubPage: 'dashboard', legacyTab: 'scheme-takhmeen-master' };
    case 'taher-ledger-datewise':
      return { schemeTab: 'Taher Scheme', standardSubPage: 'ledger-datewise', husainSubPage: 'dashboard', legacyTab: 'scheme-takhmeen-master' };
    case 'taher-cancelled-receipts':
      return { schemeTab: 'Taher Scheme', standardSubPage: 'cancelled-receipts', husainSubPage: 'dashboard', legacyTab: 'scheme-takhmeen-master' };

    case 'mohammedi-opening-balance':
      return { schemeTab: 'Mohammedi Scheme', standardSubPage: 'opening-balance', husainSubPage: 'dashboard', legacyTab: 'scheme-takhmeen-master' };
    case 'mohammedi-make-receipt':
      return { schemeTab: 'Mohammedi Scheme', standardSubPage: 'make-receipt', husainSubPage: 'dashboard', legacyTab: 'scheme-takhmeen-master' };
    case 'mohammedi-ledger-datewise':
      return { schemeTab: 'Mohammedi Scheme', standardSubPage: 'ledger-datewise', husainSubPage: 'dashboard', legacyTab: 'scheme-takhmeen-master' };
    case 'mohammedi-cancelled-receipts':
      return { schemeTab: 'Mohammedi Scheme', standardSubPage: 'cancelled-receipts', husainSubPage: 'dashboard', legacyTab: 'scheme-takhmeen-master' };

    case 'husain-dashboard':
      return { schemeTab: 'Husain Scheme', standardSubPage: 'opening-balance', husainSubPage: 'dashboard', legacyTab: 'scheme-takhmeen-master' };
    case 'husain-datewise-report':
      return { schemeTab: 'Husain Scheme', standardSubPage: 'opening-balance', husainSubPage: 'datewise-report', legacyTab: 'scheme-takhmeen-master' };
    case 'husain-request-manager':
      return { schemeTab: 'Husain Scheme', standardSubPage: 'opening-balance', husainSubPage: 'request-manager', legacyTab: 'scheme-takhmeen-master' };
    case 'husain-ledger-report':
      return { schemeTab: 'Husain Scheme', standardSubPage: 'opening-balance', husainSubPage: 'ledger-report', legacyTab: 'scheme-takhmeen-master' };
    case 'husain-withdrawals':
      return { schemeTab: 'Husain Scheme', standardSubPage: 'opening-balance', husainSubPage: 'withdrawals', legacyTab: 'scheme-takhmeen-master' };
    case 'husain-maturing':
      return { schemeTab: 'Husain Scheme', standardSubPage: 'opening-balance', husainSubPage: 'maturing-tracking', legacyTab: 'scheme-takhmeen-master' };
    case 'husain-cancelled':
      return { schemeTab: 'Husain Scheme', standardSubPage: 'opening-balance', husainSubPage: 'cancelled-receipts', legacyTab: 'scheme-takhmeen-master' };
    case 'husain-hide-account':
      return { schemeTab: 'Husain Scheme', standardSubPage: 'opening-balance', husainSubPage: 'hide-account', legacyTab: 'scheme-takhmeen-master' };

    case 'scheme-takhmeen-master':
    case 'scheme-payment-entry':
    case 'scheme-category-master':
    case 'scheme-outstanding-report':
    case 'scheme-ledger-report':
    case 'scheme-cancelled-receipts':
      return { schemeTab: 'Other Schemes', standardSubPage: 'opening-balance', husainSubPage: 'dashboard', legacyTab: subItemId };

    default:
      return { schemeTab: 'Taher Scheme', standardSubPage: 'opening-balance', husainSubPage: 'dashboard', legacyTab: 'scheme-takhmeen-master' };
  }
};

const SCHEME_TABS: { key: CommunitySchemeTabKey; label: string; tag: string; icon: React.ReactNode }[] = [
  { key: 'Taher Scheme', label: 'Taher Scheme', tag: '4 Core Pages', icon: <Layers className="w-3.5 h-3.5" /> },
  { key: 'Mohammedi Scheme', label: 'Mohammedi Scheme', tag: '4 Core Pages', icon: <Layers className="w-3.5 h-3.5" /> },
  { key: 'Husain Scheme', label: 'Husain Scheme', tag: 'Dashboard + 7 Ops', icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
  { key: 'Other Schemes', label: 'Hoob / Corpus / Lagat', tag: 'Endowments', icon: <Sparkles className="w-3.5 h-3.5" /> },
];

export const CommunitySchemesModule: React.FC<Props> = ({
  currentUser,
  activeSubItemId,
  financialYear,
  showToast,
  canAdd,
  canEdit,
  canDelete,
}) => {
  const initial = resolveRouteFromSubItem(activeSubItemId);
  const [activeScheme, setActiveScheme] = useState<CommunitySchemeTabKey>(initial.schemeTab);
  const [standardSubPage, setStandardSubPage] = useState<StandardSchemeSubPage>(initial.standardSubPage);
  const [husainSubPage, setHusainSubPage] = useState<HusainSchemeSubPage>(initial.husainSubPage);
  const [legacyTab, setLegacyTab] = useState<LegacySchemeTab>(initial.legacyTab);

  useEffect(() => {
    const resolved = resolveRouteFromSubItem(activeSubItemId);
    setActiveScheme(resolved.schemeTab);
    if (resolved.schemeTab === 'Taher Scheme' || resolved.schemeTab === 'Mohammedi Scheme') {
      setStandardSubPage(resolved.standardSubPage);
    } else if (resolved.schemeTab === 'Husain Scheme') {
      setHusainSubPage(resolved.husainSubPage);
    } else {
      setLegacyTab(resolved.legacyTab);
    }
  }, [activeSubItemId]);

  return (
    <div className="space-y-5">
      {/* Top Banner & Primary Scheme Switcher */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 rounded-2xl p-5 sm:p-6 text-white shadow-lg border border-amber-400/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="p-2 bg-amber-400/15 rounded-xl text-amber-300 border border-amber-400/30">
                <Building2 className="w-5 h-5" />
              </span>
              <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-amber-400/20 text-amber-200 border border-amber-400/30">
                DAWOODI BOHRA JAMAAT TRUST, BURHANIPARK VATWA
              </span>
              <span className="text-xs text-slate-300 font-mono">Hijri {financialYear}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-2">
              Community Schemes Management
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Modular administration for Taher Scheme, Mohammedi Scheme, and Husain Scheme with official Trust Receipt printing, ledger audits, and maturity tracking.
            </p>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-white/10">
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-200/80 mb-2">
            Select Community Scheme Module:
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {SCHEME_TABS.map((tab) => {
              const selected = activeScheme === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveScheme(tab.key)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2 transition-all cursor-pointer ${
                    selected
                      ? 'bg-amber-400 text-slate-950 shadow-md'
                      : 'bg-white/10 hover:bg-white/15 text-slate-100 border border-white/10'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  <span
                    className={`px-2 py-0.2 rounded-full text-[10px] font-extrabold ${
                      selected ? 'bg-slate-900 text-amber-300' : 'bg-white/10 text-amber-200'
                    }`}
                  >
                    {tab.tag}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Active Scheme Workspace */}
      {(activeScheme === 'Taher Scheme' || activeScheme === 'Mohammedi Scheme') && (
        <StandardSchemeWorkspace
          key={activeScheme}
          schemeName={activeScheme}
          activeSubPage={standardSubPage}
          onSubPageChange={setStandardSubPage}
          currentUser={currentUser}
          financialYear={financialYear}
          showToast={showToast}
          canAdd={canAdd}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      )}

      {activeScheme === 'Husain Scheme' && (
        <HusainSchemeWorkspace
          activeSubPage={husainSubPage}
          onSubPageChange={setHusainSubPage}
          currentUser={currentUser}
          financialYear={financialYear}
          showToast={showToast}
          canAdd={canAdd}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      )}

      {activeScheme === 'Other Schemes' && (
        <LegacySchemesView
          initialTab={legacyTab}
          currentUser={currentUser}
          financialYear={financialYear}
          showToast={showToast}
          canAdd={canAdd}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      )}
    </div>
  );
};
