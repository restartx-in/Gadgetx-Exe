// src/hooks/partners/useDeletePartner.js
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { API_ENDPOINTS } from '@/config/api'
import api from '@/utils/axios/api'

export function useDeletePartner() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const res = await api.delete(API_ENDPOINTS.PARTNERS.BY_ID(id))
      return res.data
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['partners'] })
      queryClient.refetchQueries({ queryKey: ['partners_paginated'] })
    },
  })
}
export default useDeletePartner
