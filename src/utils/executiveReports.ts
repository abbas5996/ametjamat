import {
  GeneralReceiptRecord,
  FinancialSummaryMetrics,
  ReceiptContributionCategory,
  PaymentMode,
  FinancialYear,
  ReportType,
  HeadOfFamily,
} from '../types';
import { getStoredHofs } from './memberMaster';
import { getStoredTakhmeens } from './fmbTakhmeen';
import { getStoredSabeelLedger } from './sabeelManagement';
import { getStoredBookings } from './hallBooking';
import { getStoredActivityLogs, appendActivityLog } from './rbac';

export const GENERAL_RECEIPTS_STORAGE_KEY = 'jamat_general_receipts_v1';

export const INITIAL_GENERAL_RECEIPTS: GeneralReceiptRecord[] = [
  {
    id: 'gen-rcp-001',
    receiptNo: 'RCP-2026-0001',
    date: '2026-10-10',
    time: '10:30 AM',
    isGuest: false,
    itsNumber: '30489122',
    payerName: 'Mulla Shabbir Bhai Fakhri',
    mobileNumber: '9820011223',
    mohallah: 'Burhani Mohallah (Sector B)',
    category: 'General Sadaqah / Donation',
    amount: 10000,
    paymentMode: 'UPI',
    referenceNumber: 'UPI/9848102941',
    remarks: 'Niyaz / Darees Mubarak general donation fund',
    collectedBy: 'janabadmin',
    financialYear: '1447-1448 Hijri',
    createdAt: '2026-10-10 10:30:00',
  },
  {
    id: 'gen-rcp-002',
    receiptNo: 'RCP-2026-0002',
    date: '2026-10-14',
    time: '02:15 PM',
    isGuest: false,
    itsNumber: '40291844',
    payerName: 'Sheikh Huzefa Jamali',
    mobileNumber: '9820044556',
    mohallah: 'Saifee Mohallah (Sector A)',
    category: 'Sabeel Contribution',
    amount: 12000,
    paymentMode: 'Bank Transfer',
    referenceNumber: 'NEFT-AXIS-9182',
    remarks: 'Annual Sabeel contribution supplementary top-up',
    collectedBy: 'cashier1',
    financialYear: '1447-1448 Hijri',
    createdAt: '2026-10-14 14:15:00',
  },
  {
    id: 'gen-rcp-003',
    receiptNo: 'RCP-2026-0003',
    date: '2026-10-18',
    time: '11:45 AM',
    isGuest: true,
    payerName: 'Shabbir Bhai Contractor',
    mobileNumber: '9820199442',
    mohallah: 'Visiting Guest / Non-Resident',
    category: 'Miscellaneous',
    amount: 7500,
    paymentMode: 'Cash',
    referenceNumber: 'CASH-COUNTER-021',
    remarks: 'Contribution towards community garden maintenance',
    collectedBy: 'cashier1',
    financialYear: '1447-1448 Hijri',
    createdAt: '2026-10-18 11:45:00',
  },
  {
    id: 'gen-rcp-004',
    receiptNo: 'RCP-2026-0004',
    date: '2026-10-21',
    time: '04:20 PM',
    isGuest: false,
    itsNumber: '20394855',
    payerName: 'Mulla Aliasgar Hakimuddin',
    mobileNumber: '9820033445',
    mohallah: 'Saifee Mohallah (Sector A)',
    category: 'FMB Extra',
    amount: 15000,
    paymentMode: 'Cheque',
    referenceNumber: 'CHQ-882190',
    remarks: 'Special Feast / Extra Hubb for Milad un Nabi (SAW)',
    collectedBy: 'janabadmin',
    financialYear: '1447-1448 Hijri',
    createdAt: '2026-10-21 16:20:00',
  },
  {
    id: 'gen-rcp-005',
    receiptNo: 'RCP-2026-0005',
    date: '2026-10-24',
    time: '05:00 PM',
    isGuest: true,
    payerName: 'Yusuf Bhai Godhrawala',
    mobileNumber: '9819955221',
    mohallah: 'Visiting Guest / Non-Resident',
    category: 'Zakat',
    amount: 25000,
    paymentMode: 'Bank Transfer',
    referenceNumber: 'IMPS-20491024',
    remarks: 'Zakat Fund settlement for community welfare',
    collectedBy: 'janabadmin',
    financialYear: '1447-1448 Hijri',
    createdAt: '2026-10-24 17:00:00',
  },
];

