/**
 * Community Schemes Data Models, Persistence & Domain Helpers
 * Supports:
 * 1. Taher Scheme (Opening Balance, Make Receipt, Ledger & Datewise, Cancelled Receipts)
 * 2. Mohammedi Scheme (Opening Balance, Make Receipt, Ledger & Datewise, Cancelled Receipts)
 * 3. Husain Scheme (Dashboard, Datewise Report, Requests, Ledger, Withdrawals, Maturing, Cancelled, Hide Account)
 */

import { OfficialReceiptData } from '../components/faiz-hub/FaizOfficialPrintReceipt';
import { numberToWordsIndian } from './fmbPart2Data';
import { getStoredHofs } from './memberMaster';
import { getStoredSabeelLedger } from './sabeelManagement';

export type PrimarySchemeName = 'Taher Scheme' | 'Mohammedi Scheme';
export type CommunitySchemeTabKey = PrimarySchemeName | 'Husain Scheme' | 'Other Schemes';

export type OpeningBalanceType = 'Cash' | 'Bank';
export type SchemeReceiptMode = 'Cash' | 'Cheque' | 'Online';

export interface SchemeOpeningBalance {
  id: string;
  schemeName: PrimarySchemeName;
  openingDate: string; // YYYY-MM-DD
  openingBalance: number;
  type: OpeningBalanceType;
  accountLabel: string;
  remarks?: string;
  financialYear: string;
  createdBy: string;
  createdAt: string;
}

export interface SchemeLedgerReceipt {
  id: string;
  receiptNo: string;
  schemeName: PrimarySchemeName;
  itsNumber: string;
  sabeelNo: string;
  memberName: string;
  mohallahName: string;
  address: string;
  amount: number;
  amountInWords: string;
  paymentMode: SchemeReceiptMode;
  chequeNo?: string;
  chequeDate?: string;
  bankName?: string;
  transactionRef?: string;
  date: string; // YYYY-MM-DD
  financialYear: string;
  collectedBy: string;
  notes?: string;
  isCancelled: boolean;
  cancelledAt?: string;
  cancelledBy?: string;
  cancellationReason?: string;
}

// ============================================================================
// HUSAIN SCHEME TYPES
// ============================================================================

export type HusainContributionStatus =
  | 'Active'
  | 'Maturing Soon'
  | 'Matured'
  | 'Refund Pending'
  | 'Withdrawn'
  | 'Renewed';

export interface HusainContribution {
  id: string;
  receiptNo: string;
  itsNumber: string;
  sabeelNo: string;
  memberName: string;
  mohallahName: string;
  address: string;
  contributionDate: string; // YYYY-MM-DD
  maturityDate: string; // YYYY-MM-DD
  tenureMonths: number;
  amount: number;
  amountInWords: string;
  paymentMode: SchemeReceiptMode;
  chequeNo?: string;
  chequeDate?: string;
  bankName?: string;
  transactionRef?: string;
  status: HusainContributionStatus;
  notes?: string;
  collectedBy: string;
  financialYear: string;
  isCancelled: boolean;
  cancelledAt?: string;
  cancelledBy?: string;
  cancellationReason?: string;
}

export type HusainRequestType =
  | 'Enrollment'
  | 'Contribution'
  | 'Refund / Withdrawal'
  | 'Maturity Renewal'
  | 'Account Update';

export type HusainRequestStatus = 'Pending' | 'Approved' | 'Rejected' | 'Completed';

