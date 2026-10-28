import {
  NavCategory,
  UserProfile,
  SubModuleAction,
  SubModulePermissions,
  UserPermissionsMap,
  ManagedUser,
  ActivityLogEntry,
} from '../types';

export interface SubModuleDefinition {
  id: string;
  name: string;
  description: string;
}

export interface DepartmentDefinition {
  id: string;
  name: string;
  categoryIcon: string;
  subModules: SubModuleDefinition[];
}

export const RBAC_DEPARTMENTS: DepartmentDefinition[] = [
  {
    id: 'mumineen',
    name: 'Mumineen Master',
    categoryIcon: 'UserCheck',
    subModules: [
      { id: 'mumineen-list',             name: 'Mumineen List',            description: 'Central searchable & filterable mumineen directory.' },
      { id: 'mumineen-registration',     name: 'Registration Wizard',       description: 'Multi-step enrollment for new HOF and family members.' },
      { id: 'non-local-mumineen',        name: 'Non-Local Mumineen',        description: 'Visiting, guest, and relocated out-of-town members.' },
      { id: 'deleted-mumineen',          name: 'Delete Mumineen List',      description: 'Recycle bin and soft-deleted archive management.' },
      { id: 'mumineen-outstanding',      name: 'Outstanding Ledger',        description: 'Consolidated member-wise dues ledger across all accounts.' },
      { id: 'inactive-mumineen',         name: 'Inactive Mumineen List',    description: 'Records of temporarily abroad or paused members.' },
      { id: 'add-smart-card',            name: 'Add Smart Card',            description: 'RFID and NFC chip hardware credential mapping.' },
      { id: 'print-smart-card',          name: 'Print Smart Card',          description: 'Dual-sided printable ID card studio and generator.' },
      { id: 'safai-chitthi-entry',       name: 'Safai Chitthi Entry',       description: 'Clearance certificate issuance with automated dues lock.' },
      { id: 'outstanding-safai-chitthi', name: 'Blocked Chitthi List',      description: 'Tracking and resolution of blocked clearance requests.' },
      { id: 'jamaat-category-list',      name: 'Jamaat Category List',      description: 'Custom member classifications and privilege grading.' },
      { id: 'outstanding-comments',      name: 'Outstanding Comments',      description: 'Administrative follow-ups, internal remarks, and alerts.' },
      { id: 'sync-its52',                name: 'Sync ITS52 Data',           description: 'Cloud API and CSV bulk ingestion synchronization.' },
    ],
  },
  {
    id: 'member-master',
    name: 'Member & Area Master',
    categoryIcon: 'Users',
    subModules: [
      {
        id: 'directory-hof',
        name: 'Directory & Family HOF',
        description: 'Mumineen central directory, HOF records, and family relations.',
      },
      {
        id: 'area-mapping',
        name: 'Mohallah Area Mapping',
        description: 'Sector boundaries, buildings, flat numbers, and area allocation.',
      },
      {
        id: 'its-updater',
        name: 'ITS Profile Updater',
        description: 'ITS verification, biometric photo records, and phone/email sync.',
      },
    ],
  },
  {
    id: 'fmb-takhmeen',
    name: 'FMB & Takhmeen',
    categoryIcon: 'UtensilsCrossed',
    subModules: [
      {
        id: 'thaali-status',
        name: 'Thaali Status Manager',
        description: 'Daily dispatch, active delivery routes, and safar pause requests.',
      },
      {
        id: 'takhmeen-allocation',
        name: 'Takhmeen Allocation',
        description: 'Annual FMB takhmeen tiers, hub breakdown, and pledge revisions.',
      },
      {
        id: 'fmb-dues',
        name: 'Daily Collection & Dues',
        description: 'Daily Thaali collections, outstanding dues, and waiver records.',
      },
    ],
  },
  {
    id: 'mohalla-management',
    name: 'Mohalla Management',
    categoryIcon: 'MapPin',
    subModules: [
      {
        id: 'mohalla-master',
        name: 'Mohalla Master',
        description: 'Multi-tier zone, boundary, and sector management.',
      },
      {
        id: 'sub-mohalla',
        name: 'Sub Mohalla',
        description: 'Sub-zone sectors, wing divisions, and building clusters.',
      },
      {
        id: 'incharge-master',
        name: 'Incharge Master',
        description: 'Committee incharge directory, contacts, and roles.',
      },
      {
        id: 'assign-incharge',
        name: 'Assign Incharge',
        description: 'Zone & sub-zone incharge mapping and assignments.',
      },
    ],
  },
  {
    id: 'sabeel-management',
    name: 'Sabeel Management',
    categoryIcon: 'Coins',
    subModules: [
      { id: 'sabeel-dashboard',          name: 'Sabeel Dashboard',         description: 'High-level financial collections and due analytics.' },
      { id: 'sabeel-statistics',         name: 'Sabeel Statistics',        description: 'Fiscal cycle analytics, Takhmeen status, and Gift Aid cards.' },
      { id: 'sabeel-print-takhmeen',     name: 'Print Takhmeen Form',      description: 'Advanced search filters and batch printable Takhmeen forms.' },
      { id: 'sabeel-type',               name: 'Sabeel Type Master',       description: 'Sabeel types, calculation frequency, and active statuses.' },
      { id: 'sabeel-grade-link',         name: 'Sabeel Grade & Link',      description: 'Sabeel grade tiers and linking to Sabeel types.' },
      { id: 'sabeel-firm-link',          name: 'Firms & Link Sabeel',      description: 'Commercial business firm master and Sabeel mapping.' },
      { id: 'sabeel-grade-change',       name: 'Grade & Number Change',    description: 'Sabeel grade reassignment and Sabeel number modifications.' },
      { id: 'sabeel-close-closed',       name: 'Close & Closed List',      description: 'Account closure workflow and historical closed Sabeel register.' },
      { id: 'sabeel-waive-receipt-config', name: 'Waive Off & Receipt Config', description: 'Due waiver approvals and printable receipt detail customizer.' },
      { id: 'sabeel-collection',         name: 'Payment Entry (POS)',      description: 'Point-of-sale receipt issuance and counter collections.' },
      { id: 'sabeel-view-print-receipts', name: 'View / Print Receipts',   description: 'Query historical receipts and bulk PDF generation.' },
      { id: 'sabeel-datewise-paymentwise', name: 'Datewise & Paymentwise', description: 'Chronological and payment-mode aggregated reports.' },
      { id: 'sabeel-gift-aid',           name: 'Gift Aid Report',          description: 'Gift Aid tax claimable amounts and donor schedules.' },
      { id: 'sabeel-due-report',         name: 'Sabeel Due Report',        description: 'Outstanding dues ledger with WhatsApp/SMS/Email follow-up.' },
      { id: 'sabeel-grade-history',      name: 'Grade Change History',     description: 'Audit log of all member Sabeel grade modifications.' },
      { id: 'sabeel-returned-cheque',    name: 'Return Cheque List',       description: 'Bounced cheque tracking, balance reversal, and notifications.' },
      { id: 'sabeel-cancelled',          name: 'Cancelled Receipts',       description: 'Reversed receipts, audit logs, and cancellation reasons.' },
      { id: 'sabeel-dynamic-grade-count', name: 'Dynamic Due & Grade Count', description: 'Aging bucket dues and grade-wise member distributions.' },
      { id: 'sabeel-ledger',             name: 'Sabeel Master Ledger',     description: 'Consolidated member Sabeel ledger and transaction history.' },
    ],
  },
  {
    id: 'faiz-hub',
    name: 'Faiz Module (FMB)',
    categoryIcon: 'Wallet',
    subModules: [
      { id: 'faiz-hub-dashboard',       name: 'Faiz Dashboard & Stats', description: 'Live FMB command center, total pledge, receipts, and recovery metrics.' },
      { id: 'faiz-default-year',        name: 'Default Takhmeen Year',  description: 'Configure and lock the active Hijri fiscal cycle for FMB.' },
      { id: 'faiz-opening-balance',     name: 'Niyaz Opening Balance',  description: 'Manage opening funds across operational bank accounts, cash vault, and waqf.' },
      { id: 'faiz-receipt-due-config',  name: 'Show Due on Receipt',    description: 'Toggle visibility of arrears, pending balances, and QR codes on receipts.' },
      { id: 'faiz-print-takhmeen',      name: 'Print Takhmeen Form',    description: 'Advanced 6-parameter member filter, copy multiplier, and bulk pledge forms.' },
      { id: 'faiz-expense-entry',       name: 'Expense Heads & Entry',  description: 'Disbursement vouchers with date, account, and transaction mode filters.' },
      { id: 'faiz-income-entry',        name: 'Income Heads & Entry',   description: 'FMB hub and deg sponsorship receipts with mode filters and audit logs.' },
      { id: 'faiz-additional-masters',  name: 'Additional Masters',     description: 'Account transfers, creditors, bank master, tagging rules, receipt numbering, and waivers.' },
      { id: 'faiz-receipt-management',  name: 'View / Print Receipts',  description: 'Date range, ITS, Sabeel, Thaali, category & payment mode filters, batch printing, and Hoob/Zabihat entries.' },
      { id: 'faiz-official-receipt',    name: 'Official Print Receipt', description: 'Pixel-perfect Dawoodi Bohra Jamaat Trust receipt layout with live auto-words calculation and print isolation.' },
      { id: 'faiz-reports-suite',       name: 'Faiz Reports Suite',     description: 'Datewise, Multi-Year (1433-1451H), Progress, Outstanding % buckets, Gift Aid, and Niyaz ledger.' },
      { id: 'faiz-audit-cheques',       name: 'Cheques & Cancellations', description: 'Return Cheque register, SMS dispatch, Niyaz Cancelled list, and Expense/Income revocation audits.' },
      { id: 'faiz-category-master',      name: 'Category Master',        description: 'Faiz pledge tiers, baseline hub amounts, and grade classifications.' },
      { id: 'faiz-hub-master',           name: 'Add Hub Master',         description: 'Annual family hub commitments, takhmeen declarations, and waivers.' },
      { id: 'faiz-payment-entry',        name: 'Hub Payment Entry',      description: 'Point-of-Sale counter receipt generation with multi-payment mode.' },
      { id: 'faiz-outstanding-report',   name: 'Hub Outstanding Report', description: 'Detailed member-wise pending hub balances, aging, and recovery status.' },
      { id: 'faiz-receipt-report',       name: 'Receipt Report',         description: 'Comprehensive historical receipt logs with audit filter and export.' },
      { id: 'faiz-ledger-report',        name: 'Ledger Report',          description: 'Single-mumin full debit-credit ledger statement for FMB.' },
      { id: 'faiz-cancelled-receipts',   name: 'Cancelled Receipts',     description: 'Audit records of revoked or cancelled FMB payment receipts.' },
    ],
  },
  {
    id: 'thaali-management',
    name: 'Thaali Management (FMB)',
    categoryIcon: 'Truck',
    subModules: [
      { id: 'active-thaali-list',        name: 'Active Thaali List',     description: 'Roster of active households receiving daily FMB barakat thaali.' },
      { id: 'non-active-thaali-list',    name: 'Non Active Thaali List', description: 'Safir, paused, or hold thaali accounts with pause date ranges.' },
      { id: 'distributor-master',        name: 'Distributor Master',     description: 'Delivery volunteers, runner directory, vehicles, and phone contact.' },
      { id: 'distributor-type-master',   name: 'Distributor Type Master',description: 'Vehicle delivery types (Bike, Van, Walker, Pickup Point).' },
      { id: 'assign-distributor',        name: 'Assign Distributor',      description: 'Mohallah zone to delivery runner mapping and shift scheduling.' },
      { id: 'thaali-feedback-list',      name: 'Thaali Feedback List',    description: 'Mumineen quality, taste, temperature, and quantity ratings.' },
      { id: 'dispatch-list',             name: 'Dispatch List',          description: 'Kitchen gate-pass packing checklist and delivery route dispatch.' },
      { id: 'thaali-count',              name: 'Thaali Count',           description: 'Live kitchen headcount totals by thaali size (Full, Half, Quarter).' },
      { id: 'label-printing',            name: 'Label Printing Studio',  description: 'Batch thermal sticker printing for tiffin lids with barcode and mohallah.' },
    ],
  },
  {
    id: 'menu-management',
    name: 'Menu Management',
    categoryIcon: 'ChefHat',
    subModules: [
      { id: 'daily-menu-entry',          name: 'Daily Menu Entry',       description: 'Scheduled daily lunch/dinner menu, dish descriptions, and allergens.' },
      { id: 'menu-master',               name: 'Menu Master',            description: 'Weekly 7-day recurring rotation templates and special occasion feasts.' },
      { id: 'menu-category-master',      name: 'Menu Category Master',   description: 'Course categories (Rice, Dal/Curry, Meat, Sweet/Dessert, Salad).' },
      { id: 'menu-items-master',         name: 'Items Master',           description: 'Catalogue of prepared dishes, recipes, and dietary tags.' },
      { id: 'menu-unit-master',          name: 'Unit Master',            description: 'Standard weights and measures (Kg, Litre, Gram, Portion, Pieces).' },
      { id: 'item-wise-usage-report',    name: 'Item Wise Usage Report', description: 'Raw material consumption and ingredient usage history across dates.' },
      { id: 'daily-thaali-costing-report', name: 'Daily Thaali Costing', description: 'Per-thaali ingredient cost analysis, overheads, and kitchen margins.' },
    ],
  },
  {
    id: 'stock-management',
    name: 'Stock Management',
    categoryIcon: 'Boxes',
    subModules: [
      { id: 'item-wise-stock-report',    name: 'Item Wise Stock Report', description: 'Live central godown inventory levels with reorder warning flags.' },
      { id: 'stock-item-master',         name: 'Item Master',            description: 'Raw provisions, grains, spices, dairy, and packaging items.' },
      { id: 'stock-category-master',     name: 'Item Category Master',   description: 'Godown groupings (Grains, Spices, Dairy, Edible Oils, Packaging).' },
      { id: 'vendor-master',             name: 'Vendor Master',          description: 'Approved suppliers, GST credentials, wholesale terms, and contacts.' },
      { id: 'stock-unit-master',         name: 'Unit Master',            description: 'Inventory measurement unit definitions and conversion ratios.' },
      { id: 'purchase-entry-master',     name: 'Purchase Entry Master',  description: 'Inward goods receipt notes (GRN), invoice numbers, and billing.' },
      { id: 'stock-in-register',         name: 'Stock In Register',      description: 'Historical inward consignment log with vendor and batch tracking.' },
    ],
  },
  {
    id: 'voluntary-contribution',
    name: 'Voluntary Contribution',
    categoryIcon: 'HeartHandshake',
    subModules: [
      { id: 'voluntary-payment-entry',       name: 'Payment Entry',          description: 'Counter issuance of voluntary Hadiyah and Sadaqah vouchers.' },
      { id: 'voluntary-category-list',       name: 'Category List',          description: 'Niyaz categories, suggested contribution slabs, and purposes.' },
      { id: 'voluntary-ledger-report',       name: 'Ledger Report',          description: 'Audited contribution ledger and historical donor statements.' },
      { id: 'voluntary-cancelled-receipts',  name: 'Cancelled Receipts',     description: 'Audit log of voided voluntary contribution vouchers.' },
    ],
  },
  {
    id: 'community-schemes',
    name: 'Community Schemes',
    categoryIcon: 'Layers',
    subModules: [
      { id: 'scheme-takhmeen-master',        name: 'Takhmeen Master',        description: 'Annual commitment registrations across community welfare schemes.' },
      { id: 'scheme-payment-entry',          name: 'Payment Entry',          description: 'Counter recovery against pledged scheme amounts with instant receipts.' },
      { id: 'scheme-category-master',        name: 'Category Master',        description: 'Scheme-specific tiering slabs, baseline figures, and classifications.' },
      { id: 'scheme-outstanding-report',     name: 'Outstanding Report',     description: 'Overdue scheme commitment balances and recovery tracking.' },
      { id: 'scheme-ledger-report',          name: 'Ledger Report',          description: 'Comprehensive financial remittance ledger for community schemes.' },
      { id: 'scheme-cancelled-receipts',     name: 'Cancelled Receipts',     description: 'Audit register of revoked scheme receipt vouchers.' },
    ],
  },
  {
    id: 'wajebaat',
    name: 'Wajebaat Management',
    categoryIcon: 'Scale',
    subModules: [
      { id: 'wajebaat-dashboard',            name: 'Wajebaat Dashboard',     description: 'Executive overview of allocated vs remitted Wajebaat barakat.' },
      { id: 'wajebaat-year-master',          name: 'Year Master',            description: 'Hijri fiscal calendar year definitions and active audit cycles.' },
      { id: 'wajebaat-takhmeen-master',      name: 'Takhmeen Master',        description: 'Multi-head Wajebaat commitments (Khums, Zakat, Fitrah, etc.).' },
      { id: 'wajebaat-payment-entry',        name: 'Payment Entry',          description: 'Secure counter remittance entry with Shariah receipt generation.' },
      { id: 'wajebaat-outstanding-report',   name: 'Outstanding Report',     description: 'Aging roster of pending Wajebaat balances by mohallah.' },
      { id: 'wajebaat-ledger',               name: 'Ledger',                 description: 'Single-mumin and consolidated Wajebaat remittance ledger.' },
      { id: 'wajebaat-cancelled-receipts',   name: 'Cancelled Receipts',     description: 'Audit register of voided Wajebaat remittance receipts.' },
    ],
  },
  {
    id: 'rent-management',
    name: 'Rent Management',
    categoryIcon: 'Building2',
    subModules: [
      { id: 'rent-property-master',          name: 'Property Master',        description: 'Estate register of commercial shops, flats, and godowns.' },
      { id: 'rent-tenant-master',            name: 'Tenant Master',          description: 'Tenant profiles, KYC verification, Aadhaar/GST, and contact details.' },
      { id: 'rent-agreement-master',         name: 'Rent Agreement Master',  description: 'Lease contracts, tenure dates, monthly rent, and deposit records.' },
      { id: 'rent-payment-entry',            name: 'Rent Payment Entry',     description: 'Point-of-sale monthly kiraya collection with receipt generation.' },
      { id: 'rent-outstanding-report',       name: 'Outstanding Report',     description: 'Overdue property rent tracking and aging analysis.' },
      { id: 'rent-ledger-report',            name: 'Ledger Report',          description: 'Property-wise and tenant-wise rental debit/credit ledger.' },
      { id: 'rent-cancelled-receipts',       name: 'Cancelled Receipts',     description: 'Audit log of revoked rental payment vouchers.' },
    ],
  },
  {
    id: 'qardan-hasanah',
    name: 'Qardan Hasanah',
    categoryIcon: 'Landmark',
    subModules: [
      { id: 'qardan-application-sanction',   name: 'Applications & Sanctions', description: 'Loan requests, verification, and committee approval workflow.' },
      { id: 'qardan-disbursement-collection', name: 'Disbursement & Recovery', description: 'Fund payout entries, installment receipting, and bank linking.' },
      { id: 'qardan-scheme-master',          name: 'Scheme Master',          description: 'Housing, education, medical, and commercial loan scheme limits.' },
      { id: 'qardan-category-account',       name: 'Fund & Account Master',  description: 'Corpus endowments and bank disbursement accounts.' },
      { id: 'qardan-guarantor-master',       name: 'Guarantor Master (Zamin)', description: 'Zamin ITS directory, guarantee limits, and risk analysis.' },
      { id: 'qardan-ledger-outstanding',     name: 'Ledger & Outstanding',   description: 'Borrower-wise loan ledger, amortization, and overdue alerts.' },
    ],
  },
  {
    id: 'accounts-manager',
    name: 'Accounts Manager',
    categoryIcon: 'Calculator',
    subModules: [
      { id: 'accounts-voucher-entry',        name: 'Voucher Entry',          description: 'Double-entry Receipt, Payment, Contra, and Journal vouchers.' },
      { id: 'accounts-chart',                name: 'Chart of Accounts',      description: 'Hierarchical tree of Assets, Liabilities, Income, and Expenses.' },
      { id: 'accounts-cash-bank-book',       name: 'Cash & Bank Book',       description: 'Live daily transactional ledgers and bank balance monitoring.' },
      { id: 'accounts-general-ledger',       name: 'General Ledger',         description: 'Account-wise posting statements with running debit/credit balances.' },
      { id: 'accounts-trial-balance',        name: 'Trial Balance',          description: 'Mathematical balance verification of debits and credits.' },
      { id: 'accounts-financial-statements', name: 'Financial Statements',   description: 'Balance Sheet and Income & Expenditure statements.' },
    ],
  },
  {
    id: 'madresa-module',
    name: 'Madresa Management',
    categoryIcon: 'GraduationCap',
    subModules: [
      { id: 'madresa-students',              name: 'Student Directory',      description: 'Enrolled talabat directory, admission, and guardian mapping.' },
      { id: 'madresa-fee-collection',        name: 'Fee Collection',         description: 'Point-of-sale madresa fee collection with print receipts.' },
      { id: 'madresa-classes-fees',          name: 'Classes & Fee Master',   description: 'Daur grade configurations and annual tuition schedules.' },
      { id: 'madresa-attendance-progress',   name: 'Attendance & Progress',  description: 'Daily classroom attendance and term examination report cards.' },
    ],
  },
  {
    id: 'miqaat-ashara',
    name: 'Miqaat & Ashara Ohbat',
    categoryIcon: 'Sparkles',
    subModules: [
      { id: 'miqaat-master-events',          name: 'Miqaat Master & Calendar', description: 'Central Hijri event schedule and venue configurations.' },
      { id: 'masalla-allocation',            name: 'Masalla Seating',        description: 'Seat assignment, floor grid, and chair requests.' },
      { id: 'miqaat-attendance-relay',       name: 'Attendance & Live Relay', description: 'Real-time badge scanning and AV relay monitoring.' },
      { id: 'ashara-majlis-schedule',        name: 'Ashara Majlis Schedule', description: 'Daily 1-10 Moharram majlis timelines, zakireen, and waaz.' },
      { id: 'ashara-block-quota',            name: 'Block & Quota Config',   description: 'Hall section quotas, senior allocations, and marquee gates.' },
      { id: 'ashara-registration-import',    name: 'Registration & Import',  description: 'Mumin pass issuance, RFID verification, and bulk data import.' },
    ],
  },
  {
    id: 'services',
    name: 'Services',
    categoryIcon: 'Calendar',
    subModules: [
      {
        id: 'hall-booking',
        name: 'Hall Bookings',
        description: 'Mawaid halls reservation, jaman slots, and deposit collection.',
      },
      {
        id: 'ziyarat-tracking',
        name: 'Ziyarat Tracking (Karbala / Hajj / Umrah / Kalyako)',
        description: 'Ziyarat convoy schedules, travel clearances, and registration.',
      },
      {
        id: 'miqaat-madrasa',
        name: 'Madrasa & Miqaat Registrations',
        description: 'Al-Madrasa al-Saifiyah admissions, attendance, and miqaat passes.',
      },
    ],
  },
  {
    id: 'payments-receipts',
    name: 'Payments & Receipts Engine',
    categoryIcon: 'Receipt',
    subModules: [
      {
        id: 'counter-payment',
        name: 'Counter Payment Entry',
        description: 'Real-time cash, card, UPI, and bank counter payment collections.',
      },
      {
        id: 'receipts-history',
        name: 'Receipts History & PDF Print',
        description: 'Query historical receipts, generate print-ready duplicate receipts.',
      },
      {
        id: 'refund-ledger',
        name: 'Refund / Reversal Ledger',
        description: 'Payment reversals, cancellations, and official refund approvals.',
      },
    ],
  },
  {
    id: 'committee-trust',
    name: 'Committee & Trust Management',
    categoryIcon: 'Briefcase',
    subModules: [
      { id: 'committee-dashboard', name: 'Committee Dashboard', description: 'Executive portfolio oversight and financial health indicators.' },
      { id: 'committee-members',   name: 'Portfolios & Members', description: 'Executive committee portfolio holders, contacts, and tenures.' },
      { id: 'opening-balance',     name: 'Opening Balances',     description: 'Trust opening balances across cash vaults and bank accounts.' },
      { id: 'income-entry',        name: 'Income Heads & Entry', description: 'Recording trust receipts, donations, and endowment inflows.' },
      { id: 'expense-entry',       name: 'Expense Heads & Entry', description: 'Issuing authorized expense payment vouchers and invoices.' },
      { id: 'account-transfers',   name: 'Account Transfers',   description: 'Contra transfers between physical cash vaults and bank accounts.' },
      { id: 'trust-ledger',        name: 'Trust Ledger Reports', description: 'Consolidated trust ledger statement with running balance.' },
    ],
  },
  {
    id: 'umur-framework',
    name: '12 Umur Departmental Framework',
    categoryIcon: 'Compass',
    subModules: [
      { id: 'umur-dashboard',      name: '12 Umur Overview',    description: 'Executive reporting and performance metrics across all 12 institutional departments.' },
      { id: 'umur-diniyah',        name: '1. Umur Diniyah',      description: 'Namaz, Imamat, Quran Hifz, Azaan, Nikah, and religious majalis.' },
      { id: 'marafiq-burhaniyah',  name: '2. Marafiq Burhaniyah', description: 'Masjid complex maintenance, facilities upkeep, HVAC, and civil assets.' },
      { id: 'umur-talimiyah',      name: '3. Umur Talimiyah',    description: 'MSB Madrasa Saifiyah, educational guidance, and Quranic classes.' },
      { id: 'maliyah-iqtisadiyah', name: '4. Maliyah & Iqtisadiyah', description: 'Budget controls, financial audits, and community economic upliftment.' },
      { id: 'umur-mawarid',        name: '5. Umur Mawarid (HR)', description: 'Khidmatguzaar registry, volunteer roster, and scouts allocation.' },
      { id: 'umur-dakhiliyah',     name: '6. Umur Dakhiliyah',   description: 'Internal welfare, senior assistance, and communal harmony.' },
      { id: 'umur-kharjiyah',      name: '7. Umur Kharjiyah',    description: 'External civic liaison, municipal coordination, and public relations.' },
      { id: 'umur-qaza',           name: '8. Umur Qaza',         description: 'Arbitration tribunal, dispute mediation, and legal sharia agreements.' },
      { id: 'niyaaz-fmb',          name: '9. Niyaaz & FMB',      description: 'Central kitchen logistics, thaali quality, and food distribution.' },
      { id: 'umur-tijaarat',       name: '10. Umur Tijaarat',    description: 'Tijarat Rabeha, merchant directories, and entrepreneurial financing.' },
      { id: 'avqaaf',              name: '11. Avqaaf',           description: 'Endowment properties, waqf deed registrations, and estate revenue.' },
      { id: 'umur-seheeyah',       name: '12. Umur Seheeyah',    description: 'Medical welfare camps, ambulance services, and health insurance.' },
      { id: 'cancelled-vouchers',  name: 'Cancelled Vouchers',   description: 'Official register of voided and cancelled financial vouchers.' },
    ],
  },
  {
    id: 'safar-mubarak',
    name: 'Huzurala Safar Mubarak',
    categoryIcon: 'Plane',
    subModules: [
      { id: 'safar-dashboard',     name: 'Safar Dashboard',      description: 'High-level readiness metrics, venue checklists, and countdown.' },
      { id: 'safar-cities',        name: 'Cities & Venues',      description: 'Venue inspection, capacity monitoring, and local coordinators.' },
      { id: 'safar-events',        name: 'Event Schedule',       description: 'Majalis, Vaaz Mubarak, Qadambosi, and Iftetah schedule.' },
      { id: 'safar-masool',        name: 'Masool In-charge',     description: 'Protocol, security, kitchen, and seating in-charges.' },
      { id: 'safar-takhmeen',      name: 'Takhmeen Allocation',  description: 'Safar mubarak pledges, payments, and receipt generation.' },
      { id: 'safar-dues',          name: 'Due Reports',          description: 'Mohallah-wise outstanding pledge follow-up lists.' },
      { id: 'ziyafat-qadambosi',   name: 'Ziyafat & Qadambosi',  description: 'Time slot allocation, queue tokens, and family passes.' },
    ],
  },
  {
    id: 'haj-mazar',
    name: 'Haj & Mazar Management',
    categoryIcon: 'Landmark',
    subModules: [
      { id: 'haj-entries',         name: 'Haj Pilgrim Entries',  description: 'Maktab 52 pilgrim roster, visa status, and travel packages.' },
      { id: 'haj-expenses',        name: 'Haj Expense Heads',    description: 'Aviation charters, luxury lodging, and local logistics expenses.' },
      { id: 'haj-ledger',          name: 'Haj Financial Ledger', description: 'Reconciliation of pilgrim collections against service disbursements.' },
      { id: 'mazar-registration',  name: 'Mazar Registration',   description: 'Visiting zawaar accommodation, room allotments, and niyaz.' },
      { id: 'mazar-tracking',      name: 'Entry & Gate Tracking', description: 'Security gate scanning, visitor passes, and room check-outs.' },
    ],
  },
  {
    id: 'appointment-messaging',
    name: 'Appointments & Messaging',
    categoryIcon: 'CalendarCheck',
    subModules: [
      { id: 'appointment-slots',   name: 'Slot Lists & Assigning', description: 'Official interview time slots and seating capacity.' },
      { id: 'appointment-booking', name: 'Book Appointment',      description: 'Scheduling consultations with Janab Amil Saheb or Tribunals.' },
      { id: 'appointment-blocking', name: 'Block Slots (Leave)', description: 'Securing calendar blocks during travel or public holidays.' },
      { id: 'appointment-purposes', name: 'Purpose Management',  description: 'Official consultation categories (Nikah, Raza, Shafaat).' },
      { id: 'whatsapp-messaging',  name: 'WhatsApp Dispatcher',  description: 'Automated and broadcast reminder dispatch interface.' },
    ],
  },
];

