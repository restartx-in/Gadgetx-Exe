import { useQuery } from "@tanstack/react-query";
import api from "@/utils/axios/api.js";
import { API_ENDPOINTS } from "@/config/api";

async function fetchDailySummary(params) {
  const queryParams = new URLSearchParams(params).toString();
  const res = await api.get(
    `${API_ENDPOINTS.DAILY_SUMMARY.BASE}?${queryParams}`
  );
  return res.data;
}

export function useDailySummary(params) {
  return useQuery({
    queryKey: [
      "dailySummary",
      params.start_date,
      params.end_date,
      params.page,
      params.page_size,
    ],
    queryFn: () => fetchDailySummary(params),
    enabled: !!params.start_date && !!params.end_date,
    refetchInterval: 60000,
    initialData: { data: [], count: 0, page_count: 0 },
    gcTime: Infinity,
    staleTime: Infinity,
  });
}

export default useDailySummary;
