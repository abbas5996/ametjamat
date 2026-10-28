/**
 * Faiz ul Mawaidil Burhaniyah (FMB) - Part 1 Suite Data Models & LocalStorage Management
 * Authentic Dawoodi Bohra Jamaat ERP standards [cite: 24-40, 52]
 */

export interface FmbDashboardMetricDrilldown {
  id: string;
  itsNumber: string;
  name: string;
  sabeelNo: string;
  thaaliNo: string;
  mohalla: string;
  takhmeenAmount: number;
  paidAmount: number;
  pendingAmount: number;
  thaaliStatus: 'Taking' | 'Not Taking' | 'Vacation';
  takhmeenStatus: 'Done' | 'Not Done';
}

export interface FmbInstallmentScheduleItem {
  id: string;
  name: string;
  arabicName: string;
  hijriDate: string;
  targetPercentage: number;
  totalTakhmeenDue: number;
  collectedAmount: number;
  pendingAmount: number;
  notes?: string;
}

export interface DefaultTakhmeenYearConfig {
  id: string;
  selectedYear: string;
  isDefault: boolean;
  effectiveFrom: string;
  effectiveTo: string;
  status: 'Active' | 'Archived';
  remarks: string;
  lastUpdated: string;
  updatedBy: string;
}

export interface NiyazOpeningBalanceItem {
  id: string;
  openingBal: number;
  openingDate: string;
  type: 'Bank' | 'Cash' | 'Reserve' | 'Endowment';
  accountNo: string;
  bankName: string;
  branchName: string;
  ifscCode: string;
  notes?: string;
  createdAt?: string;
}

export interface ShowDueOnReceiptConfig {
  showPreviousDuesOnReceipt: boolean;
  showCurrentYearPendingBalance: boolean;
  showDuesOnTakhmeenForm: boolean;
  showThaaliNumber: boolean;
  showSabeelNumber: boolean;
  showItsQrCode: boolean;
  includeSabeelDuesInNotice: boolean;
  showInstallmentBreakdownOnTakhmeen: boolean;
  receiptHeaderArabic: string;
  customFooterNote: string;
  lastUpdated: string;
}

export interface ExpenseHeadItem {
  id: string;
  code: string;
  name: string;
  description: string;
  budgetCap: number;
  isActive: boolean;
}

export type ExpenseTransactionType = 'Cash' | 'Cheque' | 'Online' | 'Standing Order';

export interface NiyazExpenseEntryItem {
  id: string;
  voucherNo: string;
  date: string;
  accountName: string;
  expenseHeadId: string;
  expenseHeadName: string;
  transactionType: ExpenseTransactionType;
  payeeFullName: string;
  amount: number;
  referenceNo: string;
  description: string;
  status: 'Approved' | 'Pending' | 'Paid';
  createdBy: string;
}

export interface IncomeHeadItem {
  id: string;
  code: string;
  name: string;
  description: string;
  isActive: boolean;
}

export type IncomePaymentMode = 'Cash' | 'Cheque' | 'Online' | 'NEFT/RTGS' | 'UPI';

export interface NiyazIncomeEntryItem {
  id: string;
  receiptNo: string;
  date: string;
  accountName: string;
  incomeHeadId: string;
  incomeHeadName: string;
  paymentMode: IncomePaymentMode;
  donorFullName: string;
  itsNumber: string;
  sabeelNo: string;
  amount: number;
  referenceNo: string;
  isActive: boolean;
  narration: string;
  receivedBy: string;
}

export interface AccountTransferItem {
  id: string;
  transferDate: string;
  fromAccount: string;
  toAccount: string;
  amount: number;
  transferType: 'Bank-to-Bank' | 'Cash-to-Bank' | 'Bank-to-Cash';
  referenceNo: string;
  remarks: string;
  authorizedBy: string;
  status: 'Completed' | 'Pending';
}

export interface CreditorEntryItem {
  id: string;
  supplierName: string;
  contactPerson: string;
  phone: string;
  category: string;
  invoiceNo: string;
  billDate: string;
  totalBill: number;
  paidAmount: number;
  balanceDue: number;
  dueDate: string;
  status: 'Outstanding' | 'Partially Paid' | 'Cleared';
}

export interface FmbBankMasterItem {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  branch: string;
  ifscCode: string;
  accountType: 'Current' | 'Savings' | 'Overdraft';
  openingBalance: number;
  currentBalance: number;
  status: 'Active' | 'Inactive';
}

export interface FmbTaggingItem {
  id: string;
  tagName: string;
  tagCode: string;
  tagType: 'Receipt' | 'Payment' | 'Extra Income' | 'All';
  color: string;
  description: string;
  status: 'Active' | 'Inactive';
}

