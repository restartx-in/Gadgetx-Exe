import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/utils/axios/api";
import { API_ENDPOINTS } from "@/config/api";

export function useUpdatePrescription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, prescriptionData }) => {
      const res = await api.put(API_ENDPOINTS.PRESCRIPTIONS.BY_ID(id), prescriptionData);
      return res.data;
    },
    onSuccess: (response) => {
      const updatedItem = response.data;
      queryClient.invalidateQueries({ queryKey: ["prescription", updatedItem?.id] });
      queryClient.invalidateQueries({ queryKey: ["prescriptions_paginated"] });
    },
  });
}

export default useUpdatePrescription;
