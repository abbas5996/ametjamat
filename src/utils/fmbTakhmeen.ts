import {
  ThaaliRecord,
  TakhmeenRecord,
  FmbCollectionEntry,
  ThaaliStatus,
  TakhmeenTier,
  FmbPaymentMode,
  DeliveryType,
  HeadOfFamily,
} from '../types';
import { getStoredHofs } from './memberMaster';
import { appendActivityLog } from './rbac';

export const THAALI_STORAGE_KEY = 'jamat_fmb_thaalis_v2';
export const TAKHMEEN_STORAGE_KEY = 'jamat_fmb_takhmeen_v2';
export const COLLECTIONS_STORAGE_KEY = 'jamat_fmb_collections_v2';

/**
 * Generate initial Thaali records linked directly to Member Master HOFs
 */
export const generateInitialThaalis = (hofs: HeadOfFamily[]): ThaaliRecord[] => {
  const defaults: Partial<ThaaliRecord>[] = [
    {
      itsNumber: '30489122',
      thaaliNo: 'TH-084',
      status: 'Active',
      tier: 'Full',
      deliveryType: 'Home Delivery',
      assignedAddress: 'Flat 402, Al-Burhani Heights, Sector B, Burhani Park',
    },
    {
      itsNumber: '40291844',
      thaaliNo: 'TH-042',
      status: 'Active',
      tier: 'Full',
      deliveryType: 'Home Delivery',
      assignedAddress: 'House 12, Saifee Mohallah, Lane 2, Burhani Park',
    },
    {
      itsNumber: '50182733',
      thaaliNo: 'TH-119',
      status: 'Vacation',
      tier: 'Half',
      deliveryType: 'Pickup Point',
      pickupPoint: 'Sector C Community Centre Hub',
      assignedAddress: 'Flat 301, Badri Residency, Sector C, Burhani Park',
      vacationFrom: '1447-03-01',
      vacationTo: '1447-03-20',
      reason: 'Family traveling for Umrah Ziyarat',
    },
    {
      itsNumber: '20394855',
      thaaliNo: 'TH-022',
      status: 'Active',
      tier: 'Special',
      deliveryType: 'Home Delivery',
      assignedAddress: 'Villa 7, Fakhri Enclave, Sector A, Burhani Park',
    },
    {
      itsNumber: '60392811',
      thaaliNo: 'TH-155',
      status: 'Blocked',
      tier: 'Full',
      deliveryType: 'Dawat Centre',
      assignedAddress: 'Flat 104, Husami Complex, Sector B, Burhani Park',
      reason: 'Address relocated, pending verification by mohallah incharge',
    },
  ];

  return hofs.map((hof, idx) => {
    const matched = defaults.find((d) => d.itsNumber === hof.itsNumber);
    return {
      id: `th-${hof.itsNumber}`,
      itsNumber: hof.itsNumber,
      hofName: hof.fullName,
      mobileNumber: hof.mobileNumber,
      thaaliNo: matched?.thaaliNo || hof.thaaliNo || `TH-${String(idx + 101).padStart(3, '0')}`,
      status: matched?.status || (idx % 5 === 3 ? 'Vacation' : 'Active'),
      tier: matched?.tier || (idx % 3 === 0 ? 'Full' : idx % 3 === 1 ? 'Half' : 'Special'),
      deliveryType: matched?.deliveryType || 'Home Delivery',
      assignedAddress: matched?.assignedAddress || hof.fullAddress,
      pickupPoint: matched?.pickupPoint,
      mohallahName: hof.mohallahName,
      vacationFrom: matched?.vacationFrom,
      vacationTo: matched?.vacationTo,
      reason: matched?.reason,
      updatedAt: '1447-02-15',
    };
  });
};

/**
 * Generate initial Takhmeen allocation records
 */
