import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/utils/axios/api.js'
import { API_ENDPOINTS } from '@/config/api'

export function useDeleteCashBook() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      return api.delete(API_ENDPOINTS.CASH_BOOK.BY_ID(id))
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['cash_books'] })
      queryClient.refetchQueries({ queryKey: ['cash_books_paginated'] })
      queryClient.refetchQueries({ queryKey: ['accounts'] })
      queryClient.refetchQueries({ queryKey: ['party_summary_report'] })

    },
  })
}
export default useDeleteCashBook