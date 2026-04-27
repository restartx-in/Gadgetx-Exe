import { useQuery } from "@tanstack/react-query";
import api from "@/utils/axios/api";
import { API_ENDPOINTS } from "@/config/api";

const fetchStockAlerts = async () => {
  const { data } = await api.get(API_ENDPOINTS.DASHBOARD.STOCK_ALERTS);
  return data;
};

export function useStockAlerts() {
  return useQuery({
    queryKey: ["stockAlerts"],
    queryFn: fetchStockAlerts,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export default useStockAlerts;