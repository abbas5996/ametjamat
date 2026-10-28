/**
 * Part 3 Data Management Utilities & LocalStorage Synchronization
 * 
 * Authentic Community Workflow Standards for:
 * 1. QARDAN HASANAH (Qard-e-Hasana / Interest-free Loan System)
 * 2. ACCOUNTS MANAGER (Double-Entry Financial Accounting)
 * 3. MADRESA MODULE (Deaniyah Education Management - Al-Madrasa al-Saifiyah)
 * 4. MIQAAT MANAGEMENT & ASHARA OHBAT (Community Events & Ashara Mubaraka Planning)
 */

export type PaymentMode = 'Cash' | 'Cheque' | 'Bank Transfer' | 'NEFT/RTGS' | 'UPI';

// ============================================================================
// 1. QARDAN HASANAH (Qard-e-Hasana Loan System)
// ============================================================================

export interface QardanFundCategory {
  id: string;
  name: string;
  code: string;
  description: string;
  totalCorpus: number;
  availableCorpus: number;
  isActive: boolean;
}

export interface QardanBankAccount {
  id: string;
  accountName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  currentBalance: number;
  isActive: boolean;
}

export interface QardanScheme {
  id: string;
  schemeName: string; // e.g. Makan / Housing, Taleem / Education, Sehat / Medical, Nikah / Marriage, Tijarat / Business
  code: string;
  fundCategoryId: string;
  maxAmount: number;
  maxTenureMonths: number;
  minGuarantors: number;
  gracePeriodMonths: number;
  isActive: boolean;
}

export type QardanApplicationStatus = 'APPLIED' | 'UNDER_REVIEW' | 'SANCTIONED' | 'DISBURSED' | 'REJECTED' | 'CLOSED';

export interface QardanGuarantor {
  id: string;
  itsNumber: string;
  name: string;
  mohallah: string;
  mobile: string;
  relation: string;
  maxGuaranteedLiability: number;
  activeGuaranteesCount: number;
  status: 'ACTIVE' | 'FLAGGED';
}

export interface QardanApplication {
  id: string;
  applicationNo: string;
  itsNumber: string;
  applicantName: string;
  mohallah: string;
  mobile: string;
  schemeId: string;
  schemeName: string;
  requestedAmount: number;
  purpose: string;
  tenureMonths: number;
  appliedDate: string;
  status: QardanApplicationStatus;
  
  // Committee Sanction Details
  sanctionedAmount?: number;
  sanctionedDate?: string;
  sanctionRemarks?: string;
  sanctionedBy?: string;
  monthlyInstallment?: number;

  // Guarantors (Zamin)
  guarantor1Its: string;
  guarantor1Name: string;
  guarantor1Contact: string;
  guarantor2Its?: string;
  guarantor2Name?: string;
  guarantor2Contact?: string;

  // Disbursement Details
  disbursedAmount?: number;
  disbursedDate?: string;
  disbursedBankAccountId?: string;
  chequeOrRefNo?: string;

  // Repayment Status
  totalRepaid: number;
  outstandingBalance: number;
}

export interface QardanInstallmentReceipt {
  id: string;
  receiptNo: string;
  applicationId: string;
  applicationNo: string;
  itsNumber: string;
  applicantName: string;
  amount: number;
  installmentNo: number;
  paymentMode: PaymentMode;
  transactionRef?: string;
  date: string;
  receivedBy: string;
  remainingBalanceAfter: number;
  isCancelled?: boolean;
}

// Storage Keys
export const QARDAN_FUNDS_KEY = 'jamat_qardan_funds_v1';
export const QARDAN_ACCOUNTS_KEY = 'jamat_qardan_accounts_v1';
export const QARDAN_SCHEMES_KEY = 'jamat_qardan_schemes_v1';
export const QARDAN_APPLICATIONS_KEY = 'jamat_qardan_applications_v1';
export const QARDAN_GUARANTORS_KEY = 'jamat_qardan_guarantors_v1';
export const QARDAN_RECEIPTS_KEY = 'jamat_qardan_receipts_v1';

// Initial Mock Data - Qardan
export const INITIAL_QARDAN_FUNDS: QardanFundCategory[] = [
  { id: 'qf-1', name: 'General Qardan Hasana Corpus', code: 'QARDAN-GEN', description: 'Central Jamaat revolving interest-free fund', totalCorpus: 5000000, availableCorpus: 3150000, isActive: true },
  { id: 'qf-2', name: 'Makan / Housing Welfare Fund', code: 'QARDAN-MAKAN', description: 'Dedicated housing construction and flat booking loans', totalCorpus: 3500000, availableCorpus: 1400000, isActive: true },
  { id: 'qf-3', name: 'Taleem / Education Endowment', code: 'QARDAN-TALEEM', description: 'Higher studies, university degrees, and overseas schooling', totalCorpus: 2000000, availableCorpus: 1250000, isActive: true },
  { id: 'qf-4', name: 'Tijarat / Business Advancement Fund', code: 'QARDAN-TIJARAT', description: 'MSME seed capital, shop renovation, and seasonal inventory', totalCorpus: 4000000, availableCorpus: 2100000, isActive: true },
];

export const INITIAL_QARDAN_ACCOUNTS: QardanBankAccount[] = [
  { id: 'qa-1', accountName: 'Burhani Qardan Main A/C', bankName: 'Burhani Cooperative Bank', accountNumber: 'BCB-00892011', ifscCode: 'BCBL0001002', currentBalance: 2450000, isActive: true },
  { id: 'qa-2', accountName: 'Jamaat Treasury SBI A/C', bankName: 'State Bank of India', accountNumber: 'SBI-3091882001', ifscCode: 'SBIN0004122', currentBalance: 4800000, isActive: true },
  { id: 'qa-3', accountName: 'Office Vault Cash in Safe', bankName: 'Jamaat Cash Vault', accountNumber: 'VAULT-01', ifscCode: 'N/A', currentBalance: 285000, isActive: true },
];

export const INITIAL_QARDAN_SCHEMES: QardanScheme[] = [
  { id: 'qs-1', schemeName: 'Makan (Housing Assistance)', code: 'SCH-MAKAN', fundCategoryId: 'qf-2', maxAmount: 1000000, maxTenureMonths: 36, minGuarantors: 2, gracePeriodMonths: 2, isActive: true },
  { id: 'qs-2', schemeName: 'Taleem (Higher Education)', code: 'SCH-TALEEM', fundCategoryId: 'qf-3', maxAmount: 500000, maxTenureMonths: 24, minGuarantors: 2, gracePeriodMonths: 3, isActive: true },
  { id: 'qs-3', schemeName: 'Sehat (Medical Emergency)', code: 'SCH-SEHAT', fundCategoryId: 'qf-1', maxAmount: 250000, maxTenureMonths: 18, minGuarantors: 1, gracePeriodMonths: 1, isActive: true },
  { id: 'qs-4', schemeName: 'Nikah (Marriage Support)', code: 'SCH-NIKAH', fundCategoryId: 'qf-1', maxAmount: 300000, maxTenureMonths: 20, minGuarantors: 2, gracePeriodMonths: 1, isActive: true },
  { id: 'qs-5', schemeName: 'Tijarat (Business Enterprise)', code: 'SCH-TIJARAT', fundCategoryId: 'qf-4', maxAmount: 800000, maxTenureMonths: 24, minGuarantors: 2, gracePeriodMonths: 1, isActive: true },
];

