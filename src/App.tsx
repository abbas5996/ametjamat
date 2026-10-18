import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { MainContent } from './components/MainContent';
import { NAVIGATION_CATEGORIES } from './data/navigation';
import { FinancialYear, UserProfile } from './types';
import { CheckCircle2, X } from 'lucide-react';

export const App: React.FC = () => {
  // Shell Layout State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  // Mobile: drawer open/closed (independent from desktop collapsed state)
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<FinancialYear>('1447-1448 Hijri');

  // Navigation Selection State
  const [activeCategoryId, setActiveCategoryId] = useState('dashboard');
  const [activeSubItemId, setActiveSubItemId] = useState('overview');

  // Expanded Categories State (Default all expanded)
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    dashboard: true,
    'member-master': true,
    'financial-takhmeen': true,
    'faiz-services': true,
    'reports-ledgers': true,
    'system-settings': true,
  });

  // Toast Notification for Interactive Feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage((prev) => (prev === message ? null : prev));
    }, 3500);
  };

  // Mock User Profile conforming strictly to requirements: "Username: mtv", Role: "Super Admin"
  const user: UserProfile = {
    username: 'mtv',
    displayName: 'Mulla Taher Vajihi',
    role: 'Super Admin',
    itsNumber: '30491024',
  };

  const handleToggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const handleSelectSubItem = (categoryId: string, subItemId: string) => {
    setActiveCategoryId(categoryId);
    setActiveSubItemId(subItemId);
    // Close mobile drawer on nav selection
    setIsMobileDrawerOpen(false);
  };

  const handleYearChange = (year: FinancialYear) => {
    setSelectedYear(year);
    showToast(`Active Financial Year switched to ${year}`);
  };

  const handleLogout = () => {
    showToast('Logout triggered for Super Admin session.');
  };

  const handleNavigateHome = () => {
    setActiveCategoryId('dashboard');
    setActiveSubItemId('overview');
  };

  // Find active titles for breadcrumbs and headers
  const currentCategory =
    NAVIGATION_CATEGORIES.find((cat) => cat.id === activeCategoryId) ||
    NAVIGATION_CATEGORIES[0];

  const currentSubItem =
    currentCategory.items.find((item) => item.id === activeSubItemId) ||
    currentCategory.items[0];

  return (
    <div className="min-h-screen bg-[#FEF3C7] text-[#0F172A] flex flex-col antialiased selection:bg-[#FDE68A] selection:text-[#92400E] overflow-x-hidden">

      {/* ── DESKTOP SIDEBAR (lg+): fixed, always visible, collapsible ── */}
      <div className="hidden lg:block">
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          isMobileDrawer={false}
          isOpen={true}
          categories={NAVIGATION_CATEGORIES}
          activeCategoryId={activeCategoryId}
          activeSubItemId={activeSubItemId}
          expandedCategories={expandedCategories}
          onToggleCategory={handleToggleCategory}
          onSelectSubItem={handleSelectSubItem}
          user={user}
          onLogout={handleLogout}
          onClose={() => {}}
        />
      </div>

      {/* ── MOBILE DRAWER SIDEBAR (< lg): slide-over with backdrop ── */}
      <div className="lg:hidden">
        {/* Backdrop overlay */}
        {isMobileDrawerOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMobileDrawerOpen(false)}
            aria-hidden="true"
          />
        )}
        <Sidebar
          isCollapsed={false}
          isMobileDrawer={true}
          isOpen={isMobileDrawerOpen}
          categories={NAVIGATION_CATEGORIES}
          activeCategoryId={activeCategoryId}
          activeSubItemId={activeSubItemId}
          expandedCategories={expandedCategories}
          onToggleCategory={handleToggleCategory}
          onSelectSubItem={handleSelectSubItem}
          user={user}
          onLogout={handleLogout}
          onClose={() => setIsMobileDrawerOpen(false)}
        />
      </div>

      {/* Main App Container — shifted right by sidebar width on desktop */}
      <div
        className={`flex-1 flex flex-col min-w-0 bg-[#FEF3C7] transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'lg:pl-[74px]' : 'lg:pl-[260px]'
        }`}
      >
        {/* Top Navbar */}
        <Navbar
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          onToggleMobileDrawer={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
          selectedYear={selectedYear}
          onYearChange={handleYearChange}
          user={user}
          onLogout={handleLogout}
          onOpenSettings={() => {
            setActiveCategoryId('system-settings');
            setActiveSubItemId('roles-permissions');
          }}
        />

        {/* Dynamic Main Content */}
        <MainContent
          activeCategoryId={activeCategoryId}
          categoryTitle={currentCategory.title}
          activeSubItemId={activeSubItemId}
          subItemLabel={currentSubItem.label}
          financialYear={selectedYear}
          onNavigateHome={handleNavigateHome}
          onQuickAction={(actionName) => showToast(`Action executed: ${actionName}`)}
        />
      </div>

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center space-x-3 px-4 py-3 bg-[#0F172A] text-white rounded-xl shadow-2xl border border-[#D4AF37]/40 text-xs animate-in slide-in-from-bottom-3 duration-200 max-w-[calc(100vw-2.5rem)]">
          <div className="w-5 h-5 rounded-full bg-[#EAB308] text-[#0F172A] flex items-center justify-center font-black shadow-xs shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold truncate">{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white ml-2 shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
