import React from 'react';
import { X, Printer } from 'lucide-react';
import { FaizOfficialPrintReceipt, OfficialReceiptData } from '../faiz-hub/FaizOfficialPrintReceipt';
import { UserProfile } from '../../types';

export interface TrustOfficialReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptData?: Partial<OfficialReceiptData>;
  currentUser?: UserProfile;
  title?: string;
  subtitle?: string;
}

export const TrustOfficialReceiptModal: React.FC<TrustOfficialReceiptModalProps> = ({
  isOpen,
  onClose,
  receiptData,
  currentUser,
  title = 'Official Dawoodi Bohra Jamaat Trust Receipt Print Studio',
  subtitle,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-amber-300 shadow-2xl max-w-4xl w-full my-6 overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="p-4 bg-amber-50 border-b border-amber-200 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-xs">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">{title}</h3>
              <p className="text-[11px] text-slate-600 font-mono">
                {subtitle ||
                  (receiptData?.receiptNo
                    ? `Receipt #${receiptData.receiptNo} • ${receiptData.memberName || 'Individual Voucher'}`
                    : 'Standardized Official Trust Counter Voucher')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-amber-100 transition-colors cursor-pointer"
            title="Close Receipt Studio"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 max-h-[85vh] overflow-y-auto">
          <FaizOfficialPrintReceipt
            initialData={receiptData}
            currentUser={currentUser}
            onClose={onClose}
          />
        </div>
      </div>
    </div>
  );
};
