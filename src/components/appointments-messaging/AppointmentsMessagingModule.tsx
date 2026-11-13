import React, { useState, useEffect, useMemo } from 'react';
import {
  CalendarCheck,
  Calendar,
  Ban,
  ListChecks,
  MessageSquare,
  Plus,
  Search,
  Clock,
  Send,
  CheckCircle2,
  XCircle,
  Unlock,
  Edit3,
  Trash2,
  X,
} from 'lucide-react';
import {
  AppointmentSlot,
  AppointmentBooking,
  AppointmentPurpose,
  WhatsAppMessageTemplate,
  WhatsAppDispatchLog,
  getAppointmentPurposes,
  saveAppointmentPurposes,
  getAppointmentSlots,
  saveAppointmentSlots,
  getAppointmentBookings,
  saveAppointmentBookings,
  getWhatsAppTemplates,
  saveWhatsAppTemplates,
  getWhatsAppLogs,
  saveWhatsAppLogs,
} from '../../utils/part4Management';
import { getStoredHofs } from '../../utils/memberMaster';
import { UserProfile } from '../../types';

export type AppointmentsSubTab =
  | 'appointment-slots'
  | 'appointment-booking'
  | 'appointment-blocking'
  | 'appointment-purposes'
  | 'whatsapp-messaging';

interface AppointmentsMessagingModuleProps {
  currentUser: UserProfile;
  activeSubItemId: string;
  showToast: (msg: string) => void;
  canAdd?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}

const OFFICIAL_ROLES: AppointmentSlot['officialRole'][] = [
  'Janab Aamil Saheb',
  'Executive Secretary',
  'Qaza Tribunal',
  'FMB Coordinator',
];

const resolveAppointmentsTab = (subItemId: string): AppointmentsSubTab => {
  switch (subItemId) {
    case 'appointment-slots':
    case 'appointment-booking':
    case 'appointment-blocking':
    case 'appointment-purposes':
    case 'whatsapp-messaging':
      return subItemId;
    default:
      return 'appointment-slots';
  }
};

