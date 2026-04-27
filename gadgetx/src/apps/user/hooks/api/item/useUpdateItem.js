import { useMutation, useQueryClient } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/config/api";
import api from "@/utils/axios/api";

export function useUpdateItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await api.put(API_ENDPOINTS.ITEMS.BY_ID(id), data);
      return res.data.data;
    },
    onSuccess: (updatedItem) => {
      queryClient.refetchQueries({ queryKey: ["item",updatedItem.id] });
      queryClient.refetchQueries({ queryKey: ["items_paginated"] });
      queryClient.setQueriesData({ queryKey: ["items"] }, (oldData) => {
        if (!oldData) {
          return oldData;
        }
        return oldData.map((item) =>
          item.id === updatedItem.id ? updatedItem : item
        );
      });
    },
  });
}
export default useUpdateItem;
