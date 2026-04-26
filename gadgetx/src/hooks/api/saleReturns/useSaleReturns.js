import { useQuery } from '@tanstack/react-query'
import api from '@/utils/axios/api.js'
import { API_ENDPOINTS } from '@/config/api'
import buildQueryParams from '@/utils/buildQueryParams.js'

async function fetchSaleReturns(filters = {}) {
  const query = buildQueryParams(filters)
  const res = await api.get(`${API_ENDPOINTS.SALE_RETURNS.BASE}${query}`)
  return res.data || []
}

export function useSaleReturns(filters = {}) {
  return useQuery({
    queryKey: ['saleReturns', filters],
    queryFn: () => fetchSaleReturns(filters),
    gcTime: Infinity,
    staleTime: Infinity,
  })
}

export default useSaleReturns