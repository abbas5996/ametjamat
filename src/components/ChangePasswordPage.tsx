import React, { useState } from 'react';
import {
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Info,
} from 'lucide-react';
import { UserProfile } from '../types';
import { isJanabUser, resetJanabPassword } from '../utils/auth';

interface ChangePasswordPageProps {
  currentUser: UserProfile;
  showToast: (message: string) => void;
}

export const ChangePasswordPage: React.FC<ChangePasswordPageProps> = ({
  currentUser,
  showToast,
}) => {
  const authorizedJanab = isJanabUser(currentUser);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordsMatch =
    confirmPassword.length > 0 && newPassword === confirmPassword;
  const passwordsMismatch =
    confirmPassword.length > 0 && newPassword !== confirmPassword;

  const resetFields = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMsg(null);

    setIsSubmitting(true);
    setTimeout(() => {
      const result = resetJanabPassword({
        currentUser,
        currentPassword,
        newPassword,
        confirmPassword,
      });

      setIsSubmitting(false);
      if (!result.ok) {
        setFormError(result.error || 'Failed to update Janab password.');
        return;
      }

      const msg = result.message || 'Janab password updated successfully.';
      setSuccessMsg(msg);
      showToast(msg);
      resetFields();
    }, 300);
  };

  if (!authorizedJanab) {
    return (
      <div className="bg-white border border-rose-200 rounded-2xl p-8 shadow-xs text-center max-w-xl mx-auto my-8">
        <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-200">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Restricted Access</h2>
        <p className="text-sm text-slate-600 mb-2">
          Password reset is restricted exclusively to <span className="font-bold text-amber-700">Janab (Super Admin)</span>.
        </p>
        <p className="text-xs text-slate-400">
          Active Account: {currentUser.displayName || 'Unknown'} &bull; {currentUser.role || 'None'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-2xl mx-auto">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-sky-950 text-white rounded-2xl p-6 shadow-xl border border-sky-300/20 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center shrink-0">
          <KeyRound className="w-6 h-6 text-amber-300" />
        </div>
        <div>
          <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider mb-0.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Janab Exclusive Security Console</span>
          </div>
          <h2 className="text-xl font-black tracking-tight">Janab Password Reset</h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Update credentials for the single authorized Janab account (@{currentUser.username}).
          </p>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white border border-amber-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-400 text-slate-950 font-black flex items-center justify-center text-xs shadow-2xs">
              JA
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">{currentUser.displayName}</p>
              <p className="text-[11px] text-slate-500 font-mono">
                @{currentUser.username} &bull; ITS {currentUser.itsNumber}
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
            Super Admin Only
          </span>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
          {/* Current Password */}
          <div>
            <label
              htmlFor="cp-current-password"
              className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
            >
              Current Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="cp-current-password"
                type={showCurrent ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  setFormError(null);
                  setSuccessMsg(null);
                }}
                placeholder="Enter your current password"
                className="w-full pl-10 pr-11 py-3 bg-white border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20 rounded-xl text-slate-900 text-sm font-medium outline-hidden transition-all"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-700 cursor-pointer"
                aria-label={showCurrent ? 'Hide current password' : 'Show current password'}
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label
              htmlFor="cp-new-password"
              className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
            >
              New Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="cp-new-password"
                type={showNew ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setFormError(null);
                  setSuccessMsg(null);
                }}
                placeholder="Enter new password (min 6 characters)"
                className="w-full pl-10 pr-11 py-3 bg-white border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20 rounded-xl text-slate-900 text-sm font-medium placeholder:text-slate-400 outline-hidden transition-all"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                aria-label={showNew ? 'Hide new password' : 'Show new password'}
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label
              htmlFor="cp-confirm-password"
              className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
            >
              Confirm New Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="cp-confirm-password"
                type={showConfirm ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setFormError(null);
                  setSuccessMsg(null);
                }}
                placeholder="Re-enter new password"
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
                    passwordsMatch ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {passwordsMatch ? 'Match' : 'Mismatch'}
                </span>
              )}
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="mt-1.5 text-[11px] text-slate-500">
              Minimum 6 characters. Changes take effect immediately for subsequent sign-ins.
            </p>
          </div>

          {formError && (
            <div
              role="alert"
              className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-semibold animate-in slide-in-from-top-1 duration-150"
            >
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
                  <span>Updating Password...</span>
                </div>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Update Janab Password</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Info Notice */}
      <div className="flex items-start gap-3 p-4 bg-amber-50/80 border border-amber-200/70 rounded-xl text-xs text-amber-900">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p>
          <span className="font-bold">Strict Verification — </span>
          Your current password is verified before updating credentials. Once changed, your previous
          password is immediately invalidated and the event is logged in the{' '}
          <span className="font-semibold">Central Activity Audit Trail</span>.
        </p>
      </div>
    </div>
  );
};