export const generateInitialTakhmeen = (hofs: HeadOfFamily[]): TakhmeenRecord[] => {
  const sampleCommitments = [
    { its: '30489122', tier: 'Full' as TakhmeenTier, committed: 52000, paid: 35000 },
    { its: '40291844', tier: 'Full' as TakhmeenTier, committed: 75000, paid: 75000 },
    { its: '50182733', tier: 'Half' as TakhmeenTier, committed: 28000, paid: 14000 },
    { its: '20394855', tier: 'Special' as TakhmeenTier, committed: 110000, paid: 50000 },
    { its: '60392811', tier: 'Full' as TakhmeenTier, committed: 52000, paid: 0 },
  ];

  return hofs.map((hof, idx) => {
    const matched = sampleCommitments.find((s) => s.its === hof.itsNumber);
    const committed = matched ? matched.committed : 52000;
    const paid = matched ? matched.paid : (idx % 2 === 0 ? 25000 : 0);
    const balanceDue = Math.max(0, committed - paid);
    const status: TakhmeenRecord['status'] =
      balanceDue === 0 ? 'Completed' : paid > 0 ? 'Partial' : 'Unpaid';

    return {
      id: `tak-${hof.itsNumber}-1447`,
      itsNumber: hof.itsNumber,
      hofName: hof.fullName,
      mobileNumber: hof.mobileNumber,
      financialYear: '1447-1448 Hijri',
      tier: matched?.tier || 'Full',
      committedAmount: committed,
      paidAmount: paid,
      balanceDue,
      status,
      remarks: matched?.paid === matched?.committed ? 'Fully settled during Rajab' : 'Installment mode active',
      createdAt: '1447-01-01',
      updatedAt: '1447-02-20',
    };
  });
};

/**
 * Initial Collections Seed Data
 */
export const INITIAL_COLLECTIONS: FmbCollectionEntry[] = [
  {
    id: 'col-101',
    receiptNo: 'RCP-FMB-1447-001',
    itsNumber: '40291844',
    hofName: 'Sheikh Huzefa Jamali',
    amount: 50000,
    paymentMode: 'Bank Transfer',
    referenceNo: 'HDFC9842104928',
    date: '1447-01-15',
    financialYear: '1447-1448 Hijri',
    notes: 'Advance Annual Takhmeen installment 1',
    collectedBy: 'janabadmin',
    createdAt: '1447-01-15 11:30 AM',
  },
  {
    id: 'col-102',
    receiptNo: 'RCP-FMB-1447-002',
    itsNumber: '40291844',
    hofName: 'Sheikh Huzefa Jamali',
    amount: 25000,
    paymentMode: 'UPI',
    referenceNo: 'UPI/4029/984712',
    date: '1447-02-01',
    financialYear: '1447-1448 Hijri',
    notes: 'Final settlement of 1447 Takhmeen',
    collectedBy: 'taherfmb',
    createdAt: '1447-02-01 02:15 PM',
  },
  {
    id: 'col-103',
    receiptNo: 'RCP-FMB-1447-003',
    itsNumber: '30489122',
    hofName: 'Mulla Shabbir Bhai Fakhri',
    amount: 35000,
    paymentMode: 'Cheque',
    referenceNo: 'CHQ-582910',
    date: '1447-01-20',
    financialYear: '1447-1448 Hijri',
    notes: 'First installment submitted at Jamaat office',
    collectedBy: 'taherfmb',
    createdAt: '1447-01-20 04:00 PM',
  },
  {
    id: 'col-104',
    receiptNo: 'RCP-FMB-1447-004',
    itsNumber: '20394855',
    hofName: 'Mulla Aliasgar Hakimuddin',
    amount: 50000,
    paymentMode: 'Bank Transfer',
    referenceNo: 'ICIC00294821',
    date: '1447-02-10',
    financialYear: '1447-1448 Hijri',
    notes: 'Shehrullah Advance installment',
    collectedBy: 'janabadmin',
    createdAt: '1447-02-10 10:45 AM',
  },
  {
    id: 'col-105',
    receiptNo: 'RCP-FMB-1447-005',
    itsNumber: '50182733',
    hofName: 'Abdeali Bhai Shujauddin',
    amount: 14000,
    paymentMode: 'Cash',
    referenceNo: 'CASH-REC-084',
    date: '1447-02-14',
    financialYear: '1447-1448 Hijri',
    notes: 'Counter payment received by Cashier',
    collectedBy: 'taherfmb',
    createdAt: '1447-02-14 06:20 PM',
  },
];

