import {
  NavCategory,
  UserProfile,
  SubModuleAction,
  SubModulePermissions,
  UserPermissionsMap,
  ManagedUser,
  ActivityLogEntry,
} from '../types';

export interface SubModuleDefinition {
  id: string;
  name: string;
  description: string;
}

export interface DepartmentDefinition {
  id: string;
  name: string;
  categoryIcon: string;
  subModules: SubModuleDefinition[];
}

export const RBAC_DEPARTMENTS: DepartmentDefinition[] = [
  {
    id: 'member-master',
    name: 'Member & Area Master',
    categoryIcon: 'Users',
    subModules: [
      {
        id: 'directory-hof',
        name: 'Directory & Family HOF',
        description: 'Mumineen central directory, HOF records, and family relations.',
      },
      {
        id: 'area-mapping',
        name: 'Mohallah Area Mapping',
        description: 'Sector boundaries, buildings, flat numbers, and area allocation.',
      },
      {
        id: 'its-updater',
        name: 'ITS Profile Updater',
        description: 'ITS verification, biometric photo records, and phone/email sync.',
      },
    ],
  },
  {
    id: 'fmb-takhmeen',
    name: 'FMB & Takhmeen',
    categoryIcon: 'UtensilsCrossed',
    subModules: [
      {
        id: 'thaali-status',
        name: 'Thaali Status Manager',
        description: 'Daily dispatch, active delivery routes, and safar pause requests.',
      },
      {
        id: 'takhmeen-allocation',
        name: 'Takhmeen Allocation',
        description: 'Annual FMB takhmeen tiers, hub breakdown, and pledge revisions.',
      },
      {
        id: 'fmb-dues',
        name: 'Daily Collection & Dues',
        description: 'Daily Thaali collections, outstanding dues, and waiver records.',
      },
    ],
  },
  {
    id: 'sabeel-management',
    name: 'Sabeel Management',
    categoryIcon: 'Coins',
    subModules: [
      {
        id: 'sabeel-ledger',
        name: 'Sabeel Master Ledger',
        description: 'Master accounts, sabeel numbers, head of accounts, and opening dues.',
      },
      {
        id: 'sabeel-collection',
        name: 'Sabeel Takhmeen & Collection',
        description: 'Monthly sabeel receipts, automated reminders, and counter collection.',
      },
      {
        id: 'sabeel-history',
        name: 'Transfer & History',
        description: 'Transfer of sabeels, ownership changes, and historical archive.',
      },
    ],
  },
  {
    id: 'services',
    name: 'Services',
    categoryIcon: 'Calendar',
    subModules: [
      {
        id: 'hall-booking',
        name: 'Hall Bookings',
        description: 'Mawaid halls reservation, jaman slots, and deposit collection.',
      },
      {
        id: 'ziyarat-tracking',
        name: 'Ziyarat Tracking (Karbala / Hajj / Umrah / Kalyako)',
        description: 'Ziyarat convoy schedules, travel clearances, and registration.',
      },
      {
        id: 'miqaat-madrasa',
        name: 'Madrasa & Miqaat Registrations',
        description: 'Al-Madrasa al-Saifiyah admissions, attendance, and miqaat passes.',
      },
    ],
  },
  {
    id: 'payments-receipts',
    name: 'Payments & Receipts Engine',
    categoryIcon: 'Receipt',
    subModules: [
      {
        id: 'counter-payment',
        name: 'Counter Payment Entry',
        description: 'Real-time cash, card, UPI, and bank counter payment collections.',
      },
      {
        id: 'receipts-history',
        name: 'Receipts History & PDF Print',
        description: 'Query historical receipts, generate print-ready duplicate receipts.',
      },
      {
        id: 'refund-ledger',
        name: 'Refund / Reversal Ledger',
        description: 'Payment reversals, cancellations, and official refund approvals.',
      },
    ],
  },
];

// All 15 sub-module IDs
export const ALL_SUBMODULE_IDS = RBAC_DEPARTMENTS.flatMap((dept) =>
  dept.subModules.map((sm) => sm.id)
);

/**
 * Creates empty permissions where every action is false
 */
export const createDefaultPermissions = (): UserPermissionsMap => {
  const map: UserPermissionsMap = {};
  ALL_SUBMODULE_IDS.forEach((id) => {
    map[id] = { view: false, add: false, edit: false, delete: false };
  });
  return map;
};

/**
 * Creates full master permissions (all true)
 */
export const createFullPermissions = (): UserPermissionsMap => {
  const map: UserPermissionsMap = {};
  ALL_SUBMODULE_IDS.forEach((id) => {
    map[id] = { view: true, add: true, edit: true, delete: true };
  });
  return map;
};

/**
 * Enforces rule:
 * - Checking add, edit, or delete automatically enables view.
 * - Unchecking view automatically disables add, edit, and delete.
 */
export const applyActionRule = (
  current: SubModulePermissions,
  action: SubModuleAction,
  nextValue: boolean
): SubModulePermissions => {
  if (action === 'view') {
    if (!nextValue) {
      // If View is disabled, all other actions must be disabled
      return { view: false, add: false, edit: false, delete: false };
    }
    return { ...current, view: true };
  }

  // If Add, Edit, or Delete is being enabled, View MUST be true
  if (nextValue) {
    return {
      ...current,
      view: true,
      [action]: true,
    };
  }

  return {
    ...current,
    [action]: false,
  };
};

