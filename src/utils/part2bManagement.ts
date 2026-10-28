/**
 * Part 2B Data Management Utilities
 * Powers:
 * 1. Voluntary Contributions (Hadiyah / Sadaqah / Niyaz)
 * 2. Community Schemes (Taher, Mohammedii, Husain, Hoob, Corpus, Sarkari Lagat)
 * 3. Wajebaat Management (Khums / Zakat / Wajebaat Takhmeen)
 * 4. Rent Management (Jamaat Properties, Tenants, Agreements, Kiraya Receipts)
 */

export type PaymentMode = 'Cash' | 'Cheque' | 'Bank Transfer' | 'NEFT/RTGS' | 'UPI' | 'Card';

// ============================================================================
// 1. VOLUNTARY CONTRIBUTIONS (Hadiyah / Sadaqah)
// ============================================================================

export interface HadiyahCategory {
  id: string;
  name: string;
  code: string;
  description: string;
  suggestedAmount?: number;
  isActive: boolean;
}

export interface HadiyahReceipt {
  id: string;
  receiptNo: string;
  itsNumber: string;
  donorName: string;
  categoryId: string;
  categoryName: string;
  amount: number;
  paymentMode: PaymentMode;
  transactionRef?: string;
  date: string;
  financialYear: string;
  collectedBy: string;
  purposeNiyaz: string;
  isAnonymous?: boolean;
  isCancelled: boolean;
  cancelledAt?: string;
  cancelledBy?: string;
  cancellationReason?: string;
}

export const HADIYAH_CATEGORIES_KEY = 'jamat_hadiyah_categories_v1';
export const HADIYAH_RECEIPTS_KEY = 'jamat_hadiyah_receipts_v1';

export const INITIAL_HADIYAH_CATEGORIES: HadiyahCategory[] = [
  { id: 'hcat-1', name: 'Niyaz-e-Husain (AS)', code: 'NIYAZ-HUS', description: 'General jaman and barakat niyaz contributions.', suggestedAmount: 5200, isActive: true },
  { id: 'hcat-2', name: 'Sadaqah / Khairat', code: 'SADAQAH', description: 'Voluntary charity for health, protection, and shifa.', suggestedAmount: 1100, isActive: true },
  { id: 'hcat-3', name: 'Salawat Hadiyah', code: 'SALAWAT', description: 'Hadiyah offered during darees, majlis, and wiladat.', suggestedAmount: 2100, isActive: true },
  { id: 'hcat-4', name: 'Ziyarat Hadiyah (Karbala / Najaf)', code: 'ZIYARAT', description: 'Voluntary contributions for holy ziyarat convoys.', suggestedAmount: 5100, isActive: true },
  { id: 'hcat-5', name: 'Shehrullah Iftar Niyaz', code: 'IFTAR-NIY', description: 'Daily Ramazan-ul-Moazzam iftar and thaali niyaz.', suggestedAmount: 11000, isActive: true },
  { id: 'hcat-6', name: 'Masjid Maintenance Hadiyah', code: 'MASJID-MAINT', description: 'Upkeep, carpet cleaning, and audio equipment support.', suggestedAmount: 2500, isActive: true },
];

export const INITIAL_HADIYAH_RECEIPTS: HadiyahReceipt[] = [
  {
    id: 'hrc-1',
    receiptNo: 'HAD-1447-001',
    itsNumber: '30489122',
    donorName: 'Mulla Shabbir Bhai Burhani',
    categoryId: 'hcat-1',
    categoryName: 'Niyaz-e-Husain (AS)',
    amount: 5200,
    paymentMode: 'UPI',
    transactionRef: 'UPI/439201992',
    date: '2026-10-15',
    financialYear: '1447-1448 Hijri',
    collectedBy: 'admin',
    purposeNiyaz: 'Shukr Niyaz for newborn grandson',
    isCancelled: false,
  },
  {
    id: 'hrc-2',
    receiptNo: 'HAD-1447-002',
    itsNumber: '40392188',
    donorName: 'Shaikh Murtaza Bhai Badri',
    categoryId: 'hcat-2',
    categoryName: 'Sadaqah / Khairat',
    amount: 2500,
    paymentMode: 'Cash',
    date: '2026-10-18',
    financialYear: '1447-1448 Hijri',
    collectedBy: 'cashier',
    purposeNiyaz: 'Sadaqah for safe travel to Najaf',
    isCancelled: false,
  },
  {
    id: 'hrc-3',
    receiptNo: 'HAD-1447-003',
    itsNumber: '20394811',
    donorName: 'Hakimuddin Bhai Saifee',
    categoryId: 'hcat-5',
    categoryName: 'Shehrullah Iftar Niyaz',
    amount: 11000,
    paymentMode: 'Bank Transfer',
    transactionRef: 'NEFT-AXIS-9921',
    date: '2026-10-20',
    financialYear: '1447-1448 Hijri',
    collectedBy: 'admin',
    purposeNiyaz: 'Ramazan thaali barakat sponsorship',
    isCancelled: false,
  },
  {
    id: 'hrc-4',
    receiptNo: 'HAD-1447-004',
    itsNumber: '50291844',
    donorName: 'Mustafa Bhai Najmi',
    categoryId: 'hcat-3',
    categoryName: 'Salawat Hadiyah',
    amount: 1000,
    paymentMode: 'Cash',
    date: '2026-10-22',
    financialYear: '1447-1448 Hijri',
    collectedBy: 'cashier',
    purposeNiyaz: 'Darees at home',
    isCancelled: true,
    cancelledAt: '2026-10-23',
    cancelledBy: 'janabadmin',
    cancellationReason: 'Double entry recorded erroneously by counter',
  },
];

