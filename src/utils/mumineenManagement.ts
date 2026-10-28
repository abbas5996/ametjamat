/**
 * Mumineen Management Types, Storage & Utilities
 * Powers Part 1B of the Jamaat ERP with all 13 sub-pages
 */

import { HeadOfFamily, FamilyMember, Mohallah, BloodGroup, Gender, MaritalStatus, FamilyRelation } from '../types';
import { getStoredHofs, saveStoredHofs, getStoredMohallahs } from './memberMaster';
import { getStoredSabeelLedger } from './sabeelManagement';
import { getStoredTakhmeens, getStoredCollections } from './fmbTakhmeen';
import { appendActivityLog } from './rbac';

// ── Types ──────────────────────────────────────────────────────────────────

export interface NonLocalMumin {
  id: string;
  itsNumber: string;
  fullName: string;
  originalCity: string;
  localAddress: string;
  hostHofIts: string;
  hostHofName: string;
  stayFrom: string;
  stayTo: string;
  purpose: string;
  mobileNumber: string;
  status: 'Active' | 'Returned';
  createdAt: string;
}

export interface DeletedMuminRecord {
  id: string;
  originalHof: HeadOfFamily;
  deletedBy: string;
  deletedAt: string;
  reason: string;
  notes?: string;
}

export type SmartCardType = 'Mifare 1K' | 'NFC Type 2' | 'DesFire EV1' | 'Digital QR';
export type SmartCardStatus = 'Active' | 'Blocked' | 'Lost' | 'Damaged';

export interface SmartCardRecord {
  id: string;
  itsNumber: string;
  memberName: string;
  mohallahName: string;
  cardUid: string;
  cardType: SmartCardType;
  issuedDate: string;
  expiryDate: string;
  status: SmartCardStatus;
  accessGates: string[];
  notes?: string;
  createdAt: string;
}

export type SafaiChitthiStatus = 'Issued' | 'Blocked' | 'Cancelled';

export interface SafaiChitthiRecord {
  id: string;
  chitthiNo: string;
  itsNumber: string;
  fullName: string;
  destinationJamaat: string;
  reason: string;
  departureDate: string;
  totalDuesAtRequest: number;
  duesBreakdown: {
    sabeel: number;
    fmb: number;
    hall: number;
  };
  status: SafaiChitthiStatus;
  overrideBy?: string;
  overrideReason?: string;
  issuedDate: string;
  issuedBy: string;
  notes?: string;
}

export interface JamaatCategory {
  id: string;
  code: string;
  name: string;
  description: string;
  priorityRank: number;
  fmbDiscountPct: number;
  sabeelDiscountPct: number;
  privilegeNotes?: string;
  createdAt: string;
}

export type CommentCategory =
  | 'Financial Follow-up'
  | 'Family Matter'
  | 'Address Verification'
  | 'General Administrative'
  | 'Disciplinary / Caution';

export type CommentPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export interface OutstandingComment {
  id: string;
  itsNumber: string;
  memberName: string;
  author: string;
  category: CommentCategory;
  priority: CommentPriority;
  comment: string;
  isResolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  createdAt: string;
}

export interface InactiveMuminRecord {
  id: string;
  itsNumber: string;
  fullName: string;
  reason: string;
  foreignLocation: string;
  inactivatedDate: string;
  expectedReturnDate: string;
  notes?: string;
}

// ── Storage Keys ────────────────────────────────────────────────────────────

export const NON_LOCAL_STORAGE_KEY = 'jamat_non_local_mumineen_v1';
export const DELETED_MUMINEEN_STORAGE_KEY = 'jamat_deleted_mumineen_v1';
export const SMART_CARDS_STORAGE_KEY = 'jamat_smart_cards_v1';
export const SAFAI_CHITTHI_STORAGE_KEY = 'jamat_safai_chitthies_v1';
export const JAMAAT_CATEGORIES_STORAGE_KEY = 'jamat_jamaat_categories_v1';
export const MEMBER_COMMENTS_STORAGE_KEY = 'jamat_member_comments_v1';
export const INACTIVE_MUMINEEN_STORAGE_KEY = 'jamat_inactive_mumineen_v1';

// ── Initial Seed Data ───────────────────────────────────────────────────────