export const AppointmentsMessagingModule: React.FC<AppointmentsMessagingModuleProps> = ({
  currentUser,
  activeSubItemId,
  showToast,
  canAdd = true,
  canEdit = true,
  canDelete = true,
}) => {
  const [activeTab, setActiveTab] = useState<AppointmentsSubTab>(() =>
    resolveAppointmentsTab(activeSubItemId)
  );

  // Sync active tab strictly with sidebar navigation selection
  useEffect(() => {
    setActiveTab(resolveAppointmentsTab(activeSubItemId));
  }, [activeSubItemId]);

  // Persistent Stores
  const [slots, setSlots] = useState<AppointmentSlot[]>(getAppointmentSlots);
  const [bookings, setBookings] = useState<AppointmentBooking[]>(getAppointmentBookings);
  const [purposes, setPurposes] = useState<AppointmentPurpose[]>(getAppointmentPurposes);
  const [templates, setTemplates] = useState<WhatsAppMessageTemplate[]>(getWhatsAppTemplates);
  const [logs, setLogs] = useState<WhatsAppDispatchLog[]>(getWhatsAppLogs);
  const [hofs] = useState(() => getStoredHofs());

  // ── 1. SLOT LISTS & ASSIGNING STATE ──
  const [slotRoleFilter, setSlotRoleFilter] = useState<string>('ALL');
  const [slotSearch, setSlotSearch] = useState('');
  const [showSlotForm, setShowSlotForm] = useState(false);
  const [slotForm, setSlotForm] = useState({
    slotDate: '2026-11-15',
    startTime: '10:00 AM',
    endTime: '10:30 AM',
    officialRole: 'Janab Aamil Saheb' as AppointmentSlot['officialRole'],
    capacity: '1',
  });

  // ── 2. BOOK APPOINTMENT STATE ──
  const [bookingSearch, setBookingSearch] = useState('');
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    itsNumber: '',
    personName: '',
    mobile: '',
    officialRole: 'Janab Aamil Saheb',
    appointmentDate: '2026-11-15',
    appointmentTime: '10:00 AM',
    purposeId: purposes[0]?.id || '',
    notes: '',
  });

  // ── 3. BLOCK SLOTS STATE ──
  const [blockForm, setBlockForm] = useState({
    officialRole: 'Janab Aamil Saheb' as AppointmentSlot['officialRole'],
    slotDate: '2026-11-16',
    startTime: '09:00 AM',
    endTime: '01:00 PM',
    blockReason: '',
  });

  // ── 4. PURPOSE MANAGEMENT STATE ──
  const [showPurposeForm, setShowPurposeForm] = useState(false);
  const [editingPurposeId, setEditingPurposeId] = useState<string | null>(null);
  const [purposeForm, setPurposeForm] = useState({
    title: '',
    description: '',
    typicalDurationMins: '20',
    requiresDocuments: true,
    isActive: true,
  });

  // ── 5. WHATSAPP DISPATCHER STATE ──
  const [selectedTemplateId, setSelectedTemplateId] = useState(templates[0]?.id || '');
  const [customMsgText, setCustomMsgText] = useState(templates[0]?.messageBody || '');
  const [targetAudience, setTargetAudience] = useState<'All' | 'Safar Defaulters' | 'FMB Defaulters'>('All');
  const [isDispatching, setIsDispatching] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [newTplForm, setNewTplForm] = useState({
    title: '',
    category: 'Custom Notice' as WhatsAppMessageTemplate['category'],
    messageBody: '',
  });

  // ── DERIVED DATA ──
  const filteredSlots = useMemo(() => {
    const q = slotSearch.trim().toLowerCase();
    return slots.filter((s) => {
      if (slotRoleFilter !== 'ALL' && s.officialRole !== slotRoleFilter) return false;
      if (!q) return true;
      return (
        s.officialRole.toLowerCase().includes(q) ||
        s.slotDate.includes(q) ||
        s.startTime.toLowerCase().includes(q)
      );
    });
  }, [slots, slotRoleFilter, slotSearch]);

  const blockedSlots = useMemo(() => slots.filter((s) => s.isBlocked), [slots]);

  const filteredBookings = useMemo(() => {
    const q = bookingSearch.trim().toLowerCase();
    if (!q) return bookings;
    return bookings.filter(
      (b) =>
        b.bookingCode.toLowerCase().includes(q) ||
        b.itsNumber.toLowerCase().includes(q) ||
        b.personName.toLowerCase().includes(q) ||
        b.purposeName.toLowerCase().includes(q)
    );
  }, [bookings, bookingSearch]);

  // ── HANDLERS: SLOTS ──
  const handleAddSlot = (e: React.FormEvent) => {
    e.preventDefault();
    const newSlot: AppointmentSlot = {
      id: `SLOT-${Date.now()}`,
      slotDate: slotForm.slotDate,
      startTime: slotForm.startTime,
      endTime: slotForm.endTime,
      officialRole: slotForm.officialRole,
      capacity: Math.max(1, parseInt(slotForm.capacity, 10) || 1),
      bookedCount: 0,
      isBlocked: false,
    };
    const next = [newSlot, ...slots];
    setSlots(next);
    saveAppointmentSlots(next);
    setShowSlotForm(false);
    showToast(`Added consultation slot for ${newSlot.officialRole} on ${newSlot.slotDate}.`);
  };

  const handleDeleteSlot = (id: string) => {
    if (!canDelete) return;
    const next = slots.filter((s) => s.id !== id);
    setSlots(next);
    saveAppointmentSlots(next);
    showToast('Appointment slot removed.');
  };

  // ── HANDLERS: BOOKING ──
  const handleItsLookup = (its: string) => {
    const found = hofs.find((h) => h.itsNumber === its.trim());
    setBookingForm((prev) => ({
      ...prev,
      itsNumber: its,
      personName: found ? found.fullName : prev.personName,
      mobile: found ? found.mobileNumber : prev.mobile,
    }));
  };

  const handleSaveBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingForm.itsNumber.trim() || !bookingForm.personName.trim()) {
      showToast('Enter valid ITS Number and Applicant Name.');
      return;
    }
    const purpose = purposes.find((p) => p.id === bookingForm.purposeId);
    const newBooking: AppointmentBooking = {
      id: `BK-${Date.now()}`,
      bookingCode: `APT-1447-${String(bookings.length + 12).padStart(3, '0')}`,
      slotId: `SLOT-${Date.now()}`,
      itsNumber: bookingForm.itsNumber.trim(),
      personName: bookingForm.personName.trim(),
      mobile: bookingForm.mobile.trim() || '—',
      officialRole: bookingForm.officialRole,
      appointmentDate: bookingForm.appointmentDate,
      appointmentTime: bookingForm.appointmentTime,
      purposeId: bookingForm.purposeId,
      purposeName: purpose ? purpose.title : 'General Consultation',
      status: 'Confirmed',
      notes: bookingForm.notes.trim(),
    };
    const next = [newBooking, ...bookings];
    setBookings(next);
    saveAppointmentBookings(next);
    setShowBookingForm(false);
    setBookingForm({
      itsNumber: '',
      personName: '',
      mobile: '',
      officialRole: 'Janab Aamil Saheb',
      appointmentDate: '2026-11-15',
      appointmentTime: '10:00 AM',
      purposeId: purposes[0]?.id || '',
      notes: '',
    });
    showToast(`Appointment booked! Ref: ${newBooking.bookingCode}`);
  };

  const handleUpdateBookingStatus = (id: string, status: AppointmentBooking['status']) => {
    const next = bookings.map((b) => (b.id === id ? { ...b, status } : b));
    setBookings(next);
    saveAppointmentBookings(next);
    showToast(`Booking marked as ${status}.`);
  };

  // ── HANDLERS: BLOCK SLOTS ──
  const handleBlockCustomSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockForm.blockReason.trim()) {
      showToast('Provide a reason for blocking this slot.');
      return;
    }
    const newBlocked: AppointmentSlot = {
      id: `SLOT-${Date.now()}`,
      slotDate: blockForm.slotDate,
      startTime: blockForm.startTime,
      endTime: blockForm.endTime,
      officialRole: blockForm.officialRole,
      capacity: 1,
      bookedCount: 0,
      isBlocked: true,
      blockReason: blockForm.blockReason.trim(),
    };
    const next = [newBlocked, ...slots];
    setSlots(next);
    saveAppointmentSlots(next);
    setBlockForm((p) => ({ ...p, blockReason: '' }));
    showToast(`Blocked ${blockForm.officialRole} slot on ${blockForm.slotDate}.`);
  };

  const handleToggleBlockSlot = (slotId: string, block: boolean, reason?: string) => {
    const next = slots.map((s) =>
      s.id === slotId
        ? { ...s, isBlocked: block, blockReason: block ? reason || 'Blocked by Admin' : undefined }
        : s
    );
    setSlots(next);
    saveAppointmentSlots(next);
    showToast(block ? 'Slot marked as blocked.' : 'Slot unblocked and reopened.');
  };

  // ── HANDLERS: PURPOSES ──
  const handleSavePurpose = (e: React.FormEvent) => {
    e.preventDefault();
    if (!purposeForm.title.trim()) return;

    const next = editingPurposeId
      ? purposes.map((p) =>
          p.id === editingPurposeId
            ? {
                ...p,
                title: purposeForm.title.trim(),
                description: purposeForm.description.trim(),
                typicalDurationMins: parseInt(purposeForm.typicalDurationMins, 10) || 15,
                requiresDocuments: purposeForm.requiresDocuments,
                isActive: purposeForm.isActive,
              }
            : p
        )
      : [
          {
            id: `AP-${Date.now()}`,
            title: purposeForm.title.trim(),
            description: purposeForm.description.trim(),
            typicalDurationMins: parseInt(purposeForm.typicalDurationMins, 10) || 15,
            requiresDocuments: purposeForm.requiresDocuments,
            isActive: purposeForm.isActive,
          },
          ...purposes,
        ];

    setPurposes(next);
    saveAppointmentPurposes(next);
    setShowPurposeForm(false);
    setEditingPurposeId(null);
    showToast(editingPurposeId ? 'Consultation purpose updated.' : 'Consultation purpose added.');
  };

  // ── HANDLERS: WHATSAPP ──
  const handleDispatchWhatsApp = () => {
    if (!customMsgText.trim()) {
      showToast('Message body cannot be empty.');
      return;
    }
    setIsDispatching(true);
    setTimeout(() => {
      const template = templates.find((t) => t.id === selectedTemplateId);
      const recipientCount = targetAudience === 'All' ? 420 : 68;
      const newLog: WhatsAppDispatchLog = {
        id: `WLOG-${Date.now()}`,
        recipientName: `${targetAudience} Mumineen (${recipientCount} recipients)`,
        mobile: 'Broadcast Gateway',
        templateTitle: template ? template.title : 'Custom Broadcast',
        messagePreview: customMsgText.substring(0, 90) + (customMsgText.length > 90 ? '...' : ''),
        dispatchedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        status: 'Delivered',
        triggeredBy: currentUser.username,
      };
      const updated = [newLog, ...logs];
      setLogs(updated);
      saveWhatsAppLogs(updated);
      setIsDispatching(false);
      showToast(`WhatsApp Broadcast dispatched to ${recipientCount} recipients.`);
    }, 600);
  };

  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTplForm.title.trim() || !newTplForm.messageBody.trim()) return;
    const tpl: WhatsAppMessageTemplate = {
      id: `TMP-${Date.now()}`,
      title: newTplForm.title.trim(),
      category: newTplForm.category,
      messageBody: newTplForm.messageBody.trim(),
    };
    const next = [tpl, ...templates];
    setTemplates(next);
    saveWhatsAppTemplates(next);
    setSelectedTemplateId(tpl.id);
    setCustomMsgText(tpl.messageBody);
    setShowTemplateModal(false);
    setNewTplForm({ title: '', category: 'Custom Notice', messageBody: '' });
    showToast('WhatsApp template saved.');
  };

  const navTabs: { id: AppointmentsSubTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'appointment-slots', label: 'Slot Lists & Assigning', icon: <Calendar className="w-3.5 h-3.5" />, badge: String(slots.length) },
    { id: 'appointment-booking', label: 'Book Appointment', icon: <CalendarCheck className="w-3.5 h-3.5" />, badge: String(bookings.length) },
    { id: 'appointment-blocking', label: 'Block Slots (Leave)', icon: <Ban className="w-3.5 h-3.5" />, badge: blockedSlots.length ? String(blockedSlots.length) : undefined },
    { id: 'appointment-purposes', label: 'Purpose Management', icon: <ListChecks className="w-3.5 h-3.5" />, badge: String(purposes.length) },
    { id: 'whatsapp-messaging', label: 'WhatsApp Dispatcher', icon: <MessageSquare className="w-3.5 h-3.5" />, badge: 'Broadcast' },
  ];

  return (
    <div className="space-y-5">
      {/* Dedicated Header & Sub-Navigation Ribbon for Appointments & Messaging ONLY */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900">Appointments &amp; Messaging</h2>
              <p className="text-[11px] text-slate-500">
                Manage consultation slots, member bookings, leave blocks, purposes, and WhatsApp broadcasts.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {navTabs.map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-amber-400 text-slate-950 shadow-2xs'
                    : 'bg-slate-50 hover:bg-amber-50 text-slate-700 border border-slate-200'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                      isSelected ? 'bg-slate-900 text-amber-300' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* =====================================================================
          1. SLOT LISTS & ASSIGNING
         ===================================================================== */}
      {activeTab === 'appointment-slots' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-black text-slate-900">Slot Lists &amp; Assigning</h3>
              <p className="text-xs text-slate-500">
                Configure and assign consultation time slots across official Jamaat offices.
              </p>
            </div>
            {canAdd && (
              <button
                type="button"
                onClick={() => setShowSlotForm((v) => !v)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-black text-slate-950 bg-amber-400 hover:bg-amber-500 rounded-xl shadow-2xs cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showSlotForm ? 'Close Slot Form' : 'Assign New Slot'}</span>
              </button>
            )}
          </div>

          {showSlotForm && (
            <form
              onSubmit={handleAddSlot}
              className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs"
            >
              <div>
                <label className="block font-bold text-slate-700 mb-1">Official Role</label>
                <select
                  value={slotForm.officialRole}
                  onChange={(e) =>
                    setSlotForm({
                      ...slotForm,
                      officialRole: e.target.value as AppointmentSlot['officialRole'],
                    })
                  }
                  className="w-full px-3 py-2 border border-amber-300 rounded-xl bg-white font-semibold"
                >
                  {OFFICIAL_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Slot Date</label>
                <input
                  type="date"
                  required
                  value={slotForm.slotDate}
                  onChange={(e) => setSlotForm({ ...slotForm, slotDate: e.target.value })}
                  className="w-full px-3 py-2 border border-amber-300 rounded-xl bg-white"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Start Time</label>
                <input
                  type="text"
                  required
                  value={slotForm.startTime}
                  onChange={(e) => setSlotForm({ ...slotForm, startTime: e.target.value })}
                  className="w-full px-3 py-2 border border-amber-300 rounded-xl bg-white font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">End Time</label>
                <input
                  type="text"
                  required
                  value={slotForm.endTime}
                  onChange={(e) => setSlotForm({ ...slotForm, endTime: e.target.value })}
                  className="w-full px-3 py-2 border border-amber-300 rounded-xl bg-white font-mono"
                />
              </div>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="block font-bold text-slate-700 mb-1">Capacity</label>
                  <input
                    type="number"
                    min={1}
                    value={slotForm.capacity}
                    onChange={(e) => setSlotForm({ ...slotForm, capacity: e.target.value })}
                    className="w-full px-3 py-2 border border-amber-300 rounded-xl bg-white font-mono"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-amber-300 font-black rounded-xl cursor-pointer"
                >
                  Save
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={slotSearch}
                onChange={(e) => setSlotSearch(e.target.value)}
                placeholder="Search slots by official role, date, or time..."
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl"
              />
            </div>
            <select
              value={slotRoleFilter}
              onChange={(e) => setSlotRoleFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl bg-white font-semibold"
            >
              <option value="ALL">All Official Roles</option>
              {OFFICIAL_ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredSlots.map((slot) => (
              <div
                key={slot.id}
                className={`p-4 rounded-xl border text-xs space-y-2 ${
                  slot.isBlocked ? 'bg-rose-50/70 border-rose-200' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-900">{slot.officialRole}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      slot.isBlocked ? 'bg-rose-200 text-rose-900' : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {slot.isBlocked ? 'Blocked' : 'Available'}
                  </span>
                </div>
                <p className="text-slate-700 font-mono font-semibold">
                  {slot.slotDate} • {slot.startTime} – {slot.endTime}
                </p>
                {slot.isBlocked ? (
                  <p className="text-[11px] text-rose-700 italic">{slot.blockReason}</p>
                ) : (
                  <p className="text-[11px] text-slate-500">
                    Assigned Bookings: <strong>{slot.bookedCount}</strong> / {slot.capacity}
                  </p>
                )}
                <div className="pt-2 border-t border-slate-200/80 flex items-center justify-end gap-2">
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => handleToggleBlockSlot(slot.id, !slot.isBlocked)}
                      className="text-[11px] font-bold text-blue-700 hover:underline cursor-pointer"
                    >
                      {slot.isBlocked ? 'Reopen Slot' : 'Block Slot'}
                    </button>
                  )}
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => handleDeleteSlot(slot.id)}
                      className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================================
          2. BOOK APPOINTMENT
         ===================================================================== */}
      {activeTab === 'appointment-booking' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-black text-slate-900">Book Appointment</h3>
              <p className="text-xs text-slate-500">
                Schedule member appointments and manage confirmed consultation queue codes.
              </p>
            </div>
            {canAdd && (
              <button
                type="button"
                onClick={() => setShowBookingForm((v) => !v)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-black text-slate-950 bg-amber-400 hover:bg-amber-500 rounded-xl shadow-2xs cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showBookingForm ? 'Close Booking Form' : 'New Appointment Booking'}</span>
              </button>
            )}
          </div>

          {showBookingForm && (
            <form
              onSubmit={handleSaveBooking}
              className="bg-blue-50/60 border border-blue-200 rounded-2xl p-4 space-y-3 text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ITS Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="8-digit ITS (autofills HOF)"
                    value={bookingForm.itsNumber}
                    onChange={(e) => handleItsLookup(e.target.value)}
                    className="w-full px-3 py-2 border border-blue-200 rounded-xl bg-white font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Applicant Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Full Name"
                    value={bookingForm.personName}
                    onChange={(e) => setBookingForm({ ...bookingForm, personName: e.target.value })}
                    className="w-full px-3 py-2 border border-blue-200 rounded-xl bg-white font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mobile Number</label>
                  <input
                    type="text"
                    placeholder="+91 98..."
                    value={bookingForm.mobile}
                    onChange={(e) => setBookingForm({ ...bookingForm, mobile: e.target.value })}
                    className="w-full px-3 py-2 border border-blue-200 rounded-xl bg-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Official Role</label>
                  <select
                    value={bookingForm.officialRole}
                    onChange={(e) => setBookingForm({ ...bookingForm, officialRole: e.target.value })}
                    className="w-full px-3 py-2 border border-blue-200 rounded-xl bg-white font-semibold"
                  >
                    {OFFICIAL_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Purpose</label>
                  <select
                    value={bookingForm.purposeId}
                    onChange={(e) => setBookingForm({ ...bookingForm, purposeId: e.target.value })}
                    className="w-full px-3 py-2 border border-blue-200 rounded-xl bg-white"
                  >
                    {purposes
                      .filter((p) => p.isActive)
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={bookingForm.appointmentDate}
                    onChange={(e) =>
                      setBookingForm({ ...bookingForm, appointmentDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-blue-200 rounded-xl bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Time Slot</label>
                  <select
                    value={bookingForm.appointmentTime}
                    onChange={(e) =>
                      setBookingForm({ ...bookingForm, appointmentTime: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-blue-200 rounded-xl bg-white font-mono"
                  >
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="10:30 AM">10:30 AM</option>
                    <option value="11:00 AM">11:00 AM</option>
                    <option value="04:00 PM">04:00 PM</option>
                    <option value="04:30 PM">04:30 PM</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <input
                  type="text"
                  placeholder="Consultation notes / intention..."
                  value={bookingForm.notes}
                  onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                  className="flex-1 px-3 py-2 border border-blue-200 rounded-xl bg-white"
                />
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl cursor-pointer"
                >
                  Confirm Appointment
                </button>
              </div>
            </form>
          )}

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={bookingSearch}
              onChange={(e) => setBookingSearch(e.target.value)}
              placeholder="Search bookings by code, ITS number, applicant name, or purpose..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl"
            />
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold">
                  <th className="py-3 px-3">Code</th>
                  <th className="py-3 px-3">ITS #</th>
                  <th className="py-3 px-3">Mumin Name</th>
                  <th className="py-3 px-3">Official Role</th>
                  <th className="py-3 px-3">Date &amp; Time</th>
                  <th className="py-3 px-3">Purpose</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBookings.map((bk) => (
                  <tr key={bk.id} className="hover:bg-blue-50/30">
                    <td className="py-3 px-3 font-mono font-bold text-blue-900">{bk.bookingCode}</td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-800">{bk.itsNumber}</td>
                    <td className="py-3 px-3 font-bold text-slate-900">{bk.personName}</td>
                    <td className="py-3 px-3 text-slate-700">{bk.officialRole}</td>
                    <td className="py-3 px-3 font-mono text-slate-600">
                      {bk.appointmentDate} at {bk.appointmentTime}
                    </td>
                    <td className="py-3 px-3 text-amber-900 font-semibold">{bk.purposeName}</td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          bk.status === 'Confirmed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : bk.status === 'Completed'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {bk.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {canEdit && bk.status === 'Confirmed' && (
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleUpdateBookingStatus(bk.id, 'Completed')}
                            className="px-2 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Complete</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateBookingStatus(bk.id, 'Cancelled')}
                            className="px-2 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <XCircle className="w-3 h-3" />
                            <span>Cancel</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================================
          3. BLOCK SLOTS (LEAVE)
         ===================================================================== */}
      {activeTab === 'appointment-blocking' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-black text-slate-900">
              Block Slots (Holidays, Miqaat &amp; Leave)
            </h3>
            <p className="text-xs text-slate-500">
              Prevent public bookings during official travel, holidays, or Miqaat Ohbat schedules.
            </p>
          </div>

          <form
            onSubmit={handleBlockCustomSlot}
            className="bg-rose-50/60 border border-rose-200 rounded-2xl p-4 space-y-3 text-xs"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Official Role</label>
                <select
                  value={blockForm.officialRole}
                  onChange={(e) =>
                    setBlockForm({
                      ...blockForm,
                      officialRole: e.target.value as AppointmentSlot['officialRole'],
                    })
                  }
                  className="w-full px-3 py-2 border border-rose-200 rounded-xl bg-white font-semibold"
                >
                  {OFFICIAL_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={blockForm.slotDate}
                  onChange={(e) => setBlockForm({ ...blockForm, slotDate: e.target.value })}
                  className="w-full px-3 py-2 border border-rose-200 rounded-xl bg-white"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Start Time</label>
                <input
                  type="text"
                  required
                  value={blockForm.startTime}
                  onChange={(e) => setBlockForm({ ...blockForm, startTime: e.target.value })}
                  className="w-full px-3 py-2 border border-rose-200 rounded-xl bg-white font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">End Time</label>
                <input
                  type="text"
                  required
                  value={blockForm.endTime}
                  onChange={(e) => setBlockForm({ ...blockForm, endTime: e.target.value })}
                  className="w-full px-3 py-2 border border-rose-200 rounded-xl bg-white font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Leave / Block Reason *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Out of Station for Miqaat"
                  value={blockForm.blockReason}
                  onChange={(e) => setBlockForm({ ...blockForm, blockReason: e.target.value })}
                  className="w-full px-3 py-2 border border-rose-200 rounded-xl bg-white"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Block Date &amp; Time Range</span>
              </button>
            </div>
          </form>

          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-600">
              Currently Blocked Slots ({blockedSlots.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {blockedSlots.map((slot) => (
                <div
                  key={slot.id}
                  className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <p className="font-bold text-slate-900">{slot.officialRole}</p>
                    <p className="font-mono text-slate-600 mt-0.5">
                      {slot.slotDate} • {slot.startTime} – {slot.endTime}
                    </p>
                    <p className="text-rose-700 italic mt-1">{slot.blockReason || 'Blocked'}</p>
                  </div>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => handleToggleBlockSlot(slot.id, false)}
                      className="px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-xl font-bold inline-flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>Unblock</span>
                    </button>
                  )}
                </div>
              ))}
              {blockedSlots.length === 0 && (
                <p className="text-xs text-slate-400 col-span-2 py-6 text-center">
                  No appointment slots are currently blocked.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          4. PURPOSE MANAGEMENT
         ===================================================================== */}
      {activeTab === 'appointment-purposes' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-black text-slate-900">Purpose Management</h3>
              <p className="text-xs text-slate-500">
                Configure consultation categories, durations, and document requirements.
              </p>
            </div>
            {canAdd && (
              <button
                type="button"
                onClick={() => {
                  setEditingPurposeId(null);
                  setPurposeForm({
                    title: '',
                    description: '',
                    typicalDurationMins: '20',
                    requiresDocuments: true,
                    isActive: true,
                  });
                  setShowPurposeForm((v) => !v);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-black text-slate-950 bg-amber-400 hover:bg-amber-500 rounded-xl shadow-2xs cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showPurposeForm ? 'Close Form' : 'Add Purpose'}</span>
              </button>
            )}
          </div>

          {showPurposeForm && (
            <form
              onSubmit={handleSavePurpose}
              className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4 space-y-3 text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Purpose Title *</label>
                  <input
                    type="text"
                    required
                    value={purposeForm.title}
                    onChange={(e) => setPurposeForm({ ...purposeForm, title: e.target.value })}
                    placeholder="e.g. Misaaq Formalities / Raza Mubarak"
                    className="w-full px-3 py-2 border border-amber-300 rounded-xl bg-white font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    min={5}
                    value={purposeForm.typicalDurationMins}
                    onChange={(e) =>
                      setPurposeForm({ ...purposeForm, typicalDurationMins: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-amber-300 rounded-xl bg-white font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Description</label>
                  <input
                    type="text"
                    value={purposeForm.description}
                    onChange={(e) =>
                      setPurposeForm({ ...purposeForm, description: e.target.value })
                    }
                    placeholder="Brief details for counter officers..."
                    className="w-full px-3 py-2 border border-amber-300 rounded-xl bg-white"
                  />
                </div>
                <div className="flex items-center justify-between gap-2 pt-4">
                  <label className="inline-flex items-center gap-1.5 font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={purposeForm.requiresDocuments}
                      onChange={(e) =>
                        setPurposeForm({ ...purposeForm, requiresDocuments: e.target.checked })
                      }
                    />
                    <span>Docs Required</span>
                  </label>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-slate-900 text-amber-300 font-black rounded-xl cursor-pointer"
                  >
                    {editingPurposeId ? 'Update' : 'Save Purpose'}
                  </button>
                </div>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {purposes.map((p) => (
              <div
                key={p.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2 text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-bold text-slate-900 text-sm">{p.title}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                      p.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {p.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-slate-600 text-[11px]">{p.description}</p>
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                  <span>
                    Duration: <strong>{p.typicalDurationMins} Mins</strong> •{' '}
                    {p.requiresDocuments ? 'Docs Required' : 'No Docs'}
                  </span>
                  <div className="flex items-center gap-2">
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPurposeId(p.id);
                          setPurposeForm({
                            title: p.title,
                            description: p.description,
                            typicalDurationMins: String(p.typicalDurationMins),
                            requiresDocuments: p.requiresDocuments,
                            isActive: p.isActive,
                          });
                          setShowPurposeForm(true);
                        }}
                        className="inline-flex items-center gap-1 text-blue-700 font-bold hover:underline cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => {
                          const next = purposes.filter((item) => item.id !== p.id);
                          setPurposes(next);
                          saveAppointmentPurposes(next);
                          showToast('Consultation purpose deleted.');
                        }}
                        className="inline-flex items-center gap-1 text-rose-600 font-bold hover:underline cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================================
          5. WHATSAPP DISPATCHER
         ===================================================================== */}
      {activeTab === 'whatsapp-messaging' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-purple-600" />
                <span>WhatsApp Community Broadcast Dispatcher</span>
              </h3>
              <div className="flex items-center gap-2">
                {canAdd && (
                  <button
                    type="button"
                    onClick={() => setShowTemplateModal(true)}
                    className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    + New Template
                  </button>
                )}
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  WATI API Live
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Message Template</label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => {
                    setSelectedTemplateId(e.target.value);
                    const t = templates.find((x) => x.id === e.target.value);
                    if (t) setCustomMsgText(t.messageBody);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold bg-white"
                >
                  {templates.map((tpl) => (
                    <option key={tpl.id} value={tpl.id}>
                      {tpl.title} ({tpl.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Audience</label>
                <select
                  value={targetAudience}
                  onChange={(e) =>
                    setTargetAudience(e.target.value as 'All' | 'Safar Defaulters' | 'FMB Defaulters')
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold bg-white"
                >
                  <option value="All">All Registered Mumineen (420 Contacts)</option>
                  <option value="Safar Defaulters">Safar Takhmeen Defaulters (68 Contacts)</option>
                  <option value="FMB Defaulters">FMB / Sabeel Defaulters (94 Contacts)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Message Text Preview / Customizer
                </label>
                <textarea
                  rows={5}
                  value={customMsgText}
                  onChange={(e) => setCustomMsgText(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-sans"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Variables like [Name], [Amount], [Date], [Official], [Time] are dynamically replaced from member master.
                </p>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isDispatching}
                  onClick={handleDispatchWhatsApp}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isDispatching ? 'Dispatching...' : 'Dispatch Broadcast Queue'}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-600" />
              <span>Recent WhatsApp Dispatch Logs</span>
            </h3>

            <div className="space-y-3 max-h-[420px] overflow-y-auto">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl border border-slate-200/80 bg-slate-50 space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-900">{log.recipientName}</span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 shrink-0">
                      {log.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-2">{log.messagePreview}</p>
                  <div className="pt-1 border-t border-slate-200/60 flex justify-between text-[10px] text-slate-400">
                    <span>{log.dispatchedAt}</span>
                    <span>By @{log.triggeredBy}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {showTemplateModal && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-purple-200 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="text-sm font-black text-slate-900">Create WhatsApp Template</h4>
                  <button
                    type="button"
                    onClick={() => setShowTemplateModal(false)}
                    className="text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <form onSubmit={handleSaveTemplate} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Template Title *</label>
                    <input
                      type="text"
                      required
                      value={newTplForm.title}
                      onChange={(e) => setNewTplForm({ ...newTplForm, title: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Category</label>
                    <select
                      value={newTplForm.category}
                      onChange={(e) =>
                        setNewTplForm({
                          ...newTplForm,
                          category: e.target.value as WhatsAppMessageTemplate['category'],
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                    >
                      <option value="Custom Notice">Custom Notice</option>
                      <option value="Dues Reminder">Dues Reminder</option>
                      <option value="Miqaat Announcement">Miqaat Announcement</option>
                      <option value="FMB Daily Thaali">FMB Daily Thaali</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Message Body *</label>
                    <textarea
                      rows={4}
                      required
                      value={newTplForm.messageBody}
                      onChange={(e) => setNewTplForm({ ...newTplForm, messageBody: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowTemplateModal(false)}
                      className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-700 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-purple-600 text-white rounded-xl font-black cursor-pointer"
                    >
                      Save Template
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