export const getStoredHadiyahCategories = (): HadiyahCategory[] => {
  const d = localStorage.getItem(HADIYAH_CATEGORIES_KEY);
  if (!d) {
    localStorage.setItem(HADIYAH_CATEGORIES_KEY, JSON.stringify(INITIAL_HADIYAH_CATEGORIES));
    return INITIAL_HADIYAH_CATEGORIES;
  }
  try { return JSON.parse(d); } catch { return INITIAL_HADIYAH_CATEGORIES; }
};

export const saveStoredHadiyahCategories = (items: HadiyahCategory[]) => {
  localStorage.setItem(HADIYAH_CATEGORIES_KEY, JSON.stringify(items));
};

export const getStoredHadiyahReceipts = (): HadiyahReceipt[] => {
  const d = localStorage.getItem(HADIYAH_RECEIPTS_KEY);
  if (!d) {
    localStorage.setItem(HADIYAH_RECEIPTS_KEY, JSON.stringify(INITIAL_HADIYAH_RECEIPTS));
    return INITIAL_HADIYAH_RECEIPTS;
  }
  try { return JSON.parse(d); } catch { return INITIAL_HADIYAH_RECEIPTS; }
};

export const saveStoredHadiyahReceipts = (items: HadiyahReceipt[]) => {
  localStorage.setItem(HADIYAH_RECEIPTS_KEY, JSON.stringify(items));
};

// ============================================================================
// 2. COMMUNITY SCHEMES
// ============================================================================

export type SchemeName =
  | 'Taher Scheme'
  | 'Mohammedii Scheme'
  | 'Husain Scheme'
  | 'Hoob'
  | 'Corpus Fund'
  | 'Sarkari Lagat';

export const ALL_SCHEMES: SchemeName[] = [
  'Taher Scheme',
  'Mohammedii Scheme',
  'Husain Scheme',
  'Hoob',
  'Corpus Fund',
  'Sarkari Lagat',
];

export interface SchemeCategory {
  id: string;
  schemeName: SchemeName;
  name: string;
  code: string;
  suggestedTakhmeen: number;
  description: string;
  isActive: boolean;
}

export interface SchemeTakhmeen {
  id: string;
  schemeName: SchemeName;
  categoryCode: string;
  itsNumber: string;
  hofName: string;
  mohallahName: string;
  financialYear: string;
  committedAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: 'Pledged' | 'Partially Paid' | 'Settled' | 'Overdue';
  createdAt: string;
}

export interface SchemeReceipt {
  id: string;
  receiptNo: string;
  takhmeenId: string;
  schemeName: SchemeName;
  itsNumber: string;
  hofName: string;
  amount: number;
  paymentMode: PaymentMode;
  transactionRef?: string;
  date: string;
  financialYear: string;
  collectedBy: string;
  notes?: string;
  isCancelled: boolean;
  cancelledAt?: string;
  cancelledBy?: string;
  cancellationReason?: string;
}

export const SCHEME_CATEGORIES_KEY = 'jamat_scheme_categories_v1';
export const SCHEME_TAKHMEN_KEY = 'jamat_scheme_takhmeens_v1';
export const SCHEME_RECEIPTS_KEY = 'jamat_scheme_receipts_v1';

export const INITIAL_SCHEME_CATEGORIES: SchemeCategory[] = [
  { id: 'scat-1', schemeName: 'Taher Scheme', name: 'Taher Prime Tier', code: 'TS-PRIME', suggestedTakhmeen: 25000, description: 'Medical assistance and education micro-aid commitment.', isActive: true },
  { id: 'scat-2', schemeName: 'Taher Scheme', name: 'Taher Standard Tier', code: 'TS-STD', suggestedTakhmeen: 12000, description: 'Standard family contribution for welfare aid.', isActive: true },
  { id: 'scat-3', schemeName: 'Mohammedii Scheme', name: 'Mohammedii Platinum', code: 'MS-PLAT', suggestedTakhmeen: 50000, description: 'Qardan Hasana seed capitalization tier.', isActive: true },
  { id: 'scat-4', schemeName: 'Mohammedii Scheme', name: 'Mohammedii Silver', code: 'MS-SILVER', suggestedTakhmeen: 15000, description: 'General business revolving fund commitment.', isActive: true },
  { id: 'scat-5', schemeName: 'Husain Scheme', name: 'Husain Karbala Endowment', code: 'HS-ENDOW', suggestedTakhmeen: 35000, description: 'Ziyarat subsidy fund for senior citizens.', isActive: true },
  { id: 'scat-6', schemeName: 'Hoob', name: 'Dawat Hoob Standard', code: 'HOOB-STD', suggestedTakhmeen: 11000, description: 'Annual community allegiance and dawat hoob.', isActive: true },
  { id: 'scat-7', schemeName: 'Corpus Fund', name: 'Infrastructure Corpus Gold', code: 'CORP-GOLD', suggestedTakhmeen: 100000, description: 'Jamaat asset acquisition and capital infrastructure reserve.', isActive: true },
  { id: 'scat-8', schemeName: 'Sarkari Lagat', name: 'Standard Sarkari Lagat', code: 'SARKARI-STD', suggestedTakhmeen: 5000, description: 'Statutory Jamaat administration and municipal cess.', isActive: true },
];

