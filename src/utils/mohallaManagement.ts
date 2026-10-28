/**
 * Mohalla Management Utility
 * Handles Mohalla master, Sub-Mohalla master, Incharge Master,
 * and Assign Incharge — with full localStorage persistence.
 */

import { appendActivityLog } from './rbac';

// ── Types ───────────────────────────────────────────────────────────────────

export interface SubMohallah {
  id: string;
  mohallaId: string;     // parent mohalla id
  mohallaName: string;   // denormalized for display
  name: string;
  code: string;
  description?: string;
  totalFamilies: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MohallaIncharge {
  id: string;
  itsNumber: string;
  fullName: string;
  mobileNumber: string;
  whatsappNumber?: string;
  designation: string;   // e.g. "Sector Incharge", "Sub-Sector Incharge"
  email?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MohallaAssignment {
  id: string;
  mohallaId: string;
  mohallaName: string;
  subMohallaId?: string;
  subMohallaName?: string;
  inchargeId: string;
  inchargeName: string;
  inchargeIts: string;
  inchargeMobile: string;
  role: 'Primary' | 'Secondary' | 'Backup';
  assignedFrom: string;
  assignedTo?: string;
  isActive: boolean;
  notes?: string;
  assignedBy: string;
  createdAt: string;
  updatedAt: string;
}

// ── Storage Keys ─────────────────────────────────────────────────────────────

export const SUB_MOHALLA_KEY = 'jamat_sub_mohalla_v1';
export const INCHARGE_MASTER_KEY = 'jamat_incharge_master_v1';
export const MOHALLA_ASSIGNMENT_KEY = 'jamat_mohalla_assignments_v1';

// ── Seed Data ────────────────────────────────────────────────────────────────

export const INITIAL_SUB_MOHALLAHS: SubMohallah[] = [
  {
    id: 'sub-moh-001',
    mohallaId: 'MOH-SEC-A',
    mohallaName: 'Saifee Mohallah (Sector A)',
    name: 'Saifee Block A1',
    code: 'SEC-A1',
    description: 'Buildings 1–3, Gate 1 entry',
    totalFamilies: 24,
    notes: 'Lift A & B, parking zone 1',
    createdAt: '1447-01-01',
    updatedAt: '1447-01-01',
  },
  {
    id: 'sub-moh-002',
    mohallaId: 'MOH-SEC-A',
    mohallaName: 'Saifee Mohallah (Sector A)',
    name: 'Saifee Block A2',
    code: 'SEC-A2',
    description: 'Buildings 4–5, Gate 1 entry',
    totalFamilies: 18,
    notes: 'Garden-facing units',
    createdAt: '1447-01-01',
    updatedAt: '1447-01-01',
  },
  {
    id: 'sub-moh-003',
    mohallaId: 'MOH-SEC-B',
    mohallaName: 'Burhani Mohallah (Sector B)',
    name: 'Burhani Central Wing',
    code: 'SEC-B1',
    description: 'Central garden wing, Buildings 6–9',
    totalFamilies: 32,
    notes: 'Community hall access zone',
    createdAt: '1447-01-01',
    updatedAt: '1447-01-01',
  },
  {
    id: 'sub-moh-004',
    mohallaId: 'MOH-SEC-B',
    mohallaName: 'Burhani Mohallah (Sector B)',
    name: 'Burhani Tower Block',
    code: 'SEC-B2',
    description: 'High-rise towers, Buildings 10–11',
    totalFamilies: 20,
    notes: 'Tower elevator complex',
    createdAt: '1447-01-01',
    updatedAt: '1447-01-01',
  },
  {
    id: 'sub-moh-005',
    mohallaId: 'MOH-SEC-C',
    mohallaName: 'Badri Mohallah (Sector C)',
    name: 'Masjid Complex Row Houses',
    code: 'SEC-C1',
    description: 'Row houses adjacent to Masjid',
    totalFamilies: 16,
    notes: 'Mawaid complex proximity zone',
    createdAt: '1447-01-01',
    updatedAt: '1447-01-01',
  },
];

export const INITIAL_INCHARGES: MohallaIncharge[] = [
  {
    id: 'inc-001',
    itsNumber: '20391823',
    fullName: 'Mulla Huzefa Bhai Jamali',
    mobileNumber: '9820011223',
    whatsappNumber: '9820011223',
    designation: 'Sector Incharge',
    email: 'huzefa.jamali@burhanijamaat.org',
    notes: 'Senior committee member — 15+ years service',
    isActive: true,
    createdAt: '1447-01-01',
    updatedAt: '1447-01-01',
  },
  {
    id: 'inc-002',
    itsNumber: '30489122',
    fullName: 'Mulla Shabbir Bhai Fakhri',
    mobileNumber: '9820044556',
    whatsappNumber: '9820044556',
    designation: 'Sector Incharge',
    email: 'shabbir.fakhri@burhanijamaat.org',
    notes: 'FMB Committee Volunteer',
    isActive: true,
    createdAt: '1447-01-01',
    updatedAt: '1447-01-01',
  },
  {
    id: 'inc-003',
    itsNumber: '30491024',
    fullName: 'Mulla Taher Bhai Vajihi',
    mobileNumber: '9820077889',
    whatsappNumber: '9820077889',
    designation: 'Sector Incharge',
    notes: 'Oversees Badri Mohallah C and Mawaid ops',
    isActive: true,
    createdAt: '1447-01-01',
    updatedAt: '1447-01-01',
  },
  {
    id: 'inc-004',
    itsNumber: '20381044',
    fullName: 'Mulla Abbas Bhai Rajkotwala',
    mobileNumber: '9820099001',
    whatsappNumber: '9820099001',
    designation: 'Sector Incharge',
    notes: 'East Wing Sector D coordinator',
    isActive: true,
    createdAt: '1447-01-01',
    updatedAt: '1447-01-01',
  },
  {
    id: 'inc-005',
    itsNumber: '40291844',
    fullName: 'Sheikh Huzefa Jamali',
    mobileNumber: '9820034455',
    designation: 'Sub-Sector Incharge',
    notes: 'Assists in Saifee block A1/A2 operations',
    isActive: true,
    createdAt: '1447-01-01',
    updatedAt: '1447-01-01',
  },
];

export const INITIAL_ASSIGNMENTS: MohallaAssignment[] = [
  {
    id: 'asgn-001',
    mohallaId: 'MOH-SEC-A',
    mohallaName: 'Saifee Mohallah (Sector A)',
    subMohallaId: 'sub-moh-001',
    subMohallaName: 'Saifee Block A1',
    inchargeId: 'inc-001',
    inchargeName: 'Mulla Huzefa Bhai Jamali',
    inchargeIts: '20391823',
    inchargeMobile: '9820011223',
    role: 'Primary',
    assignedFrom: '1447-01-01',
    isActive: true,
    notes: 'Main sector assignment for A1 block',
    assignedBy: 'janabadmin',
    createdAt: '1447-01-01',
    updatedAt: '1447-01-01',
  },
  {
    id: 'asgn-002',
    mohallaId: 'MOH-SEC-B',
    mohallaName: 'Burhani Mohallah (Sector B)',
    inchargeId: 'inc-002',
    inchargeName: 'Mulla Shabbir Bhai Fakhri',
    inchargeIts: '30489122',
    inchargeMobile: '9820044556',
    role: 'Primary',
    assignedFrom: '1447-01-01',
    isActive: true,
    notes: 'Primary assignment for Sector B',
    assignedBy: 'janabadmin',
    createdAt: '1447-01-01',
    updatedAt: '1447-01-01',
  },
  {
    id: 'asgn-003',
    mohallaId: 'MOH-SEC-C',
    mohallaName: 'Badri Mohallah (Sector C)',
    inchargeId: 'inc-003',
    inchargeName: 'Mulla Taher Bhai Vajihi',
    inchargeIts: '30491024',
    inchargeMobile: '9820077889',
    role: 'Primary',
    assignedFrom: '1447-01-01',
    isActive: true,
    notes: 'Masjid complex and row house sector',
    assignedBy: 'janabadmin',
    createdAt: '1447-01-01',
    updatedAt: '1447-01-01',
  },
];

// ── Storage Helpers ───────────────────────────────────────────────────────────

export const getStoredSubMohallahs = (): SubMohallah[] => {
  try {
    const raw = localStorage.getItem(SUB_MOHALLA_KEY);
    if (!raw) {
      localStorage.setItem(SUB_MOHALLA_KEY, JSON.stringify(INITIAL_SUB_MOHALLAHS));
      return INITIAL_SUB_MOHALLAHS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_SUB_MOHALLAHS;
  }
};

export const saveStoredSubMohallahs = (records: SubMohallah[]): void => {
  try {
    localStorage.setItem(SUB_MOHALLA_KEY, JSON.stringify(records));
  } catch (e) {
    console.error('Failed to save sub mohallahs', e);
  }
};

export const getStoredIncharges = (): MohallaIncharge[] => {
  try {
    const raw = localStorage.getItem(INCHARGE_MASTER_KEY);
    if (!raw) {
      localStorage.setItem(INCHARGE_MASTER_KEY, JSON.stringify(INITIAL_INCHARGES));
      return INITIAL_INCHARGES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_INCHARGES;
  }
};

export const saveStoredIncharges = (records: MohallaIncharge[]): void => {
  try {
    localStorage.setItem(INCHARGE_MASTER_KEY, JSON.stringify(records));
  } catch (e) {
    console.error('Failed to save incharges', e);
  }
};

export const getStoredMohallaAssignments = (): MohallaAssignment[] => {
  try {
    const raw = localStorage.getItem(MOHALLA_ASSIGNMENT_KEY);
    if (!raw) {
      localStorage.setItem(MOHALLA_ASSIGNMENT_KEY, JSON.stringify(INITIAL_ASSIGNMENTS));
      return INITIAL_ASSIGNMENTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_ASSIGNMENTS;
  }
};

export const saveStoredMohallaAssignments = (records: MohallaAssignment[]): void => {
  try {
    localStorage.setItem(MOHALLA_ASSIGNMENT_KEY, JSON.stringify(records));
  } catch (e) {
    console.error('Failed to save assignments', e);
  }
};

export const generateMohallaId = (prefix: string): string =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

export const INCHARGE_DESIGNATIONS = [
  'Sector Incharge',
  'Sub-Sector Incharge',
  'Zone Coordinator',
  'Assistant Incharge',
  'Relief Incharge',
];

export const ASSIGNMENT_ROLES = ['Primary', 'Secondary', 'Backup'] as const;