export const INITIAL_QARDAN_GUARANTORS: QardanGuarantor[] = [
  { id: 'qg-1', itsNumber: '30489122', name: 'Mulla Shabbir Bhai Burhani', mohallah: 'Burhani Mohallah', mobile: '9820011223', relation: 'Uncle / Business Partner', maxGuaranteedLiability: 1500000, activeGuaranteesCount: 1, status: 'ACTIVE' },
  { id: 'qg-2', itsNumber: '20394811', name: 'Shaikh Taher Bhai Rampurawala', mohallah: 'Saifee Mohallah', mobile: '9821144556', relation: 'Father-in-law', maxGuaranteedLiability: 2000000, activeGuaranteesCount: 1, status: 'ACTIVE' },
  { id: 'qg-3', itsNumber: '40392188', name: 'Shaikh Murtaza Bhai Badri', mohallah: 'Badri Mohallah', mobile: '9833322114', relation: 'Family Friend', maxGuaranteedLiability: 1000000, activeGuaranteesCount: 0, status: 'ACTIVE' },
  { id: 'qg-4', itsNumber: '50123984', name: 'Mulla Abbas Bhai Hakimuddin', mohallah: 'Noor Mohallah', mobile: '9819988776', relation: 'Brother', maxGuaranteedLiability: 1200000, activeGuaranteesCount: 1, status: 'ACTIVE' },
];

export const INITIAL_QARDAN_APPLICATIONS: QardanApplication[] = [
  {
    id: 'qapp-1',
    applicationNo: 'QH-1447-001',
    itsNumber: '60291844',
    applicantName: 'Husain Bhai Shk Shabbir Ezzy',
    mohallah: 'Burhani Mohallah',
    mobile: '9892019911',
    schemeId: 'qs-1',
    schemeName: 'Makan (Housing Assistance)',
    requestedAmount: 600000,
    purpose: 'Down payment for newly allotted flat in Saifee Park Phase 2',
    tenureMonths: 24,
    appliedDate: '2026-08-10',
    status: 'DISBURSED',
    sanctionedAmount: 600000,
    sanctionedDate: '2026-08-15',
    sanctionRemarks: 'Approved by Qardan committee unanimously after checking income documents.',
    sanctionedBy: 'Janab Aamil Saheb',
    monthlyInstallment: 25000,
    guarantor1Its: '30489122',
    guarantor1Name: 'Mulla Shabbir Bhai Burhani',
    guarantor1Contact: '9820011223',
    guarantor2Its: '20394811',
    guarantor2Name: 'Shaikh Taher Bhai Rampurawala',
    guarantor2Contact: '9821144556',
    disbursedAmount: 600000,
    disbursedDate: '2026-08-20',
    disbursedBankAccountId: 'qa-1',
    chequeOrRefNo: 'BCB-CHQ-99021',
    totalRepaid: 75000,
    outstandingBalance: 525000,
  },
  {
    id: 'qapp-2',
    applicationNo: 'QH-1447-002',
    itsNumber: '70192833',
    applicantName: 'Mustafa Bhai Shk Asgar Godhrawala',
    mohallah: 'Saifee Mohallah',
    mobile: '9820987654',
    schemeId: 'qs-2',
    schemeName: 'Taleem (Higher Education)',
    requestedAmount: 350000,
    purpose: 'MBA semester fees at Jamia / Symbiosis Pune',
    tenureMonths: 14,
    appliedDate: '2026-09-05',
    status: 'DISBURSED',
    sanctionedAmount: 350000,
    sanctionedDate: '2026-09-10',
    sanctionRemarks: 'Academic transcripts verified. High merit score.',
    sanctionedBy: 'Taleem Committee Incharge',
    monthlyInstallment: 25000,
    guarantor1Its: '50123984',
    guarantor1Name: 'Mulla Abbas Bhai Hakimuddin',
    guarantor1Contact: '9819988776',
    disbursedAmount: 350000,
    disbursedDate: '2026-09-12',
    disbursedBankAccountId: 'qa-2',
    chequeOrRefNo: 'NEFT-SBI-440192',
    totalRepaid: 50000,
    outstandingBalance: 300000,
  },
  {
    id: 'qapp-3',
    applicationNo: 'QH-1447-003',
    itsNumber: '80928177',
    applicantName: 'Mufaddal Bhai Idris Master',
    mohallah: 'Badri Mohallah',
    mobile: '9876543210',
    schemeId: 'qs-5',
    schemeName: 'Tijarat (Business Enterprise)',
    requestedAmount: 500000,
    purpose: 'Stock expansion for hardware enterprise before festive season',
    tenureMonths: 20,
    appliedDate: '2026-10-01',
    status: 'SANCTIONED',
    sanctionedAmount: 400000,
    sanctionedDate: '2026-10-08',
    sanctionRemarks: 'Sanctioned for Rs. 4,00,000 subject to submitting PDC cheques and 2nd guarantor sign.',
    sanctionedBy: 'Janab Aamil Saheb',
    monthlyInstallment: 20000,
    guarantor1Its: '40392188',
    guarantor1Name: 'Shaikh Murtaza Bhai Badri',
    guarantor1Contact: '9833322114',
    totalRepaid: 0,
    outstandingBalance: 400000,
  },
  {
    id: 'qapp-4',
    applicationNo: 'QH-1447-004',
    itsNumber: '90123844',
    applicantName: 'Aliasgar Bhai Fakhruddin Electricwala',
    mohallah: 'Vajihi Mohallah',
    mobile: '9811223344',
    schemeId: 'qs-3',
    schemeName: 'Sehat (Medical Emergency)',
    requestedAmount: 180000,
    purpose: 'Cardiac surgery post-care and hospitalization coverage',
    tenureMonths: 12,
    appliedDate: '2026-10-18',
    status: 'APPLIED',
    monthlyInstallment: 15000,
    guarantor1Its: '30489122',
    guarantor1Name: 'Mulla Shabbir Bhai Burhani',
    guarantor1Contact: '9820011223',
    totalRepaid: 0,
    outstandingBalance: 180000,
  },
];