export interface HusainSchemeRequest {
  id: string;
  requestNo: string;
  itsNumber: string;
  sabeelNo: string;
  memberName: string;
  mohallahName: string;
  requestType: HusainRequestType;
  requestedAmount: number;
  requestDate: string;
  status: HusainRequestStatus;
  remarks: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export type HusainWithdrawalStatus =
  | 'Pending Refund'
  | 'Partially Refunded'
  | 'Completed'
  | 'On Hold';

export interface HusainWithdrawal {
  id: string;
  voucherNo: string;
  contributionId: string;
  receiptNo: string;
  itsNumber: string;
  sabeelNo: string;
  memberName: string;
  mohallahName: string;
  contributionAmount: number;
  withdrawalAmount: number;
  pendingRefundAmount: number;
  requestDate: string;
  processedDate?: string;
  payoutMode: SchemeReceiptMode;
  payoutRef?: string;
  status: HusainWithdrawalStatus;
  remarks?: string;
  processedBy?: string;
}

export interface HusainHideAccountSettings {
  hideAccountEnabled: boolean;
  maskMemberBalances: boolean;
  hiddenItsNumbers: string[];
  updatedAt: string;
  updatedBy: string;
}

export interface MemberDirectoryRecord {
  itsNumber: string;
  sabeelNo: string;
  fullName: string;
  mohallahName: string;
  address: string;
  mobileNumber: string;
}

// ============================================================================
// DATE & FORMATTING HELPERS
// ============================================================================

export const getTodayIso = (): string => new Date().toISOString().split('T')[0];

export const offsetIsoDate = (daysFromToday: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + daysFromToday);
  return d.toISOString().split('T')[0];
};

export const getDaysUntil = (targetIsoDate: string): number => {
  if (!targetIsoDate) return 9999;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${targetIsoDate}T00:00:00`);
  if (isNaN(target.getTime())) return 9999;
  const diffMs = target.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
};

export const formatDisplayDate = (isoDate: string): string => {
  if (!isoDate) return '—';
  const parsed = new Date(`${isoDate}T00:00:00`);
  if (isNaN(parsed.getTime())) return isoDate;
  return parsed.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const fmtINR = (n: number): string => `₹${(Number(n) || 0).toLocaleString('en-IN')}`;

// ============================================================================
// STORAGE KEYS
// ============================================================================

const OPENING_BALANCES_KEY = 'jamat_scheme_opening_balances_v2';
const PRIMARY_RECEIPTS_KEY = 'jamat_primary_scheme_receipts_v2';
const HUSAIN_CONTRIBUTIONS_KEY = 'jamat_husain_contributions_v2';
const HUSAIN_REQUESTS_KEY = 'jamat_husain_requests_v2';
const HUSAIN_WITHDRAWALS_KEY = 'jamat_husain_withdrawals_v2';
const HUSAIN_HIDE_SETTINGS_KEY = 'jamat_husain_hide_settings_v2';
const HUSAIN_ENROLLED_ITS_KEY = 'jamat_husain_enrolled_its_v2';

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Failed to persist ${key}:`, err);
  }
}

// ============================================================================
// SEED DATA: TAHER & MOHAMMEDI OPENING BALANCES AND RECEIPTS
// ============================================================================

export const INITIAL_OPENING_BALANCES: SchemeOpeningBalance[] = [
  {
    id: 'ob-ts-1',
    schemeName: 'Taher Scheme',
    openingDate: '2026-04-01',
    openingBalance: 145000,
    type: 'Bank',
    accountLabel: 'SBI Burhani Park — Taher Welfare A/c',
    remarks: 'Brought forward from FY 1446-1447H bank balance',
    financialYear: '1447-1448 Hijri',
    createdBy: 'janabadmin',
    createdAt: '2026-04-01',
  },
  {
    id: 'ob-ts-2',
    schemeName: 'Taher Scheme',
    openingDate: '2026-04-01',
    openingBalance: 32500,
    type: 'Cash',
    accountLabel: 'Jamaat Office Vault — Taher Cash',
    remarks: 'Counter cash float carried forward',
    financialYear: '1447-1448 Hijri',
    createdBy: 'janabadmin',
    createdAt: '2026-04-01',
  },
  {
    id: 'ob-ms-1',
    schemeName: 'Mohammedi Scheme',
    openingDate: '2026-04-01',
    openingBalance: 280000,
    type: 'Bank',
    accountLabel: 'HDFC Vatwa — Mohammedi Corpus A/c',
    remarks: 'Audited closing balance brought forward',
    financialYear: '1447-1448 Hijri',
    createdBy: 'janabadmin',
    createdAt: '2026-04-01',
  },
  {
    id: 'ob-ms-2',
    schemeName: 'Mohammedi Scheme',
    openingDate: '2026-04-01',
    openingBalance: 24000,
    type: 'Cash',
    accountLabel: 'Jamaat Office Vault — Mohammedi Cash',
    remarks: 'Petty counter cash opening',
    financialYear: '1447-1448 Hijri',
    createdBy: 'janabadmin',
    createdAt: '2026-04-01',
  },
];

