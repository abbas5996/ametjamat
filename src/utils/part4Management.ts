/**
 * Part 4 (Final Phase) Data Management Utilities & LocalStorage Synchronization
 * 
 * Authentic Community Workflow Standards for:
 * 1. COMMITTEE & TRUST MANAGEMENT
 * 2. 12 UMUR (Departmental Executive Framework)
 * 3. SPECIAL COMMUNITY MODULES (Huzurala Safar, Haj & Mazar, Appointments & Messaging)
 * 4. SYSTEM SETTINGS, ACTIVITY LOGS & SECURITY
 */

// ============================================================================
// 1. COMMITTEE & TRUST MANAGEMENT TYPES
// ============================================================================

export interface CommitteePortfolio {
  id: string;
  code: string;
  name: string;
  description: string;
  assignedMemberIts: string;
  assignedMemberName: string;
  tenure: string;
  status: 'Active' | 'Vacant';
}

export interface CommitteeMember {
  id: string;
  itsNumber: string;
  fullName: string;
  roleTitle: string; // e.g. "President / Aamil Saheb", "Honorary Secretary", "Treasurer"
  portfolioId: string;
  portfolioName: string;
  contact: string;
  email: string;
  tenureStartHijri: string;
  tenureEndHijri: string;
  status: 'Active' | 'Alumni';
}

export interface TrustOpeningBalance {
  id: string;
  hijriYear: string;
  accountName: string;
  accountType: 'Cash' | 'Bank' | 'Corpus Fund' | 'Waqf Asset';
  openingBalance: number;
  asOfDate: string;
  notes: string;
}

export interface TrustIncomeHead {
  id: string;
  code: string;
  name: string;
  category: 'Donation' | 'Endowment' | 'Rental' | 'Event' | 'Other';
  isActive: boolean;
}

export interface TrustIncomeEntry {
  id: string;
  receiptNo: string;
  headId: string;
  headName: string;
  date: string;
  amount: number;
  receivedFrom: string;
  itsNumber: string;
  paymentMode: 'Cash' | 'Cheque' | 'Bank Transfer' | 'NEFT/RTGS' | 'UPI';
  referenceNo: string;
  bankAccountId: string;
  remarks: string;
  createdBy: string;
  createdAt: string;
}

export interface TrustExpenseHead {
  id: string;
  code: string;
  name: string;
  category: 'Maintenance' | 'Administration' | 'Religious' | 'Utility' | 'Welfare';
  budgetAllocated: number;
  isActive: boolean;
}

export interface TrustExpenseEntry {
  id: string;
  voucherNo: string;
  headId: string;
  headName: string;
  date: string;
  amount: number;
  paidTo: string;
  paymentMode: 'Cash' | 'Cheque' | 'Bank Transfer' | 'NEFT/RTGS' | 'UPI';
  bankAccountId: string;
  approvedBy: string;
  invoiceRef: string;
  remarks: string;
  createdBy: string;
  createdAt: string;
}

export interface TrustAccountTransfer {
  id: string;
  transferNo: string;
  transferDate: string;
  fromAccountId: string;
  fromAccountName: string;
  toAccountId: string;
  toAccountName: string;
  amount: number;
  referenceNo: string;
  narration: string;
  createdBy: string;
  createdAt: string;
}

// ============================================================================
// 2. 12 UMUR DEPARTMENTAL EXECUTIVE FRAMEWORK TYPES
// ============================================================================

export interface UmurDepartment {
  id: string;
  orderNumber: number;
  name: string;
  arabicName: string;
  keyResponsibility: string;
  headOfficerName: string;
  headOfficerIts: string;
  headContact: string;
  allocatedBudget: number;
  spentBudget: number;
  activeProjectsCount: number;
  status: 'Exemplary' | 'On Track' | 'Review Required';
  colorTag: string;
}

export interface UmurProject {
  id: string;
  umurId: string;
  title: string;
  description: string;
  assignedLead: string;
  startDate: string;
  dueDate: string;
  budget: number;
  spent: number;
  status: 'Planning' | 'In Progress' | 'Completed' | 'On Hold';
  priority: 'High' | 'Medium' | 'Low';
  kpiMetric: string;
}

export interface CancelledVoucher {
  id: string;
  voucherNo: string;
  module: string;
  originalDate: string;
  cancelledDate: string;
  cancelledBy: string;
  amount: number;
  partyName: string;
  reason: string;
  authorizationRef: string;
  status: 'Voided';
}

// ============================================================================
// 3. SPECIAL COMMUNITY MODULES TYPES (Safar, Haj, Mazar, Appointments, Messaging)
// ============================================================================

// Huzurala Safar
export interface SafarCity {
  id: string;
  cityName: string;
  venueName: string;
  address: string;
  capacity: number;
  masoolName: string;
  masoolContact: string;
  status: 'Confirmed' | 'Inspected' | 'Planning';
}

export interface SafarEvent {
  id: string;
  cityId: string;
  cityName: string;
  title: string;
  eventType: 'Majlis' | 'Vaaz' | 'Qadambosi' | 'Ziyafat' | 'Iftetah';
  dateHijri: string;
  time: string;
  venue: string;
  maxCapacity: number;
  masoolName: string;
  status: 'Scheduled' | 'Live' | 'Concluded';
}

export interface SafarMasool {
  id: string;
  name: string;
  itsNumber: string;
  mobile: string;
  department: string; // e.g. "Security & Protocol", "Ziyafat & Kitchen", "Seating & Masalla", "Accommodation"
  cityId: string;
  cityName: string;
  assignedDuty: string;
}

export interface SafarTakhmeen {
  id: string;
  itsNumber: string;
  hofName: string;
  mohallah: string;
  mobile: string;
  pledgedAmount: number;
  paidAmount: number;
  balanceDue: number;
  status: 'Paid' | 'Partial' | 'Pending';
  lastPaymentDate?: string;
}

export interface SafarPaymentReceipt {
  id: string;
  receiptNo: string;
  takhmeenId: string;
  itsNumber: string;
  hofName: string;
  amount: number;
  date: string;
  paymentMode: 'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque';
  referenceNo: string;
  receivedBy: string;
}

export interface ZiyafatSlot {
  id: string;
  tokenNo: string;
  itsNumber: string;
  familyName: string;
  mohallah: string;
  slotDate: string;
  slotTime: string;
  type: 'Ziyafat Mubarak' | 'Qadambosi Private' | 'Sharaf Consultation';
  attendeesCount: number;
  status: 'Confirmed' | 'In Queue' | 'Completed' | 'Rescheduled';
  remarks: string;
}

// Haj & Mazar
export interface HajPilgrim {
  id: string;
  itsNumber: string;
  fullName: string;
  age: number;
  gender: 'Male' | 'Female';
  mohallah: string;
  mobile: string;
  passportNumber: string;
  visaStatus: 'Approved' | 'In Process' | 'Pending';
  maktabNo: string;
  travelBatch: string;
  packageCost: number;
  paidAmount: number;
  balanceDue: number;
  status: 'Confirmed' | 'Waitlist';
}

export interface HajExpenseHead {
  id: string;
  code: string;
  name: string;
  allocatedBudget: number;
}

export interface HajExpenseEntry {
  id: string;
  voucherNo: string;
  headId: string;
  headName: string;
  date: string;
  amount: number;
  payee: string;
  paymentMode: 'Cash' | 'Bank Transfer' | 'Forex Card';
  approvedBy: string;
  remarks: string;
}

export interface MazarRegistration {
  id: string;
  registrationNo: string;
  visitorIts: string;
  visitorName: string;
  mobile: string;
  originCity: string;
  arrivalDate: string;
  departureDate: string;
  roomNo: string;
  guestsCount: number;
  mazarContribution: number;
  status: 'Active' | 'Checked Out' | 'Advance Booked';
}

export interface MazarVisitorLog {
  id: string;
  registrationNo: string;
  visitorName: string;
  itsNumber: string;
  checkInTime: string;
  checkOutTime: string;
  issuedToken: string;
  passType: 'Day Pass' | 'Resident Room';
  status: 'In Premise' | 'Departed';
}

// Appointment System
export interface AppointmentSlot {
  id: string;
  slotDate: string;
  startTime: string;
  endTime: string;
  officialRole: 'Janab Aamil Saheb' | 'Executive Secretary' | 'Qaza Tribunal' | 'FMB Coordinator';
  capacity: number;
  bookedCount: number;
  isBlocked: boolean;
  blockReason?: string;
}

