import React, { useState, useMemo } from 'react';
import {
  Plane,
  Landmark,
  CalendarCheck,
  MessageSquare,
  Sparkles,
  MapPin,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  Filter,
  DollarSign,
  Printer,
  ShieldCheck,
  Send,
  AlertCircle,
  X,
  CreditCard,
  Building,
  UserCheck,
  Phone,
  FileText,
  BadgeAlert,
  ChevronRight,
} from 'lucide-react';
import {
  SafarCity,
  SafarEvent,
  SafarMasool,
  SafarTakhmeen,
  ZiyafatSlot,
  HajPilgrim,
  HajExpenseHead,
  HajExpenseEntry,
  MazarRegistration,
  AppointmentSlot,
  AppointmentBooking,
  AppointmentPurpose,
  WhatsAppMessageTemplate,
  WhatsAppDispatchLog,
  getSafarCities,
  saveSafarCities,
  getSafarEvents,
  saveSafarEvents,
  getSafarMasool,
  saveSafarMasool,
  getSafarTakhmeen,
  saveSafarTakhmeen,
  getZiyafatSlots,
  saveZiyafatSlots,
  getHajPilgrims,
  saveHajPilgrims,
  getHajExpenseHeads,
  saveHajExpenseHeads,
  getHajExpenseEntries,
  saveHajExpenseEntries,
  getMazarRegistrations,
  saveMazarRegistrations,
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
  appendSafarAuditLog,
} from '../../utils/part4Management';
import { UserProfile, FinancialYear } from '../../types';

interface SpecialCommunityModulesProps {
  currentUser: UserProfile;
  activeSubItemId: string;
  subItemLabel: string;
  financialYear: FinancialYear;
  showToast: (msg: string) => void;
  canAdd?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}

