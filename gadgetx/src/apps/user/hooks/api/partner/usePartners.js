import { useQuery } from "@tanstack/react-query";
import api from "@/utils/axios/api.js";
import { API_ENDPOINTS } from "@/config/api";
import buildQueryParams from "@/utils/buildQueryParams.js";

async function fetchPartners(filters = {}) {
  const query = buildQueryParams(filters);
  const res = await api.get(`${API_ENDPOINTS.PARTNERS.BASE}${query}`);
  return res.data || [];
}

export function usePartners(filters = {}) {
  return useQuery({
    queryKey: ["partners", filters],
    queryFn: () => fetchPartners(filters),
    gcTime: Infinity,
    staleTime: Infinity,
  });
}

export default usePartners;