export const INITIAL_QARDAN_RECEIPTS: QardanInstallmentReceipt[] = [
  { id: 'qrec-1', receiptNo: 'QH-REC-001', applicationId: 'qapp-1', applicationNo: 'QH-1447-001', itsNumber: '60291844', applicantName: 'Husain Bhai Shk Shabbir Ezzy', amount: 25000, installmentNo: 1, paymentMode: 'UPI', transactionRef: 'UPI/QH891001', date: '2026-09-20', receivedBy: 'admin', remainingBalanceAfter: 575000 },
  { id: 'qrec-2', receiptNo: 'QH-REC-002', applicationId: 'qapp-1', applicationNo: 'QH-1447-001', itsNumber: '60291844', applicantName: 'Husain Bhai Shk Shabbir Ezzy', amount: 25000, installmentNo: 2, paymentMode: 'Bank Transfer', transactionRef: 'NEFT/5549012', date: '2026-10-20', receivedBy: 'admin', remainingBalanceAfter: 550000 },
  { id: 'qrec-3', receiptNo: 'QH-REC-003', applicationId: 'qapp-1', applicationNo: 'QH-1447-001', itsNumber: '60291844', applicantName: 'Husain Bhai Shk Shabbir Ezzy', amount: 25000, installmentNo: 3, paymentMode: 'Cash', transactionRef: 'CASH-REC', date: '2026-10-25', receivedBy: 'admin', remainingBalanceAfter: 525000 },
  { id: 'qrec-4', receiptNo: 'QH-REC-004', applicationId: 'qapp-2', applicationNo: 'QH-1447-002', itsNumber: '70192833', applicantName: 'Mustafa Bhai Shk Asgar Godhrawala', amount: 25000, installmentNo: 1, paymentMode: 'UPI', transactionRef: 'UPI/QH991283', date: '2026-10-01', receivedBy: 'admin', remainingBalanceAfter: 325000 },
  { id: 'qrec-5', receiptNo: 'QH-REC-005', applicationId: 'qapp-2', applicationNo: 'QH-1447-002', itsNumber: '70192833', applicantName: 'Mustafa Bhai Shk Asgar Godhrawala', amount: 25000, installmentNo: 2, paymentMode: 'Cheque', transactionRef: 'HDFC-CHQ-3310', date: '2026-10-24', receivedBy: 'admin', remainingBalanceAfter: 300000 },
];

// ============================================================================
// 2. ACCOUNTS MANAGER (Double-Entry Financial Accounting)
// ============================================================================

export type AccountType = 'ASSET' | 'LIABILITY' | 'INCOME' | 'EXPENSE';

export interface ChartOfAccount {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  group: string; // e.g. Current Assets, Bank Accounts, Fixed Assets, Current Liabilities, Operating Income, Operating Expense
  openingBalance: number;
  currentBalance: number;
  description: string;
  isSystem: boolean;
}

export type VoucherType = 'RECEIPT' | 'PAYMENT' | 'CONTRA' | 'JOURNAL';

export interface VoucherEntryItem {
  accountId: string;
  accountName: string;
  debit: number;
  credit: number;
  narration?: string;
}

export interface FinancialVoucher {
  id: string;
  voucherNo: string;
  voucherType: VoucherType;
  date: string;
  financialYear: string;
  referenceNo?: string;
  narration: string;
  entries: VoucherEntryItem[];
  totalAmount: number;
  createdBy: string;
  isApproved: boolean;
}

export const CHART_OF_ACCOUNTS_KEY = 'jamat_chart_of_accounts_v1';
export const FINANCIAL_VOUCHERS_KEY = 'jamat_financial_vouchers_v1';

