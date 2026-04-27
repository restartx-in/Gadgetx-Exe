import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/utils/axios/api";
import { API_ENDPOINTS } from "@/config/api";

export function useDeletePrescription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      await api.delete(API_ENDPOINTS.PRESCRIPTIONS.BY_ID(id));
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prescriptions_paginated"] });
      queryClient.invalidateQueries({ queryKey: ["prescriptions"] });
    },
  });
}

export default useDeletePrescription;
