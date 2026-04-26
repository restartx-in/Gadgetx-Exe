import { useQuery } from '@tanstack/react-query'
import api from '@/utils/axios/api.js'
import { API_ENDPOINTS } from '@/config/api'

async function fetchTenatnById(id) {
  if (!id) return null // Prevent fetching if no ID is provided
  const res = await api.get(API_ENDPOINTS.TANENT.BY_ID(id)) // Assumes API_ENDPOINTS.COST_CENTERS is configured
  return res.data
}

export default function useTenantById(id) {
  return useQuery({
    queryFn: () => fetchTenatnById(id),
    enabled: !!id, // Only run the query if 'id' is truthy
  })
}
