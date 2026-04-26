import { useMutation, useQueryClient } from '@tanstack/react-query'
import { API_ENDPOINTS } from '@/config/api'
import api from '@/utils/axios/api'

const createUserSettings = async (userData) => {
  return api.post(API_ENDPOINTS.USER_SETTINGS.BASE, userData)
}

export function useCreateUserSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createUserSettings,
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['userSettings'] })
      queryClient.refetchQueries({ queryKey: ['userSettingsByUserId'] })
    },
  })
}
export default useCreateUserSettings