export interface ReceiptNoSettingConfig {
  niyazPrefix: string;
  hoobPrefix: string;
  zabihatPrefix: string;
  mohallaWisePrefix: boolean;
  paytypeWiseSequence: boolean;
  startingNumber: number;
  currentSequence: number;
  resetAnnually: boolean;
  samplePreview: string;
  lastUpdated: string;
}

export interface FaizWaiveOffItem {
  id: string;
  itsNumber: string;
  hofName: string;
  sabeelNo: string;
  thaaliNo: string;
  mohalla: string;
  originalTakhmeen: number;
  waivedAmount: number;
  netPayable: number;
  reason: string;
  approvedBy: string;
  date: string;
  status: 'Approved' | 'Review' | 'Rejected';
}

/* ============================================================================
 * LOCAL STORAGE KEYS
 * ========================================================================= */
export const FMB_DEFAULT_YEAR_KEY = 'jamat_fmb_default_year_v1';
export const FMB_OPENING_BALANCE_KEY = 'jamat_fmb_opening_balance_v1';
export const FMB_SHOW_DUE_RECEIPT_KEY = 'jamat_fmb_show_due_receipt_v1';
export const FMB_EXPENSE_HEADS_KEY = 'jamat_fmb_expense_heads_v1';
export const FMB_EXPENSE_ENTRIES_KEY = 'jamat_fmb_expense_entries_v1';
export const FMB_INCOME_HEADS_KEY = 'jamat_fmb_income_heads_v1';
export const FMB_INCOME_ENTRIES_KEY = 'jamat_fmb_income_entries_v1';
export const FMB_ACCOUNT_TRANSFERS_KEY = 'jamat_fmb_account_transfers_v1';
export const FMB_CREDITORS_KEY = 'jamat_fmb_creditors_v1';
export const FMB_BANKS_KEY = 'jamat_fmb_banks_v1';
export const FMB_TAGS_KEY = 'jamat_fmb_tags_v1';
export const FMB_RECEIPT_SETTINGS_KEY = 'jamat_fmb_receipt_settings_v1';
export const FMB_WAIVEOFFS_KEY = 'jamat_fmb_waiveoffs_v1';
export const FMB_INSTALLMENTS_KEY = 'jamat_fmb_installments_v1';

/* ============================================================================
 * INITIAL SEED DATA
 * ========================================================================= */
export const INITIAL_INSTALLMENTS: FmbInstallmentScheduleItem[] = [
  { id: 'inst-1', name: 'Lailatul Qadr Mubarak', arabicName: 'ليلة القدر المباركة', hijriDate: '1447-09-23', targetPercentage: 25, totalTakhmeenDue: 5200000, collectedAmount: 5020000, pendingAmount: 180000, notes: 'Ramadan 23rd raat major collection drive' },
  { id: 'inst-2', name: 'Shawwal al-Mukarram', arabicName: 'شوال المكرم', hijriDate: '1447-10-15', targetPercentage: 35, totalTakhmeenDue: 5200000, collectedAmount: 4680000, pendingAmount: 520000, notes: 'Post-Eid al-Fitr reconciliation' },
  { id: 'inst-3', name: 'Zilqaad al-Haram', arabicName: 'ذو القعدة الحرام', hijriDate: '1447-11-20', targetPercentage: 50, totalTakhmeenDue: 5200000, collectedAmount: 4110000, pendingAmount: 1090000, notes: 'Milad Imam uz-Zaman (AS) installment' },
  { id: 'inst-4', name: 'Eid al-Adha (Dhul Hijjah)', arabicName: 'عيد الأضحى المبارك', hijriDate: '1447-12-10', targetPercentage: 60, totalTakhmeenDue: 5200000, collectedAmount: 3840000, pendingAmount: 1360000, notes: 'Ghadir & Zabihat contribution sync' },
  { id: 'inst-5', name: 'Moharram al-Haraam (Ashara)', arabicName: 'محرم الحرام (عاشوراء)', hijriDate: '1448-01-10', targetPercentage: 75, totalTakhmeenDue: 5200000, collectedAmount: 3250000, pendingAmount: 1950000, notes: 'Ashara Mubaraka central kitchen drive' },
  { id: 'inst-6', name: 'Safar al-Muzaffar', arabicName: 'صفر المظفر', hijriDate: '1448-02-20', targetPercentage: 85, totalTakhmeenDue: 5200000, collectedAmount: 2540000, pendingAmount: 2660000, notes: 'Chehlum Imam Husain (AS) clearance' },
  { id: 'inst-7', name: 'Milad un Nabi (Rabi al-Awwal)', arabicName: 'ميلاد النبي الأعظم (ص)', hijriDate: '1448-03-12', targetPercentage: 90, totalTakhmeenDue: 5200000, collectedAmount: 1890000, pendingAmount: 3310000, notes: 'Milad Mubarak community jaman pledge' },
  { id: 'inst-8', name: 'Rajab al-Asab', arabicName: 'رجب الأصب', hijriDate: '1448-07-27', targetPercentage: 95, totalTakhmeenDue: 5200000, collectedAmount: 1210000, pendingAmount: 3990000, notes: 'Mab\'as & Urss Mubarak collection' },
  { id: 'inst-9', name: 'Shabaan al-Kareem', arabicName: 'شعبان الكريم', hijriDate: '1448-08-15', targetPercentage: 100, totalTakhmeenDue: 5200000, collectedAmount: 780000, pendingAmount: 4420000, notes: 'Year-end full settlement prior to Ramadan' },
];

