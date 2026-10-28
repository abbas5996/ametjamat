/**
 * Faiz ul Mawaidil Burhaniyah (FMB) - Part 2 Data Models & LocalStorage Management
 * Authentic Dawoodi Bohra Jamaat ERP standards [cite: 41-51]
 */

export type FmbReceiptCategory =
  | 'Takhmeen'
  | 'Hoob'
  | 'Zabihat'
  | 'Salwat'
  | 'Fateha'
  | 'Other';

export type FmbPaymentModeExtended =
  | 'Cash'
  | 'Cheque'
  | 'Online'
  | 'Standing Order';

export interface FaizReceiptItem {
  id: string;
  receiptNo: string;
  date: string;
  itsNumber: string;
  hofName: string;
  sabeelNo: string;
  thaaliNo: string;
  mohalla: string;
  category: FmbReceiptCategory;
  paymentMode: FmbPaymentModeExtended;
  amount: number;
  referenceNo: string;
  issuedBy: string;
  accountName: string;
  narration?: string;
  isCancelled: boolean;
  cancelledAt?: string;
  cancelledBy?: string;
  cancelReason?: string;
  giftAidEligible?: boolean;
}

export interface FaizBouncedChequeItem {
  id: string;
  chequeNo: string;
  receiptNo: string;
  chequeDate: string;
  returnDate: string;
  bankName: string;
  chequeAmount: number;
  penaltyFee: number;
  itsNumber: string;
  hofName: string;
  sabeelNo: string;
  thaaliNo: string;
  mohalla: string;
  phone: string;
  returnReason: string;
  status: 'Bounced' | 'Re-Presented' | 'Settled' | 'Cancelled';
  smsSent: boolean;
  lastContacted?: string;
  notes?: string;
}

export interface FaizCancelledVoucherItem {
  id: string;
  voucherType: 'Niyaz Receipt' | 'Niyaz Expense' | 'Income Receipt';
  originalVoucherNo: string;
  voucherDate: string;
  cancelledDate: string;
  partyName: string;
  itsNumber?: string;
  amount: number;
  headOrCategory: string;
  cancelledBy: string;
  reason: string;
  reversalRef: string;
}

export interface FaizYearlyProgressRow {
  hijriYear: string;
  committedAmount: number;
  paidAmount: number;
  balanceAmount: number;
  percentagePaid: number;
  thaaliTier: string;
  status: 'Fully Settled' | 'Partially Paid' | 'Arrears Carried';
}

export interface FaizGiftAidRecord {
  id: string;
  itsNumber: string;
  fullName: string;
  address: string;
  postcode: string;
  ukTaxpayer: boolean;
  declarationDate: string;
  totalDonation: number;
  giftAidClaimable: number; // 25% of eligible amount
  claimBatchId: string;
  claimStatus: 'Eligible' | 'Submitted' | 'Reclaimed' | 'Ineligible';
}

/* ============================================================================
 * LOCAL STORAGE KEYS
 * ========================================================================= */
export const FMB_RECEIPTS_KEY = 'jamat_fmb_all_receipts_v2';
export const FMB_BOUNCED_CHEQUES_KEY = 'jamat_fmb_bounced_cheques_v2';
export const FMB_CANCELLED_VOUCHERS_KEY = 'jamat_fmb_cancelled_vouchers_v2';
export const FMB_GIFTAID_KEY = 'jamat_fmb_giftaid_v2';

/* ============================================================================
 * INITIAL SEED DATA
 * ========================================================================= */
