/**
 * Menu & Stock Management Utilities
 * Powers Part 2A:
 * - Module 3: Menu Management (7 Sub-Pages)
 * - Module 4: Stock Management (7 Sub-Pages)
 */

// ── MENU MANAGEMENT TYPES ───────────────────────────────────────────────────

export interface MenuCategory {
  id: string;
  name: string;
  code: string;
  description: string;
  displayOrder: number;
}

export interface MenuItem {
  id: string;
  name: string;
  code: string;
  categoryId: string;
  categoryName: string;
  unitId: string;
  unitName: string;
  isVegetarian: boolean;
  approxPrepTimeMins: number;
  averagePortionGrams: number;
  standardCostPerServing: number;
  ingredients: { itemName: string; quantity: number; unit: string }[];
}

export interface MeasurementUnit {
  id: string;
  name: string;
  symbol: string;
  type: 'Weight' | 'Volume' | 'Count' | 'Packaging';
  conversionRatioToBase: number; // e.g. 1 Kg = 1000 Grams
}

export interface MenuMasterTemplate {
  id: string;
  title: string;
  code: string;
  dayOfWeek: string;
  mealType: 'Lunch' | 'Dinner' | 'Both';
  riceDish: string;
  meatCurryDish: string;
  breadDish: string;
  sweetDish: string;
  saladAccompaniment: string;
  estimatedCostPerThaali: number;
}

export interface DailyMenuEntry {
  id: string;
  date: string;
  hijriDate: string;
  mealType: 'Lunch' | 'Dinner';
  menuTemplateId?: string;
  menuTitle: string;
  dishes: { category: string; dishName: string; quantityKg: number }[];
  isSpecialMiqaat: boolean;
  miqaatNote?: string;
  targetThaalis: number;
  actualThaalisDispatched: number;
  totalCostCalculated: number;
  costPerThaali: number;
}

// ── STOCK MANAGEMENT TYPES ──────────────────────────────────────────────────

export interface StockCategory {
  id: string;
  name: string;
  code: string;
  description: string;
}

export interface StockItem {
  id: string;
  name: string;
  code: string;
  categoryId: string;
  categoryName: string;
  unitId: string;
  unitName: string;
  currentStock: number;
  minimumReorderLevel: number;
  standardPurchaseRate: number;
  storageLocation: string;
  expiryWarningDays: number;
}

export interface Vendor {
  id: string;
  code: string;
  companyName: string;
  contactPerson: string;
  mobileNumber: string;
  email?: string;
  address: string;
  gstin?: string;
  paymentTermsDays: number;
  rating: number;
  status: 'Active' | 'Blacklisted' | 'Inactive';
}

export interface PurchaseInvoiceItem {
  stockItemId: string;
  stockItemName: string;
  unitName: string;
  quantity: number;
  unitPrice: number;
  taxPct: number;
  totalAmount: number;
}

export interface PurchaseEntry {
  id: string;
  grnNumber: string;
  invoiceNumber: string;
  invoiceDate: string;
  vendorId: string;
  vendorName: string;
  receivedDate: string;
  items: PurchaseInvoiceItem[];
  subTotal: number;
  taxAmount: number;
  grandTotal: number;
  paymentStatus: 'Paid' | 'Credit' | 'Partial';
  receivedBy: string;
  notes?: string;
}

// ── STORAGE KEYS ────────────────────────────────────────────────────────────

export const MENU_CATEGORIES_KEY = 'jamat_menu_categories_v1';
export const MENU_ITEMS_KEY = 'jamat_menu_items_v1';
export const MEASUREMENT_UNITS_KEY = 'jamat_units_v1';
export const MENU_TEMPLATES_KEY = 'jamat_menu_templates_v1';
export const DAILY_MENUS_KEY = 'jamat_daily_menus_v1';

export const STOCK_CATEGORIES_KEY = 'jamat_stock_categories_v1';
export const STOCK_ITEMS_KEY = 'jamat_stock_items_v1';
export const VENDORS_KEY = 'jamat_vendors_v1';
export const PURCHASE_ENTRIES_KEY = 'jamat_purchase_entries_v1';

// ── INITIAL SEED DATA: UNITS ────────────────────────────────────────────────