export const INITIAL_DEFAULT_YEAR: DefaultTakhmeenYearConfig = {
  id: 'dty-1447',
  selectedYear: '1447-1448 Hijri',
  isDefault: true,
  effectiveFrom: '1447-01-01',
  effectiveTo: '1447-12-29',
  status: 'Active',
  remarks: 'Official financial cycle set by Anjuman-e-Burhani FMB Committee.',
  lastUpdated: '1447-01-05',
  updatedBy: 'Shk. Mustafa Bhai Rangwala (FMB Trustee)',
};

export const INITIAL_OPENING_BALANCES: NiyazOpeningBalanceItem[] = [
  {
    id: 'nob-1',
    openingBal: 2450000,
    openingDate: '1447-01-01',
    type: 'Bank',
    accountNo: '38920194018',
    bankName: 'State Bank of India',
    branchName: 'Burhani Park Main Branch',
    ifscCode: 'SBIN0004521',
    notes: 'Primary FMB Kitchen operations operative account',
    createdAt: '1447-01-01',
  },
  {
    id: 'nob-2',
    openingBal: 1825000,
    openingDate: '1447-01-01',
    type: 'Bank',
    accountNo: '50200084729105',
    bankName: 'HDFC Bank',
    branchName: 'Saifee Hospital Extension Counter',
    ifscCode: 'HDFC0001042',
    notes: 'POS swipe machine & online gateway direct settlement',
    createdAt: '1447-01-01',
  },
  {
    id: 'nob-3',
    openingBal: 350000,
    openingDate: '1447-01-01',
    type: 'Cash',
    accountNo: 'CASH-CHEST-FMB-01',
    bankName: 'Jamaat Treasury Vault',
    branchName: 'FMB Kitchen Administrative Office',
    ifscCode: 'N/A',
    notes: 'Daily emergency market procurement petty cash balance',
    createdAt: '1447-01-01',
  },
  {
    id: 'nob-4',
    openingBal: 3500000,
    openingDate: '1447-01-01',
    type: 'Endowment',
    accountNo: 'BARB-WQF-ENDOW-882',
    bankName: 'Bank of Baroda',
    branchName: 'Fort Heritage Corporate Branch',
    ifscCode: 'BARB0FORTXX',
    notes: 'Kitchen Equipment & Modernization Waqf corpus reserve',
    createdAt: '1447-01-01',
  },
];

export const INITIAL_SHOW_DUE_CONFIG: ShowDueOnReceiptConfig = {
  showPreviousDuesOnReceipt: true,
  showCurrentYearPendingBalance: true,
  showDuesOnTakhmeenForm: true,
  showThaaliNumber: true,
  showSabeelNumber: true,
  showItsQrCode: true,
  includeSabeelDuesInNotice: false,
  showInstallmentBreakdownOnTakhmeen: true,
  receiptHeaderArabic: 'فيض الموائد البرهانية - أنجمن ميموني',
  customFooterNote: 'Dua ni iltemas. Tamam Mumineen si iltemas chhe ke FMB Takhmeen na installment waqt par ada kare ane barakat hasil kare.',
  lastUpdated: '1447-02-01',
};

export const INITIAL_EXPENSE_HEADS: ExpenseHeadItem[] = [
  { id: 'eh-1', code: 'EXP-RAT',  name: 'Raw Grains & Ration', description: 'Basmati rice, whole wheat flour, lentils, cooking oil, and sugar', budgetCap: 1500000, isActive: true },
  { id: 'eh-2', code: 'EXP-MEAT', name: 'Zabihat & Halal Meat', description: 'Fresh Halal mutton, chicken, and sheep for community Deg niyaz', budgetCap: 2200000, isActive: true },
  { id: 'eh-3', code: 'EXP-VEG',  name: 'Fresh Vegetables & Dairy', description: 'Daily fresh farm vegetables, cottage cheese (paneer), milk, curd, and butter', budgetCap: 950000, isActive: true },
  { id: 'eh-4', code: 'EXP-MAS',  name: 'Spices, Masala & Dry Fruits', description: 'Pure ghee, Kashmiri saffron, cardamom, cloves, and premium condiments', budgetCap: 450000, isActive: true },
  { id: 'eh-5', code: 'EXP-GAS',  name: 'Commercial LPG & Kitchen Fuel', description: 'Bulk industrial cylinder refills and wood logs for traditional deg cooking', budgetCap: 380000, isActive: true },
  { id: 'eh-6', code: 'EXP-PKG',  name: 'Food Grade Tiffins & Foil Packaging', description: 'Stainless steel 4-tier tiffins, seal foils, hot-boxes, and thermal bags', budgetCap: 280000, isActive: true },
  { id: 'eh-7', code: 'EXP-WAGE', name: 'Kitchen Staff Wages & Halwai', description: 'Head chefs (Bhatiyara), assistants, vegetable cutters, and cleaners', budgetCap: 1200000, isActive: true },
  { id: 'eh-8', code: 'EXP-LOG',  name: 'Thaali Delivery Van & Dispatch Logistics', description: 'Fleet fuel, CNG refills, van maintenance, and courier charges', budgetCap: 420000, isActive: true },
  { id: 'eh-9', code: 'EXP-MAINT',name: 'Deep Cleaning, AMC & Pest Control', description: 'Kitchen hygiene, deg tinning (kalai), water RO maintenance, and sanitization', budgetCap: 210000, isActive: true },
];

