import React, { useState, useMemo } from 'react';
import {
  Building2, Plus, Search, Filter, Download, Receipt, CreditCard,
  CheckCircle2, X, AlertCircle, Ban, Printer, FileSpreadsheet,
  Users, Key, Clock, ShieldAlert, DollarSign, Home, ArrowUpRight
} from 'lucide-react';
import { UserProfile, FinancialYear } from '../../types';
import {
  JamaatProperty, JamaatTenant, RentAgreement, RentReceipt, PropertyType, PaymentMode,
  getStoredProperties, saveStoredProperties,
  getStoredTenants, saveStoredTenants,
  getStoredAgreements, saveStoredAgreements,
  getStoredRentReceipts, saveStoredRentReceipts
} from '../../utils/part2bManagement';
import { appendActivityLog } from '../../utils/rbac';

export type RentSubTab =
  | 'rent-property-master'
  | 'rent-tenant-master'
  | 'rent-agreement-master'
  | 'rent-payment-entry'
  | 'rent-outstanding-report'
  | 'rent-ledger-report'
  | 'rent-cancelled-receipts';

interface Props {
  currentUser: UserProfile;
  activeSubItemId: string;
  subItemLabel: string;
  financialYear: FinancialYear;
  showToast: (m: string) => void;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

const fmtINR = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export const RentManagementModule: React.FC<Props> = ({
  currentUser,
  activeSubItemId,
  financialYear,
  showToast,
  canAdd,
  canDelete,
}) => {
  const [properties, setProperties] = useState<JamaatProperty[]>(() => getStoredProperties());
  const [tenants, setTenants] = useState<JamaatTenant[]>(() => getStoredTenants());
  const [agreements, setAgreements] = useState<RentAgreement[]>(() => getStoredAgreements());
  const [receipts, setReceipts] = useState<RentReceipt[]>(() => getStoredRentReceipts());

  const [activeTab, setActiveTab] = useState<RentSubTab>(() => {
    return (activeSubItemId as RentSubTab) || 'rent-property-master';
  });

  React.useEffect(() => {
    if (activeSubItemId) setActiveTab(activeSubItemId as RentSubTab);
  }, [activeSubItemId]);

  // Modal States
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [propertyForm, setPropertyForm] = useState({
    propertyCode: '',
    name: '',
    propertyType: 'Commercial Shop' as PropertyType,
    address: '',
    builtUpSqFt: 350,
    monthlyRentalSlab: 18000,
    status: 'Vacant' as 'Occupied' | 'Vacant' | 'Under Renovation',
    meterNumber: '',
  });

  const [showTenantModal, setShowTenantModal] = useState(false);
  const [tenantForm, setTenantForm] = useState({
    name: '',
    isMumin: true,
    itsNumber: '',
    contactNumber: '',
    email: '',
    aadhaarOrGst: '',
    permanentAddress: '',
    emergencyContact: '',
  });

  const [showAgreementModal, setShowAgreementModal] = useState(false);
  const [agreementForm, setAgreementForm] = useState({
    propertyId: '',
    tenantId: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '2028-03-31',
    monthlyRent: 18500,
    securityDeposit: 75000,
    incrementPercentage: 5,
    paymentDueDay: 5,
  });

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellingReceipt, setCancellingReceipt] = useState<RentReceipt | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const [selectedReceiptForPrint, setSelectedReceiptForPrint] = useState<RentReceipt | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Payment Form
  const [paymentForm, setPaymentForm] = useState({
    agreementId: '',
    forMonth: 'October 2026',
    amount: 18500,
    paymentMode: 'Cash' as PaymentMode,
    transactionRef: '',
    date: new Date().toISOString().split('T')[0],
  });

  const activeReceipts = useMemo(() => receipts.filter(r => !r.isCancelled), [receipts]);
  const cancelledReceipts = useMemo(() => receipts.filter(r => r.isCancelled), [receipts]);

  // Total Rent Metrics
  const totalMonthlyRoll = useMemo(() => {
    return agreements
      .filter(a => a.status === 'Active' || a.status === 'Expiring Soon')
      .reduce((acc, a) => acc + a.monthlyRent, 0);
  }, [agreements]);

  const totalCollected = useMemo(() => {
    return activeReceipts.reduce((acc, r) => acc + r.amount, 0);
  }, [activeReceipts]);

