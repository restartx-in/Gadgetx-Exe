import { useMutation, useQueryClient } from '@tanstack/react-query'
import { API_ENDPOINTS } from '@/config/api'
import api from '@/utils/axios/api.js'

export function useUpdateModeOfPayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await api.put(API_ENDPOINTS.MODEOFPAYMENT.BY_ID(id), data)
      return res.data
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['modeOfPayment'] })
      queryClient.invalidateQueries({ queryKey: ['modeOfPayment', variables.id] })
    },
  })
}
