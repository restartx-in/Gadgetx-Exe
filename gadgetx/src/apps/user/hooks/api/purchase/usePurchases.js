import { useQuery } from "@tanstack/react-query";
import api from "@/utils/axios/api.js";
import { API_ENDPOINTS } from "@/config/api";
import buildQueryParams from "@/utils/buildQueryParams.js";

async function fetchPurchases(filters = {}) {
  const query = buildQueryParams(filters);
  const res = await api.get(`${API_ENDPOINTS.PURCHASE.BASE}${query}`);
  return res.data || [];
}

export function usePurchases(filters = {}) {
  return useQuery({
    queryKey: ["purchases", filters],
    queryFn: () => fetchPurchases(filters),
    gcTime: Infinity,
    staleTime: Infinity,
  });
}

export default usePurchases;
