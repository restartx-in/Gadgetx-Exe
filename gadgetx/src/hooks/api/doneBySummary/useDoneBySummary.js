import { useQuery } from '@tanstack/react-query';
import api from '@/utils/axios/api';
import { API_ENDPOINTS } from '@/config/api';
import buildQueryParams from '@/utils/buildQueryParams.js';

async function fetchDoneBySummary(filters = {}) {
  const query = buildQueryParams(filters);
  // UPDATED LINE:
  const res = await api.get(`${API_ENDPOINTS.DONE_BY_SUMMARY_REPORT.BASE}${query}`);
  return res.data || [];
}

export function useDoneBySummary(filters = {}) {
  return useQuery({
    queryKey: ['done_by_summary_report', filters],
    queryFn: () => fetchDoneBySummary(filters),
    gcTime: Infinity,
    staleTime: Infinity,
  });
}

export default useDoneBySummary;