// Initial Mock Users with Granular Permissions
const INITIAL_USERS: ManagedUser[] = [
  {
    id: 'usr-1',
    fullName: 'Mulla Taher Vajihi',
    username: 'taherfmb',
    password: 'user#123',
    department: 'FMB & Takhmeen',
    permissions: {
      ...createDefaultPermissions(),
      'thaali-status': { view: true, add: true, edit: true, delete: false },
      'takhmeen-allocation': { view: true, add: true, edit: false, delete: false },
      'fmb-dues': { view: true, add: false, edit: false, delete: false },
      'hall-booking': { view: true, add: true, edit: true, delete: false },
    },
    createdAt: '1447-01-10',
  },
  {
    id: 'usr-2',
    fullName: 'Sheikh Huzefa Jamali',
    username: 'huzefasabeel',
    password: 'user#123',
    department: 'Sabeel Management',
    permissions: {
      ...createDefaultPermissions(),
      'sabeel-ledger': { view: true, add: true, edit: true, delete: false },
      'sabeel-collection': { view: true, add: true, edit: false, delete: false },
      'sabeel-history': { view: true, add: false, edit: false, delete: false },
      'counter-payment': { view: true, add: true, edit: true, delete: false },
      'receipts-history': { view: true, add: false, edit: false, delete: false },
    },
    createdAt: '1447-02-04',
  },
  {
    id: 'usr-3',
    fullName: 'Abdeali Bhai Shujauddin',
    username: 'abdealimember',
    password: 'user#123',
    department: 'Member & Area Master',
    permissions: {
      ...createDefaultPermissions(),
      'directory-hof': { view: true, add: true, edit: true, delete: false },
      'area-mapping': { view: true, add: true, edit: true, delete: false },
      'its-updater': { view: true, add: true, edit: true, delete: false },
    },
    createdAt: '1447-03-12',
  },
];

const INITIAL_LOGS: ActivityLogEntry[] = [
  {
    id: 'log-1',
    timestamp: '1447-03-12 10:15 AM',
    username: 'janabadmin',
    department: 'System Settings',
    subpage: 'Roles & Permissions',
    actionType: 'CREATED_USER',
    details: 'Provisioned officer "abdealimember" with granular [View, Add, Edit] on Member & Area Master.',
  },
  {
    id: 'log-2',
    timestamp: '1447-02-04 04:30 PM',
    username: 'janabadmin',
    department: 'System Settings',
    subpage: 'Roles & Permissions',
    actionType: 'CREATED_USER',
    details: 'Provisioned officer "huzefasabeel" with View & Add on Sabeel & Counter Payments.',
  },
  {
    id: 'log-3',
    timestamp: '1447-02-05 11:45 AM',
    username: 'taherfmb',
    department: 'FMB & Takhmeen',
    subpage: 'Thaali Status Manager',
    actionType: 'EDIT',
    details: 'Modified delivery dispatch status for Sector C Thaalis.',
  },
];

const USERS_STORAGE_KEY = 'jamat_granular_users_db_v2';
const LOGS_STORAGE_KEY = 'jamat_central_activity_logs_v2';

export const getStoredUsers = (): ManagedUser[] => {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_USERS;
  }
};

export const saveStoredUsers = (users: ManagedUser[]): void => {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (err) {
    console.error('Failed to save users', err);
  }
};

export const getStoredActivityLogs = (): ActivityLogEntry[] => {
  try {
    const raw = localStorage.getItem(LOGS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(INITIAL_LOGS));
      return INITIAL_LOGS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_LOGS;
  }
};

export const appendActivityLog = (
  username: string,
  department: string,
  subpage: string,
  actionType: ActivityLogEntry['actionType'],
  details: string
): ActivityLogEntry[] => {
  const currentLogs = getStoredActivityLogs();
  const now = new Date();
  const timeString = `${now.toLocaleDateString()} ${now.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`;

  const newEntry: ActivityLogEntry = {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    timestamp: timeString,
    username,
    department,
    subpage,
    actionType,
    details,
  };

  const updated = [newEntry, ...currentLogs].slice(0, 100);
  try {
    localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save activity logs', err);
  }
  return updated;
};

/**
 * Checks if a user has a specific granular permission on a sub-module.
 * Janab Super Admin (`janabadmin`) bypasses all restrictions with full master access.
 */
export const checkUserPermission = (
  user: UserProfile,
  subModuleId: string,
  action: SubModuleAction
): boolean => {
  // Super Admin / Janab has unrestricted master access
  if (user.username === 'janabadmin' || user.role === 'Super Admin' || user.permissions === 'all') {
    return true;
  }

  // Dashboard is always viewable
  if (subModuleId === 'overview' || subModuleId === 'faiz-dashboard') {
    return action === 'view';
  }

  if (!user.permissions || typeof user.permissions !== 'object') {
    return false;
  }

  const subPerms = user.permissions[subModuleId];
  return !!subPerms?.[action];
};

/**
 * Filters navigation categories so that ONLY pages where user has `View` permission are rendered.
 */
export const filterNavigationForUser = (
  categories: NavCategory[],
  user: UserProfile
): NavCategory[] => {
  // Janab Super Admin has full unrestricted access
  if (user.username === 'janabadmin' || user.role === 'Super Admin' || user.permissions === 'all') {
    return categories;
  }

  return categories
    .filter((cat) => {
      // System Settings is strictly reserved for Super Admin
      if (cat.id === 'system-settings') return false;
      return true;
    })
    .map((cat) => {
      // Dashboard is always viewable
      if (cat.id === 'dashboard') return cat;

      return {
        ...cat,
        items: cat.items.filter((item) => checkUserPermission(user, item.id, 'view')),
      };
    })
    .filter((cat) => cat.items.length > 0);
};
