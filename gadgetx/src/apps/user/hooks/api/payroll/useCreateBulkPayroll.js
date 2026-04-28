import { useMutation, useQueryClient } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/config/api";
import api from "@/utils/axios/api.js";

const createBulkPayroll = async (bulkData) => {
  return api.post(API_ENDPOINTS.PAYROLL.BULK, bulkData);
};

export function useCreateBulkPayroll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBulkPayroll,
    onSuccess: (response) => {
      queryClient.setQueriesData({ queryKey: ["payrolls"] }, (oldData) => {
        if (!oldData) return oldData;
        return [...oldData, response.data];
      });
      queryClient.refetchQueries({ queryKey: ["payroll_paginated"] });
      queryClient.refetchQueries({ queryKey: ["ledgers_paginated"] });
    },
  });
}

export default useCreateBulkPayroll;