export const INITIAL_FAIZ_RECEIPTS: FaizReceiptItem[] = [
  {
    id: 'frec-101',
    receiptNo: 'FMB-REC-2025-001',
    date: '1447-02-05',
    itsNumber: '30489122',
    hofName: 'Shk. Mufaddal Bhai Poonawala',
    sabeelNo: 'SAB-101',
    thaaliNo: 'TH-084',
    mohalla: 'Burhani Mohallah (Sector B)',
    category: 'Takhmeen',
    paymentMode: 'Online',
    amount: 52000,
    referenceNo: 'TXN-99882103',
    issuedBy: 'fmb_admin',
    accountName: 'State Bank of India — FMB Kitchen A/C',
    narration: 'Annual FMB Takhmeen settled in full with barakat',
    isCancelled: false,
    giftAidEligible: true,
  },
  {
    id: 'frec-102',
    receiptNo: 'FMB-REC-2025-002',
    date: '1447-02-08',
    itsNumber: '20381044',
    hofName: 'Mulla Abbas Bhai Rajkotwala',
    sabeelNo: 'SAB-104',
    thaaliNo: 'TH-012',
    mohalla: 'Najmi Mohallah (Sector D)',
    category: 'Hoob',
    paymentMode: 'Cheque',
    amount: 35000,
    referenceNo: 'CHQ-552190',
    issuedBy: 'taher_cashier',
    accountName: 'HDFC Bank — Niyaz Kitchen Collection A/C',
    narration: 'Deg Niyaz hoob pledge on Farzand Salgirah occasion',
    isCancelled: false,
    giftAidEligible: false,
  },
  {
    id: 'frec-103',
    receiptNo: 'FMB-REC-2025-003',
    date: '1447-02-12',
    itsNumber: '20391823',
    hofName: 'Mulla Huzefa Bhai Jamali',
    sabeelNo: 'SAB-102',
    thaaliNo: 'TH-035',
    mohalla: 'Saifee Mohallah (Sector A)',
    category: 'Zabihat',
    paymentMode: 'Cash',
    amount: 14000,
    referenceNo: 'CSH-REC-889',
    issuedBy: 'taher_cashier',
    accountName: 'Jamaat Treasury Vault (Cash Chest)',
    narration: 'Zabihat sheep for shifa of walid saheb',
    isCancelled: false,
    giftAidEligible: false,
  },
  {
    id: 'frec-104',
    receiptNo: 'FMB-REC-2025-004',
    date: '1447-02-14',
    itsNumber: '30491024',
    hofName: 'Mulla Taher Bhai Vajihi',
    sabeelNo: 'SAB-103',
    thaaliNo: 'TH-119',
    mohalla: 'Badri Mohallah (Sector C)',
    category: 'Salwat',
    paymentMode: 'Online',
    amount: 11000,
    referenceNo: 'UPI-9921820',
    issuedBy: 'mustafa_trustee',
    accountName: 'State Bank of India — FMB Kitchen A/C',
    narration: 'Friday Salwat Jaman contribution',
    isCancelled: false,
    giftAidEligible: true,
  },
  {
    id: 'frec-105',
    receiptNo: 'FMB-REC-2025-005',
    date: '1447-02-18',
    itsNumber: '20391002',
    hofName: 'Shaikh Burhanuddin Bhai Mithaiwala',
    sabeelNo: 'SAB-112',
    thaaliNo: 'TH-052',
    mohalla: 'Najmi Mohallah (Sector D)',
    category: 'Fateha',
    paymentMode: 'Cash',
    amount: 8000,
    referenceNo: 'CSH-99201',
    issuedBy: 'fmb_admin',
    accountName: 'Jamaat Treasury Vault (Cash Chest)',
    narration: 'Fateha jaman in memory of Marhoom walid',
    isCancelled: false,
    giftAidEligible: false,
  },
  {
    id: 'frec-106',
    receiptNo: 'FMB-REC-2025-006',
    date: '1447-02-20',
    itsNumber: '20381992',
    hofName: 'Mulla Juzer Bhai Kapasi',
    sabeelNo: 'SAB-148',
    thaaliNo: 'TH-203',
    mohalla: 'Burhani Mohallah (Sector B)',
    category: 'Takhmeen',
    paymentMode: 'Standing Order',
    amount: 13000,
    referenceNo: 'SI-AUTOPAY-08',
    issuedBy: 'mustafa_trustee',
    accountName: 'State Bank of India — FMB Kitchen A/C',
    narration: 'Monthly standing order installment #2',
    isCancelled: false,
    giftAidEligible: true,
  },
  {
    id: 'frec-107',
    receiptNo: 'FMB-REC-2025-007',
    date: '1447-02-22',
    itsNumber: '30489122',
    hofName: 'Shk. Mufaddal Bhai Poonawala',
    sabeelNo: 'SAB-101',
    thaaliNo: 'TH-084',
    mohalla: 'Burhani Mohallah (Sector B)',
    category: 'Other',
    paymentMode: 'Online',
    amount: 5000,
    referenceNo: 'TXN-9988554',
    issuedBy: 'taher_cashier',
    accountName: 'State Bank of India — FMB Kitchen A/C',
    narration: 'Kitchen modern container replacement fund',
    isCancelled: false,
    giftAidEligible: false,
  },
  {
    id: 'frec-108',
    receiptNo: 'FMB-REC-2025-008',
    date: '1447-02-10',
    itsNumber: '20381044',
    hofName: 'Mulla Abbas Bhai Rajkotwala',
    sabeelNo: 'SAB-104',
    thaaliNo: 'TH-012',
    mohalla: 'Najmi Mohallah (Sector D)',
    category: 'Takhmeen',
    paymentMode: 'Cheque',
    amount: 15000,
    referenceNo: 'CHQ-991024',
    issuedBy: 'taher_cashier',
    accountName: 'HDFC Bank — Niyaz Kitchen Collection A/C',
    narration: 'Cheque bounced due to signature mismatch - Cancelled',
    isCancelled: true,
    cancelledAt: '1447-02-12 11:30 AM',
    cancelledBy: 'fmb_admin',
    cancelReason: 'Cheque returned by bank; re-issued on receipt FMB-REC-2025-002 after clearance.',
    giftAidEligible: false,
  },
];

