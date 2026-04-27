// src/hooks/api/ledger/useDeleteLedger.js
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/config/api";
import api from "@/utils/axios/api";

export function useDeleteLedger() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const res = await api.delete(API_ENDPOINTS.LEDGERS.BY_ID(id));
      return res.data;
    },
    onSuccess: (data, deletedId) => {
      // Invalidate all ledger-related queries on successful deletion
      // queryClient.refetchQueries({ queryKey: ["ledgers"] });
      queryClient.setQueriesData({ queryKey: ["ledgers"] }, (oldData) => {
        if (!oldData) {
          return [];
        }
        return oldData.filter((item) => item.id !== deletedId);
      });
      queryClient.refetchQueries({ queryKey: ["ledgers_paginated"] });
    },
  });
}
export default useDeleteLedger;