export const INITIAL_PRIMARY_RECEIPTS: SchemeLedgerReceipt[] = [
  {
    id: 'prec-101',
    receiptNo: 'TS-2026-101',
    schemeName: 'Taher Scheme',
    itsNumber: '30489122',
    sabeelNo: 'SB-042',
    memberName: 'Mulla Shabbir Bhai Fakhri',
    mohallahName: 'Burhani Mohallah (Sector B)',
    address: 'Flat 402, Al-Burhani Heights, Sector B, Burhani Park',
    amount: 15000,
    amountInWords: numberToWordsIndian(15000),
    paymentMode: 'Online',
    transactionRef: 'NEFT/HDFC/8849201',
    date: offsetIsoDate(-25),
    financialYear: '1447-1448 Hijri',
    collectedBy: 'janabadmin',
    notes: 'Taher Scheme medical & taleem quarterly installment',
    isCancelled: false,
  },
  {
    id: 'prec-102',
    receiptNo: 'TS-2026-102',
    schemeName: 'Taher Scheme',
    itsNumber: '20391823',
    sabeelNo: 'SB-118',
    memberName: 'Sheikh Huzefa Bhai Jamali',
    mohallahName: 'Saifee Mohallah (Sector A)',
    address: 'Villa 12, Saifee Enclave, Sector A, Burhani Park',
    amount: 12000,
    amountInWords: numberToWordsIndian(12000),
    paymentMode: 'Cash',
    date: offsetIsoDate(-12),
    financialYear: '1447-1448 Hijri',
    collectedBy: 'taherfmb',
    notes: 'Annual Taher welfare standard contribution',
    isCancelled: false,
  },
  {
    id: 'prec-103',
    receiptNo: 'TS-2026-103',
    schemeName: 'Taher Scheme',
    itsNumber: '30491024',
    sabeelNo: 'SB-089',
    memberName: 'Mulla Taher Bhai Vajihi',
    mohallahName: 'Badri Mohallah (Sector C)',
    address: 'B-303, Badri Complex, Sector C, Burhani Park',
    amount: 25000,
    amountInWords: numberToWordsIndian(25000),
    paymentMode: 'Cheque',
    chequeNo: '490218',
    chequeDate: offsetIsoDate(-8),
    bankName: 'State Bank of India',
    transactionRef: 'CHQ#490218',
    date: offsetIsoDate(-7),
    financialYear: '1447-1448 Hijri',
    collectedBy: 'janabadmin',
    notes: 'Taher Prime Tier full settlement',
    isCancelled: false,
  },
  {
    id: 'prec-104',
    receiptNo: 'TS-2026-104',
    schemeName: 'Taher Scheme',
    itsNumber: '20381044',
    sabeelNo: 'SB-204',
    memberName: 'Mulla Abbas Bhai Rajkotwala',
    mohallahName: 'Najmi Mohallah (Sector D)',
    address: 'Tower A - 501, Najmi Residency, Sector D, Burhani Park',
    amount: 5000,
    amountInWords: numberToWordsIndian(5000),
    paymentMode: 'Cash',
    date: offsetIsoDate(-18),
    financialYear: '1447-1448 Hijri',
    collectedBy: 'huzefasabeel',
    notes: 'Counter receipt',
    isCancelled: true,
    cancelledAt: offsetIsoDate(-17),
    cancelledBy: 'janabadmin',
    cancellationReason: 'Entered under Taher Scheme instead of Mohammedi Scheme',
  },
  {
    id: 'prec-201',
    receiptNo: 'MS-2026-201',
    schemeName: 'Mohammedi Scheme',
    itsNumber: '20381044',
    sabeelNo: 'SB-204',
    memberName: 'Mulla Abbas Bhai Rajkotwala',
    mohallahName: 'Najmi Mohallah (Sector D)',
    address: 'Tower A - 501, Najmi Residency, Sector D, Burhani Park',
    amount: 50000,
    amountInWords: numberToWordsIndian(50000),
    paymentMode: 'Cheque',
    chequeNo: '551920',
    chequeDate: offsetIsoDate(-20),
    bankName: 'HDFC Bank',
    transactionRef: 'CHQ#551920',
    date: offsetIsoDate(-19),
    financialYear: '1447-1448 Hijri',
    collectedBy: 'janabadmin',
    notes: 'Mohammedi Platinum endowment deposit',
    isCancelled: false,
  },
  {
    id: 'prec-202',
    receiptNo: 'MS-2026-202',
    schemeName: 'Mohammedi Scheme',
    itsNumber: '30489122',
    sabeelNo: 'SB-042',
    memberName: 'Mulla Shabbir Bhai Fakhri',
    mohallahName: 'Burhani Mohallah (Sector B)',
    address: 'Flat 402, Al-Burhani Heights, Sector B, Burhani Park',
    amount: 15000,
    amountInWords: numberToWordsIndian(15000),
    paymentMode: 'Online',
    transactionRef: 'UPI/662910482',
    date: offsetIsoDate(-5),
    financialYear: '1447-1448 Hijri',
    collectedBy: 'huzefasabeel',
    notes: 'Mohammedi Silver monthly scheme contribution',
    isCancelled: false,
  },
  {
    id: 'prec-203',
    receiptNo: 'MS-2026-203',
    schemeName: 'Mohammedi Scheme',
    itsNumber: '40192831',
    sabeelNo: 'SB-310',
    memberName: 'Mulla Mustafa Bhai Kapasi',
    mohallahName: 'Unassigned',
    address: 'Plot 88, Near New Colony Bridge, Burhani Park Extension',
    amount: 10000,
    amountInWords: numberToWordsIndian(10000),
    paymentMode: 'Cash',
    date: offsetIsoDate(-14),
    financialYear: '1447-1448 Hijri',
    collectedBy: 'janabadmin',
    notes: 'Initial commitment voucher',
    isCancelled: true,
    cancelledAt: offsetIsoDate(-13),
    cancelledBy: 'janabadmin',
    cancellationReason: 'Member requested cheque replacement voucher',
  },
];

