import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/utils/axios/api.js'
import { API_ENDPOINTS } from '@/config/api'

export function useSaleInvoiceNextNo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (type = 'sale') => {
      return api.post(API_ENDPOINTS.INVOICE_NUMBER.NEXT, { type })
    },
    onSuccess: () => {
      // Invalidate all lists
      queryClient.refetchQueries({ queryKey: ['sale-invoice'] })
    },
  })
}
