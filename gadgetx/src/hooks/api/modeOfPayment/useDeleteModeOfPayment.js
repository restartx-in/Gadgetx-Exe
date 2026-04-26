import { useMutation, useQueryClient } from '@tanstack/react-query'
import { API_ENDPOINTS } from '@/config/api'
import api from '@/utils/axios/api.js'

export function useDeleteModeOfPayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const res = await api.delete(API_ENDPOINTS.MODEOFPAYMENT.BY_ID(id))
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modeOfPayment'] })
    },
  })
}
