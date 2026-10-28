import React, { useState } from 'react';
import {
  Search,
  Plus,
  RefreshCw,
  Download,
  ShieldCheck,
  Lock,
  Edit,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Coins,
  Users,
  UtensilsCrossed,
  Calendar,
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
import { MadresaModule } from './madresa/MadresaModule';
import { MiqaatAsharaModule } from './miqaat-ashara/MiqaatAsharaModule';
import { CommitteeTrustModule } from './committee-trust/CommitteeTrustModule';
import { UmurFrameworkModule } from './umur-framework/UmurFrameworkModule';
import { SpecialCommunityModules } from './special-modules/SpecialCommunityModules';
import { SystemSettingsMasterModule } from './system-settings/SystemSettingsMasterModule';
import { FinancialYear, UserProfile } from '../types';
import { checkUserPermission, appendActivityLog } from '../utils/rbac';

interface MainContentProps {
  activeCategoryId: string;
  categoryTitle: string;
  activeSubItemId: string;
  subItemLabel: string;
  financialYear: FinancialYear;
  currentUser: UserProfile;
  onNavigateHome: () => void;
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
  onQuickAction,
  onUserDatabaseUpdated,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [addRecordTrigger, setAddRecordTrigger] = useState(0);

  // 1. RBAC Action Restrictions on current active sub-page
  const canAdd = checkUserPermission(currentUser, activeSubItemId, 'add');
  const canEdit = checkUserPermission(currentUser, activeSubItemId, 'edit');
  const canDelete = checkUserPermission(currentUser, activeSubItemId, 'delete');

  // Centralized Add, Edit, Delete Handlers with Central Activity Logging
  const handleAddNewRecord = () => {
    if (!canAdd) {
      onQuickAction(`Access Denied: You do not have [Add] permission for ${subItemLabel}`);
      return;
    }

    // When on Directory & Family HOF, open the Add HOF modal directly
    if (
      activeSubItemId === 'directory-hof' ||
      (activeCategoryId === 'member-master' && subItemLabel.toLowerCase().includes('directory'))
    ) {
      setAddRecordTrigger((prev) => prev + 1);
      window.dispatchEvent(new CustomEvent('jamat_open_create_hof'));
      return;
    }

    appendActivityLog(
      currentUser.username,
      categoryTitle,
      subItemLabel,
      'ADD',
      `Officer @${currentUser.username} initiated new record creation in [${subItemLabel}].`
    );
    onQuickAction(`New record created in ${subItemLabel}`);
  };

  const handleEditRecord = (recordTitle: string) => {
    if (!canEdit) {
      onQuickAction(`Access Denied: You do not have [Edit] permission for ${subItemLabel}`);
      return;
    }
    appendActivityLog(
      currentUser.username,
      categoryTitle,
      subItemLabel,
      'EDIT',
      `Officer @${currentUser.username} edited record "${recordTitle}" in [${subItemLabel}].`
    );
    onQuickAction(`Updated ${recordTitle} in ${subItemLabel}`);
  };

  const handleDeleteRecord = (recordTitle: string) => {
    if (!canDelete) {
      onQuickAction(`Access Denied: You do not have [Delete] permission for ${subItemLabel}`);
      return;
    }
    if (window.confirm(`Are you sure you want to delete "${recordTitle}" from ${subItemLabel}?`)) {
      appendActivityLog(
        currentUser.username,
        categoryTitle,
        subItemLabel,
        'DELETE',
        `Officer @${currentUser.username} deleted record "${recordTitle}" from [${subItemLabel}].`
      );
      onQuickAction(`Deleted ${recordTitle} from ${subItemLabel}`);
    }
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

          {/* Action CTAs with RBAC Enforcement */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onQuickAction('Data synchronized')}
              className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs focus:ring-2 focus:ring-[#EAB308]/30 min-h-[44px] cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
              <span>Sync</span>
            </button>

            <button
              type="button"
              onClick={() => {
                // Dispatch module-specific real export events; fall back to toast for others
                if (activeSubItemId === 'thaali-status') {
                  window.dispatchEvent(new CustomEvent('jamat_export_thaali_status'));
                } else {
                  onQuickAction(`Exported ${subItemLabel} summary`);
                }
              }}
              className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs focus:ring-2 focus:ring-[#EAB308]/30 min-h-[44px] cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Export</span>
            </button>

            {/* Granular "Add New" Button with RBAC Enforcement */}
            {canAdd ? (
              <button
                type="button"
                onClick={handleAddNewRecord}
                className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-black text-[#0F172A] bg-[#EAB308] hover:bg-[#D4AF37] active:bg-[#CA8A04] rounded-lg transition-all shadow-[0_2px_8px_rgba(234,179,8,0.35)] focus:ring-2 focus:ring-[#EAB308]/50 min-h-[44px] cursor-pointer"
              >
                <Plus className="w-4 h-4 text-[#0F172A] stroke-[2.8]" />
                <span>Create New Record</span>
              </button>
            ) : (
              <button
                type="button"
                disabled
                title="Janab Add Clearance Required"
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-bold text-slate-400 bg-slate-200/80 border border-slate-300/80 rounded-lg cursor-not-allowed opacity-80 min-h-[44px]"
              >
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Add Restricted</span>
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Route Content Views */}
        {renderContentSection({
          categoryId: activeCategoryId,
          subItemId: activeSubItemId,
          subItemLabel,
          categoryTitle,
          searchQuery,
          setSearchQuery,
          onQuickAction,
          currentUser,
          onUserDatabaseUpdated,
          canAdd,
          canEdit,
          canDelete,
          onEditRecord: handleEditRecord,
          onDeleteRecord: handleDeleteRecord,
          financialYear,
          openAddModalTrigger: addRecordTrigger,
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
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  onQuickAction: (actionName: string) => void;
  currentUser: UserProfile;
  onUserDatabaseUpdated?: () => void;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onEditRecord: (title: string) => void;
  onDeleteRecord: (title: string) => void;
  financialYear: FinancialYear;
  openAddModalTrigger?: number;
}

// Helper to render specialized contextual panels
function renderContentSection(ctx: RenderContext) {
  const {
    categoryId,
    subItemId,
    subItemLabel,
    onQuickAction,
    currentUser,
    onUserDatabaseUpdated,
    canAdd,
    canEdit,
    canDelete,
    onEditRecord,
    onDeleteRecord,
    financialYear,
    openAddModalTrigger,
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
        openAddModalTrigger={openAddModalTrigger}
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

  // 5g. Community Schemes (Taher, Mohammedii, Husain, Hoob, Corpus, Sarkari Lagat)
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

  // 6. Services (Hall Bookings, Ziyarat, Madrasa)
  if (categoryId === 'services' && subItemId === 'hall-booking') {
    return (
      <HallBookingModule
        currentUser={currentUser}
        subItemLabel={subItemLabel}
        financialYear={financialYear}
        showToast={onQuickAction}
      />
    );
  }

  if (categoryId === 'services') {
    return (
      <div className="bg-white border border-[#D97706]/30 rounded-xl p-4 sm:p-5 lg:p-6 shadow-md space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-[#0F172A] flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-amber-600" />
              <span>{subItemLabel} — Community Services</span>
            </h2>
            <p className="text-xs text-slate-500">
              Mawaid hall reservations, ziyarat convoy clearance tracking, and madrasa miqaat passes.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {[
            { event: 'Ziyarat Karbala Moalla Convoy Batch #4', date: '1447-04-12', status: 'Registration Open' },
            { event: 'Mawaid Hall Jaman — Mulla Taher Walima', date: '1447-03-24', status: 'Deposit Paid' },
            { event: 'MSB Annual Madrasa Miqaat Exams', date: '1447-05-01', status: 'Scheduled' },
          ].map((item, i) => (
            <div
              key={i}
              className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
            >
              <div>
                <span className="font-bold text-slate-900">{item.event}</span>
                <p className="text-slate-500 mt-0.5 font-mono">Date: {item.date}</p>
              </div>
              <div className="flex items-center space-x-3">
                <span className="px-2.5 py-1 rounded bg-amber-100 text-amber-900 font-bold text-[11px]">
                  {item.status}
                </span>

                <div className="flex items-center space-x-1">
                  {canEdit ? (
                    <button
                      type="button"
                      onClick={() => onEditRecord(item.event)}
                      className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-amber-100 rounded-md cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <span className="p-1.5 text-slate-300" title="Edit Restricted">
                      <Lock className="w-3.5 h-3.5" />
                    </span>
                  )}

                  {canDelete ? (
                    <button
                      type="button"
                      onClick={() => onDeleteRecord(item.event)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-100 rounded-md cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <span className="p-1.5 text-slate-300" title="Delete Restricted">
                      <Lock className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
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

  // 10. Special Community Modules (Safar, Haj, Mazar, Appointments & Messaging) (Part 4)
  if (
    categoryId === 'safar-mubarak' ||
    categoryId === 'haj-mazar' ||
    categoryId === 'appointment-messaging'
  ) {
    return (
      <SpecialCommunityModules
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
