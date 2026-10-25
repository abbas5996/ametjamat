import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Search,
  User,
  Users,
  Printer,
  Save,
  CheckCircle2,
  DollarSign,
  CreditCard,
  Building,
  FileText,
  X,
  Phone,
  MapPin,
  Calendar,
  AlertCircle,
  Clock,
  Eye,
} from 'lucide-react';
import {
  GeneralReceiptRecord,
  ReceiptContributionCategory,
  PaymentMode,
  HeadOfFamily,
  UserProfile,
  FinancialYear,
} from '../../types';
import { getStoredHofs } from '../../utils/memberMaster';
import {
  createGeneralReceipt,
  generateNextReceiptNumber,
} from '../../utils/executiveReports';

interface GeneralReceiptGeneratorSubpageProps {
  currentUser: UserProfile;
  financialYear: FinancialYear;
  receipts: GeneralReceiptRecord[];
  onReceiptsUpdated: (updated: GeneralReceiptRecord[]) => void;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
  showToast: (msg: string) => void;
}

export const GeneralReceiptGeneratorSubpage: React.FC<GeneralReceiptGeneratorSubpageProps> = ({
  currentUser,
  financialYear,
  receipts,
  onReceiptsUpdated,
  canAdd,
  showToast,
}) => {
  const hofs = useMemo(() => getStoredHofs(), []);

  // Form State
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState<string>('');
  const [selectedHof, setSelectedHof] = useState<HeadOfFamily | null>(null);

  // Guest Fields
  const [guestName, setGuestName] = useState<string>('');
  const [guestMobile, setGuestMobile] = useState<string>('');
  const [guestAddress, setGuestAddress] = useState<string>('');

  // Payment Details
  const [category, setCategory] = useState<ReceiptContributionCategory>('General Sadaqah / Donation');
  const [amount, setAmount] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('UPI');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');

  // Receipt Modal State for Print View
  const [activePrintReceipt, setActivePrintReceipt] = useState<GeneralReceiptRecord | null>(null);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);

  // Table Search & Filter
  const [tableSearch, setTableSearch] = useState<string>('');
  const [tableCategoryFilter, setTableCategoryFilter] = useState<string>('all');

  // Filter HOF members for quick search dropdown
  const filteredHofs = useMemo(() => {
    if (!memberSearchQuery.trim() || selectedHof) return [];
    const query = memberSearchQuery.toLowerCase();
    return hofs.filter(
      (h) =>
        h.itsNumber.includes(query) ||
        h.fullName.toLowerCase().includes(query) ||
        h.mobileNumber.includes(query)
    ).slice(0, 6);
  }, [hofs, memberSearchQuery, selectedHof]);

  const handleSelectHof = (h: HeadOfFamily) => {
    setSelectedHof(h);
    setMemberSearchQuery(`${h.fullName} (${h.itsNumber})`);
  };

  const handleClearSelectedHof = () => {
    setSelectedHof(null);
    setMemberSearchQuery('');
  };

  const handleResetForm = () => {
    setSelectedHof(null);
    setMemberSearchQuery('');
    setGuestName('');
    setGuestMobile('');
    setGuestAddress('');
    setAmount('');
    setReferenceNumber('');
    setRemarks('');
    setCategory('General Sadaqah / Donation');
    setPaymentMode('UPI');
  };

  const handleSubmit = (andPrint: boolean) => {
    if (!canAdd) {
      showToast('Access restricted: You do not have permission to generate receipts.');
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      showToast('Please enter a valid positive contribution amount.');
      return;
    }

    let payerName = '';
    let mobile = '';
    let itsNumber: string | undefined = undefined;
    let mohallah: string | undefined = undefined;

    if (isGuest) {
      if (!guestName.trim()) {
        showToast('Please enter the Guest / Non-Member name.');
        return;
      }
      payerName = guestName.trim();
      mobile = guestMobile.trim() || 'N/A';
      mohallah = guestAddress.trim() || 'Non-Resident / Guest';
    } else {
      if (!selectedHof) {
        showToast('Please select a registered Jamaat member from Member Master.');
        return;
      }
      payerName = selectedHof.fullName;
      mobile = selectedHof.mobileNumber;
      itsNumber = selectedHof.itsNumber;
      mohallah = selectedHof.mohallahName || selectedHof.mohallahId || 'General';
    }

    const todayDate = new Date().toISOString().split('T')[0];

    const newReceipt = createGeneralReceipt(
      {
        date: todayDate,
        isGuest,
        itsNumber,
        payerName,
        mobileNumber: mobile,
        mohallah,
        category,
        amount: numericAmount,
        paymentMode,
        referenceNumber: referenceNumber.trim() || undefined,
        remarks: remarks.trim() || undefined,
        collectedBy: currentUser.username,
        financialYear,
      },
      currentUser.username
    );

    // Update local state list
    onReceiptsUpdated([newReceipt, ...receipts]);
    showToast(`Receipt ${newReceipt.receiptNo} generated successfully for ₹${numericAmount.toLocaleString()}`);

    if (andPrint) {
      setActivePrintReceipt(newReceipt);
      setShowPrintModal(true);
    }

    handleResetForm();
  };

  const handlePrintModal = () => {
    window.print();
  };

  // Filtered receipts for recent ledger table
  const filteredReceipts = useMemo(() => {
    return receipts.filter((r) => {
      const matchSearch =
        tableSearch === '' ||
        r.receiptNo.toLowerCase().includes(tableSearch.toLowerCase()) ||
        r.payerName.toLowerCase().includes(tableSearch.toLowerCase()) ||
        (r.itsNumber && r.itsNumber.includes(tableSearch)) ||
        (r.referenceNumber && r.referenceNumber.toLowerCase().includes(tableSearch.toLowerCase()));

      const matchCategory =
        tableCategoryFilter === 'all' || r.category === tableCategoryFilter;

      return matchSearch && matchCategory;
    });
  }, [receipts, tableSearch, tableCategoryFilter]);

  const nextReceiptPreview = useMemo(() => generateNextReceiptNumber(receipts), [receipts]);

  return (
    <div className="space-y-6">
      {/* ── Sub-page Top Header ── */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                General Receipt Generator (Multi-Purpose POS Counter)
              </h2>
              <p className="text-xs text-slate-500">
                Generate official digitized receipts for Sadaqah, Sabeel, FMB extras, Zakat, and guest donations.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
            <span className="text-[11px] text-amber-700 font-semibold uppercase tracking-wider">
              Next Receipt No:
            </span>
            <span className="font-mono font-bold text-amber-950">{nextReceiptPreview}</span>
          </div>
        </div>
      </div>

      {/* ── Receipt Generation Form Interface ── */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-600" />
            <span>Counter Receipt Entry Form</span>
          </h3>

          {/* Member vs Guest Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-medium">
            <button
              type="button"
              onClick={() => {
                setIsGuest(false);
                handleResetForm();
              }}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                !isGuest
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-amber-600" />
              <span>Registered Member</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsGuest(true);
                handleResetForm();
              }}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                isGuest
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5 text-blue-600" />
              <span>Non-Member / Guest</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Member Search / Guest Fields */}
          {!isGuest ? (
            <div className="space-y-1.5 md:col-span-2 lg:col-span-1 relative">
              <label className="block text-xs font-bold text-slate-700">
                Search Member (ITS No or Name) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Type ITS No or HOF Name..."
                  value={memberSearchQuery}
                  onChange={(e) => {
                    setMemberSearchQuery(e.target.value);
                    if (selectedHof) setSelectedHof(null);
                  }}
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:border-amber-500 outline-none transition-all"
                />
                {selectedHof && (
                  <button
                    type="button"
                    onClick={handleClearSelectedHof}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Autocomplete Dropdown */}
              {filteredHofs.length > 0 && !selectedHof && (
                <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-56 overflow-y-auto divide-y divide-slate-100">
                  {filteredHofs.map((h) => (
                    <div
                      key={h.id}
                      onClick={() => handleSelectHof(h)}
                      className="p-2.5 hover:bg-amber-50/80 cursor-pointer transition-colors text-xs flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{h.fullName}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-amber-800">ITS: {h.itsNumber}</span>
                          <span>•</span>
                          <span>{h.mohallahName || h.mohallahId}</span>
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                        Select
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Auto-populated details card */}
              {selectedHof && (
                <div className="mt-2 p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/80 text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-amber-950">
                    <span>{selectedHof.fullName}</span>
                    <span className="font-mono text-[11px] text-amber-800">{selectedHof.itsNumber}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-600">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {selectedHof.mobileNumber}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {selectedHof.mohallahName || selectedHof.mohallahId}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Guest Full Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Guest / Non-Member Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mulla Shabbir Contractor"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:border-amber-500 outline-none"
                />
              </div>

              {/* Guest Mobile & Mohallah */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Guest Contact Number
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 9820099881"
                  value={guestMobile}
                  onChange={(e) => setGuestMobile(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:border-amber-500 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  City / Resident Address Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Visiting from Surat / Non-Resident"
                  value={guestAddress}
                  onChange={(e) => setGuestAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:border-amber-500 outline-none"
                />
              </div>
            </>
          )}

          {/* Contribution Category Dropdown */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Contribution Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ReceiptContributionCategory)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:border-amber-500 outline-none cursor-pointer"
            >
              <option value="General Sadaqah / Donation">General Sadaqah / Donation</option>
              <option value="Sabeel Contribution">Sabeel Contribution</option>
              <option value="FMB Extra">FMB Extra</option>
              <option value="Hall Booking Advance">Hall Booking Advance</option>
              <option value="Zakat">Zakat</option>
              <option value="Miscellaneous">Miscellaneous</option>
            </select>
          </div>

          {/* Amount Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Contribution Amount (₹) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs font-bold text-slate-400 font-mono">₹</span>
              <input
                type="number"
                min="1"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-amber-500 outline-none"
              />
            </div>
          </div>

          {/* Payment Mode Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Payment Mode <span className="text-rose-500">*</span>
            </label>
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:border-amber-500 outline-none cursor-pointer"
            >
              <option value="Cash">Cash (Counter)</option>
              <option value="UPI">UPI (QR / App)</option>
              <option value="Bank Transfer">Bank Transfer (NEFT / RTGS)</option>
              <option value="Cheque">Cheque</option>
            </select>
          </div>

          {/* Transaction / UPI Reference ID */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Reference / Cheque / UPI Trans ID
            </label>
            <input
              type="text"
              placeholder="e.g. UPI/9848102941 or CHQ-10492"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:bg-white focus:border-amber-500 outline-none"
            />
          </div>

          {/* Remarks / Purpose Notes */}
          <div className="space-y-1.5 md:col-span-2 lg:col-span-2">
            <label className="block text-xs font-bold text-slate-700">
              Remarks / Purpose Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Darees Mubarak Niyaz contribution, or Cheque cleared in Axis Bank"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:border-amber-500 outline-none"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>
              Collector: <span className="font-bold text-slate-700">{currentUser.username}</span> | Fiscal Year: <span className="font-semibold text-slate-700">{financialYear}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetForm}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Clear Fields
            </button>

            <button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={!canAdd}
              className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                canAdd
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Save className="w-3.5 h-3.5" />
              <span>💾 Save to Ledger</span>
            </button>

            <button
              type="button"
              onClick={() => handleSubmit(true)}
              disabled={!canAdd}
              className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer ${
                canAdd
                  ? 'bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>🧾 Generate & Print Receipt</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Recent General Counter Receipts Table ── */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Receipt className="w-4 h-4 text-amber-600" />
              <span>Recent General Counter Receipts ({filteredReceipts.length})</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Audit log of digitized counter vouchers with instant reprint capability
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              <input
                type="text"
                placeholder="Search Receipt, Name, ITS..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white outline-none w-48 sm:w-56"
              />
            </div>

            <select
              value={tableCategoryFilter}
              onChange={(e) => setTableCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 outline-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              <option value="General Sadaqah / Donation">General Sadaqah</option>
              <option value="Sabeel Contribution">Sabeel Contribution</option>
              <option value="FMB Extra">FMB Extra</option>
              <option value="Hall Booking Advance">Hall Booking Advance</option>
              <option value="Zakat">Zakat</option>
              <option value="Miscellaneous">Miscellaneous</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/70">
                <th className="py-2.5 px-3">Receipt No</th>
                <th className="py-2.5 px-3">Date & Time</th>
                <th className="py-2.5 px-3">Payer Details</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Mode & Ref</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReceipts.map((rcp) => (
                <tr key={rcp.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-bold text-amber-900">
                    {rcp.receiptNo}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">
                    <div>{rcp.date}</div>
                    <div className="text-[10px] text-slate-400">{rcp.time}</div>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="font-bold text-slate-900">{rcp.payerName}</div>
                    <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
                      {rcp.itsNumber ? (
                        <span className="font-mono text-amber-800">ITS: {rcp.itsNumber}</span>
                      ) : (
                        <span className="text-blue-700 font-semibold">Guest Payer</span>
                      )}
                      <span>•</span>
                      <span>{rcp.mohallah || 'General'}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-900 border border-amber-200/60">
                      {rcp.category}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">
                    <div className="font-medium">{rcp.paymentMode}</div>
                    {rcp.referenceNumber && (
                      <div className="text-[10px] font-mono text-slate-400">
                        {rcp.referenceNumber}
                      </div>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-black text-emerald-800 text-sm">
                    ₹ {rcp.amount.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setActivePrintReceipt(rcp);
                        setShowPrintModal(true);
                      }}
                      className="p-1.5 text-slate-600 hover:text-amber-800 hover:bg-amber-100 rounded-md transition-colors cursor-pointer"
                      title="View & Print Official Receipt"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredReceipts.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No general counter receipts found matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Printable Formal Receipt View Modal ── */}
      {showPrintModal && activePrintReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-6">
            {/* Modal Non-Print Action Bar */}
            <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between print:hidden">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <Printer className="w-4 h-4 text-amber-400" />
                <span>Printable Receipt Voucher Preview</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintModal}
                  className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Document</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrintModal(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-md cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Print Container with Formal Letterhead Layout */}
            <div id="printable-receipt" className="p-8 space-y-6 text-slate-900 font-sans">
              {/* Formal Letterhead */}
              <div className="border-b-2 border-amber-600 pb-4 text-center relative">
                <div className="text-xs tracking-widest uppercase font-bold text-amber-700">
                  بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيمِ
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
                  ANJUMAN-E-SAIFEE (BURHANI PARK)
                </h1>
                <p className="text-xs text-slate-600 font-medium">
                  Jamaat Central Office • Sector B, Burhani Park Complex, Mumbai - 400010
                </p>
                <p className="text-[11px] text-slate-500">
                  Official Account Counter Voucher • Reg. No. DB-JMT/2026/09
                </p>
              </div>

              {/* Receipt Meta & Numbers */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <div className="space-y-1">
                  <div>
                    <span className="text-slate-500">Receipt No:</span>{' '}
                    <span className="font-mono font-black text-slate-950 text-sm">
                      {activePrintReceipt.receiptNo}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Financial Year:</span>{' '}
                    <span className="font-semibold text-slate-800">
                      {activePrintReceipt.financialYear}
                    </span>
                  </div>
                </div>

                <div className="space-y-1 sm:text-right">
                  <div>
                    <span className="text-slate-500">Issue Date & Time:</span>{' '}
                    <span className="font-semibold text-slate-900 font-mono">
                      {activePrintReceipt.date} • {activePrintReceipt.time}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Issued By:</span>{' '}
                    <span className="font-mono font-semibold text-slate-800">
                      {activePrintReceipt.collectedBy}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payer Information Box */}
              <div className="border border-slate-200 rounded-lg p-4 space-y-2 text-xs">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Received With Thanks From:
                </div>
                <div className="text-base font-bold text-slate-900">
                  {activePrintReceipt.payerName}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 pt-1">
                  <div>
                    <span className="text-slate-500">ITS Identification:</span>{' '}
                    <span className="font-mono font-bold text-slate-800">
                      {activePrintReceipt.itsNumber || 'Non-Member Guest'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Contact Mobile:</span>{' '}
                    <span className="font-mono font-semibold text-slate-800">
                      {activePrintReceipt.mobileNumber}
                    </span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-500">Mohallah / Location:</span>{' '}
                    <span className="font-medium text-slate-800">
                      {activePrintReceipt.mohallah || 'Burhani Park'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Detailed Breakdown Table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-4">Particulars / Contribution Head</th>
                      <th className="py-2.5 px-4">Payment Method</th>
                      <th className="py-2.5 px-4">Transaction / Ref</th>
                      <th className="py-2.5 px-4 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{activePrintReceipt.category}</div>
                        {activePrintReceipt.remarks && (
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Note: {activePrintReceipt.remarks}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {activePrintReceipt.paymentMode}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                        {activePrintReceipt.referenceNumber || 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-slate-950 text-sm">
                        ₹ {activePrintReceipt.amount.toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-slate-50 border-t-2 border-slate-200 font-bold">
                    <tr>
                      <td colSpan={3} className="py-2.5 px-4 text-right text-slate-700 uppercase">
                        Total Amount Received:
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-base font-black text-slate-950">
                        ₹ {activePrintReceipt.amount.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Dua & Signatures Footer */}
              <div className="pt-4 border-t border-slate-200 space-y-8">
                {/* Dua note */}
                <div className="text-center italic text-xs text-slate-600 bg-amber-50/60 p-3 rounded-lg border border-amber-200/50">
                  "Shukran & Dua Mubarak for your contribution. May Allah Ta'ala bless your niyyat with eternal Barakah and prosperity in Dawoodi Bohra Jamaat."
                </div>

                {/* Signature Placeholders */}
                <div className="flex items-end justify-between pt-6 text-xs text-slate-600">
                  <div className="text-center">
                    <div className="w-36 border-b border-dashed border-slate-400 mb-1" />
                    <span>Payer Signature</span>
                  </div>

                  <div className="text-center">
                    <div className="font-mono text-[10px] text-slate-400 mb-1">
                      [Verified & Authenticated]
                    </div>
                    <div className="w-44 border-b border-dashed border-slate-400 mb-1" />
                    <span className="font-bold text-slate-800">Authorized Signatory / Cashier</span>
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
