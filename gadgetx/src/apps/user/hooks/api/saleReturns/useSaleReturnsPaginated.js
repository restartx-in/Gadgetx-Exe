import { useQuery } from "@tanstack/react-query";
import api from "@/utils/axios/api.js";
import { API_ENDPOINTS } from "@/config/api";
import buildQueryParams from "@/utils/buildQueryParams.js";

async function fetchSaleReturnsPaginated(filters = {}) {
  const query = buildQueryParams(filters);
  const res = await api.get(`${API_ENDPOINTS.SALE_RETURNS.PAGINATED}${query}`);

  // --- FIX ---
  // The backend now sends a complete, well-structured object.
  // We don't need to transform it anymore. We just need to return it directly.
  // This is also more robust if you add more summary fields to the API later.
  if (res.data) {
    return res.data;
  }

  // If for some reason there's no data, return the default structure
  // that the component expects.
  return {
    data: [],
    count: 0,
    page_count: 1,
    total_refund_amount: 0,
    total_refunded_amount: 0,
  };
}

export function useSaleReturnsPaginated(filters = {}) {
  return useQuery({
    queryKey: ["saleReturns_paginated", filters],
    queryFn: () => fetchSaleReturnsPaginated(filters),
    // keepPreviousData is great for a smoother UX while changing pages.
    keepPreviousData: true,
  });
}

export default useSaleReturnsPaginated;