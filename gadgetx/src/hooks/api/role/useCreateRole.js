import { useMutation, useQueryClient } from '@tanstack/react-query';
import { API_ENDPOINTS } from '@/config/api';
import api from '@/utils/axios/api';

export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (roleData) => {
      const res = await api.post(API_ENDPOINTS.ROLES.BASE, roleData);
      return res.data;
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['roles'] });
      queryClient.refetchQueries({ queryKey: ['roles_paginated'] });
    },
  });
}

export default useCreateRole;