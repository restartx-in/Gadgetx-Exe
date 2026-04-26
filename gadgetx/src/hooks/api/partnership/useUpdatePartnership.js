import { useMutation, useQueryClient } from '@tanstack/react-query'
import { API_ENDPOINTS } from '@/config/api'
import api from '@/utils/axios/api'

export function useUpdatePartnership() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await api.put(API_ENDPOINTS.PARTNERSHIPS.BY_ID(id), data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partnership_paginated'] })
      queryClient.invalidateQueries({ queryKey: ['partnership'] })
      queryClient.invalidateQueries({ queryKey: ['cash_books_paginated'] })
      queryClient.refetchQueries({ queryKey: ['accounts'] })

    },
  })
}
export default useUpdatePartnership