/**
 * Retrieve General Receipts from localStorage or initialize with seed data
 */
export const getStoredGeneralReceipts = (): GeneralReceiptRecord[] => {
  try {
    const raw = localStorage.getItem(GENERAL_RECEIPTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(
        GENERAL_RECEIPTS_STORAGE_KEY,
        JSON.stringify(INITIAL_GENERAL_RECEIPTS)
      );
      return INITIAL_GENERAL_RECEIPTS;
    }
    return JSON.parse(raw) as GeneralReceiptRecord[];
  } catch (err) {
    console.error('Failed to load general receipts:', err);
    return INITIAL_GENERAL_RECEIPTS;
  }
};

/**
 * Save General Receipts to localStorage
 */
export const saveStoredGeneralReceipts = (receipts: GeneralReceiptRecord[]): void => {
  try {
    localStorage.setItem(GENERAL_RECEIPTS_STORAGE_KEY, JSON.stringify(receipts));
  } catch (err) {
    console.error('Failed to persist general receipts:', err);
  }
};

/**
 * Auto-generate next sequential receipt number (RCP-2026-XXXX)
 */
export const generateNextReceiptNumber = (existingReceipts?: GeneralReceiptRecord[]): string => {
  const receipts = existingReceipts || getStoredGeneralReceipts();
  const currentYear = new Date().getFullYear();
  let maxSeq = 0;

  receipts.forEach((r) => {
    const match = r.receiptNo.match(/RCP-(\d{4})-(\d+)/);
    if (match) {
      const year = parseInt(match[1], 10);
      const seq = parseInt(match[2], 10);
      if (year === currentYear && seq > maxSeq) {
        maxSeq = seq;
      }
    }
  });

  const nextSeq = maxSeq + 1;
  return `RCP-${currentYear}-${String(nextSeq).padStart(4, '0')}`;
};

/**
 * Create a new General Receipt and push audit log entry
 */
export const createGeneralReceipt = (
  payload: Omit<GeneralReceiptRecord, 'id' | 'receiptNo' | 'createdAt' | 'time'>,
  username: string
): GeneralReceiptRecord => {
  const currentReceipts = getStoredGeneralReceipts();
  const nextNo = generateNextReceiptNumber(currentReceipts);
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const newReceipt: GeneralReceiptRecord = {
    ...payload,
    id: `gen-rcp-${Date.now()}`,
    receiptNo: nextNo,
    time: timeStr,
    createdAt: `${payload.date} ${timeStr}`,
  };

  const updated = [newReceipt, ...currentReceipts];
  saveStoredGeneralReceipts(updated);

  // Central Activity Log Integration
  appendActivityLog(
    username,
    'Accounts & Finance',
    'Counter Payment',
    'ADD',
    `Generated General Receipt ${newReceipt.receiptNo} of ₹${newReceipt.amount.toLocaleString()} for ${
      newReceipt.payerName
    } [${newReceipt.category} | ${newReceipt.paymentMode}]`
  );

  return newReceipt;
};

/**
 * Multi-module financial aggregation for Executive Dashboard
 */
