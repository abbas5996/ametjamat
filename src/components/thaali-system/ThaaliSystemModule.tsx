import React, { useState, useMemo } from 'react';
import {
  UtensilsCrossed, Truck, Layers, MapPin, CheckCircle2, XCircle,
  MessageSquare, Send, Hash, Printer, Search, Plus, Filter,
  Calendar, Star, Check, AlertCircle, Sparkles, UserCheck, Shield
} from 'lucide-react';
import { UserProfile, FinancialYear } from '../../types';
import {
  Distributor, DistributorType, DistributorAssignment, ThaaliFeedback,
  getStoredDistributors, saveStoredDistributors,
  getStoredDistributorTypes, saveStoredDistributorTypes,
  getStoredDistributorAssignments, saveStoredDistributorAssignments,
  getStoredThaaliFeedbacks, saveStoredThaaliFeedbacks
} from '../../utils/thaaliManagement';
import { getStoredThaalis, saveStoredThaalis } from '../../utils/fmbTakhmeen';
import { getStoredMohallahs } from '../../utils/memberMaster';
import { appendActivityLog } from '../../utils/rbac';

export type ThaaliSubTab =
  | 'distributor-master'
  | 'distributor-type-master'
  | 'assign-distributor'
  | 'active-thaali-list'
  | 'non-active-thaali-list'
  | 'thaali-feedback-list'
  | 'dispatch-list'
  | 'thaali-count'
  | 'label-printing';

