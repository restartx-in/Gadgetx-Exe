import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/utils/axios/api'
import { API_ENDPOINTS } from '@/config/api'

export function useUpdateAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }) => {
      if (!id) throw new Error('Account ID is required for update')
      if (!data || Object.keys(data).length === 0) {
        throw new Error('At least one field is required to update the account')
      }

      const res = await api.put(API_ENDPOINTS.ACCOUNTS.BY_ID(id), data)
      return res.data
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['cash_books_paginated'] })
      queryClient.refetchQueries({ queryKey: ['accounts'] })
    },
  })
}
export default useUpdateAccount
