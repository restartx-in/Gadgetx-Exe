import { useMutation } from "@tanstack/react-query";
import api from "@/utils/axios/api";
import { API_ENDPOINTS } from "@/config/api";

export const useDeleteFrameVariant = () => {
  return useMutation({
    mutationFn: async (id) => {
      const response = await api.delete(`/frame-variants/${id}`);
      return response.data;
    },
  });
};