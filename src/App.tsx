import React, { useState, useMemo, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { MainContent } from './components/MainContent';
import { LoginPage } from './components/LoginPage';
import { NAVIGATION_CATEGORIES } from './data/navigation';
import { FinancialYear, UserProfile } from './types';
import { filterNavigationForUser } from './utils/rbac';
import {
  clearJanabSession,
  isJanabUser,
  persistJanabSession,
  restoreJanabSession,
} from './utils/auth';
import { CheckCircle2, X } from 'lucide-react';

/** Blank user profile used before (and after) authentication. */
const BLANK_USER: UserProfile = {
  username: '',
  displayName: '',
  role: '',
  itsNumber: '',
  permissions: null,
};

export const App: React.FC = () => {
  // Restore strictly verified Janab session from localStorage if present
  const initialSession = useMemo(() => restoreJanabSession(), []);

  const [currentUser, setCurrentUser] = useState<UserProfile>(
    () => initialSession || BLANK_USER
  );
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    () => !!initialSession && isJanabUser(initialSession)
  );

  // Shell Layout State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<FinancialYear>('1447-1448 Hijri');

  // Navigation Filtering based on authenticated user
  const permittedCategories = useMemo(() => {
    return filterNavigationForUser(NAVIGATION_CATEGORIES, currentUser);
  }, [currentUser]);

  // Navigation Selection State
  const [activeCategoryId, setActiveCategoryId] = useState('dashboard');
  const [activeSubItemId, setActiveSubItemId] = useState('overview');

  // Guard routing when active selection does not exist in categories
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

  // Expanded Categories State (Default Dashboard expanded for immediate discoverability)
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    dashboard: true,
  });

  // Toast Notification for Interactive Feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage((prev) => (prev === message ? null : prev));
    }, 3500);
  };

  const handleLoginSuccess = (profile: UserProfile) => {
    if (!isJanabUser(profile)) {
      showToast('Access restricted exclusively to Janab.');
      return;
    }
    setCurrentUser(profile);
    setIsAuthenticated(true);
    persistJanabSession(profile);
    setActiveCategoryId('dashboard');
    setActiveSubItemId('overview');
    setExpandedCategories((prev) => ({ ...prev, dashboard: true }));
    showToast(`Welcome back, ${profile.displayName}!`);
  };

  const handleLogout = () => {
    clearJanabSession();
    setCurrentUser(BLANK_USER);
    setIsAuthenticated(false);
    setIsMobileDrawerOpen(false);
    setActiveCategoryId('dashboard');
    setActiveSubItemId('overview');
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
    setExpandedCategories((prev) => ({ ...prev, [categoryId]: true }));
    setIsMobileDrawerOpen(false);
  };

  const handleYearChange = (year: FinancialYear) => {
    setSelectedYear(year);
    showToast(`Active Financial Year switched to ${year}`);
  };

  const handleNavigateHome = () => {
    setActiveCategoryId('dashboard');
    setActiveSubItemId('overview');
    setExpandedCategories((prev) => ({ ...prev, dashboard: true }));
  };

  // Find active titles for breadcrumbs and headers
  const currentCategory =
    permittedCategories.find((cat) => cat.id === activeCategoryId) ||
    permittedCategories[0] ||
    NAVIGATION_CATEGORIES[0];

  const currentSubItem =
    currentCategory.items.find((item) => item.id === activeSubItemId) ||
    currentCategory.items[0] || { id: 'overview', label: 'Main Overview' };

  // Dynamic Auth State Routing — Unauthenticated visitors see Janab Login ONLY
  if (!isAuthenticated || !isJanabUser(currentUser)) {
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
              aria-label="Close notification"
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
      {/* Desktop Sidebar (lg+) */}
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

      {/* Mobile Drawer Sidebar (< lg) */}
      <div className="lg:hidden">
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

      {/* Main App Container */}
      <div
        className={`flex-1 flex flex-col min-w-0 bg-[#FEF3C7] transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'lg:pl-[74px]' : 'lg:pl-[260px]'
        }`}
      >
        <Navbar
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          onToggleMobileDrawer={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
          selectedYear={selectedYear}
          onYearChange={handleYearChange}
          user={currentUser}
          onLogout={handleLogout}
          onOpenPasswordReset={() => handleSelectSubItem('system-settings', 'change-password')}
          onOpenSettings={() => handleSelectSubItem('system-settings', 'roles-permissions')}
        />

        <MainContent
          activeCategoryId={activeCategoryId}
          categoryTitle={currentCategory.title}
          activeSubItemId={activeSubItemId}
          subItemLabel={currentSubItem.label}
          financialYear={selectedYear}
          currentUser={currentUser}
          onNavigateHome={handleNavigateHome}
          onNavigateToModule={handleSelectSubItem}
          onQuickAction={(actionName) => showToast(actionName)}
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
            className="text-slate-400 hover:text-white ml-2 shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            aria-label="Close notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
