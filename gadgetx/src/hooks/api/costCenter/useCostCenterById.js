import { useQuery } from '@tanstack/react-query'
import api from '@/utils/axios/api.js'
import { API_ENDPOINTS } from '@/config/api'

async function fetchCostCenterById(id) {
  if (!id) return null // Prevent fetching if no ID is provided
  const res = await api.get(API_ENDPOINTS.COST_CENTERS.BY_ID(id)) // Assumes API_ENDPOINTS.COST_CENTERS is configured
  return res.data
}

export function useCostCenterById(id) {
  return useQuery({
    queryKey: ['cost_center', id], // Unique cache key for each cost center by ID
    queryFn: () => fetchCostCenterById(id),
    enabled: !!id, // Only run the query if 'id' is truthy
     gcTime: Infinity,
    staleTime: Infinity,
  })
}
export default useCostCenterById