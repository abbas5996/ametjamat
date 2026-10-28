/**
 * Holiday & Weekend Management Utility
 * Handles Jamaat public holidays, weekends, and special off-days
 * with full localStorage persistence.
 */

export type HolidayType = 'Public Holiday' | 'Weekend' | 'Miqaat Holiday' | 'Emergency Closure' | 'National Holiday';
export type DayOfWeek = 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';

export interface HolidayRecord {
  id: string;
  title: string;
  type: HolidayType;
  date: string; // ISO date string YYYY-MM-DD
  hijriDate?: string;
  description?: string;
  isRecurring: boolean;
  recurringYear?: string;
  affectedDepartments: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface WeekendConfig {
  id: string;
  offDays: DayOfWeek[];
  effectiveFrom: string;
  effectiveTo?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export const HOLIDAY_STORAGE_KEY = 'jamat_holidays_v1';
export const WEEKEND_CONFIG_STORAGE_KEY = 'jamat_weekend_config_v1';

export const INITIAL_HOLIDAYS: HolidayRecord[] = [
  {
    id: 'hol-001',
    title: 'Eid ul Adha',
    type: 'Miqaat Holiday',
    date: '2025-06-07',
    hijriDate: '1446-12-10',
    description: 'Zul Hijja 10th - Eid ul Adha celebration. All Jamaat offices closed.',
    isRecurring: true,
    recurringYear: '1447-1448 Hijri',
    affectedDepartments: ['All'],
    createdBy: 'janabadmin',
    createdAt: '2025-01-01 09:00 AM',
    updatedAt: '2025-01-01 09:00 AM',
  },
  {
    id: 'hol-002',
    title: 'Eid ul Fitr',
    type: 'Miqaat Holiday',
    date: '2025-03-30',
    hijriDate: '1446-09-29',
    description: 'Ramadan 29/30 — Eid ul Fitr. Full office closure.',
    isRecurring: true,
    recurringYear: '1447-1448 Hijri',
    affectedDepartments: ['All'],
    createdBy: 'janabadmin',
    createdAt: '2025-01-01 09:00 AM',
    updatedAt: '2025-01-01 09:00 AM',
  },
  {
    id: 'hol-003',
    title: 'Ashara Mubaraka (Last 3 Days)',
    type: 'Miqaat Holiday',
    date: '2025-07-06',
    hijriDate: '1447-01-08',
    description: 'Muharram 8–10 Ashara Mubarak closure. FMB and Sabeel operations suspended.',
    isRecurring: true,
    recurringYear: '1447-1448 Hijri',
    affectedDepartments: ['All'],
    createdBy: 'janabadmin',
    createdAt: '2025-01-01 09:00 AM',
    updatedAt: '2025-01-01 09:00 AM',
  },
  {
    id: 'hol-004',
    title: 'Republic Day',
    type: 'National Holiday',
    date: '2025-01-26',
    description: 'Indian Republic Day. Government holiday.',
    isRecurring: true,
    recurringYear: '1447-1448 Hijri',
    affectedDepartments: ['Administration', 'Finance'],
    createdBy: 'janabadmin',
    createdAt: '2025-01-01 09:00 AM',
    updatedAt: '2025-01-01 09:00 AM',
  },
  {
    id: 'hol-005',
    title: 'Independence Day',
    type: 'National Holiday',
    date: '2025-08-15',
    description: 'Indian Independence Day. Partial office operations.',
    isRecurring: true,
    recurringYear: '1447-1448 Hijri',
    affectedDepartments: ['Administration'],
    createdBy: 'janabadmin',
    createdAt: '2025-01-01 09:00 AM',
    updatedAt: '2025-01-01 09:00 AM',
  },
];

export const INITIAL_WEEKEND_CONFIG: WeekendConfig = {
  id: 'wknd-001',
  offDays: ['Friday', 'Sunday'],
  effectiveFrom: '2025-01-01',
  notes: 'Standard Jamaat weekend: Friday (Jumuah) + Sunday',
  createdBy: 'janabadmin',
  createdAt: '2025-01-01 09:00 AM',
};

export const getStoredHolidays = (): HolidayRecord[] => {
  try {
    const raw = localStorage.getItem(HOLIDAY_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(HOLIDAY_STORAGE_KEY, JSON.stringify(INITIAL_HOLIDAYS));
      return INITIAL_HOLIDAYS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_HOLIDAYS;
  }
};

export const saveStoredHolidays = (records: HolidayRecord[]): void => {
  try {
    localStorage.setItem(HOLIDAY_STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    console.error('Failed to save holidays', e);
  }
};

export const getStoredWeekendConfig = (): WeekendConfig => {
  try {
    const raw = localStorage.getItem(WEEKEND_CONFIG_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(WEEKEND_CONFIG_STORAGE_KEY, JSON.stringify(INITIAL_WEEKEND_CONFIG));
      return INITIAL_WEEKEND_CONFIG;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_WEEKEND_CONFIG;
  }
};

export const saveStoredWeekendConfig = (config: WeekendConfig): void => {
  try {
    localStorage.setItem(WEEKEND_CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save weekend config', e);
  }
};

export const generateHolidayId = (): string =>
  `hol-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

export const HOLIDAY_TYPES: HolidayType[] = [
  'Public Holiday',
  'Weekend',
  'Miqaat Holiday',
  'Emergency Closure',
  'National Holiday',
];

export const DEPARTMENTS = [
  'All',
  'Administration',
  'Finance',
  'FMB Committee',
  'Sabeel Committee',
  'Hall Management',
  'IT Department',
  'Member Services',
];

export const DAYS_OF_WEEK: DayOfWeek[] = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
];