export const calculateFinancialMetrics = (
  yearFilter: string,
  mohallahFilter: string,
  startDate?: string,
  endDate?: string
): FinancialSummaryMetrics => {
  const takhmeens = getStoredTakhmeens();
  const sabeelLedgers = getStoredSabeelLedger();
  const bookings = getStoredBookings();
  const generalReceipts = getStoredGeneralReceipts();
  const hofs = getStoredHofs();

  // Create quick Mohallah lookup by ITS
  const hofMohallahMap = new Map<string, string>();
  hofs.forEach((h) => {
    hofMohallahMap.set(h.itsNumber, h.mohallahName || h.mohallahId);
  });

  // Filter FMB Takhmeens
  let filteredTakhmeens = takhmeens;
  if (yearFilter && yearFilter !== 'all') {
    filteredTakhmeens = filteredTakhmeens.filter((t) => t.financialYear === yearFilter);
  }
  if (mohallahFilter && mohallahFilter !== 'all') {
    filteredTakhmeens = filteredTakhmeens.filter(
      (t) => hofMohallahMap.get(t.itsNumber) === mohallahFilter
    );
  }

  const fmbTarget = filteredTakhmeens.reduce((sum, t) => sum + (t.committedAmount || 0), 0);
  const fmbCollected = filteredTakhmeens.reduce((sum, t) => sum + (t.paidAmount || 0), 0);
  const fmbOutstanding = filteredTakhmeens.reduce((sum, t) => sum + (t.balanceDue || 0), 0);

  // Filter Sabeel Ledgers
  let filteredSabeel = sabeelLedgers;
  if (mohallahFilter && mohallahFilter !== 'all') {
    filteredSabeel = filteredSabeel.filter(
      (s) => s.mohallahName === mohallahFilter || s.mohallahName?.includes(mohallahFilter)
    );
  }

  const sabeelTarget = filteredSabeel.reduce((sum, s) => sum + (s.committedAmount || 0), 0);
  const sabeelCollected = filteredSabeel.reduce((sum, s) => sum + (s.paidAmount || 0), 0);
  const sabeelOutstanding = filteredSabeel.reduce((sum, s) => sum + (s.balanceDue || 0), 0);

  // Filter Hall Bookings
  let filteredBookings = bookings;
  if (mohallahFilter && mohallahFilter !== 'all') {
    filteredBookings = filteredBookings.filter(
      (b) => hofMohallahMap.get(b.itsNumber) === mohallahFilter
    );
  }
  if (startDate) {
    filteredBookings = filteredBookings.filter((b) => b.eventDate >= startDate);
  }
  if (endDate) {
    filteredBookings = filteredBookings.filter((b) => b.eventDate <= endDate);
  }

  const hallBookingEarnings = filteredBookings.reduce((sum, b) => sum + (b.paidAmount || 0), 0);
  const hallBookingOutstanding = filteredBookings.reduce((sum, b) => sum + (b.balanceDue || 0), 0);

  // Filter General Receipts
  let filteredGenReceipts = generalReceipts;
  if (yearFilter && yearFilter !== 'all') {
    filteredGenReceipts = filteredGenReceipts.filter((r) => r.financialYear === yearFilter);
  }
  if (mohallahFilter && mohallahFilter !== 'all') {
    filteredGenReceipts = filteredGenReceipts.filter(
      (r) =>
        r.mohallah === mohallahFilter ||
        (r.itsNumber && hofMohallahMap.get(r.itsNumber) === mohallahFilter)
    );
  }
  if (startDate) {
    filteredGenReceipts = filteredGenReceipts.filter((r) => r.date >= startDate);
  }
  if (endDate) {
    filteredGenReceipts = filteredGenReceipts.filter((r) => r.date <= endDate);
  }

  const generalDonationsTotal = filteredGenReceipts.reduce((sum, r) => sum + (r.amount || 0), 0);

  // Combined metrics
  const totalRevenue = fmbCollected + sabeelCollected + hallBookingEarnings + generalDonationsTotal;
  const totalOutstanding = fmbOutstanding + sabeelOutstanding + hallBookingOutstanding;

  return {
    totalRevenue,
    fmbTarget,
    fmbCollected,
    fmbOutstanding,
    sabeelTarget,
    sabeelCollected,
    sabeelOutstanding,
    hallBookingEarnings,
    hallBookingOutstanding,
    generalDonationsTotal,
    totalOutstanding,
  };
};

/**
 * Report Data Row extraction for 5 selectable report types
 */
export interface CompiledReportData {
  title: string;
  subtitle: string;
  headers: string[];
  rows: (string | number)[][];
}

