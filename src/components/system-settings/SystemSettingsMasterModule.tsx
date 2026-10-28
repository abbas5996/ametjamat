import React, { useState, useMemo } from 'react';
import {
  Sliders,
  Users,
  UserPlus,
  Trash2,
  Building,
  CreditCard,
  Bell,
  Calendar,
  Camera,
  History,
  Lock,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  Download,
  Save,
  RefreshCw,
  X,
  Upload,
  Eye,
  FileText,
} from 'lucide-react';
import {
  JamaatBankAccount,
  TrustWaqfMasterEntity,
  CashReceiptLimitConfig,
  NotificationGatewayConfig,
  JamaatProfileDetails,
  ReceiptDateBlockingRule,
  DeleteReceiptPermissionOfficer,
  SafarAuditLog,
  getJamaatBankAccounts,
  saveJamaatBankAccounts,
  getTrustWaqfMaster,
  saveTrustWaqfMaster,
  getCashReceiptLimits,
  saveCashReceiptLimits,
  getNotificationGatewayConfig,
  saveNotificationGatewayConfig,
  getJamaatProfile,
  saveJamaatProfile,
  getReceiptDateBlocking,
  saveReceiptDateBlocking,
  getDeleteReceiptPermissions,
  saveDeleteReceiptPermissions,
  getSafarAuditLogs,
} from '../../utils/part4Management';
import {
  getStoredUsers,
  saveStoredUsers,
  getStoredActivityLogs,
  appendActivityLog,
  createDefaultPermissions,
} from '../../utils/rbac';
import { UserProfile, FinancialYear, ManagedUser, ActivityLogEntry } from '../../types';
import { ChangePasswordPage } from '../ChangePasswordPage';

interface SystemSettingsMasterModuleProps {
  currentUser: UserProfile;
  activeSubItemId: string;
  financialYear: FinancialYear;
  showToast: (msg: string) => void;
  canAdd?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}

