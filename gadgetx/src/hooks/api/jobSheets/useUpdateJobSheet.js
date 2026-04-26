import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/utils/axios/api.js'
import { API_ENDPOINTS } from '@/config/api'

export function useUpdateJobSheet() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, jobSheetData }) => {
      return api.put(API_ENDPOINTS.JOBSHEETS.BY_ID(id), jobSheetData)
    },
    // The 'variables' parameter contains what was passed to mutationFn, including the 'id'
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['jobsheets_paginated'] })
      queryClient.invalidateQueries({ queryKey: ['jobsheets'] })
      // ADDITION: Also invalidate the specific job sheet query to prevent stale data
      queryClient.invalidateQueries({ queryKey: ['jobsheet', variables.id] })
      queryClient.refetchQueries({ queryKey: ['accounts'] })
      queryClient.refetchQueries({ queryKey: ['cash_books_paginated'] })
    },
  })
}
export default useUpdateJobSheet