export const INITIAL_EXPENSE_ENTRIES: NiyazExpenseEntryItem[] = [
  {
    id: 'exp-1',
    voucherNo: 'FMB-VCH-1001',
    date: '1447-02-10',
    accountName: 'State Bank of India — FMB Kitchen A/C',
    expenseHeadId: 'eh-1',
    expenseHeadName: 'Raw Grains & Ration',
    transactionType: 'Cheque',
    payeeFullName: 'M/S Burhani Grain Merchants',
    amount: 145000,
    referenceNo: 'CHQ-778812',
    description: 'Bulk purchase of 50 bags Dehradun Basmati Rice & 30 bags Kolam',
    status: 'Paid',
    createdBy: 'taher_storekeeper',
  },
  {
    id: 'exp-2',
    voucherNo: 'FMB-VCH-1002',
    date: '1447-02-12',
    accountName: 'State Bank of India — FMB Kitchen A/C',
    expenseHeadId: 'eh-2',
    expenseHeadName: 'Zabihat & Halal Meat',
    transactionType: 'Online',
    payeeFullName: 'Al-Madina Halal Mutton Suppliers',
    amount: 198000,
    referenceNo: 'NEFT-5599021',
    description: '280 kg fresh boneless mutton for Friday community Salawat jaman',
    status: 'Paid',
    createdBy: 'mustafa_trustee',
  },
  {
    id: 'exp-3',
    voucherNo: 'FMB-VCH-1003',
    date: '1447-02-14',
    accountName: 'Jamaat Treasury Vault (Cash Chest)',
    expenseHeadId: 'eh-3',
    expenseHeadName: 'Fresh Vegetables & Dairy',
    transactionType: 'Cash',
    payeeFullName: 'APMC Market Vendor — Shri Ramesh & Sons',
    amount: 24500,
    referenceNo: 'CASH-REC-089',
    description: 'Fresh tomatoes, onions, coriander, green chilies, and 80L pure milk',
    status: 'Approved',
    createdBy: 'huzefa_cook',
  },
  {
    id: 'exp-4',
    voucherNo: 'FMB-VCH-1004',
    date: '1447-02-18',
    accountName: 'HDFC Bank — Niyaz Kitchen Collection A/C',
    expenseHeadId: 'eh-5',
    expenseHeadName: 'Commercial LPG & Kitchen Fuel',
    transactionType: 'Online',
    payeeFullName: 'Bharat Gas Commercial Agency',
    amount: 36800,
    referenceNo: 'UPI-BBPS-990182',
    description: '18 commercial 19kg cylinder deliveries for main stove bank',
    status: 'Paid',
    createdBy: 'taher_storekeeper',
  },
  {
    id: 'exp-5',
    voucherNo: 'FMB-VCH-1005',
    date: '1447-02-22',
    accountName: 'State Bank of India — FMB Kitchen A/C',
    expenseHeadId: 'eh-7',
    expenseHeadName: 'Kitchen Staff Wages & Halwai',
    transactionType: 'Standing Order',
    payeeFullName: 'FMB Kitchen Crew Monthly Payroll (8 Members)',
    amount: 98000,
    referenceNo: 'ACH-SALARY-M02',
    description: 'Monthly compensation for head cooks, helpers, and cleaning crew',
    status: 'Paid',
    createdBy: 'mustafa_trustee',
  },
];

