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
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 overflow-hidden select-none">
      {/* Background Cover */}
      <div
        className="absolute inset-0 min-h-screen w-full bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('/Galiakot_image.jpg')` }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-slate-950/35" />

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md bg-white/85 backdrop-blur-md border border-white/70 shadow-2xl rounded-3xl p-6 sm:p-8 transition-all animate-in fade-in zoom-in-95 duration-300">
        {/* Header & Emblem */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative group mb-3">
            <div className="absolute -inset-1 rounded-2xl bg-amber-400/25 blur-sm group-hover:bg-amber-400/40 transition-all" />
            <img
              src="/logo.jpg"
              alt="Anjuman e Mufaddal Logo"
              width={90}
              height={90}
              className="relative w-[90px] h-[90px] object-cover rounded-2xl shadow-lg border-2 border-white/80 bg-white"
            />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Jamaat ERP Portal
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-amber-800 tracking-wider uppercase mt-1">
            Anjuman e Mufaddal
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/90 border border-amber-300 text-[11px] font-bold text-amber-950">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
            <span>Janab Exclusive Administrative Portal</span>
          </div>
        </div>

        {/* Inline Validation Alert */}
        {errorMessage && (
          <div
            role="alert"
            className="mb-5 flex items-start space-x-3 p-3.5 bg-red-50 border border-red-300 text-red-800 rounded-xl text-xs sm:text-sm animate-in slide-in-from-top-2 duration-200 shadow-xs"
          >
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{errorMessage}</div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-red-500 hover:text-red-700 p-0.5 rounded-md hover:bg-red-100 transition-colors cursor-pointer"
              aria-label="Dismiss error"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5"
            >
              Janab Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
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
                className="w-full pl-11 pr-4 py-3 bg-white/80 border border-slate-300 focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-400/20 rounded-xl text-slate-900 text-sm font-medium placeholder:text-slate-400 outline-hidden transition-all shadow-xs"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="password"
                className="block text-xs font-bold uppercase tracking-wider text-slate-800"
              >
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowInfoModal(true)}
                className="text-xs font-semibold text-amber-800 hover:text-amber-900 hover:underline transition-colors cursor-pointer"
              >
                Password Policy
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
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
                className="w-full pl-11 pr-11 py-3 bg-white/80 border border-slate-300 focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-400/20 rounded-xl text-slate-900 text-sm font-medium placeholder:text-slate-400 outline-hidden transition-all shadow-xs"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
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

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="bg-amber-400 hover:bg-amber-500 active:bg-amber-600 text-slate-950 font-bold w-full py-3 px-4 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.99] flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <LogIn className="w-4 h-4" />
                  <span>Login to Janab Portal</span>
                </div>
              )}
            </button>
          </div>
        </form>

        {/* Footnote */}
        <div className="mt-6 text-center border-t border-slate-200/80 pt-4">
          <p className="text-[11px] text-slate-500 font-medium">
            Restricted to Janab Amil Saheb • Public Sign-Up &amp; General Accounts Disabled
          </p>
        </div>
      </div>

      {/* Password Policy Modal */}
      {showInfoModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setShowInfoModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl border border-amber-200 text-center animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
              <Info className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Janab Security Protocol
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-6 font-medium">
              Public sign-up and external password recovery are disabled. Only the authenticated{' '}
              <span className="font-bold text-slate-900">Janab (janabadmin)</span> session may reset credentials from{' '}
              <span className="font-semibold">System Settings &rarr; Janab Password Reset</span>.
            </p>
            <button
              type="button"
              onClick={() => setShowInfoModal(false)}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-xl transition-all shadow-xs cursor-pointer"
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
