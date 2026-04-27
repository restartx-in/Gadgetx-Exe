import { useQuery } from "@tanstack/react-query";
import api from "@/utils/axios/api";
import { API_ENDPOINTS } from "@/config/api";
import buildQueryParams from "@/utils/buildQueryParams";

export function usePrescriptionsPaginated(filters = {}) {
  return useQuery({
    queryKey: ["prescriptions_paginated", filters],
    queryFn: async () => {
      const query = buildQueryParams(filters);
      const res = await api.get(`${API_ENDPOINTS.PRESCRIPTIONS.PAGINATED}${query}`);
      return res.data; 
    },
    staleTime: 30 * 1000,
  });
}

export default usePrescriptionsPaginated;
