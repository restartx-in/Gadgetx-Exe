import { useMutation, useQueryClient } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/config/api";
import api from "@/utils/axios/api.js";

export default function useDeleteTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const res = await api.delete(API_ENDPOINTS.TANENT.BY_ID(id)); // Assumes API_ENDPOINTS.COST_CENTERS is configured
      return res.data;
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["tenant"] });
      queryClient.refetchQueries({ queryKey: ["users"] });
    },
  });
}