export const INITIAL_NON_LOCAL_MUMINEEN: NonLocalMumin[] = [
  {
    id: 'nlm-1',
    itsNumber: '40591022',
    fullName: 'Mulla Yusuf Bhai Dungarpurwala',
    originalCity: 'Surat (Zampa Bazaar)',
    localAddress: 'Flat 204, Al-Burhani Heights, Sector B, Burhani Park',
    hostHofIts: '30489122',
    hostHofName: 'Mulla Shabbir Bhai Fakhri',
    stayFrom: '2025-05-01',
    stayTo: '2025-08-31',
    purpose: 'Commercial Business setup & Engineering contracts',
    mobileNumber: '9821122334',
    status: 'Active',
    createdAt: '2025-05-01',
  },
  {
    id: 'nlm-2',
    itsNumber: '50123984',
    fullName: 'Shk. Mustafa Bhai Lokhandwala',
    originalCity: 'Mumbai (Bhendi Bazaar)',
    localAddress: 'Flat 102, Saifee Mahal, Sector A, Burhani Park',
    hostHofIts: '20391823',
    hostHofName: 'Mulla Huzefa Bhai Jamali',
    stayFrom: '2025-04-10',
    stayTo: '2025-06-15',
    purpose: 'Medical treatment & family ziyarat trip',
    mobileNumber: '9820099887',
    status: 'Active',
    createdAt: '2025-04-10',
  },
  {
    id: 'nlm-3',
    itsNumber: '60192837',
    fullName: 'Huzefa Bhai Godhrawala',
    originalCity: 'Karachi (Saddar)',
    localAddress: 'Bldg 4, Sector C, Burhani Park',
    hostHofIts: '30491024',
    hostHofName: 'Mulla Taher Bhai Vajihi',
    stayFrom: '2025-01-15',
    stayTo: '2025-03-20',
    purpose: 'Visiting parents during Ashara',
    mobileNumber: '9820011445',
    status: 'Returned',
    createdAt: '2025-01-15',
  },
];

export const INITIAL_DELETED_MUMINEEN: DeletedMuminRecord[] = [
  {
    id: 'del-1',
    originalHof: {
      id: 'hof-del-901',
      itsNumber: '10992834',
      fullName: 'Sheikh Quresh Bhai Rampurawala',
      fatherName: 'Ibrahim Bhai',
      surname: 'Rampurawala',
      mobileNumber: '9890123456',
      whatsappNumber: '9890123456',
      fullAddress: 'Flat 101, Old Najmi Wing, Burhani Park',
      occupation: 'Hardware Merchant',
      mohallahId: 'MOH-SEC-D',
      mohallahName: 'Najmi Mohallah (Sector D)',
      status: 'Inactive',
      sabeelNo: 'SB-099',
      thaaliNo: 'TH-199',
      familyMembers: [],
    },
    deletedBy: 'janabadmin',
    deletedAt: '2025-03-10 11:30 AM',
    reason: 'Family migrated permanently to Nairobi, Kenya Jamaat.',
    notes: 'Safai chitthi issued and dues settled prior to archiving.',
  },
  {
    id: 'del-2',
    originalHof: {
      id: 'hof-del-902',
      itsNumber: '10884920',
      fullName: 'Mulla Hatim Bhai Vasi',
      fatherName: 'Gulamabbas Bhai',
      surname: 'Vasi',
      mobileNumber: '9822334455',
      whatsappNumber: '9822334455',
      fullAddress: 'Flat 305, Sector A, Burhani Park',
      occupation: 'Textile Wholesale',
      mohallahId: 'MOH-SEC-A',
      mohallahName: 'Saifee Mohallah (Sector A)',
      status: 'Inactive',
      sabeelNo: 'SB-112',
      familyMembers: [],
    },
    deletedBy: 'janabadmin',
    deletedAt: '2025-02-18 04:15 PM',
    reason: 'Duplicate ITS record entered during manual import.',
    notes: 'Merged into primary HOF 30489122.',
  },
];

