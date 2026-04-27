import { useQuery } from "@tanstack/react-query";
import api from "@/utils/axios/api";
import { API_ENDPOINTS } from "@/config/api";

const fetchWeeklySalesAndPurchases = async (period = "month") => {
  const { data } = await api.get(`${API_ENDPOINTS.DASHBOARD.WEEKLY_SALES_PURCHASES}?period=${period}`);
  return data;
};

export function useWeeklySalesAndPurchases(period = "month") {
  return useQuery({
    queryKey: ["weeklySalesAndPurchases", period],
    queryFn: () => fetchWeeklySalesAndPurchases(period),
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export default useWeeklySalesAndPurchases;