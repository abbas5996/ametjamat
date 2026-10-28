/**
 * Comprehensive Sabeel Management Production Suite Utilities & LocalStorage Sync
 * Authentic Dawoodi Bohra Jamaat ERP Workflow Standards
 */

import { SabeelLedgerRecord, SabeelTransactionEntry } from '../types';
import { getStoredSabeelLedger, saveStoredSabeelLedger, getStoredSabeelTransactions, saveStoredSabeelTransactions } from './sabeelManagement';

// Re-export so that subpages can import saveStoredSabeelLedger from this suite file
export { saveStoredSabeelLedger, getStoredSabeelLedger, saveStoredSabeelTransactions, getStoredSabeelTransactions };

// ── Types ──────────────────────────────────────────────────────────────────

export interface SabeelTypeRecord {
  id: string;
  sabeelType: string;
  calcType: 'Monthly' | 'Yearly';
  type: 'General' | 'Business' | 'Khidmat' | 'Special';
  baseAmount: number;
  description: string;
  isActive: boolean;
  createdAt: string;
}

export interface SabeelGradeRecord {
  id: string;
  gradeName: string;
  minAmount: number;
  maxAmount: number;
  suggestedMonthly: number;
  description: string;
  colorCode: string;
  isActive: boolean;
}

export interface SabeelGradeLinkRecord {
  id: string;
  sabeelTypeId: string;
  sabeelTypeName: string;
  gradeId: string;
  gradeName: string;
  suggestedAnnual: number;
  isActive: boolean;
}

export interface SabeelFirmRecord {
  id: string;
  firmName: string;
  registrationNo: string;
  gstNumber: string;
  firmType: 'Retail' | 'Wholesale' | 'Manufacturing' | 'Services' | 'Trading';
  ownerIts: string;
  ownerName: string;
  linkedSabeelNo: string;
  contactPhone: string;
  address: string;
  isActive: boolean;
  createdAt: string;
}

export interface GradeChangeHistoryRecord {
  id: string;
  itsNumber: string;
  fullName: string;
  sabeelNo: string;
  oldGrade: string;
  newGrade: string;
  changeDate: string;
  reason: string;
  authorizedBy: string;
  createdAt: string;
}

export interface SabeelNumberChangeRecord {
  id: string;
  itsNumber: string;
  fullName: string;
  oldSabeelNo: string;
  newSabeelNo: string;
  changeDate: string;
  reason: string;
  authorizedBy: string;
}

export interface ClosedSabeelRecord {
  id: string;
  sabeelNumber: string;
  itsNumber: string;
  fullName: string;
  sabeelType: string;
  grade: string;
  closedDate: string;
  closedReason: string;
  approvedBy: string;
  clearanceStatus: 'Full Clearance' | 'Waiver Granted' | 'Relocated' | 'Safai Chitthi Issued';
  isActive: boolean;
}

export interface SabeelWaiverRecord {
  id: string;
  waiverCode: string;
  sabeelNo: string;
  itsNumber: string;
  fullName: string;
  originalDue: number;
  waivedAmount: number;
  remainingDue: number;
  waiverDate: string;
  reason: string;
  authorizedBy: string;
  approvalReference: string;
}

export interface SabeelReceiptConfig {
  moduleName: string;
  showHofName: boolean;
  showItsNumber: boolean;
  showSabeelNumber: boolean;
  showMohalla: boolean;
  showSabeelGrade: boolean;
  showBalanceDue: boolean;
  showHijriYear: boolean;
  showQrCode: boolean;
  showDuaFooter: boolean;
  customHeader: string;
  customFooter: string;
}

export interface ReturnedChequeRecord {
  id: string;
  chequeNo: string;
  receiptNo: string;
  itsNumber: string;
  fullName: string;
  sabeelNo: string;
  mohalla: string;
  bankName: string;
  chequeAmount: number;
  penaltyFee: number;
  returnDate: string;
  returnReason: string;
  status: 'Bounced' | 'Represented' | 'Settled via Cash' | 'Waived';
  smsNotificationSent: boolean;
}

// ── Storage Keys ────────────────────────────────────────────────────────────