export const INITIAL_SMART_CARDS: SmartCardRecord[] = [
  {
    id: 'sc-1',
    itsNumber: '30489122',
    memberName: 'Mulla Shabbir Bhai Fakhri',
    mohallahName: 'Burhani Mohallah (Sector B)',
    cardUid: 'E2-80-68-1A-9F',
    cardType: 'Mifare 1K',
    issuedDate: '2024-01-01',
    expiryDate: '2027-12-31',
    status: 'Active',
    accessGates: ['Masjid Main Gate', 'Mawaid Hall Entrance', 'Parking Gate B'],
    notes: 'Issued with VIP Khidmatguzaar privileges',
    createdAt: '2024-01-01',
  },
  {
    id: 'sc-2',
    itsNumber: '20391823',
    memberName: 'Mulla Huzefa Bhai Jamali',
    mohallahName: 'Saifee Mohallah (Sector A)',
    cardUid: 'A4-9F-12-3D-88',
    cardType: 'DesFire EV1',
    issuedDate: '2024-02-15',
    expiryDate: '2027-12-31',
    status: 'Active',
    accessGates: ['Masjid Main Gate', 'Mawaid Hall Entrance', 'Admin Office'],
    notes: 'Incharge access clearance enabled',
    createdAt: '2024-02-15',
  },
  {
    id: 'sc-3',
    itsNumber: '30491024',
    memberName: 'Mulla Taher Bhai Vajihi',
    mohallahName: 'Badri Mohallah (Sector C)',
    cardUid: 'B8-33-01-F4-11',
    cardType: 'Mifare 1K',
    issuedDate: '2024-03-10',
    expiryDate: '2027-12-31',
    status: 'Active',
    accessGates: ['Masjid Main Gate', 'FMB Central Kitchen'],
    notes: 'FMB committee gate badge',
    createdAt: '2024-03-10',
  },
  {
    id: 'sc-4',
    itsNumber: '20381044',
    memberName: 'Mulla Abbas Bhai Rajkotwala',
    mohallahName: 'Najmi Mohallah (Sector D)',
    cardUid: 'D1-44-88-90-2E',
    cardType: 'Mifare 1K',
    issuedDate: '2024-01-10',
    expiryDate: '2025-01-10',
    status: 'Lost',
    accessGates: ['Masjid Main Gate'],
    notes: 'Reported lost by member on 2025-03-01. RFID disabled.',
    createdAt: '2024-01-10',
  },
];

export const INITIAL_SAFAI_CHITTHIES: SafaiChitthiRecord[] = [
  {
    id: 'sc-entry-1',
    chitthiNo: 'SC-1447-001',
    itsNumber: '30489122',
    fullName: 'Mulla Shabbir Bhai Fakhri',
    destinationJamaat: 'Anjuman-e-Najmi (Dubai, UAE)',
    reason: 'Family employment relocation',
    departureDate: '2025-09-01',
    totalDuesAtRequest: 14500,
    duesBreakdown: { sabeel: 8500, fmb: 6000, hall: 0 },
    status: 'Blocked',
    issuedDate: '2025-04-10',
    issuedBy: 'janabadmin',
    notes: 'Automated clearance check flagged ₹14,500 pending dues. Clearance certificate withheld until dues cleared.',
  },
  {
    id: 'sc-entry-2',
    chitthiNo: 'SC-1447-002',
    itsNumber: '20391823',
    fullName: 'Mulla Huzefa Bhai Jamali',
    destinationJamaat: 'Anjuman-e-Saifee (Surat, India)',
    reason: 'Daughter nikah and permanent home shifting',
    departureDate: '2025-08-15',
    totalDuesAtRequest: 0,
    duesBreakdown: { sabeel: 0, fmb: 0, hall: 0 },
    status: 'Issued',
    issuedDate: '2025-04-01',
    issuedBy: 'janabadmin',
    notes: 'All Jamaat accounts verified NIL dues. Official clearance granted.',
  },
  {
    id: 'sc-entry-3',
    chitthiNo: 'SC-1447-003',
    itsNumber: '20381044',
    fullName: 'Mulla Abbas Bhai Rajkotwala',
    destinationJamaat: 'Anjuman-e-Burhani (Mumbai, India)',
    reason: 'New factory establishment',
    departureDate: '2025-10-01',
    totalDuesAtRequest: 22000,
    duesBreakdown: { sabeel: 12000, fmb: 10000, hall: 0 },
    status: 'Blocked',
    issuedDate: '2025-04-18',
    issuedBy: 'janabadmin',
    notes: 'Pending Sabeel & FMB takhmeen instalments unpaid. Request on hold.',
  },
];

