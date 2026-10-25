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
    title: 'Member & Area Master',
    iconName: 'Users',
    items: [
      { id: 'directory-hof', label: 'Directory & Family HOF' },
      { id: 'area-mapping', label: 'Mohallah Area Mapping' },
      { id: 'its-updater', label: 'ITS Profile Updater' }
    ]
  },
  {
    id: 'fmb-takhmeen',
    title: 'FMB & Takhmeen',
    iconName: 'UtensilsCrossed',
    items: [
      { id: 'thaali-status', label: 'Thaali Status Manager', badge: 'Live', badgeColor: 'emerald' },
      { id: 'takhmeen-allocation', label: 'Takhmeen Allocation' },
      { id: 'fmb-dues', label: 'Daily Collection & Dues', badge: 'Active', badgeColor: 'yellow' }
    ]
  },
  {
    id: 'sabeel-management',
    title: 'Sabeel Management',
    iconName: 'Coins',
    items: [
      { id: 'sabeel-ledger', label: 'Sabeel Master Ledger' },
      { id: 'sabeel-collection', label: 'Sabeel Takhmeen & Collection' },
      { id: 'sabeel-history', label: 'Transfer & History' }
    ]
  },
  {
    id: 'services',
    title: 'Services',
    iconName: 'Calendar',
    items: [
      { id: 'hall-booking', label: 'Hall Bookings' },
      { id: 'ziyarat-tracking', label: 'Ziyarat Tracking (Karbala/Hajj)' },
      { id: 'miqaat-madrasa', label: 'Madrasa & Miqaat Registrations' }
    ]
  },
  {
    id: 'payments-receipts',
    title: 'Payments & Receipts Engine',
    iconName: 'Receipt',
    items: [
      { id: 'counter-payment', label: 'Counter Payment Entry', badge: 'POS', badgeColor: 'blue' },
      { id: 'receipts-history', label: 'Receipts History & PDF Print' },
      { id: 'refund-ledger', label: 'Refund / Reversal Ledger' }
    ]
  },
  {
    id: 'system-settings',
    title: 'System Settings',
    iconName: 'Sliders',
    items: [
      { id: 'roles-permissions', label: 'Roles & Permissions (RBAC)' },
      { id: 'change-password', label: 'Change Password' }
    ]
  }
];