export interface AppointmentBooking {
  id: string;
  bookingCode: string;
  slotId: string;
  itsNumber: string;
  personName: string;
  mobile: string;
  officialRole: string;
  appointmentDate: string;
  appointmentTime: string;
  purposeId: string;
  purposeName: string;
  status: 'Confirmed' | 'Completed' | 'Cancelled';
  notes: string;
}

export interface AppointmentPurpose {
  id: string;
  title: string;
  description: string;
  typicalDurationMins: number;
  requiresDocuments: boolean;
  isActive: boolean;
}

// Messaging Service
export interface WhatsAppMessageTemplate {
  id: string;
  title: string;
  category: 'Dues Reminder' | 'Miqaat Announcement' | 'FMB Daily Thaali' | 'Custom Notice';
  messageBody: string;
}

export interface WhatsAppDispatchLog {
  id: string;
  recipientName: string;
  mobile: string;
  templateTitle: string;
  messagePreview: string;
  dispatchedAt: string;
  status: 'Delivered' | 'Sent' | 'Failed';
  triggeredBy: string;
}

// ============================================================================
// 4. SYSTEM SETTINGS, ACTIVITY LOGS & SECURITY TYPES
// ============================================================================

export interface JamaatBankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountType: 'Savings' | 'Current' | 'Trust Corpus' | 'Overdraft';
  ifscCode: string;
  branch: string;
  currentBalance: number;
  isActive: boolean;
}

export interface TrustWaqfMasterEntity {
  id: string;
  trustName: string;
  regNumber: string;
  regDate: string;
  status80G: 'Active' | 'Pending' | 'Exempt';
  status12A: 'Active' | 'Pending' | 'Exempt';
  chiefTrustee: string;
  panNumber: string;
  notes: string;
}

export interface CashReceiptLimitConfig {
  maxSingleReceiptCash: number;
  maxDailyFamilyCash: number;
  requirePanAbove: boolean;
  panThresholdAmount: number;
  updatedBy: string;
  updatedAt: string;
}

export interface NotificationGatewayConfig {
  whatsappGatewayUrl: string;
  whatsappApiKey: string;
  smsSenderId: string;
  smsApiKey: string;
  emailSmtpHost: string;
  emailSenderAddress: string;
  enableWhatsAppNotifications: boolean;
  enableSmsNotifications: boolean;
}

export interface JamaatProfileDetails {
  jamaatName: string;
  markazName: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  janabAmilSahebName: string;
  defaultHijriYear: string;
  taxIdNumber: string;
}

export interface ReceiptDateBlockingRule {
  blockBackdatedDays: number;
  blockFutureDatedDays: number;
  allowBackdatedRoles: string[];
  isStrictEnforced: boolean;
}

export interface BulkPhotoRecord {
  id: string;
  itsNumber: string;
  memberName: string;
  photoUrl: string;
  fileName: string;
  uploadedAt: string;
  matchStatus: 'Matched' | 'Unmatched';
}

export interface SafarAuditLog {
  id: string;
  timestamp: string;
  officerName: string;
  actionType: 'TAKHEEN_UPDATE' | 'VENUE_INSPECTION' | 'EVENT_MODIFIED' | 'PAYMENT_RECEIVED' | 'ZIYAFAT_TOKEN_ISSUED';
  details: string;
}

// ============================================================================
// INITIAL SEED DATA
// ============================================================================

const SEED_PORTFOLIOS: CommitteePortfolio[] = [
  { id: 'CPF-1', code: 'PR-AMIL', name: 'Riasat & Imamat', description: 'Supreme spiritual and executive leadership of Jamaat', assignedMemberIts: '30491024', assignedMemberName: 'Janab Amil Saheb Kinana Bhaisaheb', tenure: '1445-1448', status: 'Active' },
  { id: 'CPF-2', code: 'SEC-GEN', name: 'General Secretariat', description: 'Administration, correspondence, legal records and council protocols', assignedMemberIts: '20391823', assignedMemberName: 'Shk. Mufaddal Bhai Gulamali', tenure: '1446-1448', status: 'Active' },
  { id: 'CPF-3', code: 'FIN-TRS', name: 'Maliyah & Khazina (Treasury)', description: 'Trust finances, accounts audit, bank operations and tax compliances', assignedMemberIts: '20481920', assignedMemberName: 'Mulla Shabbir Bhai Vasi', tenure: '1446-1448', status: 'Active' },
  { id: 'CPF-4', code: 'FMB-DIR', name: 'Faizul Mawaidil Burhaniyah', description: 'Central kitchen logistics, thaali delivery, inventory and jaman coordination', assignedMemberIts: '30491112', assignedMemberName: 'Shk. Mustafa Bhai Rangwala', tenure: '1446-1448', status: 'Active' },
  { id: 'CPF-5', code: 'TLM-DIR', name: 'Taleem & Madrasa Saifiyah', description: 'Curriculum oversight, teacher management, student welfare and examinations', assignedMemberIts: '20938102', assignedMemberName: 'Mulla Taher Bhai Poonawala', tenure: '1445-1448', status: 'Active' },
  { id: 'CPF-6', code: 'MRF-DIR', name: 'Marafiq & Estate Upkeep', description: 'Masjid, Mawaid hall, guest houses and estate infrastructure', assignedMemberIts: '30192834', assignedMemberName: 'Shk. Abbas Bhai Lightwala', tenure: '1446-1448', status: 'Active' },
  { id: 'CPF-7', code: 'QRD-DIR', name: 'Qardan Hasanah Trust', description: 'Interest-free loan applications, guarantor approvals and recovery', assignedMemberIts: '20839102', assignedMemberName: 'Mulla Yusuf Bhai Batterywala', tenure: '1446-1448', status: 'Active' },
  { id: 'CPF-8', code: 'QZA-DIR', name: 'Umur Qaza & Sharia Guidance', description: 'Dispute mediation, marital reconciliations and estate documentation', assignedMemberIts: '20192837', assignedMemberName: 'Shk. Ebrahim Bhai Sanjanwala', tenure: '1446-1448', status: 'Active' },
];

const SEED_MEMBERS: CommitteeMember[] = [
  { id: 'CM-1', itsNumber: '30491024', fullName: 'Janab Amil Saheb Kinana Bhaisaheb', roleTitle: 'President / Aamil Saheb', portfolioId: 'CPF-1', portfolioName: 'Riasat & Imamat', contact: '+91 98201 52530', email: 'amil@burhanipark.org', tenureStartHijri: '1445 Hijri', tenureEndHijri: '1448 Hijri', status: 'Active' },
  { id: 'CM-2', itsNumber: '20391823', fullName: 'Shk. Mufaddal Bhai Gulamali', roleTitle: 'Honorary General Secretary', portfolioId: 'CPF-2', portfolioName: 'General Secretariat', contact: '+91 98202 11223', email: 'secretary@burhanipark.org', tenureStartHijri: '1446 Hijri', tenureEndHijri: '1448 Hijri', status: 'Active' },
  { id: 'CM-3', itsNumber: '20481920', fullName: 'Mulla Shabbir Bhai Vasi', roleTitle: 'Treasurer / Khazanchi', portfolioId: 'CPF-3', portfolioName: 'Maliyah & Khazina (Treasury)', contact: '+91 98203 44556', email: 'treasury@burhanipark.org', tenureStartHijri: '1446 Hijri', tenureEndHijri: '1448 Hijri', status: 'Active' },
  { id: 'CM-4', itsNumber: '30491112', fullName: 'Shk. Mustafa Bhai Rangwala', roleTitle: 'FMB Managing Trustee', portfolioId: 'CPF-4', portfolioName: 'Faizul Mawaidil Burhaniyah', contact: '+91 98204 77889', email: 'fmb.director@burhanipark.org', tenureStartHijri: '1446 Hijri', tenureEndHijri: '1448 Hijri', status: 'Active' },
  { id: 'CM-5', itsNumber: '20938102', fullName: 'Mulla Taher Bhai Poonawala', roleTitle: 'Taleem Convener', portfolioId: 'CPF-5', portfolioName: 'Taleem & Madrasa Saifiyah', contact: '+91 98205 99001', email: 'taleem@burhanipark.org', tenureStartHijri: '1445 Hijri', tenureEndHijri: '1448 Hijri', status: 'Active' },
  { id: 'CM-6', itsNumber: '30192834', fullName: 'Shk. Abbas Bhai Lightwala', roleTitle: 'Marafiq Head', portfolioId: 'CPF-6', portfolioName: 'Marafiq & Estate Upkeep', contact: '+91 98206 12345', email: 'marafiq@burhanipark.org', tenureStartHijri: '1446 Hijri', tenureEndHijri: '1448 Hijri', status: 'Active' },
];

