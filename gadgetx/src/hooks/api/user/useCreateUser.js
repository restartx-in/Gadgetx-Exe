import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/utils/axios/api.js'
import { API_ENDPOINTS } from '@/config/api'

export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userData) => {
      const response = await api.post(API_ENDPOINTS.USERS.CREATE_BY_ADMIN(), userData)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export default useCreateUser