export const INITIAL_INCOME_HEADS: IncomeHeadItem[] = [
  { id: 'inc-1', code: 'INC-HUB',   name: 'Annual FMB Hub Contribution', description: 'Core annual household pledge for 365-day barakat thaali distribution', isActive: true },
  { id: 'inc-2', code: 'INC-DAILY', name: 'Daily Barakat Thaali Contribution', description: 'Voluntary daily token offerings given by mumineen upon delivery', isActive: true },
  { id: 'inc-3', code: 'INC-ZAB',   name: 'Zabihat & Sadqah Niyaz', description: 'Specific contributions for offering Zabihat sheep on auspicious occasions', isActive: true },
  { id: 'inc-4', code: 'INC-IFT',   name: 'Ramadan Iftaar & Sehri Niyaz Sponsor', description: 'Special Ramadan daily iftaar and sehri thaali sponsorships', isActive: true },
  { id: 'inc-5', code: 'INC-DEG',   name: 'Deg Niyaz Full Sponsorship', description: 'Full Deg sponsorship for Sheer Khurma, Biryani, and Daal Chawal Palidu', isActive: true },
  { id: 'inc-6', code: 'INC-SAL',   name: 'Salawat Jaman & Miqaat Contribution', description: 'Celebratory community banquet sponsorships on Urs and Milad days', isActive: true },
  { id: 'inc-7', code: 'INC-SCRAP', name: 'Container & Recycled Scrap Sales', description: 'Revenue from recycling old oil tins, cardboard boxes, and sacks', isActive: true },
  { id: 'inc-8', code: 'INC-WQF',   name: 'Kitchen Waqf Trust Distribution', description: 'Dividends and yield from consecrated culinary waqf properties', isActive: true },
];

export const INITIAL_INCOME_ENTRIES: NiyazIncomeEntryItem[] = [
  {
    id: 'ine-1',
    receiptNo: 'FMB-REC-2001',
    date: '1447-02-05',
    accountName: 'State Bank of India — FMB Kitchen A/C',
    incomeHeadId: 'inc-1',
    incomeHeadName: 'Annual FMB Hub Contribution',
    paymentMode: 'Online',
    donorFullName: 'Shk. Mufaddal Bhai Poonawala',
    itsNumber: '30489122',
    sabeelNo: 'SAB-101',
    amount: 52000,
    referenceNo: 'TXN-99882103',
    isActive: true,
    narration: 'Annual FMB Hub settled in full for 1447H with thanks',
    receivedBy: 'fmb_admin',
  },
  {
    id: 'ine-2',
    receiptNo: 'FMB-REC-2002',
    date: '1447-02-08',
    accountName: 'HDFC Bank — Niyaz Kitchen Collection A/C',
    incomeHeadId: 'inc-5',
    incomeHeadName: 'Deg Niyaz Full Sponsorship',
    paymentMode: 'UPI',
    donorFullName: 'Mulla Abbas Bhai Rajkotwala',
    itsNumber: '20381044',
    sabeelNo: 'SAB-104',
    amount: 35000,
    referenceNo: 'UPI-23910283',
    isActive: true,
    narration: 'Deg Niyaz sponsored on occasion of Farzand Salgirah',
    receivedBy: 'taher_cashier',
  },
  {
    id: 'ine-3',
    receiptNo: 'FMB-REC-2003',
    date: '1447-02-12',
    accountName: 'Jamaat Treasury Vault (Cash Chest)',
    incomeHeadId: 'inc-3',
    incomeHeadName: 'Zabihat & Sadqah Niyaz',
    paymentMode: 'Cash',
    donorFullName: 'Mulla Huzefa Bhai Jamali',
    itsNumber: '20391823',
    sabeelNo: 'SAB-102',
    amount: 11000,
    referenceNo: 'CSH-9921',
    isActive: true,
    narration: 'Sadqah Zabihat for shifa of family elder',
    receivedBy: 'taher_cashier',
  },
  {
    id: 'ine-4',
    receiptNo: 'FMB-REC-2004',
    date: '1447-02-15',
    accountName: 'State Bank of India — FMB Kitchen A/C',
    incomeHeadId: 'inc-4',
    incomeHeadName: 'Ramadan Iftaar & Sehri Niyaz Sponsor',
    paymentMode: 'NEFT/RTGS',
    donorFullName: 'Mulla Shabbir Bhai Fakhri',
    itsNumber: '30491024',
    sabeelNo: 'SAB-103',
    amount: 75000,
    referenceNo: 'NEFT-AXIS-99218',
    isActive: true,
    narration: 'Advance pledge for Lailatul Qadr Iftaar jaman degs',
    receivedBy: 'mustafa_trustee',
  },
  {
    id: 'ine-5',
    receiptNo: 'FMB-REC-2005',
    date: '1447-02-20',
    accountName: 'Jamaat Treasury Vault (Cash Chest)',
    incomeHeadId: 'inc-7',
    incomeHeadName: 'Container & Recycled Scrap Sales',
    paymentMode: 'Cash',
    donorFullName: 'Burhani Scrap Recyclers (Ghee Tins & Bags)',
    itsNumber: 'EXTERNAL',
    sabeelNo: 'N/A',
    amount: 8400,
    referenceNo: 'CSH-SCRAP-44',
    isActive: true,
    narration: 'Disposal of 120 empty oil tins and 90 jute sacks',
    receivedBy: 'fmb_store',
  },
];

