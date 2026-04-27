import { useQuery } from "@tanstack/react-query";
import api from "@/utils/axios/api";
import { API_ENDPOINTS } from "@/config/api";
import buildQueryParams from "@/utils/buildQueryParams.js";

async function fetchStockValueReport(filters = {}) {
  const query = buildQueryParams(filters);
  const res = await api.get(`${API_ENDPOINTS.STOCK_VALUE_REPORT.BASE}${query}`);
  return res.data || { total_inventory_value: 0, items: [] };
}

export function useStockValueReport(filters = {}) {
  return useQuery({
    queryKey: ["stock_value_report", filters],
    queryFn: () => fetchStockValueReport(filters),
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });
}

export default useStockValueReport;
