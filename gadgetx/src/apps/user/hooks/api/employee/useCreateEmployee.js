import { useMutation, useQueryClient } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/config/api";
import api from "@/utils/axios/api.js";

const createEmployee = async (employeeData) => {
  return api.post(API_ENDPOINTS.EMPLOYEE.BASE, employeeData);
};

export function useCreateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createEmployee,
    
    onSuccess: (response) => {
      // queryClient.refetchQueries({ queryKey: ["employees"] });
      queryClient.refetchQueries({ queryKey: ["employees_paginated"] });
      queryClient.setQueriesData({ queryKey: ["employees"] }, (oldData) => {
        if (!oldData) return oldData;
        return [...oldData, response.data];
      });
    },
  });
}
export default useCreateEmployee;
