import { useMutation, useQueryClient } from '@tanstack/react-query';
import { API_ENDPOINTS } from '@/config/api';
import api from '@/utils/axios/api.js';

export function useUpdateUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await api.put(API_ENDPOINTS.UNITS.BY_ID(id), data);
      return res.data;
    },
    onSuccess: (updatedUnit) => {
      // Invalidate the main list and the specific unit query
      queryClient.invalidateQueries({ queryKey: ['units'] });
      queryClient.invalidateQueries({ queryKey: ['unit', updatedUnit.id] });
      // Invalidate item lists as unit names/symbols might have changed
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['items_paginated'] });
    },
  });
}