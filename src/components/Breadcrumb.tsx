import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbProps {
  categoryTitle: string;
  subItemLabel: string;
  financialYear: string;
  onNavigateHome: () => void;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  categoryTitle,
  subItemLabel,
  financialYear,
  onNavigateHome,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#D97706]/25 gap-3">
      {/* Breadcrumb Hierarchy */}
      <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-xs text-slate-500">
        <button
          type="button"
          onClick={onNavigateHome}
          className="flex items-center text-slate-500 hover:text-[#B45309] transition-colors"
          title="Go to Overview"
        >
          <Home className="w-3.5 h-3.5" />
        </button>

        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />

        <span className="font-medium text-slate-600">
          {categoryTitle}
        </span>

        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />

        {/* Gold Pill Badge */}
        <span className="font-bold text-[#B45309] bg-[#FEF3C7] px-2.5 py-0.5 rounded-full border border-[#D97706]/40 shadow-xs">
          {subItemLabel}
        </span>
      </nav>

      {/* Hijri Cycle Indicator */}
      <div className="flex items-center space-x-2 text-xs">
        <span className="text-slate-500 font-medium">Active Fiscal Cycle:</span>
        <span className="font-semibold text-slate-800 bg-white border border-[#D97706]/30 px-2.5 py-1 rounded-md shadow-xs">
          {financialYear}
        </span>
      </div>
    </div>
  );
};