interface Props {
  currentUser: UserProfile;
  activeSubItemId: string;
  subItemLabel: string;
  financialYear: FinancialYear;
  showToast: (m: string) => void;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export const ThaaliSystemModule: React.FC<Props> = ({
  currentUser,
  activeSubItemId,
  showToast,
  canAdd,
  canDelete,
}) => {
  const [distributors, setDistributors] = useState<Distributor[]>(() => getStoredDistributors());
  const [types, setTypes] = useState<DistributorType[]>(() => getStoredDistributorTypes());
  const [assignments, setAssignments] = useState<DistributorAssignment[]>(() => getStoredDistributorAssignments());
  const [feedbacks, setFeedbacks] = useState<ThaaliFeedback[]>(() => getStoredThaaliFeedbacks());
  const [thaalis, setThaalis] = useState(() => getStoredThaalis());
  const [mohallahs] = useState(() => getStoredMohallahs());

  const [activeTab, setActiveTab] = useState<ThaaliSubTab>(() => {
    return (activeSubItemId as ThaaliSubTab) || 'active-thaali-list';
  });

  React.useEffect(() => {
    if (activeSubItemId) setActiveTab(activeSubItemId as ThaaliSubTab);
  }, [activeSubItemId]);

  const activeThaalis = useMemo(() => thaalis.filter(t => t.status === 'Active'), [thaalis]);
  const nonActiveThaalis = useMemo(() => thaalis.filter(t => t.status !== 'Active'), [thaalis]);

  const tabs: { key: ThaaliSubTab; label: string; icon: React.ReactNode; count?: number; badge?: string }[] = [
    { key: 'distributor-master',      label: '1. Distributor Master',   icon: <Truck className="w-3.5 h-3.5" />,            count: distributors.length },
    { key: 'distributor-type-master', label: '2. Distributor Types',    icon: <Layers className="w-3.5 h-3.5" />,           count: types.length },
    { key: 'assign-distributor',      label: '3. Assign Distributor',   icon: <MapPin className="w-3.5 h-3.5" />,           count: assignments.length },
    { key: 'active-thaali-list',      label: '4. Active Thaali List',   icon: <CheckCircle2 className="w-3.5 h-3.5" />,     count: activeThaalis.length },
    { key: 'non-active-thaali-list',  label: '5. Non-Active Thaalis',   icon: <XCircle className="w-3.5 h-3.5" />,          count: nonActiveThaalis.length },
    { key: 'thaali-feedback-list',    label: '6. Member Feedback',      icon: <MessageSquare className="w-3.5 h-3.5" />,    count: feedbacks.filter(f => f.status === 'New').length },
    { key: 'dispatch-list',           label: '7. Kitchen Dispatch',     icon: <Send className="w-3.5 h-3.5" />,             badge: 'Live' },
    { key: 'thaali-count',            label: '8. Thaali Counts',        icon: <Hash className="w-3.5 h-3.5" /> },
    { key: 'label-printing',          label: '9. Label Printing',       icon: <Printer className="w-3.5 h-3.5" />,          badge: 'Studio' },
  ];

  return (
    <div className="space-y-6">
      {/* Sub-tab Navigation Ribbon */}
      <div className="bg-white border border-amber-300/40 rounded-xl p-1.5 shadow-xs flex items-center gap-1 overflow-x-auto select-none">
        {tabs.map(({ key, label, icon, count, badge }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === key
                ? 'bg-[#EAB308] text-slate-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-amber-50'
            }`}
          >
            {icon}
            <span>{label}</span>
            {count !== undefined && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-white/80 text-slate-900 font-mono">
                {count}
              </span>
            )}
            {badge && (
              <span className="ml-1 px-1.5 py-0.2 rounded-md text-[9px] bg-slate-900 text-amber-300 font-extrabold uppercase">
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 1. DISTRIBUTOR MASTER */}
      {activeTab === 'distributor-master' && (
        <DistributorMasterSubpage
          distributors={distributors}
          setDistributors={setDistributors}
          types={types}
          currentUser={currentUser}
          showToast={showToast}
          canAdd={canAdd}
        />
      )}

      {/* 2. DISTRIBUTOR TYPE MASTER */}
      {activeTab === 'distributor-type-master' && (
        <DistributorTypeSubpage types={types} setTypes={setTypes} showToast={showToast} canAdd={canAdd} />
      )}

      {/* 3. ASSIGN DISTRIBUTOR */}
      {activeTab === 'assign-distributor' && (
        <AssignDistributorSubpage
          assignments={assignments}
          setAssignments={setAssignments}
          distributors={distributors}
          mohallahs={mohallahs}
          showToast={showToast}
          canAdd={canAdd}
        />
      )}

      {/* 4. ACTIVE THAALI LIST */}
      {activeTab === 'active-thaali-list' && (
        <ActiveThaaliListSubpage
          thaalis={activeThaalis}
          allThaalis={thaalis}
          setThaalis={setThaalis}
          showToast={showToast}
        />
      )}

      {/* 5. NON-ACTIVE THAALI LIST */}
      {activeTab === 'non-active-thaali-list' && (
        <NonActiveThaaliListSubpage
          thaalis={nonActiveThaalis}
          allThaalis={thaalis}
          setThaalis={setThaalis}
          showToast={showToast}
        />
      )}

      {/* 6. THAALI FEEDBACK LIST */}
      {activeTab === 'thaali-feedback-list' && (
        <ThaaliFeedbackSubpage feedbacks={feedbacks} setFeedbacks={setFeedbacks} showToast={showToast} />
      )}

      {/* 7. DISPATCH LIST */}
      {activeTab === 'dispatch-list' && (
        <DispatchListSubpage thaalis={activeThaalis} showToast={showToast} />
      )}

      {/* 8. THAALI COUNT */}
      {activeTab === 'thaali-count' && (
        <ThaaliCountSubpage thaalis={activeThaalis} />
      )}

      {/* 9. LABEL PRINTING */}
      {activeTab === 'label-printing' && (
        <LabelPrintingSubpage thaalis={activeThaalis} showToast={showToast} />
      )}
    </div>
  );
};

// ============================================================================
// SUBPAGE IMPLEMENTATIONS: THAALI SYSTEM
// ============================================================================

const DistributorMasterSubpage: React.FC<{
  distributors: Distributor[];
  setDistributors: React.Dispatch<React.SetStateAction<Distributor[]>>;
  types: DistributorType[];
  currentUser: UserProfile;
  showToast: (m: string) => void;
  canAdd: boolean;
}> = ({ distributors, setDistributors, types, currentUser, showToast, canAdd }) => {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    code: `DIS-${String(distributors.length + 1).padStart(2, '0')}`,
    fullName: '',
    mobileNumber: '',
    distributorTypeId: types[0]?.id || '',
    vehicleNumber: '',
    assignedZone: 'Sector A (Saifee Mohallah)',
    maxThaalis: 35,
  });

  const handleCreate = () => {
    if (!form.fullName || !form.mobileNumber) {
      showToast('Name and mobile number are required.');
      return;
    }
    const typeObj = types.find(t => t.id === form.distributorTypeId);
    const newDist: Distributor = {
      id: `dist-${Date.now()}`,
      ...form,
      distributorTypeName: typeObj?.name || 'Runner',
      status: 'Active',
      createdAt: new Date().toISOString(),
    };
    const updated = [...distributors, newDist];
    setDistributors(updated);
    saveStoredDistributors(updated);
    showToast(`Distributor ${newDist.fullName} registered.`);
    setShowModal(false);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border border-amber-300/40 rounded-xl p-4 shadow-xs flex justify-between items-center">
        <div>
          <h4 className="font-bold text-sm text-slate-900">FMB Delivery Personnel & Runners Directory</h4>
          <p className="text-xs text-slate-500">Manage delivery drivers, walking sevadars and vehicle allocations.</p>
        </div>
        {canAdd && (
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-lg text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Distributor</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {distributors.map((d) => (
          <div key={d.id} className="bg-white border border-amber-200/80 rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px] font-bold">{d.code}</span>
                <h4 className="font-bold text-sm text-slate-900 mt-1">{d.fullName}</h4>
                <p className="text-xs text-amber-700 font-semibold">{d.distributorTypeName}</p>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                {d.status}
              </span>
            </div>
            <div className="text-xs text-slate-600 space-y-1">
              <p>Mobile: <span className="font-mono font-bold text-slate-800">{d.mobileNumber}</span></p>
              {d.vehicleNumber && <p>Vehicle: <span className="font-mono font-bold">{d.vehicleNumber}</span></p>}
              <p>Zone: <span className="font-semibold">{d.assignedZone}</span></p>
            </div>
            <div className="pt-2 border-t border-slate-100 flex justify-between text-[11px] text-slate-500 font-mono">
              <span>Capacity: {d.maxThaalis} Thaalis / Run</span>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-base text-slate-900">Add New Distributor</h3>
              <button type="button" onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  placeholder="e.g. Shabbir Bhai Rampurawala"
                  className="w-full border rounded px-3 py-2 font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Mobile Number *</label>
                <input
                  type="text"
                  value={form.mobileNumber}
                  onChange={(e) => setForm({ ...form, mobileNumber: e.target.value })}
                  placeholder="10 digit phone"
                  className="w-full border rounded px-3 py-2 font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Delivery Mechanism Type</label>
                <select
                  value={form.distributorTypeId}
                  onChange={(e) => setForm({ ...form, distributorTypeId: e.target.value })}
                  className="w-full border rounded px-3 py-2 cursor-pointer"
                >
                  {types.map(t => (
                    <option key={t.id} value={t.id}>{t.name} (Cap: {t.standardCapacity})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Vehicle License Plate #</label>
                <input
                  type="text"
                  value={form.vehicleNumber}
                  onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value.toUpperCase() })}
                  placeholder="e.g. GJ-05-AB-1234"
                  className="w-full border rounded px-3 py-2 font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Primary Mohallah Zone</label>
                <input
                  type="text"
                  value={form.assignedZone}
                  onChange={(e) => setForm({ ...form, assignedZone: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border rounded-lg text-xs font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreate}
                className="px-5 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-lg text-xs"
              >
                Register Distributor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DistributorTypeSubpage: React.FC<{
  types: DistributorType[];
  setTypes: React.Dispatch<React.SetStateAction<DistributorType[]>>;
  showToast: (m: string) => void;
  canAdd: boolean;
}> = ({ types }) => {
  return (
    <div className="space-y-4">
      <div className="bg-white border border-amber-300/40 rounded-xl p-4 shadow-xs">
        <h4 className="font-bold text-sm text-slate-900">Distributor Classification Categories</h4>
        <p className="text-xs text-slate-500">Defines runner delivery methods, vehicle requirement, and standard crate capacities.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {types.map((t) => (
          <div key={t.id} className="bg-white border border-amber-200/80 rounded-xl p-5 shadow-xs space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-mono text-[10px] font-bold">{t.code}</span>
                <h4 className="font-bold text-sm text-slate-900 mt-1">{t.name}</h4>
              </div>
              <span className="text-xs font-bold text-slate-500">Standard: {t.standardCapacity} Thaalis</span>
            </div>
            <p className="text-xs text-slate-600">{t.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const AssignDistributorSubpage: React.FC<{
  assignments: DistributorAssignment[];
  setAssignments: React.Dispatch<React.SetStateAction<DistributorAssignment[]>>;
  distributors: Distributor[];
  mohallahs: any[];
  showToast: (m: string) => void;
  canAdd: boolean;
}> = ({ assignments, setAssignments, distributors, mohallahs, showToast, canAdd }) => {
  return (
    <div className="space-y-4">
      <div className="bg-white border border-amber-300/40 rounded-xl p-4 shadow-xs">
        <h4 className="font-bold text-sm text-slate-900">Distributor Route & Mohallah Sector Mapping</h4>
        <p className="text-xs text-slate-500">Assign specific runners to buildings, sectors and delivery shifts.</p>
      </div>
      <div className="bg-white border border-amber-300/40 rounded-xl shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px]">
            <tr>
              <th className="px-4 py-3">Route Title</th>
              <th className="px-4 py-3">Assigned Runner</th>
              <th className="px-4 py-3">Mohallah Sector</th>
              <th className="px-4 py-3">Building Coverage</th>
              <th className="px-4 py-3 text-center">Assigned Thaalis</th>
              <th className="px-4 py-3 text-center">Shift</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {assignments.map((a) => (
              <tr key={a.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-bold text-slate-900">{a.routeTitle}</td>
                <td className="px-4 py-3 font-semibold text-amber-800">{a.distributorName}</td>
                <td className="px-4 py-3 text-slate-700">{a.mohallahName}</td>
                <td className="px-4 py-3 text-slate-500">{a.buildingCoverage}</td>
                <td className="px-4 py-3 text-center font-mono font-bold text-emerald-700">{a.totalAssignedThaalis}</td>
                <td className="px-4 py-3 text-center font-bold text-[10px] text-slate-600 uppercase">{a.shift}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ActiveThaaliListSubpage: React.FC<{
  thaalis: any[];
  allThaalis: any[];
  setThaalis: (t: any[]) => void;
  showToast: (m: string) => void;
}> = ({ thaalis, allThaalis, setThaalis, showToast }) => {
  const [search, setSearch] = useState('');

  const handlePause = (id: string) => {
    const reason = prompt('Reason for pausing Thaali (e.g. Travel, Vacation, Medical):') || 'Personal Request';
    const updated = allThaalis.map(t => t.id === id ? { ...t, status: 'Vacation', reason } : t);
    setThaalis(updated);
    saveStoredThaalis(updated);
    showToast('Thaali paused and moved to Non-Active list.');
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return thaalis.filter(t => !q || t.hofName.toLowerCase().includes(q) || t.thaaliNo.includes(q) || t.itsNumber.includes(q));
  }, [thaalis, search]);

  return (
    <div className="space-y-4">
      <div className="bg-white border border-amber-300/40 rounded-xl p-4 shadow-xs flex justify-between items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search active thaalis by Thaali #, Name, ITS..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border rounded-lg text-xs"
          />
        </div>
        <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          {filtered.length} Active Today
        </span>
      </div>

      <div className="bg-white border border-amber-300/40 rounded-xl shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px]">
            <tr>
              <th className="px-4 py-3">Thaali #</th>
              <th className="px-4 py-3">Member & ITS</th>
              <th className="px-4 py-3">Delivery Address</th>
              <th className="px-4 py-3">Size / Tier</th>
              <th className="px-4 py-3">Delivery Type</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-mono font-bold text-amber-700">{t.thaaliNo}</td>
                <td className="px-4 py-3 font-bold text-slate-900">{t.hofName}</td>
                <td className="px-4 py-3 text-slate-600 max-w-xs truncate">{t.assignedAddress}</td>
                <td className="px-4 py-3 font-bold text-slate-700">{t.tier}</td>
                <td className="px-4 py-3 text-slate-500">{t.deliveryType}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => handlePause(t.id)}
                    className="px-2.5 py-1 text-[11px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded cursor-pointer"
                  >
                    Pause (Safar)
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const NonActiveThaaliListSubpage: React.FC<{
  thaalis: any[];
  allThaalis: any[];
  setThaalis: (t: any[]) => void;
  showToast: (m: string) => void;
}> = ({ thaalis, allThaalis, setThaalis, showToast }) => {
  const handleResume = (id: string) => {
    const updated = allThaalis.map(t => t.id === id ? { ...t, status: 'Active', reason: undefined } : t);
    setThaalis(updated);
    saveStoredThaalis(updated);
    showToast('Thaali resumed to Active status!');
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border border-amber-300/40 rounded-xl p-4 shadow-xs">
        <h4 className="font-bold text-sm text-slate-900">Non-Active / Paused Thaalis (Vacation / Safar / Closed)</h4>
        <p className="text-xs text-slate-500">Mumineen currently traveling or on temporary pause.</p>
      </div>

      <div className="bg-white border border-amber-300/40 rounded-xl shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px]">
            <tr>
              <th className="px-4 py-3">Thaali #</th>
              <th className="px-4 py-3">Member & ITS</th>
              <th className="px-4 py-3">Pause Reason</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {thaalis.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-mono font-bold text-amber-700">{t.thaaliNo}</td>
                <td className="px-4 py-3 font-bold text-slate-900">{t.hofName}</td>
                <td className="px-4 py-3 text-slate-600">{t.reason || 'Safar vacation'}</td>
                <td className="px-4 py-3 font-bold text-rose-700">{t.status}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => handleResume(t.id)}
                    className="px-3 py-1 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 rounded font-bold text-xs cursor-pointer"
                  >
                    Resume Thaali
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ThaaliFeedbackSubpage: React.FC<{
  feedbacks: ThaaliFeedback[];
  setFeedbacks: React.Dispatch<React.SetStateAction<ThaaliFeedback[]>>;
  showToast: (m: string) => void;
}> = ({ feedbacks, setFeedbacks, showToast }) => {
  const handleResolve = (id: string) => {
    const reply = prompt('Enter kitchen response / resolution note:') || 'Reviewed by Head Chef.';
    const updated = feedbacks.map(f => f.id === id ? { ...f, status: 'Resolved' as const, adminResponse: reply } : f);
    setFeedbacks(updated);
    saveStoredThaaliFeedbacks(updated);
    showToast('Feedback resolved.');
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border border-amber-300/40 rounded-xl p-4 shadow-xs">
        <h4 className="font-bold text-sm text-slate-900">Member Food Quality & Delivery Feedbacks</h4>
        <p className="text-xs text-slate-500">Daily taste, portion size and delivery timing reviews submitted by Mumineen.</p>
      </div>

      <div className="space-y-3">
        {feedbacks.map((f) => (
          <div key={f.id} className="bg-white border border-amber-200/80 rounded-xl p-4 shadow-xs space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <span className="font-bold text-xs text-slate-900">{f.hofName}</span>
                <span className="font-mono text-amber-700 font-bold ml-2">Thaali: {f.thaaliNo}</span>
              </div>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`w-3.5 h-3.5 ${i < f.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                ))}
              </div>
            </div>
            <p className="text-xs text-slate-700 font-medium">"{f.comments}"</p>
            <div className="flex flex-wrap gap-3 text-[11px] text-slate-500 font-mono">
              <span>Portion: <b>{f.portionQuality}</b></span>
              <span>Timing: <b>{f.deliveryTiming}</b></span>
              <span>Taste: <b>{f.tasteRating}</b></span>
              <span>Date: {f.date}</span>
            </div>
            {f.adminResponse && (
              <p className="text-[11px] text-emerald-800 bg-emerald-50 p-2 rounded">
                Kitchen Response: {f.adminResponse}
              </p>
            )}
            {f.status === 'New' && (
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleResolve(f.id)}
                  className="px-3 py-1 bg-slate-900 text-amber-300 rounded text-xs font-bold cursor-pointer"
                >
                  Respond & Resolve
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const DispatchListSubpage: React.FC<{
  thaalis: any[];
  showToast: (m: string) => void;
}> = ({ thaalis, showToast }) => {
  const [checkedIds, setCheckedIds] = useState<Record<string, boolean>>({});

  const toggleCheck = (id: string) => {
    setCheckedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border border-amber-300/40 rounded-xl p-4 shadow-xs flex justify-between items-center">
        <div>
          <h4 className="font-bold text-sm text-slate-900">Today's Kitchen Dispatch Checklist</h4>
          <p className="text-xs text-slate-500">Live packaging status per Thaali before loading into delivery vans.</p>
        </div>
        <button
          type="button"
          onClick={() => showToast('Dispatch batch sheet printed for kitchen loading staff.')}
          className="px-4 py-2 bg-slate-900 text-amber-300 font-bold rounded-lg text-xs cursor-pointer flex items-center gap-1.5"
        >
          <Printer className="w-4 h-4" />
          <span>Print Loading Sheet</span>
        </button>
      </div>

      <div className="bg-white border border-amber-300/40 rounded-xl shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px]">
            <tr>
              <th className="px-4 py-3 text-center">Packed</th>
              <th className="px-4 py-3">Thaali #</th>
              <th className="px-4 py-3">Member Name</th>
              <th className="px-4 py-3">Mohallah</th>
              <th className="px-4 py-3">Size</th>
              <th className="px-4 py-3 text-center">Ready for Van</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono">
            {thaalis.map((t) => {
              const packed = !!checkedIds[t.id];
              return (
                <tr key={t.id} className={packed ? 'bg-emerald-50/40' : 'hover:bg-slate-50'}>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={packed}
                      onChange={() => toggleCheck(t.id)}
                      className="w-4 h-4 accent-emerald-500 cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-3 font-bold text-amber-700">{t.thaaliNo}</td>
                  <td className="px-4 py-3 font-sans font-bold text-slate-900">{t.hofName}</td>
                  <td className="px-4 py-3 font-sans text-slate-700">{t.mohallahName}</td>
                  <td className="px-4 py-3 font-sans">{t.tier}</td>
                  <td className="px-4 py-3 text-center font-sans">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      packed ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {packed ? 'Ready' : 'Pending Pack'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ThaaliCountSubpage: React.FC<{ thaalis: any[] }> = ({ thaalis }) => {
  const full = thaalis.filter(t => t.tier === 'Full').length;
  const half = thaalis.filter(t => t.tier === 'Half').length;
  const special = thaalis.filter(t => t.tier === 'Special').length;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="bg-white border border-amber-300/40 rounded-xl p-6 shadow-xs space-y-4">
        <h4 className="font-black text-base text-slate-900">Today's Live Thaali Preparation Headcount</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
            <p className="text-[11px] font-bold text-slate-500 uppercase">Total Active</p>
            <p className="text-3xl font-black text-slate-900 mt-1">{thaalis.length}</p>
          </div>
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
            <p className="text-[11px] font-bold text-emerald-700 uppercase">Full Thaali</p>
            <p className="text-3xl font-black text-emerald-800 mt-1">{full}</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
            <p className="text-[11px] font-bold text-blue-700 uppercase">Half Thaali</p>
            <p className="text-3xl font-black text-blue-800 mt-1">{half}</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
            <p className="text-[11px] font-bold text-purple-700 uppercase">Special Diet</p>
            <p className="text-3xl font-black text-purple-800 mt-1">{special}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const LabelPrintingSubpage: React.FC<{
  thaalis: any[];
  showToast: (m: string) => void;
}> = ({ thaalis, showToast }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white border border-amber-300/40 rounded-xl p-4 shadow-xs flex justify-between items-center">
        <div>
          <h4 className="font-bold text-sm text-slate-900">Thaali Batch Sticker Label Printing Studio</h4>
          <p className="text-xs text-slate-500">Generates adhesive barcode labels for each lunch/dinner dispatch box.</p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="px-5 py-2.5 bg-slate-900 text-amber-300 font-bold rounded-lg text-xs shadow-md cursor-pointer flex items-center gap-1.5"
        >
          <Printer className="w-4 h-4" />
          <span>Print All {thaalis.length} Labels</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {thaalis.map((t) => (
          <div key={t.id} className="border-2 border-dashed border-slate-300 p-4 rounded-xl bg-white space-y-2 select-none shadow-xs">
            <div className="flex justify-between items-start border-b border-slate-100 pb-2">
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-500">FAIZUL MAWAIDIL BURHANIYAH</p>
                <p className="text-lg font-black font-mono text-amber-700">{t.thaaliNo}</p>
              </div>
              <span className="px-2 py-0.5 rounded bg-slate-900 text-white font-bold text-[10px]">{t.tier}</span>
            </div>
            <div>
              <p className="font-bold text-xs text-slate-900 leading-tight">{t.hofName}</p>
              <p className="text-[10px] text-slate-500 mt-0.5 truncate">{t.mohallahName}</p>
            </div>
            <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono pt-1">
              <span>ITS: {t.itsNumber}</span>
              <span>{new Date().toISOString().split('T')[0]}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