export const INITIAL_SCHEME_TAKHMEN: SchemeTakhmeen[] = [
  {
    id: 'st-1',
    schemeName: 'Taher Scheme',
    categoryCode: 'TS-PRIME',
    itsNumber: '30489122',
    hofName: 'Mulla Shabbir Bhai Burhani',
    mohallahName: 'Saifee Mohalla',
    financialYear: '1447-1448 Hijri',
    committedAmount: 25000,
    paidAmount: 15000,
    balanceAmount: 10000,
    status: 'Partially Paid',
    createdAt: '2026-07-01',
  },
  {
    id: 'st-2',
    schemeName: 'Mohammedii Scheme',
    categoryCode: 'MS-PLAT',
    itsNumber: '40392188',
    hofName: 'Shaikh Murtaza Bhai Badri',
    mohallahName: 'Badri Mohalla',
    financialYear: '1447-1448 Hijri',
    committedAmount: 50000,
    paidAmount: 50000,
    balanceAmount: 0,
    status: 'Settled',
    createdAt: '2026-07-01',
  },
  {
    id: 'st-3',
    schemeName: 'Husain Scheme',
    categoryCode: 'HS-ENDOW',
    itsNumber: '20394811',
    hofName: 'Hakimuddin Bhai Saifee',
    mohallahName: 'Burhani Mohalla',
    financialYear: '1447-1448 Hijri',
    committedAmount: 35000,
    paidAmount: 0,
    balanceAmount: 35000,
    status: 'Pledged',
    createdAt: '2026-07-01',
  },
  {
    id: 'st-4',
    schemeName: 'Corpus Fund',
    categoryCode: 'CORP-GOLD',
    itsNumber: '50291844',
    hofName: 'Mustafa Bhai Najmi',
    mohallahName: 'Najmi Mohalla',
    financialYear: '1447-1448 Hijri',
    committedAmount: 100000,
    paidAmount: 25000,
    balanceAmount: 75000,
    status: 'Partially Paid',
    createdAt: '2026-07-01',
  },
  {
    id: 'st-5',
    schemeName: 'Hoob',
    categoryCode: 'HOOB-STD',
    itsNumber: '30489122',
    hofName: 'Mulla Shabbir Bhai Burhani',
    mohallahName: 'Saifee Mohalla',
    financialYear: '1447-1448 Hijri',
    committedAmount: 11000,
    paidAmount: 11000,
    balanceAmount: 0,
    status: 'Settled',
    createdAt: '2026-07-01',
  },
];

export const INITIAL_SCHEME_RECEIPTS: SchemeReceipt[] = [
  {
    id: 'srec-1',
    receiptNo: 'SCH-1447-001',
    takhmeenId: 'st-1',
    schemeName: 'Taher Scheme',
    itsNumber: '30489122',
    hofName: 'Mulla Shabbir Bhai Burhani',
    amount: 15000,
    paymentMode: 'Bank Transfer',
    transactionRef: 'HDFC/8849201',
    date: '2026-08-12',
    financialYear: '1447-1448 Hijri',
    collectedBy: 'admin',
    isCancelled: false,
  },
  {
    id: 'srec-2',
    receiptNo: 'SCH-1447-002',
    takhmeenId: 'st-2',
    schemeName: 'Mohammedii Scheme',
    itsNumber: '40392188',
    hofName: 'Shaikh Murtaza Bhai Badri',
    amount: 50000,
    paymentMode: 'Cheque',
    transactionRef: 'CHQ#490210',
    date: '2026-08-20',
    financialYear: '1447-1448 Hijri',
    collectedBy: 'admin',
    isCancelled: false,
  },
  {
    id: 'srec-3',
    receiptNo: 'SCH-1447-003',
    takhmeenId: 'st-4',
    schemeName: 'Corpus Fund',
    itsNumber: '50291844',
    hofName: 'Mustafa Bhai Najmi',
    amount: 25000,
    paymentMode: 'UPI',
    transactionRef: 'UPI/99281726',
    date: '2026-09-05',
    financialYear: '1447-1448 Hijri',
    collectedBy: 'cashier',
    isCancelled: false,
  },
  {
    id: 'srec-4',
    receiptNo: 'SCH-1447-004',
    takhmeenId: 'st-1',
    schemeName: 'Taher Scheme',
    itsNumber: '30489122',
    hofName: 'Mulla Shabbir Bhai Burhani',
    amount: 5000,
    paymentMode: 'Cash',
    date: '2026-09-10',
    financialYear: '1447-1448 Hijri',
    collectedBy: 'cashier',
    isCancelled: true,
    cancelledAt: '2026-09-11',
    cancelledBy: 'janabadmin',
    cancellationReason: 'Payer made payment in wrong scheme head',
  },
];

