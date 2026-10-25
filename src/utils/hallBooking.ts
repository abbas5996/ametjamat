import {
  FacilityRecord,
  BookingRecord,
  BookingPaymentLedgerEntry,
  FacilityStatus,
  BookingStatus,
  BookingEventType,
  BookingPaymentStatus,
  HeadOfFamily,
} from '../types';
import { getStoredHofs } from './memberMaster';
import { appendActivityLog } from './rbac';

export const FACILITIES_STORAGE_KEY = 'jamat_facilities_v1';
export const BOOKINGS_STORAGE_KEY = 'jamat_bookings_v1';
export const BOOKING_PAYMENTS_STORAGE_KEY = 'jamat_booking_payments_v1';

export const INITIAL_FACILITIES: FacilityRecord[] = [
  {
    id: 'fac-1',
    name: 'Al-Mawaid Al-Saifi Community Hall',
    type: 'Community Hall',
    capacity: 450,
    location: 'Ground Floor, Main Complex',
    hourlyRate: 2500,
    dailyRate: 18000,
    status: 'Available',
    rules: [
      'No loud music during prayer/Azan times.',
      'Catering must be coordinated with FMB approved staff.',
      'Premises must be vacated within 30 minutes after the scheduled slot.',
    ],
    description: 'Premier air-conditioned banquet and gathering hall suitable for Lagan, Majalis, and large community functions.',
    amenities: ['Central Air Conditioning', 'PA Audio System & Wireless Mics', 'Elevated Stage & Sofa Setup', 'Separate Washrooms'],
    createdAt: '1447-01-01',
  },
  {
    id: 'fac-2',
    name: 'Saifee Dining Hall (Mawaid)',
    type: 'Dining Hall',
    capacity: 600,
    location: '1st Floor, Community Complex',
    hourlyRate: 2000,
    dailyRate: 14000,
    status: 'Available',
    rules: [
      'Strictly Dawoodi Bohra traditional seating / Thaali arrangement.',
      'Food waste must be segregated according to FMB guidelines.',
      'Post-event cleaning deposit is mandatory.',
    ],
    description: 'Spacious dining facility equipped with traditional Thaali service counters and industrial washing setup.',
    amenities: ['Thaali Stands & Sofra Setup', 'Deep Freezers & Warmers', 'Industrial Dishwashing Area', 'Service Elevators'],
    createdAt: '1447-01-01',
  },
  {
    id: 'fac-3',
    name: 'Burhani Guest Rooms (Suite A & B)',
    type: 'Guest Rooms',
    capacity: 8,
    location: '2nd Floor, Guest Wing',
    hourlyRate: 600,
    dailyRate: 3500,
    status: 'Available',
    rules: [
      'Maximum 4 occupants per suite.',
      'Standard check-in: 12:00 PM, Check-out: 10:00 AM.',
      'Strictly non-smoking and family-only guest accommodation.',
    ],
    description: 'Furnished suites for visiting guests, Janab Amil Saheb guests, or family relatives attending events.',
    amenities: ['Air Conditioned', 'En-suite Bathrooms with Geysers', 'High Speed Wi-Fi', 'Wardrobe & Workdesk'],
    createdAt: '1447-01-01',
  },
  {
    id: 'fac-4',
    name: 'Executive Committee & Majlis Boardroom',
    type: 'Meeting Spaces',
    capacity: 35,
    location: '1st Floor, Admin Block',
    hourlyRate: 1000,
    dailyRate: 7000,
    status: 'Available',
    rules: [
      'Prior booking required 24 hours in advance.',
      'AV equipment must be handled with care.',
    ],
    description: 'Executive boardroom for Jamaat committee meetings, trustees, and small religious study circles.',
    amenities: ['Smart 4K Presentation Display', 'Conference Mic Array', 'High Speed Fibre Internet', 'Ergonomic Executive Seating'],
    createdAt: '1447-01-01',
  },
  {
    id: 'fac-5',
    name: 'Al-Madrasa Mini Auditorium',
    type: 'Auditorium',
    capacity: 150,
    location: '3rd Floor, MSB Wing',
    hourlyRate: 1500,
    dailyRate: 10000,
    status: 'Under Maintenance',
    rules: [
      'Restricted during regular madrasa teaching hours.',
      'Sound levels must be kept within designated decibels.',
    ],
    description: 'Tiered auditorium for lectures, educational presentations, and youth conferences.',
    amenities: ['Tiered Theatre Seating', 'Stage Lighting & Backdrop', 'HD Projector & Screen', 'Podium with Mic'],
    createdAt: '1447-01-01',
  },
];