// ============================================================================
// SEED DATA: HUSAIN SCHEME
// ============================================================================

export const INITIAL_HUSAIN_ENROLLED_ITS: string[] = [
  '30489122',
  '20391823',
  '30491024',
  '20381044',
];

export const INITIAL_HUSAIN_CONTRIBUTIONS: HusainContribution[] = [
  {
    id: 'hs-c-1',
    receiptNo: 'HS-2026-301',
    itsNumber: '30489122',
    sabeelNo: 'SB-042',
    memberName: 'Mulla Shabbir Bhai Fakhri',
    mohallahName: 'Burhani Mohallah (Sector B)',
    address: 'Flat 402, Al-Burhani Heights, Sector B, Burhani Park',
    contributionDate: `${new Date().getFullYear()}-02-15`,
    maturityDate: offsetIsoDate(4),
    tenureMonths: 9,
    amount: 50000,
    amountInWords: numberToWordsIndian(50000),
    paymentMode: 'Online',
    transactionRef: 'NEFT/HS/778120',
    status: 'Maturing Soon',
    notes: '9-month Qardan Hasana Husain Scheme deposit',
    collectedBy: 'janabadmin',
    financialYear: '1447-1448 Hijri',
    isCancelled: false,
  },
  {
    id: 'hs-c-2',
    receiptNo: 'HS-2026-302',
    itsNumber: '20391823',
    sabeelNo: 'SB-118',
    memberName: 'Sheikh Huzefa Bhai Jamali',
    mohallahName: 'Saifee Mohallah (Sector A)',
    address: 'Villa 12, Saifee Enclave, Sector A, Burhani Park',
    contributionDate: `${new Date().getFullYear()}-03-10`,
    maturityDate: offsetIsoDate(11),
    tenureMonths: 8,
    amount: 75000,
    amountInWords: numberToWordsIndian(75000),
    paymentMode: 'Cheque',
    chequeNo: '882011',
    chequeDate: `${new Date().getFullYear()}-03-09`,
    bankName: 'Bank of Baroda',
    transactionRef: 'CHQ#882011',
    status: 'Maturing Soon',
    notes: 'Revolving community deposit maturing within 15 days',
    collectedBy: 'janabadmin',
    financialYear: '1447-1448 Hijri',
    isCancelled: false,
  },
  {
    id: 'hs-c-3',
    receiptNo: 'HS-2026-303',
    itsNumber: '30491024',
    sabeelNo: 'SB-089',
    memberName: 'Mulla Taher Bhai Vajihi',
    mohallahName: 'Badri Mohallah (Sector C)',
    address: 'B-303, Badri Complex, Sector C, Burhani Park',
    contributionDate: offsetIsoDate(-3),
    maturityDate: offsetIsoDate(180),
    tenureMonths: 6,
    amount: 40000,
    amountInWords: numberToWordsIndian(40000),
    paymentMode: 'Cash',
    status: 'Active',
    notes: 'Fresh 6-month contribution certificate',
    collectedBy: 'huzefasabeel',
    financialYear: '1447-1448 Hijri',
    isCancelled: false,
  },
  {
    id: 'hs-c-4',
    receiptNo: 'HS-2026-304',
    itsNumber: '20381044',
    sabeelNo: 'SB-204',
    memberName: 'Mulla Abbas Bhai Rajkotwala',
    mohallahName: 'Najmi Mohallah (Sector D)',
    address: 'Tower A - 501, Najmi Residency, Sector D, Burhani Park',
    contributionDate: `${new Date().getFullYear()}-01-12`,
    maturityDate: offsetIsoDate(-2),
    tenureMonths: 10,
    amount: 60000,
    amountInWords: numberToWordsIndian(60000),
    paymentMode: 'Online',
    transactionRef: 'RTGS/AXIS/991042',
    status: 'Refund Pending',
    notes: 'Matured; refund requested by member',
    collectedBy: 'janabadmin',
    financialYear: '1447-1448 Hijri',
    isCancelled: false,
  },
  {
    id: 'hs-c-5',
    receiptNo: 'HS-2026-305',
    itsNumber: '30489122',
    sabeelNo: 'SB-042',
    memberName: 'Mulla Shabbir Bhai Fakhri',
    mohallahName: 'Burhani Mohallah (Sector B)',
    address: 'Flat 402, Al-Burhani Heights, Sector B, Burhani Park',
    contributionDate: offsetIsoDate(-15),
    maturityDate: offsetIsoDate(14),
    tenureMonths: 1,
    amount: 25000,
    amountInWords: numberToWordsIndian(25000),
    paymentMode: 'Online',
    transactionRef: 'UPI/55019283',
    status: 'Maturing Soon',
    notes: 'Short-term 1-month liquidity contribution',
    collectedBy: 'janabadmin',
    financialYear: '1447-1448 Hijri',
    isCancelled: false,
  },
  {
    id: 'hs-c-6',
    receiptNo: 'HS-2026-306',
    itsNumber: '20391823',
    sabeelNo: 'SB-118',
    memberName: 'Sheikh Huzefa Bhai Jamali',
    mohallahName: 'Saifee Mohallah (Sector A)',
    address: 'Villa 12, Saifee Enclave, Sector A, Burhani Park',
    contributionDate: offsetIsoDate(-22),
    maturityDate: offsetIsoDate(150),
    tenureMonths: 6,
    amount: 15000,
    amountInWords: numberToWordsIndian(15000),
    paymentMode: 'Cheque',
    chequeNo: '449012',
    bankName: 'HDFC Bank',
    transactionRef: 'CHQ#449012',
    status: 'Active',
    notes: 'Incorrect cheque date on physical slip',
    collectedBy: 'taherfmb',
    financialYear: '1447-1448 Hijri',
    isCancelled: true,
    cancelledAt: offsetIsoDate(-21),
    cancelledBy: 'janabadmin',
    cancellationReason: 'Post-dated cheque returned before clearing',
  },
];

