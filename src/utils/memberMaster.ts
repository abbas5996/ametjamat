import {
  HeadOfFamily,
  FamilyMember,
  Mohallah,
  BloodGroup,
} from '../types';
import { appendActivityLog } from './rbac';

export const MEMBER_HOFS_STORAGE_KEY = 'jamat_member_master_hofs_v1';
export const MOHALLAH_STORAGE_KEY = 'jamat_mohallah_master_v1';

export const INITIAL_MOHALLAHS: Mohallah[] = [
  {
    id: 'MOH-SEC-A',
    name: 'Saifee Mohallah (Sector A)',
    code: 'SEC-A',
    sectorInchargeName: 'Mulla Huzefa Bhai Jamali',
    sectorInchargeIts: '20391823',
    inchargeMobile: '9820011223',
    notes: 'Gate 1 Entry, Burhani Park Buildings 1 to 5.',
    colorTag: 'emerald',
  },
  {
    id: 'MOH-SEC-B',
    name: 'Burhani Mohallah (Sector B)',
    code: 'SEC-B',
    sectorInchargeName: 'Sheikh Shabbir Bhai Fakhri',
    sectorInchargeIts: '30489122',
    inchargeMobile: '9820044556',
    notes: 'Central Garden wing, Buildings 6 to 11.',
    colorTag: 'blue',
  },
  {
    id: 'MOH-SEC-C',
    name: 'Badri Mohallah (Sector C)',
    code: 'SEC-C',
    sectorInchargeName: 'Mulla Taher Bhai Vajihi',
    sectorInchargeIts: '30491024',
    inchargeMobile: '9820077889',
    notes: 'Masjid & Mawaid Complex wing, Row Houses.',
    colorTag: 'amber',
  },
  {
    id: 'MOH-SEC-D',
    name: 'Najmi Mohallah (Sector D)',
    code: 'SEC-D',
    sectorInchargeName: 'Mulla Abbas Bhai Rajkotwala',
    sectorInchargeIts: '20381044',
    inchargeMobile: '9820099001',
    notes: 'East Wing Towers A & B, Flats 101 to 604.',
    colorTag: 'purple',
  },
];
export const MOHALLAH_LIST = INITIAL_MOHALLAHS;

