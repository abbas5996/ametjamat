export interface SubMenuItem {
  id: string;
  label: string;
  badge?: string;
  badgeColor?: 'yellow' | 'blue' | 'emerald';
}

export interface NavCategory {
  id: string;
  title: string;
  iconName: string;
  items: SubMenuItem[];
}

export type FinancialYear = '1447-1448 Hijri' | '1446-1447 Hijri';

export type RoleView = 'super_admin' | 'cashier' | 'read_only';

export interface UserProfile {
  username: string;
  displayName: string;
  role: string;
  avatarUrl?: string;
  itsNumber: string;
}

export interface FaizTransaction {
  id: string;
  memberName: string;
  itsNumber: string;
  sabeelNo: string;
  thaaliNo: string;
  amount: number;
  receiptNo: string;
  date: string;
  head: string;
  status: 'verified' | 'pending';
}

export interface InstallmentMilestone {
  id: string;
  event: string;
  hijriDate: string;
  totalTarget: number;
  collectedAmount: number;
  percentage: number;
  status: 'completed' | 'current' | 'upcoming';
}
