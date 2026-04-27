import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/utils/axios/api";
import { API_ENDPOINTS } from "@/config/api";

export function useDeleteService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const res = await api.delete(`${API_ENDPOINTS.SERVICES.BASE}/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services_paginated"] });
      queryClient.refetchQueries({ queryKey: ["services_paginated"] });
    },
  });
}
export default useDeleteService;