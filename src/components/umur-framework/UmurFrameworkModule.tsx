import React, { useState, useMemo } from 'react';
import {
  Compass,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Plus,
  Search,
  Filter,
  Users,
  Briefcase,
  FileText,
  DollarSign,
  TrendingUp,
  XCircle,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  X,
  Printer,
  Calendar,
} from 'lucide-react';
import {
  UmurDepartment,
  UmurProject,
  CancelledVoucher,
  getUmurDepartments,
  saveUmurDepartments,
  getUmurProjects,
  saveUmurProjects,
  getCancelledVouchers,
  saveCancelledVouchers,
} from '../../utils/part4Management';
import { UserProfile, FinancialYear } from '../../types';

interface UmurFrameworkModuleProps {
  currentUser: UserProfile;
  activeSubItemId: string;
  subItemLabel: string;
  financialYear: FinancialYear;
  showToast: (msg: string) => void;
  canAdd?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}

export const UmurFrameworkModule: React.FC<UmurFrameworkModuleProps> = ({
  currentUser,
  activeSubItemId,
  financialYear,
  showToast,
  canAdd = true,
  canEdit = true,
  canDelete = true,
}) => {
  const [departments, setDepartments] = useState<UmurDepartment[]>(getUmurDepartments);
  const [projects, setProjects] = useState<UmurProject[]>(getUmurProjects);
  const [cancelledVouchers, setCancelledVouchers] = useState<CancelledVoucher[]>(getCancelledVouchers);

  // Active view: 'all' (central dashboard), or a specific umur ID, or 'cancelled-vouchers'
  const [selectedUmurId, setSelectedUmurId] = useState<string>(() => {
    if (activeSubItemId && activeSubItemId !== 'umur-framework') {
      return activeSubItemId;
    }
    return 'umur-dashboard';
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showVoidVoucherModal, setShowVoidVoucherModal] = useState(false);

  // Form States
  const [projectForm, setProjectForm] = useState({
    umurId: 'umur-diniyah',
    title: '',
    description: '',
    assignedLead: '',
    dueDate: '2026-12-31',
    budget: '',
    priority: 'High' as UmurProject['priority'],
    kpiMetric: '',
  });

  const [voidForm, setVoidForm] = useState({
    voucherNo: '',
    module: 'Trust Expense Entry',
    amount: '',
    partyName: '',
    reason: '',
    authorizationRef: 'AUTH-JANAB-1447',
  });

  // Department Aggregates
  const totalAllocatedBudget = useMemo(() => {
    return departments.reduce((sum, d) => sum + d.allocatedBudget, 0);
  }, [departments]);

  const totalSpentBudget = useMemo(() => {
    return departments.reduce((sum, d) => sum + d.spentBudget, 0);
  }, [departments]);

  const activeDepartment = useMemo(() => {
    return departments.find((d) => d.id === selectedUmurId);
  }, [departments, selectedUmurId]);

  const filteredProjects = useMemo(() => {
    let list = projects;
    if (selectedUmurId !== 'umur-dashboard' && selectedUmurId !== 'cancelled-vouchers') {
      list = list.filter((p) => p.umurId === selectedUmurId);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((p) => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }
    return list;
  }, [projects, selectedUmurId, searchQuery]);

  // Handlers
  const handleSaveProject = (e: React.FormEvent) => {
    e.preventDefault();
    const b = parseFloat(projectForm.budget);
    if (!projectForm.title || isNaN(b)) {
      alert('Please fill in Initiative Title and valid Budget.');
      return;
    }
    const newPrj: UmurProject = {
      id: `PRJ-${Date.now()}`,
      umurId: projectForm.umurId,
      title: projectForm.title,
      description: projectForm.description,
      assignedLead: projectForm.assignedLead || currentUser.displayName,
      startDate: new Date().toISOString().split('T')[0],
      dueDate: projectForm.dueDate,
      budget: b,
      spent: 0,
      status: 'In Progress',
      priority: projectForm.priority,
      kpiMetric: projectForm.kpiMetric || 'Pending review',
    };
    const updated = [newPrj, ...projects];
    setProjects(updated);
    saveUmurProjects(updated);
    setShowProjectModal(false);
    setProjectForm({
      umurId: 'umur-diniyah',
      title: '',
      description: '',
      assignedLead: '',
      dueDate: '2026-12-31',
      budget: '',
      priority: 'High',
      kpiMetric: '',
    });
    showToast(`Initiative "${newPrj.title}" registered successfully.`);
  };

  const handleVoidVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(voidForm.amount);
    if (!voidForm.voucherNo || isNaN(amt) || !voidForm.reason) {
      alert('Please enter Voucher #, Amount, and Cancellation Reason.');
      return;
    }
    const newVoid: CancelledVoucher = {
      id: `CV-${Date.now()}`,
      voucherNo: voidForm.voucherNo,
      module: voidForm.module,
      originalDate: new Date().toISOString().split('T')[0],
      cancelledDate: new Date().toISOString().split('T')[0],
      cancelledBy: currentUser.username,
      amount: amt,
      partyName: voidForm.partyName,
      reason: voidForm.reason,
      authorizationRef: voidForm.authorizationRef,
      status: 'Voided',
    };
    const updated = [newVoid, ...cancelledVouchers];
    setCancelledVouchers(updated);
    saveCancelledVouchers(updated);
    setShowVoidVoucherModal(false);
    setVoidForm({
      voucherNo: '',
      module: 'Trust Expense Entry',
      amount: '',
      partyName: '',
      reason: '',
      authorizationRef: 'AUTH-JANAB-1447',
    });
    showToast(`Voucher ${newVoid.voucherNo} logged as Cancelled/Voided.`);
  };

  return (
    <div className="space-y-6">
      {/* 12 Umur Selector Bar */}
      <div className="bg-white border border-[#D97706]/30 rounded-xl p-2.5 shadow-xs">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <Compass className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-bold text-slate-800">12 Umur Executive Institutional Framework</span>
          </div>
          <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
            {financialYear}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => setSelectedUmurId('umur-dashboard')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              selectedUmurId === 'umur-dashboard'
                ? 'bg-[#0F172A] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            All 12 Umur Overview
          </button>

          {departments.map((dept) => {
            const isSelected = selectedUmurId === dept.id;
            return (
              <button
                key={dept.id}
                type="button"
                onClick={() => setSelectedUmurId(dept.id)}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer flex items-center space-x-1.5 ${
                  isSelected
                    ? 'bg-[#EAB308] text-[#0F172A] font-black shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: dept.colorTag }} />
                <span>{dept.orderNumber}. {dept.name}</span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setSelectedUmurId('cancelled-vouchers')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
              selectedUmurId === 'cancelled-vouchers'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'text-rose-700 hover:bg-rose-50'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Cancelled Vouchers</span>
          </button>
        </div>
      </div>

      {/* VIEW A: CENTRAL DASHBOARD (ALL 12 DEPARTMENTS) */}
      {selectedUmurId === 'umur-dashboard' && (
        <div className="space-y-6">
          {/* Top Banner & Financial Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase">Total Framework Budget</span>
              <p className="text-2xl font-black text-slate-900 mt-1">
                ₹{totalAllocatedBudget.toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-slate-400 mt-1">Allocated across 12 institutional departments</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase">Utilized Expenditure</span>
              <p className="text-2xl font-black text-amber-700 mt-1">
                ₹{totalSpentBudget.toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-emerald-600 font-semibold mt-1">
                {Math.round((totalSpentBudget / totalAllocatedBudget) * 100)}% budget utilization rate
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase">Active Institutional Projects</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{projects.length}</p>
              <p className="text-xs text-blue-600 font-semibold mt-1">All 12 departments actively reporting</p>
            </div>
          </div>

          {/* 12 Departments Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departments.map((dept) => {
              const utilPct = Math.round((dept.spentBudget / dept.allocatedBudget) * 100);
              return (
                <div
                  key={dept.id}
                  onClick={() => setSelectedUmurId(dept.id)}
                  className="bg-white border border-slate-200 hover:border-amber-400 rounded-xl p-4 shadow-xs transition-all hover:shadow-md cursor-pointer space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 font-mono">
                        Umur #{dept.orderNumber}
                      </span>
                      <span className="font-serif text-sm font-bold text-amber-900">{dept.arabicName}</span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: dept.colorTag }} />
                      <span>{dept.name}</span>
                    </h4>

                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {dept.keyResponsibility}
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-500">Lead Officer:</span>
                      <span className="text-slate-800 truncate max-w-[160px]">{dept.headOfficerName}</span>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                        <span>Budget Spent: ₹{dept.spentBudget.toLocaleString('en-IN')}</span>
                        <span className="font-bold text-slate-700">{utilPct}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(utilPct, 100)}%`,
                            backgroundColor: dept.colorTag,
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-[11px]">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {dept.status}
                      </span>
                      <span className="text-amber-800 font-semibold hover:underline flex items-center">
                        <span>View Department</span>
                        <ChevronRight className="w-3 h-3 ml-0.5" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW B: SPECIFIC DEPARTMENT INTERFACE */}
      {selectedUmurId !== 'umur-dashboard' && selectedUmurId !== 'cancelled-vouchers' && activeDepartment && (
        <div className="space-y-6">
          {/* Department Header Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-sm"
                  style={{ backgroundColor: activeDepartment.colorTag }}
                >
                  {activeDepartment.orderNumber}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-black text-slate-900">{activeDepartment.name}</h3>
                    <span className="text-sm font-bold font-serif text-amber-800 bg-amber-50 px-2 py-0.5 rounded">
                      {activeDepartment.arabicName}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{activeDepartment.keyResponsibility}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {canAdd && (
                  <button
                    type="button"
                    onClick={() => {
                      setProjectForm({ ...projectForm, umurId: activeDepartment.id });
                      setShowProjectModal(true);
                    }}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-black text-[#0F172A] bg-[#EAB308] hover:bg-[#D4AF37] rounded-lg transition-all shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Launch Initiative</span>
                  </button>
                )}
              </div>
            </div>

            {/* Department Operational Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-500 font-semibold">Convening Head</span>
                <p className="font-bold text-slate-900 text-sm mt-0.5">{activeDepartment.headOfficerName}</p>
                <p className="text-[10px] text-slate-400 font-mono">ITS {activeDepartment.headOfficerIts}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-500 font-semibold">Allocated Budget</span>
                <p className="font-black text-slate-900 text-sm mt-0.5">
                  ₹{activeDepartment.allocatedBudget.toLocaleString('en-IN')}
                </p>
                <p className="text-[10px] text-slate-400 font-mono">1447-1448 Annual</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-500 font-semibold">Expended Amount</span>
                <p className="font-black text-amber-800 text-sm mt-0.5">
                  ₹{activeDepartment.spentBudget.toLocaleString('en-IN')}
                </p>
                <p className="text-[10px] text-emerald-600 font-semibold">
                  Balance: ₹{(activeDepartment.allocatedBudget - activeDepartment.spentBudget).toLocaleString('en-IN')}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-500 font-semibold">Compliance Rating</span>
                <p className="font-bold text-emerald-700 text-sm mt-0.5">{activeDepartment.status}</p>
                <p className="text-[10px] text-slate-400 font-mono">Verified by Janab Amil Saheb</p>
              </div>
            </div>
          </div>

          {/* Department Initiatives & Projects */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <FileText className="w-4 h-4 text-amber-600" />
                <span>Departmental Initiatives & Action Tasks</span>
              </h4>
              <span className="text-xs text-slate-500 font-mono">{filteredProjects.length} Initiatives</span>
            </div>

            {filteredProjects.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No active initiatives registered for this department. Click "Launch Initiative" to add one.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredProjects.map((prj) => (
                  <div
                    key={prj.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white transition-all space-y-2 text-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <span className="font-bold text-sm text-slate-900">{prj.title}</span>
                        <p className="text-slate-500 text-xs">{prj.description}</p>
                      </div>
                      <div className="flex items-center space-x-2 shrink-0">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            prj.priority === 'High'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {prj.priority} Priority
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900">
                          {prj.status}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200/60 text-[11px]">
                      <div>
                        <span className="text-slate-400">Assigned Lead:</span>
                        <p className="font-semibold text-slate-800">{prj.assignedLead}</p>
                      </div>
                      <div>
                        <span className="text-slate-400">Target Date:</span>
                        <p className="font-semibold text-slate-800">{prj.dueDate}</p>
                      </div>
                      <div>
                        <span className="text-slate-400">Budget / Spent:</span>
                        <p className="font-bold text-slate-900">
                          ₹{prj.spent.toLocaleString('en-IN')} / ₹{prj.budget.toLocaleString('en-IN')}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-400">KPI Metric:</span>
                        <p className="font-semibold text-emerald-700">{prj.kpiMetric}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW C: CANCELLED VOUCHERS AUDIT TRAIL */}
      {selectedUmurId === 'cancelled-vouchers' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <XCircle className="w-5 h-5 text-rose-600" />
                <span>Cancelled & Voided Vouchers Audit Trail</span>
              </h3>
              <p className="text-xs text-slate-500">Official log of voided financial instruments and reversals</p>
            </div>
            {canAdd && (
              <button
                type="button"
                onClick={() => setShowVoidVoucherModal(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-black text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-all shadow-xs cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Cancelled Voucher</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 font-bold">
                  <th className="py-2.5 px-3">Voided Voucher #</th>
                  <th className="py-2.5 px-3">Module</th>
                  <th className="py-2.5 px-3">Cancelled Date</th>
                  <th className="py-2.5 px-3">Cancelled By</th>
                  <th className="py-2.5 px-3">Party Name</th>
                  <th className="py-2.5 px-3">Reason / Remarks</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3 text-right">Auth Ref</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cancelledVouchers.map((v) => (
                  <tr key={v.id} className="hover:bg-rose-50/30 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-rose-900">{v.voucherNo}</td>
                    <td className="py-2.5 px-3 text-slate-700">{v.module}</td>
                    <td className="py-2.5 px-3 text-slate-600">{v.cancelledDate}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">@{v.cancelledBy}</td>
                    <td className="py-2.5 px-3 text-slate-900 font-bold">{v.partyName}</td>
                    <td className="py-2.5 px-3 text-slate-600 max-w-xs">{v.reason}</td>
                    <td className="py-2.5 px-3 text-right font-black text-rose-700">
                      ₹{v.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-500">{v.authorizationRef}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: LAUNCH INITIATIVE */}
      {showProjectModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-amber-300 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Compass className="w-5 h-5 text-amber-600" />
                <span>Register Department Initiative</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowProjectModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProject} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Umur Department</label>
                <select
                  value={projectForm.umurId}
                  onChange={(e) => setProjectForm({ ...projectForm, umurId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-amber-500"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.orderNumber}. {d.name} ({d.arabicName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Initiative / Project Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Free Blood Group & Diabetic Screening Camp"
                  value={projectForm.title}
                  onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description & Scope</label>
                <textarea
                  rows={2}
                  placeholder="Detailed community impact and scope of the initiative..."
                  value={projectForm.description}
                  onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assigned Lead Officer</label>
                  <input
                    type="text"
                    placeholder="Officer Full Name"
                    value={projectForm.assignedLead}
                    onChange={(e) => setProjectForm({ ...projectForm, assignedLead: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Completion Date</label>
                  <input
                    type="date"
                    value={projectForm.dueDate}
                    onChange={(e) => setProjectForm({ ...projectForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Allocated Budget (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="75000"
                    value={projectForm.budget}
                    onChange={(e) => setProjectForm({ ...projectForm, budget: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-black text-slate-900 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Priority</label>
                  <select
                    value={projectForm.priority}
                    onChange={(e) => setProjectForm({ ...projectForm, priority: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Key Performance Metric (KPI)</label>
                <input
                  type="text"
                  placeholder="e.g. 250 attendees / 100% compliance"
                  value={projectForm.kpiMetric}
                  onChange={(e) => setProjectForm({ ...projectForm, kpiMetric: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowProjectModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#EAB308] hover:bg-[#D4AF37] text-[#0F172A] font-black rounded-lg cursor-pointer"
                >
                  Launch Initiative
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: LOG VOID VOUCHER */}
      {showVoidVoucherModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-rose-300 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <XCircle className="w-5 h-5 text-rose-600" />
                <span>Log Cancelled / Voided Voucher</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowVoidVoucherModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleVoidVoucher} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Voucher # to Void</label>
                  <input
                    type="text"
                    required
                    placeholder="TR-EXP-1447-099"
                    value={voidForm.voucherNo}
                    onChange={(e) => setVoidForm({ ...voidForm, voucherNo: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Originating Module</label>
                  <select
                    value={voidForm.module}
                    onChange={(e) => setVoidForm({ ...voidForm, module: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="Trust Expense Entry">Trust Expense Entry</option>
                    <option value="FMB Takhmeen Collection">FMB Takhmeen Collection</option>
                    <option value="Sabeel Collection">Sabeel Collection</option>
                    <option value="Hall Booking Receipt">Hall Booking Receipt</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Party / Payee Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Vendor or Member Name"
                    value={voidForm.partyName}
                    onChange={(e) => setVoidForm({ ...voidForm, partyName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Original Amount (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="15000"
                    value={voidForm.amount}
                    onChange={(e) => setVoidForm({ ...voidForm, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-black text-rose-700 focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Detailed Reason for Voiding</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Explain reason for cancellation e.g. duplicate entry, incorrect payment mode, check bounce..."
                  value={voidForm.reason}
                  onChange={(e) => setVoidForm({ ...voidForm, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Authorization Clearance Reference</label>
                <input
                  type="text"
                  placeholder="AUTH-JANAB-1447"
                  value={voidForm.authorizationRef}
                  onChange={(e) => setVoidForm({ ...voidForm, authorizationRef: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowVoidVoucherModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-lg cursor-pointer"
                >
                  Confirm Void & Record Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
