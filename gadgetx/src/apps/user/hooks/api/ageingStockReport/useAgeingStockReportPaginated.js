import { useQuery } from "@tanstack/react-query";
import api from "@/utils/axios/api";
import { API_ENDPOINTS } from "@/config/api";
import buildQueryParams from "@/utils/buildQueryParams.js";

async function fetchAgeingStockReportPaginated(filters) {
  const query = buildQueryParams(filters);
  const url = `${API_ENDPOINTS.AGEING_STOCK_REPORT.PAGINATED}${query}`;
  const res = await api.get(url);
  return res.data || { data: [], count: 0, page_count: 0 };
}

export function useAgeingStockReportPaginated(filters = {}) {
  return useQuery({
    queryKey: ["ageing_stock_report_paginated", filters],
    queryFn: () => fetchAgeingStockReportPaginated(filters),
    gcTime: Infinity,
    staleTime: Infinity,
  });
}

export default useAgeingStockReportPaginated;
