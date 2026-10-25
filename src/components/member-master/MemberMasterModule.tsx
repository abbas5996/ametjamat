import React, { useState, useEffect } from 'react';
import {
  Users,
  MapPin,
  UserCheck,
  ShieldAlert,
  Lock,
} from 'lucide-react';
import { HeadOfFamily, Mohallah, UserProfile } from '../../types';
import {
  getStoredHofs,
  getStoredMohallahs,
} from '../../utils/memberMaster';
import { checkUserPermission } from '../../utils/rbac';
import { DirectoryHofSubpage } from './DirectoryHofSubpage';
import { MohallahMappingSubpage } from './MohallahMappingSubpage';
import { ItsProfileUpdaterSubpage } from './ItsProfileUpdaterSubpage';

interface MemberMasterModuleProps {
  currentUser: UserProfile;
  activeSubItemId: string;
  subItemLabel: string;
  showToast: (msg: string) => void;
  openAddModalTrigger?: number;
}

export const MemberMasterModule: React.FC<MemberMasterModuleProps> = ({
  currentUser,
  activeSubItemId,
  subItemLabel,
  showToast,
  openAddModalTrigger,
}) => {
  // Shared state across the 3 sub-pages, persisted in localStorage
  const [hofs, setHofs] = useState<HeadOfFamily[]>(() => getStoredHofs());
  const [mohallahs, setMohallahs] = useState<Mohallah[]>(() => getStoredMohallahs());

  // Local active tab allows seamless in-module tab switching as well as syncing with sidebar navigation
  const [activeTab, setActiveTab] = useState<'directory-hof' | 'area-mapping' | 'its-updater'>(
    (activeSubItemId as any) || 'directory-hof'
  );

  // Deep-link state when jumping to ITS updater with a specific ITS
  const [updaterTargetIts, setUpdaterTargetIts] = useState<string | undefined>(undefined);

  // If header trigger clicked, ensure Directory tab is active
  useEffect(() => {
    if (openAddModalTrigger && openAddModalTrigger > 0) {
      setActiveTab('directory-hof');
    }
  }, [openAddModalTrigger]);

  // Sync tab whenever sidebar navigation changes
  useEffect(() => {
    if (
      activeSubItemId === 'directory-hof' ||
      activeSubItemId === 'area-mapping' ||
      activeSubItemId === 'its-updater'
    ) {
      setActiveTab(activeSubItemId);
    }
  }, [activeSubItemId]);

  // Navigate to ITS Updater from other subpages
  const handleNavigateToUpdater = (itsNumber: string) => {
    setUpdaterTargetIts(itsNumber);
    setActiveTab('its-updater');
  };

  // Granular RBAC Permissions for the current active sub-page
  const canViewDirectory = checkUserPermission(currentUser, 'directory-hof', 'view');
  const canAddDirectory = checkUserPermission(currentUser, 'directory-hof', 'add');
  const canEditDirectory = checkUserPermission(currentUser, 'directory-hof', 'edit');
  const canDeleteDirectory = checkUserPermission(currentUser, 'directory-hof', 'delete');

  const canViewMapping = checkUserPermission(currentUser, 'area-mapping', 'view');
  const canAddMapping = checkUserPermission(currentUser, 'area-mapping', 'add');
  const canEditMapping = checkUserPermission(currentUser, 'area-mapping', 'edit');
  const canDeleteMapping = checkUserPermission(currentUser, 'area-mapping', 'delete');

  const canViewUpdater = checkUserPermission(currentUser, 'its-updater', 'view');
  const canAddUpdater = checkUserPermission(currentUser, 'its-updater', 'add');
  const canEditUpdater = checkUserPermission(currentUser, 'its-updater', 'edit');
  const canDeleteUpdater = checkUserPermission(currentUser, 'its-updater', 'delete');

  return (
    <div className="space-y-5">
      {/* Sub-Page Navigation Tabs */}
      <div className="bg-white border border-amber-300/40 rounded-xl p-1.5 shadow-xs flex items-center gap-1.5 overflow-x-auto">
        {canViewDirectory && (
          <button
            type="button"
            onClick={() => setActiveTab('directory-hof')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'directory-hof'
                ? 'bg-amber-400 text-slate-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-amber-50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>1. Directory & Family HOF</span>
          </button>
        )}

        {canViewMapping && (
          <button
            type="button"
            onClick={() => setActiveTab('area-mapping')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'area-mapping'
                ? 'bg-amber-400 text-slate-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-amber-50'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>2. Mohallah Area Mapping</span>
          </button>
        )}

        {canViewUpdater && (
          <button
            type="button"
            onClick={() => setActiveTab('its-updater')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'its-updater'
                ? 'bg-amber-400 text-slate-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-amber-50'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>3. ITS Profile Updater</span>
          </button>
        )}
      </div>

      {/* Render Active Sub-Page with Granular RBAC */}
      {activeTab === 'directory-hof' && (
        canViewDirectory ? (
          <DirectoryHofSubpage
            currentUser={currentUser}
            hofs={hofs}
            setHofs={setHofs}
            mohallahs={mohallahs}
            canAdd={canAddDirectory}
            canEdit={canEditDirectory}
            canDelete={canDeleteDirectory}
            showToast={showToast}
            onNavigateToUpdater={handleNavigateToUpdater}
            openAddModalTrigger={openAddModalTrigger}
          />
        ) : (
          <AccessDeniedNotice subpage="Directory & Family HOF" currentUser={currentUser} />
        )
      )}

      {activeTab === 'area-mapping' && (
        canViewMapping ? (
          <MohallahMappingSubpage
            currentUser={currentUser}
            mohallahs={mohallahs}
            setMohallahs={setMohallahs}
            hofs={hofs}
            setHofs={setHofs}
            canAdd={canAddMapping}
            canEdit={canEditMapping}
            canDelete={canDeleteMapping}
            showToast={showToast}
            onNavigateToUpdater={handleNavigateToUpdater}
          />
        ) : (
          <AccessDeniedNotice subpage="Mohallah Area Mapping" currentUser={currentUser} />
        )
      )}

      {activeTab === 'its-updater' && (
        canViewUpdater ? (
          <ItsProfileUpdaterSubpage
            currentUser={currentUser}
            hofs={hofs}
            setHofs={setHofs}
            mohallahs={mohallahs}
            canEdit={canEditUpdater}
            showToast={showToast}
            targetItsProp={updaterTargetIts}
          />
        ) : (
          <AccessDeniedNotice subpage="ITS Profile Updater" currentUser={currentUser} />
        )
      )}
    </div>
  );
};

const AccessDeniedNotice: React.FC<{ subpage: string; currentUser: UserProfile }> = ({
  subpage,
  currentUser,
}) => (
  <div className="bg-white border border-rose-200 rounded-xl p-8 text-center max-w-lg mx-auto space-y-3">
    <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto border border-rose-200">
      <Lock className="w-6 h-6" />
    </div>
    <h3 className="font-bold text-slate-900 text-base">Access Restricted</h3>
    <p className="text-xs text-slate-600">
      You do not have <span className="font-bold text-slate-800">[View]</span> permission for{' '}
      <strong>{subpage}</strong>. Please contact Janab Amil Saheb (Super Admin) for clearance.
    </p>
    <p className="text-[11px] text-slate-400">
      User: @{currentUser.username} • Role: {currentUser.role}
    </p>
  </div>
);
