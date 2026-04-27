import { useMutation, useQueryClient } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/config/api";
import api from "@/utils/axios/api.js";

export default function useCreateTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const res = await api.post(
        API_ENDPOINTS.TANENT.BASE, // Assumes API_ENDPOINTS.COST_CENTERS is configured
        data
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["tenant"] });
      queryClient.refetchQueries({ queryKey: ["users"] });
      // You might want to invalidate other queries that depend on cost centers
    },
  });
}
