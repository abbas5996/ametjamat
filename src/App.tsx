import React, { useState, useMemo, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { MainContent } from './components/MainContent';
import { LoginPage } from './components/LoginPage';
import { NAVIGATION_CATEGORIES } from './data/navigation';
import { FinancialYear, UserProfile, UserPermissionsMap } from './types';
import { filterNavigationForUser } from './utils/rbac';
import { CheckCircle2, X } from 'lucide-react';

// Wipe any stale session keys so every app start is a clean slate
localStorage.removeItem('jamat_auth_session');
localStorage.removeItem('jamat_user');

/** Blank user profile used before (and after) authentication. */
const BLANK_USER: UserProfile = {
  username: '',
  displayName: '',
  role: '',
  itsNumber: '',
  permissions: null,
};

export const App: React.FC = () => {
  // Always start unauthenticated — LoginPage is the mandatory entry point
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<UserProfile>(BLANK_USER);

  // Shell Layout State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  // Mobile: drawer open/closed (independent from desktop collapsed state)
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<FinancialYear>('1447-1448 Hijri');

  // Dynamic Navigation Filtering based on logged-in user RBAC
  const permittedCategories = useMemo(() => {
    return filterNavigationForUser(NAVIGATION_CATEGORIES, currentUser);
  }, [currentUser]);

  // Navigation Selection State
  const [activeCategoryId, setActiveCategoryId] = useState('dashboard');
  const [activeSubItemId, setActiveSubItemId] = useState('overview');

  // Guard routing when active selection is not permitted for this user
  useEffect(() => {
    const isCatPermitted = permittedCategories.some((c) => c.id === activeCategoryId);
    if (!isCatPermitted && permittedCategories.length > 0) {
      const fallbackCat = permittedCategories[0];
      setActiveCategoryId(fallbackCat.id);
      setActiveSubItemId(fallbackCat.items[0]?.id || 'overview');
    } else {
      const currentCat = permittedCategories.find((c) => c.id === activeCategoryId);
      if (currentCat && !currentCat.items.some((i) => i.id === activeSubItemId)) {
        setActiveSubItemId(currentCat.items[0]?.id || 'overview');
      }
    }
  }, [permittedCategories, activeCategoryId, activeSubItemId]);

  // Expanded Categories State (Default all expanded)
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    dashboard: true,
    mumineen: true,
    'member-master': true,
    'mohalla-management': true,
    'fmb-takhmeen': true,
    'sabeel-management': true,
    'faiz-hub': true,
    'thaali-management': true,
    'menu-management': true,
    'stock-management': true,
    'voluntary-contribution': true,
    'community-schemes': true,
    wajebaat: true,
    'rent-management': true,
    'qardan-hasanah': true,
    'accounts-manager': true,
    'madresa-module': true,
    'miqaat-ashara': true,
    'committee-trust': true,
    'umur-framework': true,
    'safar-mubarak': true,
    'haj-mazar': true,
    'appointment-messaging': true,
    services: true,
    'payments-receipts': true,
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

  const handleLoginSuccess = (loginData: {
    username: string;
    role: string;
    displayName: string;
    permissions?: UserPermissionsMap | 'all' | null;
  }) => {
    const profile: UserProfile = {
      username: loginData.username,
      displayName: loginData.displayName,
      role: loginData.role,
      itsNumber: '30491024',
      permissions: loginData.permissions ?? (loginData.username === 'janabadmin' ? 'all' : null),
    };
    setCurrentUser(profile);
    setIsAuthenticated(true);
    localStorage.setItem('jamat_auth_session', 'true');
    localStorage.setItem('jamat_user', JSON.stringify(profile));
    showToast(`Welcome back, ${loginData.displayName}!`);
  };

  const handleLogout = () => {
    localStorage.removeItem('jamat_auth_session');
    localStorage.removeItem('jamat_user');
    setCurrentUser(BLANK_USER);
    setIsAuthenticated(false);
    showToast('Logged out of Jamaat ERP Portal.');
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

  const handleNavigateHome = () => {
    setActiveCategoryId('dashboard');
    setActiveSubItemId('overview');
  };

  // Find active titles for breadcrumbs and headers
  const currentCategory =
    permittedCategories.find((cat) => cat.id === activeCategoryId) ||
    permittedCategories[0] ||
    NAVIGATION_CATEGORIES[0];

  const currentSubItem =
    currentCategory.items.find((item) => item.id === activeSubItemId) ||
    currentCategory.items[0] || { id: 'overview', label: 'Main Overview' };

  // Dynamic Auth State Routing
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col antialiased">
        <LoginPage onLoginSuccess={handleLoginSuccess} />
        {toastMessage && (
          <div className="fixed bottom-5 right-5 z-50 flex items-center space-x-3 px-4 py-3 bg-[#0F172A] text-white rounded-xl shadow-2xl border border-[#D4AF37]/40 text-xs animate-in slide-in-from-bottom-3 duration-200 max-w-[calc(100vw-2.5rem)]">
            <div className="w-5 h-5 rounded-full bg-[#EAB308] text-[#0F172A] flex items-center justify-center font-black shadow-xs shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold truncate">{toastMessage}</span>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-white ml-2 shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FEF3C7] text-[#0F172A] flex flex-col antialiased selection:bg-[#FDE68A] selection:text-[#92400E] overflow-x-hidden">

      {/* ── DESKTOP SIDEBAR (lg+): fixed, always visible, collapsible ── */}
      <div className="hidden lg:block">
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          isMobileDrawer={false}
          isOpen={true}
          categories={permittedCategories}
          activeCategoryId={activeCategoryId}
          activeSubItemId={activeSubItemId}
          expandedCategories={expandedCategories}
          onToggleCategory={handleToggleCategory}
          onSelectSubItem={handleSelectSubItem}
          user={currentUser}
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
          categories={permittedCategories}
          activeCategoryId={activeCategoryId}
          activeSubItemId={activeSubItemId}
          expandedCategories={expandedCategories}
          onToggleCategory={handleToggleCategory}
          onSelectSubItem={handleSelectSubItem}
          user={currentUser}
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
          user={currentUser}
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
          currentUser={currentUser}
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
