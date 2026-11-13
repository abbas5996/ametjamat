import React, { useState, useEffect } from 'react';
import {
  Eye, Edit3, Printer, FileCheck, Ban, X, AlertCircle, CheckCircle2
} from 'lucide-react';
import { OfficialReceiptData } from '../faiz-hub/FaizOfficialPrintReceipt';

// ============================================================================
// STATISTIC CARD CONTAINER
// ============================================================================

export type StatTone = 'blue' | 'amber' | 'emerald' | 'rose' | 'slate';

const TONE_CLASSES: Record<StatTone, { border: string; iconBg: string; iconText: string; badge: string }> = {
  blue: {
    border: 'border-blue-200',
    iconBg: 'bg-blue-50 border-blue-200',
    iconText: 'text-blue-700',
    badge: 'bg-blue-100 text-blue-800',
  },
  amber: {
    border: 'border-amber-300/80',
    iconBg: 'bg-amber-50 border-amber-200',
    iconText: 'text-amber-700',
    badge: 'bg-amber-100 text-amber-900',
  },
  emerald: {
    border: 'border-emerald-200',
    iconBg: 'bg-emerald-50 border-emerald-200',
    iconText: 'text-emerald-700',
    badge: 'bg-emerald-100 text-emerald-800',
  },
  rose: {
    border: 'border-rose-200',
    iconBg: 'bg-rose-50 border-rose-200',
    iconText: 'text-rose-700',
    badge: 'bg-rose-100 text-rose-800',
  },
  slate: {
    border: 'border-slate-200',
    iconBg: 'bg-slate-100 border-slate-200',
    iconText: 'text-slate-700',
    badge: 'bg-slate-100 text-slate-800',
  },
};

export interface SchemeStatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  tone?: StatTone;
  badgeText?: string;
  onClick?: () => void;
}

export const SchemeStatCard: React.FC<SchemeStatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  tone = 'blue',
  badgeText,
  onClick,
}) => {
  const styles = TONE_CLASSES[tone];
  const InteractiveTag = onClick ? 'button' : 'div';

  return (
    <InteractiveTag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`bg-white rounded-2xl border ${styles.border} p-4 sm:p-5 shadow-xs text-left w-full transition-all ${
        onClick ? 'hover:shadow-md hover:border-amber-400 cursor-pointer' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className={`p-2.5 rounded-xl border ${styles.iconBg} ${styles.iconText} shrink-0`}>
          {icon}
        </div>
        {badgeText && (
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${styles.badge}`}>
            {badgeText}
          </span>
        )}
      </div>
      <div className="mt-3">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</p>
        <p className="text-xl sm:text-2xl font-black text-slate-900 font-mono mt-1 tracking-tight">
          {value}
        </p>
        {subtitle && <p className="text-[11px] text-slate-500 mt-1">{subtitle}</p>}
      </div>
    </InteractiveTag>
  );
};

// ============================================================================
// CONSISTENT TABLE ACTION BUTTONS (View, Edit, Print, Solo Print)
// ============================================================================

export interface TableActionButtonsProps {
  onView: () => void;
  onEdit?: () => void;
  onPrint: () => void;
  onSoloPrint: () => void;
  onCancel?: () => void;
  canEdit?: boolean;
  canDelete?: boolean;
  compact?: boolean;
  cancelLabel?: string;
}

export const TableActionButtons: React.FC<TableActionButtonsProps> = ({
  onView,
  onEdit,
  onPrint,
  onSoloPrint,
  onCancel,
  canEdit = true,
  canDelete = true,
  compact = false,
  cancelLabel = 'Void',
}) => {
  const baseBtn = compact
    ? 'px-2 py-1 text-[10px] font-bold rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer whitespace-nowrap'
    : 'px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer whitespace-nowrap';

  return (
    <div className="inline-flex items-center justify-end gap-1 flex-wrap">
      <button
        type="button"
        onClick={onView}
        title="View Full Record Details"
        className={`${baseBtn} bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200`}
      >
        <Eye className="w-3 h-3" />
        <span>View</span>
      </button>

      {onEdit && canEdit && (
        <button
          type="button"
          onClick={onEdit}
          title="Edit Record"
          className={`${baseBtn} bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200`}
        >
          <Edit3 className="w-3 h-3" />
          <span>Edit</span>
        </button>
      )}

      <button
        type="button"
        onClick={onPrint}
        title="Print Summary Slip"
        className={`${baseBtn} bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200`}
      >
        <Printer className="w-3 h-3" />
        <span>Print</span>
      </button>

      <button
        type="button"
        onClick={onSoloPrint}
        title="Solo Print Official Trust Voucher"
        className={`${baseBtn} bg-amber-400 hover:bg-amber-500 text-slate-950 border border-amber-500 shadow-2xs`}
      >
        <FileCheck className="w-3 h-3" />
        <span>Solo Print</span>
      </button>

      {onCancel && canDelete && (
        <button
          type="button"
          onClick={onCancel}
          title={`${cancelLabel} Receipt`}
          className={`${baseBtn} bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200`}
        >
          <Ban className="w-3 h-3" />
          <span>{cancelLabel}</span>
        </button>
      )}
    </div>
  );
};

