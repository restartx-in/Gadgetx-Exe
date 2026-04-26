import { useMutation, useQueryClient } from '@tanstack/react-query'
import { API_ENDPOINTS } from '@/config/api'
import api from '@/utils/axios/api.js'

export function useCreateModeOfPayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (modeOfPaymentData) => {
      const res = await api.post(
        API_ENDPOINTS.MODEOFPAYMENT.BASE,
        modeOfPaymentData,
      )
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modeOfPayment'] })
    },
  })
}
