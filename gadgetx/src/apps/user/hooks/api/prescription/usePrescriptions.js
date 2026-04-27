import { useQuery } from "@tanstack/react-query";
import api from "@/utils/axios/api";
import { API_ENDPOINTS } from "@/config/api";
import buildQueryParams from "@/utils/buildQueryParams.js";

async function fetchPrescriptions(filters = {}) {
  const query = buildQueryParams(filters);
  const res = await api.get(`${API_ENDPOINTS.PRESCRIPTIONS.BASE}${query}`);
  return res.data || [];
}

export function usePrescriptions(filters = {}, options = {}) {
  return useQuery({
    queryKey: ["prescriptions", filters],
    queryFn: () => fetchPrescriptions(filters),
    gcTime: Infinity,
    staleTime: Infinity,
    ...options,
  });
}

export default usePrescriptions;
