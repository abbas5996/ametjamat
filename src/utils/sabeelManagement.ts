import {
  SabeelLedgerRecord,
  SabeelTransactionEntry,
  SabeelPaymentMode,
  SabeelCategory,
  SabeelAccountStatus,
  HeadOfFamily,
} from '../types';
import { getStoredHofs } from './memberMaster';
import { appendActivityLog } from './rbac';

export const SABEEL_LEDGER_STORAGE_KEY = 'jamat_sabeel_ledger_v2';
export const SABEEL_TRANSACTIONS_STORAGE_KEY = 'jamat_sabeel_transactions_v2';

/**
 * Generates initial Sabeel Ledger records linked to Member Master HOFs
 */
export const generateInitialSabeelLedger = (hofs: HeadOfFamily[]): SabeelLedgerRecord[] => {
  const defaults: Partial<SabeelLedgerRecord>[] = [
    {
      itsNumber: '30489122',
      sabeelNo: 'SB-042',
      category: 'Residential',
      committedAmount: 24000,
      paidAmount: 18000,
    },
    {
      itsNumber: '40291844',
      sabeelNo: 'SB-015',
      category: 'Commercial',
      committedAmount: 36000,
      paidAmount: 36000,
    },
    {
      itsNumber: '50182733',
      sabeelNo: 'SB-088',
      category: 'Residential',
      committedAmount: 18000,
      paidAmount: 9000,
    },
    {
      itsNumber: '20394855',
      sabeelNo: 'SB-007',
      category: 'Special',
      committedAmount: 48000,
      paidAmount: 24000,
    },
    {
      itsNumber: '60392811',
      sabeelNo: 'SB-112',
      category: 'Residential',
      committedAmount: 24000,
      paidAmount: 0,
    },
  ];

  return hofs.map((hof, idx) => {
    const matched = defaults.find((d) => d.itsNumber === hof.itsNumber);
    const committed = matched?.committedAmount ?? 24000;
    const paid = matched?.paidAmount ?? (idx % 2 === 0 ? 12000 : 0);
    const balanceDue = Math.max(0, committed - paid);
    const status: SabeelAccountStatus =
      balanceDue === 0 ? 'Settled' : paid > 0 ? 'Partial' : 'Pending';

    return {
      id: `sb-${hof.itsNumber}-1447`,
      itsNumber: hof.itsNumber,
      hofName: hof.fullName,
      sabeelNo: matched?.sabeelNo || hof.sabeelNo || `SB-${String(idx + 101).padStart(3, '0')}`,
      mobileNumber: hof.mobileNumber,
      mohallahName: hof.mohallahName || 'Burhani Mohallah',
      financialYear: '1447-1448 Hijri',
      category: matched?.category || (idx % 4 === 1 ? 'Commercial' : 'Residential'),
      committedAmount: committed,
      paidAmount: paid,
      balanceDue,
      status,
      notes: matched?.paidAmount === matched?.committedAmount ? 'Annual dues fully cleared' : 'Quarterly installment active',
      createdAt: '1447-01-01',
      updatedAt: '1447-02-15',
    };
  });
};

/**
 * Initial historical Sabeel transactions
 */
