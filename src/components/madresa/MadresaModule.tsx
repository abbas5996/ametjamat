import React, { useState, useMemo } from 'react';
import {
  UserProfile,
  FinancialYear,
} from '../../types';
import {
  MadresaClass,
  MadresaStudent,
  MadresaFeeReceipt,
  MadresaAttendanceRecord,
  MadresaProgressReport,
  PaymentMode,
  MADRESA_CLASSES_KEY,
  MADRESA_STUDENTS_KEY,
  MADRESA_FEE_RECEIPTS_KEY,
  MADRESA_ATTENDANCE_KEY,
  MADRESA_PROGRESS_KEY,
  INITIAL_MADRESA_CLASSES,
  INITIAL_MADRESA_STUDENTS,
  INITIAL_MADRESA_RECEIPTS,
  INITIAL_MADRESA_PROGRESS,
  loadFromStorage,
  saveToStorage,
} from '../../utils/part3Management';
import { appendActivityLog } from '../../utils/rbac';
import { TrustOfficialReceiptModal } from '../common/TrustOfficialReceiptModal';
import { numberToWordsIndian } from '../../utils/fmbPart2Data';
import {
  GraduationCap,
  Plus,
  Search,
  Printer,
  CheckCircle2,
  BookOpen,
  Calendar,
  X,
  CreditCard,
  Award,
  Users,
  Check,
  Filter,
} from 'lucide-react';

// ── Helper: Convert MadresaFeeReceipt → Partial<OfficialReceiptData> ──
const buildMadresaReceiptData = (rec: MadresaFeeReceipt) => {
  // Format date to "27 Oct 2026" style
  let dateStr = rec.date || '';
  try {
    const d = new Date(rec.date);
    if (!isNaN(d.getTime())) {
      dateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    }
  } catch { /* keep raw */ }

  const receiptNumStr = String(rec.receiptNo || '').replace(/[^0-9]/g, '') || String(rec.receiptNo || 'N/A');
  const paymentModeStr =
    rec.paymentMode === 'Cash'
      ? 'By Cash.'
      : rec.paymentMode === 'Cheque'
      ? 'By Cheque.'
      : rec.paymentMode === 'UPI'
      ? 'By UPI / QR.'
      : `By ${rec.paymentMode || 'Cash'}.`;
  const amt = typeof rec.amount === 'number' ? rec.amount : (parseFloat(String(rec.amount)) || 0);

  return {
    trustTitle: 'DAWOODI BOHRA JAMAAT TRUST, BURHANIPARK VATWA, AHMEDABAD',
    trustRegnNo: 'Regn No - B/81',
    managedBy: 'Managed By Anjuman e Mufaddal',
    accountTitle: 'A/c: Madresa Deaniyah Education / Fee Collection',
    receiptNo: receiptNumStr,
    dateStr,
    memberName: (rec.studentName || '').toUpperCase(),
    honorificLeft: '(حفظه الله تعالى)',
    itsNo: rec.studentIts || '',
    address: `CLASS: ${(rec.className || '').toUpperCase()} | BURHANI PARK, VATWA, AHMEDABAD`,
    greetingArabic: 'بعد السلام الجميل',
    amount: amt,
    amountInWords: numberToWordsIndian(amt),
    descriptorRight: 'اپ طرف سي',
    descriptorAnke: 'انکه',
    paymentModeStr,
    purposeTitle: `Madresa Tuition – ${rec.academicYear || '1447-1448 Hijri'}`,
    purposePhrase: 'طریقے وصول تھیا چھے',
    receiverSignature: '(وصول کرنار نی صحیح) عبد سید ناطع',
  };
};

