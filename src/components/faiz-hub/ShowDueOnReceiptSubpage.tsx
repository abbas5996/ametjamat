import React, { useState } from 'react';
import {
  Receipt, Save, Sliders, CheckCircle2, Eye, QrCode,
  Sparkles, FileText, Utensils, AlertTriangle, ShieldCheck
} from 'lucide-react';
import {
  ShowDueOnReceiptConfig,
  getStoredShowDueConfig,
  saveStoredShowDueConfig
} from '../../utils/fmbPart1Data';
import { UserProfile } from '../../types';

interface Props {
  currentUser: UserProfile;
  showToast: (m: string) => void;
}

export const ShowDueOnReceiptSubpage: React.FC<Props> = ({
  currentUser,
  showToast,
}) => {
  const [config, setConfig] = useState<ShowDueOnReceiptConfig>(() => getStoredShowDueConfig());

  // Local editable toggle state
  const [showPreviousDues, setShowPreviousDues] = useState(config.showPreviousDuesOnReceipt);
  const [showCurrentPending, setShowCurrentPending] = useState(config.showCurrentYearPendingBalance);
  const [showDuesOnForm, setShowDuesOnForm] = useState(config.showDuesOnTakhmeenForm);
  const [showThaaliNo, setShowThaaliNo] = useState(config.showThaaliNumber);
  const [showSabeelNo, setShowSabeelNo] = useState(config.showSabeelNumber);
  const [showQrCode, setShowQrCode] = useState(config.showItsQrCode);
  const [includeSabeelDues, setIncludeSabeelDues] = useState(config.includeSabeelDuesInNotice);
  const [showInstallments, setShowInstallments] = useState(config.showInstallmentBreakdownOnTakhmeen);
  const [footerNote, setFooterNote] = useState(config.customFooterNote);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: ShowDueOnReceiptConfig = {
      ...config,
      showPreviousDuesOnReceipt: showPreviousDues,
      showCurrentYearPendingBalance: showCurrentPending,
      showDuesOnTakhmeenForm: showDuesOnForm,
      showThaaliNumber: showThaaliNo,
      showSabeelNumber: showSabeelNo,
      showItsQrCode: showQrCode,
      includeSabeelDuesInNotice: includeSabeelDues,
      showInstallmentBreakdownOnTakhmeen: showInstallments,
      customFooterNote: footerNote,
      lastUpdated: new Date().toISOString().split('T')[0],
    };
    setConfig(updated);
    saveStoredShowDueConfig(updated);
    showToast('Receipt & Takhmeen form display settings saved successfully.');
  };

  return (
    <div className="space-y-6">
      {/* ── Banner Card ── */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300/60 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500 text-slate-950 shadow-xs">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              Show Due on Receipt & Takhmeen Configuration
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Control visibility of outstanding balances, previous arrears, and community identifiers on counter receipts [cite: 27]
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-amber-100/80 border border-amber-200 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-950">
          <ShieldCheck className="w-4 h-4 text-amber-700" />
          <span>Receipt Layout Version 2.4</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Settings Form Column */}
        <div className="lg:col-span-7 bg-white border border-amber-300/60 rounded-2xl p-6 shadow-xs space-y-6">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Receipt & Form Visibility Toggles</h3>
            <p className="text-xs text-slate-500 mt-0.5">Toggle each indicator on or off for physical thermal printouts and PDF vouchers.</p>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="divide-y divide-slate-100">
              {/* Toggle 1 */}
              <div className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs text-slate-900 block">Show Current Year Pending Balance on Receipt</span>
                  <span className="text-[11px] text-slate-500">Prints current remaining pledge balance at the foot of the receipt</span>
                </div>
                <input
                  type="checkbox"
                  checked={showCurrentPending}
                  onChange={(e) => setShowCurrentPending(e.target.checked)}
                  className="w-4 h-4 rounded border-amber-400 text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
              </div>

              {/* Toggle 2 */}
              <div className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs text-slate-900 block">Show Previous Years Arrears / Dues</span>
                  <span className="text-[11px] text-slate-500">Includes historical unsettled balances from past Hijri years</span>
                </div>
                <input
                  type="checkbox"
                  checked={showPreviousDues}
                  onChange={(e) => setShowPreviousDues(e.target.checked)}
                  className="w-4 h-4 rounded border-amber-400 text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
              </div>

              {/* Toggle 3 */}
              <div className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs text-slate-900 block">Show Outstanding Dues on Takhmeen Form [cite: 27]</span>
                  <span className="text-[11px] text-slate-500">Pre-prints pending dues on annual pledge registration forms</span>
                </div>
                <input
                  type="checkbox"
                  checked={showDuesOnForm}
                  onChange={(e) => setShowDuesOnForm(e.target.checked)}
                  className="w-4 h-4 rounded border-amber-400 text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
              </div>

              {/* Toggle 4 */}
              <div className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs text-slate-900 block">Show Thaali Number on Receipt</span>
                  <span className="text-[11px] text-slate-500">Displays kitchen delivery code e.g. &ldquo;TH-084&rdquo; in bold header badge</span>
                </div>
                <input
                  type="checkbox"
                  checked={showThaaliNo}
                  onChange={(e) => setShowThaaliNo(e.target.checked)}
                  className="w-4 h-4 rounded border-amber-400 text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
              </div>

              {/* Toggle 5 */}
              <div className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs text-slate-900 block">Show Sabeel Number on Receipt</span>
                  <span className="text-[11px] text-slate-500">Cross-references household Sabeel ID e.g. &ldquo;SAB-101&rdquo;</span>
                </div>
                <input
                  type="checkbox"
                  checked={showSabeelNo}
                  onChange={(e) => setShowSabeelNo(e.target.checked)}
                  className="w-4 h-4 rounded border-amber-400 text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
              </div>

              {/* Toggle 6 */}
              <div className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs text-slate-900 block">Show ITS Quick Verification QR Code</span>
                  <span className="text-[11px] text-slate-500">Renders digital scan QR for instant Jamaat counter verification</span>
                </div>
                <input
                  type="checkbox"
                  checked={showQrCode}
                  onChange={(e) => setShowQrCode(e.target.checked)}
                  className="w-4 h-4 rounded border-amber-400 text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
              </div>

              {/* Toggle 7 */}
              <div className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs text-slate-900 block">Include Cross-Module Sabeel Dues Notice</span>
                  <span className="text-[11px] text-slate-500">Prints an alert if Sabeel fund has overdue quarters</span>
                </div>
                <input
                  type="checkbox"
                  checked={includeSabeelDues}
                  onChange={(e) => setIncludeSabeelDues(e.target.checked)}
                  className="w-4 h-4 rounded border-amber-400 text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
              </div>

              {/* Toggle 8 */}
              <div className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs text-slate-900 block">Show Installment Schedule Breakdown on Takhmeen</span>
                  <span className="text-[11px] text-slate-500">Prints milestone table (Lailatul Qadr, Shawwal, Zilqaad, etc.) on forms</span>
                </div>
                <input
                  type="checkbox"
                  checked={showInstallments}
                  onChange={(e) => setShowInstallments(e.target.checked)}
                  className="w-4 h-4 rounded border-amber-400 text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-bold text-slate-700">Custom Footer Reminder Note</label>
              <textarea
                rows={2}
                value={footerNote}
                onChange={(e) => setFooterNote(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:ring-2 focus:ring-amber-500 outline-none"
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

        {/* Live Interactive Receipt Preview Column */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-amber-600" />
              <span>Real-Time Receipt Preview</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Dynamic Rendering</span>
          </div>

          {/* Authentic Dawoodi Bohra Receipt Layout Card */}
          <div className="bg-amber-50/40 border-2 border-dashed border-amber-300 rounded-2xl p-5 shadow-xs space-y-4 text-xs font-sans text-slate-800 relative">
            {/* Header */}
            <div className="text-center space-y-1 border-b border-amber-200/80 pb-3">
              <p className="font-serif text-sm font-bold text-amber-950">
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </p>
              <h4 className="font-extrabold text-sm text-slate-900 tracking-tight uppercase">
                Anjuman-e-Burhani
              </h4>
              <p className="font-bold text-amber-900 text-[11px]">
                Faiz ul Mawaidil Burhaniyah — Kitchen Receipt
              </p>
              <div className="flex justify-center items-center gap-2 text-[10px] font-mono text-slate-500 mt-1">
                <span>REC # FMB-HUB-1447-02001</span>
                <span>•</span>
                <span>Date: 1447-02-15</span>
              </div>
            </div>

            {/* Member Details */}
            <div className="space-y-1.5 py-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Mumin Name:</span>
                <span className="font-bold text-slate-900">Mulla Shabbir Bhai Fakhri</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ITS Number:</span>
                <span className="font-mono font-bold text-slate-900">30489122</span>
              </div>

              {showSabeelNo && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Sabeel No:</span>
                  <span className="font-mono font-bold text-amber-900">SAB-101</span>
                </div>
              )}

              {showThaaliNo && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Thaali No:</span>
                  <span className="font-mono font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded">
                    TH-084 (Active)
                  </span>
                </div>
              )}
            </div>

            {/* Amount Received Box */}
            <div className="bg-white border border-amber-200 rounded-xl p-3 flex justify-between items-center shadow-2xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Amount Received</span>
                <span className="text-lg font-black text-emerald-700">₹25,000</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                Payment: Bank Transfer
              </span>
            </div>

            {/* Dues Section */}
            <div className="space-y-1 text-[11px] pt-1">
              <div className="flex justify-between text-slate-600">
                <span>Annual Takhmeen Committed:</span>
                <span className="font-medium">₹52,000</span>
              </div>

              {showCurrentPending && (
                <div className="flex justify-between text-slate-800 font-bold border-t border-slate-200 pt-1">
                  <span>Current Year Balance Pending:</span>
                  <span className="text-rose-700">₹17,000</span>
                </div>
              )}

              {showPreviousDues && (
                <div className="flex justify-between text-rose-700 font-bold">
                  <span>Previous Year Arrears:</span>
                  <span>₹0.00</span>
                </div>
              )}

              {includeSabeelDues && (
                <div className="mt-2 p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[10px]">
                  <strong>Notice:</strong> Sabeel account has pending dues of ₹4,500. Please contact Sabeel counter.
                </div>
              )}
            </div>

            {/* QR Code and Footer */}
            <div className="border-t border-amber-200 pt-3 flex items-center justify-between">
              {showQrCode ? (
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 border border-slate-300 rounded bg-white flex items-center justify-center p-1">
                    <QrCode className="w-8 h-8 text-slate-800" />
                  </div>
                  <span className="text-[9px] text-slate-500 font-mono">Scan for ITS Auth</span>
                </div>
              ) : (
                <span className="text-[10px] text-slate-400 italic">QR code disabled</span>
              )}
              <div className="text-right text-[10px] text-slate-500">
                <span>Cashier: Janab Admin</span>
              </div>
            </div>

            {footerNote && (
              <p className="text-[10px] text-center text-slate-600 italic border-t border-slate-200/60 pt-2">
                &ldquo;{footerNote}&rdquo;
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
