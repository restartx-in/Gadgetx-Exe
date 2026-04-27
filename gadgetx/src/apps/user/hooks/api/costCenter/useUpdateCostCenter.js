import { useMutation, useQueryClient } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/config/api";
import api from "@/utils/axios/api.js";

export function useUpdateCostCenter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await api.put(API_ENDPOINTS.COST_CENTERS.BY_ID(id), data);
      return res.data.data; 
    },
    onSuccess: (updatedCostCenter) => {
      queryClient.invalidateQueries({
        queryKey: ["cost_center", updatedCostCenter.id],
      });

      queryClient.setQueriesData({ queryKey: ["cost_centers"] }, (oldData) => {
        if (!oldData) {
          return oldData;
        }
        return oldData.map((item) =>
          item.id === updatedCostCenter.id ? updatedCostCenter : item
        );
      });
    },
  });
}

export default useUpdateCostCenter;