interface MadresaModuleProps {
  currentUser: UserProfile;
  activeSubItemId: string;
  subItemLabel: string;
  financialYear: FinancialYear;
  showToast: (msg: string) => void;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export const MadresaModule: React.FC<MadresaModuleProps> = ({
  currentUser,
  activeSubItemId,
  showToast,
  canAdd,
}) => {
  // Local state with localStorage synchronization
  const [classes, setClasses] = useState<MadresaClass[]>(() =>
    loadFromStorage(MADRESA_CLASSES_KEY, INITIAL_MADRESA_CLASSES)
  );
  const [students, setStudents] = useState<MadresaStudent[]>(() =>
    loadFromStorage(MADRESA_STUDENTS_KEY, INITIAL_MADRESA_STUDENTS)
  );
  const [receipts, setReceipts] = useState<MadresaFeeReceipt[]>(() =>
    loadFromStorage(MADRESA_FEE_RECEIPTS_KEY, INITIAL_MADRESA_RECEIPTS)
  );
  const [attendance, setAttendance] = useState<MadresaAttendanceRecord[]>(() =>
    loadFromStorage(MADRESA_ATTENDANCE_KEY, [])
  );
  const [reports, setReports] = useState<MadresaProgressReport[]>(() =>
    loadFromStorage(MADRESA_PROGRESS_KEY, INITIAL_MADRESA_PROGRESS)
  );

  // Tab State
  const [activeTab, setActiveTab] = useState<string>(activeSubItemId);
  React.useEffect(() => {
    setActiveTab(activeSubItemId);
  }, [activeSubItemId]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('ALL');

  // Modals
  const [isNewStudentModalOpen, setIsNewStudentModalOpen] = useState(false);
  const [isCollectFeeModalOpen, setIsCollectFeeModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<MadresaStudent | null>(null);
  const [activePrintReceipt, setActivePrintReceipt] = useState<MadresaFeeReceipt | null>(null);
  const [activePrintReport, setActivePrintReport] = useState<MadresaProgressReport | null>(null);

  // Student Form
  const [studentForm, setStudentForm] = useState({
    itsNumber: '',
    studentName: '',
    gender: 'MALE' as 'MALE' | 'FEMALE',
    dob: '2017-06-15',
    age: 9,
    guardianIts: '',
    guardianName: '',
    mohallah: 'Burhani Mohallah',
    contactNumber: '',
    classId: classes[0]?.id || '',
  });

  // Fee Form
  const [feeForm, setFeeForm] = useState({
    amount: 3000,
    paymentMode: 'UPI' as PaymentMode,
    remarks: 'Term tuition installment',
    date: new Date().toISOString().split('T')[0],
  });

  // Attendance Sheet state
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceClassId, setAttendanceClassId] = useState(classes[0]?.id || '');
  const [dailyRosterStatus, setDailyRosterStatus] = useState<Record<string, 'PRESENT' | 'ABSENT' | 'LEAVE'>>({});

  // Summary Metrics
  const summary = useMemo(() => {
    const totalEnrolled = students.filter((s) => s.status === 'ACTIVE').length;
    const totalFeesBilled = students.reduce((acc, s) => acc + s.totalFee, 0);
    const totalFeesCollected = students.reduce((acc, s) => acc + s.paidFee, 0);
    const totalFeesPending = students.reduce((acc, s) => acc + s.outstandingFee, 0);
    return { totalEnrolled, totalFeesBilled, totalFeesCollected, totalFeesPending };
  }, [students]);

  // Handle New Student Enrollment
  const handleEnrollStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAdd) {
      showToast('Access Denied: You do not have permission to enroll students');
      return;
    }
    if (!studentForm.studentName || !studentForm.itsNumber) {
      showToast('Please enter student name and ITS number');
      return;
    }

    const assignedClass = classes.find((c) => c.id === studentForm.classId) || classes[0];
    const newStudent: MadresaStudent = {
      id: `ms-${Date.now()}`,
      itsNumber: studentForm.itsNumber,
      studentName: studentForm.studentName,
      gender: studentForm.gender,
      dob: studentForm.dob,
      age: Number(studentForm.age),
      guardianIts: studentForm.guardianIts,
      guardianName: studentForm.guardianName,
      mohallah: studentForm.mohallah,
      contactNumber: studentForm.contactNumber,
      classId: assignedClass.id,
      className: assignedClass.name,
      enrollmentDate: new Date().toISOString().split('T')[0],
      totalFee: assignedClass.annualFee,
      paidFee: 0,
      outstandingFee: assignedClass.annualFee,
      attendancePercent: 100,
      academicPerformance: 'Jayyid Jiddan',
      status: 'ACTIVE',
    };

    const updatedStudents = [newStudent, ...students];
    setStudents(updatedStudents);
    saveToStorage(MADRESA_STUDENTS_KEY, updatedStudents);

    // Update class total count
    const updatedClasses = classes.map((c) =>
      c.id === assignedClass.id ? { ...c, totalStudents: c.totalStudents + 1 } : c
    );
    setClasses(updatedClasses);
    saveToStorage(MADRESA_CLASSES_KEY, updatedClasses);

    appendActivityLog(
      currentUser.username,
      'Madresa Management',
      'Student Directory & Admission',
      'ADD',
      `Enrolled talib ${studentForm.studentName} (ITS ${studentForm.itsNumber}) in ${assignedClass.name}`
    );

    showToast(`Talib ${studentForm.studentName} enrolled successfully!`);
    setIsNewStudentModalOpen(false);
  };