export const INITIAL_BOUNCED_CHEQUES: FaizBouncedChequeItem[] = [
  {
    id: 'bnc-1',
    chequeNo: 'CHQ-991024',
    receiptNo: 'FMB-REC-2025-008',
    chequeDate: '1447-02-05',
    returnDate: '1447-02-11',
    bankName: 'Axis Bank Ltd — Burhani Branch',
    chequeAmount: 15000,
    penaltyFee: 500,
    itsNumber: '20381044',
    hofName: 'Mulla Abbas Bhai Rajkotwala',
    sabeelNo: 'SAB-104',
    thaaliNo: 'TH-012',
    mohalla: 'Najmi Mohallah (Sector D)',
    phone: '+91 98204 11223',
    returnReason: 'Drawers Signature Mismatch (Code 02)',
    status: 'Settled',
    smsSent: true,
    lastContacted: '1447-02-12',
    notes: 'Member remitted fresh replacement cheque with penalty fee cleared.',
  },
  {
    id: 'bnc-2',
    chequeNo: 'CHQ-448102',
    receiptNo: 'FMB-REC-2025-014',
    chequeDate: '1447-02-15',
    returnDate: '1447-02-21',
    bankName: 'HDFC Bank Ltd — Fort Branch',
    chequeAmount: 26000,
    penaltyFee: 500,
    itsNumber: '20391002',
    hofName: 'Shaikh Burhanuddin Bhai Mithaiwala',
    sabeelNo: 'SAB-112',
    thaaliNo: 'TH-052',
    mohalla: 'Najmi Mohallah (Sector D)',
    phone: '+91 98199 88771',
    returnReason: 'Funds Insufficient (Code 01)',
    status: 'Bounced',
    smsSent: false,
    lastContacted: '1447-02-22',
    notes: 'Awaiting cash settlement at Jamaat counter.',
  },
  {
    id: 'bnc-3',
    chequeNo: 'CHQ-331902',
    receiptNo: 'FMB-REC-2025-021',
    chequeDate: '1447-02-18',
    returnDate: '1447-02-24',
    bankName: 'ICICI Bank — Saifee Extension',
    chequeAmount: 18000,
    penaltyFee: 500,
    itsNumber: '20381992',
    hofName: 'Mulla Juzer Bhai Kapasi',
    sabeelNo: 'SAB-148',
    thaaliNo: 'TH-203',
    mohalla: 'Burhani Mohallah (Sector B)',
    phone: '+91 98205 44332',
    returnReason: 'Post-Dated Cheque Presented Early',
    status: 'Re-Presented',
    smsSent: true,
    lastContacted: '1447-02-24',
    notes: 'Re-presented for clearing on 1447-03-01.',
  },
];