// All 15 sub-module IDs
export const ALL_SUBMODULE_IDS = RBAC_DEPARTMENTS.flatMap((dept) =>
  dept.subModules.map((sm) => sm.id)
);

/**
 * Creates empty permissions where every action is false
 */
export const createDefaultPermissions = (): UserPermissionsMap => {
  const map: UserPermissionsMap = {};
  ALL_SUBMODULE_IDS.forEach((id) => {
    map[id] = { view: false, add: false, edit: false, delete: false };
  });
  return map;
};

/**
 * Creates full master permissions (all true)
 */
export const createFullPermissions = (): UserPermissionsMap => {
  const map: UserPermissionsMap = {};
  ALL_SUBMODULE_IDS.forEach((id) => {
    map[id] = { view: true, add: true, edit: true, delete: true };
  });
  return map;
};

/**
 * Enforces rule:
 * - Checking add, edit, or delete automatically enables view.
 * - Unchecking view automatically disables add, edit, and delete.
 */
export const applyActionRule = (
  current: SubModulePermissions,
  action: SubModuleAction,
  nextValue: boolean
): SubModulePermissions => {
  if (action === 'view') {
    if (!nextValue) {
      // If View is disabled, all other actions must be disabled
      return { view: false, add: false, edit: false, delete: false };
    }
    return { ...current, view: true };
  }

  // If Add, Edit, or Delete is being enabled, View MUST be true
  if (nextValue) {
    return {
      ...current,
      view: true,
      [action]: true,
    };
  }

  return {
    ...current,
    [action]: false,
  };
};

