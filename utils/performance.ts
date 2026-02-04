/**
 * Performance Optimization Utilities
 */

import { useMemo, useCallback } from 'react';

// Debounce hook for search optimization
export const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Memoized status calculation
export const useStatusCalculation = (item: any, selectedDateFilter: string, jamKerja: any) => {
  return useMemo(() => {
    // Status calculation logic here
    return calculateStatus(item, selectedDateFilter, jamKerja);
  }, [item, selectedDateFilter, jamKerja]);
};

// Optimized list rendering
export const useOptimizedList = (data: any[], pageSize: number = 20) => {
  const [currentPage, setCurrentPage] = useState(1);
  
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return data.slice(0, startIndex + pageSize);
  }, [data, currentPage, pageSize]);

  const loadMore = useCallback(() => {
    setCurrentPage(prev => prev + 1);
  }, []);

  return { paginatedData, loadMore, hasMore: paginatedData.length < data.length };
};

function calculateStatus(item: any, selectedDateFilter: string, jamKerja: any) {
  // Implementation here
  return null;
}