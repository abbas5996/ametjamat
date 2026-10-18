import React from 'react';
import {
  ChevronDown,
  ChevronRight,
  LogOut,
  X
} from 'lucide-react';
import { NavCategory, UserProfile } from '../types';
import { NavIcon } from './NavIcon';

interface SidebarProps {
  isCollapsed: boolean;
  isMobileDrawer: boolean;
  isOpen: boolean;
  categories: NavCategory[];
  activeCategoryId: string;
  activeSubItemId: string;
  expandedCategories: Record<string, boolean>;
  onToggleCategory: (categoryId: string) => void;
  onSelectSubItem: (categoryId: string, subItemId: string) => void;
  user: UserProfile;
  onLogout: () => void;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  isMobileDrawer,
  isOpen,
  categories,
  activeCategoryId,
  activeSubItemId,
  expandedCategories,
  onToggleCategory,
  onSelectSubItem,
  user,
  onLogout,
  onClose,
}) => {
  // Mobile drawer: slide in/out from left; Desktop: fixed width toggle
  const mobileTranslate = isMobileDrawer
    ? isOpen
      ? 'translate-x-0'
      : '-translate-x-full'
    : '';

  const widthClass = isMobileDrawer
    ? 'w-[280px]'
    : isCollapsed
    ? 'w-[74px]'
    : 'w-[260px]';

  // On mobile drawer mode always show expanded (isCollapsed=false passed from parent)
  const collapsed = isMobileDrawer ? false : isCollapsed;

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-40 bg-[#A0C4DF] text-[#1E293B] border-r border-[#7BAEC8] flex flex-col select-none shadow-xl
        ${widthClass}
        ${isMobileDrawer ? `transition-transform duration-300 ease-in-out ${mobileTranslate}` : 'transition-all duration-300 ease-in-out'}
      `}
    >
      {/* Top Section: Logo + Title */}
      <div className="py-4 min-h-[64px] flex items-center border-b border-[#7BAEC8] px-2 bg-[#93C5FD]">
        <div className="flex items-center space-x-3 w-full px-1 overflow-hidden justify-center">
          <div
            className={`relative shrink-0 ${collapsed ? 'w-10 h-10' : 'w-12 h-12'} rounded-xl overflow-hidden border-2 border-[#FACC15] bg-white shadow-[0_0_18px_rgba(250,204,21,0.35)] p-1 flex items-center justify-center transition-all duration-300`}
          >
            <img
              src="/logo.jpg"
              alt="Anjuman e Mufaddal Emblem"
              className="w-full h-full object-contain rounded-lg"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (!target.src.includes('public/')) {
                  target.src = 'logo.jpg';
                }
              }}
            />
          </div>

          {!collapsed && (
            <div className="flex flex-col min-w-0 transition-opacity duration-200 flex-1">
              <span className="font-extrabold text-sm text-[#1E293B] tracking-tight truncate">
                BURHANI PARK
              </span>
              <span className="text-[10px] text-[#B45309] font-bold tracking-wider uppercase">
                Jamaat ERP Portal
              </span>
            </div>
          )}

          {/* Close button — mobile drawer only */}
          {isMobileDrawer && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close navigation"
              className="shrink-0 p-2 rounded-lg text-[#1E293B] hover:bg-[#BFDBFE] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation Menu Hierarchy (Scrollable Area) */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-1 sidebar-scroll">
        {categories.map((category) => {
          const isCategoryActive = activeCategoryId === category.id;
          const isExpanded = expandedCategories[category.id] ?? true;

          return (
            <div key={category.id} className="mb-1">
              {/* Category Header Button */}
              <button
                type="button"
                onClick={() => onToggleCategory(category.id)}
                title={collapsed ? category.title : undefined}
                className={`w-full flex items-center justify-between px-2.5 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-150 group min-h-[44px] ${
                  isCategoryActive
                    ? 'text-[#1E293B] bg-[#FEF08A]'
                    : 'text-[#1E293B] hover:text-[#0F172A] hover:bg-[#BFDBFE]'
                }`}
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div
                    className={`p-1.5 rounded-md transition-colors shrink-0 ${
                      isCategoryActive
                        ? 'bg-[#FACC15] text-[#1E293B]'
                        : 'text-[#334155] group-hover:text-[#B45309]'
                    }`}
                  >
                    <NavIcon name={category.iconName} className="w-4 h-4" />
                  </div>
                  {!collapsed && (
                    <span className="truncate tracking-wide text-xs capitalize font-medium text-[#1E293B]">
                      {category.title}
                    </span>
                  )}
                </div>

                {!collapsed && (
                  <div className="text-[#334155] group-hover:text-[#0F172A] shrink-0">
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5" />
                    )}
                  </div>
                )}
              </button>

              {/* Sub-items list */}
              {(!collapsed && isExpanded) && (
                <div className="mt-1 pl-7 pr-1 space-y-1">
                  {category.items.map((subItem) => {
                    const isSubActive =
                      isCategoryActive && activeSubItemId === subItem.id;

                    return (
                      <button
                        key={subItem.id}
                        type="button"
                        onClick={() => onSelectSubItem(category.id, subItem.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs transition-all duration-150 min-h-[40px] ${
                          isSubActive
                            ? 'bg-[#FEF08A] text-[#1E293B] font-bold border-l-2 border-[#FACC15] shadow-[0_0_8px_rgba(250,204,21,0.25)] translate-x-0.5'
                            : 'text-[#1E293B] hover:text-[#0F172A] hover:bg-[#BFDBFE]'
                        }`}
                      >
                        <span className="truncate">{subItem.label}</span>

                        {subItem.badge && (
                          <span
                            className={`ml-1.5 text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 min-h-[18px] flex items-center ${
                              isSubActive
                                ? 'bg-[#FACC15] text-[#1E293B]'
                                : 'bg-[#FEF9C3] text-[#B45309] border border-[#FDE047]'
                            }`}
                          >
                            {subItem.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Bottom Section: User status + Quick Logout */}
      <div className="border-t border-[#7BAEC8] bg-[#8BB8D4] p-3">
        {/* User Status Indicator */}
        <div className="flex items-center justify-between mb-2.5 px-1">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#EAB308] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#EAB308]"></span>
            </span>
            {!collapsed && (
              <span className="text-[11px] font-medium text-[#1E293B]">
                Live Jamaat Node
              </span>
            )}
          </div>
          {!collapsed && (
            <span className="text-[10px] font-mono text-[#334155]">
              ITS: {user.itsNumber}
            </span>
          )}
        </div>

        {/* Quick Logout Button */}
        <button
          type="button"
          onClick={onLogout}
          title="Sign out of ERP"
          className={`w-full flex items-center justify-center space-x-2 py-2.5 px-2.5 rounded-lg text-xs font-bold text-white bg-[#DC2626] hover:bg-red-700 active:scale-95 border border-red-700 transition-all duration-150 shadow-sm min-h-[44px] ${
            collapsed ? 'px-0' : ''
          }`}
        >
          <LogOut className="w-3.5 h-3.5 text-white shrink-0" />
          {!collapsed && <span>Quick Logout</span>}
        </button>
      </div>
    </aside>
  );
};
