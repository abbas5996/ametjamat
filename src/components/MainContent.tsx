import React, { useState } from 'react';
import {
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { Breadcrumb } from './Breadcrumb';
import { MainOverviewDashboard } from './dashboard/MainOverviewDashboard';
import { FaizDashboard } from './dashboard/FaizDashboard';
import { RolesPermissionsModule } from './RolesPermissionsModule';
import { ChangePasswordPage } from './ChangePasswordPage';
import { MemberMasterModule } from './member-master/MemberMasterModule';
import { MohallaManagementModule } from './member-master/MohallaManagementModule';
import { MumineenModule } from './mumineen/MumineenModule';
import { FmbTakhmeenModule } from './fmb-takhmeen/FmbTakhmeenModule';
import { SabeelManagementModuleV2 } from './sabeel-management/SabeelManagementModuleV2';
import { HolidayManagementModule } from './HolidayManagementModule';
import { HallBookingModule } from './hall-booking/HallBookingModule';
import { ExecutiveReportsModule } from './executive-reports/ExecutiveReportsModule';
import { FaizHubModule } from './faiz-hub/FaizHubModule';
import { ThaaliSystemModule } from './thaali-system/ThaaliSystemModule';
import { MenuManagementModule } from './menu-management/MenuManagementModule';
import { StockManagementModule } from './stock-management/StockManagementModule';
import { VoluntaryContributionModule } from './voluntary-contributions/VoluntaryContributionModule';
import { CommunitySchemesModule } from './community-schemes/CommunitySchemesModule';
import { WajebaatModule } from './wajebaat/WajebaatModule';
import { RentManagementModule } from './rent-management/RentManagementModule';
import { QardanHasanahModule } from './qardan-hasanah/QardanHasanahModule';
import { AccountsManagerModule } from './accounts-manager/AccountsManagerModule';
import { BudgetModule } from './budget/BudgetModule';
import { MadresaModule } from './madresa/MadresaModule';
import { MiqaatAsharaModule } from './miqaat-ashara/MiqaatAsharaModule';
import { CommitteeTrustModule } from './committee-trust/CommitteeTrustModule';
import { UmurFrameworkModule } from './umur-framework/UmurFrameworkModule';
import { SpecialCommunityModules } from './special-modules/SpecialCommunityModules';
import { AppointmentsMessagingModule } from './appointments-messaging/AppointmentsMessagingModule';
import { SystemSettingsMasterModule } from './system-settings/SystemSettingsMasterModule';
import { MobileAppConfigModule } from './system-settings/MobileAppConfigModule';
import { SmsMessagingSettingsModule } from './system-settings/SmsMessagingSettingsModule';
import { FinancialYear, UserProfile } from '../types';
import { checkUserPermission } from '../utils/rbac';

interface MainContentProps {
  activeCategoryId: string;
  categoryTitle: string;
  activeSubItemId: string;
  subItemLabel: string;
  financialYear: FinancialYear;
  currentUser: UserProfile;
  onNavigateHome: () => void;
  onNavigateToModule?: (categoryId: string, subItemId: string) => void;
  onQuickAction: (actionName: string) => void;
  onUserDatabaseUpdated?: () => void;
}

export const MainContent: React.FC<MainContentProps> = ({
  activeCategoryId,
  categoryTitle,
  activeSubItemId,
  subItemLabel,
  financialYear,
  currentUser,
  onNavigateHome,
  onNavigateToModule,
  onQuickAction,
  onUserDatabaseUpdated,
}) => {
  const [isSyncing, setIsSyncing] = useState(false);

  // 1. RBAC Action Restrictions on current active sub-page
  const canAdd = checkUserPermission(currentUser, activeSubItemId, 'add');
  const canEdit = checkUserPermission(currentUser, activeSubItemId, 'edit');
  const canDelete = checkUserPermission(currentUser, activeSubItemId, 'delete');

  const handleGlobalSync = () => {
    setIsSyncing(true);
    window.dispatchEvent(new Event('jamat_fmb_updated'));
    window.dispatchEvent(new Event('jamat_erp_sync'));
    setTimeout(() => {
      setIsSyncing(false);
      onQuickAction(`${subItemLabel} synchronized with live local ledger.`);
    }, 250);
  };

  return (
    <main className="flex-1 min-w-0 bg-[#FEF3C7] overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Breadcrumbs */}
        <Breadcrumb
          categoryTitle={categoryTitle}
          subItemLabel={subItemLabel}
          financialYear={financialYear}
          onNavigateHome={onNavigateHome}
        />

        {/* Dynamic Header & Actions Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-[#0F172A] tracking-tight flex flex-wrap items-center gap-2">
              <span className="truncate">{subItemLabel}</span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A] shrink-0">
                {categoryTitle}
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Burhani Park Jamaat Administrative Record Management & Ledger System
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleGlobalSync}
              disabled={isSyncing}
              className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs focus:ring-2 focus:ring-[#EAB308]/30 min-h-[44px] cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Data'}</span>
            </button>
          </div>
        </div>

        {/* Dynamic Route Content Views */}
        {renderContentSection({
          categoryId: activeCategoryId,
          subItemId: activeSubItemId,
          subItemLabel,
          categoryTitle,
          onQuickAction,
          onNavigateToModule,
          currentUser,
          onUserDatabaseUpdated,
          canAdd,
          canEdit,
          canDelete,
          financialYear,
        })}
      </div>
    </main>
  );
};

interface RenderContext {
  categoryId: string;
  subItemId: string;
  subItemLabel: string;
  categoryTitle: string;
  onQuickAction: (actionName: string) => void;
  onNavigateToModule?: (categoryId: string, subItemId: string) => void;
  currentUser: UserProfile;
  onUserDatabaseUpdated?: () => void;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
  financialYear: FinancialYear;
}

// Helper to render specialized contextual panels
function renderContentSection(ctx: RenderContext) {
  const {
    categoryId,
    subItemId,
    subItemLabel,
    onQuickAction,
    onNavigateToModule,
    currentUser,
    onUserDatabaseUpdated,
    canAdd,
    canEdit,
    canDelete,
    financialYear,
  } = ctx;

  // 1. Roles & Permissions RBAC Module
  if (subItemId === 'roles-permissions') {
    return (
      <RolesPermissionsModule
        currentUser={currentUser}
        onUserDatabaseUpdated={onUserDatabaseUpdated}
        showToast={onQuickAction}
      />
    );
  }

  // 1b. Change Password (System Settings)
  if (subItemId === 'change-password') {
    return (
      <ChangePasswordPage
        currentUser={currentUser}
        showToast={onQuickAction}
      />
    );
  }

  // 1c. Add Holiday / Weekend Manager (System Settings)
  if (subItemId === 'add-holiday') {
    return (
      <HolidayManagementModule
        currentUser={currentUser}
        activeSubItemId={subItemId}
        showToast={onQuickAction}
      />
    );
  }

  // 1d. Mobile App Configuration / Link Page (System Settings)
  if (subItemId === 'mobile-app-config') {
    return (
      <MobileAppConfigModule
        currentUser={currentUser}
        financialYear={financialYear}
        showToast={onQuickAction}
        canEdit={canEdit}
      />
    );
  }

  // 1e. SMS & Messaging Service Settings (System Settings)
  if (subItemId === 'sms-messaging-settings') {
    return (
      <SmsMessagingSettingsModule
        currentUser={currentUser}
        financialYear={financialYear}
        showToast={onQuickAction}
        canAdd={canAdd}
        canEdit={canEdit}
        canDelete={canDelete}
      />
    );
  }

  // 2. Dashboard Section (Main Overview & Faiz Live Command Center)
  if (categoryId === 'dashboard') {
    if (subItemId === 'faiz-dashboard') {
      return (
        <FaizDashboard
          financialYear={financialYear}
          currentUser={currentUser}
          onQuickAction={onQuickAction}
        />
      );
    }
    return (
      <MainOverviewDashboard
        financialYear={financialYear}
        currentUser={currentUser}
        onQuickAction={onQuickAction}
        onNavigateToModule={onNavigateToModule}
      />
    );
  }

  // 3a. Mumineen Master Module (All 13 Sub-Pages)
  if (categoryId === 'mumineen') {
    return (
      <MumineenModule
        currentUser={currentUser}
        activeSubItemId={subItemId}
        subItemLabel={subItemLabel}
        financialYear={financialYear}
        showToast={onQuickAction}
        canAdd={canAdd}
        canEdit={canEdit}
        canDelete={canDelete}
      />
    );
  }

  // 3. Member & Area Master
  if (categoryId === 'member-master') {
    return (
      <MemberMasterModule
        currentUser={currentUser}
        activeSubItemId={subItemId}
        subItemLabel={subItemLabel}
        showToast={onQuickAction}
      />
    );
  }

  // 3b. Mohalla Management
  if (categoryId === 'mohalla-management') {
    return (
      <MohallaManagementModule
        currentUser={currentUser}
        activeSubItemId={subItemId}
        showToast={onQuickAction}
        canAdd={canAdd}
        canEdit={canEdit}
        canDelete={canDelete}
      />
    );
  }

  // 4. FMB & Takhmeen
  if (categoryId === 'fmb-takhmeen') {
    return (
      <FmbTakhmeenModule
        currentUser={currentUser}
        activeSubItemId={subItemId}
        subItemLabel={subItemLabel}
        financialYear={financialYear}
        showToast={onQuickAction}
      />
    );
  }

  // 5. Sabeel Management (Complete 7 Sub-Pages V2)
  if (categoryId === 'sabeel-management') {
    return (
      <SabeelManagementModuleV2
        currentUser={currentUser}
        activeSubItemId={subItemId}
        subItemLabel={subItemLabel}
        financialYear={financialYear}
        showToast={onQuickAction}
      />
    );
  }

  // 5b. Faiz Module (FMB) — 8 Sub-Pages
  if (categoryId === 'faiz-hub') {
    return (
      <FaizHubModule
        currentUser={currentUser}
        activeSubItemId={subItemId}
        subItemLabel={subItemLabel}
        financialYear={financialYear}
        showToast={onQuickAction}
        canAdd={canAdd}
        canEdit={canEdit}
        canDelete={canDelete}
      />
    );
  }

  // 5c. Thaali Management System (FMB) — 9 Sub-Pages
  if (categoryId === 'thaali-management') {
    return (
      <ThaaliSystemModule
        currentUser={currentUser}
        activeSubItemId={subItemId}
        subItemLabel={subItemLabel}
        financialYear={financialYear}
        showToast={onQuickAction}
        canAdd={canAdd}
        canEdit={canEdit}
        canDelete={canDelete}
      />
    );
  }

  // 5d. Menu Management — 7 Sub-Pages
  if (categoryId === 'menu-management') {
    return (
      <MenuManagementModule
        currentUser={currentUser}
        activeSubItemId={subItemId}
        financialYear={financialYear}
        showToast={onQuickAction}
        canAdd={canAdd}
        canEdit={canEdit}
        canDelete={canDelete}
      />
    );
  }

  // 5e. Stock Management — 7 Sub-Pages
  if (categoryId === 'stock-management') {
    return (
      <StockManagementModule
        currentUser={currentUser}
        activeSubItemId={subItemId}
        financialYear={financialYear}
        showToast={onQuickAction}
        canAdd={canAdd}
        canEdit={canEdit}
        canDelete={canDelete}
      />
    );
  }

  // 5f. Voluntary Contribution (Hadiyah / Sadaqah / Niyaz)
  if (categoryId === 'voluntary-contribution') {
    return (
      <VoluntaryContributionModule
        currentUser={currentUser}
        activeSubItemId={subItemId}
        subItemLabel={subItemLabel}
        financialYear={financialYear}
        showToast={onQuickAction}
        canAdd={canAdd}
        canEdit={canEdit}
        canDelete={canDelete}
      />
    );
  }

  // 5g. Community Schemes (Taher, Mohammedi, Husain, Hoob, Corpus, Sarkari Lagat)
  if (categoryId === 'community-schemes') {
    return (
      <CommunitySchemesModule
        currentUser={currentUser}
        activeSubItemId={subItemId}
        subItemLabel={subItemLabel}
        financialYear={financialYear}
        showToast={onQuickAction}
        canAdd={canAdd}
        canEdit={canEdit}
        canDelete={canDelete}
      />
    );
  }

  // 5h. Wajebaat Management (Khums / Zakat / Fitrah)
  if (categoryId === 'wajebaat') {
    return (
      <WajebaatModule
        currentUser={currentUser}
        activeSubItemId={subItemId}
        subItemLabel={subItemLabel}
        financialYear={financialYear}
        showToast={onQuickAction}
        canAdd={canAdd}
        canEdit={canEdit}
        canDelete={canDelete}
      />
    );
  }

  // 5i. Rent Management (Jamaat Estate & Leases)
  if (categoryId === 'rent-management') {
    return (
      <RentManagementModule
        currentUser={currentUser}
        activeSubItemId={subItemId}
        subItemLabel={subItemLabel}
        financialYear={financialYear}
        showToast={onQuickAction}
        canAdd={canAdd}
        canEdit={canEdit}
        canDelete={canDelete}
      />
    );
  }

  // 5j. Qardan Hasanah (Qard-e-Hasana Loan Trust)
  if (categoryId === 'qardan-hasanah') {
    return (
      <QardanHasanahModule
        currentUser={currentUser}
        activeSubItemId={subItemId}
        subItemLabel={subItemLabel}
        financialYear={financialYear}
        showToast={onQuickAction}
        canAdd={canAdd}
        canEdit={canEdit}
        canDelete={canDelete}
      />
    );
  }

  // 5k-budget. Budget Module
  if (subItemId === 'accounts-budget') {
    return (
      <BudgetModule
        currentUser={currentUser}
        financialYear={financialYear}
        showToast={onQuickAction}
        canAdd={canAdd}
        canEdit={canEdit}
        canDelete={canDelete}
      />
    );
  }

  // 5k. Accounts Manager (Double-Entry Financial Accounting)
  if (categoryId === 'accounts-manager') {
    return (
      <AccountsManagerModule
        currentUser={currentUser}
        activeSubItemId={subItemId}
        subItemLabel={subItemLabel}
        financialYear={financialYear}
        showToast={onQuickAction}
        canAdd={canAdd}
        canEdit={canEdit}
        canDelete={canDelete}
      />
    );
  }

  // 5l. Madresa Module (Al-Madrasa al-Saifiyah)
  if (categoryId === 'madresa-module') {
    return (
      <MadresaModule
        currentUser={currentUser}
        activeSubItemId={subItemId}
        subItemLabel={subItemLabel}
        financialYear={financialYear}
        showToast={onQuickAction}
        canAdd={canAdd}
        canEdit={canEdit}
        canDelete={canDelete}
      />
    );
  }

  // 5m. Miqaat Management & Ashara Ohbat
  if (categoryId === 'miqaat-ashara') {
    return (
      <MiqaatAsharaModule
        currentUser={currentUser}
        activeSubItemId={subItemId}
        subItemLabel={subItemLabel}
        financialYear={financialYear}
        showToast={onQuickAction}
        canAdd={canAdd}
        canEdit={canEdit}
        canDelete={canDelete}
      />
    );
  }

  // 6. Services / Hall & Facility Booking
  if (categoryId === 'services') {
    return (
      <HallBookingModule
        currentUser={currentUser}
        activeSubItemId={subItemId}
        subItemLabel={subItemLabel}
        financialYear={financialYear}
        showToast={onQuickAction}
      />
    );
  }

  // 7. Payments & Receipts Engine — Executive Reports Module
  if (categoryId === 'payments-receipts') {
    return (
      <ExecutiveReportsModule
        currentUser={currentUser}
        subItemLabel={subItemLabel}
        subItemId={subItemId}
        financialYear={financialYear}
        showToast={(msg) => onQuickAction(msg)}
      />
    );
  }

  // 8. Committee & Trust Management (Part 4)
  if (categoryId === 'committee-trust') {
    return (
      <CommitteeTrustModule
        currentUser={currentUser}
        activeSubItemId={subItemId}
        subItemLabel={subItemLabel}
        financialYear={financialYear}
        showToast={onQuickAction}
        canAdd={canAdd}
        canEdit={canEdit}
        canDelete={canDelete}
      />
    );
  }

  // 9. 12 Umur Departmental Executive Framework (Part 4)
  if (categoryId === 'umur-framework') {
    return (
      <UmurFrameworkModule
        currentUser={currentUser}
        activeSubItemId={subItemId}
        subItemLabel={subItemLabel}
        financialYear={financialYear}
        showToast={onQuickAction}
        canAdd={canAdd}
        canEdit={canEdit}
        canDelete={canDelete}
      />
    );
  }

  // 10a. Appointments & Messaging (Dedicated Module)
  if (categoryId === 'appointment-messaging') {
    return (
      <AppointmentsMessagingModule
        currentUser={currentUser}
        activeSubItemId={subItemId}
        showToast={onQuickAction}
        canAdd={canAdd}
        canEdit={canEdit}
        canDelete={canDelete}
      />
    );
  }

  // 10b. Special Community Modules (Safar Mubarak & Haj/Mazar)
  if (categoryId === 'safar-mubarak' || categoryId === 'haj-mazar') {
    return (
      <SpecialCommunityModules
        currentUser={currentUser}
        categoryId={categoryId}
        activeSubItemId={subItemId}
        subItemLabel={subItemLabel}
        financialYear={financialYear}
        showToast={onQuickAction}
        canAdd={canAdd}
        canEdit={canEdit}
        canDelete={canDelete}
      />
    );
  }

  // 11. System Settings & Activity Logs Master (Part 4)
  if (categoryId === 'system-settings') {
    return (
      <SystemSettingsMasterModule
        currentUser={currentUser}
        activeSubItemId={subItemId}
        financialYear={financialYear}
        showToast={onQuickAction}
        canAdd={canAdd}
        canEdit={canEdit}
        canDelete={canDelete}
      />
    );
  }

  // Fallback module state
  return (
    <div className="bg-white border border-[#D97706]/30 rounded-xl p-6 shadow-md space-y-4">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-base font-bold text-[#0F172A]">{subItemLabel}</h2>
        <p className="text-xs text-slate-500">Administrative sub-system operational view</p>
      </div>
      <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-lg">
        <ShieldCheck className="w-10 h-10 text-[#EAB308] mx-auto mb-3" />
        <p className="text-sm font-semibold text-slate-800">Module Initialized: {subItemLabel}</p>
        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
          Permission verified. Active session authorized for @{currentUser.username}.
        </p>
      </div>
    </div>
  );
}
