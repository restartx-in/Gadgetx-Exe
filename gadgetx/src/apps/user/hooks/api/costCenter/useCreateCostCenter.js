import { useMutation, useQueryClient } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/config/api";
import api from "@/utils/axios/api.js";

export function useCreateCostCenter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (costCenterData) => {
      const res = await api.post(
        API_ENDPOINTS.COST_CENTERS.BASE,
        costCenterData,
      );
      return res.data;
    },
    onSuccess: (response) => {
      queryClient.setQueriesData({ queryKey: ["cost_centers"] }, (oldData) => {
        if (!oldData) return oldData;
        return [...oldData, response.data];
      });
    },
  });
}
