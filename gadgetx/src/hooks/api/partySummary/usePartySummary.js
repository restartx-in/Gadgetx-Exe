import { useQuery } from '@tanstack/react-query';
import api from '@/utils/axios/api';
import { API_ENDPOINTS } from '@/config/api';
import buildQueryParams from '@/utils/buildQueryParams.js';

async function fetchPartySummary(filters = {}) {
  const query = buildQueryParams(filters);
  // UPDATED LINE:
  const res = await api.get(`${API_ENDPOINTS.PARTY_SUMMARY_REPORT.BASE}${query}`);
  return res.data || [];
}

export function usePartySummary(filters = {}) {
  return useQuery({
    queryKey: ['party_summary_report', filters],
    queryFn: () => fetchPartySummary(filters),
    gcTime: Infinity,
    staleTime: Infinity,
  });
}

export default usePartySummary;