// Helper to get stored Thaali records
export const getStoredThaalis = (): ThaaliRecord[] => {
  try {
    const raw = localStorage.getItem(THAALI_STORAGE_KEY);
    if (!raw) {
      const hofs = getStoredHofs();
      const initial = generateInitialThaalis(hofs);
      localStorage.setItem(THAALI_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse Thaalis from localStorage', err);
    return [];
  }
};

export const saveStoredThaalis = (records: ThaaliRecord[]): void => {
  try {
    localStorage.setItem(THAALI_STORAGE_KEY, JSON.stringify(records));
  } catch (err) {
    console.error('Failed to save Thaalis to localStorage', err);
  }
};

// Helper to get stored Takhmeen records
export const getStoredTakhmeens = (): TakhmeenRecord[] => {
  try {
    const raw = localStorage.getItem(TAKHMEEN_STORAGE_KEY);
    if (!raw) {
      const hofs = getStoredHofs();
      const initial = generateInitialTakhmeen(hofs);
      localStorage.setItem(TAKHMEEN_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse Takhmeens from localStorage', err);
    return [];
  }
};

export const saveStoredTakhmeens = (records: TakhmeenRecord[]): void => {
  try {
    localStorage.setItem(TAKHMEEN_STORAGE_KEY, JSON.stringify(records));
  } catch (err) {
    console.error('Failed to save Takhmeens to localStorage', err);
  }
};

// Helper to get stored Collections
export const getStoredCollections = (): FmbCollectionEntry[] => {
  try {
    const raw = localStorage.getItem(COLLECTIONS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(COLLECTIONS_STORAGE_KEY, JSON.stringify(INITIAL_COLLECTIONS));
      return INITIAL_COLLECTIONS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse Collections from localStorage', err);
    return INITIAL_COLLECTIONS;
  }
};

export const saveStoredCollections = (records: FmbCollectionEntry[]): void => {
  try {
    localStorage.setItem(COLLECTIONS_STORAGE_KEY, JSON.stringify(records));
  } catch (err) {
    console.error('Failed to save Collections to localStorage', err);
  }
};

/**
 * Record a collection payment:
 * 1. Generates an official receipt number.
 * 2. Saves collection entry to collection store.
 * 3. Atomically updates the member's Takhmeen balance due & status.
 * 4. Pushes an audit entry to the Central Activity Log.
 */
export const recordCollectionPayment = (
  paymentData: {
    itsNumber: string;
    hofName: string;
    amount: number;
    paymentMode: FmbPaymentMode;
    referenceNo?: string;
    financialYear: string;
    notes?: string;
    date: string;
  },
  username: string
): {
  newCollection: FmbCollectionEntry;
  updatedTakhmeens: TakhmeenRecord[];
  updatedCollections: FmbCollectionEntry[];
} => {
  const currentCollections = getStoredCollections();
  const currentTakhmeens = getStoredTakhmeens();

  const receiptSerial = (currentCollections.length + 1).toString().padStart(4, '0');
  const receiptNo = `RCP-FMB-${paymentData.financialYear.slice(0, 4)}-${receiptSerial}`;

  const now = new Date();
  const timeString = `${now.toLocaleDateString()} ${now.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`;

  const newCollection: FmbCollectionEntry = {
    id: `col-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    receiptNo,
    itsNumber: paymentData.itsNumber,
    hofName: paymentData.hofName,
    amount: paymentData.amount,
    paymentMode: paymentData.paymentMode,
    referenceNo: paymentData.referenceNo || `REF-${Date.now().toString().slice(-6)}`,
    date: paymentData.date,
    financialYear: paymentData.financialYear,
    notes: paymentData.notes,
    collectedBy: username,
    createdAt: timeString,
  };

  const updatedCollections = [newCollection, ...currentCollections];
  saveStoredCollections(updatedCollections);

  // Update Takhmeen Ledger
  const updatedTakhmeens = currentTakhmeens.map((tak) => {
    if (
      tak.itsNumber === paymentData.itsNumber &&
      tak.financialYear === paymentData.financialYear
    ) {
      const newPaid = (tak.paidAmount || 0) + paymentData.amount;
      const newBalance = Math.max(0, tak.committedAmount - newPaid);
      const newStatus: TakhmeenRecord['status'] =
        newBalance === 0 ? 'Completed' : 'Partial';

      return {
        ...tak,
        paidAmount: newPaid,
        balanceDue: newBalance,
        status: newStatus,
        updatedAt: timeString,
      };
    }
    return tak;
  });

  saveStoredTakhmeens(updatedTakhmeens);

  // Central Audit Log
  appendActivityLog(
    username,
    'FMB & Takhmeen',
    'Daily Collection & Dues',
    'ADD',
    `[ITS: ${paymentData.itsNumber}] Received ₹${paymentData.amount.toLocaleString('en-IN')} via ${
      paymentData.paymentMode
    } (Receipt: ${receiptNo}). Ref: ${newCollection.referenceNo}`
  );

  return {
    newCollection,
    updatedTakhmeens,
    updatedCollections,
  };
};

/**
 * Dedicated Audit logger for FMB module
 */
export const logFmbAudit = (
  username: string,
  subpage: string,
  actionType: 'ADD' | 'EDIT' | 'DELETE',
  itsNumber: string,
  details: string
) => {
  appendActivityLog(
    username,
    'FMB & Takhmeen',
    subpage,
    actionType,
    `[ITS: ${itsNumber}] ${details}`
  );
};
