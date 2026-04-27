import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/utils/axios/api";
import { API_ENDPOINTS } from "@/config/api";

export function useCreateLensAddon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const res = await api.post(API_ENDPOINTS.LENS_ADDONS.BASE, data);
      return res.data;
    },
    onSuccess: (response) => {
      queryClient.setQueriesData({ queryKey: ["lens_addons"] }, (oldData) => {
        if (!oldData) return [response.data];
        return [...oldData, response.data];
      });
    },
  });
}
