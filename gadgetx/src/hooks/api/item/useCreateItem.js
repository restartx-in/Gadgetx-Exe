// src/hooks/items/useCreateItem.js
import { useMutation,useQueryClient } from '@tanstack/react-query'
import { API_ENDPOINTS } from '@/config/api'
import api from '@/utils/axios/api'

export function useCreateItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data) => {
      const res = await api.post(API_ENDPOINTS.ITEMS.BASE, data)
      return res.data
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['items'] })
      queryClient.refetchQueries({ queryKey: ['items_paginated'] })
    },
  })
}
export default useCreateItem