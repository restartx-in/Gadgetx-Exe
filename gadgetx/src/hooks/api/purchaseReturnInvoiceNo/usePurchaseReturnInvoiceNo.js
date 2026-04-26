import { useQuery } from '@tanstack/react-query'
import api from '@/utils/axios/api.js'
import { API_ENDPOINTS } from '@/config/api'

async function fetchInvoiceNumber() {
  const res = await api.get(
    `${API_ENDPOINTS.INVOICE_NUMBER.BASE}?type=purchase_return`
  ) // Assumes API_ENDPOINTS.COST_CENTERS is configured
  return res.data || []
}

export function usePurchaseReturnInvoiceNo(enabled = false) {
  return useQuery({
    queryKey: ['purchase-return-invoice'],
    queryFn: () => fetchInvoiceNumber(),
    enabled,
  })
}
