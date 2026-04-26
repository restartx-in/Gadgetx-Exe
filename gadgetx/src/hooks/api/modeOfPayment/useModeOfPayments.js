import { useQuery } from '@tanstack/react-query'
import api from '@/utils/axios/api.js'
import { API_ENDPOINTS } from '@/config/api'

async function fetchModeOfPayments(filters) {
  const res = await api.get(API_ENDPOINTS.MODEOFPAYMENT.BASE, { params: filters })
  return res.data || []
}

export function useModeOfPayments(filters = {}) {
  return useQuery({
    queryKey: ['modeOfPayment', filters],
    queryFn: () => fetchModeOfPayments(filters),
    gcTime: Infinity,
    staleTime: Infinity,
  })
}