export const SystemSettingsMasterModule: React.FC<SystemSettingsMasterModuleProps> = ({
  currentUser,
  activeSubItemId,
  financialYear,
  showToast,
  canAdd = true,
  canEdit = true,
  canDelete = true,
}) => {
  const isAdmin = currentUser.username === 'janabadmin' || currentUser.role === 'Super Admin';

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (activeSubItemId && activeSubItemId !== 'system-settings') {
      return activeSubItemId;
    }
    return 'user-list';
  });

  // State
  const [managedUsers, setManagedUsers] = useState<ManagedUser[]>(getStoredUsers);
  const [deleteReceiptPerms, setDeleteReceiptPerms] = useState<DeleteReceiptPermissionOfficer[]>(getDeleteReceiptPermissions);
  const [bankAccounts, setBankAccounts] = useState<JamaatBankAccount[]>(getJamaatBankAccounts);
  const [trustEntities, setTrustEntities] = useState<TrustWaqfMasterEntity[]>(getTrustWaqfMaster);
  const [cashLimits, setCashLimits] = useState<CashReceiptLimitConfig>(getCashReceiptLimits);
  const [notifConfig, setNotifConfig] = useState<NotificationGatewayConfig>(getNotificationGatewayConfig);
  const [jamaatProfile, setJamaatProfile] = useState<JamaatProfileDetails>(getJamaatProfile);
  const [dateBlocking, setDateBlocking] = useState<ReceiptDateBlockingRule>(getReceiptDateBlocking);
  const [activityLogs, setActivityLogs] = useState<ActivityLogEntry[]>(getStoredActivityLogs);
  const [safarLogs, setSafarLogs] = useState<SafarAuditLog[]>(getSafarAuditLogs);

  // Search & Filter
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [selectedAuditType, setSelectedAuditType] = useState('ALL');

  // Modals
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showTrustModal, setShowTrustModal] = useState(false);

  // Form States
  const [newUserForm, setNewUserForm] = useState({
    fullName: '',
    username: '',
    password: '',
    department: 'Maliyah & Khazina',
  });

  const [bankForm, setBankForm] = useState({
    bankName: '',
    accountNumber: '',
    accountType: 'Current' as JamaatBankAccount['accountType'],
    ifscCode: '',
    branch: '',
    currentBalance: '1000000',
  });

  const [trustForm, setTrustForm] = useState({
    trustName: '',
    regNumber: '',
    chiefTrustee: 'Janab Amil Saheb Kinana Bhaisaheb',
    panNumber: '',
    notes: '',
  });

  // Photo upload mock storage
  const [uploadedPhotos, setUploadedPhotos] = useState<Array<{ its: string; name: string; status: string }>>([
    { its: '30491024', name: 'Janab Amil Saheb Kinana BS.jpg', status: 'Verified' },
    { its: '20481920', name: 'Mulla Shabbir Bhai Vasi.jpg', status: 'Verified' },
    { its: '20391823', name: 'Shk Mufaddal Bhai Gulamali.jpg', status: 'Verified' },
  ]);

  // Handlers
  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserForm.username.trim() || !newUserForm.fullName.trim() || !newUserForm.password.trim()) {
      alert('Please fill in Full Name, Username, and Initial Password.');
      return;
    }
    const cleanUsername = newUserForm.username.trim().toLowerCase();
    if (managedUsers.some((u) => u.username.toLowerCase() === cleanUsername) || cleanUsername === 'janabadmin') {
      alert(`User with username "${cleanUsername}" already exists.`);
      return;
    }
    const newUser: ManagedUser = {
      id: `USER-${Date.now()}`,
      fullName: newUserForm.fullName.trim(),
      username: cleanUsername,
      password: newUserForm.password.trim(),
      department: newUserForm.department,
      permissions: createDefaultPermissions(),
      createdAt: new Date().toISOString(),
    };
    const updated = [...managedUsers, newUser];
    setManagedUsers(updated);
    saveStoredUsers(updated);
    appendActivityLog(
      currentUser.username,
      'System Settings',
      'User Management',
      'CREATED_USER',
      `Registered new user account "@${newUser.username}" (${newUser.fullName}) for department ${newUser.department}.`
    );
    setShowNewUserModal(false);
    setNewUserForm({ fullName: '', username: '', password: '', department: 'Maliyah & Khazina' });
    showToast(`User @${newUser.username} registered with granular permissions.`);
  };

  const handleSaveBank = (e: React.FormEvent) => {
    e.preventDefault();
    const bal = parseFloat(bankForm.currentBalance);
    if (!bankForm.bankName || !bankForm.accountNumber || isNaN(bal)) return;
    const newAccount: JamaatBankAccount = {
      id: `BA-${Date.now()}`,
      bankName: bankForm.bankName,
      accountNumber: bankForm.accountNumber,
      accountType: bankForm.accountType,
      ifscCode: bankForm.ifscCode,
      branch: bankForm.branch,
      currentBalance: bal,
      isActive: true,
    };
    const updated = [...bankAccounts, newAccount];
    setBankAccounts(updated);
    saveJamaatBankAccounts(updated);
    setShowBankModal(false);
    showToast(`Bank Account ${newAccount.bankName} (${newAccount.accountNumber}) added.`);
  };

  const handleSaveTrust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trustForm.trustName || !trustForm.regNumber) return;
    const newTrust: TrustWaqfMasterEntity = {
      id: `TWM-${Date.now()}`,
      trustName: trustForm.trustName,
      regNumber: trustForm.regNumber,
      regDate: new Date().toISOString().split('T')[0],
      status80G: 'Active',
      status12A: 'Active',
      chiefTrustee: trustForm.chiefTrustee,
      panNumber: trustForm.panNumber,
      notes: trustForm.notes,
    };
    const updated = [...trustEntities, newTrust];
    setTrustEntities(updated);
    saveTrustWaqfMaster(updated);
    setShowTrustModal(false);
    showToast(`Trust Entity "${newTrust.trustName}" registered.`);
  };

  const handleUpdateCashLimits = (e: React.FormEvent) => {
    e.preventDefault();
    saveCashReceiptLimits(cashLimits);
    appendActivityLog(
      currentUser.username,
      'System Settings',
      'Cash Receipt Limits',
      'EDIT',
      `Updated statutory cash receipt limit to ₹${cashLimits.maxSingleReceiptCash} and PAN threshold to ₹${cashLimits.panThresholdAmount}.`
    );
    showToast('Cash receipt limit thresholds updated successfully.');
  };

  const handleUpdateNotifConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveNotificationGatewayConfig(notifConfig);
    showToast('Notification gateway credentials saved successfully.');
  };

  const handleUpdateJamaatProfile = (e: React.FormEvent) => {
    e.preventDefault();
    saveJamaatProfile(jamaatProfile);
    appendActivityLog(
      currentUser.username,
      'System Settings',
      'Jamaat Details',
      'EDIT',
      `Updated official Jamaat profile details for ${jamaatProfile.jamaatName}.`
    );
    showToast('Jamaat profile details updated successfully.');
  };

  const handleUpdateDateBlocking = (e: React.FormEvent) => {
    e.preventDefault();
    saveReceiptDateBlocking(dateBlocking);
    showToast('Receipt date blocking rule enforced.');
  };

  const toggleDeletePermission = (username: string) => {
    const updated = deleteReceiptPerms.map((p) => {
      if (p.username === username) {
        return { ...p, canDeleteReceipts: !p.canDeleteReceipts };
      }
      return p;
    });
    setDeleteReceiptPerms(updated);
    saveDeleteReceiptPermissions(updated);
    showToast(`Updated receipt deletion privilege for @${username}.`);
  };

  const filteredLogs = useMemo(() => {
    let list = activityLogs;
    if (logSearchQuery) {
      const q = logSearchQuery.toLowerCase();
      list = list.filter((l) => l.details.toLowerCase().includes(q) || l.username.toLowerCase().includes(q));
    }
    if (selectedAuditType !== 'ALL') {
      list = list.filter((l) => l.actionType === selectedAuditType);
    }
    return list;
  }, [activityLogs, logSearchQuery, selectedAuditType]);

  return (
    <div className="space-y-6">
      {/* Settings Navigation Tabs */}
      <div className="bg-white border border-[#D97706]/30 rounded-xl p-2 shadow-xs flex flex-wrap gap-1.5 text-xs font-semibold">
        {[
          { id: 'user-list', label: 'User Management', icon: Users },
          { id: 'delete-receipt-perm', label: 'Delete Receipt Permissions', icon: Trash2 },
          { id: 'bank-accounts', label: 'Bank Accounts Master', icon: CreditCard },
          { id: 'trust-waqf', label: 'Trust & Waqf Master', icon: Building },
          { id: 'cash-limits', label: 'Cash Limits', icon: ShieldCheck },
          { id: 'notifications', label: 'Notifications Gateway', icon: Bell },
          { id: 'jamaat-details', label: 'Jamaat Profile Details', icon: Sliders },
          { id: 'date-blocking', label: 'Receipt Date Blocking', icon: Calendar },
          { id: 'bulk-photos', label: 'Bulk Photos Upload', icon: Camera },
          { id: 'activity-logs', label: 'Central Activity Logs', icon: History },
          { id: 'safar-logs', label: 'Safar Audit Trail', icon: FileText },
          { id: 'change-password', label: 'Change Password', icon: KeyRound },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#EAB308] text-[#0F172A] font-black shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. USER LIST & REGISTRATION */}
      {activeTab === 'user-list' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Registered System Users & RBAC Officers</h3>
              <p className="text-xs text-slate-500">Departmental operators and officers with verified credentials</p>
            </div>
            {canAdd && (
              <button
                type="button"
                onClick={() => setShowNewUserModal(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-black text-[#0F172A] bg-[#EAB308] hover:bg-[#D4AF37] rounded-lg transition-all shadow-xs cursor-pointer shrink-0"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Register New User</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 font-bold">
                  <th className="py-2.5 px-3">Username</th>
                  <th className="py-2.5 px-3">Full Officer Name</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Permissions Scope</th>
                  <th className="py-2.5 px-3">Created Date</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="bg-amber-50/40">
                  <td className="py-2.5 px-3 font-mono font-bold text-amber-900">janabadmin</td>
                  <td className="py-2.5 px-3 font-black text-slate-900">Janab Amil Saheb</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-800">Jamaat Executive Leadership</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-200 text-amber-900">
                      ROOT_SUPER_ADMIN (ALL)
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 font-mono">System Built-In</td>
                  <td className="py-2.5 px-3 text-right">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      Active
                    </span>
                  </td>
                </tr>

                {managedUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800">@{u.username}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{u.fullName}</td>
                    <td className="py-2.5 px-3 text-slate-700">{u.department}</td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {Object.keys(u.permissions || {}).length} Sub-Modules Configured
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 font-mono">
                      {u.createdAt ? u.createdAt.split('T')[0] : '2026-10-01'}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. DELETE RECEIPT PERMISSIONS */}
      {activeTab === 'delete-receipt-perm' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Receipt Deletion & Void Privileges (Dual-Signoff)</h3>
            <p className="text-xs text-slate-500">
              Only authorized officers with dual sign-off can delete or void counter receipts as per Jamaat audit standards
            </p>
          </div>

          <div className="space-y-3">
            {deleteReceiptPerms.map((officer) => (
              <div
                key={officer.username}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-slate-900 text-sm">{officer.fullName}</span>
                  <p className="text-slate-500 text-[11px]">
                    @{officer.username} • {officer.role} • Approved by {officer.approvedBy}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <span
                    className={`px-2.5 py-1 rounded text-[11px] font-bold ${
                      officer.canDeleteReceipts
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {officer.canDeleteReceipts ? 'Deletion Permitted' : 'Blocked'}
                  </span>
                  {isAdmin && officer.username !== 'janabadmin' && (
                    <button
                      type="button"
                      onClick={() => toggleDeletePermission(officer.username)}
                      className="px-3 py-1 bg-white border border-slate-300 rounded text-xs font-semibold hover:bg-slate-100 cursor-pointer"
                    >
                      Toggle Privilege
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. BANK ACCOUNTS MASTER */}
      {activeTab === 'bank-accounts' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Jamaat Bank Accounts Master</h3>
              <p className="text-xs text-slate-500">Authorized corporate bank accounts, IFSC codes, and current balances</p>
            </div>
            {canAdd && (
              <button
                type="button"
                onClick={() => setShowBankModal(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-black text-[#0F172A] bg-[#EAB308] hover:bg-[#D4AF37] rounded-lg transition-all shadow-xs cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Bank Account</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {bankAccounts.map((b) => (
              <div key={b.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">{b.bankName}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-900">{b.accountType}</span>
                </div>
                <p className="font-mono text-slate-600 font-semibold">A/C: {b.accountNumber}</p>
                <p className="text-slate-400 text-[11px]">IFSC: {b.ifscCode} • {b.branch}</p>
                <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                  <span className="text-slate-500">Current Ledger:</span>
                  <span className="font-black text-slate-900 text-sm">₹{b.currentBalance.toLocaleString('en-IN')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. TRUST & WAQF MASTER */}
      {activeTab === 'trust-waqf' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Registered Trust & Waqf Entities</h3>
              <p className="text-xs text-slate-500">80G, 12A registration numbers, PAN certificates, and Chief Trustees</p>
            </div>
            {canAdd && (
              <button
                type="button"
                onClick={() => setShowTrustModal(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-black text-[#0F172A] bg-[#EAB308] hover:bg-[#D4AF37] rounded-lg transition-all shadow-xs cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Trust Entity</span>
              </button>
            )}
          </div>

          <div className="space-y-3">
            {trustEntities.map((t) => (
              <div key={t.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">{t.trustName}</span>
                  <div className="flex space-x-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      80G {t.status80G}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                      12A {t.status12A}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-600">
                  <span>Reg #: <strong className="font-mono">{t.regNumber}</strong></span>
                  <span>Chief Trustee: <strong>{t.chiefTrustee}</strong></span>
                  <span>PAN: <strong className="font-mono">{t.panNumber}</strong></span>
                </div>
                <p className="text-slate-500 text-[11px] pt-1">{t.notes}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. CASH RECEIPT LIMITS */}
      {activeTab === 'cash-limits' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4 max-w-2xl">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Statutory Cash Receipt Limits & Thresholds</h3>
            <p className="text-xs text-slate-500">Configure Income Tax Section 269ST & statutory cash collection guardrails</p>
          </div>

          <form onSubmit={handleUpdateCashLimits} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Max Single Cash Receipt Limit (₹)</label>
              <input
                type="number"
                value={cashLimits.maxSingleReceiptCash}
                onChange={(e) => setCashLimits({ ...cashLimits, maxSingleReceiptCash: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-black text-slate-900"
              />
              <p className="text-[11px] text-slate-500 mt-1">Receipts above this limit are rejected at counter POS.</p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Max Daily Family Cash Limit (₹)</label>
              <input
                type="number"
                value={cashLimits.maxDailyFamilyCash}
                onChange={(e) => setCashLimits({ ...cashLimits, maxDailyFamilyCash: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-black text-slate-900"
              />
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <input
                type="checkbox"
                id="req-pan"
                checked={cashLimits.requirePanAbove}
                onChange={(e) => setCashLimits({ ...cashLimits, requirePanAbove: e.target.checked })}
                className="rounded text-amber-600 focus:ring-amber-500"
              />
              <label htmlFor="req-pan" className="font-bold text-slate-800">
                Mandate PAN card entry for transactions exceeding threshold
              </label>
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-[#EAB308] hover:bg-[#D4AF37] text-[#0F172A] font-black rounded-lg cursor-pointer"
            >
              Save Cash Limits Configuration
            </button>
          </form>
        </div>
      )}

      {/* 6. NOTIFICATIONS GATEWAY */}
      {activeTab === 'notifications' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4 max-w-2xl">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Notification Gateway Configuration</h3>
            <p className="text-xs text-slate-500">API keys for WhatsApp WATI, SMS DLT gateway, and SMTP mailer</p>
          </div>

          <form onSubmit={handleUpdateNotifConfig} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">WhatsApp Gateway URL (WATI)</label>
              <input
                type="text"
                value={notifConfig.whatsappGatewayUrl}
                onChange={(e) => setNotifConfig({ ...notifConfig, whatsappGatewayUrl: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">WhatsApp API Key / Bearer Token</label>
              <input
                type="password"
                value={notifConfig.whatsappApiKey}
                onChange={(e) => setNotifConfig({ ...notifConfig, whatsappApiKey: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">SMS DLT Sender ID</label>
                <input
                  type="text"
                  value={notifConfig.smsSenderId}
                  onChange={(e) => setNotifConfig({ ...notifConfig, smsSenderId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">SMTP Mail Sender</label>
                <input
                  type="text"
                  value={notifConfig.emailSenderAddress}
                  onChange={(e) => setNotifConfig({ ...notifConfig, emailSenderAddress: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-[#EAB308] hover:bg-[#D4AF37] text-[#0F172A] font-black rounded-lg cursor-pointer"
            >
              Save Notification Credentials
            </button>
          </form>
        </div>
      )}

      {/* 7. JAMAAT PROFILE DETAILS */}
      {activeTab === 'jamaat-details' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4 max-w-2xl">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Official Jamaat Organization Profile</h3>
            <p className="text-xs text-slate-500">Letterhead titles, postal address, and Janab Amil Saheb designation</p>
          </div>

          <form onSubmit={handleUpdateJamaatProfile} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Jamaat Entity Name</label>
              <input
                type="text"
                value={jamaatProfile.jamaatName}
                onChange={(e) => setJamaatProfile({ ...jamaatProfile, jamaatName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Janab Amil Saheb (TUS) Full Title</label>
              <input
                type="text"
                value={jamaatProfile.janabAmilSahebName}
                onChange={(e) => setJamaatProfile({ ...jamaatProfile, janabAmilSahebName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Markaz / Masjid Complex Address</label>
              <textarea
                rows={2}
                value={jamaatProfile.address}
                onChange={(e) => setJamaatProfile({ ...jamaatProfile, address: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Official Phone</label>
                <input
                  type="text"
                  value={jamaatProfile.phone}
                  onChange={(e) => setJamaatProfile({ ...jamaatProfile, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Official Email</label>
                <input
                  type="email"
                  value={jamaatProfile.email}
                  onChange={(e) => setJamaatProfile({ ...jamaatProfile, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-[#EAB308] hover:bg-[#D4AF37] text-[#0F172A] font-black rounded-lg cursor-pointer"
            >
              Update Jamaat Profile
            </button>
          </form>
        </div>
      )}

      {/* 8. RECEIPT DATE BLOCKING */}
      {activeTab === 'date-blocking' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4 max-w-2xl">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Receipt Date Blocking & Anti-Tampering Rules</h3>
            <p className="text-xs text-slate-500">Enforce date thresholds to block backdating beyond allowed window</p>
          </div>

          <form onSubmit={handleUpdateDateBlocking} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Max Allowed Backdated Days</label>
              <input
                type="number"
                value={dateBlocking.blockBackdatedDays}
                onChange={(e) => setDateBlocking({ ...dateBlocking, blockBackdatedDays: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-black text-slate-900"
              />
              <p className="text-[11px] text-slate-500 mt-1">Receipts older than this are rejected unless Janab overrides.</p>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <input
                type="checkbox"
                id="strict-block"
                checked={dateBlocking.isStrictEnforced}
                onChange={(e) => setDateBlocking({ ...dateBlocking, isStrictEnforced: e.target.checked })}
                className="rounded text-amber-600 focus:ring-amber-500"
              />
              <label htmlFor="strict-block" className="font-bold text-slate-800">
                Strict POS Enforcement across all counter terminals
              </label>
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-[#EAB308] hover:bg-[#D4AF37] text-[#0F172A] font-black rounded-lg cursor-pointer"
            >
              Apply Date Blocking Rules
            </button>
          </form>
        </div>
      )}

      {/* 9. BULK PHOTOS UPLOAD */}
      {activeTab === 'bulk-photos' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Bulk Member Photos Upload & ITS Auto-Match</h3>
              <p className="text-xs text-slate-500">Upload ZIP archive or multiple image files named with 8-digit ITS numbers</p>
            </div>
            <button
              type="button"
              onClick={() => {
                const sample = { its: '30491112', name: '30491112_photo.jpg', status: 'Matched & Verified' };
                setUploadedPhotos([sample, ...uploadedPhotos]);
                showToast('Sample ITS photo matched & synchronized.');
              }}
              className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-black text-[#0F172A] bg-[#EAB308] hover:bg-[#D4AF37] rounded-lg transition-all shadow-xs cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Simulate Bulk Match</span>
            </button>
          </div>

          <div className="p-8 border-2 border-dashed border-amber-300 rounded-2xl bg-amber-50/30 text-center space-y-2">
            <Camera className="w-10 h-10 text-amber-600 mx-auto" />
            <h4 className="text-sm font-bold text-slate-900">Drag & Drop ITS Photo Files</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Images named as <code>[ITS_NUMBER].jpg</code> (e.g. <code>20481920.jpg</code>) are automatically parsed and linked to member directory records.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase">Recently Synchronized Photo Records</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {uploadedPhotos.map((p, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono font-bold text-slate-900">ITS {p.its}</span>
                    <p className="text-[11px] text-slate-500 truncate max-w-[150px]">{p.name}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 10. CENTRAL ACTIVITY LOGS */}
      {activeTab === 'activity-logs' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Central System Activity Audit Trail</h3>
              <p className="text-xs text-slate-500">Immutable ledger of every record created, edited, deleted, or payment authorized</p>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Search audit trail..."
                value={logSearchQuery}
                onChange={(e) => setLogSearchQuery(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-sans">
              <thead>
                <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 font-bold">
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Officer</th>
                  <th className="py-2.5 px-3">Department & Page</th>
                  <th className="py-2.5 px-3">Action Type</th>
                  <th className="py-2.5 px-3">Audit Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-amber-50/20">
                    <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">{log.timestamp}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">@{log.username}</td>
                    <td className="py-2.5 px-3 text-slate-700">
                      <span className="font-semibold">{log.department}</span> • {log.subpage}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 font-mono">
                        {log.actionType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 max-w-md">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 11. SAFAR AUDIT TRAIL */}
      {activeTab === 'safar-logs' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Huzurala Safar Mubarak Specific Audit Logs</h3>
            <p className="text-xs text-slate-500">Inspection approvals, ziyafat tokens issued, and takhmeen revisions</p>
          </div>

          <div className="space-y-3">
            {safarLogs.map((sl) => (
              <div key={sl.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-900">{sl.actionType}</span>
                  <span className="font-mono text-slate-400 text-[11px]">{sl.timestamp}</span>
                </div>
                <p className="text-slate-700 font-medium">{sl.details}</p>
                <p className="text-[10px] text-slate-400 font-mono">Officer: @{sl.officerName}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 12. CHANGE PASSWORD */}
      {activeTab === 'change-password' && (
        <ChangePasswordPage currentUser={currentUser} showToast={showToast} />
      )}

      {/* MODAL: REGISTER NEW USER */}
      {showNewUserModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-amber-300 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Register New Department User</h3>
              <button type="button" onClick={() => setShowNewUserModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Officer Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mulla Shabbir Bhai Vasi"
                  value={newUserForm.fullName}
                  onChange={(e) => setNewUserForm({ ...newUserForm, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Username (Login ID)</label>
                  <input
                    type="text"
                    required
                    placeholder="shabbirvasi"
                    value={newUserForm.username}
                    onChange={(e) => setNewUserForm({ ...newUserForm, username: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Initial Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Temporary password"
                    value={newUserForm.password}
                    onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Primary Department</label>
                <select
                  value={newUserForm.department}
                  onChange={(e) => setNewUserForm({ ...newUserForm, department: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold"
                >
                  <option value="Maliyah & Khazina">Maliyah & Khazina (Treasury)</option>
                  <option value="Faizul Mawaidil Burhaniyah">Faizul Mawaidil Burhaniyah</option>
                  <option value="Sabeel Department">Sabeel Department</option>
                  <option value="General Secretariat">General Secretariat</option>
                  <option value="Taleem & Madrasa Saifiyah">Taleem & Madrasa Saifiyah</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowNewUserModal(false)} className="px-4 py-2 border border-slate-300 rounded-lg cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-[#EAB308] hover:bg-[#D4AF37] text-[#0F172A] font-black rounded-lg cursor-pointer">
                  Register Officer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD BANK */}
      {showBankModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-blue-300 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Add Bank Account</h3>
              <button type="button" onClick={() => setShowBankModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBank} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bank Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ICICI Bank Ltd"
                    value={bankForm.bankName}
                    onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Account Number</label>
                  <input
                    type="text"
                    required
                    placeholder="A/C Number"
                    value={bankForm.accountNumber}
                    onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">IFSC Code</label>
                  <input
                    type="text"
                    placeholder="ICIC0001024"
                    value={bankForm.ifscCode}
                    onChange={(e) => setBankForm({ ...bankForm, ifscCode: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Branch</label>
                  <input
                    type="text"
                    placeholder="Branch Name"
                    value={bankForm.branch}
                    onChange={(e) => setBankForm({ ...bankForm, branch: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Current Balance (₹)</label>
                <input
                  type="number"
                  required
                  value={bankForm.currentBalance}
                  onChange={(e) => setBankForm({ ...bankForm, currentBalance: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-black text-slate-900"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowBankModal(false)} className="px-4 py-2 border border-slate-300 rounded-lg cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-lg cursor-pointer">
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