export const INITIAL_HUSAIN_REQUESTS: HusainSchemeRequest[] = [
  {
    id: 'hs-req-1',
    requestNo: 'HSR-2026-01',
    itsNumber: '40192831',
    sabeelNo: 'SB-310',
    memberName: 'Mulla Mustafa Bhai Kapasi',
    mohallahName: 'Unassigned',
    requestType: 'Enrollment',
    requestedAmount: 30000,
    requestDate: offsetIsoDate(-4),
    status: 'Pending',
    remarks: 'New Jamaat member requesting enrollment in Husain Scheme',
  },
  {
    id: 'hs-req-2',
    requestNo: 'HSR-2026-02',
    itsNumber: '20381044',
    sabeelNo: 'SB-204',
    memberName: 'Mulla Abbas Bhai Rajkotwala',
    mohallahName: 'Najmi Mohallah (Sector D)',
    requestType: 'Refund / Withdrawal',
    requestedAmount: 60000,
    requestDate: offsetIsoDate(-2),
    status: 'Approved',
    remarks: 'Maturity payout approved by Treasurer; awaiting bank transfer',
    reviewedBy: 'janabadmin',
    reviewedAt: offsetIsoDate(-1),
  },
  {
    id: 'hs-req-3',
    requestNo: 'HSR-2026-03',
    itsNumber: '30489122',
    sabeelNo: 'SB-042',
    memberName: 'Mulla Shabbir Bhai Fakhri',
    mohallahName: 'Burhani Mohallah (Sector B)',
    requestType: 'Maturity Renewal',
    requestedAmount: 50000,
    requestDate: offsetIsoDate(-1),
    status: 'Pending',
    remarks: 'Requests automatic 6-month rollover on upcoming maturity',
  },
];

