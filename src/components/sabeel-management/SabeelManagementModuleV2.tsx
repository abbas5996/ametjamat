import React, { useState, useEffect } from 'react';
import {
  Coins, BarChart3, Calendar, Printer, Tag, Layers, Building2, RefreshCw,
  Ban, Sliders, CreditCard, Receipt, FileText, Gift, AlertCircle, History,
  AlertTriangle, FileSpreadsheet, ChevronRight, Sparkles
} from 'lucide-react';
import {
  UserProfile, FinancialYear, SabeelLedgerRecord, SabeelTransactionEntry, HeadOfFamily
} from '../../types';
import {
  getStoredSabeelLedger, getStoredSabeelTransactions, saveStoredSabeelLedger,
  saveStoredSabeelTransactions
} from '../../utils/sabeelManagement';
import { getStoredHofs } from '../../utils/memberMaster';
import {
  getStoredCancelledReceipts, CancelledReceipt
} from '../../utils/sabeelExtended';
import {
  SabeelTypeRecord, SabeelGradeRecord, SabeelGradeLinkRecord, SabeelFirmRecord,
  GradeChangeHistoryRecord, ClosedSabeelRecord, SabeelWaiverRecord, SabeelReceiptConfig,
  ReturnedChequeRecord, getSabeelTypes, saveSabeelTypes, getSabeelGrades, saveSabeelGrades,
  getSabeelGradeLinks, saveSabeelGradeLinks, getSabeelFirms, saveSabeelFirms,
  getGradeChangeHistory, saveGradeChangeHistory, getClosedSabeels, saveClosedSabeels,
  getSabeelWaivers, saveSabeelWaivers, getSabeelReceiptConfig, saveSabeelReceiptConfig,
  getReturnedCheques, saveReturnedCheques
} from '../../utils/sabeelProductionSuite';

// Subpages
import { SabeelDashboardSubpage } from './SabeelDashboardSubpage';
import { SabeelStatisticsSubpage } from './SabeelStatisticsSubpage';
import { PrintTakhmeenSubpage } from './PrintTakhmeenSubpage';
import { SabeelTypeSubpage } from './SabeelTypeSubpage';
import { SabeelGradeLinkSubpage } from './SabeelGradeLinkSubpage';
import { SabeelFirmSubpage } from './SabeelFirmSubpage';
import { SabeelGradeNumberChangeSubpage } from './SabeelGradeNumberChangeSubpage';
import { SabeelCloseClosedSubpage } from './SabeelCloseClosedSubpage';
import { SabeelWaiveReceiptConfigSubpage } from './SabeelWaiveReceiptConfigSubpage';
import { SabeelTakhmeenCollectionSubpage } from './SabeelTakhmeenCollectionSubpage';
import { SabeelViewPrintReceiptsSubpage } from './SabeelViewPrintReceiptsSubpage';
import { SabeelDatewisePaymentwiseSubpage } from './SabeelDatewisePaymentwiseSubpage';
import { SabeelGiftAidSubpage } from './SabeelGiftAidSubpage';
import { SabeelDueReportSubpage } from './SabeelDueReportSubpage';
import { SabeelGradeHistorySubpage } from './SabeelGradeHistorySubpage';
import { SabeelReturnedChequeSubpage } from './SabeelReturnedChequeSubpage';
import { SabeelCancelledReceiptsSubpage } from './SabeelCancelledReceiptsSubpage';
import { SabeelDynamicGradeCountSubpage } from './SabeelDynamicGradeCountSubpage';
import { SabeelMasterLedgerSubpage } from './SabeelMasterLedgerSubpage';

interface Props {
  currentUser: UserProfile;
  activeSubItemId: string;
  subItemLabel: string;
  financialYear: FinancialYear;
  showToast: (msg: string) => void;
}

