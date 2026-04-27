import { useQuery } from "@tanstack/react-query";
import api from "@/utils/axios/api.js";
import { API_ENDPOINTS } from "@/config/api";
import buildQueryParams from "@/utils/buildQueryParams.js";

async function fetchPartnership(filters = {}) {
  const query = buildQueryParams(filters);
  const res = await api.get(`${API_ENDPOINTS.PARTNERSHIPS.BASE}${query}`);
  return res.data || [];
}

export function usePartnership(filters = {}) {
  return useQuery({
    queryKey: ["partnership", filters],
    queryFn: () => fetchPartnership(filters),
    gcTime: Infinity,
    staleTime: Infinity,
  });
}

export default usePartnership;
