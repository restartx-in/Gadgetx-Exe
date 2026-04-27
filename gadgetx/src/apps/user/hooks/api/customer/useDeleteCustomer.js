import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/utils/axios/api";
import { API_ENDPOINTS } from "@/config/api";

export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      await api.delete(API_ENDPOINTS.PARTIES.BY_ID(id));
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers_paginated"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}
export default useDeleteCustomer;
