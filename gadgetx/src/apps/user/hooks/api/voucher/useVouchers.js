import { useQuery } from "@tanstack/react-query";
import api from "@/utils/axios/api.js";
import { API_ENDPOINTS } from "@/config/api";
import buildQueryParams from "@/utils/buildQueryParams.js";

async function fetchVouchers(filters = {}) {
  const query = buildQueryParams(filters);
  const res = await api.get(`${API_ENDPOINTS.VOUCHERS.BASE}${query}`);
  return res.data || [];
}

export function useVouchers(filters = {}) {
  return useQuery({
    queryKey: ["vouchers", "list", filters],
    queryFn: () => fetchVouchers(filters),
    gcTime: Infinity,
    staleTime: Infinity,
  });
}

export default useVouchers;
