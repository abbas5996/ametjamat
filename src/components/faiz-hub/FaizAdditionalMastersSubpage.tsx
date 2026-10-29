import React, { useState } from 'react';
import {
  ArrowLeftRight, Users, Landmark, Tag, Hash, Percent, Plus,
  Search, Edit2, Trash2, X, Check, Save, AlertCircle, Building2,
  FileText, ShieldCheck, Download, ChevronRight, CheckCircle2
} from 'lucide-react';
import {
  AccountTransferItem,
  CreditorEntryItem,
  FmbBankMasterItem,
  FmbTaggingItem,
  ReceiptNoSettingConfig,
  FaizWaiveOffItem,
  getStoredAccountTransfers,
  saveStoredAccountTransfers,
  getStoredCreditors,
  saveStoredCreditors,
  getStoredBanks,
  saveStoredBanks,
  getStoredTags,
  saveStoredTags,
  getStoredReceiptSettings,
  saveStoredReceiptSettings,
  getStoredWaiveOffs,
  saveStoredWaiveOffs,
} from '../../utils/fmbPart1Data';
import { UserProfile } from '../../types';

const fmtINR = (n: number) => `₹${n.toLocaleString('en-IN')}`;

type MasterSubTab = 'transfer' | 'creditors' | 'banks' | 'tagging' | 'receipt-no' | 'waiveoff';

interface Props {
  currentUser: UserProfile;
  showToast: (m: string) => void;
  canAdd?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}

