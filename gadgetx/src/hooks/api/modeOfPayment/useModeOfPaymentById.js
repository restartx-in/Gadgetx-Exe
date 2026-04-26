import { useQuery } from '@tanstack/react-query'
import api from '@/utils/axios/api.js'
import { API_ENDPOINTS } from '@/config/api'

async function fetchModeOfPaymentById(id) {
  const res = await api.get(API_ENDPOINTS.MODEOFPAYMENT.BY_ID(id))
  return res.data
}

export function useModeOfPaymentById(id) {
  return useQuery({
    queryKey: ['modeOfPayment', id],
    queryFn: () => fetchModeOfPaymentById(id),
    enabled: !!id,
    gcTime: Infinity,
    staleTime: Infinity,
  })
}
