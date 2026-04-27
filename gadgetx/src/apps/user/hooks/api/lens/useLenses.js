import { useQuery } from "@tanstack/react-query";
import api from "@/utils/axios/api";
import { API_ENDPOINTS } from "@/config/api"; // Ensure you add LENSES.BASE here
import buildQueryParams from "@/utils/buildQueryParams.js";

async function fetchLenses(filters = {}) {
  const { pageSize, ...rest } = filters;
  const apiFilters = { ...rest, page_size: pageSize || rest.page_size || 10 };
  const query = buildQueryParams(apiFilters);
  const res = await api.get(`${API_ENDPOINTS.LENSES.PAGINATED}${query}`);
  return res.data || [];
}

export function useLenses(filters = {}) {
  return useQuery({
    queryKey: ["lenses", filters],
    queryFn: () => fetchLenses(filters),
    gcTime: Infinity,
    staleTime: Infinity,
  });
}