// Initial Mock Users with Granular Permissions
const INITIAL_USERS: ManagedUser[] = [
  {
    id: 'usr-1',
    fullName: 'Mulla Taher Vajihi',
    username: 'taherfmb',
    password: 'user#123',
    department: 'FMB & Takhmeen',
    permissions: {
      ...createDefaultPermissions(),
      'thaali-status': { view: true, add: true, edit: true, delete: false },
      'takhmeen-allocation': { view: true, add: true, edit: false, delete: false },
      'fmb-dues': { view: true, add: false, edit: false, delete: false },
      'hall-booking': { view: true, add: true, edit: true, delete: false },
    },
    createdAt: '1447-01-10',
  },
  {
    id: 'usr-2',
    fullName: 'Sheikh Huzefa Jamali',
    username: 'huzefasabeel',
    password: 'user#123',
    department: 'Sabeel Management',
    permissions: {
      ...createDefaultPermissions(),
      'sabeel-ledger': { view: true, add: true, edit: true, delete: false },
      'sabeel-collection': { view: true, add: true, edit: false, delete: false },
      'sabeel-history': { view: true, add: false, edit: false, delete: false },
      'counter-payment': { view: true, add: true, edit: true, delete: false },
      'receipts-history': { view: true, add: false, edit: false, delete: false },
    },
    createdAt: '1447-02-04',
  },
  {
    id: 'usr-3',
    fullName: 'Abdeali Bhai Shujauddin',
    username: 'abdealimember',
    password: 'user#123',
    department: 'Member & Area Master',
    permissions: {
      ...createDefaultPermissions(),
      'directory-hof': { view: true, add: true, edit: true, delete: false },
      'area-mapping': { view: true, add: true, edit: true, delete: false },
      'its-updater': { view: true, add: true, edit: true, delete: false },
    },
    createdAt: '1447-03-12',
  },
];

