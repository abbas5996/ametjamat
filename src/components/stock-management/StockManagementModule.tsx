import React, { useState, useMemo } from 'react';
import {
  Boxes, Package, Truck, Scale, ShoppingCart, BookOpen,
  BarChart2, Search, Plus, Filter, AlertTriangle, CheckCircle2,
  Calendar, DollarSign, Building, Phone, MapPin, X
} from 'lucide-react';
import { UserProfile, FinancialYear } from '../../types';
import {
  StockCategory, StockItem, Vendor, PurchaseEntry, MeasurementUnit,
  getStoredStockCategories, saveStoredStockCategories,
  getStoredStockItems, saveStoredStockItems,
  getStoredVendors, saveStoredVendors,
  getStoredPurchaseEntries, saveStoredPurchaseEntries,
  getStoredUnits
} from '../../utils/menuStockManagement';
import { appendActivityLog } from '../../utils/rbac';

export type StockSubTab =
  | 'stock-category-master'
  | 'stock-item-master'
  | 'vendor-master'
  | 'stock-unit-master'
  | 'purchase-entry-master'
  | 'stock-in-register'
  | 'item-wise-stock-report';

interface Props {
  currentUser: UserProfile;
  activeSubItemId: string;
  financialYear: FinancialYear;
  showToast: (m: string) => void;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

const fmtINR = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export const StockManagementModule: React.FC<Props> = ({
  currentUser,
  activeSubItemId,
  showToast,
  canAdd,
  canDelete,
}) => {
  const [categories, setCategories] = useState<StockCategory[]>(() => getStoredStockCategories());
  const [items, setItems] = useState<StockItem[]>(() => getStoredStockItems());
  const [vendors, setVendors] = useState<Vendor[]>(() => getStoredVendors());
  const [purchases, setPurchases] = useState<PurchaseEntry[]>(() => getStoredPurchaseEntries());
  const [units] = useState<MeasurementUnit[]>(() => getStoredUnits());

  const [activeTab, setActiveTab] = useState<StockSubTab>(() => {
    return (activeSubItemId as StockSubTab) || 'item-wise-stock-report';
  });

  React.useEffect(() => {
    if (activeSubItemId) setActiveTab(activeSubItemId as StockSubTab);
  }, [activeSubItemId]);

  const lowStockItems = useMemo(() => {
    return items.filter(i => i.currentStock <= i.minimumReorderLevel);
  }, [items]);

  const tabs: { key: StockSubTab; label: string; icon: React.ReactNode; count?: number; badge?: string }[] = [
    { key: 'item-wise-stock-report', label: '1. Stock Inventory Report', icon: <BarChart2 className="w-3.5 h-3.5" />, badge: lowStockItems.length > 0 ? `${lowStockItems.length} Low` : 'Live' },
    { key: 'stock-item-master',      label: '2. Raw Items Master',        icon: <Package className="w-3.5 h-3.5" />, count: items.length },
    { key: 'stock-category-master',  label: '3. Category Master',         icon: <Boxes className="w-3.5 h-3.5" />, count: categories.length },
    { key: 'vendor-master',          label: '4. Vendor Master',           icon: <Truck className="w-3.5 h-3.5" />, count: vendors.length },
    { key: 'purchase-entry-master',  label: '5. Purchase Invoice Entry',  icon: <ShoppingCart className="w-3.5 h-3.5" />, badge: 'GRN' },
    { key: 'stock-in-register',      label: '6. Stock In Register',       icon: <BookOpen className="w-3.5 h-3.5" />, count: purchases.length },
    { key: 'stock-unit-master',      label: '7. Unit Master',             icon: <Scale className="w-3.5 h-3.5" />, count: units.length },
  ];

  return (
    <div className="space-y-6">
      {/* Sub-tab Navigation Ribbon */}
      <div className="bg-white border border-amber-300/40 rounded-xl p-1.5 shadow-xs flex items-center gap-1 overflow-x-auto select-none">
        {tabs.map(({ key, label, icon, count, badge }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === key
                ? 'bg-[#EAB308] text-slate-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-amber-50'
            }`}
          >
            {icon}
            <span>{label}</span>
            {count !== undefined && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-white/80 text-slate-900 font-mono">
                {count}
              </span>
            )}
            {badge && (
              <span className={`ml-1 px-1.5 py-0.2 rounded-md text-[9px] font-extrabold uppercase ${
                badge.includes('Low') ? 'bg-rose-600 text-white' : 'bg-slate-900 text-amber-300'
              }`}>
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 1. STOCK INVENTORY REPORT */}
      {activeTab === 'item-wise-stock-report' && (
        <StockReportSubpage items={items} lowStockCount={lowStockItems.length} />
      )}

      {/* 2. ITEM MASTER */}
      {activeTab === 'stock-item-master' && (
        <StockItemMasterSubpage
          items={items}
          setItems={setItems}
          categories={categories}
          units={units}
          showToast={showToast}
          canAdd={canAdd}
        />
      )}

      {/* 3. CATEGORY MASTER */}
      {activeTab === 'stock-category-master' && (
        <StockCategorySubpage categories={categories} setCategories={setCategories} showToast={showToast} canAdd={canAdd} />
      )}

      {/* 4. VENDOR MASTER */}
      {activeTab === 'vendor-master' && (
        <VendorMasterSubpage vendors={vendors} setVendors={setVendors} showToast={showToast} canAdd={canAdd} />
      )}

      {/* 5. PURCHASE ENTRY MASTER */}
      {activeTab === 'purchase-entry-master' && (
        <PurchaseEntrySubpage
          purchases={purchases}
          setPurchases={setPurchases}
          items={items}
          setItems={setItems}
          vendors={vendors}
          currentUser={currentUser}
          showToast={showToast}
          canAdd={canAdd}
        />
      )}

      {/* 6. STOCK IN REGISTER */}
      {activeTab === 'stock-in-register' && (
        <StockInRegisterSubpage purchases={purchases} />
      )}

      {/* 7. UNIT MASTER */}
      {activeTab === 'stock-unit-master' && (
        <StockUnitSubpage units={units} />
      )}
    </div>
  );
};

// ============================================================================
// SUBPAGE IMPLEMENTATIONS: STOCK MANAGEMENT
// ============================================================================

const StockReportSubpage: React.FC<{ items: StockItem[]; lowStockCount: number }> = ({ items, lowStockCount }) => {
  const [search, setSearch] = useState('');
  const [filterLowOnly, setFilterLowOnly] = useState(false);

  const filtered = useMemo(() => {
    return items.filter(i => {
      const q = search.toLowerCase();
      const matchQ = !q || i.name.toLowerCase().includes(q) || i.code.toLowerCase().includes(q) || i.categoryName.toLowerCase().includes(q);
      const matchLow = !filterLowOnly || i.currentStock <= i.minimumReorderLevel;
      return matchQ && matchLow;
    });
  }, [items, search, filterLowOnly]);

  const totalValue = items.reduce((s, i) => s + (i.currentStock * i.standardPurchaseRate), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-amber-200/80 rounded-xl p-4 shadow-xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase">Total Items in Godown</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{items.length} SKUs</p>
        </div>
        <div className="bg-white border border-rose-200/80 rounded-xl p-4 shadow-xs">
          <p className="text-[11px] font-bold text-rose-700 uppercase">Items Below Reorder Level</p>
          <p className="text-2xl font-black text-rose-700 mt-1">{lowStockCount} Reorder Alerts</p>
        </div>
        <div className="bg-white border border-emerald-200/80 rounded-xl p-4 shadow-xs">
          <p className="text-[11px] font-bold text-emerald-700 uppercase">Estimated Godown Inventory Value</p>
          <p className="text-2xl font-black text-emerald-700 mt-1">{fmtINR(totalValue)}</p>
        </div>
      </div>

      <div className="bg-white border border-amber-300/40 rounded-xl p-4 shadow-xs flex justify-between items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items by SKU code, item name, category..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border rounded-lg text-xs"
          />
        </div>
        <button
          type="button"
          onClick={() => setFilterLowOnly(!filterLowOnly)}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            filterLowOnly ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          {filterLowOnly ? 'Show All Items' : 'Show Low Stock Only'}
        </button>
      </div>

      <div className="bg-white border border-amber-300/40 rounded-xl shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px]">
            <tr>
              <th className="px-4 py-3">Code & Item Name</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3 text-right">Available Stock</th>
              <th className="px-4 py-3 text-right">Reorder Level</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono">
            {filtered.map((item) => {
              const isLow = item.currentStock <= item.minimumReorderLevel;
              return (
                <tr key={item.id} className={isLow ? 'bg-rose-50/30' : 'hover:bg-slate-50'}>
                  <td className="px-4 py-3 font-sans">
                    <span className="font-mono text-amber-700 font-bold mr-2 text-[10px]">{item.code}</span>
                    <span className="font-bold text-slate-900">{item.name}</span>
                  </td>
                  <td className="px-4 py-3 font-sans text-slate-600">{item.categoryName}</td>
                  <td className={`px-4 py-3 text-right font-black ${isLow ? 'text-rose-700 text-sm' : 'text-slate-900'}`}>
                    {item.currentStock} {item.unitName}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-500">{item.minimumReorderLevel} {item.unitName}</td>
                  <td className="px-4 py-3 font-sans text-slate-600">{item.storageLocation}</td>
                  <td className="px-4 py-3 text-center font-sans">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isLow ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {isLow ? 'Low Stock' : 'Adequate'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const StockItemMasterSubpage: React.FC<{
  items: StockItem[];
  setItems: React.Dispatch<React.SetStateAction<StockItem[]>>;
  categories: StockCategory[];
  units: MeasurementUnit[];
  showToast: (m: string) => void;
  canAdd: boolean;
}> = ({ items, setItems, categories, units, showToast, canAdd }) => {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    code: '',
    name: '',
    categoryId: categories[0]?.id || '',
    unitId: units[0]?.id || '',
    currentStock: 100,
    minimumReorderLevel: 25,
    standardPurchaseRate: 150,
    storageLocation: 'Godown Bay A-1',
  });

  const handleCreate = () => {
    if (!form.name || !form.code) { showToast('Item name and SKU code required.'); return; }
    const cat = categories.find(c => c.id === form.categoryId);
    const unt = units.find(u => u.id === form.unitId);
    const newItem: StockItem = {
      id: `sitem-${Date.now()}`,
      code: form.code.toUpperCase(),
      name: form.name,
      categoryId: form.categoryId,
      categoryName: cat?.name || 'General',
      unitId: form.unitId,
      unitName: unt?.symbol || 'Kg',
      currentStock: Number(form.currentStock),
      minimumReorderLevel: Number(form.minimumReorderLevel),
      standardPurchaseRate: Number(form.standardPurchaseRate),
      storageLocation: form.storageLocation,
      expiryWarningDays: 90,
    };
    const updated = [newItem, ...items];
    setItems(updated);
    saveStoredStockItems(updated);
    showToast(`Stock Item ${newItem.name} registered.`);
    setShowModal(false);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border border-amber-300/40 rounded-xl p-4 shadow-xs flex justify-between items-center">
        <div>
          <h4 className="font-bold text-sm text-slate-900">Raw Kitchen Ingredients & Consumables Master</h4>
          <p className="text-xs text-slate-500">Add food commodities, packaging foil supplies and godown inventory items.</p>
        </div>
        {canAdd && (
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-lg text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Stock Item</span>
          </button>
        )}
      </div>

      <div className="bg-white border border-amber-300/40 rounded-xl shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px]">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Item Name</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3 text-right">Standard Rate</th>
              <th className="px-4 py-3 text-right">Current Stock</th>
              <th className="px-4 py-3">Storage Bay</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono">
            {items.map((i) => (
              <tr key={i.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-bold text-amber-700">{i.code}</td>
                <td className="px-4 py-3 font-sans font-bold text-slate-900">{i.name}</td>
                <td className="px-4 py-3 font-sans text-slate-600">{i.categoryName}</td>
                <td className="px-4 py-3 text-right text-slate-700">{fmtINR(i.standardPurchaseRate)}</td>
                <td className="px-4 py-3 text-right font-bold text-emerald-700">{i.currentStock} {i.unitName}</td>
                <td className="px-4 py-3 font-sans text-slate-500">{i.storageLocation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-base text-slate-900">Add Raw Stock Item</h3>
              <button type="button" onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">SKU Code *</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. RICE-KOL-25"
                  className="w-full border rounded px-3 py-2 font-mono font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Item Description / Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Kolam Rice Grade A"
                  className="w-full border rounded px-3 py-2 font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={form.categoryId}
                    onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                    className="w-full border rounded px-3 py-2 cursor-pointer"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unit</label>
                  <select
                    value={form.unitId}
                    onChange={(e) => setForm({ ...form, unitId: e.target.value })}
                    className="w-full border rounded px-3 py-2 cursor-pointer font-bold"
                  >
                    {units.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Opening Stock</label>
                  <input
                    type="number"
                    value={form.currentStock}
                    onChange={(e) => setForm({ ...form, currentStock: Number(e.target.value) })}
                    className="w-full border rounded px-3 py-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Reorder Level Alert</label>
                  <input
                    type="number"
                    value={form.minimumReorderLevel}
                    onChange={(e) => setForm({ ...form, minimumReorderLevel: Number(e.target.value) })}
                    className="w-full border rounded px-3 py-2 font-mono"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border rounded-lg text-xs font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreate}
                className="px-5 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-lg text-xs"
              >
                Save Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StockCategorySubpage: React.FC<{
  categories: StockCategory[];
  setCategories: React.Dispatch<React.SetStateAction<StockCategory[]>>;
  showToast: (m: string) => void;
  canAdd: boolean;
}> = ({ categories }) => {
  return (
    <div className="space-y-4">
      <div className="bg-white border border-amber-300/40 rounded-xl p-4 shadow-xs">
        <h4 className="font-bold text-sm text-slate-900">Inventory Classification Categories</h4>
        <p className="text-xs text-slate-500">Groupings for food commodities, packaging and kitchen supplies.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map((c) => (
          <div key={c.id} className="bg-white border border-amber-200/80 rounded-xl p-5 shadow-xs">
            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px] font-bold">{c.code}</span>
            <h4 className="font-bold text-sm text-slate-900 mt-1">{c.name}</h4>
            <p className="text-xs text-slate-500 mt-1">{c.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const VendorMasterSubpage: React.FC<{
  vendors: Vendor[];
  setVendors: React.Dispatch<React.SetStateAction<Vendor[]>>;
  showToast: (m: string) => void;
  canAdd: boolean;
}> = ({ vendors }) => {
  return (
    <div className="space-y-4">
      <div className="bg-white border border-amber-300/40 rounded-xl p-4 shadow-xs">
        <h4 className="font-bold text-sm text-slate-900">Approved Kitchen Suppliers & Vendors</h4>
        <p className="text-xs text-slate-500">Wholesale supplier contacts, GSTIN numbers, and credit terms.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {vendors.map((v) => (
          <div key={v.id} className="bg-white border border-amber-200/80 rounded-xl p-5 shadow-xs space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px] font-bold">{v.code}</span>
                <h4 className="font-bold text-sm text-slate-900 mt-1">{v.companyName}</h4>
                <p className="text-xs text-slate-600 font-medium">{v.contactPerson}</p>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">{v.status}</span>
            </div>
            <div className="text-xs text-slate-600 space-y-1">
              <p>Mobile: <span className="font-mono font-bold text-slate-800">{v.mobileNumber}</span></p>
              {v.gstin && <p>GSTIN: <span className="font-mono">{v.gstin}</span></p>}
              <p>Address: <span>{v.address}</span></p>
            </div>
            <div className="pt-2 border-t border-slate-100 flex justify-between text-[11px] text-slate-500 font-mono">
              <span>Credit: {v.paymentTermsDays} Days</span>
              <span>Rating: {'★'.repeat(v.rating)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const PurchaseEntrySubpage: React.FC<{
  purchases: PurchaseEntry[];
  setPurchases: React.Dispatch<React.SetStateAction<PurchaseEntry[]>>;
  items: StockItem[];
  setItems: React.Dispatch<React.SetStateAction<StockItem[]>>;
  vendors: Vendor[];
  currentUser: UserProfile;
  showToast: (m: string) => void;
  canAdd: boolean;
}> = ({ purchases, setPurchases, items, setItems, vendors, currentUser, showToast }) => {
  const [vendorId, setVendorId] = useState(vendors[0]?.id || '');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [selectedItemId, setSelectedItemId] = useState(items[0]?.id || '');
  const [quantity, setQuantity] = useState(50);
  const [unitRate, setUnitRate] = useState(100);

  const handleRecordPurchase = () => {
    if (!invoiceNo) { showToast('Invoice number is required.'); return; }
    const vendor = vendors.find(v => v.id === vendorId);
    const item = items.find(i => i.id === selectedItemId);
    if (!item) return;

    const total = quantity * unitRate;
    const grnNo = `GRN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newPurchase: PurchaseEntry = {
      id: `pur-${Date.now()}`,
      grnNumber: grnNo,
      invoiceNumber: invoiceNo,
      invoiceDate: new Date().toISOString().split('T')[0],
      vendorId,
      vendorName: vendor?.companyName || 'Supplier',
      receivedDate: new Date().toISOString().split('T')[0],
      items: [
        {
          stockItemId: item.id,
          stockItemName: item.name,
          unitName: item.unitName,
          quantity,
          unitPrice: unitRate,
          taxPct: 0,
          totalAmount: total,
        },
      ],
      subTotal: total,
      taxAmount: 0,
      grandTotal: total,
      paymentStatus: 'Credit',
      receivedBy: currentUser.username,
      notes: 'Inward GRN receipt recorded.',
    };

    // Update item stock
    const updatedItems = items.map(i => i.id === item.id ? { ...i, currentStock: i.currentStock + quantity } : i);
    setItems(updatedItems);
    saveStoredStockItems(updatedItems);

    const updatedPurchases = [newPurchase, ...purchases];
    setPurchases(updatedPurchases);
    saveStoredPurchaseEntries(updatedPurchases);

    appendActivityLog(currentUser.username, 'Stock Management', 'Purchase Entry', 'ADD', `Inward GRN #${grnNo}: ${quantity} ${item.unitName} ${item.name} from ${vendor?.companyName}.`);
    showToast(`Purchase GRN #${grnNo} recorded! Stock updated.`);
    setInvoiceNo('');
  };

  return (
    <div className="bg-white border border-amber-300/40 rounded-xl p-6 shadow-xs max-w-2xl mx-auto space-y-4">
      <h4 className="font-bold text-base text-slate-900 flex items-center gap-2">
        <ShoppingCart className="w-5 h-5 text-amber-600" />
        <span>Inward Goods Receipt Note (GRN) / Purchase Invoice</span>
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div>
          <label className="block font-bold text-slate-700 mb-1">Select Supplier / Vendor *</label>
          <select
            value={vendorId}
            onChange={(e) => setVendorId(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 cursor-pointer font-bold"
          >
            {vendors.map(v => (
              <option key={v.id} value={v.id}>{v.companyName}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-bold text-slate-700 mb-1">Vendor Bill / Invoice Number *</label>
          <input
            type="text"
            value={invoiceNo}
            onChange={(e) => setInvoiceNo(e.target.value)}
            placeholder="e.g. INV-2025-881"
            className="w-full border rounded-lg px-3 py-2 font-mono"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block font-bold text-slate-700 mb-1">Select Raw Item Received *</label>
          <select
            value={selectedItemId}
            onChange={(e) => {
              setSelectedItemId(e.target.value);
              const found = items.find(i => i.id === e.target.value);
              if (found) setUnitRate(found.standardPurchaseRate);
            }}
            className="w-full border rounded-lg px-3 py-2 cursor-pointer font-bold"
          >
            {items.map(i => (
              <option key={i.id} value={i.id}>{i.name} (Cur Stock: {i.currentStock} {i.unitName})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-bold text-slate-700 mb-1">Quantity Received *</label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="w-full border rounded-lg px-3 py-2 font-mono font-bold"
          />
        </div>
        <div>
          <label className="block font-bold text-slate-700 mb-1">Unit Rate (₹) *</label>
          <input
            type="number"
            value={unitRate}
            onChange={(e) => setUnitRate(Number(e.target.value))}
            className="w-full border rounded-lg px-3 py-2 font-mono font-bold"
          />
        </div>
        <div className="sm:col-span-2 p-3 bg-amber-50 rounded-lg flex justify-between font-bold text-amber-950">
          <span>Total Inward Bill Amount:</span>
          <span>{fmtINR(quantity * unitRate)}</span>
        </div>
      </div>
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleRecordPurchase}
          className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg text-xs shadow-md cursor-pointer"
        >
          Confirm Inward & Update Warehouse Stock
        </button>
      </div>
    </div>
  );
};

const StockInRegisterSubpage: React.FC<{ purchases: PurchaseEntry[] }> = ({ purchases }) => {
  return (
    <div className="space-y-4">
      <div className="bg-white border border-amber-300/40 rounded-xl p-4 shadow-xs">
        <h4 className="font-bold text-sm text-slate-900">Goods Receipt Register (Stock Inward Audit)</h4>
        <p className="text-xs text-slate-500">Historical journal of all purchase receipts received in kitchen godowns.</p>
      </div>
      <div className="bg-white border border-amber-300/40 rounded-xl shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px]">
            <tr>
              <th className="px-4 py-3 font-sans">GRN #</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3 font-sans">Vendor Name</th>
              <th className="px-4 py-3 font-sans">Items Received</th>
              <th className="px-4 py-3 text-right">Invoice Value</th>
              <th className="px-4 py-3 text-center font-sans">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {purchases.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-bold text-amber-700">{p.grnNumber}</td>
                <td className="px-4 py-3 text-slate-500">{p.receivedDate}</td>
                <td className="px-4 py-3 font-sans font-bold text-slate-900">{p.vendorName}</td>
                <td className="px-4 py-3 font-sans text-slate-700">
                  {p.items.map(it => `${it.quantity} ${it.unitName} ${it.stockItemName}`).join(', ')}
                </td>
                <td className="px-4 py-3 text-right font-bold text-slate-900">{fmtINR(p.grandTotal)}</td>
                <td className="px-4 py-3 text-center font-sans">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    p.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {p.paymentStatus}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const StockUnitSubpage: React.FC<{ units: MeasurementUnit[] }> = ({ units }) => {
  return (
    <div className="space-y-4">
      <div className="bg-white border border-amber-300/40 rounded-xl p-4 shadow-xs">
        <h4 className="font-bold text-sm text-slate-900">Godown Measurement & Packaging Units</h4>
        <p className="text-xs text-slate-500">Weight, volume, and bulk packaging units configured for inventory management.</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {units.map((u) => (
          <div key={u.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs text-center space-y-1">
            <span className="text-2xl font-black text-amber-700">{u.symbol}</span>
            <p className="font-bold text-xs text-slate-900">{u.name}</p>
            <p className="text-[10px] text-slate-400 uppercase font-mono">{u.type}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
