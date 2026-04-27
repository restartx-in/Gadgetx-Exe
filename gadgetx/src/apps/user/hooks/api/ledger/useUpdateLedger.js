// src/hooks/api/ledger/useUpdateLedger.js
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/config/api";
import api from "@/utils/axios/api";

export function useUpdateLedger() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await api.put(API_ENDPOINTS.LEDGERS.BY_ID(id), data);
      return res.data;
    },
    onSuccess: (updatedLedger) => {
      queryClient.refetchQueries({ queryKey: ["ledger", updatedLedger.id] });

      queryClient.refetchQueries({ queryKey: ["ledgers_paginated"] });
      queryClient.setQueriesData({ queryKey: ["ledgers"] }, (oldData) => {
        if (!oldData) {
          return oldData;
        }
        return oldData.map((item) =>
          item.id === updatedLedger .id ? updatedLedger   : item
        );
      });
    },
  });
}
export default useUpdateLedger;
