/**
 * Thaali Management System Utilities & Storage
 * Powers Part 2A: Thaali Management System (9 Sub-Pages)
 */

export interface DistributorType {
  id: string;
  name: string;
  code: string;
  vehicleRequired: boolean;
  standardCapacity: number;
  description: string;
}

export interface Distributor {
  id: string;
  code: string;
  fullName: string;
  mobileNumber: string;
  distributorTypeId: string;
  distributorTypeName: string;
  vehicleNumber?: string;
  assignedZone: string;
  maxThaalis: number;
  status: 'Active' | 'On Leave' | 'Inactive';
  createdAt: string;
}

export interface DistributorAssignment {
  id: string;
  distributorId: string;
  distributorName: string;
  mohallahId: string;
  mohallahName: string;
  routeTitle: string;
  buildingCoverage: string;
  totalAssignedThaalis: number;
  shift: 'Lunch' | 'Dinner' | 'Both';
  isActive: boolean;
}

export interface ThaaliFeedback {
  id: string;
  thaaliNo: string;
  hofName: string;
  itsNumber: string;
  date: string;
  rating: 1 | 2 | 3 | 4 | 5;
  portionQuality: 'Excellent' | 'Good' | 'Average' | 'Poor';
  deliveryTiming: 'On Time' | 'Slight Delay' | 'Very Late';
  tasteRating: 'Delicious' | 'Satisfactory' | 'Needs Improvement';
  comments: string;
  status: 'New' | 'Reviewed' | 'Resolved';
  adminResponse?: string;
}

export interface ThaaliDispatchRecord {
  id: string;
  thaaliNo: string;
  hofName: string;
  address: string;
  size: 'Full' | 'Half' | 'Special';
  distributorName: string;
  route: string;
  dispatchTime?: string;
  isPacked: boolean;
  isDispatched: boolean;
  isDelivered: boolean;
}

export const DISTRIBUTOR_TYPES_KEY = 'jamat_distributor_types_v1';
export const DISTRIBUTORS_KEY = 'jamat_distributors_v1';
export const DISTRIBUTOR_ASSIGNMENTS_KEY = 'jamat_distributor_assignments_v1';
export const THAALI_FEEDBACKS_KEY = 'jamat_thaali_feedbacks_v1';

export const INITIAL_DISTRIBUTOR_TYPES: DistributorType[] = [
  { id: 'dtype-1', name: 'Motorbike Delivery Runner', code: 'DT-BIKE', vehicleRequired: true, standardCapacity: 35, description: 'Fast runner for multi-sector and distant lanes.' },
  { id: 'dtype-2', name: 'Eco Electric Van (Central)', code: 'DT-VAN', vehicleRequired: true, standardCapacity: 90, description: 'Heavy bulk crate carrier between Kitchen and Hubs.' },
  { id: 'dtype-3', name: 'Wing Walking Sevadar', code: 'DT-WALK', vehicleRequired: false, standardCapacity: 20, description: 'Floor-by-floor door delivery inside high-rise towers.' },
  { id: 'dtype-4', name: 'Hub Counter Attendant', code: 'DT-HUB', vehicleRequired: false, standardCapacity: 150, description: 'Staff at self-pickup distribution kiosk.' },
];

export const INITIAL_DISTRIBUTORS: Distributor[] = [
  { id: 'dist-1', code: 'DIS-01', fullName: 'Shabbir Bhai Rampurawala', mobileNumber: '9820112233', distributorTypeId: 'dtype-1', distributorTypeName: 'Motorbike Delivery Runner', vehicleNumber: 'GJ-05-AB-1234', assignedZone: 'Sector A (Saifee Mohallah)', maxThaalis: 35, status: 'Active', createdAt: '2024-01-01' },
  { id: 'dist-2', code: 'DIS-02', fullName: 'Husain Bhai Dahodwala', mobileNumber: '9820223344', distributorTypeId: 'dtype-2', distributorTypeName: 'Eco Electric Van (Central)', vehicleNumber: 'GJ-05-EV-5678', assignedZone: 'Sector B (Burhani Mohallah)', maxThaalis: 80, status: 'Active', createdAt: '2024-01-01' },
  { id: 'dist-3', code: 'DIS-03', fullName: 'Mustafa Bhai Lokhandwala', mobileNumber: '9820334455', distributorTypeId: 'dtype-3', distributorTypeName: 'Wing Walking Sevadar', assignedZone: 'Sector C (Badri Mohallah)', maxThaalis: 22, status: 'Active', createdAt: '2024-01-01' },
  { id: 'dist-4', code: 'DIS-04', fullName: 'Taher Bhai Galiakotwala', mobileNumber: '9820445566', distributorTypeId: 'dtype-1', distributorTypeName: 'Motorbike Delivery Runner', vehicleNumber: 'GJ-05-CD-9988', assignedZone: 'Sector D (Najmi Mohallah)', maxThaalis: 30, status: 'Active', createdAt: '2024-01-01' },
];

