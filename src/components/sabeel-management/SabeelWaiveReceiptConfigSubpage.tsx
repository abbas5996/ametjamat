import React, { useState } from 'react';
import {
  FileCheck2, Sliders, Search, Save, AlertCircle, CheckCircle2, RotateCcw,
  Receipt, ArrowRight, ShieldCheck, History, X
} from 'lucide-react';
import { SabeelLedgerRecord, HeadOfFamily, UserProfile } from '../../types';
import {
  SabeelWaiverRecord, SabeelReceiptConfig, saveSabeelWaivers, saveSabeelReceiptConfig,
  saveStoredSabeelLedger
} from '../../utils/sabeelProductionSuite';

interface SabeelWaiveReceiptConfigSubpageProps {
  ledger: SabeelLedgerRecord[];
  setLedger: React.Dispatch<React.SetStateAction<SabeelLedgerRecord[]>>;
  waivers: SabeelWaiverRecord[];
  setWaivers: React.Dispatch<React.SetStateAction<SabeelWaiverRecord[]>>;
  receiptConfig: SabeelReceiptConfig;
  setReceiptConfig: React.Dispatch<React.SetStateAction<SabeelReceiptConfig>>;
  hofs: HeadOfFamily[];
  currentUser: UserProfile;
  showToast: (msg: string) => void;
  onBack: () => void;
}