export const INITIAL_BOOKINGS: BookingRecord[] = [
  {
    id: 'bk-101',
    bookingCode: 'BK-1447-001',
    facilityId: 'fac-1',
    facilityName: 'Al-Mawaid Al-Saifi Community Hall',
    itsNumber: '30489122',
    hofName: 'Mulla Shabbir Bhai Fakhri',
    mobileNumber: '9820044556',
    eventType: 'Lagan / Shadi',
    eventDate: '2026-11-10',
    startTime: '10:00 AM',
    endTime: '04:00 PM',
    durationHours: 6,
    expectedGuests: 400,
    totalCharges: 18000,
    advanceDeposit: 10000,
    paidAmount: 18000,
    balanceDue: 0,
    paymentStatus: 'Paid',
    bookingStatus: 'Confirmed',
    specialRequests: 'Sofa seating on stage with royal maroon carpet and welcome flowers.',
    receiptNo: 'RCP-BK-1447-001',
    bookedBy: 'janabadmin',
    createdAt: '1447-02-01',
    updatedAt: '1447-02-10',
  },
  {
    id: 'bk-102',
    bookingCode: 'BK-1447-002',
    facilityId: 'fac-2',
    facilityName: 'Saifee Dining Hall (Mawaid)',
    itsNumber: '40291844',
    hofName: 'Sheikh Huzefa Jamali',
    mobileNumber: '9820044557',
    eventType: 'Aqiqa',
    eventDate: '2026-11-15',
    startTime: '07:00 PM',
    endTime: '11:00 PM',
    durationHours: 4,
    expectedGuests: 250,
    totalCharges: 12000,
    advanceDeposit: 6000,
    paidAmount: 6000,
    balanceDue: 6000,
    paymentStatus: 'Partial',
    bookingStatus: 'Confirmed',
    specialRequests: '32 Thaali arrangement with dedicated service aisle.',
    receiptNo: 'RCP-BK-1447-002',
    bookedBy: 'huzefasabeel',
    createdAt: '1447-02-05',
    updatedAt: '1447-02-05',
  },
  {
    id: 'bk-103',
    bookingCode: 'BK-1447-003',
    facilityId: 'fac-4',
    facilityName: 'Executive Committee & Majlis Boardroom',
    itsNumber: '50182733',
    hofName: 'Abdeali Bhai Shujauddin',
    mobileNumber: '9820044558',
    eventType: 'Meeting / Conference',
    eventDate: '2026-11-18',
    startTime: '04:00 PM',
    endTime: '08:00 PM',
    durationHours: 4,
    expectedGuests: 30,
    totalCharges: 4000,
    advanceDeposit: 0,
    paidAmount: 0,
    balanceDue: 4000,
    paymentStatus: 'Unpaid',
    bookingStatus: 'Pending',
    specialRequests: 'Conference screen projection and tea/coffee service setup.',
    bookedBy: 'abdealimember',
    createdAt: '1447-02-12',
    updatedAt: '1447-02-12',
  },
  {
    id: 'bk-104',
    bookingCode: 'BK-1447-004',
    facilityId: 'fac-1',
    facilityName: 'Al-Mawaid Al-Saifi Community Hall',
    itsNumber: '20394855',
    hofName: 'Mulla Aliasgar Hakimuddin',
    mobileNumber: '9820044559',
    eventType: 'Majlis / Darees',
    eventDate: '2026-11-22',
    startTime: '06:00 PM',
    endTime: '10:00 PM',
    durationHours: 4,
    expectedGuests: 350,
    totalCharges: 14000,
    advanceDeposit: 7000,
    paidAmount: 7000,
    balanceDue: 7000,
    paymentStatus: 'Partial',
    bookingStatus: 'Confirmed',
    specialRequests: 'Takht setup with audio recording capability.',
    receiptNo: 'RCP-BK-1447-003',
    bookedBy: 'janabadmin',
    createdAt: '1447-02-14',
    updatedAt: '1447-02-14',
  },
];

