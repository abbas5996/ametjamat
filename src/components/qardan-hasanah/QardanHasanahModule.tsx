import React, { useState, useMemo } from 'react';
import {
  UserProfile,
  FinancialYear,
} from '../../types';
import {
  QardanFundCategory,
  QardanBankAccount,
  QardanScheme,
  QardanGuarantor,
  QardanApplication,
  QardanInstallmentReceipt,
  PaymentMode,
  QARDAN_FUNDS_KEY,
  QARDAN_ACCOUNTS_KEY,
  QARDAN_SCHEMES_KEY,
  QARDAN_APPLICATIONS_KEY,
  QARDAN_GUARANTORS_KEY,
  QARDAN_RECEIPTS_KEY,
  INITIAL_QARDAN_FUNDS,
  INITIAL_QARDAN_ACCOUNTS,
  INITIAL_QARDAN_SCHEMES,
  INITIAL_QARDAN_GUARANTORS,
  INITIAL_QARDAN_APPLICATIONS,
  INITIAL_QARDAN_RECEIPTS,
  loadFromStorage,
  saveToStorage,
} from '../../utils/part3Management';
import { appendActivityLog } from '../../utils/rbac';
import {
  Landmark,
  Plus,
  Search,
  Printer,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building,
  Users,
  ShieldCheck,
  Calendar,
  X,
  CreditCard,
  Briefcase,
  FileText,
  BadgeCheck,
} from 'lucide-react';

interface QardanHasanahModuleProps {
  currentUser: UserProfile;
  activeSubItemId: string;
  subItemLabel: string;
  financialYear: FinancialYear;
  showToast: (msg: string) => void;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export const QardanHasanahModule: React.FC<QardanHasanahModuleProps> = ({
  currentUser,
  activeSubItemId,
  showToast,
  canAdd,
  canEdit,
}) => {
  // Local state initialized with localStorage
  const [funds, setFunds] = useState<QardanFundCategory[]>(() =>
    loadFromStorage(QARDAN_FUNDS_KEY, INITIAL_QARDAN_FUNDS)
  );
  const [accounts, setAccounts] = useState<QardanBankAccount[]>(() =>
    loadFromStorage(QARDAN_ACCOUNTS_KEY, INITIAL_QARDAN_ACCOUNTS)
  );
  const [schemes, setSchemes] = useState<QardanScheme[]>(() =>
    loadFromStorage(QARDAN_SCHEMES_KEY, INITIAL_QARDAN_SCHEMES)
  );
  const [guarantors, setGuarantors] = useState<QardanGuarantor[]>(() =>
    loadFromStorage(QARDAN_GUARANTORS_KEY, INITIAL_QARDAN_GUARANTORS)
  );
  const [applications, setApplications] = useState<QardanApplication[]>(() =>
    loadFromStorage(QARDAN_APPLICATIONS_KEY, INITIAL_QARDAN_APPLICATIONS)
  );
  const [receipts, setReceipts] = useState<QardanInstallmentReceipt[]>(() =>
    loadFromStorage(QARDAN_RECEIPTS_KEY, INITIAL_QARDAN_RECEIPTS)
  );

  // Active Sub Tab mapping
  const [activeTab, setActiveTab] = useState<string>(activeSubItemId);
  React.useEffect(() => {
    setActiveTab(activeSubItemId);
  }, [activeSubItemId]);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals State
  const [isNewAppModalOpen, setIsNewAppModalOpen] = useState(false);
  const [isSanctionModalOpen, setIsSanctionModalOpen] = useState(false);
  const [isDisburseModalOpen, setIsDisburseModalOpen] = useState(false);
  const [isRepaymentModalOpen, setIsRepaymentModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<QardanApplication | null>(null);
  const [activePrintReceipt, setActivePrintReceipt] = useState<QardanInstallmentReceipt | null>(null);

  // New Application Form State
  const [appForm, setAppForm] = useState({
    itsNumber: '',
    applicantName: '',
    mohallah: 'Burhani Mohallah',
    mobile: '',
    schemeId: schemes[0]?.id || '',
    requestedAmount: 200000,
    tenureMonths: 18,
    purpose: '',
    guarantor1Its: '',
    guarantor1Name: '',
    guarantor1Contact: '',
    guarantor2Its: '',
    guarantor2Name: '',
    guarantor2Contact: '',
  });

  // Sanction Form State
  const [sanctionForm, setSanctionForm] = useState({
    sanctionedAmount: 200000,
    tenureMonths: 18,
    sanctionRemarks: 'Approved as per scheme norms by Jamaat Qardan committee.',
    sanctionedBy: 'Janab Aamil Saheb',
  });

  // Disbursement Form State
  const [disburseForm, setDisburseForm] = useState({
    bankAccountId: accounts[0]?.id || '',
    chequeOrRefNo: '',
    disbursedDate: new Date().toISOString().split('T')[0],
  });

  // Repayment Form State
  const [repayForm, setRepayForm] = useState({
    amount: 25000,
    paymentMode: 'UPI' as PaymentMode,
    transactionRef: '',
    date: new Date().toISOString().split('T')[0],
  });

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalCorpus = funds.reduce((acc, f) => acc + f.totalCorpus, 0);
    const totalDisbursed = applications
      .filter((a) => a.status === 'DISBURSED' || a.status === 'CLOSED')
      .reduce((acc, a) => acc + (a.disbursedAmount || 0), 0);
    const totalOutstanding = applications.reduce((acc, a) => acc + a.outstandingBalance, 0);
    const totalRecovered = receipts.reduce((acc, r) => acc + (r.isCancelled ? 0 : r.amount), 0);
    const activeBorrowersCount = applications.filter((a) => a.status === 'DISBURSED').length;
    return { totalCorpus, totalDisbursed, totalOutstanding, totalRecovered, activeBorrowersCount };
  }, [funds, applications, receipts]);

