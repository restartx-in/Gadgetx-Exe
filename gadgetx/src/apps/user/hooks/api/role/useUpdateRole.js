import { useMutation, useQueryClient } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/config/api";
import api from "@/utils/axios/api";

export function useUpdateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await api.put(API_ENDPOINTS.ROLES.BY_ID(id), data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["roles"] });
      queryClient.refetchQueries({ queryKey: ["roles_paginated"] });
    },
  });
}

export default useUpdateRole;