export const INITIAL_JAMAAT_CATEGORIES: JamaatCategory[] = [
  {
    id: 'cat-1',
    code: 'CAT-A-PLUS',
    name: 'Category A+ (Khidmatguzaar / Trustees)',
    description: 'Executive committee trustees, honorary office bearers and senior khidmatguzaars.',
    priorityRank: 1,
    fmbDiscountPct: 0,
    sabeelDiscountPct: 0,
    privilegeNotes: 'Priority mawaid bookings and front-row majlis seating.',
    createdAt: '2024-01-01',
  },
  {
    id: 'cat-2',
    code: 'CAT-A',
    name: 'Category A (Senior Prominent / Industrialist)',
    description: 'Prominent business owners, donors and major takhmeen contributors.',
    priorityRank: 2,
    fmbDiscountPct: 0,
    sabeelDiscountPct: 0,
    privilegeNotes: 'Annual general assembly voting privileges.',
    createdAt: '2024-01-01',
  },
  {
    id: 'cat-3',
    code: 'CAT-B',
    name: 'Category B (General Residents)',
    description: 'Standard resident families residing within Burhani Park complex.',
    priorityRank: 3,
    fmbDiscountPct: 0,
    sabeelDiscountPct: 0,
    privilegeNotes: 'Full access to complex facilities and regular thaali service.',
    createdAt: '2024-01-01',
  },
  {
    id: 'cat-4',
    code: 'CAT-C',
    name: 'Category C (Youth & University Students)',
    description: 'Single working professionals, MSB alumni, and college students.',
    priorityRank: 4,
    fmbDiscountPct: 20,
    sabeelDiscountPct: 25,
    privilegeNotes: 'Concession on Sabeel contributions during full-time study.',
    createdAt: '2024-01-01',
  },
  {
    id: 'cat-5',
    code: 'CAT-D',
    name: 'Category D (Assisted / Concession Scheme)',
    description: 'Widows, low-income mumineen, and medical hardship cases approved by Amil Saheb.',
    priorityRank: 5,
    fmbDiscountPct: 50,
    sabeelDiscountPct: 70,
    privilegeNotes: 'Subsidy backed by Jamaat Qardan Hasana and Imdaad Fund.',
    createdAt: '2024-01-01',
  },
];

export const INITIAL_OUTSTANDING_COMMENTS: OutstandingComment[] = [
  {
    id: 'com-1',
    itsNumber: '30489122',
    memberName: 'Mulla Shabbir Bhai Fakhri',
    author: 'janabadmin',
    category: 'Financial Follow-up',
    priority: 'Medium',
    comment: 'Member requested installment facility for pending sabeel dues before Ramadan 1447.',
    isResolved: false,
    createdAt: '2025-03-01 10:30 AM',
  },
  {
    id: 'com-2',
    itsNumber: '20391823',
    memberName: 'Mulla Huzefa Bhai Jamali',
    author: 'janabadmin',
    category: 'Address Verification',
    priority: 'Low',
    comment: 'Address verified physically by Mohallah Incharge. Flat 102 Saifee Mahal confirmed.',
    isResolved: true,
    resolvedAt: '2025-03-15 02:00 PM',
    resolvedBy: 'janabadmin',
    createdAt: '2025-02-10 11:00 AM',
  },
  {
    id: 'com-3',
    itsNumber: '20381044',
    memberName: 'Mulla Abbas Bhai Rajkotwala',
    author: 'janabadmin',
    category: 'Disciplinary / Caution',
    priority: 'High',
    comment: 'Thaali delivery address changed repeatedly without notifying Mohallah Incharge. Safai chitthi on hold.',
    isResolved: false,
    createdAt: '2025-04-05 05:20 PM',
  },
  {
    id: 'com-4',
    itsNumber: '30491024',
    memberName: 'Mulla Taher Bhai Vajihi',
    author: 'taherfmb',
    category: 'General Administrative',
    priority: 'Low',
    comment: 'Family member wedding registration planned for Shawwal 1447.',
    isResolved: false,
    createdAt: '2025-04-12 09:15 AM',
  },
];

export const INITIAL_INACTIVE_MUMINEEN: InactiveMuminRecord[] = [
  {
    id: 'inact-1',
    itsNumber: '10992834',
    fullName: 'Sheikh Quresh Bhai Rampurawala',
    reason: 'Long-term deputation abroad in East Africa',
    foreignLocation: 'Nairobi, Kenya',
    inactivatedDate: '2025-01-15',
    expectedReturnDate: '2026-06-30',
    notes: 'Thaali paused. Sabeel status active on NRI tier.',
  },
  {
    id: 'inact-2',
    itsNumber: '10884920',
    fullName: 'Mulla Hatim Bhai Vasi',
    reason: 'University Master Degree in UK',
    foreignLocation: 'London, United Kingdom',
    inactivatedDate: '2024-09-01',
    expectedReturnDate: '2026-08-31',
    notes: 'Member will resume active status upon graduation.',
  },
];

// ── Storage Getters & Setters ───────────────────────────────────────────────

