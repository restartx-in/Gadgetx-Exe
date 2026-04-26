import { useQuery } from '@tanstack/react-query'
import api from '@/utils/axios/api.js'
import { API_ENDPOINTS } from '@/config/api'

async function fetchInvoiceNumber() {
  const res = await api.get(`${API_ENDPOINTS.INVOICE_NUMBER.BASE}?type=sale`) // Assumes API_ENDPOINTS.COST_CENTERS is configured
  return res.data || []
}

export function useSaleInvoiceNo(enabled = true) {
  return useQuery({
    queryKey: ['sale-invoice'],
    queryFn: () => fetchInvoiceNumber(),
    enabled,
  })
}