export const getStoredSchemeCategories = (): SchemeCategory[] => {
  const d = localStorage.getItem(SCHEME_CATEGORIES_KEY);
  if (!d) {
    localStorage.setItem(SCHEME_CATEGORIES_KEY, JSON.stringify(INITIAL_SCHEME_CATEGORIES));
    return INITIAL_SCHEME_CATEGORIES;
  }
  try { return JSON.parse(d); } catch { return INITIAL_SCHEME_CATEGORIES; }
};

export const saveStoredSchemeCategories = (items: SchemeCategory[]) => {
  localStorage.setItem(SCHEME_CATEGORIES_KEY, JSON.stringify(items));
};

export const getStoredSchemeTakhmeens = (): SchemeTakhmeen[] => {
  const d = localStorage.getItem(SCHEME_TAKHMEN_KEY);
  if (!d) {
    localStorage.setItem(SCHEME_TAKHMEN_KEY, JSON.stringify(INITIAL_SCHEME_TAKHMEN));
    return INITIAL_SCHEME_TAKHMEN;
  }
  try { return JSON.parse(d); } catch { return INITIAL_SCHEME_TAKHMEN; }
};

export const saveStoredSchemeTakhmeens = (items: SchemeTakhmeen[]) => {
  localStorage.setItem(SCHEME_TAKHMEN_KEY, JSON.stringify(items));
};

export const getStoredSchemeReceipts = (): SchemeReceipt[] => {
  const d = localStorage.getItem(SCHEME_RECEIPTS_KEY);
  if (!d) {
    localStorage.setItem(SCHEME_RECEIPTS_KEY, JSON.stringify(INITIAL_SCHEME_RECEIPTS));
    return INITIAL_SCHEME_RECEIPTS;
  }
  try { return JSON.parse(d); } catch { return INITIAL_SCHEME_RECEIPTS; }
};

export const saveStoredSchemeReceipts = (items: SchemeReceipt[]) => {
  localStorage.setItem(SCHEME_RECEIPTS_KEY, JSON.stringify(items));
};

// ============================================================================
// 3. WAJEBAAT (Khums / Zakat / Wajebaat Management)
// ============================================================================

export interface WajebaatYearMaster {
  id: string;
  hijriYear: string;
  label: string;
  startDate: string;
  endDate: string;
  status: 'Active' | 'Closed' | 'Upcoming';
  totalPledged: number;
  totalCollected: number;
  notes?: string;
}

export type WajebaatCategory =
  | 'Khums'
  | 'Zakat-ul-Maal'
  | 'Zakat-ul-Fitr'
  | 'Kaffarah'
  | 'Haqqun-Nafs'
  | 'Nazr-ul-Malaeka'
  | 'General Wajebaat';

export interface WajebaatTakhmeen {
  id: string;
  itsNumber: string;
  hofName: string;
  mohallahName: string;
  hijriYear: string;
  breakdown: Record<WajebaatCategory, number>;
  totalTakhmeen: number;
  totalPaid: number;
  balanceDue: number;
  takhmeenDate: string;
  status: 'Pledged' | 'Partially Paid' | 'Paid' | 'Deferred';
  notes?: string;
}

export interface WajebaatReceipt {
  id: string;
  receiptNo: string;
  takhmeenId: string;
  itsNumber: string;
  hofName: string;
  hijriYear: string;
  category: WajebaatCategory;
  amount: number;
  paymentMode: PaymentMode;
  transactionRef?: string;
  date: string;
  collectedBy: string;
  receivedFrom: string;
  notes?: string;
  isCancelled: boolean;
  cancelledAt?: string;
  cancelledBy?: string;
  cancellationReason?: string;
}

export const WAJEBAAT_YEARS_KEY = 'jamat_wajebaat_years_v1';
export const WAJEBAAT_TAKHMEN_KEY = 'jamat_wajebaat_takhmeens_v1';
export const WAJEBAAT_RECEIPTS_KEY = 'jamat_wajebaat_receipts_v1';

export const INITIAL_WAJEBAAT_YEARS: WajebaatYearMaster[] = [
  { id: 'wyear-1', hijriYear: '1448 Hijri', label: '1448 Hijri (2027)', startDate: '2027-06-06', endDate: '2028-05-25', status: 'Upcoming', totalPledged: 0, totalCollected: 0 },
  { id: 'wyear-2', hijriYear: '1447 Hijri', label: '1447 Hijri (2026) - Current', startDate: '2026-06-16', endDate: '2027-06-05', status: 'Active', totalPledged: 2450000, totalCollected: 1820000 },
  { id: 'wyear-3', hijriYear: '1446 Hijri', label: '1446 Hijri (2025)', startDate: '2025-06-27', endDate: '2026-06-15', status: 'Closed', totalPledged: 2180000, totalCollected: 2180000 },
  { id: 'wyear-4', hijriYear: '1445 Hijri', label: '1445 Hijri (2024)', startDate: '2024-07-08', endDate: '2025-06-26', status: 'Closed', totalPledged: 1950000, totalCollected: 1950000 },
];