export const INITIAL_CHART_OF_ACCOUNTS: ChartOfAccount[] = [
  // ASSETS
  { id: 'coa-101', code: '1010', name: 'Cash in Safe Vault', type: 'ASSET', group: 'Current Assets', openingBalance: 150000, currentBalance: 285000, description: 'Jamaat counter and office petty cash', isSystem: true },
  { id: 'coa-102', code: '1020', name: 'Burhani Bank Operating A/C', type: 'ASSET', group: 'Bank Accounts', openingBalance: 3200000, currentBalance: 4210000, description: 'Primary clearing bank account', isSystem: true },
  { id: 'coa-103', code: '1030', name: 'SBI Fixed Deposit Reserves', type: 'ASSET', group: 'Investments', openingBalance: 10000000, currentBalance: 10000000, description: 'Safe investment reserves', isSystem: true },
  { id: 'coa-104', code: '1040', name: 'Qardan Hasana Loan Receivables', type: 'ASSET', group: 'Loans & Advances', openingBalance: 1200000, currentBalance: 1405000, description: 'Active principal disbursed to mumineen', isSystem: true },
  { id: 'coa-105', code: '1050', name: 'Jamaat Complex Land & Building', type: 'ASSET', group: 'Fixed Assets', openingBalance: 45000000, currentBalance: 45000000, description: 'Masjid, Mawaid and Saifee Park freehold', isSystem: true },
  { id: 'coa-106', code: '1060', name: 'Kitchen & Industrial Equipment', type: 'ASSET', group: 'Fixed Assets', openingBalance: 2800000, currentBalance: 2800000, description: 'FMB Deg, steamers, rotary ovens, cold room', isSystem: true },

  // LIABILITIES
  { id: 'coa-201', code: '2010', name: 'General Jamaat Corpus Fund', type: 'LIABILITY', group: 'Corpus Funds', openingBalance: 48000000, currentBalance: 48000000, description: 'Permanent accumulated capital', isSystem: true },
  { id: 'coa-202', code: '2020', name: 'Qardan Hasana Revolving Pool', type: 'LIABILITY', group: 'Special Funds', openingBalance: 14500000, currentBalance: 14500000, description: 'Dedicated loan endowment funds', isSystem: true },
  { id: 'coa-203', code: '2030', name: 'Tenant Security Deposits', type: 'LIABILITY', group: 'Current Liabilities', openingBalance: 480000, currentBalance: 480000, description: 'Refundable rental shop deposits', isSystem: true },
  { id: 'coa-204', code: '2040', name: 'FMB Supplier Trade Payables', type: 'LIABILITY', group: 'Current Liabilities', openingBalance: 320000, currentBalance: 195000, description: 'Grain & spice wholesale vendor balances', isSystem: false },

  // INCOME
  { id: 'coa-301', code: '3010', name: 'Faiz-ul-Mawaid al-Burhaniyah Hub', type: 'INCOME', group: 'Operating Income', openingBalance: 0, currentBalance: 3850000, description: 'Hub receipts from thaali subscribers', isSystem: true },
  { id: 'coa-302', code: '3020', name: 'Sabeel-ul-Khairat Remittances', type: 'INCOME', group: 'Operating Income', openingBalance: 0, currentBalance: 1420000, description: 'Monthly household sabeel contributions', isSystem: true },
  { id: 'coa-303', code: '3030', name: 'Wajebaat & Khums Collections', type: 'INCOME', group: 'Religious Contributions', openingBalance: 0, currentBalance: 2950000, description: 'Zakat, fitrah, and kaffarah remitted', isSystem: true },
  { id: 'coa-304', code: '3040', name: 'Rental Income from Properties', type: 'INCOME', group: 'Property Revenue', openingBalance: 0, currentBalance: 580000, description: 'Commercial and residential leases', isSystem: true },
  { id: 'coa-305', code: '3050', name: 'Voluntary Hadiyah & Sadaqah', type: 'INCOME', group: 'Voluntary Contributions', openingBalance: 0, currentBalance: 490000, description: 'Niyaz-e-Husain and general sadaqah', isSystem: true },
  { id: 'coa-306', code: '3060', name: 'Madresa Tuition & Fee Income', type: 'INCOME', group: 'Education Income', openingBalance: 0, currentBalance: 240000, description: 'Annual fees from deaniyah students', isSystem: true },

  // EXPENSES
  { id: 'coa-401', code: '4010', name: 'FMB Kitchen Grocery & Rations', type: 'EXPENSE', group: 'FMB Kitchen Operating', openingBalance: 0, currentBalance: 2150000, description: 'Rice, wheat, oils, mutton, vegetables', isSystem: true },
  { id: 'coa-402', code: '4020', name: 'FMB Thaali Dispatch Logistics', type: 'EXPENSE', group: 'FMB Kitchen Operating', openingBalance: 0, currentBalance: 280000, description: 'Delivery vans, fuel, driver allowances', isSystem: true },
  { id: 'coa-403', code: '4030', name: 'Electricity, Gas & Water Utilities', type: 'EXPENSE', group: 'Facility Overheads', openingBalance: 0, currentBalance: 360000, description: 'Masjid complex power and piped gas', isSystem: true },
  { id: 'coa-404', code: '4040', name: 'Madresa Teachers Salaries', type: 'EXPENSE', group: 'Education Expenses', openingBalance: 0, currentBalance: 450000, description: 'Asatezah monthly honorarium', isSystem: true },
  { id: 'coa-405', code: '4050', name: 'Masjid & Mawaid Maintenance', type: 'EXPENSE', group: 'Facility Overheads', openingBalance: 0, currentBalance: 210000, description: 'Housekeeping, air-conditioning AMC, plumbing', isSystem: true },
  { id: 'coa-406', code: '4060', name: 'Ashara Ohbat & Miqaat Expenses', type: 'EXPENSE', group: 'Event Expenses', openingBalance: 0, currentBalance: 780000, description: 'Sound setup, relay cabling, carpets, lighting', isSystem: true },
];

export const INITIAL_FINANCIAL_VOUCHERS: FinancialVoucher[] = [
  {
    id: 'vch-1',
    voucherNo: 'VR-1447-001',
    voucherType: 'RECEIPT',
    date: '2026-10-10',
    financialYear: '1447-1448 Hijri',
    referenceNo: 'REC-FMB-9901',
    narration: 'FMB Monthly Hub received via UPI and Cheque batch',
    totalAmount: 185000,
    createdBy: 'admin',
    isApproved: true,
    entries: [
      { accountId: 'coa-102', accountName: 'Burhani Bank Operating A/C', debit: 185000, credit: 0, narration: 'Direct bank credit' },
      { accountId: 'coa-301', accountName: 'Faiz-ul-Mawaid al-Burhaniyah Hub', debit: 0, credit: 185000, narration: 'Hub collection recognized' },
    ],
  },
  {
    id: 'vch-2',
    voucherNo: 'VP-1447-002',
    voucherType: 'PAYMENT',
    date: '2026-10-14',
    financialYear: '1447-1448 Hijri',
    referenceNo: 'CHQ-449102',
    narration: 'Payment to M/s Royal Provision Stores for Basmati rice and sunflower oil consignment',
    totalAmount: 125000,
    createdBy: 'admin',
    isApproved: true,
    entries: [
      { accountId: 'coa-401', accountName: 'FMB Kitchen Grocery & Rations', debit: 125000, credit: 0, narration: 'Provision invoice cleared' },
      { accountId: 'coa-102', accountName: 'Burhani Bank Operating A/C', debit: 0, credit: 125000, narration: 'Payment by Cheque 449102' },
    ],
  },
  {
    id: 'vch-3',
    voucherNo: 'VC-1447-003',
    voucherType: 'CONTRA',
    date: '2026-10-18',
    financialYear: '1447-1448 Hijri',
    referenceNo: 'SLIP-BCB-110',
    narration: 'Cash withdrawal from Burhani Bank for counter disbursements & petty cash',
    totalAmount: 50000,
    createdBy: 'admin',
    isApproved: true,
    entries: [
      { accountId: 'coa-101', accountName: 'Cash in Safe Vault', debit: 50000, credit: 0, narration: 'Cash in vault increased' },
      { accountId: 'coa-102', accountName: 'Burhani Bank Operating A/C', debit: 0, credit: 50000, narration: 'Bank balance debited' },
    ],
  },
  {
    id: 'vch-4',
    voucherNo: 'VJ-1447-004',
    voucherType: 'JOURNAL',
    date: '2026-10-22',
    financialYear: '1447-1448 Hijri',
    referenceNo: 'ADJ-1447-01',
    narration: 'Annual depreciation on kitchen and industrial cooking equipment at 10%',
    totalAmount: 28000,
    createdBy: 'admin',
    isApproved: true,
    entries: [
      { accountId: 'coa-405', accountName: 'Masjid & Mawaid Maintenance', debit: 28000, credit: 0, narration: 'Depreciation charge' },
      { accountId: 'coa-106', accountName: 'Kitchen & Industrial Equipment', debit: 0, credit: 28000, narration: 'Asset wear reduction' },
    ],
  },
];

// ============================================================================
// 3. MADRESA MODULE (Deaniyah Education Management)
// ============================================================================

export interface MadresaClass {
  id: string;
  name: string; // e.g. Daur 1 - Al-Ibtidaiyah, Daur 2, Daur 3 - Al-Mutawassitah, Tahfeez-ul-Quran
  code: string;
  ageGroup: string;
  ustadName: string;
  roomNo: string;
  capacity: number;
  totalStudents: number;
  annualFee: number;
}