export const INITIAL_HUSAIN_WITHDRAWALS: HusainWithdrawal[] = [
  {
    id: 'hs-wd-1',
    voucherNo: 'HSW-2026-01',
    contributionId: 'hs-c-4',
    receiptNo: 'HS-2026-304',
    itsNumber: '20381044',
    sabeelNo: 'SB-204',
    memberName: 'Mulla Abbas Bhai Rajkotwala',
    mohallahName: 'Najmi Mohallah (Sector D)',
    contributionAmount: 60000,
    withdrawalAmount: 60000,
    pendingRefundAmount: 35000,
    requestDate: offsetIsoDate(-2),
    processedDate: offsetIsoDate(-1),
    payoutMode: 'Online',
    payoutRef: 'PARTIAL-NEFT-3310',
    status: 'Partially Refunded',
    remarks: '₹25,000 disbursed; ₹35,000 balance pending clearance',
    processedBy: 'janabadmin',
  },
  {
    id: 'hs-wd-2',
    voucherNo: 'HSW-2026-02',
    contributionId: 'hs-c-1',
    receiptNo: 'HS-2026-301',
    itsNumber: '30489122',
    sabeelNo: 'SB-042',
    memberName: 'Mulla Shabbir Bhai Fakhri',
    mohallahName: 'Burhani Mohallah (Sector B)',
    contributionAmount: 50000,
    withdrawalAmount: 20000,
    pendingRefundAmount: 20000,
    requestDate: offsetIsoDate(-1),
    payoutMode: 'Cheque',
    status: 'Pending Refund',
    remarks: 'Advance partial refund requested against maturing deposit',
  },
];

