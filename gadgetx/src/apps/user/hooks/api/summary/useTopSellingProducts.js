import { useQuery } from "@tanstack/react-query";
import api from "@/utils/axios/api";
import { API_ENDPOINTS } from "@/config/api";

const fetchTopSellingProducts = async (period = "month") => {
  const { data } = await api.get(`${API_ENDPOINTS.DASHBOARD.TOP_SELLING_PRODUCTS}?period=${period}`);
  return data;
};

export function useTopSellingProducts(period = "month") {
  return useQuery({
    queryKey: ["topSellingProducts", period],
    queryFn: () => fetchTopSellingProducts(period),
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export default useTopSellingProducts;