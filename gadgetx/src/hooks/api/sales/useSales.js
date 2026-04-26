// Filename: useSales.js

import { useQuery } from '@tanstack/react-query'
import api from '@/utils/axios/api.js'
import { API_ENDPOINTS } from '@/config/api'
import buildQueryParams from '@/utils/buildQueryParams.js'

async function fetchSales(filters = {}) {
  const query = buildQueryParams(filters)
  const res = await api.get(`${API_ENDPOINTS.SALES.BASE}${query}`)
  return res.data || []
}

export function useSales(filters = {}) {
  return useQuery({
    // BEFORE: ['sales', filters]
    // AFTER:
    queryKey: ['sales', 'list', filters], // <-- FIX IS HERE
    queryFn: () => fetchSales(filters),
    gcTime: Infinity,
    staleTime: Infinity,
  })
}

export default useSales