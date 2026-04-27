import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/utils/axios/api";
import { API_ENDPOINTS } from "@/config/api";

export function useUpdateLensAddon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await api.put(API_ENDPOINTS.LENS_ADDONS.BY_ID(id), data);
      return res.data.data;
    },
    onSuccess: (updatedAddon) => {
      queryClient.invalidateQueries({
        queryKey: ["lens_addon", updatedAddon.id],
      });
      queryClient.setQueriesData({ queryKey: ["lens_addons"] }, (oldData) => {
        if (!oldData) return oldData;
        return oldData.map((item) =>
          item.id === updatedAddon.id ? updatedAddon : item,
        );
      });
    },
  });
}
