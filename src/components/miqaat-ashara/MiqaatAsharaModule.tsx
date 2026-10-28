import React, { useState, useMemo } from 'react';
import {
  UserProfile,
  FinancialYear,
} from '../../types';
import {
  MiqaatEvent,
  MasallaRegistration,
  AsharaMajlis,
  MajlisTimeSlot,
  MajlisBlockQuota,
  AsharaRegistration,
  MIQAAT_EVENTS_KEY,
  MASALLA_REGISTRATIONS_KEY,
  ASHARA_MAJLIS_KEY,
  ASHARA_SLOTS_KEY,
  ASHARA_BLOCKS_KEY,
  ASHARA_REGISTRATIONS_KEY,
  INITIAL_MIQAAT_EVENTS,
  INITIAL_MASALLA_REGISTRATIONS,
  INITIAL_ASHARA_MAJLIS,
  INITIAL_ASHARA_SLOTS,
  INITIAL_ASHARA_BLOCKS,
  INITIAL_ASHARA_REGISTRATIONS,
  loadFromStorage,
  saveToStorage,
} from '../../utils/part3Management';
import { appendActivityLog } from '../../utils/rbac';
import {
  Sparkles,
  Plus,
  Search,
  Printer,
  Calendar,
  X,
  Radio,
  Tv,
  Upload,
  UserCheck,
  Armchair,
  Clock,
  BadgeCheck,
} from 'lucide-react';

interface MiqaatAsharaModuleProps {
  currentUser: UserProfile;
  activeSubItemId: string;
  subItemLabel: string;
  financialYear: FinancialYear;
  showToast: (msg: string) => void;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export const MiqaatAsharaModule: React.FC<MiqaatAsharaModuleProps> = ({
  currentUser,
  activeSubItemId,
  showToast,
  canAdd,
}) => {
  // Local state with localStorage synchronization
  const [events, setEvents] = useState<MiqaatEvent[]>(() =>
    loadFromStorage(MIQAAT_EVENTS_KEY, INITIAL_MIQAAT_EVENTS)
  );
  const [masallas, setMasallas] = useState<MasallaRegistration[]>(() =>
    loadFromStorage(MASALLA_REGISTRATIONS_KEY, INITIAL_MASALLA_REGISTRATIONS)
  );
  const [majlisList, setMajlisList] = useState<AsharaMajlis[]>(() =>
    loadFromStorage(ASHARA_MAJLIS_KEY, INITIAL_ASHARA_MAJLIS)
  );
  const [slots, setSlots] = useState<MajlisTimeSlot[]>(() =>
    loadFromStorage(ASHARA_SLOTS_KEY, INITIAL_ASHARA_SLOTS)
  );
  const [blocks, setBlocks] = useState<MajlisBlockQuota[]>(() =>
    loadFromStorage(ASHARA_BLOCKS_KEY, INITIAL_ASHARA_BLOCKS)
  );
  const [asharaPasses, setAsharaPasses] = useState<AsharaRegistration[]>(() =>
    loadFromStorage(ASHARA_REGISTRATIONS_KEY, INITIAL_ASHARA_REGISTRATIONS)
  );

  // Tab State
  const [activeTab, setActiveTab] = useState<string>(activeSubItemId);
  React.useEffect(() => {
    setActiveTab(activeSubItemId);
  }, [activeSubItemId]);

  const [selectedEventId, setSelectedEventId] = useState<string>(events[2]?.id || events[0]?.id || '');

  // Modals
  const [isNewEventModalOpen, setIsNewEventModalOpen] = useState(false);
  const [isRegisterMasallaModalOpen, setIsRegisterMasallaModalOpen] = useState(false);
  const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false);
  const [isNewAsharaPassModalOpen, setIsNewAsharaPassModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedMasalla, setSelectedMasalla] = useState<MasallaRegistration | null>(null);
  const [activePrintPass, setActivePrintPass] = useState<AsharaRegistration | null>(null);

  // Forms
  const [eventForm, setEventForm] = useState({
    name: '',
    hijriDate: '16 Rabi-us-Saani 1448',
    gregorianDate: '2026-11-20',
    venue: 'Burhani Masjid Complex',
    totalCapacity: 1500,
    hasAudioVideoRelay: true,
    relayDetails: 'Internal optical fiber distribution to 4 overflow halls',
  });

  const [masallaForm, setMasallaForm] = useState({
    itsNumber: '',
    muminName: '',
    gender: 'MALE' as 'MALE' | 'FEMALE',
    age: 45,
    mohallah: 'Burhani Mohallah',
    mobile: '',
    isSeniorCitizen: false,
    needsChairSupport: false,
  });

