import { useMutation, useQueryClient } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/config/api";
import api from "@/utils/axios/api.js";

export function useDeletePayroll() {
  const queryClient = useQueryClient();

  const deletePayroll = async (id) => {
    return api.delete(API_ENDPOINTS.PAYROLL.BY_ID(id));
  };

  const mutation = useMutation({
    mutationFn: deletePayroll,
    onSuccess: (data, deletedId) => {
      queryClient.setQueriesData({ queryKey: ["payroll"] }, (oldData) => {
        if (!oldData) {
          return [];
        }
        return oldData.filter((item) => item.id !== deletedId);
      });
      queryClient.refetchQueries({ queryKey: ["payroll_paginated"] });
    },
  });

  return mutation;
}

export default useDeletePayroll;