const SEED_OPENING_BALANCES: TrustOpeningBalance[] = [
  { id: 'OB-1', hijriYear: '1447-1448 Hijri', accountName: 'Cash in Hand (Main Khazina)', accountType: 'Cash', openingBalance: 185000, asOfDate: '1447-01-01', notes: 'Verified physical cash vault balance' },
  { id: 'OB-2', hijriYear: '1447-1448 Hijri', accountName: 'HDFC Bank — General Jamaat A/C 9081', accountType: 'Bank', openingBalance: 4250000, asOfDate: '1447-01-01', notes: 'Audited bank certificate reconciliation' },
  { id: 'OB-3', hijriYear: '1447-1448 Hijri', accountName: 'State Bank of India — FMB Kitchen A/C 3341', accountType: 'Bank', openingBalance: 2890000, asOfDate: '1447-01-01', notes: 'Faiz dedicated kitchen reserve' },
  { id: 'OB-4', hijriYear: '1447-1448 Hijri', accountName: 'Corpus Waqf Endowment Fund', accountType: 'Corpus Fund', openingBalance: 12500000, asOfDate: '1447-01-01', notes: 'Permanent capital trust reserves' },
];

const SEED_INCOME_HEADS: TrustIncomeHead[] = [
  { id: 'TIH-1', code: 'INC-SAD', name: 'General Sadaqah & Khairat', category: 'Donation', isActive: true },
  { id: 'TIH-2', code: 'INC-WAQ', name: 'Waqf Rental Yield & Leases', category: 'Rental', isActive: true },
  { id: 'TIH-3', code: 'INC-FMB', name: 'Niyaaz / Jaman Contributions', category: 'Event', isActive: true },
  { id: 'TIH-4', code: 'INC-HLL', name: 'Mawaid & Saifee Hall Booking Charges', category: 'Rental', isActive: true },
  { id: 'TIH-5', code: 'INC-COR', name: 'Corpus Endowment Donations', category: 'Endowment', isActive: true },
];

const SEED_INCOME_ENTRIES: TrustIncomeEntry[] = [
  { id: 'TIE-1', receiptNo: 'TR-INC-1447-001', headId: 'TIH-1', headName: 'General Sadaqah & Khairat', date: '2026-10-15', amount: 50000, receivedFrom: 'Mulla Shabbir Bhai Vasi', itsNumber: '20481920', paymentMode: 'Bank Transfer', referenceNo: 'NEFT-88492019', bankAccountId: 'HDFC Bank — General Jamaat A/C 9081', remarks: 'Shukr Hadya on milestone', createdBy: 'janabadmin', createdAt: '2026-10-15T10:30:00Z' },
  { id: 'TIE-2', receiptNo: 'TR-INC-1447-002', headId: 'TIH-4', headName: 'Mawaid & Saifee Hall Booking Charges', date: '2026-10-18', amount: 35000, receivedFrom: 'Shk. Mufaddal Bhai Gulamali', itsNumber: '20391823', paymentMode: 'UPI', referenceNo: 'UPI-77391024', bankAccountId: 'HDFC Bank — General Jamaat A/C 9081', remarks: 'Majlis Darees Hall Advance', createdBy: 'janabadmin', createdAt: '2026-10-18T14:15:00Z' },
  { id: 'TIE-3', receiptNo: 'TR-INC-1447-003', headId: 'TIH-3', headName: 'Niyaaz / Jaman Contributions', date: '2026-10-22', amount: 125000, receivedFrom: 'Shk. Mustafa Bhai Rangwala', itsNumber: '30491112', paymentMode: 'Cheque', referenceNo: 'CHQ-002914', bankAccountId: 'State Bank of India — FMB Kitchen A/C 3341', remarks: 'Milad un Nabi Niyaaz Jaman sponsorship', createdBy: 'janabadmin', createdAt: '2026-10-22T11:00:00Z' },
];

const SEED_EXPENSE_HEADS: TrustExpenseHead[] = [
  { id: 'TEH-1', code: 'EXP-MAS', name: 'Masjid & Hall Electricity, Water & Utilities', category: 'Utility', budgetAllocated: 600000, isActive: true },
  { id: 'TEH-2', code: 'EXP-MRF', name: 'Estate Civil Repairs & Maintenance', category: 'Maintenance', budgetAllocated: 950000, isActive: true },
  { id: 'TEH-3', code: 'EXP-ADM', name: 'Administrative Staff Salaries & Office Supplies', category: 'Administration', budgetAllocated: 1200000, isActive: true },
  { id: 'TEH-4', code: 'EXP-REL', name: 'Miqaat & Religious Majalis Arrangements', category: 'Religious', budgetAllocated: 800000, isActive: true },
  { id: 'TEH-5', code: 'EXP-WLF', name: 'Medical & Destitute Welfare Relief', category: 'Welfare', budgetAllocated: 500000, isActive: true },
];

const SEED_EXPENSE_ENTRIES: TrustExpenseEntry[] = [
  { id: 'TEE-1', voucherNo: 'TR-EXP-1447-001', headId: 'TEH-1', headName: 'Masjid & Hall Electricity, Water & Utilities', date: '2026-10-12', amount: 48500, paidTo: 'Torrent Power Electric Utility', paymentMode: 'Bank Transfer', bankAccountId: 'HDFC Bank — General Jamaat A/C 9081', approvedBy: 'Janab Amil Saheb', invoiceRef: 'INV-TP-9921', remarks: 'Masjid complex electricity bill for Safar month', createdBy: 'janabadmin', createdAt: '2026-10-12T09:30:00Z' },
  { id: 'TEE-2', voucherNo: 'TR-EXP-1447-002', headId: 'TEH-2', headName: 'Estate Civil Repairs & Maintenance', date: '2026-10-20', amount: 32000, paidTo: 'Burhani Hardware & Sanitary', paymentMode: 'Cheque', bankAccountId: 'HDFC Bank — General Jamaat A/C 9081', approvedBy: 'Mulla Shabbir Bhai Vasi', invoiceRef: 'INV-BH-410', remarks: 'Wazu-khana pipe repair and waterproofing', createdBy: 'janabadmin', createdAt: '2026-10-20T16:00:00Z' },
];

const SEED_ACCOUNT_TRANSFERS: TrustAccountTransfer[] = [
  { id: 'TAT-1', transferNo: 'TR-XFR-1447-001', transferDate: '2026-10-16', fromAccountId: 'Cash in Hand (Main Khazina)', fromAccountName: 'Cash in Hand (Main Khazina)', toAccountId: 'HDFC Bank — General Jamaat A/C 9081', toAccountName: 'HDFC Bank — General Jamaat A/C 9081', amount: 100000, referenceNo: 'CSH-DEP-991', narration: 'Weekly cash collections deposited to bank account', createdBy: 'janabadmin', createdAt: '2026-10-16T12:00:00Z' },
];

