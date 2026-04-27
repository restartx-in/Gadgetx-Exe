import { useMutation, useQueryClient } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/config/api";
import api from "@/utils/axios/api.js";

export function useDeleteCostCenter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const res = await api.delete(API_ENDPOINTS.COST_CENTERS.BY_ID(id));
      return res.data;
    },
    onSuccess: (data, deletedId) => {
      queryClient.setQueriesData({ queryKey: ["cost_centers"] }, (oldData) => {
        if (!oldData) {
          return [];
        }
        return oldData.filter((item) => item.id !== deletedId);
      });
    },
  });
}

export default useDeleteCostCenter;