  // Handle New Application Submit
  const handleCreateApplication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAdd) {
      showToast('Access Denied: You do not have permission to add applications');
      return;
    }
    if (!appForm.itsNumber || !appForm.applicantName || appForm.requestedAmount <= 0) {
      showToast('Please enter valid ITS, applicant name, and amount');
      return;
    }

    const scheme = schemes.find((s) => s.id === appForm.schemeId) || schemes[0];
    const newAppNo = `QH-${new Date().getFullYear()}-${String(applications.length + 1).padStart(3, '0')}`;
    const monthlyAmt = Math.round(appForm.requestedAmount / (appForm.tenureMonths || 12));

    const newApp: QardanApplication = {
      id: `qapp-${Date.now()}`,
      applicationNo: newAppNo,
      itsNumber: appForm.itsNumber,
      applicantName: appForm.applicantName,
      mohallah: appForm.mohallah,
      mobile: appForm.mobile,
      schemeId: scheme.id,
      schemeName: scheme.schemeName,
      requestedAmount: Number(appForm.requestedAmount),
      purpose: appForm.purpose,
      tenureMonths: Number(appForm.tenureMonths),
      appliedDate: new Date().toISOString().split('T')[0],
      status: 'APPLIED',
      monthlyInstallment: monthlyAmt,
      guarantor1Its: appForm.guarantor1Its,
      guarantor1Name: appForm.guarantor1Name,
      guarantor1Contact: appForm.guarantor1Contact,
      guarantor2Its: appForm.guarantor2Its,
      guarantor2Name: appForm.guarantor2Name,
      guarantor2Contact: appForm.guarantor2Contact,
      totalRepaid: 0,
      outstandingBalance: Number(appForm.requestedAmount),
    };

    const updated = [newApp, ...applications];
    setApplications(updated);
    saveToStorage(QARDAN_APPLICATIONS_KEY, updated);

    appendActivityLog(
      currentUser.username,
      'Qardan Hasanah',
      'Applications & Sanctions',
      'ADD',
      `Registered Qardan Application ${newAppNo} for ${appForm.applicantName} (ITS ${appForm.itsNumber}) amount ₹${appForm.requestedAmount}`
    );

    showToast(`Application ${newAppNo} submitted successfully!`);
    setIsNewAppModalOpen(false);
  };

  // Handle Sanction
  const handleSanctionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;
    const sanctionedAmt = Number(sanctionForm.sanctionedAmount);
    const tenure = Number(sanctionForm.tenureMonths);
    const monthly = Math.round(sanctionedAmt / (tenure || 12));

    const updated = applications.map((a) => {
      if (a.id === selectedApp.id) {
        return {
          ...a,
          status: 'SANCTIONED' as const,
          sanctionedAmount: sanctionedAmt,
          tenureMonths: tenure,
          monthlyInstallment: monthly,
          sanctionedDate: new Date().toISOString().split('T')[0],
          sanctionRemarks: sanctionForm.sanctionRemarks,
          sanctionedBy: sanctionForm.sanctionedBy,
          outstandingBalance: sanctionedAmt,
        };
      }
      return a;
    });

    setApplications(updated);
    saveToStorage(QARDAN_APPLICATIONS_KEY, updated);

    appendActivityLog(
      currentUser.username,
      'Qardan Hasanah',
      'Applications & Sanctions',
      'EDIT',
      `Committee sanctioned application ${selectedApp.applicationNo} for ₹${sanctionedAmt}`
    );

    showToast(`Application ${selectedApp.applicationNo} Sanctioned!`);
    setIsSanctionModalOpen(false);
    setSelectedApp(null);
  };

  // Handle Disbursement
  const handleDisbursementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;
    const amountToDisburse = selectedApp.sanctionedAmount || selectedApp.requestedAmount;

    // Deduct from bank account
    const updatedAccounts = accounts.map((acc) => {
      if (acc.id === disburseForm.bankAccountId) {
        return { ...acc, currentBalance: acc.currentBalance - amountToDisburse };
      }
      return acc;
    });
    setAccounts(updatedAccounts);
    saveToStorage(QARDAN_ACCOUNTS_KEY, updatedAccounts);

    const updated = applications.map((a) => {
      if (a.id === selectedApp.id) {
        return {
          ...a,
          status: 'DISBURSED' as const,
          disbursedAmount: amountToDisburse,
          disbursedDate: disburseForm.disbursedDate,
          disbursedBankAccountId: disburseForm.bankAccountId,
          chequeOrRefNo: disburseForm.chequeOrRefNo,
          outstandingBalance: amountToDisburse,
        };
      }
      return a;
    });

    setApplications(updated);
    saveToStorage(QARDAN_APPLICATIONS_KEY, updated);

    appendActivityLog(
      currentUser.username,
      'Qardan Hasanah',
      'Disbursement & Recovery',
      'PAYMENT',
      `Disbursed loan ₹${amountToDisburse} to ${selectedApp.applicantName} (${selectedApp.applicationNo}) via ref ${disburseForm.chequeOrRefNo}`
    );

    showToast(`Loan of ₹${amountToDisburse.toLocaleString()} Disbursed successfully!`);
    setIsDisburseModalOpen(false);
    setSelectedApp(null);
  };

  // Handle Installment Collection
  const handleCollectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;
    const payAmt = Number(repayForm.amount);
    if (payAmt <= 0) {
      showToast('Please enter a valid repayment amount');
      return;
    }

    const newOutstanding = Math.max(0, selectedApp.outstandingBalance - payAmt);
    const newRepaid = selectedApp.totalRepaid + payAmt;
    const isNowClosed = newOutstanding === 0;

    const receiptNo = `QH-REC-${String(receipts.length + 1).padStart(4, '0')}`;
    const newReceipt: QardanInstallmentReceipt = {
      id: `qrec-${Date.now()}`,
      receiptNo,
      applicationId: selectedApp.id,
      applicationNo: selectedApp.applicationNo,
      itsNumber: selectedApp.itsNumber,
      applicantName: selectedApp.applicantName,
      amount: payAmt,
      installmentNo: receipts.filter((r) => r.applicationId === selectedApp.id).length + 1,
      paymentMode: repayForm.paymentMode,
      transactionRef: repayForm.transactionRef,
      date: repayForm.date,
      receivedBy: currentUser.username,
      remainingBalanceAfter: newOutstanding,
    };

    const updatedReceipts = [newReceipt, ...receipts];
    setReceipts(updatedReceipts);
    saveToStorage(QARDAN_RECEIPTS_KEY, updatedReceipts);

    const updatedApps = applications.map((a) => {
      if (a.id === selectedApp.id) {
        return {
          ...a,
          totalRepaid: newRepaid,
          outstandingBalance: newOutstanding,
          status: isNowClosed ? ('CLOSED' as const) : a.status,
        };
      }
      return a;
    });
    setApplications(updatedApps);
    saveToStorage(QARDAN_APPLICATIONS_KEY, updatedApps);

    appendActivityLog(
      currentUser.username,
      'Qardan Hasanah',
      'Disbursement & Recovery',
      'PAYMENT',
      `Collected Qardan installment ₹${payAmt} for ${selectedApp.applicantName} (Receipt: ${receiptNo})`
    );

    showToast(`Installment of ₹${payAmt.toLocaleString()} collected! Receipt ${receiptNo}`);
    setIsRepaymentModalOpen(false);
    setSelectedApp(null);
    setActivePrintReceipt(newReceipt);
  };

  // Filtered Applications
  const filteredApps = useMemo(() => {
    return applications.filter((app) => {
      const matchSearch =
        app.applicantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.itsNumber.includes(searchQuery) ||
        app.applicationNo.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || app.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [applications, searchQuery, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Strip */}
      <div className="bg-gradient-to-r from-amber-900 via-amber-800 to-amber-900 text-white rounded-2xl p-6 shadow-xl border border-amber-700/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-200 border border-amber-400/30">
                Shariah Compliant • Interest-Free Pool
              </span>
              <span className="text-xs text-amber-200/80">Qard-e-Hasana Ni Khidmat</span>
            </div>
            <h1 className="text-2xl font-black mt-1 tracking-tight text-white flex items-center gap-2">
              <Landmark className="w-7 h-7 text-amber-300" />
              Qardan Hasanah Trust & Administration
            </h1>
            <p className="text-xs text-amber-100/90 mt-1 max-w-2xl">
              Centralized revolving loan management for Makan, Taleem, Sehat, and Tijarat with guarantor liability tracking and automated recovery.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {canAdd && (
              <button
                type="button"
                onClick={() => setIsNewAppModalOpen(true)}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg transition-all transform active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                New Loan Application
              </button>
            )}
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-amber-700/60">
          <div className="bg-white/10 backdrop-blur-sm p-3.5 rounded-xl border border-white/10">
            <span className="text-[11px] text-amber-200 uppercase font-semibold">Total Fund Corpus</span>
            <p className="text-xl font-black text-white mt-0.5">₹{metrics.totalCorpus.toLocaleString()}</p>
            <span className="text-[10px] text-amber-300/80">Revolving Endowment Pool</span>
          </div>

          <div className="bg-white/10 backdrop-blur-sm p-3.5 rounded-xl border border-white/10">
            <span className="text-[11px] text-amber-200 uppercase font-semibold">Disbursed Principal</span>
            <p className="text-xl font-black text-emerald-300 mt-0.5">₹{metrics.totalDisbursed.toLocaleString()}</p>
            <span className="text-[10px] text-emerald-200/80">{metrics.activeBorrowersCount} active loans</span>
          </div>

          <div className="bg-white/10 backdrop-blur-sm p-3.5 rounded-xl border border-white/10">
            <span className="text-[11px] text-amber-200 uppercase font-semibold">Outstanding Balance</span>
            <p className="text-xl font-black text-amber-300 mt-0.5">₹{metrics.totalOutstanding.toLocaleString()}</p>
            <span className="text-[10px] text-amber-200/80">Across active borrowers</span>
          </div>

          <div className="bg-white/10 backdrop-blur-sm p-3.5 rounded-xl border border-white/10">
            <span className="text-[11px] text-amber-200 uppercase font-semibold">Total Recovered</span>
            <p className="text-xl font-black text-cyan-300 mt-0.5">₹{metrics.totalRecovered.toLocaleString()}</p>
            <span className="text-[10px] text-cyan-200/80">{receipts.length} total receipts issued</span>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-amber-200/80 pb-2 overflow-x-auto text-xs">
        {[
          { id: 'qardan-application-sanction', label: 'Applications & Sanctions', count: applications.length },
          { id: 'qardan-disbursement-collection', label: 'Disbursement & Recovery', count: receipts.length },
          { id: 'qardan-scheme-master', label: 'Scheme Master', count: schemes.length },
          { id: 'qardan-category-account', label: 'Fund & Account Master', count: funds.length + accounts.length },
          { id: 'qardan-guarantor-master', label: 'Guarantor Master (Zamin)', count: guarantors.length },
          { id: 'qardan-ledger-outstanding', label: 'Ledger & Outstanding' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === tab.id
                ? 'bg-amber-900 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-amber-50 border border-slate-200'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTab === tab.id ? 'bg-amber-700 text-amber-100' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: APPLICATIONS & SANCTIONS */}
      {/* ========================================================================= */}
      {activeTab === 'qardan-application-sanction' && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search by ITS, Name, or Application No..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-slate-50"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="APPLIED">Applied</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="SANCTIONED">Sanctioned</option>
                <option value="DISBURSED">Disbursed</option>
                <option value="CLOSED">Closed / Repaid</option>
              </select>
            </div>
          </div>

          {/* Applications Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">App No & Date</th>
                  <th className="p-3">Applicant & ITS</th>
                  <th className="p-3">Scheme & Purpose</th>
                  <th className="p-3 text-right">Requested</th>
                  <th className="p-3 text-right">Sanctioned</th>
                  <th className="p-3">Guarantors</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredApps.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      No applications found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredApps.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3">
                        <span className="font-mono font-bold text-slate-900">{app.applicationNo}</span>
                        <div className="text-[10px] text-slate-400 mt-0.5">{app.appliedDate}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{app.applicantName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          ITS: {app.itsNumber} • {app.mohallah}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded text-[10px] font-semibold">
                          {app.schemeName}
                        </span>
                        <div className="text-[10px] text-slate-500 truncate max-w-xs mt-1" title={app.purpose}>
                          {app.purpose}
                        </div>
                      </td>
                      <td className="p-3 text-right font-bold text-slate-800">
                        ₹{app.requestedAmount.toLocaleString()}
                        <div className="text-[10px] text-slate-400">{app.tenureMonths} Months</div>
                      </td>
                      <td className="p-3 text-right font-bold text-emerald-700">
                        {app.sanctionedAmount ? `₹${app.sanctionedAmount.toLocaleString()}` : '—'}
                        {app.monthlyInstallment && (
                          <div className="text-[10px] text-emerald-600">₹{app.monthlyInstallment.toLocaleString()}/mo</div>
                        )}
                      </td>
                      <td className="p-3 text-[11px]">
                        <div className="text-slate-800 font-medium">1. {app.guarantor1Name}</div>
                        {app.guarantor2Name && (
                          <div className="text-slate-500 text-[10px]">2. {app.guarantor2Name}</div>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                            app.status === 'DISBURSED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : app.status === 'SANCTIONED'
                              ? 'bg-blue-100 text-blue-800'
                              : app.status === 'CLOSED'
                              ? 'bg-slate-200 text-slate-700'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {app.status}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-1 whitespace-nowrap">
                        {app.status === 'APPLIED' && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedApp(app);
                              setSanctionForm({
                                sanctionedAmount: app.requestedAmount,
                                tenureMonths: app.tenureMonths,
                                sanctionRemarks: 'Approved by Committee.',
                                sanctionedBy: 'Janab Aamil Saheb',
                              });
                              setIsSanctionModalOpen(true);
                            }}
                            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-[10px] cursor-pointer"
                          >
                            Sanction
                          </button>
                        )}

                        {app.status === 'SANCTIONED' && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedApp(app);
                              setIsDisburseModalOpen(true);
                            }}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[10px] cursor-pointer"
                          >
                            Disburse
                          </button>
                        )}

                        {app.status === 'DISBURSED' && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedApp(app);
                              setRepayForm((prev) => ({
                                ...prev,
                                amount: app.monthlyInstallment || 25000,
                              }));
                              setIsRepaymentModalOpen(true);
                            }}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-[10px] cursor-pointer"
                          >
                            Collect
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: DISBURSEMENT & RECOVERY */}
      {/* ========================================================================= */}
      {activeTab === 'qardan-disbursement-collection' && (
        <div className="space-y-6">
          {/* Quick Counter Action Strip */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  Sanctioned Loans Awaiting Disbursement
                </h3>
                <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  {applications.filter((a) => a.status === 'SANCTIONED').length} Ready
                </span>
              </div>
              <div className="divide-y divide-slate-100 mt-3 max-h-60 overflow-y-auto">
                {applications.filter((a) => a.status === 'SANCTIONED').length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">No loans waiting for payout.</p>
                ) : (
                  applications
                    .filter((a) => a.status === 'SANCTIONED')
                    .map((app) => (
                      <div key={app.id} className="py-2.5 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-slate-800">{app.applicantName}</p>
                          <p className="text-[10px] text-slate-500">
                            {app.applicationNo} • ₹{(app.sanctionedAmount || app.requestedAmount).toLocaleString()}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedApp(app);
                            setIsDisburseModalOpen(true);
                          }}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] cursor-pointer"
                        >
                          Disburse Now
                        </button>
                      </div>
                    ))
                )}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  Quick Installment Counter
                </h3>
                <span className="text-xs text-slate-500 font-mono">Real-time Recovery</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Select an active disbursed loan to record monthly installment recovery with instant receipt printing.
              </p>
              <div className="mt-3 flex gap-2">
                <select
                  className="flex-1 text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50"
                  onChange={(e) => {
                    const found = applications.find((a) => a.id === e.target.value);
                    if (found) {
                      setSelectedApp(found);
                      setRepayForm((prev) => ({
                        ...prev,
                        amount: found.monthlyInstallment || 25000,
                      }));
                      setIsRepaymentModalOpen(true);
                    }
                  }}
                  defaultValue=""
                >
                  <option value="" disabled>
                    -- Select Borrower to Collect --
                  </option>
                  {applications
                    .filter((a) => a.status === 'DISBURSED')
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.applicantName} (ITS {a.itsNumber}) • Bal: ₹{a.outstandingBalance.toLocaleString()}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>

          {/* Historical Receipts Register */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-700" />
                Installment Receipts Register
              </h3>
              <span className="text-xs text-slate-500 font-semibold">{receipts.length} Total Receipts</span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Receipt No & Date</th>
                    <th className="p-3">Borrower & App No</th>
                    <th className="p-3 text-right">Amount Paid</th>
                    <th className="p-3">Mode & Ref</th>
                    <th className="p-3 text-right">Remaining Due</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {receipts.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/80">
                      <td className="p-3">
                        <span className="font-mono font-bold text-slate-900">{rec.receiptNo}</span>
                        <div className="text-[10px] text-slate-400">{rec.date}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-slate-800">{rec.applicantName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          ITS: {rec.itsNumber} • {rec.applicationNo}
                        </div>
                      </td>
                      <td className="p-3 text-right font-bold text-emerald-700">
                        ₹{rec.amount.toLocaleString()}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-semibold">
                          {rec.paymentMode}
                        </span>
                        {rec.transactionRef && (
                          <span className="text-[10px] text-slate-400 font-mono ml-1.5">{rec.transactionRef}</span>
                        )}
                      </td>
                      <td className="p-3 text-right font-bold text-amber-700">
                        ₹{rec.remainingBalanceAfter.toLocaleString()}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => setActivePrintReceipt(rec)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-amber-100 hover:text-amber-900 text-slate-700 rounded-lg text-[11px] font-bold flex items-center gap-1 mx-auto cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Print
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SCHEME MASTER */}
      {/* ========================================================================= */}
      {activeTab === 'qardan-scheme-master' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {schemes.map((sch) => {
              const matchingApps = applications.filter((a) => a.schemeId === sch.id);
              const activeCount = matchingApps.filter((a) => a.status === 'DISBURSED').length;
              return (
                <div key={sch.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold">
                      {sch.code}
                    </span>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      {sch.isActive ? 'Active Scheme' : 'Inactive'}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base mt-2">{sch.schemeName}</h3>
                  <div className="mt-4 space-y-2 text-xs text-slate-600">
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span>Maximum Limit:</span>
                      <span className="font-bold text-slate-900">₹{sch.maxAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span>Max Tenure:</span>
                      <span className="font-bold text-slate-900">{sch.maxTenureMonths} Months</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span>Min Guarantors Required:</span>
                      <span className="font-bold text-slate-900">{sch.minGuarantors} Zamin</span>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span>Active Borrowers:</span>
                      <span className="font-bold text-amber-700">{activeCount} Borrowers</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: FUND & ACCOUNT MASTER */}
      {/* ========================================================================= */}
      {activeTab === 'qardan-category-account' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Fund Categories */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
              <Landmark className="w-4 h-4 text-amber-700" />
              Qardan Hasana Corpus Funds
            </h3>
            <div className="space-y-3">
              {funds.map((f) => (
                <div key={f.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs">{f.name}</span>
                    <span className="font-mono text-[10px] text-amber-800 bg-amber-100 px-2 py-0.5 rounded font-bold">
                      {f.code}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">{f.description}</p>
                  <div className="mt-3 flex justify-between text-xs font-semibold pt-2 border-t border-slate-200/60">
                    <span className="text-slate-600">Total Corpus: ₹{f.totalCorpus.toLocaleString()}</span>
                    <span className="text-emerald-700">Available: ₹{f.availableCorpus.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bank Accounts */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
              <Building className="w-4 h-4 text-blue-600" />
              Disbursement & Clearing Bank Accounts
            </h3>
            <div className="space-y-3">
              {accounts.map((acc) => (
                <div key={acc.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs">{acc.accountName}</span>
                    <span className="text-xs font-bold text-emerald-700 font-mono">
                      ₹{acc.currentBalance.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-1">
                    {acc.bankName} • A/C: {acc.accountNumber} • IFSC: {acc.ifscCode}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: GUARANTOR MASTER (ZAMIN) */}
      {/* ========================================================================= */}
      {activeTab === 'qardan-guarantor-master' && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-700" />
                Guarantor (Zamin) Directory & Liability Ledger
              </h3>
              <p className="text-xs text-slate-500">Tracking guarantor liability limits and active commitments</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">ITS & Name</th>
                  <th className="p-3">Mohallah & Contact</th>
                  <th className="p-3">Relationship Slabs</th>
                  <th className="p-3 text-right">Max Liability</th>
                  <th className="p-3 text-center">Active Guarantees</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {guarantors.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-50/80">
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{g.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">ITS: {g.itsNumber}</div>
                    </td>
                    <td className="p-3">
                      <div>{g.mohallah}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{g.mobile}</div>
                    </td>
                    <td className="p-3 text-slate-600">{g.relation}</td>
                    <td className="p-3 text-right font-bold text-slate-900">
                      ₹{g.maxGuaranteedLiability.toLocaleString()}
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-bold rounded-full text-[11px]">
                        {g.activeGuaranteesCount} Active
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-full text-[10px]">
                        {g.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: LEDGER & OUTSTANDING REPORT */}
      {/* ========================================================================= */}
      {activeTab === 'qardan-ledger-outstanding' && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-amber-700" />
                Borrower Outstanding & Amortization Report
              </h3>
              <p className="text-xs text-slate-500">Live outstanding recovery balance and default tracking</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Loan Ref</th>
                  <th className="p-3">Borrower Details</th>
                  <th className="p-3 text-right">Disbursed</th>
                  <th className="p-3 text-right">Total Repaid</th>
                  <th className="p-3 text-right">Balance Due</th>
                  <th className="p-3">Repayment Progress</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications
                  .filter((a) => a.status === 'DISBURSED' || a.status === 'CLOSED')
                  .map((app) => {
                    const principal = app.disbursedAmount || app.requestedAmount;
                    const percent = Math.min(100, Math.round((app.totalRepaid / (principal || 1)) * 100));
                    return (
                      <tr key={app.id} className="hover:bg-slate-50/80">
                        <td className="p-3">
                          <span className="font-mono font-bold text-slate-900">{app.applicationNo}</span>
                          <div className="text-[10px] text-slate-400">{app.schemeName}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{app.applicantName}</div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            ITS: {app.itsNumber} • {app.mohallah}
                          </div>
                        </td>
                        <td className="p-3 text-right font-bold text-slate-900">
                          ₹{principal.toLocaleString()}
                        </td>
                        <td className="p-3 text-right font-bold text-emerald-700">
                          ₹{app.totalRepaid.toLocaleString()}
                        </td>
                        <td className="p-3 text-right font-bold text-amber-700">
                          ₹{app.outstandingBalance.toLocaleString()}
                        </td>
                        <td className="p-3">
                          <div className="w-32 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                            <div
                              className="bg-emerald-600 h-2.5 rounded-full transition-all"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                            {percent}% Recovered
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              app.status === 'CLOSED'
                                ? 'bg-slate-200 text-slate-700'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {app.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: NEW APPLICATION */}
      {/* ========================================================================= */}
      {isNewAppModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Landmark className="w-5 h-5 text-amber-700" />
                Submit Qardan Hasanah Application
              </h3>
              <button
                type="button"
                onClick={() => setIsNewAppModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateApplication} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Applicant ITS Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="8-digit ITS"
                    value={appForm.itsNumber}
                    onChange={(e) => setAppForm({ ...appForm, itsNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Applicant Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Husain Bhai Shk Shabbir"
                    value={appForm.applicantName}
                    onChange={(e) => setAppForm({ ...appForm, applicantName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 bg-slate-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mohallah</label>
                  <input
                    type="text"
                    value={appForm.mohallah}
                    onChange={(e) => setAppForm({ ...appForm, mohallah: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mobile Contact</label>
                  <input
                    type="text"
                    placeholder="10-digit mobile"
                    value={appForm.mobile}
                    onChange={(e) => setAppForm({ ...appForm, mobile: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Qardan Scheme *</label>
                  <select
                    value={appForm.schemeId}
                    onChange={(e) => setAppForm({ ...appForm, schemeId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-medium"
                  >
                    {schemes.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.schemeName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Requested Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min={10000}
                    step={5000}
                    value={appForm.requestedAmount}
                    onChange={(e) => setAppForm({ ...appForm, requestedAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tenure (Months) *</label>
                  <input
                    type="number"
                    required
                    min={3}
                    max={36}
                    value={appForm.tenureMonths}
                    onChange={(e) => setAppForm({ ...appForm, tenureMonths: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Purpose of Loan</label>
                <textarea
                  rows={2}
                  placeholder="Detail the genuine requirement..."
                  value={appForm.purpose}
                  onChange={(e) => setAppForm({ ...appForm, purpose: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-xs"
                />
              </div>

              {/* Guarantor Details */}
              <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/80 space-y-2">
                <span className="font-bold text-amber-900 block text-xs">Primary Guarantor (Zamin-e-Awwal)</span>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Zamin ITS"
                    value={appForm.guarantor1Its}
                    onChange={(e) => setAppForm({ ...appForm, guarantor1Its: e.target.value })}
                    className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                  />
                  <input
                    type="text"
                    placeholder="Zamin Full Name"
                    value={appForm.guarantor1Name}
                    onChange={(e) => setAppForm({ ...appForm, guarantor1Name: e.target.value })}
                    className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                  />
                  <input
                    type="text"
                    placeholder="Zamin Contact"
                    value={appForm.guarantor1Contact}
                    onChange={(e) => setAppForm({ ...appForm, guarantor1Contact: e.target.value })}
                    className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewAppModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-md cursor-pointer"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: COMMITTEE SANCTION */}
      {/* ========================================================================= */}
      {isSanctionModalOpen && selectedApp && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <BadgeCheck className="w-5 h-5 text-amber-700" />
                Sanction Qardan Application
              </h3>
              <button
                type="button"
                onClick={() => setIsSanctionModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
              <p className="font-bold text-slate-900">{selectedApp.applicantName}</p>
              <p className="text-slate-500">
                App No: {selectedApp.applicationNo} • Requested: ₹{selectedApp.requestedAmount.toLocaleString()}
              </p>
            </div>

            <form onSubmit={handleSanctionSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Approved Sanction Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min={10000}
                  value={sanctionForm.sanctionedAmount}
                  onChange={(e) => setSanctionForm({ ...sanctionForm, sanctionedAmount: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-slate-900 bg-slate-50"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Repayment Tenure (Months) *</label>
                <input
                  type="number"
                  required
                  min={3}
                  max={36}
                  value={sanctionForm.tenureMonths}
                  onChange={(e) => setSanctionForm({ ...sanctionForm, tenureMonths: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Sanction Remarks / Conditions</label>
                <textarea
                  rows={2}
                  value={sanctionForm.sanctionRemarks}
                  onChange={(e) => setSanctionForm({ ...sanctionForm, sanctionRemarks: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSanctionModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-md cursor-pointer"
                >
                  Confirm Sanction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: DISBURSEMENT */}
      {/* ========================================================================= */}
      {isDisburseModalOpen && selectedApp && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                Disburse Qardan Loan
              </h3>
              <button
                type="button"
                onClick={() => setIsDisburseModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl text-xs space-y-1">
              <p className="font-bold text-emerald-950">{selectedApp.applicantName}</p>
              <p className="text-emerald-800 font-bold text-sm">
                Payable Amount: ₹{(selectedApp.sanctionedAmount || selectedApp.requestedAmount).toLocaleString()}
              </p>
            </div>

            <form onSubmit={handleDisbursementSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Deduct from Bank Account *</label>
                <select
                  value={disburseForm.bankAccountId}
                  onChange={(e) => setDisburseForm({ ...disburseForm, bankAccountId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-medium"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.accountName} (Bal: ₹{acc.currentBalance.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Cheque / UTR / Reference No *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BCB-CHQ-10492 or UTR/99201"
                  value={disburseForm.chequeOrRefNo}
                  onChange={(e) => setDisburseForm({ ...disburseForm, chequeOrRefNo: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Disbursement Date</label>
                <input
                  type="date"
                  value={disburseForm.disbursedDate}
                  onChange={(e) => setDisburseForm({ ...disburseForm, disbursedDate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDisburseModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md cursor-pointer"
                >
                  Confirm Payout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: INSTALLMENT REPAYMENT */}
      {/* ========================================================================= */}
      {isRepaymentModalOpen && selectedApp && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Printer className="w-5 h-5 text-blue-600" />
                Collect Loan Installment
              </h3>
              <button
                type="button"
                onClick={() => setIsRepaymentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-blue-50 rounded-xl text-xs space-y-1">
              <p className="font-bold text-blue-950">{selectedApp.applicantName}</p>
              <div className="flex justify-between text-blue-800">
                <span>App: {selectedApp.applicationNo}</span>
                <span className="font-bold">Bal: ₹{selectedApp.outstandingBalance.toLocaleString()}</span>
              </div>
            </div>

            <form onSubmit={handleCollectionSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Repayment Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min={500}
                  step={500}
                  value={repayForm.amount}
                  onChange={(e) => setRepayForm({ ...repayForm, amount: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-slate-900 bg-slate-50 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Mode *</label>
                  <select
                    value={repayForm.paymentMode}
                    onChange={(e) => setRepayForm({ ...repayForm, paymentMode: e.target.value as PaymentMode })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-medium"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="NEFT/RTGS">NEFT/RTGS</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Txn / Cheque Ref</label>
                  <input
                    type="text"
                    placeholder="Ref or Cashier note"
                    value={repayForm.transactionRef}
                    onChange={(e) => setRepayForm({ ...repayForm, transactionRef: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Collection Date</label>
                <input
                  type="date"
                  value={repayForm.date}
                  onChange={(e) => setRepayForm({ ...repayForm, date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRepaymentModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md cursor-pointer"
                >
                  Collect & Issue Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PRINT-READY POS RECEIPT MODAL */}
      {/* ========================================================================= */}
      {activePrintReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-300 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="text-[11px] font-bold text-amber-900">Qardan Hasana Trust Receipt</span>
              <button
                type="button"
                onClick={() => setActivePrintReceipt(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="border border-dashed border-slate-300 p-4 rounded-xl bg-amber-50/20 text-center font-mono text-xs space-y-2">
              <p className="text-[11px] text-slate-500">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
              <h4 className="font-bold text-slate-900 text-sm">BURHANI PARK JAMAAT TRUST</h4>
              <p className="text-[10px] text-slate-600">QARDAN HASANA FUND COMMITTEE</p>
              <div className="border-t border-dashed border-slate-300 my-2" />
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-500">Receipt No:</span>
                <span className="font-bold text-slate-900">{activePrintReceipt.receiptNo}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-500">Date:</span>
                <span>{activePrintReceipt.date}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-500">Mumin Name:</span>
                <span className="font-bold text-slate-800">{activePrintReceipt.applicantName}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-500">ITS Number:</span>
                <span>{activePrintReceipt.itsNumber}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-500">Payment Mode:</span>
                <span>{activePrintReceipt.paymentMode}</span>
              </div>
              <div className="border-t border-dashed border-slate-300 my-2" />
              <div className="flex justify-between text-sm font-bold text-slate-900">
                <span>REPAID AMOUNT:</span>
                <span className="text-emerald-700">₹{activePrintReceipt.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[11px] text-amber-900 font-semibold pt-1">
                <span>Remaining Loan Balance:</span>
                <span>₹{activePrintReceipt.remainingBalanceAfter.toLocaleString()}</span>
              </div>
              <div className="border-t border-dashed border-slate-300 my-2" />
              <p className="text-[10px] text-slate-500 italic">
                Shukran for fulfilling your Qardan commitment on time.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Print Voucher
              </button>
              <button
                type="button"
                onClick={() => setActivePrintReceipt(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