export const INITIAL_UNITS: MeasurementUnit[] = [
  { id: 'u-1', name: 'Kilogram', symbol: 'Kg', type: 'Weight', conversionRatioToBase: 1000 },
  { id: 'u-2', name: 'Gram', symbol: 'g', type: 'Weight', conversionRatioToBase: 1 },
  { id: 'u-3', name: 'Litre', symbol: 'L', type: 'Volume', conversionRatioToBase: 1000 },
  { id: 'u-4', name: 'Millilitre', symbol: 'ml', type: 'Volume', conversionRatioToBase: 1 },
  { id: 'u-5', name: 'Pieces', symbol: 'Pcs', type: 'Count', conversionRatioToBase: 1 },
  { id: 'u-6', name: 'Deg (Large Cauldron)', symbol: 'Deg', type: 'Packaging', conversionRatioToBase: 50 },
  { id: 'u-7', name: 'Bag (50 Kg Sack)', symbol: 'Bag', type: 'Packaging', conversionRatioToBase: 50000 },
];

// ── INITIAL SEED DATA: MENU ─────────────────────────────────────────────────

export const INITIAL_MENU_CATEGORIES: MenuCategory[] = [
  { id: 'mcat-1', name: 'Rice & Biryani Specialties', code: 'MC-RICE', description: 'Biryani, Pulao, Dal Chawal Palidu, Kari Chawal', displayOrder: 1 },
  { id: 'mcat-2', name: 'Meat & Chicken Salan', code: 'MC-MEAT', description: 'Mutton Qorma, White Chicken, Gosht Gravy', displayOrder: 2 },
  { id: 'mcat-3', name: 'Rotis, Naan & Breads', code: 'MC-ROTI', description: 'Tawa Roti, Rumali, Tandoori Naan, Khamir Roti', displayOrder: 3 },
  { id: 'mcat-4', name: 'Mithai & Sweet Dishes', code: 'MC-SWEET', description: 'Sheer Khurma, Malida, Kalamro, Mango Custard, Dudhi Halwa', displayOrder: 4 },
  { id: 'mcat-5', name: 'Dal, Soups & Side Gravies', code: 'MC-DAL', description: 'Toor Dal, Palidu, Sarkha, Soup', displayOrder: 5 },
  { id: 'mcat-6', name: 'Salads & Accompaniments', code: 'MC-ACCOMP', description: 'Raita, Kachumber, Nimbu/Mirchi, Chutney', displayOrder: 6 },
];

export const INITIAL_MENU_ITEMS: MenuItem[] = [
  {
    id: 'mitem-1',
    name: 'Dal Chawal Palidu (DCP)',
    code: 'DISH-DCP',
    categoryId: 'mcat-1',
    categoryName: 'Rice & Biryani Specialties',
    unitId: 'u-1',
    unitName: 'Kg',
    isVegetarian: true,
    approxPrepTimeMins: 90,
    averagePortionGrams: 350,
    standardCostPerServing: 65,
    ingredients: [
      { itemName: 'Basmati Rice', quantity: 0.15, unit: 'Kg' },
      { itemName: 'Toor Dal Premium', quantity: 0.08, unit: 'Kg' },
      { itemName: 'Pure Ghee', quantity: 0.02, unit: 'Kg' },
    ],
  },
  {
    id: 'mitem-2',
    name: 'Shahi Mutton Biryani',
    code: 'DISH-MBIR',
    categoryId: 'mcat-1',
    categoryName: 'Rice & Biryani Specialties',
    unitId: 'u-1',
    unitName: 'Kg',
    isVegetarian: false,
    approxPrepTimeMins: 140,
    averagePortionGrams: 450,
    standardCostPerServing: 145,
    ingredients: [
      { itemName: 'Mutton Grade A', quantity: 0.22, unit: 'Kg' },
      { itemName: 'Basmati Rice', quantity: 0.18, unit: 'Kg' },
      { itemName: 'Biryani Spices Mix', quantity: 0.02, unit: 'Kg' },
    ],
  },
  {
    id: 'mitem-3',
    name: 'Zafrani Sheer Khurma',
    code: 'DISH-SHEER',
    categoryId: 'mcat-4',
    categoryName: 'Mithai & Sweet Dishes',
    unitId: 'u-3',
    unitName: 'Litre',
    isVegetarian: true,
    approxPrepTimeMins: 60,
    averagePortionGrams: 150,
    standardCostPerServing: 42,
    ingredients: [
      { itemName: 'Full Cream Milk', quantity: 0.2, unit: 'L' },
      { itemName: 'Vermicelli / Seviyan', quantity: 0.03, unit: 'Kg' },
      { itemName: 'Dry Fruit Mix', quantity: 0.02, unit: 'Kg' },
    ],
  },
  {
    id: 'mitem-4',
    name: 'Tawa Fresh Phulka Roti (Set of 4)',
    code: 'DISH-ROTI',
    categoryId: 'mcat-3',
    categoryName: 'Rotis, Naan & Breads',
    unitId: 'u-5',
    unitName: 'Pcs',
    isVegetarian: true,
    approxPrepTimeMins: 45,
    averagePortionGrams: 120,
    standardCostPerServing: 20,
    ingredients: [
      { itemName: 'Chakki Fresh Wheat Atta', quantity: 0.12, unit: 'Kg' },
    ],
  },
];

