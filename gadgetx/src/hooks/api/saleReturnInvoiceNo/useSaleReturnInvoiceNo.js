// src/hooks/api/saleReturnInvoiceNo/useSaleReturnInvoiceNo.js (inferred from context)

import { useQuery } from '@tanstack/react-query'
import api from '@/utils/axios/api.js'
import { API_ENDPOINTS } from '@/config/api'

async function fetchInvoiceNumber() {
  const res = await api.get(
    `${API_ENDPOINTS.INVOICE_NUMBER.BASE}?type=sale-return`
  ) 
  return res.data || { invoice_number: null } // Return a structure to avoid undefined
}

export function useSaleReturnInvoiceNo(enabled = false) {
  return useQuery({
    queryKey: ['sale-return-invoice'],
    queryFn: () => fetchInvoiceNumber(),
    enabled,
    // Add a staleTime/cache setting if the number should be stable for the session
    staleTime: Infinity, 
    refetchOnWindowFocus: false,
  })
}
export default useSaleReturnInvoiceNo