  const [allocationForm, setAllocationForm] = useState({
    allocatedFloor: 'Ground Floor',
    allocatedHall: 'Main Masjid',
    allocatedRow: 'Row B',
    masallaNumber: 'M-22',
  });

  const [asharaForm, setAsharaForm] = useState({
    itsNumber: '',
    fullName: '',
    gender: 'MALE' as 'MALE' | 'FEMALE',
    age: 32,
    category: 'LOCAL_HOF' as AsharaRegistration['category'],
    blockAllocated: blocks[0]?.blockCode || 'GF-M-MAIN',
    seatBadge: 'Zone 1 / Seat 10',
    rfidCardNo: '',
    specialAssistance: false,
  });

  // Bulk Import text state
  const [importText, setImportText] = useState(
    '30489199,Burhanuddin Hakim,MALE,42,Burhani Mohallah,GF-M-MAIN\n20394855,Husaina Rampura,FEMALE,38,Saifee Mohallah,FF-F-MAIN\n70192811,Taha Godhra,MALE,21,Badri Mohallah,SF-ALL-RELAY'
  );

  // Summary Metrics
  const summary = useMemo(() => {
    const totalEventsCount = events.length;
    const totalMasallaAllocated = masallas.filter((m) => m.isAllocated).length;
    const totalAsharaRegistrations = asharaPasses.length;
    const checkedInCount = asharaPasses.filter((p) => p.status === 'CHECKED_IN').length;
    return { totalEventsCount, totalMasallaAllocated, totalAsharaRegistrations, checkedInCount };
  }, [events, masallas, asharaPasses]);

