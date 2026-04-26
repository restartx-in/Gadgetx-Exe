import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/utils/axios/api'
import { API_ENDPOINTS } from '@/config/api'

export function useCreateAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data) => {
      const res = await api.post(API_ENDPOINTS.ACCOUNTS.BASE, data)
      return res.data
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['accounts'] })
      queryClient.refetchQueries({ queryKey: ['cash_books_paginated'] })
    },
  })
}
export default useCreateAccount
