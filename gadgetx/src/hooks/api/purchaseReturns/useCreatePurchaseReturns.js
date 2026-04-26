import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/utils/axios/api.js'
import { API_ENDPOINTS } from '@/config/api'
import { usePurchaseReturnInvoiceNextNo } from '@/hooks/api/purchaseReturnInvoiceNo/usePurchaseReturnInvoiceNextNo'
export function useCreatePurchaseReturn() {
  const queryClient = useQueryClient()
  const purchaseReturnInvoiceNextNoMutation = usePurchaseReturnInvoiceNextNo()

  return useMutation({
    mutationFn: async (purchaseReturnData) => {
      const response = await api.post(
        API_ENDPOINTS.PURCHASE_RETURNS.BASE,
        purchaseReturnData
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['purchaseReturns'] })
      queryClient.refetchQueries({ queryKey: ['purchaseReturns_paginated'] })
      queryClient.refetchQueries({ queryKey: ['cash_books_paginated'] })
      queryClient.refetchQueries({ queryKey: ['accounts'] })
      queryClient.refetchQueries({ queryKey: ['items'] })
      queryClient.refetchQueries({ queryKey: ['items_paginated'] })
      queryClient.refetchQueries({ queryKey: ['vouchers'] })
      queryClient.refetchQueries({ queryKey: ['vouchers_paginated'] })
      queryClient.refetchQueries({ queryKey: ["cost_center_summary_report"] });
      purchaseReturnInvoiceNextNoMutation.mutate()
    },
  })
}
export default useCreatePurchaseReturn