export const getStoredNonLocalMumineen = (): NonLocalMumin[] => {
  try {
    const raw = localStorage.getItem(NON_LOCAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(NON_LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_NON_LOCAL_MUMINEEN));
      return INITIAL_NON_LOCAL_MUMINEEN;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_NON_LOCAL_MUMINEEN;
  }
};

export const saveStoredNonLocalMumineen = (records: NonLocalMumin[]): void => {
  try {
    localStorage.setItem(NON_LOCAL_STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    console.error('Failed to save non-local mumineen', e);
  }
};

export const getStoredDeletedMumineen = (): DeletedMuminRecord[] => {
  try {
    const raw = localStorage.getItem(DELETED_MUMINEEN_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(DELETED_MUMINEEN_STORAGE_KEY, JSON.stringify(INITIAL_DELETED_MUMINEEN));
      return INITIAL_DELETED_MUMINEEN;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_DELETED_MUMINEEN;
  }
};

export const saveStoredDeletedMumineen = (records: DeletedMuminRecord[]): void => {
  try {
    localStorage.setItem(DELETED_MUMINEEN_STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    console.error('Failed to save deleted mumineen', e);
  }
};

export const getStoredSmartCards = (): SmartCardRecord[] => {
  try {
    const raw = localStorage.getItem(SMART_CARDS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(SMART_CARDS_STORAGE_KEY, JSON.stringify(INITIAL_SMART_CARDS));
      return INITIAL_SMART_CARDS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_SMART_CARDS;
  }
};

export const saveStoredSmartCards = (records: SmartCardRecord[]): void => {
  try {
    localStorage.setItem(SMART_CARDS_STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    console.error('Failed to save smart cards', e);
  }
};

export const getStoredSafaiChitthies = (): SafaiChitthiRecord[] => {
  try {
    const raw = localStorage.getItem(SAFAI_CHITTHI_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(SAFAI_CHITTHI_STORAGE_KEY, JSON.stringify(INITIAL_SAFAI_CHITTHIES));
      return INITIAL_SAFAI_CHITTHIES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_SAFAI_CHITTHIES;
  }
};

export const saveStoredSafaiChitthies = (records: SafaiChitthiRecord[]): void => {
  try {
    localStorage.setItem(SAFAI_CHITTHI_STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    console.error('Failed to save safai chitthies', e);
  }
};

export const getStoredJamaatCategories = (): JamaatCategory[] => {
  try {
    const raw = localStorage.getItem(JAMAAT_CATEGORIES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(JAMAAT_CATEGORIES_STORAGE_KEY, JSON.stringify(INITIAL_JAMAAT_CATEGORIES));
      return INITIAL_JAMAAT_CATEGORIES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_JAMAAT_CATEGORIES;
  }
};

export const saveStoredJamaatCategories = (records: JamaatCategory[]): void => {
  try {
    localStorage.setItem(JAMAAT_CATEGORIES_STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    console.error('Failed to save jamaat categories', e);
  }
};

export const getStoredOutstandingComments = (): OutstandingComment[] => {
  try {
    const raw = localStorage.getItem(MEMBER_COMMENTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(MEMBER_COMMENTS_STORAGE_KEY, JSON.stringify(INITIAL_OUTSTANDING_COMMENTS));
      return INITIAL_OUTSTANDING_COMMENTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_OUTSTANDING_COMMENTS;
  }
};

export const saveStoredOutstandingComments = (records: OutstandingComment[]): void => {
  try {
    localStorage.setItem(MEMBER_COMMENTS_STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    console.error('Failed to save member comments', e);
  }
};

export const getStoredInactiveMumineen = (): InactiveMuminRecord[] => {
  try {
    const raw = localStorage.getItem(INACTIVE_MUMINEEN_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(INACTIVE_MUMINEEN_STORAGE_KEY, JSON.stringify(INITIAL_INACTIVE_MUMINEEN));
      return INITIAL_INACTIVE_MUMINEEN;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_INACTIVE_MUMINEEN;
  }
};

export const saveStoredInactiveMumineen = (records: InactiveMuminRecord[]): void => {
  try {
    localStorage.setItem(INACTIVE_MUMINEEN_STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    console.error('Failed to save inactive mumineen', e);
  }
};

// ── Financial Calculation Helper ────────────────────────────────────────────

export interface ConsolidatedDues {
  itsNumber: string;
  fullName: string;
  sabeelDue: number;
  fmbDue: number;
  hallDue: number;
  totalDue: number;
  status: 'CLEAR' | 'PENDING' | 'OVERDUE';
}

/**
 * Calculates live consolidated dues for an ITS number across Sabeel, FMB and Hall modules
 */
export const calculateMuminOutstandingDues = (itsNumber: string, hofName?: string): ConsolidatedDues => {
  // 1. Sabeel dues
  const sabeelRecords = getStoredSabeelLedger();
  const sabeel = sabeelRecords.find((s) => s.itsNumber === itsNumber);
  const sabeelDue = sabeel ? Math.max(0, sabeel.balanceDue ?? (sabeel.committedAmount - sabeel.paidAmount)) : 0;

  // 2. FMB dues
  const takhmeens = getStoredTakhmeens();
  const takhmeen = takhmeens.find((t) => t.itsNumber === itsNumber);
  let fmbDue = 0;
  if (takhmeen) {
    const collections = getStoredCollections().filter((c) => c.itsNumber === itsNumber);
    const paid = collections.reduce((acc, c) => acc + c.amount, 0);
    fmbDue = Math.max(0, takhmeen.committedAmount - paid);
  }

  // 3. Hall booking simulated dummy dues if applicable
  const hallDue = 0;

  const totalDue = sabeelDue + fmbDue + hallDue;
  const status = totalDue === 0 ? 'CLEAR' : totalDue > 10000 ? 'OVERDUE' : 'PENDING';

  return {
    itsNumber,
    fullName: hofName || (sabeel?.hofName || 'Mumin Record'),
    sabeelDue,
    fmbDue,
    hallDue,
    totalDue,
    status,
  };
};

// ── Soft Delete & Restore Actions ───────────────────────────────────────────

export const softDeleteMumin = (
  itsNumber: string,
  reason: string,
  deletedBy: string
): { success: boolean; message: string } => {
  const hofs = getStoredHofs();
  const target = hofs.find((h) => h.itsNumber === itsNumber);
  if (!target) {
    return { success: false, message: `Member with ITS ${itsNumber} not found.` };
  }

  const newDeletedRecord: DeletedMuminRecord = {
    id: `del-${Date.now()}`,
    originalHof: target,
    deletedBy,
    deletedAt: new Date().toLocaleString(),
    reason: reason || 'Administrative archival',
  };

  const currentDeleted = getStoredDeletedMumineen();
  saveStoredDeletedMumineen([newDeletedRecord, ...currentDeleted]);

  // Remove from active HOFs
  const remainingHofs = hofs.filter((h) => h.itsNumber !== itsNumber);
  saveStoredHofs(remainingHofs);

  appendActivityLog(
    deletedBy,
    'Mumineen Master',
    'Delete Mumineen List',
    'DELETE',
    `Soft-deleted HOF @${target.fullName} (ITS: ${itsNumber}). Reason: ${reason}`
  );

  return { success: true, message: `Member ${target.fullName} moved to Delete List.` };
};

export const restoreDeletedMumin = (
  deletedId: string,
  restoredBy: string
): { success: boolean; message: string } => {
  const deletedRecords = getStoredDeletedMumineen();
  const record = deletedRecords.find((r) => r.id === deletedId);
  if (!record) {
    return { success: false, message: 'Deleted record not found.' };
  }

  // Restore to active HOFs
  const hofs = getStoredHofs();
  const restoredHof: HeadOfFamily = {
    ...record.originalHof,
    status: 'Active',
    updatedAt: new Date().toISOString(),
  };

  saveStoredHofs([restoredHof, ...hofs]);
  saveStoredDeletedMumineen(deletedRecords.filter((r) => r.id !== deletedId));

  appendActivityLog(
    restoredBy,
    'Mumineen Master',
    'Delete Mumineen List',
    'ADD',
    `Restored HOF @${restoredHof.fullName} (ITS: ${restoredHof.itsNumber}) from recycle bin.`
  );

  return { success: true, message: `Member ${restoredHof.fullName} successfully restored to active directory.` };
};

export const permanentlyDeleteMumin = (
  deletedId: string,
  purgedBy: string
): { success: boolean; message: string } => {
  const deletedRecords = getStoredDeletedMumineen();
  const record = deletedRecords.find((r) => r.id === deletedId);
  if (!record) {
    return { success: false, message: 'Deleted record not found.' };
  }

  saveStoredDeletedMumineen(deletedRecords.filter((r) => r.id !== deletedId));

  appendActivityLog(
    purgedBy,
    'Mumineen Master',
    'Delete Mumineen List',
    'DELETE',
    `Permanently purged archive record for ITS ${record.originalHof.itsNumber}.`
  );

  return { success: true, message: 'Record permanently deleted from database.' };
};
