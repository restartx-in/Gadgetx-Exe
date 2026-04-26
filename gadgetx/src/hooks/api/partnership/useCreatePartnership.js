// src/hooks/partners/useCreatePartner.js
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { API_ENDPOINTS } from '@/config/api'
import api from '@/utils/axios/api'

export function useCreatePartnership() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data) => {
      const res = await api.post(API_ENDPOINTS.PARTNERSHIPS.BASE, data)
      return res.data
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['partnership'] })
      queryClient.refetchQueries({ queryKey: ['partnership_paginated'] })
      queryClient.refetchQueries({ queryKey: ['cash_books_paginated'] })
      queryClient.refetchQueries({ queryKey: ['accounts'] })

    },
  })
}
export default useCreatePartnership