export const generateReportDataset = (
  reportType: ReportType,
  filters: {
    mohallah?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }
): CompiledReportData => {
  const hofs = getStoredHofs();
  const takhmeens = getStoredTakhmeens();
  const sabeelLedgers = getStoredSabeelLedger();
  const bookings = getStoredBookings();
  const activityLogs = getStoredActivityLogs();

  const hofMohallahMap = new Map<string, string>();
  hofs.forEach((h) => hofMohallahMap.set(h.itsNumber, h.mohallahName || h.mohallahId));

  switch (reportType) {
    case 'member-directory': {
      let filtered = hofs;
      if (filters.mohallah && filters.mohallah !== 'all') {
        filtered = filtered.filter(
          (h) => h.mohallahName === filters.mohallah || h.mohallahId === filters.mohallah
        );
      }

      const headers = [
        'ITS No',
        'HOF Full Name',
        'Father Name',
        'Mohallah / Sector',
        'Full Address',
        'Mobile Number',
        'WhatsApp Number',
        'Family Members Count',
        'Occupation',
      ];

      const rows = filtered.map((h) => [
        h.itsNumber,
        h.fullName,
        h.fatherName || '-',
        h.mohallahName || h.mohallahId || '-',
        h.fullAddress || '-',
        h.mobileNumber,
        h.whatsappNumber || '-',
        (h.familyMembers?.length || 0) + 1,
        h.occupation || '-',
      ]);

      return {
        title: 'Member Directory & Family Census Master Export',
        subtitle: `Total HOF Records: ${rows.length} | Generated on ${new Date().toLocaleDateString()}`,
        headers,
        rows,
      };
    }

    case 'fmb-defaulters': {
      let filtered = takhmeens;
      if (filters.mohallah && filters.mohallah !== 'all') {
        filtered = filtered.filter((t) => hofMohallahMap.get(t.itsNumber) === filters.mohallah);
      }
      if (filters.status && filters.status !== 'all') {
        filtered = filtered.filter((t) =>
          filters.status === 'Defaulters' ? t.balanceDue > 0 : t.balanceDue === 0
        );
      }

      const headers = [
        'ITS No',
        'HOF Name',
        'Mohallah',
        'Thaali Tier',
        'Year',
        'Committed Amount (₹)',
        'Paid Amount (₹)',
        'Balance Due (₹)',
        'Status',
      ];

      const rows = filtered.map((t) => [
        t.itsNumber,
        t.hofName,
        hofMohallahMap.get(t.itsNumber) || 'General',
        t.tier,
        t.financialYear,
        t.committedAmount,
        t.paidAmount,
        t.balanceDue,
        t.status,
      ]);

      return {
        title: 'FMB Takhmeen & Outstanding Defaulters Dues Report',
        subtitle: `Total Thaali Accounts: ${rows.length} | Generated on ${new Date().toLocaleDateString()}`,
        headers,
        rows,
      };
    }

    case 'sabeel-status': {
      let filtered = sabeelLedgers;
      if (filters.mohallah && filters.mohallah !== 'all') {
        const targetMohallah = filters.mohallah;
        filtered = filtered.filter(
          (s) => s.mohallahName === targetMohallah || (s.mohallahName && s.mohallahName.includes(targetMohallah))
        );
      }
      if (filters.status && filters.status !== 'all') {
        filtered = filtered.filter((s) =>
          filters.status === 'Defaulters' ? s.balanceDue > 0 : s.balanceDue === 0
        );
      }

      const headers = [
        'ITS No',
        'HOF Name',
        'Sabeel No',
        'Mohallah',
        'Category',
        'Committed (₹)',
        'Paid (₹)',
        'Balance Due (₹)',
        'Account Status',
      ];

      const rows = filtered.map((s) => [
        s.itsNumber,
        s.hofName,
        s.sabeelNo,
        s.mohallahName,
        s.category,
        s.committedAmount,
        s.paidAmount,
        s.balanceDue,
        s.status,
      ]);

      return {
        title: 'Sabeel ul Khair Master Ledger & Collection Status Report',
        subtitle: `Total Sabeel Ledgers: ${rows.length} | Generated on ${new Date().toLocaleDateString()}`,
        headers,
        rows,
      };
    }

    case 'hall-revenue': {
      let filtered = bookings;
      if (filters.startDate) {
        filtered = filtered.filter((b) => b.eventDate >= filters.startDate!);
      }
      if (filters.endDate) {
        filtered = filtered.filter((b) => b.eventDate <= filters.endDate!);
      }
      if (filters.status && filters.status !== 'all') {
        filtered = filtered.filter((b) => b.paymentStatus === filters.status);
      }

      const headers = [
        'Booking Code',
        'Facility Name',
        'Event Date',
        'Event Type',
        'Organizer (HOF)',
        'ITS No',
        'Mobile',
        'Total Charges (₹)',
        'Paid Amount (₹)',
        'Balance Due (₹)',
        'Payment Status',
        'Booking Status',
      ];

      const rows = filtered.map((b) => [
        b.bookingCode,
        b.facilityName,
        b.eventDate,
        b.eventType,
        b.hofName,
        b.itsNumber,
        b.mobileNumber,
        b.totalCharges,
        b.paidAmount,
        b.balanceDue,
        b.paymentStatus,
        b.bookingStatus,
      ]);

      return {
        title: 'Hall Booking Schedule, Facility Usage & Revenue Report',
        subtitle: `Total Bookings: ${rows.length} | Generated on ${new Date().toLocaleDateString()}`,
        headers,
        rows,
      };
    }

    case 'activity-audit': {
      let filtered = activityLogs;
      if (filters.startDate) {
        filtered = filtered.filter((a) => a.timestamp >= filters.startDate!);
      }
      if (filters.endDate) {
        filtered = filtered.filter((a) => a.timestamp <= filters.endDate!);
      }

      const headers = [
        'Timestamp',
        'Username',
        'Department',
        'Subpage',
        'Action Type',
        'Audit Details',
      ];

      const rows = filtered.map((a) => [
        a.timestamp,
        a.username,
        a.department,
        a.subpage,
        a.actionType,
        a.details,
      ]);

      return {
        title: 'Central Security Audit Trail & System Activity Log Export',
        subtitle: `Total Audit Records: ${rows.length} | Generated on ${new Date().toLocaleDateString()}`,
        headers,
        rows,
      };
    }

    default:
      return {
        title: 'General Jamaat ERP Report',
        subtitle: 'Exported on ' + new Date().toLocaleDateString(),
        headers: [],
        rows: [],
      };
  }
};