export const KEYS = {
  SABEEL_TYPES: 'jamat_sabeel_types_suite',
  SABEEL_GRADES: 'jamat_sabeel_grades_suite',
  GRADE_LINKS: 'jamat_sabeel_grade_links_suite',
  FIRMS: 'jamat_sabeel_firms_suite',
  GRADE_HISTORY: 'jamat_sabeel_grade_history_suite',
  NUMBER_HISTORY: 'jamat_sabeel_number_history_suite',
  CLOSED_SABEELS: 'jamat_sabeel_closed_suite',
  WAIVERS: 'jamat_sabeel_waivers_suite',
  RECEIPT_CONFIG: 'jamat_sabeel_receipt_config_suite',
  RETURNED_CHEQUES: 'jamat_sabeel_returned_cheques_suite',
};

// ── Seed Data ───────────────────────────────────────────────────────────────

const SEED_SABEEL_TYPES: SabeelTypeRecord[] = [
  { id: 'ST-01', sabeelType: 'Residential Sabeel', calcType: 'Yearly', type: 'General', baseAmount: 24000, description: 'Standard annual contribution for residential households', isActive: true, createdAt: '2025-04-01' },
  { id: 'ST-02', sabeelType: 'Commercial Business Sabeel', calcType: 'Monthly', type: 'Business', baseAmount: 36000, description: 'Registered business and shop establishment Sabeel', isActive: true, createdAt: '2025-04-01' },
  { id: 'ST-03', sabeelType: 'Khidmatguzaar Sabeel', calcType: 'Yearly', type: 'Khidmat', baseAmount: 18000, description: 'Designated Sabeel for active Jamaat khidmatguzaars', isActive: true, createdAt: '2025-04-01' },
  { id: 'ST-04', sabeelType: 'Daftari / Institutional Sabeel', calcType: 'Monthly', type: 'Special', baseAmount: 48000, description: 'Institutional and trust property Sabeels', isActive: true, createdAt: '2025-04-01' },
  { id: 'ST-05', sabeelType: 'Senior Citizen / Concession Sabeel', calcType: 'Yearly', type: 'General', baseAmount: 12000, description: 'Concessional rate authorized for senior pensioners & widows', isActive: true, createdAt: '2025-04-01' },
];

const SEED_SABEEL_GRADES: SabeelGradeRecord[] = [
  { id: 'GRD-AP', gradeName: 'Grade A+', minAmount: 60000, maxAmount: 150000, suggestedMonthly: 5000, description: 'Premier benefactor tier with extended community welfare allocation', colorCode: '#16A34A', isActive: true },
  { id: 'GRD-A', gradeName: 'Grade A', minAmount: 36000, maxAmount: 59999, suggestedMonthly: 3000, description: 'Standard high-bracket family contribution', colorCode: '#2563EB', isActive: true },
  { id: 'GRD-B', gradeName: 'Grade B', minAmount: 24000, maxAmount: 35999, suggestedMonthly: 2000, description: 'Medium residential standard contribution', colorCode: '#D97706', isActive: true },
  { id: 'GRD-C', gradeName: 'Grade C', minAmount: 18000, maxAmount: 23999, suggestedMonthly: 1500, description: 'Basic family residential baseline', colorCode: '#7C3AED', isActive: true },
  { id: 'GRD-D', gradeName: 'Grade D', minAmount: 12000, maxAmount: 17999, suggestedMonthly: 1000, description: 'Concession and youth family introductory grade', colorCode: '#64748B', isActive: true },
];

const SEED_GRADE_LINKS: SabeelGradeLinkRecord[] = [
  { id: 'SGL-1', sabeelTypeId: 'ST-01', sabeelTypeName: 'Residential Sabeel', gradeId: 'GRD-A', gradeName: 'Grade A', suggestedAnnual: 36000, isActive: true },
  { id: 'SGL-2', sabeelTypeId: 'ST-01', sabeelTypeName: 'Residential Sabeel', gradeId: 'GRD-B', gradeName: 'Grade B', suggestedAnnual: 24000, isActive: true },
  { id: 'SGL-3', sabeelTypeId: 'ST-02', sabeelTypeName: 'Commercial Business Sabeel', gradeId: 'GRD-AP', gradeName: 'Grade A+', suggestedAnnual: 60000, isActive: true },
  { id: 'SGL-4', sabeelTypeId: 'ST-02', sabeelTypeName: 'Commercial Business Sabeel', gradeId: 'GRD-A', gradeName: 'Grade A', suggestedAnnual: 36000, isActive: true },
  { id: 'SGL-5', sabeelTypeId: 'ST-03', sabeelTypeName: 'Khidmatguzaar Sabeel', gradeId: 'GRD-C', gradeName: 'Grade C', suggestedAnnual: 18000, isActive: true },
];

