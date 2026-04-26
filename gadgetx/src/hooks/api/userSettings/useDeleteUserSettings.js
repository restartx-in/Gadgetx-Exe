import { useMutation, useQueryClient } from '@tanstack/react-query';
import { API_ENDPOINTS } from '@/config/api';
import api from '@/utils/axios/api.js';


const deleteUserSettings = async (userId) => {
  return api.delete(API_ENDPOINTS.USER_SETTINGS.BY_ID(userId));
};


export function useDeleteUserSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteUserSettings,
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['userSettings'] });
      queryClient.refetchQueries({ queryKey: ['userSettingsByUserId'] });

    },
  });
}
export default useDeleteUserSettings;