import { useQuery } from "@tanstack/react-query";
import api from "@/utils/axios/api.js";
import { API_ENDPOINTS } from "@/config/api";
import buildQueryParams from "@/utils/buildQueryParams.js";

async function fetchPurchaseReturnsPaginated(filters = {}) {
  const query = buildQueryParams(filters);
  const res = await api.get(
    `${API_ENDPOINTS.PURCHASE_RETURNS.PAGINATED}${query}`
  );

  // Return the entire data object from the API.
  // Provide a fallback with the expected shape if the API returns nothing.
  return res.data || {
    data: [],
    count: 0,
    page_count: 1,
    total_refund_amount: 0,
    total_refunded_amount: 0,
  };
}

export function usePurchaseReturnsPaginated(filters = {}) {
  return useQuery({
    queryKey: ["purchaseReturns_paginated", filters],
    queryFn: () => fetchPurchaseReturnsPaginated(filters),
    // keepPreviousData provides a better user experience when paginating
    keepPreviousData: true,
  });
}

export default usePurchaseReturnsPaginated;