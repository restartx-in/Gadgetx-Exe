// Filename: useSalesById.js

import { useQuery } from '@tanstack/react-query'
import { API_ENDPOINTS } from '@/config/api'
import api from '@/utils/axios/api.js'

async function fetchSaleById(id) {
  if (!id) return null
  const response = await api.get(API_ENDPOINTS.SALES.BY_ID(id))
  return response.data
}

export function useSalesById(id) {
  return useQuery({
    // BEFORE: ['sales', id]
    // AFTER:
    queryKey: ['sales', 'detail', id], // <-- FIX IS HERE
    queryFn: () => fetchSaleById(id),
    enabled: !!id,
  })
}

export default useSalesById