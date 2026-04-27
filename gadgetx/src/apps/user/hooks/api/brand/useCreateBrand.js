import { useMutation, useQueryClient } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/config/api";
import api from "@/utils/axios/api.js";

export function useCreateBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (brandData) => {
      const res = await api.post(API_ENDPOINTS.BRAND.BASE, brandData);
      return res.data;
    },
    onSuccess: (response) => {
      queryClient.setQueriesData({ queryKey: ["brand"] }, (oldData) => {
        if (!oldData) return oldData;
        return [...oldData, response.data];
      });
    },
  });
}