export const INITIAL_HOFS: HeadOfFamily[] = [
  {
    id: 'hof-1',
    itsNumber: '30489122',
    fullName: 'Mulla Shabbir Bhai Fakhri',
    fatherName: 'Ibrahim Bhai',
    surname: 'Fakhri',
    mobileNumber: '9820044556',
    whatsappNumber: '9820044556',
    fullAddress: 'Flat 402, Al-Burhani Heights, Sector B, Burhani Park',
    occupation: 'Hardware & Engineering Tools Merchant',
    mohallahId: 'MOH-SEC-B',
    mohallahName: 'Burhani Mohallah (Sector B)',
    status: 'Active',
    sabeelNo: 'SB-042',
    thaaliNo: 'TH-084',
    emergencyContact: '9820044559',
    bloodGroup: 'B+',
    notes: 'Senior Member, FMB Committee Volunteer',
    createdAt: '1446-01-15',
    updatedAt: '1447-02-10',
    familyMembers: [
      {
        id: 'fm-101',
        itsNumber: '30489123',
        fullName: 'Fatema Bai Fakhri',
        relation: 'Wife',
        gender: 'Female',
        maritalStatus: 'Married',
        bloodGroup: 'B+',
        age: 44,
        hofItsNumber: '30489122',
        mobileNumber: '9820044557',
        status: 'Active',
      },
      {
        id: 'fm-102',
        itsNumber: '30489124',
        fullName: 'Ali Asghar Fakhri',
        relation: 'Son',
        gender: 'Male',
        maritalStatus: 'Single',
        bloodGroup: 'O+',
        age: 21,
        hofItsNumber: '30489122',
        mobileNumber: '9820044558',
        status: 'Active',
      },
      {
        id: 'fm-103',
        itsNumber: '30489125',
        fullName: 'Sakina Fakhri',
        relation: 'Daughter',
        gender: 'Female',
        maritalStatus: 'Single',
        bloodGroup: 'B+',
        age: 18,
        hofItsNumber: '30489122',
        status: 'Active',
      },
      {
        id: 'fm-104',
        itsNumber: '30489126',
        fullName: 'Zainab Bai Fakhri',
        relation: 'Mother',
        gender: 'Female',
        maritalStatus: 'Widowed',
        bloodGroup: 'O+',
        age: 72,
        hofItsNumber: '30489122',
        status: 'Active',
      },
    ],
  },
  {
    id: 'hof-2',
    itsNumber: '20391823',
    fullName: 'Sheikh Huzefa Bhai Jamali',
    fatherName: 'Saifuddin Bhai',
    surname: 'Jamali',
    mobileNumber: '9820011223',
    whatsappNumber: '9820011223',
    fullAddress: 'Villa 12, Saifee Enclave, Sector A, Burhani Park',
    occupation: 'Textiles & Garments Exporter',
    mohallahId: 'MOH-SEC-A',
    mohallahName: 'Saifee Mohallah (Sector A)',
    status: 'Active',
    sabeelNo: 'SB-118',
    thaaliNo: 'TH-012',
    emergencyContact: '9820011225',
    bloodGroup: 'A+',
    notes: 'Sector Incharge, Toloba Coordinator',
    createdAt: '1446-02-01',
    updatedAt: '1447-01-20',
    familyMembers: [
      {
        id: 'fm-201',
        itsNumber: '20391824',
        fullName: 'Amatullah Bai Jamali',
        relation: 'Wife',
        gender: 'Female',
        maritalStatus: 'Married',
        bloodGroup: 'A+',
        age: 38,
        hofItsNumber: '20391823',
        mobileNumber: '9820011224',
        status: 'Active',
      },
      {
        id: 'fm-202',
        itsNumber: '20391825',
        fullName: 'Burhanuddin Jamali',
        relation: 'Son',
        gender: 'Male',
        maritalStatus: 'Single',
        bloodGroup: 'A+',
        age: 16,
        hofItsNumber: '20391823',
        status: 'Active',
      },
      {
        id: 'fm-203',
        itsNumber: '20391826',
        fullName: 'Umme Kulsum Jamali',
        relation: 'Daughter',
        gender: 'Female',
        maritalStatus: 'Single',
        bloodGroup: 'O+',
        age: 12,
        hofItsNumber: '20391823',
        status: 'Active',
      },
    ],
  },
  {
    id: 'hof-3',
    itsNumber: '30491024',
    fullName: 'Mulla Taher Bhai Vajihi',
    fatherName: 'Nooruddin Bhai',
    surname: 'Vajihi',
    mobileNumber: '9820077889',
    whatsappNumber: '9820077889',
    fullAddress: 'B-303, Badri Complex, Sector C, Burhani Park',
    occupation: 'Chartered Accountant & Tax Consultant',
    mohallahId: 'MOH-SEC-C',
    mohallahName: 'Badri Mohallah (Sector C)',
    status: 'Active',
    sabeelNo: 'SB-089',
    thaaliNo: 'TH-150',
    emergencyContact: '9820077890',
    bloodGroup: 'O+',
    notes: 'Audit Committee Advisor',
    createdAt: '1446-03-10',
    updatedAt: '1447-02-14',
    familyMembers: [
      {
        id: 'fm-301',
        itsNumber: '30491025',
        fullName: 'Rashida Bai Vajihi',
        relation: 'Wife',
        gender: 'Female',
        maritalStatus: 'Married',
        bloodGroup: 'AB+',
        age: 41,
        hofItsNumber: '30491024',
        mobileNumber: '9820077891',
        status: 'Active',
      },
      {
        id: 'fm-302',
        itsNumber: '30491026',
        fullName: 'Murtaza Vajihi',
        relation: 'Son',
        gender: 'Male',
        maritalStatus: 'Single',
        bloodGroup: 'O+',
        age: 19,
        hofItsNumber: '30491024',
        status: 'Active',
      },
      {
        id: 'fm-303',
        itsNumber: '30491027',
        fullName: 'Nooruddin Bhai Vajihi',
        relation: 'Father',
        gender: 'Male',
        maritalStatus: 'Married',
        bloodGroup: 'O+',
        age: 76,
        hofItsNumber: '30491024',
        status: 'Active',
      },
      {
        id: 'fm-304',
        itsNumber: '30491028',
        fullName: 'Mariyam Bai Vajihi',
        relation: 'Mother',
        gender: 'Female',
        maritalStatus: 'Married',
        bloodGroup: 'A+',
        age: 70,
        hofItsNumber: '30491024',
        status: 'Active',
      },
    ],
  },
  {
    id: 'hof-4',
    itsNumber: '20381044',
    fullName: 'Mulla Abbas Bhai Rajkotwala',
    fatherName: 'Kasamali Bhai',
    surname: 'Rajkotwala',
    mobileNumber: '9820099001',
    whatsappNumber: '9820099001',
    fullAddress: 'Tower A - 501, Najmi Residency, Sector D, Burhani Park',
    occupation: 'Building Materials & Plywood Supplier',
    mohallahId: 'MOH-SEC-D',
    mohallahName: 'Najmi Mohallah (Sector D)',
    status: 'Active',
    sabeelNo: 'SB-204',
    thaaliNo: 'TH-221',
    emergencyContact: '9820099005',
    bloodGroup: 'AB+',
    notes: 'Qardan Hasana Trustee',
    createdAt: '1446-04-12',
    updatedAt: '1447-03-01',
    familyMembers: [
      {
        id: 'fm-401',
        itsNumber: '20381045',
        fullName: 'Zahra Bai Rajkotwala',
        relation: 'Wife',
        gender: 'Female',
        maritalStatus: 'Married',
        bloodGroup: 'B+',
        age: 46,
        hofItsNumber: '20381044',
        mobileNumber: '9820099002',
        status: 'Active',
      },
      {
        id: 'fm-402',
        itsNumber: '20381046',
        fullName: 'Husain Rajkotwala',
        relation: 'Son',
        gender: 'Male',
        maritalStatus: 'Married',
        bloodGroup: 'AB+',
        age: 26,
        hofItsNumber: '20381044',
        mobileNumber: '9820099003',
        status: 'Active',
      },
      {
        id: 'fm-403',
        itsNumber: '20381047',
        fullName: 'Insiyah Rajkotwala',
        relation: 'Daughter-in-law',
        gender: 'Female',
        maritalStatus: 'Married',
        bloodGroup: 'O+',
        age: 24,
        hofItsNumber: '20381044',
        status: 'Active',
      },
      {
        id: 'fm-404',
        itsNumber: '20381048',
        fullName: 'Taha Rajkotwala',
        relation: 'Grandchild',
        gender: 'Male',
        maritalStatus: 'Single',
        bloodGroup: 'AB+',
        age: 2,
        hofItsNumber: '20381044',
        status: 'Active',
      },
    ],
  },
  // UNMAPPED HOFS (ready for area assignment in Subpage 2)
  {
    id: 'hof-5',
    itsNumber: '40192831',
    fullName: 'Mulla Mustafa Bhai Kapasi',
    fatherName: 'Yusufali Bhai',
    surname: 'Kapasi',
    mobileNumber: '9833112244',
    whatsappNumber: '9833112244',
    fullAddress: 'Plot 88, Near New Colony Bridge, Burhani Park Extension',
    occupation: 'Electrical Goods Wholesaler',
    mohallahId: '', // UNMAPPED
    mohallahName: 'Unassigned',
    status: 'Active',
    sabeelNo: 'SB-310',
    thaaliNo: 'TH-095',
    emergencyContact: '9833112245',
    bloodGroup: 'A-',
    notes: 'Newly shifted from Surat Jamaat, pending mohallah assignment',
    createdAt: '1447-01-05',
    updatedAt: '1447-03-01',
    familyMembers: [
      {
        id: 'fm-501',
        itsNumber: '40192832',
        fullName: 'Tasneem Bai Kapasi',
        relation: 'Wife',
        gender: 'Female',
        maritalStatus: 'Married',
        bloodGroup: 'A+',
        age: 35,
        hofItsNumber: '40192831',
        mobileNumber: '9833112246',
        status: 'Active',
      },
      {
        id: 'fm-502',
        itsNumber: '40192833',
        fullName: 'Yusuf Kapasi',
        relation: 'Son',
        gender: 'Male',
        maritalStatus: 'Single',
        bloodGroup: 'A-',
        age: 9,
        hofItsNumber: '40192831',
        status: 'Active',
      },
    ],
  },
  {
    id: 'hof-6',
    itsNumber: '50281940',
    fullName: 'Shaikh Hatim Bhai Badri',
    fatherName: 'Gulamabbas Bhai',
    surname: 'Badri',
    mobileNumber: '9821155667',
    whatsappNumber: '9821155667',
    fullAddress: 'Apartment 204, Royal Crescent, Sector Road',
    occupation: 'Optician & Eyewear Clinic',
    mohallahId: '', // UNMAPPED
    mohallahName: 'Unassigned',
    status: 'Active',
    sabeelNo: 'SB-405',
    thaaliNo: 'TH-166',
    emergencyContact: '9821155668',
    bloodGroup: 'O-',
    notes: 'Address verified, sector mapping pending',
    createdAt: '1447-02-10',
    updatedAt: '1447-02-10',
    familyMembers: [
      {
        id: 'fm-601',
        itsNumber: '50281941',
        fullName: 'Arwa Bai Badri',
        relation: 'Wife',
        gender: 'Female',
        maritalStatus: 'Married',
        bloodGroup: 'O+',
        age: 32,
        hofItsNumber: '50281940',
        mobileNumber: '9821155669',
        status: 'Active',
      },
      {
        id: 'fm-602',
        itsNumber: '50281942',
        fullName: 'Batul Badri',
        relation: 'Daughter',
        gender: 'Female',
        maritalStatus: 'Single',
        bloodGroup: 'O-',
        age: 5,
        hofItsNumber: '50281940',
        status: 'Active',
      },
    ],
  },
  {
    id: 'hof-7',
    itsNumber: '60392811',
    fullName: 'Mulla Idris Bhai Godhrawala',
    fatherName: 'Fakhruddin Bhai',
    surname: 'Godhrawala',
    mobileNumber: '9819933445',
    whatsappNumber: '9819933445',
    fullAddress: 'Shop & Residence 14, Commercial Lane, Burhani Park',
    occupation: 'Stationery & Printing Press',
    mohallahId: 'MOH-SEC-C',
    mohallahName: 'Badri Mohallah (Sector C)',
    status: 'Inactive',
    sabeelNo: 'SB-015',
    thaaliNo: 'TH-028',
    emergencyContact: '9819933446',
    bloodGroup: 'B-',
    notes: 'Temporarily on Safar Mubarak to Karbala',
    createdAt: '1446-05-18',
    updatedAt: '1447-03-02',
    familyMembers: [
      {
        id: 'fm-701',
        itsNumber: '60392812',
        fullName: 'Zainab Bai Godhrawala',
        relation: 'Wife',
        gender: 'Female',
        maritalStatus: 'Married',
        bloodGroup: 'B+',
        age: 50,
        hofItsNumber: '60392811',
        status: 'Inactive',
      },
    ],
  },
];

