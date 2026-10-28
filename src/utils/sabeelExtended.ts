/**
 * Extended Sabeel Management Types & Utilities
 * Covers: Category Master, Takhmeen Master, Payment Entry,
 * Outstanding Report, Ledger, Cancelled Receipts
 */

import { appendActivityLog } from './rbac';
import { getStoredSabeelLedger, getStoredSabeelTransactions, saveStoredSabeelLedger, saveStoredSabeelTransactions } from './sabeelManagement';
import type { SabeelTransactionEntry, SabeelLedgerRecord, SabeelPaymentMode } from '../types';

// ── Types ──────────────────────────────────────────────────────────────────

export interface SabeelCategory {
  id: string;
  name: string;
  code: string;
  description?: string;
  baseAmount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SabeelTakhmeenTier {
  id: string;
  categoryId: string;
  categoryName: string;
  tierName: string;
  annualAmount: number;
  quarterlyAmount: number;
  monthlyAmount: number;
  description?: string;
  isActive: boolean;
  financialYear: string;
  createdAt: string;
  updatedAt: string;
}

export interface CancelledReceipt {
  id: string;
  originalReceiptNo: string;
  itsNumber: string;
  hofName: string;
  sabeelNo: string;
  amount: number;
  paymentMode: SabeelPaymentMode;
  originalDate: string;
  cancellationDate: string;
  cancellationReason: string;
  cancelledBy: string;
  financialYear: string;
  createdAt: string;
  // Alias fields for backward compatibility with subpages
  receiptNo?: string;
  cancelledDate?: string;
  originalPaymentDate?: string;
  memberName?: string;
  reason?: string;
}

// ── Storage Keys ────────────────────────────────────────────────────────────

export const SABEEL_CATEGORY_KEY = 'jamat_sabeel_categories_v1';
export const SABEEL_TAKHMEEN_TIER_KEY = 'jamat_sabeel_takhmeen_tiers_v1';
export const CANCELLED_RECEIPTS_KEY = 'jamat_sabeel_cancelled_receipts_v1';

// ── Seed Data ───────────────────────────────────────────────────────────────

export const INITIAL_SABEEL_CATEGORIES: SabeelCategory[] = [
  {
    id: 'cat-001',
    name: 'Residential',
    code: 'RES',
    description: 'Standard residential family units within Burhani Park',
    baseAmount: 24000,
    isActive: true,
    createdAt: '1447-01-01',
    updatedAt: '1447-01-01',
  },
  {
    id: 'cat-002',
    name: 'Commercial',
    code: 'COM',
    description: 'Mumineen with commercial business/shop in complex',
    baseAmount: 36000,
    isActive: true,
    createdAt: '1447-01-01',
    updatedAt: '1447-01-01',
  },
  {
    id: 'cat-003',
    name: 'Special',
    code: 'SPL',
    description: 'Special category — elite or custom contribution arrangement',
    baseAmount: 48000,
    isActive: true,
    createdAt: '1447-01-01',
    updatedAt: '1447-01-01',
  },
  {
    id: 'cat-004',
    name: 'Concession',
    code: 'CON',
    description: 'Reduced rate for widowed or low-income families — approved by Amil Saheb',
    baseAmount: 12000,
    isActive: true,
    createdAt: '1447-01-01',
    updatedAt: '1447-01-01',
  },
  {
    id: 'cat-005',
    name: 'Exempt',
    code: 'EXM',
    description: 'Fully exempt families — Amil Saheb discretionary waiver',
    baseAmount: 0,
    isActive: true,
    createdAt: '1447-01-01',
    updatedAt: '1447-01-01',
  },
];

export const INITIAL_TAKHMEEN_TIERS: SabeelTakhmeenTier[] = [
  {
    id: 'tier-001',
    categoryId: 'cat-001',
    categoryName: 'Residential',
    tierName: 'Standard Residential Annual',
    annualAmount: 24000,
    quarterlyAmount: 6000,
    monthlyAmount: 2000,
    description: 'Full-year Sabeel commitment — monthly installment plan available',
    isActive: true,
    financialYear: '1447-1448 Hijri',
    createdAt: '1447-01-01',
    updatedAt: '1447-01-01',
  },
  {
    id: 'tier-002',
    categoryId: 'cat-002',
    categoryName: 'Commercial',
    tierName: 'Commercial Sabeel Annual',
    annualAmount: 36000,
    quarterlyAmount: 9000,
    monthlyAmount: 3000,
    description: 'Commercial account — higher tier contribution',
    isActive: true,
    financialYear: '1447-1448 Hijri',
    createdAt: '1447-01-01',
    updatedAt: '1447-01-01',
  },
  {
    id: 'tier-003',
    categoryId: 'cat-003',
    categoryName: 'Special',
    tierName: 'Elite Sabeel Commitment',
    annualAmount: 48000,
    quarterlyAmount: 12000,
    monthlyAmount: 4000,
    description: 'Premium Sabeel tier for special category contributors',
    isActive: true,
    financialYear: '1447-1448 Hijri',
    createdAt: '1447-01-01',
    updatedAt: '1447-01-01',
  },
  {
    id: 'tier-004',
    categoryId: 'cat-004',
    categoryName: 'Concession',
    tierName: 'Concession Rate',
    annualAmount: 12000,
    quarterlyAmount: 3000,
    monthlyAmount: 1000,
    description: 'Reduced-rate approved by Amil Saheb for eligible families',
    isActive: true,
    financialYear: '1447-1448 Hijri',
    createdAt: '1447-01-01',
    updatedAt: '1447-01-01',
  },
];

export const INITIAL_CANCELLED_RECEIPTS: CancelledReceipt[] = [
  {
    id: 'cncl-001',
    originalReceiptNo: 'RCP-SB-1446-0099',
    itsNumber: '30489122',
    hofName: 'Mulla Shabbir Bhai Fakhri',
    sabeelNo: 'SB-042',
    amount: 6000,
    paymentMode: 'Cheque',
    originalDate: '1446-11-10',
    cancellationDate: '1446-11-15',
    cancellationReason: 'Cheque bounced — HDFC bank returned',
    cancelledBy: 'janabadmin',
    financialYear: '1446-1447 Hijri',
    createdAt: '1446-11-15 02:30 PM',
  },
  {
    id: 'cncl-002',
    originalReceiptNo: 'RCP-SB-1447-0012',
    itsNumber: '60392811',
    hofName: 'Husain Bhai Rasheeduddin',
    sabeelNo: 'SB-112',
    amount: 12000,
    paymentMode: 'UPI',
    originalDate: '1447-01-20',
    cancellationDate: '1447-01-22',
    cancellationReason: 'Duplicate entry — double payment processed',
    cancelledBy: 'huzefasabeel',
    financialYear: '1447-1448 Hijri',
    createdAt: '1447-01-22 11:10 AM',
  },
];

// ── Storage Helpers ─────────────────────────────────────────────────────────

export const getStoredSabeelCategories = (): SabeelCategory[] => {
  try {
    const raw = localStorage.getItem(SABEEL_CATEGORY_KEY);
    if (!raw) {
      localStorage.setItem(SABEEL_CATEGORY_KEY, JSON.stringify(INITIAL_SABEEL_CATEGORIES));
      return INITIAL_SABEEL_CATEGORIES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_SABEEL_CATEGORIES;
  }
};

export const saveStoredSabeelCategories = (records: SabeelCategory[]): void => {
  try {
    localStorage.setItem(SABEEL_CATEGORY_KEY, JSON.stringify(records));
  } catch (e) {
    console.error('Failed to save Sabeel categories', e);
  }
};

export const getStoredTakhmeenTiers = (): SabeelTakhmeenTier[] => {
  try {
    const raw = localStorage.getItem(SABEEL_TAKHMEEN_TIER_KEY);
    if (!raw) {
      localStorage.setItem(SABEEL_TAKHMEEN_TIER_KEY, JSON.stringify(INITIAL_TAKHMEEN_TIERS));
      return INITIAL_TAKHMEEN_TIERS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_TAKHMEEN_TIERS;
  }
};

export const saveStoredTakhmeenTiers = (records: SabeelTakhmeenTier[]): void => {
  try {
    localStorage.setItem(SABEEL_TAKHMEEN_TIER_KEY, JSON.stringify(records));
  } catch (e) {
    console.error('Failed to save Takhmeen tiers', e);
  }
};

export const getStoredCancelledReceipts = (): CancelledReceipt[] => {
  try {
    const raw = localStorage.getItem(CANCELLED_RECEIPTS_KEY);
    if (!raw) {
      localStorage.setItem(CANCELLED_RECEIPTS_KEY, JSON.stringify(INITIAL_CANCELLED_RECEIPTS));
      return INITIAL_CANCELLED_RECEIPTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_CANCELLED_RECEIPTS;
  }
};

export const saveStoredCancelledReceipts = (records: CancelledReceipt[]): void => {
  try {
    localStorage.setItem(CANCELLED_RECEIPTS_KEY, JSON.stringify(records));
  } catch (e) {
    console.error('Failed to save cancelled receipts', e);
  }
};

/**
 * Cancel a Sabeel receipt: move transaction to cancelled list, reverse ledger
 */
export const cancelSabeelReceipt = (
  receiptNo: string,
  reason: string,
  username: string,
  financialYear: string
): { success: boolean; message: string } => {
  try {
    const transactions = getStoredSabeelTransactions();
    const ledger = getStoredSabeelLedger();
    const cancelled = getStoredCancelledReceipts();

    const txIdx = transactions.findIndex((t) => t.receiptNo === receiptNo);
    if (txIdx === -1) {
      return { success: false, message: `Receipt ${receiptNo} not found.` };
    }

    const tx = transactions[txIdx];
    const now = new Date();
    const nowStr = `${now.toLocaleDateString()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    // Create cancelled record
    const newCancelled: CancelledReceipt = {
      id: `cncl-${Date.now()}`,
      originalReceiptNo: tx.receiptNo,
      itsNumber: tx.itsNumber,
      hofName: tx.hofName,
      sabeelNo: tx.sabeelNo,
      amount: tx.amount,
      paymentMode: tx.paymentMode as SabeelPaymentMode,
      originalDate: tx.date,
      cancellationDate: now.toISOString().split('T')[0],
      cancellationReason: reason,
      cancelledBy: username,
      financialYear: tx.financialYear,
      createdAt: nowStr,
    };

    // Remove from active transactions
    const updatedTx = transactions.filter((_, i) => i !== txIdx);
    saveStoredSabeelTransactions(updatedTx);

    // Reverse ledger
    const updatedLedger = ledger.map((rec) => {
      if (rec.itsNumber === tx.itsNumber && rec.financialYear === tx.financialYear) {
        const newPaid = Math.max(0, (rec.paidAmount || 0) - tx.amount);
        const newBal = Math.max(0, rec.committedAmount - newPaid);
        return {
          ...rec,
          paidAmount: newPaid,
          balanceDue: newBal,
          status: (newBal === 0 ? 'Settled' : newPaid > 0 ? 'Partial' : 'Pending') as any,
          updatedAt: nowStr,
        };
      }
      return rec;
    });
    saveStoredSabeelLedger(updatedLedger);

    // Save cancelled record
    saveStoredCancelledReceipts([newCancelled, ...cancelled]);

    appendActivityLog(
      username,
      'Sabeel Management',
      'Cancelled Receipts',
      'DELETE',
      `Cancelled receipt ${receiptNo} for [ITS: ${tx.itsNumber}] ${tx.hofName} — Amount: ₹${tx.amount.toLocaleString('en-IN')}. Reason: ${reason}`
    );

    return { success: true, message: `Receipt ${receiptNo} successfully cancelled.` };
  } catch (e) {
    return { success: false, message: 'Cancellation failed — internal error.' };
  }
};

export const generateSabeelId = (prefix: string): string =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
