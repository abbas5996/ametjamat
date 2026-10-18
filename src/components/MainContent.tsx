import React, { useState } from 'react';
import {
  Search,
  Plus,
  RefreshCw,
  Download,
  ShieldCheck
} from 'lucide-react';
import { Breadcrumb } from './Breadcrumb';
import { DashboardView } from './DashboardView';
import { FinancialYear } from '../types';

interface MainContentProps {
  activeCategoryId: string;
  categoryTitle: string;
  activeSubItemId: string;
  subItemLabel: string;
  financialYear: FinancialYear;
  onNavigateHome: () => void;
  onQuickAction: (actionName: string) => void;
}

export const MainContent: React.FC<MainContentProps> = ({
  activeCategoryId,
  categoryTitle,
  activeSubItemId,
  subItemLabel,
  financialYear,
  onNavigateHome,
  onQuickAction,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <main className="flex-1 min-w-0 bg-[#FEF3C7] overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Breadcrumbs */}
        <Breadcrumb
          categoryTitle={categoryTitle}
          subItemLabel={subItemLabel}
          financialYear={financialYear}
          onNavigateHome={onNavigateHome}
        />

        {/* Dynamic Header & Actions Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-[#0F172A] tracking-tight flex flex-wrap items-center gap-2">
              <span className="truncate">{subItemLabel}</span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A] shrink-0">
                {categoryTitle}
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Burhani Park Jamaat Administrative Record Management & Ledger System
            </p>
          </div>

          {/* Action CTAs — wraps on mobile */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onQuickAction('Refresh data')}
              className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs focus:ring-2 focus:ring-[#EAB308]/30 min-h-[44px]"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
              <span>Sync</span>
            </button>

            <button
              type="button"
              onClick={() => onQuickAction(`Export ${subItemLabel}`)}
              className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs focus:ring-2 focus:ring-[#EAB308]/30 min-h-[44px]"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Export</span>
            </button>

            {/* Primary Accent CTA */}
            <button
              type="button"
              onClick={() => onQuickAction(`New ${subItemLabel} Record`)}
              className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-black text-[#0F172A] bg-[#EAB308] hover:bg-[#D4AF37] active:bg-[#CA8A04] rounded-lg transition-all shadow-[0_2px_8px_rgba(234,179,8,0.35)] focus:ring-2 focus:ring-[#EAB308]/50 min-h-[44px]"
            >
              <Plus className="w-4 h-4 text-[#0F172A] stroke-[2.8]" />
              <span>Create New Record</span>
            </button>
          </div>
        </div>

        {/* Dynamic Route Content Views */}
        {renderContentSection(
          activeCategoryId,
          activeSubItemId,
          subItemLabel,
          searchQuery,
          setSearchQuery,
          onQuickAction
        )}
      </div>
    </main>
  );
};

// Helper to render specialized contextual panels
function renderContentSection(
  categoryId: string,
  subItemId: string,
  subItemLabel: string,
  searchQuery: string,
  setSearchQuery: (v: string) => void,
  onQuickAction: (actionName: string) => void
) {
  // 1. Main Overview Dashboard
  if (categoryId === 'dashboard' && subItemId === 'overview') {
    return <DashboardView onQuickAction={onQuickAction} />;
  }

  // 2. Member Master / ITS Lookup
  if (subItemId === 'its-lookup' || categoryId === 'member-master') {
    return (
      <div className="bg-white border border-[#D97706]/30 rounded-xl p-4 sm:p-5 lg:p-6 shadow-md space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-[#0F172A]">ITS Mumineen Verification & Directory</h2>
            <p className="text-xs text-slate-500">Query and verify ITS 8-digit identification records against Dawat central registry</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-3 sm:top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Enter 8-digit ITS or Name..."
                className="pl-9 pr-3 py-2 text-xs bg-[#F8FAFC] border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EAB308]/40 w-full font-mono text-slate-900 min-h-[44px] sm:min-h-0"
              />
            </div>
            <button
              type="button"
              onClick={() => onQuickAction('ITS Lookup Search')}
              className="px-4 py-2 text-xs font-black bg-[#EAB308] hover:bg-[#D4AF37] text-[#0F172A] rounded-lg transition-colors shadow-xs min-h-[44px] sm:min-h-0 flex items-center justify-center shrink-0"
            >
              Verify ITS
            </button>
          </div>
        </div>

        {/* Detailed Member Card Example */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-[#D97706]/30 bg-white space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#0F172A]">Head of Family (HOF)</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#B45309]">HOF #324</span>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-[#0F172A]">Mulla Shabbir Bhai Fakhri</p>
              <p className="text-xs text-slate-500 font-mono">ITS: 30489122</p>
              <p className="text-xs text-slate-600">Building 4, Flat 302, Burhani Park</p>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between text-xs">
              <span className="text-slate-500">Thaali: #042</span>
              <span className="text-[#059669] font-bold">Active</span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-[#D97706]/30 bg-white space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#0F172A]">Family Member (FM)</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">FM #01</span>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-[#0F172A]">Fatema Bai Fakhri</p>
              <p className="text-xs text-slate-500 font-mono">ITS: 30489123</p>
              <p className="text-xs text-slate-600">Wife of HOF</p>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between text-xs">
              <span className="text-slate-500">Sabil Link: Unified</span>
              <span className="text-[#B45309] font-bold">Linked</span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-[#D97706]/30 bg-white space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#0F172A]">Family Member (FM)</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">FM #02</span>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-[#0F172A]">Ali Asghar Fakhri</p>
              <p className="text-xs text-slate-500 font-mono">ITS: 30489124</p>
              <p className="text-xs text-slate-600">Son (Student - MSB)</p>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between text-xs">
              <span className="text-slate-500">MSB ID: 10492</span>
              <span className="text-[#059669] font-bold">Active</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. Financial & Takhmeen
  if (categoryId === 'financial-takhmeen') {
    return (
      <div className="bg-white border border-[#D97706]/30 rounded-xl p-4 sm:p-5 lg:p-6 shadow-md space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-[#0F172A]">Financial Ledger & Takhmeen Assessment</h2>
            <p className="text-xs text-slate-500">Manage Takhmeen commitments, receipt sequences, and income/expense allocations</p>
          </div>
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => onQuickAction('Add Income Entry')}
              className="w-full sm:w-auto px-3.5 py-2 text-xs font-black bg-[#EAB308] hover:bg-[#D4AF37] text-[#0F172A] rounded-lg shadow-xs transition-colors min-h-[44px] sm:min-h-0 flex items-center justify-center"
            >
              + Record Payment
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-[#D97706]/40 bg-white">
            <span className="text-xs font-bold text-[#B45309]">Total 1447 Takhmeen Target</span>
            <p className="text-xl font-black text-[#0F172A] mt-1">₹ 1,10,00,000</p>
            <p className="text-xs text-[#B45309] font-medium mt-1">320 out of 324 HOF Assessed</p>
          </div>
          <div className="p-4 rounded-xl border border-[#059669]/40 bg-white">
            <span className="text-xs font-bold text-[#059669]">Total Collected To Date</span>
            <p className="text-xl font-black text-[#0F172A] mt-1">₹ 84,60,000</p>
            <p className="text-xs text-[#059669] font-medium mt-1">76.9% Realization Rate</p>
          </div>
          <div className="p-4 rounded-xl border border-[#E11D48]/40 bg-white">
            <span className="text-xs font-bold text-[#E11D48]">Outstanding Balance</span>
            <p className="text-xl font-black text-[#E11D48] mt-1">₹ 25,40,000</p>
            <p className="text-xs text-slate-500 mt-1">4 Takhmeen Waivers Pending</p>
          </div>
        </div>
      </div>
    );
  }

  // 4. Faiz & Services
  if (categoryId === 'faiz-services') {
    return (
      <div className="bg-white border border-[#D97706]/30 rounded-xl p-4 sm:p-5 lg:p-6 shadow-md space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-[#0F172A]">Faiz al-Mawaid al-Burhaniyah (FMB) Thaali Operations</h2>
            <p className="text-xs text-slate-500">Thaali distribution status, delivery routes, pause schedules, and hall bookings</p>
          </div>
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => onQuickAction('Manage Thaali Exceptions')}
              className="w-full sm:w-auto px-3.5 py-2 text-xs font-black bg-[#EAB308] hover:bg-[#D4AF37] text-[#0F172A] rounded-lg shadow-xs transition-colors min-h-[44px] sm:min-h-0 flex items-center justify-center"
            >
              Update Thaali Status
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-[#059669]/40 bg-white">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#059669]">Active Thaalis</span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#059669]"></span>
            </div>
            <p className="text-2xl font-black text-[#0F172A] mt-2">312</p>
            <p className="text-xs text-[#059669] mt-1">Receiving daily barakat</p>
          </div>

          <div className="p-4 rounded-xl border border-[#D97706]/40 bg-white">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#D97706]">Paused / Safar</span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#EAB308]"></span>
            </div>
            <p className="text-2xl font-black text-[#0F172A] mt-2">8</p>
            <p className="text-xs text-[#B45309] mt-1">Scheduled resumption next week</p>
          </div>

          <div className="p-4 rounded-xl border border-[#E11D48]/40 bg-white">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#E11D48]">Blocked / Review</span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#E11D48]"></span>
            </div>
            <p className="text-2xl font-black text-[#E11D48] mt-2">4</p>
            <p className="text-xs text-rose-600 mt-1">Pending address re-verification</p>
          </div>
        </div>
      </div>
    );
  }

  // Fallback for reports, settings, etc.
  return (
    <div className="bg-white border border-[#D97706]/30 rounded-xl p-6 shadow-md space-y-4">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-base font-bold text-[#0F172A]">{subItemLabel} Module</h2>
        <p className="text-xs text-slate-500">Standardized ERP administrative sub-system interface</p>
      </div>
      <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-lg">
        <ShieldCheck className="w-10 h-10 text-[#EAB308] mx-auto mb-3" />
        <p className="text-sm font-semibold text-slate-800">Module Initialized: {subItemLabel}</p>
        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
          Active session verified for Super Admin. Data synchronization and audit hooks are armed.
        </p>
        <button
          type="button"
          onClick={() => onQuickAction(`Launch ${subItemLabel}`)}
          className="mt-4 px-4 py-2 text-xs font-black bg-[#EAB308] hover:bg-[#D4AF37] text-[#0F172A] rounded-lg shadow-xs transition-colors"
        >
          Initialize {subItemLabel} Actions
        </button>
      </div>
    </div>
  );
}