export const INITIAL_ACCOUNT_TRANSFERS: AccountTransferItem[] = [
  {
    id: 'at-1',
    transferDate: '1447-02-04',
    fromAccount: 'HDFC Bank — Niyaz Kitchen Collection A/C',
    toAccount: 'State Bank of India — FMB Kitchen A/C',
    amount: 250000,
    transferType: 'Bank-to-Bank',
    referenceNo: 'NEFT-HDFC-99120',
    remarks: 'Consolidation of weekly POS card swipe collections into main op account',
    authorizedBy: 'Janab Aamil Saheb',
    status: 'Completed',
  },
  {
    id: 'at-2',
    transferDate: '1447-02-11',
    fromAccount: 'State Bank of India — FMB Kitchen A/C',
    toAccount: 'Jamaat Treasury Vault (Cash Chest)',
    amount: 50000,
    transferType: 'Bank-to-Cash',
    referenceNo: 'CHQ-SELF-88190',
    remarks: 'Cash replenishment for emergency raw vegetable market purchases',
    authorizedBy: 'Shk. Mustafa Bhai Rangwala',
    status: 'Completed',
  },
  {
    id: 'at-3',
    transferDate: '1447-02-19',
    fromAccount: 'Jamaat Treasury Vault (Cash Chest)',
    toAccount: 'State Bank of India — FMB Kitchen A/C',
    amount: 75000,
    transferType: 'Cash-to-Bank',
    referenceNo: 'SBI-CHL-44910',
    remarks: 'Surplus cash deposited after Friday deg donation drive',
    authorizedBy: 'Taher Bhai (Cashier)',
    status: 'Completed',
  },
];

export const INITIAL_CREDITORS: CreditorEntryItem[] = [
  {
    id: 'crd-1',
    supplierName: 'M/S Burhani Grain Merchants',
    contactPerson: 'Shk. Zohair Bhai Grains',
    phone: '+91 98201 11223',
    category: 'Ration & Wholesale Grains',
    invoiceNo: 'BGM-2025/891',
    billDate: '1447-02-01',
    totalBill: 340000,
    paidAmount: 200000,
    balanceDue: 140000,
    dueDate: '1447-03-01',
    status: 'Partially Paid',
  },
  {
    id: 'crd-2',
    supplierName: 'Al-Madina Halal Mutton Suppliers',
    contactPerson: 'Mulla Murtaza Bhai',
    phone: '+91 98205 66778',
    category: 'Halal Meat & Zabihat Livestock',
    invoiceNo: 'ALM-INV-4410',
    billDate: '1447-02-05',
    totalBill: 280000,
    paidAmount: 280000,
    balanceDue: 0,
    dueDate: '1447-02-25',
    status: 'Cleared',
  },
  {
    id: 'crd-3',
    supplierName: 'Saifee Dairy Products & Ghee',
    contactPerson: 'Taher Bhai Dudhwala',
    phone: '+91 98199 44332',
    category: 'Pure Ghee, Milk & Fresh Paneer',
    invoiceNo: 'SDP-FEB-104',
    billDate: '1447-02-14',
    totalBill: 125000,
    paidAmount: 50000,
    balanceDue: 75000,
    dueDate: '1447-03-10',
    status: 'Partially Paid',
  },
  {
    id: 'crd-4',
    supplierName: 'National Gas & Appliance Co.',
    contactPerson: 'Imran Bhai Cylinder',
    phone: '+91 98202 88990',
    category: 'Commercial LPG Cylinder Distributor',
    invoiceNo: 'NGC-CYL-8821',
    billDate: '1447-02-18',
    totalBill: 48000,
    paidAmount: 0,
    balanceDue: 48000,
    dueDate: '1447-03-05',
    status: 'Outstanding',
  },
];

export const INITIAL_BANKS: FmbBankMasterItem[] = [
  {
    id: 'bnk-1',
    bankName: 'State Bank of India',
    accountNumber: '38920194018',
    accountHolderName: 'Anjuman-e-Burhani FMB Kitchen A/C',
    branch: 'Burhani Park Main Branch, Ground Floor',
    ifscCode: 'SBIN0004521',
    accountType: 'Current',
    openingBalance: 2450000,
    currentBalance: 2685000,
    status: 'Active',
  },
  {
    id: 'bnk-2',
    bankName: 'HDFC Bank Ltd.',
    accountNumber: '50200084729105',
    accountHolderName: 'Anjuman-e-Burhani Niyaz Collection A/C',
    branch: 'Saifee Hospital Extension Counter',
    ifscCode: 'HDFC0001042',
    accountType: 'Current',
    openingBalance: 1825000,
    currentBalance: 1980000,
    status: 'Active',
  },
  {
    id: 'bnk-3',
    bankName: 'Bank of Baroda',
    accountNumber: 'BARB-WQF-ENDOW-882',
    accountHolderName: 'FMB Kitchen Waqf Endowment Fund',
    branch: 'Fort Heritage Corporate Branch',
    ifscCode: 'BARB0FORTXX',
    accountType: 'Savings',
    openingBalance: 3500000,
    currentBalance: 3620000,
    status: 'Active',
  },
];