export const INITIAL_MENU_TEMPLATES: MenuMasterTemplate[] = [
  { id: 'tpl-1', title: 'Monday Mutton Special Menu', code: 'TPL-MON', dayOfWeek: 'Monday', mealType: 'Both', riceDish: 'Shahi Mutton Biryani', meatCurryDish: 'Mutton Korma Gravy', breadDish: 'Tawa Fresh Phulka Roti', sweetDish: 'Zafrani Sheer Khurma', saladAccompaniment: 'Boondi Raita & Salad', estimatedCostPerThaali: 215 },
  { id: 'tpl-2', title: 'Tuesday Traditional DCP Menu', code: 'TPL-TUE', dayOfWeek: 'Tuesday', mealType: 'Both', riceDish: 'Dal Chawal Palidu (DCP)', meatCurryDish: 'Fried Gosht Masala', breadDish: 'Hot Khamir Roti', sweetDish: 'Pista Kalamro', saladAccompaniment: 'Kachumber & Lime', estimatedCostPerThaali: 165 },
  { id: 'tpl-3', title: 'Wednesday Chicken Angara Menu', code: 'TPL-WED', dayOfWeek: 'Wednesday', mealType: 'Both', riceDish: 'Jeera Rice', meatCurryDish: 'Chicken Angara Boneless', breadDish: 'Tandoori Naan', sweetDish: 'Dudhi Halwa', saladAccompaniment: 'Mint Chutney Salad', estimatedCostPerThaali: 185 },
  { id: 'tpl-4', title: 'Friday Jumuah Eid Special', code: 'TPL-FRI', dayOfWeek: 'Friday', mealType: 'Both', riceDish: 'Hyderabadi Gosht Biryani', meatCurryDish: 'Kofta Curry', breadDish: 'Rumali Roti', sweetDish: 'Malida & Dry Fruits', saladAccompaniment: 'Dahi Vada & Salad', estimatedCostPerThaali: 240 },
];

export const INITIAL_DAILY_MENUS: DailyMenuEntry[] = [
  {
    id: 'dm-1',
    date: '2025-04-20',
    hijriDate: '1446-10-21',
    mealType: 'Lunch',
    menuTitle: 'Sunday Grand Biryani Feast',
    dishes: [
      { category: 'Rice', dishName: 'Shahi Mutton Biryani', quantityKg: 85 },
      { category: 'Sweet', dishName: 'Zafrani Sheer Khurma', quantityKg: 40 },
      { category: 'Roti', dishName: 'Phulka Roti', quantityKg: 30 },
    ],
    isSpecialMiqaat: false,
    targetThaalis: 220,
    actualThaalisDispatched: 218,
    totalCostCalculated: 44690,
    costPerThaali: 205,
  },
  {
    id: 'dm-2',
    date: '2025-04-21',
    hijriDate: '1446-10-22',
    mealType: 'Lunch',
    menuTitle: 'Monday Traditional DCP & Palidu',
    dishes: [
      { category: 'Rice', dishName: 'Dal Chawal Palidu', quantityKg: 95 },
      { category: 'Meat', dishName: 'Tawa Fried Gosht', quantityKg: 45 },
      { category: 'Sweet', dishName: 'Pista Kalamro', quantityKg: 35 },
    ],
    isSpecialMiqaat: false,
    targetThaalis: 220,
    actualThaalisDispatched: 220,
    totalCostCalculated: 36300,
    costPerThaali: 165,
  },
];

// ── INITIAL SEED DATA: STOCK ────────────────────────────────────────────────