export const SabeelManagementModuleV2: React.FC<Props> = ({
  currentUser,
  activeSubItemId,
  subItemLabel,
  financialYear,
  showToast,
}) => {
  // Core Data Stores with LocalStorage synchronization
  const [ledger, setLedger] = useState<SabeelLedgerRecord[]>(() => getStoredSabeelLedger());
  const [transactions, setTransactions] = useState<SabeelTransactionEntry[]>(() => getStoredSabeelTransactions());
  const [hofs] = useState<HeadOfFamily[]>(() => getStoredHofs());
  const [cancelledReceipts] = useState<CancelledReceipt[]>(() => getStoredCancelledReceipts());

  // Suite Store States
  const [sabeelTypes, setSabeelTypes] = useState<SabeelTypeRecord[]>(() => getSabeelTypes());
  const [sabeelGrades, setSabeelGrades] = useState<SabeelGradeRecord[]>(() => getSabeelGrades());
  const [gradeLinks, setGradeLinks] = useState<SabeelGradeLinkRecord[]>(() => getSabeelGradeLinks());
  const [firms, setFirms] = useState<SabeelFirmRecord[]>(() => getSabeelFirms());
  const [gradeHistory, setGradeHistory] = useState<GradeChangeHistoryRecord[]>(() => getGradeChangeHistory());
  const [closedSabeels, setClosedSabeels] = useState<ClosedSabeelRecord[]>(() => getClosedSabeels());
  const [waivers, setWaivers] = useState<SabeelWaiverRecord[]>(() => getSabeelWaivers());
  const [receiptConfig, setReceiptConfig] = useState<SabeelReceiptConfig>(() => getSabeelReceiptConfig());
  const [returnedCheques, setReturnedCheques] = useState<ReturnedChequeRecord[]>(() => getReturnedCheques());

  // Current active subpage ID
  const [currentSubPage, setCurrentSubPage] = useState<string>(activeSubItemId || 'sabeel-dashboard');

  useEffect(() => {
    if (activeSubItemId) {
      setCurrentSubPage(activeSubItemId);
    }
  }, [activeSubItemId]);

  // Subpage groups for categorized UI navigation
  const groups = [
    {
      title: '1. Dashboard & Analytics',
      items: [
        { id: 'sabeel-dashboard', label: 'Sabeel Dashboard', icon: BarChart3 },
        { id: 'sabeel-statistics', label: 'Sabeel Statistics', icon: Calendar },
      ],
    },
    {
      title: '2. Sabeel Management Operations',
      items: [
        { id: 'sabeel-print-takhmeen', label: 'Print Takhmeen Form', icon: Printer },
        { id: 'sabeel-type', label: 'Sabeel Type', icon: Tag },
        { id: 'sabeel-grade-link', label: 'Grade & Link Grade', icon: Layers },
        { id: 'sabeel-firm-link', label: 'Firms & Link Sabeel', icon: Building2 },
        { id: 'sabeel-grade-change', label: 'Grade & Number Change', icon: RefreshCw },
        { id: 'sabeel-close-closed', label: 'Close & Closed List', icon: Ban },
        { id: 'sabeel-waive-receipt-config', label: 'Waive Off & Receipt Config', icon: Sliders },
        { id: 'sabeel-collection', label: 'Payment Entry (POS)', icon: CreditCard },
      ],
    },
    {
      title: '3. Sabeel Reports Suite',
      items: [
        { id: 'sabeel-view-print-receipts', label: 'View / Print Receipts', icon: Receipt },
        { id: 'sabeel-datewise-paymentwise', label: 'Datewise & Paymentwise', icon: FileText },
        { id: 'sabeel-gift-aid', label: 'Gift Aid Report', icon: Gift },
        { id: 'sabeel-due-report', label: 'Sabeel Due Report', icon: AlertCircle },
        { id: 'sabeel-grade-history', label: 'Grade Change History', icon: History },
        { id: 'sabeel-returned-cheque', label: 'Return Cheque List', icon: AlertTriangle },
        { id: 'sabeel-cancelled', label: 'Cancelled Receipts', icon: Ban },
        { id: 'sabeel-dynamic-grade-count', label: 'Dynamic Due & Grade Count', icon: FileSpreadsheet },
        { id: 'sabeel-ledger', label: 'Sabeel Master Ledger', icon: Coins },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Categorized Navigation Strip */}
      <div className="bg-white border border-amber-300/40 rounded-2xl p-3 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center gap-6">
          {groups.map((grp, gIdx) => (
            <div key={grp.title} className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-black uppercase text-amber-900/70 tracking-wider mr-1">
                {grp.title}:
              </span>
              {grp.items.map(item => {
                const Icon = item.icon;
                const isActive = currentSubPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentSubPage(item.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-amber-50/80'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
              {gIdx < groups.length - 1 && (
                <div className="hidden lg:block h-4 w-px bg-slate-200 mx-2" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Render Subpage Components */}
      {/* 1. Dashboard & Analytics */}
      {currentSubPage === 'sabeel-dashboard' && (
        <SabeelDashboardSubpage
          ledger={ledger}
          transactions={transactions}
          hofs={hofs}
          onNavigate={(subId) => setCurrentSubPage(subId)}
        />
      )}

      {currentSubPage === 'sabeel-statistics' && (
        <SabeelStatisticsSubpage
          ledger={ledger}
          sabeelTypes={sabeelTypes}
          financialYear={financialYear}
          showToast={showToast}
        />
      )}

      {/* 2. Sabeel Management Operations */}
      {currentSubPage === 'sabeel-print-takhmeen' && (
        <PrintTakhmeenSubpage
          ledger={ledger}
          hofs={hofs}
          showToast={showToast}
        />
      )}

      {currentSubPage === 'sabeel-type' && (
        <SabeelTypeSubpage
          sabeelTypes={sabeelTypes}
          setSabeelTypes={setSabeelTypes}
          showToast={showToast}
        />
      )}

      {currentSubPage === 'sabeel-grade-link' && (
        <SabeelGradeLinkSubpage
          sabeelGrades={sabeelGrades}
          setSabeelGrades={setSabeelGrades}
          gradeLinks={gradeLinks}
          setGradeLinks={setGradeLinks}
          sabeelTypes={sabeelTypes}
          showToast={showToast}
        />
      )}

      {currentSubPage === 'sabeel-firm-link' && (
        <SabeelFirmSubpage
          firms={firms}
          setFirms={setFirms}
          ledger={ledger}
          hofs={hofs}
          showToast={showToast}
        />
      )}

      {currentSubPage === 'sabeel-grade-change' && (
        <SabeelGradeNumberChangeSubpage
          ledger={ledger}
          setLedger={setLedger}
          sabeelGrades={sabeelGrades}
          gradeHistory={gradeHistory}
          setGradeHistory={setGradeHistory}
          hofs={hofs}
          currentUser={currentUser}
          showToast={showToast}
        />
      )}

      {currentSubPage === 'sabeel-close-closed' && (
        <SabeelCloseClosedSubpage
          ledger={ledger}
          setLedger={setLedger}
          closedSabeels={closedSabeels}
          setClosedSabeels={setClosedSabeels}
          hofs={hofs}
          currentUser={currentUser}
          showToast={showToast}
        />
      )}

      {currentSubPage === 'sabeel-waive-receipt-config' && (
        <SabeelWaiveReceiptConfigSubpage
          ledger={ledger}
          setLedger={setLedger}
          waivers={waivers}
          setWaivers={setWaivers}
          receiptConfig={receiptConfig}
          setReceiptConfig={setReceiptConfig}
          hofs={hofs}
          currentUser={currentUser}
          showToast={showToast}
          onBack={() => setCurrentSubPage('sabeel-dashboard')}
        />
      )}

      {currentSubPage === 'sabeel-collection' && (
        <SabeelTakhmeenCollectionSubpage
          ledger={ledger}
          setLedger={setLedger}
          transactions={transactions}
          setTransactions={setTransactions}
          hofs={hofs}
          currentUser={currentUser}
          financialYear={financialYear}
          showToast={showToast}
        />
      )}

      {/* 3. Sabeel Reports Suite */}
      {currentSubPage === 'sabeel-view-print-receipts' && (
        <SabeelViewPrintReceiptsSubpage
          transactions={transactions}
          setTransactions={setTransactions}
          ledger={ledger}
          sabeelTypes={sabeelTypes}
          receiptConfig={receiptConfig}
          currentUser={currentUser}
          showToast={showToast}
          onNavigateToCollection={() => setCurrentSubPage('sabeel-collection')}
        />
      )}

      {currentSubPage === 'sabeel-datewise-paymentwise' && (
        <SabeelDatewisePaymentwiseSubpage
          transactions={transactions}
          ledger={ledger}
          sabeelTypes={sabeelTypes}
          showToast={showToast}
        />
      )}

      {currentSubPage === 'sabeel-gift-aid' && (
        <SabeelGiftAidSubpage
          ledger={ledger}
          transactions={transactions}
          showToast={showToast}
        />
      )}

      {currentSubPage === 'sabeel-due-report' && (
        <SabeelDueReportSubpage
          ledger={ledger}
          setLedger={setLedger}
          transactions={transactions}
          sabeelTypes={sabeelTypes}
          showToast={showToast}
        />
      )}

      {currentSubPage === 'sabeel-grade-history' && (
        <SabeelGradeHistorySubpage
          gradeHistory={gradeHistory}
          showToast={showToast}
        />
      )}

      {currentSubPage === 'sabeel-returned-cheque' && (
        <SabeelReturnedChequeSubpage
          returnedCheques={returnedCheques}
          setReturnedCheques={setReturnedCheques}
          ledger={ledger}
          setLedger={setLedger}
          hofs={hofs}
          showToast={showToast}
        />
      )}

      {currentSubPage === 'sabeel-cancelled' && (
        <SabeelCancelledReceiptsSubpage
          cancelledReceipts={cancelledReceipts}
          showToast={showToast}
        />
      )}

      {currentSubPage === 'sabeel-dynamic-grade-count' && (
        <SabeelDynamicGradeCountSubpage
          ledger={ledger}
          sabeelTypes={sabeelTypes}
          sabeelGrades={sabeelGrades}
          transactions={transactions}
          showToast={showToast}
        />
      )}

      {currentSubPage === 'sabeel-ledger' && (
        <SabeelMasterLedgerSubpage
          ledger={ledger}
          setLedger={setLedger}
          hofs={hofs}
          currentUser={currentUser}
          financialYear={financialYear}
          showToast={showToast}
          onNavigateToPayment={() => setCurrentSubPage('sabeel-collection')}
          onNavigateToHistory={() => setCurrentSubPage('sabeel-view-print-receipts')}
        />
      )}
    </div>
  );
};
