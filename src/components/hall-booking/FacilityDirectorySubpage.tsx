import React, { useState, useMemo } from 'react';
import {
  Building2,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Lock,
  X,
  CheckCircle2,
  AlertTriangle,
  Users,
  MapPin,
  Clock,
  DollarSign,
  Calendar,
  Layers,
  Wrench,
  Check,
  ShieldCheck,
  Info,
} from 'lucide-react';
import {
  FacilityRecord,
  FacilityType,
  FacilityStatus,
  UserProfile,
} from '../../types';
import { saveStoredFacilities, logHallBookingAudit } from '../../utils/hallBooking';
import { checkUserPermission } from '../../utils/rbac';

interface FacilityDirectorySubpageProps {
  facilities: FacilityRecord[];
  setFacilities: React.Dispatch<React.SetStateAction<FacilityRecord[]>>;
  currentUser: UserProfile;
  showToast: (msg: string) => void;
  onSelectFacilityForBooking: (facilityId: string) => void;
}

export const FacilityDirectorySubpage: React.FC<FacilityDirectorySubpageProps> = ({
  facilities,
  setFacilities,
  currentUser,
  showToast,
  onSelectFacilityForBooking,
}) => {
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFacility, setEditingFacility] = useState<FacilityRecord | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<FacilityType>('Community Hall');
  const [formCapacity, setFormCapacity] = useState<number>(300);
  const [formLocation, setFormLocation] = useState('');
  const [formHourlyRate, setFormHourlyRate] = useState<number>(2000);
  const [formDailyRate, setFormDailyRate] = useState<number>(15000);
  const [formStatus, setFormStatus] = useState<FacilityStatus>('Available');
  const [formDescription, setFormDescription] = useState('');
  const [formRules, setFormRules] = useState('');
  const [formAmenities, setFormAmenities] = useState('');

  // Selected Facility for Rules Popup
  const [viewingRulesFacility, setViewingRulesFacility] = useState<FacilityRecord | null>(null);

  // Granular RBAC Permissions
  const canAdd = checkUserPermission(currentUser, 'hall-booking', 'add');
  const canEdit = checkUserPermission(currentUser, 'hall-booking', 'edit');
  const canDelete = checkUserPermission(currentUser, 'hall-booking', 'delete');

  // Open Add Modal
  const handleOpenAdd = () => {
    if (!canAdd) {
      showToast('Access Restricted: You do not have [Add] permission for Facilities.');
      return;
    }
    setEditingFacility(null);
    setFormName('');
    setFormType('Community Hall');
    setFormCapacity(300);
    setFormLocation('Ground Floor, Main Complex');
    setFormHourlyRate(2000);
    setFormDailyRate(15000);
    setFormStatus('Available');
    setFormDescription('');
    setFormRules('No loud music during prayer/Azan times.\nPremises must be vacated within 30 minutes after event.');
    setFormAmenities('Air Conditioning, Sound System, Elevated Stage, Washrooms');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (fac: FacilityRecord) => {
    if (!canEdit) {
      showToast('Access Restricted: You do not have [Edit] permission for Facilities.');
      return;
    }
    setEditingFacility(fac);
    setFormName(fac.name);
    setFormType(fac.type);
    setFormCapacity(fac.capacity);
    setFormLocation(fac.location);
    setFormHourlyRate(fac.hourlyRate);
    setFormDailyRate(fac.dailyRate);
    setFormStatus(fac.status);
    setFormDescription(fac.description);
    setFormRules(fac.rules.join('\n'));
    setFormAmenities(fac.amenities.join(', '));
    setIsModalOpen(true);
  };

  // Save Modal
  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || formCapacity <= 0) {
      showToast('Please provide a valid facility name and capacity.');
      return;
    }

    const rulesArray = formRules
      .split('\n')
      .map((r) => r.trim())
      .filter(Boolean);

    const amenitiesArray = formAmenities
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean);

    if (editingFacility) {
      // Edit
      const updated = facilities.map((f) =>
        f.id === editingFacility.id
          ? {
              ...f,
              name: formName.trim(),
              type: formType,
              capacity: formCapacity,
              location: formLocation.trim(),
              hourlyRate: formHourlyRate,
              dailyRate: formDailyRate,
              status: formStatus,
              description: formDescription.trim(),
              rules: rulesArray,
              amenities: amenitiesArray,
            }
          : f
      );
      setFacilities(updated);
      saveStoredFacilities(updated);
      logHallBookingAudit(
        currentUser.username,
        'EDIT',
        editingFacility.id,
        'SYSTEM',
        `Updated facility "${formName}" (Status: ${formStatus}, Capacity: ${formCapacity}).`
      );
      showToast(`Updated facility "${formName}" successfully.`);
    } else {
      // Add
      const newFacility: FacilityRecord = {
        id: `fac-${Date.now().toString().slice(-4)}`,
        name: formName.trim(),
        type: formType,
        capacity: formCapacity,
        location: formLocation.trim() || 'Community Complex',
        hourlyRate: formHourlyRate,
        dailyRate: formDailyRate,
        status: formStatus,
        description: formDescription.trim(),
        rules: rulesArray,
        amenities: amenitiesArray,
        createdAt: new Date().toISOString().slice(0, 10),
      };
      const updated = [newFacility, ...facilities];
      setFacilities(updated);
      saveStoredFacilities(updated);
      logHallBookingAudit(
        currentUser.username,
        'ADD',
        newFacility.id,
        'SYSTEM',
        `Added new facility "${newFacility.name}" with capacity ${newFacility.capacity}.`
      );
      showToast(`Registered new facility "${newFacility.name}".`);
    }

    setIsModalOpen(false);
  };

  // Delete Facility
  const handleDelete = (fac: FacilityRecord) => {
    if (!canDelete) {
      showToast('Access Restricted: You do not have [Delete] permission.');
      return;
    }

    if (window.confirm(`Are you sure you want to delete facility "${fac.name}"?`)) {
      const updated = facilities.filter((f) => f.id !== fac.id);
      setFacilities(updated);
      saveStoredFacilities(updated);
      logHallBookingAudit(
        currentUser.username,
        'DELETE',
        fac.id,
        'SYSTEM',
        `Deleted facility "${fac.name}".`
      );
      showToast(`Deleted facility "${fac.name}".`);
    }
  };

  // KPI Metrics
  const metrics = useMemo(() => {
    const total = facilities.length;
    const available = facilities.filter((f) => f.status === 'Available').length;
    const maintenance = facilities.filter((f) => f.status === 'Under Maintenance').length;
    const totalCapacity = facilities.reduce((sum, f) => sum + (f.capacity || 0), 0);
    return { total, available, maintenance, totalCapacity };
  }, [facilities]);

  // Filtered Facilities
  const filteredFacilities = useMemo(() => {
    return facilities.filter((f) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        f.name.toLowerCase().includes(q) ||
        f.location.toLowerCase().includes(q) ||
        f.type.toLowerCase().includes(q);

      const matchType = typeFilter === 'all' || f.type === typeFilter;
      const matchStatus = statusFilter === 'all' || f.status === statusFilter;

      return matchSearch && matchType && matchStatus;
    });
  }, [facilities, searchQuery, typeFilter, statusFilter]);

  // Render Status Badge
  const renderStatusBadge = (status: FacilityStatus) => {
    switch (status) {
      case 'Available':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Available for Booking
          </span>
        );
      case 'Under Maintenance':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <Wrench className="w-3 h-3 text-amber-600" />
            Under Maintenance
          </span>
        );
      case 'Reserved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
            <Clock className="w-3 h-3 text-blue-600" />
            Reserved
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Intuitive Header & Guidance ── */}
      <div className="bg-white border-l-4 border-amber-500 rounded-xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-600" />
            <span>Community Facilities & Hall Directory</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Browse all Mawaid banquet halls, dining complexes, guest suites, and conference rooms. Inspect capacity,
            hourly/daily rates, guidelines, and live operational availability.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-amber-400 text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Card Grid
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-amber-400 text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Table View
            </button>
          </div>
        </div>
      </div>

      {/* ── Summary KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Total Facilities</p>
            <p className="text-xl sm:text-2xl font-black text-slate-900 font-mono mt-0.5">
              {metrics.total}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Active Halls & Spaces</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-700">Available Today</p>
            <p className="text-xl sm:text-2xl font-black text-emerald-900 font-mono mt-0.5">
              {metrics.available}
            </p>
            <p className="text-[10px] text-emerald-600 font-medium mt-0.5">Ready for Bookings</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-blue-700">Total Capacity</p>
            <p className="text-xl sm:text-2xl font-black text-blue-900 font-mono mt-0.5">
              {metrics.totalCapacity}
            </p>
            <p className="text-[10px] text-blue-600 font-medium mt-0.5">Total Guest Accommodations</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-300 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-amber-800">Under Maintenance</p>
            <p className="text-xl sm:text-2xl font-black text-amber-900 font-mono mt-0.5">
              {metrics.maintenance}
            </p>
            <p className="text-[10px] text-amber-700 font-medium mt-0.5">Renovation / Setup</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
            <Wrench className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ── Search & Filter Bar ── */}
      <div className="bg-white border border-amber-200/80 rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search facilities by name, floor location, or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Action Button: [ + Add New Facility ] */}
          {canAdd ? (
            <button
              type="button"
              onClick={handleOpenAdd}
              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
              title="Add a new community hall or facility"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add New Facility</span>
            </button>
          ) : (
            <div
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 text-slate-400 rounded-lg text-xs font-medium cursor-not-allowed shrink-0"
              title="Add Restricted by RBAC"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Add Facility (Restricted)</span>
            </div>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1 text-slate-500 font-semibold mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter By:</span>
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">All Facility Types ({facilities.length})</option>
            <option value="Community Hall">Community Hall</option>
            <option value="Dining Hall">Dining Hall</option>
            <option value="Guest Rooms">Guest Rooms</option>
            <option value="Meeting Spaces">Meeting Spaces</option>
            <option value="Auditorium">Auditorium</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">All Operational Statuses</option>
            <option value="Available">Available Only</option>
            <option value="Under Maintenance">Under Maintenance</option>
            <option value="Reserved">Reserved</option>
          </select>

          {(typeFilter !== 'all' || statusFilter !== 'all' || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setTypeFilter('all');
                setStatusFilter('all');
                setSearchQuery('');
              }}
              className="ml-auto text-xs text-amber-700 hover:text-amber-800 font-bold hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* ── CARD GRID VIEW ── */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredFacilities.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
              <Building2 className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="font-semibold text-slate-700">No Facilities Found</p>
              <p className="text-xs text-slate-400">Try adjusting your filters or search terms.</p>
            </div>
          ) : (
            filteredFacilities.map((fac) => (
              <div
                key={fac.id}
                className="bg-white border border-amber-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-all space-y-4"
              >
                <div className="space-y-3">
                  {/* Top Row: Type & Status */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                      {fac.type}
                    </span>
                    {renderStatusBadge(fac.status)}
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-base font-bold text-slate-900 line-clamp-1">{fac.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{fac.description}</p>
                  </div>

                  {/* Specs: Capacity & Location */}
                  <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-slate-100">
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <Users className="w-4 h-4 text-amber-600 shrink-0" />
                      <span className="font-bold">{fac.capacity} Capacity</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
                      <span className="truncate" title={fac.location}>
                        {fac.location}
                      </span>
                    </div>
                  </div>

                  {/* Pricing Matrix */}
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">Hourly Rate</span>
                      <p className="font-mono font-bold text-slate-900">₹{fac.hourlyRate.toLocaleString('en-IN')}/hr</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">Full Day Rate</span>
                      <p className="font-mono font-bold text-emerald-800">₹{fac.dailyRate.toLocaleString('en-IN')}/day</p>
                    </div>
                  </div>

                  {/* Amenities Tags */}
                  <div className="flex flex-wrap gap-1">
                    {fac.amenities.slice(0, 3).map((amenity, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium"
                      >
                        {amenity}
                      </span>
                    ))}
                    {fac.amenities.length > 3 && (
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px]">
                        +{fac.amenities.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setViewingRulesFacility(fac)}
                    className="text-xs text-amber-800 hover:text-amber-950 font-bold hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Info className="w-3.5 h-3.5" />
                    <span>Rules ({fac.rules.length})</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    {/* Book Now Button */}
                    {fac.status === 'Available' && (
                      <button
                        type="button"
                        onClick={() => onSelectFacilityForBooking(fac.id)}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1 shadow-2xs cursor-pointer transition-all"
                        title="Book this facility in calendar"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Book Slot</span>
                      </button>
                    )}

                    {/* Edit Facility Button */}
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(fac)}
                        className="p-1.5 bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 rounded-md cursor-pointer transition-colors"
                        title="Edit Facility Parameters"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Delete Facility Button */}
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => handleDelete(fac)}
                        className="p-1.5 bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-700 rounded-md cursor-pointer transition-colors"
                        title="Delete Facility"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── TABLE VIEW ── */}
      {viewMode === 'table' && (
        <div className="bg-white border border-amber-200/90 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0F172A] text-white uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="py-3 px-3.5">Facility Name</th>
                  <th className="py-3 px-3.5">Type</th>
                  <th className="py-3 px-3.5">Capacity</th>
                  <th className="py-3 px-3.5">Location / Floor</th>
                  <th className="py-3 px-3.5 text-right">Hourly Rate</th>
                  <th className="py-3 px-3.5 text-right">Daily Rate</th>
                  <th className="py-3 px-3.5">Operational Status</th>
                  <th className="py-3 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredFacilities.map((fac) => (
                  <tr key={fac.id} className="hover:bg-amber-50/50 transition-colors">
                    <td className="py-3 px-3.5 font-bold text-slate-900">{fac.name}</td>
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900">
                        {fac.type}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 font-bold text-slate-800 whitespace-nowrap">
                      {fac.capacity} Mumineen
                    </td>
                    <td className="py-3 px-3.5 text-slate-600">{fac.location}</td>
                    <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                      ₹{fac.hourlyRate.toLocaleString('en-IN')}/hr
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono font-bold text-emerald-800 whitespace-nowrap">
                      ₹{fac.dailyRate.toLocaleString('en-IN')}/day
                    </td>
                    <td className="py-3 px-3.5 whitespace-nowrap">{renderStatusBadge(fac.status)}</td>
                    <td className="py-3 px-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {fac.status === 'Available' && (
                          <button
                            type="button"
                            onClick={() => onSelectFacilityForBooking(fac.id)}
                            className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded text-[11px] cursor-pointer"
                          >
                            Book
                          </button>
                        )}
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(fac)}
                            className="p-1 text-slate-600 hover:text-amber-900 rounded cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── RULES & GUIDELINES POPUP MODAL ── */}
      {viewingRulesFacility && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-amber-300 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-[#0F172A] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm">Rules & Guidelines</h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingRulesFacility(null)}
                className="text-slate-400 hover:text-white p-1 rounded-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-3 text-xs">
              <p className="font-bold text-slate-900 text-sm">{viewingRulesFacility.name}</p>
              <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200 space-y-2">
                <span className="font-bold text-amber-950 uppercase text-[10px]">
                  Official Usage Guidelines:
                </span>
                <ul className="list-disc list-inside space-y-1.5 text-slate-700 text-xs">
                  {viewingRulesFacility.rules.map((rule, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {rule}
                    </li>
                  ))}
                </ul>
              </div>
              <button
                type="button"
                onClick={() => setViewingRulesFacility(null)}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg cursor-pointer"
              >
                Close Guidelines
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD / EDIT FACILITY MODAL ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-amber-300 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-[#0F172A] text-white p-4 sm:p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">
                  {editingFacility ? `Edit Facility: ${editingFacility.name}` : 'Register New Community Facility'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-4 sm:p-6 space-y-4 text-xs">
              {/* Name & Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Facility Name *
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Al-Mawaid Banquet Hall"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Facility Category *
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as FacilityType)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold"
                  >
                    <option value="Community Hall">Community Hall</option>
                    <option value="Dining Hall">Dining Hall</option>
                    <option value="Guest Rooms">Guest Rooms</option>
                    <option value="Meeting Spaces">Meeting Spaces</option>
                    <option value="Auditorium">Auditorium</option>
                  </select>
                </div>
              </div>

              {/* Capacity & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Guest Capacity (Max) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formCapacity}
                    onChange={(e) => setFormCapacity(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Location / Floor *
                  </label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="e.g. Ground Floor, Main Complex"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                    required
                  />
                </div>
              </div>

              {/* Hourly & Daily Rate */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Hourly Booking Rate (₹) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={100}
                    value={formHourlyRate}
                    onChange={(e) => setFormHourlyRate(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Full Day Rate (₹) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={500}
                    value={formDailyRate}
                    onChange={(e) => setFormDailyRate(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-emerald-800 font-mono font-bold"
                    required
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Operational Status *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Available', 'Under Maintenance', 'Reserved'] as FacilityStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setFormStatus(st)}
                      className={`p-2 rounded-lg font-bold border text-center transition-all cursor-pointer ${
                        formStatus === st
                          ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amenities */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Amenities (comma-separated)
                </label>
                <input
                  type="text"
                  value={formAmenities}
                  onChange={(e) => setFormAmenities(e.target.value)}
                  placeholder="e.g. Air Conditioning, Sound System, Wi-Fi, Stage"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              {/* Rules & Guidelines */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Rules & Guidelines (one rule per line)
                </label>
                <textarea
                  rows={2}
                  value={formRules}
                  onChange={(e) => setFormRules(e.target.value)}
                  placeholder="Enter house rules..."
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              {/* Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg shadow-sm cursor-pointer"
                >
                  {editingFacility ? 'Save Changes' : 'Confirm Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
