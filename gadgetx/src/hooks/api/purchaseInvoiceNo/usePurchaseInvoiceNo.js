import { useQuery } from '@tanstack/react-query'
import api from '@/utils/axios/api.js'
import { API_ENDPOINTS } from '@/config/api'

async function fetchInvoiceNumber() {
  const res = await api.get(
    `${API_ENDPOINTS.INVOICE_NUMBER.BASE}?type=purchase`
  )

  return res.data || []
}

export function usePurchaseInvoiceNo(enabled = false) {
  return useQuery({
    queryKey: ['purchase-invoice'],
    queryFn: () => fetchInvoiceNumber(),
    enabled,
  })
}
