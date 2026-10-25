import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Info,
} from 'lucide-react';
import { UserProfile, ManagedUser } from '../types';
import {
  getStoredUsers,
  saveStoredUsers,
  appendActivityLog,
} from '../utils/rbac';

interface ChangePasswordPageProps {
  currentUser: UserProfile;
  showToast: (message: string) => void;
}

const SUPER_ADMIN_STUB = {
  id: 'janabadmin',
  fullName: 'Janab Amil Saheb',
  username: 'janabadmin',
  department: 'Jamaat Executive Leadership',
  isBuiltIn: true as const,
};

type SelectableUser =
  | (ManagedUser & { isBuiltIn?: false })
  | typeof SUPER_ADMIN_STUB;

export const ChangePasswordPage: React.FC<ChangePasswordPageProps> = ({
  currentUser,
  showToast,
}) => {
  const isAdmin =
    currentUser.username === 'janabadmin' || currentUser.role === 'Super Admin';

  const [managedUsers, setManagedUsers] = useState<ManagedUser[]>(() =>
    getStoredUsers()
  );
  const [selectedUsername, setSelectedUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setManagedUsers(getStoredUsers());
  }, []);

  const allUsers: SelectableUser[] = [SUPER_ADMIN_STUB, ...managedUsers];
  const selectedUser = allUsers.find((u) => u.username === selectedUsername);

  const passwordsMatch =
    confirmPassword.length > 0 && newPassword === confirmPassword;
  const passwordsMismatch =
    confirmPassword.length > 0 && newPassword !== confirmPassword;

  const resetFields = () => {
    setNewPassword('');
    setConfirmPassword('');
    setShowNew(false);
    setShowConfirm(false);
    setFormError(null);
  };

  const handleUserChange = (username: string) => {
    setSelectedUsername(username);
    resetFields();
    setSuccessMsg(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMsg(null);

    if (!selectedUsername) {
      setFormError('Please select a user account.');
      return;
    }
    if (!newPassword.trim()) {
      setFormError('New password cannot be empty.');
      return;
    }
    if (newPassword.trim().length < 4) {
      setFormError('Password must be at least 4 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setFormError('Passwords do not match. Please re-enter and confirm.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const trimmed = newPassword.trim();
      const isBuiltIn =
        selectedUser && 'isBuiltIn' in selectedUser && selectedUser.isBuiltIn;

      if (isBuiltIn) {
        appendActivityLog(
          currentUser.username,
          'System Settings',
          'Change Password',
          'ADMIN_RESET_PASSWORD',
          'Admin initiated password change for root account "janabadmin". Note: root credentials are system-managed.'
        );
        setSuccessMsg(
          '"janabadmin" uses system-managed credentials. The action has been logged to the Audit Trail. Contact the system administrator to update root credentials.'
        );
      } else {
        const updated = managedUsers.map((u) =>
          u.username === selectedUsername ? { ...u, password: trimmed } : u
        );
        setManagedUsers(updated);
        saveStoredUsers(updated);
        appendActivityLog(
          currentUser.username,
          'System Settings',
          'Change Password',
          'ADMIN_RESET_PASSWORD',
          `Admin reset password for officer "${selectedUsername}" (${selectedUser?.fullName}). New credentials are immediately active.`
        );
        const msg = `Password updated successfully for "${selectedUsername}".`;
        showToast(msg);
        setSuccessMsg(msg);
      }
      resetFields();
      setIsSubmitting(false);
    }, 400);
  };

  if (!isAdmin) {
    return (
      <div className="bg-white border border-rose-200 rounded-2xl p-8 shadow-xs text-center max-w-xl mx-auto my-8">
        <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-200">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Restricted Access</h2>
        <p className="text-sm text-slate-600 mb-2">
          The <span className="font-semibold text-slate-800">Change Password</span> panel is restricted to{' '}
          <span className="font-bold text-amber-700">Janab (Super Admin)</span>.
        </p>
        <p className="text-xs text-slate-400">
          Logged in as: {currentUser.displayName} • {currentUser.role}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-2xl mx-auto">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-sky-950 text-white rounded-2xl p-6 shadow-xl border border-sky-300/20 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center shrink-0">
          <KeyRound className="w-6 h-6 text-sky-300" />
        </div>
        <div>
          <div className="flex items-center gap-2 text-sky-400 text-xs font-bold uppercase tracking-wider mb-0.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Super Admin Security Console</span>
          </div>
          <h2 className="text-xl font-black tracking-tight">Change Officer Password</h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Select any registered account and set a new password instantly.
          </p>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white border border-amber-200/60 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center gap-2">
          <User className="w-4 h-4 text-amber-600" />
          <h3 className="text-sm font-bold text-slate-900">Password Management</h3>
          <span className="ml-auto text-[11px] text-slate-400 font-medium">
            {allUsers.length} account{allUsers.length !== 1 ? 's' : ''} registered
          </span>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
          {/* User dropdown */}
          <div>
            <label
              htmlFor="cp-user-select"
              className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
            >
              Select User Account
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                id="cp-user-select"
                value={selectedUsername}
                onChange={(e) => handleUserChange(e.target.value)}
                className="w-full pl-10 pr-9 py-3 bg-white border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20 rounded-xl text-slate-900 text-sm font-medium outline-hidden appearance-none transition-all cursor-pointer"
              >
                <option value="" disabled>
                  Select a user account...
                </option>
                {allUsers.map((u) => (
                  <option key={u.username} value={u.username}>
                    {u.fullName} ({u.username}) — {'isBuiltIn' in u && u.isBuiltIn ? 'Super Admin' : u.department}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Selected user preview */}
          {selectedUser && (
            <div className="flex items-center gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl animate-in fade-in duration-150">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 font-black flex items-center justify-center text-sm shrink-0 border border-amber-200">
                {selectedUser.fullName.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="font-bold text-slate-900 text-sm flex items-center gap-2 flex-wrap">
                  {selectedUser.fullName}
                  {'isBuiltIn' in selectedUser && selectedUser.isBuiltIn && (
                    <span className="text-[10px] font-extrabold bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded-full border border-amber-300">
                      Super Admin
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500 font-mono">{selectedUser.username}</div>
                <div className="text-[11px] text-slate-400 truncate">{selectedUser.department}</div>
              </div>
            </div>
          )}

          {/* Password fields */}
          {selectedUsername && (
            <div className="space-y-4 pt-1">
              <div>
                <label
                  htmlFor="cp-new-password"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                >
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="cp-new-password"
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setFormError(null);
                    }}
                    placeholder="Enter new password"
                    autoComplete="new-password"
                    className="w-full pl-10 pr-11 py-3 bg-white border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20 rounded-xl text-slate-900 text-sm font-medium placeholder:text-slate-400 outline-hidden transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                    aria-label={showNew ? 'Hide password' : 'Show password'}
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="cp-confirm-password"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                >
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="cp-confirm-password"
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setFormError(null);
                    }}
                    placeholder="Re-enter new password"
                    autoComplete="new-password"
                    className={`w-full pl-10 pr-32 py-3 bg-white border rounded-xl text-slate-900 text-sm font-medium placeholder:text-slate-400 outline-hidden transition-all focus:ring-2 ${
                      passwordsMismatch
                        ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-300/20'
                        : passwordsMatch
                        ? 'border-emerald-400 focus:border-emerald-500 focus:ring-emerald-300/20'
                        : 'border-slate-300 focus:border-amber-500 focus:ring-amber-400/20'
                    }`}
                  />
                  {confirmPassword.length > 0 && (
                    <span
                      className={`absolute inset-y-0 right-11 flex items-center text-[11px] font-bold pointer-events-none ${
                        passwordsMatch ? 'text-emerald-600' : 'text-rose-500'
                      }`}
                    >
                      {passwordsMatch ? '✓ Match' : '✗ Mismatch'}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="mt-1.5 text-[11px] text-slate-400">
                  Minimum 4 characters. Changes take effect immediately.
                </p>
              </div>

              {formError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-semibold animate-in slide-in-from-top-1 duration-150">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {successMsg && (
                <div className="flex items-start gap-2 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold animate-in slide-in-from-top-1 duration-150">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div className="pt-1">
                <button
                  id="change-password-submit-btn"
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-amber-400 hover:bg-amber-500 active:bg-amber-600 text-slate-950 font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </div>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>Save New Password</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Info notice */}
      <div className="flex items-start gap-3 p-4 bg-amber-50/80 border border-amber-200/70 rounded-xl text-xs text-amber-900">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p>
          <span className="font-bold">Admin Override — </span>
          No current password is required for this action. All password resets are logged in the{' '}
          <span className="font-semibold">Central Activity Audit Trail</span> with a timestamp and take effect immediately.
        </p>
      </div>
    </div>
  );
};