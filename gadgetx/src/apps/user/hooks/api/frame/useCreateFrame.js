import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/utils/axios/api";
import { API_ENDPOINTS } from "@/config/api";

export function useCreateFrame() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post(API_ENDPOINTS.FRAME.BASE, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["frames_paginated"] });
    },
  });
}