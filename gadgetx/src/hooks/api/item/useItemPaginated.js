// src/hooks/items/useItemsPaginated.js
import { useQuery } from '@tanstack/react-query'
import api from '@/utils/axios/api.js'
import { API_ENDPOINTS } from '@/config/api'
import buildQueryParams from '@/utils/buildQueryParams.js'

async function fetchItems(filters) {
  const query = buildQueryParams(filters)
  const url = `${API_ENDPOINTS.ITEMS.PAGINATED}${query}`
  const res = await api.get(url)
  return res.data || []
}

export function useItemsPaginated(filters = {}) {
  return useQuery({
    queryKey: ['items_paginated', filters],
    queryFn: () => fetchItems(filters),
    gcTime: Infinity,
    staleTime: Infinity,
  })
}

export default useItemsPaginated