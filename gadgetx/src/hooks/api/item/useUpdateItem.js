// src/hooks/items/useUpdateItem.js
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { API_ENDPOINTS } from '@/config/api'
import api from '@/utils/axios/api'

export function useUpdateItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await api.put(API_ENDPOINTS.ITEMS.BY_ID(id), data)
      return res.data
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['items'] })
      queryClient.refetchQueries({ queryKey: ['items_paginated'] })
    },
  })
}
export default useUpdateItem