  const occupiedCount = useMemo(() => properties.filter(p => p.status === 'Occupied').length, [properties]);

  // Save Property
  const handleSaveProperty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyForm.name || !propertyForm.propertyCode) {
      showToast('Property code and title are required');
      return;
    }

    const newP: JamaatProperty = {
      id: `prop-${Date.now()}`,
      propertyCode: propertyForm.propertyCode,
      name: propertyForm.name,
      propertyType: propertyForm.propertyType,
      address: propertyForm.address,
      builtUpSqFt: Number(propertyForm.builtUpSqFt),
      monthlyRentalSlab: Number(propertyForm.monthlyRentalSlab),
      status: propertyForm.status,
      meterNumber: propertyForm.meterNumber,
    };

    const updated = [...properties, newP];
    setProperties(updated);
    saveStoredProperties(updated);

    appendActivityLog(
      currentUser.username,
      'Rent Management',
      'Property Master',
      'ADD',
      `Registered new Jamaat property [${newP.propertyCode}] ${newP.name}`
    );

    showToast(`Property "${newP.name}" registered successfully!`);
    setShowPropertyModal(false);
  };

  // Save Tenant
  const handleSaveTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantForm.name || !tenantForm.contactNumber) {
      showToast('Tenant name and contact number are required');
      return;
    }

    const newT: JamaatTenant = {
      id: `ten-${Date.now()}`,
      tenantCode: `TEN-${String(tenants.length + 1).padStart(3, '0')}`,
      name: tenantForm.name,
      isMumin: tenantForm.isMumin,
      itsNumber: tenantForm.isMumin ? tenantForm.itsNumber : undefined,
      contactNumber: tenantForm.contactNumber,
      email: tenantForm.email,
      aadhaarOrGst: tenantForm.aadhaarOrGst,
      permanentAddress: tenantForm.permanentAddress,
      emergencyContact: tenantForm.emergencyContact,
      status: 'Active',
    };

    const updated = [...tenants, newT];
    setTenants(updated);
    saveStoredTenants(updated);

    appendActivityLog(
      currentUser.username,
      'Rent Management',
      'Tenant Master',
      'ADD',
      `Enrolled new tenant [${newT.tenantCode}] ${newT.name}`
    );

    showToast(`Tenant "${newT.name}" registered successfully!`);
    setShowTenantModal(false);
  };

  // Save Agreement
  const handleSaveAgreement = (e: React.FormEvent) => {
    e.preventDefault();
    const prop = properties.find(p => p.id === agreementForm.propertyId);
    const ten = tenants.find(t => t.id === agreementForm.tenantId);

    if (!prop || !ten) {
      showToast('Select valid property and tenant');
      return;
    }

    const newAgr: RentAgreement = {
      id: `agr-${Date.now()}`,
      agreementNo: `AGR-2026-${String(agreements.length + 1).padStart(2, '0')}`,
      propertyId: prop.id,
      propertyCode: prop.propertyCode,
      propertyName: prop.name,
      tenantId: ten.id,
      tenantName: ten.name,
      startDate: agreementForm.startDate,
      endDate: agreementForm.endDate,
      monthlyRent: Number(agreementForm.monthlyRent),
      securityDeposit: Number(agreementForm.securityDeposit),
      incrementPercentage: Number(agreementForm.incrementPercentage),
      paymentDueDay: Number(agreementForm.paymentDueDay),
      status: 'Active',
    };

    // Mark property as Occupied
    const updatedProps = properties.map(p => p.id === prop.id ? { ...p, status: 'Occupied' as const, currentTenantId: ten.id } : p);
    setProperties(updatedProps);
    saveStoredProperties(updatedProps);

    const updatedAgrs = [newAgr, ...agreements];
    setAgreements(updatedAgrs);
    saveStoredAgreements(updatedAgrs);

    appendActivityLog(
      currentUser.username,
      'Rent Management',
      'Agreement Master',
      'ADD',
      `Executed Lease Agreement #${newAgr.agreementNo} for ${prop.name} with ${ten.name}`
    );

    showToast(`Agreement #${newAgr.agreementNo} created!`);
    setShowAgreementModal(false);
  };

  // Submit Rent Payment
  const handleRentPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const agr = agreements.find(a => a.id === paymentForm.agreementId);
    if (!agr || paymentForm.amount <= 0) {
      showToast('Please select a valid lease agreement and rent amount');
      return;
    }

    const recNo = `RENT-2026-${String(receipts.length + 1).padStart(3, '0')}`;
    const newR: RentReceipt = {
      id: `rrec-${Date.now()}`,
      receiptNo: recNo,
      agreementId: agr.id,
      propertyId: agr.propertyId,
      propertyName: agr.propertyName,
      tenantId: agr.tenantId,
      tenantName: agr.tenantName,
      forMonth: paymentForm.forMonth,
      amount: Number(paymentForm.amount),
      paymentMode: paymentForm.paymentMode,
      transactionRef: paymentForm.transactionRef,
      date: paymentForm.date,
      financialYear,
      collectedBy: currentUser.username,
      isCancelled: false,
    };

    const updated = [newR, ...receipts];
    setReceipts(updated);
    saveStoredRentReceipts(updated);
    setSelectedReceiptForPrint(newR);

    appendActivityLog(
      currentUser.username,
      'Rent Management',
      'Rent Payment Entry',
      'PAYMENT',
      `Collected rent receipt #${recNo} of ${fmtINR(newR.amount)} for [${agr.propertyCode}] from ${newR.tenantName}`
    );

    showToast(`Rent Receipt #${recNo} generated successfully!`);
  };

  // Cancel Receipt
  const handleConfirmCancel = () => {
    if (!cancellingReceipt || !cancelReason) {
      showToast('Reason required');
      return;
    }

    const updated = receipts.map(r => {
      if (r.id === cancellingReceipt.id) {
        return {
          ...r,
          isCancelled: true,
          cancelledAt: new Date().toISOString().split('T')[0],
          cancelledBy: currentUser.username,
          cancellationReason: cancelReason,
        };
      }
      return r;
    });

    setReceipts(updated);
    saveStoredRentReceipts(updated);

    appendActivityLog(
      currentUser.username,
      'Rent Management',
      'Cancelled Receipts',
      'CANCEL_RECEIPT',
      `Revoked rent receipt #${cancellingReceipt.receiptNo}: ${cancelReason}`
    );

    showToast(`Receipt #${cancellingReceipt.receiptNo} cancelled`);
    setShowCancelModal(false);
    setCancellingReceipt(null);
    setCancelReason('');
  };

  const tabs: { key: RentSubTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { key: 'rent-property-master',    label: '1. Property Master',    icon: <Building2 className="w-3.5 h-3.5" />, badge: `${properties.length}` },
    { key: 'rent-tenant-master',      label: '2. Tenant Master',      icon: <Users className="w-3.5 h-3.5" />, badge: `${tenants.length}` },
    { key: 'rent-agreement-master',   label: '3. Agreements Master',  icon: <Key className="w-3.5 h-3.5" />, badge: `${agreements.length}` },
    { key: 'rent-payment-entry',      label: '4. Rent Collection',    icon: <CreditCard className="w-3.5 h-3.5" />, badge: 'POS' },
    { key: 'rent-outstanding-report', label: '5. Outstanding Report', icon: <AlertCircle className="w-3.5 h-3.5" /> },
    { key: 'rent-ledger-report',      label: '6. Ledger Report',      icon: <FileSpreadsheet className="w-3.5 h-3.5" /> },
    { key: 'rent-cancelled-receipts', label: '7. Cancelled Receipts', icon: <Ban className="w-3.5 h-3.5" />, badge: cancelledReceipts.length ? String(cancelledReceipts.length) : undefined },
  ];

  return (
    <div className="space-y-5">
      {/* Module Header */}
      <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-indigo-950 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden border border-teal-500/20">
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-2 bg-teal-500/20 rounded-xl text-teal-300 border border-teal-400/30">
                <Building2 className="w-5 h-5" />
              </span>
              <span className="px-3 py-0.5 rounded-full text-xs font-semibold bg-teal-400/20 text-teal-200 border border-teal-400/30">
                Jamaat Awqaf &amp; Estate Department
              </span>
              <span className="text-xs text-teal-200/70 font-mono">Hijri {financialYear}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white mt-2">
              Rent &amp; Property Estate Management
            </h1>
            <p className="text-xs text-teal-100/70 max-w-2xl mt-1">
              Commercial shops, residential apartments, central storage godowns, tenant agreements, monthly kiraya collection, and renewal logs.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-2 bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 text-center">
            <div>
              <p className="text-[10px] text-teal-200 uppercase font-semibold">Properties</p>
              <p className="text-sm font-bold text-white font-mono">{properties.length} units</p>
              <p className="text-[10px] text-teal-300">{occupiedCount} occupied</p>
            </div>
            <div>
              <p className="text-[10px] text-emerald-300 uppercase font-semibold">Monthly Roll</p>
              <p className="text-sm font-bold text-emerald-300 font-mono">{fmtINR(totalMonthlyRoll)}</p>
              <p className="text-[10px] text-slate-300">Active leases</p>
            </div>
            <div>
              <p className="text-[10px] text-amber-300 uppercase font-semibold">Collected</p>
              <p className="text-sm font-bold text-amber-300 font-mono">{fmtINR(totalCollected)}</p>
              <p className="text-[10px] text-amber-300">{activeReceipts.length} receipts</p>
            </div>
          </div>
        </div>

        {/* Tab Ribbon */}
        <div className="flex items-center gap-1.5 mt-6 pt-4 border-t border-teal-500/20 overflow-x-auto scrollbar-none">
          {tabs.map(t => (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                activeTab === t.key
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-400/20'
                  : 'text-teal-100/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
              {t.badge && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTab === t.key ? 'bg-slate-900 text-amber-300' : 'bg-teal-500/30 text-teal-200'
                }`}>
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* SUB-PAGE 1: PROPERTY MASTER */}
      {activeTab === 'rent-property-master' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Jamaat Awqaf Property Register</h2>
              <p className="text-xs text-slate-500">Commercial shops, residential flats, and godowns owned by the Jamaat.</p>
            </div>
            {canAdd && (
              <button
                type="button"
                onClick={() => {
                  setPropertyForm({
                    propertyCode: `BP-SH-0${properties.length + 1}`,
                    name: '',
                    propertyType: 'Commercial Shop',
                    address: 'Burhani Park Complex',
                    builtUpSqFt: 400,
                    monthlyRentalSlab: 20000,
                    status: 'Vacant',
                    meterNumber: '',
                  });
                  setShowPropertyModal(true);
                }}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Property Unit</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Property Name</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Area (Sq Ft)</th>
                  <th className="px-4 py-3 text-right">Base Rent Slab</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3">Current Tenant</th>
                  <th className="px-4 py-3">Electricity Meter</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {properties.map(p => {
                  const currTen = tenants.find(t => t.id === p.currentTenantId);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3 font-mono font-bold text-teal-800">{p.propertyCode}</td>
                      <td className="px-4 py-3 font-bold text-slate-900">{p.name}</td>
                      <td className="px-4 py-3 text-slate-600">{p.propertyType}</td>
                      <td className="px-4 py-3 font-mono">{p.builtUpSqFt} sq ft</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">{fmtINR(p.monthlyRentalSlab)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.status === 'Occupied'
                            ? 'bg-emerald-100 text-emerald-800'
                            : p.status === 'Vacant'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{currTen ? currTen.name : '—'}</td>
                      <td className="px-4 py-3 font-mono text-slate-500">{p.meterNumber || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-PAGE 2: TENANT MASTER */}
      {activeTab === 'rent-tenant-master' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Tenant Directory &amp; KYC Verification</h2>
              <p className="text-xs text-slate-500">Mumineen and commercial tenants occupying Jamaat estate premises.</p>
            </div>
            {canAdd && (
              <button
                type="button"
                onClick={() => {
                  setTenantForm({
                    name: '',
                    isMumin: true,
                    itsNumber: '',
                    contactNumber: '',
                    email: '',
                    aadhaarOrGst: '',
                    permanentAddress: '',
                    emergencyContact: '',
                  });
                  setShowTenantModal(true);
                }}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Enroll New Tenant</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Tenant Code</th>
                  <th className="px-4 py-3">Tenant Name</th>
                  <th className="px-4 py-3">Community</th>
                  <th className="px-4 py-3">Contact #</th>
                  <th className="px-4 py-3">Aadhaar / GST</th>
                  <th className="px-4 py-3">Permanent Address</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tenants.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-mono font-bold text-teal-800">{t.tenantCode}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{t.name}</td>
                    <td className="px-4 py-3">
                      {t.isMumin ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold text-[10px]">
                          Mumin (ITS: {t.itsNumber})
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px]">
                          Commercial
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-700">{t.contactNumber}</td>
                    <td className="px-4 py-3 font-mono text-slate-600">{t.aadhaarOrGst}</td>
                    <td className="px-4 py-3 text-slate-500 max-w-xs truncate">{t.permanentAddress}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-PAGE 3: AGREEMENTS MASTER */}
      {activeTab === 'rent-agreement-master' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Lease Agreement Register</h2>
              <p className="text-xs text-slate-500">Active agreements, monthly rent, security deposits, and renewal dates.</p>
            </div>
            {canAdd && (
              <button
                type="button"
                onClick={() => {
                  setAgreementForm({
                    propertyId: properties[0]?.id || '',
                    tenantId: tenants[0]?.id || '',
                    startDate: new Date().toISOString().split('T')[0],
                    endDate: '2028-03-31',
                    monthlyRent: 18500,
                    securityDeposit: 75000,
                    incrementPercentage: 5,
                    paymentDueDay: 5,
                  });
                  setShowAgreementModal(true);
                }}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create Lease Agreement</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Agreement #</th>
                  <th className="px-4 py-3">Property Unit</th>
                  <th className="px-4 py-3">Tenant Name</th>
                  <th className="px-4 py-3">Tenure Period</th>
                  <th className="px-4 py-3 text-right">Monthly Rent</th>
                  <th className="px-4 py-3 text-right">Deposit</th>
                  <th className="px-4 py-3 text-center">Due Day</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {agreements.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-mono font-bold text-teal-800">{a.agreementNo}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{a.propertyName}</td>
                    <td className="px-4 py-3 text-slate-800 font-semibold">{a.tenantName}</td>
                    <td className="px-4 py-3 font-mono text-slate-500 text-[11px]">{a.startDate} to {a.endDate}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-emerald-900">{fmtINR(a.monthlyRent)}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-700">{fmtINR(a.securityDeposit)}</td>
                    <td className="px-4 py-3 text-center font-mono">{a.paymentDueDay}th</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        a.status === 'Active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : a.status === 'Expiring Soon'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-PAGE 4: RENT COLLECTION */}
      {activeTab === 'rent-payment-entry' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <CreditCard className="w-4 h-4 text-teal-600" />
                  <span>Receive Monthly Rent (Kiraya)</span>
                </h2>
                <p className="text-xs text-slate-500">Collect rental installments and issue official receipt.</p>
              </div>
              <span className="text-xs font-mono font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">
                Receipt #RENT-2026-{String(receipts.length + 1).padStart(3, '0')}
              </span>
            </div>

            <form onSubmit={handleRentPaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Property Lease Agreement *
                </label>
                <select
                  required
                  value={paymentForm.agreementId}
                  onChange={e => {
                    const sel = agreements.find(a => a.id === e.target.value);
                    if (sel) {
                      setPaymentForm({
                        ...paymentForm,
                        agreementId: sel.id,
                        amount: sel.monthlyRent,
                      });
                    }
                  }}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                >
                  <option value="">-- Choose Active Lease Agreement --</option>
                  {agreements.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.propertyName} — {a.tenantName} ({fmtINR(a.monthlyRent)}/mo)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">For Rent Month *</label>
                  <input
                    type="text"
                    required
                    value={paymentForm.forMonth}
                    onChange={e => setPaymentForm({ ...paymentForm, forMonth: e.target.value })}
                    placeholder="e.g. October 2026"
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Amount Received (₹) *</label>
                  <input
                    type="number"
                    required
                    min={10}
                    value={paymentForm.amount}
                    onChange={e => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold font-mono text-emerald-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Payment Mode</label>
                  <select
                    value={paymentForm.paymentMode}
                    onChange={e => setPaymentForm({ ...paymentForm, paymentMode: e.target.value as PaymentMode })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  >
                    <option value="Cash">Cash Counter</option>
                    <option value="Bank Transfer">Bank Transfer / NEFT</option>
                    <option value="Cheque">Cheque</option>
                    <option value="UPI">UPI / QR Code</option>
                    <option value="Card">Debit / Credit Card</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ref / Cheque #</label>
                  <input
                    type="text"
                    value={paymentForm.transactionRef}
                    onChange={e => setPaymentForm({ ...paymentForm, transactionRef: e.target.value })}
                    placeholder="e.g. NEFT-99201"
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Receipt Date</label>
                  <input
                    type="date"
                    value={paymentForm.date}
                    onChange={e => setPaymentForm({ ...paymentForm, date: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs text-slate-500">Receipt will be credited to Awqaf estate revenue</span>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center space-x-2 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Issue Rent Receipt</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Receipt Voucher Preview */}
          <div className="lg:col-span-5 space-y-4">
            {selectedReceiptForPrint && (
              <div className="bg-amber-50/70 border-2 border-dashed border-amber-300 rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                  <div>
                    <span className="text-[10px] font-bold tracking-wider text-amber-800 uppercase">Kiraya Rent Voucher</span>
                    <h3 className="text-sm font-black text-slate-900 font-mono">{selectedReceiptForPrint.receiptNo}</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="p-1.5 bg-amber-200 hover:bg-amber-300 rounded-lg text-amber-900 text-xs font-bold flex items-center space-x-1 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print</span>
                  </button>
                </div>

                <div className="text-xs space-y-1.5 text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Property:</span>
                    <span className="font-bold text-slate-900">{selectedReceiptForPrint.propertyName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tenant:</span>
                    <span className="font-semibold text-teal-900">{selectedReceiptForPrint.tenantName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Rent Month:</span>
                    <span className="font-bold text-slate-900">{selectedReceiptForPrint.forMonth}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Payment Mode:</span>
                    <span>{selectedReceiptForPrint.paymentMode} {selectedReceiptForPrint.transactionRef ? `(${selectedReceiptForPrint.transactionRef})` : ''}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-amber-200 text-sm font-black text-emerald-900">
                    <span>Rent Paid:</span>
                    <span className="font-mono text-base">{fmtINR(selectedReceiptForPrint.amount)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Collections */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
                <span>Recent Rent Collections</span>
                <span className="text-teal-600">{activeReceipts.length} total</span>
              </h3>

              <div className="space-y-2">
                {activeReceipts.slice(0, 5).map(r => (
                  <div
                    key={r.id}
                    onClick={() => setSelectedReceiptForPrint(r)}
                    className="p-3 rounded-xl border border-slate-100 hover:border-teal-300 bg-slate-50/50 hover:bg-teal-50/30 transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900">{r.propertyName}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{r.tenantName} • {r.forMonth}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-mono font-black text-emerald-700">{fmtINR(r.amount)}</p>
                      <p className="text-[10px] text-slate-400">{r.paymentMode}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-PAGE 5: OUTSTANDING REPORT */}
      {activeTab === 'rent-outstanding-report' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Overdue Rent Aging &amp; Recovery Roster</h2>
              <p className="text-xs text-slate-500">Unpaid monthly rent tracking across active property leases.</p>
            </div>
            <button
              type="button"
              onClick={() => showToast('Outstanding rent report exported')}
              className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 flex items-center space-x-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Property Unit</th>
                  <th className="px-4 py-3">Tenant Name</th>
                  <th className="px-4 py-3 text-right">Monthly Rent</th>
                  <th className="px-4 py-3 text-center">Due Day</th>
                  <th className="px-4 py-3 text-center">Current Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {agreements.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-bold text-slate-900">{a.propertyName}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{a.tenantName}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">{fmtINR(a.monthlyRent)}</td>
                    <td className="px-4 py-3 text-center font-mono">{a.paymentDueDay}th of month</td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Up-to-Date
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentForm(prev => ({
                            ...prev,
                            agreementId: a.id,
                            amount: a.monthlyRent,
                          }));
                          setActiveTab('rent-payment-entry');
                        }}
                        className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-md text-[11px] font-bold cursor-pointer"
                      >
                        Collect Rent
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-PAGE 6: LEDGER REPORT */}
      {activeTab === 'rent-ledger-report' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Property Rent Collection Ledger</h2>
              <p className="text-xs text-slate-500">Historical remittance log for all commercial and residential leases.</p>
            </div>
            <button
              type="button"
              onClick={() => showToast('Ledger exported to CSV')}
              className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 flex items-center space-x-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Receipt #</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Property Unit</th>
                  <th className="px-4 py-3">Tenant Name</th>
                  <th className="px-4 py-3">For Month</th>
                  <th className="px-4 py-3">Mode</th>
                  <th className="px-4 py-3 text-right">Rent Paid</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeReceipts.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-mono font-bold text-teal-800">{r.receiptNo}</td>
                    <td className="px-4 py-3 text-slate-500 font-mono">{r.date}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{r.propertyName}</td>
                    <td className="px-4 py-3 text-slate-800 font-semibold">{r.tenantName}</td>
                    <td className="px-4 py-3 font-medium text-slate-700">{r.forMonth}</td>
                    <td className="px-4 py-3 text-slate-600">{r.paymentMode}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-emerald-900">{fmtINR(r.amount)}</td>
                    <td className="px-4 py-3 text-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setSelectedReceiptForPrint(r)}
                        className="p-1 hover:bg-slate-100 rounded text-slate-600 cursor-pointer"
                        title="Print"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => {
                            setCancellingReceipt(r);
                            setShowCancelModal(true);
                          }}
                          className="p-1 hover:bg-rose-50 rounded text-rose-600 cursor-pointer"
                          title="Cancel"
                        >
                          <Ban className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-PAGE 7: CANCELLED RECEIPTS */}
      {activeTab === 'rent-cancelled-receipts' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Ban className="w-4 h-4 text-rose-600" />
                <span>Voided Rent Receipts Register</span>
              </h2>
              <p className="text-xs text-slate-500">Revoked vouchers and rental audit records.</p>
            </div>
            <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
              {cancelledReceipts.length} Cancelled
            </span>
          </div>

          {cancelledReceipts.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
              <p className="text-xs">No cancelled receipts on record for estate rentals.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Receipt #</th>
                    <th className="px-4 py-3">Original Date</th>
                    <th className="px-4 py-3">Property Unit</th>
                    <th className="px-4 py-3">Tenant Name</th>
                    <th className="px-4 py-3 text-right">Amount Voided</th>
                    <th className="px-4 py-3">Cancelled By</th>
                    <th className="px-4 py-3">Cancellation Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cancelledReceipts.map(r => (
                    <tr key={r.id} className="bg-rose-50/20 hover:bg-rose-50/40">
                      <td className="px-4 py-3 font-mono font-bold text-rose-800 line-through">{r.receiptNo}</td>
                      <td className="px-4 py-3 text-slate-500 font-mono">{r.date}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{r.propertyName}</td>
                      <td className="px-4 py-3 text-slate-700">{r.tenantName}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-rose-700 line-through">{fmtINR(r.amount)}</td>
                      <td className="px-4 py-3 text-slate-600 font-mono">{r.cancelledBy}</td>
                      <td className="px-4 py-3 text-rose-600 italic">{r.cancellationReason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal: Add Property */}
      {showPropertyModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Add Jamaat Property Unit</h3>
              <button
                type="button"
                onClick={() => setShowPropertyModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProperty} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Property Code *</label>
                  <input
                    type="text"
                    required
                    value={propertyForm.propertyCode}
                    onChange={e => setPropertyForm({ ...propertyForm, propertyCode: e.target.value.toUpperCase() })}
                    placeholder="e.g. BP-SH-03"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Property Type</label>
                  <select
                    value={propertyForm.propertyType}
                    onChange={e => setPropertyForm({ ...propertyForm, propertyType: e.target.value as PropertyType })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  >
                    <option value="Commercial Shop">Commercial Shop</option>
                    <option value="Residential Flat">Residential Flat</option>
                    <option value="Godown / Storage">Godown / Storage</option>
                    <option value="Office Gala">Office Gala</option>
                    <option value="Open Plot">Open Plot</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Property Name / Description *</label>
                <input
                  type="text"
                  required
                  value={propertyForm.name}
                  onChange={e => setPropertyForm({ ...propertyForm, name: e.target.value })}
                  placeholder="e.g. Burhani Park Gala Shop #3"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Physical Address</label>
                <input
                  type="text"
                  value={propertyForm.address}
                  onChange={e => setPropertyForm({ ...propertyForm, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Area (Sq Ft)</label>
                  <input
                    type="number"
                    value={propertyForm.builtUpSqFt}
                    onChange={e => setPropertyForm({ ...propertyForm, builtUpSqFt: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Monthly Rent Slab (₹)</label>
                  <input
                    type="number"
                    value={propertyForm.monthlyRentalSlab}
                    onChange={e => setPropertyForm({ ...propertyForm, monthlyRentalSlab: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Electricity Meter #</label>
                <input
                  type="text"
                  value={propertyForm.meterNumber}
                  onChange={e => setPropertyForm({ ...propertyForm, meterNumber: e.target.value })}
                  placeholder="e.g. MSEB-99201"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowPropertyModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  Save Property
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Tenant */}
      {showTenantModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Enroll New Tenant</h3>
              <button
                type="button"
                onClick={() => setShowTenantModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTenant} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tenant Full Name / Business *</label>
                <input
                  type="text"
                  required
                  value={tenantForm.name}
                  onChange={e => setTenantForm({ ...tenantForm, name: e.target.value })}
                  placeholder="e.g. Burhanuddin Hardware / Rajesh Opticals"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center space-x-4 py-1">
                <label className="flex items-center space-x-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="isMumin"
                    checked={tenantForm.isMumin}
                    onChange={() => setTenantForm({ ...tenantForm, isMumin: true })}
                    className="text-teal-600 focus:ring-teal-500"
                  />
                  <span className="font-semibold text-slate-800">Mumin Tenant</span>
                </label>
                <label className="flex items-center space-x-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="isMumin"
                    checked={!tenantForm.isMumin}
                    onChange={() => setTenantForm({ ...tenantForm, isMumin: false, itsNumber: '' })}
                    className="text-teal-600 focus:ring-teal-500"
                  />
                  <span className="font-semibold text-slate-800">Non-Mumin / Commercial</span>
                </label>
              </div>

              {tenantForm.isMumin && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ITS Number</label>
                  <input
                    type="text"
                    value={tenantForm.itsNumber}
                    onChange={e => setTenantForm({ ...tenantForm, itsNumber: e.target.value })}
                    placeholder="e.g. 30489122"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={tenantForm.contactNumber}
                    onChange={e => setTenantForm({ ...tenantForm, contactNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Aadhaar or GST #</label>
                  <input
                    type="text"
                    value={tenantForm.aadhaarOrGst}
                    onChange={e => setTenantForm({ ...tenantForm, aadhaarOrGst: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Permanent Residential Address</label>
                <input
                  type="text"
                  value={tenantForm.permanentAddress}
                  onChange={e => setTenantForm({ ...tenantForm, permanentAddress: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowTenantModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  Enroll Tenant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Lease Agreement */}
      {showAgreementModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Execute Lease Agreement</h3>
              <button
                type="button"
                onClick={() => setShowAgreementModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAgreement} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Property Unit *</label>
                <select
                  required
                  value={agreementForm.propertyId}
                  onChange={e => {
                    const p = properties.find(prop => prop.id === e.target.value);
                    setAgreementForm({
                      ...agreementForm,
                      propertyId: e.target.value,
                      monthlyRent: p?.monthlyRentalSlab || agreementForm.monthlyRent,
                    });
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                >
                  <option value="">-- Choose Property --</option>
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.propertyCode}) - {p.status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Tenant *</label>
                <select
                  required
                  value={agreementForm.tenantId}
                  onChange={e => setAgreementForm({ ...agreementForm, tenantId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                >
                  <option value="">-- Choose Tenant --</option>
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.tenantCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={agreementForm.startDate}
                    onChange={e => setAgreementForm({ ...agreementForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={agreementForm.endDate}
                    onChange={e => setAgreementForm({ ...agreementForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Monthly Rent (₹) *</label>
                  <input
                    type="number"
                    required
                    value={agreementForm.monthlyRent}
                    onChange={e => setAgreementForm({ ...agreementForm, monthlyRent: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Security Deposit (₹)</label>
                  <input
                    type="number"
                    value={agreementForm.securityDeposit}
                    onChange={e => setAgreementForm({ ...agreementForm, securityDeposit: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAgreementModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  Sign Lease Agreement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Cancel Receipt */}
      {showCancelModal && cancellingReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-rose-900 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>Void Rent Receipt #{cancellingReceipt.receiptNo}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Are you sure you want to cancel the rent voucher of <span className="font-bold text-slate-900">{fmtINR(cancellingReceipt.amount)}</span> issued for <span className="font-bold text-slate-900">{cancellingReceipt.propertyName}</span> ({cancellingReceipt.forMonth})?
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Reason for Cancellation *
              </label>
              <textarea
                rows={3}
                required
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                placeholder="e.g. Cheque returned, wrong month entered..."
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Confirm Revoke
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
