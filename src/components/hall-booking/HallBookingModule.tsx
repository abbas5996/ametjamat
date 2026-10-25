import React, { useState } from 'react';
import {
  Building2,
  Calendar,
  Receipt,
  ShieldAlert,
} from 'lucide-react';
import {
  FacilityRecord,
  BookingRecord,
  BookingPaymentLedgerEntry,
  HeadOfFamily,
  UserProfile,
  FinancialYear,
} from '../../types';
import {
  getStoredFacilities,
  getStoredBookings,
  getStoredBookingPayments,
} from '../../utils/hallBooking';
import { getStoredHofs } from '../../utils/memberMaster';
import { checkUserPermission } from '../../utils/rbac';
import { FacilityDirectorySubpage } from './FacilityDirectorySubpage';
import { BookingCalendarSubpage } from './BookingCalendarSubpage';
import { BookingPaymentLedgerSubpage } from './BookingPaymentLedgerSubpage';

interface HallBookingModuleProps {
  currentUser: UserProfile;
  subItemLabel: string;
  financialYear: FinancialYear;
  showToast: (msg: string) => void;
}

export const HallBookingModule: React.FC<HallBookingModuleProps> = ({
  currentUser,
  subItemLabel,
  financialYear,
  showToast,
}) => {
  // Shared persistent state
  const [facilities, setFacilities] = useState<FacilityRecord[]>(() => getStoredFacilities());
  const [bookings, setBookings] = useState<BookingRecord[]>(() => getStoredBookings());
  const [payments, setPayments] = useState<BookingPaymentLedgerEntry[]>(() =>
    getStoredBookingPayments()
  );
  const [hofs, setHofs] = useState<HeadOfFamily[]>(() => getStoredHofs());

  // Active Sub-tab state
  const [activeTab, setActiveTab] = useState<'facilities' | 'calendar' | 'ledger'>('facilities');

  // Pre-selected parameters when cross-navigating between tabs
  const [targetFacilityId, setTargetFacilityId] = useState<string | undefined>(undefined);
  const [targetBookingId, setTargetBookingId] = useState<string | undefined>(undefined);

  // Cross-tab navigation handlers
  const handleSelectFacilityForBooking = (facilityId: string) => {
    setTargetFacilityId(facilityId);
    setActiveTab('calendar');
  };

  const handleNavigateToPayment = (bookingId: string) => {
    setTargetBookingId(bookingId);
    setActiveTab('ledger');
  };

  // Granular RBAC View Permission
  const canViewHallBooking = checkUserPermission(currentUser, 'hall-booking', 'view');

  if (!canViewHallBooking) {
    return (
      <div className="bg-white border border-rose-200 rounded-2xl p-8 text-center max-w-md mx-auto shadow-sm space-y-3">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900">Access Restricted</h3>
        <p className="text-xs text-slate-500">
          You do not have <span className="font-bold text-rose-700">[View]</span> permission to access{' '}
          <span className="font-semibold">Hall Booking & Facility Management</span>. Contact the Super Admin
          or Janab Amil Saheb for access authorization.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Sub-Page Navigation Tabs ── */}
      <div className="bg-white border border-amber-300/40 rounded-xl p-1.5 shadow-xs flex items-center gap-1.5 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('facilities')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'facilities'
              ? 'bg-amber-400 text-slate-950 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-amber-50'
          }`}
        >
          <Building2 className="w-4 h-4 text-amber-900" />
          <span>1. Facility & Hall Directory</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-800 font-mono font-bold">
            {facilities.length} Halls
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('calendar')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'calendar'
              ? 'bg-amber-400 text-slate-950 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-amber-50'
          }`}
        >
          <Calendar className="w-4 h-4 text-amber-900" />
          <span>2. Booking Calendar & Slot Manager</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-mono font-bold">
            {bookings.filter((b) => b.bookingStatus === 'Confirmed').length} Confirmed
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ledger')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'ledger'
              ? 'bg-amber-400 text-slate-950 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-amber-50'
          }`}
        >
          <Receipt className="w-4 h-4 text-amber-900" />
          <span>3. Payment & Receipt Ledger</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 text-blue-800 font-mono font-bold">
            {payments.length} Receipts
          </span>
        </button>
      </div>

      {/* ── Sub-Page Rendering ── */}
      {activeTab === 'facilities' && (
        <FacilityDirectorySubpage
          facilities={facilities}
          setFacilities={setFacilities}
          currentUser={currentUser}
          showToast={showToast}
          onSelectFacilityForBooking={handleSelectFacilityForBooking}
        />
      )}

      {activeTab === 'calendar' && (
        <BookingCalendarSubpage
          facilities={facilities}
          bookings={bookings}
          setBookings={setBookings}
          hofs={hofs}
          currentUser={currentUser}
          showToast={showToast}
          preselectedFacilityId={targetFacilityId}
          onNavigateToPayment={handleNavigateToPayment}
        />
      )}

      {activeTab === 'ledger' && (
        <BookingPaymentLedgerSubpage
          bookings={bookings}
          setBookings={setBookings}
          payments={payments}
          setPayments={setPayments}
          currentUser={currentUser}
          showToast={showToast}
          preselectedBookingId={targetBookingId}
        />
      )}
    </div>
  );
};