export const INITIAL_CANCELLED_VOUCHERS: FaizCancelledVoucherItem[] = [
  {
    id: 'cv-1',
    voucherType: 'Niyaz Receipt',
    originalVoucherNo: 'FMB-REC-2025-008',
    voucherDate: '1447-02-10',
    cancelledDate: '1447-02-12',
    partyName: 'Mulla Abbas Bhai Rajkotwala',
    itsNumber: '20381044',
    amount: 15000,
    headOrCategory: 'Takhmeen',
    cancelledBy: 'fmb_admin',
    reason: 'Cheque returned by bank due to signature mismatch. Reissued on new receipt.',
    reversalRef: 'REV-JNL-0081',
  },
  {
    id: 'cv-2',
    voucherType: 'Niyaz Expense',
    originalVoucherNo: 'FMB-VCH-1009',
    voucherDate: '1447-02-14',
    cancelledDate: '1447-02-15',
    partyName: 'Al-Madina Halal Mutton Suppliers',
    amount: 45000,
    headOrCategory: 'Zabihat & Halal Meat',
    cancelledBy: 'mustafa_trustee',
    reason: 'Duplicate voucher punched by junior accountant; original paid via voucher #1002.',
    reversalRef: 'REV-EXP-0045',
  },
  {
    id: 'cv-3',
    voucherType: 'Income Receipt',
    originalVoucherNo: 'FMB-REC-2009',
    voucherDate: '1447-02-18',
    cancelledDate: '1447-02-19',
    partyName: 'Burhani Metal Recyclers',
    amount: 12000,
    headOrCategory: 'Container & Scrap Sales',
    cancelledBy: 'taher_cashier',
    reason: 'Incorrect scrap weight recorded; amended and reissued on receipt #2011.',
    reversalRef: 'REV-INC-0012',
  },
];

export const INITIAL_GIFTAID_RECORDS: FaizGiftAidRecord[] = [
  {
    id: 'ga-1',
    itsNumber: '30489122',
    fullName: 'Shk. Mufaddal Bhai Poonawala',
    address: '42 Saifee Park Road, London NW9 8TT',
    postcode: 'NW9 8TT',
    ukTaxpayer: true,
    declarationDate: '1445-09-23',
    totalDonation: 52000,
    giftAidClaimable: 13000,
    claimBatchId: 'HMRC-FMB-2025-Q1',
    claimStatus: 'Submitted',
  },
  {
    id: 'ga-2',
    itsNumber: '20391823',
    fullName: 'Mulla Huzefa Bhai Jamali',
    address: '18 Burhani Crescent, Birmingham B11 4RA',
    postcode: 'B11 4RA',
    ukTaxpayer: true,
    declarationDate: '1446-01-10',
    totalDonation: 64000,
    giftAidClaimable: 16000,
    claimBatchId: 'HMRC-FMB-2025-Q1',
    claimStatus: 'Submitted',
  },
  {
    id: 'ga-3',
    itsNumber: '30491024',
    fullName: 'Mulla Taher Bhai Vajihi',
    address: '89 Badri Gardens, Manchester M14 5TP',
    postcode: 'M14 5TP',
    ukTaxpayer: true,
    declarationDate: '1446-08-15',
    totalDonation: 35000,
    giftAidClaimable: 8750,
    claimBatchId: 'PENDING-Q2',
    claimStatus: 'Eligible',
  },
  {
    id: 'ga-4',
    itsNumber: '20381044',
    fullName: 'Mulla Abbas Bhai Rajkotwala',
    address: '104 Najmi Lane, Leicester LE2 0PA',
    postcode: 'LE2 0PA',
    ukTaxpayer: false,
    declarationDate: 'N/A',
    totalDonation: 45000,
    giftAidClaimable: 0,
    claimBatchId: 'N/A',
    claimStatus: 'Ineligible',
  },
];

