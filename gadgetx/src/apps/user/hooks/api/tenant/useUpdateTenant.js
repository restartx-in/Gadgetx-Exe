import { useMutation, useQueryClient } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/config/api";
import api from "@/utils/axios/api.js";

export function useUpdateTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await api.put(API_ENDPOINTS.TANENT.BY_ID(id), data); // Assumes API_ENDPOINTS.COST_CENTERS is configured
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.refetchQueries({ queryKey: ["tenant"] });
      queryClient.refetchQueries({ queryKey: ["users"] });
    },
  });
}

export default useUpdateTenant;
