import { useQuery } from '@tanstack/react-query'
import api from '@/utils/axios/api.js'
import { API_ENDPOINTS } from '@/config/api'

async function fetchUnitById(id) {
  if (!id) return null // Prevent fetching if no ID is provided
  const res = await api.get(API_ENDPOINTS.UNITS.BY_ID(id))
  return res.data
}

export function useUnitById(id) {
  return useQuery({
    queryKey: ['unit', id], // Unique cache key for each unit by ID
    queryFn: () => fetchUnitById(id),
    enabled: !!id, // Only run the query if 'id' is truthy
  })
}