/**
 * Clean CSV Exporter with UTF-8 BOM for Microsoft Excel compatibility
 */
export const exportToCSV = (
  filename: string,
  headers: string[],
  rows: (string | number)[][]
): void => {
  const escapeCell = (val: string | number): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvRows: string[] = [];
  csvRows.push(headers.map(escapeCell).join(','));

  rows.forEach((row) => {
    csvRows.push(row.map(escapeCell).join(','));
  });

  const csvContent = '\uFEFF' + csvRows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Lightweight XML-based Excel Spreadsheet (.xls) exporter
 * Opens seamlessly in MS Excel, LibreOffice, and Google Sheets
 */
export const exportToExcel = (
  filename: string,
  headers: string[],
  rows: (string | number)[][]
): void => {
  const sanitize = (text: string | number) => {
    return String(text ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  let xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Header">
   <Font ss:Bold="1" ss:Color="#FFFFFF" ss:FontName="Calibri" ss:Size="11"/>
   <Interior ss:Color="#1E293B" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="Data">
   <Font ss:FontName="Calibri" ss:Size="10"/>
   <Alignment ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="Number">
   <Font ss:FontName="Calibri" ss:Size="10"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Report Data">
  <Table>
   <Row ss:StyleID="Header" ss:Height="24">
`;

  headers.forEach((h) => {
    xml += `    <Cell><Data ss:Type="String">${sanitize(h)}</Data></Cell>\n`;
  });

  xml += `   </Row>\n`;

  rows.forEach((row) => {
    xml += `   <Row ss:Height="18">\n`;
    row.forEach((cell) => {
      const isNum = typeof cell === 'number' && !isNaN(cell);
      const style = isNum ? 'Number' : 'Data';
      const type = isNum ? 'Number' : 'String';
      xml += `    <Cell ss:StyleID="${style}"><Data ss:Type="${type}">${sanitize(cell)}</Data></Cell>\n`;
    });
    xml += `   </Row>\n`;
  });

  xml += `  </Table>
 </Worksheet>
</Workbook>`;

  const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.xls`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
