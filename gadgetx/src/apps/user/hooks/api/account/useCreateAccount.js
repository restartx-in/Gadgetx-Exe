import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/utils/axios/api";
import { API_ENDPOINTS } from "@/config/api";

export function useCreateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const res = await api.post(API_ENDPOINTS.ACCOUNTS.BASE, data);
      return res.data;
    },

    onSuccess: (response) => {
      // queryClient.refetchQueries({ queryKey: ["accounts"] });
      // queryClient.refetchQueries({ queryKey: ["cash_books_paginated"] });
      queryClient.setQueriesData({ queryKey: ["accounts"] }, (oldData) => {
        if (!oldData) return oldData;
        return [...oldData, response.data];
      });
    },
  });
}
export default useCreateAccount;