const SEED_FIRMS: SabeelFirmRecord[] = [
  { id: 'FRM-1', firmName: 'Burhani Hardware & Sanitary Mart', registrationNo: 'REG/MH/2014/991', gstNumber: '27AABCB9912C1Z4', firmType: 'Trading', ownerIts: '40291844', ownerName: 'Sheikh Huzefa Jamali', linkedSabeelNo: 'SB-015', contactPhone: '+91 98200 44332', address: 'Shop 4, Saifee Market Complex', isActive: true, createdAt: '2024-05-10' },
  { id: 'FRM-2', firmName: 'Al-Vasi Auto Parts Corporation', registrationNo: 'REG/MH/2018/412', gstNumber: '27AAAFV4120D1Z8', firmType: 'Wholesale', ownerIts: '30489122', ownerName: 'Mulla Shabbir Bhai Fakhri', linkedSabeelNo: 'SB-042', contactPhone: '+91 98201 55667', address: 'Plot 12, Burhani Industrial Estate', isActive: true, createdAt: '2024-08-15' },
  { id: 'FRM-3', firmName: 'Hakimuddin Electricals & Electronics', registrationNo: 'REG/MH/2020/718', gstNumber: '27AAAKH7189M1Z2', firmType: 'Retail', ownerIts: '20394855', ownerName: 'Mulla Aliasgar Hakimuddin', linkedSabeelNo: 'SB-007', contactPhone: '+91 98202 77889', address: 'Shop 9, Mohallah Husaini Main Road', isActive: true, createdAt: '2025-01-20' },
];

const SEED_GRADE_HISTORY: GradeChangeHistoryRecord[] = [
  { id: 'GCH-1', itsNumber: '40291844', fullName: 'Sheikh Huzefa Jamali', sabeelNo: 'SB-015', oldGrade: 'Grade A', newGrade: 'Grade A+', changeDate: '2025-04-10', reason: 'Annual business expansion re-assessment', authorizedBy: 'Janab Amil Saheb', createdAt: '2025-04-10 10:30 AM' },
  { id: 'GCH-2', itsNumber: '30489122', fullName: 'Mulla Shabbir Bhai Fakhri', sabeelNo: 'SB-042', oldGrade: 'Grade C', newGrade: 'Grade B', changeDate: '2025-04-12', reason: 'Family income progression upgrade', authorizedBy: 'Secretary Saheb', createdAt: '2025-04-12 02:15 PM' },
  { id: 'GCH-3', itsNumber: '50182733', fullName: 'Abdeali Bhai Shujauddin', sabeelNo: 'SB-088', oldGrade: 'Grade A', newGrade: 'Grade B', changeDate: '2025-05-01', reason: 'Requested retirement adjustment with amil approval', authorizedBy: 'Janab Amil Saheb', createdAt: '2025-05-01 11:00 AM' },
];

const SEED_CLOSED_SABEELS: ClosedSabeelRecord[] = [
  { id: 'CSB-1', sabeelNumber: 'SB-099', itsNumber: '30192844', fullName: 'Shk. Abbas Bhai Lightwala', sabeelType: 'Residential Sabeel', grade: 'Grade B', closedDate: '2025-03-31', closedReason: 'Permanently relocated to Surat Jamaat with Safai Chitthi', approvedBy: 'Janab Amil Saheb', clearanceStatus: 'Safai Chitthi Issued', isActive: false },
  { id: 'CSB-2', sabeelNumber: 'SB-103', itsNumber: '40918233', fullName: 'Mulla Qutbuddin Batterywala', sabeelType: 'Commercial Business Sabeel', grade: 'Grade A', closedDate: '2025-02-15', closedReason: 'Business premises lease terminated', approvedBy: 'Treasurer Saheb', clearanceStatus: 'Full Clearance', isActive: false },
];

const SEED_WAIVERS: SabeelWaiverRecord[] = [
  { id: 'WVR-1', waiverCode: 'WAV-1447-01', sabeelNo: 'SB-112', itsNumber: '60392811', fullName: 'Murtaza Bhai Gulamali', originalDue: 24000, waivedAmount: 8000, remainingDue: 16000, waiverDate: '2025-06-15', reason: 'Medical distress in family during hospital stay', authorizedBy: 'Janab Amil Saheb', approvalReference: 'RAZA-MED-1447-92' },
];

