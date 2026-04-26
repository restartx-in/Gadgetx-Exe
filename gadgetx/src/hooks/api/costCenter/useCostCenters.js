import { useQuery } from '@tanstack/react-query'
import api from '@/utils/axios/api.js'
import { API_ENDPOINTS } from '@/config/api'

async function fetchCostCenters() {
  const res = await api.get(API_ENDPOINTS.COST_CENTERS.BASE) // Assumes API_ENDPOINTS.COST_CENTERS is configured
  return res.data || []
}

export function useCostCenters() {
  return useQuery({
    queryKey: ['cost_centers'],
    queryFn: () => fetchCostCenters(),
    gcTime: Infinity,
    staleTime: Infinity,
  })
}
export default useCostCenters