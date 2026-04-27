import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/utils/axios/api";
import { API_ENDPOINTS } from "@/config/api";

export function useDeleteFrame() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const res = await api.delete(API_ENDPOINTS.FRAME.BY_ID(id));
      return res.data;
    },
    onSuccess: () => {
      // Refetch to ensure the table pagination remains consistent after deletion
      queryClient.invalidateQueries({ queryKey: ["frames_paginated"] });
    },
  });
}
export default useDeleteFrame;