// 12 Umur Seed Data
const SEED_UMUR_DEPARTMENTS: UmurDepartment[] = [
  { id: 'umur-diniyah', orderNumber: 1, name: 'Umur Diniyah', arabicName: 'الأمور الدينية', keyResponsibility: 'Imamat, Namaz coordination, Hifz al-Quran, Azaan, Majalis and Nikah records', headOfficerName: 'Janab Amil Saheb Kinana BS', headOfficerIts: '30491024', headContact: '+91 98201 52530', allocatedBudget: 750000, spentBudget: 280000, activeProjectsCount: 4, status: 'Exemplary', colorTag: '#059669' },
  { id: 'marafiq-burhaniyah', orderNumber: 2, name: 'Marafiq Burhaniyah', arabicName: 'المرافق البرهانية', keyResponsibility: 'Masjid infrastructure, Saifee Hall upkeep, HVAC, water safety and assets', headOfficerName: 'Shk. Abbas Bhai Lightwala', headOfficerIts: '30192834', headContact: '+91 98206 12345', allocatedBudget: 1200000, spentBudget: 540000, activeProjectsCount: 5, status: 'On Track', colorTag: '#D97706' },
  { id: 'umur-talimiyah', orderNumber: 3, name: 'Umur Talimiyah', arabicName: 'الأمور التعليمية', keyResponsibility: 'MSB Madrasa Saifiyah, higher education counseling, Quranic studies and coaching', headOfficerName: 'Mulla Taher Bhai Poonawala', headOfficerIts: '20938102', headContact: '+91 98205 99001', allocatedBudget: 900000, spentBudget: 410000, activeProjectsCount: 3, status: 'Exemplary', colorTag: '#2563EB' },
  { id: 'maliyah-iqtisadiyah', orderNumber: 4, name: 'Maliyah & Iqtisadiyah', arabicName: 'المالية والاقتصادية', keyResponsibility: 'Budget controls, audit, investment stability, economic upliftment and tax filing', headOfficerName: 'Mulla Shabbir Bhai Vasi', headOfficerIts: '20481920', headContact: '+91 98203 44556', allocatedBudget: 600000, spentBudget: 195000, activeProjectsCount: 2, status: 'Exemplary', colorTag: '#7C3AED' },
  { id: 'umur-mawarid', orderNumber: 5, name: 'Umur Mawarid Bashariyah (HR)', arabicName: 'الموارد البشرية', keyResponsibility: 'Khidmatguzaar registry, volunteer roster, Burhani Guards and Toloba allocation', headOfficerName: 'Shk. Yusuf Bhai Kapasi', headOfficerIts: '30481944', headContact: '+91 98207 44332', allocatedBudget: 400000, spentBudget: 140000, activeProjectsCount: 3, status: 'On Track', colorTag: '#0891B2' },
  { id: 'umur-dakhiliyah', orderNumber: 6, name: 'Umur Dakhiliyah', arabicName: 'الأمور الداخلية', keyResponsibility: 'Internal community welfare, senior citizen assistance, widow care and harmony', headOfficerName: 'Mulla Idris Bhai Godhrawala', headOfficerIts: '20918233', headContact: '+91 98208 55667', allocatedBudget: 650000, spentBudget: 290000, activeProjectsCount: 4, status: 'On Track', colorTag: '#EA580C' },
  { id: 'umur-kharjiyah', orderNumber: 7, name: 'Umur Kharjiyah Ijtimaeeyah', arabicName: 'الخارجية والاجتماعية', keyResponsibility: 'Civic liaison, municipality coordination, interfaith harmony and public media', headOfficerName: 'Shk. Mufaddal Bhai Gulamali', headOfficerIts: '20391823', headContact: '+91 98202 11223', allocatedBudget: 350000, spentBudget: 110000, activeProjectsCount: 2, status: 'Exemplary', colorTag: '#4F46E5' },
  { id: 'umur-qaza', orderNumber: 8, name: 'Umur Qaza', arabicName: 'أمور القضاء', keyResponsibility: 'Sharia tribunal mediation, family settlements, trade arbitration and agreements', headOfficerName: 'Shk. Ebrahim Bhai Sanjanwala', headOfficerIts: '20192837', headContact: '+91 98209 88990', allocatedBudget: 300000, spentBudget: 85000, activeProjectsCount: 2, status: 'Exemplary', colorTag: '#0D9488' },
  { id: 'niyaaz-fmb', orderNumber: 9, name: 'Niyaaz / Faizul Mawaidil Burhaniyah', arabicName: 'نياز وفيض الموائد البرهانية', keyResponsibility: 'Daily FMB thaali quality, kitchen hygiene, zero food waste and distribution', headOfficerName: 'Shk. Mustafa Bhai Rangwala', headOfficerIts: '30491112', headContact: '+91 98204 77889', allocatedBudget: 3500000, spentBudget: 1820000, activeProjectsCount: 6, status: 'Exemplary', colorTag: '#B45309' },
  { id: 'umur-tijaarat', orderNumber: 10, name: 'Umur Tijaarat', arabicName: 'أمور التجارة', keyResponsibility: 'Tijarat Rabeha, young entrepreneur incubator, trade expo and interest-free credit', headOfficerName: 'Mulla Huzeifa Bhai Clothwala', headOfficerIts: '30291834', headContact: '+91 98210 22334', allocatedBudget: 800000, spentBudget: 310000, activeProjectsCount: 3, status: 'On Track', colorTag: '#16A34A' },
  { id: 'avqaaf', orderNumber: 11, name: 'Avqaaf', arabicName: 'الأوقاف', keyResponsibility: 'Endowed properties, waqf deed registrations, land revenue yields and legal protection', headOfficerName: 'Shk. Saifuddin Bhai Vakil', headOfficerIts: '20491829', headContact: '+91 98211 44556', allocatedBudget: 500000, spentBudget: 175000, activeProjectsCount: 3, status: 'On Track', colorTag: '#9333EA' },
  { id: 'umur-seheeyah', orderNumber: 12, name: 'Umur Seheeyah', arabicName: 'الأمور الصحية', keyResponsibility: 'Saifee ambulance, medical camps, blood donation, dialysis aid and fitness drives', headOfficerName: 'Dr. Moiz Bhai Doctorwala', headOfficerIts: '30918233', headContact: '+91 98212 66778', allocatedBudget: 700000, spentBudget: 340000, activeProjectsCount: 4, status: 'Exemplary', colorTag: '#E11D48' },
];

const SEED_UMUR_PROJECTS: UmurProject[] = [
  { id: 'PRJ-101', umurId: 'umur-diniyah', title: 'Quran Hifz Sanad Preparation Intensive', description: 'Weekend hifz recitation training for 45 registered MSB and community students', assignedLead: 'Janab Amil Saheb', startDate: '2026-09-01', dueDate: '2026-12-30', budget: 120000, spent: 65000, status: 'In Progress', priority: 'High', kpiMetric: '45 students evaluated' },
  { id: 'PRJ-102', umurId: 'marafiq-burhaniyah', title: 'Saifee Masjid Sound & Acoustic Upgrade', description: 'Installation of low-latency digital signal processors and distributed line-array speakers', assignedLead: 'Shk. Abbas Bhai Lightwala', startDate: '2026-10-01', dueDate: '2026-11-15', budget: 280000, spent: 195000, status: 'In Progress', priority: 'High', kpiMetric: 'Full acoustic calibration' },
  { id: 'PRJ-103', umurId: 'umur-tijaarat', title: 'Burhani Business Expo & Networking Forum', description: 'Showcasing 60+ local mumineen businesses with interest-free funding mentorship', assignedLead: 'Mulla Huzeifa Bhai Clothwala', startDate: '2026-08-15', dueDate: '2026-11-20', budget: 250000, spent: 180000, status: 'In Progress', priority: 'Medium', kpiMetric: '60 booths booked' },
  { id: 'PRJ-104', umurId: 'umur-seheeyah', title: 'Annual Community Health & Cardiac Camp', description: 'Screening 400+ mumineen with Saifee Hospital visiting cardiologists and diabetic team', assignedLead: 'Dr. Moiz Bhai Doctorwala', startDate: '2026-10-05', dueDate: '2026-10-25', budget: 150000, spent: 142000, status: 'Completed', priority: 'High', kpiMetric: '420 mumineen screened' },
  { id: 'PRJ-105', umurId: 'niyaaz-fmb', title: 'Zero Food Waste & Biodegradable Packaging', description: 'Transitioning all auxiliary packaging to eco-friendly compostable containers', assignedLead: 'Shk. Mustafa Bhai Rangwala', startDate: '2026-09-10', dueDate: '2026-12-10', budget: 180000, spent: 90000, status: 'In Progress', priority: 'Medium', kpiMetric: '100% compliance reached' },
];

const SEED_CANCELLED_VOUCHERS: CancelledVoucher[] = [
  { id: 'CV-1', voucherNo: 'TR-EXP-1447-098', module: 'Trust Expense Entry', originalDate: '2026-10-08', cancelledDate: '2026-10-09', cancelledBy: 'janabadmin', amount: 18500, partyName: 'National Electricals', reason: 'Duplicate voucher entered in error; corrected on voucher #101', authorizationRef: 'AUTH-JANAB-992', status: 'Voided' },
  { id: 'CV-2', voucherNo: 'REC-FMB-1447-441', module: 'FMB Takhmeen Collection', originalDate: '2026-10-14', cancelledDate: '2026-10-14', cancelledBy: 'janabadmin', amount: 25000, partyName: 'Mulla Shabbir Bhai Vasi', reason: 'Incorrect payment mode selected (Cheque instead of UPI)', authorizationRef: 'AUTH-JANAB-998', status: 'Voided' },
];

// Special Community Modules Seed Data
const SEED_SAFAR_CITIES: SafarCity[] = [
  { id: 'SCT-1', cityName: 'Burhani Park (Headquarters)', venueName: 'Al-Masjid al-Burhani & Saifee Complex', address: 'Plot 4, Burhani Park Avenue', capacity: 3500, masoolName: 'Shk. Abbas Bhai Lightwala', masoolContact: '+91 98206 12345', status: 'Confirmed' },
  { id: 'SCT-2', cityName: 'Galiakot Shareef (Ziyarat Sector)', venueName: 'Mazar-e-Fakhri Guest Enclave', address: 'Galiakot, Rajasthan', capacity: 5000, masoolName: 'Shk. Mustafa Bhai Rangwala', masoolContact: '+91 98204 77889', status: 'Inspected' },
];

