import { useMutation, useQueryClient } from '@tanstack/react-query'
import { API_ENDPOINTS } from '@/config/api'
import api from '@/utils/axios/api.js'

export function useCreateUnit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (unitData) => {
      const res = await api.post(API_ENDPOINTS.UNITS.BASE, unitData)
      return res.data
    },
    onSuccess: () => {
      // Invalidate the list of units to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ['units'] })
      // Since units are linked to items, it might be good to invalidate item lists too
      queryClient.invalidateQueries({ queryKey: ['items'] })
      queryClient.invalidateQueries({ queryKey: ['items_paginated'] })
    },
  })
}