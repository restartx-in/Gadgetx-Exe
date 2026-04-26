import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/utils/axios/api.js'
import { API_ENDPOINTS } from '@/config/api'

export function useJobSheetInvoiceNextNo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (type = 'jobsheet') => {
      return api.post(API_ENDPOINTS.INVOICE_NUMBER.NEXT, { type })
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['jobsheet-invoice'] })
    },
  })
}
