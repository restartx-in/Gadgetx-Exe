import { useQuery } from '@tanstack/react-query'
import api from '@/utils/axios/api.js'
import { API_ENDPOINTS } from '@/config/api'

async function fetchBrandById(id) {
  if (!id) return null // Prevent fetching if no ID is provided
  const res = await api.get(API_ENDPOINTS.BRAND.BY_ID(id))
  return res.data
}

export function useBrandById(id) {
  return useQuery({
    queryKey: ['brand', id], // Unique cache key for each brand by ID
    queryFn: () => fetchBrandById(id),
    enabled: !!id, // Only run the query if 'id' is truthy
  })
}