export const INITIAL_ASSIGNMENTS: DistributorAssignment[] = [
  { id: 'asgn-1', distributorId: 'dist-1', distributorName: 'Shabbir Bhai Rampurawala', mohallahId: 'MOH-SEC-A', mohallahName: 'Saifee Mohallah (Sector A)', routeTitle: 'Saifee Wing A1 & A2', buildingCoverage: 'Buildings 1, 2, 3 (Flats 101 to 504)', totalAssignedThaalis: 28, shift: 'Both', isActive: true },
  { id: 'asgn-2', distributorId: 'dist-2', distributorName: 'Husain Bhai Dahodwala', mohallahId: 'MOH-SEC-B', mohallahName: 'Burhani Mohallah (Sector B)', routeTitle: 'Central Towers B-Block', buildingCoverage: 'Al-Burhani Heights Towers A & B', totalAssignedThaalis: 45, shift: 'Both', isActive: true },
  { id: 'asgn-3', distributorId: 'dist-3', distributorName: 'Mustafa Bhai Lokhandwala', mohallahId: 'MOH-SEC-C', mohallahName: 'Badri Mohallah (Sector C)', routeTitle: 'Masjid Enclave Row Houses', buildingCoverage: 'Row houses 1 to 18', totalAssignedThaalis: 18, shift: 'Both', isActive: true },
];

export const INITIAL_FEEDBACKS: ThaaliFeedback[] = [
  { id: 'fb-1', thaaliNo: 'TH-084', hofName: 'Mulla Shabbir Bhai Fakhri', itsNumber: '30489122', date: '2025-04-20', rating: 5, portionQuality: 'Excellent', deliveryTiming: 'On Time', tasteRating: 'Delicious', comments: 'Mutton Biryani was exceptionally fresh and fragrant. Shukran.', status: 'Reviewed' },
  { id: 'fb-2', thaaliNo: 'TH-042', hofName: 'Mulla Huzefa Bhai Jamali', itsNumber: '20391823', date: '2025-04-19', rating: 4, portionQuality: 'Good', deliveryTiming: 'On Time', tasteRating: 'Delicious', comments: 'Great dal chawal. Rotis were warm.', status: 'Reviewed' },
  { id: 'fb-3', thaaliNo: 'TH-155', hofName: 'Mulla Abbas Bhai Rajkotwala', itsNumber: '20381044', date: '2025-04-18', rating: 3, portionQuality: 'Average', deliveryTiming: 'Slight Delay', tasteRating: 'Satisfactory', comments: 'Delivery arrived 25 mins late due to rain.', status: 'New', adminResponse: 'Investigating runner route delay with Sector D supervisor.' },
];

export const getStoredDistributorTypes = (): DistributorType[] => {
  try {
    const raw = localStorage.getItem(DISTRIBUTOR_TYPES_KEY);
    if (!raw) {
      localStorage.setItem(DISTRIBUTOR_TYPES_KEY, JSON.stringify(INITIAL_DISTRIBUTOR_TYPES));
      return INITIAL_DISTRIBUTOR_TYPES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_DISTRIBUTOR_TYPES;
  }
};

export const saveStoredDistributorTypes = (types: DistributorType[]): void => {
  try { localStorage.setItem(DISTRIBUTOR_TYPES_KEY, JSON.stringify(types)); } catch (e) { console.error(e); }
};

export const getStoredDistributors = (): Distributor[] => {
  try {
    const raw = localStorage.getItem(DISTRIBUTORS_KEY);
    if (!raw) {
      localStorage.setItem(DISTRIBUTORS_KEY, JSON.stringify(INITIAL_DISTRIBUTORS));
      return INITIAL_DISTRIBUTORS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_DISTRIBUTORS;
  }
};

export const saveStoredDistributors = (d: Distributor[]): void => {
  try { localStorage.setItem(DISTRIBUTORS_KEY, JSON.stringify(d)); } catch (e) { console.error(e); }
};

export const getStoredDistributorAssignments = (): DistributorAssignment[] => {
  try {
    const raw = localStorage.getItem(DISTRIBUTOR_ASSIGNMENTS_KEY);
    if (!raw) {
      localStorage.setItem(DISTRIBUTOR_ASSIGNMENTS_KEY, JSON.stringify(INITIAL_ASSIGNMENTS));
      return INITIAL_ASSIGNMENTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_ASSIGNMENTS;
  }
};

export const saveStoredDistributorAssignments = (a: DistributorAssignment[]): void => {
  try { localStorage.setItem(DISTRIBUTOR_ASSIGNMENTS_KEY, JSON.stringify(a)); } catch (e) { console.error(e); }
};

export const getStoredThaaliFeedbacks = (): ThaaliFeedback[] => {
  try {
    const raw = localStorage.getItem(THAALI_FEEDBACKS_KEY);
    if (!raw) {
      localStorage.setItem(THAALI_FEEDBACKS_KEY, JSON.stringify(INITIAL_FEEDBACKS));
      return INITIAL_FEEDBACKS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_FEEDBACKS;
  }
};

export const saveStoredThaaliFeedbacks = (f: ThaaliFeedback[]): void => {
  try { localStorage.setItem(THAALI_FEEDBACKS_KEY, JSON.stringify(f)); } catch (e) { console.error(e); }
};