  // Handle Fee Collection
  const handleCollectFee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    const payAmt = Number(feeForm.amount);
    if (payAmt <= 0) {
      showToast('Please enter a valid payment amount');
      return;
    }

    const newOutstanding = Math.max(0, selectedStudent.outstandingFee - payAmt);
    const newPaid = selectedStudent.paidFee + payAmt;
    const receiptNo = `MAD-REC-${String(receipts.length + 1).padStart(4, '0')}`;

    const newReceipt: MadresaFeeReceipt = {
      id: `mrec-${Date.now()}`,
      receiptNo,
      studentId: selectedStudent.id,
      studentIts: selectedStudent.itsNumber,
      studentName: selectedStudent.studentName,
      className: selectedStudent.className,
      amount: payAmt,
      paymentMode: feeForm.paymentMode,
      date: feeForm.date,
      academicYear: '1447-1448 Hijri',
      collectedBy: currentUser.username,
      remainingDue: newOutstanding,
      remarks: feeForm.remarks,
    };

    const updatedReceipts = [newReceipt, ...receipts];
    setReceipts(updatedReceipts);
    saveToStorage(MADRESA_FEE_RECEIPTS_KEY, updatedReceipts);

    const updatedStudents = students.map((s) => {
      if (s.id === selectedStudent.id) {
        return {
          ...s,
          paidFee: newPaid,
          outstandingFee: newOutstanding,
        };
      }
      return s;
    });
    setStudents(updatedStudents);
    saveToStorage(MADRESA_STUDENTS_KEY, updatedStudents);

    appendActivityLog(
      currentUser.username,
      'Madresa Management',
      'Fee Collection',
      'PAYMENT',
      `Collected Madresa fee ₹${payAmt} for talib ${selectedStudent.studentName} (Receipt: ${receiptNo})`
    );

