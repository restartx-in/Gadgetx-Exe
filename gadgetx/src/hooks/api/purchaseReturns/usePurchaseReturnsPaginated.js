import { useQuery } from '@tanstack/react-query'
import api from '@/utils/axios/api.js'
import { API_ENDPOINTS } from '@/config/api'
import buildQueryParams from '@/utils/buildQueryParams.js'

async function fetchPurchaseReturnsPaginated(filters = {}) {
  const query = buildQueryParams(filters)
  const res = await api.get(`${API_ENDPOINTS.PURCHASE_RETURNS.PAGINATED}${query}`)
  return res.data || { data: [], count: 0, page_count: 1 }
}

export function usePurchaseReturnsPaginated(filters = {}) {
  return useQuery({
    queryKey: ['purchaseReturns_paginated', filters],
    queryFn: () => fetchPurchaseReturnsPaginated(filters),
    gcTime: Infinity,
    staleTime: Infinity,
  })
}

export default usePurchaseReturnsPaginated