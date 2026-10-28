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
    id: 'mumineen',
    title: 'Mumineen Master',
    iconName: 'UserCheck',
    items: [
      { id: 'mumineen-list',               label: 'Mumineen List' },
      { id: 'mumineen-registration',       label: 'Registration Wizard',    badge: 'New',   badgeColor: 'emerald' },
      { id: 'non-local-mumineen',          label: 'Non-Local Mumineen' },
      { id: 'deleted-mumineen',            label: 'Delete Mumineen List' },
      { id: 'mumineen-outstanding',        label: 'Outstanding Ledger',     badge: 'Dues',  badgeColor: 'yellow' },
      { id: 'inactive-mumineen',           label: 'Inactive Mumineen List' },
      { id: 'add-smart-card',              label: 'Add Smart Card' },
      { id: 'print-smart-card',            label: 'Print Smart Card',       badge: 'Print', badgeColor: 'blue' },
      { id: 'safai-chitthi-entry',         label: 'Safai Chitthi Entry' },
      { id: 'outstanding-safai-chitthi',   label: 'Blocked Chitthi List' },
      { id: 'jamaat-category-list',        label: 'Jamaat Category List' },
      { id: 'outstanding-comments',        label: 'Outstanding Comments' },
      { id: 'sync-its52',                  label: 'Sync ITS52 Data',        badge: 'API',   badgeColor: 'blue' },
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
    id: 'mohalla-management',
    title: 'Mohalla Management',
    iconName: 'MapPin',
    items: [
      { id: 'mohalla-master',    label: 'Mohalla Master' },
      { id: 'sub-mohalla',       label: 'Sub Mohalla' },
      { id: 'incharge-master',   label: 'Incharge Master' },
      { id: 'assign-incharge',   label: 'Assign Incharge' },
    ]
  },
  {
    id: 'fmb-takhmeen',
    title: 'FMB & Takhmeen',
    iconName: 'UtensilsCrossed',
    items: [
      { id: 'thaali-status',         label: 'Thaali Status Manager', badge: 'Live', badgeColor: 'emerald' },
      { id: 'takhmeen-allocation',   label: 'Takhmeen Allocation' },
      { id: 'fmb-dues',              label: 'Daily Collection & Dues', badge: 'Active', badgeColor: 'yellow' }
    ]
  },
  {
    id: 'sabeel-management',
    title: 'Sabeel Management',
    iconName: 'Coins',
    items: [
      { id: 'sabeel-dashboard',          label: 'Sabeel Dashboard',         badge: 'Live', badgeColor: 'blue' },
      { id: 'sabeel-statistics',         label: 'Sabeel Statistics',        badge: 'Analytics', badgeColor: 'emerald' },
      { id: 'sabeel-print-takhmeen',     label: 'Print Takhmeen Form',      badge: 'Print', badgeColor: 'blue' },
      { id: 'sabeel-type',               label: 'Sabeel Type Master' },
      { id: 'sabeel-grade-link',         label: 'Sabeel Grade & Link' },
      { id: 'sabeel-firm-link',          label: 'Firms & Link Sabeel' },
      { id: 'sabeel-grade-change',       label: 'Grade & Number Change' },
      { id: 'sabeel-close-closed',       label: 'Close & Closed List' },
      { id: 'sabeel-waive-receipt-config', label: 'Waive Off & Receipt Config' },
      { id: 'sabeel-collection',         label: 'Payment Entry (POS)',      badge: 'POS', badgeColor: 'yellow' },
      { id: 'sabeel-view-print-receipts', label: 'View / Print Receipts',   badge: 'PDF', badgeColor: 'blue' },
      { id: 'sabeel-datewise-paymentwise', label: 'Datewise & Paymentwise' },
      { id: 'sabeel-gift-aid',           label: 'Gift Aid Report',          badge: 'Tax', badgeColor: 'emerald' },
      { id: 'sabeel-due-report',         label: 'Sabeel Due Report',        badge: 'Dues', badgeColor: 'yellow' },
      { id: 'sabeel-grade-history',      label: 'Grade Change History' },
      { id: 'sabeel-returned-cheque',    label: 'Return Cheque List',       badge: 'Alerts', badgeColor: 'yellow' },
      { id: 'sabeel-cancelled',          label: 'Cancelled Receipts' },
      { id: 'sabeel-dynamic-grade-count', label: 'Dynamic Due & Grade Count' },
      { id: 'sabeel-ledger',             label: 'Sabeel Master Ledger' },
    ]
  },
  {
    id: 'faiz-hub',
    title: 'Faiz Module (FMB)',
    iconName: 'Wallet',
    items: [
      { id: 'faiz-hub-dashboard',       label: 'Faiz Dashboard & Stats', badge: 'Live', badgeColor: 'blue' },
      { id: 'faiz-default-year',        label: 'Default Takhmeen Year' },
      { id: 'faiz-opening-balance',     label: 'Niyaz Opening Balance',  badge: 'Audit', badgeColor: 'emerald' },
      { id: 'faiz-receipt-due-config',  label: 'Show Due on Receipt' },
      { id: 'faiz-print-takhmeen',      label: 'Print Takhmeen Form',    badge: 'Print', badgeColor: 'blue' },
      { id: 'faiz-expense-entry',       label: 'Expense Heads & Entry',  badge: 'Outflow', badgeColor: 'yellow' },
      { id: 'faiz-income-entry',        label: 'Income Heads & Entry',   badge: 'Inflow', badgeColor: 'emerald' },
      { id: 'faiz-additional-masters',  label: 'Additional Masters',     badge: '6-in-1', badgeColor: 'yellow' },
      { id: 'faiz-receipt-management',  label: 'View / Print Receipts',  badge: 'Part 2', badgeColor: 'blue' },
      { id: 'faiz-official-receipt',    label: 'Official Print Receipt', badge: 'Trust', badgeColor: 'emerald' },
      { id: 'faiz-reports-suite',       label: 'Faiz Reports Suite',     badge: '6-in-1', badgeColor: 'yellow' },
      { id: 'faiz-audit-cheques',       label: 'Cheques & Cancellations', badge: 'Audit', badgeColor: 'yellow' },
      { id: 'faiz-category-master',      label: 'Category Master' },
      { id: 'faiz-hub-master',           label: 'Add Hub Master',         badge: 'Pledge', badgeColor: 'yellow' },
      { id: 'faiz-payment-entry',        label: 'Hub Payment Entry',      badge: 'POS',   badgeColor: 'emerald' },
      { id: 'faiz-outstanding-report',   label: 'Hub Outstanding Report' },
      { id: 'faiz-receipt-report',       label: 'Receipt Report' },
      { id: 'faiz-ledger-report',        label: 'Ledger Report' },
      { id: 'faiz-cancelled-receipts',   label: 'Cancelled Receipts' },
    ]
  },
  {
    id: 'thaali-management',
    title: 'Thaali Management (FMB)',
    iconName: 'Truck',
    items: [
      { id: 'active-thaali-list',        label: 'Active Thaali List',     badge: 'Active', badgeColor: 'emerald' },
      { id: 'non-active-thaali-list',    label: 'Non Active Thaali List' },
      { id: 'distributor-master',        label: 'Distributor Master' },
      { id: 'distributor-type-master',   label: 'Distributor Type Master' },
      { id: 'assign-distributor',        label: 'Assign Distributor' },
      { id: 'thaali-feedback-list',      label: 'Thaali Feedback List' },
      { id: 'dispatch-list',             label: 'Dispatch List',          badge: 'Daily', badgeColor: 'yellow' },
      { id: 'thaali-count',              label: 'Thaali Count' },
      { id: 'label-printing',            label: 'Label Printing Studio',  badge: 'Print', badgeColor: 'blue' },
    ]
  },
  {
    id: 'menu-management',
    title: 'Menu Management',
    iconName: 'ChefHat',
    items: [
      { id: 'daily-menu-entry',          label: 'Daily Menu Entry',       badge: 'Today', badgeColor: 'emerald' },
      { id: 'menu-master',               label: 'Menu Master' },
      { id: 'menu-category-master',      label: 'Menu Category Master' },
      { id: 'menu-items-master',         label: 'Items Master' },
      { id: 'menu-unit-master',          label: 'Unit Master' },
      { id: 'item-wise-usage-report',    label: 'Item Wise Usage Report' },
      { id: 'daily-thaali-costing-report', label: 'Daily Thaali Costing' },
    ]
  },
  {
    id: 'stock-management',
    title: 'Stock Management',
    iconName: 'Boxes',
    items: [
      { id: 'item-wise-stock-report',    label: 'Item Wise Stock Report', badge: 'Alerts', badgeColor: 'yellow' },
      { id: 'stock-item-master',         label: 'Item Master' },
      { id: 'stock-category-master',     label: 'Item Category Master' },
      { id: 'vendor-master',             label: 'Vendor Master' },
      { id: 'stock-unit-master',         label: 'Unit Master' },
      { id: 'purchase-entry-master',     label: 'Purchase Entry Master',  badge: 'GRN',   badgeColor: 'blue' },
      { id: 'stock-in-register',         label: 'Stock In Register' },
    ]
  },
  {
    id: 'voluntary-contribution',
    title: 'Voluntary Contribution',
    iconName: 'HeartHandshake',
    items: [
      { id: 'voluntary-payment-entry',       label: 'Payment Entry',          badge: 'POS',   badgeColor: 'emerald' },
      { id: 'voluntary-category-list',       label: 'Category List' },
      { id: 'voluntary-ledger-report',       label: 'Ledger Report' },
      { id: 'voluntary-cancelled-receipts',  label: 'Cancelled Receipts' },
    ]
  },
  {
    id: 'community-schemes',
    title: 'Community Schemes',
    iconName: 'Layers',
    items: [
      { id: 'scheme-takhmeen-master',        label: 'Takhmeen Master' },
      { id: 'scheme-payment-entry',          label: 'Payment Entry',          badge: 'POS',   badgeColor: 'blue' },
      { id: 'scheme-category-master',        label: 'Category Master' },
      { id: 'scheme-outstanding-report',     label: 'Outstanding Report',     badge: 'Dues',  badgeColor: 'yellow' },
      { id: 'scheme-ledger-report',          label: 'Ledger Report' },
      { id: 'scheme-cancelled-receipts',     label: 'Cancelled Receipts' },
    ]
  },
  {
    id: 'wajebaat',
    title: 'Wajebaat Management',
    iconName: 'Scale',
    items: [
      { id: 'wajebaat-dashboard',            label: 'Wajebaat Dashboard',     badge: 'Hijri', badgeColor: 'blue' },
      { id: 'wajebaat-year-master',          label: 'Year Master' },
      { id: 'wajebaat-takhmeen-master',      label: 'Takhmeen Master' },
      { id: 'wajebaat-payment-entry',        label: 'Payment Entry',          badge: 'POS',   badgeColor: 'emerald' },
      { id: 'wajebaat-outstanding-report',   label: 'Outstanding Report',     badge: 'Dues',  badgeColor: 'yellow' },
      { id: 'wajebaat-ledger',               label: 'Ledger' },
      { id: 'wajebaat-cancelled-receipts',   label: 'Cancelled Receipts' },
    ]
  },
  {
    id: 'rent-management',
    title: 'Rent Management',
    iconName: 'Building2',
    items: [
      { id: 'rent-property-master',          label: 'Property Master' },
      { id: 'rent-tenant-master',            label: 'Tenant Master' },
      { id: 'rent-agreement-master',         label: 'Rent Agreement Master' },
      { id: 'rent-payment-entry',            label: 'Rent Payment Entry',     badge: 'POS',   badgeColor: 'emerald' },
      { id: 'rent-outstanding-report',       label: 'Outstanding Report' },
      { id: 'rent-ledger-report',            label: 'Ledger Report' },
      { id: 'rent-cancelled-receipts',       label: 'Cancelled Receipts' },
    ]
  },
  {
    id: 'qardan-hasanah',
    title: 'Qardan Hasanah',
    iconName: 'Landmark',
    items: [
      { id: 'qardan-application-sanction',   label: 'Applications & Sanctions', badge: 'Workflow', badgeColor: 'blue' },
      { id: 'qardan-disbursement-collection', label: 'Disbursement & Recovery', badge: 'POS',     badgeColor: 'emerald' },
      { id: 'qardan-scheme-master',          label: 'Scheme Master' },
      { id: 'qardan-category-account',       label: 'Fund & Account Master' },
      { id: 'qardan-guarantor-master',       label: 'Guarantor Master (Zamin)' },
      { id: 'qardan-ledger-outstanding',     label: 'Ledger & Outstanding',     badge: 'Dues',     badgeColor: 'yellow' },
    ]
  },
  {
    id: 'accounts-manager',
    title: 'Accounts Manager',
    iconName: 'Calculator',
    items: [
      { id: 'accounts-voucher-entry',        label: 'Voucher Entry',            badge: 'Double-Entry', badgeColor: 'blue' },
      { id: 'accounts-chart',                label: 'Chart of Accounts' },
      { id: 'accounts-cash-bank-book',       label: 'Cash & Bank Book',         badge: 'Live',     badgeColor: 'emerald' },
      { id: 'accounts-general-ledger',       label: 'General Ledger' },
      { id: 'accounts-trial-balance',        label: 'Trial Balance' },
      { id: 'accounts-financial-statements', label: 'Financial Statements' },
    ]
  },
  {
    id: 'madresa-module',
    title: 'Madresa Management',
    iconName: 'GraduationCap',
    items: [
      { id: 'madresa-students',              label: 'Student Directory & Admission', badge: 'Active', badgeColor: 'blue' },
      { id: 'madresa-fee-collection',        label: 'Fee Collection',           badge: 'POS',      badgeColor: 'emerald' },
      { id: 'madresa-classes-fees',          label: 'Classes & Fee Master' },
      { id: 'madresa-attendance-progress',   label: 'Attendance & Progress',    badge: 'Grades',   badgeColor: 'yellow' },
    ]
  },
  {
    id: 'miqaat-ashara',
    title: 'Miqaat & Ashara Ohbat',
    iconName: 'Sparkles',
    items: [
      { id: 'miqaat-master-events',          label: 'Miqaat Master & Calendar' },
      { id: 'masalla-allocation',            label: 'Masalla Seating Allocation', badge: 'Seating', badgeColor: 'blue' },
      { id: 'miqaat-attendance-relay',       label: 'Attendance & Live Relay' },
      { id: 'ashara-majlis-schedule',        label: 'Ashara Majlis Schedule',   badge: '1-10 Moharram', badgeColor: 'yellow' },
      { id: 'ashara-block-quota',            label: 'Block & Quota Config' },
      { id: 'ashara-registration-import',    label: 'Registration & Import',    badge: 'Passes',   badgeColor: 'emerald' },
    ]
  },
  {
    id: 'committee-trust',
    title: 'Committee & Trust',
    iconName: 'Briefcase',
    items: [
      { id: 'committee-dashboard',   label: 'Committee Dashboard', badge: 'Executive', badgeColor: 'blue' },
      { id: 'committee-members',     label: 'Portfolios & Members' },
      { id: 'opening-balance',       label: 'Opening Balances' },
      { id: 'income-entry',          label: 'Income Heads & Entry', badge: 'Inflow', badgeColor: 'emerald' },
      { id: 'expense-entry',         label: 'Expense Heads & Entry', badge: 'Outflow', badgeColor: 'yellow' },
      { id: 'account-transfers',     label: 'Account Transfers' },
      { id: 'trust-ledger',          label: 'Trust Ledger Reports' },
    ]
  },
  {
    id: 'umur-framework',
    title: '12 Umur Framework',
    iconName: 'Compass',
    items: [
      { id: 'umur-dashboard',        label: '12 Umur Overview', badge: 'Central', badgeColor: 'blue' },
      { id: 'umur-diniyah',          label: '1. Umur Diniyah' },
      { id: 'marafiq-burhaniyah',    label: '2. Marafiq Burhaniyah' },
      { id: 'umur-talimiyah',        label: '3. Umur Talimiyah' },
      { id: 'maliyah-iqtisadiyah',   label: '4. Maliyah & Iqtisadiyah' },
      { id: 'umur-mawarid',          label: '5. Umur Mawarid (HR)' },
      { id: 'umur-dakhiliyah',       label: '6. Umur Dakhiliyah' },
      { id: 'umur-kharjiyah',        label: '7. Umur Kharjiyah' },
      { id: 'umur-qaza',             label: '8. Umur Qaza' },
      { id: 'niyaaz-fmb',            label: '9. Niyaaz & FMB' },
      { id: 'umur-tijaarat',         label: '10. Umur Tijaarat' },
      { id: 'avqaaf',                label: '11. Avqaaf' },
      { id: 'umur-seheeyah',         label: '12. Umur Seheeyah' },
      { id: 'cancelled-vouchers',    label: 'Cancelled Vouchers', badge: 'Audit', badgeColor: 'yellow' },
    ]
  },
  {
    id: 'safar-mubarak',
    title: 'Huzurala Safar Mubarak',
    iconName: 'Plane',
    items: [
      { id: 'safar-dashboard',       label: 'Safar Dashboard', badge: 'Live', badgeColor: 'emerald' },
      { id: 'safar-cities',          label: 'Cities & Venues' },
      { id: 'safar-events',          label: 'Event Schedule' },
      { id: 'safar-masool',          label: 'Masool In-charge' },
      { id: 'safar-takhmeen',        label: 'Takhmeen Allocation' },
      { id: 'safar-dues',            label: 'Due Reports', badge: 'Dues', badgeColor: 'yellow' },
      { id: 'ziyafat-qadambosi',     label: 'Ziyafat & Qadambosi', badge: 'Tokens', badgeColor: 'blue' },
    ]
  },
  {
    id: 'haj-mazar',
    title: 'Haj & Mazar',
    iconName: 'Landmark',
    items: [
      { id: 'haj-entries',           label: 'Haj Pilgrim Entries' },
      { id: 'haj-expenses',          label: 'Haj Expense Heads' },
      { id: 'haj-ledger',            label: 'Haj Financial Ledger' },
      { id: 'mazar-registration',    label: 'Mazar Registration & Rooms' },
      { id: 'mazar-tracking',        label: 'Entry & Gate Tracking', badge: 'Scanner', badgeColor: 'blue' },
    ]
  },
  {
    id: 'appointment-messaging',
    title: 'Appointments & Messaging',
    iconName: 'CalendarCheck',
    items: [
      { id: 'appointment-slots',     label: 'Slot Lists & Assigning' },
      { id: 'appointment-booking',   label: 'Book Appointment', badge: 'Live', badgeColor: 'emerald' },
      { id: 'appointment-blocking',  label: 'Block Slots (Leave)' },
      { id: 'appointment-purposes',  label: 'Purpose Management' },
      { id: 'whatsapp-messaging',    label: 'WhatsApp Dispatcher', badge: 'Broadcast', badgeColor: 'blue' },
    ]
  },
  {
    id: 'services',
    title: 'Services',
    iconName: 'Calendar',
    items: [
      { id: 'hall-booking',       label: 'Hall Bookings' },
      { id: 'ziyarat-tracking',   label: 'Ziyarat Tracking (Karbala/Hajj)' },
      { id: 'miqaat-madrasa',     label: 'Madrasa & Miqaat Registrations' }
    ]
  },
  {
    id: 'payments-receipts',
    title: 'Payments & Receipts Engine',
    iconName: 'Receipt',
    items: [
      { id: 'counter-payment',    label: 'Counter Payment Entry',  badge: 'POS', badgeColor: 'blue' },
      { id: 'receipts-history',   label: 'Receipts History & PDF Print' },
      { id: 'refund-ledger',      label: 'Refund / Reversal Ledger' }
    ]
  },
  {
    id: 'system-settings',
    title: 'System Settings',
    iconName: 'Sliders',
    items: [
      { id: 'user-list',          label: 'User Management', badge: 'RBAC', badgeColor: 'blue' },
      { id: 'roles-permissions',  label: 'Granular Permissions' },
      { id: 'delete-receipt-perm', label: 'Delete Receipt Permissions' },
      { id: 'bank-accounts',      label: 'Bank Accounts Master' },
      { id: 'trust-waqf',         label: 'Trust & Waqf Master' },
      { id: 'cash-limits',        label: 'Cash Receipt Limits' },
      { id: 'notifications',      label: 'Notifications Gateway' },
      { id: 'jamaat-details',     label: 'Update Jamaat Details' },
      { id: 'date-blocking',      label: 'Receipt Date Blocking' },
      { id: 'bulk-photos',        label: 'Bulk Photos Upload' },
      { id: 'add-holiday',        label: 'Holiday & Weekend Manager', badge: 'Calendar', badgeColor: 'emerald' },
      { id: 'activity-logs',      label: 'Central Activity Logs' },
      { id: 'safar-logs',         label: 'Safar Audit Trail' },
      { id: 'change-password',    label: 'Secure Change Password' },
    ]
  }
];

