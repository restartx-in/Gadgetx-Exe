import { useQuery } from "@tanstack/react-query";
import api from "@/utils/axios/api.js";
import { API_ENDPOINTS } from "@/config/api";
import buildQueryParams from "@/utils/buildQueryParams.js";

async function fetchSaleReturnsPaginated(filters = {}) {
  const query = buildQueryParams(filters);
  const res = await api.get(`${API_ENDPOINTS.SALE_RETURNS.PAGINATED}${query}`);

  if (res.data && res.data.saleReturns) {
    const totalCount = res.data.totalCount || 0;
    const pageSize = filters.page_size || 10;
    return {
      data: res.data.saleReturns,
      count: totalCount,
      page_count: Math.ceil(totalCount / pageSize),
    };
  }

  return { data: [], count: 0, page_count: 1 };
}

export function useSaleReturnsPaginated(filters = {}) {
  return useQuery({
    queryKey: ["saleReturns_paginated", filters],
    queryFn: () => fetchSaleReturnsPaginated(filters),
    gcTime: Infinity,
    staleTime: Infinity,
  });
}

export default useSaleReturnsPaginated;