export const INITIAL_SABEEL_TRANSACTIONS: SabeelTransactionEntry[] = [
  {
    id: 'sb-tx-101',
    receiptNo: 'RCP-SB-1447-001',
    type: 'PAYMENT',
    itsNumber: '40291844',
    hofName: 'Sheikh Huzefa Jamali',
    sabeelNo: 'SB-015',
    amount: 36000,
    paymentMode: 'Bank Transfer',
    referenceNo: 'HDFC948102941',
    financialYear: '1447-1448 Hijri',
    date: '1447-01-15',
    notes: 'Full Annual Sabeel clearance for Commercial Account',
    collectedBy: 'huzefasabeel',
    createdAt: '1447-01-15 11:20 AM',
  },
  {
    id: 'sb-tx-102',
    receiptNo: 'RCP-SB-1447-002',
    type: 'PAYMENT',
    itsNumber: '30489122',
    hofName: 'Mulla Shabbir Bhai Fakhri',
    sabeelNo: 'SB-042',
    amount: 12000,
    paymentMode: 'UPI',
    referenceNo: 'UPI/SB/30489122/881',
    financialYear: '1447-1448 Hijri',
    date: '1447-01-25',
    notes: 'Sabeel Q1 Installment payment',
    collectedBy: 'huzefasabeel',
    createdAt: '1447-01-25 03:45 PM',
  },
  {
    id: 'sb-tx-103',
    receiptNo: 'RCP-SB-1447-003',
    type: 'PAYMENT',
    itsNumber: '30489122',
    hofName: 'Mulla Shabbir Bhai Fakhri',
    sabeelNo: 'SB-042',
    amount: 6000,
    paymentMode: 'Cash',
    referenceNo: 'CASH-SB-042',
    financialYear: '1447-1448 Hijri',
    date: '1447-02-10',
    notes: 'Counter payment received at Jamat office',
    collectedBy: 'janabadmin',
    createdAt: '1447-02-10 05:10 PM',
  },
  {
    id: 'sb-tx-104',
    receiptNo: 'RCP-SB-1447-004',
    type: 'PAYMENT',
    itsNumber: '20394855',
    hofName: 'Mulla Aliasgar Hakimuddin',
    sabeelNo: 'SB-007',
    amount: 24000,
    paymentMode: 'Cheque',
    referenceNo: 'CHQ-849102',
    financialYear: '1447-1448 Hijri',
    date: '1447-02-12',
    notes: 'Advance Sabeel installment Cheque cleared',
    collectedBy: 'huzefasabeel',
    createdAt: '1447-02-12 10:15 AM',
  },
  {
    id: 'sb-tx-105',
    receiptNo: 'RCP-SB-1447-005',
    type: 'PAYMENT',
    itsNumber: '50182733',
    hofName: 'Abdeali Bhai Shujauddin',
    sabeelNo: 'SB-088',
    amount: 9000,
    paymentMode: 'UPI',
    referenceNo: 'UPI/SB/5018/391',
    financialYear: '1447-1448 Hijri',
    date: '1447-02-18',
    notes: 'Mid-term Sabeel settlement',
    collectedBy: 'huzefasabeel',
    createdAt: '1447-02-18 01:30 PM',
  },
];

