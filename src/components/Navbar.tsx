import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  ChevronDown,
  Calendar,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  Check,
  ShieldCheck,
  KeyRound,
  LogOut
} from 'lucide-react';
import { FinancialYear, UserProfile } from '../types';

interface NavbarProps {
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onToggleMobileDrawer: () => void;
  selectedYear: FinancialYear;
  onYearChange: (year: FinancialYear) => void;
  user: UserProfile;
  onLogout: () => void;
  onOpenSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  isSidebarCollapsed,
  onToggleSidebar,
  onToggleMobileDrawer,
  selectedYear,
  onYearChange,
  user,
  onLogout,
  onOpenSettings,
}) => {
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const yearRef = useRef<HTMLDivElement>(null);
  const notifyRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (yearRef.current && !yearRef.current.contains(event.target as Node)) {
        setIsYearDropdownOpen(false);
      }
      if (notifyRef.current && !notifyRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const notifications = [
    { id: 1, title: 'Thaali Collection', desc: '14 thaalis registered for Ramadan Niyaaz', time: '12m ago', unread: true },
    { id: 2, title: 'Takhmeen Submission', desc: 'ITS 30489122 filed 1447 Takhmeen form', time: '1h ago', unread: true },
    { id: 3, title: 'Receipt Generated', desc: 'Receipt #BP-8919 issued for Faiz al-Mawaid', time: '3h ago', unread: false },
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <header className="h-16 bg-[#93C5FD] border-b border-[#7BAEC8] sticky top-0 z-30 px-3 sm:px-6 flex items-center justify-between shadow-md select-none text-[#1E293B]">

      {/* Left Section */}
      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">

        {/* Mobile: Hamburger drawer toggle (< lg) */}
        <button
          type="button"
          onClick={onToggleMobileDrawer}
          aria-label="Open navigation menu"
          className="lg:hidden p-2 rounded-lg text-[#1E293B] hover:text-[#B45309] hover:bg-[#BFDBFE] transition-colors focus:outline-none focus:ring-2 focus:ring-[#FACC15]/50 min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Desktop: sidebar collapse toggle (lg+) */}
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label={isSidebarCollapsed ? 'Expand navigation' : 'Collapse navigation'}
          className="hidden lg:flex p-2 rounded-lg text-[#1E293B] hover:text-[#B45309] hover:bg-[#BFDBFE] transition-colors focus:outline-none focus:ring-2 focus:ring-[#FACC15]/50 items-center justify-center"
          title={isSidebarCollapsed ? 'Expand sidebar (260px)' : 'Collapse sidebar'}
        >
          {isSidebarCollapsed ? (
            <PanelLeftOpen className="w-5 h-5 text-[#1E293B]" />
          ) : (
            <PanelLeftClose className="w-5 h-5 text-[#1E293B]" />
          )}
        </button>

        {/* Title + Badge */}
        <div className="flex items-center space-x-2 min-w-0">
          <span className="font-bold text-[#0F172A] text-sm sm:text-base lg:text-lg tracking-tight truncate">
            <span className="hidden xs:inline">Anjuman e Mufaddal - </span>
            <span>Jamaat ERP</span>
            <span className="hidden md:inline"> Portal</span>
          </span>

          {/* Gold Pill Badge — hidden on xs */}
          <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FACC15] text-[#1E293B] border border-[#FDE047] shadow-xs shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#B45309] mr-1.5 animate-pulse" />
            v2.4 Production
          </span>
        </div>
      </div>

      {/* Right Section: FY Selector + Notifications + Admin Profile */}
      <div className="flex items-center space-x-1.5 sm:space-x-2.5 shrink-0">

        {/* Financial Year Selector */}
        <div className="relative" ref={yearRef}>
          <button
            type="button"
            onClick={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
            className="flex items-center space-x-1.5 h-9 px-2 sm:px-3 text-xs font-medium text-[#1E293B] bg-[#BFDBFE] border border-[#7BAEC8] rounded-lg hover:border-[#FACC15] hover:bg-[#A0C4DF] transition-colors shadow-xs focus:outline-none focus:ring-2 focus:ring-[#FACC15]/40 min-h-[44px]"
          >
            <Calendar className="w-3.5 h-3.5 text-[#FACC15] shrink-0" />
            <span className="font-semibold text-[#1E293B] hidden sm:inline whitespace-nowrap">{selectedYear}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-[#334155] transition-transform duration-200 shrink-0 ${isYearDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isYearDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-48 bg-[#EFF8FF] rounded-lg shadow-xl border border-[#BFDBFE] py-1 z-50 text-xs sm:text-sm animate-in fade-in zoom-in-95 duration-100 text-[#1E293B]">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-[#334155] uppercase tracking-wider border-b border-[#BFDBFE]">
                Select Financial Year
              </div>
              <button
                type="button"
                onClick={() => {
                  onYearChange('1447-1448 Hijri');
                  setIsYearDropdownOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-[#BFDBFE] transition-colors min-h-[44px] ${
                  selectedYear === '1447-1448 Hijri' ? 'text-[#B45309] font-bold bg-[#FEF9C3]' : 'text-[#1E293B]'
                }`}
              >
                <span>1447-1448 Hijri (Current)</span>
                {selectedYear === '1447-1448 Hijri' && <Check className="w-4 h-4 text-[#FACC15]" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  onYearChange('1446-1447 Hijri');
                  setIsYearDropdownOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-[#BFDBFE] transition-colors min-h-[44px] ${
                  selectedYear === '1446-1447 Hijri' ? 'text-[#B45309] font-bold bg-[#FEF9C3]' : 'text-[#1E293B]'
                }`}
              >
                <span>1446-1447 Hijri (Archived)</span>
                {selectedYear === '1446-1447 Hijri' && <Check className="w-4 h-4 text-[#FACC15]" />}
              </button>
            </div>
          )}
        </div>

        {/* Notifications Icon with Badge */}
        <div className="relative" ref={notifyRef}>
          <button
            type="button"
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="relative p-2 text-[#1E293B] hover:text-[#B45309] hover:bg-[#BFDBFE] rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#FACC15]/40 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Notifications"
          >
            <Bell className="w-4.5 h-4.5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#FACC15] text-[#1E293B] font-extrabold text-[10px] ring-2 ring-[#93C5FD]">
                {unreadCount}
              </span>
            )}
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 mt-1.5 w-72 sm:w-80 bg-[#EFF8FF] rounded-xl shadow-2xl border border-[#BFDBFE] py-2 z-50 text-[#1E293B] animate-in fade-in zoom-in-95 duration-100">
              <div className="px-4 py-2 border-b border-[#BFDBFE] flex items-center justify-between">
                <span className="text-xs font-semibold text-[#0F172A]">Notifications</span>
                <span className="text-[11px] font-medium text-[#B45309] hover:underline cursor-pointer">Mark all as read</span>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-[#BFDBFE]">
                {notifications.map((item) => (
                  <div key={item.id} className={`px-4 py-3 hover:bg-[#BFDBFE]/60 transition-colors ${item.unread ? 'bg-[#FEF9C3]/70' : ''}`}>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-[#0F172A]">{item.title}</p>
                      <span className="text-[10px] text-[#475569] shrink-0 ml-2">{item.time}</span>
                    </div>
                    <p className="text-xs text-[#334155] mt-0.5">{item.desc}</p>
                  </div>
                ))}
              </div>
              <div className="px-4 pt-2 border-t border-[#BFDBFE] text-center">
                <button
                  type="button"
                  onClick={() => setIsNotificationsOpen(false)}
                  className="text-xs font-medium text-[#334155] hover:text-[#0F172A] min-h-[44px] px-3"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Admin Profile Pill */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center space-x-2 h-10 pl-1.5 pr-2 sm:pl-2 sm:pr-3 bg-[#BFDBFE] hover:bg-[#A0C4DF] border border-[#7BAEC8] hover:border-[#FACC15] rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#FACC15]/40 min-h-[44px]"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#D4AF37] to-[#EAB308] text-[#0F172A] flex items-center justify-center font-black text-xs ring-1 ring-[#FACC15]/60 shadow-xs shrink-0">
              {user.username.slice(0, 2).toUpperCase()}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-bold text-[#0F172A] leading-tight whitespace-nowrap">
                Username: {user.username}
              </div>
              <div className="text-[10px] font-bold text-[#B45309] leading-none">
                {user.role}
              </div>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-[#334155] transition-transform duration-200 shrink-0 ${isProfileOpen ? 'rotate-180' : ''}`} />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-1.5 w-56 bg-[#EFF8FF] rounded-xl shadow-2xl border border-[#BFDBFE] py-1.5 z-50 text-xs text-[#1E293B] animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3.5 py-2.5 border-b border-[#BFDBFE] bg-[#DBEAFE] rounded-t-xl">
                <p className="text-xs font-bold text-[#0F172A]">{user.displayName}</p>
                <p className="text-[11px] text-[#334155] font-mono">ITS: {user.itsNumber}</p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#FACC15] text-[#1E293B] border border-[#FDE047]">
                  {user.role}
                </span>
              </div>

              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    onOpenSettings();
                  }}
                  className="w-full flex items-center px-3.5 py-2.5 text-[#1E293B] hover:bg-[#BFDBFE] transition-colors space-x-2 min-h-[44px]"
                >
                  <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                  <span>Security & Password</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    onOpenSettings();
                  }}
                  className="w-full flex items-center px-3.5 py-2.5 text-[#1E293B] hover:bg-[#BFDBFE] transition-colors space-x-2 min-h-[44px]"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                  <span>Roles & Privileges</span>
                </button>
              </div>

              <div className="border-t border-[#BFDBFE] pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center px-3.5 py-2.5 text-rose-400 hover:bg-rose-500/10 font-semibold transition-colors space-x-2 min-h-[44px]"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-400" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
