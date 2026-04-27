import { useQuery } from "@tanstack/react-query";
import api from "@/utils/axios/api";
import { API_ENDPOINTS } from "@/config/api";
import buildQueryParams from "@/utils/buildQueryParams";

export function useCustomersPaginated(filters = {}) {
  return useQuery({
    queryKey: ["customers_paginated", filters],
    queryFn: async () => {
      // Logic: Ensure type is always customer
      const params = { ...filters, type: "customer" };
      const query = buildQueryParams(params);
      const res = await api.get(`${API_ENDPOINTS.PARTIES.PAGINATED}${query}`);
      
      // Backend returns: { data: [...], count, page_count }
      return res.data; 
    },
    staleTime: 30 * 1000,
  });
}

export default useCustomersPaginated;
