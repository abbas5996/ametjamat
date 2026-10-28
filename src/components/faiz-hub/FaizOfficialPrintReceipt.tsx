import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Printer, Download, RefreshCw, User, Check, Edit3, Eye,
  Sparkles, FileText, ArrowLeft, Layers, ShieldCheck, Share2
} from 'lucide-react';
import { numberToWordsIndian, getStoredPart2Receipts, FaizReceiptItem } from '../../utils/fmbPart2Data';
import { getStoredHofs } from '../../utils/memberMaster';
import { UserProfile } from '../../types';

export interface OfficialReceiptData {
  trustTitle: string;
  trustRegnNo: string;
  managedBy: string;
  accountTitle: string;
  dateStr: string; // e.g. "27 Oct 2026"
  receiptNo: string | number; // e.g. "274"
  memberName: string; // e.g. "YUSUF BHAI ALIHUSAIN BHAI MARASIYAWALA"
  honorificLeft: string; // "(حفظه الله تعالى)"
  itsNo: string; // "30426437"
  address: string; // "C1/205, BURHANI PARK, OPP.NAVANA PUMPING STATION, NAROL-GHODASAR CANAL"
  greetingArabic: string; // "بعد السلام الجميل"
  amount: number; // 5000.00
  amountInWords?: string; // "Five Thousand Only"
  descriptorRight: string; // "اپ طرف سي"
  descriptorAnke: string; // "انکه"
  paymentModeStr: string; // "By Cash." or "By Cheque."
  purposeTitle: string; // "Donation"
  purposePhrase: string; // "طریقے وصول تھیا چھے"
  receiverSignature: string; // "(وصول کرنار نی صحیح) عبد سید ناطع"
  chequeNo?: string;
  chequeDate?: string;
  bankName?: string;
}

// Exact reference voucher from user reference image
export const DEFAULT_SAMPLE_RECEIPT: OfficialReceiptData = {
  trustTitle: 'DAWOODI BOHRA JAMAAT TRUST, BURHANIPARK VATWA, AHMEDABAD',
  trustRegnNo: 'TRUST REGN. NO – B/81',
  managedBy: 'Managed By: Anjuman e Mufaddal',
  accountTitle: 'A/c : Faiz ul Mawaid il Burhaniyah',
  dateStr: '27 Oct 2026',
  receiptNo: '274',
  memberName: 'YUSUF BHAI ALIHUSAIN BHAI MARASIYAWALA',
  honorificLeft: '(حفظه الله تعالى)',
  itsNo: '30426437',
  address: 'C1/205, BURHANI PARK, OPP.NAVANA PUMPING STATION, NAROL-GHODASAR CANAL',
  greetingArabic: 'بعد السلام الجميل',
  amount: 5000.00,
  amountInWords: 'Five Thousand    Only',
  descriptorRight: 'اپ طرف سي',
  descriptorAnke: 'انکه',
  paymentModeStr: 'By Cash.',
  purposeTitle: 'Donation',
  purposePhrase: 'طریقے وصول تھیا چھے',
  receiverSignature: '(وصول کرنار نی صحیح) عبد سید ناطع',
};

interface Props {
  initialData?: Partial<OfficialReceiptData>;
  onClose?: () => void;
  currentUser?: UserProfile;
}