const INITIAL_LOGS: ActivityLogEntry[] = [
  {
    id: 'log-1',
    timestamp: '1447-03-12 10:15 AM',
    username: 'janabadmin',
    department: 'System Settings',
    subpage: 'Roles & Permissions',
    actionType: 'CREATED_USER',
    details: 'Provisioned officer "abdealimember" with granular [View, Add, Edit] on Member & Area Master.',
  },
  {
    id: 'log-2',
    timestamp: '1447-02-04 04:30 PM',
    username: 'janabadmin',
    department: 'System Settings',
    subpage: 'Roles & Permissions',
    actionType: 'CREATED_USER',
    details: 'Provisioned officer "huzefasabeel" with View & Add on Sabeel & Counter Payments.',
  },
  {
    id: 'log-3',
    timestamp: '1447-02-05 11:45 AM',
    username: 'taherfmb',
    department: 'FMB & Takhmeen',
    subpage: 'Thaali Status Manager',
    actionType: 'EDIT',
    details: 'Modified delivery dispatch status for Sector C Thaalis.',
  },
];

const USERS_STORAGE_KEY = 'jamat_granular_users_db_v2';
const LOGS_STORAGE_KEY = 'jamat_central_activity_logs_v2';

export const getStoredUsers = (): ManagedUser[] => {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_USERS;
  }
};

