import { useMutation, useQueryClient } from '@tanstack/react-query'
import { API_ENDPOINTS } from '@/config/api'
import api from '@/utils/axios/api.js'

export function useDeleteUnit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const res = await api.delete(API_ENDPOINTS.UNITS.BY_ID(id))
      return res.data
    },
    onSuccess: () => {
      // Invalidate the list of units
      queryClient.invalidateQueries({ queryKey: ['units'] })
      // Invalidate items as a unit might have been removed from them
      queryClient.invalidateQueries({ queryKey: ['items'] })
      queryClient.invalidateQueries({ queryKey: ['items_paginated'] })
    },
  })
}