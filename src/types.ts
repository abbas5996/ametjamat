export interface SubMenuItem {
  id: string;
  label: string;
  badge?: string;
  badgeColor?: 'yellow' | 'blue' | 'emerald';
}

export interface NavCategory {
  id: string;
  title: string;
  iconName: string;
  items: SubMenuItem[];
}

export type FinancialYear = '1447-1448 Hijri' | '1446-1447 Hijri';

export type RoleView = 'super_admin' | 'cashier' | 'read_only';

export type SubModuleAction = 'view' | 'add' | 'edit' | 'delete';

export interface SubModulePermissions {
  view: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
}

export type UserPermissionsMap = Record<string, SubModulePermissions>;

export interface ManagedUser {
  id: string;
  fullName: string;
  username: string;
  password?: string;
  department: string;
  permissions: UserPermissionsMap;
  createdAt: string;
}

export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  username: string;
  department: string;
  subpage: string;
  actionType: 'ADD' | 'EDIT' | 'DELETE' | 'VIEW' | 'CREATED_USER' | 'UPDATED_PERMISSIONS' | 'DELETED_USER' | 'ADMIN_RESET_PASSWORD' | 'PAYMENT' | 'CANCEL_RECEIPT';
  details: string;
}

export interface UserProfile {
  username: string;
  displayName: string;
  role: string;
  avatarUrl?: string;
  itsNumber: string;
  permissions?: UserPermissionsMap | 'all' | null;
}

export interface FaizTransaction {
  id: string;
  memberName: string;
  itsNumber: string;
  sabeelNo: string;
  thaaliNo: string;
  amount: number;
  receiptNo: string;
  date: string;
  head: string;
  status: 'verified' | 'pending';
}

export interface InstallmentMilestone {
  id: string;
  event: string;
  hijriDate: string;
  totalTarget: number;
  collectedAmount: number;
  percentage: number;
  status: 'completed' | 'current' | 'upcoming';
}

// ================= MEMBER & AREA MASTER MODULE TYPES =================
export type FamilyRelation =
  | 'Wife'
  | 'Son'
  | 'Daughter'
  | 'Father'
  | 'Mother'
  | 'Daughter-in-law'
  | 'Grandchild'
  | 'Brother'
  | 'Sister'
  | 'Other';

export type Gender = 'Male' | 'Female';

export type MaritalStatus = 'Single' | 'Married' | 'Widowed' | 'Divorced';

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export interface FamilyMember {
  id: string;
  itsNumber: string;
  fullName: string;
  relation: FamilyRelation;
  gender: Gender;
  maritalStatus: MaritalStatus;
  bloodGroup: BloodGroup;
  age: number;
  hofItsNumber: string;
  mobileNumber?: string;
  status?: 'Active' | 'Inactive';
}

