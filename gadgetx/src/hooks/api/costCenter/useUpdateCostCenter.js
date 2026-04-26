import { useMutation, useQueryClient } from '@tanstack/react-query';
import { API_ENDPOINTS } from '@/config/api';
import api from '@/utils/axios/api.js';

export function useUpdateCostCenter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await api.put(API_ENDPOINTS.COST_CENTERS.BY_ID(id), data); // Assumes API_ENDPOINTS.COST_CENTERS is configured
      return res.data;
    },
    onSuccess: (updatedCostCenter) => {
      queryClient.invalidateQueries({ queryKey: ['cost_centers'] });
      queryClient.invalidateQueries({ queryKey: ['cost_center', updatedCostCenter.id] });
    },
  });
}

export default useUpdateCostCenter;