export const INITIAL_STOCK_CATEGORIES: StockCategory[] = [
  { id: 'scat-1', name: 'Grains, Rice & Flours', code: 'STK-GRAINS', description: 'Basmati rice, wheat atta, maida, sooji' },
  { id: 'scat-2', name: 'Pulses & Lentils (Dals)', code: 'STK-PULSE', description: 'Toor dal, moong dal, chana dal, masoor' },
  { id: 'scat-3', name: 'Oils, Pure Ghee & Fats', code: 'STK-OIL', description: 'Sunflower oil, mustard oil, pure cow ghee, vanaspati' },
  { id: 'scat-4', name: 'Fresh Meat & Poultry', code: 'STK-MEAT', description: 'Halal mutton, chicken, boneless, minced keema' },
  { id: 'scat-5', name: 'Spices, Condiments & Masalas', code: 'STK-SPICE', description: 'Cardamom, cloves, cinnamon, turmeric, red chilli, saffron' },
  { id: 'scat-6', name: 'Dairy & Perishables', code: 'STK-DAIRY', description: 'Whole milk, fresh curd/dahi, paneer, cream' },
  { id: 'scat-7', name: 'Kitchen Packaging & Foils', code: 'STK-PACK', description: 'Thaali foil containers, sealing film, labels, plastic wraps' },
];

export const INITIAL_STOCK_ITEMS: StockItem[] = [
  { id: 'sitem-1', name: 'Basmati Rice (Rozana Royal 50kg)', code: 'RICE-BAS-50', categoryId: 'scat-1', categoryName: 'Grains, Rice & Flours', unitId: 'u-1', unitName: 'Kg', currentStock: 850, minimumReorderLevel: 250, standardPurchaseRate: 85, storageLocation: 'Godown Bay A-1', expiryWarningDays: 180 },
  { id: 'sitem-2', name: 'Premium Toor Dal (Polished)', code: 'DAL-TOOR-PR', categoryId: 'scat-2', categoryName: 'Pulses & Lentils (Dals)', unitId: 'u-1', unitName: 'Kg', currentStock: 420, minimumReorderLevel: 150, standardPurchaseRate: 145, storageLocation: 'Godown Bay A-2', expiryWarningDays: 120 },
  { id: 'sitem-3', name: 'Pure Desi Cow Ghee (15 Kg Tin)', code: 'GHEE-COW-TIN', categoryId: 'scat-3', categoryName: 'Oils, Pure Ghee & Fats', unitId: 'u-1', unitName: 'Kg', currentStock: 180, minimumReorderLevel: 60, standardPurchaseRate: 580, storageLocation: 'Cold Storage Room 1', expiryWarningDays: 90 },
  { id: 'sitem-4', name: 'Fresh Mutton (Halal Grade A)', code: 'MEAT-MUT-A', categoryId: 'scat-4', categoryName: 'Fresh Meat & Poultry', unitId: 'u-1', unitName: 'Kg', currentStock: 45, minimumReorderLevel: 30, standardPurchaseRate: 680, storageLocation: 'Deep Freezer #2', expiryWarningDays: 3 },
  { id: 'sitem-5', name: 'Sunflower Refined Oil (15 Litre Tin)', code: 'OIL-SUN-TIN', categoryId: 'scat-3', categoryName: 'Oils, Pure Ghee & Fats', unitId: 'u-3', unitName: 'L', currentStock: 360, minimumReorderLevel: 90, standardPurchaseRate: 135, storageLocation: 'Godown Bay B-1', expiryWarningDays: 180 },
  { id: 'sitem-6', name: 'Thaali Foil Containers (3-Compartment)', code: 'PKG-FOIL-3C', categoryId: 'scat-7', categoryName: 'Kitchen Packaging & Foils', unitId: 'u-5', unitName: 'Pcs', currentStock: 4200, minimumReorderLevel: 1000, standardPurchaseRate: 3.5, storageLocation: 'Packing Rack 3', expiryWarningDays: 365 },
];

