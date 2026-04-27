import { useQuery } from "@tanstack/react-query";
import api from "@/utils/axios/api";
import { API_ENDPOINTS } from "@/config/api";

const fetchRecentTransactions = async () => {
  const { data } = await api.get(API_ENDPOINTS.DASHBOARD.RECENT_TRANSACTIONS);
  return data;
};

export function useRecentTransactions() {
  return useQuery({
    queryKey: ["recentTransactions"],
    queryFn: fetchRecentTransactions,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export default useRecentTransactions;