// Helper to get stored HOFs
export const getStoredHofs = (): HeadOfFamily[] => {
  try {
    const raw = localStorage.getItem(MEMBER_HOFS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(MEMBER_HOFS_STORAGE_KEY, JSON.stringify(INITIAL_HOFS));
      return INITIAL_HOFS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse HOFs from localStorage', err);
    return INITIAL_HOFS;
  }
};

// Helper to save HOFs to localStorage
export const saveStoredHofs = (hofs: HeadOfFamily[]): void => {
  try {
    localStorage.setItem(MEMBER_HOFS_STORAGE_KEY, JSON.stringify(hofs));
  } catch (err) {
    console.error('Failed to save HOFs to localStorage', err);
  }
};

// Helper to get stored Mohallahs
export const getStoredMohallahs = (): Mohallah[] => {
  try {
    const raw = localStorage.getItem(MOHALLAH_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(MOHALLAH_STORAGE_KEY, JSON.stringify(INITIAL_MOHALLAHS));
      return INITIAL_MOHALLAHS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse Mohallahs from localStorage', err);
    return INITIAL_MOHALLAHS;
  }
};

// Helper to save Mohallahs to localStorage
export const saveStoredMohallahs = (mohallahs: Mohallah[]): void => {
  try {
    localStorage.setItem(MOHALLAH_STORAGE_KEY, JSON.stringify(mohallahs));
  } catch (err) {
    console.error('Failed to save Mohallahs to localStorage', err);
  }
};

/**
 * Audit log helper specifically for Member & Area Master actions.
 * Details strictly include Member ITS Number, Timestamp, Username, and Module Name.
 */
export const logMemberAudit = (
  username: string,
  subpage: string,
  actionType: 'ADD' | 'EDIT' | 'DELETE',
  memberIts: string,
  details: string
) => {
  appendActivityLog(
    username,
    'Member & Area Master',
    subpage,
    actionType,
    `[ITS: ${memberIts}] ${details}`
  );
};

/**
 * Cross-module consumer helper:
 * Returns all Mumineen (HOF + FMs) flattened in a clean lookup list.
 * Can be imported directly by FMB, Sabeel, Services, and Payments modules!
 */
export interface FlattenedMumin {
  itsNumber: string;
  fullName: string;
  isHof: boolean;
  relation: string;
  gender: string;
  age: number;
  bloodGroup: string;
  mobile: string;
  hofIts: string;
  hofName: string;
  mohallahId: string;
  mohallahName: string;
  address: string;
  sabeelNo?: string;
  thaaliNo?: string;
  status: 'Active' | 'Inactive';
}

export const getAllMumineenList = (hofsList?: HeadOfFamily[]): FlattenedMumin[] => {
  const hofs = hofsList || getStoredHofs();
  const list: FlattenedMumin[] = [];

  hofs.forEach((h) => {
    // Add HOF
    list.push({
      itsNumber: h.itsNumber,
      fullName: h.fullName,
      isHof: true,
      relation: 'Head of Family (HOF)',
      gender: 'Male',
      age: 45, // default
      bloodGroup: h.bloodGroup || 'B+',
      mobile: h.mobileNumber,
      hofIts: h.itsNumber,
      hofName: h.fullName,
      mohallahId: h.mohallahId,
      mohallahName: h.mohallahName || 'Unassigned',
      address: h.fullAddress,
      sabeelNo: h.sabeelNo,
      thaaliNo: h.thaaliNo,
      status: h.status,
    });

    // Add Family Members
    (h.familyMembers || []).forEach((fm) => {
      list.push({
        itsNumber: fm.itsNumber,
        fullName: fm.fullName,
        isHof: false,
        relation: fm.relation,
        gender: fm.gender,
        age: fm.age,
        bloodGroup: fm.bloodGroup,
        mobile: fm.mobileNumber || h.mobileNumber,
        hofIts: h.itsNumber,
        hofName: h.fullName,
        mohallahId: h.mohallahId,
        mohallahName: h.mohallahName || 'Unassigned',
        address: h.fullAddress,
        sabeelNo: h.sabeelNo,
        thaaliNo: h.thaaliNo,
        status: fm.status || h.status,
      });
    });
  });

  return list;
};

/**
 * Fast search helper:
 * Finds a member or HOF by ITS Number or Mobile Number.
 */
export const searchMemberByItsOrPhone = (
  query: string,
  hofsList?: HeadOfFamily[]
): {
  targetMember: FlattenedMumin;
  parentHof: HeadOfFamily;
} | null => {
  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery) return null;

  const hofs = hofsList || getStoredHofs();

  for (const h of hofs) {
    if (
      h.itsNumber.toLowerCase() === cleanQuery ||
      h.mobileNumber.replace(/\D/g, '').includes(cleanQuery.replace(/\D/g, ''))
    ) {
      return {
        targetMember: {
          itsNumber: h.itsNumber,
          fullName: h.fullName,
          isHof: true,
          relation: 'Head of Family (HOF)',
          gender: 'Male',
          age: 45,
          bloodGroup: h.bloodGroup || 'B+',
          mobile: h.mobileNumber,
          hofIts: h.itsNumber,
          hofName: h.fullName,
          mohallahId: h.mohallahId,
          mohallahName: h.mohallahName || 'Unassigned',
          address: h.fullAddress,
          sabeelNo: h.sabeelNo,
          thaaliNo: h.thaaliNo,
          status: h.status,
        },
        parentHof: h,
      };
    }

    // Check FMs
    for (const fm of h.familyMembers || []) {
      if (
        fm.itsNumber.toLowerCase() === cleanQuery ||
        (fm.mobileNumber &&
          fm.mobileNumber.replace(/\D/g, '').includes(cleanQuery.replace(/\D/g, '')))
      ) {
        return {
          targetMember: {
            itsNumber: fm.itsNumber,
            fullName: fm.fullName,
            isHof: false,
            relation: fm.relation,
            gender: fm.gender,
            age: fm.age,
            bloodGroup: fm.bloodGroup,
            mobile: fm.mobileNumber || h.mobileNumber,
            hofIts: h.itsNumber,
            hofName: h.fullName,
            mohallahId: h.mohallahId,
            mohallahName: h.mohallahName || 'Unassigned',
            address: h.fullAddress,
            sabeelNo: h.sabeelNo,
            thaaliNo: h.thaaliNo,
            status: fm.status || h.status,
          },
          parentHof: h,
        };
      }
    }
  }

  return null;
};
