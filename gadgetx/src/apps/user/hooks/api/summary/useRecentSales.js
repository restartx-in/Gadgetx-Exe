import { useQuery } from "@tanstack/react-query";
import api from "@/utils/axios/api";
import { API_ENDPOINTS } from "@/config/api";

const fetchRecentSales = async () => {
  const { data } = await api.get(API_ENDPOINTS.DASHBOARD.RECENT_SALES);
  return data;
};

export function useRecentSales() {
  return useQuery({
    queryKey: ["recentSales"],
    queryFn: fetchRecentSales,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export default useRecentSales;