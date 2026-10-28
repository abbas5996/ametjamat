/**
 * Faiz Hub & Finance Management Utilities
 * Powers Part 2A: Faiz Module (8 Sub-Pages)
 */

import { HeadOfFamily } from '../types';
import { getStoredHofs } from './memberMaster';
import { appendActivityLog } from './rbac';

export interface FaizHubCategory {
  id: string;
  name: string;
  code: string;
  suggestedAnnualHub: number;
  description: string;
  isActive: boolean;
}

export interface FaizHubMasterRecord {
  id: string;
  itsNumber: string;
  hofName: string;
  mohallahName: string;
  categoryCode: string;
  financialYear: string;
  committedHub: number;
  paidHub: number;
  balanceHub: number;
  installmentPlan: 'One-Time' | 'Quarterly' | 'Monthly' | 'Custom';
  status: 'Pledged' | 'Partially Paid' | 'Settled' | 'Overdue';
  notes?: string;
  createdAt: string;
}

export type FaizPaymentMode = 'Cash' | 'UPI' | 'Cheque' | 'Bank Transfer' | 'Online Gateway';

export interface FaizHubReceipt {
  id: string;
  receiptNo: string;
  hubRecordId: string;
  itsNumber: string;
  hofName: string;
  amount: number;
  paymentMode: FaizPaymentMode;
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

export const FAIZ_CATEGORIES_KEY = 'jamat_faiz_categories_v1';
export const FAIZ_HUBS_KEY = 'jamat_faiz_hubs_v1';
export const FAIZ_RECEIPTS_KEY = 'jamat_faiz_receipts_v1';

export const INITIAL_FAIZ_CATEGORIES: FaizHubCategory[] = [
  { id: 'fcat-1', name: 'General Mumineen Tier', code: 'HUB-GEN', suggestedAnnualHub: 52000, description: 'Standard annual contribution for working resident families.', isActive: true },
  { id: 'fcat-2', name: 'Industrial & Business Tier', code: 'HUB-BIZ', suggestedAnnualHub: 110000, description: 'Commercial business and manufacturing unit owners.', isActive: true },
  { id: 'fcat-3', name: 'Khidmatguzaar / Trustee Tier', code: 'HUB-TRUSTEE', suggestedAnnualHub: 152000, description: 'Jamaat committee trustees, volunteers and senior patrons.', isActive: true },
  { id: 'fcat-4', name: 'Youth & Concession Scheme', code: 'HUB-CON', suggestedAnnualHub: 28000, description: 'Newly married couples, students, and subsidised families.', isActive: true },
];

export const INITIAL_FAIZ_HUBS: FaizHubMasterRecord[] = [
  {
    id: 'fhub-1',
    itsNumber: '30489122',
    hofName: 'Mulla Shabbir Bhai Fakhri',
    mohallahName: 'Burhani Mohallah (Sector B)',
    categoryCode: 'HUB-GEN',
    financialYear: '1447-1448 Hijri',
    committedHub: 52000,
    paidHub: 35000,
    balanceHub: 17000,
    installmentPlan: 'Quarterly',
    status: 'Partially Paid',
    notes: 'Q1 and Q2 cleared. Q3 due in Rajab.',
    createdAt: '2025-01-01',
  },
  {
    id: 'fhub-2',
    itsNumber: '20391823',
    hofName: 'Mulla Huzefa Bhai Jamali',
    mohallahName: 'Saifee Mohallah (Sector A)',
    categoryCode: 'HUB-BIZ',
    financialYear: '1447-1448 Hijri',
    committedHub: 110000,
    paidHub: 110000,
    balanceHub: 0,
    installmentPlan: 'One-Time',
    status: 'Settled',
    notes: 'Paid fully in advance during Lailatul Qadr.',
    createdAt: '2025-01-01',
  },
  {
    id: 'fhub-3',
    itsNumber: '30491024',
    hofName: 'Mulla Taher Bhai Vajihi',
    mohallahName: 'Badri Mohallah (Sector C)',
    categoryCode: 'HUB-GEN',
    financialYear: '1447-1448 Hijri',
    committedHub: 52000,
    paidHub: 26000,
    balanceHub: 26000,
    installmentPlan: 'Monthly',
    status: 'Partially Paid',
    notes: 'Half paid, monthly standing instruction via UPI.',
    createdAt: '2025-01-01',
  },
  {
    id: 'fhub-4',
    itsNumber: '20381044',
    hofName: 'Mulla Abbas Bhai Rajkotwala',
    mohallahName: 'Najmi Mohallah (Sector D)',
    categoryCode: 'HUB-TRUSTEE',
    financialYear: '1447-1448 Hijri',
    committedHub: 152000,
    paidHub: 80000,
    balanceHub: 72000,
    installmentPlan: 'Quarterly',
    status: 'Partially Paid',
    notes: 'Niyaaz sponsor contribution included.',
    createdAt: '2025-01-01',
  },
];

export const INITIAL_FAIZ_RECEIPTS: FaizHubReceipt[] = [
  {
    id: 'frec-1',
    receiptNo: 'FMB-REC-8901',
    hubRecordId: 'fhub-1',
    itsNumber: '30489122',
    hofName: 'Mulla Shabbir Bhai Fakhri',
    amount: 20000,
    paymentMode: 'Bank Transfer',
    transactionRef: 'NEFT-88991203',
    date: '2025-01-15',
    financialYear: '1447-1448 Hijri',
    collectedBy: 'janabadmin',
    notes: 'Installment #1 paid',
    isCancelled: false,
  },
  {
    id: 'frec-2',
    receiptNo: 'FMB-REC-8902',
    hubRecordId: 'fhub-1',
    itsNumber: '30489122',
    hofName: 'Mulla Shabbir Bhai Fakhri',
    amount: 15000,
    paymentMode: 'UPI',
    transactionRef: 'UPI-99283471',
    date: '2025-03-10',
    financialYear: '1447-1448 Hijri',
    collectedBy: 'taherfmb',
    notes: 'Installment #2 paid',
    isCancelled: false,
  },
  {
    id: 'frec-3',
    receiptNo: 'FMB-REC-8903',
    hubRecordId: 'fhub-2',
    itsNumber: '20391823',
    hofName: 'Mulla Huzefa Bhai Jamali',
    amount: 110000,
    paymentMode: 'Cheque',
    transactionRef: 'CHQ-550192',
    date: '2025-02-01',
    financialYear: '1447-1448 Hijri',
    collectedBy: 'janabadmin',
    notes: 'Full payment cleared in single cheque',
    isCancelled: false,
  },
  {
    id: 'frec-4',
    receiptNo: 'FMB-REC-8904',
    hubRecordId: 'fhub-4',
    itsNumber: '20381044',
    hofName: 'Mulla Abbas Bhai Rajkotwala',
    amount: 10000,
    paymentMode: 'Cash',
    date: '2025-02-14',
    financialYear: '1447-1448 Hijri',
    collectedBy: 'taherfmb',
    notes: 'Wrong amount entered by cashier - cancelled',
    isCancelled: true,
    cancelledAt: '2025-02-15 11:20 AM',
    cancelledBy: 'janabadmin',
    cancellationReason: 'Double punch mistake by counter cashier, reissued on correct receipt #8905.',
  },
];

export const getStoredFaizCategories = (): FaizHubCategory[] => {
  try {
    const raw = localStorage.getItem(FAIZ_CATEGORIES_KEY);
    if (!raw) {
      localStorage.setItem(FAIZ_CATEGORIES_KEY, JSON.stringify(INITIAL_FAIZ_CATEGORIES));
      return INITIAL_FAIZ_CATEGORIES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_FAIZ_CATEGORIES;
  }
};

export const saveStoredFaizCategories = (c: FaizHubCategory[]): void => {
  try { localStorage.setItem(FAIZ_CATEGORIES_KEY, JSON.stringify(c)); } catch (e) { console.error(e); }
};

export const getStoredFaizHubs = (): FaizHubMasterRecord[] => {
  try {
    const raw = localStorage.getItem(FAIZ_HUBS_KEY);
    if (!raw) {
      localStorage.setItem(FAIZ_HUBS_KEY, JSON.stringify(INITIAL_FAIZ_HUBS));
      return INITIAL_FAIZ_HUBS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_FAIZ_HUBS;
  }
};

export const saveStoredFaizHubs = (h: FaizHubMasterRecord[]): void => {
  try { localStorage.setItem(FAIZ_HUBS_KEY, JSON.stringify(h)); } catch (e) { console.error(e); }
};

export const getStoredFaizReceipts = (): FaizHubReceipt[] => {
  try {
    const raw = localStorage.getItem(FAIZ_RECEIPTS_KEY);
    if (!raw) {
      localStorage.setItem(FAIZ_RECEIPTS_KEY, JSON.stringify(INITIAL_FAIZ_RECEIPTS));
      return INITIAL_FAIZ_RECEIPTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_FAIZ_RECEIPTS;
  }
};

export const saveStoredFaizReceipts = (r: FaizHubReceipt[]): void => {
  try { localStorage.setItem(FAIZ_RECEIPTS_KEY, JSON.stringify(r)); } catch (e) { console.error(e); }
};