export const INITIAL_HIDE_SETTINGS: HusainHideAccountSettings = {
  hideAccountEnabled: false,
  maskMemberBalances: false,
  hiddenItsNumbers: [],
  updatedAt: getTodayIso(),
  updatedBy: 'janabadmin',
};

// ============================================================================
// STORAGE ACCESSORS
// ============================================================================

export const getStoredOpeningBalances = (): SchemeOpeningBalance[] =>
  loadFromStorage(OPENING_BALANCES_KEY, INITIAL_OPENING_BALANCES);
export const saveStoredOpeningBalances = (items: SchemeOpeningBalance[]): void =>
  saveToStorage(OPENING_BALANCES_KEY, items);

export const getStoredPrimaryReceipts = (): SchemeLedgerReceipt[] =>
  loadFromStorage(PRIMARY_RECEIPTS_KEY, INITIAL_PRIMARY_RECEIPTS);
export const saveStoredPrimaryReceipts = (items: SchemeLedgerReceipt[]): void =>
  saveToStorage(PRIMARY_RECEIPTS_KEY, items);

export const getStoredHusainContributions = (): HusainContribution[] =>
  loadFromStorage(HUSAIN_CONTRIBUTIONS_KEY, INITIAL_HUSAIN_CONTRIBUTIONS);
export const saveStoredHusainContributions = (items: HusainContribution[]): void =>
  saveToStorage(HUSAIN_CONTRIBUTIONS_KEY, items);

export const getStoredHusainRequests = (): HusainSchemeRequest[] =>
  loadFromStorage(HUSAIN_REQUESTS_KEY, INITIAL_HUSAIN_REQUESTS);
export const saveStoredHusainRequests = (items: HusainSchemeRequest[]): void =>
  saveToStorage(HUSAIN_REQUESTS_KEY, items);

export const getStoredHusainWithdrawals = (): HusainWithdrawal[] =>
  loadFromStorage(HUSAIN_WITHDRAWALS_KEY, INITIAL_HUSAIN_WITHDRAWALS);
export const saveStoredHusainWithdrawals = (items: HusainWithdrawal[]): void =>
  saveToStorage(HUSAIN_WITHDRAWALS_KEY, items);

export const getStoredHusainHideSettings = (): HusainHideAccountSettings =>
  loadFromStorage(HUSAIN_HIDE_SETTINGS_KEY, INITIAL_HIDE_SETTINGS);
export const saveStoredHusainHideSettings = (settings: HusainHideAccountSettings): void =>
  saveToStorage(HUSAIN_HIDE_SETTINGS_KEY, settings);

export const getStoredHusainEnrolledIts = (): string[] =>
  loadFromStorage(HUSAIN_ENROLLED_ITS_KEY, INITIAL_HUSAIN_ENROLLED_ITS);
export const saveStoredHusainEnrolledIts = (itsList: string[]): void =>
  saveToStorage(HUSAIN_ENROLLED_ITS_KEY, itsList);

// ============================================================================
// DIRECTORY LINKING (HOF + SABEEL)
// ============================================================================

