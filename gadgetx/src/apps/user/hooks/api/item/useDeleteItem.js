// src/hooks/items/useDeleteItem.js
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/config/api";
import api from "@/utils/axios/api";

export function useDeleteItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const res = await api.delete(API_ENDPOINTS.ITEMS.BY_ID(id));
      return res.data;
    },
    onSuccess: (data, deletedId) => {
      // queryClient.refetchQueries({ queryKey: ["items"] });
      queryClient.refetchQueries({ queryKey: ["items_paginated"] });
      queryClient.setQueriesData({ queryKey: ["items"] }, (oldData) => {
        if (!oldData) {
          return [];
        }
        return oldData.filter((item) => item.id !== deletedId);
      });
    },
  });
}
export default useDeleteItem;