    showToast(`Fee receipt ${receiptNo} generated successfully!`);
    setIsCollectFeeModalOpen(false);
    setSelectedStudent(null);
    setActivePrintReceipt(newReceipt);
  };

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchSearch =
        s.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.itsNumber.includes(searchQuery) ||
        s.guardianName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchClass = selectedClassFilter === 'ALL' || s.classId === selectedClassFilter;
      return matchSearch && matchClass;
    });
  }, [students, searchQuery, selectedClassFilter]);

  // Handle Save Attendance
  const handleSaveAttendance = () => {
    const classStudents = students.filter((s) => s.classId === attendanceClassId);
    const newRecords: MadresaAttendanceRecord[] = classStudents.map((s) => ({
      id: `att-${s.id}-${attendanceDate}`,
      date: attendanceDate,
      classId: attendanceClassId,
      studentId: s.id,
      studentName: s.studentName,
      status: dailyRosterStatus[s.id] || 'PRESENT',
      recordedBy: currentUser.username,
    }));

    const updated = [...newRecords, ...attendance];
    setAttendance(updated);
    saveToStorage(MADRESA_ATTENDANCE_KEY, updated);

    showToast(`Attendance saved for ${classStudents.length} students on ${attendanceDate}!`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-800 to-emerald-950 text-white rounded-2xl p-6 shadow-xl border border-emerald-700/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                Al-Madrasa al-Saifiyah al-Burhaniyah
              </span>
              <span className="text-xs text-emerald-200/80">Deaniyah & Tahfeez Curriculum</span>
            </div>
            <h1 className="text-2xl font-black mt-1 tracking-tight text-white flex items-center gap-2">
              <GraduationCap className="w-7 h-7 text-emerald-300" />
              Madresa & Deaniyah Education Management
            </h1>
            <p className="text-xs text-emerald-100/90 mt-1 max-w-2xl">
              Complete student lifecycle: admissions, Daur grade configurations, fee collection with print receipts, daily attendance registers, and progress report cards.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {canAdd && (
              <button
                type="button"
                onClick={() => setIsNewStudentModalOpen(true)}
                className="px-4 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg transition-all transform active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Enroll New Talib
              </button>
            )}
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-emerald-700/60">
          <div className="bg-white/10 backdrop-blur-sm p-3.5 rounded-xl border border-white/10">
            <span className="text-[11px] text-emerald-200 uppercase font-semibold">Total Students</span>
            <p className="text-xl font-black text-white mt-0.5">{summary.totalEnrolled}</p>
            <span className="text-[10px] text-emerald-300">Across 4 Daur Grades</span>
          </div>

          <div className="bg-white/10 backdrop-blur-sm p-3.5 rounded-xl border border-white/10">
            <span className="text-[11px] text-emerald-200 uppercase font-semibold">Tuition Billed</span>
            <p className="text-xl font-black text-emerald-200 mt-0.5">₹{summary.totalFeesBilled.toLocaleString()}</p>
            <span className="text-[10px] text-emerald-300">Academic Year 1447-48</span>
          </div>

          <div className="bg-white/10 backdrop-blur-sm p-3.5 rounded-xl border border-white/10">
            <span className="text-[11px] text-emerald-200 uppercase font-semibold">Fees Collected</span>
            <p className="text-xl font-black text-cyan-300 mt-0.5">₹{summary.totalFeesCollected.toLocaleString()}</p>
            <span className="text-[10px] text-cyan-200/80">{receipts.length} receipts issued</span>
          </div>

          <div className="bg-white/10 backdrop-blur-sm p-3.5 rounded-xl border border-white/10">
            <span className="text-[11px] text-emerald-200 uppercase font-semibold">Outstanding Fees</span>
            <p className="text-xl font-black text-amber-300 mt-0.5">₹{summary.totalFeesPending.toLocaleString()}</p>
            <span className="text-[10px] text-amber-200/80">Pending recovery</span>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-emerald-200/80 pb-2 overflow-x-auto text-xs">
        {[
          { id: 'madresa-students', label: 'Student Directory & Admission', count: students.length },
          { id: 'madresa-fee-collection', label: 'Fee Collection & Receipts', count: receipts.length },
          { id: 'madresa-classes-fees', label: 'Classes & Fee Master', count: classes.length },
          { id: 'madresa-attendance-progress', label: 'Attendance & Progress Reports' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === tab.id
                ? 'bg-emerald-900 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-emerald-50 border border-slate-200'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTab === tab.id ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: STUDENT DIRECTORY & ADMISSION */}
      {/* ========================================================================= */}
      {activeTab === 'madresa-students' && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search Talib by Name, ITS, or Guardian..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedClassFilter}
                onChange={(e) => setSelectedClassFilter(e.target.value)}
                className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 font-medium"
              >
                <option value="ALL">All Classes / Daur</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Talib & ITS</th>
                  <th className="p-3">Class / Daur</th>
                  <th className="p-3">Age & Gender</th>
                  <th className="p-3">Guardian Details</th>
                  <th className="p-3 text-right">Fee (Billed/Paid)</th>
                  <th className="p-3 text-center">Attendance</th>
                  <th className="p-3 text-center">Standing</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      No students enrolled matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/80">
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{s.studentName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">ITS: {s.itsNumber}</div>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[10px] font-semibold">
                          {s.className}
                        </span>
                      </td>
                      <td className="p-3">
                        <div>{s.age} Years</div>
                        <div className="text-[10px] text-slate-400">{s.gender}</div>
                      </td>
                      <td className="p-3">
                        <div className="text-slate-800 font-medium">{s.guardianName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {s.guardianIts} • {s.contactNumber}
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <span className="font-bold text-slate-900 font-mono">
                          ₹{s.paidFee.toLocaleString()} / ₹{s.totalFee.toLocaleString()}
                        </span>
                        {s.outstandingFee > 0 && (
                          <div className="text-[10px] text-amber-700 font-semibold">
                            Due: ₹{s.outstandingFee.toLocaleString()}
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <span className="font-bold text-emerald-700 font-mono">{s.attendancePercent}%</span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-900">
                          {s.academicPerformance}
                        </span>
                      </td>
                      <td className="p-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStudent(s);
                            setFeeForm((prev) => ({
                              ...prev,
                              amount: s.outstandingFee > 0 ? s.outstandingFee : 2000,
                            }));
                            setIsCollectFeeModalOpen(true);
                          }}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[10px] cursor-pointer"
                        >
                          Collect Fee
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: FEE COLLECTION & RECEIPTS */}
      {/* ========================================================================= */}
      {activeTab === 'madresa-fee-collection' && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                Madresa Fee Receipts Log
              </h3>
              <p className="text-xs text-slate-500">Official tuition receipts with instant thermal/PDF print</p>
            </div>
            <span className="text-xs font-semibold text-slate-600 font-mono">
              Total Receipts: {receipts.length}
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Receipt No & Date</th>
                  <th className="p-3">Talib & Class</th>
                  <th className="p-3 text-right">Fee Remitted</th>
                  <th className="p-3">Mode</th>
                  <th className="p-3 text-right">Balance Due</th>
                  <th className="p-3">Remarks</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {receipts.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/80">
                    <td className="p-3">
                      <span className="font-mono font-bold text-slate-900">{rec.receiptNo}</span>
                      <div className="text-[10px] text-slate-400">{rec.date}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-slate-800">{rec.studentName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        ITS: {rec.studentIts} • {rec.className}
                      </div>
                    </td>
                    <td className="p-3 text-right font-bold text-emerald-700 font-mono text-sm">
                      ₹{rec.amount.toLocaleString()}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-semibold text-slate-700">
                        {rec.paymentMode}
                      </span>
                    </td>
                    <td className="p-3 text-right font-bold text-amber-700 font-mono">
                      ₹{rec.remainingDue.toLocaleString()}
                    </td>
                    <td className="p-3 text-slate-600 text-[11px]">{rec.remarks || '—'}</td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setActivePrintReceipt(rec)}
                          className="px-2.5 py-1 bg-amber-400 hover:bg-amber-500 text-slate-950 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer shadow-xs transition-all"
                          title="Solo / Individual Print — Official Dawoodi Bohra Jamaat Trust Receipt"
                        >
                          <Printer className="w-3 h-3 stroke-[2.5]" />
                          <span>Solo Print</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CLASSES & FEE MASTER */}
      {/* ========================================================================= */}
      {activeTab === 'madresa-classes-fees' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {classes.map((cls) => (
            <div key={cls.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900">
                  {cls.code}
                </span>
                <span className="text-xs text-slate-500 font-semibold">{cls.roomNo}</span>
              </div>

              <h3 className="font-bold text-slate-900 text-sm mt-1">{cls.name}</h3>
              <p className="text-[11px] text-slate-500">Age: {cls.ageGroup}</p>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Ustad Incharge:</span>
                  <span className="font-semibold text-slate-800">{cls.ustadName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Enrolled:</span>
                  <span className="font-bold text-emerald-700">
                    {cls.totalStudents} / {cls.capacity} Talabat
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200">
                  <span className="text-slate-700 font-bold">Annual Fee:</span>
                  <span className="font-bold font-mono text-slate-900">₹{cls.annualFee.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: ATTENDANCE & PROGRESS REPORTS */}
      {/* ========================================================================= */}
      {activeTab === 'madresa-attendance-progress' && (
        <div className="space-y-6">
          {/* Daily Attendance Sheet */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  Daily Classroom Attendance Sheet
                </h3>
                <p className="text-xs text-slate-500">Mark daily attendance for Daur grades with instant sync</p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="px-2.5 py-1.5 border border-slate-200 rounded-xl bg-slate-50 font-mono"
                />
                <select
                  value={attendanceClassId}
                  onChange={(e) => setAttendanceClassId(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 rounded-xl bg-slate-50 font-medium"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleSaveAttendance}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer"
                >
                  Save Register
                </button>
              </div>
            </div>

            {/* Student Roster for Selected Class */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {students
                .filter((s) => s.classId === attendanceClassId)
                .map((student) => {
                  const currentStatus = dailyRosterStatus[student.id] || 'PRESENT';
                  return (
                    <div
                      key={student.id}
                      className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{student.studentName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">ITS: {student.itsNumber}</div>
                      </div>

                      <div className="flex items-center gap-1">
                        {(['PRESENT', 'ABSENT', 'LEAVE'] as const).map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() =>
                              setDailyRosterStatus({
                                ...dailyRosterStatus,
                                [student.id]: st,
                              })
                            }
                            className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                              currentStatus === st
                                ? st === 'PRESENT'
                                  ? 'bg-emerald-600 text-white'
                                  : st === 'ABSENT'
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-amber-600 text-white'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {st[0]}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Progress Report Cards Section */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Award className="w-4 h-4 text-purple-600" />
                  Academic Examination Progress Reports
                </h3>
                <p className="text-xs text-slate-500">Grading across Quran, Deeniyat, Lisan-ud-Dawat, and Akhlaaq</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reports.map((rep) => (
                <div key={rep.id} className="p-4 rounded-xl border border-slate-200 bg-purple-50/20 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{rep.studentName}</h4>
                      <p className="text-[10px] text-slate-500">{rep.className}</p>
                    </div>
                    <span className="px-2.5 py-1 bg-purple-100 text-purple-900 font-bold rounded-lg text-xs font-mono">
                      Rank #{rep.rank} • {rep.overallPercentage}%
                    </span>
                  </div>

                  <div className="space-y-1.5 border-t border-slate-200 pt-2 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Al-Quran al-Kareem:</span>
                      <span className="font-bold text-slate-800">{rep.quranHifzGrade}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Deeniyat & Fiqh:</span>
                      <span className="font-bold text-slate-800">{rep.deeniyatGrade}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Lisan-ud-Dawat:</span>
                      <span className="font-bold text-slate-800">{rep.lisanDawatGrade}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Akhlaaq & Adab:</span>
                      <span className="font-bold text-slate-800">{rep.akhlaaqAdabGrade}</span>
                    </div>
                  </div>

                  <p className="text-[10px] italic text-slate-500 bg-white p-2 rounded-lg border border-slate-100">
                    "{rep.ustadRemarks}"
                  </p>

                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => setActivePrintReport(rep)}
                      className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-[10px] flex items-center gap-1 ml-auto cursor-pointer"
                    >
                      <Printer className="w-3 h-3" />
                      Print Report Card
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NEW TALIB ENROLLMENT */}
      {/* ========================================================================= */}
      {isNewStudentModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-emerald-600" />
                Enroll Talib in Madresa
              </h3>
              <button
                type="button"
                onClick={() => setIsNewStudentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEnrollStudent} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Talib ITS Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="8 or 10-digit ITS"
                    value={studentForm.itsNumber}
                    onChange={(e) => setStudentForm({ ...studentForm, itsNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Talib Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mohammed Husain"
                    value={studentForm.studentName}
                    onChange={(e) => setStudentForm({ ...studentForm, studentName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Gender *</label>
                  <select
                    value={studentForm.gender}
                    onChange={(e) => setStudentForm({ ...studentForm, gender: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50"
                  >
                    <option value="MALE">Male (Farzand)</option>
                    <option value="FEMALE">Female (Farzandi)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={studentForm.dob}
                    onChange={(e) => setStudentForm({ ...studentForm, dob: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Age (Years)</label>
                  <input
                    type="number"
                    min={4}
                    max={18}
                    value={studentForm.age}
                    onChange={(e) => setStudentForm({ ...studentForm, age: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Class / Daur Assignment *</label>
                  <select
                    value={studentForm.classId}
                    onChange={(e) => setStudentForm({ ...studentForm, classId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-bold"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} (Fee: ₹{c.annualFee.toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mohallah</label>
                  <input
                    type="text"
                    value={studentForm.mohallah}
                    onChange={(e) => setStudentForm({ ...studentForm, mohallah: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Guardian ITS</label>
                  <input
                    type="text"
                    placeholder="HOF ITS"
                    value={studentForm.guardianIts}
                    onChange={(e) => setStudentForm({ ...studentForm, guardianIts: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Guardian Name</label>
                  <input
                    type="text"
                    placeholder="Father/Guardian Name"
                    value={studentForm.guardianName}
                    onChange={(e) => setStudentForm({ ...studentForm, guardianName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Number</label>
                  <input
                    type="text"
                    placeholder="Phone"
                    value={studentForm.contactNumber}
                    onChange={(e) => setStudentForm({ ...studentForm, contactNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewStudentModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md cursor-pointer"
                >
                  Confirm Admission
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: COLLECT FEE */}
      {/* ========================================================================= */}
      {isCollectFeeModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                Issue Madresa Fee Receipt
              </h3>
              <button
                type="button"
                onClick={() => setIsCollectFeeModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl text-xs space-y-1">
              <p className="font-bold text-emerald-950">{selectedStudent.studentName}</p>
              <div className="flex justify-between text-emerald-800">
                <span>Class: {selectedStudent.className}</span>
                <span className="font-bold">Pending: ₹{selectedStudent.outstandingFee.toLocaleString()}</span>
              </div>
            </div>

            <form onSubmit={handleCollectFee} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Fee Amount to Remit (₹) *</label>
                <input
                  type="number"
                  required
                  min={500}
                  step={500}
                  value={feeForm.amount}
                  onChange={(e) => setFeeForm({ ...feeForm, amount: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-slate-900 bg-slate-50 text-sm font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Mode *</label>
                  <select
                    value={feeForm.paymentMode}
                    onChange={(e) => setFeeForm({ ...feeForm, paymentMode: e.target.value as PaymentMode })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-medium"
                  >
                    <option value="UPI">UPI</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Receipt Date</label>
                  <input
                    type="date"
                    value={feeForm.date}
                    onChange={(e) => setFeeForm({ ...feeForm, date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Remarks</label>
                <input
                  type="text"
                  value={feeForm.remarks}
                  onChange={(e) => setFeeForm({ ...feeForm, remarks: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCollectFeeModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md cursor-pointer"
                >
                  Issue Fee Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* OFFICIAL DAWOODI BOHRA JAMAAT TRUST MADRESA RECEIPT PRINT STUDIO */}
      {/* ========================================================================= */}
      <TrustOfficialReceiptModal
        isOpen={!!activePrintReceipt}
        onClose={() => setActivePrintReceipt(null)}
        currentUser={currentUser}
        title="Official Dawoodi Bohra Jamaat Trust — Madresa Fee Receipt"
        subtitle={
          activePrintReceipt
            ? `Receipt #${activePrintReceipt.receiptNo} • ${activePrintReceipt.studentName} | ${activePrintReceipt.className}`
            : 'Madresa Deaniyah Education Fee Voucher'
        }
        receiptData={activePrintReceipt ? buildMadresaReceiptData(activePrintReceipt) : undefined}
      />

      {/* ========================================================================= */}
      {/* PRINT-READY PROGRESS REPORT CARD */}
      {/* ========================================================================= */}
      {activePrintReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-300 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="text-[11px] font-bold text-purple-900">Deaniyah Progress Certificate</span>
              <button
                type="button"
                onClick={() => setActivePrintReport(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="border border-slate-300 p-5 rounded-xl bg-purple-50/10 text-xs space-y-3">
              <div className="text-center font-mono">
                <p className="text-[11px] text-slate-500">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
                <h4 className="font-bold text-slate-900 text-sm">AL-MADRASA AL-SAIFIYAH</h4>
                <p className="text-[10px] text-purple-800 font-bold">{activePrintReport.term} EXAMINATION</p>
              </div>

              <div className="border-t border-slate-200 pt-2 flex justify-between font-semibold">
                <span>Talib Name: {activePrintReport.studentName}</span>
                <span className="text-purple-900 font-bold">{activePrintReport.className}</span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-200 text-[11px]">
                <div className="p-2 flex justify-between bg-slate-50">
                  <span className="font-semibold">Subject / Module</span>
                  <span className="font-bold">Evaluation & Assessment</span>
                </div>
                <div className="p-2 flex justify-between">
                  <span>Quran Recitation / Hifz:</span>
                  <span className="font-semibold text-slate-800">{activePrintReport.quranHifzGrade}</span>
                </div>
                <div className="p-2 flex justify-between">
                  <span>Deeniyat & Fiqh Practicals:</span>
                  <span className="font-semibold text-slate-800">{activePrintReport.deeniyatGrade}</span>
                </div>
                <div className="p-2 flex justify-between">
                  <span>Lisan-ud-Dawat Reading/Writing:</span>
                  <span className="font-semibold text-slate-800">{activePrintReport.lisanDawatGrade}</span>
                </div>
                <div className="p-2 flex justify-between">
                  <span>Akhlaaq & Wuzu Discipline:</span>
                  <span className="font-semibold text-slate-800">{activePrintReport.akhlaaqAdabGrade}</span>
                </div>
              </div>

              <div className="flex justify-between items-center p-2.5 bg-purple-100 rounded-xl font-bold text-purple-950">
                <span>Overall Term Percentage: {activePrintReport.overallPercentage}%</span>
                <span>Class Rank: #{activePrintReport.rank}</span>
              </div>

              <p className="text-[10px] italic text-slate-600 bg-white p-2 rounded-lg border border-slate-100">
                Ustad's Remarks: "{activePrintReport.ustadRemarks}"
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Print Certificate
              </button>
              <button
                type="button"
                onClick={() => setActivePrintReport(null)}
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