// Helper to get stored Sabeel Ledger records
export const getStoredSabeelLedger = (): SabeelLedgerRecord[] => {
  try {
    const raw = localStorage.getItem(SABEEL_LEDGER_STORAGE_KEY);
    if (!raw) {
      const hofs = getStoredHofs();
      const initial = generateInitialSabeelLedger(hofs);
      localStorage.setItem(SABEEL_LEDGER_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse Sabeel Ledger from localStorage', err);
    return [];
  }
};

export const saveStoredSabeelLedger = (records: SabeelLedgerRecord[]): void => {
  try {
    localStorage.setItem(SABEEL_LEDGER_STORAGE_KEY, JSON.stringify(records));
  } catch (err) {
    console.error('Failed to save Sabeel Ledger to localStorage', err);
  }
};

// Helper to get stored Sabeel Transactions
export const getStoredSabeelTransactions = (): SabeelTransactionEntry[] => {
  try {
    const raw = localStorage.getItem(SABEEL_TRANSACTIONS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(SABEEL_TRANSACTIONS_STORAGE_KEY, JSON.stringify(INITIAL_SABEEL_TRANSACTIONS));
      return INITIAL_SABEEL_TRANSACTIONS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse Sabeel Transactions from localStorage', err);
    return INITIAL_SABEEL_TRANSACTIONS;
  }
};

export const saveStoredSabeelTransactions = (entries: SabeelTransactionEntry[]): void => {
  try {
    localStorage.setItem(SABEEL_TRANSACTIONS_STORAGE_KEY, JSON.stringify(entries));
  } catch (err) {
    console.error('Failed to save Sabeel Transactions to localStorage', err);
  }
};

/**
 * Record a Sabeel Collection Payment atomically:
 * 1. Creates a unique receipt number.
 * 2. Saves transaction entry.
 * 3. Updates member's Sabeel ledger paid amount & balance due.
 * 4. Pushes audit entry to Central Activity Log.
 */
export const recordSabeelPayment = (
  paymentData: {
    itsNumber: string;
    hofName: string;
    sabeelNo: string;
    amount: number;
    paymentMode: SabeelPaymentMode;
    referenceNo?: string;
    financialYear: string;
    date: string;
    notes?: string;
  },
  username: string
): {
  newTransaction: SabeelTransactionEntry;
  updatedLedger: SabeelLedgerRecord[];
  updatedTransactions: SabeelTransactionEntry[];
} => {
  const currentLedger = getStoredSabeelLedger();
  const currentTransactions = getStoredSabeelTransactions();

  const receiptSerial = (currentTransactions.length + 1).toString().padStart(4, '0');
  const receiptNo = `RCP-SB-${paymentData.financialYear.slice(0, 4)}-${receiptSerial}`;

  const now = new Date();
  const timeString = `${now.toLocaleDateString()} ${now.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`;

  const newTransaction: SabeelTransactionEntry = {
    id: `sb-tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    receiptNo,
    type: 'PAYMENT',
    itsNumber: paymentData.itsNumber,
    hofName: paymentData.hofName,
    sabeelNo: paymentData.sabeelNo,
    amount: paymentData.amount,
    paymentMode: paymentData.paymentMode,
    referenceNo: paymentData.referenceNo || `REF-${Date.now().toString().slice(-6)}`,
    financialYear: paymentData.financialYear,
    date: paymentData.date,
    notes: paymentData.notes || 'Counter Sabeel receipt recorded',
    collectedBy: username,
    createdAt: timeString,
  };

  const updatedTransactions = [newTransaction, ...currentTransactions];
  saveStoredSabeelTransactions(updatedTransactions);

  // Update Ledger
  const updatedLedger = currentLedger.map((record) => {
    if (
      record.itsNumber === paymentData.itsNumber &&
      record.financialYear === paymentData.financialYear
    ) {
      const newPaid = (record.paidAmount || 0) + paymentData.amount;
      const newBalance = Math.max(0, record.committedAmount - newPaid);
      const newStatus: SabeelAccountStatus =
        newBalance === 0 ? 'Settled' : 'Partial';

      return {
        ...record,
        paidAmount: newPaid,
        balanceDue: newBalance,
        status: newStatus,
        updatedAt: timeString,
      };
    }
    return record;
  });

  saveStoredSabeelLedger(updatedLedger);

  // Central Audit Log
  appendActivityLog(
    username,
    'Sabeel Management',
    'Sabeel Takhmeen & Collection',
    'ADD',
    `[ITS: ${paymentData.itsNumber}] Received Sabeel payment ₹${paymentData.amount.toLocaleString(
      'en-IN'
    )} via ${paymentData.paymentMode} for Sabeel ${paymentData.sabeelNo}. Receipt: ${receiptNo}`
  );

  return {
    newTransaction,
    updatedLedger,
    updatedTransactions,
  };
};

/**
 * Execute a Sabeel Transfer / Balance Adjustment between two accounts
 */
export const executeSabeelTransfer = (
  transferData: {
    fromIts: string;
    fromHofName: string;
    fromSabeelNo: string;
    toIts: string;
    toHofName: string;
    toSabeelNo: string;
    amount: number;
    financialYear: string;
    date: string;
    reason: string;
  },
  username: string
): {
  updatedLedger: SabeelLedgerRecord[];
  updatedTransactions: SabeelTransactionEntry[];
} => {
  const currentLedger = getStoredSabeelLedger();
  const currentTransactions = getStoredSabeelTransactions();

  const now = new Date();
  const timeString = `${now.toLocaleDateString()} ${now.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`;

  const serial = (currentTransactions.length + 1).toString().padStart(4, '0');
  const refCode = `TRF-SB-${serial}`;

  // Debit transaction from source account
  const debitTx: SabeelTransactionEntry = {
    id: `sb-tx-out-${Date.now()}`,
    receiptNo: `${refCode}-OUT`,
    type: 'TRANSFER_OUT',
    itsNumber: transferData.fromIts,
    hofName: transferData.fromHofName,
    sabeelNo: transferData.fromSabeelNo,
    amount: transferData.amount,
    paymentMode: 'Bank Transfer',
    referenceNo: refCode,
    financialYear: transferData.financialYear,
    date: transferData.date,
    notes: `Transferred balance to ${transferData.toHofName} (ITS: ${transferData.toIts}, Sabeel: ${transferData.toSabeelNo}). Reason: ${transferData.reason}`,
    toIts: transferData.toIts,
    toHofName: transferData.toHofName,
    collectedBy: username,
    createdAt: timeString,
  };

  // Credit transaction to target account
  const creditTx: SabeelTransactionEntry = {
    id: `sb-tx-in-${Date.now() + 1}`,
    receiptNo: `${refCode}-IN`,
    type: 'TRANSFER_IN',
    itsNumber: transferData.toIts,
    hofName: transferData.toHofName,
    sabeelNo: transferData.toSabeelNo,
    amount: transferData.amount,
    paymentMode: 'Bank Transfer',
    referenceNo: refCode,
    financialYear: transferData.financialYear,
    date: transferData.date,
    notes: `Received balance transfer from ${transferData.fromHofName} (ITS: ${transferData.fromIts}, Sabeel: ${transferData.fromSabeelNo}). Reason: ${transferData.reason}`,
    fromIts: transferData.fromIts,
    fromHofName: transferData.fromHofName,
    collectedBy: username,
    createdAt: timeString,
  };

  const updatedTransactions = [debitTx, creditTx, ...currentTransactions];
  saveStoredSabeelTransactions(updatedTransactions);

  // Update Ledger balances
  const updatedLedger = currentLedger.map((record) => {
    if (record.itsNumber === transferData.fromIts && record.financialYear === transferData.financialYear) {
      const newPaid = Math.max(0, (record.paidAmount || 0) - transferData.amount);
      const newBalance = Math.max(0, record.committedAmount - newPaid);
      return {
        ...record,
        paidAmount: newPaid,
        balanceDue: newBalance,
        status: newBalance === 0 ? ('Settled' as SabeelAccountStatus) : newPaid > 0 ? ('Partial' as SabeelAccountStatus) : ('Pending' as SabeelAccountStatus),
        updatedAt: timeString,
      };
    }
    if (record.itsNumber === transferData.toIts && record.financialYear === transferData.financialYear) {
      const newPaid = (record.paidAmount || 0) + transferData.amount;
      const newBalance = Math.max(0, record.committedAmount - newPaid);
      return {
        ...record,
        paidAmount: newPaid,
        balanceDue: newBalance,
        status: newBalance === 0 ? ('Settled' as SabeelAccountStatus) : ('Partial' as SabeelAccountStatus),
        updatedAt: timeString,
      };
    }
    return record;
  });

  saveStoredSabeelLedger(updatedLedger);

  // Central Audit Log
  appendActivityLog(
    username,
    'Sabeel Management',
    'Transfer & History',
    'EDIT',
    `Transferred ₹${transferData.amount.toLocaleString('en-IN')} from [ITS: ${transferData.fromIts}] ${
      transferData.fromHofName
    } to [ITS: ${transferData.toIts}] ${transferData.toHofName}. Reason: ${transferData.reason}`
  );

  return {
    updatedLedger,
    updatedTransactions,
  };
};

/**
 * Dedicated Audit logger for Sabeel module
 */
export const logSabeelAudit = (
  username: string,
  subpage: string,
  actionType: 'ADD' | 'EDIT' | 'DELETE',
  itsNumber: string,
  details: string
) => {
  appendActivityLog(
    username,
    'Sabeel Management',
    subpage,
    actionType,
    `[ITS: ${itsNumber}] ${details}`
  );
};
