import React, { useState } from 'react';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Info,
  X,
  LogIn,
  ShieldCheck,
  Sparkles,
  Calendar,
  Building2,
  Utensils,
  Receipt,
  Landmark,
  KeyRound,
} from 'lucide-react';
import { UserProfile } from '../types';
import { authenticateJanab } from '../utils/auth';

interface LoginPageProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!username.trim() || !password) {
      setErrorMessage('Please enter both the Janab username and password.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const res = authenticateJanab(username, password);
      setIsLoading(false);
      if (!res.ok || !res.user) {
        setErrorMessage(res.error || 'Authentication failed.');
        return;
      }
      onLoginSuccess(res.user);
    }, 300);
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:grid lg:grid-cols-2 bg-[#FAF7F2] text-slate-900 select-none antialiased">
      {/* ══════════════════════════════════════════════════════════════════
          LEFT PANEL: High-End Authentication Form
      ══════════════════════════════════════════════════════════════════ */}
      <div className="relative flex flex-col justify-between p-6 sm:p-10 md:p-12 lg:p-12 xl:p-16 min-h-screen bg-gradient-to-br from-[#FCFBF8] via-[#FAF7F2] to-[#F5EFEB] border-r border-amber-200/70 shadow-2xl lg:shadow-none z-10 overflow-y-auto">
        {/* Subtle Ambient Gold Radial Highlights */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none translate-x-1/3 translate-y-1/3" />

        {/* ── Top Header Section ── */}
        <div className="relative z-10 space-y-6">
          <div className="flex items-center justify-between">
            {/* Trust Logo & Emblem */}
            <div className="flex items-center gap-3.5">
              <div className="relative group cursor-pointer">
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 opacity-60 blur-xs group-hover:opacity-100 transition-all duration-300" />
                <img
                  src="/logo.jpg"
                  alt="Anjuman e Mufaddal Logo"
                  width={68}
                  height={68}
                  className="relative w-16 h-16 sm:w-18 sm:h-18 object-cover rounded-2xl shadow-[0_4px_16px_rgba(217,119,6,0.25)] border-2 border-amber-300 bg-white transition-transform duration-300 group-hover:scale-[1.02]"
                />
              </div>
              <div>
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-900/90 block">
                  Anjuman e Mufaddal
                </span>
                <span className="text-xs sm:text-sm font-bold text-slate-700 block">
                  Burhani Park Jamaat Trust, Vatwa
                </span>
                <span className="text-[10px] text-slate-500 font-medium block">
                  Dawat-e-Hadiyah Institutional Portal
                </span>
              </div>
            </div>

            {/* Janab Exclusive Security Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-50 via-amber-100/90 to-yellow-50 border border-amber-300/90 shadow-[0_2px_8px_rgba(245,158,11,0.15)] text-[11px] font-extrabold text-amber-950">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-600"></span>
              </span>
              <ShieldCheck className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span className="hidden sm:inline">Janab Exclusive Portal</span>
              <span className="sm:hidden">Janab</span>
            </div>
          </div>

          {/* Heading & Intro */}
          <div className="pt-2">
            <h1 className="text-3xl sm:text-4xl xl:text-[2.6rem] font-black text-slate-950 tracking-tight font-serif leading-tight">
              Jamaat ERP Portal
            </h1>
            <p className="text-xs sm:text-sm font-medium text-slate-600 mt-2 leading-relaxed max-w-lg">
              Official centralized administration suite for Dawoodi Bohra community welfare, Faiz-ul-Mawaid al-Burhaniyah (FMB), Sabeel contributions, and Waqf ledgers.
            </p>
          </div>
        </div>

        {/* ── Center: Authentication Console ── */}
        <div className="relative z-10 my-auto py-8 max-w-md w-full mx-auto lg:mx-0">
          <div className="mb-6 pb-3 border-b border-amber-200/50 flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-widest text-amber-900/80 flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-amber-600" />
              Administrative Sign-In
            </span>
            <span className="text-[11px] font-bold text-slate-500">
              Authorized Session
            </span>
          </div>

          {/* Inline Validation Alert */}
          {errorMessage && (
            <div
              role="alert"
              className="mb-5 flex items-start space-x-3 p-3.5 bg-rose-50 border border-rose-300 text-rose-900 rounded-2xl text-xs sm:text-sm animate-in slide-in-from-top-2 duration-200 shadow-sm"
            >
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-semibold">{errorMessage}</div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-rose-500 hover:text-rose-700 p-0.5 rounded-md hover:bg-rose-100 transition-colors cursor-pointer"
                aria-label="Dismiss error"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Input */}
            <div>
              <label
                htmlFor="username"
                className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1.5"
              >
                Janab Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-5 h-5" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Enter janabadmin"
                  className="w-full pl-11 pr-4 py-3 bg-white/95 border border-slate-300/90 focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-400/20 rounded-xl text-slate-900 text-sm font-semibold placeholder:text-slate-400 outline-none transition-all shadow-xs"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-black uppercase tracking-wider text-slate-800"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowInfoModal(true)}
                  className="text-xs font-bold text-amber-800 hover:text-amber-950 hover:underline transition-colors cursor-pointer"
                >
                  Password Policy
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Enter Janab password"
                  className="w-full pl-11 pr-11 py-3 bg-white/95 border border-slate-300/90 focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-400/20 rounded-xl text-slate-900 text-sm font-semibold placeholder:text-slate-400 outline-none transition-all shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 text-slate-700" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Luxurious Amber-to-Gold Action Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 active:scale-[0.985] text-slate-950 font-black shadow-[0_4px_20px_rgba(245,158,11,0.35)] hover:shadow-[0_6px_25px_rgba(245,158,11,0.5)] transition-all duration-200 flex items-center justify-center space-x-2.5 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed text-sm sm:text-base tracking-wide"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2.5">
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Authenticating Session...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2.5">
                    <LogIn className="w-4 h-4 text-slate-950" />
                    <span>Login to Janab Portal</span>
                  </div>
                )}
              </button>
            </div>
          </form>

          {/* Secure Session Notice Box */}
          <div className="mt-6 p-4 rounded-2xl bg-amber-50/70 border border-amber-300/60 shadow-xs flex items-start gap-3 text-xs text-amber-950">
            <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-extrabold text-amber-950">Strict Access Control:</span> Public registration and external recovery are deactivated. Master credentials may be modified anytime under <span className="font-bold text-slate-900">System Settings &rarr; Janab Password Reset</span>.
            </div>
          </div>
        </div>

        {/* ── Bottom Institutional Footer ── */}
        <div className="relative z-10 pt-6 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-[11px] text-slate-500 font-medium">
          <p className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-amber-600" />
            <span>© {new Date().getFullYear()} Dawoodi Bohra Jamaat Trust • Burhani Park</span>
          </p>
          <p className="text-amber-900 font-bold bg-amber-100/70 px-2.5 py-0.5 rounded-full border border-amber-200">
            Fiscal 1447 - 1448 Hijri
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          RIGHT PANEL: Immersive Heritage Showcase (Masterpiece)
      ══════════════════════════════════════════════════════════════════ */}
      <div className="relative hidden lg:flex flex-col justify-between p-10 xl:p-14 2xl:p-16 overflow-hidden bg-slate-950 text-white min-h-screen">
        {/* Full-Bleed High-Definition Architectural Background */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 ease-out hover:scale-105"
          style={{ backgroundImage: `url('/Galiakot_image.jpg')` }}
          aria-hidden="true"
        />

        {/* Multi-Layered Dark Gradient & Vignette Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/65 to-slate-950/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/40 to-slate-950/50" />
        <div className="absolute inset-0 bg-amber-950/20 mix-blend-color-dodge" />

        {/* Top Showcase Status Pills */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-slate-900/80 backdrop-blur-md border border-amber-400/40 text-xs font-bold text-amber-200 shadow-xl">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Mazar-e-Fakhri Mubarak • Galiakot Sharif</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 bg-slate-900/70 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/15 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Secure ERP Portal</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-300 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-amber-300/30 shadow-sm">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>1447-1448 Hijri</span>
            </div>
          </div>
        </div>

        {/* Center: Inspiring Calligraphic Header & Bold Headline */}
        <div className="relative z-10 my-auto py-10 max-w-xl 2xl:max-w-2xl space-y-6">
          {/* Traditional Calligraphic Header */}
          <div className="inline-block px-5 py-2 rounded-2xl bg-black/55 backdrop-blur-md border border-amber-400/40 text-amber-300 text-base sm:text-lg font-serif tracking-[0.25em] shadow-lg">
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </div>

          <div className="space-y-4">
            <h2 className="text-3xl xl:text-4xl 2xl:text-5xl font-black text-white tracking-tight leading-tight font-serif drop-shadow-lg">
              Serving Mumineen with{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-400">
                Ikhlas &amp; Barakat
              </span>
            </h2>
            <p className="text-sm xl:text-base text-slate-200/90 leading-relaxed font-normal drop-shadow-md">
              A state-of-the-art enterprise portal designed for the spiritual, operational, and financial administration of Anjuman e Mufaddal, stewarding community welfare under the benevolent guidance of Dawat-e-Hadiyah.
            </p>
          </div>

          {/* Sleek Glassmorphism Feature Cards Floating at the Bottom of Content */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-4">
            {/* Card 1: Faiz-ul-Mawaid */}
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 hover:border-amber-400/60 hover:bg-white/15 transition-all duration-300 shadow-xl group">
              <div className="w-9 h-9 rounded-xl bg-amber-400/25 border border-amber-300/40 text-amber-300 flex items-center justify-center mb-2.5 font-bold group-hover:scale-110 transition-transform shadow-xs">
                <Utensils className="w-4 h-4 text-amber-300" />
              </div>
              <h3 className="text-xs font-black text-white tracking-wide">Faiz-ul-Mawaid</h3>
              <p className="text-[11px] text-slate-300/90 mt-1 leading-snug">
                Daily Thaali distribution, meal feedback &amp; Niyaz barakat tracking.
              </p>
            </div>

            {/* Card 2: Sabeel & Accounts */}
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 hover:border-amber-400/60 hover:bg-white/15 transition-all duration-300 shadow-xl group">
              <div className="w-9 h-9 rounded-xl bg-amber-400/25 border border-amber-300/40 text-amber-300 flex items-center justify-center mb-2.5 font-bold group-hover:scale-110 transition-transform shadow-xs">
                <Receipt className="w-4 h-4 text-amber-300" />
              </div>
              <h3 className="text-xs font-black text-white tracking-wide">Sabeel &amp; Accounts</h3>
              <p className="text-[11px] text-slate-300/90 mt-1 leading-snug">
                Real-time collection ledgers, official receipts &amp; audit trails.
              </p>
            </div>

            {/* Card 3: Trust & 12 Umur */}
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 hover:border-amber-400/60 hover:bg-white/15 transition-all duration-300 shadow-xl group">
              <div className="w-9 h-9 rounded-xl bg-amber-400/25 border border-amber-300/40 text-amber-300 flex items-center justify-center mb-2.5 font-bold group-hover:scale-110 transition-transform shadow-xs">
                <Landmark className="w-4 h-4 text-amber-300" />
              </div>
              <h3 className="text-xs font-black text-white tracking-wide">Trust &amp; 12 Umur</h3>
              <p className="text-[11px] text-slate-300/90 mt-1 leading-snug">
                Community census, institutional schemes &amp; welfare governance.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Showcase Seal & Architecture Caption */}
        <div className="relative z-10 pt-6 border-t border-white/15 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-semibold text-white">
              Dawoodi Bohra Jamaat Trust • Burhani Park, Vatwa
            </span>
          </div>
          <span className="text-[11px] text-amber-300 font-mono tracking-wider bg-black/40 px-2.5 py-1 rounded-lg border border-white/10">
            ENCRYPTED JANAB CONSOLE
          </span>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          Security Policy Modal
      ══════════════════════════════════════════════════════════════════ */}
      {showInfoModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setShowInfoModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-sm bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-amber-200 text-center animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner border border-amber-200">
              <Info className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-black text-slate-950 mb-2 font-serif">
              Janab Security Protocol
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-6 font-medium">
              Public self-registration and guest recovery are deactivated by default. Only an authenticated{' '}
              <span className="font-extrabold text-slate-950">Janab (janabadmin)</span> session may manage or rotate credentials through{' '}
              <span className="font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">System Settings &rarr; Janab Password Reset</span>.
            </p>
            <button
              type="button"
              onClick={() => setShowInfoModal(false)}
              className="w-full py-3 px-4 bg-slate-950 hover:bg-slate-800 active:scale-[0.98] text-white font-bold text-sm rounded-xl transition-all shadow-md cursor-pointer"
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
