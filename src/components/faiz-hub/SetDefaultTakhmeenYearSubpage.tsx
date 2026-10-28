import React, { useState } from 'react';
import {
  Calendar, CheckCircle2, ShieldCheck, Save, Clock,
  History, AlertCircle, Sparkles, Check
} from 'lucide-react';
import {
  DefaultTakhmeenYearConfig,
  getStoredDefaultYear,
  saveStoredDefaultYear
} from '../../utils/fmbPart1Data';
import { UserProfile } from '../../types';

interface Props {
  currentUser: UserProfile;
  showToast: (m: string) => void;
}

export const SetDefaultTakhmeenYearSubpage: React.FC<Props> = ({
  currentUser,
  showToast,
}) => {
  const [config, setConfig] = useState<DefaultTakhmeenYearConfig>(() => getStoredDefaultYear());
  const [selectedYear, setSelectedYear] = useState<string>(config.selectedYear);
  const [isDefault, setIsDefault] = useState<boolean>(config.isDefault);
  const [effectiveFrom, setEffectiveFrom] = useState<string>(config.effectiveFrom);
  const [effectiveTo, setEffectiveTo] = useState<string>(config.effectiveTo);
  const [remarks, setRemarks] = useState<string>(config.remarks);

  // Available Hijri financial cycles
  const hijriOptions = [
    { year: '1445-1446 Hijri', from: '1445-01-01', to: '1445-12-29', label: '1445-1446 (Past Concluded Cycle)' },
    { year: '1446-1447 Hijri', from: '1446-01-01', to: '1446-12-29', label: '1446-1447 (Previous Audit Cycle)' },
    { year: '1447-1448 Hijri', from: '1447-01-01', to: '1447-12-29', label: '1447-1448 (Current Active Cycle)' },
    { year: '1448-1449 Hijri', from: '1448-01-01', to: '1448-12-29', label: '1448-1449 (Upcoming Advance Cycle)' },
  ];

  const handleYearChange = (yr: string) => {
    setSelectedYear(yr);
    const match = hijriOptions.find(o => o.year === yr);
    if (match) {
      setEffectiveFrom(match.from);
      setEffectiveTo(match.to);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: DefaultTakhmeenYearConfig = {
      ...config,
      selectedYear,
      isDefault,
      effectiveFrom,
      effectiveTo,
      remarks,
      status: isDefault ? 'Active' : 'Archived',
      lastUpdated: new Date().toISOString().split('T')[0],
      updatedBy: currentUser.fullName || currentUser.username,
    };
    setConfig(updated);
    saveStoredDefaultYear(updated);
    showToast(`Default Takhmeen Year successfully updated to ${selectedYear}`);
  };

  return (
    <div className="space-y-6">
      {/* ── Banner Card ── */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300/60 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500 text-slate-950 shadow-xs">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              Set Default Takhmeen Year
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Designate the active fiscal cycle across all FMB Takhmeen forms, pledge ledgers, and receipts [cite: 25]
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
          <ShieldCheck className="w-4 h-4 text-emerald-700" />
          <span className="text-xs font-bold text-emerald-800">
            Current Default: {config.selectedYear}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Column */}
        <div className="lg:col-span-2 bg-white border border-amber-300/60 rounded-2xl p-6 shadow-xs">
          <form onSubmit={handleSave} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800">
                Select Hijri Takhmeen Cycle <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedYear}
                onChange={(e) => handleYearChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
              >
                {hijriOptions.map(opt => (
                  <option key={opt.year} value={opt.year}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500">
                All member takhmeen cards and installment dues default to this cycle.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Effective From (Hijri Date)
                </label>
                <input
                  type="text"
                  value={effectiveFrom}
                  onChange={(e) => setEffectiveFrom(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono font-medium text-slate-800"
                  placeholder="e.g. 1447-01-01"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Effective To (Hijri Date)
                </label>
                <input
                  type="text"
                  value={effectiveTo}
                  onChange={(e) => setEffectiveTo(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono font-medium text-slate-800"
                  placeholder="e.g. 1447-12-29"
                />
              </div>
            </div>

            {/* Set as Default Checkbox */}
            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 flex items-start gap-3">
              <input
                type="checkbox"
                id="isDefaultYear"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded border-amber-400 text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
              <label htmlFor="isDefaultYear" className="cursor-pointer select-none">
                <span className="text-xs font-bold text-slate-900 block">
                  Set As Default Takhmeen Year [cite: 25]
                </span>
                <span className="text-[11px] text-slate-600 block mt-0.5">
                  When enabled, this cycle is locked as the universal baseline for all new pledges, automatic installment calculation, and daily counter collection receipts.
                </span>
              </label>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Resolution & Approval Remarks
              </label>
              <textarea
                rows={3}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter administrative committee resolution notes..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Configuration</span>
              </button>
            </div>
          </form>
        </div>

        {/* Audit & Historical Cycles Column */}
        <div className="space-y-4">
          <div className="bg-white border border-amber-300/60 rounded-2xl p-5 shadow-xs space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-amber-600" />
              <span>Current Status & Audit</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Active Year:</span>
                <span className="font-bold text-slate-900">{config.selectedYear}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Is Default:</span>
                <span className="font-bold text-emerald-700 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Yes
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Last Modified:</span>
                <span className="font-mono text-slate-700">{config.lastUpdated}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Authorized Officer:</span>
                <span className="font-semibold text-slate-800 truncate max-w-[140px]">{config.updatedBy}</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200 rounded-2xl p-4 text-xs space-y-2">
            <h4 className="font-bold text-amber-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
              <span>Community Protocol</span>
            </h4>
            <p className="text-[11px] text-slate-700 leading-relaxed">
              In accordance with Dawat-e-Hadiyah financial guidelines, the default Takhmeen Year is formally announced during Lailatul Qadr Mubarak and carries forward until the end of Shabaan al-Kareem.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
