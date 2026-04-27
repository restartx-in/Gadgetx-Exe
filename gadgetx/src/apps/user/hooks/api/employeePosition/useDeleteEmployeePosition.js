import { useMutation, useQueryClient } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/config/api";
import api from "@/utils/axios/api.js";

export function useDeleteEmployeePosition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const res = await api.delete(API_ENDPOINTS.EMPLOYEE_POSITION.BY_ID(id));
      return res.data;
    },
    onSuccess: (data, deletedId) => {
      // queryClient.refetchQueries({ queryKey: ["employee_position"] });
      queryClient.refetchQueries({ queryKey: ["employees"] });
      queryClient.refetchQueries({ queryKey: ["employee_paginated"] });
      queryClient.refetchQueries({ queryKey: ["employee_position"] }, (oldData) => {
        if (!oldData) {
          return [];
        }
        return oldData.filter((item) => item.id !== deletedId);
      });
    },
  });
}
