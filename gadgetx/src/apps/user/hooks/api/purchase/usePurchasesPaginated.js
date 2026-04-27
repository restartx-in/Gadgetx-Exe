import { useQuery } from "@tanstack/react-query";
import api from "@/utils/axios/api.js";
import { API_ENDPOINTS } from "@/config/api";
import buildQueryParams from "@/utils/buildQueryParams.js";

async function fetchPurchases(filters) {
  const query = buildQueryParams(filters);
  const url = `${API_ENDPOINTS.PURCHASE.PAGINATED}${query}`;
  const res = await api.get(url);
  return res.data || [];
}

export function usePurchasesPaginated(filters = {}) {
  return useQuery({
    queryKey: ["purchases_paginated", filters],
    queryFn: () => fetchPurchases(filters),
    gcTime: Infinity,
    staleTime: Infinity,
  });
}

export default usePurchasesPaginated;
