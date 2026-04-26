// src/hooks/items/useItems.js
import { useQuery } from '@tanstack/react-query'
import api from '@/utils/axios/api.js'
import { API_ENDPOINTS } from '@/config/api'
import buildQueryParams from '@/utils/buildQueryParams.js'

async function fetchItems(filters = {}) {
  const query = buildQueryParams(filters)
  const res = await api.get(`${API_ENDPOINTS.ITEMS.BASE}${query}`)
  return res.data || []
}

export function useItem(filters = {}) {
  return useQuery({
    queryKey: ['items', filters],
    queryFn: () => fetchItems(filters),
    gcTime: Infinity,
    staleTime: Infinity,
  })
}

export default useItem