const SEED_SAFAR_EVENTS: SafarEvent[] = [
  { id: 'SEV-1', cityId: 'SCT-1', cityName: 'Burhani Park', title: 'Tashreef Mubarak & Istiqbaal Majlis', eventType: 'Majlis', dateHijri: '1447-04-10', time: '18:30 IST', venue: 'Al-Masjid al-Burhani Courtyard', maxCapacity: 3500, masoolName: 'Shk. Abbas Bhai Lightwala', status: 'Scheduled' },
  { id: 'SEV-2', cityId: 'SCT-1', cityName: 'Burhani Park', title: 'Qadambosi Sharaf (Phase 1 — Seniors & HOF)', eventType: 'Qadambosi', dateHijri: '1447-04-11', time: '09:00 IST', venue: 'Janab Amil Saheb Iwan', maxCapacity: 1200, masoolName: 'Janab Amil Saheb', status: 'Scheduled' },
  { id: 'SEV-3', cityId: 'SCT-1', cityName: 'Burhani Park', title: 'Aam Ziyafat Barakat Jaman', eventType: 'Ziyafat', dateHijri: '1447-04-11', time: '13:00 IST', venue: 'Saifee Mawaid Dining Hall', maxCapacity: 3000, masoolName: 'Shk. Mustafa Bhai Rangwala', status: 'Scheduled' },
];

const SEED_SAFAR_MASOOL: SafarMasool[] = [
  { id: 'SM-1', name: 'Shk. Abbas Bhai Lightwala', itsNumber: '30192834', mobile: '+91 98206 12345', department: 'Security & Protocol', cityId: 'SCT-1', cityName: 'Burhani Park', assignedDuty: 'VIP corridor, perimeter security, and escort coordination' },
  { id: 'SM-2', name: 'Shk. Mustafa Bhai Rangwala', itsNumber: '30491112', mobile: '+91 98204 77889', department: 'Ziyafat & Kitchen', cityId: 'SCT-1', cityName: 'Burhani Park', assignedDuty: 'Menu supervision, thaali service, and clean-up logistics' },
  { id: 'SM-3', name: 'Mulla Taher Bhai Poonawala', itsNumber: '20938102', mobile: '+91 98205 99001', department: 'Seating & Masalla', cityId: 'SCT-1', cityName: 'Burhani Park', assignedDuty: 'RFID entry gates, color-coded tokens and senior seating' },
];

const SEED_SAFAR_TAKHEEN: SafarTakhmeen[] = [
  { id: 'STK-1', itsNumber: '20481920', hofName: 'Mulla Shabbir Bhai Vasi', mohallah: 'Mohallah Saifee', mobile: '+91 98203 44556', pledgedAmount: 151000, paidAmount: 151000, balanceDue: 0, status: 'Paid', lastPaymentDate: '2026-10-18' },
  { id: 'STK-2', itsNumber: '20391823', hofName: 'Shk. Mufaddal Bhai Gulamali', mohallah: 'Mohallah Husaini', mobile: '+91 98202 11223', pledgedAmount: 101000, paidAmount: 75000, balanceDue: 26000, status: 'Partial', lastPaymentDate: '2026-10-20' },
  { id: 'STK-3', itsNumber: '30491112', hofName: 'Shk. Mustafa Bhai Rangwala', mohallah: 'Mohallah Burhani', mobile: '+91 98204 77889', pledgedAmount: 251000, paidAmount: 251000, balanceDue: 0, status: 'Paid', lastPaymentDate: '2026-10-12' },
  { id: 'STK-4', itsNumber: '20938102', hofName: 'Mulla Taher Bhai Poonawala', mohallah: 'Mohallah Najmi', mobile: '+91 98205 99001', pledgedAmount: 51000, paidAmount: 25000, balanceDue: 26000, status: 'Partial', lastPaymentDate: '2026-10-15' },
];

const SEED_ZIYAFAT_SLOTS: ZiyafatSlot[] = [
  { id: 'ZS-1', tokenNo: 'TKN-001', itsNumber: '20481920', familyName: 'Mulla Shabbir Bhai Vasi Family', mohallah: 'Mohallah Saifee', slotDate: '1447-04-11', slotTime: '10:00 AM', type: 'Ziyafat Mubarak', attendeesCount: 8, status: 'Confirmed', remarks: 'VIP Family Room 1' },
  { id: 'ZS-2', tokenNo: 'TKN-002', itsNumber: '30491112', familyName: 'Shk. Mustafa Bhai Rangwala Family', mohallah: 'Mohallah Burhani', slotDate: '1447-04-11', slotTime: '10:30 AM', type: 'Ziyafat Mubarak', attendeesCount: 12, status: 'Confirmed', remarks: 'VIP Family Room 2' },
  { id: 'ZS-3', tokenNo: 'TKN-003', itsNumber: '20391823', familyName: 'Shk. Mufaddal Bhai Gulamali Family', mohallah: 'Mohallah Husaini', slotDate: '1447-04-11', slotTime: '11:00 AM', type: 'Qadambosi Private', attendeesCount: 6, status: 'In Queue', remarks: 'Senior citizens included' },
];

// Haj & Mazar Seed Data
const SEED_HAJ_PILGRIMS: HajPilgrim[] = [
  { id: 'HP-1', itsNumber: '20481920', fullName: 'Mulla Shabbir Bhai Vasi', age: 54, gender: 'Male', mohallah: 'Mohallah Saifee', mobile: '+91 98203 44556', passportNumber: 'P9820192', visaStatus: 'Approved', maktabNo: 'Maktab 52-Saifiyah', travelBatch: 'Direct Medina Batch A', packageCost: 450000, paidAmount: 450000, balanceDue: 0, status: 'Confirmed' },
  { id: 'HP-2', itsNumber: '30918204', fullName: 'Amatullah Ben Vasi', age: 50, gender: 'Female', mohallah: 'Mohallah Saifee', mobile: '+91 98203 44556', passportNumber: 'P9820193', visaStatus: 'Approved', maktabNo: 'Maktab 52-Saifiyah', travelBatch: 'Direct Medina Batch A', packageCost: 450000, paidAmount: 450000, balanceDue: 0, status: 'Confirmed' },
  { id: 'HP-3', itsNumber: '20391823', fullName: 'Shk. Mufaddal Bhai Gulamali', age: 48, gender: 'Male', mohallah: 'Mohallah Husaini', mobile: '+91 98202 11223', passportNumber: 'Z1029384', visaStatus: 'In Process', maktabNo: 'Maktab 52-Saifiyah', travelBatch: 'Direct Jeddah Batch B', packageCost: 450000, paidAmount: 300000, balanceDue: 150000, status: 'Confirmed' },
];

const SEED_HAJ_EXPENSE_HEADS: HajExpenseHead[] = [
  { id: 'HEH-1', code: 'HAJ-AIR', name: 'Charter Flights & Airfare Passports', allocatedBudget: 2500000 },
  { id: 'HEH-2', code: 'HAJ-HOT', name: 'Medina & Mecca Five-Star Hotel Accommodation', allocatedBudget: 4200000 },
  { id: 'HEH-3', code: 'HAJ-TRN', name: 'Haramain High-Speed Train & Bus Logistics', allocatedBudget: 850000 },
  { id: 'HEH-4', code: 'HAJ-FMB', name: 'Mina & Arafat Special Thaali Catering', allocatedBudget: 1100000 },
];

const SEED_MAZAR_REGISTRATIONS: MazarRegistration[] = [
  { id: 'MR-1', registrationNo: 'MZR-1447-001', visitorIts: '30491024', visitorName: 'Shk. Saifuddin Bhai Jamali', mobile: '+91 98200 44332', originCity: 'Surat', arrivalDate: '2026-10-25', departureDate: '2026-10-28', roomNo: 'Room 204 (Burhani Block)', guestsCount: 4, mazarContribution: 11000, status: 'Active' },
  { id: 'MR-2', registrationNo: 'MZR-1447-002', visitorIts: '20938102', visitorName: 'Mulla Taher Bhai Poonawala', mobile: '+91 98205 99001', originCity: 'Mumbai', arrivalDate: '2026-10-26', departureDate: '2026-10-27', roomNo: 'Room 102 (Saifee Block)', guestsCount: 2, mazarContribution: 5100, status: 'Active' },
];

