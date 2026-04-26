import { useMutation, useQueryClient } from '@tanstack/react-query';
import { API_ENDPOINTS } from '@/config/api';
import api from '@/utils/axios/api.js';

export function useUpdateEmployeePosition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await api.put(API_ENDPOINTS.EMPLOYEE_POSITION.BY_ID(id), data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['employee_position'] });
      queryClient.refetchQueries({ queryKey: ['employees'] });
    },
  });
}

export default useUpdateEmployeePosition;