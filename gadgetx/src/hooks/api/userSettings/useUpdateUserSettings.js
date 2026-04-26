import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/utils/axios/api'
import { API_ENDPOINTS } from '@/config/api'

export function useUpdateUserSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ settingsId, settingsData }) => {
      if (!settingsId) {
        throw new Error('Settings ID is required to update settings.')
      }
      const response = await api.put(
        API_ENDPOINTS.USER_SETTINGS.BY_ID(settingsId),
        settingsData,
      )
      return response.data
    },

    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['userSettings'] })
      queryClient.refetchQueries({ queryKey: ['userSettingsByUserId'] })
    },
  })
}
export default useUpdateUserSettings
