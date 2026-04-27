import { useMutation, useQueryClient } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/config/api";
import api from "@/utils/axios/api.js";

export function useUpdateEmployeePosition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await api.put(
        API_ENDPOINTS.EMPLOYEE_POSITION.BY_ID(id),
        data
      );
      return res.data.data;
    },
    onSuccess: (updatedEmployeePosition) => {
      queryClient.refetchQueries({ queryKey: ["employee_position",updatedEmployeePosition.id] });
      queryClient.refetchQueries({ queryKey: ["employees"] });
      queryClient.refetchQueries({ queryKey: ["employee_position"] }, (oldData) => {
        if (!oldData) {
          return oldData;
        }
        return oldData.map((item) =>
          item.id === updatedEmployeePosition.id ? updatedEmployeePosition : item
        );
      });
      
    },
  });
}

export default useUpdateEmployeePosition;