export const INITIAL_TAGS: FmbTaggingItem[] = [
  { id: 'tag-1', tagName: 'Ramadan Daily Thaali', tagCode: 'RAM-THAALI', tagType: 'All', color: '#10B981', description: 'All revenues and expenses attributed to Ramadan 30 days daily deliveries', status: 'Active' },
  { id: 'tag-2', tagName: 'Ashara Mubaraka Niyaz', tagCode: 'ASHARA-DEG', tagType: 'All', color: '#B45309', description: 'Ashara central kitchen jaman, raw material and deg expenditures', status: 'Active' },
  { id: 'tag-3', tagName: 'Milad un Nabi Mubarak', tagCode: 'MILAD-JAMAN', tagType: 'Receipt', color: '#3B82F6', description: 'Milad celebratory community jaman sponsorships and hub top-ups', status: 'Active' },
  { id: 'tag-4', tagName: 'Emergency Food Support', tagCode: 'CONCESSION-EMERGENCY', tagType: 'Payment', color: '#EF4444', description: 'Subsidized thaalis for families undergoing temporary financial hardships', status: 'Active' },
  { id: 'tag-5', tagName: 'Scrap & Can Yield', tagCode: 'EXTRA-INCOME', tagType: 'Extra Income', color: '#8B5CF6', description: 'Kitchen byproduct sales, recycled tins, empty boxes and burlap sacks', status: 'Active' },
];

export const INITIAL_RECEIPT_SETTINGS: ReceiptNoSettingConfig = {
  niyazPrefix: 'FMB-NYZ-',
  hoobPrefix: 'FMB-HUB-',
  zabihatPrefix: 'FMB-ZAB-',
  mohallaWisePrefix: false,
  paytypeWiseSequence: false,
  startingNumber: 1001,
  currentSequence: 2006,
  resetAnnually: true,
  samplePreview: 'FMB-HUB-1447-02006',
  lastUpdated: '1447-01-15',
};

export const INITIAL_WAIVEOFFS: FaizWaiveOffItem[] = [
  {
    id: 'wo-1',
    itsNumber: '30491024',
    hofName: 'Mulla Taher Bhai Vajihi',
    sabeelNo: 'SAB-103',
    thaaliNo: 'TH-084',
    mohalla: 'Badri Mohallah (Sector C)',
    originalTakhmeen: 52000,
    waivedAmount: 18000,
    netPayable: 34000,
    reason: 'Medical hardship of elderly mother; approved 35% concession by Jamaat Janab Aamil Saheb',
    approvedBy: 'Janab Aamil Saheb',
    date: '1447-01-20',
    status: 'Approved',
  },
  {
    id: 'wo-2',
    itsNumber: '20391002',
    hofName: 'Shaikh Burhanuddin Bhai Mithaiwala',
    sabeelNo: 'SAB-112',
    thaaliNo: 'TH-119',
    mohalla: 'Najmi Mohallah (Sector D)',
    originalTakhmeen: 52000,
    waivedAmount: 26000,
    netPayable: 26000,
    reason: 'New small retail business startup under Qardan Hasana guidance',
    approvedBy: 'FMB Executive Committee',
    date: '1447-02-02',
    status: 'Approved',
  },
  {
    id: 'wo-3',
    itsNumber: '20381992',
    hofName: 'Mulla Juzer Bhai Kapasi',
    sabeelNo: 'SAB-148',
    thaaliNo: 'TH-203',
    mohalla: 'Burhani Mohallah (Sector B)',
    originalTakhmeen: 52000,
    waivedAmount: 12000,
    netPayable: 40000,
    reason: 'Under review by Welfare Committee regarding student fees overlap',
    approvedBy: 'Pending Welfare Committee',
    date: '1447-02-18',
    status: 'Review',
  },
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
    // Trigger custom window storage event for instant single-page reactivity
    window.dispatchEvent(new CustomEvent('fmb_storage_update', { detail: { key } }));
  } catch (err) {
    console.error(`Failed to save ${key}:`, err);
  }
}

// 1. Installments
export const getStoredInstallments = (): FmbInstallmentScheduleItem[] =>
  getFromStorage(FMB_INSTALLMENTS_KEY, INITIAL_INSTALLMENTS);
export const saveStoredInstallments = (v: FmbInstallmentScheduleItem[]): void =>
  saveToStorage(FMB_INSTALLMENTS_KEY, v);