export interface HeadOfFamily {
  id: string;
  itsNumber: string; // Unique 8-digit ITS
  fullName: string;
  fatherName: string;
  surname: string;
  mobileNumber: string;
  whatsappNumber: string;
  fullAddress: string;
  occupation: string;
  mohallahId: string; // e.g., 'MOH-SEC-A' or empty string if unmapped
  mohallahName: string; // e.g., 'Saifee Mohallah' or 'Unassigned'
  status: 'Active' | 'Inactive';
  familyMembers: FamilyMember[];
  sabeelNo?: string;
  thaaliNo?: string;
  emergencyContact?: string;
  bloodGroup?: BloodGroup;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Mohallah {
  id: string;
  name: string;
  code: string;
  sectorInchargeName: string;
  sectorInchargeIts: string;
  inchargeMobile: string;
  notes?: string;
  colorTag?: string;
}

// ================= FMB & TAKHMEEN MODULE TYPES =================
export type ThaaliStatus = 'Active' | 'Closed' | 'Blocked' | 'Vacation';
export type TakhmeenTier = 'Full' | 'Half' | 'Special' | 'Custom';
export type FmbPaymentMode = 'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque';
export type DeliveryType = 'Home Delivery' | 'Pickup Point' | 'Dawat Centre';

export interface ThaaliRecord {
  id: string;
  itsNumber: string;
  hofName: string;
  mobileNumber: string;
  thaaliNo: string;
  status: ThaaliStatus;
  tier: TakhmeenTier;
  deliveryType: DeliveryType;
  assignedAddress: string;
  pickupPoint?: string;
  mohallahName?: string;
  vacationFrom?: string;
  vacationTo?: string;
  reason?: string;
  updatedAt: string;
}

export interface TakhmeenRecord {
  id: string;
  itsNumber: string;
  hofName: string;
  mobileNumber: string;
  financialYear: string;
  tier: TakhmeenTier;
  committedAmount: number;
  paidAmount: number;
  balanceDue: number;
  status: 'Completed' | 'Partial' | 'Unpaid';
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FmbCollectionEntry {
  id: string;
  receiptNo: string;
  itsNumber: string;
  hofName: string;
  takhmeenId?: string;
  amount: number;
  paymentMode: FmbPaymentMode;
  referenceNo?: string;
  date: string;
  financialYear: string;
  notes?: string;
  collectedBy: string;
  createdAt: string;
}

// ================= SABEEL MANAGEMENT MODULE TYPES =================
export type SabeelPaymentMode = 'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque';
export type SabeelAccountStatus = 'Settled' | 'Partial' | 'Pending' | 'Exempt';
export type SabeelCategory = 'Residential' | 'Commercial' | 'Special' | string;

export interface SabeelLedgerRecord {
  id: string;
  itsNumber: string;
  hofName: string;
  sabeelNo: string;
  mobileNumber: string;
  mohallahName: string;
  financialYear: string;
  category: SabeelCategory;
  committedAmount: number;
  paidAmount: number;
  balanceDue: number;
  status: SabeelAccountStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // Extended fields used by production subpages
  memberName?: string;
  sabeelNumber?: string;
  mohallah?: string;
  grade?: string;
  sabeelType?: string;
  annualPledged?: number;
  totalAllocated?: number;
  totalPaid?: number;
  giftAidEligible?: boolean;
  isActive?: boolean;
  closedDate?: string;
  closedBy?: string;
  closureReason?: string;
  waivedAmount?: number;
  waivedBy?: string;
  waiverDate?: string;
  waiverReason?: string;
  contactPhone?: string;
}

export type SabeelTransactionType = 'PAYMENT' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'ADJUSTMENT';

export interface SabeelTransactionEntry {
  id: string;
  receiptNo: string;
  type: SabeelTransactionType;
  itsNumber: string;
  hofName: string;
  sabeelNo: string;
  amount: number;
  paymentMode: SabeelPaymentMode;
  referenceNo?: string;
  financialYear: string;
  date: string;
  notes: string;
  fromIts?: string;
  fromHofName?: string;
  toIts?: string;
  toHofName?: string;
  collectedBy: string;
  createdAt: string;
  // Extended fields used by production subpages
  paymentDate?: string;
  amountPaid?: number;
  balanceDueAfterPayment?: number;
  receivedBy?: string;
  mohallah?: string;
  memberName?: string;
  chequeNo?: string;
  bankName?: string;
}

// ================= HALL BOOKING & FACILITY MANAGEMENT TYPES =================
export type FacilityStatus = 'Available' | 'Under Maintenance' | 'Reserved';
export type BookingStatus = 'Confirmed' | 'Pending' | 'Cancelled' | 'Completed';
export type BookingEventType =
  | 'Lagan / Shadi'
  | 'Aqiqa'
  | 'Majlis / Darees'
  | 'Meeting / Conference'
  | 'FMB Jaman'
  | 'Ziafat / Feast';
export type BookingPaymentStatus = 'Paid' | 'Partial' | 'Unpaid' | 'Refunded';
export type FacilityType =
  | 'Community Hall'
  | 'Dining Hall'
  | 'Guest Rooms'
  | 'Meeting Spaces'
  | 'Auditorium';

export interface FacilityRecord {
  id: string;
  name: string;
  type: FacilityType;
  capacity: number;
  location: string;
  hourlyRate: number;
  dailyRate: number;
  status: FacilityStatus;
  rules: string[];
  description: string;
  amenities: string[];
  createdAt: string;
}

export interface BookingRecord {
  id: string;
  bookingCode: string;
  facilityId: string;
  facilityName: string;
  itsNumber: string;
  hofName: string;
  mobileNumber: string;
  eventType: BookingEventType;
  eventDate: string;
  startTime: string;
  endTime: string;
  durationHours: number;
  expectedGuests: number;
  totalCharges: number;
  advanceDeposit: number;
  paidAmount: number;
  balanceDue: number;
  paymentStatus: BookingPaymentStatus;
  bookingStatus: BookingStatus;
  specialRequests?: string;
  receiptNo?: string;
  bookedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookingPaymentLedgerEntry {
  id: string;
  receiptNo: string;
  bookingId: string;
  bookingCode: string;
  itsNumber: string;
  hofName: string;
  facilityName: string;
  amount: number;
  paymentType: 'ADVANCE' | 'FULL_PAYMENT' | 'SECURITY_DEPOSIT' | 'REFUND';
  paymentMode: 'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque';
  referenceNo?: string;
  date: string;
  notes?: string;
  processedBy: string;
  createdAt: string;
}

// ================= EXECUTIVE REPORTS & GENERAL RECEIPTS TYPES =================
export type ReceiptContributionCategory =
  | 'General Sadaqah / Donation'
  | 'Sabeel Contribution'
  | 'FMB Extra'
  | 'Hall Booking Advance'
  | 'Zakat'
  | 'Miscellaneous';

export type PaymentMode = 'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque';

export interface GeneralReceiptRecord {
  id: string;
  receiptNo: string;
  date: string;
  time: string;
  isGuest: boolean;
  itsNumber?: string;
  payerName: string;
  mobileNumber: string;
  mohallah?: string;
  category: ReceiptContributionCategory;
  amount: number;
  paymentMode: PaymentMode;
  referenceNumber?: string;
  remarks?: string;
  collectedBy: string;
  financialYear: FinancialYear;
  createdAt: string;
}

export type ReportType =
  | 'member-directory'
  | 'fmb-defaulters'
  | 'sabeel-status'
  | 'hall-revenue'
  | 'activity-audit';

export interface FinancialSummaryMetrics {
  totalRevenue: number;
  fmbTarget: number;
  fmbCollected: number;
  fmbOutstanding: number;
  sabeelTarget: number;
  sabeelCollected: number;
  sabeelOutstanding: number;
  hallBookingEarnings: number;
  hallBookingOutstanding: number;
  generalDonationsTotal: number;
  totalOutstanding: number;
}
