import React, { useState, useMemo } from 'react';
import {
  Utensils, Layers, Scale, Calendar, FileSpreadsheet, Plus,
  Search, Filter, CheckCircle2, DollarSign, Clock, ChefHat,
  Tag, BarChart3, TrendingUp, AlertCircle, X
} from 'lucide-react';
import { UserProfile, FinancialYear } from '../../types';
import {
  MenuCategory, MenuItem, MeasurementUnit, MenuMasterTemplate, DailyMenuEntry,
  getStoredMenuCategories, saveStoredMenuCategories,
  getStoredMenuItems, saveStoredMenuItems,
  getStoredUnits, saveStoredUnits,
  getStoredMenuTemplates, saveStoredMenuTemplates,
  getStoredDailyMenus, saveStoredDailyMenus
} from '../../utils/menuStockManagement';
import { appendActivityLog } from '../../utils/rbac';

export type MenuSubTab =
  | 'menu-category-master'
  | 'menu-items-master'
  | 'menu-unit-master'
  | 'menu-master'
  | 'daily-menu-entry'
  | 'item-wise-usage-report'
  | 'daily-thaali-costing-report';

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

export const MenuManagementModule: React.FC<Props> = ({
  currentUser,
  activeSubItemId,
  showToast,
  canAdd,
  canDelete,
}) => {
  const [categories, setCategories] = useState<MenuCategory[]>(() => getStoredMenuCategories());
  const [items, setItems] = useState<MenuItem[]>(() => getStoredMenuItems());
  const [units, setUnits] = useState<MeasurementUnit[]>(() => getStoredUnits());
  const [templates, setTemplates] = useState<MenuMasterTemplate[]>(() => getStoredMenuTemplates());
  const [dailyMenus, setDailyMenus] = useState<DailyMenuEntry[]>(() => getStoredDailyMenus());

  const [activeTab, setActiveTab] = useState<MenuSubTab>(() => {
    return (activeSubItemId as MenuSubTab) || 'daily-menu-entry';
  });

  React.useEffect(() => {
    if (activeSubItemId) setActiveTab(activeSubItemId as MenuSubTab);
  }, [activeSubItemId]);

  const tabs: { key: MenuSubTab; label: string; icon: React.ReactNode; count?: number; badge?: string }[] = [
    { key: 'daily-menu-entry',            label: '1. Daily Menu Entry',        icon: <Calendar className="w-3.5 h-3.5" />, badge: 'Today' },
    { key: 'menu-master',                 label: '2. Menu Master (Rotation)',  icon: <ChefHat className="w-3.5 h-3.5" />, count: templates.length },
    { key: 'menu-items-master',           label: '3. Dishes / Items Master',   icon: <Utensils className="w-3.5 h-3.5" />, count: items.length },
    { key: 'menu-category-master',        label: '4. Menu Categories',         icon: <Layers className="w-3.5 h-3.5" />, count: categories.length },
    { key: 'menu-unit-master',            label: '5. Unit Master',             icon: <Scale className="w-3.5 h-3.5" />, count: units.length },
    { key: 'daily-thaali-costing-report', label: '6. Thaali Costing Report',   icon: <DollarSign className="w-3.5 h-3.5" />, badge: 'Cost' },
    { key: 'item-wise-usage-report',      label: '7. Item Usage Report',       icon: <BarChart3 className="w-3.5 h-3.5" /> },
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
              <span className="ml-1 px-1.5 py-0.2 rounded-md text-[9px] bg-slate-900 text-amber-300 font-extrabold uppercase">
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 1. DAILY MENU ENTRY */}
      {activeTab === 'daily-menu-entry' && (
        <DailyMenuSubpage
          dailyMenus={dailyMenus}
          setDailyMenus={setDailyMenus}
          templates={templates}
          currentUser={currentUser}
          showToast={showToast}
          canAdd={canAdd}
        />
      )}

      {/* 2. MENU MASTER (ROTATION) */}
      {activeTab === 'menu-master' && (
        <MenuMasterSubpage templates={templates} setTemplates={setTemplates} showToast={showToast} canAdd={canAdd} />
      )}

      {/* 3. ITEMS MASTER */}
      {activeTab === 'menu-items-master' && (
        <MenuItemsSubpage items={items} setItems={setItems} categories={categories} units={units} showToast={showToast} canAdd={canAdd} />
      )}

      {/* 4. MENU CATEGORY MASTER */}
      {activeTab === 'menu-category-master' && (
        <MenuCategoriesSubpage categories={categories} setCategories={setCategories} showToast={showToast} canAdd={canAdd} />
      )}

      {/* 5. UNIT MASTER */}
      {activeTab === 'menu-unit-master' && (
        <UnitMasterSubpage units={units} setUnits={setUnits} showToast={showToast} canAdd={canAdd} />
      )}

      {/* 6. THAALI COSTING REPORT */}
      {activeTab === 'daily-thaali-costing-report' && (
        <ThaaliCostingReportSubpage dailyMenus={dailyMenus} />
      )}

      {/* 7. ITEM USAGE REPORT */}
      {activeTab === 'item-wise-usage-report' && (
        <ItemUsageReportSubpage dailyMenus={dailyMenus} />
      )}
    </div>
  );
};

