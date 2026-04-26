import { useQuery } from '@tanstack/react-query';
import api from '@/utils/axios/api.js';
import { API_ENDPOINTS } from '@/config/api';
import buildQueryParams from '@/utils/buildQueryParams.js';


async function fetchPartyPaymentDetails(party_id, filters = {}) {
  if (!party_id) {
    return Promise.resolve(null);
  }
  const query = buildQueryParams(filters);
  const url = `${API_ENDPOINTS.PARTY_SUMMARY_REPORT.PAYMENTS(party_id)}${query}`;
  const res = await api.get(url);
  return res.data || {};
}

export function usePartyPaymentDetails(party_id, filters = {}) {
  return useQuery({
    queryKey: ['partyPaymentDetails', party_id, filters],
    queryFn: () => fetchPartyPaymentDetails(party_id, filters),
    enabled: !!party_id,
    gcTime: Infinity,
    staleTime: Infinity,
  });
}

export default usePartyPaymentDetails;