// 19-Year Hijri Historical Takhmeen Progression (1433 to 1451 Hijri) [cite: 43]
export const HIJRI_YEAR_OPTIONS = [
  '1433-1434', '1434-1435', '1435-1436', '1436-1437', '1437-1438',
  '1438-1439', '1439-1440', '1440-1441', '1441-1442', '1442-1443',
  '1443-1444', '1444-1445', '1445-1446', '1446-1447', '1447-1448',
  '1448-1449', '1449-1450', '1450-1451'
];

/* ============================================================================
 * LOCAL STORAGE GETTERS & SETTERS (WITH AUTO FALLBACK & PARSING)
 * ========================================================================= */

function getFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(defaultValue));
      return defaultValue;
    }
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent('fmb_part2_update', { detail: { key } }));
  } catch (err) {
    console.error(`Failed to save ${key}:`, err);
  }
}

// 1. Receipts
export const getStoredPart2Receipts = (): FaizReceiptItem[] =>
  getFromStorage(FMB_RECEIPTS_KEY, INITIAL_FAIZ_RECEIPTS);
export const saveStoredPart2Receipts = (v: FaizReceiptItem[]): void =>
  saveToStorage(FMB_RECEIPTS_KEY, v);

// 2. Bounced Cheques
export const getStoredBouncedCheques = (): FaizBouncedChequeItem[] =>
  getFromStorage(FMB_BOUNCED_CHEQUES_KEY, INITIAL_BOUNCED_CHEQUES);
export const saveStoredBouncedCheques = (v: FaizBouncedChequeItem[]): void =>
  saveToStorage(FMB_BOUNCED_CHEQUES_KEY, v);

// 3. Cancelled Vouchers
export const getStoredCancelledVouchers = (): FaizCancelledVoucherItem[] =>
  getFromStorage(FMB_CANCELLED_VOUCHERS_KEY, INITIAL_CANCELLED_VOUCHERS);
export const saveStoredCancelledVouchers = (v: FaizCancelledVoucherItem[]): void =>
  saveToStorage(FMB_CANCELLED_VOUCHERS_KEY, v);

// 4. Gift Aid Records
export const getStoredGiftAidRecords = (): FaizGiftAidRecord[] =>
  getFromStorage(FMB_GIFTAID_KEY, INITIAL_GIFTAID_RECORDS);
export const saveStoredGiftAidRecords = (v: FaizGiftAidRecord[]): void =>
  saveToStorage(FMB_GIFTAID_KEY, v);

/* ============================================================================
 * AMOUNT TO WORDS CONVERTER (INDIAN FINANCIAL NUMBERING SYSTEM)
 * ========================================================================= */
export function numberToWordsIndian(num: number): string {
  if (isNaN(num) || num === null || num === undefined) return '';
  num = Math.round(num * 100) / 100;
  if (num === 0) return 'Zero Rupees Only';

  const singleDigits = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convertLessThanOneThousand = (n: number): string => {
    let current = '';
    if (n >= 100) {
      current += singleDigits[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      current += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    }
    if (n > 0) {
      current += singleDigits[n] + ' ';
    }
    return current.trim();
  };

  const integerPart = Math.floor(Math.abs(num));
  const decimalPart = Math.round((Math.abs(num) - integerPart) * 100);

  let result = '';
  let n = integerPart;

  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  const lakh = Math.floor(n / 100000);
  n %= 100000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  const remainder = n;

  if (crore > 0) {
    result += convertLessThanOneThousand(crore) + ' Crore ';
  }
  if (lakh > 0) {
    result += convertLessThanOneThousand(lakh) + ' Lakh ';
  }
  if (thousand > 0) {
    result += convertLessThanOneThousand(thousand) + ' Thousand ';
  }
  if (remainder > 0) {
    result += convertLessThanOneThousand(remainder) + ' ';
  }

  result = result.trim();
  if (!result) result = 'Zero';

  if (decimalPart > 0) {
    const decimalWords = convertLessThanOneThousand(decimalPart);
    return `${result} and ${decimalWords} Paise Only`;
  }

  return `${result} Only`;
}
