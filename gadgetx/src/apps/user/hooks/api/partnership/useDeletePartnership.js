import { useMutation, useQueryClient } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/config/api";
import api from "@/utils/axios/api";

export default function useDeletePartnership() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const res = await api.delete(API_ENDPOINTS.PARTNERSHIPS.BY_ID(id));
      return res.data;
    },
    onSuccess: (data, id) => {
      queryClient.setQueriesData({ queryKey: ["partnership"] }, (oldData) => {
        if (!oldData) {
          return [];
        }
        return oldData.filter((item) => item.id !== id);
      });
      queryClient.refetchQueries({ queryKey: ["partnership_paginated"] });

      queryClient.removeQueries({ queryKey: ["partnership", id] });
      queryClient.refetchQueries({ queryKey: ["cash_books_paginated"] });
      queryClient.refetchQueries({ queryKey: ["accounts"] });
    },
  });
}
