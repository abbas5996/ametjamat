import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Clock,
  Lock,
  Search,
  Filter,
  CheckCircle2,
  Ban,
} from 'lucide-react';
import { UserProfile, ActivityLogEntry } from '../types';
import { getStoredActivityLogs } from '../utils/rbac';
import { isJanabUser } from '../utils/auth';

interface RolesPermissionsModuleProps {
  currentUser: UserProfile;
  onUserDatabaseUpdated?: () => void;
  showToast: (message: string) => void;
}

export const RolesPermissionsModule: React.FC<RolesPermissionsModuleProps> = ({
  currentUser,
}) => {
  const authorizedJanab = isJanabUser(currentUser);
  const [activityLogs] = useState<ActivityLogEntry[]>(() => getStoredActivityLogs());
  const [searchQuery, setSearchQuery] = useState('');
  const [logFilterAction, setLogFilterAction] = useState<string>('ALL');

  const filteredLogs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return activityLogs.filter((log) => {
      if (logFilterAction !== 'ALL' && log.actionType !== logFilterAction) return false;
      if (!q) return true;
      return (
        log.username.toLowerCase().includes(q) ||
        log.department.toLowerCase().includes(q) ||
        log.subpage.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q)
      );
    });
  }, [activityLogs, searchQuery, logFilterAction]);

  if (!authorizedJanab) {
    return (
      <div className="bg-white border border-rose-200 rounded-2xl p-8 shadow-sm text-center max-w-xl mx-auto my-8">
        <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-200">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Restricted Access</h2>
        <p className="text-sm text-slate-600 mb-4">
          Security &amp; Access Control is strictly restricted to{' '}
          <span className="font-bold text-amber-700">Janab (Super Admin)</span>.
        </p>
        <p className="text-xs text-slate-400">
          Active session: {currentUser.displayName || 'Unknown'} &bull; {currentUser.role || 'None'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Security Console Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-sky-950 text-white rounded-2xl p-6 shadow-xl border border-amber-300/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Janab Exclusive Authentication Active</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Access Control &amp; Security Audit
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Simplified single-authority access policy. Login, Logout, and Password Reset are
            restricted exclusively to Janab Amil Saheb with public sign-up disabled.
          </p>
        </div>

        <div className="bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-xs space-y-1 shrink-0">
          <div className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
            Authorized Operator
          </div>
          <div className="font-black text-white">{currentUser.displayName}</div>
          <div className="font-mono text-slate-300">
            @{currentUser.username} &bull; ITS {currentUser.itsNumber}
          </div>
        </div>
      </div>

      {/* Security Policy Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-emerald-200 rounded-xl p-4 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Janab Sole Login</span>
          </div>
          <p className="text-sm font-black text-slate-900">Active (@{currentUser.username})</p>
          <p className="text-xs text-slate-500">
            Full administrative authority across all Jamaat ERP ledgers, reports, and system settings.
          </p>
        </div>

        <div className="bg-white border border-amber-200 rounded-xl p-4 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-amber-900 text-xs font-bold uppercase tracking-wider">
            <Ban className="w-4 h-4 text-amber-700" />
            <span>Public Sign-Up</span>
          </div>
          <p className="text-sm font-black text-slate-900">Disabled</p>
          <p className="text-xs text-slate-500">
            Self-registration and general department login creation are permanently disabled.
          </p>
        </div>

        <div className="bg-white border border-blue-200 rounded-xl p-4 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-blue-900 text-xs font-bold uppercase tracking-wider">
            <Lock className="w-4 h-4 text-blue-700" />
            <span>Password Reset</span>
          </div>
          <p className="text-sm font-black text-slate-900">Authenticated Janab Only</p>
          <p className="text-xs text-slate-500">
            Credential updates require verifying the active Janab password inside System Settings.
          </p>
        </div>
      </div>

      {/* Central Activity & Audit Log */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Central Security &amp; Activity Audit Log ({filteredLogs.length})</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Immutable ledger of authenticated Janab logins, password updates, and record changes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search audit entries..."
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-amber-500 outline-none w-48"
              />
            </div>

            <div className="flex items-center space-x-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={logFilterAction}
                onChange={(e) => setLogFilterAction(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 outline-none cursor-pointer"
              >
                <option value="ALL">All Actions</option>
                <option value="ADD">Add Records</option>
                <option value="EDIT">Edit Records</option>
                <option value="DELETE">Delete Records</option>
                <option value="PAYMENT">Payments</option>
                <option value="CANCEL_RECEIPT">Cancellations</option>
                <option value="ADMIN_RESET_PASSWORD">Password Resets</option>
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <p className="font-semibold text-slate-700">No matching audit entries found</p>
              <p className="mt-1 text-slate-400">Try clearing the search query or action filter.</p>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const isAdd = log.actionType === 'ADD' || log.actionType === 'CREATED_USER';
              const isEdit =
                log.actionType === 'EDIT' ||
                log.actionType === 'UPDATED_PERMISSIONS' ||
                log.actionType === 'ADMIN_RESET_PASSWORD';
              const isDelete =
                log.actionType === 'DELETE' ||
                log.actionType === 'DELETED_USER' ||
                log.actionType === 'CANCEL_RECEIPT';

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
                      <div className="flex flex-wrap items-center gap-x-2">
                        <span className="font-bold text-slate-900 font-mono">@{log.username}</span>
                        <span className="text-slate-400">&bull;</span>
                        <span className="text-slate-600 font-semibold">{log.department}</span>
                        {log.subpage && (
                          <>
                            <span className="text-slate-400">/</span>
                            <span className="text-slate-500">{log.subpage}</span>
                          </>
                        )}
                      </div>
                      <p className="text-slate-700 mt-0.5 leading-relaxed font-medium">
                        {log.details}
                      </p>
                    </div>
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 shrink-0 sm:text-right pl-10 sm:pl-0">
                    {log.timestamp}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
