import { useQuery } from '@tanstack/react-query';
import api from '@/utils/axios/api';
import { API_ENDPOINTS } from '@/config/api';
import buildQueryParams from '@/utils/buildQueryParams.js';

async function fetchCostCenterSummary(filters = {}) {
  const query = buildQueryParams(filters);
  // UPDATED LINE:
  const res = await api.get(`${API_ENDPOINTS.COST_CENTER_SUMMARY_REPORT.BASE}${query}`);
  return res.data || [];
}

export function useCostCenterSummary(filters = {}) {
  return useQuery({
    queryKey: ['cost_center_summary_report', filters],
    queryFn: () => fetchCostCenterSummary(filters),
    gcTime: Infinity,
    staleTime: Infinity,
  });
}

export default useCostCenterSummary;