  // Handle Event Submit
  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventForm.name) {
      showToast('Please enter event title');
      return;
    }
    const newEvent: MiqaatEvent = {
      id: `me-${Date.now()}`,
      name: eventForm.name,
      hijriDate: eventForm.hijriDate,
      gregorianDate: eventForm.gregorianDate,
      venue: eventForm.venue,
      totalCapacity: Number(eventForm.totalCapacity),
      allocatedMasallaCount: 0,
      attendanceCount: 0,
      hasAudioVideoRelay: eventForm.hasAudioVideoRelay,
      relayDetails: eventForm.relayDetails,
      status: 'UPCOMING',
    };

    const updated = [newEvent, ...events];
    setEvents(updated);
    saveToStorage(MIQAAT_EVENTS_KEY, updated);

    appendActivityLog(
      currentUser.username,
      'Miqaat & Ashara Ohbat',
      'Miqaat Master & Calendar',
      'ADD',
      `Scheduled new Miqaat event: ${eventForm.name} on ${eventForm.hijriDate}`
    );

    showToast(`Event "${eventForm.name}" created!`);
    setIsNewEventModalOpen(false);
  };

  // Handle Masalla Booking
  const handleRegisterMasalla = (e: React.FormEvent) => {
    e.preventDefault();
    if (!masallaForm.itsNumber || !masallaForm.muminName) {
      showToast('Please enter valid ITS and name');
      return;
    }
    const targetEvent = events.find((ev) => ev.id === selectedEventId) || events[0];
    const newNo = `MAS-${new Date().getFullYear()}-${String(masallas.length + 1).padStart(3, '0')}`;

    const newMasalla: MasallaRegistration = {
      id: `mreg-${Date.now()}`,
      registrationNo: newNo,
      miqaatId: targetEvent.id,
      miqaatName: targetEvent.name,
      itsNumber: masallaForm.itsNumber,
      muminName: masallaForm.muminName,
      gender: masallaForm.gender,
      age: Number(masallaForm.age),
      mohallah: masallaForm.mohallah,
      mobile: masallaForm.mobile,
      isSeniorCitizen: masallaForm.isSeniorCitizen || Number(masallaForm.age) >= 65,
      needsChairSupport: masallaForm.needsChairSupport,
      isAllocated: false,
      attended: false,
      registeredDate: new Date().toISOString().split('T')[0],
    };

    const updated = [newMasalla, ...masallas];
    setMasallas(updated);
    saveToStorage(MASALLA_REGISTRATIONS_KEY, updated);

    showToast(`Masalla registration ${newNo} confirmed for ${masallaForm.muminName}!`);
    setIsRegisterMasallaModalOpen(false);
  };

  // Handle Masalla Allocation
  const handleConfirmAllocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMasalla) return;

    const updated = masallas.map((m) => {
      if (m.id === selectedMasalla.id) {
        return {
          ...m,
          allocatedFloor: allocationForm.allocatedFloor,
          allocatedHall: allocationForm.allocatedHall,
          allocatedRow: allocationForm.allocatedRow,
          masallaNumber: allocationForm.masallaNumber,
          isAllocated: true,
        };
      }
      return m;
    });

    setMasallas(updated);
    saveToStorage(MASALLA_REGISTRATIONS_KEY, updated);

    // Increment event allocated count
    const updatedEvents = events.map((ev) =>
      ev.id === selectedMasalla.miqaatId
        ? { ...ev, allocatedMasallaCount: ev.allocatedMasallaCount + 1 }
        : ev
    );
    setEvents(updatedEvents);
    saveToStorage(MIQAAT_EVENTS_KEY, updatedEvents);

    showToast(`Allocated Seat ${allocationForm.masallaNumber} to ${selectedMasalla.muminName}!`);
    setIsAllocateModalOpen(false);
    setSelectedMasalla(null);
  };

  // Handle Ashara Pass Submit
  const handleCreateAsharaPass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!asharaForm.itsNumber || !asharaForm.fullName) {
      showToast('Please enter full name and ITS');
      return;
    }
    const passNo = `ASH-1448-${String(asharaPasses.length + 1).padStart(3, '0')}`;
    const newPass: AsharaRegistration = {
      id: `areg-${Date.now()}`,
      passNo,
      itsNumber: asharaForm.itsNumber,
      fullName: asharaForm.fullName,
      gender: asharaForm.gender,
      age: Number(asharaForm.age),
      category: asharaForm.category,
      blockAllocated: asharaForm.blockAllocated,
      seatBadge: asharaForm.seatBadge,
      rfidCardNo: asharaForm.rfidCardNo || `RFID-${Date.now().toString().slice(-4)}`,
      specialAssistance: asharaForm.specialAssistance,
      registeredOn: new Date().toISOString().split('T')[0],
      status: 'CONFIRMED',
    };

    const updated = [newPass, ...asharaPasses];
    setAsharaPasses(updated);
    saveToStorage(ASHARA_REGISTRATIONS_KEY, updated);

    showToast(`Ashara Pass ${passNo} issued for ${asharaForm.fullName}!`);
    setIsNewAsharaPassModalOpen(false);
    setActivePrintPass(newPass);
  };

  // Handle Bulk Import
  const handleProcessImport = () => {
    const lines = importText.trim().split('\n');
    let importedCount = 0;
    const newPasses: AsharaRegistration[] = [];

    lines.forEach((line) => {
      const parts = line.split(',').map((p) => p.trim());
      if (parts.length >= 4) {
        const [its, name, gender, age, mohallah, block] = parts;
        const passNo = `ASH-1448-${String(asharaPasses.length + importedCount + 1).padStart(3, '0')}`;
        newPasses.push({
          id: `areg-${Date.now()}-${importedCount}`,
          passNo,
          itsNumber: its,
          fullName: name,
          gender: gender === 'FEMALE' ? 'FEMALE' : 'MALE',
          age: Number(age) || 30,
          category: 'LOCAL_FM',
          blockAllocated: block || 'GF-M-MAIN',
          seatBadge: `Batch Seat #${importedCount + 1}`,
          specialAssistance: false,
          registeredOn: new Date().toISOString().split('T')[0],
          status: 'CONFIRMED',
        });
        importedCount++;
      }
    });

    if (importedCount === 0) {
      showToast('Could not parse any valid lines from the CSV input.');
      return;
    }

    const updated = [...newPasses, ...asharaPasses];
    setAsharaPasses(updated);
    saveToStorage(ASHARA_REGISTRATIONS_KEY, updated);

    showToast(`Successfully imported and generated ${importedCount} Ashara passes!`);
    setIsImportModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-yellow-900 to-amber-900 text-white rounded-2xl p-6 shadow-xl border border-amber-700/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-200 border border-amber-400/30">
                Miqaat & Ohbat Command Center
              </span>
              <span className="text-xs text-amber-200/80">Barakat-e-Majlis & Seating Automation</span>
            </div>
            <h1 className="text-2xl font-black mt-1 tracking-tight text-white flex items-center gap-2">
              <Sparkles className="w-7 h-7 text-amber-300" />
              Miqaat Management & Ashara Mubaraka Ohbat
            </h1>
            <p className="text-xs text-amber-100/90 mt-1 max-w-2xl">
              Centralized event calendar, automated Masalla seating allocation with senior chair assistance, live audio-video relay control, and 1-10 Moharram Ashara Ohbat pass management.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {canAdd && (
              <>
                <button
                  type="button"
                  onClick={() => setIsRegisterMasallaModalOpen(true)}
                  className="px-3.5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Book Masalla
                </button>
                <button
                  type="button"
                  onClick={() => setIsNewAsharaPassModalOpen(true)}
                  className="px-3.5 py-2.5 bg-white hover:bg-amber-50 text-slate-900 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg cursor-pointer"
                >
                  <BadgeCheck className="w-4 h-4 text-amber-700" />
                  Issue Ashara Pass
                </button>
              </>
            )}
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-amber-700/60">
          <div className="bg-white/10 backdrop-blur-sm p-3.5 rounded-xl border border-white/10">
            <span className="text-[11px] text-amber-200 uppercase font-semibold">Scheduled Miqaats</span>
            <p className="text-xl font-black text-white mt-0.5">{summary.totalEventsCount}</p>
            <span className="text-[10px] text-amber-300">Across 1447-1448 Hijri</span>
          </div>

          <div className="bg-white/10 backdrop-blur-sm p-3.5 rounded-xl border border-white/10">
            <span className="text-[11px] text-amber-200 uppercase font-semibold">Allocated Masallas</span>
            <p className="text-xl font-black text-emerald-300 mt-0.5">{summary.totalMasallaAllocated}</p>
            <span className="text-[10px] text-emerald-200/80">Seats confirmed with badges</span>
          </div>

          <div className="bg-white/10 backdrop-blur-sm p-3.5 rounded-xl border border-white/10">
            <span className="text-[11px] text-amber-200 uppercase font-semibold">Ashara Registrations</span>
            <p className="text-xl font-black text-amber-300 mt-0.5">{summary.totalAsharaRegistrations}</p>
            <span className="text-[10px] text-amber-200/80">Confirmed entry passes</span>
          </div>

          <div className="bg-white/10 backdrop-blur-sm p-3.5 rounded-xl border border-white/10">
            <span className="text-[11px] text-amber-200 uppercase font-semibold">Checked-In Mumineen</span>
            <p className="text-xl font-black text-cyan-300 mt-0.5">{summary.checkedInCount}</p>
            <span className="text-[10px] text-cyan-200/80">Live gate scanned</span>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-amber-200/80 pb-2 overflow-x-auto text-xs">
        {[
          { id: 'miqaat-master-events', label: 'Miqaat Master & Calendar', count: events.length },
          { id: 'masalla-allocation', label: 'Masalla Seating Allocation', count: masallas.length },
          { id: 'miqaat-attendance-relay', label: 'Attendance & Live Relay' },
          { id: 'ashara-majlis-schedule', label: 'Ashara Majlis Schedule', count: majlisList.length },
          { id: 'ashara-block-quota', label: 'Block & Quota Config', count: blocks.length },
          { id: 'ashara-registration-import', label: 'Registration & Import', count: asharaPasses.length },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === tab.id
                ? 'bg-amber-950 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-amber-50 border border-slate-200'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTab === tab.id ? 'bg-amber-800 text-amber-100' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: MIQAAT MASTER & CALENDAR */}
      {/* ========================================================================= */}
      {activeTab === 'miqaat-master-events' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Hijri Community Events & Majalis</h3>
              <p className="text-xs text-slate-500">Major wiladat, urs, and congregational gatherings</p>
            </div>
            {canAdd && (
              <button
                type="button"
                onClick={() => setIsNewEventModalOpen(true)}
                className="px-3.5 py-2 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Schedule New Miqaat
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.map((ev) => (
              <div key={ev.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-lg">
                    {ev.hijriDate}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      ev.status === 'CONCLUDED'
                        ? 'bg-slate-200 text-slate-700'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {ev.status}
                  </span>
                </div>

                <h4 className="font-bold text-slate-900 text-base">{ev.name}</h4>
                <div className="text-xs text-slate-500 font-mono">
                  Gregorian: {ev.gregorianDate} • Venue: {ev.venue}
                </div>

                <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Complex Capacity:</span>
                    <span className="font-bold text-slate-800">{ev.totalCapacity} Mumineen</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Allocated Masallas:</span>
                    <span className="font-bold text-emerald-700">
                      {ev.allocatedMasallaCount} Seats Reserved
                    </span>
                  </div>
                  {ev.hasAudioVideoRelay && (
                    <div className="pt-1.5 border-t border-slate-200/80 flex items-center gap-1.5 text-[11px] text-blue-700">
                      <Tv className="w-3.5 h-3.5" />
                      <span>{ev.relayDetails}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MASALLA SEATING ALLOCATION */}
      {/* ========================================================================= */}
      {activeTab === 'masalla-allocation' && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Armchair className="w-4 h-4 text-amber-700" />
                Masalla Seating Registration & Allocation Matrix
              </h3>
              <p className="text-xs text-slate-500">Hall, floor, row and seat reservation for congregation</p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 font-bold"
              >
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.name} ({ev.hijriDate})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Reg No & Date</th>
                  <th className="p-3">Mumin Details & ITS</th>
                  <th className="p-3">Mohallah</th>
                  <th className="p-3">Assistance</th>
                  <th className="p-3">Allocated Location</th>
                  <th className="p-3 text-center">Seat / Masalla</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {masallas
                  .filter((m) => m.miqaatId === selectedEventId)
                  .map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/80">
                      <td className="p-3">
                        <span className="font-mono font-bold text-slate-900">{m.registrationNo}</span>
                        <div className="text-[10px] text-slate-400">{m.registeredDate}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{m.muminName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          ITS: {m.itsNumber} • Age: {m.age} ({m.gender})
                        </div>
                      </td>
                      <td className="p-3 text-slate-700">{m.mohallah}</td>
                      <td className="p-3">
                        {m.needsChairSupport ? (
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-800 font-bold rounded text-[10px]">
                            Chair Required
                          </span>
                        ) : m.isSeniorCitizen ? (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-bold rounded text-[10px]">
                            Senior Citizen
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">Regular</span>
                        )}
                      </td>
                      <td className="p-3">
                        {m.isAllocated ? (
                          <span className="text-slate-800 font-medium">
                            {m.allocatedFloor} • {m.allocatedHall} • {m.allocatedRow}
                          </span>
                        ) : (
                          <span className="text-amber-700 font-bold">Unallocated</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {m.masallaNumber ? (
                          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 font-bold font-mono rounded-lg text-xs">
                            {m.masallaNumber}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono text-[11px]">—</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMasalla(m);
                            setIsAllocateModalOpen(true);
                          }}
                          className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-[10px] cursor-pointer"
                        >
                          {m.isAllocated ? 'Change Seat' : 'Allocate Seat'}
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ATTENDANCE & LIVE RELAY */}
      {/* ========================================================================= */}
      {activeTab === 'miqaat-attendance-relay' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Live Relay Status */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Radio className="w-4 h-4 text-rose-600" />
                Live Broadcast Control Room (BCR)
              </h3>
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                RELAY ACTIVE
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="font-bold text-slate-800">Fiber Video Distribution Matrix:</span>
                <p className="text-slate-500">
                  Main Sanctuary camera switcher connected via SMPTE optical link to 8 4K LED panels.
                </p>
              </div>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                <div className="p-2.5 flex justify-between bg-white">
                  <span>Main Burhani Sanctuary:</span>
                  <span className="font-bold text-emerald-700">Live Feed 1 (1080p60)</span>
                </div>
                <div className="p-2.5 flex justify-between bg-slate-50/50">
                  <span>Saifee Hall (Men Overflow):</span>
                  <span className="font-bold text-emerald-700">Repeater Screen A & B Online</span>
                </div>
                <div className="p-2.5 flex justify-between bg-white">
                  <span>Noor Mezzanine (Sisters Section):</span>
                  <span className="font-bold text-emerald-700">Screen C & D + Separate Audio Zone</span>
                </div>
                <div className="p-2.5 flex justify-between bg-slate-50/50">
                  <span>Courtyard Marquee:</span>
                  <span className="font-bold text-emerald-700">High-Gain PA Speakers Active</span>
                </div>
              </div>
            </div>
          </div>

          {/* Real-time Attendance Scanning */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                Gate Turnout & Attendance Tracker
              </h3>
              <span className="text-xs font-mono font-bold text-slate-700">RFID & QR Scanning</span>
            </div>

            <p className="text-xs text-slate-500">
              Live automated gate entry monitoring for verified mumineen through turnstiles.
            </p>

            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-center space-y-2">
              <span className="text-xs text-emerald-900 font-bold block">Live Verified Gate Entries:</span>
              <p className="text-3xl font-black text-emerald-900 font-mono">1,050 / 1,200</p>
              <div className="w-full bg-emerald-200 h-2.5 rounded-full overflow-hidden">
                <div className="bg-emerald-600 h-2.5 rounded-full" style={{ width: '87%' }} />
              </div>
              <span className="text-[10px] text-emerald-800 font-semibold block">87.5% Capacity Checked-In</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: ASHARA MAJLIS SCHEDULE */}
      {/* ========================================================================= */}
      {activeTab === 'ashara-majlis-schedule' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-700" />
                  Ashara Mubaraka 1 to 10 Moharram Master Timetable
                </h3>
                <p className="text-xs text-slate-500">Daily waaz timings, zakireen group scheduling, and barakat niyaz slots</p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Day & Hijri Date</th>
                    <th className="p-3">Majlis Significance</th>
                    <th className="p-3">Waaz Timings</th>
                    <th className="p-3">Niyaz Jaman Slot</th>
                    <th className="p-3">Zakir Group</th>
                    <th className="p-3 text-right">Expected Turnout</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {majlisList.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/80">
                      <td className="p-3 font-mono">
                        <span className="font-bold text-amber-900 block">Day {m.dayNumber}</span>
                        <span className="text-[10px] text-slate-500">{m.hijriDate}</span>
                      </td>
                      <td className="p-3 font-bold text-slate-900">{m.title}</td>
                      <td className="p-3 font-mono text-slate-700">{m.waazTimeSlot}</td>
                      <td className="p-3 font-mono text-slate-700">{m.niyazTimeSlot}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-semibold">
                          {m.zakirGroup}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-800">
                        {m.expectedTurnout.toLocaleString()} Mumineen
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Time Slot Master */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
              <Clock className="w-4 h-4 text-blue-600" />
              Standard Daily Time Slot Configurations
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              {slots.map((s) => (
                <div key={s.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900">{s.slotName}</span>
                    <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      {s.startTime} - {s.endTime}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500">{s.description}</p>
                  <p className="text-[10px] text-slate-400 font-mono">Venue: {s.venueSection}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: BLOCK & QUOTA CONFIG */}
      {/* ========================================================================= */}
      {activeTab === 'ashara-block-quota' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Majlis Hall Blocks & Quota Allocation</h3>
              <p className="text-xs text-slate-500">Gender zoning, reserved committees, and marquee overflow gates</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {blocks.map((blk) => (
              <div key={blk.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-bold bg-slate-100 px-2.5 py-0.5 rounded text-slate-800">
                    {blk.blockCode}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      blk.gender === 'MALE'
                        ? 'bg-blue-100 text-blue-800'
                        : blk.gender === 'FEMALE'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}
                  >
                    {blk.gender} Section
                  </span>
                </div>

                <h4 className="font-bold text-slate-900 text-sm mt-1">{blk.blockName}</h4>

                <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Capacity:</span>
                    <span className="font-bold text-slate-900">{blk.totalCapacity} Seats</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Reserved Quota:</span>
                    <span className="font-semibold text-slate-700">{blk.reservedQuota} Seats</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-1">
                    <span className="text-emerald-700 font-bold">Available for General:</span>
                    <span className="font-bold font-mono text-emerald-700">{blk.availableSeats}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: REGISTRATION & IMPORT */}
      {/* ========================================================================= */}
      {activeTab === 'ashara-registration-import' && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <BadgeCheck className="w-4 h-4 text-emerald-600" />
                Ashara Mubaraka Verified Passes
              </h3>
              <p className="text-xs text-slate-500">Photo ID passes, RFID card numbers, and batch import</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(true)}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                Batch Import CSV
              </button>
              {canAdd && (
                <button
                  type="button"
                  onClick={() => setIsNewAsharaPassModalOpen(true)}
                  className="px-3.5 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Mumin Pass
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Pass No</th>
                  <th className="p-3">Mumin Name & ITS</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Block & Seat Badge</th>
                  <th className="p-3 font-mono">RFID Card No</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {asharaPasses.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80">
                    <td className="p-3 font-mono font-bold text-slate-900">{p.passNo}</td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{p.fullName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        ITS: {p.itsNumber} • Age: {p.age} ({p.gender})
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                        {p.category}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="font-medium text-slate-800">{p.blockAllocated}</div>
                      <div className="text-[10px] text-slate-500">{p.seatBadge}</div>
                    </td>
                    <td className="p-3 font-mono text-[11px] text-slate-600">{p.rfidCardNo || '—'}</td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.status === 'CHECKED_IN'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => setActivePrintPass(p)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-amber-100 text-slate-800 rounded-lg text-[11px] font-bold flex items-center gap-1 mx-auto cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" /> Pass
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SCHEDULE NEW MIQAAT */}
      {/* ========================================================================= */}
      {isNewEventModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-700" />
                Schedule New Miqaat Event
              </h3>
              <button
                type="button"
                onClick={() => setIsNewEventModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Miqaat Title / Occasion *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Urs Mubarak Syedna Taher Saifuddin (RA)"
                  value={eventForm.name}
                  onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Hijri Date *</label>
                  <input
                    type="text"
                    required
                    value={eventForm.hijriDate}
                    onChange={(e) => setEventForm({ ...eventForm, hijriDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Gregorian Date</label>
                  <input
                    type="date"
                    value={eventForm.gregorianDate}
                    onChange={(e) => setEventForm({ ...eventForm, gregorianDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Venue</label>
                  <input
                    type="text"
                    value={eventForm.venue}
                    onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Expected Capacity</label>
                  <input
                    type="number"
                    min={100}
                    value={eventForm.totalCapacity}
                    onChange={(e) => setEventForm({ ...eventForm, totalCapacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Relay Details</label>
                <input
                  type="text"
                  value={eventForm.relayDetails}
                  onChange={(e) => setEventForm({ ...eventForm, relayDetails: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-[11px]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewEventModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl font-bold shadow-md cursor-pointer"
                >
                  Save Miqaat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: BOOK MASALLA */}
      {/* ========================================================================= */}
      {isRegisterMasallaModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Armchair className="w-5 h-5 text-amber-700" />
                Book Congregational Masalla
              </h3>
              <button
                type="button"
                onClick={() => setIsRegisterMasallaModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterMasalla} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mumin ITS *</label>
                  <input
                    type="text"
                    required
                    placeholder="8-digit ITS"
                    value={masallaForm.itsNumber}
                    onChange={(e) => setMasallaForm({ ...masallaForm, itsNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mulla Shabbir Bhai"
                    value={masallaForm.muminName}
                    onChange={(e) => setMasallaForm({ ...masallaForm, muminName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Gender *</label>
                  <select
                    value={masallaForm.gender}
                    onChange={(e) => setMasallaForm({ ...masallaForm, gender: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50"
                  >
                    <option value="MALE">Male (Bhai)</option>
                    <option value="FEMALE">Female (Behen)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Age</label>
                  <input
                    type="number"
                    min={5}
                    max={100}
                    value={masallaForm.age}
                    onChange={(e) => setMasallaForm({ ...masallaForm, age: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mohallah</label>
                  <input
                    type="text"
                    value={masallaForm.mohallah}
                    onChange={(e) => setMasallaForm({ ...masallaForm, mohallah: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="chairNeeded"
                  checked={masallaForm.needsChairSupport}
                  onChange={(e) => setMasallaForm({ ...masallaForm, needsChairSupport: e.target.checked })}
                  className="rounded text-amber-700 cursor-pointer"
                />
                <label htmlFor="chairNeeded" className="text-slate-800 font-semibold cursor-pointer">
                  Requires Medical / Senior Chair Seating
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRegisterMasallaModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl font-bold shadow-md cursor-pointer"
                >
                  Confirm Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ALLOCATE SEAT / MASALLA NUMBER */}
      {/* ========================================================================= */}
      {isAllocateModalOpen && selectedMasalla && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Armchair className="w-5 h-5 text-amber-700" />
                Assign Specific Masalla Number
              </h3>
              <button
                type="button"
                onClick={() => setIsAllocateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
              <p className="font-bold text-slate-900">{selectedMasalla.muminName}</p>
              <p className="text-slate-500">
                ITS: {selectedMasalla.itsNumber} • {selectedMasalla.mohallah}
                {selectedMasalla.needsChairSupport && ' • [Chair Priority Zone]'}
              </p>
            </div>

            <form onSubmit={handleConfirmAllocation} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Floor Level</label>
                  <select
                    value={allocationForm.allocatedFloor}
                    onChange={(e) => setAllocationForm({ ...allocationForm, allocatedFloor: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50"
                  >
                    <option value="Ground Floor">Ground Floor</option>
                    <option value="First Floor">First Floor</option>
                    <option value="Second Floor">Second Floor</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Hall Section</label>
                  <select
                    value={allocationForm.allocatedHall}
                    onChange={(e) => setAllocationForm({ ...allocationForm, allocatedHall: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50"
                  >
                    <option value="Main Masjid">Main Masjid</option>
                    <option value="Main Masjid - Elderly Wing">Main Masjid - Elderly Wing</option>
                    <option value="Saifee Hall">Saifee Hall</option>
                    <option value="Noor Ladies Mezzanine">Noor Ladies Mezzanine</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Row Identifier</label>
                  <input
                    type="text"
                    value={allocationForm.allocatedRow}
                    onChange={(e) => setAllocationForm({ ...allocationForm, allocatedRow: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Masalla / Seat Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. M-14 or CHR-02"
                    value={allocationForm.masallaNumber}
                    onChange={(e) => setAllocationForm({ ...allocationForm, masallaNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 bg-slate-50"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAllocateModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl font-bold shadow-md cursor-pointer"
                >
                  Save Allocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ISSUE ASHARA PASS */}
      {/* ========================================================================= */}
      {isNewAsharaPassModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <BadgeCheck className="w-5 h-5 text-emerald-600" />
                Issue Ashara Entry Pass
              </h3>
              <button
                type="button"
                onClick={() => setIsNewAsharaPassModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAsharaPass} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mumin ITS *</label>
                  <input
                    type="text"
                    required
                    placeholder="8-digit ITS"
                    value={asharaForm.itsNumber}
                    onChange={(e) => setAsharaForm({ ...asharaForm, itsNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Murtaza Bhai Badri"
                    value={asharaForm.fullName}
                    onChange={(e) => setAsharaForm({ ...asharaForm, fullName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Gender *</label>
                  <select
                    value={asharaForm.gender}
                    onChange={(e) => setAsharaForm({ ...asharaForm, gender: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50"
                  >
                    <option value="MALE">MALE</option>
                    <option value="FEMALE">FEMALE</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Age</label>
                  <input
                    type="number"
                    value={asharaForm.age}
                    onChange={(e) => setAsharaForm({ ...asharaForm, age: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={asharaForm.category}
                    onChange={(e) => setAsharaForm({ ...asharaForm, category: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50"
                  >
                    <option value="LOCAL_HOF">LOCAL HOF</option>
                    <option value="LOCAL_FM">LOCAL FM</option>
                    <option value="MEHMAAN">MEHMAAN</option>
                    <option value="KHAADIM">KHAADIM</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Allocated Hall Block *</label>
                  <select
                    value={asharaForm.blockAllocated}
                    onChange={(e) => setAsharaForm({ ...asharaForm, blockAllocated: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-bold"
                  >
                    {blocks.map((b) => (
                      <option key={b.id} value={b.blockCode}>
                        {b.blockCode} ({b.gender})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Seat Badge</label>
                  <input
                    type="text"
                    value={asharaForm.seatBadge}
                    onChange={(e) => setAsharaForm({ ...asharaForm, seatBadge: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewAsharaPassModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md cursor-pointer"
                >
                  Generate Pass
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: BATCH CSV IMPORT */}
      {/* ========================================================================= */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-600" />
                Batch Ingest Ashara Registration Data
              </h3>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Paste comma-separated data in format:{' '}
              <code className="text-blue-700 font-mono">ITS, FullName, Gender, Age, Mohallah, BlockCode</code>
            </p>

            <textarea
              rows={6}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 font-mono text-xs"
            />

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProcessImport}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md cursor-pointer"
              >
                Process & Commit Import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PRINT-READY ASHARA PASS BADGE */}
      {/* ========================================================================= */}
      {activePrintPass && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-300 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="text-[11px] font-bold text-amber-900">Official Ashara Mubaraka Pass</span>
              <button
                type="button"
                onClick={() => setActivePrintPass(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="border-2 border-amber-800 p-4 rounded-2xl bg-amber-50/30 text-center font-mono text-xs space-y-2">
              <p className="text-[10px] text-amber-900 font-bold">ASHARA MUBARAKA 1448 HIJRI</p>
              <h4 className="font-black text-slate-900 text-sm">BURHANI PARK JAMAAT TRUST</h4>
              <div className="w-16 h-16 bg-slate-200 border-2 border-amber-700 mx-auto rounded-xl flex items-center justify-center font-bold text-slate-500 text-[10px]">
                [PHOTO]
              </div>
              <div className="border-t border-dashed border-amber-300 my-1.5" />
              <div className="text-sm font-black text-slate-900">{activePrintPass.fullName}</div>
              <div className="text-[11px] text-slate-600">ITS: {activePrintPass.itsNumber}</div>
              <div className="flex justify-center gap-2 mt-1">
                <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-950 font-bold text-[10px]">
                  {activePrintPass.category}
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-900 font-bold text-[10px]">
                  {activePrintPass.blockAllocated}
                </span>
              </div>
              <div className="text-xs font-bold text-amber-900 mt-2 font-mono">
                {activePrintPass.seatBadge}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                Pass No: {activePrintPass.passNo} • RFID: {activePrintPass.rfidCardNo}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2 bg-amber-800 hover:bg-amber-900 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Print Entry Pass
              </button>
              <button
                type="button"
                onClick={() => setActivePrintPass(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
