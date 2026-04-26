
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/utils/axios/api.js'
import { API_ENDPOINTS } from '@/config/api'

export function useCreateRegisterSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (sessionData) => {
      const response = await api.post(API_ENDPOINTS.REGISTER_SESSIONS.OPEN, sessionData)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['register_sessions_paginated'] })
      queryClient.invalidateQueries({ queryKey: ['register_sessions', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['register_sessions', 'current'] })
    },
  })
}
export default useCreateRegisterSession