export const FaizOfficialPrintReceipt: React.FC<Props> = ({
  initialData,
  onClose,
  currentUser
}) => {
  const [data, setData] = useState<OfficialReceiptData>(() => ({
    ...DEFAULT_SAMPLE_RECEIPT,
    ...initialData,
    amountInWords: initialData?.amount
      ? numberToWordsIndian(initialData.amount)
      : (initialData?.amountInWords || DEFAULT_SAMPLE_RECEIPT.amountInWords),
  }));

  const [isEditorOpen, setIsEditorOpen] = useState(true);
  const [hofs] = useState(() => getStoredHofs());
  const [existingReceipts] = useState<FaizReceiptItem[]>(() => getStoredPart2Receipts());
  const receiptContainerRef = useRef<HTMLDivElement>(null);

  // Recalculate amount in words automatically whenever amount changes
  const computedAmountInWords = useMemo(() => {
    return numberToWordsIndian(data.amount);
  }, [data.amount]);

  // Sync when initialData changes from parent
  useEffect(() => {
    if (initialData) {
      setData(prev => ({
        ...prev,
        ...initialData,
        amountInWords: initialData.amount ? numberToWordsIndian(initialData.amount) : prev.amountInWords
      }));
    }
  }, [initialData]);

  // Quick fill from existing HOF database
  const handleSelectHof = (its: string) => {
    const member = hofs.find(h => h.itsNumber === its);
    if (!member) return;
    setData(prev => ({
      ...prev,
      itsNo: member.itsNumber,
      memberName: member.fullName.toUpperCase(),
      address: (member.address || `${member.flatNumber || 'Flat'}, Burhani Park, Vatwa, Ahmedabad`).toUpperCase(),
    }));
  };

  // Quick fill from existing historical receipts
  const handleSelectReceipt = (recId: string) => {
    const rec = existingReceipts.find(r => r.id === recId || r.receiptNo === recId);
    if (!rec) return;

    // Convert date e.g. 2026-10-27 to "27 Oct 2026"
    let formattedDate = rec.date;
    try {
      const d = new Date(rec.date);
      if (!isNaN(d.getTime())) {
        formattedDate = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      }
    } catch {
      // keep fallback
    }

    setData(prev => ({
      ...prev,
      receiptNo: rec.receiptNo.replace(/[^0-9]/g, '') || rec.receiptNo,
      dateStr: formattedDate,
      itsNo: rec.itsNumber,
      memberName: rec.hofName.toUpperCase(),
      amount: rec.amount,
      amountInWords: numberToWordsIndian(rec.amount),
      paymentModeStr: rec.paymentMode === 'Cash' ? 'By Cash.' : (rec.paymentMode === 'Cheque' ? 'By Cheque.' : `By ${rec.paymentMode}.`),
      purposeTitle: rec.category === 'Takhmeen' ? 'Takhmeen' : (rec.category === 'Hoob' ? 'Hoob' : 'Donation'),
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* ── Print Styles to isolate the official voucher container ── */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #official-faiz-receipt-wrapper,
          #official-faiz-receipt-wrapper * {
            visibility: visible !important;
          }
          #official-faiz-receipt-wrapper {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 20px 28px !important;
            background: white !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* ── Top Action & Control Ribbon (Hidden in Print) ── */}
      <div className="no-print bg-white border border-amber-300/70 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
              title="Return"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm text-slate-900">Official Dawoodi Bohra Jamaat Trust FMB Receipt</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                Print & PDF Studio
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Pixel-perfect replica of the authentic Anjuman e Mufaddal FMB counter voucher layout
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsEditorOpen(prev => !prev)}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
              isEditorOpen ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isEditorOpen ? 'Hide Live Editor' : 'Edit Receipt Fields'}</span>
          </button>

          <button
            type="button"
            onClick={() => setData(DEFAULT_SAMPLE_RECEIPT)}
            className="px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
            title="Reset to Reference Image sample (#274 - Yusuf Bhai)"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset Sample (#274)</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Official Receipt</span>
          </button>
        </div>
      </div>

      {/* ── Interactive Live Editor Drawer (Hidden in Print) ── */}
      {isEditorOpen && (
        <div className="no-print bg-amber-50/40 border border-amber-200/80 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-amber-200/60 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-700" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-amber-950">
                Live Data Binding & Voucher Customizer
              </h3>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-slate-500 font-medium">Quick Autofill:</span>
              <select
                onChange={(e) => handleSelectHof(e.target.value)}
                defaultValue=""
                className="border border-amber-300 rounded-lg px-2.5 py-1 text-xs bg-white font-bold cursor-pointer"
              >
                <option value="" disabled>-- Select Mumin / HOF --</option>
                {hofs.map(h => (
                  <option key={h.id} value={h.itsNumber}>{h.fullName} (ITS: {h.itsNumber})</option>
                ))}
              </select>

              {existingReceipts.length > 0 && (
                <select
                  onChange={(e) => handleSelectReceipt(e.target.value)}
                  defaultValue=""
                  className="border border-amber-300 rounded-lg px-2.5 py-1 text-xs bg-white font-bold cursor-pointer"
                >
                  <option value="" disabled>-- Load Existing Receipt --</option>
                  {existingReceipts.map(r => (
                    <option key={r.id} value={r.id}>{r.receiptNo} - {r.hofName} (₹{r.amount})</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Receipt Number (رسید نمبر) *</label>
              <input
                type="text"
                value={data.receiptNo}
                onChange={(e) => setData(prev => ({ ...prev, receiptNo: e.target.value }))}
                className="w-full border rounded-lg px-3 py-1.5 font-bold font-mono text-slate-900 bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Receipt Date (تاریخ) *</label>
              <input
                type="text"
                value={data.dateStr}
                onChange={(e) => setData(prev => ({ ...prev, dateStr: e.target.value }))}
                placeholder="e.g. 27 Oct 2026"
                className="w-full border rounded-lg px-3 py-1.5 font-bold text-slate-900 bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">ITS Number *</label>
              <input
                type="text"
                value={data.itsNo}
                onChange={(e) => setData(prev => ({ ...prev, itsNo: e.target.value }))}
                className="w-full border rounded-lg px-3 py-1.5 font-mono font-bold text-slate-900 bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Amount in Figures (INR ₹) *</label>
              <input
                type="number"
                step="any"
                value={data.amount}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setData(prev => ({
                    ...prev,
                    amount: val,
                    amountInWords: numberToWordsIndian(val)
                  }));
                }}
                className="w-full border rounded-lg px-3 py-1.5 font-black text-emerald-800 bg-white"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Member Full Name (HOF) *</label>
              <input
                type="text"
                value={data.memberName}
                onChange={(e) => setData(prev => ({ ...prev, memberName: e.target.value.toUpperCase() }))}
                className="w-full border rounded-lg px-3 py-1.5 font-bold uppercase text-slate-900 bg-white"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Complete Address (Add.) *</label>
              <input
                type="text"
                value={data.address}
                onChange={(e) => setData(prev => ({ ...prev, address: e.target.value.toUpperCase() }))}
                className="w-full border rounded-lg px-3 py-1.5 uppercase text-slate-800 bg-white"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">
                Amount in Words (Auto-calculated, or override)
              </label>
              <input
                type="text"
                value={data.amountInWords || computedAmountInWords}
                onChange={(e) => setData(prev => ({ ...prev, amountInWords: e.target.value }))}
                className="w-full border rounded-lg px-3 py-1.5 font-semibold text-slate-800 bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Payment Mode</label>
              <select
                value={data.paymentModeStr}
                onChange={(e) => setData(prev => ({ ...prev, paymentModeStr: e.target.value }))}
                className="w-full border rounded-lg px-3 py-1.5 font-bold bg-white cursor-pointer"
              >
                <option value="By Cash.">By Cash.</option>
                <option value="By Cheque.">By Cheque.</option>
                <option value="By Online Transfer.">By Online Transfer.</option>
                <option value="By UPI / QR.">By UPI / QR.</option>
                <option value="By Standing Order.">By Standing Order.</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Contribution / Head</label>
              <input
                type="text"
                value={data.purposeTitle}
                onChange={(e) => setData(prev => ({ ...prev, purposeTitle: e.target.value }))}
                className="w-full border rounded-lg px-3 py-1.5 font-bold text-slate-900 bg-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
       * OFFICIAL DAWOODI BOHRA JAMAAT TRUST RECEIPT CONTAINER
       * Strictly matching the reference image layout, font weights, underlines,
       * Arabic script & Urdu/Gujarati descriptors
       * ========================================================================= */}
      <div className="flex justify-center p-2 sm:p-6 bg-slate-100/70 rounded-2xl border border-slate-200">
        <div
          id="official-faiz-receipt-wrapper"
          ref={receiptContainerRef}
          className="bg-white text-black w-full max-w-[820px] p-8 sm:p-12 shadow-md border border-slate-300 font-sans leading-relaxed select-text"
          style={{ minHeight: '620px' }}
        >
          {/* Top Browser Print Header simulation for realism */}
          <div className="text-[11px] text-slate-800 flex justify-between items-center mb-6 no-print border-b border-slate-200 pb-2">
            <span>{data.dateStr}, 12:51 PM</span>
            <span className="font-semibold">Dawoodi Bohra jamaat Trust</span>
          </div>

          {/* 1. HEADER & TRUST DETAILS (Dynamic & Centered) [cite: reference image] */}
          <div className="text-center space-y-1 mb-8">
            <h1 className="font-bold text-[15px] sm:text-[17px] tracking-tight uppercase text-black">
              {data.trustTitle}
            </h1>
            <p className="font-bold text-[14px] sm:text-[15px] uppercase text-black">
              {data.trustRegnNo}
            </p>
            <p className="font-bold text-[13px] sm:text-[14px] text-black">
              {data.managedBy}
            </p>
            <div className="pt-3">
              <h2 className="font-bold text-[14px] sm:text-[16px] text-black tracking-wide">
                {data.accountTitle}
              </h2>
            </div>
          </div>

          {/* 2. RECEIPT METADATA (Date & Receipt Number with underlines) */}
          <div className="flex justify-between items-baseline mb-6 text-[13px] sm:text-[14px]">
            {/* Date on the Left */}
            <div className="flex items-baseline gap-2">
              <span className="border-b-2 border-black inline-block min-w-[120px] text-left font-medium pb-0.5">
                {data.dateStr}
              </span>
              <span className="font-serif text-[15px] font-bold" dir="rtl">
                تاریخ
              </span>
            </div>

            {/* Receipt Number on the Right */}
            <div className="flex items-baseline gap-2">
              <span className="border-b-2 border-black inline-block min-w-[70px] text-center font-bold pb-0.5 font-mono">
                {data.receiptNo}
              </span>
              <span className="font-serif text-[15px] font-bold" dir="rtl">
                رسید نمبر
              </span>
            </div>
          </div>

          {/* 3. MEMBER DETAILS (Honorific, Full Name underline, ITS No., Address) */}
          <div className="space-y-3.5 text-[13px] sm:text-[14px] mb-6">
            {/* Honorific & Full Name line */}
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-[14px] font-bold whitespace-nowrap text-black">
                {data.honorificLeft}
              </span>
              <div className="border-b-2 border-black flex-1 text-right font-bold tracking-wide uppercase pb-0.5 pr-2">
                {data.memberName}
              </div>
            </div>

            {/* ITS Number line */}
            <div className="flex items-baseline gap-3">
              <span className="font-bold whitespace-nowrap min-w-[65px] text-black">
                ITS No.
              </span>
              <div className="border-b-2 border-black min-w-[180px] sm:min-w-[220px] font-bold font-mono tracking-wider pb-0.5 pl-1">
                {data.itsNo}
              </div>
            </div>

            {/* Address line */}
            <div className="flex items-baseline gap-3">
              <span className="font-bold whitespace-nowrap min-w-[65px] text-black">
                Add.
              </span>
              <div className="border-b-2 border-black flex-1 text-black text-[12px] sm:text-[13px] font-medium tracking-tight pb-0.5 uppercase pl-1">
                {data.address}
              </div>
            </div>
          </div>

          {/* 4. ARABIC GREETING (Centered Calligraphic Style) */}
          <div className="text-center py-4 my-2">
            <span
              className="font-serif text-[26px] sm:text-[32px] font-bold tracking-wide text-black select-none"
              style={{ fontFamily: "'Scheherazade New', 'Amiri', 'Traditional Arabic', serif" }}
              dir="rtl"
            >
              {data.greetingArabic}
            </span>
          </div>

          {/* 5. TRANSACTION BODY & AMOUNT (Figures & In Words) */}
          <div className="mb-8 space-y-4 text-[13px] sm:text-[14px]">
            {/* Amount row with underline across */}
            <div className="flex items-baseline justify-between gap-4">
              {/* Left / Middle: In Words */}
              <div className="flex items-baseline gap-2 flex-1">
                <span className="font-serif text-[15px] font-bold whitespace-nowrap" dir="rtl">
                  {data.descriptorAnke}
                </span>
                <div className="border-b-2 border-black flex-1 text-center font-medium capitalize pb-0.5 px-3">
                  {data.amountInWords || computedAmountInWords}
                </div>
              </div>

              {/* Right: In Figures */}
              <div className="flex items-baseline gap-2 shrink-0">
                <div className="border-b-2 border-black min-w-[110px] text-center font-bold text-[14px] pb-0.5 font-mono">
                  {data.amount.toFixed(2)}
                </div>
                <span className="font-serif text-[15px] font-bold whitespace-nowrap" dir="rtl">
                  {data.descriptorRight}
                </span>
              </div>
            </div>

            {/* Payment Mode & Purpose */}
            <div className="pt-4 flex items-baseline justify-between text-[13px] sm:text-[14px]">
              {/* Payment Mode (e.g. By Cash.) on Left */}
              <div className="font-medium text-black">
                {data.paymentModeStr}
              </div>

              {/* Purpose / Donation descriptor in Center/Right */}
              <div className="flex items-baseline gap-4 pr-12">
                <span className="font-serif text-[15px] font-bold" dir="rtl">
                  {data.purposePhrase}
                </span>
                <span className="font-bold text-[14px]">
                  {data.purposeTitle}
                </span>
              </div>

              {/* Empty placeholder for alignment */}
              <div className="w-12"></div>
            </div>
          </div>

          {/* 6. FOOTER & SIGNATURE SECTION */}
          <div className="pt-8 pb-4 text-center">
            <div className="inline-block">
              <span
                className="font-serif text-[15px] sm:text-[16px] font-bold text-black"
                dir="rtl"
              >
                {data.receiverSignature}
              </span>
            </div>
          </div>

          {/* 7. BOTTOM THICK BORDER (Matching reference image) */}
          <div className="w-full border-b-[3px] border-black mt-4"></div>
        </div>
      </div>
    </div>
  );
};
