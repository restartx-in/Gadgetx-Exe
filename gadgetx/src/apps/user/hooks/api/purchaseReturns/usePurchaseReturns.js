import { useQuery } from "@tanstack/react-query";
import api from "@/utils/axios/api.js";
import { API_ENDPOINTS } from "@/config/api";
import buildQueryParams from "@/utils/buildQueryParams.js";

async function fetchPurchaseReturns(filters = {}) {
  const query = buildQueryParams(filters);
  const res = await api.get(`${API_ENDPOINTS.PURCHASE_RETURNS.BASE}${query}`);
  return res.data || [];
}

export function usePurchaseReturns(filters = {}) {
  return useQuery({
    queryKey: ["purchaseReturns", filters],
    queryFn: () => fetchPurchaseReturns(filters),
    gcTime: Infinity,
    staleTime: Infinity,
  });
}

export default usePurchaseReturns;
