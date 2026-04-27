import { useQuery } from "@tanstack/react-query";
import api from "@/utils/axios/api";
import { API_ENDPOINTS } from "@/config/api";
import buildQueryParams from "@/utils/buildQueryParams.js";

async function fetchLensAddons(filters = {}) {
  const query = buildQueryParams(filters);
  const res = await api.get(`${API_ENDPOINTS.LENS_ADDONS.BASE}${query}`);
  return res.data || [];
}

export function useLensAddons(filters = {}) {
  return useQuery({
    queryKey: ["lens_addons", filters],
    queryFn: () => fetchLensAddons(filters),
    gcTime: Infinity,
    staleTime: Infinity,
  });
}