export const INITIAL_WAJEBAAT_TAKHMEN: WajebaatTakhmeen[] = [
  {
    id: 'wt-1',
    itsNumber: '30489122',
    hofName: 'Mulla Shabbir Bhai Burhani',
    mohallahName: 'Saifee Mohalla',
    hijriYear: '1447 Hijri',
    breakdown: {
      'Khums': 45000,
      'Zakat-ul-Maal': 25000,
      'Zakat-ul-Fitr': 3500,
      'Kaffarah': 1500,
      'Haqqun-Nafs': 5000,
      'Nazr-ul-Malaeka': 2000,
      'General Wajebaat': 0,
    },
    totalTakhmeen: 82000,
    totalPaid: 82000,
    balanceDue: 0,
    takhmeenDate: '2026-07-15',
    status: 'Paid',
    notes: 'Completed full barakat remittance during Ramazan',
  },
  {
    id: 'wt-2',
    itsNumber: '40392188',
    hofName: 'Shaikh Murtaza Bhai Badri',
    mohallahName: 'Badri Mohalla',
    hijriYear: '1447 Hijri',
    breakdown: {
      'Khums': 60000,
      'Zakat-ul-Maal': 35000,
      'Zakat-ul-Fitr': 4000,
      'Kaffarah': 2000,
      'Haqqun-Nafs': 6000,
      'Nazr-ul-Malaeka': 3000,
      'General Wajebaat': 0,
    },
    totalTakhmeen: 110000,
    totalPaid: 70000,
    balanceDue: 40000,
    takhmeenDate: '2026-07-20',
    status: 'Partially Paid',
    notes: 'Remaining installment scheduled before Eid-ul-Adha',
  },
  {
    id: 'wt-3',
    itsNumber: '20394811',
    hofName: 'Hakimuddin Bhai Saifee',
    mohallahName: 'Burhani Mohalla',
    hijriYear: '1447 Hijri',
    breakdown: {
      'Khums': 28000,
      'Zakat-ul-Maal': 18000,
      'Zakat-ul-Fitr': 2500,
      'Kaffarah': 1000,
      'Haqqun-Nafs': 3000,
      'Nazr-ul-Malaeka': 1500,
      'General Wajebaat': 0,
    },
    totalTakhmeen: 54000,
    totalPaid: 0,
    balanceDue: 54000,
    takhmeenDate: '2026-08-01',
    status: 'Pledged',
    notes: 'First time business setup pledge',
  },
  {
    id: 'wt-4',
    itsNumber: '50291844',
    hofName: 'Mustafa Bhai Najmi',
    mohallahName: 'Najmi Mohalla',
    hijriYear: '1447 Hijri',
    breakdown: {
      'Khums': 75000,
      'Zakat-ul-Maal': 45000,
      'Zakat-ul-Fitr': 4500,
      'Kaffarah': 2500,
      'Haqqun-Nafs': 8000,
      'Nazr-ul-Malaeka': 5000,
      'General Wajebaat': 0,
    },
    totalTakhmeen: 140000,
    totalPaid: 140000,
    balanceDue: 0,
    takhmeenDate: '2026-07-10',
    status: 'Paid',
  },
];

export const INITIAL_WAJEBAAT_RECEIPTS: WajebaatReceipt[] = [
  {
    id: 'wrec-1',
    receiptNo: 'WAJ-1447-001',
    takhmeenId: 'wt-1',
    itsNumber: '30489122',
    hofName: 'Mulla Shabbir Bhai Burhani',
    hijriYear: '1447 Hijri',
    category: 'Khums',
    amount: 45000,
    paymentMode: 'Bank Transfer',
    transactionRef: 'NEFT-SBIN-99482',
    date: '2026-08-01',
    collectedBy: 'admin',
    receivedFrom: 'Self',
    isCancelled: false,
  },
  {
    id: 'wrec-2',
    receiptNo: 'WAJ-1447-002',
    takhmeenId: 'wt-1',
    itsNumber: '30489122',
    hofName: 'Mulla Shabbir Bhai Burhani',
    hijriYear: '1447 Hijri',
    category: 'Zakat-ul-Maal',
    amount: 37000,
    paymentMode: 'Cheque',
    transactionRef: 'CHQ#990182',
    date: '2026-08-01',
    collectedBy: 'admin',
    receivedFrom: 'Self',
    isCancelled: false,
  },
  {
    id: 'wrec-3',
    receiptNo: 'WAJ-1447-003',
    takhmeenId: 'wt-2',
    itsNumber: '40392188',
    hofName: 'Shaikh Murtaza Bhai Badri',
    hijriYear: '1447 Hijri',
    category: 'Khums',
    amount: 70000,
    paymentMode: 'UPI',
    transactionRef: 'UPI/440291028',
    date: '2026-08-15',
    collectedBy: 'cashier',
    receivedFrom: 'Self',
    isCancelled: false,
  },
  {
    id: 'wrec-4',
    receiptNo: 'WAJ-1447-004',
    takhmeenId: 'wt-2',
    itsNumber: '40392188',
    hofName: 'Shaikh Murtaza Bhai Badri',
    hijriYear: '1447 Hijri',
    category: 'Zakat-ul-Fitr',
    amount: 4000,
    paymentMode: 'Cash',
    date: '2026-08-20',
    collectedBy: 'cashier',
    receivedFrom: 'Self',
    isCancelled: true,
    cancelledAt: '2026-08-21',
    cancelledBy: 'janabadmin',
    cancellationReason: 'Currency mismatch counter error',
  },
];

