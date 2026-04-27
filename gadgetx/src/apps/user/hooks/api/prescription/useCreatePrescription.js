import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/utils/axios/api";
import { API_ENDPOINTS } from "@/config/api";

export function useCreatePrescription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const res = await api.post(API_ENDPOINTS.PRESCRIPTIONS.BASE, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prescriptions_paginated"] });
      queryClient.invalidateQueries({ queryKey: ["prescriptions"] });
    },
  });
}

export default useCreatePrescription;