export interface MadresaStudent {
  id: string;
  itsNumber: string;
  studentName: string;
  gender: 'MALE' | 'FEMALE';
  dob: string;
  age: number;
  guardianIts: string;
  guardianName: string;
  mohallah: string;
  contactNumber: string;
  classId: string;
  className: string;
  enrollmentDate: string;
  totalFee: number;
  paidFee: number;
  outstandingFee: number;
  attendancePercent: number;
  academicPerformance: 'Mumtaz' | 'Jayyid Jiddan' | 'Jayyid' | 'Maqbool';
  status: 'ACTIVE' | 'GRADUATED' | 'LEFT';
}

export interface MadresaFeeReceipt {
  id: string;
  receiptNo: string;
  studentId: string;
  studentIts: string;
  studentName: string;
  className: string;
  amount: number;
  paymentMode: PaymentMode;
  date: string;
  academicYear: string;
  collectedBy: string;
  remainingDue: number;
  remarks?: string;
  isCancelled?: boolean;
}

export interface MadresaAttendanceRecord {
  id: string;
  date: string;
  classId: string;
  studentId: string;
  studentName: string;
  status: 'PRESENT' | 'ABSENT' | 'LEAVE';
  recordedBy: string;
}

export interface MadresaProgressReport {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  term: 'Mid-Term 1447' | 'Annual 1447';
  quranHifzGrade: string; // Sabaq, Daur, Tilawat
  deeniyatGrade: string; // Fiqh, Tareekh, Aqaid
  lisanDawatGrade: string; // Reading, Writing, Speech
  akhlaaqAdabGrade: string; // Discipline, Wuzu, Libas
  overallPercentage: number;
  rank: number;
  ustadRemarks: string;
}

export const MADRESA_CLASSES_KEY = 'jamat_madresa_classes_v1';
export const MADRESA_STUDENTS_KEY = 'jamat_madresa_students_v1';
export const MADRESA_FEE_RECEIPTS_KEY = 'jamat_madresa_fee_receipts_v1';
export const MADRESA_ATTENDANCE_KEY = 'jamat_madresa_attendance_v1';
export const MADRESA_PROGRESS_KEY = 'jamat_madresa_progress_v1';

export const INITIAL_MADRESA_CLASSES: MadresaClass[] = [
  { id: 'mc-1', name: 'Daur 1 (Al-Ibtidaiyah - Age 5-7)', code: 'D-1', ageGroup: '5 - 7 Years', ustadName: 'Mulla Shabbir Bhai Burhani', roomNo: 'Room 101', capacity: 30, totalStudents: 24, annualFee: 6000 },
  { id: 'mc-2', name: 'Daur 2 (Al-Mutawassitah - Age 8-10)', code: 'D-2', ageGroup: '8 - 10 Years', ustadName: 'Shaikh Murtaza Bhai Badri', roomNo: 'Room 102', capacity: 25, totalStudents: 22, annualFee: 7500 },
  { id: 'mc-3', name: 'Daur 3 (Al-Aaliyah - Age 11-14)', code: 'D-3', ageGroup: '11 - 14 Years', ustadName: 'Mulla Abbas Bhai Hakimuddin', roomNo: 'Room 103', capacity: 25, totalStudents: 18, annualFee: 9000 },
  { id: 'mc-4', name: 'Tahfeez-ul-Quran (Hifz al-Quran)', code: 'D-HIFZ', ageGroup: 'All Ages', ustadName: 'Hafiz-ul-Quran Janab Mulla Ali', roomNo: 'Noor Hall', capacity: 20, totalStudents: 15, annualFee: 12000 },
];

export const INITIAL_MADRESA_STUDENTS: MadresaStudent[] = [
  {
    id: 'ms-1',
    itsNumber: '3048912201',
    studentName: 'Mohammed Husain Burhani',
    gender: 'MALE',
    dob: '2018-05-14',
    age: 8,
    guardianIts: '30489122',
    guardianName: 'Mulla Shabbir Bhai Burhani',
    mohallah: 'Burhani Mohallah',
    contactNumber: '9820011223',
    classId: 'mc-2',
    className: 'Daur 2 (Al-Mutawassitah - Age 8-10)',
    enrollmentDate: '2024-06-15',
    totalFee: 7500,
    paidFee: 7500,
    outstandingFee: 0,
    attendancePercent: 96,
    academicPerformance: 'Mumtaz',
    status: 'ACTIVE',
  },
  {
    id: 'ms-2',
    itsNumber: '2039481101',
    studentName: 'Fatema Rampurawala',
    gender: 'FEMALE',
    dob: '2019-11-20',
    age: 7,
    guardianIts: '20394811',
    guardianName: 'Shaikh Taher Bhai Rampurawala',
    mohallah: 'Saifee Mohallah',
    contactNumber: '9821144556',
    classId: 'mc-1',
    className: 'Daur 1 (Al-Ibtidaiyah - Age 5-7)',
    enrollmentDate: '2025-06-10',
    totalFee: 6000,
    paidFee: 4000,
    outstandingFee: 2000,
    attendancePercent: 92,
    academicPerformance: 'Jayyid Jiddan',
    status: 'ACTIVE',
  },
  {
    id: 'ms-3',
    itsNumber: '4039218801',
    studentName: 'Ali Asgar Badri',
    gender: 'MALE',
    dob: '2014-03-25',
    age: 12,
    guardianIts: '40392188',
    guardianName: 'Shaikh Murtaza Bhai Badri',
    mohallah: 'Badri Mohallah',
    contactNumber: '9833322114',
    classId: 'mc-3',
    className: 'Daur 3 (Al-Aaliyah - Age 11-14)',
    enrollmentDate: '2023-06-10',
    totalFee: 9000,
    paidFee: 9000,
    outstandingFee: 0,
    attendancePercent: 98,
    academicPerformance: 'Mumtaz',
    status: 'ACTIVE',
  },
  {
    id: 'ms-4',
    itsNumber: '5012398401',
    studentName: 'Amatullah Hakimuddin',
    gender: 'FEMALE',
    dob: '2015-08-19',
    age: 11,
    guardianIts: '50123984',
    guardianName: 'Mulla Abbas Bhai Hakimuddin',
    mohallah: 'Noor Mohallah',
    contactNumber: '9819988776',
    classId: 'mc-4',
    className: 'Tahfeez-ul-Quran (Hifz al-Quran)',
    enrollmentDate: '2024-01-10',
    totalFee: 12000,
    paidFee: 8000,
    outstandingFee: 4000,
    attendancePercent: 95,
    academicPerformance: 'Mumtaz',
    status: 'ACTIVE',
  },
];