export const getStoredWajebaatYears = (): WajebaatYearMaster[] => {
  const d = localStorage.getItem(WAJEBAAT_YEARS_KEY);
  if (!d) {
    localStorage.setItem(WAJEBAAT_YEARS_KEY, JSON.stringify(INITIAL_WAJEBAAT_YEARS));
    return INITIAL_WAJEBAAT_YEARS;
  }
  try { return JSON.parse(d); } catch { return INITIAL_WAJEBAAT_YEARS; }
};

export const saveStoredWajebaatYears = (items: WajebaatYearMaster[]) => {
  localStorage.setItem(WAJEBAAT_YEARS_KEY, JSON.stringify(items));
};

export const getStoredWajebaatTakhmeens = (): WajebaatTakhmeen[] => {
  const d = localStorage.getItem(WAJEBAAT_TAKHMEN_KEY);
  if (!d) {
    localStorage.setItem(WAJEBAAT_TAKHMEN_KEY, JSON.stringify(INITIAL_WAJEBAAT_TAKHMEN));
    return INITIAL_WAJEBAAT_TAKHMEN;
  }
  try { return JSON.parse(d); } catch { return INITIAL_WAJEBAAT_TAKHMEN; }
};

export const saveStoredWajebaatTakhmeens = (items: WajebaatTakhmeen[]) => {
  localStorage.setItem(WAJEBAAT_TAKHMEN_KEY, JSON.stringify(items));
};

export const getStoredWajebaatReceipts = (): WajebaatReceipt[] => {
  const d = localStorage.getItem(WAJEBAAT_RECEIPTS_KEY);
  if (!d) {
    localStorage.setItem(WAJEBAAT_RECEIPTS_KEY, JSON.stringify(INITIAL_WAJEBAAT_RECEIPTS));
    return INITIAL_WAJEBAAT_RECEIPTS;
  }
  try { return JSON.parse(d); } catch { return INITIAL_WAJEBAAT_RECEIPTS; }
};

export const saveStoredWajebaatReceipts = (items: WajebaatReceipt[]) => {
  localStorage.setItem(WAJEBAAT_RECEIPTS_KEY, JSON.stringify(items));
};

// ============================================================================
// 4. RENT MANAGEMENT (Jamaat Properties, Tenants & Agreements)
// ============================================================================

export type PropertyType = 'Commercial Shop' | 'Residential Flat' | 'Godown / Storage' | 'Office Gala' | 'Open Plot';

export interface JamaatProperty {
  id: string;
  propertyCode: string;
  name: string;
  propertyType: PropertyType;
  address: string;
  builtUpSqFt: number;
  monthlyRentalSlab: number;
  status: 'Occupied' | 'Vacant' | 'Under Renovation';
  currentTenantId?: string;
  meterNumber?: string;
  notes?: string;
}

export interface JamaatTenant {
  id: string;
  tenantCode: string;
  name: string;
  isMumin: boolean;
  itsNumber?: string;
  contactNumber: string;
  alternatePhone?: string;
  email?: string;
  aadhaarOrGst: string;
  permanentAddress: string;
  emergencyContact: string;
  currentPropertyId?: string;
  status: 'Active' | 'Former' | 'Blacklisted';
}

export interface RentAgreement {
  id: string;
  agreementNo: string;
  propertyId: string;
  propertyCode: string;
  propertyName: string;
  tenantId: string;
  tenantName: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  securityDeposit: number;
  incrementPercentage: number;
  paymentDueDay: number; // day of month e.g. 5th
  status: 'Active' | 'Expiring Soon' | 'Expired' | 'Terminated';
  agreementDocRef?: string;
  notes?: string;
}

export interface RentReceipt {
  id: string;
  receiptNo: string;
  agreementId: string;
  propertyId: string;
  propertyName: string;
  tenantId: string;
  tenantName: string;
  forMonth: string; // e.g. "October 2026"
  amount: number;
  paymentMode: PaymentMode;
  transactionRef?: string;
  date: string;
  financialYear: string;
  collectedBy: string;
  notes?: string;
  isCancelled: boolean;
  cancelledAt?: string;
  cancelledBy?: string;
  cancellationReason?: string;
}

export const RENT_PROPERTIES_KEY = 'jamat_rent_properties_v1';
export const RENT_TENANTS_KEY = 'jamat_rent_tenants_v1';
export const RENT_AGREEMENTS_KEY = 'jamat_rent_agreements_v1';
export const RENT_RECEIPTS_KEY = 'jamat_rent_receipts_v1';

