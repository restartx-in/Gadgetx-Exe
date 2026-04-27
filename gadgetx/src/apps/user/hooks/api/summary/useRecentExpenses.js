import { useQuery } from "@tanstack/react-query";
import api from "@/utils/axios/api";
import { API_ENDPOINTS } from "@/config/api";

const fetchRecentExpenses = async () => {
  const { data } = await api.get(API_ENDPOINTS.DASHBOARD.RECENT_EXPENSES);
  return data;
};

export function useRecentExpenses() {
  return useQuery({
    queryKey: ["recentExpenses"],
    queryFn: fetchRecentExpenses,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export default useRecentExpenses;