import { useQuery } from "@tanstack/react-query";
import api from "@/utils/axios/api";
import { API_ENDPOINTS } from "@/config/api";
import buildQueryParams from "@/utils/buildQueryParams.js";

async function fetchTaxSummaryReport(filters = {}) {
  const query = buildQueryParams(filters);
  const res = await api.get(`${API_ENDPOINTS.TAX_SUMMARY_REPORT.BASE}${query}`);
  return res.data || { total_tax_collected: 0, details: [] };
}

export function useTaxSummaryReport(filters = {}) {
  return useQuery({
    queryKey: ["tax_summary_report", filters],
    queryFn: () => fetchTaxSummaryReport(filters),
    gcTime: Infinity,
    staleTime: Infinity,
  });
}

export default useTaxSummaryReport;
