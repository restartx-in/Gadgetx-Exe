import { useQuery } from '@tanstack/react-query';
import api from '@/utils/axios/api';
import { API_ENDPOINTS } from '@/config/api';
import buildQueryParams from '@/utils/buildQueryParams.js';

async function fetchItemProfitReport(filters = {}) {
  const query = buildQueryParams(filters);
  // UPDATED LINE:
  const res = await api.get(`${API_ENDPOINTS.ITEM_PROFIT_REPORT.BASE}${query}`);
  return res.data || [];
}

export function useItemProfitReport(filters = {}) {
  return useQuery({
    queryKey: ['item_profit_report', filters],
    queryFn: () => fetchItemProfitReport(filters),
    gcTime: Infinity,
    staleTime: Infinity,
  });
}

export default useItemProfitReport;