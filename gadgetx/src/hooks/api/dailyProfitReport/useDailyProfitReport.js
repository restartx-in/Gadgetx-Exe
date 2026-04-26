import { useQuery } from '@tanstack/react-query';
import api from '@/utils/axios/api';
import { API_ENDPOINTS } from '@/config/api';
import buildQueryParams from '@/utils/buildQueryParams.js';

async function fetchDailyProfitReport(filters = {}) {
  const query = buildQueryParams(filters);
  const res = await api.get(`${API_ENDPOINTS.DAILY_PROFIT_REPORT.BASE}${query}`);
  return res.data || {};
}

export function useDailyProfitReport(filters = {}) {
  return useQuery({
    queryKey: ['daily_profit_report', filters],
    queryFn: () => fetchDailyProfitReport(filters),
    gcTime: Infinity,
    staleTime: Infinity,
  });
}

export default useDailyProfitReport;