export const INITIAL_PROPERTIES: JamaatProperty[] = [
  { id: 'prop-1', propertyCode: 'BP-SH-01', name: 'Burhani Park Gala Shop #1', propertyType: 'Commercial Shop', address: 'Ground Floor, Commercial Wing, Burhani Park', builtUpSqFt: 350, monthlyRentalSlab: 18500, status: 'Occupied', currentTenantId: 'ten-1', meterNumber: 'MSEB-883910' },
  { id: 'prop-2', propertyCode: 'BP-SH-02', name: 'Burhani Park Gala Shop #2', propertyType: 'Commercial Shop', address: 'Ground Floor, Commercial Wing, Burhani Park', builtUpSqFt: 400, monthlyRentalSlab: 21000, status: 'Occupied', currentTenantId: 'ten-2', meterNumber: 'MSEB-883911' },
  { id: 'prop-3', propertyCode: 'BP-FL-101', name: 'Al-Huda Residential Flat #101', propertyType: 'Residential Flat', address: '1st Floor, Al-Huda Heights, Burhani Park', builtUpSqFt: 780, monthlyRentalSlab: 14000, status: 'Occupied', currentTenantId: 'ten-3', meterNumber: 'MSEB-772102' },
  { id: 'prop-4', propertyCode: 'BP-FL-203', name: 'Al-Huda Residential Flat #203', propertyType: 'Residential Flat', address: '2nd Floor, Al-Huda Heights, Burhani Park', builtUpSqFt: 850, monthlyRentalSlab: 15500, status: 'Vacant', notes: 'Freshly painted and available for lease' },
  { id: 'prop-5', propertyCode: 'BP-GD-01', name: 'Central Jamaat Godown / Basement Gala', propertyType: 'Godown / Storage', address: 'Basement Storage Area, Saifee Complex', builtUpSqFt: 1200, monthlyRentalSlab: 25000, status: 'Occupied', currentTenantId: 'ten-4' },
];

export const INITIAL_TENANTS: JamaatTenant[] = [
  { id: 'ten-1', tenantCode: 'TEN-001', name: 'Burhanuddin Hardware & Sanitary', isMumin: true, itsNumber: '30489122', contactNumber: '+91 98200 11223', email: 'burhan.hardware@gmail.com', aadhaarOrGst: '27AAAAA0000A1Z5', permanentAddress: '102 Saifee Mohalla, Burhani Park', emergencyContact: '+91 98200 99887', currentPropertyId: 'prop-1', status: 'Active' },
  { id: 'ten-2', tenantCode: 'TEN-002', name: 'Rajesh Optical & Eye Care Clinic', isMumin: false, contactNumber: '+91 98221 44556', email: 'rajesh.opticals@gmail.com', aadhaarOrGst: '8849 2019 3392', permanentAddress: '44 Station Road, Civil Lines', emergencyContact: '+91 98221 00991', currentPropertyId: 'prop-2', status: 'Active' },
  { id: 'ten-3', tenantCode: 'TEN-003', name: 'Mulla Abbas Bhai Electricwala', isMumin: true, itsNumber: '20394811', contactNumber: '+91 98199 44332', email: 'abbas.electric@gmail.com', aadhaarOrGst: '4920 1827 4481', permanentAddress: 'Flat 101, Al-Huda Heights', emergencyContact: '+91 98199 00112', currentPropertyId: 'prop-3', status: 'Active' },
  { id: 'ten-4', tenantCode: 'TEN-004', name: 'Badri Trading & Logistics Godown', isMumin: true, itsNumber: '40392188', contactNumber: '+91 98201 55667', email: 'badri.logistics@gmail.com', aadhaarOrGst: '27BBBBB1111B2Z9', permanentAddress: '15 Badri Mohalla', emergencyContact: '+91 98201 11223', currentPropertyId: 'prop-5', status: 'Active' },
];

export const INITIAL_AGREEMENTS: RentAgreement[] = [
  { id: 'agr-1', agreementNo: 'AGR-2025-01', propertyId: 'prop-1', propertyCode: 'BP-SH-01', propertyName: 'Burhani Park Gala Shop #1', tenantId: 'ten-1', tenantName: 'Burhanuddin Hardware & Sanitary', startDate: '2025-01-01', endDate: '2026-12-31', monthlyRent: 18500, securityDeposit: 75000, incrementPercentage: 5, paymentDueDay: 5, status: 'Active' },
  { id: 'agr-2', agreementNo: 'AGR-2025-02', propertyId: 'prop-2', propertyCode: 'BP-SH-02', propertyName: 'Burhani Park Gala Shop #2', tenantId: 'ten-2', tenantName: 'Rajesh Optical & Eye Care Clinic', startDate: '2025-04-01', endDate: '2027-03-31', monthlyRent: 21000, securityDeposit: 100000, incrementPercentage: 7, paymentDueDay: 7, status: 'Active' },
  { id: 'agr-3', agreementNo: 'AGR-2025-03', propertyId: 'prop-3', propertyCode: 'BP-FL-101', propertyName: 'Al-Huda Residential Flat #101', tenantId: 'ten-3', tenantName: 'Mulla Abbas Bhai Electricwala', startDate: '2025-06-01', endDate: '2026-05-31', monthlyRent: 14000, securityDeposit: 50000, incrementPercentage: 5, paymentDueDay: 10, status: 'Active' },
  { id: 'agr-4', agreementNo: 'AGR-2024-04', propertyId: 'prop-5', propertyCode: 'BP-GD-01', propertyName: 'Central Jamaat Godown / Basement Gala', tenantId: 'ten-4', tenantName: 'Badri Trading & Logistics Godown', startDate: '2024-11-01', endDate: '2026-10-31', monthlyRent: 25000, securityDeposit: 150000, incrementPercentage: 10, paymentDueDay: 5, status: 'Expiring Soon' },
];

