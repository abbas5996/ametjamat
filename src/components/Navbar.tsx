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
  LogOut,
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
  onOpenPasswordReset: () => void;
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
  onOpenPasswordReset,
  onOpenSettings,
}) => {
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Thaali Collection',
      desc: '14 thaalis registered for Ramadan Niyaaz',
      time: '12m ago',
      unread: true,
    },
    {
      id: 2,
      title: 'Takhmeen Submission',
      desc: 'ITS 30489122 filed 1447 Takhmeen form',
      time: '1h ago',
      unread: true,
    },
    {
      id: 3,
      title: 'Receipt Generated',
      desc: 'Receipt #BP-8919 issued for Faiz al-Mawaid',
      time: '3h ago',
      unread: false,
    },
  ]);

  const yearRef = useRef<HTMLDivElement>(null);
  const notifyRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

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

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <header className="h-16 bg-[#93C5FD] border-b border-[#7BAEC8] sticky top-0 z-30 px-3 sm:px-6 flex items-center justify-between shadow-md select-none text-[#1E293B]">
      {/* Left Section */}
      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
        <button
          type="button"
          onClick={onToggleMobileDrawer}
          aria-label="Open navigation menu"
          className="lg:hidden p-2 rounded-lg text-[#1E293B] hover:text-[#B45309] hover:bg-[#BFDBFE] transition-colors focus:outline-none focus:ring-2 focus:ring-[#FACC15]/50 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label={isSidebarCollapsed ? 'Expand navigation' : 'Collapse navigation'}
          className="hidden lg:flex p-2 rounded-lg text-[#1E293B] hover:text-[#B45309] hover:bg-[#BFDBFE] transition-colors focus:outline-none focus:ring-2 focus:ring-[#FACC15]/50 items-center justify-center cursor-pointer"
          title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isSidebarCollapsed ? (
            <PanelLeftOpen className="w-5 h-5 text-[#1E293B]" />
          ) : (
            <PanelLeftClose className="w-5 h-5 text-[#1E293B]" />
          )}
        </button>

        <div className="flex items-center space-x-2 min-w-0">
          <span className="font-bold text-[#0F172A] text-sm sm:text-base lg:text-lg tracking-tight truncate">
            <span className="hidden xs:inline">Anjuman e Mufaddal - </span>
            <span>Jamaat ERP</span>
            <span className="hidden md:inline"> Portal</span>
          </span>

          <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FACC15] text-[#1E293B] border border-[#FDE047] shadow-xs shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-700 mr-1.5 animate-pulse" />
            Janab Portal
          </span>
        </div>
      </div>

      {/* Right Section: FY Selector + Notifications + Janab Profile */}
      <div className="flex items-center space-x-1.5 sm:space-x-2.5 shrink-0">
        {/* Financial Year Selector */}
        <div className="relative" ref={yearRef}>
          <button
            type="button"
            onClick={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
            className="flex items-center space-x-1.5 h-9 px-2 sm:px-3 text-xs font-medium text-[#1E293B] bg-[#BFDBFE] border border-[#7BAEC8] rounded-lg hover:border-[#FACC15] hover:bg-[#A0C4DF] transition-colors shadow-xs focus:outline-none focus:ring-2 focus:ring-[#FACC15]/40 min-h-[44px] cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5 text-[#B45309] shrink-0" />
            <span className="font-semibold text-[#1E293B] hidden sm:inline whitespace-nowrap">
              {selectedYear}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-[#334155] transition-transform duration-200 shrink-0 ${
                isYearDropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {isYearDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-50 text-xs sm:text-sm animate-in fade-in zoom-in-95 duration-100 text-[#1E293B]">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                Select Financial Year
              </div>
              <button
                type="button"
                onClick={() => {
                  onYearChange('1447-1448 Hijri');
                  setIsYearDropdownOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-amber-50 transition-colors min-h-[44px] cursor-pointer ${
                  selectedYear === '1447-1448 Hijri'
                    ? 'text-[#B45309] font-bold bg-[#FEF9C3]'
                    : 'text-[#1E293B]'
                }`}
              >
                <span>1447-1448 Hijri (Current)</span>
                {selectedYear === '1447-1448 Hijri' && (
                  <Check className="w-4 h-4 text-[#B45309]" />
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  onYearChange('1446-1447 Hijri');
                  setIsYearDropdownOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-amber-50 transition-colors min-h-[44px] cursor-pointer ${
                  selectedYear === '1446-1447 Hijri'
                    ? 'text-[#B45309] font-bold bg-[#FEF9C3]'
                    : 'text-[#1E293B]'
                }`}
              >
                <span>1446-1447 Hijri (Archived)</span>
                {selectedYear === '1446-1447 Hijri' && (
                  <Check className="w-4 h-4 text-[#B45309]" />
                )}
              </button>
            </div>
          )}
        </div>

        {/* Notifications Icon with Working Read Action */}
        <div className="relative" ref={notifyRef}>
          <button
            type="button"
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="relative p-2 text-[#1E293B] hover:text-[#B45309] hover:bg-[#BFDBFE] rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#FACC15]/40 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
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
            <div className="absolute right-0 mt-1.5 w-72 sm:w-80 bg-white rounded-xl shadow-2xl border border-slate-200 py-2 z-50 text-[#1E293B] animate-in fade-in zoom-in-95 duration-100">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-[#0F172A]">
                  Notifications ({unreadCount} unread)
                </span>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })))
                    }
                    className="text-[11px] font-semibold text-[#B45309] hover:underline cursor-pointer"
                  >
                    Mark all as read
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                {notifications.map((item) => (
                  <div
                    key={item.id}
                    onClick={() =>
                      setNotifications((prev) =>
                        prev.map((n) => (n.id === item.id ? { ...n, unread: false } : n))
                      )
                    }
                    className={`px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer ${
                      item.unread ? 'bg-[#FEF9C3]/60' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-[#0F172A]">{item.title}</p>
                      <span className="text-[10px] text-slate-500 shrink-0 ml-2">
                        {item.time}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">{item.desc}</p>
                  </div>
                ))}
              </div>
              <div className="px-4 pt-2 border-t border-slate-100 text-center">
                <button
                  type="button"
                  onClick={() => setIsNotificationsOpen(false)}
                  className="text-xs font-semibold text-slate-600 hover:text-[#0F172A] min-h-[36px] px-3 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Janab Profile Pill */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center space-x-2 h-10 pl-1.5 pr-2 sm:pl-2 sm:pr-3 bg-[#BFDBFE] hover:bg-[#A0C4DF] border border-[#7BAEC8] hover:border-[#FACC15] rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#FACC15]/40 min-h-[44px] cursor-pointer"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#D4AF37] to-[#EAB308] text-[#0F172A] flex items-center justify-center font-black text-xs ring-1 ring-[#FACC15]/60 shadow-xs shrink-0">
              JA
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-bold text-[#0F172A] leading-tight whitespace-nowrap">
                {user.displayName}
              </div>
              <div className="text-[10px] font-bold text-[#B45309] leading-none">
                {user.role} &bull; @{user.username}
              </div>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-[#334155] transition-transform duration-200 shrink-0 ${
                isProfileOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-1.5 w-60 bg-white rounded-xl shadow-2xl border border-slate-200 py-1.5 z-50 text-xs text-[#1E293B] animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3.5 py-2.5 border-b border-slate-100 bg-amber-50/70 rounded-t-xl">
                <p className="text-xs font-bold text-[#0F172A]">{user.displayName}</p>
                <p className="text-[11px] text-slate-600 font-mono">
                  @{user.username} &bull; ITS: {user.itsNumber}
                </p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#FACC15] text-[#1E293B] border border-[#FDE047]">
                  {user.role} (Janab Only)
                </span>
              </div>

              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    onOpenPasswordReset();
                  }}
                  className="w-full flex items-center px-3.5 py-2.5 text-slate-800 hover:bg-amber-50 font-medium transition-colors space-x-2 min-h-[42px] cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-700" />
                  <span>Janab Password Reset</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    onOpenSettings();
                  }}
                  className="w-full flex items-center px-3.5 py-2.5 text-slate-800 hover:bg-amber-50 font-medium transition-colors space-x-2 min-h-[42px] cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />
                  <span>Access &amp; Security Audit</span>
                </button>
              </div>

              <div className="border-t border-slate-100 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center px-3.5 py-2.5 text-rose-700 hover:bg-rose-50 font-bold transition-colors space-x-2 min-h-[42px] cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-600" />
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
