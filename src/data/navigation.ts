import { NavCategory } from '../types';

export const NAVIGATION_CATEGORIES: NavCategory[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    iconName: 'LayoutDashboard',
    items: [
      { id: 'overview', label: 'Main Overview' },
      { id: 'faiz-dashboard', label: 'Faiz Dashboard', badge: 'Live', badgeColor: 'blue' }
    ]
  },
  {
    id: 'member-master',
    title: 'Member Master',
    iconName: 'Users',
    items: [
      { id: 'its-lookup', label: 'ITS Lookup' },
      { id: 'family-hof-profile', label: 'Family HOF/FM Profile' },
      { id: 'area-mapping', label: 'Area Mapping' }
    ]
  },
  {
    id: 'financial-takhmeen',
    title: 'Financial & Takhmeen',
    iconName: 'Coins',
    items: [
      { id: 'default-year', label: 'Default Year' },
      { id: 'opening-balance', label: 'Opening Balance' },
      { id: 'income-entry', label: 'Income Entry', badge: 'New', badgeColor: 'yellow' },
      { id: 'expense-entry', label: 'Expense Entry' },
      { id: 'waivers', label: 'Waivers' },
      { id: 'receipt-settings', label: 'Receipt Settings' }
    ]
  },
  {
    id: 'faiz-services',
    title: 'Faiz & Services',
    iconName: 'UtensilsCrossed',
    items: [
      { id: 'thaali-status', label: 'Thaali Status', badge: 'Active/Blocked', badgeColor: 'emerald' },
      { id: 'hall-booking', label: 'Hall Booking' },
      { id: 'miqaat', label: 'Miqaat' }
    ]
  },
  {
    id: 'reports-ledgers',
    title: 'Reports & Ledgers',
    iconName: 'LineChart',
    items: [
      { id: 'daily-collections', label: 'Daily Collections' },
      { id: 'member-ledgers', label: 'Member Ledgers' },
      { id: 'audit-logs', label: 'Audit Logs' }
    ]
  },
  {
    id: 'system-settings',
    title: 'System Settings',
    iconName: 'Sliders',
    items: [
      { id: 'roles-permissions', label: 'Roles & Permissions' },
      { id: 'change-password', label: 'Change Password' }
    ]
  }
];