export const FaizAdditionalMastersSubpage: React.FC<Props> = ({
  currentUser,
  showToast,
  canAdd = true,
  canEdit = true,
  canDelete = true,
}) => {
  const [activeTab, setActiveTab] = useState<MasterSubTab>('transfer');

  // Stores
  const [transfers, setTransfers] = useState<AccountTransferItem[]>(() => getStoredAccountTransfers());
  const [creditors, setCreditors] = useState<CreditorEntryItem[]>(() => getStoredCreditors());
  const [banks, setBanks] = useState<FmbBankMasterItem[]>(() => getStoredBanks());
  const [tags, setTags] = useState<FmbTaggingItem[]>(() => getStoredTags());
  const [receiptSettings, setReceiptSettings] = useState<ReceiptNoSettingConfig>(() => getStoredReceiptSettings());
  const [waiveOffs, setWaiveOffs] = useState<FaizWaiveOffItem[]>(() => getStoredWaiveOffs());

  // Search filter inside active tab
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [modalType, setModalType] = useState<MasterSubTab | null>(null);

  // 1. Transfer Modal State
  const [tDate, setTDate] = useState('1447-02-25');
  const [tFrom, setTFrom] = useState('');
  const [tTo, setTTo] = useState('');
  const [tAmount, setTAmount] = useState(50000);
  const [tType, setTType] = useState<'Bank-to-Bank' | 'Cash-to-Bank' | 'Bank-to-Cash'>('Bank-to-Bank');
  const [tRef, setTRef] = useState('');
  const [tRemarks, setTRemarks] = useState('');

  // 2. Creditor Modal State
  const [cSupplier, setCSupplier] = useState('');
  const [cContact, setCContact] = useState('');
  const [cPhone, setCPhone] = useState('');
  const [cCategory, setCCategory] = useState('Ration & Wholesale Grains');
  const [cInvoice, setCInvoice] = useState('');
  const [cBillDate, setCBillDate] = useState('1447-02-20');
  const [cTotalBill, setCTotalBill] = useState(75000);
  const [cPaid, setCPaid] = useState(25000);
  const [cDueDate, setCDueDate] = useState('1447-03-20');

  // 3. Bank Modal State
  const [bBankName, setBBankName] = useState('');
  const [bAccNo, setBAccNo] = useState('');
  const [bHolder, setBHolder] = useState('Anjuman-e-Burhani FMB Kitchen A/C');
  const [bBranch, setBBranch] = useState('');
  const [bIfsc, setBIfsc] = useState('');
  const [bType, setBType] = useState<'Current' | 'Savings' | 'Overdraft'>('Current');
  const [bOpening, setBOpening] = useState(500000);

  // 4. Tag Modal State
  const [tagName, setTagName] = useState('');
  const [tagCode, setTagCode] = useState('');
  const [tagType, setTagType] = useState<'Receipt' | 'Payment' | 'Extra Income' | 'All'>('All');
  const [tagColor, setTagColor] = useState('#10B981');
  const [tagDesc, setTagDesc] = useState('');

  // 5. Receipt Setting State
  const [niyazPfx, setNiyazPfx] = useState(receiptSettings.niyazPrefix);
  const [hoobPfx, setHoobPfx] = useState(receiptSettings.hoobPrefix);
  const [zabihatPfx, setZabihatPfx] = useState(receiptSettings.zabihatPrefix);
  const [mohallaWise, setMohallaWise] = useState(receiptSettings.mohallaWisePrefix);
  const [paytypeWise, setPaytypeWise] = useState(receiptSettings.paytypeWiseSequence);
  const [startNo, setStartNo] = useState(receiptSettings.startingNumber);
  const [resetAnnual, setResetAnnual] = useState(receiptSettings.resetAnnually);

  // 6. WaiveOff Modal State
  const [wIts, setWIts] = useState('');
  const [wName, setWName] = useState('');
  const [wSabeel, setWSabeel] = useState('');
  const [wThaali, setWThaali] = useState('');
  const [wMohalla, setWMohalla] = useState('');
  const [wOriginal, setWOriginal] = useState(52000);
  const [wWaived, setWWaived] = useState(15000);
  const [wReason, setWReason] = useState('');
  const [wApprovedBy, setWApprovedBy] = useState('Janab Aamil Saheb');

  // Sub-Navigation Tabs
  const subTabs = [
    { key: 'transfer',   label: 'Amount Transfer',    icon: ArrowLeftRight, cite: '[cite: 31]' },
    { key: 'creditors',  label: 'Creditors Entry',    icon: Users,          cite: '[cite: 32]' },
    { key: 'banks',      label: 'Bank Master',        icon: Landmark,       cite: '[cite: 33]' },
    { key: 'tagging',    label: 'Tagging List',       icon: Tag,            cite: '[cite: 35]' },
    { key: 'receipt-no', label: 'Receipt No Setting', icon: Hash,           cite: '[cite: 36]' },
    { key: 'waiveoff',   label: 'Faiz WaiveOff List', icon: Percent,        cite: '[cite: 37]' },
  ];

  /* ── Handlers ── */
  const handleSaveTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tFrom || !tTo || tAmount <= 0) {
      showToast('Please fill from/to accounts and valid transfer amount.');
      return;
    }
    const newItem: AccountTransferItem = {
      id: `at-${Date.now()}`,
      transferDate: tDate,
      fromAccount: tFrom,
      toAccount: tTo,
      amount: tAmount,
      transferType: tType,
      referenceNo: tRef || `TXN-${Date.now().toString().slice(-6)}`,
      remarks: tRemarks,
      authorizedBy: currentUser?.fullName || currentUser?.displayName || currentUser?.username || 'Admin',
      status: 'Completed',
    };
    const next = [newItem, ...transfers];
    setTransfers(next);
    saveStoredAccountTransfers(next);
    showToast(`Transferred ${fmtINR(tAmount)} from ${tFrom} to ${tTo}`);
    setModalType(null);
  };

  const handleSaveCreditor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cSupplier || cTotalBill <= 0) {
      showToast('Please enter supplier name and valid total bill.');
      return;
    }
    const balance = Math.max(0, cTotalBill - cPaid);
    const newItem: CreditorEntryItem = {
      id: `crd-${Date.now()}`,
      supplierName: cSupplier,
      contactPerson: cContact,
      phone: cPhone,
      category: cCategory,
      invoiceNo: cInvoice || `INV-${Date.now().toString().slice(-4)}`,
      billDate: cBillDate,
      totalBill: cTotalBill,
      paidAmount: cPaid,
      balanceDue: balance,
      dueDate: cDueDate,
      status: balance === 0 ? 'Cleared' : cPaid > 0 ? 'Partially Paid' : 'Outstanding',
    };
    const next = [newItem, ...creditors];
    setCreditors(next);
    saveStoredCreditors(next);
    showToast(`Added creditor bill for ${cSupplier}`);
    setModalType(null);
  };

  const handleSaveBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bBankName || !bAccNo) {
      showToast('Please enter bank name and account number.');
      return;
    }
    const newItem: FmbBankMasterItem = {
      id: `bnk-${Date.now()}`,
      bankName: bBankName,
      accountNumber: bAccNo,
      accountHolderName: bHolder,
      branch: bBranch,
      ifscCode: bIfsc,
      accountType: bType,
      openingBalance: bOpening,
      currentBalance: bOpening,
      status: 'Active',
    };
    const next = [newItem, ...banks];
    setBanks(next);
    saveStoredBanks(next);
    showToast(`Registered bank account ${bBankName} (${bAccNo})`);
    setModalType(null);
  };

  const handleSaveTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagName || !tagCode) {
      showToast('Please enter tag name and tag code.');
      return;
    }
    const newItem: FmbTaggingItem = {
      id: `tag-${Date.now()}`,
      tagName,
      tagCode: tagCode.toUpperCase(),
      tagType,
      color: tagColor,
      description: tagDesc,
      status: 'Active',
    };
    const next = [newItem, ...tags];
    setTags(next);
    saveStoredTags(next);
    showToast(`Added community tagging rule "${tagName}"`);
    setModalType(null);
  };

  const handleSaveReceiptSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: ReceiptNoSettingConfig = {
      ...receiptSettings,
      niyazPrefix: niyazPfx,
      hoobPrefix: hoobPfx,
      zabihatPrefix: zabihatPfx,
      mohallaWisePrefix: mohallaWise,
      paytypeWiseSequence: paytypeWise,
      startingNumber: startNo,
      resetAnnually: resetAnnual,
      samplePreview: `${hoobPfx}${mohallaWise ? 'MOH-' : ''}1447-${startNo.toString().padStart(5, '0')}`,
      lastUpdated: new Date().toISOString().split('T')[0],
    };
    setReceiptSettings(updated);
    saveStoredReceiptSettings(updated);
    showToast('Receipt numbering rules and prefixes updated successfully.');
  };

  const handleSaveWaiveOff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wIts || !wName || wWaived <= 0) {
      showToast('Please enter ITS, HOF name, and valid waived amount.');
      return;
    }
    const net = Math.max(0, wOriginal - wWaived);
    const newItem: FaizWaiveOffItem = {
      id: `wo-${Date.now()}`,
      itsNumber: wIts,
      hofName: wName,
      sabeelNo: wSabeel || 'SAB-101',
      thaaliNo: wThaali || 'TH-001',
      mohalla: wMohalla || 'Burhani Mohallah',
      originalTakhmeen: wOriginal,
      waivedAmount: wWaived,
      netPayable: net,
      reason: wReason,
      approvedBy: wApprovedBy,
      date: new Date().toISOString().split('T')[0],
      status: 'Approved',
    };
    const next = [newItem, ...waiveOffs];
    setWaiveOffs(next);
    saveStoredWaiveOffs(next);
    showToast(`Approved waiver of ${fmtINR(wWaived)} for ${wName}`);
    setModalType(null);
  };

  return (
    <div className="space-y-6">
      {/* ── Banner Card ── */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300/60 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500 text-slate-950 shadow-xs">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              Faiz Additional Masters & Settings
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Account transfers, vendor creditors, bank accounts, tagging rules, receipt numbers, and waivers [cite: 31, 32, 33, 35, 36, 37]
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeTab !== 'receipt-no' && canAdd && (
            <button
              type="button"
              onClick={() => setModalType(activeTab)}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Record</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Sub-Master Navigation Ribbon ── */}
      <div className="bg-white border border-amber-300/60 rounded-xl p-1.5 shadow-xs flex items-center gap-1 overflow-x-auto select-none">
        {subTabs.map(({ key, label, icon: Icon, cite }) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setActiveTab(key as MasterSubTab);
              setSearchQuery('');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === key
                ? 'bg-amber-400 text-slate-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-amber-50'
            }`}
          >
            <Icon className="w-4 h-4 text-amber-900" />
            <span>{label}</span>
            <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">{cite}</span>
          </button>
        ))}
      </div>

      {/* =========================================================================
       * 1. AMOUNT TRANSFER (ACCOUNT TRANSFER LIST) [cite: 31]
       * ========================================================================= */}
      {activeTab === 'transfer' && (
        <div className="bg-white border border-amber-300/60 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between text-xs">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Account Transfer List [cite: 31]</h3>
              <p className="text-[11px] text-slate-500">Internal liquidity shifts between bank accounts and cash vaults</p>
            </div>
            <span className="font-bold text-slate-700">
              Total Transfers: <strong className="text-amber-900">{transfers.length}</strong>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-amber-50/60 text-slate-700 font-bold border-y border-amber-200">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">From Account</th>
                  <th className="py-2.5 px-3">To Account</th>
                  <th className="py-2.5 px-3">Transfer Type</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3">Reference No</th>
                  <th className="py-2.5 px-3">Remarks</th>
                  <th className="py-2.5 px-3">Authorized By</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transfers.map((item) => (
                  <tr key={item.id} className="hover:bg-amber-50/30">
                    <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">{item.transferDate}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-800">{item.fromAccount}</td>
                    <td className="py-2.5 px-3 font-bold text-emerald-800">{item.toAccount}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-700">{item.transferType}</td>
                    <td className="py-2.5 px-3 text-right font-black text-slate-900">{fmtINR(item.amount)}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">{item.referenceNo}</td>
                    <td className="py-2.5 px-3 text-slate-600 truncate max-w-[200px]">{item.remarks}</td>
                    <td className="py-2.5 px-3 text-slate-700 font-medium">{item.authorizedBy}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
       * 2. CREDITORS ENTRY [cite: 32]
       * ========================================================================= */}
      {activeTab === 'creditors' && (
        <div className="bg-white border border-amber-300/60 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between text-xs">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Creditors & Supplier Invoices [cite: 32]</h3>
              <p className="text-[11px] text-slate-500">Track outstanding payable accounts to grocery merchants and kitchen vendors</p>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-500 block">Total Outstanding Payable</span>
              <span className="font-black text-rose-700 text-sm">
                {fmtINR(creditors.reduce((s, c) => s + c.balanceDue, 0))}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-amber-50/60 text-slate-700 font-bold border-y border-amber-200">
                  <th className="py-2.5 px-3">Supplier Name</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Contact</th>
                  <th className="py-2.5 px-3">Invoice No</th>
                  <th className="py-2.5 px-3 text-right">Total Bill</th>
                  <th className="py-2.5 px-3 text-right">Paid</th>
                  <th className="py-2.5 px-3 text-right">Balance Due</th>
                  <th className="py-2.5 px-3">Due Date</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {creditors.map((item) => (
                  <tr key={item.id} className="hover:bg-amber-50/30">
                    <td className="py-2.5 px-3 font-bold text-slate-900">{item.supplierName}</td>
                    <td className="py-2.5 px-3 text-slate-600">{item.category}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">{item.phone}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-700">{item.invoiceNo}</td>
                    <td className="py-2.5 px-3 text-right font-medium">{fmtINR(item.totalBill)}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-700">{fmtINR(item.paidAmount)}</td>
                    <td className="py-2.5 px-3 text-right font-black text-rose-700">{fmtINR(item.balanceDue)}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">{item.dueDate}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.status === 'Cleared' ? 'bg-emerald-100 text-emerald-800' :
                        item.status === 'Partially Paid' ? 'bg-amber-100 text-amber-800' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
       * 3. BANK MASTER [cite: 33]
       * ========================================================================= */}
      {activeTab === 'banks' && (
        <div className="bg-white border border-amber-300/60 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between text-xs">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Bank Master Accounts [cite: 33]</h3>
              <p className="text-[11px] text-slate-500">Official chartered banking repositories for FMB operations</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-amber-50/60 text-slate-700 font-bold border-y border-amber-200">
                  <th className="py-2.5 px-3">Bank Name</th>
                  <th className="py-2.5 px-3">Account Number</th>
                  <th className="py-2.5 px-3">Account Holder</th>
                  <th className="py-2.5 px-3">Branch</th>
                  <th className="py-2.5 px-3">IFSC</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3 text-right">Current Balance</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {banks.map((item) => (
                  <tr key={item.id} className="hover:bg-amber-50/30">
                    <td className="py-2.5 px-3 font-bold text-slate-900">{item.bankName}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{item.accountNumber}</td>
                    <td className="py-2.5 px-3 text-slate-700">{item.accountHolderName}</td>
                    <td className="py-2.5 px-3 text-slate-600">{item.branch}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">{item.ifscCode}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-700">{item.accountType}</td>
                    <td className="py-2.5 px-3 text-right font-black text-emerald-700 text-sm">{fmtINR(item.currentBalance)}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
       * 4. TAGGING LIST (RECEIPT / PAYMENT / EXTRA INCOME) [cite: 35]
       * ========================================================================= */}
      {activeTab === 'tagging' && (
        <div className="bg-white border border-amber-300/60 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between text-xs">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Tagging List (Receipt / Payment / Extra Income) [cite: 35]</h3>
              <p className="text-[11px] text-slate-500">Miqaat categorization tags for cost-center accounting and revenue segregation</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tags.map((t) => (
              <div key={t.id} className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0"
                      style={{ backgroundColor: t.color }}
                    />
                    <h4 className="font-bold text-xs text-slate-900">{t.tagName}</h4>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                    {t.tagType}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">{t.description}</p>
                <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-100">
                  <span>Code: {t.tagCode}</span>
                  <span className="text-emerald-700 font-bold">Active</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
       * 5. RECEIPT NO SETTING [cite: 36]
       * ========================================================================= */}
      {activeTab === 'receipt-no' && (
        <div className="bg-white border border-amber-300/60 rounded-2xl p-6 shadow-xs space-y-6">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Receipt No Setting & Prefix Rules [cite: 36]</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure continuation rules for Niyaz, Hoob, Zabihat, Mohalla-wise, and Paytype-wise sequencing
            </p>
          </div>

          <form onSubmit={handleSaveReceiptSettings} className="space-y-5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Niyaz Prefix *</label>
                <input
                  type="text"
                  value={niyazPfx}
                  onChange={(e) => setNiyazPfx(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Hoob (Hub) Prefix *</label>
                <input
                  type="text"
                  value={hoobPfx}
                  onChange={(e) => setHoobPfx(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Zabihat Prefix *</label>
                <input
                  type="text"
                  value={zabihatPfx}
                  onChange={(e) => setZabihatPfx(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mohallaWise}
                    onChange={(e) => setMohallaWise(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <span className="font-bold text-slate-800">Mohalla-Wise Numbering Continuation [cite: 36]</span>
                </label>
                <p className="text-[11px] text-slate-500 pl-6">
                  Appends Mohalla Sector prefix to the receipt sequence (e.g. FMB-HUB-SEC-A-01001).
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={paytypeWise}
                    onChange={(e) => setPaytypeWise(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <span className="font-bold text-slate-800">Paytype-Wise Sequence Separation [cite: 36]</span>
                </label>
                <p className="text-[11px] text-slate-500 pl-6">
                  Maintains separate running sequence books for Cash, Cheque, and Online POS transactions.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Starting Running Sequence No</label>
                <input
                  type="number"
                  value={startNo}
                  onChange={(e) => setStartNo(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="space-y-1 flex flex-col justify-end">
                <label className="flex items-center gap-2 cursor-pointer pb-2">
                  <input
                    type="checkbox"
                    checked={resetAnnual}
                    onChange={(e) => setResetAnnual(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <span className="font-bold text-slate-800">Reset Sequence Annually on Lailatul Qadr</span>
                </label>
              </div>
            </div>

            {/* Live Sample Format Preview */}
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Live Sample Generated Receipt Format:</span>
                <span className="font-mono font-black text-sm text-amber-950 mt-0.5 block">
                  {hoobPfx}{mohallaWise ? 'SEC-B-' : ''}1447-{startNo.toString().padStart(5, '0')}
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900">
                Rule Validated
              </span>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Numbering Rules</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =========================================================================
       * 6. FAIZ WAIVEOFF LIST [cite: 37]
       * ========================================================================= */}
      {activeTab === 'waiveoff' && (
        <div className="bg-white border border-amber-300/60 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between text-xs">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Faiz WaiveOff & Concession List [cite: 37]</h3>
              <p className="text-[11px] text-slate-500">Official exemptions and subsidized relief authorized by Janab Aamil Saheb</p>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-500 block">Total Waived Subsidies</span>
              <span className="font-black text-amber-900 text-sm">
                {fmtINR(waiveOffs.reduce((s, w) => s + w.waivedAmount, 0))}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-amber-50/60 text-slate-700 font-bold border-y border-amber-200">
                  <th className="py-2.5 px-3">ITS / HOF Name</th>
                  <th className="py-2.5 px-3">Sabeel / Thaali</th>
                  <th className="py-2.5 px-3">Mohalla</th>
                  <th className="py-2.5 px-3 text-right">Original</th>
                  <th className="py-2.5 px-3 text-right">Waived Amount</th>
                  <th className="py-2.5 px-3 text-right">Net Payable</th>
                  <th className="py-2.5 px-3">Authorized By</th>
                  <th className="py-2.5 px-3">Approval Date</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {waiveOffs.map((item) => (
                  <tr key={item.id} className="hover:bg-amber-50/30">
                    <td className="py-2.5 px-3">
                      <span className="font-bold text-slate-900 block">{item.hofName}</span>
                      <span className="font-mono text-[10px] text-slate-500">ITS: {item.itsNumber}</span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-700">
                      <span className="block font-bold">{item.sabeelNo}</span>
                      <span className="text-[10px] text-amber-900">{item.thaaliNo}</span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{item.mohalla}</td>
                    <td className="py-2.5 px-3 text-right font-medium">{fmtINR(item.originalTakhmeen)}</td>
                    <td className="py-2.5 px-3 text-right font-black text-rose-700">{fmtINR(item.waivedAmount)}</td>
                    <td className="py-2.5 px-3 text-right font-black text-emerald-700">{fmtINR(item.netPayable)}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{item.approvedBy}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">{item.date}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                        item.status === 'Review' ? 'bg-amber-100 text-amber-800' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
       * MODALS FOR EACH SUB-MASTER
       * ========================================================================= */}

      {/* 1. Transfer Modal */}
      {modalType === 'transfer' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-amber-300 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-amber-100 bg-amber-50 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">Add Account Transfer</h3>
              <button onClick={() => setModalType(null)} className="p-1 rounded text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveTransfer} className="p-5 space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700">From Account *</label>
                <input
                  type="text"
                  value={tFrom}
                  onChange={(e) => setTFrom(e.target.value)}
                  placeholder="e.g. HDFC Niyaz Collection A/C"
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="font-bold text-slate-700">To Account *</label>
                <input
                  type="text"
                  value={tTo}
                  onChange={(e) => setTTo(e.target.value)}
                  placeholder="e.g. State Bank of India — FMB Kitchen A/C"
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Amount (INR) *</label>
                  <input
                    type="number"
                    min="1"
                    value={tAmount}
                    onChange={(e) => setTAmount(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-bold text-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Transfer Type</label>
                  <select
                    value={tType}
                    onChange={(e) => setTType(e.target.value as any)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300"
                  >
                    <option value="Bank-to-Bank">Bank-to-Bank</option>
                    <option value="Cash-to-Bank">Cash-to-Bank</option>
                    <option value="Bank-to-Cash">Bank-to-Cash</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700">Remarks</label>
                <textarea
                  rows={2}
                  value={tRemarks}
                  onChange={(e) => setTRemarks(e.target.value)}
                  placeholder="Transfer reasons or clearance notes..."
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-3 py-1.5 rounded-xl border border-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
                >
                  Save Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Creditor Modal */}
      {modalType === 'creditors' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-amber-300 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-amber-100 bg-amber-50 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">Add Creditor / Vendor Bill</h3>
              <button onClick={() => setModalType(null)} className="p-1 rounded text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveCreditor} className="p-5 space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700">Supplier / Vendor Name *</label>
                <input
                  type="text"
                  value={cSupplier}
                  onChange={(e) => setCSupplier(e.target.value)}
                  placeholder="e.g. M/S Burhani Grain Merchants"
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-bold"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Category</label>
                  <input
                    type="text"
                    value={cCategory}
                    onChange={(e) => setCCategory(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Invoice No</label>
                  <input
                    type="text"
                    value={cInvoice}
                    onChange={(e) => setCInvoice(e.target.value)}
                    placeholder="e.g. BGM-882"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Total Bill Amount *</label>
                  <input
                    type="number"
                    min="1"
                    value={cTotalBill}
                    onChange={(e) => setCTotalBill(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Paid Amount</label>
                  <input
                    type="number"
                    min="0"
                    value={cPaid}
                    onChange={(e) => setCPaid(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-bold text-emerald-700"
                  />
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setModalType(null)} className="px-3 py-1.5 rounded-xl border border-slate-300">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold">
                  Save Creditor Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Bank Modal */}
      {modalType === 'banks' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-amber-300 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-amber-100 bg-amber-50 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">Add Bank Account</h3>
              <button onClick={() => setModalType(null)} className="p-1 rounded text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveBank} className="p-5 space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700">Bank Name *</label>
                <input
                  type="text"
                  value={bBankName}
                  onChange={(e) => setBBankName(e.target.value)}
                  placeholder="e.g. State Bank of India"
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-bold"
                  required
                />
              </div>
              <div>
                <label className="font-bold text-slate-700">Account Number *</label>
                <input
                  type="text"
                  value={bAccNo}
                  onChange={(e) => setBAccNo(e.target.value)}
                  placeholder="e.g. 38920194018"
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-mono font-bold"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">IFSC Code</label>
                  <input
                    type="text"
                    value={bIfsc}
                    onChange={(e) => setBIfsc(e.target.value)}
                    placeholder="SBIN0004521"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Account Type</label>
                  <select
                    value={bType}
                    onChange={(e) => setBType(e.target.value as any)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300"
                  >
                    <option value="Current">Current Account</option>
                    <option value="Savings">Savings Account</option>
                    <option value="Overdraft">Overdraft Facility</option>
                  </select>
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setModalType(null)} className="px-3 py-1.5 rounded-xl border border-slate-300">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold">
                  Save Bank Master
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Tag Modal */}
      {modalType === 'tagging' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-amber-300 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-amber-100 bg-amber-50 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">Add Community Tag Rule</h3>
              <button onClick={() => setModalType(null)} className="p-1 rounded text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveTag} className="p-5 space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700">Tag Name *</label>
                <input
                  type="text"
                  value={tagName}
                  onChange={(e) => setTagName(e.target.value)}
                  placeholder="e.g. Ramadan Special Daily Thaali"
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-bold"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Tag Code *</label>
                  <input
                    type="text"
                    value={tagCode}
                    onChange={(e) => setTagCode(e.target.value)}
                    placeholder="e.g. RAM-THAALI"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Tag Type</label>
                  <select
                    value={tagType}
                    onChange={(e) => setTagType(e.target.value as any)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300"
                  >
                    <option value="All">All Vouchers</option>
                    <option value="Receipt">Receipt Only</option>
                    <option value="Payment">Payment Only</option>
                    <option value="Extra Income">Extra Income</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700">Description</label>
                <textarea
                  rows={2}
                  value={tagDesc}
                  onChange={(e) => setTagDesc(e.target.value)}
                  placeholder="Rule criteria or miqaat notes..."
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setModalType(null)} className="px-3 py-1.5 rounded-xl border border-slate-300">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold">
                  Save Tag
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. WaiveOff Modal */}
      {modalType === 'waiveoff' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-amber-300 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-amber-100 bg-amber-50 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">Add Faiz WaiveOff & Concession</h3>
              <button onClick={() => setModalType(null)} className="p-1 rounded text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveWaiveOff} className="p-5 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">ITS No *</label>
                  <input
                    type="text"
                    value={wIts}
                    onChange={(e) => setWIts(e.target.value)}
                    placeholder="e.g. 30489122"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">HOF Full Name *</label>
                  <input
                    type="text"
                    value={wName}
                    onChange={(e) => setWName(e.target.value)}
                    placeholder="e.g. Mulla Shabbir Bhai"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-bold"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Original Takhmeen (INR) *</label>
                  <input
                    type="number"
                    min="1"
                    value={wOriginal}
                    onChange={(e) => setWOriginal(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Waived Concession Amount *</label>
                  <input
                    type="number"
                    min="1"
                    value={wWaived}
                    onChange={(e) => setWWaived(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-bold text-rose-700"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Net Payable</label>
                  <div className="px-3 py-1.5 rounded-xl bg-slate-100 font-black text-emerald-700">
                    {fmtINR(Math.max(0, wOriginal - wWaived))}
                  </div>
                </div>
                <div>
                  <label className="font-bold text-slate-700">Approved By *</label>
                  <input
                    type="text"
                    value={wApprovedBy}
                    onChange={(e) => setWApprovedBy(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-bold"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700">Concession Reason / Committee Notes</label>
                <textarea
                  rows={2}
                  value={wReason}
                  onChange={(e) => setWReason(e.target.value)}
                  placeholder="Medical grounds, student hardship, or special blessing..."
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setModalType(null)} className="px-3 py-1.5 rounded-xl border border-slate-300">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold">
                  Approve WaiveOff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