const fmtINR = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export const SabeelWaiveReceiptConfigSubpage: React.FC<SabeelWaiveReceiptConfigSubpageProps> = ({
  ledger,
  setLedger,
  waivers,
  setWaivers,
  receiptConfig,
  setReceiptConfig,
  hofs,
  currentUser,
  showToast,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<'waive_off' | 'receipt_config'>('waive_off');

  // Waiver Search & Form State
  const [waiverSearchQuery, setWaiverSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<SabeelLedgerRecord | null>(null);
  const [waiveAmount, setWaiveAmount] = useState<number>(5000);
  const [waiverReason, setWaiverReason] = useState('');
  const [approvalRef, setApprovalRef] = useState(`RAZA-WAV-1447-${Math.floor(100 + Math.random() * 900)}`);
  const [authorizedBy, setAuthorizedBy] = useState('Janab Amil Saheb');

  // Receipt Config local form state
  const [configState, setConfigState] = useState<SabeelReceiptConfig>({ ...receiptConfig });

  const handleSearchWaiverMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!waiverSearchQuery.trim()) return;
    const q = waiverSearchQuery.trim().toLowerCase();
    const found = ledger.find(
      r =>
        (r.itsNumber || '').toLowerCase() === q ||
        (r.sabeelNumber || r.sabeelNo || '').toLowerCase() === q
    );
    if (found) {
      setSelectedMember(found);
      const due = Math.max(0, (found.annualPledged || 24000) - (found.totalPaid || 0));
      setWaiveAmount(Math.min(5000, due));
      showToast(`Selected member: ${found.hofName || found.memberName}`);
    } else {
      setSelectedMember(null);
      showToast('No active Sabeel found matching your query');
    }
  };

  const handleApplyWaiver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    const originalDue = Math.max(0, (selectedMember.annualPledged || 24000) - (selectedMember.totalPaid || 0));
    if (waiveAmount <= 0 || waiveAmount > originalDue) {
      showToast('Waiver amount must be greater than 0 and less than or equal to current balance due');
      return;
    }
    if (!waiverReason.trim()) {
      showToast('Please state a reason/justification for this waiver');
      return;
    }

    const remainingDue = originalDue - waiveAmount;
    const waiverRecord: SabeelWaiverRecord = {
      id: `WVR-${Date.now().toString().slice(-4)}`,
      waiverCode: `WAV-1447-${Math.floor(1000 + Math.random() * 9000)}`,
      sabeelNo: selectedMember.sabeelNumber || selectedMember.sabeelNo || '—',
      itsNumber: selectedMember.itsNumber,
      fullName: selectedMember.hofName || selectedMember.memberName || '—',
      originalDue,
      waivedAmount: Number(waiveAmount),
      remainingDue,
      waiverDate: new Date().toISOString().split('T')[0],
      reason: waiverReason.trim(),
      authorizedBy,
      approvalReference: approvalRef.trim(),
    };

    // Adjust ledger: Reduce annual pledge or increase credited waiver
    const updatedLedger = ledger.map(r =>
      r.id === selectedMember.id || r.itsNumber === selectedMember.itsNumber
        ? {
            ...r,
            annualPledged: Math.max(0, (r.annualPledged || 24000) - waiveAmount),
            totalAllocated: Math.max(0, (r.totalAllocated || 24000) - waiveAmount),
          }
        : r
    );

    const updatedWaivers = [waiverRecord, ...waivers];
    setLedger(updatedLedger);
    saveStoredSabeelLedger(updatedLedger);
    setWaivers(updatedWaivers);
    saveSabeelWaivers(updatedWaivers);

    showToast(`Successfully granted Sabeel waiver of ${fmtINR(waiveAmount)} under Raza: ${approvalRef}`);
    setSelectedMember(null);
    setWaiverSearchQuery('');
    setWaiverReason('');
  };

  const handleSaveReceiptConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setReceiptConfig(configState);
    saveSabeelReceiptConfig(configState);
    showToast('Receipt presentation settings updated and saved!');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Tabs */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Sliders className="w-5 h-5 text-amber-600" />
              <span>Sabeel Waive Off & Receipt Visibility Config</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Execute approved financial relief concessions (Waive Off) and configure public print receipts display preferences.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('waive_off')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'waive_off'
                  ? 'bg-amber-400 text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>1. Sabeel Waive Off</span>
            </button>
            <button
              onClick={() => setActiveTab('receipt_config')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'receipt_config'
                  ? 'bg-amber-400 text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>2. Show Details on Receipt</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab 1: Sabeel Waive Off */}
      {activeTab === 'waive_off' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Waiver Form Area */}
          <div className="lg:col-span-2 space-y-5">
            {/* Search Box */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <form onSubmit={handleSearchWaiverMember} className="space-y-3">
                <label className="block text-xs font-bold text-slate-700">
                  Search Member for Sabeel Waive Off:
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Enter ITS Number or Sabeel No..."
                      value={waiverSearchQuery}
                      onChange={e => setWaiverSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-amber-500 font-bold"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Search className="w-4 h-4" />
                    <span>Search</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Waiver Form */}
            {selectedMember ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
                <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-200 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-black text-slate-900 text-sm">
                      {selectedMember.hofName || selectedMember.memberName}
                    </div>
                    <div className="text-slate-600 mt-0.5">
                      ITS: <span className="font-bold">{selectedMember.itsNumber}</span> • 
                      Sabeel No: <span className="font-bold text-blue-700">{selectedMember.sabeelNumber || selectedMember.sabeelNo || '—'}</span> • 
                      Mohallah: <span className="font-bold">{selectedMember.mohallah || '—'}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Current Balance Due:</span>
                    <span className="text-base font-black text-rose-600 block mt-0.5">
                      {fmtINR(Math.max(0, (selectedMember.annualPledged || 24000) - (selectedMember.totalPaid || 0)))}
                    </span>
                  </div>
                </div>

                <form onSubmit={handleApplyWaiver} className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-600 font-bold mb-1">Waived Amount (₹) *</label>
                      <input
                        type="number"
                        required
                        min="1"
                        max={Math.max(0, (selectedMember.annualPledged || 24000) - (selectedMember.totalPaid || 0))}
                        step="500"
                        value={waiveAmount}
                        onChange={e => setWaiveAmount(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 font-black text-rose-600 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-bold mb-1">Remaining Due After Waiver</label>
                      <input
                        type="text"
                        disabled
                        value={fmtINR(Math.max(0, (selectedMember.annualPledged || 24000) - (selectedMember.totalPaid || 0) - waiveAmount))}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-black text-slate-700 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-bold mb-1">Approval Reference / Raza Code *</label>
                      <input
                        type="text"
                        required
                        value={approvalRef}
                        onChange={e => setApprovalRef(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 font-bold text-amber-800"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-bold mb-1">Authorized By</label>
                      <select
                        value={authorizedBy}
                        onChange={e => setAuthorizedBy(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 bg-white cursor-pointer font-medium"
                      >
                        <option value="Janab Amil Saheb">Janab Amil Saheb (Direct Raza)</option>
                        <option value="Executive Committee">Executive Committee</option>
                        <option value="Secretary Saheb">Jamaat Secretary Saheb</option>
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-slate-600 font-bold mb-1">Justification Reason *</label>
                      <textarea
                        rows={2}
                        required
                        placeholder="State financial hardship, medical distress, or official Jamaat committee resolution rationale..."
                        value={waiverReason}
                        onChange={e => setWaiverReason(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 resize-none font-medium"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedMember(null)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Grant & Record Waiver</span>
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-xs">
                Search for an active Sabeel account above to execute a formal waiver.
              </div>
            )}
          </div>

          {/* Waiver History Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-amber-600" />
                <span>Granted Waivers Log</span>
              </h2>
              <span className="text-[10px] text-slate-500 font-bold">{waivers.length} records</span>
            </div>

            <div className="divide-y divide-slate-100 overflow-y-auto max-h-[500px] p-3 text-xs">
              {waivers.map(w => (
                <div key={w.id} className="p-3 hover:bg-slate-50 rounded-xl transition-colors space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{w.fullName}</span>
                    <span className="font-black text-rose-600">{fmtINR(w.waivedAmount)}</span>
                  </div>
                  <div className="text-[11px] text-slate-600">
                    ITS: {w.itsNumber} • Sabeel: {w.sabeelNo} • {w.waiverDate}
                  </div>
                  <div className="text-[10px] text-slate-400 italic">"{w.reason}"</div>
                  <div className="text-[10px] text-amber-800 font-bold">Raza Ref: {w.approvalReference}</div>
                </div>
              ))}
              {waivers.length === 0 && (
                <div className="p-8 text-center text-slate-400">
                  No waivers recorded in this cycle.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Show Details on Receipt Config */}
      {activeTab === 'receipt_config' && (
        <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-amber-600" />
                <span>Receipt Presentation Configuration</span>
              </h2>
              <p className="text-[11px] text-slate-500">Configure what details appear on printed and digital Sabeel receipts</p>
            </div>
            <button
              onClick={onBack}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
            >
              Back
            </button>
          </div>

          <form onSubmit={handleSaveReceiptConfig} className="p-6 space-y-6 text-xs">
            {/* Module Name Selector */}
            <div>
              <label className="block text-slate-700 font-bold mb-1">Module Name Selector</label>
              <select
                value={configState.moduleName}
                onChange={e => setConfigState({ ...configState, moduleName: e.target.value })}
                className="w-full max-w-sm px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 bg-white font-bold cursor-pointer"
              >
                <option value="Sabeel Management">Sabeel Management (Sabeel Mubarak)</option>
                <option value="Faizul Mawaidil Burhaniyah">Faizul Mawaidil Burhaniyah (FMB Hub)</option>
                <option value="General Jamaat Accounts">General Jamaat Accounts</option>
              </select>
            </div>

            {/* Toggle Grid */}
            <div className="border border-slate-200 rounded-xl p-5 space-y-4 bg-slate-50/50">
              <span className="text-xs font-bold text-slate-700 uppercase block tracking-wider">
                Receipt Field Visibility Toggles
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { key: 'showHofName', label: 'Show Head of Family (HOF) Name' },
                  { key: 'showItsNumber', label: 'Show 8-Digit ITS Number' },
                  { key: 'showSabeelNumber', label: 'Show Sabeel Number' },
                  { key: 'showMohalla', label: 'Show Mohallah Name' },
                  { key: 'showSabeelGrade', label: 'Show Sabeel Grade (Grade A+, A, etc.)' },
                  { key: 'showBalanceDue', label: 'Show Remaining Balance Due' },
                  { key: 'showHijriYear', label: 'Show Hijri Year (e.g. 1447 H)' },
                  { key: 'showQrCode', label: 'Show Verification QR Code' },
                  { key: 'showDuaFooter', label: 'Show Dai al-Mutlaq Dua Mubarak Footer' },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                    <span className="font-semibold text-slate-800">{label}</span>
                    <input
                      type="checkbox"
                      checked={(configState as any)[key]}
                      onChange={e => setConfigState({ ...configState, [key]: e.target.checked })}
                      className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300 cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Header & Footer */}
            <div className="space-y-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Custom Receipt Header</label>
                <input
                  type="text"
                  value={configState.customHeader}
                  onChange={e => setConfigState({ ...configState, customHeader: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Custom Receipt Footer / Dua</label>
                <textarea
                  rows={2}
                  value={configState.customFooter}
                  onChange={e => setConfigState({ ...configState, customFooter: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 resize-none font-medium"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={onBack}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Receipt Configuration</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
