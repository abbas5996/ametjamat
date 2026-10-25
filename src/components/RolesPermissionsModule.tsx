import React, { useState } from 'react';
import {
  ShieldCheck,
  UserPlus,
  Users,
  Trash2,
  Edit3,
  Clock,
  CheckSquare,
  Square,
  AlertCircle,
  Lock,
  Building2,
  User,
  X,
  Search,
  Check,
  Eye,
  PlusCircle,
  Pencil,
  Filter,
} from 'lucide-react';
import {
  UserProfile,
  ManagedUser,
  SubModuleAction,
  UserPermissionsMap,
  ActivityLogEntry,
} from '../types';
import {
  RBAC_DEPARTMENTS,
  createDefaultPermissions,
  createFullPermissions,
  applyActionRule,
  getStoredUsers,
  saveStoredUsers,
  getStoredActivityLogs,
  appendActivityLog,
} from '../utils/rbac';

interface RolesPermissionsModuleProps {
  currentUser: UserProfile;
  onUserDatabaseUpdated?: () => void;
  showToast: (message: string) => void;
}

const ACTION_COLUMNS: { key: SubModuleAction; label: string; icon: React.FC<{ className?: string }> }[] = [
  { key: 'view', label: 'View', icon: Eye },
  { key: 'add', label: 'Add', icon: PlusCircle },
  { key: 'edit', label: 'Edit', icon: Pencil },
  { key: 'delete', label: 'Delete', icon: Trash2 },
];

