import { useMutation, useQueryClient } from '@tanstack/react-query'
import { API_ENDPOINTS } from '@/config/api'
import api from '@/utils/axios/api.js'

export function useCreateCostCenter() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (costCenterData) => {
      const res = await api.post(
        API_ENDPOINTS.COST_CENTERS.BASE, // Assumes API_ENDPOINTS.COST_CENTERS is configured
        costCenterData,
      )
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cost_centers'] })
      // You might want to invalidate other queries that depend on cost centers
    },
  })
}