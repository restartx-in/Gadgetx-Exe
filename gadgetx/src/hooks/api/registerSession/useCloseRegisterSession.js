import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/utils/axios/api.js'
import { API_ENDPOINTS } from '@/config/api'

export function useCloseRegisterSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(API_ENDPOINTS.REGISTER_SESSIONS.CLOSE(id), data)
      return response.data
    },
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['register_sessions_paginated'] })
      queryClient.invalidateQueries({ queryKey: ['register_sessions', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['register_sessions', 'detail', id] })
      queryClient.invalidateQueries({ queryKey: ['register_sessions', 'current'] })
    },
  })
}
export default useCloseRegisterSession