// 2. Default Year
export const getStoredDefaultYear = (): DefaultTakhmeenYearConfig =>
  getFromStorage(FMB_DEFAULT_YEAR_KEY, INITIAL_DEFAULT_YEAR);
export const saveStoredDefaultYear = (v: DefaultTakhmeenYearConfig): void =>
  saveToStorage(FMB_DEFAULT_YEAR_KEY, v);

// 3. Opening Balance
export const getStoredOpeningBalances = (): NiyazOpeningBalanceItem[] =>
  getFromStorage(FMB_OPENING_BALANCE_KEY, INITIAL_OPENING_BALANCES);
export const saveStoredOpeningBalances = (v: NiyazOpeningBalanceItem[]): void =>
  saveToStorage(FMB_OPENING_BALANCE_KEY, v);

// 4. Show Due on Receipt Config
export const getStoredShowDueConfig = (): ShowDueOnReceiptConfig =>
  getFromStorage(FMB_SHOW_DUE_RECEIPT_KEY, INITIAL_SHOW_DUE_CONFIG);
export const saveStoredShowDueConfig = (v: ShowDueOnReceiptConfig): void =>
  saveToStorage(FMB_SHOW_DUE_RECEIPT_KEY, v);

// 5. Expense Heads & Entries
export const getStoredExpenseHeads = (): ExpenseHeadItem[] =>
  getFromStorage(FMB_EXPENSE_HEADS_KEY, INITIAL_EXPENSE_HEADS);
export const saveStoredExpenseHeads = (v: ExpenseHeadItem[]): void =>
  saveToStorage(FMB_EXPENSE_HEADS_KEY, v);

export const getStoredExpenseEntries = (): NiyazExpenseEntryItem[] =>
  getFromStorage(FMB_EXPENSE_ENTRIES_KEY, INITIAL_EXPENSE_ENTRIES);
export const saveStoredExpenseEntries = (v: NiyazExpenseEntryItem[]): void =>
  saveToStorage(FMB_EXPENSE_ENTRIES_KEY, v);

// 6. Income Heads & Entries
export const getStoredIncomeHeads = (): IncomeHeadItem[] =>
  getFromStorage(FMB_INCOME_HEADS_KEY, INITIAL_INCOME_HEADS);
export const saveStoredIncomeHeads = (v: IncomeHeadItem[]): void =>
  saveToStorage(FMB_INCOME_HEADS_KEY, v);

export const getStoredIncomeEntries = (): NiyazIncomeEntryItem[] =>
  getFromStorage(FMB_INCOME_ENTRIES_KEY, INITIAL_INCOME_ENTRIES);
export const saveStoredIncomeEntries = (v: NiyazIncomeEntryItem[]): void =>
  saveToStorage(FMB_INCOME_ENTRIES_KEY, v);

// 7. Additional Masters
export const getStoredAccountTransfers = (): AccountTransferItem[] =>
  getFromStorage(FMB_ACCOUNT_TRANSFERS_KEY, INITIAL_ACCOUNT_TRANSFERS);
export const saveStoredAccountTransfers = (v: AccountTransferItem[]): void =>
  saveToStorage(FMB_ACCOUNT_TRANSFERS_KEY, v);

export const getStoredCreditors = (): CreditorEntryItem[] =>
  getFromStorage(FMB_CREDITORS_KEY, INITIAL_CREDITORS);
export const saveStoredCreditors = (v: CreditorEntryItem[]): void =>
  saveToStorage(FMB_CREDITORS_KEY, v);

export const getStoredBanks = (): FmbBankMasterItem[] =>
  getFromStorage(FMB_BANKS_KEY, INITIAL_BANKS);
export const saveStoredBanks = (v: FmbBankMasterItem[]): void =>
  saveToStorage(FMB_BANKS_KEY, v);

export const getStoredTags = (): FmbTaggingItem[] =>
  getFromStorage(FMB_TAGS_KEY, INITIAL_TAGS);
export const saveStoredTags = (v: FmbTaggingItem[]): void =>
  saveToStorage(FMB_TAGS_KEY, v);

export const getStoredReceiptSettings = (): ReceiptNoSettingConfig =>
  getFromStorage(FMB_RECEIPT_SETTINGS_KEY, INITIAL_RECEIPT_SETTINGS);
export const saveStoredReceiptSettings = (v: ReceiptNoSettingConfig): void =>
  saveToStorage(FMB_RECEIPT_SETTINGS_KEY, v);

export const getStoredWaiveOffs = (): FaizWaiveOffItem[] =>
  getFromStorage(FMB_WAIVEOFFS_KEY, INITIAL_WAIVEOFFS);
export const saveStoredWaiveOffs = (v: FaizWaiveOffItem[]): void =>
  saveToStorage(FMB_WAIVEOFFS_KEY, v);