export const INITIAL_RENT_RECEIPTS: RentReceipt[] = [
  { id: 'rrec-1', receiptNo: 'RENT-2026-101', agreementId: 'agr-1', propertyId: 'prop-1', propertyName: 'Burhani Park Gala Shop #1', tenantId: 'ten-1', tenantName: 'Burhanuddin Hardware & Sanitary', forMonth: 'September 2026', amount: 18500, paymentMode: 'Bank Transfer', transactionRef: 'NEFT-88492018', date: '2026-09-04', financialYear: '1447-1448 Hijri', collectedBy: 'admin', isCancelled: false },
  { id: 'rrec-2', receiptNo: 'RENT-2026-102', agreementId: 'agr-2', propertyId: 'prop-2', propertyName: 'Burhani Park Gala Shop #2', tenantId: 'ten-2', tenantName: 'Rajesh Optical & Eye Care Clinic', forMonth: 'September 2026', amount: 21000, paymentMode: 'Cheque', transactionRef: 'CHQ#449102', date: '2026-09-06', financialYear: '1447-1448 Hijri', collectedBy: 'admin', isCancelled: false },
  { id: 'rrec-3', receiptNo: 'RENT-2026-103', agreementId: 'agr-3', propertyId: 'prop-3', propertyName: 'Al-Huda Residential Flat #101', tenantId: 'ten-3', tenantName: 'Mulla Abbas Bhai Electricwala', forMonth: 'September 2026', amount: 14000, paymentMode: 'UPI', transactionRef: 'UPI/9910291', date: '2026-09-08', financialYear: '1447-1448 Hijri', collectedBy: 'cashier', isCancelled: false },
  { id: 'rrec-4', receiptNo: 'RENT-2026-104', agreementId: 'agr-1', propertyId: 'prop-1', propertyName: 'Burhani Park Gala Shop #1', tenantId: 'ten-1', tenantName: 'Burhanuddin Hardware & Sanitary', forMonth: 'October 2026', amount: 18500, paymentMode: 'Cash', date: '2026-10-04', financialYear: '1447-1448 Hijri', collectedBy: 'cashier', isCancelled: false },
  { id: 'rrec-5', receiptNo: 'RENT-2026-105', agreementId: 'agr-2', propertyId: 'prop-2', propertyName: 'Burhani Park Gala Shop #2', tenantId: 'ten-2', tenantName: 'Rajesh Optical & Eye Care Clinic', forMonth: 'October 2026', amount: 10000, paymentMode: 'Cash', date: '2026-10-07', financialYear: '1447-1448 Hijri', collectedBy: 'cashier', isCancelled: true, cancelledAt: '2026-10-08', cancelledBy: 'janabadmin', cancellationReason: 'Tenant gave wrong cheque number in voucher' },
];

export const getStoredProperties = (): JamaatProperty[] => {
  const d = localStorage.getItem(RENT_PROPERTIES_KEY);
  if (!d) {
    localStorage.setItem(RENT_PROPERTIES_KEY, JSON.stringify(INITIAL_PROPERTIES));
    return INITIAL_PROPERTIES;
  }
  try { return JSON.parse(d); } catch { return INITIAL_PROPERTIES; }
};

export const saveStoredProperties = (items: JamaatProperty[]) => {
  localStorage.setItem(RENT_PROPERTIES_KEY, JSON.stringify(items));
};

export const getStoredTenants = (): JamaatTenant[] => {
  const d = localStorage.getItem(RENT_TENANTS_KEY);
  if (!d) {
    localStorage.setItem(RENT_TENANTS_KEY, JSON.stringify(INITIAL_TENANTS));
    return INITIAL_TENANTS;
  }
  try { return JSON.parse(d); } catch { return INITIAL_TENANTS; }
};

export const saveStoredTenants = (items: JamaatTenant[]) => {
  localStorage.setItem(RENT_TENANTS_KEY, JSON.stringify(items));
};

export const getStoredAgreements = (): RentAgreement[] => {
  const d = localStorage.getItem(RENT_AGREEMENTS_KEY);
  if (!d) {
    localStorage.setItem(RENT_AGREEMENTS_KEY, JSON.stringify(INITIAL_AGREEMENTS));
    return INITIAL_AGREEMENTS;
  }
  try { return JSON.parse(d); } catch { return INITIAL_AGREEMENTS; }
};

export const saveStoredAgreements = (items: RentAgreement[]) => {
  localStorage.setItem(RENT_AGREEMENTS_KEY, JSON.stringify(items));
};

export const getStoredRentReceipts = (): RentReceipt[] => {
  const d = localStorage.getItem(RENT_RECEIPTS_KEY);
  if (!d) {
    localStorage.setItem(RENT_RECEIPTS_KEY, JSON.stringify(INITIAL_RENT_RECEIPTS));
    return INITIAL_RENT_RECEIPTS;
  }
  try { return JSON.parse(d); } catch { return INITIAL_RENT_RECEIPTS; }
};

export const saveStoredRentReceipts = (items: RentReceipt[]) => {
  localStorage.setItem(RENT_RECEIPTS_KEY, JSON.stringify(items));
};