export const INITIAL_PAYMENT_LEDGER: BookingPaymentLedgerEntry[] = [
  {
    id: 'pay-101',
    receiptNo: 'RCP-BK-1447-001',
    bookingId: 'bk-101',
    bookingCode: 'BK-1447-001',
    itsNumber: '30489122',
    hofName: 'Mulla Shabbir Bhai Fakhri',
    facilityName: 'Al-Mawaid Al-Saifi Community Hall',
    amount: 18000,
    paymentType: 'FULL_PAYMENT',
    paymentMode: 'Bank Transfer',
    referenceNo: 'HDFC9841024',
    date: '2026-11-01',
    notes: 'Full payment received for Lagan booking.',
    processedBy: 'janabadmin',
    createdAt: '1447-02-01 11:30 AM',
  },
  {
    id: 'pay-102',
    receiptNo: 'RCP-BK-1447-002',
    bookingId: 'bk-102',
    bookingCode: 'BK-1447-002',
    itsNumber: '40291844',
    hofName: 'Sheikh Huzefa Jamali',
    facilityName: 'Saifee Dining Hall (Mawaid)',
    amount: 6000,
    paymentType: 'ADVANCE',
    paymentMode: 'UPI',
    referenceNo: 'UPI/4029/9841',
    date: '2026-11-05',
    notes: '50% advance booking deposit paid at counter.',
    processedBy: 'huzefasabeel',
    createdAt: '1447-02-05 04:15 PM',
  },
  {
    id: 'pay-103',
    receiptNo: 'RCP-BK-1447-003',
    bookingId: 'bk-104',
    bookingCode: 'BK-1447-004',
    itsNumber: '20394855',
    hofName: 'Mulla Aliasgar Hakimuddin',
    facilityName: 'Al-Mawaid Al-Saifi Community Hall',
    amount: 7000,
    paymentType: 'ADVANCE',
    paymentMode: 'Cash',
    referenceNo: 'CASH-VOUCHER-084',
    date: '2026-11-14',
    notes: 'Cash advance collected by Cashier.',
    processedBy: 'janabadmin',
    createdAt: '1447-02-14 05:40 PM',
  },
];

// Getters & Setters
export const getStoredFacilities = (): FacilityRecord[] => {
  try {
    const raw = localStorage.getItem(FACILITIES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(FACILITIES_STORAGE_KEY, JSON.stringify(INITIAL_FACILITIES));
      return INITIAL_FACILITIES;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse facilities from localStorage', err);
    return INITIAL_FACILITIES;
  }
};

export const saveStoredFacilities = (facilities: FacilityRecord[]): void => {
  try {
    localStorage.setItem(FACILITIES_STORAGE_KEY, JSON.stringify(facilities));
  } catch (err) {
    console.error('Failed to save facilities to localStorage', err);
  }
};

export const getStoredBookings = (): BookingRecord[] => {
  try {
    const raw = localStorage.getItem(BOOKINGS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(INITIAL_BOOKINGS));
      return INITIAL_BOOKINGS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse bookings from localStorage', err);
    return INITIAL_BOOKINGS;
  }
};

export const saveStoredBookings = (bookings: BookingRecord[]): void => {
  try {
    localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(bookings));
  } catch (err) {
    console.error('Failed to save bookings to localStorage', err);
  }
};

