import { useQuery } from "@tanstack/react-query";
import api from "@/utils/axios/api";
import { API_ENDPOINTS } from "@/config/api";
import buildQueryParams from "@/utils/buildQueryParams.js";

async function fetchPeriodicProfitReport(filters = {}) {
  const query = buildQueryParams(filters);
  const res = await api.get(
    `${API_ENDPOINTS.PERIODIC_PROFIT_REPORT.BASE}${query}`
  );
  return res.data || {};
}

export function usePeriodicProfitReport(filters = {}) {
  return useQuery({
    queryKey: ["periodic_profit_report", filters],
    queryFn: () => fetchPeriodicProfitReport(filters),
    gcTime: Infinity,
    staleTime: Infinity,
  });
}

export default usePeriodicProfitReport;