const SEED_RECEIPT_CONFIG: SabeelReceiptConfig = {
  moduleName: 'Sabeel Management',
  showHofName: true,
  showItsNumber: true,
  showSabeelNumber: true,
  showMohalla: true,
  showSabeelGrade: true,
  showBalanceDue: true,
  showHijriYear: true,
  showQrCode: true,
  showDuaFooter: true,
  customHeader: 'Anjuman-e-Saifee (Burhani Park Jamaat) • Sabeel Mubarak',
  customFooter: 'May Allah Ta\'ala grant long life to our beloved Dai al-Mutlaq Syedna Mufaddal Saifuddin (TUS).',
};

const SEED_RETURNED_CHEQUES: ReturnedChequeRecord[] = [
  { id: 'RC-1', chequeNo: 'CHQ-882019', receiptNo: 'RCP-SB-1447-089', itsNumber: '20394855', fullName: 'Mulla Aliasgar Hakimuddin', sabeelNo: 'SB-007', mohalla: 'Mohallah Husaini', bankName: 'HDFC Bank Ltd', chequeAmount: 24000, penaltyFee: 500, returnDate: '2025-08-20', returnReason: 'Funds Insufficient (Signature Matched)', status: 'Bounced', smsNotificationSent: true },
];

// ── Generic Storage Helpers ─────────────────────────────────────────────────

function getOrInit<T>(key: string, seed: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw);
  } catch {
    return seed;
  }
}

function save<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Error saving to localStorage key "${key}":`, err);
  }
}

// ── Repository Functions ────────────────────────────────────────────────────

export function getSabeelTypes(): SabeelTypeRecord[] {
  return getOrInit(KEYS.SABEEL_TYPES, SEED_SABEEL_TYPES);
}
export function saveSabeelTypes(items: SabeelTypeRecord[]): void {
  save(KEYS.SABEEL_TYPES, items);
}

export function getSabeelGrades(): SabeelGradeRecord[] {
  return getOrInit(KEYS.SABEEL_GRADES, SEED_SABEEL_GRADES);
}
export function saveSabeelGrades(items: SabeelGradeRecord[]): void {
  save(KEYS.SABEEL_GRADES, items);
}

export function getSabeelGradeLinks(): SabeelGradeLinkRecord[] {
  return getOrInit(KEYS.GRADE_LINKS, SEED_GRADE_LINKS);
}
export function saveSabeelGradeLinks(items: SabeelGradeLinkRecord[]): void {
  save(KEYS.GRADE_LINKS, items);
}

export function getSabeelFirms(): SabeelFirmRecord[] {
  return getOrInit(KEYS.FIRMS, SEED_FIRMS);
}
export function saveSabeelFirms(items: SabeelFirmRecord[]): void {
  save(KEYS.FIRMS, items);
}

export function getGradeChangeHistory(): GradeChangeHistoryRecord[] {
  return getOrInit(KEYS.GRADE_HISTORY, SEED_GRADE_HISTORY);
}
export function saveGradeChangeHistory(items: GradeChangeHistoryRecord[]): void {
  save(KEYS.GRADE_HISTORY, items);
}

export function getClosedSabeels(): ClosedSabeelRecord[] {
  return getOrInit(KEYS.CLOSED_SABEELS, SEED_CLOSED_SABEELS);
}
export function saveClosedSabeels(items: ClosedSabeelRecord[]): void {
  save(KEYS.CLOSED_SABEELS, items);
}

export function getSabeelWaivers(): SabeelWaiverRecord[] {
  return getOrInit(KEYS.WAIVERS, SEED_WAIVERS);
}
export function saveSabeelWaivers(items: SabeelWaiverRecord[]): void {
  save(KEYS.WAIVERS, items);
}

export function getSabeelReceiptConfig(): SabeelReceiptConfig {
  return getOrInit(KEYS.RECEIPT_CONFIG, SEED_RECEIPT_CONFIG);
}
export function saveSabeelReceiptConfig(config: SabeelReceiptConfig): void {
  save(KEYS.RECEIPT_CONFIG, config);
}

export function getReturnedCheques(): ReturnedChequeRecord[] {
  return getOrInit(KEYS.RETURNED_CHEQUES, SEED_RETURNED_CHEQUES);
}
export function saveReturnedCheques(items: ReturnedChequeRecord[]): void {
  save(KEYS.RETURNED_CHEQUES, items);
}

// ── Sabeel Grade Mapping Helper ─────────────────────────────────────────────

export function getGradeForAmount(amount: number): string {
  if (amount >= 60000) return 'Grade A+';
  if (amount >= 36000) return 'Grade A';
  if (amount >= 24000) return 'Grade B';
  if (amount >= 18000) return 'Grade C';
  return 'Grade D';
}