export const INITIAL_VENDORS: Vendor[] = [
  { id: 'ven-1', code: 'VEN-01', companyName: 'Al-Madina Agro Commodities Pvt Ltd', contactPerson: 'Mustafa Bhai Lokhandwala', mobileNumber: '9820019283', email: 'sales@almadinaagro.com', address: 'APMC Market, Grain Yard 14, Surat', gstin: '24AAACA9918F1ZU', paymentTermsDays: 15, rating: 5, status: 'Active' },
  { id: 'ven-2', code: 'VEN-02', companyName: 'Burhani Halal Meat Suppliers', contactPerson: 'Sheikh Hatim Bhai Meatwala', mobileNumber: '9820044551', address: 'Bazaar Gate Lane 4, Surat', gstin: '24AABCB1122P1ZY', paymentTermsDays: 7, rating: 5, status: 'Active' },
  { id: 'ven-3', code: 'VEN-03', companyName: 'Shree Krishna Dairy & Ghee Traders', contactPerson: 'Ramesh Patel', mobileNumber: '9820099881', address: 'Dairy Road Sector 2, Surat', gstin: '24AACCP7788M1ZK', paymentTermsDays: 30, rating: 4, status: 'Active' },
];

export const INITIAL_PURCHASES: PurchaseEntry[] = [
  {
    id: 'pur-1',
    grnNumber: 'GRN-2025-0104',
    invoiceNumber: 'INV-ALM-8891',
    invoiceDate: '2025-04-15',
    vendorId: 'ven-1',
    vendorName: 'Al-Madina Agro Commodities Pvt Ltd',
    receivedDate: '2025-04-15',
    items: [
      { stockItemId: 'sitem-1', stockItemName: 'Basmati Rice (Rozana Royal 50kg)', unitName: 'Kg', quantity: 500, unitPrice: 85, taxPct: 5, totalAmount: 44625 },
      { stockItemId: 'sitem-2', stockItemName: 'Premium Toor Dal (Polished)', unitName: 'Kg', quantity: 200, unitPrice: 145, taxPct: 5, totalAmount: 30450 },
    ],
    subTotal: 71500,
    taxAmount: 3575,
    grandTotal: 75075,
    paymentStatus: 'Paid',
    receivedBy: 'taherfmb',
    notes: 'Bulk stock arrival for month of Shawwal.',
  },
  {
    id: 'pur-2',
    grnNumber: 'GRN-2025-0105',
    invoiceNumber: 'INV-BHM-4401',
    invoiceDate: '2025-04-18',
    vendorId: 'ven-2',
    vendorName: 'Burhani Halal Meat Suppliers',
    receivedDate: '2025-04-18',
    items: [
      { stockItemId: 'sitem-4', stockItemName: 'Fresh Mutton (Halal Grade A)', unitName: 'Kg', quantity: 75, unitPrice: 680, taxPct: 0, totalAmount: 51000 },
    ],
    subTotal: 51000,
    taxAmount: 0,
    grandTotal: 51000,
    paymentStatus: 'Credit',
    receivedBy: 'taherfmb',
    notes: 'Delivered fresh in refrigerated van. Inspected by head cook.',
  },
];

// ── GETTERS & SETTERS ───────────────────────────────────────────────────────

export const getStoredMenuCategories = (): MenuCategory[] => {
  try {
    const raw = localStorage.getItem(MENU_CATEGORIES_KEY);
    if (!raw) { localStorage.setItem(MENU_CATEGORIES_KEY, JSON.stringify(INITIAL_MENU_CATEGORIES)); return INITIAL_MENU_CATEGORIES; }
    return JSON.parse(raw);
  } catch { return INITIAL_MENU_CATEGORIES; }
};
export const saveStoredMenuCategories = (c: MenuCategory[]) => {
  try { localStorage.setItem(MENU_CATEGORIES_KEY, JSON.stringify(c)); } catch (e) { console.error(e); }
};

export const getStoredMenuItems = (): MenuItem[] => {
  try {
    const raw = localStorage.getItem(MENU_ITEMS_KEY);
    if (!raw) { localStorage.setItem(MENU_ITEMS_KEY, JSON.stringify(INITIAL_MENU_ITEMS)); return INITIAL_MENU_ITEMS; }
    return JSON.parse(raw);
  } catch { return INITIAL_MENU_ITEMS; }
};
export const saveStoredMenuItems = (i: MenuItem[]) => {
  try { localStorage.setItem(MENU_ITEMS_KEY, JSON.stringify(i)); } catch (e) { console.error(e); }
};