export const saveStoredUsers = (users: ManagedUser[]): void => {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (err) {
    console.error('Failed to save users', err);
  }
};

export const getStoredActivityLogs = (): ActivityLogEntry[] => {
  try {
    const raw = localStorage.getItem(LOGS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(INITIAL_LOGS));
      return INITIAL_LOGS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_LOGS;
  }
};

export const appendActivityLog = (
  username: string,
  department: string,
  subpage: string,
  actionType: ActivityLogEntry['actionType'],
  details: string
): ActivityLogEntry[] => {
  const currentLogs = getStoredActivityLogs();
  const now = new Date();
  const timeString = `${now.toLocaleDateString()} ${now.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`;

  const newEntry: ActivityLogEntry = {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    timestamp: timeString,
    username,
    department,
    subpage,
    actionType,
    details,
  };

  const updated = [newEntry, ...currentLogs].slice(0, 100);
  try {
    localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save activity logs', err);
  }
  return updated;
};

/**
 * Checks if a user has a specific granular permission on a sub-module.
 * Janab Super Admin (`janabadmin`) bypasses all restrictions with full master access.
 */
export const checkUserPermission = (
  user: UserProfile,
  subModuleId: string,
  action: SubModuleAction
): boolean => {
  // Super Admin / Janab has unrestricted master access
  if (user.username === 'janabadmin' || user.role === 'Super Admin' || user.permissions === 'all') {
    return true;
  }

  // Dashboard is always viewable
  if (subModuleId === 'overview' || subModuleId === 'faiz-dashboard') {
    return action === 'view';
  }

  if (!user.permissions || typeof user.permissions !== 'object') {
    return false;
  }

  const subPerms = user.permissions[subModuleId];
  return !!subPerms?.[action];
};

/**
 * Filters navigation categories so that ONLY pages where user has `View` permission are rendered.
 */
export const filterNavigationForUser = (
  categories: NavCategory[],
  user: UserProfile
): NavCategory[] => {
  // Janab Super Admin has full unrestricted access
  if (user.username === 'janabadmin' || user.role === 'Super Admin' || user.permissions === 'all') {
    return categories;
  }

  return categories
    .filter((cat) => {
      // System Settings is strictly reserved for Super Admin
      if (cat.id === 'system-settings') return false;
      return true;
    })
    .map((cat) => {
      // Dashboard is always viewable
      if (cat.id === 'dashboard') return cat;

      return {
        ...cat,
        items: cat.items.filter((item) => checkUserPermission(user, item.id, 'view')),
      };
    })
    .filter((cat) => cat.items.length > 0);
};