export const getStoredBookingPayments = (): BookingPaymentLedgerEntry[] => {
  try {
    const raw = localStorage.getItem(BOOKING_PAYMENTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(BOOKING_PAYMENTS_STORAGE_KEY, JSON.stringify(INITIAL_PAYMENT_LEDGER));
      return INITIAL_PAYMENT_LEDGER;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse booking payments from localStorage', err);
    return INITIAL_PAYMENT_LEDGER;
  }
};

export const saveStoredBookingPayments = (payments: BookingPaymentLedgerEntry[]): void => {
  try {
    localStorage.setItem(BOOKING_PAYMENTS_STORAGE_KEY, JSON.stringify(payments));
  } catch (err) {
    console.error('Failed to save booking payments to localStorage', err);
  }
};

/**
 * Check if a facility slot is available or collides with another confirmed/pending booking
 */
export const checkSlotCollision = (
  bookings: BookingRecord[],
  facilityId: string,
  eventDate: string,
  excludeBookingId?: string
): BookingRecord | undefined => {
  return bookings.find(
    (b) =>
      b.facilityId === facilityId &&
      b.eventDate === eventDate &&
      b.bookingStatus !== 'Cancelled' &&
      b.id !== excludeBookingId
  );
};

/**
 * Record a payment for a booking
 */
export const recordBookingPayment = (
  paymentData: {
    bookingId: string;
    amount: number;
    paymentType: BookingPaymentLedgerEntry['paymentType'];
    paymentMode: BookingPaymentLedgerEntry['paymentMode'];
    referenceNo?: string;
    date: string;
    notes?: string;
  },
  username: string
): {
  updatedBooking: BookingRecord;
  newPaymentEntry: BookingPaymentLedgerEntry;
  updatedBookings: BookingRecord[];
  updatedPayments: BookingPaymentLedgerEntry[];
} => {
  const currentBookings = getStoredBookings();
  const currentPayments = getStoredBookingPayments();

  const targetBooking = currentBookings.find((b) => b.id === paymentData.bookingId);
  if (!targetBooking) {
    throw new Error('Booking not found');
  }

  const receiptSerial = (currentPayments.length + 1).toString().padStart(4, '0');
  const receiptNo = `RCP-BK-${new Date().getFullYear()}-${receiptSerial}`;

  const now = new Date();
  const timeString = `${now.toLocaleDateString()} ${now.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`;

  const newPaymentEntry: BookingPaymentLedgerEntry = {
    id: `pay-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    receiptNo,
    bookingId: targetBooking.id,
    bookingCode: targetBooking.bookingCode,
    itsNumber: targetBooking.itsNumber,
    hofName: targetBooking.hofName,
    facilityName: targetBooking.facilityName,
    amount: paymentData.amount,
    paymentType: paymentData.paymentType,
    paymentMode: paymentData.paymentMode,
    referenceNo: paymentData.referenceNo || `REF-${Date.now().toString().slice(-6)}`,
    date: paymentData.date,
    notes: paymentData.notes || `Payment recorded for ${targetBooking.bookingCode}`,
    processedBy: username,
    createdAt: timeString,
  };

  const updatedPayments = [newPaymentEntry, ...currentPayments];
  saveStoredBookingPayments(updatedPayments);

  // Update Booking financials
  const newPaidAmount = (targetBooking.paidAmount || 0) + paymentData.amount;
  const newBalanceDue = Math.max(0, targetBooking.totalCharges - newPaidAmount);
  const newPaymentStatus: BookingPaymentStatus =
    newBalanceDue === 0 ? 'Paid' : newPaidAmount > 0 ? 'Partial' : 'Unpaid';

  const updatedBooking: BookingRecord = {
    ...targetBooking,
    paidAmount: newPaidAmount,
    balanceDue: newBalanceDue,
    paymentStatus: newPaymentStatus,
    receiptNo,
    updatedAt: new Date().toISOString().slice(0, 10),
  };

  const updatedBookings = currentBookings.map((b) => (b.id === targetBooking.id ? updatedBooking : b));
  saveStoredBookings(updatedBookings);

  // Audit log
  appendActivityLog(
    username,
    'Services',
    'Hall Bookings',
    'ADD',
    `[Booking: ${targetBooking.bookingCode}] [ITS: ${targetBooking.itsNumber}] Received payment ₹${paymentData.amount.toLocaleString(
      'en-IN'
    )} via ${paymentData.paymentMode} for ${targetBooking.facilityName}. Receipt: ${receiptNo}`
  );

  return {
    updatedBooking,
    newPaymentEntry,
    updatedBookings,
    updatedPayments,
  };
};

/**
 * Dedicated Audit logger for Hall Booking module
 */
export const logHallBookingAudit = (
  username: string,
  actionType: 'ADD' | 'EDIT' | 'DELETE',
  bookingCode: string,
  itsNumber: string,
  details: string
) => {
  appendActivityLog(
    username,
    'Services',
    'Hall Bookings',
    actionType,
    `[Booking: ${bookingCode}] [ITS: ${itsNumber}] ${details}`
  );
};
