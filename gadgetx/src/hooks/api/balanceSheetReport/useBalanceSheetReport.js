import { useQuery } from '@tanstack/react-query';
import api from '@/utils/axios/api';
import { API_ENDPOINTS } from '@/config/api';
import buildQueryParams from '@/utils/buildQueryParams.js';

async function fetchBalanceSheetReport(filters = {}) {
  const query = buildQueryParams(filters);
  const res = await api.get(`${API_ENDPOINTS.BALANCE_SHEET_REPORT.BASE}${query}`);
  return res.data || {};
}

export function useBalanceSheetReport(filters = {}) {
  return useQuery({
    queryKey: ['balance_sheet_report', filters],
    queryFn: () => fetchBalanceSheetReport(filters),
    gcTime: Infinity,
    staleTime: Infinity,
  });
}

export default useBalanceSheetReport;