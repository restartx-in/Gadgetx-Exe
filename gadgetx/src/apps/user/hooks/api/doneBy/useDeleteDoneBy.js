import { useMutation, useQueryClient } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/config/api";
import api from "@/utils/axios/api.js";

export function useDeleteDoneBy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const res = await api.delete(API_ENDPOINTS.DONE_BYS.BY_ID(id));
      return res.data;
    },
    onSuccess: (data, deletedId) => {
      queryClient.setQueriesData({ queryKey: ["done_bys"] }, (oldData) => {
        if (!oldData) {
          return [];
        }
        return oldData.filter((item) => item.id !== deletedId);
      });
    },
  });
}