export const INITIAL_MADRESA_RECEIPTS: MadresaFeeReceipt[] = [
  { id: 'mrec-1', receiptNo: 'MAD-REC-001', studentId: 'ms-1', studentIts: '3048912201', studentName: 'Mohammed Husain Burhani', className: 'Daur 2', amount: 7500, paymentMode: 'UPI', date: '2026-06-20', academicYear: '1447-1448', collectedBy: 'admin', remainingDue: 0, remarks: 'Full year tuition fee paid' },
  { id: 'mrec-2', receiptNo: 'MAD-REC-002', studentId: 'ms-2', studentIts: '2039481101', studentName: 'Fatema Rampurawala', className: 'Daur 1', amount: 4000, paymentMode: 'Cash', date: '2026-07-05', academicYear: '1447-1448', collectedBy: 'admin', remainingDue: 2000, remarks: 'First installment paid' },
  { id: 'mrec-3', receiptNo: 'MAD-REC-003', studentId: 'ms-3', studentIts: '4039218801', studentName: 'Ali Asgar Badri', className: 'Daur 3', amount: 9000, paymentMode: 'Bank Transfer', date: '2026-06-25', academicYear: '1447-1448', collectedBy: 'admin', remainingDue: 0, remarks: 'Full year tuition' },
  { id: 'mrec-4', receiptNo: 'MAD-REC-004', studentId: 'ms-4', studentIts: '5012398401', studentName: 'Amatullah Hakimuddin', className: 'Tahfeez-ul-Quran', amount: 8000, paymentMode: 'UPI', date: '2026-06-18', academicYear: '1447-1448', collectedBy: 'admin', remainingDue: 4000, remarks: 'Part payment term 1' },
];

export const INITIAL_MADRESA_PROGRESS: MadresaProgressReport[] = [
  {
    id: 'mprog-1',
    studentId: 'ms-1',
    studentName: 'Mohammed Husain Burhani',
    className: 'Daur 2 (Al-Mutawassitah - Age 8-10)',
    term: 'Mid-Term 1447',
    quranHifzGrade: 'A+ (Surah Al-Mulk to An-Nas memorized)',
    deeniyatGrade: 'A (Wuzu rules & Salat practicals perfect)',
    lisanDawatGrade: 'A (Lisan-ud-Dawat reading fluency)',
    akhlaaqAdabGrade: 'A+ (Punctual, wore Topi & Saya)',
    overallPercentage: 94,
    rank: 1,
    ustadRemarks: 'MashaAllah, highly disciplined and attentive in class.',
  },
  {
    id: 'mprog-2',
    studentId: 'ms-3',
    studentName: 'Ali Asgar Badri',
    className: 'Daur 3 (Al-Aaliyah - Age 11-14)',
    term: 'Mid-Term 1447',
    quranHifzGrade: 'A+ (Juz 30 Complete with Tajweed)',
    deeniyatGrade: 'A+ (Tareekh & Dawoodi Bohra Dawat history)',
    lisanDawatGrade: 'A (Lisan-ud-Dawat written exam 48/50)',
    akhlaaqAdabGrade: 'A+ (Exemplary khidmat in majlis)',
    overallPercentage: 96,
    rank: 1,
    ustadRemarks: 'Outstanding intellectual curiosity and respect for asatezah.',
  },
];

// ============================================================================
// 4. MIQAAT MANAGEMENT & ASHARA OHBAT
// ============================================================================

export interface MiqaatEvent {
  id: string;
  name: string; // e.g. Milad-un-Nabi (SA), Ashara Mubaraka 1447, Eid-ul-Fitr, Lailat-ul-Qadr, Urs Mubarak
  hijriDate: string;
  gregorianDate: string;
  venue: string; // Main Masjid, Saifee Hall, Burhani Complex, Noor Hall
  totalCapacity: number;
  allocatedMasallaCount: number;
  attendanceCount: number;
  hasAudioVideoRelay: boolean;
  relayDetails?: string;
  status: 'UPCOMING' | 'ONGOING' | 'CONCLUDED';
}

export interface MasallaRegistration {
  id: string;
  registrationNo: string;
  miqaatId: string;
  miqaatName: string;
  itsNumber: string;
  muminName: string;
  gender: 'MALE' | 'FEMALE';
  age: number;
  mohallah: string;
  mobile: string;
  isSeniorCitizen: boolean;
  needsChairSupport: boolean;
  allocatedFloor?: string;
  allocatedHall?: string;
  allocatedRow?: string;
  masallaNumber?: string;
  isAllocated: boolean;
  attended: boolean;
  attendedAt?: string;
  registeredDate: string;
}

// Ashara Ohbat Data Models
export interface AsharaMajlis {
  id: string;
  dayNumber: number; // 1 to 10 Moharram
  date: string;
  hijriDate: string;
  title: string; // e.g. Pehli Majlis - Iftitah, Shahadat Hazrat Abbas (AS), Aashura Day
  waazTimeSlot: string; // 10:00 AM - 01:15 PM
  niyazTimeSlot: string; // 01:30 PM - 03:00 PM
  expectedTurnout: number;
  zakirGroup: string;
  isLiveRelayActive: boolean;
}

export interface MajlisTimeSlot {
  id: string;
  slotName: string; // Morning Waaz, Zohr-Asr Namaz, Niyaz Jaman, Maghrib-Isha, Shab-e-Ashura
  startTime: string;
  endTime: string;
  venueSection: string;
  description: string;
}

export interface MajlisBlockQuota {
  id: string;
  blockCode: string; // e.g. GF-M-A, GF-M-B, FF-F-A, VIP-A, ELDERLY-CHAIR
  blockName: string; // Ground Floor Male (Central), First Floor Sisters, Chair Section
  gender: 'MALE' | 'FEMALE' | 'ALL';
  totalCapacity: number;
  reservedQuota: number;
  availableSeats: number;
  hasRelayScreen: boolean;
}

export interface AsharaRegistration {
  id: string;
  passNo: string;
  itsNumber: string;
  fullName: string;
  gender: 'MALE' | 'FEMALE';
  age: number;
  category: 'LOCAL_HOF' | 'LOCAL_FM' | 'MEHMAAN' | 'KHAADIM';
  blockAllocated: string;
  seatBadge: string;
  rfidCardNo?: string;
  dietaryPreference?: string;
  specialAssistance: boolean;
  registeredOn: string;
  status: 'CONFIRMED' | 'WAITLISTED' | 'CHECKED_IN';
}

export const MIQAAT_EVENTS_KEY = 'jamat_miqaat_events_v1';
export const MASALLA_REGISTRATIONS_KEY = 'jamat_masalla_registrations_v1';
export const ASHARA_MAJLIS_KEY = 'jamat_ashara_majlis_v1';
export const ASHARA_SLOTS_KEY = 'jamat_ashara_slots_v1';
export const ASHARA_BLOCKS_KEY = 'jamat_ashara_blocks_v1';
export const ASHARA_REGISTRATIONS_KEY = 'jamat_ashara_registrations_v1';

