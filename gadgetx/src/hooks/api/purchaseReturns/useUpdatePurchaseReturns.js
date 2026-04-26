import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/utils/axios/api.js'
import { API_ENDPOINTS } from '@/config/api'

export function useUpdatePurchaseReturn() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }) => {
      return api.put(API_ENDPOINTS.PURCHASE_RETURNS.BY_ID(id), data)
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

    },
  })
}
export default useUpdatePurchaseReturn