export const SpecialCommunityModules: React.FC<SpecialCommunityModulesProps> = ({
  currentUser,
  activeSubItemId,
  financialYear,
  showToast,
  canAdd = true,
  canEdit = true,
  canDelete = true,
}) => {
  // Navigation: 'safar', 'haj-mazar', 'appointments', 'messaging'
  const [activeSpecialSection, setActiveSpecialSection] = useState<'safar' | 'haj-mazar' | 'appointments' | 'messaging'>(() => {
    if (activeSubItemId.includes('haj') || activeSubItemId.includes('mazar')) return 'haj-mazar';
    if (activeSubItemId.includes('appointment')) return 'appointments';
    if (activeSubItemId.includes('whatsapp') || activeSubItemId.includes('message')) return 'messaging';
    return 'safar';
  });

  // Sub-tabs within Safar
  const [safarSubTab, setSafarSubTab] = useState<'dashboard' | 'cities' | 'events' | 'masool' | 'takhmeen' | 'dues' | 'ziyafat'>('dashboard');

  // Sub-tabs within Haj & Mazar
  const [hajSubTab, setHajSubTab] = useState<'haj-entries' | 'haj-expenses' | 'haj-ledger' | 'mazar-reg' | 'mazar-tracking'>('haj-entries');

  // Sub-tabs within Appointments
  const [aptSubTab, setAptSubTab] = useState<'slots' | 'booking' | 'blocking' | 'purposes'>('slots');

  // State Repositories
  const [safarCities, setSafarCities] = useState<SafarCity[]>(getSafarCities);
  const [safarEvents, setSafarEvents] = useState<SafarEvent[]>(getSafarEvents);
  const [safarMasool, setSafarMasool] = useState<SafarMasool[]>(getSafarMasool);
  const [safarTakhmeen, setSafarTakhmeen] = useState<SafarTakhmeen[]>(getSafarTakhmeen);
  const [ziyafatSlots, setZiyafatSlots] = useState<ZiyafatSlot[]>(getZiyafatSlots);

  const [hajPilgrims, setHajPilgrims] = useState<HajPilgrim[]>(getHajPilgrims);
  const [hajExpenseHeads, setHajExpenseHeads] = useState<HajExpenseHead[]>(getHajExpenseHeads);
  const [hajExpenseEntries, setHajExpenseEntries] = useState<HajExpenseEntry[]>(getHajExpenseEntries);
  const [mazarRegs, setMazarRegs] = useState<MazarRegistration[]>(getMazarRegistrations);

  const [appointmentPurposes, setAppointmentPurposes] = useState<AppointmentPurpose[]>(getAppointmentPurposes);
  const [appointmentSlots, setAppointmentSlots] = useState<AppointmentSlot[]>(getAppointmentSlots);
  const [appointmentBookings, setAppointmentBookings] = useState<AppointmentBooking[]>(getAppointmentBookings);

  const [whatsappTemplates, setWhatsappTemplates] = useState<WhatsAppMessageTemplate[]>(getWhatsAppTemplates);
  const [whatsappLogs, setWhatsappLogs] = useState<WhatsAppDispatchLog[]>(getWhatsAppLogs);

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showCityModal, setShowCityModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showMasoolModal, setShowMasoolModal] = useState(false);
  const [showTakhmeenModal, setShowTakhmeenModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showZiyafatModal, setShowZiyafatModal] = useState(false);
  const [showPilgrimModal, setShowPilgrimModal] = useState(false);
  const [showHajExpModal, setShowHajExpModal] = useState(false);
  const [showMazarModal, setShowMazarModal] = useState(false);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showPurposeModal, setShowPurposeModal] = useState(false);

  // Selected for Payment
  const [selectedTakhmeenForPay, setSelectedTakhmeenForPay] = useState<SafarTakhmeen | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque'>('UPI');

  // WhatsApp Composer
  const [selectedTemplateId, setSelectedTemplateId] = useState(whatsappTemplates[0]?.id || '');
  const [customMsgText, setCustomMsgText] = useState(whatsappTemplates[0]?.messageBody || '');
  const [targetAudience, setTargetAudience] = useState<'All' | 'Safar Defaulters' | 'FMB Defaulters'>('All');
  const [isDispatching, setIsDispatching] = useState(false);

  // Form States
  const [cityForm, setCityForm] = useState({
    cityName: '',
    venueName: '',
    address: '',
    capacity: '2500',
    masoolName: '',
    masoolContact: '',
  });

  const [eventForm, setEventForm] = useState({
    title: '',
    cityId: safarCities[0]?.id || '',
    eventType: 'Majlis' as SafarEvent['eventType'],
    dateHijri: '1447-04-10',
    time: '18:30 IST',
    venue: 'Al-Masjid al-Burhani Courtyard',
    maxCapacity: '3500',
    masoolName: '',
  });

  const [masoolForm, setMasoolForm] = useState({
    name: '',
    itsNumber: '',
    mobile: '',
    department: 'Security & Protocol',
    cityId: safarCities[0]?.id || '',
    assignedDuty: '',
  });

  const [takhmeenForm, setTakhmeenForm] = useState({
    itsNumber: '',
    hofName: '',
    mohallah: 'Mohallah Saifee',
    mobile: '',
    pledgedAmount: '51000',
  });

  const [ziyafatForm, setZiyafatForm] = useState({
    itsNumber: '',
    familyName: '',
    mohallah: 'Mohallah Saifee',
    slotDate: '1447-04-11',
    slotTime: '10:00 AM',
    type: 'Ziyafat Mubarak' as ZiyafatSlot['type'],
    attendeesCount: '8',
    remarks: '',
  });

  const [pilgrimForm, setPilgrimForm] = useState({
    itsNumber: '',
    fullName: '',
    age: '45',
    gender: 'Male' as 'Male' | 'Female',
    mohallah: 'Mohallah Saifee',
    mobile: '',
    passportNumber: '',
    travelBatch: 'Direct Medina Batch A',
    packageCost: '450000',
  });

  const [bookingForm, setBookingForm] = useState({
    itsNumber: '',
    personName: '',
    mobile: '',
    officialRole: 'Janab Aamil Saheb',
    appointmentDate: '2026-10-30',
    appointmentTime: '10:00 AM',
    purposeId: appointmentPurposes[0]?.id || '',
    notes: '',
  });

  // Calculate Safar Metrics
  const safarTotalPledged = useMemo(() => {
    return safarTakhmeen.reduce((sum, t) => sum + t.pledgedAmount, 0);
  }, [safarTakhmeen]);

  const safarTotalCollected = useMemo(() => {
    return safarTakhmeen.reduce((sum, t) => sum + t.paidAmount, 0);
  }, [safarTakhmeen]);

  const safarTotalDue = safarTotalPledged - safarTotalCollected;

  // Handlers
  const handleSaveCity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cityForm.cityName || !cityForm.venueName) {
      alert('Please fill in City and Venue names.');
      return;
    }
    const newCity: SafarCity = {
      id: `SCT-${Date.now()}`,
      cityName: cityForm.cityName,
      venueName: cityForm.venueName,
      address: cityForm.address,
      capacity: parseInt(cityForm.capacity) || 1000,
      masoolName: cityForm.masoolName,
      masoolContact: cityForm.masoolContact,
      status: 'Confirmed',
    };
    const updated = [newCity, ...safarCities];
    setSafarCities(updated);
    saveSafarCities(updated);
    appendSafarAuditLog(currentUser.username, 'VENUE_INSPECTION', `Registered venue "${newCity.venueName}" in ${newCity.cityName}.`);
    setShowCityModal(false);
    showToast(`Venue "${newCity.venueName}" added to Safar itinerary.`);
  };

  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventForm.title) return;
    const city = safarCities.find((c) => c.id === eventForm.cityId);
    const newEvent: SafarEvent = {
      id: `SEV-${Date.now()}`,
      cityId: eventForm.cityId,
      cityName: city ? city.cityName : 'Burhani Park',
      title: eventForm.title,
      eventType: eventForm.eventType,
      dateHijri: eventForm.dateHijri,
      time: eventForm.time,
      venue: eventForm.venue,
      maxCapacity: parseInt(eventForm.maxCapacity) || 1000,
      masoolName: eventForm.masoolName || 'Shk. Abbas Bhai Lightwala',
      status: 'Scheduled',
    };
    const updated = [newEvent, ...safarEvents];
    setSafarEvents(updated);
    saveSafarEvents(updated);
    appendSafarAuditLog(currentUser.username, 'EVENT_MODIFIED', `Scheduled Safar event "${newEvent.title}" on ${newEvent.dateHijri}.`);
    setShowEventModal(false);
    showToast(`Safar event "${newEvent.title}" scheduled.`);
  };

  const handleSaveTakhmeen = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(takhmeenForm.pledgedAmount);
    if (!takhmeenForm.hofName || !takhmeenForm.itsNumber || isNaN(amt)) return;
    const newTak: SafarTakhmeen = {
      id: `STK-${Date.now()}`,
      itsNumber: takhmeenForm.itsNumber,
      hofName: takhmeenForm.hofName,
      mohallah: takhmeenForm.mohallah,
      mobile: takhmeenForm.mobile,
      pledgedAmount: amt,
      paidAmount: 0,
      balanceDue: amt,
      status: 'Pending',
    };
    const updated = [newTak, ...safarTakhmeen];
    setSafarTakhmeen(updated);
    saveSafarTakhmeen(updated);
    appendSafarAuditLog(currentUser.username, 'TAKHEEN_UPDATE', `Allocated Safar Takhmeen of ₹${amt} for ITS ${newTak.itsNumber} (${newTak.hofName}).`);
    setShowTakhmeenModal(false);
    showToast(`Safar takhmeen pledge allocated for ${newTak.hofName}.`);
  };

  const handleProcessSafarPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTakhmeenForPay) return;
    const amt = parseFloat(paymentAmount);
    if (isNaN(amt) || amt <= 0) {
      alert('Please enter a valid payment amount.');
      return;
    }
    const updated = safarTakhmeen.map((t) => {
      if (t.id === selectedTakhmeenForPay.id) {
        const newPaid = t.paidAmount + amt;
        const newBal = Math.max(0, t.pledgedAmount - newPaid);
        return {
          ...t,
          paidAmount: newPaid,
          balanceDue: newBal,
          status: (newBal === 0 ? 'Paid' : 'Partial') as SafarTakhmeen['status'],
          lastPaymentDate: new Date().toISOString().split('T')[0],
        };
      }
      return t;
    });
    setSafarTakhmeen(updated);
    saveSafarTakhmeen(updated);
    appendSafarAuditLog(currentUser.username, 'PAYMENT_RECEIVED', `Received Safar payment of ₹${amt} from ${selectedTakhmeenForPay.hofName} (${paymentMode}).`);
    setShowPaymentModal(false);
    setSelectedTakhmeenForPay(null);
    setPaymentAmount('');
    showToast(`Payment of ₹${amt.toLocaleString('en-IN')} recorded successfully.`);
  };

  const handleSaveZiyafatSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ziyafatForm.familyName || !ziyafatForm.itsNumber) return;
    const tokenNo = `TKN-${String(ziyafatSlots.length + 1).padStart(3, '0')}`;
    const newSlot: ZiyafatSlot = {
      id: `ZS-${Date.now()}`,
      tokenNo,
      itsNumber: ziyafatForm.itsNumber,
      familyName: ziyafatForm.familyName,
      mohallah: ziyafatForm.mohallah,
      slotDate: ziyafatForm.slotDate,
      slotTime: ziyafatForm.slotTime,
      type: ziyafatForm.type,
      attendeesCount: parseInt(ziyafatForm.attendeesCount) || 4,
      status: 'Confirmed',
      remarks: ziyafatForm.remarks,
    };
    const updated = [newSlot, ...ziyafatSlots];
    setZiyafatSlots(updated);
    saveZiyafatSlots(updated);
    appendSafarAuditLog(currentUser.username, 'ZIYAFAT_TOKEN_ISSUED', `Issued Token ${tokenNo} for ${newSlot.familyName}.`);
    setShowZiyafatModal(false);
    showToast(`Token ${tokenNo} issued for ${newSlot.familyName}.`);
  };

  const handleSaveBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingForm.personName || !bookingForm.itsNumber) return;
    const purpose = appointmentPurposes.find((p) => p.id === bookingForm.purposeId);
    const newBooking: AppointmentBooking = {
      id: `BK-${Date.now()}`,
      bookingCode: `APT-1447-${String(appointmentBookings.length + 1).padStart(3, '0')}`,
      slotId: `SLOT-${Date.now()}`,
      itsNumber: bookingForm.itsNumber,
      personName: bookingForm.personName,
      mobile: bookingForm.mobile,
      officialRole: bookingForm.officialRole,
      appointmentDate: bookingForm.appointmentDate,
      appointmentTime: bookingForm.appointmentTime,
      purposeId: bookingForm.purposeId,
      purposeName: purpose ? purpose.title : 'General Consultation',
      status: 'Confirmed',
      notes: bookingForm.notes,
    };
    const updated = [newBooking, ...appointmentBookings];
    setAppointmentBookings(updated);
    saveAppointmentBookings(updated);
    setShowBookingModal(false);
    showToast(`Appointment booked successfully! Ref: ${newBooking.bookingCode}`);
  };

  const handleDispatchWhatsApp = () => {
    setIsDispatching(true);
    setTimeout(() => {
      const template = whatsappTemplates.find((t) => t.id === selectedTemplateId);
      const recipientCount = targetAudience === 'All' ? 420 : 68;
      const newLog: WhatsAppDispatchLog = {
        id: `WLOG-${Date.now()}`,
        recipientName: `${targetAudience} Mumineen (${recipientCount} recipients)`,
        mobile: 'Broadcast Gateway',
        templateTitle: template ? template.title : 'Custom Broadcast',
        messagePreview: customMsgText.substring(0, 90) + '...',
        dispatchedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        status: 'Delivered',
        triggeredBy: currentUser.username,
      };
      const updated = [newLog, ...whatsappLogs];
      setWhatsappLogs(updated);
      saveWhatsAppLogs(updated);
      setIsDispatching(false);
      showToast(`WhatsApp Broadcast dispatched to ${recipientCount} recipients successfully.`);
    }, 800);
  };

  return (
    <div className="space-y-6">
      {/* Top 4 Special Modules Switcher */}
      <div className="bg-white border border-[#D97706]/30 rounded-xl p-2 shadow-xs flex flex-wrap gap-2 text-xs font-semibold">
        {[
          { id: 'safar', label: 'Huzurala Safar Mubarak Management', icon: Plane, color: 'text-amber-600' },
          { id: 'haj-mazar', label: 'Haj & Mazar Tracking', icon: Landmark, color: 'text-emerald-600' },
          { id: 'appointments', label: 'Appointment System', icon: CalendarCheck, color: 'text-blue-600' },
          { id: 'messaging', label: 'WhatsApp Reminder Dispatch Service', icon: MessageSquare, color: 'text-purple-600' },
        ].map((sec) => {
          const Icon = sec.icon;
          const isSelected = activeSpecialSection === sec.id;
          return (
            <button
              key={sec.id}
              type="button"
              onClick={() => setActiveSpecialSection(sec.id as any)}
              className={`inline-flex items-center space-x-2 px-3.5 py-2.5 rounded-lg transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#EAB308] text-[#0F172A] font-black shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className={`w-4 h-4 ${isSelected ? 'text-[#0F172A]' : sec.color}`} />
              <span>{sec.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 1. HUZURALA SAFAR MUBARAK MODULE */}
      {/* ========================================================================= */}
      {activeSpecialSection === 'safar' && (
        <div className="space-y-6">
          {/* Sub Navigation Bar for Safar */}
          <div className="bg-slate-100/80 p-1.5 rounded-xl flex flex-wrap gap-1 text-xs font-semibold border border-slate-200">
            {[
              { id: 'dashboard', label: 'Safar Dashboard' },
              { id: 'cities', label: 'Cities & Venues' },
              { id: 'events', label: 'Events Schedule' },
              { id: 'masool', label: 'Masool Committee' },
              { id: 'takhmeen', label: 'Takhmeen Allocation' },
              { id: 'dues', label: 'Due Reports' },
              { id: 'ziyafat', label: 'Ziyafat & Qadambosi' },
            ].map((sub) => (
              <button
                key={sub.id}
                type="button"
                onClick={() => setSafarSubTab(sub.id as any)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  safarSubTab === sub.id
                    ? 'bg-white text-amber-900 font-bold shadow-xs border border-amber-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {sub.label}
              </button>
            ))}
          </div>

          {/* SAFAR DASHBOARD */}
          {safarSubTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-amber-900 via-amber-800 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-amber-400/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 text-amber-300 text-xs font-bold uppercase tracking-wider">
                    <Sparkles className="w-4 h-4" />
                    <span>Huzurala Aali Qadr Mufaddal Saifuddin (TUS) Tashreef Mubarak</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black">Safar Mubarak Central Command Portal</h2>
                  <p className="text-xs text-amber-100 max-w-2xl">
                    Coordination of protocol, venue readiness, qadambosi queue management, takhmeen collections, and ziyafat hospitality.
                  </p>
                </div>
                <div className="bg-amber-500/20 border border-amber-400/40 rounded-xl p-3 text-center shrink-0">
                  <span className="text-[10px] uppercase font-bold text-amber-200 block">Preparation Status</span>
                  <span className="text-xl font-black text-white">94% Ready</span>
                </div>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                  <span className="text-xs font-bold text-slate-500 uppercase">Safar Takhmeen Pledged</span>
                  <p className="text-2xl font-black text-slate-900 mt-1">₹{safarTotalPledged.toLocaleString('en-IN')}</p>
                  <p className="text-xs text-slate-400 mt-1">{safarTakhmeen.length} Mumineen families</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                  <span className="text-xs font-bold text-slate-500 uppercase">Total Collected</span>
                  <p className="text-2xl font-black text-emerald-700 mt-1">₹{safarTotalCollected.toLocaleString('en-IN')}</p>
                  <p className="text-xs text-emerald-600 font-semibold mt-1">
                    {Math.round((safarTotalCollected / safarTotalPledged) * 100)}% realization
                  </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                  <span className="text-xs font-bold text-slate-500 uppercase">Outstanding Dues</span>
                  <p className="text-2xl font-black text-rose-700 mt-1">₹{safarTotalDue.toLocaleString('en-IN')}</p>
                  <p className="text-xs text-rose-600 font-semibold mt-1">Pending collections</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                  <span className="text-xs font-bold text-slate-500 uppercase">Tokens Issued</span>
                  <p className="text-2xl font-black text-amber-800 mt-1">{ziyafatSlots.length}</p>
                  <p className="text-xs text-blue-600 font-semibold mt-1">Ziyafat & Qadambosi</p>
                </div>
              </div>

              {/* Safar Event Schedule Preview */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-amber-600" />
                  <span>Key Scheduled Events & Majalis</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {safarEvents.map((evt) => (
                    <div key={evt.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-900">{evt.title}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900">
                          {evt.eventType}
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px] font-semibold">{evt.venue} • {evt.cityName}</p>
                      <div className="pt-1.5 border-t border-slate-200 flex justify-between text-slate-500 text-[11px]">
                        <span>Hijri: {evt.dateHijri}</span>
                        <span className="font-mono">{evt.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SAFAR CITIES & VENUES */}
          {safarSubTab === 'cities' && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Itinerary Cities & Venues Master</h3>
                  <p className="text-xs text-slate-500">Inspection status, capacity, and designated coordinators</p>
                </div>
                {canAdd && (
                  <button
                    type="button"
                    onClick={() => setShowCityModal(true)}
                    className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-black text-[#0F172A] bg-[#EAB308] hover:bg-[#D4AF37] rounded-lg transition-all shadow-xs cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add City / Venue</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {safarCities.map((city) => (
                  <div key={city.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-slate-900 text-sm">{city.cityName}</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {city.status}
                      </span>
                    </div>
                    <p className="font-bold text-amber-900">{city.venueName}</p>
                    <p className="text-slate-500 text-[11px]">{city.address}</p>
                    <div className="pt-2 border-t border-slate-200 flex justify-between text-[11px]">
                      <span>Capacity: <strong className="text-slate-800">{city.capacity.toLocaleString()}</strong> Mumineen</span>
                      <span>Masool: <strong className="text-slate-800">{city.masoolName}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SAFAR EVENTS SCHEDULE */}
          {safarSubTab === 'events' && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Safar Event Master & Schedule</h3>
                  <p className="text-xs text-slate-500">Majalis, Vaaz Mubarak, Qadambosi, and Iftetah ceremonies</p>
                </div>
                {canAdd && (
                  <button
                    type="button"
                    onClick={() => setShowEventModal(true)}
                    className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-black text-[#0F172A] bg-[#EAB308] hover:bg-[#D4AF37] rounded-lg transition-all shadow-xs cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Safar Event</span>
                  </button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 font-bold">
                      <th className="py-2.5 px-3">Event Title</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Date (Hijri)</th>
                      <th className="py-2.5 px-3">Timing</th>
                      <th className="py-2.5 px-3">Venue & City</th>
                      <th className="py-2.5 px-3">Masool Incharge</th>
                      <th className="py-2.5 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {safarEvents.map((evt) => (
                      <tr key={evt.id} className="hover:bg-amber-50/30 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-slate-900">{evt.title}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900">
                            {evt.eventType}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-700">{evt.dateHijri}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">{evt.time}</td>
                        <td className="py-2.5 px-3 text-slate-800">{evt.venue}, {evt.cityName}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-700">{evt.masoolName}</td>
                        <td className="py-2.5 px-3 text-right">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {evt.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SAFAR MASOOL INCHARGE COMMITTEE */}
          {safarSubTab === 'masool' && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Safar Masool In-Charge Committee</h3>
                  <p className="text-xs text-slate-500">Designated coordinators for security, kitchen, seating, and logistics</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {safarMasool.map((sm) => (
                  <div key={sm.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{sm.name}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-900">
                        {sm.department}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">{sm.assignedDuty}</p>
                    <div className="pt-2 border-t border-slate-200 flex justify-between text-[11px]">
                      <span className="font-mono text-slate-600">{sm.mobile}</span>
                      <span className="font-mono font-bold text-slate-400">ITS {sm.itsNumber}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SAFAR TAKHMEEN ALLOCATION & PAYMENT */}
          {safarSubTab === 'takhmeen' && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Safar Mubarak Takhmeen Allocation & Payment Entry</h3>
                  <p className="text-xs text-slate-500">Family pledges, POS receipt payments, and real-time dues tracking</p>
                </div>
                {canAdd && (
                  <button
                    type="button"
                    onClick={() => setShowTakhmeenModal(true)}
                    className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-black text-[#0F172A] bg-[#EAB308] hover:bg-[#D4AF37] rounded-lg transition-all shadow-xs cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Allocate Takhmeen</span>
                  </button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 font-bold">
                      <th className="py-2.5 px-3">ITS #</th>
                      <th className="py-2.5 px-3">HOF Name</th>
                      <th className="py-2.5 px-3">Mohallah</th>
                      <th className="py-2.5 px-3 text-right">Pledged Amount</th>
                      <th className="py-2.5 px-3 text-right">Paid Amount</th>
                      <th className="py-2.5 px-3 text-right">Balance Due</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {safarTakhmeen.map((tak) => (
                      <tr key={tak.id} className="hover:bg-amber-50/30 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{tak.itsNumber}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">{tak.hofName}</td>
                        <td className="py-2.5 px-3 text-slate-600">{tak.mohallah}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                          ₹{tak.pledgedAmount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-black text-emerald-700">
                          ₹{tak.paidAmount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-black text-rose-700">
                          ₹{tak.balanceDue.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              tak.status === 'Paid'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-900'
                            }`}
                          >
                            {tak.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {tak.balanceDue > 0 ? (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedTakhmeenForPay(tak);
                                setPaymentAmount(String(tak.balanceDue));
                                setShowPaymentModal(true);
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-[11px] cursor-pointer"
                            >
                              Pay Now
                            </button>
                          ) : (
                            <span className="text-emerald-700 font-bold text-[11px]">Settled</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SAFAR DUE REPORTS */}
          {safarSubTab === 'dues' && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Safar Outstanding Due Reports</h3>
                  <p className="text-xs text-slate-500">Unsettled pledges sorted for mohallah follow-ups</p>
                </div>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Due Report</span>
                </button>
              </div>

              <div className="space-y-3">
                {safarTakhmeen
                  .filter((t) => t.balanceDue > 0)
                  .map((t) => (
                    <div
                      key={t.id}
                      className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/40 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-900 text-sm">{t.hofName}</span>
                        <p className="text-slate-500 text-[11px] mt-0.5">
                          ITS: {t.itsNumber} • {t.mohallah} • {t.mobile}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black text-rose-700">
                          Due: ₹{t.balanceDue.toLocaleString('en-IN')}
                        </span>
                        <p className="text-[10px] text-slate-400">Total: ₹{t.pledgedAmount.toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* ZIYAFAT & QADAMBOSI SCHEDULING */}
          {safarSubTab === 'ziyafat' && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Ziyafat Mubarak & Qadambosi Queue Scheduling</h3>
                  <p className="text-xs text-slate-500">Time slots, token numbers, and attendance verification</p>
                </div>
                {canAdd && (
                  <button
                    type="button"
                    onClick={() => setShowZiyafatModal(true)}
                    className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-black text-[#0F172A] bg-[#EAB308] hover:bg-[#D4AF37] rounded-lg transition-all shadow-xs cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Issue Ziyafat Token</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {ziyafatSlots.map((slot) => (
                  <div key={slot.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-black text-base text-amber-900">{slot.tokenNo}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {slot.status}
                      </span>
                    </div>
                    <p className="font-bold text-slate-900 text-sm">{slot.familyName}</p>
                    <p className="text-slate-500 text-[11px]">{slot.type} • {slot.attendeesCount} Family Attendees</p>
                    <div className="pt-2 border-t border-slate-200 flex justify-between text-[11px]">
                      <span>Date: <strong className="text-slate-800">{slot.slotDate}</strong></span>
                      <span>Slot: <strong className="text-slate-800">{slot.slotTime}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. HAJ & MAZAR MANAGEMENT MODULE */}
      {/* ========================================================================= */}
      {activeSpecialSection === 'haj-mazar' && (
        <div className="space-y-6">
          <div className="bg-slate-100/80 p-1.5 rounded-xl flex flex-wrap gap-1 text-xs font-semibold border border-slate-200">
            {[
              { id: 'haj-entries', label: 'Haj Pilgrim Registrations' },
              { id: 'haj-expenses', label: 'Haj Expense Heads' },
              { id: 'haj-ledger', label: 'Haj Financial Ledger' },
              { id: 'mazar-reg', label: 'Mazar Registrations & Rooms' },
              { id: 'mazar-tracking', label: 'Mazar Check-In & Entry Tracking' },
            ].map((sub) => (
              <button
                key={sub.id}
                type="button"
                onClick={() => setHajSubTab(sub.id as any)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  hajSubTab === sub.id
                    ? 'bg-white text-emerald-900 font-bold shadow-xs border border-emerald-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {sub.label}
              </button>
            ))}
          </div>

          {/* HAJ ENTRIES */}
          {hajSubTab === 'haj-entries' && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Haj Pilgrims Registration Master</h3>
                  <p className="text-xs text-slate-500">Official Maktab 52 registration, visa verification, and travel batches</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 font-bold">
                      <th className="py-2.5 px-3">ITS #</th>
                      <th className="py-2.5 px-3">Pilgrim Name</th>
                      <th className="py-2.5 px-3">Passport #</th>
                      <th className="py-2.5 px-3">Visa Status</th>
                      <th className="py-2.5 px-3">Travel Batch</th>
                      <th className="py-2.5 px-3 text-right">Package Cost</th>
                      <th className="py-2.5 px-3 text-right">Paid Amount</th>
                      <th className="py-2.5 px-3 text-right">Balance Due</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {hajPilgrims.map((hp) => (
                      <tr key={hp.id} className="hover:bg-emerald-50/30 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{hp.itsNumber}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          {hp.fullName} <span className="text-[10px] text-slate-400 font-normal">({hp.age}y • {hp.gender})</span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">{hp.passportNumber}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {hp.visaStatus}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-700">{hp.travelBatch}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-800">
                          ₹{hp.packageCost.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-black text-emerald-700">
                          ₹{hp.paidAmount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-black text-rose-700">
                          ₹{hp.balanceDue.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* HAJ EXPENSES */}
          {hajSubTab === 'haj-expenses' && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Haj Expense Heads & Allocations</h3>
                  <p className="text-xs text-slate-500">Charter airfare, five-star hotel lodging in Medina & Makkah</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {hajExpenseHeads.map((h) => (
                  <div key={h.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
                    <span className="font-mono text-[10px] font-bold text-slate-400">{h.code}</span>
                    <h4 className="font-bold text-slate-900 text-sm">{h.name}</h4>
                    <p className="text-xl font-black text-slate-900">
                      ₹{h.allocatedBudget.toLocaleString('en-IN')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MAZAR REGISTRATIONS */}
          {hajSubTab === 'mazar-reg' && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Mazar Ziyarat Registrations & Room Allotments</h3>
                  <p className="text-xs text-slate-500">Visiting zawaar accommodation, arrival dates, and mazar contributions</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mazarRegs.map((mz) => (
                  <div key={mz.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-amber-900">{mz.registrationNo}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {mz.status}
                      </span>
                    </div>
                    <p className="font-bold text-slate-900 text-sm">{mz.visitorName} ({mz.originCity})</p>
                    <p className="text-slate-600 font-semibold">{mz.roomNo} • {mz.guestsCount} Guests</p>
                    <div className="pt-2 border-t border-slate-200 flex justify-between text-[11px]">
                      <span>Stay: {mz.arrivalDate} – {mz.departureDate}</span>
                      <span className="font-bold text-emerald-700">Contribution: ₹{mz.mazarContribution}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MAZAR ENTRY TRACKING */}
          {hajSubTab === 'mazar-tracking' && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Mazar Security Entry & Check-In Tracking</h3>
                  <p className="text-xs text-slate-500">Active tokens, gate entry passes, and departure verification</p>
                </div>
              </div>

              <div className="p-6 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center space-y-2">
                <ShieldCheck className="w-8 h-8 text-emerald-600 mx-auto" />
                <p className="text-xs font-bold text-slate-800">Mazar Gate Scanner Integration Online</p>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                  Scan visitor ITS barcode or RFID badge at the Mazar entrance gate for instant gate pass printing.
                </p>
              </div>
            </div>
          )}

          {/* HAJ LEDGER */}
          {hajSubTab === 'haj-ledger' && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
              <h3 className="text-base font-bold text-slate-900">Haj Financial Reconciliation Ledger</h3>
              <p className="text-xs text-slate-500">Consolidated collections vs disbursements for current Maktab 52 batch</p>
              <div className="p-4 bg-slate-50 rounded-xl flex justify-between items-center text-xs">
                <div>
                  <span className="text-slate-500">Total Pilgrim Receipts:</span>
                  <p className="text-lg font-black text-emerald-700">₹12,00,000</p>
                </div>
                <div>
                  <span className="text-slate-500">Total Disbursements:</span>
                  <p className="text-lg font-black text-rose-700">₹8,50,000</p>
                </div>
                <div>
                  <span className="text-slate-500">Net Surplus in Escrow:</span>
                  <p className="text-lg font-black text-slate-900">₹3,50,000</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. APPOINTMENT SYSTEM */}
      {/* ========================================================================= */}
      {activeSpecialSection === 'appointments' && (
        <div className="space-y-6">
          <div className="bg-slate-100/80 p-1.5 rounded-xl flex flex-wrap gap-1 text-xs font-semibold border border-slate-200">
            {[
              { id: 'slots', label: 'Slot Lists & Assigning' },
              { id: 'booking', label: 'Book Appointment' },
              { id: 'blocking', label: 'Block Slots' },
              { id: 'purposes', label: 'Purpose Management' },
            ].map((sub) => (
              <button
                key={sub.id}
                type="button"
                onClick={() => setAptSubTab(sub.id as any)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  aptSubTab === sub.id
                    ? 'bg-white text-blue-900 font-bold shadow-xs border border-blue-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {sub.label}
              </button>
            ))}
          </div>

          {/* SLOTS & ASSIGNING */}
          {aptSubTab === 'slots' && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Appointment Slots & Capacity Schedule</h3>
                  <p className="text-xs text-slate-500">Official interview and consultation slots with Janab Amil Saheb & leaders</p>
                </div>
                {canAdd && (
                  <button
                    type="button"
                    onClick={() => setShowBookingModal(true)}
                    className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-black text-[#0F172A] bg-[#EAB308] hover:bg-[#D4AF37] rounded-lg transition-all shadow-xs cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Book New Appointment</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {appointmentSlots.map((slot) => (
                  <div
                    key={slot.id}
                    className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                      slot.isBlocked
                        ? 'bg-rose-50 border-rose-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{slot.officialRole}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          slot.isBlocked
                            ? 'bg-rose-200 text-rose-900'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {slot.isBlocked ? 'Blocked' : 'Available'}
                      </span>
                    </div>
                    <p className="text-slate-600 font-mono">
                      {slot.slotDate} • {slot.startTime} – {slot.endTime}
                    </p>
                    {slot.isBlocked ? (
                      <p className="text-[10px] text-rose-700 italic">{slot.blockReason}</p>
                    ) : (
                      <p className="text-[11px] text-slate-500">
                        Booked: {slot.bookedCount} / {slot.capacity}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ACTIVE BOOKINGS LIST */}
          {aptSubTab === 'booking' && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Confirmed Appointments Registry</h3>
                  <p className="text-xs text-slate-500">Scheduled interviews and consultations with queue codes</p>
                </div>
                {canAdd && (
                  <button
                    type="button"
                    onClick={() => setShowBookingModal(true)}
                    className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-black text-[#0F172A] bg-[#EAB308] hover:bg-[#D4AF37] rounded-lg transition-all shadow-xs cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Book Appointment</span>
                  </button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 font-bold">
                      <th className="py-2.5 px-3">Code</th>
                      <th className="py-2.5 px-3">ITS #</th>
                      <th className="py-2.5 px-3">Mumin Name</th>
                      <th className="py-2.5 px-3">Official Role</th>
                      <th className="py-2.5 px-3">Date & Time</th>
                      <th className="py-2.5 px-3">Purpose</th>
                      <th className="py-2.5 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {appointmentBookings.map((bk) => (
                      <tr key={bk.id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-blue-900">{bk.bookingCode}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{bk.itsNumber}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">{bk.personName}</td>
                        <td className="py-2.5 px-3 text-slate-700">{bk.officialRole}</td>
                        <td className="py-2.5 px-3 text-slate-600">{bk.appointmentDate} at {bk.appointmentTime}</td>
                        <td className="py-2.5 px-3 text-amber-900 font-semibold">{bk.purposeName}</td>
                        <td className="py-2.5 px-3 text-right">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {bk.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* BLOCKING SLOTS */}
          {aptSubTab === 'blocking' && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900">Block Appointment Slots (Holidays & Urgent Travel)</h3>
              <p className="text-xs text-slate-500">Prevent booking during official leave or Janab's out-of-station days</p>

              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs space-y-2">
                <span className="font-bold text-amber-900">Quick Holiday Blocking Rule</span>
                <p className="text-slate-600">
                  Select official and range to automatically block all public slots during Miqaat Ohbat or travel.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const updated = [
                      ...appointmentSlots,
                      {
                        id: `SLOT-${Date.now()}`,
                        slotDate: '2026-11-01',
                        startTime: '10:00 AM',
                        endTime: '01:00 PM',
                        officialRole: 'Janab Aamil Saheb' as const,
                        capacity: 1,
                        bookedCount: 0,
                        isBlocked: true,
                        blockReason: 'Official Miqaat Holiday',
                      },
                    ];
                    setAppointmentSlots(updated);
                    saveAppointmentSlots(updated);
                    showToast('Slot blocked successfully.');
                  }}
                  className="px-3 py-1.5 bg-rose-600 text-white font-bold rounded text-xs cursor-pointer"
                >
                  Block Upcoming Miqaat Sunday
                </button>
              </div>
            </div>
          )}

          {/* PURPOSE MANAGEMENT */}
          {aptSubTab === 'purposes' && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900">Consultation Purpose Master</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {appointmentPurposes.map((p) => (
                  <div key={p.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1 text-xs">
                    <span className="font-bold text-slate-900 text-sm">{p.title}</span>
                    <p className="text-slate-500 text-[11px]">{p.description}</p>
                    <div className="pt-2 border-t border-slate-200 flex justify-between text-[10px] text-slate-400">
                      <span>Duration: {p.typicalDurationMins} Mins</span>
                      <span>{p.requiresDocuments ? 'Docs Required' : 'No Docs Required'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. WHATSAPP MESSAGING SERVICE */}
      {/* ========================================================================= */}
      {activeSpecialSection === 'messaging' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Message Composer */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5 text-purple-600" />
                  <span>WhatsApp Community Broadcast Dispatcher</span>
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  WATI API Live
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Select Message Template</label>
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => {
                      setSelectedTemplateId(e.target.value);
                      const t = whatsappTemplates.find((x) => x.id === e.target.value);
                      if (t) setCustomMsgText(t.messageBody);
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-purple-500"
                  >
                    {whatsappTemplates.map((tpl) => (
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
                    onChange={(e) => setTargetAudience(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="All">All Registered Mumineen (420 Contacts)</option>
                    <option value="Safar Defaulters">Safar Takhmeen Defaulters (68 Contacts)</option>
                    <option value="FMB Defaulters">FMB / Sabeel Defaulters (94 Contacts)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Message Text Preview / Customizer</label>
                  <textarea
                    rows={5}
                    value={customMsgText}
                    onChange={(e) => setCustomMsgText(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-sans focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Variables like [Name], [Amount], [Date] will be replaced dynamically from member master.
                  </p>
                </div>

                <div className="flex justify-end pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={isDispatching}
                    onClick={handleDispatchWhatsApp}
                    className="inline-flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-lg transition-all shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isDispatching ? 'Dispatching...' : 'Dispatch Broadcast Queue'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Dispatch Audit Trail */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Clock className="w-4 h-4 text-purple-600" />
                <span>Recent WhatsApp Dispatch Logs</span>
              </h3>

              <div className="space-y-3">
                {whatsappLogs.map((log) => (
                  <div key={log.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{log.recipientName}</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                        {log.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-2">{log.messagePreview}</p>
                    <div className="pt-1 border-t border-slate-200/50 flex justify-between text-[10px] text-slate-400">
                      <span>{log.dispatchedAt}</span>
                      <span>By @{log.triggeredBy}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD CITY */}
      {showCityModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-amber-300 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Add Safar City & Venue</h3>
              <button type="button" onClick={() => setShowCityModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveCity} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">City Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Udaipur"
                    value={cityForm.cityName}
                    onChange={(e) => setCityForm({ ...cityForm, cityName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Venue Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Saifee Hall Enclave"
                    value={cityForm.venueName}
                    onChange={(e) => setCityForm({ ...cityForm, venueName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Venue Address</label>
                <input
                  type="text"
                  placeholder="Address..."
                  value={cityForm.address}
                  onChange={(e) => setCityForm({ ...cityForm, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Max Capacity</label>
                  <input
                    type="number"
                    value={cityForm.capacity}
                    onChange={(e) => setCityForm({ ...cityForm, capacity: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Masool Coordinator</label>
                  <input
                    type="text"
                    placeholder="Masool Name"
                    value={cityForm.masoolName}
                    onChange={(e) => setCityForm({ ...cityForm, masoolName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowCityModal(false)} className="px-4 py-2 border border-slate-300 rounded-lg cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-[#EAB308] hover:bg-[#D4AF37] text-[#0F172A] font-black rounded-lg cursor-pointer">
                  Save Venue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ALLOCATE SAFAR TAKHMEEN */}
      {showTakhmeenModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-amber-300 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Allocate Safar Takhmeen Pledge</h3>
              <button type="button" onClick={() => setShowTakhmeenModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveTakhmeen} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ITS Number</label>
                  <input
                    type="text"
                    required
                    placeholder="8-digit ITS"
                    value={takhmeenForm.itsNumber}
                    onChange={(e) => setTakhmeenForm({ ...takhmeenForm, itsNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">HOF Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Head of Family Name"
                    value={takhmeenForm.hofName}
                    onChange={(e) => setTakhmeenForm({ ...takhmeenForm, hofName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mohallah</label>
                  <input
                    type="text"
                    value={takhmeenForm.mohallah}
                    onChange={(e) => setTakhmeenForm({ ...takhmeenForm, mohallah: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pledged Amount (₹)</label>
                  <input
                    type="number"
                    required
                    value={takhmeenForm.pledgedAmount}
                    onChange={(e) => setTakhmeenForm({ ...takhmeenForm, pledgedAmount: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-black text-slate-900"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowTakhmeenModal(false)} className="px-4 py-2 border border-slate-300 rounded-lg cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-[#EAB308] hover:bg-[#D4AF37] text-[#0F172A] font-black rounded-lg cursor-pointer">
                  Save Pledge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PROCESS PAYMENT */}
      {showPaymentModal && selectedTakhmeenForPay && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-emerald-300 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Record Safar Payment</h3>
              <button type="button" onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1">
              <span className="font-bold text-slate-900">{selectedTakhmeenForPay.hofName}</span>
              <p className="text-slate-500 font-mono">ITS: {selectedTakhmeenForPay.itsNumber}</p>
              <p className="font-bold text-rose-700">Remaining Balance: ₹{selectedTakhmeenForPay.balanceDue.toLocaleString('en-IN')}</p>
            </div>

            <form onSubmit={handleProcessSafarPayment} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Payment Amount (₹)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-black text-emerald-700"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Payment Mode</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold"
                >
                  <option value="UPI">UPI / QR Code</option>
                  <option value="Bank Transfer">Bank Transfer / NEFT</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Cash">Cash Vault</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowPaymentModal(false)} className="px-4 py-2 border border-slate-300 rounded-lg cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-lg cursor-pointer">
                  Confirm Payment Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: BOOK APPOINTMENT */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-blue-300 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Book Official Appointment</h3>
              <button type="button" onClick={() => setShowBookingModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBooking} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ITS Number</label>
                  <input
                    type="text"
                    required
                    placeholder="8-digit ITS"
                    value={bookingForm.itsNumber}
                    onChange={(e) => setBookingForm({ ...bookingForm, itsNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Applicant Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Full Name"
                    value={bookingForm.personName}
                    onChange={(e) => setBookingForm({ ...bookingForm, personName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Official Role</label>
                  <select
                    value={bookingForm.officialRole}
                    onChange={(e) => setBookingForm({ ...bookingForm, officialRole: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                  >
                    <option value="Janab Aamil Saheb">Janab Aamil Saheb</option>
                    <option value="Executive Secretary">Executive Secretary</option>
                    <option value="Qaza Tribunal">Qaza Tribunal</option>
                    <option value="FMB Coordinator">FMB Coordinator</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Consultation Purpose</label>
                  <select
                    value={bookingForm.purposeId}
                    onChange={(e) => setBookingForm({ ...bookingForm, purposeId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  >
                    {appointmentPurposes.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Appointment Date</label>
                  <input
                    type="date"
                    value={bookingForm.appointmentDate}
                    onChange={(e) => setBookingForm({ ...bookingForm, appointmentDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Time Slot</label>
                  <select
                    value={bookingForm.appointmentTime}
                    onChange={(e) => setBookingForm({ ...bookingForm, appointmentTime: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                  >
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="10:30 AM">10:30 AM</option>
                    <option value="11:00 AM">11:00 AM</option>
                    <option value="04:00 PM">04:00 PM</option>
                    <option value="04:30 PM">04:30 PM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Brief Notes / Intention</label>
                <textarea
                  rows={2}
                  placeholder="Context for Janab or Tribunal..."
                  value={bookingForm.notes}
                  onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowBookingModal(false)} className="px-4 py-2 border border-slate-300 rounded-lg cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-lg cursor-pointer">
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ISSUE ZIYAFAT TOKEN */}
      {showZiyafatModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-amber-300 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Issue Ziyafat Mubarak Token</h3>
              <button type="button" onClick={() => setShowZiyafatModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveZiyafatSlot} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ITS Number</label>
                  <input
                    type="text"
                    required
                    placeholder="8-digit ITS"
                    value={ziyafatForm.itsNumber}
                    onChange={(e) => setZiyafatForm({ ...ziyafatForm, itsNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Family Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mulla Shabbir Vasi Family"
                    value={ziyafatForm.familyName}
                    onChange={(e) => setZiyafatForm({ ...ziyafatForm, familyName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Slot Date</label>
                  <input
                    type="text"
                    value={ziyafatForm.slotDate}
                    onChange={(e) => setZiyafatForm({ ...ziyafatForm, slotDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Slot Time</label>
                  <input
                    type="text"
                    value={ziyafatForm.slotTime}
                    onChange={(e) => setZiyafatForm({ ...ziyafatForm, slotTime: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Type</label>
                  <select
                    value={ziyafatForm.type}
                    onChange={(e) => setZiyafatForm({ ...ziyafatForm, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="Ziyafat Mubarak">Ziyafat Mubarak</option>
                    <option value="Qadambosi Private">Qadambosi Private</option>
                    <option value="Sharaf Consultation">Sharaf Consultation</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Attendees Count</label>
                  <input
                    type="number"
                    value={ziyafatForm.attendeesCount}
                    onChange={(e) => setZiyafatForm({ ...ziyafatForm, attendeesCount: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowZiyafatModal(false)} className="px-4 py-2 border border-slate-300 rounded-lg cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-[#EAB308] hover:bg-[#D4AF37] text-[#0F172A] font-black rounded-lg cursor-pointer">
                  Generate Token
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