export const INITIAL_MIQAAT_EVENTS: MiqaatEvent[] = [
  {
    id: 'me-1',
    name: 'Milad-un-Nabi (SA) & Darees Mubarak',
    hijriDate: '12 Rabi-ul-Awwal 1447',
    gregorianDate: '2026-09-24',
    venue: 'Burhani Masjid & Central Mawaid',
    totalCapacity: 1500,
    allocatedMasallaCount: 1420,
    attendanceCount: 1380,
    hasAudioVideoRelay: true,
    relayDetails: 'Live Fiber CCTV feed connected to Saifee Hall & Noor Ladies Mezzanine',
    status: 'CONCLUDED',
  },
  {
    id: 'me-2',
    name: 'Milad Imam-uz-Zaman (AS) & Jashan',
    hijriDate: '04 Rabi-us-Saani 1447',
    gregorianDate: '2026-10-16',
    venue: 'Burhani Masjid Complex',
    totalCapacity: 1200,
    allocatedMasallaCount: 1100,
    attendanceCount: 1050,
    hasAudioVideoRelay: true,
    relayDetails: 'Internal HDMI Matrix to 6 LED panels across courtyards',
    status: 'CONCLUDED',
  },
  {
    id: 'me-3',
    name: 'Urus Mubarak Syedna Qutbuddin Shaheed (RA)',
    hijriDate: '27 Jumada-l-Ula 1447',
    gregorianDate: '2026-11-08',
    venue: 'Burhani Masjid & Mawaid',
    totalCapacity: 1600,
    allocatedMasallaCount: 850,
    attendanceCount: 0,
    hasAudioVideoRelay: true,
    relayDetails: 'Full HD IP stream + Audio PA system in Basement overflow zone',
    status: 'UPCOMING',
  },
  {
    id: 'me-4',
    name: 'Ashara Mubaraka 1448 Hijri Ohbat Planning',
    hijriDate: '01 - 10 Moharram 1448',
    gregorianDate: '2027-06-18',
    venue: 'Central Masjid, Saifee Hall, Noor Hall & Courtyard marquee',
    totalCapacity: 3500,
    allocatedMasallaCount: 1800,
    attendanceCount: 0,
    hasAudioVideoRelay: true,
    relayDetails: 'Central Broadcast Control Room (BCR) with satellite link & 12 repeater screens',
    status: 'UPCOMING',
  },
];

export const INITIAL_MASALLA_REGISTRATIONS: MasallaRegistration[] = [
  { id: 'mreg-1', registrationNo: 'MAS-1447-001', miqaatId: 'me-3', miqaatName: 'Urus Mubarak Syedna Qutbuddin Shaheed (RA)', itsNumber: '30489122', muminName: 'Mulla Shabbir Bhai Burhani', gender: 'MALE', age: 54, mohallah: 'Burhani Mohallah', mobile: '9820011223', isSeniorCitizen: false, needsChairSupport: false, allocatedFloor: 'Ground Floor', allocatedHall: 'Main Masjid', allocatedRow: 'Row C', masallaNumber: 'M-12', isAllocated: true, attended: false, registeredDate: '2026-10-20' },
  { id: 'mreg-2', registrationNo: 'MAS-1447-002', miqaatId: 'me-3', miqaatName: 'Urus Mubarak Syedna Qutbuddin Shaheed (RA)', itsNumber: '20394811', muminName: 'Shaikh Taher Bhai Rampurawala', gender: 'MALE', age: 67, mohallah: 'Saifee Mohallah', mobile: '9821144556', isSeniorCitizen: true, needsChairSupport: true, allocatedFloor: 'Ground Floor', allocatedHall: 'Main Masjid - Elderly Wing', allocatedRow: 'Chair Row 1', masallaNumber: 'CHR-04', isAllocated: true, attended: false, registeredDate: '2026-10-21' },
  { id: 'mreg-3', registrationNo: 'MAS-1447-003', miqaatId: 'me-3', miqaatName: 'Urus Mubarak Syedna Qutbuddin Shaheed (RA)', itsNumber: '40392188', muminName: 'Shaikh Murtaza Bhai Badri', gender: 'MALE', age: 48, mohallah: 'Badri Mohallah', mobile: '9833322114', isSeniorCitizen: false, needsChairSupport: false, allocatedFloor: 'Ground Floor', allocatedHall: 'Main Masjid', allocatedRow: 'Row D', masallaNumber: 'M-18', isAllocated: true, attended: false, registeredDate: '2026-10-22' },
  { id: 'mreg-4', registrationNo: 'MAS-1447-004', miqaatId: 'me-3', miqaatName: 'Urus Mubarak Syedna Qutbuddin Shaheed (RA)', itsNumber: '50123984', muminName: 'Mulla Abbas Bhai Hakimuddin', gender: 'MALE', age: 42, mohallah: 'Noor Mohallah', mobile: '9819988776', isSeniorCitizen: false, needsChairSupport: false, isAllocated: false, attended: false, registeredDate: '2026-10-24' },
];

export const INITIAL_ASHARA_MAJLIS: AsharaMajlis[] = [
  { id: 'am-1', dayNumber: 1, date: '2027-06-18', hijriDate: '01 Moharram 1448', title: 'Pehli Majlis - Iftitah & Fazilat-e-Ashara', waazTimeSlot: '10:00 AM - 01:15 PM', niyazTimeSlot: '01:30 PM - 03:00 PM', expectedTurnout: 3200, zakirGroup: 'Shabab-ul-Eidiz-Zahabi', isLiveRelayActive: true },
  { id: 'am-2', dayNumber: 2, date: '2027-06-19', hijriDate: '02 Moharram 1448', title: 'Majlis 2 - Zikr-e-Anbiya & Karbala', waazTimeSlot: '10:00 AM - 01:15 PM', niyazTimeSlot: '01:30 PM - 03:00 PM', expectedTurnout: 3200, zakirGroup: 'Burhani Zakireen', isLiveRelayActive: true },
  { id: 'am-7', dayNumber: 7, date: '2027-06-24', hijriDate: '07 Moharram 1448', title: 'Majlis 7 - Shahadat Shahzada Ali Asgar (AS)', waazTimeSlot: '10:00 AM - 01:30 PM', niyazTimeSlot: '01:45 PM - 03:30 PM', expectedTurnout: 3450, zakirGroup: 'Shabab Group A', isLiveRelayActive: true },
  { id: 'am-8', dayNumber: 8, date: '2027-06-25', hijriDate: '08 Moharram 1448', title: 'Majlis 8 - Shahadat Shahzada Ali Akbar (AS)', waazTimeSlot: '10:00 AM - 01:30 PM', niyazTimeSlot: '01:45 PM - 03:30 PM', expectedTurnout: 3500, zakirGroup: 'Tolaba-ul-Kulliyat', isLiveRelayActive: true },
  { id: 'am-9', dayNumber: 9, date: '2027-06-26', hijriDate: '09 Moharram 1448', title: 'Majlis 9 - Shahadat Maulana Abbas Alamdar (AS)', waazTimeSlot: '10:00 AM - 02:00 PM', niyazTimeSlot: '02:15 PM - 04:00 PM', expectedTurnout: 3500, zakirGroup: 'Shabab Central Group', isLiveRelayActive: true },
  { id: 'am-10', dayNumber: 10, date: '2027-06-27', hijriDate: '10 Moharram 1448', title: 'Youm-e-Aashura - Shahadat-e-Uzma Imam Husain (AS)', waazTimeSlot: '09:30 AM - 03:45 PM', niyazTimeSlot: '04:30 PM - 07:00 PM (Faqa Shikani)', expectedTurnout: 3500, zakirGroup: 'All Jamaat Zakireen Joint', isLiveRelayActive: true },
];

