import { useState, useMemo, useCallback } from 'react';
import {
  buildMemberDirectory,
  MemberDirectoryRecord,
} from '../../utils/communitySchemes';
import { toIsoDate } from '../../utils/dateFilters';

export interface SchemeFilterState {
  fromDate: string;
  toDate: string;
  itsNo: string;
  sabeelNo: string;
  memberName: string;
  paymentMode: string;
  status: string;
  query: string;
}

export interface SchemeFilterAccessors<T> {
  getId: (item: T) => string;
  getDate?: (item: T) => string;
  getItsNo?: (item: T) => string;
  getSabeelNo?: (item: T) => string;
  getMemberName?: (item: T) => string;
  getPaymentMode?: (item: T) => string;
  getStatus?: (item: T) => string;
  getSearchableText?: (item: T) => string[];
}

export interface UseSchemeFilterResult<T> {
  filters: SchemeFilterState;
  setFilter: <K extends keyof SchemeFilterState>(key: K, value: SchemeFilterState[K]) => void;
  setDateRange: (fromDate: string, toDate: string) => void;
  resetFilters: () => void;
  filteredItems: T[];
  selectedIds: string[];
  toggleSelect: (id: string) => void;
  toggleSelectAll: () => void;
  clearSelection: () => void;
  isAllSelected: boolean;
}

const DEFAULT_FILTERS: SchemeFilterState = {
  fromDate: '',
  toDate: '',
  itsNo: '',
  sabeelNo: '',
  memberName: '',
  paymentMode: 'ALL',
  status: 'ALL',
  query: '',
};

/**
 * Type-safe search, date-range filter, and bulk-selection hook for Community Schemes tables.
 */
export function useSchemeFilter<T>(
  items: T[],
  accessors: SchemeFilterAccessors<T>,
  initialOverrides?: Partial<SchemeFilterState>
): UseSchemeFilterResult<T> {
  const initialState: SchemeFilterState = {
    ...DEFAULT_FILTERS,
    ...initialOverrides,
  };

  const [filters, setFilters] = useState<SchemeFilterState>(initialState);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const setFilter = useCallback(
    <K extends keyof SchemeFilterState>(key: K, value: SchemeFilterState[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const setDateRange = useCallback((fromDate: string, toDate: string) => {
    setFilters((prev) => ({ ...prev, fromDate, toDate }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({ ...DEFAULT_FILTERS, ...initialOverrides });
    setSelectedIds([]);
  }, [initialOverrides]);

  const filteredItems = useMemo(() => {
    const itsQ = filters.itsNo.trim().toLowerCase();
    const sabeelQ = filters.sabeelNo.trim().toLowerCase();
    const nameQ = filters.memberName.trim().toLowerCase();
    const freeQ = filters.query.trim().toLowerCase();

    return items.filter((item) => {
      if (accessors.getDate && (filters.fromDate || filters.toDate)) {
        const raw = accessors.getDate(item);
        const iso = toIsoDate(raw) || raw;
        if (filters.fromDate && (!iso || iso < filters.fromDate)) return false;
        if (filters.toDate && (!iso || iso > filters.toDate)) return false;
      }

      if (itsQ && accessors.getItsNo) {
        if (!accessors.getItsNo(item).toLowerCase().includes(itsQ)) return false;
      }

      if (sabeelQ && accessors.getSabeelNo) {
        if (!accessors.getSabeelNo(item).toLowerCase().includes(sabeelQ)) return false;
      }

      if (nameQ && accessors.getMemberName) {
        if (!accessors.getMemberName(item).toLowerCase().includes(nameQ)) return false;
      }

      if (filters.paymentMode !== 'ALL' && accessors.getPaymentMode) {
        if (accessors.getPaymentMode(item) !== filters.paymentMode) return false;
      }

      if (filters.status !== 'ALL' && accessors.getStatus) {
        if (accessors.getStatus(item) !== filters.status) return false;
      }

      if (freeQ) {
        const haystackParts: string[] = [
          accessors.getItsNo?.(item) ?? '',
          accessors.getSabeelNo?.(item) ?? '',
          accessors.getMemberName?.(item) ?? '',
          ...(accessors.getSearchableText?.(item) ?? []),
        ];
        const haystack = haystackParts.join(' ').toLowerCase();
        if (!haystack.includes(freeQ)) return false;
      }

      return true;
    });
  }, [items, filters, accessors]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  }, []);

  const isAllSelected =
    filteredItems.length > 0 &&
    filteredItems.every((item) => selectedIds.includes(accessors.getId(item)));

  const toggleSelectAll = useCallback(() => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredItems.map((item) => accessors.getId(item)));
    }
  }, [filteredItems, isAllSelected, accessors]);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  return {
    filters,
    setFilter,
    setDateRange,
    resetFilters,
    filteredItems,
    selectedIds,
    toggleSelect,
    toggleSelectAll,
    clearSelection,
    isAllSelected,
  };
}

export interface UseMemberLookupResult {
  directory: MemberDirectoryRecord[];
  findByIts: (itsNumber: string) => MemberDirectoryRecord | undefined;
  findBySabeel: (sabeelNo: string) => MemberDirectoryRecord | undefined;
  searchDirectory: (query: string) => MemberDirectoryRecord[];
}

/**
 * Type-safe lookup hook linking Member Master HOFs with Sabeel Ledger records.
 */
export function useMemberSabeelLookup(): UseMemberLookupResult {
  const directory = useMemo<MemberDirectoryRecord[]>(() => buildMemberDirectory(), []);

  const findByIts = useCallback(
    (itsNumber: string) => {
      const clean = itsNumber.trim().toLowerCase();
      if (!clean) return undefined;
      return directory.find((m) => m.itsNumber.toLowerCase() === clean);
    },
    [directory]
  );

  const findBySabeel = useCallback(
    (sabeelNo: string) => {
      const clean = sabeelNo.trim().toLowerCase();
      if (!clean) return undefined;
      return directory.find((m) => m.sabeelNo.toLowerCase() === clean);
    },
    [directory]
  );

  const searchDirectory = useCallback(
    (query: string) => {
      const q = query.trim().toLowerCase();
      if (!q) return directory;
      return directory.filter(
        (m) =>
          m.itsNumber.toLowerCase().includes(q) ||
          m.sabeelNo.toLowerCase().includes(q) ||
          m.fullName.toLowerCase().includes(q)
      );
    },
    [directory]
  );

  return {
    directory,
    findByIts,
    findBySabeel,
    searchDirectory,
  };
}

