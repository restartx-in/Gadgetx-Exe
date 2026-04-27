import { useQuery } from "@tanstack/react-query";
import api from "@/utils/axios/api.js";
import { API_ENDPOINTS } from "@/config/api";

async function fetchMonthlySummary(params) {
  const queryParams = new URLSearchParams(params).toString();

  const res = await api.get(
    `${API_ENDPOINTS.MONTHLY_SUMMARY.BASE}?${queryParams}`
  );
  return res.data;
}

export function useMonthlySummary(params) {
  const {
    data = { data: [], count: 0, page_count: 0 },
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      "monthlySummary",
      params.start_date,
      params.end_date,
      params.page,
      params.page_size,
    ],

    queryFn: () => fetchMonthlySummary(params),

    enabled: !!params.start_date && !!params.end_date,
    refetchInterval: 30000,
    gcTime: Infinity,
    staleTime: Infinity,
  });

  return { data, isLoading, error, refetch };
}
export default useMonthlySummary;