export const INITIAL_ASHARA_SLOTS: MajlisTimeSlot[] = [
  { id: 'slot-1', slotName: 'Morning Waaz Session', startTime: '10:00 AM', endTime: '01:15 PM', venueSection: 'Main Masjid & All Relay Halls', description: 'Bayan-e-Mubarak & Matam Majlis' },
  { id: 'slot-2', slotName: 'Zohr & Asr Imamat Namaz', startTime: '01:15 PM', endTime: '01:45 PM', venueSection: 'Burhani Masjid Sanctuary', description: 'Faraz namaz and munajaat' },
  { id: 'slot-3', slotName: 'Barakat Niyaz Jaman', startTime: '01:45 PM', endTime: '03:15 PM', venueSection: 'Central Mawaid Hall 1 & 2', description: 'Thaali distribution & jaman' },
  { id: 'slot-4', slotName: 'Maghrib & Isha Namaz', startTime: '06:45 PM', endTime: '07:30 PM', venueSection: 'Burhani Masjid Sanctuary', description: 'Shaam namaz and Quran recitation' },
  { id: 'slot-5', slotName: 'Shab Darees & Marsiyah Majlis', startTime: '07:45 PM', endTime: '09:00 PM', venueSection: 'Saifee Hall', description: 'Evening Marsiyah and Noha khwani' },
];

export const INITIAL_ASHARA_BLOCKS: MajlisBlockQuota[] = [
  { id: 'blk-1', blockCode: 'GF-M-MAIN', blockName: 'Ground Floor Male Sanctuary (Qibla Front)', gender: 'MALE', totalCapacity: 800, reservedQuota: 150, availableSeats: 120, hasRelayScreen: false },
  { id: 'blk-2', blockCode: 'GF-M-HALL', blockName: 'Ground Floor Male Extended Hall', gender: 'MALE', totalCapacity: 700, reservedQuota: 50, availableSeats: 320, hasRelayScreen: true },
  { id: 'blk-3', blockCode: 'FF-F-MAIN', blockName: 'First Floor Sisters Hall (Noor Mezzanine)', gender: 'FEMALE', totalCapacity: 1100, reservedQuota: 100, availableSeats: 410, hasRelayScreen: true },
  { id: 'blk-4', blockCode: 'SF-ALL-RELAY', blockName: 'Second Floor Overflow Marquee (Audio/Video)', gender: 'ALL', totalCapacity: 600, reservedQuota: 0, availableSeats: 480, hasRelayScreen: true },
  { id: 'blk-5', blockCode: 'ELDERLY-CHAIR', blockName: 'Senior Citizens & Medical Chair Section', gender: 'ALL', totalCapacity: 300, reservedQuota: 40, availableSeats: 65, hasRelayScreen: true },
];

export const INITIAL_ASHARA_REGISTRATIONS: AsharaRegistration[] = [
  { id: 'areg-1', passNo: 'ASH-1448-001', itsNumber: '30489122', fullName: 'Mulla Shabbir Bhai Burhani', gender: 'MALE', age: 54, category: 'LOCAL_HOF', blockAllocated: 'GF-M-MAIN', seatBadge: 'Q-Row 2 / Seat 14', rfidCardNo: 'RFID-9901-A', specialAssistance: false, registeredOn: '2026-10-15', status: 'CONFIRMED' },
  { id: 'areg-2', passNo: 'ASH-1448-002', itsNumber: '20394811', fullName: 'Shaikh Taher Bhai Rampurawala', gender: 'MALE', age: 67, category: 'LOCAL_HOF', blockAllocated: 'ELDERLY-CHAIR', seatBadge: 'CHR-Row 1 / Seat 02', rfidCardNo: 'RFID-9902-B', specialAssistance: true, registeredOn: '2026-10-16', status: 'CONFIRMED' },
  { id: 'areg-3', passNo: 'ASH-1448-003', itsNumber: '40392188', fullName: 'Shaikh Murtaza Bhai Badri', gender: 'MALE', age: 48, category: 'LOCAL_HOF', blockAllocated: 'GF-M-HALL', seatBadge: 'H-Row 4 / Seat 22', rfidCardNo: 'RFID-9903-C', specialAssistance: false, registeredOn: '2026-10-17', status: 'CONFIRMED' },
  { id: 'areg-4', passNo: 'ASH-1448-004', itsNumber: '70192833', fullName: 'Mustafa Bhai Shk Asgar Godhrawala', gender: 'MALE', age: 26, category: 'KHAADIM', blockAllocated: 'SF-ALL-RELAY', seatBadge: 'Khidmat Badge K-09', rfidCardNo: 'RFID-9904-D', specialAssistance: false, registeredOn: '2026-10-18', status: 'CHECKED_IN' },
  { id: 'areg-5', passNo: 'ASH-1448-005', itsNumber: '88201992', fullName: 'Sakina Bai Shabbir Burhani', gender: 'FEMALE', age: 51, category: 'LOCAL_FM', blockAllocated: 'FF-F-MAIN', seatBadge: 'F-Row 3 / Seat 08', rfidCardNo: 'RFID-9905-E', specialAssistance: false, registeredOn: '2026-10-19', status: 'CONFIRMED' },
];

// ============================================================================
// LocalStorage Sync Helpers
// ============================================================================

export function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(defaultValue));
      return defaultValue;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error loading key ${key} from localStorage:`, err);
    return defaultValue;
  }
}

export function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error saving key ${key} to localStorage:`, err);
  }
}
