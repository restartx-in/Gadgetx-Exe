import { useQuery } from "@tanstack/react-query";
import api from "@/utils/axios/api";
import { API_ENDPOINTS } from "@/config/api";

const fetchRecentPurchases = async () => {
  const { data } = await api.get(API_ENDPOINTS.DASHBOARD.RECENT_PURCHASES);
  return data;
};

export function useRecentPurchases() {
  return useQuery({
    queryKey: ["recentPurchases"],
    queryFn: fetchRecentPurchases,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export default useRecentPurchases;