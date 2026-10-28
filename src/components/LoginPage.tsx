import React, { useState } from 'react';
import { User, Lock, Eye, EyeOff, AlertCircle, Info, X, LogIn } from 'lucide-react';
import { getStoredUsers } from '../utils/rbac';
import { UserPermissionsMap } from '../types';

interface LoginPageProps {
  onLoginSuccess: (user: {
    username: string;
    role: string;
    displayName: string;
    permissions?: UserPermissionsMap | 'all' | null;
  }) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validate credentials
    const trimmedUser = username.trim();
    if (!trimmedUser || !password) {
      setErrorMessage('Please enter both username and password.');
      return;
    }

    setIsLoading(true);

    // Simulated verification for smooth UX feel
    setTimeout(() => {
      // 1. Super Admin (Janab) credentials verification
      const rootPwd = localStorage.getItem('janab_root_pwd') || 'jamat#5253';
      if (trimmedUser === 'janabadmin' && (password === rootPwd || password === 'jamat#5253')) {
        setIsLoading(false);
        onLoginSuccess({
          username: 'janabadmin',
          displayName: 'Janab Amil Saheb',
          role: 'Super Admin',
          permissions: 'all',
        });
        return;
      }

      // 2. Department personnel verification from managed RBAC store
      const storedUsers = getStoredUsers();
      const matched = storedUsers.find(
        (u) =>
          u.username.toLowerCase() === trimmedUser.toLowerCase() &&
          u.password === password
      );

      if (matched) {
        setIsLoading(false);
        onLoginSuccess({
          username: matched.username,
          displayName: matched.fullName,
          role: matched.department,
          permissions: matched.permissions,
        });
        return;
      }

      setIsLoading(false);
      setErrorMessage('Invalid username or password. Please verify your credentials.');
    }, 450);
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 overflow-hidden select-none">
      {/* 1. FULL BACKGROUND IMAGE DISPLAY: Sharp, HD, non-blurred cover */}
      <div
        className="absolute inset-0 min-h-screen w-full bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('/Galiakot_image.jpg')` }}
        aria-hidden="true"
      />
      {/* Subtle translucent dark tint for contrast */}
      <div className="absolute inset-0 bg-slate-950/25" />

      {/* 2. SEMI-TRANSPARENT GLASSMORPHISM CARD */}
      <div className="relative z-10 w-full max-w-md bg-white/75 backdrop-blur-md border border-white/60 shadow-2xl rounded-3xl p-6 sm:p-8 transition-all animate-in fade-in zoom-in-95 duration-300">
        
        {/* Top Header & LOGO: Center-aligned 90px logo */}
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

          {/* BRANDING: Jamaat ERP Portal & Anjuman e Mufaddal */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Jamaat ERP Portal
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-amber-800 tracking-wider uppercase mt-1">
            Anjuman e Mufaddal
          </p>
          <div className="w-12 h-1 bg-amber-400 rounded-full mt-2.5 mx-auto" />
        </div>

        {/* VALIDATION RED ERROR ALERT BOX */}
        {errorMessage && (
          <div className="mb-5 flex items-start space-x-3 p-3.5 bg-red-50/90 border border-red-300/80 text-red-800 rounded-xl text-xs sm:text-sm animate-in slide-in-from-top-2 duration-200 shadow-xs backdrop-blur-xs">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{errorMessage}</div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-red-500 hover:text-red-700 p-0.5 rounded-md hover:bg-red-100 transition-colors"
              aria-label="Dismiss error"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* LOGIN FORM */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* USERNAME INPUT (Semi-transparent) */}
          <div>
            <label
              htmlFor="username"
              className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5"
            >
              Username
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
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full pl-11 pr-4 py-3 bg-white/60 border border-slate-300/80 focus:border-amber-500 focus:bg-white/90 focus:ring-2 focus:ring-amber-400/20 rounded-xl text-slate-900 text-sm font-medium placeholder:text-slate-500 outline-hidden transition-all shadow-xs backdrop-blur-xs"
              />
            </div>
          </div>

          {/* PASSWORD INPUT (Semi-transparent) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="password"
                className="block text-xs font-bold uppercase tracking-wider text-slate-800"
              >
                Password
              </label>
              {/* FORGOT PASSWORD LINK */}
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-xs font-semibold text-amber-700 hover:text-amber-800 hover:underline transition-colors cursor-pointer"
              >
                Forgot Password?
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
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-11 pr-11 py-3 bg-white/60 border border-slate-300/80 focus:border-amber-500 focus:bg-white/90 focus:ring-2 focus:ring-amber-400/20 rounded-xl text-slate-900 text-sm font-medium placeholder:text-slate-500 outline-hidden transition-all shadow-xs backdrop-blur-xs"
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

          {/* LOGIN BUTTON */}
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
                  <span>Login to Portal</span>
                </div>
              )}
            </button>
          </div>
        </form>

        {/* Footnote / Quick Info */}
        <div className="mt-6 text-center border-t border-slate-100 pt-4">
          <p className="text-[11px] text-slate-400 font-medium">
            Authorized Personnel & Committee Members Only
          </p>
        </div>
      </div>

      {/* FORGOT PASSWORD MODAL */}
      {showForgotModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setShowForgotModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl border border-amber-200 text-center animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
              <Info className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Password Reset Request
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-6 font-medium">
              Please contact Super Admin / Janab for password reset.
            </p>
            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
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