export const getStoredUnits = (): MeasurementUnit[] => {
  try {
    const raw = localStorage.getItem(MEASUREMENT_UNITS_KEY);
    if (!raw) { localStorage.setItem(MEASUREMENT_UNITS_KEY, JSON.stringify(INITIAL_UNITS)); return INITIAL_UNITS; }
    return JSON.parse(raw);
  } catch { return INITIAL_UNITS; }
};
export const saveStoredUnits = (u: MeasurementUnit[]) => {
  try { localStorage.setItem(MEASUREMENT_UNITS_KEY, JSON.stringify(u)); } catch (e) { console.error(e); }
};

export const getStoredMenuTemplates = (): MenuMasterTemplate[] => {
  try {
    const raw = localStorage.getItem(MENU_TEMPLATES_KEY);
    if (!raw) { localStorage.setItem(MENU_TEMPLATES_KEY, JSON.stringify(INITIAL_MENU_TEMPLATES)); return INITIAL_MENU_TEMPLATES; }
    return JSON.parse(raw);
  } catch { return INITIAL_MENU_TEMPLATES; }
};
export const saveStoredMenuTemplates = (t: MenuMasterTemplate[]) => {
  try { localStorage.setItem(MENU_TEMPLATES_KEY, JSON.stringify(t)); } catch (e) { console.error(e); }
};

export const getStoredDailyMenus = (): DailyMenuEntry[] => {
  try {
    const raw = localStorage.getItem(DAILY_MENUS_KEY);
    if (!raw) { localStorage.setItem(DAILY_MENUS_KEY, JSON.stringify(INITIAL_DAILY_MENUS)); return INITIAL_DAILY_MENUS; }
    return JSON.parse(raw);
  } catch { return INITIAL_DAILY_MENUS; }
};
export const saveStoredDailyMenus = (d: DailyMenuEntry[]) => {
  try { localStorage.setItem(DAILY_MENUS_KEY, JSON.stringify(d)); } catch (e) { console.error(e); }
};

export const getStoredStockCategories = (): StockCategory[] => {
  try {
    const raw = localStorage.getItem(STOCK_CATEGORIES_KEY);
    if (!raw) { localStorage.setItem(STOCK_CATEGORIES_KEY, JSON.stringify(INITIAL_STOCK_CATEGORIES)); return INITIAL_STOCK_CATEGORIES; }
    return JSON.parse(raw);
  } catch { return INITIAL_STOCK_CATEGORIES; }
};
export const saveStoredStockCategories = (c: StockCategory[]) => {
  try { localStorage.setItem(STOCK_CATEGORIES_KEY, JSON.stringify(c)); } catch (e) { console.error(e); }
};

export const getStoredStockItems = (): StockItem[] => {
  try {
    const raw = localStorage.getItem(STOCK_ITEMS_KEY);
    if (!raw) { localStorage.setItem(STOCK_ITEMS_KEY, JSON.stringify(INITIAL_STOCK_ITEMS)); return INITIAL_STOCK_ITEMS; }
    return JSON.parse(raw);
  } catch { return INITIAL_STOCK_ITEMS; }
};
export const saveStoredStockItems = (s: StockItem[]) => {
  try { localStorage.setItem(STOCK_ITEMS_KEY, JSON.stringify(s)); } catch (e) { console.error(e); }
};

export const getStoredVendors = (): Vendor[] => {
  try {
    const raw = localStorage.getItem(VENDORS_KEY);
    if (!raw) { localStorage.setItem(VENDORS_KEY, JSON.stringify(INITIAL_VENDORS)); return INITIAL_VENDORS; }
    return JSON.parse(raw);
  } catch { return INITIAL_VENDORS; }
};
export const saveStoredVendors = (v: Vendor[]) => {
  try { localStorage.setItem(VENDORS_KEY, JSON.stringify(v)); } catch (e) { console.error(e); }
};

export const getStoredPurchaseEntries = (): PurchaseEntry[] => {
  try {
    const raw = localStorage.getItem(PURCHASE_ENTRIES_KEY);
    if (!raw) { localStorage.setItem(PURCHASE_ENTRIES_KEY, JSON.stringify(INITIAL_PURCHASES)); return INITIAL_PURCHASES; }
    return JSON.parse(raw);
  } catch { return INITIAL_PURCHASES; }
};
export const saveStoredPurchaseEntries = (p: PurchaseEntry[]) => {
  try { localStorage.setItem(PURCHASE_ENTRIES_KEY, JSON.stringify(p)); } catch (e) { console.error(e); }
};
