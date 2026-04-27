import { useQuery } from "@tanstack/react-query";
import api from "@/utils/axios/api.js";
import { API_ENDPOINTS } from "@/config/api";
import buildQueryParams from "@/utils/buildQueryParams.js";

async function fetchPaginatedSessions(filters) {
  const query = buildQueryParams(filters);
  const url = `${API_ENDPOINTS.REGISTER_SESSIONS.PAGINATED}${query}`;

  console.log("Fetching Paginated:", url);

  const res = await api.get(url);
  return res.data;
}

export function useRegisterSessionsPaginated(filters = {}) {
  return useQuery({
    queryKey: ["register_sessions_paginated", filters],
    queryFn: () => fetchPaginatedSessions(filters),
    keepPreviousData: true,
    gcTime: Infinity,
    staleTime: Infinity,
  });
}
export default useRegisterSessionsPaginated;
