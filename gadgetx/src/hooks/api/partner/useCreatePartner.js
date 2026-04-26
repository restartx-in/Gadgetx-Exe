import { useMutation,useQueryClient } from '@tanstack/react-query'
import { API_ENDPOINTS } from '@/config/api'
import api from '@/utils/axios/api'

export function useCreatePartner() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data) => {
      const res = await api.post(API_ENDPOINTS.PARTNERS.BASE, data)
      return res.data
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['partners'] })
      queryClient.refetchQueries({ queryKey: ['partners_paginated'] })
    },
  })
}
export default useCreatePartner

