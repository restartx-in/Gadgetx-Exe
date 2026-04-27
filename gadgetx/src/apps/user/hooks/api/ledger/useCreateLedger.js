// src/hooks/api/ledger/useCreateLedger.js
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/config/api";
import api from "@/utils/axios/api";

export function useCreateLedger() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const res = await api.post(API_ENDPOINTS.LEDGERS.BASE, data);
      return res.data;
    },
    onSuccess: (response) => {
      // Invalidate all ledger-related queries on successful creation
      // queryClient.refetchQueries({ queryKey: ["ledgers"] });
      queryClient.setQueriesData({ queryKey: ["ledgers"] }, (oldData) => {
        if (!oldData) return oldData;
        return [...oldData, response.data];
      });
      queryClient.refetchQueries({ queryKey: ["ledgers_paginated"] });
    },
  });
}
export default useCreateLedger;