// ============================================================================
// RECORD VIEW MODAL
// ============================================================================

export interface DetailField {
  label: string;
  value: string | number;
  mono?: boolean;
  highlight?: boolean;
}

export interface SchemeViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  fields: DetailField[];
  onSoloPrint?: () => void;
}

export const SchemeViewModal: React.FC<SchemeViewModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  fields,
  onSoloPrint,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden">
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold">{title}</h3>
            {subtitle && <p className="text-[11px] text-amber-300 font-mono mt-0.5">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close detail dialog"
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs max-h-[70vh] overflow-y-auto">
          {fields.map((field) => (
            <div
              key={field.label}
              className={`p-3 rounded-xl border ${
                field.highlight
                  ? 'bg-emerald-50/70 border-emerald-200 sm:col-span-2'
                  : 'bg-slate-50 border-slate-200/80'
              }`}
            >
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {field.label}
              </span>
              <span
                className={`block mt-1 font-bold text-slate-900 break-words ${
                  field.mono ? 'font-mono' : ''
                } ${field.highlight ? 'text-base text-emerald-900' : ''}`}
              >
                {field.value || '—'}
              </span>
            </div>
          ))}
        </div>

        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
          {onSoloPrint && (
            <button
              type="button"
              onClick={onSoloPrint}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Solo Print Official Receipt</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// BULK PRINT OFFICIAL TRUST RECEIPTS MODAL
// ============================================================================

export interface SchemeBulkPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  receipts: Partial<OfficialReceiptData>[];
}

export const SchemeBulkPrintModal: React.FC<SchemeBulkPrintModalProps> = ({
  isOpen,
  onClose,
  title,
  receipts,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #scheme-bulk-print-wrapper,
          #scheme-bulk-print-wrapper * {
            visibility: visible !important;
          }
          #scheme-bulk-print-wrapper {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          .bulk-receipt-card {
            page-break-after: always !important;
            break-after: page !important;
            border: none !important;
            box-shadow: none !important;
            margin: 0 !important;
            padding: 20px 28px !important;
          }
          .bulk-receipt-card:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-white rounded-2xl border border-amber-300 shadow-2xl max-w-4xl w-full my-6 overflow-hidden">
        <div className="p-4 bg-amber-50 border-b border-amber-200 flex items-center justify-between no-print">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">{title}</h3>
              <p className="text-[11px] text-slate-600">
                Batch Printing {receipts.length} Official Dawoodi Bohra Jamaat Trust Voucher(s)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print All ({receipts.length})</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-amber-100 cursor-pointer"
              aria-label="Close bulk print preview"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div
          id="scheme-bulk-print-wrapper"
          className="p-4 sm:p-6 bg-slate-100 space-y-6 max-h-[82vh] overflow-y-auto"
        >
          {receipts.map((item, idx) => (
            <div
              key={`${item.receiptNo || idx}-${idx}`}
              className="bulk-receipt-card bg-white text-black w-full max-w-[820px] mx-auto p-8 sm:p-10 shadow-sm border border-slate-300 font-sans leading-relaxed"
            >
              <div className="text-center space-y-1 mb-6">
                <h1 className="font-bold text-[15px] sm:text-[17px] tracking-tight uppercase text-black">
                  {item.trustTitle || 'DAWOODI BOHRA JAMAAT TRUST, BURHANIPARK VATWA'}
                </h1>
                <p className="font-bold text-[13px] sm:text-[14px] uppercase text-black">
                  {item.trustRegnNo || 'Regn No - B/81'}
                </p>
                <p className="font-bold text-[12px] sm:text-[13px] text-black">
                  {item.managedBy || 'Managed By Anjuman e Mufaddal'}
                </p>
                <div className="pt-2">
                  <h2 className="font-bold text-[14px] sm:text-[15px] text-black tracking-wide">
                    {item.accountTitle}
                  </h2>
                </div>
              </div>

              <div className="flex justify-between items-baseline mb-5 text-[13px]">
                <div className="flex items-baseline gap-2">
                  <span className="border-b-2 border-black inline-block min-w-[110px] font-medium pb-0.5">
                    {item.dateStr}
                  </span>
                  <span className="font-serif text-[14px] font-bold" dir="rtl">تاریخ</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="border-b-2 border-black inline-block min-w-[70px] text-center font-bold pb-0.5 font-mono">
                    {item.receiptNo}
                  </span>
                  <span className="font-serif text-[14px] font-bold" dir="rtl">رسید نمبر</span>
                </div>
              </div>

              <div className="space-y-3 text-[13px] mb-5">
                <div className="flex items-baseline gap-2">
                  <span className="font-serif text-[13px] font-bold whitespace-nowrap">
                    {item.honorificLeft || '(حفظه الله تعالى)'}
                  </span>
                  <div className="border-b-2 border-black flex-1 text-right font-bold uppercase pb-0.5 pr-2">
                    {item.memberName}
                  </div>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="font-bold min-w-[65px]">ITS No.</span>
                  <div className="border-b-2 border-black min-w-[180px] font-bold font-mono pb-0.5 pl-1">
                    {item.itsNo}
                  </div>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="font-bold min-w-[65px]">Add.</span>
                  <div className="border-b-2 border-black flex-1 text-[12px] font-medium uppercase pb-0.5 pl-1">
                    {item.address}
                  </div>
                </div>
              </div>

              <div className="text-center py-3">
                <span className="font-serif text-[24px] font-bold" dir="rtl">
                  {item.greetingArabic || 'بعد السلام الجميل'}
                </span>
              </div>

              <div className="mb-6 space-y-3 text-[13px]">
                <div className="flex items-baseline justify-between gap-4">
                  <div className="flex items-baseline gap-2 flex-1">
                    <span className="font-serif text-[14px] font-bold whitespace-nowrap" dir="rtl">
                      {item.descriptorAnke || 'انکه'}
                    </span>
                    <div className="border-b-2 border-black flex-1 text-center font-medium capitalize pb-0.5 px-2">
                      {item.amountInWords}
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2 shrink-0">
                    <div className="border-b-2 border-black min-w-[100px] text-center font-bold pb-0.5 font-mono">
                      {(Number(item.amount) || 0).toFixed(2)}
                    </div>
                    <span className="font-serif text-[14px] font-bold whitespace-nowrap" dir="rtl">
                      {item.descriptorRight || 'اپ طرف سي'}
                    </span>
                  </div>
                </div>

                <div className="pt-3 flex items-baseline justify-between text-[13px]">
                  <div className="font-medium">{item.paymentModeStr}</div>
                  <div className="flex items-baseline gap-3 pr-8">
                    <span className="font-serif text-[14px] font-bold" dir="rtl">
                      {item.purposePhrase || 'طریقے وصول تھیا چھے'}
                    </span>
                    <span className="font-bold">{item.purposeTitle}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 pb-2 text-center">
                <span className="font-serif text-[14px] font-bold" dir="rtl">
                  (وصول کرنار نی صحیح) عبد سید ناطع
                </span>
              </div>
              <div className="w-full border-b-[3px] border-black mt-3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// CANCEL / VOID RECEIPT MODAL
// ============================================================================

export interface CancelReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptLabel: string;
  memberName: string;
  amountFormatted: string;
  initialReason?: string;
  onConfirm: (reason: string) => void;
}

export const CancelReceiptModal: React.FC<CancelReceiptModalProps> = ({
  isOpen,
  onClose,
  receiptLabel,
  memberName,
  amountFormatted,
  initialReason = '',
  onConfirm,
}) => {
  const [reason, setReason] = useState(initialReason);

  useEffect(() => {
    if (isOpen) setReason(initialReason);
  }, [isOpen, initialReason]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-rose-900 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>Void Receipt {receiptLabel}</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-600">
          Voiding this receipt moves <span className="font-bold text-slate-900">{amountFormatted}</span> for{' '}
          <span className="font-bold text-slate-900">{memberName}</span> to the Cancelled Receipts audit log.
        </p>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Reason for Cancellation *
          </label>
          <textarea
            rows={3}
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Cheque returned, duplicate entry, wrong scheme selected..."
            className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            Dismiss
          </button>
          <button
            type="button"
            disabled={!reason.trim()}
            onClick={() => onConfirm(reason.trim())}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Confirm Void</span>
          </button>
        </div>
      </div>
    </div>
  );
};

