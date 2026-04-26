import { useQuery } from '@tanstack/react-query';
import api from '@/utils/axios/api.js';
import { API_ENDPOINTS } from '@/config/api';
import buildQueryParams from '@/utils/buildQueryParams.js';

async function fetchParties(filters = {}) {
  const query = buildQueryParams(filters);
  const res = await api.get(`${API_ENDPOINTS.PARTIES.BASE}${query}`);
  return res.data || [];
}


export function useParties(filters = {}) {
  return useQuery({
    queryKey: ['parties', filters],
    queryFn: () => fetchParties(filters),
    gcTime: Infinity,
    staleTime: Infinity,
  });
}

export default useParties;