import { useMutation, useQueryClient } from '@tanstack/react-query';
import { API_ENDPOINTS } from '@/config/api';
import api from '@/utils/axios/api.js';

export function useUpdateDoneBy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await api.put(API_ENDPOINTS.DONE_BYS.BY_ID(id), data); // Assumes API_ENDPOINTS.DONE_BYS is configured
      return res.data;
    },
    onSuccess: (updatedDoneBy) => {
      queryClient.invalidateQueries({ queryKey: ['done_bys'] });
      queryClient.invalidateQueries({ queryKey: ['done_by', updatedDoneBy.id] });
    },
  });
}

export default useUpdateDoneBy;