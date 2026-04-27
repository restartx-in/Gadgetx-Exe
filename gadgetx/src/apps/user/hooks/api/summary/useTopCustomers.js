import { useQuery } from "@tanstack/react-query";
import api from "@/utils/axios/api";
import { API_ENDPOINTS } from "@/config/api";

const fetchTopCustomers = async (period = "month") => {
  const { data } = await api.get(`${API_ENDPOINTS.DASHBOARD.TOP_CUSTOMERS}?period=${period}`);
  return data;
};

export function useTopCustomers(period = "month") {
  return useQuery({
    queryKey: ["topCustomers", period],
    queryFn: () => fetchTopCustomers(period),
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export default useTopCustomers;