// Appointment System Seed Data
const SEED_APPOINTMENT_PURPOSES: AppointmentPurpose[] = [
  { id: 'AP-1', title: 'Nikah Consultation & Misaaq Formalities', description: 'Pre-marital counsel, date blessings and Misaaq registry', typicalDurationMins: 30, requiresDocuments: true, isActive: true },
  { id: 'AP-2', title: 'Raza Mubarak for New Venture / Home', description: 'Blessings for shop opening, new residence, or higher education', typicalDurationMins: 15, requiresDocuments: false, isActive: true },
  { id: 'AP-3', title: 'Safai Chitthi Clearance', description: 'Relocation transfer, dues settlement and certificate dispatch', typicalDurationMins: 20, requiresDocuments: true, isActive: true },
  { id: 'AP-4', title: 'Umur Qaza Family Mediation', description: 'Conciliation, sharia guidance and confidential resolution', typicalDurationMins: 45, requiresDocuments: true, isActive: true },
  { id: 'AP-5', title: 'Personal Shafaat & Dua Mubarak', description: 'Seeking special prayer for health recovery or distress', typicalDurationMins: 15, requiresDocuments: false, isActive: true },
];

const SEED_APPOINTMENT_SLOTS: AppointmentSlot[] = [
  { id: 'SLOT-1', slotDate: '2026-10-30', startTime: '10:00 AM', endTime: '10:30 AM', officialRole: 'Janab Aamil Saheb', capacity: 1, bookedCount: 1, isBlocked: false },
  { id: 'SLOT-2', slotDate: '2026-10-30', startTime: '10:30 AM', endTime: '11:00 AM', officialRole: 'Janab Aamil Saheb', capacity: 1, bookedCount: 0, isBlocked: false },
  { id: 'SLOT-3', slotDate: '2026-10-30', startTime: '11:00 AM', endTime: '11:30 AM', officialRole: 'Janab Aamil Saheb', capacity: 1, bookedCount: 0, isBlocked: false },
  { id: 'SLOT-4', slotDate: '2026-10-30', startTime: '04:00 PM', endTime: '04:45 PM', officialRole: 'Qaza Tribunal', capacity: 1, bookedCount: 1, isBlocked: false },
  { id: 'SLOT-5', slotDate: '2026-10-31', startTime: '10:00 AM', endTime: '12:00 PM', officialRole: 'Janab Aamil Saheb', capacity: 4, bookedCount: 0, isBlocked: true, blockReason: 'Janab Out of Station for Galiakot Miqaat' },
];

const SEED_APPOINTMENT_BOOKINGS: AppointmentBooking[] = [
  { id: 'BK-1', bookingCode: 'APT-1447-010', slotId: 'SLOT-1', itsNumber: '20481920', personName: 'Mulla Shabbir Bhai Vasi', mobile: '+91 98203 44556', officialRole: 'Janab Aamil Saheb', appointmentDate: '2026-10-30', appointmentTime: '10:00 AM', purposeId: 'AP-2', purposeName: 'Raza Mubarak for New Venture / Home', status: 'Confirmed', notes: 'Son opening medical clinic' },
  { id: 'BK-2', bookingCode: 'APT-1447-011', slotId: 'SLOT-4', itsNumber: '20391823', personName: 'Shk. Mufaddal Bhai Gulamali', mobile: '+91 98202 11223', officialRole: 'Qaza Tribunal', appointmentDate: '2026-10-30', appointmentTime: '04:00 PM', purposeId: 'AP-4', purposeName: 'Umur Qaza Family Mediation', status: 'Confirmed', notes: 'Property boundary agreement' },
];

// Messaging Service Seed Data
const SEED_WHATSAPP_TEMPLATES: WhatsAppMessageTemplate[] = [
  { id: 'TMP-1', title: 'FMB Sabeel Outstanding Due Reminder', category: 'Dues Reminder', messageBody: 'Afzal us Salam [Name], Your active balance for FMB & Sabeel 1447-1448 is Rs [Amount]. Kindly remit online or at counter before [Date]. Shukran.' },
  { id: 'TMP-2', title: 'Miqaat Majlis Timings Announcement', category: 'Miqaat Announcement', messageBody: 'Afzal us Salam, Mumineen are cordially invited for [EventName] on [Date] at [Time] in Al-Masjid al-Burhani. Niyaz Jaman will follow.' },
  { id: 'TMP-3', title: 'Daily FMB Thaali Dispatch Confirmation', category: 'FMB Daily Thaali', messageBody: 'Baad Afzal us Salam, Today\'s Thaali menu is [Menu]. Delivery boy [BoyName] has departed on your route. Thaali No: [ThaaliNo].' },
  { id: 'TMP-4', title: 'Appointment Confirmation Alert', category: 'Custom Notice', messageBody: 'Your appointment with [Official] is confirmed for [Date] at [Time]. Please carry your original ITS Card.' },
];

const SEED_WHATSAPP_LOGS: WhatsAppDispatchLog[] = [
  { id: 'WLOG-1', recipientName: 'Mulla Shabbir Bhai Vasi', mobile: '+91 98203 44556', templateTitle: 'Appointment Confirmation Alert', messagePreview: 'Your appointment with Janab Aamil Saheb is confirmed for 2026-10-30 at 10:00 AM.', dispatchedAt: '2026-10-27 18:30', status: 'Delivered', triggeredBy: 'janabadmin' },
  { id: 'WLOG-2', recipientName: 'Shk. Mufaddal Bhai Gulamali', mobile: '+91 98202 11223', templateTitle: 'FMB Sabeel Outstanding Due Reminder', messagePreview: 'Afzal us Salam, Your active balance for FMB & Sabeel is Rs 26000. Kindly remit before end of month.', dispatchedAt: '2026-10-26 11:15', status: 'Delivered', triggeredBy: 'janabadmin' },
];

// System Settings Seed Data
const SEED_BANK_ACCOUNTS: JamaatBankAccount[] = [
  { id: 'BA-1', bankName: 'HDFC Bank Ltd', accountNumber: '50200049281920', accountType: 'Current', ifscCode: 'HDFC0001024', branch: 'Burhani Park Main Branch', currentBalance: 4250000, isActive: true },
  { id: 'BA-2', bankName: 'State Bank of India', accountNumber: '33418290123', accountType: 'Current', ifscCode: 'SBIN0004210', branch: 'City Commercial Branch', currentBalance: 2890000, isActive: true },
  { id: 'BA-3', bankName: 'Bank of Baroda', accountNumber: '08120200004918', accountType: 'Savings', ifscCode: 'BARB0BURHAN', branch: 'Saifee Mohallah Extension', currentBalance: 980000, isActive: true },
];

const SEED_TRUST_WAQF_MASTER: TrustWaqfMasterEntity[] = [
  { id: 'TWM-1', trustName: 'Anjuman-e-Saifee (Burhani Park Trust)', regNumber: 'BPT-MAH-1982/104', regDate: '1982-04-14', status80G: 'Active', status12A: 'Active', chiefTrustee: 'Janab Amil Saheb Kinana Bhaisaheb', panNumber: 'AAATA5253M', notes: 'Principal legal religious & charitable trust entity' },
  { id: 'TWM-2', trustName: 'Faizul Mawaidil Burhaniyah Kitchen Waqf', regNumber: 'WQF-FMB-2012/551', regDate: '2012-11-20', status80G: 'Active', status12A: 'Active', chiefTrustee: 'Shk. Mustafa Bhai Rangwala', panNumber: 'AAATF1112K', notes: 'Dedicated culinary endowment for community nutrition' },
  { id: 'TWM-3', trustName: 'Saifee Qardan Hasanah Trust Fund', regNumber: 'QHT-REG-2005/332', regDate: '2005-08-10', status80G: 'Exempt', status12A: 'Active', chiefTrustee: 'Mulla Yusuf Bhai Batterywala', panNumber: 'AAATQ2005Q', notes: 'Interest-free microcredit welfare fund' },
];

const SEED_CASH_LIMITS: CashReceiptLimitConfig = {
  maxSingleReceiptCash: 50000,
  maxDailyFamilyCash: 100000,
  requirePanAbove: true,
  panThresholdAmount: 50000,
  updatedBy: 'janabadmin',
  updatedAt: '2026-10-01T00:00:00Z',
};

const SEED_NOTIFICATION_CONFIG: NotificationGatewayConfig = {
  whatsappGatewayUrl: 'https://api.wati.io/v1/burhanipark',
  whatsappApiKey: 'wati_live_sec_5253_burhanipark_token',
  smsSenderId: 'JAMATB',
  smsApiKey: 'sms_live_key_992014',
  emailSmtpHost: 'smtp.gmail.com:587',
  emailSenderAddress: 'erp.notifications@burhanipark.org',
  enableWhatsAppNotifications: true,
  enableSmsNotifications: true,
};

