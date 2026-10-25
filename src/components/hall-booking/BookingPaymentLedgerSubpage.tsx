import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Search,
  Filter,
  Printer,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  DollarSign,
  Lock,
  X,
  FileText,
  Building,
  User,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import {
  BookingRecord,
  BookingPaymentLedgerEntry,
  UserProfile,
} from '../../types';
import {
  getStoredBookingPayments,
  saveStoredBookingPayments,
  recordBookingPayment,
  logHallBookingAudit,
} from '../../utils/hallBooking';
import { checkUserPermission } from '../../utils/rbac';

interface BookingPaymentLedgerSubpageProps {
  bookings: BookingRecord[];
  setBookings: React.Dispatch<React.SetStateAction<BookingRecord[]>>;
  payments: BookingPaymentLedgerEntry[];
  setPayments: React.Dispatch<React.SetStateAction<BookingPaymentLedgerEntry[]>>;
  currentUser: UserProfile;
  showToast: (msg: string) => void;
  preselectedBookingId?: string;
}

export const BookingPaymentLedgerSubpage: React.FC<BookingPaymentLedgerSubpageProps> = ({
  bookings,
  setBookings,
  payments,
  setPayments,
  currentUser,
  showToast,
  preselectedBookingId,
}) => {
  // Active Tab: Ledger List vs Collect Payment
  const [activeTab, setActiveTab] = useState<'ledger' | 'collect'>('ledger');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [modeFilter, setModeFilter] = useState<string>('all');

  // Collect Payment Form State
  const [targetBookingId, setTargetBookingId] = useState<string>(preselectedBookingId || '');
  const [payAmount, setPayAmount] = useState<number | ''>('');
  const [payType, setPayType] = useState<BookingPaymentLedgerEntry['paymentType']>('FULL_PAYMENT');
  const [payMode, setPayMode] = useState<BookingPaymentLedgerEntry['paymentMode']>('Cash');
  const [referenceNo, setReferenceNo] = useState('');
  const [receiptDate, setReceiptDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // E-Receipt Modal State
  const [activeReceipt, setActiveReceipt] = useState<BookingPaymentLedgerEntry | null>(null);

  // Granular RBAC Permissions
  const canAdd = checkUserPermission(currentUser, 'hall-booking', 'add');

  // Target Booking Info
  const selectedBooking = useMemo(() => {
    return bookings.find((b) => b.id === targetBookingId);
  }, [bookings, targetBookingId]);

  // Handle Booking Selection in payment form
  const handleSelectBooking = (id: string) => {
    setTargetBookingId(id);
    const b = bookings.find((x) => x.id === id);
    if (b && b.balanceDue > 0) {
      setPayAmount(b.balanceDue);
    } else {
      setPayAmount('');
    }
  };

  // Submit Payment
  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAdd) {
      showToast('Access Restricted: You do not have [Add] permission for booking payments.');
      return;
    }

    if (!targetBookingId || !selectedBooking) {
      showToast('Please select a valid booking.');
      return;
    }

    const amountNum = Number(payAmount);
    if (!amountNum || amountNum <= 0) {
      showToast('Please enter a valid payment amount.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = recordBookingPayment(
        {
          bookingId: targetBookingId,
          amount: amountNum,
          paymentType: payType,
          paymentMode: payMode,
          referenceNo: referenceNo.trim() || undefined,
          date: receiptDate,
          notes: notes.trim() || undefined,
        },
        currentUser.username
      );

      setBookings(result.updatedBookings);
      setPayments(result.updatedPayments);

      showToast(`Recorded payment of ₹${amountNum.toLocaleString('en-IN')}!`);
      setActiveReceipt(result.newPaymentEntry);

      // Reset
      setPayAmount('');
      setReferenceNo('');
      setNotes('');
      setActiveTab('ledger');
    } catch (err) {
      console.error(err);
      showToast('Failed to record payment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Financial Summary KPI Metrics
  const summary = useMemo(() => {
    const totalRevenue = payments
      .filter((p) => p.paymentType !== 'REFUND')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const advanceTotal = payments
      .filter((p) => p.paymentType === 'ADVANCE')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const pendingTotal = bookings.reduce((sum, b) => sum + (b.balanceDue || 0), 0);

    const refundTotal = payments
      .filter((p) => p.paymentType === 'REFUND')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    return { totalRevenue, advanceTotal, pendingTotal, refundTotal };
  }, [payments, bookings]);

  // Filtered Payments
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        p.receiptNo.toLowerCase().includes(q) ||
        p.bookingCode.toLowerCase().includes(q) ||
        p.itsNumber.includes(q) ||
        p.hofName.toLowerCase().includes(q) ||
        p.facilityName.toLowerCase().includes(q);

      const matchType = typeFilter === 'all' || p.paymentType === typeFilter;
      const matchMode = modeFilter === 'all' || p.paymentMode === modeFilter;

      return matchSearch && matchType && matchMode;
    });
  }, [payments, searchQuery, typeFilter, modeFilter]);

  // Render Payment Type Badge
  const renderPaymentTypeBadge = (type: BookingPaymentLedgerEntry['paymentType']) => {
    switch (type) {
      case 'FULL_PAYMENT':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            Full Settlement
          </span>
        );
      case 'ADVANCE':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
            Advance Deposit
          </span>
        );
      case 'SECURITY_DEPOSIT':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-300">
            Security Deposit
          </span>
        );
      case 'REFUND':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
            Refund Reversal
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Intuitive Header & Guidance ── */}
      <div className="bg-white border-l-4 border-amber-500 rounded-xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-600" />
            <span>Facility Payments & Receipt Ledger</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit-grade financial tracking for hall booking advances, balance settlements, security deposits,
            and automated receipt vouchers.
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('ledger')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'ledger'
                ? 'bg-[#0F172A] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 bg-slate-100'
            }`}
          >
            Payments Ledger ({payments.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('collect')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'collect'
                ? 'bg-[#0F172A] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 bg-slate-100'
            }`}
          >
            💳 Collect Due Balance
          </button>
        </div>
      </div>

      {/* ── Summary KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-700">Total Revenue Collected</p>
            <p className="text-xl sm:text-2xl font-black text-emerald-900 font-mono mt-0.5">
              ₹{summary.totalRevenue.toLocaleString('en-IN')}
            </p>
            <p className="text-[10px] text-emerald-600 font-medium mt-0.5">{payments.length} Transactions</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-blue-700">Advance Deposits Held</p>
            <p className="text-xl sm:text-2xl font-black text-blue-900 font-mono mt-0.5">
              ₹{summary.advanceTotal.toLocaleString('en-IN')}
            </p>
            <p className="text-[10px] text-blue-600 font-medium mt-0.5">Security / Initial Pledges</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-rose-700">Pending Receivables</p>
            <p className="text-xl sm:text-2xl font-black text-rose-900 font-mono mt-0.5">
              ₹{summary.pendingTotal.toLocaleString('en-IN')}
            </p>
            <p className="text-[10px] text-rose-500 font-medium mt-0.5">Unpaid Booking Balances</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-purple-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-purple-700">Refunds Processed</p>
            <p className="text-xl sm:text-2xl font-black text-purple-900 font-mono mt-0.5">
              ₹{summary.refundTotal.toLocaleString('en-IN')}
            </p>
            <p className="text-[10px] text-purple-600 font-medium mt-0.5">Deposit Reversals</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ── TAB 1: LEDGER TABLE ── */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="bg-white border border-amber-200/80 rounded-xl p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search payments by Receipt No, Booking ID, ITS No, or Member Name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-slate-500 font-semibold">Payment Type:</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="all">All Types ({payments.length})</option>
                <option value="FULL_PAYMENT">Full Settlement</option>
                <option value="ADVANCE">Advance Deposit</option>
                <option value="SECURITY_DEPOSIT">Security Deposit</option>
                <option value="REFUND">Refund</option>
              </select>
            </div>

            {/* Mode Filter */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-slate-500 font-semibold">Mode:</span>
              <select
                value={modeFilter}
                onChange={(e) => setModeFilter(e.target.value)}
                className="p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="all">All Payment Modes</option>
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-amber-200/90 rounded-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0F172A] text-white uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="py-3 px-3.5">Receipt No</th>
                    <th className="py-3 px-3.5">Date</th>
                    <th className="py-3 px-3.5">Booking ID</th>
                    <th className="py-3 px-3.5">Member Name & ITS</th>
                    <th className="py-3 px-3.5">Facility</th>
                    <th className="py-3 px-3.5">Payment Type</th>
                    <th className="py-3 px-3.5">Mode</th>
                    <th className="py-3 px-3.5 text-right">Amount (₹)</th>
                    <th className="py-3 px-3.5 text-right">Receipt Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPayments.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-12 text-slate-500">
                        <Receipt className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                        <p className="font-semibold text-slate-700">No Payments Recorded</p>
                      </td>
                    </tr>
                  ) : (
                    filteredPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-amber-50/50 transition-colors">
                        <td className="py-3 px-3.5 font-mono font-bold text-amber-800 whitespace-nowrap">
                          {p.receiptNo}
                        </td>
                        <td className="py-3 px-3.5 whitespace-nowrap text-slate-600">{p.date}</td>
                        <td className="py-3 px-3.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                          {p.bookingCode}
                        </td>
                        <td className="py-3 px-3.5">
                          <div className="font-bold text-slate-900">{p.hofName}</div>
                          <div className="text-[11px] font-mono text-slate-500">ITS: {p.itsNumber}</div>
                        </td>
                        <td className="py-3 px-3.5 text-slate-800 max-w-xs truncate">{p.facilityName}</td>
                        <td className="py-3 px-3.5 whitespace-nowrap">{renderPaymentTypeBadge(p.paymentType)}</td>
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-800">
                            {p.paymentMode}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                          <span className={p.paymentType === 'REFUND' ? 'text-rose-700' : 'text-emerald-800'}>
                            {p.paymentType === 'REFUND' ? '-' : '+'}₹{p.amount.toLocaleString('en-IN')}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setActiveReceipt(p)}
                            className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold rounded text-[11px] flex items-center gap-1 cursor-pointer ml-auto"
                            title="Print / View Official Booking Receipt"
                          >
                            <Printer className="w-3 h-3" />
                            <span>Receipt</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: COLLECT DUE PAYMENT FORM ── */}
      {activeTab === 'collect' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white border border-amber-200/90 rounded-2xl shadow-sm p-5 sm:p-6 space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-amber-600" />
                <span>Collect Facility Booking Payment</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Record advance deposit or final settlement payment for scheduled community hall reservations.
              </p>
            </div>

            <form onSubmit={handleSubmitPayment} className="space-y-4 text-xs">
              {/* Select Booking */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Select Booking (with Outstanding Balance) *
                </label>
                <select
                  value={targetBookingId}
                  onChange={(e) => handleSelectBooking(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                >
                  <option value="">-- Choose Booking --</option>
                  {bookings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bookingCode} • {b.hofName} ({b.facilityName}) • Due: ₹{b.balanceDue.toLocaleString('en-IN')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount to Pay */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Collection Amount (₹) *
                  </label>
                  {selectedBooking && selectedBooking.balanceDue > 0 && (
                    <button
                      type="button"
                      onClick={() => setPayAmount(selectedBooking.balanceDue)}
                      className="text-[11px] font-bold text-amber-700 hover:text-amber-900 hover:underline cursor-pointer"
                    >
                      Fill Remaining Due (₹{selectedBooking.balanceDue.toLocaleString('en-IN')})
                    </button>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value ? Number(e.target.value) : '')}
                    placeholder="Enter payment amount..."
                    className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono font-bold text-base focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>
              </div>

              {/* Payment Type & Mode */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Payment Classification *
                  </label>
                  <select
                    value={payType}
                    onChange={(e) =>
                      setPayType(e.target.value as BookingPaymentLedgerEntry['paymentType'])
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold"
                  >
                    <option value="FULL_PAYMENT">Full / Balance Payment</option>
                    <option value="ADVANCE">Advance Booking Deposit</option>
                    <option value="SECURITY_DEPOSIT">Security Deposit (Refundable)</option>
                    <option value="REFUND">Refund Reversal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Payment Mode *
                  </label>
                  <select
                    value={payMode}
                    onChange={(e) =>
                      setPayMode(e.target.value as BookingPaymentLedgerEntry['paymentMode'])
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              {/* Ref No & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Transaction / Cheque Ref No
                  </label>
                  <input
                    type="text"
                    value={referenceNo}
                    onChange={(e) => setReferenceNo(e.target.value)}
                    placeholder="e.g. UTR / Cheque number..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Receipt Date *
                  </label>
                  <input
                    type="date"
                    value={receiptDate}
                    onChange={(e) => setReceiptDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                    required
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Receipt Remarks
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Balance settlement paid by cashier..."
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting || !targetBookingId || !payAmount}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <Receipt className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? 'Processing Payment...'
                    : `Confirm & Issue E-Receipt (₹${Number(payAmount || 0).toLocaleString('en-IN')})`}
                </span>
              </button>
            </form>
          </div>

          {/* Selected Booking Impact (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {selectedBooking ? (
              <div className="bg-white border border-amber-300/80 rounded-2xl p-5 shadow-sm space-y-4 text-xs">
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                  Target Booking Summary
                </span>
                <h4 className="text-base font-bold text-slate-900 mt-0.5">{selectedBooking.facilityName}</h4>
                <p className="text-slate-600 font-mono">
                  {selectedBooking.bookingCode} • {selectedBooking.hofName} (ITS: {selectedBooking.itsNumber})
                </p>

                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-semibold">Total Charges</span>
                    <p className="font-mono font-bold text-slate-900 text-sm">
                      ₹{selectedBooking.totalCharges.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-semibold">Already Paid</span>
                    <p className="font-mono font-bold text-emerald-800 text-sm">
                      ₹{selectedBooking.paidAmount.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 flex justify-between items-center">
                  <span className="font-bold text-rose-800">Current Balance Due:</span>
                  <span className="font-mono font-black text-rose-900 text-lg">
                    ₹{selectedBooking.balanceDue.toLocaleString('en-IN')}
                  </span>
                </div>

                {payAmount && Number(payAmount) > 0 && (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-300 space-y-1">
                    <div className="flex justify-between text-slate-700">
                      <span>Payment entering now:</span>
                      <span className="font-bold text-emerald-800 font-mono">
                        -₹{Number(payAmount).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-amber-200">
                      <span>Projected New Balance:</span>
                      <span className="font-mono text-amber-900">
                        ₹
                        {Math.max(
                          0,
                          selectedBooking.balanceDue - Number(payAmount)
                        ).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 space-y-2 text-xs">
                <Receipt className="w-8 h-8 mx-auto text-slate-300" />
                <p className="font-bold text-slate-700">No Booking Selected</p>
                <p className="text-slate-400">
                  Select a booking from the dropdown to view its financial breakdown and remaining balance.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── PRINTABLE RECEIPT MODAL ── */}
      {activeReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-amber-400 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-[#0F172A] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm">Official Hall Booking Receipt</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveReceipt(null)}
                className="text-slate-400 hover:text-white p-1 rounded-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs font-sans">
              <div className="text-center pb-3 border-b border-dashed border-slate-300">
                <p className="font-black text-sm uppercase text-slate-900 tracking-wider">
                  Mawaid & Community Hall Department
                </p>
                <p className="text-[11px] text-slate-500">Anjuman-e-Saifee • Burhani Park Jamat</p>
                <p className="text-[10px] text-amber-800 font-bold mt-1">
                  OFFICIAL BOOKING RECEIPT VOUCHER
                </p>
              </div>

              <div className="flex justify-between text-[11px]">
                <div>
                  <p className="text-slate-400">Receipt No:</p>
                  <p className="font-mono font-bold text-slate-900">{activeReceipt.receiptNo}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-400">Booking Code:</p>
                  <p className="font-mono font-bold text-amber-800">{activeReceipt.bookingCode}</p>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Member Name:</span>
                  <span className="font-bold text-slate-900">{activeReceipt.hofName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">ITS Number:</span>
                  <span className="font-mono font-bold text-slate-900">{activeReceipt.itsNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Facility:</span>
                  <span className="font-semibold text-slate-800 truncate max-w-[200px]">
                    {activeReceipt.facilityName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Type:</span>
                  <span className="font-bold text-slate-900">{activeReceipt.paymentType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Mode:</span>
                  <span className="font-bold text-slate-900">{activeReceipt.paymentMode}</span>
                </div>
                {activeReceipt.referenceNo && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Ref / Txn No:</span>
                    <span className="font-mono text-slate-700">{activeReceipt.referenceNo}</span>
                  </div>
                )}
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-300 flex justify-between items-center">
                <span className="font-bold text-amber-950 uppercase text-[11px]">
                  Amount Received:
                </span>
                <span className="font-mono font-black text-xl text-amber-950">
                  ₹{activeReceipt.amount.toLocaleString('en-IN')}
                </span>
              </div>

              {activeReceipt.notes && (
                <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="font-semibold text-slate-700">Remarks: </span>
                  {activeReceipt.notes}
                </div>
              )}

              <div className="pt-2 text-center text-[10px] text-slate-400 border-t border-slate-100">
                Processed by Cashier @{activeReceipt.processedBy} • System Verified Official Voucher
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    window.print();
                  }}
                  className="py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-400" />
                  <span>Print Receipt</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveReceipt(null)}
                  className="py-2 px-3 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-lg cursor-pointer text-center"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
