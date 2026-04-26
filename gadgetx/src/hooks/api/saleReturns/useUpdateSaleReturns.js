import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/utils/axios/api.js'
import { API_ENDPOINTS } from '@/config/api'

export function useUpdateSaleReturn() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }) => {
      return api.put(API_ENDPOINTS.SALE_RETURNS.BY_ID(id), data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saleReturns'] })
      queryClient.invalidateQueries({ queryKey: ['saleReturns_paginated'] })
      queryClient.invalidateQueries({ queryKey: ['cash_books_pagated']})
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.refetchQueries({ queryKey: ['items'] })
      queryClient.refetchQueries({ queryKey: ['items_paginated'] })
      queryClient.refetchQueries({ queryKey: ['vouchers'] })
      queryClient.refetchQueries({ queryKey: ['vouchers_paginated'] })
      queryClient.refetchQueries({ queryKey: ["cost_center_summary_report"] });
    },
  })
}
export default useUpdateSaleReturn