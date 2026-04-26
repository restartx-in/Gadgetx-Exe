import { useQuery } from '@tanstack/react-query';
import api from '@/utils/axios/api';
import { API_ENDPOINTS } from '@/config/api';
import buildQueryParams from '@/utils/buildQueryParams.js';

async function fetchStockDetailedReport(filters = {}) {
  const query = buildQueryParams(filters);
  // UPDATED LINE:
  const res = await api.get(`${API_ENDPOINTS.STOCK_DETAILED_REPORT.BASE}${query}`);
  return res.data || [];
}

export function useStockDetailedReport(filters = {}) {
  return useQuery({
    queryKey: ['stock_detailed_report', filters],
    queryFn: () => fetchStockDetailedReport(filters),
    gcTime: Infinity,
    staleTime: Infinity,
  });
}

export default useStockDetailedReport;