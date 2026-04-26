// --- START OF FILE useCreateSaleReturns.js ---

import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/utils/axios/api.js'
import { API_ENDPOINTS } from '@/config/api'
import { useSaleReturnInvoiceNextNo } from '@/hooks/api/saleReturnInvoiceNo/useSaleReturnInvoiceNextNo'

export function useCreateSaleReturn() {
  const queryClient = useQueryClient()
  const saleReturnInvoiceNextNoMutation = useSaleReturnInvoiceNextNo()

  return useMutation({
    mutationFn: async (saleReturnData) => {
      const response = await api.post(
        API_ENDPOINTS.SALE_RETURNS.BASE,
        saleReturnData
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saleReturns'] })
      queryClient.invalidateQueries({ queryKey: ['saleReturns_paginated'] })
      queryClient.invalidateQueries({ queryKey: ['cash_books_paginated'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.refetchQueries({ queryKey: ['items'] })
      queryClient.refetchQueries({ queryKey: ['items_paginated'] })
      queryClient.refetchQueries({ queryKey: ['vouchers'] })
      queryClient.refetchQueries({ queryKey: ['vouchers_paginated'] })
      queryClient.refetchQueries({ queryKey: ["cost_center_summary_report"] });
      saleReturnInvoiceNextNoMutation.mutate()
    },
  })
}
export default useCreateSaleReturn