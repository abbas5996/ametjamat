import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Lock,
  X,
  CheckCircle2,
  AlertCircle,
  Users,
  Building,
  DollarSign,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Eye,
  Check,
  RotateCcw,
  Ban,
  FileText,
} from 'lucide-react';
import {
  FacilityRecord,
  BookingRecord,
  BookingEventType,
  BookingStatus,
  BookingPaymentStatus,
  HeadOfFamily,
  UserProfile,
} from '../../types';
import {
  saveStoredBookings,
  checkSlotCollision,
  recordBookingPayment,
  logHallBookingAudit,
} from '../../utils/hallBooking';
import { checkUserPermission } from '../../utils/rbac';

interface BookingCalendarSubpageProps {
  facilities: FacilityRecord[];
  bookings: BookingRecord[];
  setBookings: React.Dispatch<React.SetStateAction<BookingRecord[]>>;
  hofs: HeadOfFamily[];
  currentUser: UserProfile;
  showToast: (msg: string) => void;
  preselectedFacilityId?: string;
  onNavigateToPayment: (bookingId: string) => void;
}

export const BookingCalendarSubpage: React.FC<BookingCalendarSubpageProps> = ({
  facilities,
  bookings,
  setBookings,
  hofs,
  currentUser,
  showToast,
  preselectedFacilityId,
  onNavigateToPayment,
}) => {
  // Calendar View Filter & Navigation
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>(
    preselectedFacilityId || 'all'
  );
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Date Filter (defaults to November 2026 as per local ERP calendar)
  const [selectedMonth, setSelectedMonth] = useState('2026-11');

  // Modal State for New Booking
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<BookingRecord | null>(null);

  // New Booking Form State
  const [formIts, setFormIts] = useState('');
  const [formHofName, setFormHofName] = useState('');
  const [formMobile, setFormMobile] = useState('');
  const [formFacilityId, setFormFacilityId] = useState(facilities[0]?.id || '');
  const [formEventType, setFormEventType] = useState<BookingEventType>('Lagan / Shadi');
  const [formEventDate, setFormEventDate] = useState('2026-11-20');
  const [formStartTime, setFormStartTime] = useState('10:00 AM');
  const [formEndTime, setFormEndTime] = useState('04:00 PM');
  const [formGuests, setFormGuests] = useState<number>(300);
  const [formAdvanceDeposit, setFormAdvanceDeposit] = useState<number>(5000);
  const [formSpecialRequests, setFormSpecialRequests] = useState('');

  // Details Modal
  const [viewingBooking, setViewingBooking] = useState<BookingRecord | null>(null);

  // Granular RBAC Permissions
  const canAdd = checkUserPermission(currentUser, 'hall-booking', 'add');
  const canEdit = checkUserPermission(currentUser, 'hall-booking', 'edit');
  const canDelete = checkUserPermission(currentUser, 'hall-booking', 'delete');

  // Auto-calculated charges based on facility daily/hourly rate
  const calculatedCharges = useMemo(() => {
    const fac = facilities.find((f) => f.id === formFacilityId);
    if (!fac) return 15000;
    // Default standard session charges
    return fac.dailyRate || 15000;
  }, [facilities, formFacilityId]);

  // Open New Booking Modal
  const handleOpenNewBooking = (facilityId?: string) => {
    if (!canAdd) {
      showToast('Access Restricted: You do not have [Add] permission for Hall Bookings.');
      return;
    }
    setEditingBooking(null);
    setFormIts('');
    setFormHofName('');
    setFormMobile('');
    setFormFacilityId(facilityId || facilities[0]?.id || '');
    setFormEventType('Lagan / Shadi');
    setFormEventDate('2026-11-25');
    setFormStartTime('10:00 AM');
    setFormEndTime('04:00 PM');
    setFormGuests(300);
    setFormAdvanceDeposit(5000);
    setFormSpecialRequests('');
    setIsBookingModalOpen(true);
  };

  // Select Member in Booking Form
  const handleSelectHof = (its: string) => {
    setFormIts(its);
    const matched = hofs.find((h) => h.itsNumber === its);
    if (matched) {
      setFormHofName(matched.fullName);
      setFormMobile(matched.mobileNumber);
    }
  };

  // Submit New Booking
  const handleSaveBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAdd && !editingBooking) {
      showToast('Access Restricted: You do not have permission to create bookings.');
      return;
    }

    if (!formIts || !formFacilityId || !formEventDate) {
      showToast('Please complete all required fields.');
      return;
    }

    const fac = facilities.find((f) => f.id === formFacilityId);
    if (!fac) {
      showToast('Please select a valid facility.');
      return;
    }

    // Double-booking check
    const collision = checkSlotCollision(
      bookings,
      formFacilityId,
      formEventDate,
      editingBooking?.id
    );

    if (collision) {
      if (
        !window.confirm(
          `⚠️ Double Booking Alert: Another booking (${collision.bookingCode} - ${collision.hofName}) is already scheduled for ${fac.name} on ${formEventDate}. Proceed anyway?`
        )
      ) {
        return;
      }
    }

    const total = calculatedCharges;
    const paid = Math.min(total, formAdvanceDeposit);
    const balance = Math.max(0, total - paid);
    const paymentStatus: BookingPaymentStatus =
      balance === 0 ? 'Paid' : paid > 0 ? 'Partial' : 'Unpaid';

    const now = new Date().toISOString().slice(0, 10);

    if (editingBooking) {
      // Edit / Reschedule
      const updated = bookings.map((b) =>
        b.id === editingBooking.id
          ? {
              ...b,
              facilityId: formFacilityId,
              facilityName: fac.name,
              eventType: formEventType,
              eventDate: formEventDate,
              startTime: formStartTime,
              endTime: formEndTime,
              expectedGuests: formGuests,
              specialRequests: formSpecialRequests.trim() || undefined,
              updatedAt: now,
            }
          : b
      );
      setBookings(updated);
      saveStoredBookings(updated);
      logHallBookingAudit(
        currentUser.username,
        'EDIT',
        editingBooking.bookingCode,
        editingBooking.itsNumber,
        `Rescheduled booking for ${fac.name} to ${formEventDate} (${formStartTime} - ${formEndTime}).`
      );
      showToast(`Booking ${editingBooking.bookingCode} updated.`);
    } else {
      // Create New
      const bookingSerial = (bookings.length + 1).toString().padStart(3, '0');
      const bookingCode = `BK-1447-${bookingSerial}`;

      const newBooking: BookingRecord = {
        id: `bk-${Date.now()}`,
        bookingCode,
        facilityId: formFacilityId,
        facilityName: fac.name,
        itsNumber: formIts,
        hofName: formHofName,
        mobileNumber: formMobile,
        eventType: formEventType,
        eventDate: formEventDate,
        startTime: formStartTime,
        endTime: formEndTime,
        durationHours: 6,
        expectedGuests: formGuests,
        totalCharges: total,
        advanceDeposit: formAdvanceDeposit,
        paidAmount: paid,
        balanceDue: balance,
        paymentStatus,
        bookingStatus: 'Confirmed',
        specialRequests: formSpecialRequests.trim() || undefined,
        bookedBy: currentUser.username,
        createdAt: now,
        updatedAt: now,
      };

      const updated = [newBooking, ...bookings];
      setBookings(updated);
      saveStoredBookings(updated);

      logHallBookingAudit(
        currentUser.username,
        'ADD',
        bookingCode,
        formIts,
        `Created new booking for "${fac.name}" on ${formEventDate} (${formEventType}) for ${formHofName}.`
      );

      showToast(`Confirmed booking ${bookingCode} for ${formHofName}!`);
    }

    setIsBookingModalOpen(false);
  };

  // Quick Action: Update Status (Confirm / Cancel / Complete)
  const handleUpdateStatus = (booking: BookingRecord, newStatus: BookingStatus) => {
    if (!canEdit) {
      showToast('Access Restricted: You do not have [Edit] permission.');
      return;
    }

    if (
      newStatus === 'Cancelled' &&
      !window.confirm(`Are you sure you want to cancel booking ${booking.bookingCode}?`)
    ) {
      return;
    }

    const updated = bookings.map((b) =>
      b.id === booking.id
        ? {
            ...b,
            bookingStatus: newStatus,
            updatedAt: new Date().toISOString().slice(0, 10),
          }
        : b
    );

    setBookings(updated);
    saveStoredBookings(updated);

    logHallBookingAudit(
      currentUser.username,
      'EDIT',
      booking.bookingCode,
      booking.itsNumber,
      `Updated status from [${booking.bookingStatus}] to [${newStatus}].`
    );

    showToast(`Booking ${booking.bookingCode} marked as ${newStatus}.`);
  };

  // Filtered Bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        b.bookingCode.toLowerCase().includes(q) ||
        b.itsNumber.includes(q) ||
        b.hofName.toLowerCase().includes(q) ||
        b.facilityName.toLowerCase().includes(q) ||
        b.eventType.toLowerCase().includes(q);

      const matchFacility =
        selectedFacilityId === 'all' || b.facilityId === selectedFacilityId;

      const matchStatus = statusFilter === 'all' || b.bookingStatus === statusFilter;

      return matchSearch && matchFacility && matchStatus;
    });
  }, [bookings, searchQuery, selectedFacilityId, statusFilter]);

  // Render Status Badge
  const renderStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'Confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Confirmed
          </span>
        );
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3 h-3 text-amber-600" />
            Pending Approval
          </span>
        );
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
            <Check className="w-3 h-3 text-blue-600" />
            Event Completed
          </span>
        );
      case 'Cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <Ban className="w-3 h-3 text-rose-600" />
            Cancelled
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
            <CalendarIcon className="w-5 h-5 text-amber-600" />
            <span>Interactive Booking Calendar & Slot Manager</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time slot availability manager with collision detection to prevent double bookings.
            Filter by facility, confirm reservations, or reschedule slots.
          </p>
        </div>

        {/* Action Button: [ + New Booking ] */}
        {canAdd ? (
          <button
            type="button"
            onClick={() => handleOpenNewBooking()}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Booking</span>
          </button>
        ) : (
          <div
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 text-slate-400 rounded-lg text-xs font-medium cursor-not-allowed shrink-0"
            title="Booking creation restricted by RBAC"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>New Booking (Restricted)</span>
          </div>
        )}
      </div>

      {/* ── Filters & Search ── */}
      <div className="bg-white border border-amber-200/80 rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Booking ID (BK-...), ITS No, Member Name, or Event..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
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

          {/* Facility Filter Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-500 font-semibold">Facility:</span>
            <select
              value={selectedFacilityId}
              onChange={(e) => setSelectedFacilityId(e.target.value)}
              className="p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">All Facilities ({facilities.length})</option>
              {facilities.map((fac) => (
                <option key={fac.id} value={fac.id}>
                  {fac.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-500 font-semibold">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">All Statuses</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Pending">Pending Approval</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Bookings Master List & Calendar Timeline ── */}
      <div className="bg-white border border-amber-200/90 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>Scheduled Community Hall Bookings ({filteredBookings.length})</span>
          </h3>
          <span className="text-xs text-slate-500">
            Double-click or click View for full event particulars
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0F172A] text-white uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="py-3 px-3.5">Booking ID</th>
                <th className="py-3 px-3.5">Facility</th>
                <th className="py-3 px-3.5">Member Name & ITS</th>
                <th className="py-3 px-3.5">Event Type</th>
                <th className="py-3 px-3.5">Date & Time Slot</th>
                <th className="py-3 px-3.5 text-right">Charges (₹)</th>
                <th className="py-3 px-3.5">Status</th>
                <th className="py-3 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-500">
                    <CalendarIcon className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-700">No Bookings Found</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Check filters or click "+ New Booking" to reserve a hall slot.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-amber-50/50 transition-colors">
                    {/* Booking ID */}
                    <td className="py-3 px-3.5 font-mono font-bold text-amber-900 whitespace-nowrap">
                      {b.bookingCode}
                    </td>

                    {/* Facility */}
                    <td className="py-3 px-3.5">
                      <div className="font-bold text-slate-900">{b.facilityName}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Users className="w-3 h-3 text-amber-600 shrink-0" />
                        <span>{b.expectedGuests} Guests</span>
                      </div>
                    </td>

                    {/* Member Name & ITS */}
                    <td className="py-3 px-3.5">
                      <div className="font-bold text-slate-900">{b.hofName}</div>
                      <div className="text-[11px] font-mono text-slate-500">
                        ITS: {b.itsNumber} • {b.mobileNumber}
                      </div>
                    </td>

                    {/* Event Type */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                        {b.eventType}
                      </span>
                    </td>

                    {/* Date & Time Slot */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <div className="font-bold text-slate-800">{b.eventDate}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>
                          {b.startTime} - {b.endTime}
                        </span>
                      </div>
                    </td>

                    {/* Charges */}
                    <td className="py-3 px-3.5 text-right font-mono whitespace-nowrap">
                      <p className="font-bold text-slate-900">₹{b.totalCharges.toLocaleString('en-IN')}</p>
                      <p
                        className={`text-[10px] font-semibold ${
                          b.balanceDue > 0 ? 'text-rose-600' : 'text-emerald-600'
                        }`}
                      >
                        {b.balanceDue > 0 ? `Due: ₹${b.balanceDue.toLocaleString('en-IN')}` : 'Fully Settled'}
                      </p>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3.5 whitespace-nowrap">{renderStatusBadge(b.bookingStatus)}</td>

                    {/* Quick Actions */}
                    <td className="py-3 px-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Inspect Details */}
                        <button
                          type="button"
                          onClick={() => setViewingBooking(b)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md cursor-pointer"
                          title="View Booking Details & Special Requests"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Confirm shortcut (if pending) */}
                        {b.bookingStatus === 'Pending' && canEdit && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(b, 'Confirmed')}
                            className="px-2 py-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded text-[11px] cursor-pointer flex items-center gap-1"
                            title="Confirm Booking Slot"
                          >
                            <Check className="w-3 h-3" />
                            <span>Confirm</span>
                          </button>
                        )}

                        {/* Pay balance shortcut (if balance due) */}
                        {b.balanceDue > 0 && (
                          <button
                            type="button"
                            onClick={() => onNavigateToPayment(b.id)}
                            className="px-2 py-1 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded text-[11px] cursor-pointer"
                            title="Record Payment in Ledger"
                          >
                            Pay Due
                          </button>
                        )}

                        {/* Cancel shortcut */}
                        {b.bookingStatus !== 'Cancelled' && canEdit && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(b, 'Cancelled')}
                            className="p-1.5 bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-700 rounded-md cursor-pointer"
                            title="Cancel Booking"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── NEW / EDIT BOOKING MODAL ── */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-amber-300 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-[#0F172A] text-white p-4 sm:p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">
                  {editingBooking ? `Reschedule ${editingBooking.bookingCode}` : 'Book Community Facility'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBookingModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBooking} className="p-4 sm:p-6 space-y-4 text-xs">
              {/* Member Selection from Member Master */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  1. Select Member (Head of Family from Member Master) *
                </label>
                <select
                  value={formIts}
                  onChange={(e) => handleSelectHof(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                >
                  <option value="">-- Choose Member HOF --</option>
                  {hofs.map((h) => (
                    <option key={h.id} value={h.itsNumber}>
                      {h.fullName} (ITS: {h.itsNumber}) • {h.mohallahName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Facility Selection */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  2. Select Facility / Hall *
                </label>
                <select
                  value={formFacilityId}
                  onChange={(e) => setFormFacilityId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                >
                  {facilities.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.capacity} Capacity • ₹{f.dailyRate.toLocaleString('en-IN')}/day)
                    </option>
                  ))}
                </select>
              </div>

              {/* Event Type & Expected Guests */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Event Type *
                  </label>
                  <select
                    value={formEventType}
                    onChange={(e) => setFormEventType(e.target.value as BookingEventType)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold"
                  >
                    <option value="Lagan / Shadi">Lagan / Shadi</option>
                    <option value="Aqiqa">Aqiqa</option>
                    <option value="Majlis / Darees">Majlis / Darees</option>
                    <option value="Meeting / Conference">Meeting / Conference</option>
                    <option value="FMB Jaman">FMB Jaman</option>
                    <option value="Ziafat / Feast">Ziafat / Feast</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Expected Guests *
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formGuests}
                    onChange={(e) => setFormGuests(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono font-bold"
                    required
                  />
                </div>
              </div>

              {/* Date & Time Slot */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-3 sm:col-span-1">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Event Date *
                  </label>
                  <input
                    type="date"
                    value={formEventDate}
                    onChange={(e) => setFormEventDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Start Time *
                  </label>
                  <input
                    type="text"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    placeholder="e.g. 10:00 AM"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    End Time *
                  </label>
                  <input
                    type="text"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    placeholder="e.g. 04:00 PM"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono"
                    required
                  />
                </div>
              </div>

              {/* Charges & Advance Deposit */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-amber-50/70 rounded-xl border border-amber-200">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">
                    Calculated Charges:
                  </span>
                  <p className="text-base font-bold text-slate-900 font-mono">
                    ₹{calculatedCharges.toLocaleString('en-IN')}
                  </p>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                    Advance Deposit (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={calculatedCharges}
                    value={formAdvanceDeposit}
                    onChange={(e) => setFormAdvanceDeposit(Number(e.target.value))}
                    className="w-full p-1.5 bg-white border border-slate-300 rounded text-emerald-800 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Special Requests */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Special Arrangements / Setup Requests
                </label>
                <input
                  type="text"
                  value={formSpecialRequests}
                  onChange={(e) => setFormSpecialRequests(e.target.value)}
                  placeholder="e.g. Stage sofas, audio recording, Thaali setup..."
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              {/* Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsBookingModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg shadow-sm cursor-pointer"
                >
                  {editingBooking ? 'Save Changes' : 'Confirm & Reserve Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── BOOKING DETAILS MODAL ── */}
      {viewingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-amber-300 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-[#0F172A] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm">Booking: {viewingBooking.bookingCode}</h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingBooking(null)}
                className="text-slate-400 hover:text-white p-1 rounded-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-3 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <span className="font-bold text-slate-900 text-sm">{viewingBooking.facilityName}</span>
                {renderStatusBadge(viewingBooking.bookingStatus)}
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-700">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Member Name</p>
                  <p className="font-bold text-slate-900">{viewingBooking.hofName}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">ITS Number</p>
                  <p className="font-mono font-bold text-amber-800">{viewingBooking.itsNumber}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-700">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Event Type</p>
                  <p className="font-semibold text-slate-800">{viewingBooking.eventType}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Expected Guests</p>
                  <p className="font-semibold text-slate-800">{viewingBooking.expectedGuests} Mumineen</p>
                </div>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Date & Time Slot</p>
                <p className="font-bold text-slate-900">
                  {viewingBooking.eventDate} ({viewingBooking.startTime} - {viewingBooking.endTime})
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 bg-amber-50 p-3 rounded-xl border border-amber-200 text-center">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase">Total</p>
                  <p className="font-mono font-bold text-slate-900">₹{viewingBooking.totalCharges.toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase">Paid</p>
                  <p className="font-mono font-bold text-emerald-800">₹{viewingBooking.paidAmount.toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase">Due</p>
                  <p className="font-mono font-bold text-rose-800">₹{viewingBooking.balanceDue.toLocaleString('en-IN')}</p>
                </div>
              </div>
              {viewingBooking.specialRequests && (
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Special Requests</p>
                  <p className="text-slate-700 italic">{viewingBooking.specialRequests}</p>
                </div>
              )}
              <div className="pt-2 flex gap-2">
                {viewingBooking.balanceDue > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setViewingBooking(null);
                      onNavigateToPayment(viewingBooking.id);
                    }}
                    className="flex-1 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-lg cursor-pointer"
                  >
                    💳 Pay Due Balance
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setViewingBooking(null)}
                  className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
