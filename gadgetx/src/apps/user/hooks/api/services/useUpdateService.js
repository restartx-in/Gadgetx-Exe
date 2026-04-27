import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/utils/axios/api";
import { API_ENDPOINTS } from "@/config/api";

export function useUpdateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await api.put(`${API_ENDPOINTS.SERVICES.BASE}/${id}`, data);
      return res.data;
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["services_paginated"] });
      queryClient.refetchQueries({ queryKey: ["services_paginated"] });
    },
  });
}