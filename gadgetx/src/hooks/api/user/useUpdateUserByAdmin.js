import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/utils/axios/api.js';
import { API_ENDPOINTS } from '@/config/api';

export function useUpdateUserByAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, userData }) => {
      // userData will be { username, user_type }
      const response = await api.put(API_ENDPOINTS.USERS.BY_ID(userId), userData);
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate queries to refetch the user's data after update
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', variables.userId] });
    },
  });
}

export default useUpdateUserByAdmin;