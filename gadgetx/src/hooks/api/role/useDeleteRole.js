import { useMutation, useQueryClient } from '@tanstack/react-query';
import { API_ENDPOINTS } from '@/config/api';
import api from '@/utils/axios/api';

export function useDeleteRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const res = await api.delete(API_ENDPOINTS.ROLES.BY_ID(id));
      return res.data;
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['roles'] });
      queryClient.refetchQueries({ queryKey: ['roles_paginated'] });
    },
  });
}

export default useDeleteRole;