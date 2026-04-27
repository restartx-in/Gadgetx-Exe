import { useMutation, useQueryClient } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/config/api";
import api from "@/utils/axios/api";

export function useUpdatePartnership() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await api.put(API_ENDPOINTS.PARTNERSHIPS.BY_ID(id), data);
      return res.data;
    },
    onSuccess: (updatedPartnership) => {
      queryClient.invalidateQueries({ queryKey: ["partnership_paginated"] });
       queryClient.setQueriesData({ queryKey: ["partnership"] }, (oldData) => {
        if (!oldData) {
          return oldData;
        }
        return oldData.map((item) =>
          item.id === updatedPartnership.id ? updatedPartnership : item,
        );
      });
      queryClient.invalidateQueries({
        queryKey: ["partnership", updatedPartnership.id],
      });
      queryClient.invalidateQueries({ queryKey: ["cash_books_paginated"] });
      queryClient.refetchQueries({ queryKey: ["accounts"] });
    },
  });
}
export default useUpdatePartnership;
