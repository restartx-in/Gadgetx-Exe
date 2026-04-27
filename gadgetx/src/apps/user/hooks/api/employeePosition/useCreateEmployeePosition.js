import { useMutation, useQueryClient } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/config/api";
import api from "@/utils/axios/api.js";

export function useCreateEmployeePosition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (employeePositionData) => {
      const res = await api.post(
        API_ENDPOINTS.EMPLOYEE_POSITION.BASE,
        employeePositionData
      );
      return res.data;
    },
    onSuccess: (response) => {
      queryClient.refetchQueries({ queryKey: ["employees"] });
      queryClient.refetchQueries({ queryKey: ["employee_position"] }, (oldData) => {
        if (!oldData) return oldData;
        return [...oldData, response.data];
      });
    },
  });
}