const SEED_JAMAAT_PROFILE: JamaatProfileDetails = {
  jamaatName: 'Anjuman-e-Saifee (Burhani Park Jamaat)',
  markazName: 'Al-Markaz al-Burhani',
  address: 'Complex Plot No. 4, Saifee Road, Opp. Al-Masjid al-Burhani',
  city: 'Burhani Park',
  state: 'Maharashtra',
  pincode: '400010',
  phone: '+91 22 2345 5253',
  email: 'office@burhanipark.org',
  janabAmilSahebName: 'Janab Amil Saheb Kinana Bhaisaheb (TUS)',
  defaultHijriYear: '1447-1448 Hijri',
  taxIdNumber: 'AAATA5253M',
};

const SEED_RECEIPT_DATE_BLOCKING: ReceiptDateBlockingRule = {
  blockBackdatedDays: 14,
  blockFutureDatedDays: 0,
  allowBackdatedRoles: ['Super Admin'],
  isStrictEnforced: true,
};

const SEED_SAFAR_AUDIT_LOGS: SafarAuditLog[] = [
  { id: 'SAL-1', timestamp: '2026-10-26 14:20:00', officerName: 'janabadmin', actionType: 'VENUE_INSPECTION', details: 'Marked Al-Masjid al-Burhani venue as Confirmed after fire safety and audio audit.' },
  { id: 'SAL-2', timestamp: '2026-10-24 16:45:00', officerName: 'janabadmin', actionType: 'TAKHEEN_UPDATE', details: 'Added 4 new HOF pledges for Huzurala Safar Mubarak Fund.' },
  { id: 'SAL-3', timestamp: '2026-10-22 10:30:00', officerName: 'janabadmin', actionType: 'ZIYAFAT_TOKEN_ISSUED', details: 'Generated Ziyafat Mubarak token TKN-001 for Mulla Shabbir Bhai Vasi.' },
];

// ============================================================================
// LOCAL STORAGE KEYS & REPOSITORIES
// ============================================================================

const KEYS = {
  COMMITTEE_PORTFOLIOS: 'bp_part4_committee_portfolios',
  COMMITTEE_MEMBERS: 'bp_part4_committee_members',
  OPENING_BALANCES: 'bp_part4_opening_balances',
  INCOME_HEADS: 'bp_part4_income_heads',
  INCOME_ENTRIES: 'bp_part4_income_entries',
  EXPENSE_HEADS: 'bp_part4_expense_heads',
  EXPENSE_ENTRIES: 'bp_part4_expense_entries',
  ACCOUNT_TRANSFERS: 'bp_part4_account_transfers',
  UMUR_DEPARTMENTS: 'bp_part4_umur_departments',
  UMUR_PROJECTS: 'bp_part4_umur_projects',
  CANCELLED_VOUCHERS: 'bp_part4_cancelled_vouchers',
  SAFAR_CITIES: 'bp_part4_safar_cities',
  SAFAR_EVENTS: 'bp_part4_safar_events',
  SAFAR_MASOOL: 'bp_part4_safar_masool',
  SAFAR_TAKHEEN: 'bp_part4_safar_takhmeen',
  ZIYAFAT_SLOTS: 'bp_part4_ziyafat_slots',
  HAJ_PILGRIMS: 'bp_part4_haj_pilgrims',
  HAJ_EXPENSE_HEADS: 'bp_part4_haj_expense_heads',
  HAJ_EXPENSE_ENTRIES: 'bp_part4_haj_expense_entries',
  MAZAR_REGISTRATIONS: 'bp_part4_mazar_registrations',
  APPOINTMENT_PURPOSES: 'bp_part4_appointment_purposes',
  APPOINTMENT_SLOTS: 'bp_part4_appointment_slots',
  APPOINTMENT_BOOKINGS: 'bp_part4_appointment_bookings',
  WHATSAPP_TEMPLATES: 'bp_part4_whatsapp_templates',
  WHATSAPP_LOGS: 'bp_part4_whatsapp_logs',
  BANK_ACCOUNTS: 'bp_part4_bank_accounts',
  TRUST_WAQF_MASTER: 'bp_part4_trust_waqf_master',
  CASH_LIMITS: 'bp_part4_cash_limits',
  NOTIFICATION_CONFIG: 'bp_part4_notification_config',
  JAMAAT_PROFILE: 'bp_part4_jamaat_profile',
  RECEIPT_DATE_BLOCKING: 'bp_part4_receipt_date_blocking',
  SAFAR_AUDIT_LOGS: 'bp_part4_safar_audit_logs',
  DELETE_RECEIPT_PERMISSIONS: 'bp_part4_delete_receipt_permissions',
};

function getOrInit<T>(key: string, seed: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw);
  } catch {
    return seed;
  }
}