export const buildMemberDirectory = (): MemberDirectoryRecord[] => {
  const hofs = getStoredHofs();
  const sabeelLedger = getStoredSabeelLedger();

  const sabeelByIts = new Map<string, string>();
  sabeelLedger.forEach((rec) => {
    if (rec.itsNumber && rec.sabeelNo) {
      sabeelByIts.set(rec.itsNumber, rec.sabeelNo);
    }
  });

  return hofs.map((hof) => ({
    itsNumber: hof.itsNumber,
    sabeelNo: hof.sabeelNo || sabeelByIts.get(hof.itsNumber) || '',
    fullName: hof.fullName,
    mohallahName: hof.mohallahName || 'Burhani Park',
    address: hof.fullAddress || hof.address || 'Burhani Park, Vatwa, Ahmedabad',
    mobileNumber: hof.mobileNumber || '',
  }));
};

// ============================================================================
// OFFICIAL TRUST RECEIPT MAPPER & CSV EXPORT HELPER
// ============================================================================

export interface OfficialReceiptInput {
  receiptNo: string;
  date: string;
  memberName: string;
  itsNumber: string;
  sabeelNo?: string;
  address?: string;
  mohallahName?: string;
  amount: number;
  paymentMode: string;
  chequeNo?: string;
  chequeDate?: string;
  bankName?: string;
  schemeTitle: string;
  purposeTitle?: string;
}

export const mapPaymentModeToTrustString = (mode: string): string => {
  const normalized = mode.toLowerCase();
  if (normalized === 'cash') return 'By Cash.';
  if (normalized === 'cheque') return 'By Cheque.';
  if (normalized === 'online' || normalized === 'upi' || normalized === 'bank transfer') {
    return 'By Online Transfer.';
  }
  return `By ${mode}.`;
};

export const toOfficialReceiptData = (input: OfficialReceiptInput): Partial<OfficialReceiptData> => {
  const cleanAddress = (
    input.address ||
    `${input.mohallahName ? input.mohallahName + ', ' : ''}BURHANI PARK, OPP. NAVANA PUMPING STATION, VATWA, AHMEDABAD`
  ).toUpperCase();

  const purpose = input.purposeTitle || (
    input.sabeelNo ? `${input.schemeTitle} (${input.sabeelNo})` : input.schemeTitle
  );

  return {
    trustTitle: 'DAWOODI BOHRA JAMAAT TRUST, BURHANIPARK VATWA',
    trustRegnNo: 'Regn No - B/81',
    managedBy: 'Managed By Anjuman e Mufaddal',
    accountTitle: `A/c : ${input.schemeTitle}`,
    dateStr: formatDisplayDate(input.date),
    receiptNo: input.receiptNo.replace(/[^0-9]/g, '') || input.receiptNo,
    memberName: (input.memberName || '').toUpperCase(),
    honorificLeft: '(حفظه الله تعالى)',
    itsNo: input.itsNumber || '—',
    address: cleanAddress,
    greetingArabic: 'بعد السلام الجميل',
    amount: Number(input.amount) || 0,
    amountInWords: numberToWordsIndian(Number(input.amount) || 0),
    descriptorRight: 'اپ طرف سي',
    descriptorAnke: 'انکه',
    paymentModeStr: mapPaymentModeToTrustString(input.paymentMode),
    purposeTitle: purpose,
    purposePhrase: 'طریقے وصول تھیا چھے',
    chequeNo: input.chequeNo,
    chequeDate: input.chequeDate,
    bankName: input.bankName,
  };
};

export const exportRowsToCsv = (
  filename: string,
  headers: string[],
  rows: (string | number | undefined | null)[][]
): void => {
  const escapeCell = (val: string | number | undefined | null): string => {
    const str = val === undefined || val === null ? '' : String(val);
    return `"${str.replace(/"/g, '""')}"`;
  };
  const csvLines = [
    headers.map(escapeCell).join(','),
    ...rows.map((row) => row.map(escapeCell).join(',')),
  ];
  const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

