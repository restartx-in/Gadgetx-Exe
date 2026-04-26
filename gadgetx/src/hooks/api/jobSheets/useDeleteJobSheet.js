import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/utils/axios/api.js'
import { API_ENDPOINTS } from '@/config/api'

export function useDeleteJobSheet() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => {
      return api.delete(API_ENDPOINTS.JOBSHEETS.BY_ID(id))
    },
    onSuccess: () => {
      // Invalidate both paginated and non-paginated queries
      queryClient.invalidateQueries({ queryKey: ['jobsheets_paginated'] })
      queryClient.invalidateQueries({ queryKey: ['jobsheets'] })
      queryClient.refetchQueries({ queryKey: ['accounts'] })
      queryClient.refetchQueries({ queryKey: ['cash_books_paginated'] })
    },
  })
}
export default useDeleteJobSheet
