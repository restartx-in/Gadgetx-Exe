import { useQuery } from "@tanstack/react-query";
import api from "@/utils/axios/api";
import { API_ENDPOINTS } from "@/config/api";
import buildQueryParams from "@/utils/buildQueryParams";

async function fetchRoles(filters) {
  const query = buildQueryParams(filters);
  const url = `${API_ENDPOINTS.ROLES.BASE}${query}`;
  const res = await api.get(url);
  return res.data || [];
}

export function useRoles(filters = {}) {
  return useQuery({
    queryKey: ["roles", filters],
    queryFn: () => fetchRoles(filters),
    gcTime: Infinity,
    staleTime: Infinity,
  });
}

export default useRoles;
