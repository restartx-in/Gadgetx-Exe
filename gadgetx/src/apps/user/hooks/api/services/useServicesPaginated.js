import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/utils/axios/api";
import { API_ENDPOINTS } from "@/config/api";
import buildQueryParams from "@/utils/buildQueryParams";

// 1. GET Paginated List
export function useServicesPaginated(filters = {}) {
  return useQuery({
    queryKey: ["services_paginated", filters],
    queryFn: async () => {
      const query = buildQueryParams(filters);
      const res = await api.get(`${API_ENDPOINTS.SERVICES.BASE}/paginated${query}`);
      return res.data;
    },
    staleTime: 0,
    refetchOnMount: "always",
  });
}