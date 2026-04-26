import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/utils/axios/api'
import { API_ENDPOINTS } from '@/config/api'

export function useUpdatePrintSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload) => {
      const response = await api.put(API_ENDPOINTS.PRINT_SETTINGS, payload, {
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['print-settings'] })
    },
  })
}

export default useUpdatePrintSettings