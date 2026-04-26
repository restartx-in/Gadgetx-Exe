import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/utils/axios/api'
import { API_ENDPOINTS } from '@/config/api'

export function useDeleteAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      const res = await api.delete(API_ENDPOINTS.ACCOUNTS.BY_ID(id))
      return res.data
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['cash_books_paginated'] })
      queryClient.refetchQueries({ queryKey: ['accounts'] })
    },
  })
}
export default useDeleteAccount