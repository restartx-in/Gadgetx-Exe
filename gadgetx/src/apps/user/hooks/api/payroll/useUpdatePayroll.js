// src/hooks/payroll/useUpdatePayroll.js

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/config/api";
import api from "@/utils/axios/api.js";

export function useUpdatePayroll() {
  const queryClient = useQueryClient();

  const updatePayroll = async ({ id, payrollData }) => {
    return api.put(API_ENDPOINTS.PAYROLL.BY_ID(id), payrollData);
  };

  const mutation = useMutation({
    mutationFn: updatePayroll,
    onSuccess: (updatedpaytoll) => {
      queryClient.invalidateQueries({
        queryKey: ["payroll", updatedpaytoll.id],
      });
      queryClient.setQueriesData({ queryKey: ["payroll"] }, (oldData) => {
        if (!oldData) {
          return oldData;
        }
        return oldData.map((item) =>
          item.id === updatedpaytoll.id ? updatedpaytoll : item,
        );
      });
      queryClient.refetchQueries({ queryKey: ["payroll_paginated"] });
      queryClient.refetchQueries({ queryKey: ["ledgers_paginated"] });
    },
  });

  return mutation;
}

export default useUpdatePayroll;
