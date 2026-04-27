import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/utils/axios/api";
import { API_ENDPOINTS } from "@/config/api";

export function useDeleteSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const res = await api.delete(API_ENDPOINTS.PARTIES.BY_ID(id));
      return res.data;
    },
    onSuccess: (data, deletedId) => {
      queryClient.setQueriesData({ queryKey: ["suppliers"] }, (oldData) => {
        if (!oldData) {
          return [];
        }
        return oldData.filter((item) => item.id !== deletedId);
      });
      queryClient.refetchQueries({ queryKey: ["suppliers_paginated"] });
      queryClient.refetchQueries({ queryKey: ["ledgers_paginated"] });
    },
  });
}
export default useDeleteSupplier;
