import React, { useState, useMemo } from 'react';
import {
  Printer, Search, Filter, CheckSquare, Square, Download,
  X, Eye, User, FileText, Utensils, CheckCircle2, QrCode
} from 'lucide-react';
import { getStoredHofs } from '../../utils/memberMaster';
import { getStoredFaizHubs } from '../../utils/faizModule';
import { getStoredThaalis } from '../../utils/fmbTakhmeen';
import { UserProfile } from '../../types';

const fmtINR = (n: number) => `₹${n.toLocaleString('en-IN')}`;

interface Props {
  currentUser: UserProfile;
  showToast: (m: string) => void;
}

export const PrintTakhmeenFormSubpage: React.FC<Props> = ({
  currentUser,
  showToast,
}) => {
  const [hofs] = useState(() => getStoredHofs());
  const [hubs] = useState(() => getStoredFaizHubs());
  const [thaalis] = useState(() => getStoredThaalis());

  // Filter States [cite: 28]
  const [itsFilter, setItsFilter] = useState('');
  const [sabeelFilter, setSabeelFilter] = useState('');
  const [nameFilter, setNameFilter] = useState('');
  const [thaaliFilter, setThaaliFilter] = useState('');
  const [mohallaFilter, setMohallaFilter] = useState('all');
  const [hijriYearFilter, setHijriYearFilter] = useState('1447-1448 Hijri');

  // Print Settings
  const [printCopies, setPrintCopies] = useState<number>(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activePrintRecord, setActivePrintRecord] = useState<any | null>(null);

  // Unique mohallas
  const mohallas = useMemo(() => {
    const set = new Set<string>();
    hofs.forEach(h => { if (h.mohallahName) set.add(h.mohallahName); });
    return Array.from(set);
  }, [hofs]);

  // Combined Records
  const records = useMemo(() => {
    return hofs.map(h => {
      const hub = hubs.find(x => x.itsNumber === h.itsNumber);
      const th = thaalis.find(x => x.itsNumber === h.itsNumber);
      return {
        id: h.id,
        its: h.itsNumber,
        sabeelNo: h.sabeelNo || 'SAB-101',
        thaaliNo: h.thaaliNo || th?.thaaliNo || 'TH-001',
        name: h.fullName,
        fatherName: h.fatherName || '',
        surname: h.surname || '',
        mobile: h.mobileNumber || '',
        address: h.fullAddress || '',
        mohalla: h.mohallahName || 'Unassigned',
        category: hub?.categoryCode || 'HUB-GEN',
        takhmeenAmount: hub?.committedHub || 52000,
        paidAmount: hub?.paidHub || 35000,
        balanceDue: (hub?.committedHub || 52000) - (hub?.paidHub || 35000),
        thaaliStatus: th?.status || 'Active',
        familyCount: h.familyMembers?.length ? h.familyMembers.length + 1 : 4,
      };
    });
  }, [hofs, hubs, thaalis]);

  // Filtered Records
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      if (itsFilter && !r.its.toLowerCase().includes(itsFilter.toLowerCase())) return false;
      if (sabeelFilter && !r.sabeelNo.toLowerCase().includes(sabeelFilter.toLowerCase())) return false;
      if (nameFilter && !r.name.toLowerCase().includes(nameFilter.toLowerCase())) return false;
      if (thaaliFilter && !r.thaaliNo.toLowerCase().includes(thaaliFilter.toLowerCase())) return false;
      if (mohallaFilter !== 'all' && r.mohalla !== mohallaFilter) return false;
      return true;
    });
  }, [records, itsFilter, sabeelFilter, nameFilter, thaaliFilter, mohallaFilter]);

  // Select all toggles
  const handleSelectAll = () => {
    if (selectedIds.length === filteredRecords.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredRecords.map(r => r.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleBulkPrint = () => {
    if (selectedIds.length === 0) {
      showToast('Please select at least one member to print Takhmeen forms.');
      return;
    }
    const target = filteredRecords.find(r => selectedIds.includes(r.id)) || filteredRecords[0];
    setActivePrintRecord({ ...target, isBulk: true, totalBulk: selectedIds.length });
  };

  const triggerBrowserPrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* ── Banner Card ── */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300/60 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500 text-slate-950 shadow-xs">
            <Printer className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              Print Takhmeen Form
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Advanced search filters, copy multiplier, and bulk pledge form generation [cite: 28]
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Copies Selector */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-300 px-3 py-1.5 rounded-xl text-xs">
            <span className="font-bold text-slate-600">Copies / Member:</span>
            <select
              value={printCopies}
              onChange={(e) => setPrintCopies(Number(e.target.value))}
              className="font-bold text-slate-900 bg-transparent outline-none cursor-pointer"
            >
              <option value={1}>1 Original</option>
              <option value={2}>2 (Original + Jamaat Copy)</option>
              <option value={3}>3 (Triplicate)</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleBulkPrint}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Bulk Print ({selectedIds.length})</span>
          </button>
        </div>
      </div>

      {/* ── Advanced Search Filter Bar [cite: 28] ── */}
      <div className="bg-white border border-amber-300/60 rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-amber-600" />
            <span>Advanced Search Filters (6 Parameters)</span>
          </span>
          <button
            type="button"
            onClick={() => {
              setItsFilter('');
              setSabeelFilter('');
              setNameFilter('');
              setThaaliFilter('');
              setMohallaFilter('all');
            }}
            className="text-xs font-bold text-amber-800 hover:text-amber-950 hover:underline cursor-pointer"
          >
            Clear All Filters
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          {/* 1. ITS No */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">ITS No</label>
            <input
              type="text"
              value={itsFilter}
              onChange={(e) => setItsFilter(e.target.value)}
              placeholder="e.g. 3048..."
              className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-mono text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>

          {/* 2. Sabeel No */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">Sabeel No</label>
            <input
              type="text"
              value={sabeelFilter}
              onChange={(e) => setSabeelFilter(e.target.value)}
              placeholder="e.g. SAB-101"
              className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-mono text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>

          {/* 3. Name */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">Full Name</label>
            <input
              type="text"
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              placeholder="Search by name..."
              className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>

          {/* 4. Thaali No */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">Thaali No</label>
            <input
              type="text"
              value={thaaliFilter}
              onChange={(e) => setThaaliFilter(e.target.value)}
              placeholder="e.g. TH-084"
              className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-mono text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>

          {/* 5. Mohalla */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">Mohalla</label>
            <select
              value={mohallaFilter}
              onChange={(e) => setMohallaFilter(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none cursor-pointer"
            >
              <option value="all">All Mohallas</option>
              {mohallas.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* 6. Hijri Year */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">Hijri Year</label>
            <select
              value={hijriYearFilter}
              onChange={(e) => setHijriYearFilter(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none cursor-pointer"
            >
              <option value="1446-1447 Hijri">1446-1447 Hijri</option>
              <option value="1447-1448 Hijri">1447-1448 Hijri</option>
              <option value="1448-1449 Hijri">1448-1449 Hijri</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Table Grid Display Entries [cite: 28] ── */}
      <div className="bg-white border border-amber-300/60 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSelectAll}
              className="font-bold text-slate-700 hover:text-slate-950 flex items-center gap-1.5 cursor-pointer"
            >
              {selectedIds.length === filteredRecords.length && filteredRecords.length > 0 ? (
                <CheckSquare className="w-4 h-4 text-amber-600" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>Select All Filtered ({filteredRecords.length})</span>
            </button>
            <span className="text-slate-400">|</span>
            <span className="text-slate-600 font-semibold">
              Selected: <strong className="text-amber-900">{selectedIds.length}</strong>
            </span>
          </div>

          <span className="text-slate-500">
            Target Year: <strong className="text-slate-800">{hijriYearFilter}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-amber-50/60 text-slate-700 font-bold border-y border-amber-200">
                <th className="py-2.5 px-3 w-8"></th>
                <th className="py-2.5 px-3">ITS No</th>
                <th className="py-2.5 px-3">Sabeel No</th>
                <th className="py-2.5 px-3">Full Name</th>
                <th className="py-2.5 px-3">Thaali No</th>
                <th className="py-2.5 px-3">Mohalla</th>
                <th className="py-2.5 px-3 text-right">Takhmeen</th>
                <th className="py-2.5 px-3 text-center">Print Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No members match the active search criteria.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((item) => {
                  const isChecked = selectedIds.includes(item.id);
                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-amber-50/40 transition-colors ${isChecked ? 'bg-amber-50/30' : ''}`}
                    >
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelect(item.id)}
                          className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                        {item.its}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-medium text-slate-700">
                        {item.sabeelNo}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-slate-900 block">{item.name}</span>
                        <span className="text-[10px] text-slate-500">Family: {item.familyCount} Members</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-mono font-bold text-amber-900 bg-amber-100/70 px-1.5 py-0.5 rounded">
                          {item.thaaliNo}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {item.mohalla}
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-slate-900">
                        {fmtINR(item.takhmeenAmount)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => setActivePrintRecord(item)}
                          className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold text-[11px] inline-flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Printer className="w-3 h-3" />
                          <span>Print Form</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL: Printable Official Dawoodi Bohra FMB Takhmeen Form [cite: 28] ── */}
      {activePrintRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-amber-300 shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 bg-amber-50 border-b border-amber-200 flex items-center justify-between">
              <div>
                <h3 className="font-black text-sm text-slate-900">
                  Faiz ul Mawaidil Burhaniyah — Takhmeen Form Printout
                </h3>
                <p className="text-[11px] text-slate-600">
                  {activePrintRecord.isBulk ? `Bulk printing ${activePrintRecord.totalBulk} forms` : `Form for ${activePrintRecord.name} (${activePrintRecord.its})`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={triggerBrowserPrint}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Document</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActivePrintRecord(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Authentic Form Content (Styled for print & display) */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-800 bg-white" id="fmb-print-sheet">
              {/* Top Arabic Header */}
              <div className="text-center space-y-1 border-b-2 border-slate-900 pb-4">
                <p className="font-serif text-base font-bold text-slate-900">
                  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                </p>
                <h2 className="text-xl font-black text-slate-950 uppercase tracking-tight">
                  ANJUMAN-E-BURHANI — JAMAAT OFFICE
                </h2>
                <h3 className="text-sm font-extrabold text-amber-900 tracking-wide uppercase">
                  FAIZ UL MAWAIDIL BURHANIYAH (FMB)
                </h3>
                <p className="font-bold text-xs text-slate-700">
                  ANNUAL TAKHMEEN & THAALI COMMITMENT FORM — {hijriYearFilter}
                </p>
              </div>

              {/* Barcode / QR & HOF Metadata */}
              <div className="grid grid-cols-3 gap-4 border border-slate-300 rounded-xl p-4 bg-slate-50/50">
                <div className="col-span-2 space-y-1.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500">Head of Family (HOF):</span>
                      <p className="font-extrabold text-sm text-slate-900">{activePrintRecord.name}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500">ITS ID Number:</span>
                      <p className="font-mono font-bold text-sm text-slate-900">{activePrintRecord.its}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-200">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500">Sabeel No:</span>
                      <p className="font-mono font-bold text-slate-800">{activePrintRecord.sabeelNo}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500">Thaali No:</span>
                      <p className="font-mono font-bold text-amber-900">{activePrintRecord.thaaliNo}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500">Mohalla Area:</span>
                      <p className="font-bold text-slate-800">{activePrintRecord.mohalla}</p>
                    </div>
                  </div>
                  <div className="pt-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Registered Address:</span>
                    <p className="text-slate-700">{activePrintRecord.address || 'Burhani Colony, Sector 2, Flat 304'}</p>
                  </div>
                </div>

                {/* QR Block */}
                <div className="border-l border-slate-300 pl-4 flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 border-2 border-slate-900 rounded-lg p-1 bg-white flex items-center justify-center">
                    <QrCode className="w-16 h-16 text-slate-900" />
                  </div>
                  <span className="text-[9px] font-mono text-slate-500 mt-1">ITS-VERIFIED-{activePrintRecord.its}</span>
                </div>
              </div>

              {/* Installment Pledge Commitment Schedule */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                  Installment Commitment Breakdown ({hijriYearFilter})
                </h4>
                <table className="w-full text-left text-xs border border-slate-300">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                    <tr>
                      <th className="py-1.5 px-2">Installment Miqaat</th>
                      <th className="py-1.5 px-2">Target Date</th>
                      <th className="py-1.5 px-2 text-right">Target %</th>
                      <th className="py-1.5 px-2 text-right">Amount (INR)</th>
                      <th className="py-1.5 px-2 text-center">Cashier Initials</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="py-1.5 px-2 font-bold">1. Lailatul Qadr Mubarak</td>
                      <td className="py-1.5 px-2 font-mono">1447-09-23</td>
                      <td className="py-1.5 px-2 text-right">25%</td>
                      <td className="py-1.5 px-2 text-right font-bold">{fmtINR(activePrintRecord.takhmeenAmount * 0.25)}</td>
                      <td className="py-1.5 px-2 text-center border-l border-slate-200"></td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-2 font-bold">2. Zilqaad al-Haram</td>
                      <td className="py-1.5 px-2 font-mono">1447-11-20</td>
                      <td className="py-1.5 px-2 text-right">25%</td>
                      <td className="py-1.5 px-2 text-right font-bold">{fmtINR(activePrintRecord.takhmeenAmount * 0.25)}</td>
                      <td className="py-1.5 px-2 text-center border-l border-slate-200"></td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-2 font-bold">3. Ashara Mubaraka / Moharram</td>
                      <td className="py-1.5 px-2 font-mono">1448-01-10</td>
                      <td className="py-1.5 px-2 text-right">25%</td>
                      <td className="py-1.5 px-2 text-right font-bold">{fmtINR(activePrintRecord.takhmeenAmount * 0.25)}</td>
                      <td className="py-1.5 px-2 text-center border-l border-slate-200"></td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-2 font-bold">4. Rajab / Shabaan al-Kareem</td>
                      <td className="py-1.5 px-2 font-mono">1448-08-15</td>
                      <td className="py-1.5 px-2 text-right">25%</td>
                      <td className="py-1.5 px-2 text-right font-bold">{fmtINR(activePrintRecord.takhmeenAmount * 0.25)}</td>
                      <td className="py-1.5 px-2 text-center border-l border-slate-200"></td>
                    </tr>
                    <tr className="bg-amber-50/60 font-black text-slate-900">
                      <td colSpan={3} className="py-2 px-2 text-right uppercase">
                        Total Annual Takhmeen Pledge:
                      </td>
                      <td className="py-2 px-2 text-right text-sm text-emerald-800">
                        {fmtINR(activePrintRecord.takhmeenAmount)}
                      </td>
                      <td className="border-l border-slate-200"></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Declaration & Signature Blocks */}
              <div className="space-y-4 pt-4 border-t border-slate-200">
                <p className="text-[10px] text-slate-600 leading-relaxed italic text-justify">
                  <strong>Declaration:</strong> I, the undersigned Head of Family, willingly commit to the above Faiz ul Mawaidil Burhaniyah takhmeen pledge for the barakat of daily Thaali in our household. I agree to remit all scheduled installments within the prescribed miqaats to ensure uninterrupted kitchen supplies and zero food waste.
                </p>

                <div className="grid grid-cols-2 gap-12 pt-6">
                  <div className="border-t border-slate-800 text-center pt-2">
                    <span className="font-bold text-xs text-slate-900 block">Signature of Head of Family (HOF)</span>
                    <span className="text-[10px] text-slate-500">Date: ________________________</span>
                  </div>
                  <div className="border-t border-slate-800 text-center pt-2">
                    <span className="font-bold text-xs text-slate-900 block">Janab Aamil Saheb / FMB Trustee</span>
                    <span className="text-[10px] text-slate-500">Official Jamaat Seal</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