export const RolesPermissionsModule: React.FC<RolesPermissionsModuleProps> = ({
  currentUser,
  onUserDatabaseUpdated,
  showToast,
}) => {
  // 1. STRICT ACCESS CHECK: Only accessible by Janab (Super Admin / janabadmin)
  const isAdmin = currentUser.username === 'janabadmin' || currentUser.role === 'Super Admin';

  if (!isAdmin) {
    return (
      <div className="bg-white border border-rose-200 rounded-2xl p-8 shadow-sm text-center max-w-xl mx-auto my-8">
        <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-200">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Restricted Access</h2>
        <p className="text-sm text-slate-600 mb-4">
          The <span className="font-semibold text-slate-800">User Creation & Granular RBAC Matrix</span>{' '}
          is strictly restricted to <span className="font-bold text-amber-700">Janab (Super Admin)</span>.
        </p>
        <p className="text-xs text-slate-400">
          Current logged in account ({currentUser.displayName} — {currentUser.role}) does not have administrative clearance.
        </p>
      </div>
    );
  }

  // Lightweight state management
  const [users, setUsers] = useState<ManagedUser[]>(() => getStoredUsers());
  const [activityLogs, setActivityLogs] = useState<ActivityLogEntry[]>(() => getStoredActivityLogs());

  // Form State
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState(RBAC_DEPARTMENTS[0].name);
  const [permissionsMatrix, setPermissionsMatrix] = useState<UserPermissionsMap>(() =>
    createDefaultPermissions()
  );
  const [formError, setFormError] = useState<string | null>(null);

  // Edit Permissions Modal State
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [editMatrix, setEditMatrix] = useState<UserPermissionsMap>({});

  // View Details Modal State
  const [inspectingUser, setInspectingUser] = useState<ManagedUser | null>(null);

  // UI Tabs & Filters
  const [activeTab, setActiveTab] = useState<'users' | 'create' | 'logs'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [logFilterAction, setLogFilterAction] = useState<string>('ALL');

  // Toggle Action with Auto-View Enforcement in Create Form
  const handleToggleFormAction = (subModuleId: string, action: SubModuleAction) => {
    setPermissionsMatrix((prev) => {
      const currentSub = prev[subModuleId] || { view: false, add: false, edit: false, delete: false };
      const nextVal = !currentSub[action];
      const updatedSub = applyActionRule(currentSub, action, nextVal);
      return {
        ...prev,
        [subModuleId]: updatedSub,
      };
    });
  };

  // Toggle Action with Auto-View Enforcement in Edit Modal
  const handleToggleEditAction = (subModuleId: string, action: SubModuleAction) => {
    setEditMatrix((prev) => {
      const currentSub = prev[subModuleId] || { view: false, add: false, edit: false, delete: false };
      const nextVal = !currentSub[action];
      const updatedSub = applyActionRule(currentSub, action, nextVal);
      return {
        ...prev,
        [subModuleId]: updatedSub,
      };
    });
  };

  // Department-Level Bulk Toggles
  const handleDepartmentSet = (
    deptId: string,
    preset: 'full' | 'view_only' | 'none',
    isEditModal: boolean = false
  ) => {
    const dept = RBAC_DEPARTMENTS.find((d) => d.id === deptId);
    if (!dept) return;

    const updater = isEditModal ? setEditMatrix : setPermissionsMatrix;
    updater((prev) => {
      const updated = { ...prev };
      dept.subModules.forEach((sm) => {
        if (preset === 'full') {
          updated[sm.id] = { view: true, add: true, edit: true, delete: true };
        } else if (preset === 'view_only') {
          updated[sm.id] = { view: true, add: false, edit: false, delete: false };
        } else {
          updated[sm.id] = { view: false, add: false, edit: false, delete: false };
        }
      });
      return updated;
    });
  };

  // Submit New User
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanUsername = username.trim().toLowerCase();
    const cleanFullName = fullName.trim();

    if (!cleanFullName || !cleanUsername || !password) {
      setFormError('Please fill in Full Name, Username / ID, and Password.');
      return;
    }

    if (cleanUsername === 'janabadmin') {
      setFormError('The username "janabadmin" is reserved for Super Admin.');
      return;
    }

    if (users.some((u) => u.username.toLowerCase() === cleanUsername)) {
      setFormError(`User with username "${cleanUsername}" already exists.`);
      return;
    }

    // Check if at least one view permission is granted
    const hasAnyView = Object.values(permissionsMatrix).some((p) => p.view);
    if (!hasAnyView) {
      setFormError('Please assign at least one submodule View permission.');
      return;
    }

    const newUser: ManagedUser = {
      id: `usr-${Date.now()}`,
      fullName: cleanFullName,
      username: cleanUsername,
      password,
      department,
      permissions: permissionsMatrix,
      createdAt: new Date().toLocaleDateString(),
    };

    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    saveStoredUsers(updatedUsers);

    // Push Central Activity Log
    const viewCount = Object.values(permissionsMatrix).filter((p) => p.view).length;
    const updatedLogs = appendActivityLog(
      currentUser.username,
      'System Settings',
      'Roles & Permissions',
      'CREATED_USER',
      `Created department officer "${cleanUsername}" (${cleanFullName} - ${department}) with access to ${viewCount} sub-modules.`
    );
    setActivityLogs(updatedLogs);

    // Reset Form
    setFullName('');
    setUsername('');
    setPassword('');
    setPermissionsMatrix(createDefaultPermissions());
    setActiveTab('users');

    showToast(`User "${cleanUsername}" created successfully!`);
    onUserDatabaseUpdated?.();
  };

  // Open Edit Modal
  const handleOpenEdit = (user: ManagedUser) => {
    setEditingUser(user);
    setEditMatrix({ ...user.permissions });
  };

  // Save Edited Permissions
  const handleSaveEdit = () => {
    if (!editingUser) return;

    const hasAnyView = Object.values(editMatrix).some((p) => p.view);
    if (!hasAnyView) {
      showToast('User must retain at least one module View permission.');
      return;
    }

    const updatedUsers = users.map((u) =>
      u.id === editingUser.id ? { ...u, permissions: editMatrix } : u
    );

    setUsers(updatedUsers);
    saveStoredUsers(updatedUsers);

    const viewCount = Object.values(editMatrix).filter((p) => p.view).length;
    const updatedLogs = appendActivityLog(
      currentUser.username,
      'System Settings',
      'Roles & Permissions',
      'UPDATED_PERMISSIONS',
      `Updated granular permissions matrix for "${editingUser.username}" (${viewCount} permitted sub-modules).`
    );
    setActivityLogs(updatedLogs);

    setEditingUser(null);
    showToast(`Permissions updated for ${editingUser.fullName}.`);
    onUserDatabaseUpdated?.();
  };

  // Delete User
  const handleDeleteUser = (userId: string, targetUsername: string) => {
    if (window.confirm(`Are you sure you want to revoke and delete account "${targetUsername}"?`)) {
      const updatedUsers = users.filter((u) => u.id !== userId);
      setUsers(updatedUsers);
      saveStoredUsers(updatedUsers);

      const updatedLogs = appendActivityLog(
        currentUser.username,
        'System Settings',
        'Roles & Permissions',
        'DELETED_USER',
        `Deactivated and deleted department account "${targetUsername}".`
      );
      setActivityLogs(updatedLogs);

      showToast(`User "${targetUsername}" deleted.`);
      onUserDatabaseUpdated?.();
    }
  };

  // Filtered users for table
  const filteredUsers = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filtered Activity Logs
  const filteredLogs = activityLogs.filter((log) => {
    if (logFilterAction !== 'ALL' && log.actionType !== logFilterAction) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner / Stats Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-sky-950 text-white rounded-2xl p-6 shadow-xl border border-amber-300/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Super Admin Security Console</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Granular Role-Based Access Control (RBAC)
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Configure independent <span className="text-amber-300 font-bold">View, Add, Edit, Delete</span> permissions across all 5 departments and 15 sub-modules with central audit logging.
          </p>
        </div>

        {/* Quick Nav Tabs */}
        <div className="flex items-center space-x-2 bg-slate-950/60 p-1.5 rounded-xl border border-slate-700/60 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'users'
                ? 'bg-amber-400 text-slate-950 shadow-xs'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Officers ({users.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'create'
                ? 'bg-amber-400 text-slate-950 shadow-xs'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Create Officer</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('logs')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'logs'
                ? 'bg-amber-400 text-slate-950 shadow-xs'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Audit Trail ({activityLogs.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: USERS LIST TABLE */}
      {activeTab === 'users' && (
        <div className="bg-white border border-amber-200/60 rounded-2xl shadow-sm overflow-hidden">
          {/* Table Toolbar */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search officers, departments..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20 outline-hidden font-medium text-slate-800"
              />
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('create')}
              className="w-full sm:w-auto flex items-center justify-center space-x-1.5 px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create New Officer Account</span>
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                  <th className="py-3 px-4">Officer / Account</th>
                  <th className="py-3 px-4">Primary Department</th>
                  <th className="py-3 px-4">Sub-Module Access Matrix</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {/* Janab Super Admin Row */}
                <tr className="bg-amber-50/40 hover:bg-amber-50/70 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-amber-400 text-slate-950 font-black flex items-center justify-center text-xs shadow-xs">
                        JA
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                          <span>Janab Amil Saheb</span>
                          <span className="text-[10px] font-extrabold bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded-full border border-amber-300">
                            Super Admin
                          </span>
                        </div>
                        <span className="text-slate-500 font-mono text-[11px]">janabadmin</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 font-semibold">
                    Jamaat Executive Leadership
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Master Access (All 15 Sub-modules: View, Add, Edit, Delete)</span>
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">Permanent</td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="text-[11px] text-slate-400 font-semibold italic">
                      Protected Root
                    </span>
                  </td>
                </tr>

                {/* Managed Officers Rows */}
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No matching accounts found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const permittedSubmodules = Object.entries(u.permissions || {}).filter(
                      ([, p]) => p.view
                    );
                    const viewCount = permittedSubmodules.length;
                    const addCount = permittedSubmodules.filter(([, p]) => p.add).length;
                    const editCount = permittedSubmodules.filter(([, p]) => p.edit).length;
                    const deleteCount = permittedSubmodules.filter(([, p]) => p.delete).length;

                    return (
                      <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs">
                              {u.fullName.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{u.fullName}</div>
                              <span className="text-slate-500 font-mono text-[11px]">{u.username}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700">{u.department}</td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-slate-800">
                                {viewCount} of 15 Sub-modules Permitted
                              </span>
                              <button
                                type="button"
                                onClick={() => setInspectingUser(u)}
                                className="text-[11px] font-semibold text-amber-700 hover:underline cursor-pointer"
                              >
                                View Matrix
                              </button>
                            </div>
                            {/* Action breakdown badges */}
                            <div className="flex items-center space-x-1.5 text-[10px] font-mono">
                              <span className="px-1.5 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200">
                                View: {viewCount}
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                                Add: {addCount}
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                                Edit: {editCount}
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200">
                                Del: {deleteCount}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                          {u.createdAt}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(u)}
                              className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                              title="Edit Granular Permissions"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u.id, u.username)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Officer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: CREATE NEW USER WITH GRANULAR PERMISSIONS MATRIX */}
      {activeTab === 'create' && (
        <div className="bg-white border border-amber-200/60 rounded-2xl p-6 sm:p-8 shadow-sm max-w-4xl mx-auto">
          <div className="border-b border-slate-100 pb-4 mb-6">
            <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <UserPlus className="w-5 h-5 text-amber-600" />
              <span>Create Department Officer Account</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter credentials and configure the granular <span className="font-semibold text-slate-700">View, Add, Edit, Delete</span> matrix for every department submodule.
            </p>
          </div>

          {formError && (
            <div className="mb-5 flex items-center space-x-2 p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-semibold">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleCreateUser} className="space-y-6">
            {/* Account Credentials Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Sheikh Mufaddal Bhai"
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-400/20 font-medium text-slate-900 outline-hidden"
                  />
                </div>
              </div>

              {/* Username / ID */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Username / Login ID
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. mufaddalsabeel"
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-400/20 font-medium text-slate-900 outline-hidden"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Initial Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Set temporary password"
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-400/20 font-medium text-slate-900 outline-hidden"
                  />
                </div>
              </div>

              {/* Primary Department */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Primary Department
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-400/20 font-medium text-slate-900 outline-hidden cursor-pointer"
                  >
                    {RBAC_DEPARTMENTS.map((dept) => (
                      <option key={dept.id} value={dept.name}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Granular Permissions Matrix Section */}
            <div className="pt-4 border-t border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                    Granular Sub-Module Permissions Matrix
                  </h4>
                  <p className="text-xs text-slate-500">
                    Checking Add, Edit, or Delete automatically arms <span className="font-bold text-sky-700">View</span> permission.
                  </p>
                </div>

                <div className="flex items-center space-x-2 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setPermissionsMatrix(createFullPermissions())}
                    className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg hover:bg-amber-100 cursor-pointer"
                  >
                    Grant All
                  </button>
                  <button
                    type="button"
                    onClick={() => setPermissionsMatrix(createDefaultPermissions())}
                    className="px-2.5 py-1 bg-slate-50 text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100 cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Department Accordions */}
              <div className="space-y-4">
                {RBAC_DEPARTMENTS.map((dept) => (
                  <div
                    key={dept.id}
                    className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white"
                  >
                    {/* Department Header */}
                    <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="font-bold text-xs sm:text-sm text-slate-900">
                        {dept.name}
                      </div>
                      <div className="flex items-center space-x-2 text-[11px] font-semibold">
                        <button
                          type="button"
                          onClick={() => handleDepartmentSet(dept.id, 'full')}
                          className="text-amber-700 hover:underline cursor-pointer"
                        >
                          All Actions
                        </button>
                        <span className="text-slate-300">•</span>
                        <button
                          type="button"
                          onClick={() => handleDepartmentSet(dept.id, 'view_only')}
                          className="text-sky-700 hover:underline cursor-pointer"
                        >
                          View Only
                        </button>
                        <span className="text-slate-300">•</span>
                        <button
                          type="button"
                          onClick={() => handleDepartmentSet(dept.id, 'none')}
                          className="text-slate-500 hover:underline cursor-pointer"
                        >
                          None
                        </button>
                      </div>
                    </div>

                    {/* Sub-modules Table */}
                    <div className="divide-y divide-slate-100">
                      {dept.subModules.map((sm) => {
                        const currentPerm = permissionsMatrix[sm.id] || {
                          view: false,
                          add: false,
                          edit: false,
                          delete: false,
                        };

                        return (
                          <div
                            key={sm.id}
                            className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                              currentPerm.view ? 'bg-amber-50/20' : 'bg-white'
                            }`}
                          >
                            <div className="flex-1 min-w-0 pr-2">
                              <div className="font-bold text-xs text-slate-800">{sm.name}</div>
                              <div className="text-[11px] text-slate-500 truncate">{sm.description}</div>
                            </div>

                            {/* 4 Action Checkboxes */}
                            <div className="flex items-center space-x-3 shrink-0">
                              {ACTION_COLUMNS.map(({ key, label }) => {
                                const isChecked = currentPerm[key];
                                return (
                                  <label
                                    key={key}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleToggleFormAction(sm.id, key);
                                    }}
                                    className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold cursor-pointer transition-all select-none ${
                                      isChecked
                                        ? key === 'view'
                                          ? 'bg-sky-50 border-sky-300 text-sky-900 shadow-2xs'
                                          : key === 'add'
                                          ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-2xs'
                                          : key === 'edit'
                                          ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-2xs'
                                          : 'bg-rose-50 border-rose-300 text-rose-900 shadow-2xs'
                                        : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300'
                                    }`}
                                  >
                                    <div className="w-3.5 h-3.5 flex items-center justify-center">
                                      {isChecked ? (
                                        <CheckSquare className="w-3.5 h-3.5 text-current" />
                                      ) : (
                                        <Square className="w-3.5 h-3.5 text-slate-300" />
                                      )}
                                    </div>
                                    <span>{label}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveTab('users')}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all active:scale-[0.99] cursor-pointer"
              >
                Provision & Save Officer Account
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: CENTRAL ACTIVITY AUDIT LOG */}
      {activeTab === 'logs' && (
        <div className="bg-white border border-amber-200/60 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Central Activity & Audit Log</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time tracking of all Add, Edit, Delete, and User Creation actions across the ERP.
              </p>
            </div>

            {/* Filter by Action Type */}
            <div className="flex items-center space-x-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={logFilterAction}
                onChange={(e) => setLogFilterAction(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 outline-hidden"
              >
                <option value="ALL">All Actions</option>
                <option value="ADD">Add Records</option>
                <option value="EDIT">Edit Records</option>
                <option value="DELETE">Delete Records</option>
                <option value="CREATED_USER">User Created</option>
                <option value="UPDATED_PERMISSIONS">Permissions Updated</option>
                <option value="DELETED_USER">User Deleted</option>
              </select>
            </div>
          </div>

          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            {filteredLogs.length === 0 ? (
              <p className="text-center py-8 text-xs text-slate-400">No activity logs recorded yet.</p>
            ) : (
              filteredLogs.map((log) => {
                const isAdd = log.actionType === 'ADD' || log.actionType === 'CREATED_USER';
                const isEdit = log.actionType === 'EDIT' || log.actionType === 'UPDATED_PERMISSIONS';
                const isDelete = log.actionType === 'DELETE' || log.actionType === 'DELETED_USER';

                return (
                  <div
                    key={log.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-slate-50/70 hover:bg-slate-50 rounded-xl border border-slate-200/70 gap-2 text-xs transition-colors"
                  >
                    <div className="flex items-start space-x-3">
                      <span
                        className={`mt-0.5 px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                          isAdd
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : isEdit
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : isDelete
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : 'bg-sky-100 text-sky-800 border border-sky-300'
                        }`}
                      >
                        {log.actionType}
                      </span>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900 font-mono">@{log.username}</span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-600 font-semibold">{log.department}</span>
                          {log.subpage && (
                            <>
                              <span className="text-slate-400">/</span>
                              <span className="text-slate-500">{log.subpage}</span>
                            </>
                          )}
                        </div>
                        <p className="text-slate-700 mt-0.5 leading-relaxed font-medium">{log.details}</p>
                      </div>
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 shrink-0 sm:text-right pl-10 sm:pl-0">
                      {log.timestamp}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* EDIT PERMISSIONS MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-amber-200 rounded-2xl p-6 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 shrink-0">
              <div>
                <h4 className="font-bold text-base text-slate-900">
                  Granular Permissions: {editingUser.fullName}
                </h4>
                <p className="text-xs text-slate-500 font-mono">
                  @{editingUser.username} ({editingUser.department})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Matrix Accordions inside Modal */}
            <div className="space-y-3 overflow-y-auto flex-1 pr-2">
              {RBAC_DEPARTMENTS.map((dept) => (
                <div key={dept.id} className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-50 px-3.5 py-2 border-b border-slate-200 flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">{dept.name}</span>
                    <div className="space-x-2 text-[11px] font-semibold">
                      <button
                        type="button"
                        onClick={() => handleDepartmentSet(dept.id, 'full', true)}
                        className="text-amber-700 hover:underline cursor-pointer"
                      >
                        All
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDepartmentSet(dept.id, 'view_only', true)}
                        className="text-sky-700 hover:underline cursor-pointer"
                      >
                        View Only
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDepartmentSet(dept.id, 'none', true)}
                        className="text-slate-500 hover:underline cursor-pointer"
                      >
                        None
                      </button>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {dept.subModules.map((sm) => {
                      const currentPerm = editMatrix[sm.id] || {
                        view: false,
                        add: false,
                        edit: false,
                        delete: false,
                      };

                      return (
                        <div
                          key={sm.id}
                          className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                        >
                          <div className="text-xs">
                            <span className="font-bold text-slate-800">{sm.name}</span>
                          </div>

                          <div className="flex items-center space-x-2">
                            {ACTION_COLUMNS.map(({ key, label }) => {
                              const isChecked = currentPerm[key];
                              return (
                                <button
                                  type="button"
                                  key={key}
                                  onClick={() => handleToggleEditAction(sm.id, key)}
                                  className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-semibold cursor-pointer border select-none transition-all ${
                                    isChecked
                                      ? key === 'view'
                                        ? 'bg-sky-50 border-sky-300 text-sky-900'
                                        : key === 'add'
                                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                                        : key === 'edit'
                                        ? 'bg-amber-50 border-amber-300 text-amber-900'
                                        : 'bg-rose-50 border-rose-300 text-rose-900'
                                      : 'bg-slate-50 border-slate-200 text-slate-400'
                                  }`}
                                >
                                  {isChecked ? (
                                    <Check className="w-3 h-3 text-current" />
                                  ) : (
                                    <span className="w-3 h-3 block" />
                                  )}
                                  <span>{label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 mt-4 shrink-0">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-4 py-2 text-xs font-bold bg-amber-400 hover:bg-amber-500 text-slate-950 rounded-xl shadow-xs cursor-pointer"
              >
                Save Granular Permissions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INSPECT USER DETAILS MODAL */}
      {inspectingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-amber-200 rounded-2xl p-6 shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 shrink-0">
              <div>
                <h4 className="font-bold text-base text-slate-900">
                  Permission Matrix: {inspectingUser.fullName}
                </h4>
                <p className="text-xs text-slate-500 font-mono">@{inspectingUser.username}</p>
              </div>
              <button
                type="button"
                onClick={() => setInspectingUser(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto flex-1 pr-1">
              {RBAC_DEPARTMENTS.map((dept) => {
                const permittedInDept = dept.subModules.filter(
                  (sm) => inspectingUser.permissions[sm.id]?.view
                );

                return (
                  <div key={dept.id} className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-xs text-slate-900">{dept.name}</span>
                      <span className="text-[11px] font-mono text-slate-500">
                        {permittedInDept.length} / {dept.subModules.length} Sub-modules
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {dept.subModules.map((sm) => {
                        const perm = inspectingUser.permissions[sm.id];
                        const isPermitted = perm?.view;

                        return (
                          <div
                            key={sm.id}
                            className={`p-2 rounded-lg text-xs flex items-center justify-between ${
                              isPermitted ? 'bg-white border border-slate-200' : 'bg-slate-100/60 opacity-50'
                            }`}
                          >
                            <span className="font-medium text-slate-800">{sm.name}</span>
                            <div className="flex items-center space-x-1 font-mono text-[10px]">
                              {perm?.view && (
                                <span className="px-1.5 py-0.2 rounded bg-sky-100 text-sky-800">VIEW</span>
                              )}
                              {perm?.add && (
                                <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">ADD</span>
                              )}
                              {perm?.edit && (
                                <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">EDIT</span>
                              )}
                              {perm?.delete && (
                                <span className="px-1.5 py-0.2 rounded bg-rose-100 text-rose-800">DEL</span>
                              )}
                              {!isPermitted && <span className="text-slate-400 italic">No Access</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-slate-100 mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setInspectingUser(null)}
                className="px-4 py-2 text-xs font-bold bg-slate-900 text-white rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