// ============================================================================
// SUBPAGE IMPLEMENTATIONS: MENU MANAGEMENT
// ============================================================================

const DailyMenuSubpage: React.FC<{
  dailyMenus: DailyMenuEntry[];
  setDailyMenus: React.Dispatch<React.SetStateAction<DailyMenuEntry[]>>;
  templates: MenuMasterTemplate[];
  currentUser: UserProfile;
  showToast: (m: string) => void;
  canAdd: boolean;
}> = ({ dailyMenus, setDailyMenus, templates, currentUser, showToast, canAdd }) => {
  const [showModal, setShowModal] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [mealType, setMealType] = useState<'Lunch' | 'Dinner'>('Lunch');
  const [selectedTemplateId, setSelectedTemplateId] = useState(templates[0]?.id || '');
  const [isSpecial, setIsSpecial] = useState(false);
  const [miqaatNote, setMiqaatNote] = useState('');

  const handleCreate = () => {
    const tpl = templates.find(t => t.id === selectedTemplateId);
    const newEntry: DailyMenuEntry = {
      id: `dm-${Date.now()}`,
      date,
      hijriDate: '1447-02-15',
      mealType,
      menuTemplateId: tpl?.id,
      menuTitle: tpl?.title || 'Custom Daily Menu',
      dishes: [
        { category: 'Rice', dishName: tpl?.riceDish || 'Basmati Rice', quantityKg: 80 },
        { category: 'Meat', dishName: tpl?.meatCurryDish || 'Mutton Gravy', quantityKg: 50 },
        { category: 'Sweet', dishName: tpl?.sweetDish || 'Halwa', quantityKg: 35 },
      ],
      isSpecialMiqaat: isSpecial,
      miqaatNote,
      targetThaalis: 220,
      actualThaalisDispatched: 220,
      totalCostCalculated: 220 * (tpl?.estimatedCostPerThaali || 180),
      costPerThaali: tpl?.estimatedCostPerThaali || 180,
    };

    const updated = [newEntry, ...dailyMenus];
    setDailyMenus(updated);
    saveStoredDailyMenus(updated);
    appendActivityLog(currentUser.username, 'Menu Management', 'Daily Menu Entry', 'ADD', `Scheduled ${mealType} menu for ${date}: ${newEntry.menuTitle}.`);
    showToast(`Menu scheduled for ${date}!`);
    setShowModal(false);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border border-amber-300/40 rounded-xl p-4 shadow-xs flex justify-between items-center">
        <div>
          <h4 className="font-bold text-sm text-slate-900">Scheduled Daily Menus & Kitchen Plans</h4>
          <p className="text-xs text-slate-500">Assign rotation recipes and special miqaat menus to upcoming calendar dates.</p>
        </div>
        {canAdd && (
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-lg text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Daily Menu</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {dailyMenus.map((dm) => (
          <div key={dm.id} className="bg-white border border-amber-200/80 rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <span className="font-mono text-xs font-black text-amber-700">{dm.date}</span>
                <span className="ml-2 px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px] uppercase">
                  {dm.mealType}
                </span>
                <h4 className="font-bold text-sm text-slate-900 mt-1">{dm.menuTitle}</h4>
              </div>
              <span className="text-sm font-black text-emerald-700">{fmtINR(dm.costPerThaali)}/pack</span>
            </div>

            <div className="p-3 bg-amber-50/60 rounded-lg space-y-1 text-xs">
              {dm.dishes.map((d, i) => (
                <div key={i} className="flex justify-between text-slate-700 font-medium">
                  <span>&bull; {d.dishName}</span>
                  <span className="font-mono text-[11px] text-slate-500">{d.quantityKg} Kg prepped</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-mono">
              <span>Dispatched: <b>{dm.actualThaalisDispatched} Thaalis</b></span>
              <span>Total Cost: <b>{fmtINR(dm.totalCostCalculated)}</b></span>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-base text-slate-900">Schedule Menu For Date</h3>
              <button type="button" onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Calendar Date *</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full border rounded px-3 py-2 font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Meal Shift</label>
                <select
                  value={mealType}
                  onChange={(e) => setMealType(e.target.value as any)}
                  className="w-full border rounded px-3 py-2 cursor-pointer font-bold"
                >
                  <option value="Lunch">Lunch Thaali</option>
                  <option value="Dinner">Dinner Thaali</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Master Recipe Template *</label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="w-full border rounded px-3 py-2 cursor-pointer font-bold"
                >
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.title} ({fmtINR(t.estimatedCostPerThaali)}/pack)</option>
                  ))}
                </select>
              </div>
              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSpecial}
                    onChange={(e) => setIsSpecial(e.target.checked)}
                    className="w-4 h-4 accent-amber-500"
                  />
                  <span className="font-bold text-slate-800">Special Miqaat / Khushi Jaman</span>
                </label>
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
                Schedule Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MenuMasterSubpage: React.FC<{
  templates: MenuMasterTemplate[];
  setTemplates: React.Dispatch<React.SetStateAction<MenuMasterTemplate[]>>;
  showToast: (m: string) => void;
  canAdd: boolean;
}> = ({ templates }) => {
  return (
    <div className="space-y-4">
      <div className="bg-white border border-amber-300/40 rounded-xl p-4 shadow-xs">
        <h4 className="font-bold text-sm text-slate-900">Standard Weekly Menu Rotation Templates</h4>
        <p className="text-xs text-slate-500">Pre-configured 7-day culinary combinations with estimated cost breakdown.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((t) => (
          <div key={t.id} className="bg-white border border-amber-200/80 rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px] font-bold">{t.dayOfWeek}</span>
                <h4 className="font-bold text-sm text-slate-900 mt-1">{t.title}</h4>
              </div>
              <span className="text-sm font-black text-amber-700">{fmtINR(t.estimatedCostPerThaali)}</span>
            </div>
            <div className="text-xs text-slate-600 space-y-1 pt-1">
              <p>&bull; <b>Rice:</b> {t.riceDish}</p>
              <p>&bull; <b>Curry/Meat:</b> {t.meatCurryDish}</p>
              <p>&bull; <b>Bread:</b> {t.breadDish}</p>
              <p>&bull; <b>Sweet:</b> {t.sweetDish}</p>
              <p>&bull; <b>Salad:</b> {t.saladAccompaniment}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const MenuItemsSubpage: React.FC<{
  items: MenuItem[];
  setItems: React.Dispatch<React.SetStateAction<MenuItem[]>>;
  categories: MenuCategory[];
  units: MeasurementUnit[];
  showToast: (m: string) => void;
  canAdd: boolean;
}> = ({ items }) => {
  return (
    <div className="space-y-4">
      <div className="bg-white border border-amber-300/40 rounded-xl p-4 shadow-xs">
        <h4 className="font-bold text-sm text-slate-900">Prepared Dishes Master & Recipes</h4>
        <p className="text-xs text-slate-500">Master repository of prepared culinary items with portion weights and estimated cost.</p>
      </div>
      <div className="bg-white border border-amber-300/40 rounded-xl shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px]">
            <tr>
              <th className="px-4 py-3">Code & Dish Name</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Portion (Grams)</th>
              <th className="px-4 py-3">Prep Time</th>
              <th className="px-4 py-3 text-right">Standard Serving Cost</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((m) => (
              <tr key={m.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <span className="font-mono text-amber-700 font-bold mr-2 text-[10px]">{m.code}</span>
                  <span className="font-bold text-slate-900">{m.name}</span>
                </td>
                <td className="px-4 py-3 text-slate-600">{m.categoryName}</td>
                <td className="px-4 py-3 font-mono text-slate-800">{m.averagePortionGrams}g</td>
                <td className="px-4 py-3 text-slate-500">{m.approxPrepTimeMins} mins</td>
                <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">{fmtINR(m.standardCostPerServing)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const MenuCategoriesSubpage: React.FC<{
  categories: MenuCategory[];
  setCategories: React.Dispatch<React.SetStateAction<MenuCategory[]>>;
  showToast: (m: string) => void;
  canAdd: boolean;
}> = ({ categories }) => {
  return (
    <div className="space-y-4">
      <div className="bg-white border border-amber-300/40 rounded-xl p-4 shadow-xs">
        <h4 className="font-bold text-sm text-slate-900">Menu Dish Classifications</h4>
        <p className="text-xs text-slate-500">Categories used to arrange kitchen recipes (Rice, Salan, Roti, Mithai).</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map((c) => (
          <div key={c.id} className="bg-white border border-amber-200/80 rounded-xl p-4 shadow-xs">
            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px] font-bold">{c.code}</span>
            <h4 className="font-bold text-sm text-slate-900 mt-1">{c.name}</h4>
            <p className="text-xs text-slate-500 mt-1">{c.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const UnitMasterSubpage: React.FC<{
  units: MeasurementUnit[];
  setUnits: React.Dispatch<React.SetStateAction<MeasurementUnit[]>>;
  showToast: (m: string) => void;
  canAdd: boolean;
}> = ({ units }) => {
  return (
    <div className="space-y-4">
      <div className="bg-white border border-amber-300/40 rounded-xl p-4 shadow-xs">
        <h4 className="font-bold text-sm text-slate-900">Standard Measurement Units</h4>
        <p className="text-xs text-slate-500">Weight, volume and packaging metrics used across Menu and Stock registers.</p>
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

const ThaaliCostingReportSubpage: React.FC<{ dailyMenus: DailyMenuEntry[] }> = ({ dailyMenus }) => {
  return (
    <div className="space-y-4">
      <div className="bg-white border border-amber-300/40 rounded-xl p-4 shadow-xs">
        <h4 className="font-bold text-sm text-slate-900">Daily Thaali Costing & Variance Analysis</h4>
        <p className="text-xs text-slate-500">Live per-thaali expenditure report based on ingredient usage and packs dispatched.</p>
      </div>
      <div className="bg-white border border-amber-300/40 rounded-xl shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px]">
            <tr>
              <th className="px-4 py-3 font-sans">Date & Menu</th>
              <th className="px-4 py-3 text-center font-sans">Shift</th>
              <th className="px-4 py-3 text-right">Dispatched</th>
              <th className="px-4 py-3 text-right">Total Food Cost</th>
              <th className="px-4 py-3 text-right">Net Cost / Thaali</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {dailyMenus.map((dm) => (
              <tr key={dm.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-sans">
                  <span className="font-mono text-amber-700 font-bold mr-2">{dm.date}</span>
                  <span className="font-bold text-slate-900">{dm.menuTitle}</span>
                </td>
                <td className="px-4 py-3 text-center font-sans font-bold text-slate-700">{dm.mealType}</td>
                <td className="px-4 py-3 text-right font-bold text-slate-800">{dm.actualThaalisDispatched}</td>
                <td className="px-4 py-3 text-right text-slate-900 font-bold">{fmtINR(dm.totalCostCalculated)}</td>
                <td className="px-4 py-3 text-right font-black text-emerald-700 text-sm">{fmtINR(dm.costPerThaali)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ItemUsageReportSubpage: React.FC<{ dailyMenus: DailyMenuEntry[] }> = ({ dailyMenus }) => {
  return (
    <div className="space-y-4">
      <div className="bg-white border border-amber-300/40 rounded-xl p-4 shadow-xs">
        <h4 className="font-bold text-sm text-slate-900">Culinary Dish Preparation & Consumption History</h4>
        <p className="text-xs text-slate-500">Aggregated quantities of cooked items across recent kitchen production runs.</p>
      </div>
      <div className="bg-white border border-amber-300/40 rounded-xl shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px]">
            <tr>
              <th className="px-4 py-3 font-sans">Date</th>
              <th className="px-4 py-3 font-sans">Prepared Dish</th>
              <th className="px-4 py-3 font-sans">Category</th>
              <th className="px-4 py-3 text-right">Cooked Quantity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {dailyMenus.flatMap(dm => dm.dishes.map((dish, i) => (
              <tr key={`${dm.id}-${i}`} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-500">{dm.date}</td>
                <td className="px-4 py-3 font-sans font-bold text-slate-900">{dish.dishName}</td>
                <td className="px-4 py-3 font-sans text-slate-600">{dish.category}</td>
                <td className="px-4 py-3 text-right font-bold text-amber-700">{dish.quantityKg} Kg</td>
              </tr>
            )))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
