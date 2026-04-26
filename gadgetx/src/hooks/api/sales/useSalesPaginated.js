import { useQuery } from '@tanstack/react-query'
import api from '@/utils/axios/api.js'
import { API_ENDPOINTS } from '@/config/api'
import buildQueryParams from '@/utils/buildQueryParams.js'

// IMPROVEMENT: Renamed function for clarity
async function fetchPaginatedSales(filters) {
  const query = buildQueryParams(filters)
  const url = `${API_ENDPOINTS.SALES.PAGINATED}${query}`
  const res = await api.get(url)
  return res.data || []
}

export function useSalesPaginated(filters = {}) {
  return useQuery({
    queryKey: ['sales_paginated', filters],
    queryFn: () => fetchPaginatedSales(filters),
    gcTime: Infinity,
    staleTime: Infinity,
  })
}
export default useSalesPaginated