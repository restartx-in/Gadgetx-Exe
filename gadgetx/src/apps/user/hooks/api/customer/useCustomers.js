import { useQuery } from "@tanstack/react-query";
import api from "@/utils/axios/api";
import { API_ENDPOINTS } from "@/config/api";
import buildQueryParams from "@/utils/buildQueryParams.js";

export function useCustomers(filters = {}) {
  return useQuery({
    queryKey: ["customers", filters],
    queryFn: async () => {
      const params = { ...filters, type: "customer" };
      const query = buildQueryParams(params);
      const res = await api.get(`${API_ENDPOINTS.PARTIES.BASE}${query}`);
      return res.data || []; // Backend returns raw array for getAll
    },
  });
}