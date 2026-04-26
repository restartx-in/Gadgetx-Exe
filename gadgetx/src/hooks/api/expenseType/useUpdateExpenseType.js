import { useMutation, useQueryClient } from '@tanstack/react-query';
import { API_ENDPOINTS } from '@/config/api';
import api from '@/utils/axios/api.js';

export function useUpdateExpenseType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await api.put(API_ENDPOINTS.EXPENSE_TYPES.BY_ID(id), data);
      return res.data;
    },
    onSuccess: (updatedExpenseType) => {
      queryClient.invalidateQueries({ queryKey: ['expense_types'] });
      queryClient.invalidateQueries({ queryKey: ['expense_type', updatedExpenseType.id] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      // queryClient.invalidateQueries({ queryKey: ['expenses_paginated'] });
    },
  });
}

export default useUpdateExpenseType;