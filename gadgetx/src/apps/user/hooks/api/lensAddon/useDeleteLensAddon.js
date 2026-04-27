import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/utils/axios/api";
import { API_ENDPOINTS } from "@/config/api";

export function useDeleteLensAddon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const res = await api.delete(API_ENDPOINTS.LENS_ADDONS.BY_ID(id));
      return res.data;
    },
    onSuccess: (_, deletedId) => {
      queryClient.setQueriesData({ queryKey: ["lens_addons"] }, (oldData) => {
        if (!oldData) return [];
        return oldData.filter((item) => item.id !== deletedId);
      });
    },
  });
}