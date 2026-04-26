
import { useQuery } from '@tanstack/react-query';
import { API_ENDPOINTS } from '@/config/api';
import api from '@/utils/axios/api.js';
import buildQueryParams from '@/utils/buildQueryParams.js';

async function fetchPayroll(filters = {}) {
  const query = buildQueryParams(filters);
  const res = await api.get(`${API_ENDPOINTS.PAYROLL.LIST}${query}`);
  return res.data;
}

export function usePayroll(filters = {}) {
  return useQuery({
    queryKey: ['payroll', filters],
    queryFn: () => fetchPayroll(filters),
    gcTime: Infinity,
    staleTime: Infinity,
  });
}

export default usePayroll;