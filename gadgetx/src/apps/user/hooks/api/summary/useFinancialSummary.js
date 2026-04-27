import { useQuery } from "@tanstack/react-query";
import api from "@/utils/axios/api";
import { API_ENDPOINTS } from "@/config/api";

const fetchFinancialSummary = async (period = "month") => {
  const { data } = await api.get(`${API_ENDPOINTS.DASHBOARD.FINANCIAL_SUMMARY}?period=${period}`);
  return data;
};

export function useFinancialSummary(period = "month") {
  return useQuery({
    queryKey: ["financialSummary", period],
    queryFn: () => fetchFinancialSummary(period),
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export default useFinancialSummary;