function save<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Error saving to localStorage key "${key}":`, err);
  }
}

// ============================================================================
// 1. COMMITTEE & TRUST REPOSITORIES
// ============================================================================

export function getCommitteePortfolios(): CommitteePortfolio[] {
  return getOrInit(KEYS.COMMITTEE_PORTFOLIOS, SEED_PORTFOLIOS);
}
export function saveCommitteePortfolios(items: CommitteePortfolio[]): void {
  save(KEYS.COMMITTEE_PORTFOLIOS, items);
}

export function getCommitteeMembers(): CommitteeMember[] {
  return getOrInit(KEYS.COMMITTEE_MEMBERS, SEED_MEMBERS);
}
export function saveCommitteeMembers(items: CommitteeMember[]): void {
  save(KEYS.COMMITTEE_MEMBERS, items);
}

export function getTrustOpeningBalances(): TrustOpeningBalance[] {
  return getOrInit(KEYS.OPENING_BALANCES, SEED_OPENING_BALANCES);
}
export function saveTrustOpeningBalances(items: TrustOpeningBalance[]): void {
  save(KEYS.OPENING_BALANCES, items);
}

export function getTrustIncomeHeads(): TrustIncomeHead[] {
  return getOrInit(KEYS.INCOME_HEADS, SEED_INCOME_HEADS);
}
export function saveTrustIncomeHeads(items: TrustIncomeHead[]): void {
  save(KEYS.INCOME_HEADS, items);
}

export function getTrustIncomeEntries(): TrustIncomeEntry[] {
  return getOrInit(KEYS.INCOME_ENTRIES, SEED_INCOME_ENTRIES);
}
export function saveTrustIncomeEntries(items: TrustIncomeEntry[]): void {
  save(KEYS.INCOME_ENTRIES, items);
}

export function getTrustExpenseHeads(): TrustExpenseHead[] {
  return getOrInit(KEYS.EXPENSE_HEADS, SEED_EXPENSE_HEADS);
}
export function saveTrustExpenseHeads(items: TrustExpenseHead[]): void {
  save(KEYS.EXPENSE_HEADS, items);
}

export function getTrustExpenseEntries(): TrustExpenseEntry[] {
  return getOrInit(KEYS.EXPENSE_ENTRIES, SEED_EXPENSE_ENTRIES);
}
export function saveTrustExpenseEntries(items: TrustExpenseEntry[]): void {
  save(KEYS.EXPENSE_ENTRIES, items);
}

export function getTrustAccountTransfers(): TrustAccountTransfer[] {
  return getOrInit(KEYS.ACCOUNT_TRANSFERS, SEED_ACCOUNT_TRANSFERS);
}
export function saveTrustAccountTransfers(items: TrustAccountTransfer[]): void {
  save(KEYS.ACCOUNT_TRANSFERS, items);
}

// ============================================================================
// 2. 12 UMUR REPOSITORIES
// ============================================================================

export function getUmurDepartments(): UmurDepartment[] {
  return getOrInit(KEYS.UMUR_DEPARTMENTS, SEED_UMUR_DEPARTMENTS);
}
export function saveUmurDepartments(items: UmurDepartment[]): void {
  save(KEYS.UMUR_DEPARTMENTS, items);
}

export function getUmurProjects(): UmurProject[] {
  return getOrInit(KEYS.UMUR_PROJECTS, SEED_UMUR_PROJECTS);
}
export function saveUmurProjects(items: UmurProject[]): void {
  save(KEYS.UMUR_PROJECTS, items);
}

export function getCancelledVouchers(): CancelledVoucher[] {
  return getOrInit(KEYS.CANCELLED_VOUCHERS, SEED_CANCELLED_VOUCHERS);
}
export function saveCancelledVouchers(items: CancelledVoucher[]): void {
  save(KEYS.CANCELLED_VOUCHERS, items);
}

// ============================================================================
// 3. SPECIAL COMMUNITY REPOSITORIES (Safar, Haj, Mazar, Appointments, Messaging)
// ============================================================================

export function getSafarCities(): SafarCity[] {
  return getOrInit(KEYS.SAFAR_CITIES, SEED_SAFAR_CITIES);
}
export function saveSafarCities(items: SafarCity[]): void {
  save(KEYS.SAFAR_CITIES, items);
}

export function getSafarEvents(): SafarEvent[] {
  return getOrInit(KEYS.SAFAR_EVENTS, SEED_SAFAR_EVENTS);
}
export function saveSafarEvents(items: SafarEvent[]): void {
  save(KEYS.SAFAR_EVENTS, items);
}

export function getSafarMasool(): SafarMasool[] {
  return getOrInit(KEYS.SAFAR_MASOOL, SEED_SAFAR_MASOOL);
}
export function saveSafarMasool(items: SafarMasool[]): void {
  save(KEYS.SAFAR_MASOOL, items);
}

export function getSafarTakhmeen(): SafarTakhmeen[] {
  return getOrInit(KEYS.SAFAR_TAKHEEN, SEED_SAFAR_TAKHEEN);
}
export function saveSafarTakhmeen(items: SafarTakhmeen[]): void {
  save(KEYS.SAFAR_TAKHEEN, items);
}

export function getZiyafatSlots(): ZiyafatSlot[] {
  return getOrInit(KEYS.ZIYAFAT_SLOTS, SEED_ZIYAFAT_SLOTS);
}
export function saveZiyafatSlots(items: ZiyafatSlot[]): void {
  save(KEYS.ZIYAFAT_SLOTS, items);
}

export function getHajPilgrims(): HajPilgrim[] {
  return getOrInit(KEYS.HAJ_PILGRIMS, SEED_HAJ_PILGRIMS);
}
export function saveHajPilgrims(items: HajPilgrim[]): void {
  save(KEYS.HAJ_PILGRIMS, items);
}

export function getHajExpenseHeads(): HajExpenseHead[] {
  return getOrInit(KEYS.HAJ_EXPENSE_HEADS, SEED_HAJ_EXPENSE_HEADS);
}
export function saveHajExpenseHeads(items: HajExpenseHead[]): void {
  save(KEYS.HAJ_EXPENSE_HEADS, items);
}

export function getHajExpenseEntries(): HajExpenseEntry[] {
  return getOrInit(KEYS.HAJ_EXPENSE_ENTRIES, []);
}
export function saveHajExpenseEntries(items: HajExpenseEntry[]): void {
  save(KEYS.HAJ_EXPENSE_ENTRIES, items);
}

export function getMazarRegistrations(): MazarRegistration[] {
  return getOrInit(KEYS.MAZAR_REGISTRATIONS, SEED_MAZAR_REGISTRATIONS);
}
export function saveMazarRegistrations(items: MazarRegistration[]): void {
  save(KEYS.MAZAR_REGISTRATIONS, items);
}

export function getAppointmentPurposes(): AppointmentPurpose[] {
  return getOrInit(KEYS.APPOINTMENT_PURPOSES, SEED_APPOINTMENT_PURPOSES);
}
export function saveAppointmentPurposes(items: AppointmentPurpose[]): void {
  save(KEYS.APPOINTMENT_PURPOSES, items);
}

export function getAppointmentSlots(): AppointmentSlot[] {
  return getOrInit(KEYS.APPOINTMENT_SLOTS, SEED_APPOINTMENT_SLOTS);
}
export function saveAppointmentSlots(items: AppointmentSlot[]): void {
  save(KEYS.APPOINTMENT_SLOTS, items);
}

export function getAppointmentBookings(): AppointmentBooking[] {
  return getOrInit(KEYS.APPOINTMENT_BOOKINGS, SEED_APPOINTMENT_BOOKINGS);
}
export function saveAppointmentBookings(items: AppointmentBooking[]): void {
  save(KEYS.APPOINTMENT_BOOKINGS, items);
}

export function getWhatsAppTemplates(): WhatsAppMessageTemplate[] {
  return getOrInit(KEYS.WHATSAPP_TEMPLATES, SEED_WHATSAPP_TEMPLATES);
}
export function saveWhatsAppTemplates(items: WhatsAppMessageTemplate[]): void {
  save(KEYS.WHATSAPP_TEMPLATES, items);
}

export function getWhatsAppLogs(): WhatsAppDispatchLog[] {
  return getOrInit(KEYS.WHATSAPP_LOGS, SEED_WHATSAPP_LOGS);
}
export function saveWhatsAppLogs(items: WhatsAppDispatchLog[]): void {
  save(KEYS.WHATSAPP_LOGS, items);
}

// ============================================================================
// 4. SYSTEM SETTINGS & AUDIT LOGS REPOSITORIES
// ============================================================================

export function getJamaatBankAccounts(): JamaatBankAccount[] {
  return getOrInit(KEYS.BANK_ACCOUNTS, SEED_BANK_ACCOUNTS);
}
export function saveJamaatBankAccounts(items: JamaatBankAccount[]): void {
  save(KEYS.BANK_ACCOUNTS, items);
}

export function getTrustWaqfMaster(): TrustWaqfMasterEntity[] {
  return getOrInit(KEYS.TRUST_WAQF_MASTER, SEED_TRUST_WAQF_MASTER);
}
export function saveTrustWaqfMaster(items: TrustWaqfMasterEntity[]): void {
  save(KEYS.TRUST_WAQF_MASTER, items);
}

export function getCashReceiptLimits(): CashReceiptLimitConfig {
  return getOrInit(KEYS.CASH_LIMITS, SEED_CASH_LIMITS);
}
export function saveCashReceiptLimits(config: CashReceiptLimitConfig): void {
  save(KEYS.CASH_LIMITS, config);
}

export function getNotificationGatewayConfig(): NotificationGatewayConfig {
  return getOrInit(KEYS.NOTIFICATION_CONFIG, SEED_NOTIFICATION_CONFIG);
}
export function saveNotificationGatewayConfig(config: NotificationGatewayConfig): void {
  save(KEYS.NOTIFICATION_CONFIG, config);
}

export function getJamaatProfile(): JamaatProfileDetails {
  return getOrInit(KEYS.JAMAAT_PROFILE, SEED_JAMAAT_PROFILE);
}
export function saveJamaatProfile(details: JamaatProfileDetails): void {
  save(KEYS.JAMAAT_PROFILE, details);
}

export function getReceiptDateBlocking(): ReceiptDateBlockingRule {
  return getOrInit(KEYS.RECEIPT_DATE_BLOCKING, SEED_RECEIPT_DATE_BLOCKING);
}
export function saveReceiptDateBlocking(rule: ReceiptDateBlockingRule): void {
  save(KEYS.RECEIPT_DATE_BLOCKING, rule);
}

export function getSafarAuditLogs(): SafarAuditLog[] {
  return getOrInit(KEYS.SAFAR_AUDIT_LOGS, SEED_SAFAR_AUDIT_LOGS);
}
export function appendSafarAuditLog(officerName: string, actionType: SafarAuditLog['actionType'], details: string): void {
  const logs = getSafarAuditLogs();
  const newLog: SafarAuditLog = {
    id: `SAL-${Date.now()}`,
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    officerName,
    actionType,
    details,
  };
  logs.unshift(newLog);
  save(KEYS.SAFAR_AUDIT_LOGS, logs);
}

export interface DeleteReceiptPermissionOfficer {
  username: string;
  fullName: string;
  role: string;
  canDeleteReceipts: boolean;
  requiresDualApproval: boolean;
  approvedBy: string;
  updatedAt: string;
}

export function getDeleteReceiptPermissions(): DeleteReceiptPermissionOfficer[] {
  const seed: DeleteReceiptPermissionOfficer[] = [
    { username: 'janabadmin', fullName: 'Janab Amil Saheb', role: 'Super Admin', canDeleteReceipts: true, requiresDualApproval: false, approvedBy: 'Root', updatedAt: '2026-10-01' },
    { username: 'shabbirvasi', fullName: 'Mulla Shabbir Bhai Vasi', role: 'Treasurer', canDeleteReceipts: true, requiresDualApproval: true, approvedBy: 'Janab Amil Saheb', updatedAt: '2026-10-10' },
  ];
  return getOrInit(KEYS.DELETE_RECEIPT_PERMISSIONS, seed);
}

export function saveDeleteReceiptPermissions(items: DeleteReceiptPermissionOfficer[]): void {
  save(KEYS.DELETE_RECEIPT_PERMISSIONS, items);
}

// Authentication & Root Password management
export function getJanabRootPassword(): string {
  return localStorage.getItem('janab_root_pwd') || 'jamat#5253';
}

export function setJanabRootPassword(newPwd: string): void {
  localStorage.setItem('janab_root_pwd', newPwd);
}
