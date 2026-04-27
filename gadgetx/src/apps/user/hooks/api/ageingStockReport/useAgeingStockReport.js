import { useQuery } from "@tanstack/react-query";
import api from "@/utils/axios/api";
import { API_ENDPOINTS } from "@/config/api";
import buildQueryParams from "@/utils/buildQueryParams.js";

async function fetchAgeingStockReport(filters = {}) {
  const query = buildQueryParams(filters);
  const res = await api.get(`${API_ENDPOINTS.AGEING_STOCK_REPORT.BASE}${query}`);
  return res.data || { total_items: 0, total_stock_quantity: 0, total_stock_value: 0, avg_ageing_days: 0 };
}

export function useAgeingStockReport(filters = {}) {
  return useQuery({
    queryKey: ["ageing_stock_report", filters],
    queryFn: () => fetchAgeingStockReport(filters),
    gcTime: Infinity,
    staleTime: Infinity,
  });
}

export default useAgeingStockReport;
